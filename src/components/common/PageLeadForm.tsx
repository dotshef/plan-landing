'use client'

import { useState } from 'react'
import { Check, Lock } from 'lucide-react'
import { useReportRequest, type ReportRequestExtra } from '@/hooks/useReportRequest'
import { formatPhone } from '@/lib/phone'
import ConsentModal, { type ConsentKind } from '@/components/landing/ConsentModal'

interface Props {
  sourcePage: NonNullable<ReportRequestExtra['sourcePage']>
  requestedItems?: string | null
  title: string
  subtitle?: string
  submitLabel: string
  successMessage?: string
  /** 카드 테두리·그림자 없이 본문만 렌더 — 부모가 이미 카드 컨테이너일 때 사용. */
  bare?: boolean
}

/** 신규 페이지(체험·자료·섹터) 공용 세로형 신청 폼 — 기존 리드 플로우(SMS 인증·Turnstile) 그대로. */
export default function PageLeadForm({ sourcePage, requestedItems, title, subtitle, submitLabel, successMessage, bare }: Props) {
  const {
    form, setForm,
    submitted, submitting, errors,
    codeSent, sending, verifying, verified, code, setCode, secondsLeft,
    phoneValid, mmss,
    handlePhoneChange, handleSendCode, handleVerifyCode, handleSubmit,
    turnstileRef,
  } = useReportRequest('', { sourcePage, requestedItems })

  const [focused, setFocused] = useState<string | null>(null)
  const [modal, setModal] = useState<ConsentKind | null>(null)

  function inputStyle(field: string): React.CSSProperties {
    return {
      width: '100%', height: 50, padding: '0 14px',
      border: `1.5px solid ${focused === field ? '#1B6CF2' : '#E5E8EB'}`,
      borderRadius: 12, fontSize: 15, fontFamily: 'inherit', outline: 'none',
      boxSizing: 'border-box', background: '#F8FAFC', transition: 'border-color .15s',
    }
  }

  const canSubmit = !submitting && form.privacy && form.agree && verified

  if (submitted) {
    return (
      <div style={bare
        ? { textAlign: 'center', padding: '24px 0' }
        : { background: '#fff', border: '1.5px solid #1B6CF2', borderRadius: 18, padding: '40px 28px', textAlign: 'center', boxShadow: '0 8px 24px rgba(27,108,242,.10)' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EAF7F1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Check size={26} color="#03B26C" strokeWidth={3} />
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#111827', marginBottom: 8 }}>신청이 완료되었습니다</div>
        <div style={{ fontSize: 14, color: '#6B7684', lineHeight: 1.7 }}>
          {successMessage ?? '입력하신 연락처로 안내드리겠습니다.'}
        </div>
      </div>
    )
  }

  return (
    <div style={bare ? undefined : { background: '#fff', border: '1.5px solid #1B6CF2', borderRadius: 18, padding: 26, boxShadow: '0 8px 24px rgba(27,108,242,.10)' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: '#6B7684', marginBottom: 4 }}>{subtitle}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#8B95A1', margin: '6px 0 16px' }}>
        <Lock size={12} color="#B0B8C1" /> 입력하신 정보는 발송 용도로만 사용되며 안전하게 보호됩니다.
      </div>

      <form onSubmit={handleSubmit}>
        <div ref={turnstileRef} />

        <div style={{ display: 'grid', gap: 10 }}>
          <input
            type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
            placeholder="이름" style={inputStyle('name')}
          />
          {errors.name && <div style={{ fontSize: 12.5, color: '#E8342B', fontWeight: 600 }}>{errors.name}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="tel" value={formatPhone(form.phone)}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
              placeholder="휴대폰 번호" maxLength={13} disabled={verified}
              style={{ ...inputStyle('phone'), flex: 1, opacity: verified ? 0.7 : 1 }}
            />
            <button
              type="button" onClick={handleSendCode}
              disabled={!phoneValid || sending || verified}
              style={{
                whiteSpace: 'nowrap', padding: '0 14px', height: 50, borderRadius: 12, border: 'none',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
                cursor: !phoneValid || sending || verified ? 'not-allowed' : 'pointer',
                background: !phoneValid || sending || verified ? '#E5E8EB' : '#EAF2FE',
                color: !phoneValid || sending || verified ? '#B0B8C1' : '#1B6CF2',
              }}
            >
              {sending ? '발송 중' : verified ? '인증 완료' : codeSent ? '재발송' : '인증번호 발송'}
            </button>
          </div>
          {errors.phone && <div style={{ fontSize: 12.5, color: '#E8342B', fontWeight: 600 }}>{errors.phone}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text" inputMode="numeric" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onFocus={() => setFocused('code')} onBlur={() => setFocused(null)}
                placeholder="인증번호 6자리" maxLength={6} disabled={!codeSent || verified}
                style={{ ...inputStyle('code'), opacity: !codeSent || verified ? 0.6 : 1 }}
              />
              {codeSent && !verified && secondsLeft > 0 && (
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12.5, fontWeight: 700, color: '#E8342B' }}>{mmss}</span>
              )}
            </div>
            <button
              type="button" onClick={handleVerifyCode}
              disabled={!codeSent || verified || verifying || code.length !== 6}
              style={{
                whiteSpace: 'nowrap', padding: '0 18px', height: 50, borderRadius: 12, border: 'none',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                cursor: !codeSent || verified || verifying || code.length !== 6 ? 'not-allowed' : 'pointer',
                background: verified ? '#EAF7F1' : (!codeSent || verifying || code.length !== 6 ? '#B0B8C1' : '#1B6CF2'),
                color: verified ? '#03B26C' : '#fff',
              }}
            >
              {verified ? <><Check size={13} color="#03B26C" strokeWidth={3} /> 완료</> : verifying ? '확인 중' : '확인'}
            </button>
          </div>
          {errors.code && <div style={{ fontSize: 12.5, color: '#E8342B', fontWeight: 600 }}>{errors.code}</div>}

          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', margin: '4px 0' }}>
            <ConsentCheck checked={form.privacy} onToggle={() => setForm({ ...form, privacy: !form.privacy })} onView={() => setModal('privacy')} label="개인정보 동의" />
            <ConsentCheck checked={form.agree} onToggle={() => setForm({ ...form, agree: !form.agree })} onView={() => setModal('agree')} label="마케팅 동의" />
          </div>
          {(errors.privacy || errors.agree) && (
            <div style={{ fontSize: 12.5, color: '#E8342B', fontWeight: 600 }}>{errors.privacy ?? errors.agree}</div>
          )}

          <button
            type="submit" disabled={!canSubmit}
            style={{
              height: 54, border: 'none', borderRadius: 12,
              background: canSubmit ? '#1B6CF2' : '#B0B8C1', color: '#fff',
              fontSize: 16, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? '전송 중…' : submitLabel}
          </button>
          {errors.submit && <div style={{ fontSize: 12.5, color: '#E8342B', fontWeight: 600 }}>{errors.submit}</div>}
        </div>
      </form>

      <ConsentModal kind={modal} onClose={() => setModal(null)} />
    </div>
  )
}

function ConsentCheck({ checked, onToggle, onView, label }: {
  checked: boolean
  onToggle: () => void
  onView: () => void
  label: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        type="button" onClick={onToggle}
        style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0, padding: 0,
          border: checked ? 'none' : '1.5px solid #D1D6DB',
          background: checked ? '#1B6CF2' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
        aria-label={label}
      >
        {checked && <Check size={13} color="#fff" strokeWidth={3.5} />}
      </button>
      <span onClick={onToggle} style={{ fontSize: 13, color: '#4E5968', fontWeight: 600, cursor: 'pointer' }}>{label}</span>
      <button
        type="button" onClick={onView}
        style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 12, color: '#8B95A1', textDecoration: 'underline', cursor: 'pointer' }}
      >
        보기
      </button>
    </div>
  )
}
