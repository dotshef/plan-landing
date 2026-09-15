import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { loadLatestReport } from '@/lib/sector/report'
import { validateSectors } from '@/lib/sector/validate'
import { prevQuarter } from '@/lib/sector/quarter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const report = await loadLatestReport()
  if (!report) return NextResponse.json({ error: '보고서가 없습니다. 연도·분기를 먼저 저장해주세요.' }, { status: 400 })

  try {
    // report.quarter는 발표 분기 — 데이터 검증은 직전 분기 기준
    const result = await validateSectors(
      prevQuarter({ year: report.year, quarter: report.quarter }),
      report.sectors.map((s) => ({ sectorId: s.id, name: s.name, stocks: s.stocks })),
    )
    return NextResponse.json(result)
  } catch (e) {
    console.error('[sector/validate] failed:', e)
    return NextResponse.json({ error: '검증 중 오류가 발생했습니다.' }, { status: 502 })
  }
}
