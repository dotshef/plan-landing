import 'server-only'
import { db } from '@/lib/db/server'

const TABLE = 'phone_verification'
const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const FROM_EMAIL = 'no-reply@plankor.kr'

// ── 경보 정책 ──────────────────────────────────────────────
/** 발송량 집계 창 (밀리초) — 급증 감지용 */
const VOLUME_WINDOW_MS = 24 * 60 * 60 * 1000
/** 이 건수 이상이면 경보 (차단은 하지 않음) */
const VOLUME_THRESHOLD = 100
/** 경보 재발송 쿨다운 (밀리초) — 공격 지속 시 메일 폭주 방지 */
const ALERT_COOLDOWN_MS = 60 * 60 * 1000
let lastAlertAt = 0

/** 밀리초 창을 '24시간' / '30분' 형태의 한글 라벨로 변환한다. */
function formatWindow(ms: number): string {
  const min = Math.round(ms / 60000)
  return min % 60 === 0 ? `${min / 60}시간` : `${min}분`
}

/** 창 내 전체 발송 건수를 센다(번호 무관 전역 합계). */
async function countSendsInWindow(): Promise<number> {
  const since = new Date(Date.now() - VOLUME_WINDOW_MS).toISOString()
  const { count, error } = await db()
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
  if (error) throw error
  return count ?? 0
}

async function sendAlertEmail(count: number): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.EMAIL_TO
  if (!apiKey || !toEmail) {
    console.error('[sms/volumeAlert] RESEND_API_KEY / EMAIL_TO 미설정 — 경보 메일 생략')
    return
  }

  const windowLabel = formatWindow(VOLUME_WINDOW_MS)
  const now = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date())

  const subject = `[⚠️ SMS 발송 급증 경보] 최근 ${windowLabel} ${count}건`
  const text = [
    'SMS 인증 발송량이 임계치를 넘었습니다.',
    '',
    `발송 건수: 최근 ${windowLabel} 동안 ${count}건 (임계 ${VOLUME_THRESHOLD}건)`,
    `감지 시각: ${now} (KST)`,
    '',
    '봇/어뷰징 공격 가능성이 있습니다. 발송 로그(ip, ua)를 확인해주세요.',
    `이 경보는 ${Math.round(ALERT_COOLDOWN_MS / 60000)}분 쿨다운으로 재발송됩니다.`,
    '',
    '※ 현재는 경보만 발송하며 실제 발송은 차단하지 않습니다.',
  ].join('\n')

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [toEmail], subject, text }),
  })
  if (!res.ok) {
    console.error('[sms/volumeAlert] 경보 메일 발송 실패:', await res.text())
  }
}

/**
 * 발송량이 임계치를 넘으면 서버 로그를 남기고 경보 메일을 보낸다.
 * 발송 성공 후 호출. 실패해도 인증 발송 흐름을 막지 않도록 예외를 삼킨다.
 */
export async function maybeAlertHighVolume(): Promise<void> {
  try {
    const count = await countSendsInWindow()
    if (count < VOLUME_THRESHOLD) return

    // 쿨다운 내면 로그/메일 생략
    if (Date.now() - lastAlertAt < ALERT_COOLDOWN_MS) return
    lastAlertAt = Date.now()

    console.warn(`[sms/volumeAlert] 발송 급증 경보: 최근 창 ${count}건 (임계 ${VOLUME_THRESHOLD})`)
    await sendAlertEmail(count)
  } catch (error) {
    console.error('[sms/volumeAlert] 경보 처리 실패:', error)
  }
}
