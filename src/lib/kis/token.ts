import { db } from '@/lib/db/server'
import { KIS_BASE_URL } from './config'

// 액세스 토큰을 kis_token 테이블(단일 행)로 공유 캐시.
// cron 청크(=여러 invocation)가 재사용 → 발급 "1분당 1회" 제한 회피(KIS_INGESTION.md §3).
// 요청 경로는 토큰을 만지지 않는다(전면 cron).

const EXPIRY_MARGIN_MS = 10 * 60 * 1000 // 만료 10분 전이면 갱신

export async function getAccessToken(): Promise<string> {
  const supabase = db()

  const { data: row } = await supabase
    .from('kis_token')
    .select('access_token, expires_at')
    .eq('id', 1)
    .maybeSingle()

  if (row && new Date(row.expires_at).getTime() - EXPIRY_MARGIN_MS > Date.now()) {
    return row.access_token
  }

  return issueAndStore()
}

async function issueAndStore(): Promise<string> {
  const appkey = process.env.KIS_APP_KEY
  const appsecret = process.env.KIS_APP_SECRET
  if (!appkey || !appsecret) throw new Error('KIS_APP_KEY / KIS_APP_SECRET 필요')

  const res = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ grant_type: 'client_credentials', appkey, appsecret }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`토큰 발급 실패 ${res.status}: ${text}`)

  const data = JSON.parse(text) as {
    access_token?: string
    token_type?: string
    expires_in?: number
  }
  if (!data.access_token) throw new Error(`토큰 없음: ${text}`)

  const expiresAt = new Date(Date.now() + (data.expires_in ?? 86400) * 1000)

  const { error } = await db()
    .from('kis_token')
    .upsert(
      {
        id: 1,
        access_token: data.access_token,
        token_type: data.token_type ?? 'Bearer',
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
  if (error) throw new Error(`토큰 저장 실패: ${error.message}`)

  return data.access_token
}
