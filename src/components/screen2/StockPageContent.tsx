'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, Share2 } from 'lucide-react'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { useStockData } from '@/context/StockDataContext'
import StockSidebar from '@/components/screen2/StockSidebar'
import CandlestickChart from '@/components/screen2/CandlestickChart'
import InvestorTrendBar from '@/components/screen2/InvestorTrendBar'
import NewsAndAI from '@/components/screen2/NewsAndAI'
import TechnicalIndicators from '@/components/screen2/TechnicalIndicators'
import Screen2RightSidebar from '@/components/screen2/Screen2RightSidebar'
import SupplyDemandChart from '@/components/screen3/SupplyDemandChart'
import NetBuyCards from '@/components/screen3/NetBuyCards'
import FinancialTable from '@/components/screen3/FinancialTable'
import SupplyBottomSection from '@/components/screen3/SupplyBottomSection'
import FinancialBottomSection from '@/components/screen3/FinancialBottomSection'

type Tab = 'overview' | 'chart' | 'financial' | 'supply'

const TABS = [
  { key: 'overview',  label: '종합' },
  { key: 'chart',     label: '차트' },
  { key: 'financial', label: '재무' },
  { key: 'dead',      label: '뉴스' },
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

  const [loading, setLoading]       = useState(true)
  const [animate, setAnimate]       = useState(false)
  const [watchlisted, setWatchlisted] = useState(false)
  const [animKey, setAnimKey]       = useState(0)

  const toggleWatchlist = () => { setWatchlisted(w => !w); setAnimKey(k => k + 1) }

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
    <div style={{ display: 'flex', borderBottom: '1px solid #EEF1F6', marginBottom: 16 }}>
      {TABS.map((t) => {
        const isActive = t.key === activeTab
        const isDead   = t.key.startsWith('dead')
        return (
          <button
            key={t.key}
            onClick={() => handleTabClick(t.key)}
            style={{
              padding: '0 0 13px', marginRight: 24, fontSize: 15, fontWeight: 700,
              cursor: isDead ? 'default' : 'pointer', background: 'none', border: 'none',
              borderBottom: `2.5px solid ${isActive ? '#1B6CF2' : 'transparent'}`,
              color: isActive ? '#1B6CF2' : isDead ? '#D1D6DB' : '#4E5968',
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
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '18px 28px 56px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, fontSize: 13 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7684', textDecoration: 'none' }}>← 검색 결과</Link>
          <span style={{ color: '#D1D6DB' }}>|</span>
          <span style={{ fontWeight: 700, color: '#1B6CF2' }}>{STOCK_QUOTE.code}</span>
          <span style={{ fontWeight: 600, color: '#4E5968' }}>{STOCK_QUOTE.name}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 18 }}>
            <span
              onClick={toggleWatchlist}
              style={{ color: '#6B7684', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, userSelect: 'none' }}
            >
              <span key={animKey} className={animKey > 0 ? 'star-burst' : ''}>
                <Star size={14} color={watchlisted ? '#F5C900' : '#6B7684'} fill={watchlisted ? '#F5C900' : 'none'} style={{ transition: 'color 0.2s' }} />
              </span>
              {watchlisted ? '관심종목 추가됨' : '관심종목 추가'}
            </span>
            <span style={{ color: '#6B7684', cursor: 'default', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Share2 size={14} color="#6B7684" /> 공유하기
            </span>
          </div>
        </div>

        {/* 3컬럼 고정 레이아웃 */}
        <div style={{ display: 'grid', gridTemplateColumns: '236px 1fr 268px', gap: 18, alignItems: 'start' }}>
          <StockSidebar animate={animate} watchlisted={watchlisted} animKey={animKey} onToggleWatchlist={toggleWatchlist} />

          {/* 중앙 컬럼 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: '20px 22px' }}>
              {tabsRow}
              {centerContent[activeTab]}
            </div>
            {activeTab === 'chart'     ? <TechnicalIndicators />     :
             activeTab === 'supply'    ? <SupplyBottomSection />    :
             activeTab === 'financial' ? <FinancialBottomSection /> :
             <NewsAndAI />}
          </div>

          <Screen2RightSidebar />
        </div>

      </div>
    </>
  )
}
