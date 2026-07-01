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
    console.log(`   sample: ${JSON.stringify(first).slice(0, 500)}`)
    if (Array.isArray(list) && list.length > 1) {
      console.log(`   sample2: ${JSON.stringify(list[1]).slice(0, 500)}`)
    }
    return true
  } catch (e) {
    console.log(`❌ ${label}: ${e.message}`)
    return false
  }
}

;(async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '')

  console.log('\n=== 종목별 프로그램 매매 일별 (date range) ===')
  await tryCall(
    'program-trade-by-stock-daily',
    '/uapi/domestic-stock/v1/quotations/program-trade-by-stock-daily',
    {
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: CODE,
      FID_INPUT_DATE_1: from,
      FID_INPUT_DATE_2: today,
    },
    'FHPPG04650201'
  )

  await sleep(1500)
  console.log('\n=== 종목별 프로그램 매매 일별 (다른 파라미터) ===')
  await tryCall(
    'program-trade-by-stock-daily v2',
    '/uapi/domestic-stock/v1/quotations/program-trade-by-stock-daily',
    {
      fid_cond_mrkt_div_code: 'J',
      fid_input_iscd: CODE,
      fid_input_date_1: today,
    },
    'FHPPG04650201'
  )
})()
