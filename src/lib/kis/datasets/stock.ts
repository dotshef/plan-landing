import { db } from '@/lib/db/server'
import { kisGet } from '../client'
import { num, toDate, toTimestamp, type DatasetResult, type StockDataset } from './shared'

// ── 날짜 유틸 ───────────────────────────────────────────────────────────────
function yyyymmdd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}
function recentRange(days: number): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
  return { from: yyyymmdd(from), to: yyyymmdd(to) }
}

// ── quote: 현재가 → fundamental + stock.industry ────────────────────────────
const quote: StockDataset = {
  key: 'quote',
  async run(code) {
    const res = await kisGet<Record<string, string>>(
      '/uapi/domestic-stock/v1/quotations/inquire-price',
      { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: code },
      'FHKST01010100',
    )
    const o = res.output
    if (!o) return 'unavailable'

    const now = new Date().toISOString()
    const { error: fErr } = await db()
      .from('fundamental')
      .upsert(
        {
          code,
          market_cap: num(o.hts_avls),
          per: num(o.per),
          pbr: num(o.pbr),
          eps: num(o.eps),
          bps: num(o.bps),
          week52_high: num(o.w52_hgpr),
          week52_low: num(o.w52_lwpr),
          foreign_ownership: num(o.hts_frgn_ehrt),
          as_of: now,
        },
        { onConflict: 'code' },
      )
    if (fErr) throw new Error(`fundamental upsert: ${fErr.message}`)

    // 같은 콜로 industry 편승 갱신(db-schema 매핑표)
    if (o.bstp_kor_isnm) {
      await db().from('stock').update({ industry: o.bstp_kor_isnm }).eq('code', code)
    }
    return 'ok'
  },
}

// ── daily: 일봉 OHLCV → price_daily (증분 ~30일) ─────────────────────────────
const daily: StockDataset = {
  key: 'daily',
  async run(code) {
    const { from, to } = recentRange(40)
    const res = await kisGet<unknown>(
      '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
      {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: code,
        FID_INPUT_DATE_1: from,
        FID_INPUT_DATE_2: to,
        FID_PERIOD_DIV_CODE: 'D',
        FID_ORG_ADJ_PRC: '0',
      },
      'FHKST03010100',
    )
    const list = (res.output2 ?? []) as Record<string, string>[]
    const rows = list
      .map((r) => ({
        code,
        date: toDate(r.stck_bsop_date),
        open: num(r.stck_oprc),
        high: num(r.stck_hgpr),
        low: num(r.stck_lwpr),
        close: num(r.stck_clpr),
        volume: num(r.acml_vol),
        trading_value: num(r.acml_tr_pbmn),
      }))
      .filter((r) => r.date)
    if (rows.length === 0) return 'unavailable'
    const { error } = await db().from('price_daily').upsert(rows, { onConflict: 'code,date' })
    if (error) throw new Error(`price_daily upsert: ${error.message}`)
    return 'ok'
  },
}

// ── investor: 투자자별 순매수 → investor_trend_daily ────────────────────────
const investor: StockDataset = {
  key: 'investor',
  async run(code) {
    const res = await kisGet<unknown>(
      '/uapi/domestic-stock/v1/quotations/inquire-investor',
      { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: code },
      'FHKST01010900',
    )
    const list = (res.output ?? []) as Record<string, string>[]
    const rows = list
      .map((r) => ({
        code,
        date: toDate(r.stck_bsop_date),
        individual_net: num(r.prsn_ntby_qty),
        foreign_net: num(r.frgn_ntby_qty),
        institution_net: num(r.orgn_ntby_qty),
        individual_net_amount: num(r.prsn_ntby_tr_pbmn),
        foreign_net_amount: num(r.frgn_ntby_tr_pbmn),
        institution_net_amount: num(r.orgn_ntby_tr_pbmn),
      }))
      .filter((r) => r.date)
    if (rows.length === 0) return 'unavailable'
    const { error } = await db()
      .from('investor_trend_daily')
      .upsert(rows, { onConflict: 'code,date' })
    if (error) throw new Error(`investor_trend_daily upsert: ${error.message}`)
    return 'ok'
  },
}

