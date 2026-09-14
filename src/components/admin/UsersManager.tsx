'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'

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
const inputStyle: React.CSSProperties = {
  height: 44, padding: '0 12px', border: '1.5px solid #E5E8EB', borderRadius: 10,
  fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#F8FAFC',
}

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
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)

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

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setNotice({ ok: false, text: data.error ?? '초대에 실패했습니다.' }); return }
      setNotice({ ok: true, text: `${email} 앞으로 초대 메일을 발송했습니다.` })
      setEmail(''); setName('')
      await load()
    } catch {
      setNotice({ ok: false, text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleReset(user: AdminRow) {
    if (!window.confirm(`${user.email}의 임시 비밀번호를 재발급할까요?\n기존 비밀번호와 로그인 세션이 모두 무효화됩니다.`)) return
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    setNotice(res.ok
      ? { ok: true, text: `${user.email} 앞으로 임시 비밀번호를 재발송했습니다.` }
      : { ok: false, text: data.error ?? '재발급에 실패했습니다.' })
    await load()
  }

  async function handleDelete(user: AdminRow) {
    if (!window.confirm(`${user.email} 관리자를 삭제할까요?`)) return
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setNotice(res.ok
      ? { ok: true, text: `${user.email} 관리자를 삭제했습니다.` }
      : { ok: false, text: data.error ?? '삭제에 실패했습니다.' })
    await load()
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '4px 0 20px' }}>관리자 관리</h1>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 14 }}>관리자 초대</div>
        <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 (필수)" required style={{ ...inputStyle, flex: '1 1 240px' }}
          />
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="이름 (선택)" style={{ ...inputStyle, flex: '0 1 160px' }}
          />
          <button type="submit" disabled={busy || !email} style={btnStyle('primary', busy || !email)}>
            {busy ? '발송 중…' : '초대 메일 발송'}
          </button>
        </form>
        <p style={{ margin: '12px 0 0', fontSize: 12.5, color: '#8B95A1', lineHeight: 1.6 }}>
          입력한 이메일로 임시 비밀번호(7일 유효)가 발송됩니다. 초대받은 사람은 최초 로그인 시 비밀번호를 재설정해야 합니다.
        </p>
      </div>

      {notice && (
        <div style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 12, fontSize: 13.5, fontWeight: 600,
          background: notice.ok ? '#EAF7F1' : '#FCEEED', color: notice.ok ? '#03B26C' : '#E8342B',
        }}>
          {notice.text}
        </div>
      )}

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
    </div>
  )
}
