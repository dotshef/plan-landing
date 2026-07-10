'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'

export type ConsentKind = 'privacy' | 'agree'

const PRIVACY_TEXT = (
  <>
    투자그룹 플랜은 무료 리포트 제공을 위해 아래와 같이 개인정보를 수집 및 이용합니다.<br />
    <br />
    · 수집 항목: 이름, 연락처, 관심 종목<br />
    · 이용 목적: 무료 리포트 제공 및 투자 정보 안내<br />
    · 보유 기간: 동의일로부터 1년<br />
  </>
)

const AGREE_TEXT = (
  <>
    회사는 무료 리포트, 투자정보, 시장 브리핑, 이벤트 및 신규 서비스 안내를 위해 아래와 같이 마케팅 정보를 제공합니다.<br />
    <br />
    1. 수신 항목<br />
    · 문자(SMS/LMS)<br />
    · 전화<br />
    · 카카오톡<br />
    <br />
    2. 이용 목적<br />
    · 무료 리포트 제공<br />
    · 투자 관련 정보 및 시장 브리핑 안내<br />
    · 이벤트 및 프로모션 안내<br />
    · 신규 서비스 및 콘텐츠 안내<br />
    <br />
    3. 보유 및 이용 기간<br />
    동의 철회 시까지<br />
    <br />
    ※ 귀하는 마케팅 정보 수신에 대한 동의를 거부할 권리가 있으며, 동의하지 않으셔도 서비스 이용에는 제한이 없습니다.<br />
    <br />
    고객센터<br />
    대표번호 : 1877-4260<br />
    운영시간 : 평일 09:00 ~ 18:00 (주말 및 공휴일 휴무)<br />
    <br />
    문의사항은 고객센터를 통해 접수해 주시기 바랍니다
  </>
)

const CONTENT: Record<ConsentKind, { title: string; body: React.ReactNode }> = {
  privacy: { title: '개인정보 수집·이용 동의', body: PRIVACY_TEXT },
  agree: { title: '마케팅 정보 수신 동의', body: AGREE_TEXT },
}

export default function ConsentModal({ kind, onClose }: { kind: ConsentKind | null; onClose: () => void }) {
  // ESC 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!kind) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [kind, onClose])

  return (
    <AnimatePresence>
      {kind && (
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
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 460, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(17,40,90,.24)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid #F2F4F6' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{CONTENT[kind].title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', color: '#8B95A1' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px 22px', overflow: 'auto', fontSize: 13, color: '#4E5968', lineHeight: 1.6 }}>
              {CONTENT[kind].body}
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #F2F4F6' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ width: '100%', height: 48, border: 'none', borderRadius: 12, background: '#1B6CF2', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
              >
                확인
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
