import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { requireAdmin } from '@/lib/admin/session'
import { loadLatestReport } from '@/lib/sector/report'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  try {
    const report = await loadLatestReport()
    return NextResponse.json({ report })
  } catch (e) {
    console.error('[sector/report] load failed:', e)
    return NextResponse.json({ error: '보고서를 불러오지 못했습니다.' }, { status: 502 })
  }
}

// 연도·분기·코스피 평균 PER 수정. 보고서가 없으면 생성.
export async function PATCH(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  let body: { year?: unknown; quarter?: unknown; kospiAvgPer?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const year = Number(body.year)
  const quarter = Number(body.quarter)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: '연도를 정수로 입력해주세요. (예: 2026)' }, { status: 400 })
  }
  if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
    return NextResponse.json({ error: '분기는 1~4 사이 정수여야 합니다.' }, { status: 400 })
  }
  const kospiAvgPer = body.kospiAvgPer === null || body.kospiAvgPer === '' || body.kospiAvgPer === undefined
    ? null
    : Number(body.kospiAvgPer)
  if (kospiAvgPer !== null && (!Number.isFinite(kospiAvgPer) || kospiAvgPer <= 0)) {
    return NextResponse.json({ error: '코스피 평균 PER은 0보다 큰 숫자여야 합니다.' }, { status: 400 })
  }

  try {
    const existing = await loadLatestReport()
    if (existing) {
      const { error } = await db()
        .from('sector_report')
        .update({ year, quarter, kospi_avg_per: kospiAvgPer })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await db()
        .from('sector_report')
        .insert({ year, quarter, kospi_avg_per: kospiAvgPer })
      if (error) throw error
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: '해당 연도·분기의 보고서가 이미 존재합니다.' }, { status: 409 })
    }
    console.error('[sector/report] save failed:', e)
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 502 })
  }
}
