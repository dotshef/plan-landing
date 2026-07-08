export interface ReportRequestSheetInput {
  name: string
  phone: string
  stock?: string
  pageUrl?: string
  userAgent?: string
  requestedAt: Date
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export async function appendReportRequestToSheet(input: ReportRequestSheetInput) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL
  const secret = process.env.GOOGLE_SHEET_WEBHOOK_SECRET

  if (!webhookUrl || !secret) {
    throw new Error('GOOGLE_SHEET_WEBHOOK_URL / GOOGLE_SHEET_WEBHOOK_SECRET 환경변수가 필요합니다.')
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      secret,
      requestedAt: formatDate(input.requestedAt),
      name: input.name,
      phone: input.phone,
      stock: input.stock?.trim() || '미입력',
      pageUrl: input.pageUrl ?? '',
      userAgent: input.userAgent ?? '',
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Google Sheet webhook failed: ${response.status} ${detail}`)
  }
}
