'use client'

import SparklineChart from '@/components/common/SparklineChart'
import { useStockData } from '@/context/StockDataContext'

function signalStyle(signalUp: boolean | null): React.CSSProperties {
  if (signalUp === true)  return { color: '#E8342B' }
  if (signalUp === false) return { color: '#3182f6' }
  return { color: '#8B95A1' }
}

export default function TechnicalIndicators() {
  const { chart } = useStockData()
  const INDICATORS = chart.TECHNICAL_INDICATORS
  return (
    <div className="responsive-section-card" style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: 'var(--card-padding, 20px 22px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>기술적 지표</span>
      </div>

      <div className="responsive-grid-5" style={{ display: 'grid', gridTemplateColumns: 'var(--grid-columns, repeat(5, 1fr))', gap: 0 }}>
        {INDICATORS.map((ind, i) => (
          <div
            key={ind.name}
            style={{
              padding: '0 16px',
              borderLeft: i > 0 ? '1px solid #EEF1F6' : 'none',
            }}
          >
            <div style={{ fontSize: 12, color: '#8B95A1', fontWeight: 600, marginBottom: 6 }}>{ind.name}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{ind.value}</div>
            {ind.sub
              ? <div style={{ fontSize: 11, color: '#8B95A1', marginTop: 3 }}>{ind.sub}</div>
              : <div style={{ fontSize: 12, fontWeight: 700, marginTop: 3, ...signalStyle(ind.signalUp) }}>{ind.signal}</div>
            }
            {ind.sub && (
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, ...signalStyle(ind.signalUp) }}>{ind.signal}</div>
            )}
            <div style={{ marginTop: 10 }}>
              <SparklineChart data={ind.data} isRise={ind.isRise} height={40} />
            </div>
          </div>
        ))}
      </div>

      <button style={{ width: '100%', height: 40, marginTop: 18, border: '1px solid #E5E8EB', borderRadius: 10, background: '#fff', color: '#1B6CF2', fontSize: 13, fontWeight: 700, cursor: 'default' }}>
        기술적 지표 상세 보기 ›
      </button>
    </div>
  )
}
