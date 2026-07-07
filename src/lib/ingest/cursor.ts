import { db } from '@/lib/db/server'
import { MARKET_CODE } from '@/lib/kis/datasets/shared'

// 재개 커서: 아직 이번 배치에서 수집 안 된 주권(ST) 종목을 고른다.
// 신선도 조건(no-op): 최근 12시간 내 '_all_' 완료 종목은 제외 → 야간 배치 재실행이 안전.
const ALL_MARKER = '_all_'
const FRESH_MS = 12 * 60 * 60 * 1000

function freshSince(): string {
  return new Date(Date.now() - FRESH_MS).toISOString()
}

export async function selectStaleStocks(limit: number): Promise<string[]> {
  const { data: fresh } = await db()
    .from('ingest_state')
    .select('code')
    .eq('dataset', ALL_MARKER)
    .gte('fetched_at', freshSince())
  const freshSet = new Set((fresh ?? []).map((r) => r.code))

  const { data: st } = await db()
    .from('stock')
    .select('code')
    .eq('group_code', 'ST')
    .order('code')
  return (st ?? []).map((r) => r.code).filter((c) => !freshSet.has(c)).slice(0, limit)
}

// 시장 데이터셋(indices/top_view)이 이번 배치에서 이미 갱신됐는지.
export async function isMarketFresh(): Promise<boolean> {
  const { data } = await db()
    .from('ingest_state')
    .select('fetched_at')
    .eq('code', MARKET_CODE)
    .eq('dataset', 'indices')
    .gte('fetched_at', freshSince())
    .maybeSingle()
  return !!data
}

export { ALL_MARKER }
