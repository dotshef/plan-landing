import 'server-only'
import { db } from '@/lib/db/server'

// 관리자 화면의 노출 순서 변경 - 전달받은 id 순서대로 sort_order를 1부터 다시 매긴다.
// 대상 테이블은 id·sort_order 컬럼을 가진 콘텐츠 테이블(main_proof, income_proof).

export type SortableTable = 'main_proof' | 'income_proof'

/** body.ids → 정수 배열. 형식이 깨졌거나 중복이 있으면 null. */
export function parseIds(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 500) return null
  const ids = raw.map(Number)
  if (!ids.every((n) => Number.isInteger(n) && n > 0)) return null
  if (new Set(ids).size !== ids.length) return null
  return ids
}

export async function applySortOrder(table: SortableTable, ids: number[]): Promise<void> {
  const results = await Promise.all(
    ids.map((id, i) => db().from(table).update({ sort_order: i + 1 }).eq('id', id)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw new Error(`${table} reorder: ${failed.error.message}`)
}

/** 신규 행의 sort_order - 현재 최댓값 + 1 (맨 뒤에 붙인다). */
export async function nextSortOrder(table: SortableTable): Promise<number> {
  const { data } = await db()
    .from(table)
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return ((data?.sort_order as number | undefined) ?? 0) + 1
}
