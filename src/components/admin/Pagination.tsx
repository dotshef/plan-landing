'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import { iconBtnStyle } from './ui'

type Item = number | 'gap-start' | 'gap-end'

/** 표시할 페이지 번호 - 항목 수를 7개로 고정해 넘길 때 버튼 위치가 흔들리지 않게 한다. 예: 1 … 5 6 7 … 30 */
function pageItems(page: number, totalPages: number): Item[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, 'gap-end', totalPages]
  if (page >= totalPages - 3) {
    return [1, 'gap-start', ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)]
  }
  return [1, 'gap-start', page - 1, page, page + 1, 'gap-end', totalPages]
}

const numStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
  ...iconBtnStyle(disabled && !active),
  width: 'auto', minWidth: 34, height: 34, padding: '0 6px',
  fontSize: 13, fontWeight: active ? 800 : 600, fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
  ...(active
    ? { background: '#1B6CF2', border: '1px solid #1B6CF2', color: '#fff', cursor: 'default' }
    : { color: '#4E5968' }),
})

export default function Pagination({ page, totalPages, disabled = false, onChange }: {
  page: number
  totalPages: number
  disabled?: boolean
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const atFirst = page <= 1
  const atLast = page >= totalPages
  const arrow = (label: string, target: number, off: boolean, icon: React.ReactNode) => (
    <button
      type="button" aria-label={label} disabled={off || disabled}
      onClick={() => onChange(target)}
      style={{ ...iconBtnStyle(off || disabled), width: 34, height: 34 }}
    >
      {icon}
    </button>
  )

  return (
    <nav aria-label="페이지" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
      {arrow('첫 페이지', 1, atFirst, <ChevronsLeft size={16} />)}
      {arrow('이전 페이지', page - 1, atFirst, <ChevronLeft size={16} />)}
      {pageItems(page, totalPages).map((item) =>
        typeof item === 'number' ? (
          <button
            key={item} type="button" aria-label={`${item} 페이지`} aria-current={item === page ? 'page' : undefined}
            disabled={disabled || item === page}
            onClick={() => onChange(item)}
            style={numStyle(item === page, disabled)}
          >
            {item}
          </button>
        ) : (
          <span key={item} aria-hidden style={{ minWidth: 24, textAlign: 'center', color: '#B0B8C1', fontSize: 13 }}>…</span>
        ),
      )}
      {arrow('다음 페이지', page + 1, atLast, <ChevronRight size={16} />)}
      {arrow('마지막 페이지', totalPages, atLast, <ChevronsRight size={16} />)}
    </nav>
  )
}
