'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { useStockData } from '@/context/StockDataContext'

export default function ReportPreviewSidebar() {
  const { rep } = useStockData()
  const { REPORT_POINTS, REPORT_DETAIL } = rep
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>전문가 리포트 미리보기</div>
        <span style={{ fontSize: 12, color: '#8B95A1', cursor: 'default' }}>더보기 ›</span>
      </div>

      {/* 리포트 카드 (그라디언트) */}
      <div style={{ borderRadius: 12, background: 'linear-gradient(135deg,#0F2552,#1B3F86)', padding: 18, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: 11, opacity: 0.7 }}>K-Stock 전문가 리포트</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginTop: 6 }}>{REPORT_DETAIL.name}({REPORT_DETAIL.code})</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#9DC2FF' }}>주가 전망 리포트</div>
        <div style={{ display: 'inline-block', marginTop: 12, padding: '6px 11px', background: 'rgba(255,255,255,.16)', borderRadius: 7, fontSize: 11, fontWeight: 600 }}>
          핵심 내용 미리보기
        </div>
      </div>

      {/* 포인트 목록 */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {REPORT_POINTS.map((pt) => (
          <div key={pt} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: '#4E5968' }}>
            <Check size={13} color="#1B6CF2" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 1 }} />
            {pt}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, padding: 10, background: '#F5F8FE', borderRadius: 9, fontSize: 11.5, color: '#8B95A1', textAlign: 'center' }}>
        전체 리포트는 신청자에게만 제공됩니다.
      </div>

      <Link
        href={`/report/${REPORT_DETAIL.code}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 46, marginTop: 10, borderRadius: 11, background: '#1B6CF2', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
      >
        무료 리포트 신청하기
      </Link>
    </div>
  )
}
