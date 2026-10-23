import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getReportCards, type PopularStock } from '@/data/registry'
import StockSearch from './StockSearch'

// 종목 검색 + 오늘의 인기 리포트를 한 카드로 묶은 섹션
export default async function SearchReportsSection({ stocks }: { stocks: PopularStock[] }) {
  const cards = await getReportCards()
  return (
    <section style={{ background: '#F5F7FB' }}>
      <div className="home-shell" style={{ padding: 'var(--home-section-padding, 72px 28px 24px)' }}>
        <div className="responsive-section-card" style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 20, padding: 'var(--card-padding, 36px)', boxShadow: '0 8px 30px rgba(17,40,90,.06)' }}>
          <div className="home-search-grid">
            <div>
              <h2 style={{ margin: 0, fontSize: 'var(--home-h2s-size, 28px)', lineHeight: 1.4, fontWeight: 800, letterSpacing: '-0.03em', color: '#111827' }}>
                내 종목,<br />지금 <span style={{ color: '#1B6CF2' }}>필요한 판단</span>을 확인하세요
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: 15, color: '#6B7684' }}>종목 분석 리포트 무료로 받아보기</p>
            </div>
            <StockSearch stocks={stocks} />
          </div>

          <div style={{ borderTop: '1px solid #F2F4F6', marginTop: 32, paddingTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>오늘의 인기 리포트</h3>
              <span style={{ padding: '4px 10px', borderRadius: 7, background: '#EAF1FE', color: '#1B6CF2', fontSize: 12, fontWeight: 700 }}>무료 제공</span>
            </div>
            <div className="home-report-grid">
              {cards.map((r) => (
                <div key={r.code} className="home-report-card" style={{ position: 'relative', border: '1px solid #EEF1F6', borderRadius: 14, padding: 18, background: '#fff', display: 'flex', flexDirection: 'column' }}>
                  <div className="home-report-head" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="home-report-avatar" style={{ width: 40, height: 40, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                    <div style={{ lineHeight: 1.25, flex: 1, minWidth: 0 }}>
                      <div className="home-report-name" style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>
                        {r.name} <span className="home-report-code" style={{ fontSize: 12, color: '#8B95A1', fontWeight: 500 }}>{r.code}</span>
                      </div>
                    </div>
                    {r.hot && (
                      <span className="home-report-hot" style={{ padding: '3px 8px', borderRadius: 6, background: '#FCEEED', color: '#E8342B', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>가장 많이 조회</span>
                    )}
                  </div>
                  <div style={{ marginTop: 14 }} />

                  {r.consensus && r.consensus.total > 0 ? (() => {
                    const c = r.consensus
                    const seg = [
                      { label: '매수', color: '#E8342B', cnt: c.buyCount },
                      { label: '보유', color: '#C6CDD6', cnt: c.holdCount },
                      { label: '매도', color: '#3182f6', cnt: c.sellCount },
                    ]
                    return (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600 }}>증권사 투자의견</span>
                          <span style={{ fontSize: 11, color: '#8B95A1' }}>{c.total}곳</span>
                        </div>
                        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: '#F2F4F6' }}>
                          {seg.filter((s) => s.cnt > 0).map((s) => (
                            <div key={s.label} style={{ flex: s.cnt, background: s.color }} />
                          ))}
                        </div>
                        <div className="home-report-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8 }}>
                          {seg.map((s) => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                              <span style={{ color: '#6B7684', fontWeight: 600 }}>{s.label}</span>
                              <span style={{ color: '#111827', fontWeight: 700 }}>{s.cnt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })() : (
                    <div style={{ minHeight: 56, marginBottom: 16, borderRadius: 10, background: '#F8FAFC', border: '1px solid #F2F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B95A1', fontSize: 12, fontWeight: 700 }}>
                      증권사 투자의견 없음
                    </div>
                  )}

                  <Link
                    href={`/report/${r.code}`}
                    className="home-report-btn"
                    style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 52, border: 'none', borderRadius: 12, background: '#EAF1FE', color: '#1B6CF2', fontSize: 14, fontWeight: 800, cursor: 'pointer', textDecoration: 'none' }}
                  >
                    <span className="home-hide-m">무료 리포트 확인하기</span>
                    <span className="home-show-m">리포트 보기</span>
                    <ChevronRight size={16} strokeWidth={2.5} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
