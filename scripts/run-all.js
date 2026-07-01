/**
 * KIS API 전체 테스트 + KIS_API_SPEC.md 자동 생성
 * 실행: node scripts/run-all.js
 */
const fs = require('fs')
const path = require('path')
const { kisGet } = require('./api')
const { loadEnv } = require('./auth')

loadEnv()
const CODE = '005930'
const results = []

function ok(name, endpoint, trId, fields) {
  results.push({ status: '✅', name, endpoint, trId, fields, error: null })
}
function fail(name, endpoint, trId, error) {
  results.push({ status: '❌', name, endpoint, trId, fields: [], error })
}

// ─────────────────────────────────────────
async function run01_price() {
  const name = '주식현재가 시세'
  const endpoint = '/uapi/domestic-stock/v1/quotations/inquire-price'
  const trId = 'FHKST01010100'
  try {
    const data = await kisGet(endpoint, { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: CODE }, trId)
    const o = data.output
    ok(name, endpoint, trId, [
      `stck_prpr (현재가): ${o.stck_prpr}`,
      `prdy_vrss (전일대비): ${o.prdy_vrss}`,
      `prdy_ctrt (등락률): ${o.prdy_ctrt}%`,
      `stck_oprc (시가): ${o.stck_oprc}`,
      `stck_hgpr (고가): ${o.stck_hgpr}`,
      `stck_lwpr (저가): ${o.stck_lwpr}`,
      `acml_vol (거래량): ${o.acml_vol}`,
      `acml_tr_pbmn (거래대금): ${o.acml_tr_pbmn}`,
      `hts_avls (시가총액): ${o.hts_avls}`,
      `per: ${o.per}`,
      `pbr: ${o.pbr}`,
      `eps: ${o.eps}`,
      `bps: ${o.bps}`,
      `roe_val (ROE): ${o.roe_val ?? '❌없음'}`,
      `d250_hgpr (52주최고): ${o.d250_hgpr}`,
      `d250_lwpr (52주최저): ${o.d250_lwpr}`,
      `hts_frgn_ehrt (외국인보유율): ${o.hts_frgn_ehrt}%`,
      `bstp_kor_isnm (업종명): ${o.bstp_kor_isnm}`,
      `[전체키] ${Object.keys(o).join(', ')}`,
    ])
    console.log(`✅ ${name}`)
  } catch (e) {
    fail(name, endpoint, trId, e.message)
    console.log(`❌ ${name}: ${e.message}`)
  }
}

