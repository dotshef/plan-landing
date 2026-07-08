import { NextResponse } from 'next/server'
import { acquireLock, releaseLock } from '@/lib/ingest/lock'
import { runBatch } from '@/lib/ingest/pump'

// 단일 Cron 펌프 엔드포인트. Vercel Cron이 5분 간격으로 호출(KIS_INGESTION.md §3).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 800 // Pro

const LOCK_NAME = 'ingest'
const LOCK_TTL_MS = 120_000 // 종목마다 heartbeat 연장

export async function GET(req: Request) {
  // 엔드포인트 보호: Authorization: Bearer ${CRON_SECRET}
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const owner = crypto.randomUUID()
  const acquired = await acquireLock(LOCK_NAME, owner, LOCK_TTL_MS)
  if (!acquired) {
    console.log('[ingest] skipped: 락 보유 중인 다른 실행 있음')
    return NextResponse.json({ skipped: 'locked' })
  }

  try {
    const result = await runBatch({ lockName: LOCK_NAME, owner, lockTtlMs: LOCK_TTL_MS })
    if (result.selected === 0) console.log('[ingest] no-op: 오늘 수집할 종목 없음(전량 신선)')
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  } finally {
    await releaseLock(LOCK_NAME, owner)
  }
}
