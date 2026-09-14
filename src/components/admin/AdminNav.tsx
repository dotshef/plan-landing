'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MENU = [
  { href: '/admin/sector', label: '4분기 섹터' },
  { href: '/admin/trial', label: '7일 체험 이미지' },
  { href: '/admin/users', label: '관리자 관리' },
]

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/admin/login'
  }

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #E5E8EB' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 4, height: 56, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#1B6CF2', marginRight: 14 }}>PLAN ADMIN</span>
        {MENU.map((m) => {
          const active = pathname.startsWith(m.href)
          return (
            <Link
              key={m.href} href={m.href}
              style={{
                padding: '8px 14px', borderRadius: 10, fontSize: 14, textDecoration: 'none',
                fontWeight: active ? 800 : 600,
                color: active ? '#1B6CF2' : '#4E5968',
                background: active ? '#EAF1FE' : 'transparent',
              }}
            >
              {m.label}
            </Link>
          )
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12.5, color: '#8B95A1' }}>{email}</span>
          <Link href="/admin/password" style={{ fontSize: 12.5, color: '#6B7684', textDecoration: 'none', fontWeight: 600 }}>비밀번호 변경</Link>
          <button
            onClick={handleLogout}
            style={{ border: '1px solid #E5E8EB', background: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 700, color: '#4E5968', cursor: 'pointer' }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
