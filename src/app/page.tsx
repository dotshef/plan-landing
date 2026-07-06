import HeroSection from '@/components/landing/HeroSection'
import ReportCards from '@/components/landing/ReportCards'
import MarketIndexCards from '@/components/landing/MarketIndexCards'
import TrustRow from '@/components/landing/TrustRow'

export default function HomePage() {
  return (
    <div style={{ background: 'linear-gradient(180deg,#fff 0%,#fff 60%,#F5F7FB 100%)' }}>
      <HeroSection />
      <ReportCards />
      <MarketIndexCards />
      <TrustRow />
    </div>
  )
}
