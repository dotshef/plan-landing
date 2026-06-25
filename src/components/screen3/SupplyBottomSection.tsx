import MajorShareholders from '@/components/screen3/MajorShareholders'
import ProgramTradeSection from '@/components/screen3/ProgramTradeSection'

export default function SupplyBottomSection() {
  return (
    <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'var(--grid-columns, repeat(2, 1fr))', gap: 14 }}>
      <MajorShareholders />
      <div className="responsive-section-card" style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: 'var(--card-padding, 20px 22px)' }}>
        <ProgramTradeSection />
      </div>
    </div>
  )
}
