'use client'

import Link from 'next/link'
import { TrendingUp, Bot, Zap, Search, type LucideIcon } from 'lucide-react'
import { useStockData } from '@/context/StockDataContext'

const INSIGHT_ICONS: LucideIcon[] = [TrendingUp, Bot, Zap, Search]

export default function AiInsightSection() {
  const { rep } = useStockData()
  const { AI_INSIGHTS, REPORT_DETAIL } = rep
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 14 }}>
        AI 분석 인사이트{' '}
        <span style={{ fontSize: 10, color: '#1B6CF2', background: '#EAF1FE', padding: '2px 6px', borderRadius: 5, fontWeight: 700 }}>Beta</span>
      </div>
      {AI_INSIGHTS.map((insight, i) => (
        <div key={i} style={{ display: 'flex', gap: 11, padding: '11px 0', borderTop: '1px solid #F2F4F6' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EAF1FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {(() => { const Icon = INSIGHT_ICONS[i]; return Icon ? <Icon size={16} color="#1B6CF2" /> : <span style={{ color: '#1B6CF2' }}>•</span> })()}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>AI 분석 포인트 {i + 1}</div>
            <div style={{ fontSize: 12, color: '#8B95A1', lineHeight: 1.45, marginTop: 2 }}>{insight}</div>
          </div>
        </div>
      ))}
      <Link
        href={`/report/${REPORT_DETAIL.code}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 40, marginTop: 12, border: '1px solid #E5E8EB', borderRadius: 10, background: '#fff', color: '#1B6CF2', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
      >
        AI 분석 상세 보기 ›
      </Link>
    </div>
  )
}
