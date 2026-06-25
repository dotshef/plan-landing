'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
  BarChart, Cell,
} from 'recharts'
import { useStockData } from '@/context/StockDataContext'

const fmt = (n: number) => n.toLocaleString('ko-KR')

export default function FinancialBottomSection() {
  const { fin } = useStockData()
  const { DIVIDEND_INFO, QUARTERLY_EARNINGS } = fin
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>

      {/* 배당 정보 */}
      <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>배당 정보</span>
          <span style={{ fontSize: 12, color: '#8B95A1', cursor: 'default' }}>더보기 ›</span>
        </div>

        {/* 핵심 지표 3개 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { k: '배당수익률', v: `${DIVIDEND_INFO.yield}%` },
            { k: '주당배당금', v: `${fmt(DIVIDEND_INFO.perShare)}원` },
            { k: '배당성향',   v: `${DIVIDEND_INFO.payout}%` },
          ].map(({ k, v }) => (
            <div key={k} style={{ background: '#F7F8FA', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: '#8B95A1', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* 배당 이력 바 차트 */}
        <div style={{ fontSize: 12, color: '#8B95A1', marginBottom: 8 }}>연간 주당배당금 추이 (원)</div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={DIVIDEND_INFO.history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#8B95A1' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#8B95A1' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [`${fmt(Number(v))}원`, '주당배당금']}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E8EB' }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {DIVIDEND_INFO.history.map((d) => (
                <Cell key={d.year} fill={d.year === '2024E' ? '#1B6CF2' : '#93C5FD'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 분기별 실적 추이 */}
      <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>분기별 실적 추이</span>
            <span style={{ fontSize: 11, color: '#8B95A1', marginLeft: 6 }}>(단위: 억원)</span>
          </div>
          <span style={{ fontSize: 12, color: '#8B95A1', cursor: 'default' }}>더보기 ›</span>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={QUARTERLY_EARNINGS} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" vertical={false} />
            <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#8B95A1' }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="rev"
              orientation="left"
              tick={{ fontSize: 10, fill: '#8B95A1' }}
              tickFormatter={(v) => (v / 10000).toFixed(0) + '조'}
              axisLine={false} tickLine={false}
            />
            <YAxis
              yAxisId="op"
              orientation="right"
              tick={{ fontSize: 10, fill: '#8B95A1' }}
              tickFormatter={(v) => (v / 10000).toFixed(1) + '조'}
              axisLine={false} tickLine={false}
            />
            <Tooltip
              formatter={(v, name) => [
                `${fmt(Number(v))}억`,
                name === 'revenue' ? '매출액' : '영업이익',
              ]}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E8EB' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v) => v === 'revenue' ? '매출액' : '영업이익'}
            />
            <Bar yAxisId="rev" dataKey="revenue" fill="#BFDBFE" radius={[3, 3, 0, 0]} />
            <Line yAxisId="op" dataKey="op" stroke="#1B6CF2" strokeWidth={2} dot={{ r: 3, fill: '#1B6CF2' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
