import { NextRequest, NextResponse } from 'next/server'

// /admin/* UX 보조: 세션 쿠키가 아예 없으면 로그인으로 보낸다.
// 실제 세션 검증은 서버(lib/admin/session.ts requireAdmin)에서만 수행한다 — 여기서 중복 판정하지 않는다.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/admin/login') return NextResponse.next()

  if (!req.cookies.get('admin_session')?.value) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
