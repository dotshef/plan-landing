export interface ReportRequestSheetInput {
  name: string
  phone: string
  stock?: string
  requestedAt: Date
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function maskPhone(phone: string) {
  return phone.length > 4 ? `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}` : phone
}

export async function appendReportRequestToSheet(input: ReportRequestSheetInput) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL
  const secret = process.env.GOOGLE_SHEET_WEBHOOK_SECRET

  if (!webhookUrl || !secret) {
    throw new Error('GOOGLE_SHEET_WEBHOOK_URL / GOOGLE_SHEET_WEBHOOK_SECRET 환경변수가 필요합니다.')
  }

  const requestedAtKst = formatDate(input.requestedAt)
  const payload = {
    secret,
    requestedAt: requestedAtKst,
    requestedAtKst,
    name: input.name,
    phone: `'${input.phone}`,
    stock: input.stock?.trim() || '미입력',
  }
  const endpoint = new URL(webhookUrl)

  console.log('[report-request] Google Sheet append start:', {
    endpoint: endpoint.host,
    requestedAtKst,
    name: input.name,
    phone: maskPhone(input.phone),
    stock: payload.stock,
  })

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  })

  const detail = await response.text()
  const contentType = response.headers.get('content-type') ?? ''
  console.log('[report-request] Google Sheet append response:', {
    status: response.status,
    ok: response.ok,
    contentType,
    body: detail.slice(0, 2000),
  })

  if (!response.ok) {
    throw new Error(`Google Sheet webhook failed: ${response.status} ${detail}`)
  }

  if (!detail) return

  if (detail.trimStart().startsWith('<')) {
    throw new Error(`Google Sheet webhook returned HTML instead of JSON: ${detail.slice(0, 2000)}`)
  }

  let result: { ok?: unknown; error?: unknown }
  try {
    result = JSON.parse(detail) as { ok?: unknown; error?: unknown }
  } catch {
    throw new Error(`Google Sheet webhook returned non-JSON response: ${detail.slice(0, 2000)}`)
  }

  if (result.ok !== true) {
    throw new Error(`Google Sheet webhook rejected: ${JSON.stringify(result)}`)
  }
}
