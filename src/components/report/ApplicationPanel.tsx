'use client'

import { useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Lock, Smartphone, Clock } from 'lucide-react'
import { POPULAR_STOCKS } from '@/data/registry'

const defaultStock = `${POPULAR_STOCKS[0].name}(${POPULAR_STOCKS[0].code})`

export default function ApplicationPanel() {
  const [form, setForm] = useState({ name: '', phone: '', stock: defaultStock, agree: false })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = '이름을 입력해주세요'
    if (!form.phone.trim()) e.phone = '연락처를 입력해주세요'
    return e
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitted(true)
  }

  const [focusedField, setFocusedField] = useState<string | null>(null)

  function inputStyle(field: string): React.CSSProperties {
    return {
      width: '100%', height: 50, marginTop: 8, padding: '0 14px',
      border: `1.5px solid ${focusedField === field ? '#1B6CF2' : '#E5E8EB'}`,
      borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none',
      boxSizing: 'border-box', background: '#F8FAFC',
      transition: 'border-color .15s',
    }
  }

  return (
    <div className="responsive-sticky-panel" style={{ position: 'var(--sticky-position, sticky)' as CSSProperties['position'], top: 'var(--sticky-top, 96px)' }}>
      <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 18, overflow: 'hidden', boxShadow: 'none' }}>
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              style={{ padding: 28 }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>무료 리포트 신청하기</div>
              <div style={{ fontSize: 13, color: '#8B95A1', marginTop: 5 }}>입력하신 정보는 리포트 발송 용도로만 사용됩니다.</div>

              <form onSubmit={handleSubmit} style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 이름 */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#4E5968' }}>이름</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="이름을 입력해주세요"
                    style={inputStyle('name')}
                  />
                  {errors.name && <p style={{ fontSize: 12, color: '#E8342B', marginTop: 4 }}>{errors.name}</p>}
                </div>

                {/* 연락처 */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#4E5968' }}>연락처</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="- 없이 숫자만 입력해주세요"
                    style={inputStyle('phone')}
                  />
                  <div style={{ fontSize: 11, color: '#B0B8C1', marginTop: 5 }}>예) 01012345678</div>
                  {errors.phone && <p style={{ fontSize: 12, color: '#E8342B', marginTop: 4 }}>{errors.phone}</p>}
                </div>

                {/* 관심종목 */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#4E5968' }}>관심 종목 <span style={{ color: '#B0B8C1', fontWeight: 500 }}>(선택)</span></label>
                  <input
                    type="text"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    onFocus={() => setFocusedField('stock')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="예) 삼성전자, SK하이닉스"
                    style={inputStyle('stock')}
                  />
                  <div style={{ fontSize: 11, color: '#B0B8C1', marginTop: 5 }}>여러 종목은 쉼표(,)로 구분</div>
                </div>

                {/* 동의 */}
                <div>
                  <div
                    onClick={() => setForm({ ...form, agree: !form.agree })}
                    style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', marginTop: 2 }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff',
                      background: form.agree ? '#1B6CF2' : '#fff',
                      border: `1px solid ${form.agree ? '#1B6CF2' : '#D1D6DB'}`,
                    }}><Check size={12} color="#fff" strokeWidth={3} /></div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#4E5968' }}>
                      마케팅 정보 수신 동의
                    </span>
                  </div>
                  <div style={{ marginTop: 12, padding: 14, background: '#F8FAFC', border: '1px solid #F2F4F6', borderRadius: 10, fontSize: 11.5, color: '#8B95A1', lineHeight: 1.55, maxHeight: 96, overflow: 'auto' }}>
                    [마케팅 정보 수신 동의] <br />
                    <br />
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
                  </div>
                  {errors.agree && <p style={{ fontSize: 12, color: '#E8342B', marginTop: 4 }}>{errors.agree}</p>}
                </div>

                <button
                  type="submit"
                  style={{ width: '100%', height: 54, marginTop: 2, border: 'none', borderRadius: 13, background: '#1B6CF2', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
                >
                  무료 리포트 신청하기
                </button>
                <div style={{ textAlign: 'center', fontSize: 12, color: '#B0B8C1', marginTop: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Lock size={12} color="#B0B8C1" /> 입력하신 정보는 안전하게 보호됩니다.</div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ padding: 32, textAlign: 'center' }}
            >
              <div style={{ width: 64, height: 64, margin: '0 auto', borderRadius: '50%', background: '#03B26C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Check size={32} color="#fff" strokeWidth={2.5} /></div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginTop: 18 }}>신청이 완료되었습니다!</div>
              <div style={{ fontSize: 14, color: '#6B7684', marginTop: 8, lineHeight: 1.55 }}>
                감사합니다.<br />입력하신 연락처로 리포트 안내를<br />보내드리겠습니다.
              </div>

              <div style={{ marginTop: 24, border: '1px solid #EEF1F6', borderRadius: 12, padding: 18, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 10 }}>신청 정보</div>
                {[
                  ['이름', form.name],
                  ['연락처', form.phone],
                  ['관심종목', form.stock],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                    <span style={{ color: '#8B95A1' }}>{k}</span>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#6B7684' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}><Smartphone size={13} color="#6B7684" /> 문자 및 카카오톡으로 안내 예정</p>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}><Clock size={13} color="#6B7684" /> 영업일 기준 1~2일 이내 발송</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
