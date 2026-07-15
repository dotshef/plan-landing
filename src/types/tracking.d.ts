declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    oaiq?: {
      (...args: unknown[]): void
      q?: unknown[][]
    }
    // 네이버 프리미엄 로그분석(wcslog.js)
    wcs?: {
      inflow: (...args: unknown[]) => void
      trans: (conv: { type: string }) => void
    }
    wcs_add?: Record<string, string>
    wcs_do?: (...args: unknown[]) => void
    _nasa?: Record<string, unknown>
  }
}

export {}
