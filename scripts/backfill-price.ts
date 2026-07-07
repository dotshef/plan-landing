// price_daily 초기 백필 (1회성). 야간 daily는 ~40일만 수집하므로 차트·52주용 장기 이력을 별도 확보.
// KIS 기간별시세는 콜당 최대 ~100행 → 100일 윈도우로 뒤로 걸어가며 수집(db-schema 검증4).
// 실행: npx tsx scripts/backfill-price.ts [연수=1] [종목코드...]
//   예: npx tsx scripts/backfill-price.ts 1 005930 000660   (특정 종목)
//       npx tsx scripts/backfill-price.ts 1                 (전 주권 ST)
import { loadEnv } from './_env'
loadEnv()

import { kisGet } from '../src/lib/kis/client'
import { db } from '../src/lib/db/server'
import { num, toDate } from '../src/lib/kis/datasets/shared'

const DAY = 24 * 60 * 60 * 1000
const yyyymmdd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

async function backfillCode(code: string, years: number): Promise<number> {
  const start = new Date()
  start.setFullYear(start.getFullYear() - years)
  let to = new Date()
  const seen = new Map<string, Record<string, number | string | null>>()

  while (to.getTime() >= start.getTime()) {
    const from = new Date(Math.max(start.getTime(), to.getTime() - 99 * DAY))
    const res = await kisGet<unknown>(
      '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
      {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: code,
        FID_INPUT_DATE_1: yyyymmdd(from),
        FID_INPUT_DATE_2: yyyymmdd(to),
        FID_PERIOD_DIV_CODE: 'D',
        FID_ORG_ADJ_PRC: '0',
      },
      'FHKST03010100',
    )
    const list = (res.output2 ?? []) as Record<string, string>[]
    if (list.length === 0) break
    for (const r of list) {
      const date = toDate(r.stck_bsop_date)
      if (!date) continue
      seen.set(date, {
        code,
        date,
        open: num(r.stck_oprc),
        high: num(r.stck_hgpr),
        low: num(r.stck_lwpr),
        close: num(r.stck_clpr),
        volume: num(r.acml_vol),
        trading_value: num(r.acml_tr_pbmn),
      })
    }
    to = new Date(from.getTime() - DAY)
  }

  const rows = [...seen.values()]
  if (rows.length === 0) return 0
  const { error } = await db().from('price_daily').upsert(rows, { onConflict: 'code,date' })
  if (error) throw new Error(`price_daily upsert(${code}): ${error.message}`)
  return rows.length
}

async function main() {
  const [yearsArg, ...codeArgs] = process.argv.slice(2)
  const years = Number(yearsArg) || 1

  let codes = codeArgs
  if (codes.length === 0) {
    const { data } = await db().from('stock').select('code').eq('group_code', 'ST').order('code')
    codes = (data ?? []).map((r) => r.code as string)
  }
  console.log(`백필 대상 ${codes.length}종목 · ${years}년`)

  let ok = 0
  for (const [i, code] of codes.entries()) {
    try {
      const cnt = await backfillCode(code, years)
      ok++
      if ((i + 1) % 50 === 0 || codes.length <= 20) {
        console.log(`  [${i + 1}/${codes.length}] ${code}: ${cnt}행`)
      }
    } catch (e) {
      console.error(`  ❌ ${code}: ${e instanceof Error ? e.message : e}`)
    }
  }
  console.log(`✅ 완료. 성공 ${ok}/${codes.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
