import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { applySortOrder, parseIds } from '@/lib/admin/sortOrder'
import { createIncomeProof, listIncomeProofs, readIncomeProofFields } from '@/lib/income/proofs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  try {
    return NextResponse.json({ proofs: await listIncomeProofs() })
  } catch (e) {
    console.error('[income-proofs] list failed:', e)
    return NextResponse.json({ error: '목록을 불러오지 못했습니다.' }, { status: 502 })
  }
}

// multipart/form-data: file, title, tags, job, ageGroup, memberMonths
export async function POST(req: Request) {
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
    return NextResponse.json({ error: '인증 이미지를 선택해주세요.' }, { status: 400 })
  }

  try {
    await createIncomeProof(readIncomeProofFields(form), file)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '등록에 실패했습니다.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

// 노출 순서 변경 - { ids: number[] } 순서대로 sort_order 재부여
export async function PUT(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const ids = parseIds(body?.ids)
  if (!ids) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  try {
    await applySortOrder('income_proof', ids)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[income-proofs] reorder failed:', e)
    return NextResponse.json({ error: '순서 변경에 실패했습니다.' }, { status: 502 })
  }
}
