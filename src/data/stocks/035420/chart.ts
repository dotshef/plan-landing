import { seededRng } from '../../_rng'
import type { CandleData, DailySupplyDemand, ProgramTradeDay, TechnicalIndicator } from '../../types'

// ─── Candlestick ──────────────────────────────────────────────────────────────

const candleRand = seededRng(3456)

function genCandles(count: number, base: number, startDate: Date): CandleData[] {
  const result: CandleData[] = []
  let price = base
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const open = price
    const change = (candleRand() - 0.51) * price * 0.022
    const close = Math.round(open + change)
    const high = Math.round(Math.max(open, close) * (1 + candleRand() * 0.010))
    const low = Math.round(Math.min(open, close) * (1 - candleRand() * 0.010))
    result.push({
      time: d.toISOString().slice(0, 10),
      open: Math.round(open),
      high,
      low,
      close,
      volume: Math.floor(600_000 + candleRand() * 1_200_000),
    })
    price = close
  }
  return result
}

const threeYears  = genCandles(780, 350000, new Date('2021-06-01'))
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
    const change = (candleRand() - 0.50) * price * 0.003
    const close = Math.round(open + change)
    result.push({
      time: startSec + min * 60,
      open: Math.round(open),
      high: Math.round(Math.max(open, close) * 1.001),
      low: Math.round(Math.min(open, close) * 0.999),
      close,
      volume: Math.floor(40_000 + candleRand() * 100_000),
    })
    price = close
  }
  return result
}

export const CANDLESTICK_DATA: Record<string, CandleData[]> = {
  '1일':   genIntraday(185000),
  '1주':   oneWeek,
  '1개월': oneMonth,
  '3개월': threeMonths,
  '1년':   oneYear,
  '3년':   threeYears,
}

// ─── Supply & Demand ──────────────────────────────────────────────────────────

const supplyRand = seededRng(7890)

function genDate(daysAgo: number): string {
  const d = new Date('2024-06-24')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export const SUPPLY_DEMAND: DailySupplyDemand[] = Array.from({ length: 30 }, (_, i) => ({
  date:        genDate(29 - i),
  foreign:     Math.round((supplyRand() - 0.43) * 300_000),
  institution: Math.round((supplyRand() - 0.5)  * 180_000),
  individual:  Math.round((supplyRand() - 0.57) * 240_000),
}))

export const NET_BUY_DATE = '2024.06.24'

export const NET_BUY_SUMMARY = {
  foreign:       618_420,
  institution:  -214_830,
  individual:   -403_590,
}

export const PROGRAM_TRADE: ProgramTradeDay[] = Array.from({ length: 30 }, (_, i) => ({
  date:         genDate(29 - i),
  arbitrage:    Math.round((supplyRand() - 0.5) * 60_000),
  nonArbitrage: Math.round((supplyRand() - 0.5) * 100_000),
}))

// ─── Technical Indicators ─────────────────────────────────────────────────────

export const TECHNICAL_INDICATORS: TechnicalIndicator[] = [
  {
    name: '이동평균선',
    value: '역배열',
    signal: '관망',
    signalUp: false,
    sub: '120 > 60 > 20 > 5',
    data: [220, 215, 210, 205, 200, 198, 195, 192, 190, 187, 185],
    isRise: false,
  },
  {
    name: 'RSI (14)',
    value: '44.72',
    signal: '중립',
    signalUp: null,
    sub: null,
    data: [52, 49, 46, 48, 44, 47, 43, 46, 44, 45, 45],
    isRise: false,
  },
  {
    name: 'MACD',
    value: '-1,248.30',
    signal: '매도',
    signalUp: false,
    sub: null,
    data: [-200, -400, -600, -500, -800, -900, -1000, -1100, -1150, -1200, -1248],
    isRise: false,
  },
  {
    name: 'Stochastic',
    value: '38.14',
    signal: '중립',
    signalUp: null,
    sub: null,
    data: [50, 45, 42, 48, 40, 44, 38, 42, 36, 39, 38],
    isRise: false,
  },
  {
    name: 'BB %b',
    value: '0.28',
    signal: '중립',
    signalUp: null,
    sub: null,
    data: [0.55, 0.48, 0.42, 0.50, 0.38, 0.44, 0.32, 0.36, 0.30, 0.29, 0.28],
    isRise: false,
  },
]
