import { getMarketIndices } from '@/data/market-indices'
import SparklineChart from '@/components/common/SparklineChart'

export default async function MarketIndexCards() {
  const indices = await getMarketIndices()
  return (
    <div className="responsive-section-shell" style={{ maxWidth: 1320, margin: '0 auto', padding: 'var(--section-padding, 16px 28px 8px)' }}>
      <div className="responsive-section-card" style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 18, padding: 'var(--card-padding, 26px 28px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>주요 시장 지수</div>
        </div>
        <div className="responsive-card-grid-4" style={{ display: 'grid', gridTemplateColumns: 'var(--grid-columns, repeat(4,1fr))', gap: 14 }}>
          {indices.map((ix) => (
            <div key={ix.name} style={{ border: '1px solid #EEF1F6', borderRadius: 13, padding: '15px 15px 0', overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7684' }}>{ix.name}</div>
              <div style={{ fontSize: 23, fontWeight: 800, color: '#111827', marginTop: 4 }}>
                {ix.value.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 3, color: ix.isRise ? '#E8342B' : '#3182f6' }}>
                {ix.isRise ? '▲' : '▼'} {Math.abs(ix.change).toFixed(2)} ({Math.abs(ix.changeRate).toFixed(2)}%)
              </div>
              <div style={{ height: 46, margin: '8px -15px 0' }}>
                <SparklineChart data={ix.sparkline} isRise={ix.isRise} height={46} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