async function run02_chart() {
  const name = '기간별시세 (일봉 OHLCV)'
  const endpoint = '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice'
  const trId = 'FHKST03010100'
  try {
    const today = new Date()
    const to = today.toISOString().slice(0, 10).replace(/-/g, '')
    const from = new Date(today - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
    const data = await kisGet(endpoint, {
      FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: CODE,
      FID_INPUT_DATE_1: from, FID_INPUT_DATE_2: to,
      FID_PERIOD_DIV_CODE: 'D', FID_ORG_ADJ_PRC: '0',
    }, trId)
    const list = data.output2 ?? []
    const s = list[0] ?? {}
    ok(name, endpoint, trId, [
      `수신 건수: ${list.length}`,
      `stck_bsop_date (날짜): ${s.stck_bsop_date}`,
      `stck_oprc (시가): ${s.stck_oprc}`,
      `stck_hgpr (고가): ${s.stck_hgpr}`,
      `stck_lwpr (저가): ${s.stck_lwpr}`,
      `stck_clpr (종가): ${s.stck_clpr}`,
      `acml_vol (거래량): ${s.acml_vol}`,
      `[전체키] ${Object.keys(s).join(', ')}`,
    ])
    console.log(`✅ ${name}`)
  } catch (e) {
    fail(name, endpoint, trId, e.message)
    console.log(`❌ ${name}: ${e.message}`)
  }
}

async function run03_investor() {
  const name = '투자자매매동향'
  const endpoint = '/uapi/domestic-stock/v1/quotations/inquire-investor'
  const trId = 'FHKST01010900'
  try {
    const data = await kisGet(endpoint, { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: CODE }, trId)
    const list = data.output ?? []
    const s = list[0] ?? {}
    ok(name, endpoint, trId, [
      `수신 건수: ${list.length}`,
      `stck_bsop_date (날짜): ${s.stck_bsop_date}`,
      `prsn_ntby_qty (개인순매수량): ${s.prsn_ntby_qty}`,
      `frgn_ntby_qty (외국인순매수량): ${s.frgn_ntby_qty}`,
      `orgn_ntby_qty (기관순매수량): ${s.orgn_ntby_qty}`,
      `prsn_ntby_tr_pbmn (개인순매수금액): ${s.prsn_ntby_tr_pbmn}`,
      `frgn_ntby_tr_pbmn (외국인순매수금액): ${s.frgn_ntby_tr_pbmn}`,
      `orgn_ntby_tr_pbmn (기관순매수금액): ${s.orgn_ntby_tr_pbmn}`,
      `[전체키] ${Object.keys(s).join(', ')}`,
    ])
    console.log(`✅ ${name}`)
  } catch (e) {
    fail(name, endpoint, trId, e.message)
    console.log(`❌ ${name}: ${e.message}`)
  }
}

async function run04a_finance_ratio() {
  // FHKST66430100 실측: 자본구조 데이터 반환 (자산/부채/자본 구성)
  const name = '자본구조 (financial-ratio endpoint)'
  const endpoint = '/uapi/domestic-stock/v1/finance/financial-ratio'
  const trId = 'FHKST66430100'
  try {
    const data = await kisGet(endpoint, { FID_DIV_CLS_CODE: '0', fid_cond_mrkt_div_code: 'J', fid_input_iscd: CODE }, trId)
    const list = data.output ?? []
    const s = list[0] ?? {}
    ok(name, endpoint, trId, [
      `수신 건수: ${list.length}`,
      `stac_yymm (기준연도): ${s.stac_yymm}`,
      `cras (유동자산): ${s.cras}`,
      `fxas (비유동자산): ${s.fxas}`,
      `total_aset (자산총계): ${s.total_aset}`,
      `flow_lblt (유동부채): ${s.flow_lblt}`,
      `fix_lblt (고정부채): ${s.fix_lblt}`,
      `total_lblt (부채총계): ${s.total_lblt}`,
      `cpfn (자본금): ${s.cpfn}`,
      `cfp_surp (자본잉여금): ${s.cfp_surp}`,
      `prfi_surp (이익잉여금): ${s.prfi_surp}`,
      `total_cptl (자본총계): ${s.total_cptl}`,
      `[전체키] ${Object.keys(s).join(', ')}`,
    ])
    console.log(`✅ ${name}`)
  } catch (e) {
    fail(name, endpoint, trId, e.message)
    console.log(`❌ ${name}: ${e.message}`)
  }
}

async function run04b_income() {
  const name = '손익계산서 (income-statement endpoint)'
  const endpoint = '/uapi/domestic-stock/v1/finance/income-statement'
  const trId = 'FHKST66430200'
  try {
    const data = await kisGet(endpoint, { FID_DIV_CLS_CODE: '1', fid_cond_mrkt_div_code: 'J', fid_input_iscd: CODE }, trId)
    const list = data.output ?? []
    const s = list[0] ?? {}
    ok(name, endpoint, trId, [
      `수신 건수: ${list.length} (FID_DIV_CLS_CODE=1: 분기 / 0: 연간)`,
      `stac_yymm (기준분기): ${s.stac_yymm}`,
      `sale_account (매출액): ${s.sale_account}`,
      `sale_cost (매출원가): ${s.sale_cost}`,
      `sale_totl_prfi (매출총이익): ${s.sale_totl_prfi}`,
      `sell_mang (판관비): ${s.sell_mang}`,
      `bsop_prti (영업이익): ${s.bsop_prti}`,
      `op_prfi (경상이익): ${s.op_prfi}`,
      `thtr_ntin (당기순이익): ${s.thtr_ntin}`,
      `[전체키] ${Object.keys(s).join(', ')}`,
    ])
    console.log(`✅ ${name}`)
  } catch (e) {
    fail(name, endpoint, trId, e.message)
    console.log(`❌ ${name}: ${e.message}`)
  }
}

async function run04c_balance() {
  // FHKST66430300 실측: 성장성·수익성 지표 반환 (ROE, EPS, BPS 등)
  const name = '성장성·수익성 지표 (balance-sheet endpoint)'
  const endpoint = '/uapi/domestic-stock/v1/finance/balance-sheet'
  const trId = 'FHKST66430300'
  try {
    const data = await kisGet(endpoint, { FID_DIV_CLS_CODE: '1', fid_cond_mrkt_div_code: 'J', fid_input_iscd: CODE }, trId)
    const list = data.output ?? []
    const s = list[0] ?? {}
    ok(name, endpoint, trId, [
      `수신 건수: ${list.length}`,
      `stac_yymm (기준분기): ${s.stac_yymm}`,
      `grs (매출성장률): ${s.grs}`,
      `bsop_prfi_inrt (영업이익증가율): ${s.bsop_prfi_inrt}`,
      `ntin_inrt (순이익증가율): ${s.ntin_inrt}`,
      `roe_val (ROE): ${s.roe_val}`,
      `eps (EPS): ${s.eps}`,
      `sps (SPS 주당매출액): ${s.sps}`,
      `bps (BPS): ${s.bps}`,
      `rsrv_rate (유보율): ${s.rsrv_rate}`,
      `lblt_rate (부채비율): ${s.lblt_rate}`,
      `[전체키] ${Object.keys(s).join(', ')}`,
    ])
    console.log(`✅ ${name}`)
  } catch (e) {
    fail(name, endpoint, trId, e.message)
    console.log(`❌ ${name}: ${e.message}`)
  }
}

async function run05_company() {
  const name = '종목기본정보'
  const endpoint = '/uapi/domestic-stock/v1/quotations/search-stock-info'
  const trId = 'CTPF1002R'
  try {
    const data = await kisGet(endpoint, { PRDT_TYPE_CD: '300', PDNO: CODE }, trId)
    const o = data.output ?? {}
    ok(name, endpoint, trId, [
      `prdt_abrv_name (종목명): ${o.prdt_abrv_name}`,
      `std_idst_clsf_cd_name (업종명): ${o.std_idst_clsf_cd_name}`,
      `lstg_stqt (상장주식수): ${o.lstg_stqt}`,
      `scts_mket_lstg_dt (상장일): ${o.scts_mket_lstg_dt}`,
      `cpfn (자본금): ${o.cpfn}`,
      `mket_id_cd (시장구분): ${o.mket_id_cd}`,
      `[전체키] ${Object.keys(o).join(', ')}`,
    ])
    console.log(`✅ ${name}`)
  } catch (e) {
    fail(name, endpoint, trId, e.message)
    console.log(`❌ ${name}: ${e.message}`)
  }
}

// ─────────────────────────────────────────
function generateMarkdown() {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  const successList = results.filter(r => r.status === '✅')
  const failList    = results.filter(r => r.status === '❌')

  let md = `# KIS API 스펙 정리\n\n`
  md += `> 테스트 종목: 삼성전자 (005930) | 실전투자 REST: https://openapi.koreainvestment.com:9443\n`
  md += `> 생성 일시: ${now}\n\n`
  md += `---\n\n`

  md += `## 호출 가능 API (${successList.length}개)\n\n`
  for (const r of successList) {
    md += `### ✅ ${r.name}\n\n`
    md += `- **tr_id**: \`${r.trId}\`\n`
    md += `- **endpoint**: \`GET ${r.endpoint}\`\n`
    md += `\n**응답 필드 (실측)**\n\n`
    md += '```\n'
    for (const f of r.fields) md += `${f}\n`
    md += '```\n\n'
  }

  md += `---\n\n`
  md += `## 호출 불가 / 미제공 데이터\n\n`
  md += `아래는 KIS REST API로 제공되지 않는 데이터입니다.\n\n`

  const unavailable = [
    { name: '현금흐름표', reason: 'KIS REST 미제공 — 엔드포인트 없음' },
    { name: '배당 히스토리 / 주당배당금 / 배당성향', reason: 'KIS REST 미제공 — 별도 API 없음 (inquire-price에 배당수익률 없음 확인 필요)' },
    { name: '1년 베타(Beta)', reason: 'KIS REST 직접 제공 필드 없음 — OHLCV로 앱 내 계산 가능' },
    { name: '뉴스', reason: 'KIS REST 범위 밖' },
    { name: 'AI 인사이트 / 한줄 분석', reason: 'KIS API 데이터 아님' },
    { name: '증권사 리포트 / 목표주가', reason: 'KIS API 범위 밖' },
    { name: '주주구성 세부 비율 (개인/기관/기타 보유율)', reason: 'KIS 미제공 — 외국인보유율(hts_frgn_ehrt)만 inquire-price에서 제공' },
    { name: '종목별 프로그램 매매 종합', reason: 'WebSocket 전용 — REST API 없음' },
  ]

  md += `| 데이터 | 사유 |\n|--------|------|\n`
  for (const u of unavailable) {
    md += `| ${u.name} | ${u.reason} |\n`
  }
  md += '\n'

  if (failList.length > 0) {
    md += `---\n\n`
    md += `## 테스트 실패 (${failList.length}개)\n\n`
    for (const r of failList) {
      md += `### ❌ ${r.name}\n\n`
      md += `- **tr_id**: \`${r.trId}\`\n`
      md += `- **endpoint**: \`${r.endpoint}\`\n`
      md += `- **오류**: ${r.error}\n\n`
    }
  }

  md += `---\n\n`
  md += `## WebSocket 전용 (실시간)\n\n`
  md += `| 데이터 | 서버 | 설명 |\n|--------|------|------|\n`
  md += `| 실시간 체결가 | ws://ops.koreainvestment.com:21000 | 종목별 실시간 체결 |\n`
  md += `| 실시간 호가 | ws://ops.koreainvestment.com:21000 | 매수/매도 호가잔량 |\n`
  md += `| 프로그램 매매 | ws://ops.koreainvestment.com:21000 | 프로그램 매매 종합 |\n`

  return md
}

// ─────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function main() {
  console.log('=== KIS API 전체 테스트 시작 ===\n')
  await run01_price();    await sleep(1100)
  await run02_chart();    await sleep(1100)
  await run03_investor(); await sleep(1100)
  await run04a_finance_ratio(); await sleep(1100)
  await run04b_income();  await sleep(1100)
  await run04c_balance(); await sleep(1100)
  await run05_company()

  const md = generateMarkdown()
  const outPath = path.join(__dirname, '../KIS_API_SPEC.md')
  fs.writeFileSync(outPath, md, 'utf-8')

  console.log('\n=== 결과 요약 ===')
  console.log(`✅ 성공: ${results.filter(r => r.status === '✅').length}개`)
  console.log(`❌ 실패: ${results.filter(r => r.status === '❌').length}개`)
  console.log(`\n📄 리포트 저장 완료: KIS_API_SPEC.md`)
}

main().catch(console.error)
