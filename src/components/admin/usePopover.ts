'use client'

import { useEffect, useState } from 'react'
import { autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/react-dom'

/**
 * 드롭다운·달력 팝오버 공통 위치 계산 + 바깥 클릭 닫기.
 * body 포털 + fixed 배치라 모달 본문의 overflow 에 잘리지 않고, 공간이 부족하면 위로 뒤집힌다.
 */
export function usePopover({ matchWidth = false, fitHeight = false } = {}) {
  const [open, setOpen] = useState(false)
  const floating = useFloating({
    open,
    placement: 'bottom-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({ padding: 12 }),
      shift({ padding: 12 }),
      size({
        padding: 12,
        apply({ rects, availableHeight, elements }) {
          if (matchWidth) elements.floating.style.minWidth = `${rects.reference.width}px`
          if (fitHeight) elements.floating.style.maxHeight = `${Math.max(160, Math.min(320, availableHeight))}px`
        },
      }),
    ],
  })

  const { refs, elements, floatingStyles } = floating
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      const reference = refs.reference.current
      if (reference instanceof Element && reference.contains(target)) return
      if (refs.floating.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, refs])

  // refs 객체째 넘기면 react-hooks/refs 린트가 렌더 중 ref 접근으로 오인해서 setter 만 꺼내 준다
  return { open, setOpen, setReference: refs.setReference, setFloating: refs.setFloating, floatingStyles, elements }
}
