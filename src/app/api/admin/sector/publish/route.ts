import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { requireAdmin, toKstTimestamp } from '@/lib/admin/session'
import { loadLatestReport } from '@/lib/sector/report'
import { validateSectors } from '@/lib/sector/validate'
import { computeSectorMetrics } from '@/lib/sector/compute'
import { prevQuarter } from '@/lib/sector/quarter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// 방문 사이트 반영 — 서버 재검증 → 지표 계산 → 스냅샷 저장 → 공개 전환.
// UI 비활성화와 별개로 여기서 다시 검증한다(요구사항: "계산이 불가하도록 서버에서 처리").
export async function POST() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const report = await loadLatestReport()
  if (!report) return NextResponse.json({ error: '보고서가 없습니다.' }, { status: 400 })
  if (report.sectors.length === 0) {
    return NextResponse.json({ error: '섹터를 먼저 등록해주세요.' }, { status: 400 })
  }
  if (report.kospi_avg_per == null) {
    return NextResponse.json({ error: '코스피 평균 PER을 먼저 입력해주세요.' }, { status: 400 })
  }

  // report.quarter는 발표 분기 — 검증·지표 계산은 직전 분기 기준
  const q = prevQuarter({ year: report.year, quarter: report.quarter })

  // 1) 서버 재검증
  let validation
  try {
    validation = await validateSectors(
      q,
      report.sectors.map((s) => ({ sectorId: s.id, name: s.name, stocks: s.stocks })),
    )
  } catch (e) {
    console.error('[sector/publish] validate failed:', e)
    return NextResponse.json({ error: '검증 중 오류가 발생했습니다.' }, { status: 502 })
  }
  if (!validation.deployable) {
    return NextResponse.json(
      { error: '데이터가 불완전하여 반영할 수 없습니다.', validation },
      { status: 409 },
    )
  }

  // 2) 섹터별 지표 계산 → 스냅샷 저장
  try {
    for (const sector of report.sectors) {
      const metrics = await computeSectorMetrics(sector.stocks.map((st) => st.code), q)
      const { error } = await db()
        .from('sector')
        .update({
          op_growth_rate: metrics.opGrowthRate,
          sector_per: metrics.sectorPer,
          trading_value_growth_rate: metrics.tradingValueGrowthRate,
          foreign_net_amount: metrics.foreignNetAmount,
          op_trend: metrics.opTrend,
        })
        .eq('id', sector.id)
      if (error) throw new Error(`sector snapshot update(${sector.id}): ${error.message}`)
    }
  } catch (e) {
    console.error('[sector/publish] compute failed:', e)
    return NextResponse.json({ error: '지표 계산에 실패했습니다.' }, { status: 502 })
  }

  // 3) 공개 전환
  const now = toKstTimestamp()
  const kstToday = now.slice(0, 10)
  const { error } = await db()
    .from('sector_report')
    .update({
      status: 'published',
      base_date: kstToday,
      computed_at: now,
      published_at: now,
    })
    .eq('id', report.id)
  if (error) {
    console.error('[sector/publish] publish failed:', error)
    return NextResponse.json({ error: '공개 전환에 실패했습니다.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, baseDate: kstToday })
}
