import 'server-only'
import { db } from '@/lib/db/server'

function toKstTimestamp(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 19).replace('T', ' ')
}

function twoMonthsAgo(date: Date): Date {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const day = kst.getUTCDate()
  const targetMonth = new Date(Date.UTC(
    kst.getUTCFullYear(),
    kst.getUTCMonth() - 2,
    1,
    kst.getUTCHours(),
    kst.getUTCMinutes(),
    kst.getUTCSeconds(),
    kst.getUTCMilliseconds(),
  ))
  const lastDayOfTargetMonth = new Date(Date.UTC(
    targetMonth.getUTCFullYear(),
    targetMonth.getUTCMonth() + 1,
    0,
  )).getUTCDate()

  targetMonth.setUTCDate(Math.min(day, lastDayOfTargetMonth))
  return new Date(targetMonth.getTime() - 9 * 60 * 60 * 1000)
}

export async function hasRecentReportRequest(
  name: string,
  phone: string,
  now = new Date(),
): Promise<boolean> {
  const { data, error } = await db()
    .from('report_request')
    .select('id')
    .eq('name', name)
    .eq('phone', phone)
    .gte('requested_at', toKstTimestamp(twoMonthsAgo(now)))
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data !== null
}
