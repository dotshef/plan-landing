import Link from 'next/link'
import { getStockData } from '@/data/loader'
import { StockDataProvider } from '@/context/StockDataContext'
import ReportContent from '@/components/report/ReportContent'
import ApplicationPanel from '@/components/report/ApplicationPanel'

export default async function ReportPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const data = await getStockData(code)
  const { quote } = data
  return (
    <StockDataProvider data={data}>
      <div className="responsive-page-shell" style={{ maxWidth: 1320, margin: '0 auto', padding: 'var(--page-padding, 18px 28px 56px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, fontSize: 13, color: '#6B7684' }}>
          <Link href={`/stock/${quote.code}`} style={{ cursor: 'pointer', textDecoration: 'none', color: '#6B7684' }}>
            ← {quote.name}({quote.code}) 분석
          </Link>
          <span style={{ color: '#D1D6DB' }}>›</span>
          <span style={{ color: '#4E5968', fontWeight: 600 }}>전문가 리포트</span>
        </div>

        <div className="responsive-report-layout" style={{ display: 'grid', gridTemplateColumns: 'var(--layout-columns, 1.55fr 1fr)', gap: 20, alignItems: 'start' }}>
          <div className="responsive-section-card" style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 18, padding: 'var(--card-padding, 30px)' }}>
            <ReportContent />
          </div>
          <ApplicationPanel defaultStock={`${quote.name}(${quote.code})`} />
        </div>
      </div>
    </StockDataProvider>
  )
}
