import { seededRng } from '../../_rng'
import { STOCK_QUOTE } from './index'

// ─── Candlestick ──────────────────────────────────────────────────────────────

export interface CandleData {
  time: string | number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const candleRand = seededRng(2345)

function genCandles(count: number, base: number, startDate: Date): CandleData[] {
  const result: CandleData[] = []
  let price = base
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const open = price
    const change = (candleRand() - 0.47) * price * 0.028
    const close = Math.round(open + change)
    const high = Math.round(Math.max(open, close) * (1 + candleRand() * 0.012))
    const low = Math.round(Math.min(open, close) * (1 - candleRand() * 0.012))
    result.push({
      time: d.toISOString().slice(0, 10),
      open: Math.round(open),
      high,
      low,
      close,
      volume: Math.floor(3_000_000 + candleRand() * 6_000_000),
    })
    price = close
  }
  return result
}

const threeYears  = genCandles(780, 110000, new Date('2021-06-01'))
const oneYear     = threeYears.slice(-250)
const threeMonths = threeYears.slice(-65)
const oneMonth    = threeYears.slice(-22)
const oneWeek     = threeYears.slice(-5)

function genIntraday(base: number): CandleData[] {
  const result: CandleData[] = []
  let price = base
  const startSec = Math.floor(new Date('2024-06-24T09:00:00Z').getTime() / 1000)
  for (let min = 0; min < 390; min += 5) {
    const open = price
    const change = (candleRand() - 0.48) * price * 0.004
    const close = Math.round(open + change)
    result.push({
      time: startSec + min * 60,
      open: Math.round(open),
      high: Math.round(Math.max(open, close) * 1.001),
      low: Math.round(Math.min(open, close) * 0.999),
      close,
      volume: Math.floor(200_000 + candleRand() * 500_000),
    })
    price = close
  }
  return result
}

export const CANDLESTICK_DATA: Record<string, CandleData[]> = {
  '1일':   genIntraday(190000),
  '1주':   oneWeek,
  '1개월': oneMonth,
  '3개월': threeMonths,
  '1년':   oneYear,
  '3년':   threeYears,
}

// ─── Supply & Demand ──────────────────────────────────────────────────────────

export interface DailySupplyDemand {
  date: string
  foreign: number
  institution: number
  individual: number
}

const supplyRand = seededRng(6789)

function genDate(daysAgo: number): string {
  const d = new Date('2024-06-24')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export const SUPPLY_DEMAND: DailySupplyDemand[] = Array.from({ length: 30 }, (_, i) => ({
  date:        genDate(29 - i),
  foreign:     Math.round((supplyRand() - 0.42) * 800_000),
  institution: Math.round((supplyRand() - 0.5)  * 400_000),
  individual:  Math.round((supplyRand() - 0.58) * 600_000),
}))

export const NET_BUY_DATE = '2024.06.24'

export const NET_BUY_SUMMARY = {
  foreign:      3_814_207,
  institution:    428_150,
  individual:  -4_242_357,
}

export const PROGRAM_TRADE = Array.from({ length: 30 }, (_, i) => ({
  date:         genDate(29 - i),
  arbitrage:    Math.round((supplyRand() - 0.5) * 150_000),
  nonArbitrage: Math.round((supplyRand() - 0.5) * 250_000),
}))

// ─── Technical Indicators ─────────────────────────────────────────────────────

export const TECHNICAL_INDICATORS = [
  {
    name: '이동평균선',
    value: '정배열',
    signal: '매수',
    signalUp: true as boolean | null,
    sub: '5 > 20 > 60 > 120',
    data: [155, 160, 165, 168, 172, 175, 178, 182, 185, 188, 190],
    isRise: true,
  },
  {
    name: 'RSI (14)',
    value: '62.18',
    signal: '중립',
    signalUp: null as boolean | null,
    sub: null as string | null,
    data: [55, 58, 60, 57, 63, 61, 65, 62, 64, 63, 62],
    isRise: true,
  },
  {
    name: 'MACD',
    value: '+3,412.80',
    signal: '매수',
    signalUp: true as boolean | null,
    sub: null as string | null,
    data: [800, 1200, 1800, 1500, 2200, 2700, 2500, 3100, 3300, 3400, 3413],
    isRise: true,
  },
  {
    name: 'Stochastic',
    value: '68.54',
    signal: '중립',
    signalUp: null as boolean | null,
    sub: null as string | null,
    data: [60, 65, 63, 70, 67, 72, 68, 74, 69, 67, 69],
    isRise: true,
  },
  {
    name: 'BB %b',
    value: '0.62',
    signal: '중립',
    signalUp: null as boolean | null,
    sub: null as string | null,
    data: [0.40, 0.48, 0.44, 0.55, 0.52, 0.60, 0.56, 0.62, 0.58, 0.61, 0.62],
    isRise: true,
  },
]

// ─── Shareholders ─────────────────────────────────────────────────────────────

export const SHAREHOLDERS = [
  { name: '외국인', value: STOCK_QUOTE.foreignOwnership, color: '#3182f6' },
  { name: '기관',   value: 24.36,                        color: '#8B95A1' },
  { name: '개인',   value: 22.18,                        color: '#E8342B' },
  { name: '기타',   value:  1.32,                        color: '#D1D6DB' },
]

export const SHAREHOLDERS_DATE = '2024.06.24'