// ── news: 종목 뉴스 → news (중복은 unique 흡수) ──────────────────────────────
const news: StockDataset = {
  key: 'news',
  async run(code) {
    const res = await kisGet<unknown>(
      '/uapi/domestic-stock/v1/quotations/news-title',
      {
        FID_NEWS_OFER_ENTP_CODE: '',
        FID_COND_MRKT_CLS_CODE: '',
        FID_INPUT_ISCD: code,
        FID_TITL_CNTT: '',
        FID_INPUT_DATE_1: '',
        FID_INPUT_HOUR_1: '',
        FID_RANK_SORT_CLS_CODE: '',
        FID_INPUT_SRNO: '',
      },
      'FHKST01011800',
    )
    const list = (res.output ?? []) as Record<string, string>[]
    const rows = list
      .map((r) => ({
        code,
        title: r.hts_pbnt_titl_cntt ?? '',
        source: r.dorg || null,
        published_at: toTimestamp(r.data_dt, r.data_tm),
      }))
      .filter((r) => r.title)
    if (rows.length === 0) return 'ok'
    const { error } = await db()
      .from('news')
      .upsert(rows, { onConflict: 'code,published_at,title', ignoreDuplicates: true })
    if (error) throw new Error(`news upsert: ${error.message}`)
    return 'ok'
  },
}

// ── income: 손익계산서(연/분기) → income_statement ──────────────────────────
async function fetchIncome(code: string, div: '0' | '1', type: 'A' | 'Q') {
  const res = await kisGet<unknown>(
    '/uapi/domestic-stock/v1/finance/income-statement',
    { FID_DIV_CLS_CODE: div, fid_cond_mrkt_div_code: 'J', fid_input_iscd: code },
    'FHKST66430200',
  )
  const list = (res.output ?? []) as Record<string, string>[]
  return list
    .map((r) => ({
      code,
      period_type: type,
      period: String(r.stac_yymm ?? '').trim(),
      revenue: num(r.sale_account),
      operating_profit: num(r.bsop_prti),
      net_profit: num(r.thtr_ntin),
    }))
    .filter((r) => /^\d{6}$/.test(r.period))
}

const income: StockDataset = {
  key: 'income',
  async run(code) {
    const annual = await fetchIncome(code, '0', 'A')
    const quarter = await fetchIncome(code, '1', 'Q')
    const rows = [...annual, ...quarter]
    if (rows.length === 0) return 'unavailable'
    const { error } = await db()
      .from('income_statement')
      .upsert(rows, { onConflict: 'code,period_type,period' })
    if (error) throw new Error(`income_statement upsert: ${error.message}`)
    return 'ok'
  },
}

// ── ratio: 재무비율(연간) → financial_ratio ─────────────────────────────────
const ratio: StockDataset = {
  key: 'ratio',
  async run(code) {
    const res = await kisGet<unknown>(
      '/uapi/domestic-stock/v1/finance/balance-sheet',
      { FID_DIV_CLS_CODE: '0', fid_cond_mrkt_div_code: 'J', fid_input_iscd: code },
      'FHKST66430300',
    )
    const list = (res.output ?? []) as Record<string, string>[]
    const rows = list
      .map((r) => ({
        code,
        period: String(r.stac_yymm ?? '').trim(),
        roe: num(r.roe_val),
        eps: num(r.eps),
        bps: num(r.bps),
        debt_ratio: num(r.lblt_rate),
      }))
      .filter((r) => /^\d{6}$/.test(r.period))
    if (rows.length === 0) return 'unavailable'
    const { error } = await db().from('financial_ratio').upsert(rows, { onConflict: 'code,period' })
    if (error) throw new Error(`financial_ratio upsert: ${error.message}`)
    return 'ok'
  },
}

