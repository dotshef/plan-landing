'use client'

import { type CSSProperties } from 'react'
import { TrendingUp, Lock } from 'lucide-react'
import {
  BarChart, Bar, Cell, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useStockData } from '@/context/StockDataContext'

const fmt = (n: number) => n.toLocaleString('ko-KR')

export default function ReportContent() {
  const { quote: STOCK_QUOTE, rep, fin } = useStockData()
  const r = rep.REPORT_DETAIL
  const oc = rep.OPINION_CONSENSUS
  const QUARTERLY_EARNINGS = fin.QUARTERLY_EARNINGS

  return (
    <div>
      {/* 헤더 */}
      <div className="responsive-report-header" style={{ display: 'flex', flexDirection: 'var(--report-header-direction, row)' as CSSProperties['flexDirection'], alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#6B7684' }}>{r.name}({r.code})</div>
          <h2 style={{ margin: '4px 0 8px', fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            주가 전망 리포트 미리보기
          </h2>
          <div style={{ fontSize: 14, color: '#8B95A1' }}>전문가의 심층 분석 리포트를 무료로 받아보세요.</div>
        </div>
        <span style={{ padding: '7px 12px', background: '#F5F8FE', borderRadius: 8, fontSize: 12, color: '#6B7684', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Lock size={12} color="#6B7684" /> 일부 내용은 신청 후 확인 가능합니다.
        </span>
      </div>

      <div style={{ marginTop: 22 }} />

      {/* 탭 콘텐츠 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 핵심 카드 3개 (투자의견 / 현재가 / 목표주가) */}
          <div className="responsive-report-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'var(--grid-columns, repeat(3,1fr))', gap: 12 }}>
            {[
              { label: '투자 의견',           icon: true,  value: r.opinion,                                                   sub: '국내 증권사 종합 투자의견', color: r.opinion === '매수' ? '#E8342B' : r.opinion === '매도' ? '#3182f6' : '#F5C900', subColor: '#8B95A1' },
              { label: '현재가',              icon: false, value: fmt(STOCK_QUOTE.currentPrice) + '원',                       sub: `${STOCK_QUOTE.changeRate >= 0 ? '▲' : '▼'} ${Math.abs(STOCK_QUOTE.changeRate).toFixed(2)}% 전일 대비`,  color: '#111827', subColor: '#8B95A1' },
              { label: '◎ 목표 주가 (12개월)', icon: false, value: fmt(r.targetPrice) + '원',                                 sub: `▲ ${((r.targetPrice / STOCK_QUOTE.currentPrice - 1) * 100).toFixed(1)}% 상승 여력`,  color: '#111827', subColor: '#E8342B' },
            ].map((card) => (
              <div key={card.label} style={{ border: '1px solid #EEF1F6', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: '#8B95A1', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {card.icon && <TrendingUp size={12} color="#8B95A1" />}{card.label}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: card.color, marginTop: 6 }}>{card.value}</div>
                <div style={{ fontSize: 11, color: card.subColor, fontWeight: 700, marginTop: 6 }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* 발간일 메타 */}
          <div className="responsive-report-meta" style={{ display: 'flex', flexDirection: 'var(--report-meta-direction, row)' as CSSProperties['flexDirection'], gap: 'var(--report-meta-gap, 20px)', fontSize: 12, color: '#8B95A1' }}>
            <span>▤ 리포트 발간일 <strong style={{ color: '#4E5968' }}>{r.publishDate}</strong></span>
            <span>다음 업데이트 <strong style={{ color: '#4E5968' }}>{r.nextUpdateDate}</strong></span>
          </div>

          {/* 증권사 투자의견 컨센서스 (invest_opinion 증권사별 최신 의견 집계) */}
          {oc.total > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#4E5968', fontWeight: 600 }}>증권사 투자의견 컨센서스</div>
                <div style={{ fontSize: 11, color: '#8B95A1' }}>증권사 {oc.total}곳 최신 의견 기준</div>
              </div>

              {/* 100% 스택 가로 막대 — 컨테이너 overflow로 양끝 라운딩 */}
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <ResponsiveContainer width="100%" height={30}>
                  <BarChart
                    layout="vertical"
                    data={[{ name: 'consensus', buy: oc.buyCount, hold: oc.holdCount, sell: oc.sellCount }]}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    barCategoryGap={0}
                  >
                    <XAxis type="number" domain={[0, oc.total]} hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Bar dataKey="buy" stackId="c" fill="#E8342B" />
                    <Bar dataKey="hold" stackId="c" fill="#C6CDD6" />
                    <Bar dataKey="sell" stackId="c" fill="#3182f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 범례 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginTop: 10 }}>
                {[
                  { label: '매수', color: '#E8342B', pct: oc.buy, cnt: oc.buyCount },
                  { label: '보유', color: '#C6CDD6', pct: oc.hold, cnt: oc.holdCount },
                  { label: '매도', color: '#3182f6', pct: oc.sell, cnt: oc.sellCount },
                ].map((x) => (
                  <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: x.color, display: 'inline-block' }} />
                    <span style={{ color: '#4E5968', fontWeight: 600 }}>{x.label}</span>
                    <span style={{ color: '#111827', fontWeight: 800 }}>{x.pct}%</span>
                    <span style={{ color: '#8B95A1' }}>{x.cnt}곳</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 분기 실적 차트 2개 */}
          <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'var(--grid-columns, 1fr 1fr)', gap: 16 }}>

            {/* 분기별 매출액 추이 */}
            <div>
              <div style={{ fontSize: 12, color: '#4E5968', fontWeight: 600, marginBottom: 8 }}>
                분기별 매출액 추이 <span style={{ fontWeight: 400, color: '#8B95A1' }}>(단위: 조원)</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={QUARTERLY_EARNINGS} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" vertical={false} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: '#8B95A1' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#8B95A1' }}
                    tickFormatter={(v) => (v / 10000).toFixed(0)}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) => [`${(Number(v) / 10000).toFixed(1)}조원`, '매출액']}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E8EB' }}
                  />
                  <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                    {QUARTERLY_EARNINGS.map((d, i) => (
                      <Cell key={d.quarter} fill={i === QUARTERLY_EARNINGS.length - 1 ? '#1B6CF2' : '#BFDBFE'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 영업이익 추이 */}
            <div>
              <div style={{ fontSize: 12, color: '#4E5968', fontWeight: 600, marginBottom: 8 }}>
                영업이익 추이 <span style={{ fontWeight: 400, color: '#8B95A1' }}>(단위: 조원)</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <ComposedChart data={QUARTERLY_EARNINGS} margin={{ top: 4, right: 28, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" vertical={false} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: '#8B95A1' }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="op"
                    tick={{ fontSize: 9, fill: '#8B95A1' }}
                    tickFormatter={(v) => (v / 10000).toFixed(0)}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    yAxisId="margin"
                    orientation="right"
                    tick={{ fontSize: 9, fill: '#8B95A1' }}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    formatter={(v, name) => [
                      name === 'op' ? `${(Number(v) / 10000).toFixed(1)}조원` : `${v}%`,
                      name === 'op' ? '영업이익' : '영업이익률',
                    ]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E8EB' }}
                  />
                  <Bar yAxisId="op" dataKey="op" fill="#BFDBFE" radius={[3, 3, 0, 0]} />
                  <Line
                    yAxisId="margin"
                    dataKey="opMargin"
                    stroke="#1B6CF2"
                    strokeWidth={1.5}
                    dot={{ r: 3, fill: '#fff', stroke: '#1B6CF2', strokeWidth: 1.5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* 잠금 안내 */}
          <div style={{ padding: '16px 18px', background: '#F5F8FE', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Lock size={16} color="#1B6CF2" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1B6CF2' }}>전체 리포트는 무료 신청 후 확인하실 수 있습니다.</div>
              <div style={{ fontSize: 12, color: '#8B95A1', marginTop: 3 }}>기업 분석, 수급 분석, 밸류에이션, 리스크 분석 등 상세 내용 제공</div>
            </div>
          </div>

          {/* 법적 고지 */}
          <div style={{ fontSize: 11, color: '#B0B8C1', lineHeight: 1.5, borderTop: '1px solid #F2F4F6', paddingTop: 14 }}>
            {r.legalNotice}
          </div>
      </div>

    </div>
  )
}
