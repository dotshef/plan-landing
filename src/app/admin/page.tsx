import { redirect } from 'next/navigation'

// /admin 진입 시 기본 패널로 리다이렉트. 인가 판정은 (panel) 레이아웃에서 수행.
export default function AdminIndexPage() {
  redirect('/admin/trial')
}
