import 'server-only'
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto'

// promisify는 options 오버로드 타입을 잃어버리므로 직접 래핑한다.
function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key)))
  })
}

// scrypt 파라미터. 해시 문자열에 함께 저장해 향후 상향 시에도 기존 해시 검증 가능.
const N = 16384
const R = 8
const P = 1
const KEY_LEN = 64

/** 비밀번호 → `N$r$p$salt$hash` (base64url). 평문·가역 저장 금지. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, KEY_LEN, { N, r: R, p: P, maxmem: 128 * 1024 * 1024 })
  return `${N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`
}

/** 저장된 해시와 대조. 형식이 깨졌으면 false. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 5) return false
  const [n, r, p, saltB64, hashB64] = parts
  const salt = Buffer.from(saltB64, 'base64url')
  const expected = Buffer.from(hashB64, 'base64url')
  try {
    const key = await scrypt(password, salt, expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 128 * 1024 * 1024,
    })
    return timingSafeEqual(key, expected)
  } catch {
    return false
  }
}

// 임시 비밀번호: 혼동 문자(0/O, 1/l/I) 제외 영숫자 12자
const TEMP_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateTempPassword(length = 12): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += TEMP_ALPHABET[bytes[i] % TEMP_ALPHABET.length]
  return out
}

/** 새 비밀번호 정책: 8자 이상 + 영문·숫자 각 1자 이상. 위반 시 사유 문자열, 통과 시 null. */
export function passwordPolicyError(password: string): string | null {
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return '영문과 숫자를 모두 포함해야 합니다.'
  return null
}
