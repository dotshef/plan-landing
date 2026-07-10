const ALIGO_SEND_ENDPOINT = 'https://apis.aligo.in/send/'

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

interface AligoResponse {
  // 알리고는 result_code를 문자열("1")로 반환하기도 한다.
  result_code: number | string
  message: string
  msg_id?: number
  success_cnt?: number
  error_cnt?: number
}

export interface SendSmsResult {
  ok: boolean
  resultCode: number
  message: string
  msgId?: number
}

/**
 * 알리고 문자보내기 API로 SMS를 발송한다.
 * 필요한 환경변수: ALIGO_API_KEY, ALIGO_USER_ID, ALIGO_SENDER
 * ALIGO_TESTMODE=Y 로 설정하면 실제 발송 없이 테스트 모드로 동작한다.
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const key = process.env.ALIGO_API_KEY
  const userId = process.env.ALIGO_USER_ID
  const sender = process.env.ALIGO_SENDER

  if (!key || !userId || !sender) {
    throw new Error('ALIGO_API_KEY / ALIGO_USER_ID / ALIGO_SENDER 환경변수가 필요합니다.')
  }

  const body = new URLSearchParams({
    key,
    user_id: userId,
    sender,
    receiver: input.receiver,
    msg: input.msg,
  })

  if (input.msgType) body.set('msg_type', input.msgType)
  if (input.title) body.set('title', input.title)
  if (process.env.ALIGO_TESTMODE === 'Y') body.set('testmode_yn', 'Y')

  let response: Response
  try {
    response = await fetch(ALIGO_SEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  } catch (error) {
    throw new Error(`알리고 API 요청에 실패했습니다: ${(error as Error).message}`)
  }

  const raw = await response.text()
  let data: AligoResponse
  try {
    data = JSON.parse(raw) as AligoResponse
  } catch {
    throw new Error(`알리고 API 응답을 해석하지 못했습니다: ${raw.slice(0, 200)}`)
  }

  // 알리고는 result_code를 문자열/숫자 혼용으로 반환하므로 숫자로 변환 후 비교한다.
  const resultCode = Number(data.result_code)

  return {
    ok: resultCode === 1,
    resultCode,
    message: data.message,
    msgId: data.msg_id,
  }
}
