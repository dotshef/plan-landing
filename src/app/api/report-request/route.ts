import { NextResponse } from 'next/server'
import { buildReportRequestEmailTemplate } from '@/lib/email/emailTemplate'
import { isMailConfigured, sendMail } from '@/lib/email/sender'
import { isPhoneVerified } from '@/lib/sms/verificationStore'
import { db } from '@/lib/db/server'
import { hasRecentReportRequest, type LeadTable } from '@/lib/reportRequest/duplicate'
import { normalizePhone } from '@/lib/phone'
import { clientIp } from '@/lib/clientIp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ReportRequestPayload {
  name?: unknown
  phone?: unknown
  stock?: unknown
  trafficSource?: unknown
  adKeyword?: unknown
  adCampaignId?: unknown
  adCampaignLabel?: unknown
  landingUrl?: unknown
  sourcePage?: unknown
  indicatorItems?: unknown
}

const SOURCE_PAGES = ['main', 'trial', 'indicators', 'sector', 'income'] as const
type SourcePage = (typeof SOURCE_PAGES)[number]

function normalizeSourcePage(value: unknown): SourcePage {
  return SOURCE_PAGES.includes(value as SourcePage) ? (value as SourcePage) : 'main'
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

// KST(UTC+9) 벽시계 문자열 'YYYY-MM-DD HH:MM:SS' - requested_at(timestamp, tz 없음) 컬럼용
function toKstTimestamp(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 19).replace('T', ' ')
}

function normalizeTrafficSource(value: unknown): 'google' | 'naver' | 'unknown' {
  return value === 'google' || value === 'naver' ? value : 'unknown'
}

export async function POST(req: Request) {
  const requestedAt = new Date()

  if (!isMailConfigured()) {
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
  const phoneRaw = normalize(payload.phone)
  const stock = normalize(payload.stock)
  const trafficSource = normalizeTrafficSource(payload.trafficSource)
  const adKeyword = trafficSource === 'naver'
    ? normalize(payload.adKeyword).slice(0, 200) || null
    : null
  const adCampaignId = trafficSource === 'google'
    ? normalize(payload.adCampaignId).slice(0, 100) || null
    : null
  const adCampaignLabel = trafficSource === 'google'
    ? normalize(payload.adCampaignLabel).slice(0, 100) || null
    : null
  const landingUrl = trafficSource === 'unknown'
    ? null
    : normalize(payload.landingUrl).slice(0, 2000) || null
  const sourcePage = normalizeSourcePage(payload.sourcePage)
  // 요청 자료는 1개만 허용 - 콤마 목록이 와도 첫 항목만 접수
  const indicatorItems = (normalize(payload.indicatorItems).split(',')[0] ?? '').trim().slice(0, 500) || null
  // '두 번째 월급'(/income) 리드는 기존 리드와 분리된 income_request 테이블에 적재한다.
  const table: LeadTable = sourcePage === 'income' ? 'income_request' : 'report_request'

  if (!name || !phoneRaw) {
    return NextResponse.json({ error: '이름과 연락처를 입력해주세요.' }, { status: 400 })
  }

  const phone = normalizePhone(phoneRaw)
  if (!phone) {
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
    if (await hasRecentReportRequest(name, phone, requestedAt, table)) {
      return NextResponse.json(
        { error: '이미 접수된 이력이 있습니다' },
        { status: 409 },
      )
    }
  } catch (error) {
    console.error('[report-request] duplicate lookup failed:', error)
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

  try {
    const lead = {
      name,
      phone,
      traffic_source: trafficSource,
      ad_keyword: adKeyword,
      ad_campaign_id: adCampaignId,
      ad_campaign_label: adCampaignLabel,
      landing_url: landingUrl,
      requested_at: toKstTimestamp(requestedAt),
      ip_address: clientIp(req),
      user_agent: req.headers.get('user-agent')?.slice(0, 500) || null,
    }
    // income_request 에는 stock / source_page / indicator_items 컬럼이 없다.
    const row: Record<string, string | null> = table === 'income_request'
      ? lead
      : { ...lead, stock: stock || null, source_page: sourcePage, indicator_items: indicatorItems }
    const { error } = await db()
      .from(table)
      .insert(row)
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
    adCampaignId,
    adCampaignLabel,
    landingUrl,
    sourcePage,
    indicatorItems,
    requestedAt,
  })

  try {
    await sendMail({
      label: '플랜그룹 리포트 신청',
      subject: email.subject,
      html: email.html,
      text: email.text,
    })
  } catch (error) {
    console.error('[report-request] Resend failed:', error)
    return NextResponse.json(
      { error: '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
