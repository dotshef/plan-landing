import { db } from '@/lib/db/server'
import { kisGet } from '../client'
import { isRiseFromSign, num, type MarketDataset } from './shared'

function yyyymmdd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

interface IndexRow {
  symbol: string
  name: string
  value: number | null
  change: number | null
  change_rate: number | null
  is_rise: boolean | null
  sparkline: number[] | null
}

// ── 국내지수 (FHPUP02100000): KOSPI 0001 / KOSDAQ 1001 ──────────────────────
async function fetchDomestic(symbol: string, name: string): Promise<IndexRow> {
  const res = await kisGet<Record<string, string>>(
    '/uapi/domestic-stock/v1/quotations/inquire-index-price',
    { FID_COND_MRKT_DIV_CODE: 'U', FID_INPUT_ISCD: symbol },
    'FHPUP02100000',
  )
  const o = res.output ?? {}
  return {
    symbol,
    name,
    value: num(o.bstp_nmix_prpr),
    change: num(o.bstp_nmix_prdy_vrss),
    change_rate: num(o.bstp_nmix_prdy_ctrt),
    is_rise: isRiseFromSign(o.prdy_vrss_sign),
    sparkline: null, // 단일 콜에 일별 캔들 없음(표시용은 후속 보강)
  }
}

// ── 해외지수 (FHKST03030100): NASDAQ COMP / S&P500 SPX ──────────────────────
async function fetchOverseas(symbol: string, name: string): Promise<IndexRow> {
  const to = new Date()
  const from = new Date(to.getTime() - 40 * 24 * 60 * 60 * 1000)
  const res = await kisGet<Record<string, string>>(
    '/uapi/overseas-price/v1/quotations/inquire-daily-chartprice',
    {
      FID_COND_MRKT_DIV_CODE: 'N',
      FID_INPUT_ISCD: symbol,
      FID_INPUT_DATE_1: yyyymmdd(from),
      FID_INPUT_DATE_2: yyyymmdd(to),
      FID_PERIOD_DIV_CODE: 'D',
    },
    'FHKST03030100',
  )
  const o = res.output1 ?? {}
  const candles = (res.output2 ?? []) as Record<string, string>[]
  // output2는 최신순 → 시간순으로 뒤집어 종가 배열(sparkline)
  const sparkline = candles
    .map((c) => num(c.ovrs_nmix_prpr))
    .filter((n): n is number => n != null)
    .reverse()
  return {
    symbol,
    name,
    value: num(o.ovrs_nmix_prpr),
    change: num(o.ovrs_nmix_prdy_vrss),
    change_rate: num(o.prdy_ctrt),
    is_rise: isRiseFromSign(o.prdy_vrss_sign),
    sparkline: sparkline.length ? sparkline : null,
  }
}

const indices: MarketDataset = {
  key: 'indices',
  async run() {
    const rows: IndexRow[] = []
    rows.push(await fetchDomestic('0001', 'KOSPI'))
    rows.push(await fetchDomestic('1001', 'KOSDAQ'))
    rows.push(await fetchOverseas('COMP', 'NASDAQ'))
    rows.push(await fetchOverseas('SPX', 'S&P500'))

    const now = new Date().toISOString()
    const { error } = await db()
      .from('market_index')
      .upsert(
        rows.map((r) => ({ ...r, fetched_at: now })),
        { onConflict: 'symbol' },
      )
    if (error) throw new Error(`market_index upsert: ${error.message}`)
    return 'ok'
  },
}

// ── HTS 조회상위 (HHMCM000100C0) → 보통주 필터 후 원자 교체 ──────────────────
const topView: MarketDataset = {
  key: 'top_view',
  async run() {
    const res = await kisGet<unknown>(
      '/uapi/domestic-stock/v1/ranking/hts-top-view',
      {},
      'HHMCM000100C0',
      { custtype: 'P' },
    )
    // HHMCM000100C0는 배열을 output1로 반환(실측)
    const list = (res.output1 ?? res.output ?? []) as Record<string, string>[]
    const codes = list.map((r) => String(r.mksc_shrn_iscd ?? '').trim()).filter(Boolean)
    if (codes.length === 0) return 'unavailable'

    // 보통주(is_common)만 통과 — stock 테이블에서 판정
    const { data: commons } = await db()
      .from('stock')
      .select('code')
      .in('code', codes)
      .eq('is_common', true)
    const commonSet = new Set((commons ?? []).map((s) => s.code))

    const now = new Date().toISOString()
    const rows = codes
      .filter((c) => commonSet.has(c))
      .map((code, i) => ({ rank: i + 1, code, fetched_at: now }))
    if (rows.length === 0) return 'ok'

    // 원자 교체: 전체 삭제 후 재삽입(단일 워커 cron)
    const { error: delErr } = await db().from('top_view').delete().gte('rank', 0)
    if (delErr) throw new Error(`top_view delete: ${delErr.message}`)
    const { error: insErr } = await db().from('top_view').insert(rows)
    if (insErr) throw new Error(`top_view insert: ${insErr.message}`)
    return 'ok'
  },
}

export const MARKET_DATASETS: MarketDataset[] = [indices, topView]
