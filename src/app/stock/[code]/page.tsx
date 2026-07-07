import { Suspense } from 'react'
import { getStockData } from '@/data/loader'
import { StockDataProvider } from '@/context/StockDataContext'
import StockPageContent from '@/components/stock/StockPageContent'

export default async function StockPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const data = await getStockData(code)
  return (
    <StockDataProvider data={data}>
      <Suspense fallback={<div className="flex items-center justify-center h-64 text-grey-400 text-sm">로딩 중...</div>}>
        <StockPageContent />
      </Suspense>
    </StockDataProvider>
  )
}
