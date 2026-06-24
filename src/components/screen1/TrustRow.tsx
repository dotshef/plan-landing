import {ShieldCheck, Gift, User, Clock, type LucideIcon, } from 'lucide-react'

const TRUST_ITEMS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: ShieldCheck, title: '신뢰할 수 있는 데이터', desc: '공신력 있는 데이터를 기반으로 분석합니다.' },
  { icon: Clock,         title: '실시간 시세 제공', desc: '시장 상황을 실시간으로 반영합니다.' },
  { icon: User,   title: '전문가 분석 리포트', desc: '경험 많은 전문가의 인사이트를 제공합니다.' },
  { icon: Gift,         title: '모든 리포트 무료 제공', desc: '회원가입 없이 무료로 확인 가능합니다.' },
]

export default function TrustRow() {
  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '16px 28px 56px' }}>
      <div style={{
        background: '#fff', border: '1px solid #EEF1F6', borderRadius: 18,
        padding: '24px 28px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24
      }}>
        {TRUST_ITEMS.map((tr) => (
          <div key={tr.title} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <tr.icon size={20} color="#1B6CF2" />
            </div>
            <div style={{ lineHeight: 1.4 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#111827' }}>{tr.title}</div>
              <div style={{ fontSize: 12.5, color: '#8B95A1', marginTop: 2 }}>{tr.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
