'use client'

import { useSyncExternalStore, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, X } from 'lucide-react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { ko } from 'react-day-picker/locale'
import 'react-day-picker/style.css'

import { usePopover } from './usePopover'
import f from './fields.module.css'

// 값은 API와 같은 'YYYY-MM-DD'(로컬 날짜) 문자열. toISOString 은 UTC 라 하루 밀릴 수 있어 쓰지 않는다.
function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseYmd(s: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined
}

const display = (s: string) => s.replaceAll('-', '.')

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

function presets(today: Date): { label: string; from: Date; to: Date }[] {
  const y = today.getFullYear()
  const m = today.getMonth()
  return [
    { label: '오늘', from: today, to: today },
    { label: '어제', from: addDays(today, -1), to: addDays(today, -1) },
    { label: '최근 7일', from: addDays(today, -6), to: today },
    { label: '최근 30일', from: addDays(today, -29), to: today },
    { label: '이번 달', from: new Date(y, m, 1), to: today },
    { label: '지난 달', from: new Date(y, m - 1, 1), to: new Date(y, m, 0) },
  ]
}

const NARROW = '(max-width: 639px)'

function subscribeNarrow(onChange: () => void) {
  const mq = window.matchMedia(NARROW)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

/** 기간(시작~종료) 선택 팝오버 달력. 두 번째 날짜를 고르거나 프리셋을 누르면 닫힌다. */
export default function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = '전체 기간',
  ariaLabel = '조회 기간',
  width,
}: {
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
  placeholder?: string
  ariaLabel?: string
  width?: number | string
}) {
  const { open, setOpen, setReference, setFloating, floatingStyles, elements } = usePopover()
  const narrow = useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW).matches, () => false)

  const fromDate = parseYmd(from)
  const toDate = parseYmd(to)
  const selected: DateRange | undefined = fromDate ? { from: fromDate, to: toDate } : undefined
  const hasValue = Boolean(from || to)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // 2개월 보기면 이번 달이 오른쪽에 오도록 지난달부터 시작
  const lastStart = new Date(today.getFullYear(), today.getMonth() - (narrow ? 0 : 1), 1)
  const defaultMonth = fromDate && fromDate < lastStart ? fromDate : lastStart

  function emit(next: DateRange | undefined) {
    onChange({ from: next?.from ? toYmd(next.from) : '', to: next?.to ? toYmd(next.to) : '' })
  }

  function handleSelect(next: DateRange | undefined) {
    emit(next)
    if (next?.from && next.to) setOpen(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key !== 'Escape' || !open) return
    e.preventDefault()
    e.stopPropagation() // 모달 ESC 닫기 방지
    setOpen(false)
    ;(elements.reference as HTMLElement | null)?.querySelector('button')?.focus()
  }

  const label = hasValue ? `${from ? display(from) : ''} ~ ${to ? display(to) : ''}` : placeholder

  return (
    <>
      <div ref={setReference} className={f.rangeField} style={width !== undefined ? { width } : undefined}>
        <button
          type="button"
          aria-label={hasValue ? `${ariaLabel}: ${label}` : ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          onKeyDown={handleKeyDown}
          className={`${f.trigger} ${open ? f.triggerOpen : ''}`}
          style={{ justifyContent: 'flex-start', paddingRight: hasValue ? 36 : 12 }}
        >
          <CalendarDays size={16} className={f.triggerIcon} aria-hidden />
          <span className={`${f.triggerText} ${hasValue ? f.tabular : f.placeholder}`}>{label}</span>
        </button>
        {hasValue && (
          <button type="button" aria-label="기간 해제" onClick={() => emit(undefined)} className={f.clearBtn}>
            <X size={14} />
          </button>
        )}
      </div>

      {open && createPortal(
        <div
          ref={setFloating}
          role="dialog"
          aria-label={ariaLabel}
          onKeyDown={handleKeyDown}
          className={`${f.popover} ${f.rangePopover}`}
          style={floatingStyles}
        >
          <div className={f.presets}>
            {presets(today).map((p) => {
              const ymdFrom = toYmd(p.from)
              const ymdTo = toYmd(p.to)
              const isActive = from === ymdFrom && to === ymdTo
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { onChange({ from: ymdFrom, to: ymdTo }); setOpen(false) }}
                  className={`${f.preset} ${isActive ? f.presetActive : ''}`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
          <div className={f.calendarWrap}>
            <DayPicker
              mode="range"
              selected={selected}
              onSelect={handleSelect}
              resetOnSelect
              locale={ko}
              numberOfMonths={narrow ? 1 : 2}
              defaultMonth={defaultMonth}
              endMonth={today}
              disabled={{ after: today }}
              navLayout="around"
              autoFocus
              className={f.calendar}
            />
            <div className={f.rangeFooter}>
              <span className={f.tabular}>
                {from ? display(from) : '시작일'} ~ {to ? display(to) : '종료일'}
              </span>
              {hasValue && (
                <button type="button" onClick={() => emit(undefined)} className={f.footerReset}>초기화</button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
