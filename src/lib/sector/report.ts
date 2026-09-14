import 'server-only'
import { db } from '@/lib/db/server'

// sector_report 로딩 헬퍼 — 관리자 API·퍼블릭 페이지 공용.

export interface SectorStockRow {
  code: string
  name: string
}

export interface SectorRow {
  id: number
  name: string
  theme: string
  sort_order: number
  op_growth_rate: number | null
  sector_per: number | null
  trading_value_growth_rate: number | null
  foreign_net_amount: number | null
  op_trend: { label: string; value: number | null }[] | null
  stocks: SectorStockRow[]
}

export interface ReportRow {
  id: number
  year: number
  quarter: number
  kospi_avg_per: number | null
  status: 'draft' | 'published'
  base_date: string | null
  computed_at: string | null
  published_at: string | null
  sectors: SectorRow[]
}

interface RawSector {
  id: number
  name: string
  theme: string
  sort_order: number
  op_growth_rate: number | null
  sector_per: number | null
  trading_value_growth_rate: number | null
  foreign_net_amount: number | null
  op_trend: { label: string; value: number | null }[] | null
  sector_stock: { code: string; sort_order: number; stock: { name: string } | null }[]
}

const SELECT = `
  id, year, quarter, kospi_avg_per, status, base_date, computed_at, published_at,
  sector (
    id, name, theme, sort_order,
    op_growth_rate, sector_per, trading_value_growth_rate, foreign_net_amount, op_trend,
    sector_stock ( code, sort_order, stock ( name ) )
  )
`

function shape(raw: Record<string, unknown>): ReportRow {
  const sectors = ((raw.sector ?? []) as unknown as RawSector[])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map((s) => ({
      id: s.id,
      name: s.name,
      theme: s.theme,
      sort_order: s.sort_order,
      op_growth_rate: s.op_growth_rate,
      sector_per: s.sector_per,
      trading_value_growth_rate: s.trading_value_growth_rate,
      foreign_net_amount: s.foreign_net_amount,
      op_trend: s.op_trend,
      stocks: (s.sector_stock ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code))
        .map((st) => ({ code: st.code, name: st.stock?.name ?? st.code })),
    }))
  return { ...(raw as unknown as Omit<ReportRow, 'sectors'>), sectors }
}

/** 최신 보고서(상태 무관) — 관리자 편집 대상. */
export async function loadLatestReport(): Promise<ReportRow | null> {
  const { data, error } = await db()
    .from('sector_report')
    .select(SELECT)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`sector_report select: ${error.message}`)
  return data ? shape(data as Record<string, unknown>) : null
}

/** 최신 published 보고서 — 퍼블릭 /sector 렌더 대상. */
export async function loadPublishedReport(): Promise<ReportRow | null> {
  const { data, error } = await db()
    .from('sector_report')
    .select(SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`sector_report select: ${error.message}`)
  return data ? shape(data as Record<string, unknown>) : null
}
