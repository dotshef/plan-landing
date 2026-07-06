'use client'

import { useStockData } from '@/context/StockDataContext'

const fmt = (n: number) => {
  const abs = Math.abs(n)
  return (n >= 0 ? '+' : '-') + abs.toLocaleString('ko-KR')
}

const items = [
  { label: '개인',   key: 'individual'  as const },
  { label: '외국인', key: 'foreign'     as const },
  { label: '기관',   key: 'institution' as const },
]

export default function InvestorTrendBar() {
  const { chart } = useStockData()
  const NET_BUY_SUMMARY = chart.NET_BUY_SUMMARY
  const NET_BUY_DATE = chart.NET_BUY_DATE
  return (
    <div style={{ borderTop: '1px solid #EEF1F6', marginTop: 14, paddingTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>투자자별 매매 동향</div>
        <div style={{ fontSize: 11, color: '#8B95A1' }}>{NET_BUY_DATE} 기준 (단위 : 주)</div>
      </div>
      <div className="responsive-grid-3" style={{ display: 'grid', gridTemplateColumns: 'var(--grid-columns, repeat(3,1fr))', gap: 12 }}>
        {items.map((item) => {
          const val = NET_BUY_SUMMARY[item.key]
          return (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: '#6B7684' }}>{item.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: val >= 0 ? '#E8342B' : '#3182f6' }}>
                {fmt(val)}주
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
