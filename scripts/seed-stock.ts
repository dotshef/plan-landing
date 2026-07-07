// 종목 마스터 시드 (1회성). stock-master.ts 스냅샷 → stock 테이블.
// 실행: npx tsx scripts/seed-stock.ts
// 유니버스·이름 해석 출처를 TS 파일 → DB로 이관(KIS_INGESTION.md §4).
import { loadEnv } from './_env'
loadEnv()

import { MASTER } from '../src/lib/kis/stock-master'
import { db } from '../src/lib/db/server'

const MARKET: Record<string, string> = { K: 'K', Q: 'Q' }

async function main() {
  const rows = Object.entries(MASTER).map(([code, [name, group, market]]) => ({
    code,
    name,
    group_code: group,
    market: MARKET[market] ?? market,
    // industry·is_common은 삽입하지 않음(is_common은 generated, industry는 야간 수집이 채움)
  }))

  console.log(`시드 대상: ${rows.length}종목`)

  const supabase = db()
  const CHUNK = 1000
  let done = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK)
    const { error } = await supabase.from('stock').upsert(batch, { onConflict: 'code' })
    if (error) throw new Error(`upsert 실패 @${i}: ${error.message}`)
    done += batch.length
    console.log(`  upsert ${done}/${rows.length}`)
  }

  const { count } = await supabase.from('stock').select('*', { count: 'exact', head: true })
  const { count: stCount } = await supabase
    .from('stock')
    .select('*', { count: 'exact', head: true })
    .eq('group_code', 'ST')
  console.log(`✅ 완료. stock 총 ${count}행, 주권(ST) ${stCount}행`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
