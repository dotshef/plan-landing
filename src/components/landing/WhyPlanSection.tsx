import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import GoldCoin from '@/components/common/GoldCoin'
import { TrialModalTrigger } from './TrialFormModal'

const MEMBER_COUNT = '3,500명'

const BENEFITS = [
  { title: '추천 종목 매매신호 문자', desc: '매수·매도 타이밍을 장 시작 전 문자로' },
  { title: '투자 포트폴리오 진단', desc: '보유 종목 점검과 대응 기준 안내' },
  { title: '장전·장후 시황 브리핑', desc: '시장 흐름과 핵심 이슈를 매일 정리' },
]

export default function WhyPlanSection() {
  return (
    <section style={{ background: '#F5F7FB' }}>
      <div className="home-shell" style={{ padding: 'var(--home-section-padding-tail, 24px 28px 88px)' }}>
        <div className="responsive-section-card" style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 20, padding: 'var(--card-padding, 44px)', boxShadow: '0 8px 30px rgba(17,40,90,.06)' }}>
          <h2 style={{ margin: '0 0 28px', fontSize: 'var(--home-h2-size, 34px)', lineHeight: 1.35, fontWeight: 800, letterSpacing: '-0.03em', color: '#111827' }}>
            {MEMBER_COUNT}의 투자자가 플랜을 선택한 이유
          </h2>

          <div className="home-why-grid">
            {/* 매매일지 + 추천 문자 */}
            <div className="home-why-record">
              <div style={{ fontSize: 15, color: '#4E5968' }}>손절까지 숨기지 않는 추천 기록 그대로</div>
              <h3 style={{ margin: '6px 0 0', fontSize: 'var(--home-h3-size, 24px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#111827' }}>실제 매매일지와 추천 문자</h3>

              <a className="home-journal" href="/images/plan-journal-sms-example.jpg" target="_blank" rel="noopener noreferrer">
                <Image
                  src="/images/plan-journal-sms-example.jpg"
                  alt="엑셀 매매일지와 추천 문자 화면 예시: 일자·종목명·매수가·매도가·수익률 내역과 투자그룹 플랜의 매수 시그널 문자. 클릭하면 원본 이미지가 새 탭에서 열립니다."
                  width={1024}
                  height={721}
                  sizes="(max-width: 1024px) 90vw, 560px"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </a>
              <div style={{ fontSize: 12.5, color: '#B0B8C1', marginTop: 18 }}>※ 매매일지와 문자는 가상 예시이며, 종목·가격·수익률은 실제 투자 기록이 아닙니다.</div>
            </div>

            {/* 무료 체험 혜택 */}
            <div className="home-why-benefits">
              <div style={{ fontSize: 15, color: '#4E5968' }}>무료 체험만 신청해도</div>
              <h3 className="home-why-benefits-heading">3가지 혜택!</h3>
              <ol className="home-why-benefit-list">
                {BENEFITS.map(({ title, desc }, i) => (
                  <li key={title} className="home-why-benefit-card">
                    <GoldCoin no={String(i + 1).padStart(2, '0')} idPrefix={`whyCoin${i}`} className="home-why-num" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>{title}</div>
                      <div style={{ fontSize: 14, color: '#6B7684', marginTop: 4 }}>{desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <TrialModalTrigger className="home-why-apply">
                지금 바로 신청하기 <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
              </TrialModalTrigger>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
