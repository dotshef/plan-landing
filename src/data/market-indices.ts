import { db } from '@/lib/db/server'

export interface MarketIndex {
  name: string
  value: number
  change: number
  changeRate: number
  isRise: boolean
  sparkline: number[]
}

const ORDER = ['0001', '1001', 'COMP', 'SPX'] // KOSPI, KOSDAQ, NASDAQ, S&P500

const n = (v: unknown): number => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

export async function getMarketIndices(): Promise<MarketIndex[]> {
  const { data } = await db().from('market_index').select('*')
  const bySymbol = new Map((data ?? []).map((r) => [r.symbol as string, r]))
  return ORDER.flatMap((sym) => {
    const r = bySymbol.get(sym)
    if (!r) return []
    return [{
      name: r.name as string,
      value: n(r.value),
      change: n(r.change),
      changeRate: n(r.change_rate),
      isRise: r.is_rise ?? n(r.change) >= 0,
      sparkline: Array.isArray(r.sparkline) ? (r.sparkline as number[]) : [],
    }]
  })
}
