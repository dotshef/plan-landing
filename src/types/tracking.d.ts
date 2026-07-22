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
    // Cloudflare Turnstile
    turnstile?: {
      render: (
        container: HTMLElement,
        params: {
          sitekey: string
          size?: 'normal' | 'compact' | 'flexible'
          appearance?: 'always' | 'execute' | 'interaction-only'
          execution?: 'render' | 'execute'
          callback?: (token: string) => void
          'error-callback'?: (errorCode?: string) => boolean | void
          'expired-callback'?: () => void
          'timeout-callback'?: () => void
          'before-interactive-callback'?: () => void
          'after-interactive-callback'?: () => void
        },
      ) => string
      execute: (widgetId: string) => void
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export {}
