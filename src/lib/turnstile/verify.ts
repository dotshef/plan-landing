import 'server-only'

const SITEVERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface SiteVerifyResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY 환경변수가 필요합니다.')
    return false
  }
  if (!token) return false

  const body = new URLSearchParams({ secret, response: token })
  if (ip && ip !== 'unknown') body.set('remoteip', ip)

  let data: SiteVerifyResponse
  try {
    const res = await fetch(SITEVERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    data = (await res.json()) as SiteVerifyResponse
  } catch (error) {
    console.error('[turnstile] siteverify 요청 실패:', error)
    return false
  }

  if (!data.success) {
    console.warn('[turnstile] 검증 실패:', data['error-codes'])
  }
  return data.success === true
}
