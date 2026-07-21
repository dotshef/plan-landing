export interface SendSmsInput {
  /** 수신자 전화번호 (- 없이 숫자만) */
  receiver: string
  /** 메시지 내용 */
  msg: string
  /** SMS/LMS/MMS 지정 (미지정 시 알리고가 자동 판별) */
  msgType?: 'SMS' | 'LMS' | 'MMS'
  /** LMS/MMS 제목 */
  title?: string
}

export interface SendSmsResult {
  ok: boolean
  resultCode: number
  message: string
  msgId?: number
}

/**
 * Egress Gateway를 통해 SMS를 발송한다.
 * 필요한 환경변수: EGRESS_GATEWAY_URL, EGRESS_GATEWAY_KEY
 * 실제 알리고 호출과 크리덴셜 관리는 게이트웨이가 담당한다.
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const url = process.env.EGRESS_GATEWAY_URL
  const key = process.env.EGRESS_GATEWAY_KEY

  if (!url || !key) {
    throw new Error('EGRESS_GATEWAY_URL / EGRESS_GATEWAY_KEY 환경변수가 필요합니다.')
  }

  let res: Response
  try {
    res = await fetch(`${url}/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    throw new Error(`Egress Gateway 요청에 실패했습니다: ${(error as Error).message}`)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Egress Gateway 오류: ${res.status} ${text.slice(0, 200)}`)
  }

  return (await res.json()) as SendSmsResult
}
