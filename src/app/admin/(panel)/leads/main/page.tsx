import LeadManager from '@/components/admin/LeadManager'

export const dynamic = 'force-dynamic'

export const metadata = { title: '메인 페이지 신청 관리 - 투자그룹 플랜' }

export default function AdminMainLeadsPage() {
  return (
    <LeadManager
      kind="main"
      title="메인 페이지 신청 관리"
      description="메인 페이지에서 접수된 신청입니다."
      showStock
    />
  )
}
