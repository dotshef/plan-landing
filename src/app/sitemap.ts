import type { MetadataRoute } from 'next'
import { getAllStockCodes } from '@/data/registry'

const BASE_URL = 'https://www.plankor.kr'

// DB(종목 목록) 기반 → 요청 시 생성. 빌드 프리렌더 시 DB 호출 방지.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/report`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  let codes: string[] = []
  try {
    codes = await getAllStockCodes()
  } catch {
    // DB 접근 실패 시 정적 경로만 노출 (사이트맵 자체가 깨지지 않도록).
    return staticRoutes
  }

  const stockRoutes: MetadataRoute.Sitemap = codes.flatMap((code) => [
    { url: `${BASE_URL}/stock/${code}`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/report/${code}`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
  ])

  return [...staticRoutes, ...stockRoutes]
}
