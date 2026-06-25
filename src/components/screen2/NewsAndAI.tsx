'use client'

import { useStockData } from '@/context/StockDataContext'

export default function NewsAndAI() {
  const { rep } = useStockData()
  const DUMMY_NEWS = rep.DUMMY_NEWS
  const COMPANY_OVERVIEW = rep.COMPANY_OVERVIEW
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>

      {/* 오늘의 뉴스 */}
      <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>오늘의 뉴스</span>
          <span style={{ fontSize: 12, color: '#8B95A1', cursor: 'default' }}>더보기 ›</span>
        </div>
        {DUMMY_NEWS.map((n, i) => (
          <div key={i} style={{ padding: '9px 0', borderTop: '1px solid #F2F4F6' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#333D4B', lineHeight: 1.4 }}>{n.title}</div>
            <div style={{ fontSize: 11, color: '#B0B8C1', marginTop: 3 }}>{n.source} · {n.time}</div>
          </div>
        ))}
      </div>

      {/* 기업 개요 */}
      <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>기업 개요</span>
          <span style={{ fontSize: 12, color: '#8B95A1', cursor: 'default' }}>더보기 ›</span>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.7, color: '#4E5968' }}>{COMPANY_OVERVIEW.description}</p>
        <div style={{ marginTop: 'auto' }}>
          {[
            { k: 'CEO',    v: COMPANY_OVERVIEW.ceo },
            { k: '설립일',  v: COMPANY_OVERVIEW.founded },
            { k: '임직원',  v: COMPANY_OVERVIEW.employees },
            { k: '업종',    v: COMPANY_OVERVIEW.industry },
          ].map(({ k, v }) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #F2F4F6', fontSize: 12 }}>
              <span style={{ color: '#8B95A1' }}>{k}</span>
              <span style={{ fontWeight: 600, color: '#333D4B' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
