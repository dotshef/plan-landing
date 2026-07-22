'use client'

import { useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { useReportRequest } from '@/hooks/useReportRequest'
import { formatPhone } from '@/lib/phone'
import ConsentModal, { type ConsentKind } from './ConsentModal'

const H = 46

// 원색 블루 바 위라 인풋은 불투명 흰색. 보더는 두께만 유지(투명)해 포커스 시 리플로우 방지.
const field: CSSProperties = {
  height: H,
  borderRadius: 10,
  padding: '0 13px',
  minWidth: 0,
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  border: '1px solid transparent',
}

const secondaryBtn: CSSProperties = {
  flexShrink: 0,
  height: H,
  padding: '0 13px',
  borderRadius: 10,
  border: 0,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

// 하단 고정 리드 폼 바. 데스크톱은 한 줄, 모바일(≤768px)은 여러 줄로 재배치
// (globals.css의 .slb-* 규칙 담당). 인증번호·확인 행은 발송 후에만 노출된다(점진 노출).
// 폼 로직(인증·제출·전환추적)은 useReportRequest 훅이 담당한다.
export default function StickyLeadBar() {
  const {
    form, setForm,
    submitted, submitting, errors,
    codeSent, sending, verifying, verified, code, setCode, secondsLeft,
    phoneValid, mmss,
    handlePhoneChange, handleSendCode, handleVerifyCode, handleSubmit,
    turnstileRef,
  } = useReportRequest()

  const [modal, setModal] = useState<ConsentKind | null>(null)

  const canSubmit = !submitting && form.privacy && form.agree && verified
  const canSend = phoneValid && !sending && !verified
  const canVerify = codeSent && !verified && !verifying && code.length === 6
  const codeRowOpen = codeSent && !verified
  const consentOn = form.privacy && form.agree
  const firstError = errors.name || errors.phone || errors.code || errors.privacy || errors.agree || errors.submit

  return (
    <>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 90,
          background: '#1B6CF2',
          boxShadow: '0 -6px 24px rgba(17,40,90,.18)',
        }}
      >
            <div className="slb-bar" style={{ maxWidth: 1320, margin: '0 auto', padding: '12px 24px' }}>
              {/* Cloudflare Turnstile 위젯 컨테이너 — 체크박스 챌린지가 필요한 방문자에게만 표시됨 */}
              <div ref={turnstileRef} style={{ width: '100%' }} />
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleSubmit}
                    className="slb-form"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                  >
                    {/* 이름 · 연락처 · 인증요청 */}
                    <div className="slb-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 320px', minWidth: 0 }}>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="이름"
                        aria-label="이름"
                        style={{ ...field, flex: '1 1 80px' }}
                      />
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={formatPhone(form.phone)}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="연락처"
                        aria-label="연락처"
                        maxLength={13}
                        disabled={verified}
                        style={{ ...field, flex: '1.4 1 130px', ...(verified ? { color: '#8B95A1' } : null) }}
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={!canSend}
                        className="slb-send"
                        style={{
                          ...secondaryBtn, fontWeight: 700,
                          cursor: canSend ? 'pointer' : 'not-allowed',
                          background: canSend ? '#fff' : 'rgba(255,255,255,.18)',
                          color: canSend ? '#1B6CF2' : 'rgba(255,255,255,.6)',
                        }}
                      >
                        {sending ? '발송 중…' : verified ? '인증 완료' : codeSent ? '재발송' : (
                          <>
                            <span className="slb-send-full">인증번호 발송</span>
                            <span className="slb-send-short">인증요청</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 인증번호 · 확인 — 데스크톱은 항상(발송 전 비활성), 모바일은 발송 후에만(.slb-code-idle→hidden) */}
                    <div className={`slb-code${codeRowOpen ? '' : ' slb-code-idle'}`} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1.2 1 210px', minWidth: 0 }}>
                      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="인증번호"
                          aria-label="인증번호"
                          maxLength={6}
                          disabled={!codeSent || verified}
                          style={{ ...field, width: '100%', paddingRight: secondsLeft > 0 ? 52 : 13, letterSpacing: '0.08em', opacity: !codeSent || verified ? 0.6 : 1 }}
                        />
                        {secondsLeft > 0 && (
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#E8342B' }}>
                            {mmss}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={!canVerify}
                        style={{
                          ...secondaryBtn, fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          cursor: canVerify ? 'pointer' : 'not-allowed',
                          background: verified ? 'rgba(255,255,255,.18)' : canVerify ? '#0B3E9E' : 'rgba(255,255,255,.18)',
                          color: verified ? '#D8EAFF' : canVerify ? '#fff' : 'rgba(255,255,255,.6)',
                        }}
                      >
                        {verified ? <><Check size={13} strokeWidth={3} /> 완료</> : verifying ? '확인 중…' : '확인'}
                      </button>
                    </div>

                    {/* 동의 · 신청 */}
                    <div className="slb-tail" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={consentOn}
                            onChange={(e) => setForm({ ...form, privacy: e.target.checked, agree: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: '#fff', flexShrink: 0, cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>개인정보·마케팅 동의</span>
                        </label>
                        <button type="button" onClick={() => setModal('privacy')} style={consentLink}>보기</button>
                      </div>
                      <button
                        type="submit"
                        disabled={!canSubmit}
                        style={{
                          flexShrink: 0, height: H, padding: '0 20px', border: 0, borderRadius: 10,
                          background: canSubmit ? '#fff' : 'rgba(255,255,255,.3)',
                          color: canSubmit ? '#1B6CF2' : 'rgba(255,255,255,.75)',
                          fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap',
                          cursor: canSubmit ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {submitting ? '전송 중…' : '무료 리포트 신청'}
                      </button>
                    </div>

                    {firstError && (
                      <p style={{ margin: 0, width: '100%', fontSize: 12, fontWeight: 600, color: '#fff', background: 'rgba(232,52,43,.9)', padding: '3px 10px', borderRadius: 8 }}>
                        {firstError}
                      </p>
                    )}
                  </motion.form>
                ) : (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: H, color: '#fff' }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={18} color="#1B6CF2" strokeWidth={3} />
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>
                      신청이 완료되었습니다! 영업일 기준 1~2일 이내에 리포트 안내를 보내드리겠습니다.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
      </motion.div>

      <ConsentModal kind={modal} onClose={() => setModal(null)} />
    </>
  )
}

const consentLink: CSSProperties = {
  border: 0,
  background: 'transparent',
  padding: 0,
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(255,255,255,.85)',
  textDecoration: 'underline',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
