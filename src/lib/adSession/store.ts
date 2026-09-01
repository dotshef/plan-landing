import 'server-only'
import { db } from '@/lib/db/server'
import type { AdGrant } from './grant'

// 광고 세션의 서버 측 상태. 그랜트 쿠키는 위조만 막고,
// 전화번호 바인딩·발송 횟수·소진은 전부 이 테이블이 강제한다.

const TABLE = 'ad_session'

/** 세션 하나가 허용하는 발송 횟수 (최초 1회 + 재전송 2회) */
export const SESSION_MAX_SENDS = 3

interface AdSessionRow {
  id: string
  phone: string | null
  send_count: number
  consumed_at: string | null
}

export type SessionGate =
  | { ok: true }
  | { ok: false; reason: 'consumed' | 'phone-mismatch' | 'limit' | 'conflict' }

/** 발송 자격 사전 검사 — 소진하지 않는다. Turnstile 등 나머지 검증 전에 호출. */
export async function checkSession(grant: AdGrant, phone: string): Promise<SessionGate> {
  const row = await ensureRow(grant)
  return validate(row, phone)
}

/**
 * 발송 직전 호출 — 자격을 재검사하고 발송 슬롯을 원자적으로 선점한다.
 * 게이트웨이 호출 전에 카운트를 올리므로 동시 요청이 한도를 넘겨 발송할 수 없다.
 */
export async function claimSessionSend(grant: AdGrant, phone: string): Promise<SessionGate> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const row = await ensureRow(grant)
    const gate = validate(row, phone)
    if (!gate.ok) return gate

    const nextCount = row.send_count + 1
    const { data, error } = await db()
      .from(TABLE)
      .update({
        phone,
        send_count: nextCount,
        consumed_at: nextCount >= SESSION_MAX_SENDS ? new Date().toISOString() : null,
      })
      .eq('id', row.id)
      .eq('send_count', row.send_count)
      .is('consumed_at', null)
      .select('id')
    if (error) throw error
    if ((data?.length ?? 0) > 0) return { ok: true }
    // 동시 요청과 충돌 — 최신 상태로 1회 재시도
  }
  return { ok: false, reason: 'conflict' }
}

/** 인증 완료된 세션 소진 처리 (베스트 에포트 — 실패해도 호출측 흐름에 영향 없음) */
export async function consumeSession(id: string): Promise<void> {
  const { error } = await db()
    .from(TABLE)
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

async function ensureRow(grant: AdGrant): Promise<AdSessionRow> {
  const found = await fetchRow(grant.id)
  if (found) return found

  const { error } = await db()
    .from(TABLE)
    .upsert(
      {
        id: grant.id,
        traffic_source: grant.src,
        click_id_hash: grant.cid,
        expires_at: new Date(grant.exp).toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )
  if (error) throw error

  const row = await fetchRow(grant.id)
  if (!row) throw new Error(`ad_session 행 생성 실패: ${grant.id}`)
  return row
}

async function fetchRow(id: string): Promise<AdSessionRow | null> {
  const { data, error } = await db()
    .from(TABLE)
    .select('id, phone, send_count, consumed_at')
    .eq('id', id)
    .limit(1)
  if (error) throw error
  return (data?.[0] as AdSessionRow | undefined) ?? null
}

// 만료는 서명된 grant.exp가 강제하므로(verifyGrant) 여기서는 검사하지 않는다.
function validate(row: AdSessionRow, phone: string): SessionGate {
  if (row.consumed_at) return { ok: false, reason: 'consumed' }
  if (row.phone && row.phone !== phone) return { ok: false, reason: 'phone-mismatch' }
  if (row.send_count >= SESSION_MAX_SENDS) return { ok: false, reason: 'limit' }
  return { ok: true }
}
