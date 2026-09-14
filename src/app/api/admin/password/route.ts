import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { hashPassword, passwordPolicyError, verifyPassword } from '@/lib/admin/password'
import { createSession, destroyAllSessions, requireAdmin } from '@/lib/admin/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 비밀번호 변경. 최초 로그인(must_change_password) 상태에서도 접근 가능해야 한다.
export async function POST(req: Request) {
  const admin = await requireAdmin({ allowMustChange: true })
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  let body: { currentPassword?: unknown; newPassword?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  const { data: row } = await db()
    .from('admin_user')
    .select('password_hash')
    .eq('id', admin.id)
    .maybeSingle()
  if (!row) return NextResponse.json({ error: '계정을 찾을 수 없습니다.' }, { status: 404 })

  if (!(await verifyPassword(currentPassword, row.password_hash as string))) {
    return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  const policyError = passwordPolicyError(newPassword)
  if (policyError) return NextResponse.json({ error: policyError }, { status: 400 })
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: '기존 비밀번호와 다른 비밀번호를 사용해주세요.' }, { status: 400 })
  }

  const { error } = await db()
    .from('admin_user')
    .update({
      password_hash: await hashPassword(newPassword),
      must_change_password: false,
      temp_password_expires_at: null,
    })
    .eq('id', admin.id)
  if (error) {
    console.error('[admin/password] update failed:', error)
    return NextResponse.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 502 })
  }

  // 다른 기기 세션 전부 폐기 후 현재 브라우저만 새 세션 발급
  await destroyAllSessions(admin.id)
  await createSession(admin.id)

  return NextResponse.json({ ok: true })
}
