'use client'

import type { CSSProperties, ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface Props {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  style?: CSSProperties
}

// 화면에 처음 들어올 때 한 번만 아래에서 위로 나타남
export default function FadeUp({ children, delay = 0, y = 24, className, style }: Props) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}
