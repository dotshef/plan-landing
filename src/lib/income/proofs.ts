import 'server-only'
import { db } from '@/lib/db/server'

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

export async function listIncomeProofs(): Promise<IncomeProofRow[]> {
  const { data, error } = await db()
    .from('income_proof')
    .select('id, title, tags, job, age_group, member_months, image_url, sort_order')
    .order('sort_order')
    .order('id')
  if (error) throw new Error(`income_proof select: ${error.message}`)
  return (data ?? []) as IncomeProofRow[]
}
