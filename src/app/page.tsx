import HeroSection from '@/components/landing/HeroSection'
import ReportCards from '@/components/landing/ReportCards'
import MarketIndexCards from '@/components/landing/MarketIndexCards'
import TrustRow from '@/components/landing/TrustRow'
import { getPopularStocks } from '@/data/registry'

// DB(야간 스냅샷) 기반 → 요청 시 렌더. 빌드 프리렌더 시 DB 호출 방지.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const popular = await getPopularStocks()
  return (
    <div style={{ background: 'linear-gradient(180deg,#fff 0%,#fff 60%,#F5F7FB 100%)' }}>
      <HeroSection stocks={popular} />
      <ReportCards />
      <MarketIndexCards />
      <TrustRow />
    </div>
  )
}
