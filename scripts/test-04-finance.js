/**
 * 재무 API 3종 테스트
 * - 재무비율      (FHKST66430100)
 * - 손익계산서    (FHKST66430200)
 * - 대차대조표    (FHKST66430300)
 */
const { kisGet } = require('./api')

const CODE = '005930'

async function testFinancialRatio() {
  console.log('\n  [재무비율 FHKST66430100]')
  const data = await kisGet(
    '/uapi/domestic-stock/v1/finance/financial-ratio',
    { FID_DIV_CLS_CODE: '0', fid_cond_mrkt_div_code: 'J', fid_input_iscd: CODE },
    'FHKST66430100'
  )
  const list = data.output ?? []
  console.log(`  수신: ${list.length}건`)
  if (list.length > 0) {
    const s = list[0]
    const fields = {
      '기준연도':  s.stac_yymm,
      'PER':       s.per,
      'PBR':       s.pbr,
      'ROE':       s.roe_val,
      'EPS':       s.eps,
      'BPS':       s.bps,
      'EV/EBITDA': s.ebitda,
    }
    for (const [k, v] of Object.entries(fields)) {
      console.log(`    ${k.padEnd(10)}: ${v ?? '(없음)'}`)
    }
    console.log('  키 목록:', Object.keys(s).join(', '))
  }
}

async function testIncomeStatement() {
  console.log('\n  [손익계산서 FHKST66430200]')
  const data = await kisGet(
    '/uapi/domestic-stock/v1/finance/income-statement',
    { FID_DIV_CLS_CODE: '1', fid_cond_mrkt_div_code: 'J', fid_input_iscd: CODE },
    'FHKST66430200'
  )
  const list = data.output ?? []
  console.log(`  수신: ${list.length}건 (FID_DIV_CLS_CODE=1: 분기)`)
  if (list.length > 0) {
    const s = list[0]
    const fields = {
      '기준분기':   s.stac_yymm,
      '매출액':     s.sale_account,
      '영업이익':   s.bsop_prti,
      '당기순이익': s.thtr_ntin,
      '영업이익률': s.bsop_prfi_rate,
      '순이익률':   s.net_prfi_rate,
    }
    for (const [k, v] of Object.entries(fields)) {
      console.log(`    ${k.padEnd(10)}: ${v ?? '(없음)'}`)
    }
    console.log('  키 목록:', Object.keys(s).join(', '))
  }
}

async function testBalanceSheet() {
  console.log('\n  [대차대조표 FHKST66430300]')
  const data = await kisGet(
    '/uapi/domestic-stock/v1/finance/balance-sheet',
    { FID_DIV_CLS_CODE: '1', fid_cond_mrkt_div_code: 'J', fid_input_iscd: CODE },
    'FHKST66430300'
  )
  const list = data.output ?? []
  console.log(`  수신: ${list.length}건`)
  if (list.length > 0) {
    const s = list[0]
    const fields = {
      '기준분기':  s.stac_yymm,
      '자산총계':  s.total_aset,
      '부채총계':  s.total_lblt,
      '자본총계':  s.total_cptl,
      '유동자산':  s.cras,
      '비유동자산': s.ncas,
      '유동부채':  s.crln,
    }
    for (const [k, v] of Object.entries(fields)) {
      console.log(`    ${k.padEnd(10)}: ${v ?? '(없음)'}`)
    }
    console.log('  키 목록:', Object.keys(s).join(', '))
  }
}

async function main() {
  console.log(`\n=== [04] 재무 API 3종 (${CODE}) ===`)
  await testFinancialRatio().catch(e => console.error('  ❌ 재무비율:', e.message))
  await testIncomeStatement().catch(e => console.error('  ❌ 손익계산서:', e.message))
  await testBalanceSheet().catch(e => console.error('  ❌ 대차대조표:', e.message))
}

main().catch(console.error)
