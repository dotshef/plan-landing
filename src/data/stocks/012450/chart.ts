import { seededRng } from '../../_rng'
import type { CandleData, DailySupplyDemand, ProgramTradeDay, TechnicalIndicator } from '../../types'

// ─── Candlestick ──────────────────────────────────────────────────────────────

const candleRand = seededRng(4567)

function genCandles(count: number, base: number, startDate: Date): CandleData[] {
  const result: CandleData[] = []
  let price = base
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const open = price
    const change = (candleRand() - 0.45) * price * 0.030
    const close = Math.round(open + change)
    const high = Math.round(Math.max(open, close) * (1 + candleRand() * 0.014))
    const low = Math.round(Math.min(open, close) * (1 - candleRand() * 0.014))
    result.push({
      time: d.toISOString().slice(0, 10),
      open: Math.round(open),
      high,
      low,
      close,
      volume: Math.floor(300_000 + candleRand() * 800_000),
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
  const startSec = Math.floor(new Date('2024-06-24T09:00:00Z').getTime() / 1000)
  for (let min = 0; min < 390; min += 5) {
    const open = price
    const change = (candleRand() - 0.47) * price * 0.004
    const close = Math.round(open + change)
    result.push({
      time: startSec + min * 60,
      open: Math.round(open),
      high: Math.round(Math.max(open, close) * 1.002),
      low: Math.round(Math.min(open, close) * 0.998),
      close,
      volume: Math.floor(20_000 + candleRand() * 60_000),
    })
    price = close
  }
  return result
}

export const CANDLESTICK_DATA: Record<string, CandleData[]> = {
  '1일':   genIntraday(370000),
  '1주':   oneWeek,
  '1개월': oneMonth,
  '3개월': threeMonths,
  '1년':   oneYear,
  '3년':   threeYears,
}

// ─── Supply & Demand ──────────────────────────────────────────────────────────

const supplyRand = seededRng(8901)

function genDate(daysAgo: number): string {
  const d = new Date('2024-06-24')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export const SUPPLY_DEMAND: DailySupplyDemand[] = Array.from({ length: 30 }, (_, i) => ({
  date:        genDate(29 - i),
  foreign:     Math.round((supplyRand() - 0.44) * 120_000),
  institution: Math.round((supplyRand() - 0.46) * 80_000),
  individual:  Math.round((supplyRand() - 0.60) * 100_000),
}))

export const NET_BUY_DATE = '2024.06.24'

export const NET_BUY_SUMMARY = {
  foreign:      186_340,
  institution:  142_810,
  individual:  -329_150,
}

export const PROGRAM_TRADE: ProgramTradeDay[] = Array.from({ length: 30 }, (_, i) => ({
  date:         genDate(29 - i),
  arbitrage:    Math.round((supplyRand() - 0.5) * 25_000),
  nonArbitrage: Math.round((supplyRand() - 0.5) * 40_000),
}))

// ─── Technical Indicators ─────────────────────────────────────────────────────

export const TECHNICAL_INDICATORS: TechnicalIndicator[] = [
  {
    name: '이동평균선',
    value: '정배열',
    signal: '매수',
    signalUp: true,
    sub: '5 > 20 > 60 > 120',
    data: [180, 200, 230, 250, 280, 310, 330, 350, 360, 368, 370],
    isRise: true,
  },
  {
    name: 'RSI (14)',
    value: '71.34',
    signal: '과매수',
    signalUp: true,
    sub: null,
    data: [58, 62, 65, 68, 70, 72, 71, 73, 72, 71, 71],
    isRise: true,
  },
  {
    name: 'MACD',
    value: '+8,214.60',
    signal: '매수',
    signalUp: true,
    sub: null,
    data: [1000, 2000, 3500, 3000, 4500, 5800, 5500, 7000, 7800, 8100, 8215],
    isRise: true,
  },
  {
    name: 'Stochastic',
    value: '78.92',
    signal: '과매수',
    signalUp: true,
    sub: null,
    data: [62, 68, 72, 75, 74, 78, 76, 80, 78, 79, 79],
    isRise: true,
  },
  {
    name: 'BB %b',
    value: '0.81',
    signal: '매도',
    signalUp: false,
    sub: null,
    data: [0.50, 0.58, 0.64, 0.70, 0.68, 0.74, 0.76, 0.80, 0.78, 0.80, 0.81],
    isRise: true,
  },
]
