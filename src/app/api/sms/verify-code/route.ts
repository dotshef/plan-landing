import { NextResponse } from 'next/server'
import { verifyLatestCode } from '@/lib/sms/verificationStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(req: Request) {
  let body: { phone?: unknown; code?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const phone = normalize(body.phone)
  const code = normalize(body.code)

  if (!/^\d{10,11}$/.test(phone)) {
    return NextResponse.json({ error: '올바른 연락처를 입력해주세요.' }, { status: 400 })
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: '인증번호 6자리를 입력해주세요.' }, { status: 400 })
  }

  let result
  try {
    result = await verifyLatestCode(phone, code)
  } catch (error) {
    console.error('[sms/verify-code] verify failed:', error)
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

  switch (result.outcome) {
    case 'ok':
      return NextResponse.json({ ok: true })
    case 'invalid':
      return NextResponse.json(
        { error: `인증번호가 일치하지 않습니다. (남은 시도 ${result.remaining}회)`, remaining: result.remaining },
        { status: 400 },
      )
    case 'too_many':
      return NextResponse.json(
        { error: '인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.' },
        { status: 429 },
      )
    case 'expired':
    default:
      return NextResponse.json(
        { error: '인증번호가 만료되었습니다. 다시 요청해주세요.' },
        { status: 400 },
      )
  }
}
