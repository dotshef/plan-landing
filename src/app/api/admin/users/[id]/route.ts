import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { destroyAllSessions, requireAdmin, toKstTimestamp } from '@/lib/admin/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id: idRaw } = await ctx.params
  const id = Number(idRaw)
  if (!Number.isInteger(id)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  if (id === admin.id) {
    return NextResponse.json({ error: '자기 자신은 삭제할 수 없습니다.' }, { status: 400 })
  }

  const { data: target } = await db()
    .from('admin_user')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!target) return NextResponse.json({ error: '대상을 찾을 수 없습니다.' }, { status: 404 })

  const { error } = await db()
    .from('admin_user')
    .update({ deleted_at: toKstTimestamp() })
    .eq('id', id)
  if (error) {
    console.error('[admin/users] delete failed:', error)
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 502 })
  }

  await destroyAllSessions(id)
  return NextResponse.json({ ok: true })
}
