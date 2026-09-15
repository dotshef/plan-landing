import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

// 메인 '지금 바로 받아보실 수 있는 혜택' — 신규 3개 페이지 진입 카드
const BENEFITS = [
  {
    href: '/trial',
    tag: '선착순 마감',
    tagStyle: { background: '#FCEEED', color: '#E8342B' },
    title: '추천주 7일 무료 체험',
    desc: '매수·매도 타이밍을 문자로 받아보세요',
    cta: '바로 시작하기',
    hot: true,
  },
  {
    href: '/indicators',
    tag: '초보 필수',
    tagStyle: { background: '#F2F4F6', color: '#4E5968' },
    title: '영상 속 자료 받기',
    desc: '보조지표 설정법부터 활용 기준까지',
    cta: '바로 받아보기',
    hot: false,
  },
  {
    href: '/sector',
    tag: '분기 리포트',
    tagStyle: { background: '#FFF4E0', color: '#92610A' },
    title: '이번 분기 주목받는 섹터',
    desc: '실적·수급 데이터 기준으로 정리했습니다',
    cta: '바로 받아보기',
    hot: false,
  },
]

export default function BenefitsSection() {
  return (
    <div className="responsive-section-shell" style={{ maxWidth: 1320, margin: '0 auto', padding: 'var(--section-padding, 24px 28px 8px)' }}>
      <div className="responsive-section-card" style={{ background: '#EAF1FE', border: '1px solid #D6E4FC', borderRadius: 18, padding: 'var(--card-padding, 26px 28px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>지금 바로 받아보실 수 있는 혜택</div>
        </div>
        <div className="responsive-card-grid-4" style={{ display: 'grid', gridTemplateColumns: 'var(--grid-columns, repeat(3,1fr))', gap: 16 }}>
          {BENEFITS.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              style={{
                display: 'flex', flexDirection: 'column',
                border: '1.5px solid #9BC0F5',
                borderRadius: 14, padding: 20, background: '#fff', textDecoration: 'none',
              }}
            >
              <span style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, ...b.tagStyle }}>{b.tag}</span>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '14px 0 6px' }}>{b.title}</div>
              <div style={{ fontSize: 13.5, color: '#6B7684', lineHeight: 1.6 }}>{b.desc}</div>
              <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', alignItems: 'center', gap: 3, fontSize: 14.5, fontWeight: 800, color: '#1B6CF2' }}>
                {b.cta} <ChevronRight size={16} strokeWidth={2.5} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
