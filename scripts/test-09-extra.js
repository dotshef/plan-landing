/**
 * 추가 조사 API 5종 실호출
 * - 뉴스 (news-title)
 * - 종목별 프로그램 매매 체결 (program-trade-by-stock)
 * - 종목별 프로그램 매매 일별 (program-trade-by-stock-daily)
 * - 종목 투자의견 (invest-opinion)
 * - 증권사별 투자의견 (invest-opbysec)
 */
const { kisGet } = require('./api')

const CODE = '005930'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function dumpSample(list, label) {
  if (!Array.isArray(list) || list.length === 0) {
    console.log(`  ⚠️ ${label} 데이터 없음`)
    return
  }
  console.log(`  수신 건수: ${list.length}`)
  const s = list[0]
  console.log(`  [샘플 1건]`)
  for (const [k, v] of Object.entries(s)) {
    if (v !== '' && v != null) console.log(`  ${k.padEnd(28)}: ${v}`)
  }
  console.log(`  [전체키] ${Object.keys(s).join(', ')}`)
}

async function testNews() {
  console.log(`\n=== 뉴스 (news-title) ===`)
  try {
    const data = await kisGet(
      '/uapi/domestic-stock/v1/quotations/news-title',
      {
        FID_NEWS_OFER_ENTP_CODE: '',
        FID_COND_MRKT_CLS_CODE: '',
        FID_INPUT_ISCD: CODE,
        FID_TITL_CNTT: '',
        FID_INPUT_DATE_1: '',
        FID_INPUT_HOUR_1: '',
        FID_RANK_SORT_CLS_CODE: '',
        FID_INPUT_SRNO: '',
      },
      'FHKST01011800'
    )
    dumpSample(data.output ?? data.output1, 'news')
  } catch (e) { console.log(`  ❌ ${e.message}`) }
}

async function testProgramByStock() {
  console.log(`\n=== 종목별 프로그램매매 체결 (program-trade-by-stock) ===`)
  try {
    const data = await kisGet(
      '/uapi/domestic-stock/v1/quotations/program-trade-by-stock',
      { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: CODE },
      'FHPPG04650101'
    )
    dumpSample(data.output ?? data.output1, 'program-stock')
  } catch (e) { console.log(`  ❌ ${e.message}`) }
}

async function testProgramByStockDaily() {
  console.log(`\n=== 종목별 프로그램매매 일별 (program-trade-by-stock-daily) ===`)
  try {
    const today = new Date()
    const to = today.toISOString().slice(0, 10).replace(/-/g, '')
    const data = await kisGet(
      '/uapi/domestic-stock/v1/quotations/program-trade-by-stock-daily',
      { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: CODE, FID_INPUT_DATE_1: to },
      'FHPPG04650201'
    )
    dumpSample(data.output ?? data.output1, 'program-daily')
  } catch (e) { console.log(`  ❌ ${e.message}`) }
}

async function testInvestOpinion() {
  console.log(`\n=== 종목 투자의견 (invest-opinion) ===`)
  try {
    const today = new Date()
    const to = today.toISOString().slice(0, 10).replace(/-/g, '')
    const from = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
      .toISOString().slice(0, 10).replace(/-/g, '')
    const data = await kisGet(
      '/uapi/domestic-stock/v1/quotations/invest-opinion',
      {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '16633',
        FID_INPUT_ISCD: CODE,
        FID_INPUT_DATE_1: from,
        FID_INPUT_DATE_2: to,
      },
      'FHKST663300C0'
    )
    dumpSample(data.output ?? data.output1, 'invest-opinion')
  } catch (e) { console.log(`  ❌ ${e.message}`) }
}

async function testInvestOpbysec() {
  console.log(`\n=== 증권사별 투자의견 (invest-opbysec) ===`)
  try {
    const today = new Date()
    const to = today.toISOString().slice(0, 10).replace(/-/g, '')
    const from = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
      .toISOString().slice(0, 10).replace(/-/g, '')
    const data = await kisGet(
      '/uapi/domestic-stock/v1/quotations/invest-opbysec',
      {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '16634',
        FID_INPUT_ISCD: CODE,
        FID_DIV_CLS_CODE: '0',
        FID_INPUT_DATE_1: from,
        FID_INPUT_DATE_2: to,
      },
      'FHKST663400C0'
    )
    dumpSample(data.output ?? data.output1, 'invest-opbysec')
  } catch (e) { console.log(`  ❌ ${e.message}`) }
}

async function main() {
  await testNews();              await sleep(1100)
  await testProgramByStock();    await sleep(1100)
  await testProgramByStockDaily(); await sleep(1100)
  await testInvestOpinion();     await sleep(1100)
  await testInvestOpbysec()
}

main().catch(console.error)
