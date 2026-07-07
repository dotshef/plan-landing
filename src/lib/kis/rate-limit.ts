import { KIS_RATE_PER_SEC } from './config'

// 단일 워커 순차 호출용 레이트리미터. 최소 호출 간격을 강제해 초당 상한을 지킨다.
// (병렬 워커 금지 — KIS 20/초는 계좌 단위 공유. KIS_INGESTION.md §3)
export class RateLimiter {
  private nextAt = 0
  private readonly minInterval: number

  constructor(perSec: number = KIS_RATE_PER_SEC) {
    this.minInterval = Math.ceil(1000 / perSec)
  }

  async acquire(): Promise<void> {
    const now = Date.now()
    const wait = Math.max(0, this.nextAt - now)
    this.nextAt = Math.max(now, this.nextAt) + this.minInterval
    if (wait > 0) await sleep(wait)
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// 프로세스 전역 리미터(cron·스크립트 한 워커 내에서 공유).
export const limiter = new RateLimiter()
