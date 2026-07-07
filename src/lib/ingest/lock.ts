import { db } from '@/lib/db/server'

// 리스 락 (cron 겹침 방지, 크래시 내성). KIS_INGESTION.md §3.
// 만료시각 기반 소유권 → 워커가 크래시해도 리스 만료로 자동 해제.

export async function acquireLock(name: string, owner: string, ttlMs: number): Promise<boolean> {
  const now = Date.now()
  // 만료된 락 정리
  await db().from('cron_lock').delete().eq('name', name).lt('expires_at', new Date(now).toISOString())
  // 유효한 락이 있으면 PK 충돌 → 획득 실패
  const { error } = await db()
    .from('cron_lock')
    .insert({ name, owner, expires_at: new Date(now + ttlMs).toISOString() })
  return !error
}

export async function renewLock(name: string, owner: string, ttlMs: number): Promise<void> {
  await db()
    .from('cron_lock')
    .update({ expires_at: new Date(Date.now() + ttlMs).toISOString() })
    .eq('name', name)
    .eq('owner', owner)
}

export async function releaseLock(name: string, owner: string): Promise<void> {
  await db().from('cron_lock').delete().eq('name', name).eq('owner', owner)
}
