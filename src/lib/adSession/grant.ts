import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

// 광고 세션 그랜트: 광고 랜딩 시 서버(proxy)가 발급하는 서명된 쿠키.
// 서명은 위조 방지용이며, 일회성·발송 횟수 제한은 서버 저장소(ad_session 테이블)가 강제한다.
// 만료 판정은 서명된 exp로만 한다 — 쿠키는 proxy에서 슬라이딩 갱신될 수 있다.

export const AD_GRANT_COOKIE = 'ad_grant'
export const AD_GRANT_TTL_MS = 60 * 60 * 1000

export type AdTrafficSource = 'google' | 'naver'

export interface AdGrant {
  id: string
  src: AdTrafficSource
  /** 클릭 ID(gclid/NaPm 등)의 sha256 앞 16자 — 원문은 저장하지 않는다 */
  cid: string | null
  iat: number
  exp: number
}

// 전용 키가 없으면 기존 SMS 시크릿을 도메인 분리 접두어와 함께 재사용한다
// (새 환경변수 미설정으로 전 고객이 차단되는 배포 사고 방지).
function secret(): string | null {
  return process.env.AD_SESSION_SECRET || process.env.SMS_VERIFICATION_SECRET || null
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', `ad-grant:v1|${key}`).update(payload).digest('base64url')
}

export function hashClickId(clickId: string): string {
  return createHash('sha256').update(clickId).digest('hex').slice(0, 16)
}

function encode(grant: AdGrant, key: string): string {
  const payload = Buffer.from(JSON.stringify(grant)).toString('base64url')
  return `v1.${payload}.${sign(payload, key)}`
}

export function issueGrant(
  src: AdTrafficSource,
  clickId: string | null,
): { grant: AdGrant; cookieValue: string } | null {
  const key = secret()
  if (!key) {
    console.error('[adSession] AD_SESSION_SECRET 또는 SMS_VERIFICATION_SECRET 환경변수가 필요합니다.')
    return null
  }
  const now = Date.now()
  const grant: AdGrant = {
    id: randomUUID(),
    src,
    cid: clickId ? hashClickId(clickId) : null,
    iat: now,
    exp: now + AD_GRANT_TTL_MS,
  }
  return { grant, cookieValue: encode(grant, key) }
}

/** 같은 세션 id를 유지한 채 만료만 연장해 재서명한다 (발송 한도는 서버 세션이 계속 강제) */
export function reissueGrant(grant: AdGrant): string | null {
  const key = secret()
  if (!key) return null
  return encode({ ...grant, exp: Date.now() + AD_GRANT_TTL_MS }, key)
}

export function verifyGrant(cookieValue: string | undefined | null): AdGrant | null {
  if (!cookieValue) return null
  const key = secret()
  if (!key) return null

  const parts = cookieValue.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1') return null

  const expected = Buffer.from(sign(parts[1], key))
  const actual = Buffer.from(parts[2])
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null

  try {
    const grant = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as AdGrant
    if (typeof grant.id !== 'string' || typeof grant.exp !== 'number') return null
    if (grant.src !== 'google' && grant.src !== 'naver') return null
    if (grant.exp < Date.now()) return null
    return grant
  } catch {
    return null
  }
}
