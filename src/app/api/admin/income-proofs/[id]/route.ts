import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { deleteIncomeProof, readIncomeProofFields, updateIncomeProof } from '@/lib/income/proofs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function readId(ctx: { params: Promise<{ id: string }> }): Promise<number | null> {
  const id = Number((await ctx.params).id)
  return Number.isInteger(id) && id > 0 ? id : null
}

// multipart/form-data: title, tags, job, ageGroup, memberMonths, file?(이미지 교체 시에만)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const id = await readId(ctx)
  if (!id) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const file = form.get('file')
  try {
    await updateIncomeProof(id, readIncomeProofFields(form), file instanceof File && file.size > 0 ? file : null)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '수정에 실패했습니다.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const id = await readId(ctx)
  if (!id) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  try {
    await deleteIncomeProof(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '삭제에 실패했습니다.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
