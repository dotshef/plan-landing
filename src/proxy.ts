import { NextResponse, type NextRequest } from 'next/server'
import {
  AD_GRANT_COOKIE,
  AD_GRANT_TTL_MS,
  issueGrant,
  reissueGrant,
  verifyGrant,
  type AdTrafficSource,
} from '@/lib/adSession/grant'

// 광고 랜딩을 서버에서 감지해 광고 세션 그랜트 쿠키를 발급한다.
// 페이지가 정적 캐시되어도 proxy는 매 요청 실행되므로 발급 지점은 여기여야 한다.

const GOOGLE_KEYS = ['gclid', 'gbraid', 'wbraid', 'gad_campaignid']
const NAVER_KEYS = ['n_media', 'n_ad_group', 'n_ad', 'napm']

function detectAdLanding(url: URL): { src: AdTrafficSource; clickId: string | null } | null {
  // 실제 광고 URL의 파라미터는 대소문자가 섞여 온다(NaPm 등) — 소문자로 정규화해 비교
  const params = new Map<string, string>()
  url.searchParams.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (!params.has(lower)) params.set(lower, value)
  })

  const isGoogle = GOOGLE_KEYS.some((key) => params.has(key))
  const isNaver = NAVER_KEYS.some((key) => params.has(key))
  if (isGoogle === isNaver) return null

  if (isGoogle) {
    return {
      src: 'google',
      clickId: params.get('gclid') ?? params.get('gbraid') ?? params.get('wbraid') ?? null,
    }
  }
  return { src: 'naver', clickId: params.get('napm') ?? params.get('n_ad') ?? null }
}

function setGrantCookie(res: NextResponse, value: string) {
  res.cookies.set(AD_GRANT_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(AD_GRANT_TTL_MS / 1000),
  })
}

export function proxy(request: NextRequest) {
  const res = NextResponse.next()

  const landing = detectAdLanding(request.nextUrl)
  if (landing) {
    const issued = issueGrant(landing.src, landing.clickId)
    if (issued) setGrantCookie(res, issued.cookieValue)
    return res
  }

  // 광고 파라미터 없는 사이트 내 이동: 잔여 시간이 절반 미만이면 슬라이딩 갱신
  // (세션 id가 유지되므로 발송 한도는 그대로 — 수명 연장이 추가 발송권이 되지 않는다)
  const existing = verifyGrant(request.cookies.get(AD_GRANT_COOKIE)?.value)
  if (existing && existing.exp - Date.now() < AD_GRANT_TTL_MS / 2) {
    const refreshed = reissueGrant(existing)
    if (refreshed) setGrantCookie(res, refreshed)
  }
  return res
}

export const config = {
  // 페이지 요청만 처리 (API·정적 자산 제외)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
