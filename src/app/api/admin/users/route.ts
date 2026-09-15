import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { requireAdmin } from '@/lib/admin/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data, error } = await db()
    .from('user')
    .select('id, email, name, must_change_password, temp_password_expires_at, last_login_at, created_at')
    .order('created_at', { ascending: true })
  if (error) {
    console.error('[admin/users] list failed:', error)
    return NextResponse.json({ error: '목록을 불러오지 못했습니다.' }, { status: 502 })
  }

  return NextResponse.json({ me: admin.id, users: data ?? [] })
}
