'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { useStockData } from '@/context/StockDataContext'
import StockSidebar from '@/components/stock/StockSidebar'
import CandlestickChart from '@/components/stock/CandlestickChart'
import InvestorTrendBar from '@/components/stock/InvestorTrendBar'
import NewsAndAI from '@/components/stock/NewsAndAI'
import TechnicalIndicators from '@/components/stock/TechnicalIndicators'
import StockRightSidebar from '@/components/stock/StockRightSidebar'
import SupplyDemandChart from '@/components/stock/SupplyDemandChart'
import NetBuyCards from '@/components/stock/NetBuyCards'
import FinancialTable from '@/components/stock/FinancialTable'
import SupplyBottomSection from '@/components/stock/SupplyBottomSection'
import FinancialBottomSection from '@/components/stock/FinancialBottomSection'

type Tab = 'overview' | 'chart' | 'financial' | 'supply'

const TABS = [
  { key: 'overview',  label: '종합' },
  { key: 'chart',     label: '차트' },
  { key: 'financial', label: '재무' },
  { key: 'supply',    label: '수급' },
] as const

export default function StockPageContent() {
  const { quote: STOCK_QUOTE } = useStockData()
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawTab = searchParams.get('tab')
  const activeTab: Tab =
    rawTab === 'chart'     ? 'chart'     :
    rawTab === 'financial' ? 'financial' :
    rawTab === 'supply'    ? 'supply'    : 'overview'

  const [loading, setLoading] = useState(true)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setLoading(false); setAnimate(true) }, 1400)
    return () => clearTimeout(t)
  }, [])

  function handleTabClick(key: string) {
    const base = `/stock/${STOCK_QUOTE.code}`
    if (key === 'overview')  router.replace(base)
    if (key === 'chart')     router.replace(`${base}?tab=chart`)
    if (key === 'financial') router.replace(`${base}?tab=financial`)
    if (key === 'supply')    router.replace(`${base}?tab=supply`)
  }

  const tabsRow = (
    <div className="responsive-tabs" style={{ display: 'flex', borderBottom: '1px solid #EEF1F6', marginBottom: 16 }}>
      {TABS.map((t) => {
        const isActive = t.key === activeTab
        return (
          <button
            key={t.key}
            onClick={() => handleTabClick(t.key)}
            style={{
              padding: '0 0 13px', marginRight: 24, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', background: 'none', border: 'none',
              borderBottom: `2.5px solid ${isActive ? '#1B6CF2' : 'transparent'}`,
              color: isActive ? '#1B6CF2' : '#4E5968',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )

  const chartContent = (
    <>
      <CandlestickChart />
      <div style={{ marginTop: 14 }}><InvestorTrendBar /></div>
    </>
  )

  const centerContent = {
    overview: chartContent,
    chart: chartContent,
    financial: (
      <FinancialTable />
    ),
    supply: (
      <>
        <SupplyDemandChart />
        <div style={{ marginTop: 16 }}><NetBuyCards /></div>
      </>
    ),
  }

  return (
    <>
      <LoadingOverlay show={loading} />
      <div className="responsive-page-shell" style={{ maxWidth: 1320, margin: '0 auto', padding: 'var(--page-padding, 18px 28px 56px)' }}>

        {/* Breadcrumb */}
        <div className="responsive-breadcrumb" style={{ display: 'flex', alignItems: 'center', flexWrap: 'var(--breadcrumb-wrap, nowrap)' as CSSProperties['flexWrap'], gap: 12, marginBottom: 16, fontSize: 13 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7684', textDecoration: 'none' }}>← 검색 결과</Link>
          <span style={{ color: '#D1D6DB' }}>|</span>
          <span style={{ fontWeight: 700, color: '#1B6CF2' }}>{STOCK_QUOTE.code}</span>
          <span style={{ fontWeight: 600, color: '#4E5968' }}>{STOCK_QUOTE.name}</span>
        </div>

        {/* 3컬럼 고정 레이아웃 */}
        <div className="responsive-stock-layout" style={{ display: 'grid', gridTemplateColumns: 'var(--layout-columns, 236px 1fr 268px)', gap: 18, alignItems: 'start' }}>
          <StockSidebar animate={animate} />

          {/* 중앙 컬럼 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="responsive-section-card" style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: 'var(--card-padding, 20px 22px)' }}>
              {tabsRow}
              {centerContent[activeTab]}
            </div>
            {activeTab === 'chart'     ? <TechnicalIndicators />     :
             activeTab === 'supply'    ? <SupplyBottomSection />    :
             activeTab === 'financial' ? <FinancialBottomSection /> :
             <NewsAndAI />}
          </div>

          <StockRightSidebar />
        </div>

      </div>
    </>
  )
}
