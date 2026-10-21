import { ImageIcon } from 'lucide-react'

// 운영 원칙 - photo 는 현장 사진 수령 전까지 자리표시 문구로 노출된다.
const PRINCIPLES = [
  {
    no: '01',
    title: '하나의 판단에도 충분한 근거를',
    body: ['시장 흐름을 함께 점검하고 의견을 나누며,', '데이터와 현장 경험을 바탕으로 분석합니다.'],
    photo: '투자 설명회·강연 현장 사진',
  },
  {
    no: '02',
    title: '투자자의 눈높이에서 답을 찾습니다',
    body: ['어려운 시장 흐름도 이해하기 쉽게 설명하고,', '직접 소통하며 투자에 필요한 기준을 나눕니다.'],
    photo: '전문가 분석 회의 사진',
  },
]

export default function PrinciplesSection() {
  return (
    <section style={{ background: '#0F1C3D' }}>
      <div className="home-shell home-principles">
        <h2 style={{ margin: 0, fontSize: 'var(--home-h2-size, 38px)', lineHeight: 1.4, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
          시장에서 직접 부딪히며 쌓은 기준을<br className="home-hide-m" /> 솔직하게 전합니다
        </h2>
        {PRINCIPLES.map((p, i) => (
          <div key={p.no} className={`home-principle${i % 2 ? ' home-principle-rev' : ''}`}>
            <div className="home-principle-photo">
              <ImageIcon size={34} strokeWidth={1.5} color="rgba(255,255,255,.35)" />
              <span>{p.photo}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#60A5FA' }}>운영원칙 {p.no}</div>
              <div style={{ fontSize: 'var(--home-h3-size, 30px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>{p.title}</div>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.8, color: '#93A6C9' }}>
                {p.body[0]}<br className="home-hide-m" /> {p.body[1]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
