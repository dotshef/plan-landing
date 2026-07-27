import 'server-only'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** Resend에 도메인 인증된 발신 주소. 변경 시 DNS 재인증이 필요하므로 env가 아닌 코드 상수로 둔다. */
const FROM_EMAIL = 'no-reply@plankor.kr'

/** 받은편지함에서 용도가 구분되도록 표시 이름을 붙인다. */
function formatFrom(label: string): string {
  return `${label} <${FROM_EMAIL}>`
}

/** 발송에 필요한 환경변수가 모두 설정됐는지. DB 작업 전 조기 차단용. */
export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_TO)
}

export interface MailInput {
  /** 발신자 표시 이름 (예: '플랜그룹 리포트 신청') */
  label: string
  subject: string
  text: string
  html?: string
}

/**
 * Resend REST API로 EMAIL_TO에게 메일을 발송한다.
 * 실패하면 throw — 실패를 어떻게 다룰지(응답 코드/무시)는 호출자가 결정한다.
 */
export async function sendMail({ label, subject, text, html }: MailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.EMAIL_TO
  if (!apiKey || !toEmail) {
    throw new Error('RESEND_API_KEY / EMAIL_TO 환경변수가 설정되지 않았습니다.')
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: formatFrom(label),
      to: [toEmail],
      subject,
      text,
      ...(html ? { html } : {}),
    }),
  })

  if (!res.ok) {
    throw new Error(`Resend 발송 실패 (${res.status}): ${await res.text()}`)
  }
}
