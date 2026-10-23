import type { Metadata } from 'next'
import Image from 'next/image'
import { Playfair_Display } from 'next/font/google'
import { Wallet, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react'
import FadeUp from '@/components/common/FadeUp'
import PageLeadForm from '@/components/common/PageLeadForm'
import StickyLeadBar from '@/components/landing/StickyLeadBar'
import { listIncomeProofs } from '@/lib/income/proofs'
import s from './income.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '투자그룹 플랜 - 두 번째 월급',
  description: '월급만으로는 아쉽다면, 돈이 돈을 버는 구조를 시작하세요. 투자 전자책·자산 황금비율 리포트·재테크 진단 3종을 무료로 드립니다.',
  alternates: { canonical: '/income' },
}

// 'Forbes' 워드마크·메달 영문 문구에만 사용 - 굵기 하나만 로드
const playfair = Playfair_Display({ subsets: ['latin'], weight: '900', display: 'swap' })

const APPLY_ID = 'apply'

const C = {
  blue: '#1B6EF3',
  blue50: '#EEF4FF',
  blue100: '#E3EDFE',
  blueLine: '#CFDFFB',
  ink: '#111827',
  ink2: '#374151',
  gray: '#6B7280',
  line: '#E5E7EB',
  bgSoft: '#F7F9FC',
  red: '#E5383B',
  redBg: '#FDECEC',
  redInk: '#C62828',
  greenBg: '#DCFCE7',
  greenInk: '#15803D',
}

const chip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }

// 사례 카드 아이콘 - DB 행 순서대로 돌려 쓴다
const PROOF_ICONS = [Wallet, CreditCard, ShieldCheck]

const STEPS = [
  { no: '01', title: '나에게 딱 맞춤 전략', desc: '소득·지출·목표에 맞춰 내 상황에 꼭 맞는 돈 관리 방향부터 세웁니다.' },
  { no: '02', title: '지속 가능한 투자 시스템', desc: '한 번의 운이 아니라, 매달 반복할 수 있는 원칙과 습관으로 돈을 불립니다.' },
  { no: '03', title: '월급 외 소득 흐름 만들기', desc: '일하지 않는 시간에도 돈이 들어오도록, 월급과 별개인 두 번째 소득을 만듭니다.' },
]

const BENEFITS = [
  { no: '01', title: '투자 전자책 『월급은 한 번, 돈은 여러 번』', desc: '돈을 불리는 순서를 처음부터 정리한 실전 가이드' },
  { no: '02', title: '자산 황금비율 리포트', desc: '내 나이·소득에 맞는 생활비·비상금·불리는 돈 비율을 한 장으로' },
  { no: '03', title: '재테크 진단 받아보기', desc: '몇 가지 질문으로 지금 내 돈 관리 상태와 바꿀 부분을 확인합니다' },
]

// 메달 둘레 톱니(48개)
const MEDAL_RIM = '100.0,3.0 107.8,11.3 116.8,4.5 123.0,14.0 133.2,8.8 137.6,19.3 148.5,16.0 151.0,27.1 162.4,25.7 162.9,37.1 174.3,37.6 172.9,49.0 184.0,51.5 180.7,62.4 191.2,66.8 186.0,77.0 195.5,83.2 188.7,92.2 197.0,100.0 188.7,107.8 195.5,116.8 186.0,123.0 191.2,133.2 180.7,137.6 184.0,148.5 172.9,151.0 174.3,162.4 162.9,162.9 162.4,174.3 151.0,172.9 148.5,184.0 137.6,180.7 133.2,191.2 123.0,186.0 116.8,195.5 107.8,188.7 100.0,197.0 92.2,188.7 83.2,195.5 77.0,186.0 66.8,191.2 62.4,180.7 51.5,184.0 49.0,172.9 37.6,174.3 37.1,162.9 25.7,162.4 27.1,151.0 16.0,148.5 19.3,137.6 8.8,133.2 14.0,123.0 4.5,116.8 11.3,107.8 3.0,100.0 11.3,92.2 4.5,83.2 14.0,77.0 8.8,66.8 19.3,62.4 16.0,51.5 27.1,49.0 25.7,37.6 37.1,37.1 37.6,25.7 49.0,27.1 51.5,16.0 62.4,19.3 66.8,8.8 77.0,14.0 83.2,4.5 92.2,11.3'

