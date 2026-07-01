/**
 * 주식현재가 시세 (inquire-price)
 * tr_id: FHKST01010100
 * 확인 항목: 현재가, 전일대비, 등락률, 시가, 고가, 저가, 거래량, 거래대금,
 *             시가총액, PER, PBR, EPS, BPS, 52주최고/최저, 외국인보유율, 업종명
 */
const { kisGet } = require('./api')

const CODE = '005930'

async function main() {
  console.log(`\n=== [01] 주식현재가 시세 (${CODE}) ===`)
  const data = await kisGet(
    '/uapi/domestic-stock/v1/quotations/inquire-price',
    { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: CODE },
    'FHKST01010100'
  )
  const o = data.output

  const fields = {
    '현재가':       o.stck_prpr,
    '전일대비':     o.prdy_vrss,
    '등락률(%)':    o.prdy_ctrt,
    '시가':         o.stck_oprc,
    '고가':         o.stck_hgpr,
    '저가':         o.stck_lwpr,
    '거래량':       o.acml_vol,
    '거래대금':     o.acml_tr_pbmn,
    '시가총액':     o.hts_avls,
    'PER':          o.per,
    'PBR':          o.pbr,
    'EPS':          o.eps,
    'BPS':          o.bps,
    'ROE':          o.roe_val,
    '52주최고':     o.d250_hgpr,
    '52주최저':     o.d250_lwpr,
    '외국인보유율': o.hts_frgn_ehrt,
    '업종명':       o.bstp_kor_isnm,
    '전일거래량':   o.prdy_vol,
    '시장구분':     o.rprs_mrkt_kor_name,
  }

  for (const [k, v] of Object.entries(fields)) {
    console.log(`  ${k.padEnd(12)}: ${v ?? '(없음)'}`)
  }
  console.log('\n  [output 전체 키 목록]')
  console.log(' ', Object.keys(o).join(', '))
}

main().catch(console.error)
