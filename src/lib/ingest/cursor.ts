import { db } from '@/lib/db/server'
import { MARKET_CODE } from '@/lib/kis/datasets/shared'

// 재개 커서: 아직 이번 배치에서 수집 안 된 주권(ST) 종목을 고른다.
// 신선도 조건(no-op): 최근 12시간 내 '_all_' 완료 종목은 제외 → 야간 배치 재실행이 안전.
const ALL_MARKER = '_all_'
const FRESH_MS = 12 * 60 * 60 * 1000
// PostgREST/Supabase는 요청당 최대 1000행만 반환 → 전 유니버스(~2726)를 페이지네이션으로 읽는다.
// (이 페이징 없이는 앞 1000종목만 커서 후보가 되어 나머지가 영구 미수집됨)
const PAGE = 1000

function freshSince(): string {
  return new Date(Date.now() - FRESH_MS).toISOString()
}

export async function selectStaleStocks(limit: number): Promise<string[]> {
  const since = freshSince()

  // 오늘 완료(_all_)된 종목 집합 (페이지네이션)
  const freshSet = new Set<string>()
  for (let from = 0; ; from += PAGE) {
    const { data } = await db()
      .from('ingest_state')
      .select('code')
      .eq('dataset', ALL_MARKER)
      .gte('fetched_at', since)
      .order('code')
      .range(from, from + PAGE - 1)
    const rows = data ?? []
    for (const r of rows) freshSet.add(r.code)
    if (rows.length < PAGE) break
  }

  // 전 주권(ST) 코드를 페이지네이션으로 순회 → 미완료만 limit개 수집(조기 종료)
  const stale: string[] = []
  for (let from = 0; ; from += PAGE) {
    const { data } = await db()
      .from('stock')
      .select('code')
      .eq('group_code', 'ST')
      .order('code')
      .range(from, from + PAGE - 1)
    const rows = data ?? []
    for (const r of rows) {
      if (!freshSet.has(r.code)) {
        stale.push(r.code)
        if (stale.length >= limit) return stale
      }
    }
    if (rows.length < PAGE) break
  }
  return stale
}

// 특정 시장 데이터셋이 이번 배치에서 이미 성공(ok) 갱신됐는지.
// status='ok'만 신선으로 침 → 실패/unavailable이면 다음 실행이 자동 재시도(자가 치유).
export async function isMarketDatasetFresh(dataset: string): Promise<boolean> {
  const { data } = await db()
    .from('ingest_state')
    .select('fetched_at')
    .eq('code', MARKET_CODE)
    .eq('dataset', dataset)
    .eq('status', 'ok')
    .gte('fetched_at', freshSince())
    .maybeSingle()
  return !!data
}

export { ALL_MARKER }
