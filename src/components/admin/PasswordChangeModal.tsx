'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 12px', border: '1.5px solid #E5E8EB', borderRadius: 10,
  fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#F8FAFC',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4E5968', marginBottom: 6,
}

export default function PasswordChangeModal({
  open,
  email,
  onClose,
}: {
  open: boolean
  email: string
  onClose: () => void
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) return
    setCurrent(''); setNext(''); setConfirm(''); setError(null); setDone(false)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    if (next !== confirm) { setError('새 비밀번호가 서로 일치하지 않습니다.'); return }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? '비밀번호 변경에 실패했습니다.'); return }
      setDone(true)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = !busy && current && next && confirm

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17,24,39,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(17,40,90,.24)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid #F2F4F6' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>비밀번호 변경</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', color: '#8B95A1' }}
              >
                <X size={20} />
              </button>
            </div>

            {done ? (
              <div>
                <div style={{ padding: '24px 22px', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 6 }}>비밀번호가 변경되었습니다</div>
                  <p style={{ margin: 0, fontSize: 13, color: '#6B7684', lineHeight: 1.6 }}>다음 로그인부터 새 비밀번호를 사용해주세요.</p>
                </div>
                <div style={{ display: 'flex', padding: '14px 22px', borderTop: '1px solid #F2F4F6' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{ flex: 1, height: 46, border: 'none', borderRadius: 12, background: '#1B6CF2', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  >
                    확인
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#8B95A1', lineHeight: 1.6 }}>
                    {email} 계정의 비밀번호를 변경합니다.
                  </p>
                  <div>
                    <label htmlFor="pw-current" style={labelStyle}>현재 비밀번호</label>
                    <input
                      id="pw-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
                      autoComplete="current-password" autoFocus style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="pw-next" style={labelStyle}>새 비밀번호</label>
                    <input
                      id="pw-next" type="password" value={next} onChange={(e) => setNext(e.target.value)}
                      autoComplete="new-password" placeholder="8자 이상, 영문+숫자" style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="pw-confirm" style={labelStyle}>새 비밀번호 확인</label>
                    <input
                      id="pw-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password" style={inputStyle}
                    />
                  </div>
                  {error && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#FCEEED', color: '#E8342B' }}>
                      {error}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, padding: '14px 22px', borderTop: '1px solid #F2F4F6' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{ flex: 1, height: 46, borderRadius: 12, background: '#fff', color: '#4E5968', fontSize: 14, fontWeight: 700, border: '1px solid #E5E8EB', cursor: 'pointer' }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    style={{
                      flex: 2, height: 46, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff',
                      background: canSubmit ? '#1B6CF2' : '#B0B8C1',
                      cursor: canSubmit ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {busy ? '변경 중…' : '비밀번호 변경'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
