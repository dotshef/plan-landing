import { ClipboardList, ShieldCheck, TrendingUp, type LucideIcon } from 'lucide-react'
import PageLeadForm from '@/components/common/PageLeadForm'

// 첫 화면 체험 폼 앵커 — 헤더 CTA·하단 고정 바(revealAfterId)가 이 id 를 참조한다.
export const TRIAL_FORM_ID = 'trial-form'

// 추천 성과 수치 — 공증 자료 기준. 갱신 시 이 값만 바꾼다.
const STATS = { period: '2026년 상반기', total: 287, hit: 253 }
const HIT_RATE = ((STATS.hit / STATS.total) * 100).toFixed(1)

// 공증 자료 카드 — 원본 스캔·수치 수령 전까지 대괄호 자리표시를 유지한다.
interface Proof { shot: string; value: string; meta: string; org: string; date: string }
const PROOFS: Proof[] = [
  { shot: '수익률 공증서 스캔', value: '+[ ]%', meta: '[종목] · [보유 기간]', org: '[공증 기관] 공증', date: '[공증일]' },
  { shot: '체결 내역 + 공증 확인서', value: '+[ ]%', meta: '[종목] · [보유 기간]', org: '[공증 기관] 공증', date: '[공증일]' },
  { shot: '추천 문자 원본 + 공증', value: '+[ ]%', meta: '[종목] · [보유 기간]', org: '[공증 기관] 공증', date: '[공증일]' },
  { shot: '계좌 수익률 화면 + 공증', value: '+[ ]%', meta: '[종목] · [보유 기간]', org: '[공증 기관] 공증', date: '[공증일]' },
]

const FEATURES: { icon: LucideIcon; title: string; desc: string; bg: string; color: string }[] = [
  { icon: ShieldCheck,   title: '실제 매매내역', desc: '발송 기록 대조', bg: '#EAF1FE', color: '#1B6CF2' },
  { icon: TrendingUp,    title: `목표가 도달 ${HIT_RATE}%`, desc: '청산 종목 기준', bg: '#FCEEED', color: '#E8342B' },
  { icon: ClipboardList, title: '손절까지 공개', desc: '전체 이력 열람', bg: '#FFF4E0', color: '#D97706' },
]

