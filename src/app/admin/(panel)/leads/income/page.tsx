import { redirect } from 'next/navigation'
import { can, requireAdmin } from '@/lib/admin/session'
import LeadManager from '@/components/admin/LeadManager'

export const dynamic = 'force-dynamic'

export const metadata = { title: '두 번째 월급 페이지 신청 관리 - 투자그룹 플랜' }

export default async function AdminIncomeLeadsPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/admin/login')
  if (!can(admin, 'leads')) redirect('/admin')

  return (
    <LeadManager
      kind="income"
      title="두 번째 월급 페이지 신청 관리"
      description="두 번째 월급 페이지에서 접수된 신청입니다."
      showStock={false}
    />
  )
}
