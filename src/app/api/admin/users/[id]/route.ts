import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { can, requireAdmin } from '@/lib/admin/session'
import { isAdminRole } from '@/lib/admin/roles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 역할 변경. 자기 자신은 바꿀 수 없다 - admin이 최소 1명은 남도록 보장하는 장치이기도 하다.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  if (!can(admin, 'users')) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { id: idRaw } = await ctx.params
  const id = Number(idRaw)
  const body = await req.json().catch(() => null)
  if (!Number.isInteger(id) || !body || !isAdminRole(body.role)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }
  if (id === admin.id) {
    return NextResponse.json({ error: '자기 자신의 역할은 변경할 수 없습니다.' }, { status: 400 })
  }

  const { data: updated, error } = await db()
    .from('user')
    .update({ role: body.role })
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) {
    console.error('[admin/users] role update failed:', error)
    return NextResponse.json({ error: '역할 변경에 실패했습니다.' }, { status: 502 })
  }
  if (!updated) return NextResponse.json({ error: '대상을 찾을 수 없습니다.' }, { status: 404 })

  return NextResponse.json({ ok: true })
}

// 관리자 삭제 - hard delete. 세션은 user_session FK cascade로 함께 제거된다.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  if (!can(admin, 'users')) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { id: idRaw } = await ctx.params
  const id = Number(idRaw)
  if (!Number.isInteger(id)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  if (id === admin.id) {
    return NextResponse.json({ error: '자기 자신은 삭제할 수 없습니다.' }, { status: 400 })
  }

  const { data: target } = await db()
    .from('user')
    .select('id')
    .eq('id', id)
    .maybeSingle()
  if (!target) return NextResponse.json({ error: '대상을 찾을 수 없습니다.' }, { status: 404 })

  const { error } = await db().from('user').delete().eq('id', id)
  if (error) {
    console.error('[admin/users] delete failed:', error)
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
