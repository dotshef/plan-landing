import { seededRng } from './_rng'

const rand = seededRng(9012)

function genSparkline(base: number, count = 30): number[] {
  const arr: number[] = [base]
  for (let i = 1; i < count; i++) {
    arr.push(arr[i - 1] * (1 + (rand() - 0.48) * 0.018))
  }
  return arr
}

export const MARKET_INDICES = [
  {
    name: 'KOSPI',
    value: 2569.32,
    change: 12.45,
    changeRate: 0.49,
    isRise: true,
    sparkline: genSparkline(2500),
  },
  {
    name: 'KOSDAQ',
    value: 805.04,
    change: -3.21,
    changeRate: -0.40,
    isRise: false,
    sparkline: genSparkline(820),
  },
  {
    name: 'NASDAQ',
    value: 19752.02,
    change: 98.41,
    changeRate: 0.50,
    isRise: true,
    sparkline: genSparkline(19200),
  },
  {
    name: 'S&P500',
    value: 5278.00,
    change: -11.09,
    changeRate: -0.21,
    isRise: false,
    sparkline: genSparkline(5300),
  },
]
