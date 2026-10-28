import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { requireAdmin } from '@/lib/admin/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 내 정보 수정 - 이름만 변경 가능. 이메일은 로그인 ID라 변경하지 않는다.
// 비밀번호 변경은 /api/admin/password 를 그대로 쓴다.
export async function PATCH(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body.name !== 'string') {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }
  const name = body.name.trim()
  if (name.length > 50) return NextResponse.json({ error: '이름은 50자 이하로 입력해주세요.' }, { status: 400 })

  const { error } = await db()
    .from('user')
    .update({ name: name || null })
    .eq('id', admin.id)
  if (error) {
    console.error('[admin/me] update failed:', error)
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, name: name || null })
}
