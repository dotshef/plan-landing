'use client'

import { useStockData } from '@/context/StockDataContext'

const fmt = (n: number) => n.toLocaleString('ko-KR')

export default function FinancialTable() {
  const { quote, fin } = useStockData()
  const { FINANCIAL_METRICS, ANNUAL_FINANCIALS } = fin
  const metrics = [
    { label: 'PER',  value: FINANCIAL_METRICS.per.toFixed(1) + '배' },
    { label: 'PBR',  value: FINANCIAL_METRICS.pbr.toFixed(1) + '배' },
    { label: 'ROE',  value: FINANCIAL_METRICS.roe.toFixed(1) + '%' },
    { label: 'EPS',  value: fmt(FINANCIAL_METRICS.eps) + '원' },
    { label: 'DY',   value: FINANCIAL_METRICS.dividendYield.toFixed(2) + '%' },
    { label: '시총', value: (quote.marketCap / 1e12).toFixed(0) + '조' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>주요 재무 지표</div>
        <span style={{ fontSize: 12, color: '#8B95A1', cursor: 'default' }}>연간 ▾</span>
      </div>

      {/* 3×2 지표 카드 */}
      <div className="responsive-financial-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: '#F7F8FA', border: '1px solid #EEF1F6', borderRadius: 10, padding: 13, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#8B95A1' }}>{m.label}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* 연도별 실적 테이블 */}
      <div style={{ marginTop: 18, fontSize: 11, color: '#8B95A1', marginBottom: 8 }}>(단위: 십억원)</div>
      <div className="responsive-table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <td style={{ padding: '8px 4px', textAlign: 'left' }}></td>
              {ANNUAL_FINANCIALS.map((f, index) => (
                <td key={f.year} className={index === 0 ? 'mobile-hide-oldest-financial-col' : undefined} style={{ textAlign: 'right', padding: '8px 4px', color: f.year === '2024E' ? '#1B6CF2' : '#8B95A1', fontWeight: f.year === '2024E' ? 700 : 500, fontSize: 13 }}>
                  {f.year}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: '매출액',   key: 'revenue'         as const },
              { label: '영업이익', key: 'operatingProfit'  as const },
              { label: '순이익',   key: 'netProfit'        as const },
              { label: 'EPS(원)',  key: 'eps'              as const },
            ].map((row) => (
              <tr key={row.label} style={{ borderTop: '1px solid #F2F4F6' }}>
                <td style={{ padding: '11px 4px', color: '#6B7684', fontWeight: 500 }}>{row.label}</td>
                {ANNUAL_FINANCIALS.map((f, index) => (
                  <td key={f.year} className={index === 0 ? 'mobile-hide-oldest-financial-col' : undefined} style={{ textAlign: 'right', padding: '11px 4px', color: f.year === '2024E' ? '#111827' : '#4E5968', fontWeight: f.year === '2024E' ? 700 : 400 }}>
                    {fmt(f[row.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
