'use client'

import { useState } from 'react'
import {
  CalendarDays, Radar, Target, Search, Thermometer, TrendingUp, Zap, BarChart3, Ruler,
  X, type LucideIcon,
} from 'lucide-react'
import PageLeadForm from '@/components/common/PageLeadForm'

// 자료 목록 — 정적 상수. 선택값은 requested_items로 접수된다.
const INDICATORS: { name: string; desc: string; icon: LucideIcon }[] = [
  { name: '증시 캘린더', desc: '놓치면 안 되는 일정', icon: CalendarDays },
  { name: '엑스레이 지표', desc: '캔들에 안 보이는 것', icon: Radar },
  { name: '종가베팅 지표', desc: '매수·익절 화살표', icon: Target },
  { name: '세력추적 지표', desc: '대량 거래 흔적 표시', icon: Search },
  { name: 'RSI 판독기', desc: '과매수·과매도 판단', icon: Thermometer },
  { name: 'MACD', desc: '골든크로스 신호', icon: TrendingUp },
  { name: '스토캐스틱', desc: '단기 과열 확인', icon: Zap },
  { name: 'OBV', desc: '거래량 누적 흐름', icon: BarChart3 },
  { name: '피보나치 되돌림', desc: '지지·저항 구간', icon: Ruler },
]

// 하단 슬라이딩 스트립 이미지 — public/images/meterials/ 의 실제 파일명.
const MATERIALS: { file: string; alt: string }[] = [
  { file: '조건검색식.jpg', alt: '조건검색식 설정 화면' },
  { file: '지표설치.jpg', alt: '보조지표 설치 화면' },
  { file: '종가베팅지표설정.jpg', alt: '종가베팅 지표 설정 화면' },
  { file: '빨간화살표만들기.jpg', alt: '매수 화살표 표시 설정' },
  { file: '매수타점.jpg', alt: '매수 타점 표시 차트' },
  { file: '매매기법.jpg', alt: '매매기법 설명 자료' },
  { file: '세력추적.jpg', alt: '세력추적 지표 적용 화면' },
  { file: '종목레이더.jpg', alt: '종목 레이더 화면' },
  { file: '차트.jpg', alt: '지표 적용 차트 예시' },
  { file: '차트2.jpg', alt: '지표 적용 차트 예시' },
]

export default function IndicatorsContent() {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  return (
    <div style={{ background: '#1E2E5A' }}>
      {/* 상단 — 네이비 배경 위 떠 있는 신청 카드 */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '64px 24px 60px' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.13) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute', left: '50%', top: -160, width: 900, height: 520,
            transform: 'translateX(-50%)', pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, rgba(96,165,250,.40), rgba(96,165,250,0) 70%)',
          }}
        />

        <div
          style={{
            position: 'relative', zIndex: 2, maxWidth: 790, margin: '0 auto',
            background: '#fff', borderRadius: 22, padding: 'clamp(26px, 5vw, 44px)',
            boxShadow: '0 30px 70px -20px rgba(3,10,28,.55), 0 0 0 1px rgba(255,255,255,.06)',
          }}
        >
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 35px)', fontWeight: 800, color: '#111827', lineHeight: 1.4, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            영상 속 자료 받기
          </h1>
          <p style={{ fontSize: 17, color: '#6B7684', margin: 0 }}>설정 방법부터 활용 기준까지 한 번에</p>

          {/* 자료 선택 — 전체 목록 그리드 */}
          <div style={{ background: '#F8FAFC', borderRadius: 13, padding: '20px 22px', margin: '26px 0' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#6B7684', margin: '0 0 13px' }}>받아보실 자료를 선택하세요</p>
            <div className="ind-grid">
              {INDICATORS.map((ind) => {
                const on = selected.includes(ind.name)
                const Icon = ind.icon
                return (
                  <button
                    key={ind.name}
                    type="button"
                    onClick={() => toggle(ind.name)}
                    className="ind-card"
                    style={{
                      border: on ? '1.5px solid #1B6CF2' : '1.5px solid #E2E8F0',
                      background: on ? '#EAF1FE' : '#fff',
                    }}
                  >
                    <span className="ind-card-icon">
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <span>
                      <span className="ind-card-name" style={{ color: on ? '#1B6CF2' : '#191F28' }}>{ind.name}</span>
                      <span className="ind-card-desc">{ind.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 선택된 자료 칩 */}
            <div className="ind-chips">
              {selected.map((n) => (
                <button
                  key={n} type="button" onClick={() => toggle(n)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: 'none', background: '#1B6CF2', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  {n} <X size={14} strokeWidth={2.5} style={{ opacity: 0.75 }} />
                </button>
              ))}
            </div>
          </div>

          {/* 신청 폼 — 카드 내부의 별도 카드. 다른 페이지와 비슷한 폭으로 제한 */}
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <PageLeadForm
              sourcePage="indicators"
              requestedItems={selected.length ? selected.join(',') : null}
              title="무료로 받아보기"
              submitLabel="무료로 받아보기"
              successMessage="선택하신 자료를 입력하신 연락처로 보내드리겠습니다."
            />
          </div>

        </div>
      </div>

      {/* 자료 미리보기 — 좌우로 흐르는 이미지 스트립 */}
      <div style={{ position: 'relative', background: '#1E2E5A', overflow: 'hidden', padding: '56px 0 64px' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.11) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px', marginBottom: 30 }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 29px)', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
            이런 자료를 보내드립니다
          </h2>
          <p style={{ fontSize: 16, color: '#B7C6E0', marginTop: 11 }}>설정 화면부터 실제 차트 적용까지 그대로 담았습니다</p>
        </div>
        <div className="mat-marq">
          {/* 목록을 두 번 이어붙여 끊김 없이 순환시킨다 */}
          <div className="mat-track">
            {[...MATERIALS, ...MATERIALS].map((m, i) => (
              <div className="mat-card" key={`${m.file}-${i}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/meterials/${m.file}`} alt={i < MATERIALS.length ? m.alt : ''} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
