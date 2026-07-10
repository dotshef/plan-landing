import { db } from '@/lib/db/server'
import { opinionKo } from './derive'
import { stockColor } from './stock-color'

export interface OpinionConsensus {
  total: number
  buyCount: number
  holdCount: number
  sellCount: number
}

export interface ReportCard {
  code: string
  name: string
  color: string
  hot: boolean
  consensus: OpinionConsensus | null
}

export interface PopularStock {
  code: string
  name: string
  market: string
  color: string
}

function marketLabel(m: unknown): string {
  return m === 'Q' ? 'KOSDAQ' : 'KOSPI'
}

interface TopViewRow {
  rank: number
  code: string
  stock: { name: string; market: string; industry: string | null } | null
}

async function fetchTopView(limit: number): Promise<TopViewRow[]> {
  const { data } = await db()
    .from('top_view')
    .select('rank, code, stock(name, market, industry)')
    .order('rank', { ascending: true })
    .limit(limit)
  // Supabase 임베드는 배열/객체로 올 수 있어 정규화
  return (data ?? []).map((r) => ({
    rank: r.rank as number,
    code: r.code as string,
    stock: (Array.isArray(r.stock) ? r.stock[0] : r.stock) ?? null,
  }))
}

// 여러 종목의 증권사 투자의견 컨센서스를 한 번에 집계 (증권사별 최신 1건 dedup).
async function fetchConsensusByCode(codes: string[]): Promise<Map<string, OpinionConsensus>> {
  const out = new Map<string, OpinionConsensus>()
  if (codes.length === 0) return out
  const { data } = await db()
    .from('invest_opinion')
    .select('code, firm, opinion, opinion_date')
    .in('code', codes)
    .order('opinion_date', { ascending: false })

  // code별 최신 의견 dedup 준비: opinion_date desc → 각 (code, firm) 첫 등장이 최신.
  const seen = new Map<string, Set<string>>()
  const counts = new Map<string, { buy: number; hold: number; sell: number }>()
  for (const o of data ?? []) {
    const code = String(o.code)
    const firm = String(o.firm ?? '').trim()
    if (!firm) continue
    let firms = seen.get(code)
    if (!firms) seen.set(code, (firms = new Set()))
    if (firms.has(firm)) continue
    firms.add(firm)
    let c = counts.get(code)
    if (!c) counts.set(code, (c = { buy: 0, hold: 0, sell: 0 }))
    const grade = opinionKo(o.opinion)
    if (grade === '매수') c.buy++
    else if (grade === '매도') c.sell++
    else c.hold++
  }
  for (const [code, c] of counts) {
    out.set(code, { total: c.buy + c.hold + c.sell, buyCount: c.buy, holdCount: c.hold, sellCount: c.sell })
  }
  return out
}

// 랜딩 인기 리포트 카드 (조회상위 → 보통주 상위 4).
export async function getReportCards(): Promise<ReportCard[]> {
  const rows = await fetchTopView(4)
  const consensus = await fetchConsensusByCode(rows.map((r) => r.code))
  return rows.map((r) => ({
    code: r.code,
    name: r.stock?.name ?? r.code,
    color: stockColor(r.code),
    hot: r.rank === 1,
    consensus: consensus.get(r.code) ?? null,
  }))
}

// metadata용: 종목명만 경량 조회 (없으면 null).
export async function getStockName(code: string): Promise<string | null> {
  const { data } = await db()
    .from('stock')
    .select('name')
    .eq('code', code)
    .maybeSingle()
  return data?.name ?? null
}

// 사이트맵용: 전체 종목 코드 목록 (보통주 위주, 상장 종목).
export async function getAllStockCodes(): Promise<string[]> {
  const { data } = await db()
    .from('stock')
    .select('code')
    .order('code', { ascending: true })
  return (data ?? []).map((r) => String(r.code))
}

// 검색/인기 종목 리스트 (조회상위 상위 N).
export async function getPopularStocks(limit = 8): Promise<PopularStock[]> {
  const rows = await fetchTopView(limit)
  return rows.map((r) => ({
    code: r.code,
    name: r.stock?.name ?? r.code,
    market: marketLabel(r.stock?.market),
    color: stockColor(r.code),
  }))
}
