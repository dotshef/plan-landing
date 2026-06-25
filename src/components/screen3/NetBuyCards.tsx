'use client'

import { useStockData } from '@/context/StockDataContext'

function fmt(n: number) {
  const abs = Math.abs(n).toLocaleString('ko-KR')
  return (n >= 0 ? '+' : '-') + abs
}

const items = [
  { label: '개인',   key: 'individual'  as const },
  { label: '외국인', key: 'foreign'     as const },
  { label: '기관',   key: 'institution' as const },
]

export default function NetBuyCards() {
  const { chart } = useStockData()
  const NET_BUY_SUMMARY = chart.NET_BUY_SUMMARY
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
      {items.map((item) => {
        const val = NET_BUY_SUMMARY[item.key]
        const color = val >= 0 ? '#E8342B' : '#3182f6'
        return (
          <div key={item.label} style={{ border: '1px solid #EEF1F6', borderRadius: 10, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#8B95A1' }}>{item.label}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color, marginTop: 3 }}>{fmt(val)}</div>
            <div style={{ fontSize: 11, color }}>{val >= 0 ? '(매수)' : '(매도)'}</div>
          </div>
        )
      })}
    </div>
  )
}
