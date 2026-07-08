import Link from 'next/link'
import { getReportCards } from '@/data/registry'

export default async function ReportCards() {
  const cards = await getReportCards()
  return (
    <div className="responsive-section-shell" style={{ maxWidth: 1320, margin: '0 auto', padding: 'var(--section-padding, 24px 28px 8px)' }}>
      <div className="responsive-section-card" style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 18, padding: 'var(--card-padding, 26px 28px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>오늘의 인기 리포트</div>
          <span style={{ padding: '4px 10px', borderRadius: 7, background: '#EAF1FE', color: '#1B6CF2', fontSize: 12, fontWeight: 700 }}>무료 제공</span>
        </div>
        <div className="responsive-card-grid-4" style={{ display: 'grid', gridTemplateColumns: 'var(--grid-columns, repeat(4,1fr))', gap: 16 }}>
          {cards.map((r) => (
            <div key={r.code} style={{ border: '1px solid #EEF1F6', borderRadius: 14, padding: 18, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <div style={{ lineHeight: 1.25, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>
                    {r.name} <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 500 }}>{r.code}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7684' }}>주가 전망 리포트</div>
                </div>
                {r.hot && (
                  <span style={{ padding: '3px 8px', borderRadius: 6, background: '#FCEEED', color: '#E8342B', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>가장 많이 조회</span>
                )}
              </div>
              <div style={{ marginTop: 14 }} />

              {/* 증권사 투자의견 컨센서스 미니 차트 (매수/보유/매도) */}
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8 }}>
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
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 52, border: 'none', borderRadius: 12, background: '#EAF1FE', color: '#1B6CF2', fontSize: 14, fontWeight: 800, cursor: 'pointer', textDecoration: 'none' }}
              >
                무료 리포트 확인하기 ›
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
