import ApplicationPanel from '@/components/report/ApplicationPanel'

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
