import { NextResponse } from 'next/server'
import { sendSms } from '@/lib/sms/gateway'
import { CODE_TTL_MS, generateCode } from '@/lib/sms/verification'
import { checkSendRateLimit, createVerification } from '@/lib/sms/verificationStore'
import { verifyTurnstile } from '@/lib/turnstile/verify'
import { maybeAlertHighVolume } from '@/lib/sms/volumeAlert'
import { hasRecentReportRequest } from '@/lib/reportRequest/duplicate'
import { normalizePhone } from '@/lib/phone'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── 임시 응급조치: SMS 펌핑 공격 UA 지문 차단 (완전일치) ──
// 서브넷 레이트리밋 도입 후 제거 예정. 공격자가 UA를 바꾸면 항목 추가.
// 주의: 부분일치 금지 — Edge/웨일 UA가 이 문자열을 포함하므로 반드시 완전일치로만 비교.
const BLOCKED_UA_EXACT = new Set([
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
])

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

  // 봇 지문 차단 (임시 응급조치)
  if (BLOCKED_UA_EXACT.has(userAgent)) {
    console.warn(`[sms/send-code] ua-blocked | ip=${ip} | phone=${phone}`)
    return NextResponse.json(
      { error: '보안 정책에 따라 차단되었습니다. 다른 브라우저로 시도해주세요' },
      { status: 403 },
    )
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

  // 발송 성공 후에만 인증행 저장
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
