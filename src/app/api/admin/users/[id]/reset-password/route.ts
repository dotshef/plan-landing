import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { generateTempPassword, hashPassword } from '@/lib/admin/password'
import { destroyAllSessions, requireAdmin } from '@/lib/admin/session'
import { sendInviteMail } from '@/lib/admin/invite'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TEMP_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7일

// 임시 비밀번호 재발급 — 초대 흐름과 동일하되 기존 계정에 덮어쓴다.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id: idRaw } = await ctx.params
  const id = Number(idRaw)
  if (!Number.isInteger(id)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  const { data: target } = await db()
    .from('admin_user')
    .select('id, email')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!target) return NextResponse.json({ error: '대상을 찾을 수 없습니다.' }, { status: 404 })

  const tempPassword = generateTempPassword()
  const { error } = await db()
    .from('admin_user')
    .update({
      password_hash: await hashPassword(tempPassword),
      must_change_password: true,
      temp_password_expires_at: new Date(Date.now() + TEMP_TTL_MS).toISOString(),
      fail_count: 0,
      locked_until: null,
    })
    .eq('id', id)
  if (error) {
    console.error('[admin/reset-password] update failed:', error)
    return NextResponse.json({ error: '재발급에 실패했습니다.' }, { status: 502 })
  }

  await destroyAllSessions(id)

  try {
    await sendInviteMail(target.email as string, tempPassword, true)
  } catch (e) {
    console.error('[admin/reset-password] mail failed:', e)
    return NextResponse.json(
      { error: '재발급은 됐지만 메일 발송에 실패했습니다. 다시 재발급해주세요.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
