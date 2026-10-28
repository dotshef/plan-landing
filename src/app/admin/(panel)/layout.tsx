import { redirect } from 'next/navigation'
import { getAdmin, permissionsOf } from '@/lib/admin/session'
import AdminNav from '@/components/admin/AdminNav'
import s from '@/components/admin/admin.module.css'

export const dynamic = 'force-dynamic'

export const metadata = { robots: { index: false, follow: false } }

// 관리자 패널 공통 셸(LNB + 본문). 인가 판정은 getAdmin(세션 모듈) 한 곳에서만.
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')
  if (admin.must_change_password) redirect('/admin/password')

  return (
    <div className={s.shell}>
      <AdminNav email={admin.email} name={admin.name} role={admin.role} permissions={permissionsOf(admin)} />
      <div className={s.main}>
        <div className={s.content}>{children}</div>
      </div>
    </div>
  )
}
