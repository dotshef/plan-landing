import { NextResponse } from 'next/server'
import { sendSms } from '@/lib/sms/aligo'
import { CODE_TTL_MS, generateCode } from '@/lib/sms/verification'
import { checkSendRateLimit, createVerification } from '@/lib/sms/verificationStore'
import { verifyTurnstile } from '@/lib/turnstile/verify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

/** 프록시 헤더에서 클라이언트 IP를 추출한다 (x-forwarded-for 첫 번째 값 우선). */
function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

export async function POST(req: Request) {
  const ip = clientIp(req)
  const userAgent = req.headers.get('user-agent') ?? 'unknown'

  let body: { phone?: unknown; turnstileToken?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const phone = normalize(body.phone)
  if (!/^\d{10,11}$/.test(phone)) {
    return NextResponse.json({ error: '올바른 연락처를 입력해주세요.' }, { status: 400 })
  }

  // 봇 방지: Turnstile 토큰 검증
  const turnstileOk = await verifyTurnstile(normalize(body.turnstileToken), ip)
  if (!turnstileOk) {
    console.warn(`[sms/send-code] turnstile BLOCKED | ip=${ip} | ua=${userAgent} | phone=${phone}`)
    return NextResponse.json(
      { error: '봇 방지 검증에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.' },
      { status: 403 },
    )
  }

  // 발송 남용 차단
  let gate
  try {
    gate = await checkSendRateLimit(phone)
  } catch (error) {
    console.error('[sms/send-code] rate-limit lookup failed:', error)
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 500 })
  }
  if (!gate.ok) {
    const message =
      gate.reason === 'cooldown'
        ? `${gate.retryAfterSec}초 후에 다시 시도해주세요.`
        : '인증번호 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
    return NextResponse.json(
      { error: message },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } },
    )
  }

  const code = generateCode()

  // 발송 시점 요청 출처 기록 (어뷰징 추적용)
  console.log(
    `[sms/send-code] sending to ${phone} | ip=${ip} | ua=${userAgent}`,
  )

  try {
    const result = await sendSms({
      receiver: phone,
      msg: `[인증번호] ${code}\n인증번호 6자리를 입력해주세요.`,
      msgType: 'SMS',
    })
    if (!result.ok) {
      console.error('[sms/send-code] Aligo failed:', result.resultCode, result.message)
      return NextResponse.json(
        { error: '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 502 },
      )
    }
  } catch (error) {
    console.error('[sms/send-code] send error:', error)
    return NextResponse.json(
      { error: '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    )
  }

  // 발송 성공 후에만 인증행 저장
  try {
    await createVerification(phone, code)
  } catch (error) {
    console.error('[sms/send-code] DB insert failed:', error)
    return NextResponse.json(
      { error: '인증번호 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, ttlMs: CODE_TTL_MS })
}
