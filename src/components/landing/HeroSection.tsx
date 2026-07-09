'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import type { PopularStock } from '@/data/registry'
import type { SearchHit } from '@/app/api/search/route'
import { stockColor } from '@/data/stock-color'
import { BarChart2, Bot, FileText, Search, type LucideIcon } from 'lucide-react'

const FEATURES: { icon: LucideIcon; title: string; desc: string; bg: string }[] = [
  { icon: BarChart2, title: '실시간 시세', desc: '지연 없는 실시간 조회', bg: '#EAF1FE' },
  { icon: Bot,       title: '종목 분석', desc: '수급·재무·AI 분석', bg: '#F0F4FF' },
  { icon: FileText,  title: '전문가 리포트', desc: '투자 인사이트 무료 제공', bg: '#FFF3E0' },
]

export default function HeroSection({ stocks }: { stocks: PopularStock[] }) {
  const router = useRouter()
  const [query, setQuery]       = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [showError, setShowError] = useState(false)
  const [results, setResults]   = useState<SearchHit[]>([])

  // 전 주권(ST) 검색 API에 디바운스 질의 (top_view 인기목록과 별개)
  useEffect(() => {
    const q = query.trim()
    if (!q) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        if (res.ok) setResults(await res.json())
      } catch { /* 무시 */ }
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  function go(code?: string) {
    const q = query.trim()
    if (!q) { setShowError(true); return }
    const target =
      code
      ?? results.find((s) => s.name === q || s.code === q)?.code
      ?? results[0]?.code
      ?? (/^[0-9A-Za-z]{6}$/.test(q) ? q.toUpperCase() : undefined) // 6자리면 코드로 직접 이동
    if (!target) { setShowError(true); return }
    router.push(`/stock/${target}`)
  }

  return (
    <div className="responsive-home-hero" style={{ maxWidth: 1320, margin: '0 auto', padding: 'var(--home-hero-padding, 52px 28px 30px)', display: 'grid', gridTemplateColumns: 'var(--home-hero-columns, 1fr 1.15fr)', gap: 'var(--home-hero-gap, 56px)', alignItems: 'start' }}>
      {/* 좌측 */}
      <div>
        <div style={{ display: 'inline-block', background: 'transparent', color: '#111827', fontSize: 20, fontWeight: 600, marginBottom: 10, fontFamily: 'var(--font-maruburi)' }}>
          지금 가장 많이 찾는
        </div>
        <h1 className="responsive-hero-title" style={{ margin: 0, fontSize: 'var(--hero-title-size, 50px)', lineHeight: 1.18, fontWeight: 800, letterSpacing: '-0.03em', color: '#111827' }}>
          종목 분석하고,<br />
          <span style={{ color: '#1B6CF2' }}>무료 리포트</span> 받아보세요!
        </h1>
        <p style={{ margin: '22px 0 0', fontSize: 18, lineHeight: 1.6, color: '#6B7684', fontWeight: 500 }}>
          실시간 시세, 수급, AI 분석까지 한눈에!<br />전문가 리포트를 무료로 확인하세요.
        </p>
        <div className="responsive-home-features" style={{ display: 'flex', flexDirection: 'var(--features-direction, row)' as CSSProperties['flexDirection'], gap: 'var(--features-gap, 14px)', marginTop: 34 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ display: 'flex', flexDirection: 'var(--feature-item-direction, row)' as CSSProperties['flexDirection'], flex: 'var(--feature-item-flex, 0 1 auto)', gap: 'var(--feature-item-gap, 11px)', alignItems: 'center', textAlign: 'var(--feature-item-text-align, left)' as CSSProperties['textAlign'] }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: f.bg }}>
                <f.icon size={20} color="#1B6CF2" />
              </div>
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{f.title}</div>
                <div className="feature-desc" style={{ fontSize: 12, color: '#8B95A1' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 우측 — 검색 카드 */}
      <div className="responsive-search-card" style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 20, padding: 'var(--search-card-padding, 48px 32px)', boxShadow: '0 8px 30px rgba(17,40,90,.06)' }}>
        <div style={{ fontSize: 21, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
          종목명 또는 종목코드를 입력하고 분석을 시작하세요
        </div>

        {/* 검색 인풋 */}
        <div className="responsive-search-row" style={{ display: 'flex', flexDirection: 'var(--search-row-direction, row)' as CSSProperties['flexDirection'], gap: 10, marginTop: 20, position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}><Search size={16} color="#1B6CF2" /></span>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowDrop(true); setShowError(false) }}
              onFocus={() => setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              onKeyDown={(e) => e.key === 'Enter' && go()}
              placeholder="종목명 또는 종목코드 입력 (예: 삼성전자, 005930)"
              style={{
                width: '100%', height: 58, padding: '0 16px 0 44px',
                border: '2px solid #1B6CF2', borderRadius: 13, fontSize: 15,
                fontFamily: 'inherit', outline: 'none', color: '#111827'
              }}
            />
            {showDrop && results.length > 0 && (
              <div style={{ position: 'absolute', top: 64, left: 0, right: 0, background: '#fff', border: '1px solid #E5E8EB', borderRadius: 13, boxShadow: '0 12px 28px rgba(17,40,90,.14)', overflow: 'hidden', zIndex: 30 }}>
                {results.map((s) => (
                  <div
                    key={s.code}
                    onMouseDown={() => go(s.code)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', borderBottom: '1px solid #F2F4F6' }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: stockColor(s.code), flexShrink: 0 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{s.name}</div>
                    <div style={{ fontSize: 13, color: '#8B95A1' }}>{s.code}</div>
                    <div style={{ marginLeft: 'auto', fontSize: 12, color: '#B0B8C1' }}>{s.market}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => go()}
            style={{ height: 58, padding: '0 26px', border: 'none', borderRadius: 13, background: '#1B6CF2', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            검색하기
          </button>
        </div>

        {showError && (
          <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#E53E3E' }}>
            종목명이나 종목코드를 입력해주세요
          </div>
        )}

        {/* 인기 검색어 */}
        <div style={{ marginTop: 20, fontSize: 13, fontWeight: 700, color: '#4E5968' }}>인기 검색어</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {stocks.map((s) => (
            <span
              key={s.code}
              onClick={() => router.push(`/stock/${s.code}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EAF2FF'
                e.currentTarget.style.borderColor = '#B3D1FF'
                e.currentTarget.style.color = '#3182F6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.borderColor = '#E5E8EB'
                e.currentTarget.style.color = '#4E5968'
              }}
              style={{ padding: '7px 14px', border: '1px solid #E5E8EB', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#4E5968', cursor: 'pointer', background: '#fff', transition: 'background 0.15s, border-color 0.15s, color 0.15s' }}
            >
              {s.name}
            </span>
          ))}
        </div>

      </div>
    </div>
  )
}