// 월계수 잎 [cx, cy, rotate]
const LAURELS: [number, number, number][] = [
  [85.0, 156.0, 165], [71.9, 150.7, 179], [60.4, 142.4, 193], [51.4, 131.6, 207], [45.2, 118.9, 221], [42.2, 105.1, 235], [42.7, 90.9, 249],
  [115.0, 156.0, 195], [128.1, 150.7, 181], [139.6, 142.4, 167], [148.6, 131.6, 153], [154.8, 118.9, 139], [157.8, 105.1, 125], [157.3, 90.9, 111],
]

function Medal() {
  const serif = `${playfair.style.fontFamily}, Georgia, serif`
  return (
    <svg className={s.medal} viewBox="0 0 200 250" role="img" aria-label="2026 최고의 브랜드 대상 금메달"
      style={{ filter: 'drop-shadow(0 10px 14px rgba(120,80,10,.35)) drop-shadow(0 2px 3px rgba(0,0,0,.2))' }}>
      <defs>
        <radialGradient id="mgBody" cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#FFF8D6" /><stop offset=".22" stopColor="#F8DC7A" /><stop offset=".55" stopColor="#D9A93A" /><stop offset=".85" stopColor="#A97716" /><stop offset="1" stopColor="#7A520A" /></radialGradient>
        <linearGradient id="mgRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF3B8" /><stop offset=".18" stopColor="#C8921F" /><stop offset=".36" stopColor="#FFE48A" /><stop offset=".52" stopColor="#9C6A12" /><stop offset=".7" stopColor="#F6D06A" /><stop offset=".88" stopColor="#B07C18" /><stop offset="1" stopColor="#FFE9A0" /></linearGradient>
        <linearGradient id="mgFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBE59A" /><stop offset=".45" stopColor="#E6B94A" /><stop offset="1" stopColor="#C08A22" /></linearGradient>
        <radialGradient id="mgSpec" cx="35%" cy="25%" r="45%"><stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset=".5" stopColor="#fff" stopOpacity=".18" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id="mgRibL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7E0F14" /><stop offset=".45" stopColor="#D3262E" /><stop offset="1" stopColor="#9E151B" /></linearGradient>
        <linearGradient id="mgRibR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#A3161C" /><stop offset=".55" stopColor="#E0343B" /><stop offset="1" stopColor="#7A0E12" /></linearGradient>
        <linearGradient id="mgSweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".75" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <clipPath id="mgClip"><circle cx="100" cy="100" r="88" /></clipPath>
      </defs>
      <path d="M62 150 L40 240 L60 226 L72 248 L96 168 Z" fill="url(#mgRibL)" />
      <path d="M138 150 L160 240 L140 226 L128 248 L104 168 Z" fill="url(#mgRibR)" />
      <path d="M62 150 L68 158 L96 168 Z M138 150 L132 158 L104 168 Z" fill="#000" opacity=".25" />
      <polygon points={MEDAL_RIM} fill="url(#mgRim)" stroke="#7A520A" strokeWidth=".8" />
      <circle cx="100" cy="100" r="84" fill="url(#mgBody)" />
      <circle cx="100" cy="100" r="74" fill="none" stroke="#8A5E10" strokeWidth="2.4" opacity=".55" />
      <circle cx="100" cy="100" r="72" fill="url(#mgFace)" />
      <circle cx="100" cy="100" r="72" fill="none" stroke="#FFF4C4" strokeWidth="1.2" opacity=".9" />
      <circle cx="100" cy="100" r="67" fill="none" stroke="#9A6A12" strokeWidth="1" strokeDasharray="1.5 3" opacity=".5" />
      <g fill="#9A6A12" opacity=".85">
        {LAURELS.map(([cx, cy, r]) => (
          <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="2.8" ry="6.5" transform={`rotate(${r} ${cx} ${cy})`} />
        ))}
      </g>
      <g fontFamily={serif} textAnchor="middle" fontSize="11" fontWeight="900" letterSpacing="1.5">
        <text x="100" y="76" fill="#FFF3C0" opacity=".7" transform="translate(0 1)">BEST BRAND</text>
        <text x="100" y="76" fill="#5C3A00">BEST BRAND</text>
      </g>
      <g textAnchor="middle" fontWeight="900">
        <text x="100" y="111" fontSize="30" fill="#FFF3C0" opacity=".75" transform="translate(0 1.2)">2026</text>
        <text x="100" y="111" fontSize="30" fill="#4A2E00">2026</text>
        <text x="100" y="138" fontSize="22" fill="#FFF3C0" opacity=".75" transform="translate(0 1.2)">대상</text>
        <text x="100" y="138" fontSize="22" fill="#4A2E00">대상</text>
      </g>
      <ellipse cx="78" cy="62" rx="58" ry="40" fill="url(#mgSpec)" clipPath="url(#mgClip)" />
      <g clipPath="url(#mgClip)">
        <rect x="-60" y="0" width="40" height="200" fill="url(#mgSweep)" transform="skewX(-20)">
          <animate attributeName="x" values="-80;260;260" keyTimes="0;.45;1" dur="3.8s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>
  )
}

