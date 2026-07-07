import { db } from '@/lib/db/server'
import { stockColor } from './stock-color'

export interface ReportCard {
  code: string
  name: string
  color: string
  hot: boolean
  summary: string
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

// 랜딩 인기 리포트 카드 (조회상위 → 보통주 상위 4).
export async function getReportCards(): Promise<ReportCard[]> {
  const rows = await fetchTopView(4)
  return rows.map((r) => ({
    code: r.code,
    name: r.stock?.name ?? r.code,
    color: stockColor(r.code),
    hot: r.rank === 1,
    summary: r.stock?.industry
      ? `${r.stock.industry} 업종 · 전문가 주가 전망 리포트를 무료로 확인하세요.`
      : '전문가 주가 전망 리포트를 무료로 확인하세요.',
  }))
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
