import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sendSms } from '@/lib/sms/gateway'
import { CODE_TTL_MS, generateCode } from '@/lib/sms/verification'
import { checkSendRateLimit, createVerification } from '@/lib/sms/verificationStore'
import { verifyTurnstile } from '@/lib/turnstile/verify'
import { maybeAlertHighVolume } from '@/lib/sms/volumeAlert'
import { hasRecentReportRequest } from '@/lib/reportRequest/duplicate'
import { normalizePhone } from '@/lib/phone'
import { AD_GRANT_COOKIE, verifyGrant } from '@/lib/adSession/grant'
import { checkSession, claimSessionSend } from '@/lib/adSession/store'

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

// 광고 세션 게이트 차단 응답. 사유를 특정할 수 없는 문구만 쓴다 —
// 차단 기준을 응답에 노출하면 우회를 코치하게 된다(7월 UA 차단 문구의 교훈).
function genericBlock() {
  return NextResponse.json(
    { error: '요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.' },
    { status: 403 },
  )
}

export async function POST(req: Request) {
  const ip = clientIp(req)
  const userAgent = req.headers.get('user-agent') ?? 'unknown'
  const referer = req.headers.get('referer') ?? 'none'

  let body: { name?: unknown; phone?: unknown; turnstileToken?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const name = normalize(body.name)
  const phone = normalizePhone(normalize(body.phone))
  if (!name) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
  }
  if (!phone) {
    return NextResponse.json({ error: '올바른 연락처를 입력해주세요.' }, { status: 400 })
  }

  // ── 광고 세션 게이트: proxy가 광고 랜딩 시 발급한 그랜트가 있어야 발송 가능 ──
  // AD_SESSION_ENFORCE=0 이면 차단하지 않고 로그만 남긴다(관찰 모드).
  const enforce = process.env.AD_SESSION_ENFORCE !== '0'
  const cookieStore = await cookies()
  const grant = verifyGrant(cookieStore.get(AD_GRANT_COOKIE)?.value)

  if (!grant) {
    console.warn(
      `[sms/send-code] ad-grant MISSING | ip=${ip} | phone=${phone} | referer=${referer} | ua=${userAgent}`,
    )
    if (enforce) return genericBlock()
  } else {
    let gate
    try {
      gate = await checkSession(grant, phone)
    } catch (error) {
      console.error('[sms/send-code] ad-session lookup failed:', error)
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 500 })
    }
    if (!gate.ok) {
      console.warn(
        `[sms/send-code] ad-session BLOCKED (${gate.reason}) | session=${grant.id} | ip=${ip} | phone=${phone} | referer=${referer} | ua=${userAgent}`,
      )
      if (enforce) return genericBlock()
    }
  }

  const turnstileOk = await verifyTurnstile(normalize(body.turnstileToken), ip)
  if (!turnstileOk) {
    console.warn(
      `[sms/send-code] turnstile BLOCKED | ip=${ip} | phone=${phone} | referer=${referer} | ua=${userAgent}`,
    )
    return NextResponse.json(
      { error: '봇 방지 검증에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.' },
      { status: 403 },
    )
  }

  try {
    if (await hasRecentReportRequest(name, phone)) {
      return NextResponse.json(
        { error: '이미 접수된 이력이 있습니다' },
        { status: 409 },
      )
    }
  } catch (error) {
    console.error('[sms/send-code] duplicate lookup failed:', error)
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

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

  // 발송 슬롯 선점 — 게이트웨이 호출 전에 세션 발송 횟수를 원자적으로 증가시킨다
  if (grant) {
    let claim
    try {
      claim = await claimSessionSend(grant, phone)
    } catch (error) {
      console.error('[sms/send-code] ad-session claim failed:', error)
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 500 })
    }
    if (!claim.ok) {
      console.warn(
        `[sms/send-code] ad-session CLAIM BLOCKED (${claim.reason}) | session=${grant.id} | ip=${ip} | phone=${phone}`,
      )
      if (enforce) return genericBlock()
    }
  }

  const code = generateCode()

  // 발송 시점 요청 출처 기록 (어뷰징 추적용)
  console.log(
    `[sms/send-code] sending to ${phone} | session=${grant?.id ?? 'none'} | ip=${ip} | referer=${referer} | ua=${userAgent}`,
  )

  try {
    const result = await sendSms({
      receiver: phone,
      msg: `[인증번호] ${code}\n인증번호 6자리를 입력해주세요.`,
      msgType: 'SMS',
    })
    if (!result.ok) {
      console.error('[sms/send-code] Gateway failed:', result.resultCode, result.message)
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

  try {
    await createVerification(phone, code, name)
  } catch (error) {
    console.error('[sms/send-code] DB insert failed:', error)
    return NextResponse.json(
      { error: '인증번호 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    )
  }

  // 발송량 급증 시 경보(로그+메일)만 — 차단하지 않음
  await maybeAlertHighVolume()

  return NextResponse.json({ ok: true, ttlMs: CODE_TTL_MS })
}
