import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/admin/session'
import AdminNav from '@/components/admin/AdminNav'

export const dynamic = 'force-dynamic'

export const metadata = { robots: { index: false, follow: false } }

// 관리자 패널 공통 셸. 인가 판정은 getAdmin(세션 모듈) 한 곳에서만.
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')
  if (admin.must_change_password) redirect('/admin/password')

  return (
    <div style={{ background: '#F5F7FB', minHeight: '70vh' }}>
      <AdminNav email={admin.email} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>{children}</div>
    </div>
  )
}
