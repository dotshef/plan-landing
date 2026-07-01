/**
 * 상품기본조회 — search-info
 * tr_id: CTPF1604R (search_stock_info의 CTPF1002R와 다름)
 * 확인 항목: 종목별 기업 개요 상세 정보 (CEO, 설립일 등)
 */
const { kisGet } = require('./api')

const CODE = '005930'

async function main() {
  console.log(`\n=== [08] search-info CTPF1604R (${CODE}) ===`)
  const data = await kisGet(
    '/uapi/domestic-stock/v1/quotations/search-info',
    { PDNO: CODE, PRDT_TYPE_CD: '300' },
    'CTPF1604R'
  )
  const o = data.output ?? {}
  console.log(`\n  [전체 필드 (${Object.keys(o).length}개)]`)
  for (const [k, v] of Object.entries(o)) {
    if (v !== '' && v != null) console.log(`  ${k.padEnd(28)}: ${v}`)
  }
  console.log('\n  [키 목록]')
  console.log(' ', Object.keys(o).join(', '))
}

main().catch(console.error)
