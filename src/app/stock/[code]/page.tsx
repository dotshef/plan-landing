import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getStockData } from '@/data/loader'
import { getStockName } from '@/data/registry'
import { StockDataProvider } from '@/context/StockDataContext'
import StockPageContent from '@/components/stock/StockPageContent'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const name = await getStockName(code).catch(() => null)
  const label = name ? `${name}(${code})` : code
  const title = `${label} 종목 분석 — 시세·수급·재무 | 투자그룹 플랜`
  const description = `${label}의 실시간 시세, 외국인·기관 수급, 재무제표, AI 분석을 한눈에. 전문가 리포트를 무료로 확인하세요.`
  return {
    title,
    description,
    alternates: { canonical: `/stock/${code}` },
    openGraph: { title, description, type: 'website', url: `/stock/${code}` },
  }
}

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
