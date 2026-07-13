declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    oaiq?: {
      (...args: unknown[]): void
      q?: unknown[][]
    }
  }
}

export {}
