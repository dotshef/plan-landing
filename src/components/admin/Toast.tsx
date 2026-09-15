'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleCheck, OctagonX } from 'lucide-react'

export interface ToastData { ok: boolean; text: string }

/** 액션 결과(성공/실패)를 하단 토스트로 표시 — 성공 4초, 실패 6초 후 자동 사라짐 */
export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((ok: boolean, text: string) => {
    setToast({ ok, text })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), ok ? 4000 : 6000)
  }, [])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return { toast, showToast }
}

export function Toast({ toast }: { toast: ToastData | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={`${toast.ok}-${toast.text}`}
          initial={{ opacity: 0, y: 16, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 16, x: '-50%' }}
          transition={{ duration: 0.22 }}
          style={{
            position: 'fixed', bottom: 32, left: '50%', zIndex: 200,
            display: 'flex', alignItems: 'center', gap: 8, maxWidth: 'calc(100vw - 40px)',
            padding: '13px 18px', borderRadius: 12, background: '#191F28', color: '#fff',
            fontSize: 13.5, fontWeight: 600, boxShadow: '0 12px 32px rgba(17,24,39,.28)',
          }}
        >
          {toast.ok
            ? <CircleCheck size={16} strokeWidth={2.2} color="#2BD98B" style={{ flexShrink: 0 }} />
            : <OctagonX size={16} strokeWidth={2.2} color="#FF6B5E" style={{ flexShrink: 0 }} />}
          {toast.text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
