import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #E5E8EC', background: '#F9FAFB', marginTop: 80 }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '36px 28px', color: '#8B95A1', lineHeight: 1.7 }}>
        <p style={{ fontSize: 14, color: '#4E5968', fontWeight: 600, margin: '0 0 16px' }}>
          투자그룹 플랜 | 대표자 이주원 | 사업자등록번호 658-19-01867
        </p>

        <p style={{ fontSize: 13, margin: '0 0 16px' }}>
          본 사이트에서 제공되는 모든 정보는 투자 판단의 참고자료이며, 서비스 이용에 따른 최종 책임은 이용자에게 있습니다.
        </p>

        <p style={{ fontSize: 13, margin: '0 0 16px' }}>
          개인에 따라 투자결과는 달라질 수 있으며 서비스 이용에 따른 최종책임은 이용자에게 있으니
          투자자 자신의 판단과 책임하에 최종결정을 하시기 바랍니다.
        </p>

        <ul style={{ fontSize: 13, margin: '0 0 16px', paddingLeft: 0, listStyle: 'none' }}>
          <li>※ 본 서비스는 개별적인 투자 상담과 자금운용이 불가능합니다.</li>
          <li>※ 원금에 손실이 발생할 수 있으며, 그 손실은 투자자에게 귀속됩니다.</li>
          <li>※ 본 업체는 정식 금융투자업자가 아닌 유사투자자문업자입니다.</li>
          <li>※ 투자 판단 및 책임은 이용자에게 있으며, 수익을 보장하지 않습니다.</li>
        </ul>

        <p style={{ margin: '0 0 16px' }}>
          <Link
            href="/privacy"
            style={{ fontSize: 13, fontWeight: 600, color: '#4E5968', textDecoration: 'none' }}
          >
            개인정보 처리방침
          </Link>
        </p>

        <p style={{ fontSize: 13, margin: 0 }}>
          본 페이지는 국내주식 주요 종목의 실시간 주가 흐름과
          AI 기반 종목분석 및 주가전망 정보를 제공하는 안내 페이지입니다.
          시장 데이터, 기업 공시, 거래량 및 이슈 분석을 기반으로
          투자 판단에 참고할 수 있는 정보를 제공합니다.
        </p>
      </div>
    </footer>
  )
}