// ── dividend: 예탁원 배당 → dividend ────────────────────────────────────────
const dividend: StockDataset = {
  key: 'dividend',
  async run(code) {
    const { to } = recentRange(0)
    const from = `${new Date().getFullYear() - 3}0101`
    const res = await kisGet<unknown>(
      '/uapi/domestic-stock/v1/ksdinfo/dividend',
      { CTS: '', GB1: '0', F_DT: from, T_DT: to, SHT_CD: code, HIGH_GB: '' },
      'HHKDB669102C0',
    )
    const list = ((res.output1 ?? res.output) ?? []) as Record<string, string>[]
    const rows = list
      .map((r) => ({
        code,
        base_date: toDate(r.record_date),
        per_share: num(r.per_sto_divi_amt),
        pay_date: toDate(r.divi_pay_dt),
      }))
      .filter((r) => r.base_date && r.per_share != null)
    if (rows.length === 0) return 'ok'
    const { error } = await db().from('dividend').upsert(rows, { onConflict: 'code,base_date' })
    if (error) throw new Error(`dividend upsert: ${error.message}`)
    return 'ok'
  },
}

// ── program: 프로그램매매 일별 → program_trade_daily (전체 순매수만) ─────────
const program: StockDataset = {
  key: 'program',
  async run(code) {
    const { from, to } = recentRange(40)
    const res = await kisGet<unknown>(
      '/uapi/domestic-stock/v1/quotations/program-trade-by-stock-daily',
      { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: code, FID_INPUT_DATE_1: from, FID_INPUT_DATE_2: to },
      'FHPPG04650201',
    )
    const list = (res.output ?? []) as Record<string, string>[]
    const rows = list
      .map((r) => ({
        code,
        date: toDate(r.stck_bsop_date),
        net_qty: num(r.whol_smtn_ntby_qty),
        net_amount: num(r.whol_smtn_ntby_tr_pbmn),
      }))
      .filter((r) => r.date)
    if (rows.length === 0) return 'ok'
    const { error } = await db()
      .from('program_trade_daily')
      .upsert(rows, { onConflict: 'code,date' })
    if (error) throw new Error(`program_trade_daily upsert: ${error.message}`)
    return 'ok'
  },
}

// ── opinion / opinion_sec: 투자의견 → invest_opinion (PK로 중복 흡수) ────────
function mapOpinion(code: string, list: Record<string, string>[]) {
  return list
    .map((r) => ({
      code,
      opinion_date: toDate(r.stck_bsop_date),
      firm: String(r.mbcr_name ?? '').trim(),
      opinion: r.invt_opnn || null,
      target_price: num(r.hts_goal_prc),
      gap_rate: num(r.dprt),
    }))
    .filter((r) => r.opinion_date && r.firm)
}

const opinion: StockDataset = {
  key: 'opinion',
  async run(code) {
    const { from, to } = recentRange(400)
    const res = await kisGet<unknown>(
      '/uapi/domestic-stock/v1/quotations/invest-opinion',
      {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '16633',
        FID_INPUT_ISCD: code,
        FID_INPUT_DATE_1: from,
        FID_INPUT_DATE_2: to,
      },
      'FHKST663300C0',
    )
    const rows = mapOpinion(code, (res.output ?? []) as Record<string, string>[])
    if (rows.length === 0) return 'unavailable'
    const { error } = await db()
      .from('invest_opinion')
      .upsert(rows, { onConflict: 'code,opinion_date,firm' })
    if (error) throw new Error(`invest_opinion upsert: ${error.message}`)
    return 'ok'
  },
}

const opinionSec: StockDataset = {
  key: 'opinion_sec',
  async run(code) {
    const { from, to } = recentRange(400)
    const res = await kisGet<unknown>(
      '/uapi/domestic-stock/v1/quotations/invest-opbysec',
      {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '16634',
        FID_INPUT_ISCD: code,
        FID_DIV_CLS_CODE: '0',
        FID_INPUT_DATE_1: from,
        FID_INPUT_DATE_2: to,
      },
      'FHKST663400C0',
    )
    const rows = mapOpinion(code, (res.output ?? []) as Record<string, string>[])
    if (rows.length === 0) return 'unavailable'
    const { error } = await db()
      .from('invest_opinion')
      .upsert(rows, { onConflict: 'code,opinion_date,firm' })
    if (error) throw new Error(`invest_opinion(sec) upsert: ${error.message}`)
    return 'ok'
  },
}

// 주권 전용(재무·투자의견)은 응답 없으면 'unavailable' → cron이 재호출 억제.
export const STOCK_DATASETS: StockDataset[] = [
  quote,
  daily,
  investor,
  news,
  income,
  ratio,
  dividend,
  program,
  opinion,
  opinionSec,
]

export type { DatasetResult }
