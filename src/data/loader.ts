import { db } from '@/lib/db/server'
import type {
  CandleData, StockChart, StockData, StockFinancials, StockQuote, StockReport,
} from './types'
import {
  buildTechnicalIndicators, changeFromCloses, dividendYield, opinionKo, payoutRatio,
} from './derive'

export type { StockData } from './types'

// Supabase numeric는 문자열로 올 수 있음 → 강제 숫자화.
const n = (v: unknown): number => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}
const won억 = (hts_avls: unknown): number => n(hts_avls) * 1e8 // 억원 → 원

function fmtDate(d?: string | null): string {
  if (!d) return ''
  return String(d).slice(0, 10).replace(/-/g, '.')
}
function fmtDateTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function quarterLabel(period: string): string {
  const yy = period.slice(2, 4)
  const q = { '03': '1', '06': '2', '09': '3', '12': '4' }[period.slice(4, 6)] ?? '?'
  return `${yy}.${q}Q`
}

const LEGAL_NOTICE =
  '본 리포트는 투자 권유 목적이 아닙니다. 수익을 보장하지 않으며, 투자 결정은 투자자 본인의 판단과 책임 하에 이루어져야 합니다. 과거 수익률이 미래 수익을 보장하지 않습니다.'

// ── 메인 ────────────────────────────────────────────────────────────────────
export async function getStockData(code: string): Promise<StockData> {
  const supabase = db()

  const [stockR, fundR, priceR, investorR, programR, ratioR, incomeR, divR, opinionR, newsR] =
    await Promise.all([
      supabase.from('stock').select('name, industry').eq('code', code).maybeSingle(),
      supabase.from('fundamental').select('*').eq('code', code).maybeSingle(),
      supabase.from('price_daily').select('*').eq('code', code).order('date', { ascending: false }).limit(800),
      supabase.from('investor_trend_daily').select('*').eq('code', code).order('date', { ascending: false }).limit(30),
      supabase.from('program_trade_daily').select('*').eq('code', code).order('date', { ascending: false }).limit(30),
      supabase.from('financial_ratio').select('*').eq('code', code).order('period', { ascending: false }),
      supabase.from('income_statement').select('*').eq('code', code),
      supabase.from('dividend').select('base_date, per_share').eq('code', code).order('base_date', { ascending: false }),
      supabase.from('invest_opinion').select('*').eq('code', code).order('opinion_date', { ascending: false }),
      supabase.from('news').select('*').eq('code', code).order('published_at', { ascending: false }).limit(5),
    ])

  const name = stockR.data?.name ?? code
  const industry = stockR.data?.industry ?? ''
  const fund = fundR.data ?? {}

  const priceAsc = (priceR.data ?? []).slice().reverse() // 시간순
  const closes = priceAsc.map((r) => n(r.close))
  const latest = priceAsc[priceAsc.length - 1]
  const currentPrice = latest ? n(latest.close) : 0
  const { change, changeRate } = changeFromCloses(closes)

  const dividends = (divR.data ?? []).map((d) => ({ base_date: String(d.base_date), per_share: n(d.per_share) }))
  const dYield = dividendYield(dividends, currentPrice)

  const ratios = ratioR.data ?? []
  const latestRatio = ratios[0] ?? {}

  // ── quote ──
  const quote: StockQuote = {
    code,
    name,
    currentPrice,
    change,
    changeRate,
    open: latest ? n(latest.open) : 0,
    high: latest ? n(latest.high) : 0,
    low: latest ? n(latest.low) : 0,
    volume: latest ? n(latest.volume) : 0,
    tradingValue: latest ? n(latest.trading_value) : 0,
    marketCap: won억(fund.market_cap),
    per: n(fund.per),
    pbr: n(fund.pbr),
    dividendYield: dYield,
    week52High: n(fund.week52_high),
    week52Low: n(fund.week52_low),
    foreignOwnership: n(fund.foreign_ownership),
    lastUpdated: fmtDateTime(fund.as_of) || fmtDate(latest?.date),
  }

  // ── chart ──
  const candles: CandleData[] = priceAsc.map((r) => ({
    time: String(r.date),
    open: n(r.open), high: n(r.high), low: n(r.low), close: n(r.close), volume: n(r.volume),
  }))
  const slice = (m: number) => candles.slice(-m)
  const investorAsc = (investorR.data ?? []).slice().reverse()
  const latestInv = investorAsc[investorAsc.length - 1]
  const programAsc = (programR.data ?? []).slice().reverse()

  const chart: StockChart = {
    CANDLESTICK_DATA: {
      '1일': slice(2),
      '1주': slice(5),
      '1개월': slice(22),
      '3개월': slice(65),
      '1년': slice(250),
      '3년': slice(750),
    },
    SUPPLY_DEMAND: investorAsc.map((r) => ({
      date: String(r.date),
      foreign: n(r.foreign_net),
      institution: n(r.institution_net),
      individual: n(r.individual_net),
    })),
    NET_BUY_DATE: fmtDate(latestInv?.date),
    NET_BUY_SUMMARY: {
      foreign: latestInv ? n(latestInv.foreign_net) : 0,
      institution: latestInv ? n(latestInv.institution_net) : 0,
      individual: latestInv ? n(latestInv.individual_net) : 0,
    },
    PROGRAM_TRADE: programAsc.map((r) => ({ date: String(r.date), netBuy: n(r.net_qty) })),
    TECHNICAL_INDICATORS: buildTechnicalIndicators(candles),
  }

  // ── financials ──
  const incomes = incomeR.data ?? []
  const ratioByYear = new Map(ratios.map((r) => [String(r.period).slice(0, 4), r]))
  const annual = incomes
    .filter((r) => r.period_type === 'A')
    .sort((a, b) => String(a.period).localeCompare(String(b.period)))
  const quarters = incomes
    .filter((r) => r.period_type === 'Q')
    .sort((a, b) => String(a.period).localeCompare(String(b.period)))

  const dividendHistory = (() => {
    const byYear = new Map<string, number>()
    for (const d of dividends) {
      const y = d.base_date.slice(0, 4)
      byYear.set(y, (byYear.get(y) ?? 0) + d.per_share)
    }
    return [...byYear.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([year, amount]) => ({ year, amount }))
  })()
  const latestYearDiv = dividendHistory[dividendHistory.length - 1]

  const fin: StockFinancials = {
    FINANCIAL_METRICS: {
      per: n(fund.per),
      pbr: n(fund.pbr),
      roe: n(latestRatio.roe),
      eps: n(latestRatio.eps),
      dividendYield: dYield,
    },
    ANNUAL_FINANCIALS: annual.slice(-4).map((r) => ({
      year: String(r.period).slice(0, 4),
      revenue: n(r.revenue),
      operatingProfit: n(r.operating_profit),
      netProfit: n(r.net_profit),
      eps: n(ratioByYear.get(String(r.period).slice(0, 4))?.eps),
    })),
    FINANCIAL_SUMMARY: buildFinancialSummary(annual, latestRatio),
    DIVIDEND_INFO: {
      yield: dYield,
      perShare: latestYearDiv?.amount ?? 0,
      payout: payoutRatio(latestYearDiv?.amount ?? 0, n(latestRatio.eps)),
      history: dividendHistory.slice(-5),
    },
    QUARTERLY_EARNINGS: quarters.slice(-8).map((r) => {
      const revenue = n(r.revenue), op = n(r.operating_profit)
      return { quarter: quarterLabel(String(r.period)), revenue, op, opMargin: revenue ? (op / revenue) * 100 : 0 }
    }),
  }

  // ── report ──
  const opinions = opinionR.data ?? []
  const topOpinion = opinions[0]
  const rep: StockReport = {
    REPORT_DETAIL: {
      code,
      name,
      opinion: opinionKo(topOpinion?.opinion),
      targetPrice: topOpinion ? n(topOpinion.target_price) : 0,
      fairValueLow: 0,
      fairValueHigh: 0,
      publishDate: fmtDate(topOpinion?.opinion_date),
      nextUpdateDate: '',
      analyst: topOpinion?.firm ? `${topOpinion.firm} 리서치` : 'K-Stock 리서치센터',
      summary: '',
      supplyDemandAnalysis: '',
      checkpoints: [],
      legalNotice: LEGAL_NOTICE,
    },
    DUMMY_NEWS: (newsR.data ?? []).map((r) => ({
      title: r.title,
      source: r.source ?? '',
      time: fmtDate(r.published_at),
    })),
    COMPANY_OVERVIEW: { description: '', ceo: '', founded: '', employees: '', industry },
  }

  return { quote, fin, rep, chart }
}

