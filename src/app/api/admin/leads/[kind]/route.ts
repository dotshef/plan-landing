import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { LEAD_KINDS, LEAD_PAGE_SIZE, listLeads, parseLeadQuery, type LeadKind } from '@/lib/admin/leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 신청(리드) 목록 - kind: main(메인 페이지) | income(두 번째 월급)
// query: page, q(이름·연락처), from·to(YYYY-MM-DD), source(google|naver|unknown)
export async function GET(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { kind } = await ctx.params
  if (!LEAD_KINDS.includes(kind as LeadKind)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  try {
    const { rows, total } = await listLeads(kind as LeadKind, parseLeadQuery(new URL(req.url).searchParams))
    return NextResponse.json({ leads: rows, total, pageSize: LEAD_PAGE_SIZE })
  } catch (e) {
    console.error('[admin/leads] list failed:', e)
    return NextResponse.json({ error: '목록을 불러오지 못했습니다.' }, { status: 502 })
  }
}
