import { redirect } from 'next/navigation'
import { can, requireAdmin } from '@/lib/admin/session'
import UsersManager from '@/components/admin/UsersManager'

export const dynamic = 'force-dynamic'

export const metadata = { title: '관리자 관리 - 투자그룹 플랜' }

export default async function AdminUsersPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/admin/login')
  if (!can(admin, 'users')) redirect('/admin')

  return <UsersManager />
}
