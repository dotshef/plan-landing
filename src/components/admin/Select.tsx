'use client'

import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

import { usePopover } from './usePopover'
import f from './fields.module.css'

export interface SelectOption {
  value: string
  label: string
}

/** 네이티브 select 대체 드롭다운(select-only combobox 패턴). 포커스는 트리거에 둔 채 방향키로 옵션을 고른다. */
export default function Select({
  id,
  value,
  onChange,
  options,
  placeholder = '선택',
  ariaLabel,
  width,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  ariaLabel?: string
  width?: number | string
}) {
  const { open, setOpen, setReference, setFloating, floatingStyles } = usePopover({ matchWidth: true, fitHeight: true })
  const [active, setActive] = useState(-1)
  const listId = useId()

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, listId])

  function openList() {
    setActive(Math.max(0, selectedIndex))
    setOpen(true)
  }

  function choose(index: number) {
    const option = options[index]
    if (option) onChange(option.value)
    setOpen(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(options.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(active)
        break
      case 'Escape':
        // 모달의 ESC 닫기까지 번지지 않게
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <>
      <button
        ref={setReference}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={`${f.trigger} ${open ? f.triggerOpen : ''}`}
        style={width !== undefined ? { width } : undefined}
      >
        <span className={`${f.triggerText} ${selected ? '' : f.placeholder}`}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} className={`${f.chevron} ${open ? f.chevronOpen : ''}`} aria-hidden />
      </button>

      {open && createPortal(
        <div ref={setFloating} id={listId} role="listbox" className={`${f.popover} ${f.list}`} style={floatingStyles}>
          {options.map((o, i) => {
            const isSelected = o.value === value
            return (
              <div
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()} // 트리거 포커스 유지
                onClick={() => choose(i)}
                className={`${f.option} ${i === active ? f.optionActive : ''} ${isSelected ? f.optionSelected : ''}`}
              >
                <span>{o.label}</span>
                {isSelected && <Check size={15} aria-hidden />}
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}
