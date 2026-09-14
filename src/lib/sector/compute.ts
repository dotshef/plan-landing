import 'server-only'
import { db } from '@/lib/db/server'
import {
  lastNQuarters,
  periodKey,
  prevQuarter,
  quarterLabel,
  quarterRange,
  soloFromCumulative,
  ttmFromCumulative,
  type QuarterRef,
} from './quarter'

// 섹터 지표 계산 — "방문 사이트 반영" 시점에만 실행되어 sector 스냅샷에 저장된다.
// 모든 값은 종목 단위로 먼저 구한 뒤 섹터에서 집계한다(설계 §5.2).
//   영업이익 증가율(QoQ, 누적 차분) → 단순 산술평균
//   업종 PER(TTM: 분기말 종가 ÷ TTM EPS) → TTM EPS > 0 종목만 단순 산술평균
//   거래대금 증가율 → 단순 산술평균
//   외국인 순매수 금액 → 합산
//   op_trend: 최근 4개 분기 단독 영업이익의 종목 합산 시계열

export interface SectorMetrics {
  opGrowthRate: number | null
  sectorPer: number | null
  tradingValueGrowthRate: number | null
  foreignNetAmount: number
  opTrend: { label: string; value: number | null }[]
}

interface DailyRow {
  date: string
  close: number | null
  trading_value: number | null
}

async function loadDaily(code: string, from: string, to: string): Promise<DailyRow[]> {
  const { data, error } = await db()
    .from('price_daily')
    .select('date, close, trading_value')
    .eq('code', code)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })
    .limit(200)
  if (error) throw new Error(`price_daily select(${code}): ${error.message}`)
  return (data ?? []) as DailyRow[]
}

async function sumForeign(code: string, from: string, to: string): Promise<number> {
  const { data, error } = await db()
    .from('investor_trend_daily')
    .select('foreign_net_amount')
    .eq('code', code)
    .gte('date', from)
    .lte('date', to)
    .limit(200)
  if (error) throw new Error(`investor_trend_daily select(${code}): ${error.message}`)
  let sum = 0
  for (const r of data ?? []) sum += (r.foreign_net_amount as number | null) ?? 0
  return sum
}

async function loadCumulative(
  table: 'income_statement' | 'financial_ratio',
  valueColumn: 'operating_profit' | 'eps',
  codes: string[],
  periods: string[],
): Promise<Map<string, Map<string, number | null>>> {
  const out = new Map<string, Map<string, number | null>>()
  if (codes.length === 0) return out
  const { data, error } = await db()
    .from(table)
    .select(`code, period, ${valueColumn}`)
    .eq('period_type', 'Q')
    .in('code', codes)
    .in('period', periods)
  if (error) throw new Error(`${table} select: ${error.message}`)
  for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
    const code = row.code as string
    if (!out.has(code)) out.set(code, new Map())
    out.get(code)!.set(row.period as string, (row[valueColumn] as number | null) ?? null)
  }
  return out
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

export async function computeSectorMetrics(codes: string[], q: QuarterRef): Promise<SectorMetrics> {
  const qPrev = prevQuarter(q)
  const curRange = quarterRange(q)
  const prevRange = quarterRange(qPrev)
  const today = new Date().toISOString().slice(0, 10)
  const curTo = curRange.to < today ? curRange.to : today

  // op_trend용: 최근 4개 분기 + 차분에 필요한 직전 1개 = 5개 분기 누적값
  const trendQuarters = lastNQuarters(q, 4)
  const opPeriods = [...new Set(lastNQuarters(q, 5).map(periodKey))]
  const epsPeriods = [
    ...new Set([
      periodKey(q),
      periodKey({ year: q.year - 1, quarter: 4 }),
      periodKey({ year: q.year - 1, quarter: q.quarter }),
    ]),
  ]

  const [opMap, epsMap] = await Promise.all([
    loadCumulative('income_statement', 'operating_profit', codes, opPeriods),
    loadCumulative('financial_ratio', 'eps', codes, epsPeriods),
  ])

  const opGrowths: number[] = []
  const pers: number[] = []
  const tvGrowths: number[] = []
  let foreignTotal = 0
  const trendSums = new Map<string, { sum: number; has: boolean }>()

  for (const code of codes) {
    const cum = opMap.get(code) ?? new Map<string, number | null>()

    // 영업이익 증가율 (QoQ)
    const opCur = soloFromCumulative(cum, q)
    const opPrev = soloFromCumulative(cum, qPrev)
    if (opCur != null && opPrev != null && opPrev !== 0) {
      opGrowths.push(((opCur - opPrev) / Math.abs(opPrev)) * 100)
    }

    // op_trend: 분기별 단독 영업이익 (income_statement 단위: 백만원 계열 KIS 원값 그대로 합산)
    for (const tq of trendQuarters) {
      const solo = soloFromCumulative(cum, tq)
      const key = quarterLabel(tq)
      const acc = trendSums.get(key) ?? { sum: 0, has: false }
      if (solo != null) {
        acc.sum += solo
        acc.has = true
      }
      trendSums.set(key, acc)
    }

    // 시세 기반: 거래대금 합·분기말 종가
    const [curDaily, prevDaily] = await Promise.all([
      loadDaily(code, curRange.from, curTo),
      loadDaily(code, prevRange.from, prevRange.to),
    ])
    const tvCur = curDaily.reduce((a, r) => a + (r.trading_value ?? 0), 0)
    const tvPrev = prevDaily.reduce((a, r) => a + (r.trading_value ?? 0), 0)
    if (tvPrev > 0) tvGrowths.push(((tvCur - tvPrev) / tvPrev) * 100)

    // 업종 PER(TTM): 분기말(진행 중이면 최근) 종가 ÷ TTM EPS
    const eps = epsMap.get(code) ?? new Map<string, number | null>()
    const ttmEps = ttmFromCumulative(eps, q)
    const lastClose = [...curDaily].reverse().find((r) => r.close != null)?.close ?? null
    if (ttmEps != null && ttmEps > 0 && lastClose != null) {
      pers.push(lastClose / ttmEps)
    }

    // 외국인 순매수 금액 합산 (N분기)
    foreignTotal += await sumForeign(code, curRange.from, curTo)
  }

  return {
    opGrowthRate: mean(opGrowths),
    sectorPer: mean(pers),
    tradingValueGrowthRate: mean(tvGrowths),
    foreignNetAmount: foreignTotal,
    opTrend: trendQuarters.map((tq) => {
      const acc = trendSums.get(quarterLabel(tq))
      return { label: quarterLabel(tq), value: acc?.has ? acc.sum : null }
    }),
  }
}
