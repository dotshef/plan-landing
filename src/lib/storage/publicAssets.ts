import 'server-only'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db/server'

// 관리자 업로드 이미지 공용 - Supabase Storage(public-assets 버킷, public read).
// DB에는 공개 URL(image_url)을 그대로 저장하고, 삭제 시 URL에서 오브젝트 경로를 역산한다.
// 업로드·삭제는 서버 라우트에서 service_role로만 수행한다(클라이언트 직접 업로드 금지).

const BUCKET = 'public-assets'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB

function publicPrefix(): string {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`
}

/** 파일 검증 + 업로드 → 공개 URL. 실패 시 throw(메시지는 사용자 노출 가능 문구). */
export async function uploadPublicImage(file: File, folder: string): Promise<string> {
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) throw new Error('JPG·PNG·WebP 이미지만 업로드할 수 있습니다.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('파일 크기는 5MB 이하여야 합니다.')

  const path = `${folder}/${randomUUID()}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())
  const { error } = await db().storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false })
  if (error) throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`)

  return publicPrefix() + path
}

/** 공개 URL이 이 버킷 오브젝트면 삭제. 실패해도 무시한다(화면 우선, 고아 오브젝트 허용). */
export async function removePublicImage(url: string): Promise<void> {
  const prefix = publicPrefix()
  if (!url.startsWith(prefix)) return
  try {
    await db().storage.from(BUCKET).remove([url.slice(prefix.length)])
  } catch (e) {
    console.error('[publicAssets] storage remove failed:', e)
  }
}
