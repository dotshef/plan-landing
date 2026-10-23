import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/session'
import ProfileManager from '@/components/admin/ProfileManager'

export const dynamic = 'force-dynamic'

export const metadata = { title: '내 정보 관리 - 투자그룹 플랜' }

export default async function AdminMePage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/admin/login')
  return (
    <ProfileManager
      email={admin.email}
      name={admin.name}
      createdAt={admin.created_at}
      lastLoginAt={admin.last_login_at}
    />
  )
}
