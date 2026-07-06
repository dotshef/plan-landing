// 종목 데이터 공통 계약.
// 목데이터(src/data/stocks/*)와 향후 KIS API 응답 매핑이 모두 이 타입을 따른다.
// 필드 ↔ KIS API 대응은 KIS_API_CALL_LIST.md 참고.

export interface StockQuote {
  code: string
  name: string
  currentPrice: number
  change: number
  changeRate: number
  open: number
  high: number
  low: number
  volume: number
  tradingValue: number
  marketCap: number
  per: number
  pbr: number
  dividendYield: number
  week52High: number
  week52Low: number
  foreignOwnership: number
  beta1Y: number
  lastUpdated: string
}

// ─── chart ────────────────────────────────────────────────────────────────────

export interface CandleData {
  /** 일봉 이상은 'YYYY-MM-DD', 분봉은 Unix timestamp(초) */
  time: string | number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface DailySupplyDemand {
  date: string
  foreign: number
  institution: number
  individual: number
}

export interface ProgramTradeDay {
  date: string
  arbitrage: number
  nonArbitrage: number
}

export interface TechnicalIndicator {
  name: string
  value: string
  signal: string
  signalUp: boolean | null
  sub: string | null
  data: number[]
  isRise: boolean
}

export interface StockChart {
  CANDLESTICK_DATA: Record<string, CandleData[]>
  SUPPLY_DEMAND: DailySupplyDemand[]
  NET_BUY_DATE: string
  NET_BUY_SUMMARY: { foreign: number; institution: number; individual: number }
  PROGRAM_TRADE: ProgramTradeDay[]
  TECHNICAL_INDICATORS: TechnicalIndicator[]
}

// ─── financials ───────────────────────────────────────────────────────────────

export interface StockFinancials {
  FINANCIAL_METRICS: { per: number; pbr: number; roe: number; eps: number; dividendYield: number }
  ANNUAL_FINANCIALS: { year: string; revenue: number; operatingProfit: number; netProfit: number; eps: number }[]
  FINANCIAL_SUMMARY: { basis: string; items: { k: string; v: string; change: string; up: boolean }[] }
  DIVIDEND_INFO: { yield: number; perShare: number; payout: number; history: { year: string; amount: number }[] }
  QUARTERLY_EARNINGS: { quarter: string; revenue: number; op: number; opMargin: number }[]
}

// ─── report ───────────────────────────────────────────────────────────────────

export interface StockReport {
  REPORT_DETAIL: {
    code: string
    name: string
    opinion: string
    targetPrice: number
    fairValueLow: number
    fairValueHigh: number
    publishDate: string
    nextUpdateDate: string
    analyst: string
    summary: string
    supplyDemandAnalysis: string
    checkpoints: string[]
    legalNotice: string
  }
  DUMMY_NEWS: { title: string; source: string; time: string }[]
  COMPANY_OVERVIEW: { description: string; ceo: string; founded: string; employees: string; industry: string }
}

// ─── 종목 데이터 묶음 ─────────────────────────────────────────────────────────

export interface StockData {
  quote: StockQuote
  fin: StockFinancials
  rep: StockReport
  chart: StockChart
}
