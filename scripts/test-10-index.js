const { kisGet } = require('./api')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function tryCall(label, urlPath, params, trId) {
  try {
    const data = await kisGet(urlPath, params, trId)
    const body = data.output || data.output1 || data.output2 || data
    const preview = typeof body === 'object' ? JSON.stringify(body).slice(0, 400) : String(body).slice(0, 400)
    console.log(`✅ ${label}: OK`)
    console.log(`   preview: ${preview}`)
    return true
  } catch (e) {
    console.log(`❌ ${label}: ${e.message}`)
    return false
  }
}

;(async () => {
  console.log('\n=== 해외 지수 daily-chartprice (FHKST03030100) ===')
  await tryCall(
    'NASDAQ COMP',
    '/uapi/overseas-price/v1/quotations/inquire-daily-chartprice',
    { FID_COND_MRKT_DIV_CODE: 'N', FID_INPUT_ISCD: 'COMP', FID_INPUT_DATE_1: '20260601', FID_INPUT_DATE_2: '20260702', FID_PERIOD_DIV_CODE: 'D' },
    'FHKST03030100'
  )
  await sleep(1500)
  await tryCall(
    'NASDAQ .IXIC',
    '/uapi/overseas-price/v1/quotations/inquire-daily-chartprice',
    { FID_COND_MRKT_DIV_CODE: 'N', FID_INPUT_ISCD: '.IXIC', FID_INPUT_DATE_1: '20260601', FID_INPUT_DATE_2: '20260702', FID_PERIOD_DIV_CODE: 'D' },
    'FHKST03030100'
  )
  await sleep(1500)
  await tryCall(
    'S&P500 SPX',
    '/uapi/overseas-price/v1/quotations/inquire-daily-chartprice',
    { FID_COND_MRKT_DIV_CODE: 'N', FID_INPUT_ISCD: 'SPX', FID_INPUT_DATE_1: '20260601', FID_INPUT_DATE_2: '20260702', FID_PERIOD_DIV_CODE: 'D' },
    'FHKST03030100'
  )
  await sleep(1500)
  await tryCall(
    'S&P500 .SPX',
    '/uapi/overseas-price/v1/quotations/inquire-daily-chartprice',
    { FID_COND_MRKT_DIV_CODE: 'N', FID_INPUT_ISCD: '.SPX', FID_INPUT_DATE_1: '20260601', FID_INPUT_DATE_2: '20260702', FID_PERIOD_DIV_CODE: 'D' },
    'FHKST03030100'
  )

  await sleep(1500)
  console.log('\n=== 해외 지수 현재가 (HHDFS76240000) ===')
  await tryCall(
    'NASDAQ price NAS/COMP',
    '/uapi/overseas-price/v1/quotations/price',
    { AUTH: '', EXCD: 'NAS', SYMB: 'COMP' },
    'HHDFS00000300'
  )
  await sleep(1500)
  await tryCall(
    'S&P500 price NYS/SPX',
    '/uapi/overseas-price/v1/quotations/price',
    { AUTH: '', EXCD: 'NYS', SYMB: 'SPX' },
    'HHDFS00000300'
  )
})()
