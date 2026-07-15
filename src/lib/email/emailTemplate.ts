export interface ReportRequestEmailInput {
  name: string
  phone: string
  stock?: string
  trafficSource: 'google' | 'naver' | 'unknown'
  adKeyword?: string | null
  adCampaignId?: string | null
  landingUrl?: string | null
  requestedAt: Date
}

const BRAND = '#1B6CF2'
const GREY_50 = '#F9FAFB'
const GREY_100 = '#F2F4F6'
const GREY_200 = '#E5E8EB'
const GREY_500 = '#8B95A1'
const GREY_600 = '#6B7684'
const GREY_700 = '#4E5968'
const GREY_900 = '#191F28'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
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

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${GREY_100};font-size:13px;font-weight:700;color:${GREY_500};vertical-align:top;">${label}</td>
      <td style="padding:14px 0;border-bottom:1px solid ${GREY_100};font-size:15px;font-weight:800;color:${GREY_900};text-align:right;vertical-align:top;">${value}</td>
    </tr>
  `
}

export function buildReportRequestEmailTemplate(input: ReportRequestEmailInput) {
  const stock = input.stock?.trim() || '미입력'
  const trafficSource = {
    google: '구글 광고',
    naver: '네이버 광고',
    unknown: '기타',
  }[input.trafficSource]
  const adKeyword = input.adKeyword?.trim() || '없음'
  const adCampaignId = input.adCampaignId?.trim() || '없음'
  const landingUrl = input.landingUrl?.trim() || '없음'
  const requestedAt = formatDate(input.requestedAt)
  const safe = {
    name: escapeHtml(input.name),
    phone: escapeHtml(input.phone),
    stock: escapeHtml(stock),
    trafficSource: escapeHtml(trafficSource),
    adKeyword: escapeHtml(adKeyword),
    adCampaignId: escapeHtml(adCampaignId),
    landingUrl: escapeHtml(landingUrl),
    requestedAt: escapeHtml(requestedAt),
  }

  const subject = `[무료 리포트 신청] ${input.name} / ${stock}`

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:${GREY_50};font-family:Pretendard,Apple SD Gothic Neo,Noto Sans KR,Arial,sans-serif;color:${GREY_900};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${GREY_50};padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #EEF1F6;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 22px;background:#ffffff;">
                <div style="display:inline-block;padding:7px 10px;border-radius:8px;background:#F5F8FE;color:${BRAND};font-size:12px;font-weight:800;">PLAN 리포트 신청</div>
                <h1 style="margin:16px 0 8px;font-size:24px;line-height:1.35;font-weight:900;letter-spacing:0;color:${GREY_900};">무료 리포트 신청이 접수되었습니다</h1>
                <p style="margin:0;font-size:14px;line-height:1.6;color:${GREY_600};">확인 후 입력된 연락처로 리포트 안내를 진행해주세요.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${GREY_200};border-radius:12px;padding:4px 18px;">
                  ${row('이름', safe.name)}
                  ${row('연락처', safe.phone)}
                  ${row('관심 종목', safe.stock)}
                  ${row('유입 광고 매체', safe.trafficSource)}
                  ${row('광고 키워드', safe.adKeyword)}
                  ${row('캠페인 ID', safe.adCampaignId)}
                  ${row('유입 URL', safe.landingUrl)}
                  ${row('신청 시각', safe.requestedAt)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:${GREY_50};border-top:1px solid ${GREY_100};">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${GREY_700};">이 메일은 무료 리포트 신청 폼 제출 시 자동 발송되었습니다.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    '무료 리포트 신청이 접수되었습니다.',
    '',
    `이름: ${input.name}`,
    `연락처: ${input.phone}`,
    `관심 종목: ${stock}`,
    `유입 광고 매체: ${trafficSource}`,
    `광고 키워드: ${adKeyword}`,
    `캠페인 ID: ${adCampaignId}`,
    `유입 URL: ${landingUrl}`,
    `신청 시각: ${requestedAt}`,
  ].filter(Boolean).join('\n')

  return { subject, html, text }
}
