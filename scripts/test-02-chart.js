/**
 * 국내주식 기간별시세 (inquire-daily-itemchartprice)
 * tr_id: FHKST03010100
 * 확인 항목: OHLCV 일봉 데이터
 */
const { kisGet } = require('./api')

const CODE = '005930'

async function main() {
  console.log(`\n=== [02] 기간별시세 일봉 (${CODE}) ===`)
  const today = new Date()
  const to = today.toISOString().slice(0, 10).replace(/-/g, '')
  const from = new Date(today - 30 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10).replace(/-/g, '')

  const data = await kisGet(
    '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
    {
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: CODE,
      FID_INPUT_DATE_1: from,
      FID_INPUT_DATE_2: to,
      FID_PERIOD_DIV_CODE: 'D', // D=일, W=주, M=월, Y=년
      FID_ORG_ADJ_PRC: '0',     // 0=수정주가
    },
    'FHKST03010100'
  )

  const list = data.output2 ?? []
  console.log(`  수신 데이터 수: ${list.length}건`)
  if (list.length > 0) {
    const sample = list[0]
    console.log('\n  [최근 1건 샘플]')
    const fields = {
      '날짜':   sample.stck_bsop_date,
      '시가':   sample.stck_oprc,
      '고가':   sample.stck_hgpr,
      '저가':   sample.stck_lwpr,
      '종가':   sample.stck_clpr,
      '거래량': sample.acml_vol,
      '거래대금': sample.acml_tr_pbmn,
    }
    for (const [k, v] of Object.entries(fields)) {
      console.log(`  ${k.padEnd(8)}: ${v ?? '(없음)'}`)
    }
    console.log('\n  [output2 키 목록]')
    console.log(' ', Object.keys(sample).join(', '))
  }
}

main().catch(console.error)
