import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/admin/session'
import PasswordForm from '@/components/admin/PasswordForm'

export const dynamic = 'force-dynamic'

export const metadata = { title: '비밀번호 재설정 — 투자그룹 플랜', robots: { index: false, follow: false } }

export default async function AdminPasswordPage() {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')
  return <PasswordForm email={admin.email} forced={admin.must_change_password} />
}
