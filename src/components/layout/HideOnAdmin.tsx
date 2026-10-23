'use client'

import { usePathname } from 'next/navigation'

// 관리자 화면(/admin/*)에서는 퍼블릭 사이트 공통 요소(푸터 등)를 숨긴다.
// 서버 컴포넌트를 children으로 받아 그대로 렌더하므로 감싼 컴포넌트는 서버 컴포넌트로 남는다.
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return <>{children}</>
}
