import { getAccessToken } from './token'
import { limiter, sleep } from './rate-limit'
import { KIS_BASE_URL, KIS_MAX_RETRIES, KIS_RATE_LIMIT_CODE } from './config'

export interface KisResponse<T = unknown> {
  rt_cd: string
  msg_cd: string
  msg1: string
  output?: T
  output1?: T
  output2?: T
}

export interface KisGetOptions {
  /** HTS 조회상위 등은 custtype:'P' 헤더 필요(KIS_API_CALL_LIST §13) */
  custtype?: string
}

export class KisError extends Error {
  constructor(
    public trId: string,
    public code: string,
    message: string,
  ) {
    super(`[${trId}] ${code}: ${message}`)
    this.name = 'KisError'
  }
}

// 단일 KIS GET 호출. 레이트리밋 큐 경유 + EGW00201 백오프 재시도.
// rt_cd !== '0'이면 KisError throw(호출자가 'unavailable' 판정 등에 활용).
export async function kisGet<T = unknown>(
  urlPath: string,
  params: Record<string, string | number>,
  trId: string,
  opts: KisGetOptions = {},
): Promise<KisResponse<T>> {
  const token = await getAccessToken()

  const url = new URL(KIS_BASE_URL + urlPath)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))

  const headers: Record<string, string> = {
    'content-type': 'application/json; charset=utf-8',
    authorization: `Bearer ${token}`,
    appkey: process.env.KIS_APP_KEY ?? '',
    appsecret: process.env.KIS_APP_SECRET ?? '',
    tr_id: trId,
  }
  if (opts.custtype) headers.custtype = opts.custtype

  for (let attempt = 0; attempt <= KIS_MAX_RETRIES; attempt++) {
    await limiter.acquire()
    const res = await fetch(url.toString(), { headers })
    const data = (await res.json()) as KisResponse<T>

    if (data.rt_cd === '0') return data

    // 초당 초과는 청크 전체 중단하지 말고 백오프 후 재시도(KIS_INGESTION.md §3)
    if (data.msg_cd === KIS_RATE_LIMIT_CODE && attempt < KIS_MAX_RETRIES) {
      await sleep(500 * (attempt + 1))
      continue
    }

    throw new KisError(trId, data.msg_cd, data.msg1)
  }

  throw new KisError(trId, KIS_RATE_LIMIT_CODE, '재시도 초과')
}
