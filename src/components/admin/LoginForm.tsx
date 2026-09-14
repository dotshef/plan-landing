'use client'

import { useState, type FormEvent } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(result.error ?? '로그인에 실패했습니다.')
        return
      }
      window.location.href = result.mustChangePassword ? '/admin/password' : '/admin/sector'
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 14px', border: '1.5px solid #E5E8EB',
    borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', background: '#F8FAFC',
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#F5F7FB' }}>
      <form onSubmit={handleSubmit} style={{ width: 380, maxWidth: '100%', background: '#fff', border: '1px solid #EEF1F6', borderRadius: 18, padding: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6CF2', marginBottom: 6 }}>PLAN ADMIN</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 24px' }}>관리자 로그인</h1>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4E5968', marginBottom: 6 }}>이메일</label>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          autoComplete="username" placeholder="admin@example.com" style={{ ...inputStyle, marginBottom: 14 }}
        />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4E5968', marginBottom: 6 }}>비밀번호</label>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password" placeholder="비밀번호" style={{ ...inputStyle, marginBottom: 18 }}
        />

        {error && <div style={{ marginBottom: 14, fontSize: 13, color: '#E8342B', fontWeight: 600 }}>{error}</div>}

        <button
          type="submit" disabled={busy || !email || !password}
          style={{
            width: '100%', height: 50, border: 'none', borderRadius: 12,
            background: busy || !email || !password ? '#B0B8C1' : '#1B6CF2', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: busy || !email || !password ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? '확인 중…' : '로그인'}
        </button>

        <p style={{ marginTop: 16, fontSize: 12, color: '#8B95A1', lineHeight: 1.6 }}>
          초대 메일의 임시 비밀번호로 로그인하면 비밀번호 재설정 화면으로 이동합니다.
        </p>
      </form>
    </div>
  )
}
