import { seededRng } from '../../_rng'
import type { CandleData, DailySupplyDemand, ProgramTradeDay, TechnicalIndicator } from '../../types'

// ─── Candlestick ──────────────────────────────────────────────────────────────

const candleRand = seededRng(1234)

function genCandles(count: number, base: number, startDate: Date): CandleData[] {
  const result: CandleData[] = []
  let price = base
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const open = price
    const change = (candleRand() - 0.47) * price * 0.025
    const close = Math.round(open + change)
    const high = Math.round(Math.max(open, close) * (1 + candleRand() * 0.01))
    const low = Math.round(Math.min(open, close) * (1 - candleRand() * 0.01))
    result.push({
      time: d.toISOString().slice(0, 10),
      open: Math.round(open),
      high,
      low,
      close,
      volume: Math.floor(8_000_000 + candleRand() * 10_000_000),
    })
    price = close
  }
  return result
}

const threeYears  = genCandles(780, 55000, new Date('2021-06-01'))
const oneYear     = threeYears.slice(-250)
const threeMonths = threeYears.slice(-65)
const oneMonth    = threeYears.slice(-22)
const oneWeek     = threeYears.slice(-5)

function genIntraday(base: number): CandleData[] {
  const result: CandleData[] = []
  let price = base
  // lightweight-charts 분봉은 Unix timestamp(초) 요구
  const startSec = Math.floor(new Date('2024-06-24T09:00:00Z').getTime() / 1000)
  for (let min = 0; min < 390; min += 5) {
    const open = price
    const change = (candleRand() - 0.48) * price * 0.003
    const close = Math.round(open + change)
    result.push({
      time: startSec + min * 60,
      open: Math.round(open),
      high: Math.round(Math.max(open, close) * 1.001),
      low: Math.round(Math.min(open, close) * 0.999),
      close,
      volume: Math.floor(500_000 + candleRand() * 1_000_000),
    })
    price = close
  }
  return result
}

export const CANDLESTICK_DATA: Record<string, CandleData[]> = {
  '1일':   genIntraday(77800),
  '1주':   oneWeek,
  '1개월': oneMonth,
  '3개월': threeMonths,
  '1년':   oneYear,
  '3년':   threeYears,
}

// ─── Supply & Demand ──────────────────────────────────────────────────────────

const supplyRand = seededRng(5678)

function genDate(daysAgo: number): string {
  const d = new Date('2024-06-24')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export const SUPPLY_DEMAND: DailySupplyDemand[] = Array.from({ length: 30 }, (_, i) => ({
  date:        genDate(29 - i),
  foreign:     Math.round((supplyRand() - 0.45) * 1_500_000),
  institution: Math.round((supplyRand() - 0.5)  *   800_000),
  individual:  Math.round((supplyRand() - 0.55) * 1_200_000),
}))

export const NET_BUY_DATE = '2024.05.23'

export const NET_BUY_SUMMARY = {
  foreign:      1_246_817,
  institution:   -412_043,
  individual:    -834_774,
}

export const PROGRAM_TRADE: ProgramTradeDay[] = Array.from({ length: 30 }, (_, i) => ({
  date:   genDate(29 - i),
  netBuy: Math.round((supplyRand() - 0.5) * 800_000),
}))

// ─── Technical Indicators ─────────────────────────────────────────────────────

export const TECHNICAL_INDICATORS: TechnicalIndicator[] = [
  {
    name: '이동평균선',
    value: '정배열',
    signal: '매수',
    signalUp: true,
    sub: '5 > 20 > 60 > 120',
    data: [72, 73, 74, 74, 75, 76, 76, 77, 78, 78, 79],
    isRise: true,
  },
  {
    name: 'RSI (14)',
    value: '58.45',
    signal: '중립',
    signalUp: null,
    sub: null,
    data: [50, 53, 55, 52, 58, 56, 60, 57, 59, 58, 58],
    isRise: true,
  },
  {
    name: 'MACD',
    value: '+812.45',
    signal: '매수',
    signalUp: true,
    sub: null,
    data: [200, 300, 450, 380, 500, 620, 580, 700, 760, 800, 812],
    isRise: true,
  },
  {
    name: 'Stochastic',
    value: '62.31',
    signal: '중립',
    signalUp: null,
    sub: null,
    data: [55, 60, 58, 65, 62, 68, 64, 70, 65, 63, 62],
    isRise: true,
  },
  {
    name: 'BB %b',
    value: '0.46',
    signal: '중립',
    signalUp: null,
    sub: null,
    data: [0.30, 0.38, 0.35, 0.44, 0.42, 0.50, 0.45, 0.48, 0.44, 0.47, 0.46],
    isRise: false,
  },
]
