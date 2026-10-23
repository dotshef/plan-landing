'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'

// 관리자 폼 모달 공통 셸(배경·헤더·ESC 닫기·스크롤 잠금). InviteAdminModal과 같은 모양.
export default function AdminModal({
  open,
  title,
  onClose,
  maxWidth = 480,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  maxWidth?: number
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

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
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth, maxHeight: 'calc(100dvh - 40px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(17,40,90,.24)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid #F2F4F6', flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', color: '#8B95A1' }}
              >
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** 모달 본문(스크롤) + 하단 버튼 영역. form 안에서 쓴다. */
export function ModalBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>{children}</div>
}

export function ModalFooter({
  onCancel,
  submitLabel,
  busy,
  canSubmit,
}: {
  onCancel: () => void
  submitLabel: string
  busy: boolean
  canSubmit: boolean
}) {
  const enabled = canSubmit && !busy
  return (
    <div style={{ display: 'flex', gap: 8, padding: '14px 22px', borderTop: '1px solid #F2F4F6', flexShrink: 0 }}>
      <button
        type="button"
        onClick={onCancel}
        style={{ flex: 1, height: 46, borderRadius: 12, background: '#fff', color: '#4E5968', fontSize: 14, fontWeight: 700, border: '1px solid #E5E8EB', cursor: 'pointer' }}
      >
        취소
      </button>
      <button
        type="submit"
        disabled={!enabled}
        style={{
          flex: 2, height: 46, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff',
          background: enabled ? '#1B6CF2' : '#B0B8C1',
          cursor: enabled ? 'pointer' : 'not-allowed',
        }}
      >
        {busy ? '저장 중…' : submitLabel}
      </button>
    </div>
  )
}
