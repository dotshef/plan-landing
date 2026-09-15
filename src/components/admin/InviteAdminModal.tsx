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

export default function InviteAdminModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setEmail(''); setName(''); setError(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? '초대에 실패했습니다.'); return }
      onSuccess(`${email} 앞으로 초대 메일을 발송했습니다.`)
      onClose()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

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
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>관리자 초대</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', color: '#8B95A1' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label htmlFor="invite-email" style={labelStyle}>이메일 (필수)</label>
                  <input
                    id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com" required autoFocus style={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="invite-name" style={labelStyle}>이름 (선택)</label>
                  <input
                    id="invite-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동" style={inputStyle}
                  />
                </div>
                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#FCEEED', color: '#E8342B' }}>
                    {error}
                  </div>
                )}
                <p style={{ margin: 0, fontSize: 12.5, color: '#8B95A1', lineHeight: 1.6 }}>
                  입력한 이메일로 임시 비밀번호(7일 유효)가 발송됩니다. 초대받은 사람은 최초 로그인 시 비밀번호를 재설정해야 합니다.
                </p>
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
                  disabled={busy || !email}
                  style={{
                    flex: 2, height: 46, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff',
                    background: busy || !email ? '#B0B8C1' : '#1B6CF2',
                    cursor: busy || !email ? 'not-allowed' : 'pointer',
                  }}
                >
                  {busy ? '발송 중…' : '초대 메일 발송'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
