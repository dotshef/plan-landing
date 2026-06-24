'use client'

import { useId } from 'react'

interface Props {
  data: number[]
  isRise: boolean
  height?: number
}

export default function SparklineChart({ data, isRise, height = 48 }: Props) {
  const uid = useId()
  const color = isRise ? '#f04452' : '#3182f6'
  const W = 300
  const H = height

  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padY = 3

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - padY - ((v - min) / range) * (H - padY * 2)
    return [x, y] as [number, number]
  })

  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')
  const area = `${line} L${W} ${H} L0 ${H}Z`
  const gradId = `sg${uid.replace(/:/g, '')}`

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
