import type { Metadata } from 'next'
import ApplicationPanel from '@/components/report/ApplicationPanel'

export const metadata: Metadata = {
  title: '무료 리포트 신청 | 투자그룹 플랜',
  description: '관심 종목의 전문가 리포트를 무료로 신청하세요. 실시간 시세, 수급, AI 분석까지 한눈에 확인할 수 있습니다.',
  alternates: { canonical: '/report' },
}

export default function ReportPage() {
  return (
    <div className="responsive-page-shell" style={{ maxWidth: 1320, margin: '0 auto', padding: 'var(--page-padding, 18px 28px 56px)' }}>
      <div style={{ marginBottom: 18, fontSize: 13, color: '#4E5968', fontWeight: 600 }}>무료 리포트 신청</div>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <ApplicationPanel />
      </div>
    </div>
  )
}
