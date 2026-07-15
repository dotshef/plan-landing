'use client'

import Script from 'next/script'

const NAVER_WA = 's_68759ef9d7a'

/**
 * 네이버 프리미엄 로그분석 공통 스크립트.
 * wcslog.js는 큐 버퍼링이 없어 로드 완료 전 inflow/wcs_do를 호출하면 집계가 유실된다.
 * 따라서 Script의 onLoad 시점에 초기화·집계를 호출해 순서를 보장한다.
 */
export default function NaverWcs() {
  return (
    <Script
      src="//wcs.naver.net/wcslog.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.wcs_add = window.wcs_add || {}
        window.wcs_add['wa'] = NAVER_WA
        window._nasa = window._nasa || {}
        if (window.wcs) {
          window.wcs.inflow()
          window.wcs_do?.()
        }
      }}
    />
  )
}
