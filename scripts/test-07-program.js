/**
 * 프로그램 매매 종합현황 (일별) — comp-program-trade-daily
 * tr_id: FHPPG04600001
 * 확인 항목: 시장 종합 차익/비차익 프로그램 매매
 */
const { kisGet } = require('./api')

async function main() {
  console.log(`\n=== [07] 프로그램 매매 종합현황 (코스피) ===`)

  const today = new Date()
  const to = today.toISOString().slice(0, 10).replace(/-/g, '')
  const from = new Date(today - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '')

  const data = await kisGet(
    '/uapi/domestic-stock/v1/quotations/comp-program-trade-daily',
    {
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_MRKT_CLS_CODE: 'K',
      FID_INPUT_DATE_1: from,
      FID_INPUT_DATE_2: to,
    },
    'FHPPG04600001'
  )

  const list = data.output ?? []
  console.log(`  수신 데이터 수: ${list.length}건`)

  if (list.length > 0) {
    const s = list[0]
    console.log('\n  [최근 1건 전체 필드]')
    for (const [k, v] of Object.entries(s)) {
      console.log(`  ${k.padEnd(28)}: ${v}`)
    }
    console.log('\n  [전체 키 목록]')
    console.log(' ', Object.keys(s).join(', '))
  }
}

main().catch(console.error)
