'use client'

import { useCallback, useEffect, useState } from 'react'

import InviteAdminModal from './InviteAdminModal'
import { Toast, useToast } from './Toast'

interface AdminRow {
  id: number
  email: string
  name: string | null
  must_change_password: boolean
  temp_password_expires_at: string | null
  last_login_at: string | null
  created_at: string
}

const card: React.CSSProperties = { background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: 24, marginBottom: 20 }

function btnStyle(kind: 'primary' | 'ghost' | 'danger', disabled = false): React.CSSProperties {
  const base: React.CSSProperties = {
    height: 40, padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer', border: '1px solid transparent',
  }
  if (kind === 'primary') return { ...base, background: disabled ? '#B0B8C1' : '#1B6CF2', color: '#fff', border: 'none' }
  if (kind === 'danger') return { ...base, background: '#fff', color: '#E8342B', border: '1px solid #F3D2D0' }
  return { ...base, background: '#fff', color: '#4E5968', border: '1px solid #E5E8EB' }
}

export default function UsersManager() {
  const [users, setUsers] = useState<AdminRow[]>([])
  const [me, setMe] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const { toast, showToast } = useToast()

  const load = useCallback(async () => {
    // 최초 로딩 상태는 useState(true)가 담당 — 이펙트 내 동기 setState 회피
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json().catch(() => ({}))
      if (res.ok) { setUsers(data.users ?? []); setMe(data.me ?? null) }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleInvited(message: string) {
    showToast(true, message)
    await load()
  }

  async function handleReset(user: AdminRow) {
    if (!window.confirm(`${user.email}의 임시 비밀번호를 재발급할까요?\n기존 비밀번호와 로그인 세션이 모두 무효화됩니다.`)) return
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) showToast(true, `${user.email} 앞으로 임시 비밀번호를 재발송했습니다.`)
    else showToast(false, data.error ?? '재발급에 실패했습니다.')
    await load()
  }

  async function handleDelete(user: AdminRow) {
    if (!window.confirm(`${user.email} 관리자를 삭제할까요?`)) return
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) showToast(true, `${user.email} 관리자를 삭제했습니다.`)
    else showToast(false, data.error ?? '삭제에 실패했습니다.')
    await load()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 20px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>관리자 관리</h1>
        <button onClick={() => setInviteOpen(true)} style={btnStyle('primary')}>
          관리자 초대
        </button>
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['이메일', '이름', '상태', '마지막 로그인', '등록일', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12.5, color: '#8B95A1', fontWeight: 600, borderBottom: '1px solid #F2F4F6' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#8B95A1' }}>불러오는 중…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#8B95A1' }}>등록된 관리자가 없습니다.</td></tr>
            ) : users.map((u) => {
              const tempExpired = u.must_change_password && u.temp_password_expires_at
                && new Date(u.temp_password_expires_at) <= new Date()
              return (
                <tr key={u.id}>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #F2F4F6', fontWeight: 700, color: '#191F28' }}>
                    {u.email}{u.id === me && <span style={{ marginLeft: 6, fontSize: 11, color: '#1B6CF2', fontWeight: 800 }}>나</span>}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #F2F4F6', color: '#4E5968' }}>{u.name ?? '—'}</td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #F2F4F6' }}>
                    {u.must_change_password ? (
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: tempExpired ? '#FCEEED' : '#FFF4E0', color: tempExpired ? '#E8342B' : '#92610A' }}>
                        {tempExpired ? '임시 비밀번호 만료' : '초대됨 (재설정 대기)'}
                      </span>
                    ) : (
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: '#EAF7F1', color: '#03B26C' }}>활성</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #F2F4F6', color: '#6B7684' }}>
                    {u.last_login_at ? u.last_login_at.slice(0, 16).replace('T', ' ') : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #F2F4F6', color: '#6B7684' }}>{u.created_at.slice(0, 10)}</td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #F2F4F6', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => handleReset(u)} style={{ ...btnStyle('ghost'), height: 32, padding: '0 10px', fontSize: 12, marginRight: 6 }}>
                      임시 비번 재발급
                    </button>
                    {u.id !== me && (
                      <button onClick={() => handleDelete(u)} style={{ ...btnStyle('danger'), height: 32, padding: '0 10px', fontSize: 12 }}>
                        삭제
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <InviteAdminModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={(message) => void handleInvited(message)}
      />

      <Toast toast={toast} />
    </div>
  )
}
