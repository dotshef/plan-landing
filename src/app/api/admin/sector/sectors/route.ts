import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { requireAdmin } from '@/lib/admin/session'
import { loadLatestReport } from '@/lib/sector/report'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 섹터 추가 (이름·주제)
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  let body: { name?: unknown; theme?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 50) : ''
  const theme = typeof body.theme === 'string' ? body.theme.trim().slice(0, 100) : ''
  if (!name || !theme) {
    return NextResponse.json({ error: '섹터 이름과 주제를 입력해주세요.' }, { status: 400 })
  }

  const report = await loadLatestReport()
  if (!report) {
    return NextResponse.json({ error: '연도·분기를 먼저 저장해주세요.' }, { status: 400 })
  }

  const maxSort = report.sectors.reduce((a, s) => Math.max(a, s.sort_order), 0)
  const { error } = await db()
    .from('sector')
    .insert({ report_id: report.id, name, theme, sort_order: maxSort + 1 })
  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return NextResponse.json({ error: '같은 이름의 섹터가 이미 있습니다.' }, { status: 409 })
    }
    console.error('[sector/sectors] insert failed:', error)
    return NextResponse.json({ error: '섹터 추가에 실패했습니다.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