export default function ProofHeroSection() {
  return (
    <section style={{ background: '#fff' }}>
      <SealDefs />
      <div className="home-hero">
        <div className="home-hero-wall" aria-label="회원 수익률 공증 자료">
          {PROOFS.map((p, i) => <ProofCard key={i} p={p} />)}
        </div>

        <div className="home-hero-copy">
          <span style={{ alignSelf: 'flex-start', padding: '7px 14px', borderRadius: 999, background: '#EAF1FE', color: '#1B6CF2', fontSize: 'var(--hero-badge-size, 15px)', fontWeight: 600, fontFamily: 'var(--font-maruburi), var(--font-pretendard), sans-serif' }}>
            {STATS.period} 추천 종목 수익률 공증 완료
          </span>
          <h1 style={{ margin: 0, fontSize: 'var(--hero-title-size, 50px)', lineHeight: 1.25, fontWeight: 800, letterSpacing: '-0.03em', color: '#111827' }}>
            말이 아닌<br />
            <span style={{ color: '#1B6CF2' }}>결과</span>로 증명합니다
          </h1>
          <p style={{ margin: 0, fontSize: 'var(--hero-lead-size, 18px)', lineHeight: 1.7, color: '#4E5968', fontWeight: 500 }}>
            <span className="home-hero-ln">플랜이 추천한 종목 <b style={{ color: '#111827' }}>{STATS.total}개</b> 중 </span>
            <span className="home-hero-ln"><b style={{ color: '#E8342B' }}>{STATS.hit}개가 목표가에 도달</b>했습니다.</span>
            <br className="home-hero-br" />
            <span className="home-hero-ln">손절한 종목까지 빠짐없이 공개합니다.</span>
          </p>
        </div>

        <div className="home-hero-features">
          {FEATURES.map((f) => (
            <div key={f.desc} className="home-hero-feature">
              <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: f.bg }}>
                <f.icon size={20} color={f.color} />
              </div>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 'var(--hero-feature-size, 14.5px)', fontWeight: 700, color: '#111827' }}>{f.title}</div>
                <div className="feature-desc" style={{ fontSize: 12.5, color: '#8B95A1' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div id={TRIAL_FORM_ID} className="home-hero-form">
          <PageLeadForm
            sourcePage="main"
            progressive
            title="추천주 7일 무료 체험"
            badge={<span style={{ padding: '4px 10px', borderRadius: 6, background: '#FCEEED', color: '#E8342B', fontSize: 12, fontWeight: 700 }}>선착순 마감</span>}
            subtitle="매수·매도 타이밍을 장 시작 전 문자로 받아보세요"
            submitLabel="7일 무료 체험 시작하기"
            successMessage="담당자가 곧 연락드리겠습니다. 7일 뒤 자동으로 종료되며, 수신 거부는 언제든 가능합니다."
          />
        </div>
      </div>
    </section>
  )
}

function ProofCard({ p }: { p: Proof }) {
  return (
    <article className="home-proof">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="home-proof-chip" style={{ padding: '4px 10px', borderRadius: 6, background: '#EAF1FE', color: '#1B6CF2', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>수익률 공증 자료</span>
        <span className="home-proof-date" style={{ fontSize: 12.5, color: '#8B95A1' }}>{p.date}</span>
      </div>
      <div className="home-proof-doc" aria-label={p.shot}>
        <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', color: '#4E5968' }}>[{p.shot}]</div>
        <i /><i style={{ width: '85%' }} /><i /><i style={{ width: '60%' }} />
      </div>
      <div className="home-proof-value">{p.value}</div>
      <div className="home-proof-meta">{p.meta}</div>
      <div className="home-proof-org">{p.org} · {p.date}</div>
      <svg className="home-proof-seal" role="img" aria-label="수익률 공증 인증 마크"><use href="#cert-seal" /></svg>
    </article>
  )
}

// 금박 인증 마크 — 카드마다 <use> 로 재사용하도록 정의는 한 번만 렌더한다.
function SealDefs() {
  const rays = Array.from({ length: 48 }, (_, i) => {
    const r = i % 2 === 0 ? 48 : 42.6
    const a = (Math.PI * 2 * i) / 48 - Math.PI / 2
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="cert-seal-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBE9A6" /><stop offset=".35" stopColor="#D9A92E" /><stop offset=".6" stopColor="#F6D879" /><stop offset="1" stopColor="#A47312" />
        </linearGradient>
        <linearGradient id="cert-seal-gold2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#B8861B" /><stop offset=".5" stopColor="#F1CF6A" /><stop offset="1" stopColor="#C79524" />
        </linearGradient>
        <symbol id="cert-seal" viewBox="0 0 100 124">
          <polygon points="30,70 22,122 36,112 46,124 50,80" fill="#1B6CF2" />
          <polygon points="70,70 78,122 64,112 54,124 50,80" fill="#0B3E9E" />
          <polygon fill="url(#cert-seal-gold)" points={rays} />
          <circle cx="50" cy="50" r="36" fill="url(#cert-seal-gold2)" stroke="#8C6310" strokeWidth="1" />
          <circle cx="50" cy="50" r="31" fill="none" stroke="#FFF3C4" strokeWidth="1.2" strokeDasharray="2 2.5" />
          <text x="50" y="44" textAnchor="middle" fontSize="10" fontWeight="700" fill="#5C3D00">수익률</text>
          <text x="50" y="60" textAnchor="middle" fontSize="14" fontWeight="800" fill="#5C3D00">공증</text>
          <text x="50" y="71" textAnchor="middle" fontSize="7" fontWeight="700" fill="#6B4A06">CERTIFIED</text>
        </symbol>
      </defs>
    </svg>
  )
}