// 아래쪽에 드러나는 금화 두께와 옆면 홈.
const COIN_REEDS = Array.from({ length: 49 }, (_, i) => {
  const a = Math.PI / 2 + (i * Math.PI) / 48
  return { x: 50 + 45.5 * Math.sin(a), y: 47 - 45.5 * Math.cos(a) }
})

const COIN_LEAVES = Array.from({ length: 8 }, (_, i) => {
  const a = ((20 + i * 15) * Math.PI) / 180
  return { x: 31 * Math.sin(a), y: 47 + 31 * Math.cos(a), angle: i * 15 - 35 }
})

// 둥근 주화 테두리, 홈이 있는 옆면, 월계수와 금색 양각 번호.
function Coin({ no, index }: { no: string; index: number }) {
  const id = (k: string) => `coin${index}${k}`
  return (
    <svg className={`${s.num} ${s.benefitCirc}`} viewBox="0 0 112 112" aria-hidden
      style={{ flex: 'none', overflow: 'visible', filter: 'drop-shadow(1px 4px 3px rgba(110,72,8,.24))' }}>
      <defs>
        <linearGradient id={id('Edge')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8C5908" /><stop offset=".16" stopColor="#E9B51C" /><stop offset=".33" stopColor="#FFF087" /><stop offset=".5" stopColor="#B57C08" /><stop offset=".72" stopColor="#F8D647" /><stop offset=".9" stopColor="#98600A" /><stop offset="1" stopColor="#EBC33C" />
        </linearGradient>
        <linearGradient id={id('Rim')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF7A1" /><stop offset=".16" stopColor="#F8D53F" /><stop offset=".3" stopColor="#B77A08" /><stop offset=".43" stopColor="#FFF59A" /><stop offset=".6" stopColor="#E6B020" /><stop offset=".74" stopColor="#94600C" /><stop offset=".88" stopColor="#FFE57E" /><stop offset="1" stopColor="#C68A12" />
        </linearGradient>
        <linearGradient id={id('Face')} x1="0" y1="0" x2=".85" y2="1">
          <stop offset="0" stopColor="#FFF19A" /><stop offset=".25" stopColor="#F4D239" /><stop offset=".48" stopColor="#E3B51E" /><stop offset=".72" stopColor="#FFE76B" /><stop offset="1" stopColor="#D4A015" />
        </linearGradient>
        <linearGradient id={id('Relief')} x1="0" y1="0" x2=".6" y2="1">
          <stop offset="0" stopColor="#FFF6AD" /><stop offset=".45" stopColor="#FCE578" /><stop offset="1" stopColor="#C18A0B" />
        </linearGradient>
      </defs>
      <g transform="translate(6 9) rotate(-10 50 50) scale(1 .9)">
        <circle cx="50" cy="54" r="46" fill={`url(#${id('Edge')})`} stroke="#9A690C" strokeWidth=".8" />
        <g stroke="#80520B" strokeWidth=".65" opacity=".7">
          {COIN_REEDS.map(({ x, y }, i) => <line key={i} x1={x} y1={y} x2={x} y2={y + 7} />)}
        </g>
        <path d="M4 55 A46 46 0 0 0 96 55" fill="none" stroke="#FFE477" strokeWidth=".8" />
        <circle cx="50" cy="47" r="46" fill={`url(#${id('Rim')})`} stroke="#C28D0C" strokeWidth=".7" />
        <circle cx="50" cy="47" r="43.8" fill="none" stroke="#FFF4A3" strokeWidth="1" />
        <circle cx="50" cy="47" r="41.8" fill={`url(#${id('Face')})`} stroke="#AE7A09" strokeWidth=".8" />
        <circle cx="50" cy="47" r="39.3" fill="none" stroke="#FFF18F" strokeWidth=".75" />
        <circle cx="50" cy="47" r="37.6" fill="none" stroke="#AD7C0A" strokeWidth=".65" strokeDasharray=".5 2.4" />
        <g fill="none" stroke="#AD7C0A" strokeWidth=".85">
          <path d="M46 78 C21 68 17 42 29 24 M54 78 C79 68 83 42 71 24" />
          <path d="M43 78 Q50 74 57 78" />
        </g>
        {COIN_LEAVES.flatMap(({ x, y, angle }, i) => [-1, 1].map((side) => (
          <ellipse key={`${i}-${side}`} cx={50 + side * x} cy={y} rx="1.8" ry="4.1"
            transform={`rotate(${-side * angle} ${50 + side * x} ${y})`}
            fill={`url(#${id('Relief')})`} stroke="#B1820E" strokeWidth=".55" />
        )))}
        <circle cx="50" cy="47" r="22" fill="none" stroke="#AE7A09" strokeWidth=".65" />
        <circle cx="50" cy="46.4" r="21.4" fill="none" stroke="#FFF099" strokeWidth=".65" />
        <g textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="31" fontWeight="700" letterSpacing="-1.5">
          <text x="50.7" y="59.5" fill="#A7770A" stroke="#A7770A" strokeWidth=".7">{no}</text>
          <text x="49.6" y="58.1" fill="#FFF6AC">{no}</text>
          <text x="50" y="58.6" fill={`url(#${id('Relief')})`}>{no}</text>
        </g>
        <path d="M15 26 A41 41 0 0 1 63 8" fill="none" stroke="#FFF9C0" strokeWidth="1.4" strokeLinecap="round" opacity=".8" />
      </g>
    </svg>
  )
}

export default async function IncomePage() {
  const proofs = await listIncomeProofs().catch(() => [])

  return (
    <div style={{ background: '#fff', color: C.ink }}>
      {/* 1. 히어로 */}
      <section>
        <div className={`${s.wrap} ${s.hero}`}>
          <div className={s.heroCopy}>
            <span style={{ ...chip, alignSelf: 'flex-start', background: C.redBg, color: C.redInk, borderRadius: 999, padding: '6px 14px' }}>
              이번 달 수익 인증 <b className={s.num} style={{ marginLeft: 4 }}>1,873건</b>
            </span>
            <h1 className={s.h1}>
              아직도 <span style={{ background: 'linear-gradient(transparent 62%, #FDE68A 62%)' }}>일한 만큼만</span> 버시나요?<br />
              <span style={{ color: C.blue }}>돈이 돈을 버는 구조</span>를<br />시작하세요
            </h1>
            <p className={s.lead} style={{ margin: 0 }}>
              <span className={s.ln}>월급만으로는 아쉽다고 느끼셨나요?</span>{' '}
              <span className={s.ln}>그렇다면 지금, <b style={{ color: C.blue }}>새로운 가능성</b>을 확인해보세요.</span>
            </p>
          </div>

          <div className={s.heroCard}>
            <div className={s.feature} style={{ background: C.blue50, border: `3px solid ${C.blue}`, borderRadius: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ ...chip, background: C.red, color: '#fff' }}>3개월 만에 생긴 두 번째 월급</span>
                <span style={{ fontSize: 13, color: C.gray }}>자영업자 · 50대 · 2026.10.15 인증</span>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, padding: 22, marginTop: 16 }}>
                <div className={s.featureBig} style={{ fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.3 }}>
                  월급날이<br />한 달에 <span style={{ color: C.blue }}>두 번</span>이 됐습니다
                </div>
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.gray, marginBottom: 5 }}>본업 수입</div>
                    <div style={{ height: 14, borderRadius: 7, background: '#D1D5DB' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.blue, fontWeight: 700, marginBottom: 5 }}>
                      <span>두 번째 통장</span><span>본업에 거의 다다름</span>
                    </div>
                    <div style={{ height: 14, borderRadius: 7, background: C.blue100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '86%', borderRadius: 7, background: `linear-gradient(90deg, #8DB3F7, ${C.blue})` }} />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 18, borderRadius: 14, overflow: 'hidden' }}>
                  <Image
                    src="/images/plan-deposit-notifications-example.png"
                    alt="스마트폰 입금 알림 가상 예시: 파란색 배경에 노란색·파란색 은행 알림 두 개가 표시되며, 은행 아이콘과 개인정보·금액은 블러 처리되어 있습니다."
                    width={1586}
                    height={992}
                    sizes="(max-width: 960px) 90vw, 440px"
                    loading="eager"
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                  />
                </div>
                <div style={{ marginTop: 14, fontSize: 13, color: C.ink2, textAlign: 'center', background: C.bgSoft, borderRadius: 10, padding: 10 }}>
                  실제 금액과 방법은 <b style={{ color: C.blue }}>무료 혜택 신청 시</b> 확인하실 수 있습니다
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 10 }}>
                ※ 입금 알림은 가상 예시 이미지이며, 투자 결과를 보장하지 않습니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 수상 + 숫자 */}
      <section style={{ paddingBottom: 32 }}>
        <div className={s.wrap} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className={s.awardBox} style={{ background: 'linear-gradient(135deg, #FFFDF5, #FFF6DA)', boxShadow: '0 0 0 3px #E2B74A inset, 0 24px 50px rgba(8,24,74,.18)' }}>
            <div className={s.awardRow}>
              <div className={s.certWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={s.cert} src="/images/award-cert.jpg" alt="2026 소비자선정 최고의 브랜드 대상 인증서 (중앙일보S)"
                  style={{ display: 'block', height: 'auto', borderRadius: 4, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.08), 0 16px 32px rgba(140,99,16,.18)' }} />
                <Medal />
              </div>
              <div className={s.awardMid}>
                <div className={s.awardBrand}>
                  <span className={`${playfair.className} ${s.awardForbes}`}>Forbes</span>
                  <span className={`${s.awardOrganizer} ${s.awardTitle}`}>중앙일보 S 주관</span>
                </div>
                <div className={s.awardTitle} style={{ marginTop: 8 }}>
                  <span className={s.ln}>2026 소비자선정</span> <span className={s.ln}>최고의 브랜드 대상</span>
                </div>
                <div className={s.awardSub} style={{ color: '#6B4A06', fontWeight: 700, marginTop: 8 }}>금융서비스 부문 · 투자그룹 플랜 수상</div>
                <div style={{ fontSize: 13, color: '#8C7340', marginTop: 6 }}>소비자 조사와 전문가 심사로 선정 · 제26-58호 · 2026.02.27</div>
              </div>
            </div>
          </div>

          <div className={s.stats} style={{ background: 'linear-gradient(90deg, #FFF1F1, #FFF8E6)', textAlign: 'center' }}>
            {[
              { v: '325', u: '만원', label: '회원 평균 월 수익', color: C.red },
              { v: '1,458', u: '명', label: '혜택 수령 회원', color: C.ink },
              { v: '0', u: '원', label: '혜택 3종 비용', color: C.blue },
            ].map((st, i) => (
              <div key={st.label} style={i === 1 ? { borderLeft: '1px solid #F3D6C2', borderRight: '1px solid #F3D6C2' } : undefined}>
                <div className={`${s.num} ${s.statNum}`} style={{ fontWeight: 900, color: st.color }}>
                  {st.v}<span style={{ fontSize: '0.45em' }}>{st.u}</span>
                </div>
                <div className={s.statLbl} style={{ color: C.ink2, fontWeight: 700 }}>{st.label}</div>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: C.gray, textAlign: 'center' }}>
            ※ 게시된 결과는 개별 회원의 사례이며 소득이나 수익을 보장하지 않습니다.
          </p>
        </div>
      </section>

      {/* 2. 신청 폼 */}
      <section style={{ paddingBottom: 24 }}>
        <div className={s.wrap}>
          <div id={APPLY_ID} style={{ maxWidth: 560, margin: '0 auto' }}>
            <PageLeadForm
              sourcePage="income"
              title="무료 혜택 3종 신청"
              subtitle="입력하신 정보는 혜택 발송에만 사용됩니다"
              badge={<span style={{ ...chip, background: C.redBg, color: C.redInk }}>이번 달 선착순</span>}
              submitLabel="무료로 받아보기"
              successMessage="신청하신 무료 혜택 3종을 입력하신 연락처로 보내드리겠습니다."
            />
          </div>
        </div>
      </section>

      {/* 3. 실제 결과 (사례가 없으면 섹션 숨김) */}
      {proofs.length > 0 && (
      <section className={s.sec} style={{ background: C.bgSoft }}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <div>
              <div className={s.kicker} style={{ color: C.red }}>REAL CHANGE</div>
              <h2 className={s.h2}>통장이 바뀌자<br /><span style={{ color: C.red }}>인생</span>이 바뀐 사람들</h2>
            </div>
            <div style={{ fontSize: 14, color: C.gray, lineHeight: 1.7 }}>
              모든 사례는 회원 동의 하에 게시되며 사진과 개인정보는 일부 가림 처리됩니다.
            </div>
          </div>
          <div className={s.proofs}>
            {proofs.map((p, i) => {
              const Icon = PROOF_ICONS[i % PROOF_ICONS.length]
              return (
              <article key={p.id} className={s.proof} style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: C.gray }}>{p.job} · {p.age_group}대 · 가입 {p.member_months}개월</span>
                  <span style={{ ...chip, background: C.greenBg, color: C.greenInk, fontSize: 12 }}>인증 완료</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon size={24} color={C.red} strokeWidth={2} aria-hidden />
                  </span>
                  <div className={s.proofHead} style={{ fontWeight: 900, lineHeight: 1.3, letterSpacing: '-0.03em', whiteSpace: 'pre-line' }}>{p.title}</div>
                </div>
                {/* 8:5 프레임 고정 - 비율이 다른 이미지는 가운데 기준으로 잘림 */}
                <div style={{ aspectRatio: '8 / 5', border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image_url} alt={`${p.job} ${p.age_group}대 회원 계좌 입금 내역`} loading="lazy"
                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {p.tags.map((t) => (
                    <span key={t} style={{ fontSize: 13, fontWeight: 700, color: C.blue, background: C.blue50, padding: '5px 10px', borderRadius: 999 }}>#{t.replace(/^#/, '')}</span>
                  ))}
                </div>
              </article>
              )
            })}
          </div>
        </div>
      </section>
      )}

      {/* 4. 소득을 만드는 구조 */}
      <section className={s.sec}>
        <div className={s.wrap}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className={s.kicker}>INCOME STRUCTURE</div>
            <h2 className={s.h2}>버는 사람은 더 버는 이유,<br /><span style={{ color: C.blue }}>구조</span>가 다릅니다</h2>
            <p className={s.lead} style={{ margin: '14px 0 0' }}>무작정 많이 버는 것보다, 새지 않고 굴러가는 구조가 먼저입니다.</p>
          </div>
          <div className={s.steps}>
            {STEPS.map((st, i) => {
              const last = i === STEPS.length - 1
              return [
                i > 0 && (
                  <FadeUp key={`arrow-${st.no}`} className={s.arrow} delay={i * 0.15 - 0.075}>
                    <ArrowRight size={28} color="#9DBDF8" strokeWidth={2.5} aria-hidden />
                  </FadeUp>
                ),
                <FadeUp key={st.no} className={s.step} delay={i * 0.15} style={{ borderRadius: 20, border: `1px solid ${last ? C.blue : C.blueLine}`, background: last ? C.blue : '#fff', color: last ? '#fff' : C.ink }}>
                  <div className={`${s.num} ${s.stepNo}`} style={{ borderRadius: 16, background: last ? 'rgba(255,255,255,.2)' : C.blue100, color: last ? '#fff' : C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {st.no}
                  </div>
                  <div>
                    <h3 className={s.stepTitle} style={{ letterSpacing: '-0.02em' }}>{st.title}</h3>
                    <p className={s.stepDesc} style={{ color: last ? '#DCE8FE' : C.gray, lineHeight: 1.65 }}>{st.desc}</p>
                  </div>
                </FadeUp>,
              ]
            })}
          </div>
        </div>
      </section>

      {/* 5. 받아보는 것 */}
      <section className={s.sec}>
        <div className={`${s.wrap} ${s.benefitsRow}`}>
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <div className={s.kicker}>FREE 3 BENEFITS</div>
            <h2 className={s.h2}>지금 신청하면<br /><span style={{ background: 'linear-gradient(transparent 62%, #FDE68A 62%)' }}>3가지 혜택</span>을 무료로</h2>
            <p className={s.lead} style={{ margin: '14px 0 0' }}>
              <b style={{ color: C.blue }}>돈이 돈을 버는 구조</b>, 혼자 찾지 말고 <b style={{ color: C.blue }}>정리된 방법</b>으로 시작하세요.
            </p>
          </div>
          <div style={{ flex: '1 1 520px', minWidth: 0, background: '#F2F3F6', borderRadius: 24, padding: 'clamp(16px, 3vw, 28px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {BENEFITS.map((b, i) => (
              <div key={b.no} className={s.benefit} style={{ background: '#fff', borderRadius: 18, display: 'flex', alignItems: 'center' }}>
                <Coin no={b.no} index={i} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={s.benefitTitle} style={{ fontWeight: 800 }}>{b.title}</div>
                  <div className={s.benefitDesc} style={{ color: C.gray, marginTop: 4 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StickyLeadBar
        sourcePage="income"
        revealAfterId={APPLY_ID}
        submitLabel="무료 혜택 받기"
        successMessage="신청이 완료되었습니다! 무료 혜택 3종을 입력하신 연락처로 보내드리겠습니다."
      />
    </div>
  )
}
