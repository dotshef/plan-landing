'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * 라우트 전환 시 PV 재발행 트래커.
 * SPA 특성상 최초 로드 이후 라우트가 바뀌어도 공통 스크립트가 재실행되지 않으므로
 * 네이버 로그분석·GA4·GTM·에이스카운터에 페이지뷰를 다시 집계한다.
 * 최초 로드는 layout의 공통 스크립트가 집계하므로 건너뛴다.
 */
export default function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }

    if (typeof window.wcs !== 'undefined') {
      window.wcs_add = window.wcs_add || {}
      window.wcs_add['wa'] = 's_68759ef9d7a'
      window.wcs_do?.()
    }
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-J69YXK6PK9', { page_path: pathname })
    }
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'virtual_pageview', page_path: pathname })
    try {
      const A = window._AceGID?.val?.[0]
      if (A) {
        const sc = document.createElement('script')
        sc.async = true
        sc.src = 'https://cr.acecounter.com/ac.js?gc=' + A[2] + '&py=' + A[1]
               + '&up=' + String(A[4]).replace(/,/g, '_') + '&rd=' + Date.now()
        document.head.appendChild(sc)
      }
    } catch {}
  }, [pathname, searchParams])

  return null
}
