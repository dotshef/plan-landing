import { NextResponse } from 'next/server'
import { buildReportRequestEmailTemplate } from '@/lib/email/emailTemplate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const FROM_EMAIL = 'no-reply@dotshef.com'

interface ReportRequestPayload {
  name?: unknown
  phone?: unknown
  stock?: unknown
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.EMAIL_TO

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

  if (!name || !phone) {
    return NextResponse.json({ error: '이름과 연락처를 입력해주세요.' }, { status: 400 })
  }

  const pageUrl = req.headers.get('referer') ?? undefined
  const userAgent = req.headers.get('user-agent') ?? undefined
  const email = buildReportRequestEmailTemplate({
    name,
    phone,
    stock,
    pageUrl,
    userAgent,
    requestedAt: new Date(),
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
