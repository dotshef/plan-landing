import 'server-only'
import { db } from '@/lib/db/server'
import { nextSortOrder } from '@/lib/admin/sortOrder'
import { removePublicImage, uploadPublicImage } from '@/lib/storage/publicAssets'

// 메인(/) 히어로 '말이 아닌 결과로 증명합니다' 공증 자료 벽 - main_proof 테이블.
// 이미지는 public-assets 버킷 proof/ 폴더의 공개 URL을 image_url에 그대로 저장한다.

export interface MainProofRow {
  id: number
  alt: string
  image_url: string
  sort_order: number
}

const STORAGE_FOLDER = 'proof'
const ALT_MAX = 100

export async function listMainProofs(): Promise<MainProofRow[]> {
  const { data, error } = await db()
    .from('main_proof')
    .select('id, alt, image_url, sort_order')
    .order('sort_order')
    .order('id')
  if (error) throw new Error(`main_proof select: ${error.message}`)
  return (data ?? []) as MainProofRow[]
}

/** 설명(alt) 검증 - 위반 시 사용자 노출 가능 문구로 throw. */
function normalizeAlt(raw: unknown): string {
  const alt = typeof raw === 'string' ? raw.trim() : ''
  if (!alt) throw new Error('자료 설명을 입력해주세요.')
  if (alt.length > ALT_MAX) throw new Error(`자료 설명은 ${ALT_MAX}자 이하로 입력해주세요.`)
  return alt
}

/** 이미지 업로드 + 행 삽입(맨 뒤). 실패 시 throw(메시지는 사용자 노출 가능 문구). */
export async function createMainProof(input: { file: File; alt: unknown }): Promise<void> {
  const alt = normalizeAlt(input.alt)
  const imageUrl = await uploadPublicImage(input.file, STORAGE_FOLDER)

  const { error } = await db().from('main_proof').insert({
    alt,
    image_url: imageUrl,
    sort_order: await nextSortOrder('main_proof'),
  })
  if (error) {
    // 행 삽입 실패 시 방금 올린 오브젝트 정리
    await removePublicImage(imageUrl)
    throw new Error('자료 정보를 저장하지 못했습니다.')
  }
}

/** 설명 수정 + (선택) 이미지 교체. 교체 성공 시 기존 오브젝트는 지운다. */
export async function updateMainProof(id: number, input: { file: File | null; alt: unknown }): Promise<void> {
  const alt = normalizeAlt(input.alt)

  const { data: row } = await db().from('main_proof').select('id, image_url').eq('id', id).maybeSingle()
  if (!row) throw new Error('자료를 찾을 수 없습니다.')

  const newUrl = input.file ? await uploadPublicImage(input.file, STORAGE_FOLDER) : null
  const { error } = await db()
    .from('main_proof')
    .update(newUrl ? { alt, image_url: newUrl } : { alt })
    .eq('id', id)
  if (error) {
    if (newUrl) await removePublicImage(newUrl)
    throw new Error('자료 수정에 실패했습니다.')
  }
  if (newUrl) await removePublicImage(row.image_url as string)
}

/** 행 + Storage 오브젝트 삭제. 오브젝트 삭제는 실패해도 무시(화면 우선). */
export async function deleteMainProof(id: number): Promise<void> {
  const { data: row } = await db().from('main_proof').select('id, image_url').eq('id', id).maybeSingle()
  if (!row) throw new Error('자료를 찾을 수 없습니다.')

  const { error } = await db().from('main_proof').delete().eq('id', id)
  if (error) throw new Error('자료 삭제에 실패했습니다.')
  await removePublicImage(row.image_url as string)
}
