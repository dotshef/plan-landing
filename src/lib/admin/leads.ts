import 'server-only'
import { db } from '@/lib/db/server'

// 관리자 신청(리드) 조회 - 메인(report_request 전체: main·trial·sector·indicators 폼)·두 번째 월급(income_request).
// 신청 시각(requested_at)은 KST 벽시계(timestamp)라 날짜 필터도 KST 문자열로 비교한다.

export type LeadKind = 'main' | 'income'
export const LEAD_KINDS: LeadKind[] = ['main', 'income']

export const LEAD_PAGE_SIZE = 50

export type LeadSourcePage = 'main' | 'trial' | 'indicators' | 'sector'

export interface LeadRow {
  id: number
  name: string
  phone: string
  stock: string | null // 메인 페이지 폼에만 있음(관심 종목)
  source_page: LeadSourcePage | null // 신청 폼 - report_request에만 있음(income은 null)
  traffic_source: 'google' | 'naver' | 'unknown'
  ad_keyword: string | null
  ad_campaign_id: string | null
  ad_campaign_label: string | null
  landing_url: string | null
  requested_at: string
}

const COMMON_COLUMNS = 'id, name, phone, traffic_source, ad_keyword, ad_campaign_id, ad_campaign_label, landing_url, requested_at'

export interface LeadQuery {
  page: number
  q: string // 이름 또는 연락처 일부
  from: string | null // YYYY-MM-DD (포함)
  to: string | null // YYYY-MM-DD (포함)
  source: LeadRow['traffic_source'] | null
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** URLSearchParams → 검증된 조회 조건. 형식이 틀린 값은 무시한다. */
export function parseLeadQuery(params: URLSearchParams): LeadQuery {
  const page = Number(params.get('page'))
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const source = params.get('source')
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    q: (params.get('q') ?? '').trim().slice(0, 50),
    from: DATE_RE.test(from) ? from : null,
    to: DATE_RE.test(to) ? to : null,
    source: source === 'google' || source === 'naver' || source === 'unknown' ? source : null,
  }
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export async function listLeads(kind: LeadKind, query: LeadQuery): Promise<{ rows: LeadRow[]; total: number }> {
  let q = kind === 'main'
    ? db().from('report_request').select(`${COMMON_COLUMNS}, stock, source_page`, { count: 'exact' })
    : db().from('income_request').select(COMMON_COLUMNS, { count: 'exact' })

  if (query.from) q = q.gte('requested_at', `${query.from} 00:00:00`)
  if (query.to) q = q.lt('requested_at', `${nextDay(query.to)} 00:00:00`)
  if (query.source) q = q.eq('traffic_source', query.source)

  if (query.q) {
    // PostgREST or() 문법을 깨는 문자는 제거한다. 연락처는 숫자만 저장되므로 숫자만 뽑아 비교.
    const term = query.q.replace(/[,()*%"\\]/g, '').trim()
    const digits = term.replace(/\D/g, '')
    const conds = term ? [`name.ilike."*${term}*"`] : []
    if (digits.length >= 3) conds.push(`phone.like.*${digits}*`)
    if (conds.length) q = q.or(conds.join(','))
  }

  const start = (query.page - 1) * LEAD_PAGE_SIZE
  const { data, count, error } = await q
    .order('requested_at', { ascending: false })
    .order('id', { ascending: false })
    .range(start, start + LEAD_PAGE_SIZE - 1)
  if (error) throw new Error(`${kind} leads select: ${error.message}`)

  const rows = ((data ?? []) as unknown as (Omit<LeadRow, 'stock' | 'source_page'> & Partial<Pick<LeadRow, 'stock' | 'source_page'>>)[])
    .map((r) => ({ ...r, stock: r.stock ?? null, source_page: r.source_page ?? null }))
  return { rows, total: count ?? 0 }
}