// 최신 연간 vs 직전 연간 비교로 재무 요약 items 구성.
function buildFinancialSummary(
  annual: Record<string, unknown>[],
  latestRatio: Record<string, unknown>,
): StockFinancials['FINANCIAL_SUMMARY'] {
  const sorted = annual.slice().sort((a, b) => String(a.period).localeCompare(String(b.period)))
  const cur = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]
  if (!cur) return { basis: '-', items: [] }

  const pct = (c: number, p: number) => (p ? ((c - p) / Math.abs(p)) * 100 : 0)
  const 억 = (v: unknown) => `${n(v).toLocaleString('ko-KR')}억`
  const sign = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

  const curRev = n(cur.revenue), curOp = n(cur.operating_profit), curNi = n(cur.net_profit)
  const curOpm = curRev ? (curOp / curRev) * 100 : 0
  const prevRev = n(prev?.revenue), prevOp = n(prev?.operating_profit), prevNi = n(prev?.net_profit)
  const prevOpm = prevRev ? (prevOp / prevRev) * 100 : 0

  return {
    basis: `${String(cur.period).slice(0, 4)} 기준`,
    items: [
      { k: '매출액', v: 억(curRev), change: sign(pct(curRev, prevRev)), up: curRev >= prevRev },
      { k: '영업이익', v: 억(curOp), change: sign(pct(curOp, prevOp)), up: curOp >= prevOp },
      { k: '당기순이익', v: 억(curNi), change: sign(pct(curNi, prevNi)), up: curNi >= prevNi },
      { k: '영업이익률', v: `${curOpm.toFixed(2)}%`, change: `${(curOpm - prevOpm >= 0 ? '+' : '')}${(curOpm - prevOpm).toFixed(2)}%p`, up: curOpm >= prevOpm },
      { k: 'ROE', v: `${n(latestRatio.roe).toFixed(2)}%`, change: '', up: n(latestRatio.roe) >= 0 },
    ],
  }
}
