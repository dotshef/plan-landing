'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileCheck, Gift, ImageIcon, Inbox, LayoutDashboard, LogOut, Menu, MessageSquareQuote, TrendingUp, UserRound, Users, Wallet, X,
  type LucideIcon,
} from 'lucide-react'
import { ROLE_LABEL, type AdminRole, type Permission } from '@/lib/admin/roles'
import s from './admin.module.css'

// permission이 있는 메뉴는 해당 권한이 있을 때만 노출(실제 차단은 페이지·API의 can()이 담당)
interface MenuItem { href: string; label: string; icon: LucideIcon; permission?: Permission }

const MENU: { group: string | null; items: MenuItem[] }[] = [
  { group: null, items: [{ href: '/admin', label: '대시보드', icon: LayoutDashboard }] },
  {
    group: '신청 관리',
    items: [
      { href: '/admin/leads/main', label: '메인 페이지 신청', icon: Inbox, permission: 'leads' },
      { href: '/admin/leads/income', label: '두 번째 월급 페이지 신청', icon: Wallet, permission: 'leads' },
    ],
  },
  {
    group: '콘텐츠',
    items: [
      { href: '/admin/proofs', label: '공증 자료 관리', icon: FileCheck },
      { href: '/admin/income-reviews', label: '두번째 월급 후기 관리', icon: MessageSquareQuote },
      { href: '/admin/site-images', label: '페이지 이미지 관리', icon: ImageIcon },
      { href: '/admin/trial', label: '7일 체험 관리', icon: Gift },
      { href: '/admin/sector', label: '주도 섹터', icon: TrendingUp },
    ],
  },
  {
    group: '계정',
    items: [
      { href: '/admin/users', label: '관리자 관리', icon: Users, permission: 'users' },
      { href: '/admin/me', label: '내 정보 관리', icon: UserRound },
    ],
  },
]

function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

// 관리자 LNB. 데스크톱은 왼쪽 고정, 모바일은 상단 바의 메뉴 버튼으로 여는 드로어.
export default function AdminNav({ email, name, role, permissions }: {
  email: string
  name: string | null
  role: AdminRole
  permissions: Permission[]
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const menu = MENU
    .map(({ group, items }) => ({
      group,
      items: items.filter((item) => !item.permission || permissions.includes(item.permission)),
    }))
    .filter(({ items }) => items.length > 0)

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/admin/login'
  }

  return (
    <>
      <div className={s.topbar}>
        <Link href="/admin" className={s.brand}>PLAN ADMIN</Link>
        <button type="button" className={s.menuBtn} onClick={() => setOpen(true)} aria-label="메뉴 열기">
          <Menu size={22} />
        </button>
      </div>

      {open && <div className={s.backdrop} onClick={() => setOpen(false)} />}

      <aside className={`${s.lnb} ${open ? s.lnbOpen : ''}`}>
        <div className={s.brand} style={{ justifyContent: 'space-between' }}>
          <Link href="/admin" onClick={() => setOpen(false)} style={{ color: 'inherit', textDecoration: 'none' }}>PLAN ADMIN</Link>
          {open && (
            <button type="button" className={s.menuBtn} onClick={() => setOpen(false)} aria-label="메뉴 닫기">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className={s.nav}>
          {menu.map(({ group, items }) => (
            <div key={group ?? 'root'} className={s.group}>
              {group && <div className={s.groupLabel}>{group}</div>}
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href)
                return (
                  <Link
                    key={href} href={href} onClick={() => setOpen(false)}
                    className={`${s.item} ${active ? s.itemActive : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                    {label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className={s.account}>
          <div className={s.accountName}>
            {name || '관리자'}
            <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: role === 'admin' ? '#1B6CF2' : '#8B95A1' }}>
              {ROLE_LABEL[role]}
            </span>
          </div>
          <div className={s.accountEmail}>{email}</div>
          <button type="button" className={s.logout} onClick={handleLogout}>
            <LogOut size={14} /> 로그아웃
          </button>
        </div>
      </aside>
    </>
  )
}
