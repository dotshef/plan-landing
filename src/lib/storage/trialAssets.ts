import 'server-only'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db/server'

// 추천주 7일 체험 동적 이미지 — Supabase Storage(public-assets 버킷, public read).
// 업로드·삭제는 서버 라우트에서 service_role로만 수행한다(클라이언트 직접 업로드 금지).

export const TRIAL_BUCKET = 'public-assets'

export type TrialAssetKind = 'sms' | 'chart' | 'review'
export const TRIAL_KINDS: TrialAssetKind[] = ['sms', 'chart', 'review']
export const REVIEW_MAX = 3

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
export const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5MB

export interface TrialAssetRow {
  id: number
  kind: TrialAssetKind
  group_no: number | null
  storage_path: string
  alt: string | null
  sort_order: number
  created_at: string
}

export function publicUrl(storagePath: string): string {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${TRIAL_BUCKET}/${storagePath}`
}

export async function listTrialAssets(): Promise<TrialAssetRow[]> {
  const { data, error } = await db()
    .from('trial_asset')
    .select('*')
    .order('kind')
    .order('sort_order')
    .order('id')
  if (error) throw new Error(`trial_asset select: ${error.message}`)
  return (data ?? []) as TrialAssetRow[]
}

/** 파일 검증 + Storage 업로드 + 행 삽입. 실패 시 throw(메시지는 사용자 노출 가능 문구). */
export async function uploadTrialAsset(input: {
  file: File
  kind: TrialAssetKind
  groupNo: number | null
  alt: string | null
}): Promise<TrialAssetRow> {
  const ext = ALLOWED_TYPES[input.file.type]
  if (!ext) throw new Error('JPG·PNG·WebP 이미지만 업로드할 수 있습니다.')
  if (input.file.size > MAX_FILE_BYTES) throw new Error('파일 크기는 5MB 이하여야 합니다.')

  if (input.kind === 'review') {
    const { count } = await db()
      .from('trial_asset')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'review')
    if ((count ?? 0) >= REVIEW_MAX) throw new Error(`참여자 후기는 최대 ${REVIEW_MAX}개까지 등록할 수 있습니다.`)
  }

  const path = `trial/${input.kind}/${randomUUID()}.${ext}`
  const bytes = Buffer.from(await input.file.arrayBuffer())

  const { error: upErr } = await db().storage
    .from(TRIAL_BUCKET)
    .upload(path, bytes, { contentType: input.file.type, upsert: false })
  if (upErr) throw new Error(`이미지 업로드에 실패했습니다: ${upErr.message}`)

  const { data, error } = await db()
    .from('trial_asset')
    .insert({
      kind: input.kind,
      group_no: input.groupNo,
      storage_path: path,
      alt: input.alt,
      sort_order: input.groupNo ?? 0,
    })
    .select('*')
    .single()
  if (error || !data) {
    // 행 삽입 실패 시 방금 올린 오브젝트 정리(실패해도 무시 — 고아 오브젝트 허용)
    await db().storage.from(TRIAL_BUCKET).remove([path]).then(() => {}, () => {})
    throw new Error('이미지 정보를 저장하지 못했습니다.')
  }
  return data as TrialAssetRow
}

/** Storage 오브젝트 + 행 삭제. Storage 삭제 실패해도 행은 지운다(화면 우선, 고아 오브젝트 허용). */
export async function deleteTrialAsset(id: number): Promise<void> {
  const { data: row } = await db()
    .from('trial_asset')
    .select('id, storage_path')
    .eq('id', id)
    .maybeSingle()
  if (!row) throw new Error('이미지를 찾을 수 없습니다.')

  try {
    await db().storage.from(TRIAL_BUCKET).remove([row.storage_path as string])
  } catch (e) {
    console.error('[trialAssets] storage remove failed:', e)
  }

  const { error } = await db().from('trial_asset').delete().eq('id', id)
  if (error) throw new Error('이미지 삭제에 실패했습니다.')
}
