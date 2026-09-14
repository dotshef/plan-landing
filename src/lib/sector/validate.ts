import 'server-only'
import { db } from '@/lib/db/server'
import { CALENDAR_CODE } from './backfill'
import {
  periodKey,
  prevQuarter,
  quarterLabel,
  quarterRange,
  soloFromCumulative,
  ttmFromCumulative,
  type QuarterRef,
} from './quarter'

// 반영 전 데이터 가용성 검증. UI 표시와 서버 재검증(publish) 양쪽에서 사용한다.
// error → 반영 차단(빨강), warn → 반영 허용(노랑, 업종 PER 평균 제외 안내 등).

export interface StockIssue {
  level: 'error' | 'warn'
  message: string
}

export interface StockCheck {
  code: string
  name: string
  issues: StockIssue[]
}

export interface SectorCheck {
  sectorId: number
  name: string
  stocks: StockCheck[]
}

export interface ValidationResult {
  deployable: boolean
  sectors: SectorCheck[]
  /** 보유 데이터 시작일(달력 종목 기준) — 계산 가능한 분기 판단용 */
  dataStart: { price: string | null; investor: string | null }
  /** 분기 거래일 수 (달력 기준) */
  calendarDays: { cur: number; prev: number }
}

interface SectorInput {
  sectorId: number
  name: string
  stocks: { code: string; name: string }[]
}

async function countRows(
  table: 'price_daily' | 'investor_trend_daily',
  code: string,
  from: string,
  to: string,
  requireAmount = false,
): Promise<number> {
  let query = db()
    .from(table)
    .select('date', { count: 'exact', head: true })
    .eq('code', code)
    .gte('date', from)
    .lte('date', to)
  if (requireAmount) query = query.not('foreign_net_amount', 'is', null)
  const { count, error } = await query
  if (error) throw new Error(`${table} count(${code}): ${error.message}`)
  return count ?? 0
}

async function minDate(table: 'price_daily' | 'investor_trend_daily', code: string): Promise<string | null> {
  const { data } = await db()
    .from(table)
    .select('date')
    .eq('code', code)
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle()
  return (data?.date as string | undefined) ?? null
}

/** period_type='Q' 누적값 맵 로드: code → (period → value) */
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

