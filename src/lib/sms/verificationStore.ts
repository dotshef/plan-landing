import 'server-only'
import { db } from '@/lib/db/server'
import {
  CODE_TTL_MS,
  MAX_FAIL_COUNT,
  VERIFIED_TTL_MS,
  hashCode,
  hashEqual,
} from './verification'

const TABLE = 'phone_verification'

// KST(UTC+9) 벽시계 문자열 'YYYY-MM-DDTHH:mm:ss' — created_at/verified_at(timestamp, tz 없음) 컬럼용
function toKstTimestamp(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 19).replace('T', ' ')
}

// DB에서 읽은 KST 벽시계 naive 문자열('YYYY-MM-DDTHH:mm:ss[.ffffff]')을 실제 시각(Date)으로 복원
function parseKstTimestamp(value: string): Date {
  const trimmed = value.replace(' ', 'T').replace(/(\.\d{3})\d*$/, '$1')
  return new Date(`${trimmed}+09:00`)
}

// ── 발송 rate-limit 정책 ──────────────────────────────────────
/** rate-limit 집계 창 (밀리초) */
const SEND_WINDOW_MS = 60 * 60 * 1000
/** 집계 창 내 최대 발송 건수 */
const SEND_MAX_IN_WINDOW = 5
/** 재발송 쿨다운 (밀리초) */
const RESEND_COOLDOWN_MS = 30 * 1000

export type SendGate =
  | { ok: true }
  | { ok: false; reason: 'cooldown' | 'limit'; retryAfterSec: number }

/** 번호별 발송 남용(비용 폭탄) 차단 */
export async function checkSendRateLimit(phone: string): Promise<SendGate> {
  const since = toKstTimestamp(new Date(Date.now() - SEND_WINDOW_MS))
  const { data, error } = await db()
    .from(TABLE)
    .select('created_at')
    .eq('phone', phone)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = data ?? []

  if (rows.length >= SEND_MAX_IN_WINDOW) {
    return { ok: false, reason: 'limit', retryAfterSec: Math.ceil(SEND_WINDOW_MS / 1000) }
  }
  if (rows.length > 0) {
    const elapsed = Date.now() - parseKstTimestamp(rows[0].created_at as string).getTime()
    if (elapsed < RESEND_COOLDOWN_MS) {
      return { ok: false, reason: 'cooldown', retryAfterSec: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) }
    }
  }
  return { ok: true }
}

/** 새 인증번호 행 저장 (SMS 발송 성공 후 호출) */
export async function createVerification(phone: string, code: string, name: string): Promise<void> {
  const { error } = await db()
    .from(TABLE)
    .insert({
      phone,
      name,
      code_hash: hashCode(phone, code),
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    })
  if (error) throw error
}

export type VerifyOutcome =
  | { outcome: 'ok' }
  | { outcome: 'invalid'; remaining: number }
  | { outcome: 'expired' }
  | { outcome: 'too_many' }

/** 최신 인증행을 대조하고, 실패 시 시도횟수를 증가시킨다 */
export async function verifyLatestCode(phone: string, code: string): Promise<VerifyOutcome> {
  const { data, error } = await db()
    .from(TABLE)
    .select('id, code_hash, expires_at, fail_count, verified_at')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  const row = data?.[0]

  // 유효한 미검증 코드가 없음 (미발송 / 이미 검증됨 / 만료)
  if (!row || row.verified_at) return { outcome: 'expired' }
  if (new Date(row.expires_at as string).getTime() < Date.now()) return { outcome: 'expired' }
  if ((row.fail_count as number) >= MAX_FAIL_COUNT) return { outcome: 'too_many' }

  if (hashEqual(row.code_hash as string, hashCode(phone, code))) {
    const { error: updErr } = await db()
      .from(TABLE)
      .update({ verified_at: toKstTimestamp(new Date()) })
      .eq('id', row.id)
    if (updErr) throw updErr
    return { outcome: 'ok' }
  }

  const failCount = (row.fail_count as number) + 1
  const { error: updErr } = await db().from(TABLE).update({ fail_count: failCount }).eq('id', row.id)
  if (updErr) throw updErr
  return { outcome: 'invalid', remaining: Math.max(0, MAX_FAIL_COUNT - failCount) }
}

/** 신청 시점에 해당 번호가 최근에 인증되었는지 확인 */
export async function isPhoneVerified(phone: string): Promise<boolean> {
  const since = toKstTimestamp(new Date(Date.now() - VERIFIED_TTL_MS))
  const { data, error } = await db()
    .from(TABLE)
    .select('id')
    .eq('phone', phone)
    .not('verified_at', 'is', null)
    .gte('verified_at', since)
    .limit(1)

  if (error) throw error
  return (data?.length ?? 0) > 0
}
