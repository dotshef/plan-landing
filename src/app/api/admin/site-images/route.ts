import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { listSiteImages } from '@/lib/site/images'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  try {
    return NextResponse.json({ images: await listSiteImages() })
  } catch (e) {
    console.error('[site-images] list failed:', e)
    return NextResponse.json({ error: '목록을 불러오지 못했습니다.' }, { status: 502 })
  }
}
