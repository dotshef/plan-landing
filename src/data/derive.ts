// 파생값 계산 (db-schema.md §파생값). 저장하지 않고 읽기 시 계산.
// 순수 함수 모음 — DB 행 배열을 받아 UI 타입 조각을 만든다.
import type { CandleData, TechnicalIndicator } from './types'

// ── 기본 통계 ───────────────────────────────────────────────────────────────
function sma(values: number[], period: number): number[] {
  const out: number[] = []
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(NaN); continue }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += values[j]
    out.push(sum / period)
  }
  return out
}

function ema(values: number[], period: number): number[] {
  const out: number[] = []
  const k = 2 / (period + 1)
  let prev = values[0] ?? 0
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k)
    out.push(prev)
  }
  return out
}

export function rsi(closes: number[], period = 14): number[] {
  const out: number[] = [NaN]
  let gain = 0, loss = 0
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (i <= period) {
      gain += Math.max(diff, 0); loss += Math.max(-diff, 0)
      if (i === period) {
        const rs = loss === 0 ? 100 : gain / loss
        out.push(100 - 100 / (1 + rs))
      } else out.push(NaN)
    } else {
      const g = Math.max(diff, 0), l = Math.max(-diff, 0)
      gain = (gain * (period - 1) + g) / period
      loss = (loss * (period - 1) + l) / period
      const rs = loss === 0 ? 100 : gain / loss
      out.push(100 - 100 / (1 + rs))
    }
  }
  return out
}

function macd(closes: number[]): { macd: number[]; signal: number[] } {
  const e12 = ema(closes, 12)
  const e26 = ema(closes, 26)
  const line = closes.map((_, i) => e12[i] - e26[i])
  const signal = ema(line, 9)
  return { macd: line, signal }
}

function stochastic(candles: CandleData[], period = 14): number[] {
  const out: number[] = []
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { out.push(NaN); continue }
    let hi = -Infinity, lo = Infinity
    for (let j = i - period + 1; j <= i; j++) {
      hi = Math.max(hi, candles[j].high)
      lo = Math.min(lo, candles[j].low)
    }
    out.push(hi === lo ? 50 : ((candles[i].close - lo) / (hi - lo)) * 100)
  }
  return out
}

function bollingerPercentB(closes: number[], period = 20): number[] {
  const mid = sma(closes, period)
  const out: number[] = []
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { out.push(NaN); continue }
    let sq = 0
    for (let j = i - period + 1; j <= i; j++) sq += (closes[j] - mid[i]) ** 2
    const sd = Math.sqrt(sq / period)
    const upper = mid[i] + 2 * sd, lower = mid[i] - 2 * sd
    out.push(upper === lower ? 0.5 : (closes[i] - lower) / (upper - lower))
  }
  return out
}

const tail = (arr: number[], n = 11) => arr.filter((v) => !Number.isNaN(v)).slice(-n)
const last = (arr: number[]) => { const t = tail(arr, 1); return t.length ? t[0] : NaN }

// ── 기술적 지표 5종 (StockChart.TECHNICAL_INDICATORS) ────────────────────────
export function buildTechnicalIndicators(candles: CandleData[]): TechnicalIndicator[] {
  const closes = candles.map((c) => c.close)
  if (closes.length < 2) return []

  const ma5 = last(sma(closes, 5)), ma20 = last(sma(closes, 20))
  const ma60 = last(sma(closes, 60)), ma120 = last(sma(closes, 120))
  const aligned = ma5 >= ma20 && ma20 >= ma60 && ma60 >= ma120

  const rsiArr = rsi(closes)
  const rsiV = last(rsiArr)

  const { macd: macdArr, signal: sigArr } = macd(closes)
  const macdV = last(macdArr), sigV = last(sigArr)

  const stoArr = stochastic(candles)
  const stoV = last(stoArr)

  const bbArr = bollingerPercentB(closes)
  const bbV = last(bbArr)

  return [
    {
      name: '이동평균선',
      value: aligned ? '정배열' : '혼조',
      signal: aligned ? '매수' : '중립',
      signalUp: aligned ? true : null,
      sub: '5 > 20 > 60 > 120',
      data: tail(sma(closes, 5)),
      isRise: ma5 >= ma20,
    },
    {
      name: 'RSI (14)',
      value: Number.isNaN(rsiV) ? '-' : rsiV.toFixed(2),
      signal: rsiV >= 70 ? '과매수' : rsiV <= 30 ? '과매도' : '중립',
      signalUp: rsiV >= 70 ? false : rsiV <= 30 ? true : null,
      sub: null,
      data: tail(rsiArr),
      isRise: rsiV >= 50,
    },
    {
      name: 'MACD',
      value: Number.isNaN(macdV) ? '-' : (macdV >= 0 ? '+' : '') + macdV.toFixed(2),
      signal: macdV >= sigV ? '매수' : '매도',
      signalUp: macdV >= sigV,
      sub: null,
      data: tail(macdArr),
      isRise: macdV >= sigV,
    },
    {
      name: 'Stochastic',
      value: Number.isNaN(stoV) ? '-' : stoV.toFixed(2),
      signal: stoV >= 80 ? '과매수' : stoV <= 20 ? '과매도' : '중립',
      signalUp: stoV >= 80 ? false : stoV <= 20 ? true : null,
      sub: null,
      data: tail(stoArr),
      isRise: stoV >= 50,
    },
    {
      name: 'BB %b',
      value: Number.isNaN(bbV) ? '-' : bbV.toFixed(2),
      signal: bbV >= 1 ? '과매수' : bbV <= 0 ? '과매도' : '중립',
      signalUp: null,
      sub: null,
      data: tail(bbArr),
      isRise: bbV >= 0.5,
    },
  ]
}

// ── 밸류에이션·배당 파생 ─────────────────────────────────────────────────────
export function changeFromCloses(closes: number[]): { change: number; changeRate: number } {
  if (closes.length < 2) return { change: 0, changeRate: 0 }
  const cur = closes[closes.length - 1], prev = closes[closes.length - 2]
  const change = cur - prev
  return { change, changeRate: prev ? (change / prev) * 100 : 0 }
}

// 최근 1년 주당배당금 합 ÷ 현재가 × 100
export function dividendYield(
  dividends: { base_date: string; per_share: number }[],
  currentPrice: number,
): number {
  if (!currentPrice) return 0
  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000
  const sum = dividends
    .filter((d) => new Date(d.base_date).getTime() >= cutoff)
    .reduce((a, d) => a + (d.per_share ?? 0), 0)
  return (sum / currentPrice) * 100
}

// 배당성향: 연간 주당배당금 합 ÷ eps × 100
export function payoutRatio(annualPerShareSum: number, eps: number): number {
  return eps ? (annualPerShareSum / eps) * 100 : 0
}

// BUY/HOLD/SELL(영문) → 한글 투자의견
export function opinionKo(raw: string | null | undefined): string {
  const s = String(raw ?? '').toUpperCase()
  if (s.includes('BUY') || s.includes('매수') || s.includes('STRONG')) return '매수'
  if (s.includes('SELL') || s.includes('매도') || s.includes('REDUCE')) return '매도'
  if (s.includes('HOLD') || s.includes('중립') || s.includes('NEUTRAL')) return '중립'
  return raw || '중립'
}
