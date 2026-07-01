/**
 * 예탁원정보 (배당일정) — ksdinfo/dividend
 * tr_id: HHKDB669102C0
 * 확인 항목: 종목별 배당금, 배당수익률, 배당기준일 등
 */
const { kisGet } = require('./api')

const CODE = '005930'

async function main() {
  console.log(`\n=== [06] 예탁원정보 배당일정 (${CODE}) ===`)

  // 최근 3년치 조회
  const today = new Date()
  const to = today.toISOString().slice(0, 10).replace(/-/g, '')
  const from = new Date(today.getFullYear() - 3, 0, 1).toISOString().slice(0, 10).replace(/-/g, '')

  const data = await kisGet(
    '/uapi/domestic-stock/v1/ksdinfo/dividend',
    {
      CTS: '',
      GB1: '0',        // 0=배당전체, 1=결산배당, 2=중간배당
      F_DT: from,
      T_DT: to,
      SHT_CD: CODE,
      HIGH_GB: '',
    },
    'HHKDB669102C0'
  )

  const list = data.output1 ?? data.output ?? []
  console.log(`  수신 데이터 수: ${list.length}건`)

  if (list.length > 0) {
    console.log('\n  [전체 15건 요약]')
    for (const s of list) {
      console.log(`  ${s.record_date} | ${s.divi_kind.padEnd(4)} | 주당배당금 ${String(s.per_sto_divi_amt).padStart(6)} | 배당률 ${String(s.divi_rate).padStart(6)}%`)
    }
    console.log('\n  [전체 키 목록]')
    console.log(' ', Object.keys(list[0]).join(', '))
  } else {
    console.log('  ⚠️ 데이터 없음. 전체 응답:')
    console.log(JSON.stringify(data, null, 2))
  }
}

main().catch(console.error)
