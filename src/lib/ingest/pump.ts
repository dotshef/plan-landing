import { db } from '@/lib/db/server'
import { STOCK_DATASETS } from '@/lib/kis/datasets/stock'
import { MARKET_DATASETS } from '@/lib/kis/datasets/market'
import { MARKET_CODE, type DatasetResult } from '@/lib/kis/datasets/shared'
import { renewLock } from './lock'
import { ALL_MARKER, isMarketFresh, selectStaleStocks } from './cursor'

// 단일 Cron 펌프. 청크(150종목)를 순차 수집 → 멱등 upsert → ingest_state 갱신.
// KIS_INGESTION.md §3.
export const CHUNK_SIZE = 150
const TIME_BUDGET_MS = 700_000 // maxDuration=800s 대비 여유

interface BatchArgs {
  lockName: string
  owner: string
  lockTtlMs: number
}

// 데이터셋별 집계 (로그·응답용)
type Stats = Record<string, { ok: number; unavailable: number; error: number }>
function bump(stats: Stats, key: string, status: DatasetResult | 'error'): void {
  const s = (stats[key] ??= { ok: 0, unavailable: 0, error: 0 })
  s[status]++
}

async function recordState(
  code: string,
  dataset: string,
  status: DatasetResult | 'error',
  error?: string,
): Promise<void> {
  await db()
    .from('ingest_state')
    .upsert(
      { code, dataset, status, fetched_at: new Date().toISOString(), error: error ?? null },
      { onConflict: 'code,dataset' },
    )
}

async function processStock(code: string, stats: Stats): Promise<void> {
  // 이전에 'unavailable'로 찍힌 데이터셋은 재호출 억제(주권 전용 분기).
  const { data: states } = await db()
    .from('ingest_state')
    .select('dataset,status')
    .eq('code', code)
  const unavailable = new Set(
    (states ?? []).filter((s) => s.status === 'unavailable').map((s) => s.dataset),
  )

  for (const ds of STOCK_DATASETS) {
    if (unavailable.has(ds.key)) continue
    try {
      const result = await ds.run(code)
      await recordState(code, ds.key, result)
      bump(stats, ds.key, result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await recordState(code, ds.key, 'error', msg)
      bump(stats, ds.key, 'error')
      console.error(`[ingest] ${code}/${ds.key} error: ${msg}`)
    }
  }
  await recordState(code, ALL_MARKER, 'ok')
}

export async function runBatch({ lockName, owner, lockTtlMs }: BatchArgs) {
  const start = Date.now()
  const stats: Stats = {}

  // 시장 데이터셋은 야간 1회만(락 소유자가 담당).
  if (!(await isMarketFresh())) {
    for (const ds of MARKET_DATASETS) {
      try {
        const result = await ds.run()
        await recordState(MARKET_CODE, ds.key, result)
        bump(stats, ds.key, result)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        await recordState(MARKET_CODE, ds.key, 'error', msg)
        bump(stats, ds.key, 'error')
        console.error(`[ingest] _MARKET_/${ds.key} error: ${msg}`)
      }
      await renewLock(lockName, owner, lockTtlMs)
    }
  }

  const codes = await selectStaleStocks(CHUNK_SIZE)
  let processed = 0
  for (const code of codes) {
    if (Date.now() - start > TIME_BUDGET_MS) break
    await processStock(code, stats)
    processed++
    await renewLock(lockName, owner, lockTtlMs)
  }

  const elapsedMs = Date.now() - start
  const summary = { processed, selected: codes.length, elapsedMs, stats }
  // 데이터셋별 ok/unavailable/error 요약을 한 줄로 → Vercel Logs에서 확인
  const line = Object.entries(stats)
    .map(([k, v]) => `${k}:${v.ok}ok${v.unavailable ? `/${v.unavailable}una` : ''}${v.error ? `/${v.error}err` : ''}`)
    .join(' ')
  console.log(`[ingest] processed=${processed}/${codes.length} ${Math.round(elapsedMs / 1000)}s | ${line}`)

  return summary
}
