import { createHmac, timingSafeEqual } from 'node:crypto'

/** 인증번호 유효시간 (밀리초) */
export const CODE_TTL_MS = 3 * 60 * 1000
/** 최대 검증 시도 횟수 */
export const MAX_ATTEMPTS = 5
/** 인증 완료 후 실제 신청까지 유효한 시간 (밀리초) */
export const VERIFIED_TTL_MS = 10 * 60 * 1000

function secret() {
  const value = process.env.SMS_VERIFICATION_SECRET
  if (!value) {
    throw new Error('SMS_VERIFICATION_SECRET 환경변수가 필요합니다.')
  }
  return value
}

/** 6자리 랜덤 인증번호 (앞자리 0 허용) */
export function generateCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
}

/** 인증번호를 전화번호에 종속시켜 HMAC 해시 (DB에는 평문 대신 이 값을 저장) */
export function hashCode(phone: string, code: string): string {
  return createHmac('sha256', secret()).update(`${phone}|${code}`).digest('base64url')
}

/** 타이밍 세이프 해시 비교 */
export function hashEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}
