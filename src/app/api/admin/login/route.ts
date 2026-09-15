import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { verifyPassword } from '@/lib/admin/password'
import { createSession, toKstTimestamp } from '@/lib/admin/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FAILS = 5
const LOCK_MS = 10 * 60 * 1000

export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
  }

  const { data: admin } = await db()
    .from('user')
    .select('id, email, password_hash, must_change_password, temp_password_expires_at, fail_count, locked_until')
    .eq('email', email)
    .maybeSingle()

  // 계정 존재 여부를 응답으로 구분하지 않는다.
  const GENERIC = { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  if (!admin) return NextResponse.json(GENERIC, { status: 401 })

  if (admin.locked_until && new Date(admin.locked_until as string) > new Date()) {
    return NextResponse.json(
      { error: '로그인이 잠겼습니다. 10분 후 다시 시도해주세요.' },
      { status: 423 },
    )
  }

  const ok = await verifyPassword(password, admin.password_hash as string)
  if (!ok) {
    const fails = (admin.fail_count as number) + 1
    await db()
      .from('user')
      .update({
        fail_count: fails,
        locked_until: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MS).toISOString() : null,
      })
      .eq('id', admin.id as number)
    return NextResponse.json(GENERIC, { status: 401 })
  }

  // 임시 비밀번호 만료 검사 (재설정 전 계정만 해당)
  if (
    admin.must_change_password &&
    admin.temp_password_expires_at &&
    new Date(admin.temp_password_expires_at as string) <= new Date()
  ) {
    return NextResponse.json(
      { error: '임시 비밀번호가 만료되었습니다. 관리자에게 재발급을 요청해주세요.' },
      { status: 401 },
    )
  }

  await db()
    .from('user')
    .update({ fail_count: 0, locked_until: null, last_login_at: toKstTimestamp() })
    .eq('id', admin.id as number)

  await createSession(admin.id as number)

  return NextResponse.json({ ok: true, mustChangePassword: Boolean(admin.must_change_password) })
}
