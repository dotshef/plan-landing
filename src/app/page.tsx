import ProofHeroSection, { TRIAL_FORM_ID } from '@/components/landing/ProofHeroSection'
import SearchReportsSection from '@/components/landing/SearchReportsSection'
import WhyPlanSection from '@/components/landing/WhyPlanSection'
import PrinciplesSection from '@/components/landing/PrinciplesSection'
import MarketIndexCardsSection from '@/components/landing/MarketIndexCardsSection'
import StickyLeadBar from '@/components/landing/StickyLeadBar'
import TrialFormModal from '@/components/landing/TrialFormModal'
import { getPopularStocks } from '@/data/registry'
import { listMainProofs } from '@/lib/main/proofs'

// DB(야간 스냅샷) 기반 → 요청 시 렌더. 빌드 프리렌더 시 DB 호출 방지.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [popular, proofs] = await Promise.all([
    getPopularStocks(),
    listMainProofs().catch(() => []),
  ])
  return (
    <div style={{ background: '#F5F7FB' }}>
      <ProofHeroSection proofs={proofs} />
      <SearchReportsSection stocks={popular} />
      <WhyPlanSection />
      <PrinciplesSection />
      <div style={{ padding: '40px 0 24px' }}>
        <MarketIndexCardsSection />
      </div>
      <StickyLeadBar
        sourcePage="main"
        revealAfterId={TRIAL_FORM_ID}
        submitLabel="7일 무료 체험"
        successMessage="신청이 완료되었습니다! 담당자가 곧 연락드리겠습니다."
      />
      <TrialFormModal />
    </div>
  )
}
