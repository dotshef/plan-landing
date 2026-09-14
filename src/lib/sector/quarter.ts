// 분기 ↔ 기간키·날짜 구간 변환. 12월 결산 법인 기준.
// income_statement / financial_ratio 의 period('YYYYMM')와 대응한다.

export interface QuarterRef {
  year: number
  quarter: number // 1~4
}

/** 직전 분기. 1분기면 전년 4분기. */
export function prevQuarter(q: QuarterRef): QuarterRef {
  return q.quarter === 1 ? { year: q.year - 1, quarter: 4 } : { year: q.year, quarter: q.quarter - 1 }
}

/** 재무 기간키 'YYYYMM' (03/06/09/12). */
export function periodKey(q: QuarterRef): string {
  return `${q.year}${String(q.quarter * 3).padStart(2, '0')}`
}

/** 표시 라벨 '3Q26'. */
export function quarterLabel(q: QuarterRef): string {
  return `${q.quarter}Q${String(q.year).slice(2)}`
}

/** 시세 구간 (date 컬럼용 ISO). */
export function quarterRange(q: QuarterRef): { from: string; to: string } {
  const startMonth = (q.quarter - 1) * 3 + 1
  const from = `${q.year}-${String(startMonth).padStart(2, '0')}-01`
  const endMonth = q.quarter * 3
  const lastDay = new Date(Date.UTC(q.year, endMonth, 0)).getUTCDate()
  const to = `${q.year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

/** q부터 과거로 n개 분기 (q 포함, 과거→현재 오름차순). */
export function lastNQuarters(q: QuarterRef, n: number): QuarterRef[] {
  const out: QuarterRef[] = []
  let cur = q
  for (let i = 0; i < n; i++) {
    out.unshift(cur)
    cur = prevQuarter(cur)
  }
  return out
}

/**
 * 단독 분기값 파생 — KIS 분기 재무는 YTD 누적.
 * 1분기는 누적 그대로, 그 외에는 누적(N) − 누적(직전분기).
 * 필요한 누적값이 없으면 null.
 */
export function soloFromCumulative(
  cumByPeriod: Map<string, number | null>,
  q: QuarterRef,
): number | null {
  const cur = cumByPeriod.get(periodKey(q))
  if (cur == null) return null
  if (q.quarter === 1) return cur
  const prev = cumByPeriod.get(periodKey(prevQuarter(q)))
  if (prev == null) return null
  return cur - prev
}

/**
 * TTM(최근 4개 분기 합) 파생 — 누적값만으로 계산.
 * TTM(N) = 누적(N) + 누적(전년 4분기) − 누적(전년 동분기).
 * 4분기는 누적(N) 자체가 연간이므로 동일 식이 그대로 성립한다.
 */
export function ttmFromCumulative(
  cumByPeriod: Map<string, number | null>,
  q: QuarterRef,
): number | null {
  const cur = cumByPeriod.get(periodKey(q))
  if (cur == null) return null
  if (q.quarter === 4) return cur
  const prevYearEnd = cumByPeriod.get(periodKey({ year: q.year - 1, quarter: 4 }))
  const prevYearSame = cumByPeriod.get(periodKey({ year: q.year - 1, quarter: q.quarter }))
  if (prevYearEnd == null || prevYearSame == null) return null
  return cur + prevYearEnd - prevYearSame
}
