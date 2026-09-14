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
    .from('admin_user')
    .select('id, deleted_at')
    .eq('email', email)
    .maybeSingle()
  if (existing && !existing.deleted_at) {
    return NextResponse.json({ error: '이미 등록된 관리자입니다.' }, { status: 409 })
  }

  const tempPassword = generateTempPassword()
  const fields = {
    name,
    password_hash: await hashPassword(tempPassword),
    must_change_password: true,
    temp_password_expires_at: new Date(Date.now() + TEMP_TTL_MS).toISOString(),
    fail_count: 0,
    locked_until: null,
    invited_by: admin.id,
    deleted_at: null,
  }

  let userId: number
  if (existing) {
    // 삭제됐던 계정 재초대 — 같은 행을 되살린다
    const { error } = await db().from('admin_user').update(fields).eq('id', existing.id as number)
    if (error) {
      console.error('[admin/invite] revive failed:', error)
      return NextResponse.json({ error: '초대에 실패했습니다.' }, { status: 502 })
    }
    userId = existing.id as number
  } else {
    const { data, error } = await db()
      .from('admin_user')
      .insert({ email, ...fields })
      .select('id')
      .single()
    if (error || !data) {
      console.error('[admin/invite] insert failed:', error)
      return NextResponse.json({ error: '초대에 실패했습니다.' }, { status: 502 })
    }
    userId = data.id as number
  }

  try {
    await sendInviteMail(email, tempPassword)
  } catch (e) {
    console.error('[admin/invite] mail failed:', e)
    // 메일이 안 나가면 초대가 성립하지 않는다 — 방금 만든 계정은 제거(신규)·비활성(재초대)
    if (existing) {
      await db().from('admin_user').update({ deleted_at: new Date().toISOString() }).eq('id', userId)
    } else {
      await db().from('admin_user').delete().eq('id', userId)
    }
    return NextResponse.json({ error: '초대 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
