import type { Metadata } from 'next'
import { Newspaper, Lock } from 'lucide-react'
import { db } from '@/lib/db/server'
import { loadPublishedReport, type SectorRow } from '@/lib/sector/report'
import PageLeadForm from '@/components/common/PageLeadForm'
import StickyLeadBar from '@/components/landing/StickyLeadBar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '이번 분기 주목받는 섹터 — 투자그룹 플랜',
  description: '영업이익·업종 PER·거래대금·외국인 순매수 데이터 기준으로 정리한 분기 섹터 리포트.',
  alternates: { canonical: '/sector' },
}

interface NewsItem {
  title: string
  source: string | null
  published_at: string | null
}

// 섹터별 최신 뉴스 최대 5건 — 렌더 시점 실시간 조회(스냅샷 아님)
async function loadNews(codes: string[]): Promise<NewsItem[]> {
  if (codes.length === 0) return []
  const { data } = await db()
    .from('news')
    .select('title, source, published_at')
    .in('code', codes)
    .order('published_at', { ascending: false })
    .limit(5)
  return (data ?? []) as NewsItem[]
}

const fmtPct = (v: number | null) =>
  v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
const fmtPer = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}배`)
// foreign_net_amount 단위: 백만원 → 억원
const fmtEok = (v: number | null) => {
  if (v == null) return '—'
  const eok = Math.round(v / 100)
  return `${eok > 0 ? '+' : ''}${eok.toLocaleString('ko-KR')}억`
}
const pctColor = (v: number | null) => (v == null ? '#8B95A1' : v >= 0 ? '#E8342B' : '#3182f6')

function OpTrendChart({ trend }: { trend: SectorRow['op_trend'] }) {
  const items = trend ?? []
  if (items.length === 0) return null
  const values = items.map((t) => t.value).filter((v): v is number => v != null)
  if (values.length === 0) return null
  const max = Math.max(...values, 0)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const W = 330
  const H = 130
  const chartH = 96
  const baseY = 8 + (max / span) * chartH // 0선
  const barW = W / items.length * 0.5

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="분기 영업이익 추이">
      <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="#E5E8EB" />
      {items.map((t, i) => {
        const cx = (W / items.length) * (i + 0.5)
        if (t.value == null) {
          return (
            <text key={t.label} x={cx} y={baseY - 6} fontSize="10" fill="#B0B8C1" textAnchor="middle" fontFamily="sans-serif">—</text>
          )
        }
        const h = (Math.abs(t.value) / span) * chartH
        const y = t.value >= 0 ? baseY - h : baseY
        return (
          <rect key={t.label} x={cx - barW / 2} y={y} width={barW} height={Math.max(h, 1)} rx="3"
            fill={t.value >= 0 ? '#1B6CF2' : '#3182f6'} opacity={t.value >= 0 ? 1 : 0.55} />
        )
      })}
      {items.map((t, i) => {
        const cx = (W / items.length) * (i + 0.5)
        return (
          <text key={t.label} x={cx} y={H - 6} fontSize="11" fill="#8B95A1" textAnchor="middle" fontFamily="sans-serif">{t.label}</text>
        )
      })}
    </svg>
  )
}

export default async function SectorPage() {
  const report = await loadPublishedReport().catch(() => null)

  if (!report) {
    return (
      <div style={{ background: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px' }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#111827', margin: '0 0 10px', textAlign: 'center' }}>분기 섹터 리포트</h1>
          <p style={{ fontSize: 15, color: '#6B7684', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.7 }}>
            이번 분기 리포트를 준비 중입니다.<br />신청해주시면 발행 즉시 문자로 보내드립니다.
          </p>
          <PageLeadForm
            sourcePage="sector"
            title="발행 알림 신청"
            submitLabel="발행되면 바로 받아보기"
          />
        </div>
        <StickyLeadBar sourcePage="sector" />
      </div>
    )
  }

  const newsPerSector = await Promise.all(
    report.sectors.map((s) => loadNews(s.stocks.map((st) => st.code))),
  )

  const baseDateLabel = report.base_date
    ? `${report.base_date.slice(0, 4)}년 ${Number(report.base_date.slice(5, 7))}월 ${Number(report.base_date.slice(8, 10))}일 기준`
    : ''

  return (
    <div style={{ background: '#fff' }}>
      {/* 헤더 밴드 */}
      <div style={{ background: '#0F1C3D' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28, alignItems: 'center' }}>
          <div>
            <span style={{ display: 'inline-block', fontSize: 14, fontWeight: 800, color: '#0F1C3D', background: '#FBBF24', padding: '5px 12px', borderRadius: 6, marginBottom: 14 }}>
              {report.year} {report.quarter}분기
            </span>
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.35 }}>
              {report.quarter}분기 주목받는 섹터 {report.sectors.length}가지
            </h1>
            <p style={{ fontSize: 15, color: '#93A6C9', marginTop: 10 }}>{baseDateLabel}</p>
          </div>
          <div style={{ background: '#1E2B4F', borderRadius: 14, padding: '20px 22px' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#7C8DB5', margin: '0 0 10px' }}>선정 기준</p>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#DBE7FE', fontSize: 14.5, lineHeight: 2 }}>
              <li>직전 분기 대비 영업이익 증가</li>
              <li>업종 거래대금 증가</li>
              <li>업종 PER이 코스피 평균 이하</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 비교 표 */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 24px 8px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 18px' }}>섹터 한눈에 비교</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #EEF1F6', borderRadius: 14, overflow: 'hidden', minWidth: 640 }}>
            <thead>
              <tr>
                {['섹터', '영업이익 증가율 (QoQ)', '업종 PER (TTM)', '코스피 평균 PER', '거래대금 증가율', '외국인 순매수'].map((h) => (
                  <th key={h} style={{ padding: '13px 16px', fontSize: 12.5, color: '#8B95A1', fontWeight: 600, textAlign: 'left', background: '#F8FAFC', borderBottom: '1px solid #F2F4F6', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.sectors.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: '15px 16px', fontSize: 15, fontWeight: 800, color: '#191F28', borderBottom: '1px solid #F2F4F6', whiteSpace: 'nowrap' }}>{s.name}</td>
                  <td style={{ padding: '15px 16px', fontSize: 15, fontWeight: 700, color: pctColor(s.op_growth_rate), borderBottom: '1px solid #F2F4F6' }}>{fmtPct(s.op_growth_rate)}</td>
                  <td style={{ padding: '15px 16px', fontSize: 15, fontWeight: 700, color: '#191F28', borderBottom: '1px solid #F2F4F6' }}>{fmtPer(s.sector_per)}</td>
                  <td style={{ padding: '15px 16px', fontSize: 15, color: '#6B7684', borderBottom: '1px solid #F2F4F6' }}>{fmtPer(report.kospi_avg_per)}</td>
                  <td style={{ padding: '15px 16px', fontSize: 15, fontWeight: 700, color: pctColor(s.trading_value_growth_rate), borderBottom: '1px solid #F2F4F6' }}>{fmtPct(s.trading_value_growth_rate)}</td>
                  <td style={{ padding: '15px 16px', fontSize: 15, fontWeight: 700, color: pctColor(s.foreign_net_amount), borderBottom: '1px solid #F2F4F6' }}>{fmtEok(s.foreign_net_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: '#B0B8C1', marginTop: 10, lineHeight: 1.7 }}>
          영업이익은 분기보고서 확정 실적 기준(추정치 미포함), 섹터 수치는 등록 종목의 단순 산술 평균(외국인 순매수는 합산)
        </p>
      </div>

      {/* 섹터별 블록 */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 24px 48px', display: 'grid', gap: 28 }}>
        {report.sectors.map((s, idx) => (
          <div key={s.id} style={{ border: '1px solid #EEF1F6', borderRadius: 18, padding: 'clamp(20px, 3vw, 32px)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{s.name}</span>
              <span style={{ fontSize: 14.5, color: '#1B6CF2', fontWeight: 700 }}>{s.theme}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              <div>
                {/* 영업이익 추이 차트 */}
                <div style={{ border: '1px solid #F2F4F6', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, color: '#8B95A1' }}>분기 영업이익 추이 (확정 실적, 억원)</span>
                    <b style={{ fontSize: 13.5, color: '#1B6CF2' }}>{fmtPct(s.op_growth_rate)} QoQ</b>
                  </div>
                  <OpTrendChart trend={s.op_trend} />
                </div>

                {/* 지표 4종 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {[
                    { k: '영업이익 증가율', v: fmtPct(s.op_growth_rate), c: pctColor(s.op_growth_rate) },
                    { k: '업종 PER (TTM)', v: fmtPer(s.sector_per), c: '#191F28' },
                    { k: '거래대금 증가율', v: fmtPct(s.trading_value_growth_rate), c: pctColor(s.trading_value_growth_rate) },
                    { k: '외국인 순매수', v: fmtEok(s.foreign_net_amount), c: pctColor(s.foreign_net_amount) },
                  ].map((m) => (
                    <div key={m.k} style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4 }}>{m.k}</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: m.c }}>{m.v}</div>
                    </div>
                  ))}
                </div>

                {/* 코스피 평균 PER 대비 */}
                {s.sector_per != null && report.kospi_avg_per != null && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12.5, color: '#8B95A1', marginBottom: 8 }}>코스피 평균 PER 대비</div>
                    {[
                      { label: s.name, value: s.sector_per, color: '#1B6CF2' },
                      { label: '코스피 평균', value: report.kospi_avg_per, color: '#CBD5E1' },
                    ].map((bar) => {
                      const maxPer = Math.max(s.sector_per!, report.kospi_avg_per!)
                      return (
                        <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ flex: '0 0 96px', fontSize: 12.5, color: '#6B7684', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bar.label}</span>
                          <div style={{ flex: 1, height: 10, borderRadius: 5, background: '#F2F4F6', overflow: 'hidden' }}>
                            <div style={{ width: `${(bar.value / maxPer) * 100}%`, height: '100%', background: bar.color }} />
                          </div>
                          <span style={{ flex: '0 0 52px', fontSize: 13, fontWeight: 700, color: bar.color === '#CBD5E1' ? '#6B7684' : bar.color, textAlign: 'right' }}>{bar.value.toFixed(1)}배</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                {/* 최근 뉴스 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: '#4E5968', marginBottom: 10 }}>
                  <Newspaper size={15} strokeWidth={2} color="#8B95A1" /> 최근 관련 뉴스
                </div>
                {newsPerSector[idx].length === 0 ? (
                  <div style={{ fontSize: 13.5, color: '#B0B8C1', padding: '14px 0' }}>표시할 뉴스가 없습니다.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 0 }}>
                    {newsPerSector[idx].map((n, i) => (
                      <div key={i} style={{ padding: '11px 0', borderBottom: i < newsPerSector[idx].length - 1 ? '1px solid #F2F4F6' : 'none' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#191F28', lineHeight: 1.5 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: '#8B95A1', marginTop: 3 }}>
                          {n.source ?? ''}{n.source && n.published_at ? ' · ' : ''}{n.published_at?.slice(0, 10) ?? ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 주도종목 잠금 카드 */}
                <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, background: '#F5F8FE', border: '1px solid #E3EDFD', borderRadius: 12, padding: '16px 18px' }}>
                  <Lock size={22} strokeWidth={2} color="#1B6CF2" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#191F28' }}>이 섹터 주도종목</div>
                    <div style={{ fontSize: 13, color: '#6B7684', marginTop: 2 }}>종목명과 선정 근거를 신청 시 문자로 보내드립니다</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ background: '#0F1C3D' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: '#fff', lineHeight: 1.4, margin: 0 }}>
              섹터별 주도종목,<br />바로 받아보세요
            </h2>
            <p style={{ fontSize: 15.5, color: '#BFD4FD', marginTop: 12, lineHeight: 1.7 }}>
              선정 근거 데이터 포함 · 신청 즉시 문자로 발송
            </p>
          </div>
          <PageLeadForm
            sourcePage="sector"
            title="주도종목 받아보기"
            submitLabel="바로 받아보기"
            successMessage="섹터별 주도종목을 입력하신 연락처로 보내드리겠습니다."
          />
        </div>
      </div>
      <StickyLeadBar sourcePage="sector" />
    </div>
  )
}
