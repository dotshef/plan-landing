'use client'

import { useState, type FormEvent } from 'react'

export default function PasswordForm({ email, forced }: { email: string; forced: boolean }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    if (next !== confirm) { setError('새 비밀번호가 서로 일치하지 않습니다.'); return }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(result.error ?? '비밀번호 변경에 실패했습니다.')
        return
      }
      window.location.href = '/admin/trial'
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 14px', border: '1.5px solid #E5E8EB',
    borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', background: '#F8FAFC', marginBottom: 14,
  }

  const canSubmit = !busy && current && next && confirm

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#F5F7FB' }}>
      <form onSubmit={handleSubmit} style={{ width: 380, maxWidth: '100%', background: '#fff', border: '1px solid #EEF1F6', borderRadius: 18, padding: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6CF2', marginBottom: 6 }}>PLAN ADMIN</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>비밀번호 재설정</h1>
        <p style={{ fontSize: 13, color: '#6B7684', margin: '0 0 24px', lineHeight: 1.6 }}>
          {forced
            ? '최초 로그인입니다. 임시 비밀번호 대신 사용할 새 비밀번호를 설정해주세요.'
            : `${email} 계정의 비밀번호를 변경합니다.`}
        </p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4E5968', marginBottom: 6 }}>
          {forced ? '임시 비밀번호' : '현재 비밀번호'}
        </label>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" style={inputStyle} />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4E5968', marginBottom: 6 }}>새 비밀번호</label>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" placeholder="8자 이상, 영문+숫자" style={inputStyle} />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4E5968', marginBottom: 6 }}>새 비밀번호 확인</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" style={{ ...inputStyle, marginBottom: 18 }} />

        {error && <div style={{ marginBottom: 14, fontSize: 13, color: '#E8342B', fontWeight: 600 }}>{error}</div>}

        <button
          type="submit" disabled={!canSubmit}
          style={{
            width: '100%', height: 50, border: 'none', borderRadius: 12,
            background: canSubmit ? '#1B6CF2' : '#B0B8C1', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {busy ? '변경 중…' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  )
}
