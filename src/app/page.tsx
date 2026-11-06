import HeroSection from '@/components/home/HeroSection'
import CompactLeadFormSection from '@/components/home/CompactLeadFormSection'
import BenefitsSection from '@/components/home/BenefitsSection'
import ReportCardsSection from '@/components/home/ReportCardsSection'
import TrustRowSection from '@/components/home/TrustRowSection'
import MarketIndexCardsSection from '@/components/landing/MarketIndexCardsSection'
import StickyLeadBar from '@/components/landing/StickyLeadBar'
import { getPopularStocks } from '@/data/registry'

// DB(야간 스냅샷) 기반 → 요청 시 렌더. 빌드 프리렌더 시 DB 호출 방지.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const popular = await getPopularStocks()
  return (
    <div style={{ background: 'linear-gradient(180deg,#fff 0%,#fff 60%,#F5F7FB 100%)' }}>
      <HeroSection stocks={popular} />
      <CompactLeadFormSection />
      <BenefitsSection />
      <ReportCardsSection />
      <MarketIndexCardsSection />
      <TrustRowSection />
      <StickyLeadBar sourcePage="main" />
    </div>
  )
}
