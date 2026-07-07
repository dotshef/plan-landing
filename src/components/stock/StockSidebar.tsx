'use client'

import Link from 'next/link'
import CountingNumber from '@/components/common/CountingNumber'
import { useStockData } from '@/context/StockDataContext'
import { stockColor } from '@/data/stock-color'

interface Props {
  animate: boolean
}

const fmt = (n: number) => n.toLocaleString('ko-KR')

export default function StockSidebar({ animate }: Props) {
  const { quote: s } = useStockData()
  const color = stockColor(s.code)
  const isUp = s.change >= 0
  const changeColor = isUp ? '#E8342B' : '#3182f6'
  const changeArrow = isUp ? '▲' : '▼'
  return (
    <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: 22 }}>
      {/* 종목 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{s.name}</div>
          <div style={{ fontSize: 12, color: '#8B95A1' }}>{s.code} · KOSPI</div>
        </div>
      </div>

      {/* 현재가 */}
      <div style={{ fontSize: 34, fontWeight: 800, color: changeColor, letterSpacing: '-0.02em' }}>
        {animate ? <CountingNumber target={s.currentPrice} formatter={fmt} /> : fmt(s.currentPrice)}원
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: changeColor, marginTop: 2 }}>
        {changeArrow} {fmt(Math.abs(s.change))} ({Math.abs(s.changeRate).toFixed(2)}%)
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', background: '#3182f6', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#fff' }}>
          실시간
        </div>
        <span style={{ fontSize: 11, color: '#8B95A1' }}>{s.lastUpdated} 기준</span>
      </div>

      {/* 주요 수치 */}
      <div style={{ marginTop: 18, borderTop: '1px solid #F2F4F6', paddingTop: 6 }}>
        {[
          { k: '시가',     v: fmt(s.open),   color: '#111827' },
          { k: '고가',     v: fmt(s.high),   color: '#E8342B' },
          { k: '저가',     v: fmt(s.low),    color: '#3182f6' },
          { k: '거래량',   v: fmt(s.volume), color: '#111827' },
          { k: '거래대금', v: (s.tradingValue / 1e8).toFixed(0) + '억', color: '#111827' },
          { k: '시가총액', v: (s.marketCap / 1e12).toFixed(1) + '조',  color: '#111827' },
        ].map(({ k, v, color }) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F7F8FA', fontSize: 13 }}>
            <span style={{ color: '#8B95A1' }}>{k}</span>
            <span style={{ fontWeight: 700, color }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#8B95A1' }}>PER</span>
          <span style={{ fontWeight: 700, color: '#111827' }}>{s.per.toFixed(2)}</span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#8B95A1' }}>PBR</span>
          <span style={{ fontWeight: 700, color: '#111827' }}>{s.pbr.toFixed(2)}</span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#8B95A1' }}>배당수익률</span>
          <span style={{ fontWeight: 700, color: '#111827' }}>{s.dividendYield.toFixed(2)}%</span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/report/${s.code}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 46, marginTop: 18, borderRadius: 11, background: '#1B6CF2', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
      >
        리포트 보기
      </Link>
    </div>
  )
}
