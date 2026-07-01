const { kisGet } = require('./api')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CODE = '005930'

async function tryCall(label, urlPath, params, trId) {
  try {
    const data = await kisGet(urlPath, params, trId)
    const list = data.output || data.output1 || data.output2 || data
    const first = Array.isArray(list) ? list[0] : list
    const count = Array.isArray(list) ? list.length : 1
    console.log(`✅ ${label}: OK (${count}건)`)
    console.log(`   sample: ${JSON.stringify(first).slice(0, 400)}`)
    return true
  } catch (e) {
    console.log(`❌ ${label}: ${e.message}`)
    return false
  }
}

;(async () => {
  console.log('\n=== 투자자별 매매동향 (개인/외국인/기관) ===')
  await tryCall(
    'inquire-investor',
    '/uapi/domestic-stock/v1/quotations/inquire-investor',
    { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: CODE },
    'FHKST01010900'
  )

  await sleep(1500)
  console.log('\n=== 종목별 프로그램 매매 일별 ===')
  await tryCall(
    'program-trade-by-stock-daily',
    '/uapi/domestic-stock/v1/quotations/program-trade-by-stock-daily',
    { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: CODE },
    'FHPPG04650201'
  )

  await sleep(1500)
  console.log('\n=== 일봉 OHLCV (기술적 지표 원본) ===')
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const from = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
  await tryCall(
    'inquire-daily-itemchartprice (200일)',
    '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
    {
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: CODE,
      FID_INPUT_DATE_1: from,
      FID_INPUT_DATE_2: today,
      FID_PERIOD_DIV_CODE: 'D',
      FID_ORG_ADJ_PRC: '0',
    },
    'FHKST03010100'
  )
})()
