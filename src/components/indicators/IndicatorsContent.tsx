'use client'

import { useState } from 'react'
import PageLeadForm from '@/components/common/PageLeadForm'

// 자료 목록 — 정적 상수. 선택값은 requested_items로 접수된다.
const INDICATORS = [
  { name: '증시 캘린더', desc: '놓치면 안 되는 일정', icon: '📅' },
  { name: '엑스레이 지표', desc: '캔들에 안 보이는 것', icon: '📡' },
  { name: '종가베팅 지표', desc: '매수·익절 화살표', icon: '🎯' },
  { name: '세력추적 지표', desc: '대량 거래 흔적 표시', icon: '🔍' },
  { name: 'RSI 판독기', desc: '과매수·과매도 판단', icon: '🌡️' },
  { name: 'MACD', desc: '골든크로스 신호', icon: '📈' },
  { name: '스토캐스틱', desc: '단기 과열 확인', icon: '⚡' },
  { name: 'OBV', desc: '거래량 누적 흐름', icon: '📊' },
  { name: '피보나치 되돌림', desc: '지지·저항 구간', icon: '📐' },
]

export default function IndicatorsContent() {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  return (
    <div style={{ background: '#fff' }}>
      {/* 상단 */}
      <div style={{ background: '#F5F7FB' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 24px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: '#1B6CF2', background: '#EAF1FE', padding: '6px 12px', borderRadius: 20, marginBottom: 14 }}>
            ▶ 영상에서 이어집니다
          </span>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
            영상 속 자료 받기
          </h1>
          <p style={{ fontSize: 16, color: '#6B7684', marginTop: 10 }}>설정 방법부터 활용 기준까지 한 번에</p>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 64px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'start' }}>
        {/* 자료 선택 */}
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 14 }}>받아보실 자료를 선택하세요</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {INDICATORS.map((ind) => {
              const on = selected.includes(ind.name)
              return (
                <button
                  key={ind.name}
                  type="button"
                  onClick={() => toggle(ind.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', textAlign: 'left',
                    border: on ? '2px solid #1B6CF2' : '1px solid #E5E8EB',
                    borderRadius: 12, background: on ? '#EAF1FE' : '#fff', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{ind.icon}</span>
                  <span>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: on ? '#1B6CF2' : '#191F28' }}>{ind.name}</span>
                    <span style={{ display: 'block', fontSize: 12.5, color: '#8B95A1', marginTop: 2 }}>{ind.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #F2F4F6' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7684', marginBottom: 6 }}>선택한 자료 ({selected.length})</div>
            {selected.length === 0 ? (
              <div style={{ fontSize: 13.5, color: '#B0B8C1' }}>위에서 원하는 자료를 눌러주세요</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selected.map((n) => (
                  <button
                    key={n} type="button" onClick={() => toggle(n)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, border: 'none', background: '#1B6CF2', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {n} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13.5, color: '#4E5968' }}>✓ 선택한 자료 받기</div>
            <div style={{ fontSize: 13.5, color: '#4E5968' }}>✓ 관련 설정·활용 방법 안내</div>
          </div>
        </div>

        {/* 신청 폼 */}
        <PageLeadForm
          sourcePage="indicators"
          requestedItems={selected.length ? selected.join(',') : null}
          title="무료로 받아보기"
          subtitle="신청 즉시 발송!"
          submitLabel="무료로 받아보기"
          successMessage="선택하신 자료를 입력하신 연락처로 보내드리겠습니다."
        />
      </div>

      {/*
        하단 발송 기록 이미지 스트립 — 설계상 정적 이미지 & 코드 임베드.
        원본 이미지 파일 수급 후 public/images/indicators/ 에 넣고 이 자리에 렌더한다. (§10-1)
      */}
    </div>
  )
}
