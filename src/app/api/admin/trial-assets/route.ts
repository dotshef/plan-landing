import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import {
  deleteTrialAsset,
  listTrialAssets,
  publicUrl,
  uploadTrialAsset,
  TRIAL_KINDS,
  type TrialAssetKind,
} from '@/lib/storage/trialAssets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  try {
    const rows = await listTrialAssets()
    return NextResponse.json({
      assets: rows.map((r) => ({ ...r, url: publicUrl(r.storage_path) })),
    })
  } catch (e) {
    console.error('[trial-assets] list failed:', e)
    return NextResponse.json({ error: '목록을 불러오지 못했습니다.' }, { status: 502 })
  }
}

// multipart/form-data: file, kind, groupNo?, alt?
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
  const kind = form.get('kind')
  if (!(file instanceof File) || typeof kind !== 'string' || !TRIAL_KINDS.includes(kind as TrialAssetKind)) {
    return NextResponse.json({ error: '파일과 종류를 확인해주세요.' }, { status: 400 })
  }

  const groupNoRaw = form.get('groupNo')
  const groupNo = typeof groupNoRaw === 'string' && groupNoRaw !== '' && Number.isInteger(Number(groupNoRaw))
    ? Number(groupNoRaw)
    : null
  const altRaw = form.get('alt')
  const alt = typeof altRaw === 'string' ? altRaw.trim().slice(0, 200) || null : null

  try {
    const row = await uploadTrialAsset({ file, kind: kind as TrialAssetKind, groupNo, alt })
    return NextResponse.json({ ok: true, asset: { ...row, url: publicUrl(row.storage_path) } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '업로드에 실패했습니다.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!Number.isInteger(id)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  try {
    await deleteTrialAsset(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '삭제에 실패했습니다.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
