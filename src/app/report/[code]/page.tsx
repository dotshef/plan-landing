import Link from 'next/link'
import { getStockData } from '@/data/loader'
import { StockDataProvider } from '@/context/StockDataContext'
import ReportContent from '@/components/screen4/ReportContent'
import ApplicationPanel from '@/components/screen4/ApplicationPanel'

export default async function ReportPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const data = getStockData(code)
  const { quote } = data
  return (
    <StockDataProvider data={data}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '18px 28px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, fontSize: 13, color: '#6B7684' }}>
          <Link href={`/stock/${quote.code}`} style={{ cursor: 'pointer', textDecoration: 'none', color: '#6B7684' }}>
            ← {quote.name}({quote.code}) 분석
          </Link>
          <span style={{ color: '#D1D6DB' }}>›</span>
          <span style={{ color: '#4E5968', fontWeight: 600 }}>전문가 리포트</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 18, padding: 30 }}>
            <ReportContent />
          </div>
          <ApplicationPanel />
        </div>
      </div>
    </StockDataProvider>
  )
}
