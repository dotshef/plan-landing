'use client'

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStockData } from '@/context/StockDataContext'

export default function ProgramTradeSection() {
  const { chart } = useStockData()
  const data = chart.PROGRAM_TRADE.slice(-15).map((d) => ({
    date: d.date.slice(5),
    순매수: d.arbitrage + d.nonArbitrage,
  }))

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>프로그램 매매 순매수 추이</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b95a1' }} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: '#8b95a1' }} tickFormatter={(v) => (v / 1000).toFixed(0) + 'K'} />
          <Tooltip
            formatter={(v) => (Number(v) || 0).toLocaleString('ko-KR') + '주'}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e8eb' }}
          />
          <Bar dataKey="순매수" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.순매수 >= 0 ? '#E8342B' : '#3182f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
