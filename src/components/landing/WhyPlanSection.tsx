import Image from 'next/image'
import { ArrowRight, ChartPie, MessageSquareText, Newspaper } from 'lucide-react'
import { TrialModalTrigger } from './TrialFormModal'

const MEMBER_COUNT = '3,500명'

const BENEFITS = [
  { icon: MessageSquareText, title: '추천 종목 매매신호 문자', desc: '매수·매도 타이밍을 장 시작 전 문자로' },
  { icon: ChartPie, title: '투자 포트폴리오 진단', desc: '보유 종목 점검과 대응 기준 안내' },
  { icon: Newspaper, title: '장전·장후 시황 브리핑', desc: '시장 흐름과 핵심 이슈를 매일 정리' },
]

export default function WhyPlanSection() {
  return (
    <section style={{ background: '#F5F7FB' }}>
      <div className="home-shell" style={{ padding: 'var(--home-section-padding-tail, 24px 28px 88px)' }}>
        <div className="responsive-section-card" style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 20, padding: 'var(--card-padding, 44px)', boxShadow: '0 8px 30px rgba(17,40,90,.06)' }}>
          <h2 style={{ margin: '0 0 28px', fontSize: 'var(--home-h2-size, 34px)', lineHeight: 1.35, fontWeight: 800, letterSpacing: '-0.03em', color: '#111827' }}>
            <span style={{ color: '#1B6CF2' }}>{MEMBER_COUNT}</span>의 투자자가 플랜을 선택한 이유
          </h2>

          <div className="home-why-grid">
            {/* 매매일지 + 추천 문자 */}
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 15, color: '#6B7684' }}>손절까지 숨기지 않는 추천 기록 그대로</div>
              <div style={{ fontSize: 'var(--home-h3-size, 24px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#111827', marginTop: 4 }}>매매일지와 추천 문자</div>

              <div className="home-journal">
                <div className="home-journal-table">
                  <a className="home-journal-sheet-link" href="/images/plan-excel-journal-example.png" target="_blank" rel="noopener noreferrer">
                    <Image
                      src="/images/plan-excel-journal-example.png"
                      alt="엑셀 매매일지 가상 예시: 매수일, 종목명, 매수가, 매도가, 수익률과 매도·손절 내역. 클릭하면 원본 이미지가 새 탭에서 열립니다."
                      width={1448}
                      height={1086}
                      sizes="(max-width: 640px) 90vw, (max-width: 1320px) 65vw, 840px"
                      style={{ display: 'block', width: '100%', height: 'auto' }}
                    />
                  </a>
                </div>

                <div className="home-journal-phone">
                  <Image
                    src="/images/plan-galaxy-sms-example.png"
                    alt="갤럭시 문자 화면 예시: 가상 종목 플랜테크의 매수 관점, 목표가 도달, 손절가 이탈 안내"
                    width={887}
                    height={1774}
                    sizes="(max-width: 640px) 300px, (max-width: 1320px) 25vw, 315px"
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: '#B0B8C1', marginTop: 14 }}>※ 매매일지와 문자는 가상 예시이며, 종목·가격·수익률은 실제 투자 기록이 아닙니다.</div>
            </div>

            {/* 무료 체험 혜택 */}
            <div className="home-why-benefits">
              <h3 className="home-why-benefits-heading">
                <span>무료 체험만 신청해도</span>
                <span className="text-brand">3가지 혜택!</span>
              </h3>
              <div className="home-why-benefit-grid">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="home-why-benefit-card">
                    <div className="home-why-icon">
                      <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>{title}</div>
                      <div style={{ fontSize: 13.5, color: '#6B7684', marginTop: 3 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="home-why-benefits-actions">
                <TrialModalTrigger className="home-why-apply">
                  무료 체험 신청하기 <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
                </TrialModalTrigger>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
