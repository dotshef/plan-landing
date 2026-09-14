import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { requireAdmin } from '@/lib/admin/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 섹터 이름·주제 수정
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id: idRaw } = await ctx.params
  const id = Number(idRaw)
  if (!Number.isInteger(id)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  let body: { name?: unknown; theme?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const patch: Record<string, string> = {}
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim().slice(0, 50)
  if (typeof body.theme === 'string' && body.theme.trim()) patch.theme = body.theme.trim().slice(0, 100)
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '수정할 내용이 없습니다.' }, { status: 400 })
  }

  const { error } = await db().from('sector').update(patch).eq('id', id)
  if (error) {
    console.error('[sector/sectors] update failed:', error)
    return NextResponse.json({ error: '수정에 실패했습니다.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}

// 섹터 삭제 (종목 연결은 FK cascade)
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id: idRaw } = await ctx.params
  const id = Number(idRaw)
  if (!Number.isInteger(id)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  const { error } = await db().from('sector').delete().eq('id', id)
  if (error) {
    console.error('[sector/sectors] delete failed:', error)
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
