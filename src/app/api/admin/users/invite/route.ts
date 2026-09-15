import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { generateTempPassword, hashPassword } from '@/lib/admin/password'
import { requireAdmin } from '@/lib/admin/session'
import { sendInviteMail } from '@/lib/admin/invite'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TEMP_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7일

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  let body: { email?: unknown; name?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 50) || null : null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '올바른 이메일을 입력해주세요.' }, { status: 400 })
  }

  const { data: existing } = await db()
    .from('user')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: '이미 등록된 관리자입니다.' }, { status: 409 })
  }

  const tempPassword = generateTempPassword()
  const { data: created, error } = await db()
    .from('user')
    .insert({
      email,
      name,
      password_hash: await hashPassword(tempPassword),
      must_change_password: true,
      temp_password_expires_at: new Date(Date.now() + TEMP_TTL_MS).toISOString(),
    })
    .select('id')
    .single()
  if (error || !created) {
    console.error('[admin/invite] insert failed:', error)
    return NextResponse.json({ error: '초대에 실패했습니다.' }, { status: 502 })
  }

  try {
    await sendInviteMail(email, tempPassword)
  } catch (e) {
    console.error('[admin/invite] mail failed:', e)
    // 메일이 안 나가면 초대가 성립하지 않는다 — 방금 만든 계정은 hard delete
    await db().from('user').delete().eq('id', created.id as number)
    return NextResponse.json({ error: '초대 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
