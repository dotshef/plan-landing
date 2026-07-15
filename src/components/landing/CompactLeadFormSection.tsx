'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Lock } from 'lucide-react'
import { useReportRequest } from '@/hooks/useReportRequest'
import ConsentModal, { type ConsentKind } from './ConsentModal'

export default function CompactLeadFormSection() {
  const {
    form, setForm,
    submitted, submitting, errors,
    codeSent, sending, verifying, verified, code, setCode, secondsLeft,
    phoneValid, mmss,
    handlePhoneChange, handleSendCode, handleVerifyCode, handleSubmit,
    turnstileRef,
  } = useReportRequest()

  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [modal, setModal] = useState<ConsentKind | null>(null)

  function inputStyle(field: string): React.CSSProperties {
    return {
      height: 48, padding: '0 14px',
      border: `1.5px solid ${focusedField === field ? '#1B6CF2' : '#E5E8EB'}`,
      borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none',
      boxSizing: 'border-box', background: '#F8FAFC', transition: 'border-color .15s',
    }
  }

  const canSubmit = !submitting && form.privacy && form.agree && verified

  return (
    <div className="responsive-section-shell" style={{ maxWidth: 1320, margin: '0 auto', padding: 'var(--section-padding, 20px 28px 8px)' }}>
      <div className="responsive-section-card" style={{ background: '#fff', border: '1.5px solid #1B6CF2', borderRadius: 18, padding: 'var(--card-padding, 22px 26px)', boxShadow: '0 8px 24px rgba(27,108,242,.10)' }}>
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div key="form" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
              <div className="responsive-compact-head" style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                  무료 리포트 신청하기
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#8B95A1' }}>
                  <Lock size={12} color="#B0B8C1" /> 입력하신 정보는 리포트 발송 용도로만 사용되며 안전하게 보호됩니다.
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Cloudflare Turnstile invisible 위젯 컨테이너 (봇 방지) */}
                <div ref={turnstileRef} />
                {/* 전체 1행: 이름 · 연락처 · 인증발송 · 인증번호 입력 · 확인 · 동의2 · 신청 */}
                <div className="responsive-compact-row" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* 이름 + 연락처 + 인증번호 발송 — 한 줄로 묶어 모바일에서도 나란히 */}
                  <div className="responsive-namephone-pair" style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="이름"
                      style={{ ...inputStyle('name'), flex: '0 0 100px', minWidth: 0 }}
                    />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="연락처 (숫자만)"
                      maxLength={11}
                      disabled={verified}
                      style={{ ...inputStyle('phone'), flex: '0 0 160px', minWidth: 0, opacity: verified ? 0.7 : 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={!phoneValid || sending || verified}
                      style={{
                        whiteSpace: 'nowrap', padding: '0 14px', height: 48, borderRadius: 12,
                        border: 'none', fontSize: 13, fontWeight: 700, flexShrink: 0,
                        cursor: !phoneValid || sending || verified ? 'not-allowed' : 'pointer',
                        background: !phoneValid || sending || verified ? '#E5E8EB' : '#EAF2FE',
                        color: !phoneValid || sending || verified ? '#B0B8C1' : '#1B6CF2',
                      }}
                    >
                      {sending ? '발송 중' : verified ? '인증 완료' : codeSent ? '재발송' : '인증번호 발송'}
                    </button>
                  </div>

                  {/* 인증번호 입력 + 확인 — 한 쌍으로 묶어 데스크톱은 인라인, 모바일은 한 줄로 나란히 */}
                  <div className="responsive-verify-pair" style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ position: 'relative', flex: '0 0 128px', minWidth: 0 }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onFocus={() => setFocusedField('code')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="인증번호"
                        maxLength={6}
                        disabled={!codeSent || verified}
                        style={{ ...inputStyle('code'), width: '100%', opacity: !codeSent || verified ? 0.6 : 1 }}
                      />
                      {codeSent && !verified && secondsLeft > 0 && (
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#E8342B' }}>{mmss}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={!codeSent || verified || verifying || code.length !== 6}
                      style={{
                        whiteSpace: 'nowrap', padding: '0 16px', height: 48, borderRadius: 12,
                        border: 'none', fontSize: 13, fontWeight: 700, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        cursor: !codeSent || verified || verifying || code.length !== 6 ? 'not-allowed' : 'pointer',
                        background: verified ? '#EAF7F1' : (!codeSent || verifying || code.length !== 6 ? '#B0B8C1' : '#1B6CF2'),
                        color: verified ? '#03B26C' : '#fff',
                      }}
                    >
                      {verified ? <><Check size={13} color="#03B26C" strokeWidth={3} /> 완료</> : verifying ? '확인 중' : '확인'}
                    </button>
                  </div>

                  {/* 동의 2개 — 한 쌍으로 묶어 모바일에서도 한 줄로 나란히 */}
                  <div className="responsive-consent-pair" style={{ display: 'flex', gap: 18, alignItems: 'center', flexShrink: 0 }}>
                    <ConsentCheck
                      checked={form.privacy}
                      onToggle={() => setForm({ ...form, privacy: !form.privacy })}
                      onView={() => setModal('privacy')}
                      label="개인정보 동의"
                    />
                    <ConsentCheck
                      checked={form.agree}
                      onToggle={() => setForm({ ...form, agree: !form.agree })}
                      onView={() => setModal('agree')}
                      label="마케팅 동의"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    style={{ marginLeft: 'auto', height: 48, padding: '0 24px', border: 'none', borderRadius: 12, background: canSubmit ? '#1B6CF2' : '#B0B8C1', color: '#fff', fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed', flexShrink: 0 }}
                  >
                    {submitting ? '전송 중' : '무료 리포트 신청하기'}
                  </button>
                </div>

                {(errors.name || errors.phone || errors.code) && (
                  <p style={{ fontSize: 12, color: '#E8342B', marginTop: 8 }}>{errors.name || errors.phone || errors.code}</p>
                )}
                {(errors.privacy || errors.agree) && (
                  <p style={{ fontSize: 12, color: '#E8342B', marginTop: 8 }}>{errors.privacy || errors.agree}</p>
                )}
                {errors.submit && <p style={{ fontSize: 12, color: '#E8342B', marginTop: 8, lineHeight: 1.5 }}>{errors.submit}</p>}
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '6px 2px' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#03B26C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <Check size={24} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>신청이 완료되었습니다!</div>
                <div style={{ fontSize: 13.5, color: '#6B7684', marginTop: 3 }}>
                  입력하신 연락처({form.phone})로 영업일 기준 1~2일 이내에 리포트 안내를 보내드리겠습니다.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConsentModal kind={modal} onClose={() => setModal(null)} />
    </div>
  )
}

function ConsentCheck({ checked, onToggle, onView, label }: { checked: boolean; onToggle: () => void; onView: () => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
        <div style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: checked ? '#1B6CF2' : '#fff',
          border: `1px solid ${checked ? '#1B6CF2' : '#D1D6DB'}`,
        }}><Check size={12} color="#fff" strokeWidth={3} /></div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#4E5968', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <button
        type="button"
        onClick={onView}
        style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 12, fontWeight: 600, color: '#8B95A1', textDecoration: 'underline', cursor: 'pointer' }}
      >
        보기
      </button>
    </div>
  )
}
