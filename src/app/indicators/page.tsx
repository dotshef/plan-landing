import type { Metadata } from 'next'
import IndicatorsContent from '@/components/indicators/IndicatorsContent'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '영상 속 자료 받기 — 투자그룹 플랜',
  description: '영상에서 소개한 보조지표 자료를 무료로 받아보세요. 설정 방법부터 활용 기준까지 한 번에.',
  alternates: { canonical: '/indicators' },
}

export default function IndicatorsPage() {
  return <IndicatorsContent />
}
