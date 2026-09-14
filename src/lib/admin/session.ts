import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/server'

// 관리자 세션. 인가 판정은 이 모듈(getAdmin/requireAdmin) 한 곳에서만 한다.
// middleware.ts는 쿠키 유무만 보는 UX 보조이며 실제 검증을 하지 않는다.

export const SESSION_COOKIE = 'admin_session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12시간

export interface AdminUser {
  id: number
  email: string
  name: string | null
  must_change_password: boolean
  temp_password_expires_at: string | null
  fail_count: number
  locked_until: string | null
  last_login_at: string | null
  created_at: string
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

// KST(UTC+9) 벽시계 'YYYY-MM-DD HH:MM:SS' — timestamp(tz 없음) 컬럼용 (report-request와 동일 규칙)
export function toKstTimestamp(date: Date = new Date()): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 19).replace('T', ' ')
}

/** 세션 발급: DB에 해시 저장 + httpOnly 쿠키 설정. Route Handler에서만 호출. */
export async function createSession(adminId: number): Promise<void> {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  const { error } = await db().from('admin_session').insert({
    token_hash: sha256(token),
    admin_id: adminId,
    expires_at: expiresAt.toISOString(),
  })
  if (error) throw new Error(`admin_session insert: ${error.message}`)

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

/** 현재 세션 폐기(DB 행 삭제 + 쿠키 제거). */
export async function destroySession(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    await db().from('admin_session').delete().eq('token_hash', sha256(token))
  }
  store.delete(SESSION_COOKIE)
}

/** 특정 관리자의 모든 세션 폐기 — 비밀번호 변경·삭제·임시 비번 재발급 시 호출. */
export async function destroyAllSessions(adminId: number): Promise<void> {
  await db().from('admin_session').delete().eq('admin_id', adminId)
}

/** 쿠키 → 세션 검증 → 관리자 행. 미로그인/만료/삭제 계정이면 null. */
export async function getAdmin(): Promise<AdminUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const { data: session } = await db()
    .from('admin_session')
    .select('admin_id, expires_at')
    .eq('token_hash', sha256(token))
    .maybeSingle()
  if (!session) return null
  if (new Date(session.expires_at as string) <= new Date()) return null

  const { data: admin } = await db()
    .from('admin_user')
    .select('id, email, name, must_change_password, temp_password_expires_at, fail_count, locked_until, last_login_at, created_at')
    .eq('id', session.admin_id as number)
    .is('deleted_at', null)
    .maybeSingle()
  return (admin as AdminUser | null) ?? null
}

/**
 * API 라우트용 가드. 로그인 상태가 아니면 null — 호출자가 401 응답.
 * 비밀번호 변경이 강제된 계정은 password API 외에는 차단한다.
 */
export async function requireAdmin(opts: { allowMustChange?: boolean } = {}): Promise<AdminUser | null> {
  const admin = await getAdmin()
  if (!admin) return null
  if (admin.must_change_password && !opts.allowMustChange) return null
  return admin
}
