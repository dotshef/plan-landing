/**
 * 주식현재가 투자자 (inquire-investor)
 * tr_id: FHKST01010900
 * 확인 항목: 개인/외국인/기관 순매수 수량 및 금액
 */
const { kisGet } = require('./api')

const CODE = '005930'

async function main() {
  console.log(`\n=== [03] 투자자매매동향 (${CODE}) ===`)
  const data = await kisGet(
    '/uapi/domestic-stock/v1/quotations/inquire-investor',
    { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: CODE },
    'FHKST01010900'
  )

  const list = data.output ?? []
  console.log(`  수신 데이터 수: ${list.length}건 (일자별)`)
  if (list.length > 0) {
    const s = list[0]
    console.log('\n  [최근 1건 샘플]')
    const fields = {
      '날짜':         s.stck_bsop_date,
      '개인순매수량': s.prsn_ntby_qty,
      '외국인순매수': s.frgn_ntby_qty,
      '기관순매수':   s.orgn_ntby_qty,
      '개인순매수금': s.prsn_ntby_tr_pbmn,
      '외국인순매수금': s.frgn_ntby_tr_pbmn,
      '기관순매수금': s.orgn_ntby_tr_pbmn,
    }
    for (const [k, v] of Object.entries(fields)) {
      console.log(`  ${k.padEnd(14)}: ${v ?? '(없음)'}`)
    }
    console.log('\n  [output 키 목록]')
    console.log(' ', Object.keys(s).join(', '))
  }
}

main().catch(console.error)
