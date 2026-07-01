/**
 * 종목기본정보 (search-stock-info)
 * tr_id: CTPF1002R
 * 확인 항목: 종목명, 업종, 상장일, 자본금, 주식수 등
 */
const { kisGet } = require('./api')

const CODE = '005930'

async function main() {
  console.log(`\n=== [05] 종목기본정보 (${CODE}) ===`)
  const data = await kisGet(
    '/uapi/domestic-stock/v1/quotations/search-stock-info',
    { PRDT_TYPE_CD: '300', PDNO: CODE },
    'CTPF1002R'
  )
  const o = data.output ?? {}

  const fields = {
    '종목명':       o.prdt_abrv_name,
    '영문명':       o.prdt_eng_abrv_name,
    '업종코드':     o.std_idst_clsf_cd,
    '업종명':       o.std_idst_clsf_cd_name,
    '상장주식수':   o.lstg_stqt,
    '상장일':       o.scts_mket_lstg_dt,
    '자본금':       o.cpfn,
    '결산월':       o.stck_fcam,
    '시장구분':     o.mket_id_cd,
  }

  for (const [k, v] of Object.entries(fields)) {
    console.log(`  ${k.padEnd(10)}: ${v ?? '(없음)'}`)
  }
  console.log('\n  [output 전체 키 목록]')
  console.log(' ', Object.keys(o).join(', '))
}

main().catch(console.error)
