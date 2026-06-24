import Link from 'next/link'
import Image from 'next/image'
import { REPORT_CARDS } from '@/data/stocks'

export default function ReportCards() {
  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 28px 8px' }}>
      <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 18, padding: '26px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>오늘의 인기 리포트</div>
          <span style={{ padding: '4px 10px', borderRadius: 7, background: '#EAF1FE', color: '#1B6CF2', fontSize: 12, fontWeight: 700 }}>무료 제공</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {REPORT_CARDS.map((r) => (
            <div key={r.code} style={{ border: '1px solid #EEF1F6', borderRadius: 14, padding: 18, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '1px solid #EEF1F6', flexShrink: 0 }}>
                  <Image src={r.image} alt={r.name} width={40} height={40} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
                </div>
                <div style={{ lineHeight: 1.25, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>
                    {r.name} <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 500 }}>{r.code}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7684' }}>주가 전망 리포트</div>
                </div>
                {r.hot && (
                  <span style={{ padding: '3px 8px', borderRadius: 6, background: '#FCEEED', color: '#E8342B', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>가장 많이 조회</span>
                )}
              </div>
              <div style={{ margin: '14px 0 16px', fontSize: 13, lineHeight: 1.55, color: '#6B7684' }}>{r.summary}</div>
              <Link
                href="/report/005930"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 42, border: 'none', borderRadius: 10, background: '#EAF1FE', color: '#1B6CF2', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}
              >
                무료 리포트 확인하기 ›
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
