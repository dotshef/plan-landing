import 'server-only'
import { db } from '@/lib/db/server'
import { nextSortOrder } from '@/lib/admin/sortOrder'
import { removePublicImage, uploadPublicImage } from '@/lib/storage/publicAssets'

// 두 번째 월급(/income) '통장이 바뀌자 인생이 바뀐 사람들' 사례 카드 - income_proof 테이블.
// 이미지는 public-assets 버킷 income/ 폴더의 공개 URL을 image_url에 그대로 저장한다.

export interface IncomeProofRow {
  id: number
  title: string
  tags: string[]
  job: string
  age_group: number
  member_months: number
  image_url: string
  sort_order: number
}

const STORAGE_FOLDER = 'income'
const TITLE_MAX = 40
const TAG_MAX = 30
const TAGS_MAX = 5
const JOB_MAX = 20

export async function listIncomeProofs(): Promise<IncomeProofRow[]> {
  const { data, error } = await db()
    .from('income_proof')
    .select('id, title, tags, job, age_group, member_months, image_url, sort_order')
    .order('sort_order')
    .order('id')
  if (error) throw new Error(`income_proof select: ${error.message}`)
  return (data ?? []) as IncomeProofRow[]
}

type IncomeProofFields = Omit<IncomeProofRow, 'id' | 'image_url' | 'sort_order'>

/**
 * 폼 값 검증·정규화 - 위반 시 사용자 노출 가능 문구로 throw.
 * tags는 쉼표/줄바꿈 구분 문자열. '#'은 떼고, 태그 안 공백은 '_'로 바꿔 저장한다(화면에서 '#'을 붙임).
 */
export function readIncomeProofFields(form: FormData): IncomeProofFields {
  const str = (key: string) => {
    const v = form.get(key)
    return typeof v === 'string' ? v : ''
  }

  const title = str('title').replace(/\r\n?/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean).join('\n')
  if (!title) throw new Error('제목을 입력해주세요.')
  if (title.length > TITLE_MAX) throw new Error(`제목은 ${TITLE_MAX}자 이하로 입력해주세요.`)

  const tags = str('tags')
    .split(/[,\n]/)
    .map((t) => t.trim().replace(/^#+/, '').trim().replace(/\s+/g, '_'))
    .filter(Boolean)
  if (tags.length > TAGS_MAX) throw new Error(`해시태그는 ${TAGS_MAX}개까지 등록할 수 있습니다.`)
  if (tags.some((t) => t.length > TAG_MAX)) throw new Error(`해시태그는 하나당 ${TAG_MAX}자 이하로 입력해주세요.`)

  const job = str('job').trim()
  if (!job) throw new Error('직업을 입력해주세요.')
  if (job.length > JOB_MAX) throw new Error(`직업은 ${JOB_MAX}자 이하로 입력해주세요.`)

  // DB 체크 제약과 동일: 나이대 10~90(10 단위), 가입 개월 수 > 0
  const ageGroup = Number(str('ageGroup'))
  if (!Number.isInteger(ageGroup) || ageGroup < 10 || ageGroup > 90 || ageGroup % 10 !== 0) {
    throw new Error('나이대를 선택해주세요.')
  }
  const memberMonths = Number(str('memberMonths'))
  if (!Number.isInteger(memberMonths) || memberMonths < 1 || memberMonths > 600) {
    throw new Error('가입 개월 수는 1 이상의 정수로 입력해주세요.')
  }

  return { title, tags, job, age_group: ageGroup, member_months: memberMonths }
}

/** 이미지 업로드 + 행 삽입(맨 뒤). 실패 시 throw(메시지는 사용자 노출 가능 문구). */
export async function createIncomeProof(fields: IncomeProofFields, file: File): Promise<void> {
  const imageUrl = await uploadPublicImage(file, STORAGE_FOLDER)

  const { error } = await db().from('income_proof').insert({
    ...fields,
    image_url: imageUrl,
    sort_order: await nextSortOrder('income_proof'),
  })
  if (error) {
    // 행 삽입 실패 시 방금 올린 오브젝트 정리
    await removePublicImage(imageUrl)
    throw new Error('후기 정보를 저장하지 못했습니다.')
  }
}

/** 내용 수정 + (선택) 이미지 교체. 교체 성공 시 기존 오브젝트는 지운다. */
export async function updateIncomeProof(id: number, fields: IncomeProofFields, file: File | null): Promise<void> {
  const { data: row } = await db().from('income_proof').select('id, image_url').eq('id', id).maybeSingle()
  if (!row) throw new Error('후기를 찾을 수 없습니다.')

  const newUrl = file ? await uploadPublicImage(file, STORAGE_FOLDER) : null
  const { error } = await db()
    .from('income_proof')
    .update(newUrl ? { ...fields, image_url: newUrl } : fields)
    .eq('id', id)
  if (error) {
    if (newUrl) await removePublicImage(newUrl)
    throw new Error('후기 수정에 실패했습니다.')
  }
  if (newUrl) await removePublicImage(row.image_url as string)
}

/** 행 + Storage 오브젝트 삭제. 오브젝트 삭제는 실패해도 무시(화면 우선). */
export async function deleteIncomeProof(id: number): Promise<void> {
  const { data: row } = await db().from('income_proof').select('id, image_url').eq('id', id).maybeSingle()
  if (!row) throw new Error('후기를 찾을 수 없습니다.')

  const { error } = await db().from('income_proof').delete().eq('id', id)
  if (error) throw new Error('후기 삭제에 실패했습니다.')
  await removePublicImage(row.image_url as string)
}
