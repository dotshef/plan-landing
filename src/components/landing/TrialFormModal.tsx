'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import PageLeadForm from '@/components/common/PageLeadForm'

// 헤더 CTA·'플랜을 선택한 이유' 섹션 버튼이 이 이벤트로 모달을 연다 - 모달은 메인 페이지에만 마운트된다.
const OPEN_EVENT = 'plan:open-trial-modal'

export function openTrialModal() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

/** 서버 컴포넌트에서 쓰는 모달 열기 버튼. */
export function TrialModalTrigger({ className, style, children }: {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <button type="button" className={className} style={style} onClick={openTrialModal}>
      {children}
    </button>
  )
}

/**
 * 추천주 무료 체험 신청 모달 - 첫 화면 폼과 같은 PageLeadForm(SMS 인증·Turnstile) 사용.
 * 처음 열 때 마운트한 뒤 닫아도 유지한다: 입력값·완료 상태를 보존하고 Turnstile 위젯을 중복 렌더하지 않기 위함.
 * 패널에 transform 애니메이션을 쓰지 않는다 - 내부 ConsentModal(position: fixed)이 뷰포트 기준으로 뜨도록.
 */
export default function TrialFormModal() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const onOpen = () => { setMounted(true); setOpen(true) }
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])

  if (!mounted) return null

  return (
    <div
      className="trial-modal-overlay"
      onClick={() => setOpen(false)}
      style={{ display: open ? 'flex' : 'none' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="추천주 7일 무료 체험 신청"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, maxHeight: 'calc(100dvh - 40px)', overflow: 'auto', padding: '26px 24px 24px', boxShadow: '0 20px 60px rgba(17,40,90,.24)' }}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="닫기"
          className="cursor-pointer"
          style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'transparent', padding: 4, display: 'flex', color: '#8B95A1' }}
        >
          <X size={22} />
        </button>
        <PageLeadForm
          sourcePage="main"
          bare
          title="추천주 7일 무료 체험"
          badge={<span style={{ marginRight: 32, padding: '4px 10px', borderRadius: 6, background: '#FCEEED', color: '#E8342B', fontSize: 12, fontWeight: 700 }}>선착순 마감</span>}
          subtitle="매수·매도 타이밍을 장 시작 전 문자로 받아보세요"
          submitLabel="7일 무료 체험 시작하기"
          successMessage="담당자가 곧 연락드리겠습니다. 7일 뒤 자동으로 종료되며, 수신 거부는 언제든 가능합니다."
        />
      </div>
    </div>
  )
}
