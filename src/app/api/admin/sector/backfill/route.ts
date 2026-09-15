import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { loadLatestReport } from '@/lib/sector/report'
import { backfillStocks } from '@/lib/sector/backfill'
import { prevQuarter } from '@/lib/sector/quarter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 30종목 × 6~7콜 ≈ 20초 + 여유

// 섹터 등록 종목 전체의 과거 분기 시세·수급·분기재무 백필. 멱등 — 반복 실행 무해.
export async function POST() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const report = await loadLatestReport()
  if (!report) return NextResponse.json({ error: '보고서가 없습니다. 연도·분기를 먼저 저장해주세요.' }, { status: 400 })

  const codes = [...new Set(report.sectors.flatMap((s) => s.stocks.map((st) => st.code)))]
  if (codes.length === 0) {
    return NextResponse.json({ error: '섹터에 등록된 종목이 없습니다.' }, { status: 400 })
  }

  try {
    // report.quarter는 발표 분기 — 백필은 직전 분기 기준
    const results = await backfillStocks(codes, prevQuarter({ year: report.year, quarter: report.quarter }))
    const failed = results.filter((r) => !r.ok)
    return NextResponse.json({
      ok: failed.length === 0,
      total: results.length,
      failed: failed.map((r) => ({ code: r.code, error: r.error })),
    })
  } catch (e) {
    console.error('[sector/backfill] failed:', e)
    return NextResponse.json({ error: '백필 중 오류가 발생했습니다.' }, { status: 502 })
  }
}
