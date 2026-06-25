'use client'

import { useState } from 'react'
import { TrendingUp, Lock } from 'lucide-react'
import {
  BarChart, Bar, Cell, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { REPORT_DETAIL, QUARTERLY_EARNINGS } from '@/data/reports'

type ReportTab = '핵심요약' | '수급분석'
const TABS: ReportTab[] = ['핵심요약', '수급분석']

const fmt = (n: number) => n.toLocaleString('ko-KR')

export default function ReportContent() {
  const [tab, setTab] = useState<ReportTab>('핵심요약')
  const r = REPORT_DETAIL

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#6B7684' }}>삼성전자(005930)</div>
          <h2 style={{ margin: '4px 0 8px', fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            주가 전망 리포트 미리보기
          </h2>
          <div style={{ fontSize: 14, color: '#8B95A1' }}>전문가의 심층 분석 리포트를 무료로 받아보세요.</div>
        </div>
        <span style={{ padding: '7px 12px', background: '#F5F8FE', borderRadius: 8, fontSize: 12, color: '#6B7684', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Lock size={12} color="#6B7684" /> 일부 내용은 신청 후 확인 가능합니다.
        </span>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 22, borderBottom: '1px solid #EEF1F6', margin: '22px 0' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0 0 12px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: 'none', border: 'none',
              borderBottom: `2.5px solid ${tab === t ? '#1B6CF2' : 'transparent'}`,
              color: tab === t ? '#1B6CF2' : '#8B95A1',
              marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === '핵심요약' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 핵심 카드 4개 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: '투자 의견',           icon: true,  value: r.opinion,                                                   sub: '실적 업황 개선과 AI 수요 증가로 실적 회복 기대', color: r.opinion === '매수' ? '#E8342B' : r.opinion === '매도' ? '#3182f6' : '#F5C900', subColor: '#8B95A1' },
              { label: '현재가',              icon: false, value: fmt(77800) + '원',                                           sub: '▼ 0.51% 전일 대비',                            color: '#111827', subColor: '#8B95A1' },
              { label: '◎ 목표 주가 (12개월)', icon: false, value: fmt(r.targetPrice) + '원',                                 sub: '▲ 13.1% 상승 여력',                            color: '#111827', subColor: '#E8342B' },
              { label: '◷ 적정 주가 밴드',    icon: false, value: `${fmt(r.fairValueLow)}~${fmt(r.fairValueHigh)}`,           sub: '보수적 시나리오 ~ 낙관적 시나리오 기준',                      color: '#111827', subColor: '#8B95A1' },
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
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#8B95A1' }}>
            <span>▤ 리포트 발간일 <strong style={{ color: '#4E5968' }}>{r.publishDate}</strong></span>
            <span>다음 업데이트 <strong style={{ color: '#4E5968' }}>2024.06.06</strong></span>
          </div>

          {/* 핵심 요약 */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 8 }}>1. 최근 실적 및 전망</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#6B7684' }}>{r.summary}</p>
          </div>

          {/* 분기 실적 차트 2개 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

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
                    domain={[0, 1000000]}
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
                    domain={[0, 200000]}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    yAxisId="margin"
                    orientation="right"
                    tick={{ fontSize: 9, fill: '#8B95A1' }}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 20]}
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

          {/* 주요 체크 포인트 */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 12 }}>2. 주요 체크 포인트</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
              {r.checkpoints.map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#1B6CF2', fontWeight: 700, fontSize: 14, lineHeight: '1.6', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13.5, color: '#4E5968', lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
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
      )}

      {tab === '수급분석' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>주요 수급 및 변동성 분석</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#6B7684' }}>{r.supplyDemandAnalysis}</p>
          </div>
          <div style={{ fontSize: 11, color: '#B0B8C1', lineHeight: 1.5, borderTop: '1px solid #F2F4F6', paddingTop: 14 }}>
            {r.legalNotice}
          </div>
        </div>
      )}

    </div>
  )
}
