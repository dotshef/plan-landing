import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/admin/session'
import LoginForm from '@/components/admin/LoginForm'

export const dynamic = 'force-dynamic'

export const metadata = { title: '관리자 로그인 — 투자그룹 플랜', robots: { index: false, follow: false } }

export default async function AdminLoginPage() {
  const admin = await getAdmin()
  if (admin) redirect(admin.must_change_password ? '/admin/password' : '/admin/sector')
  return <LoginForm />
}
