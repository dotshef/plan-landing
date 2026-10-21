'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PopularStock } from '@/data/registry'
import type { SearchHit } from '@/app/api/search/route'
import { stockColor } from '@/data/stock-color'
import { Search } from 'lucide-react'

export default function StockSearch({ stocks }: { stocks: PopularStock[] }) {
  const router = useRouter()
  const [query, setQuery]       = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [showError, setShowError] = useState(false)
  const [fetched, setResults]   = useState<SearchHit[]>([])
  // 검색어를 비우면 직전 결과를 버린다
  const results = query.trim() ? fetched : []

  // 전 주권(ST) 검색 API에 디바운스 질의 (top_view 인기목록과 별개)
  useEffect(() => {
    const q = query.trim()
    if (!q) return
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
      ?? (/^[0-9A-Za-z]{6}$/.test(q) ? q.toUpperCase() : undefined)
    if (!target) { setShowError(true); return }
    router.push(`/stock/${target}`)
  }

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
        종목명 또는 종목코드를 입력하고 분석을 시작하세요
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14, position: 'relative' }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}><Search size={16} color="#1B6CF2" /></span>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowDrop(true); setShowError(false) }}
            onFocus={() => setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="종목명 또는 종목코드 입력 (예: 삼성전자, 005930)"
            aria-label="종목 검색"
            style={{
              width: '100%', height: 56, padding: '0 16px 0 44px',
              border: '2px solid #1B6CF2', borderRadius: 13, fontSize: 15,
              fontFamily: 'inherit', outline: 'none', color: '#111827', background: '#fff',
            }}
          />
          {showDrop && results.length > 0 && (
            <div style={{ position: 'absolute', top: 62, left: 0, right: 0, background: '#fff', border: '1px solid #E5E8EB', borderRadius: 13, boxShadow: '0 12px 28px rgba(17,40,90,.14)', overflow: 'hidden', zIndex: 30 }}>
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
          type="button"
          onClick={() => go()}
          className="home-search-btn"
          style={{ height: 56, padding: '0 26px', border: 'none', borderRadius: 13, background: '#1B6CF2', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
        >
          검색
        </button>
      </div>

      {showError && (
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#E53E3E' }}>
          종목명이나 종목코드를 입력해주세요
        </div>
      )}

      <div style={{ marginTop: 18, fontSize: 13, fontWeight: 700, color: '#4E5968' }}>인기 검색어</div>
      <div className="home-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {stocks.map((s) => (
          <button
            key={s.code}
            type="button"
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
            style={{ padding: '7px 14px', border: '1px solid #E5E8EB', borderRadius: 999, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', color: '#4E5968', cursor: 'pointer', background: '#fff', whiteSpace: 'nowrap', transition: 'background 0.15s, border-color 0.15s, color 0.15s' }}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )
}
