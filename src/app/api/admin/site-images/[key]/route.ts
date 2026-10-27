import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { replaceSiteImage } from '@/lib/site/images'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// multipart/form-data: file - 이미지 교체만(문구 수정 없음)
export async function PATCH(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: '이미지를 선택해주세요.' }, { status: 400 })
  }

  try {
    await replaceSiteImage((await ctx.params).key, file)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '교체에 실패했습니다.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
