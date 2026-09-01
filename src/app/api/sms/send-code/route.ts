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

// ── SMS 펌핑 대응: UA 화이트리스트 (Tier 1 국내 인앱 브라우저만 허용) ──
// 근거: docs/sms-pumping-2026-08-31-incident-and-strategy.md, docs/blocked-ua-list.md
// 공격자는 데스크톱 Edge 정품 UA로 유입되고, 실고객은 대부분 모바일 인앱 브라우저다.
// 아래 토큰 중 하나라도 UA에 포함돼야 발송을 허용한다(부분일치). 전 UA 완전일치는
// 기기·앱버전 조합이 수백 종이라 운영 불가 → 인앱 마커 토큰으로 판별한다.
// 로그 검증(8/31): 공격 100% 차단, 정상 후보 통과율 ~75%(데스크톱·일반 모바일 크롬 25% 차단 감수).
// ⚠️ UA는 위조 가능 → 이 화이트리스트는 스토프갭이다. 공격자가 아래 토큰을 UA에 복사해
//    넣으면 무력화된다(7월 stock 크롬·웨일 모바일 위장 전례). 근본 대응은 총량 상한.
// 채널 확대 시(인스타/페북/라인 광고 등) 해당 인앱 토큰(FBAN/, FBAV/, Instagram, Line/)을 추가.
const ALLOWED_UA_INCLUDES = [
  'SamsungBrowser/', // 삼성 인터넷
  'NAVER(inapp', // 네이버 앱 인앱브라우저
  'KAKAOTALK/', // 카카오톡 인앱
  'DaumApps/', // 다음 앱
]

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

  // UA 화이트리스트: 허용 인앱 마커가 없으면 차단. 차단 사유는 응답에 노출하지 않는다
  // (우회 힌트 금지). Turnstile 이전에 검사해 차단된 요청은 Turnstile 비용도 안 낸다.
  if (!ALLOWED_UA_INCLUDES.some((token) => userAgent.includes(token))) {
    console.warn(
      `[sms/send-code] ua-not-allowed | ip=${ip} | phone=${phone} | referer=${referer} | ua=${userAgent}`,
    )
    return NextResponse.json(
      { error: '요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.' },
      { status: 403 },
    )
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

  const code = generateCode()

  // 발송 시점 요청 출처 기록 (어뷰징 추적용)
  console.log(
    `[sms/send-code] sending to ${phone} | ip=${ip} | referer=${referer} | ua=${userAgent}`,
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
