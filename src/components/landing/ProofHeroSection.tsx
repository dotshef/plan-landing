import { ClipboardList, ImageIcon, ShieldCheck, TrendingUp, type LucideIcon } from 'lucide-react'
import PageLeadForm from '@/components/common/PageLeadForm'

// 첫 화면 체험 폼 앵커 - 헤더 CTA·하단 고정 바(revealAfterId)가 이 id 를 참조한다.
export const TRIAL_FORM_ID = 'trial-form'

// 추천 성과 수치 - 공증 자료 기준. 갱신 시 이 값만 바꾼다.
const STATS = { period: '2026년 상반기', total: 287, hit: 253 }
const HIT_RATE = ((STATS.hit / STATS.total) * 100).toFixed(1)

// 공증 자료 이미지 - 원본 수령 시 src 를 채운다(/public 경로). src 가 없으면 빈 자리표시 카드로 렌더한다.
interface ProofImage { src?: string; alt: string }
const PROOF_IMAGES: ProofImage[] = Array.from({ length: 8 }, (_, i) => ({ alt: `회원 수익률 공증 자료 ${i + 1}` }))

// 지그재그 2열 - 짝수 번째는 왼쪽, 홀수 번째는 오른쪽 열에 놓는다.
const PROOF_COLUMNS = [0, 1].map((c) => PROOF_IMAGES.filter((_, i) => i % 2 === c))

const FEATURES: { icon: LucideIcon; title: string; desc: string; bg: string; color: string }[] = [
  { icon: ShieldCheck,   title: '실제 매매내역', desc: '발송 기록 대조', bg: '#EAF1FE', color: '#1B6CF2' },
  { icon: TrendingUp,    title: `목표가 도달 ${HIT_RATE}%`, desc: '청산 종목 기준', bg: '#FCEEED', color: '#E8342B' },
  { icon: ClipboardList, title: '손절까지 공개', desc: '전체 이력 열람', bg: '#FFF4E0', color: '#D97706' },
]

export default function ProofHeroSection() {
  return (
    <section style={{ background: '#fff' }}>
      <div className="home-hero">
        <div className="home-hero-wall" aria-label="회원 수익률 공증 자료">
          {PROOF_COLUMNS.map((col, c) => (
            <div key={c} className="home-proof-col">
              {/* 열 목록을 두 번 이어붙여 끊김 없이 순환. 오른쪽 열은 반 칸 앞서 출발해 지그재그로 엇갈린다. */}
              <div className="home-proof-track" style={c === 1 ? { animationDelay: `calc(var(--proof-dur) / ${-2 * col.length})` } : undefined}>
                {[...col, ...col].map((p, i) => (
                  <div key={i} className="home-proof" aria-hidden={i >= col.length || undefined}>
                    {p.src
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.src} alt={i < col.length ? p.alt : ''} />
                      : <ImageIcon size={28} color="#C9D6EC" aria-label={i < col.length ? p.alt : undefined} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
