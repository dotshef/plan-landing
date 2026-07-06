'use client'

import { useStockData } from '@/context/StockDataContext'
import SparklineChart from '@/components/common/SparklineChart'

const fmt = (n: number) => n.toLocaleString('ko-KR')

export default function StockRightSidebar() {
  const { quote: s, chart } = useStockData()
  const yearClose = chart.CANDLESTICK_DATA['1년'].map((d) => d.close)
  const isUp = s.change >= 0
  const changeColor = isUp ? '#E8342B' : '#3182f6'
  const changeArrow = isUp ? '▲' : '▼'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 주요 지표 요약 */}
      <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 14 }}>주요 지표 요약</div>
        {[
          { k: '전일대비',     v: `${changeArrow} ${fmt(Math.abs(s.change))}`,        color: changeColor },
          { k: '등락률',       v: `${changeArrow} ${Math.abs(s.changeRate).toFixed(2)}%`, color: changeColor },
          { k: '52주 최고',    v: fmt(s.week52High),           color: '#111827' },
          { k: '52주 최저',    v: fmt(s.week52Low),            color: '#111827' },
          { k: '외국인 보유율', v: `${s.foreignOwnership.toFixed(2)}%`, color: '#111827' },
        ].map(({ k, v, color }) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F7F8FA', fontSize: 13 }}>
            <span style={{ color: '#8B95A1' }}>{k}</span>
            <span style={{ fontWeight: 700, color }}>{v}</span>
          </div>
        ))}
      </div>

      {/* 최근 1년 주가 추이 */}
      <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 12 }}>최근 1년 주가 추이</div>
        <SparklineChart data={yearClose} isRise={isUp} height={120} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#B0B8C1', marginTop: 4 }}>
          <span>{Math.min(...yearClose).toLocaleString('ko-KR')}원</span>
          <span>{Math.max(...yearClose).toLocaleString('ko-KR')}원</span>
        </div>
      </div>

    </div>
  )
}