export async function validateSectors(q: QuarterRef, sectors: SectorInput[]): Promise<ValidationResult> {
  const qPrev = prevQuarter(q)
  const qPrev2 = prevQuarter(qPrev)
  const curLabel = quarterLabel(q)
  const prevLabel = quarterLabel(qPrev)

  const curRange = quarterRange(q)
  const prevRange = quarterRange(qPrev)
  // 진행 중 분기는 오늘까지를 구간으로 본다
  const today = new Date().toISOString().slice(0, 10)
  const curTo = curRange.to < today ? curRange.to : today

  const allCodes = [...new Set(sectors.flatMap((s) => s.stocks.map((st) => st.code)))]

  // 거래일 달력: 달력 종목(005930)의 해당 구간 일수
  const [calCur, calPrev, priceStart, investorStart] = await Promise.all([
    countRows('price_daily', CALENDAR_CODE, curRange.from, curTo),
    countRows('price_daily', CALENDAR_CODE, prevRange.from, prevRange.to),
    minDate('price_daily', CALENDAR_CODE),
    minDate('investor_trend_daily', CALENDAR_CODE),
  ])

  // 재무 누적값 (영업이익: 단독 분기 파생용 / EPS: TTM 파생용)
  const opPeriods = [periodKey(q), periodKey(qPrev), periodKey(qPrev2)]
  const epsPeriods = [
    periodKey(q),
    periodKey({ year: q.year - 1, quarter: 4 }),
    periodKey({ year: q.year - 1, quarter: q.quarter }),
  ]
  const [opMap, epsMap] = await Promise.all([
    loadCumulative('income_statement', 'operating_profit', allCodes, opPeriods),
    loadCumulative('financial_ratio', 'eps', allCodes, [...new Set(epsPeriods)]),
  ])

  const out: SectorCheck[] = []

  for (const sector of sectors) {
    const stockChecks: StockCheck[] = []

    for (const stock of sector.stocks) {
      const issues: StockIssue[] = []
      const cum = opMap.get(stock.code) ?? new Map<string, number | null>()

      // 1) 영업이익 존재 — 단독 분기값을 만들 수 있는가
      const opCur = soloFromCumulative(cum, q)
      const opPrev = soloFromCumulative(cum, qPrev)
      if (opCur == null) {
        if (cum.get(periodKey(q)) == null) {
          issues.push({ level: 'error', message: `${curLabel} 영업이익이 제공되지 않았습니다.` })
        } else {
          issues.push({ level: 'error', message: `${prevLabel} 영업이익이 제공되지 않았습니다.` })
        }
      }
      if (opPrev == null) {
        if (cum.get(periodKey(qPrev)) == null) {
          issues.push({ level: 'error', message: `${prevLabel} 영업이익이 제공되지 않았습니다.` })
        } else {
          issues.push({ level: 'error', message: `${quarterLabel(qPrev2)} 영업이익이 제공되지 않아 ${prevLabel} 단독 실적을 계산할 수 없습니다.` })
        }
      }
      if (opPrev === 0) {
        issues.push({ level: 'error', message: `${prevLabel} 영업이익이 0이라 증가율을 계산할 수 없습니다.` })
      }

      // 2) 거래대금·외국인 순매수 완전성 (달력 대비 일수)
      if (calCur === 0 || calPrev === 0) {
        issues.push({ level: 'error', message: '거래일 달력 데이터가 없습니다. 데이터 백필을 먼저 실행해주세요.' })
      } else {
        const [priceCur, pricePrev, invCur, invPrev] = await Promise.all([
          countRows('price_daily', stock.code, curRange.from, curTo),
          countRows('price_daily', stock.code, prevRange.from, prevRange.to),
          countRows('investor_trend_daily', stock.code, curRange.from, curTo, true),
          countRows('investor_trend_daily', stock.code, prevRange.from, prevRange.to, true),
        ])
        if (priceCur < calCur) issues.push({ level: 'error', message: `${curLabel} 거래대금 데이터가 불완전합니다 (${priceCur}/${calCur}일)` })
        if (pricePrev < calPrev) issues.push({ level: 'error', message: `${prevLabel} 거래대금 데이터가 불완전합니다 (${pricePrev}/${calPrev}일)` })
        if (invCur < calCur) issues.push({ level: 'error', message: `${curLabel} 외국인 순매수 데이터가 불완전합니다 (${invCur}/${calCur}일)` })
        if (invPrev < calPrev) issues.push({ level: 'error', message: `${prevLabel} 외국인 순매수 데이터가 불완전합니다 (${invPrev}/${calPrev}일)` })
      }

      // 3) TTM EPS (업종 PER) — 경고만, 반영은 차단하지 않음
      const eps = epsMap.get(stock.code) ?? new Map<string, number | null>()
      const ttmEps = ttmFromCumulative(eps, q)
      if (ttmEps == null) {
        issues.push({ level: 'warn', message: 'TTM EPS를 계산할 수 없어 업종 PER 평균에서 제외됩니다.' })
      } else if (ttmEps <= 0) {
        issues.push({ level: 'warn', message: 'TTM EPS가 0 이하(적자)라 업종 PER 평균에서 제외됩니다.' })
      }

      stockChecks.push({ code: stock.code, name: stock.name, issues })
    }

    out.push({ sectorId: sector.sectorId, name: sector.name, stocks: stockChecks })
  }

  const deployable =
    sectors.length > 0 &&
    sectors.every((s) => s.stocks.length > 0) &&
    out.every((s) => s.stocks.every((st) => st.issues.every((i) => i.level !== 'error')))

  return {
    deployable,
    sectors: out,
    dataStart: { price: priceStart, investor: investorStart },
    calendarDays: { cur: calCur, prev: calPrev },
  }
}
