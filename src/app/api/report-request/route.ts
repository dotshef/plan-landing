import { NextResponse } from 'next/server'
import { buildReportRequestEmailTemplate } from '@/lib/email/emailTemplate'
import { isPhoneVerified } from '@/lib/sms/verificationStore'
import { db } from '@/lib/db/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const FROM_EMAIL = 'no-reply@plankor.kr'

interface ReportRequestPayload {
  name?: unknown
  phone?: unknown
  stock?: unknown
  trafficSource?: unknown
  adKeyword?: unknown
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeTrafficSource(value: unknown): 'google' | 'naver' | 'unknown' {
  return value === 'google' || value === 'naver' ? value : 'unknown'
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.EMAIL_TO
  const requestedAt = new Date()

  if (!apiKey || !toEmail) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY / EMAIL_TO 환경변수가 필요합니다.' },
      { status: 500 },
    )
  }

  let payload: ReportRequestPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const name = normalize(payload.name)
  const phone = normalize(payload.phone)
  const stock = normalize(payload.stock)
  const trafficSource = normalizeTrafficSource(payload.trafficSource)
  const adKeyword = trafficSource === 'naver'
    ? normalize(payload.adKeyword).slice(0, 200) || null
    : null

  if (!name || !phone) {
    return NextResponse.json({ error: '이름과 연락처를 입력해주세요.' }, { status: 400 })
  }

  if (!/^\d{10,11}$/.test(phone)) {
    return NextResponse.json({ error: '올바른 연락처를 입력해주세요.' }, { status: 400 })
  }

  try {
    if (!(await isPhoneVerified(phone))) {
      return NextResponse.json({ error: '휴대폰 인증을 먼저 완료해주세요.' }, { status: 401 })
    }
  } catch (error) {
    console.error('[report-request] verification lookup failed:', error)
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

  try {
    const { error } = await db()
      .from('report_request')
      .insert({
        name,
        phone,
        stock: stock || null,
        traffic_source: trafficSource,
        ad_keyword: adKeyword,
        requested_at: requestedAt.toISOString(),
      })
    if (error) throw error
  } catch (error) {
    console.error('[report-request] DB insert failed:', error)
    return NextResponse.json(
      { error: '신청 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    )
  }

  const email = buildReportRequestEmailTemplate({
    name,
    phone,
    stock,
    trafficSource,
    adKeyword,
    requestedAt,
  })

  let resendResponse: Response
  try {
    resendResponse = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    })
  } catch (error) {
    console.error('[report-request] Resend request failed:', error)
    return NextResponse.json(
      { error: '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    )
  }

  if (!resendResponse.ok) {
    const detail = await resendResponse.text()
    console.error('[report-request] Resend failed:', detail)
    return NextResponse.json(
      { error: '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
