'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useStockData } from '@/context/StockDataContext'

export default function SupplyDemandChart() {
  const { chart } = useStockData()
  const cumulative = chart.SUPPLY_DEMAND.reduce<{ date: string; foreign: number; institution: number; individual: number }[]>(
    (acc, d) => {
      const prev = acc[acc.length - 1] ?? { foreign: 0, institution: 0, individual: 0 }
      acc.push({
        date: d.date.slice(5),
        foreign:     prev.foreign     + d.foreign,
        institution: prev.institution + d.institution,
        individual:  prev.individual  + d.individual,
      })
      return acc
    },
    []
  )

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>수급 분석</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={cumulative} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b95a1' }} interval={6} />
          <YAxis tick={{ fontSize: 10, fill: '#8b95a1' }} tickFormatter={(v) => (v / 1000).toFixed(0) + 'K'} />
          <Tooltip
            formatter={(v) => (Number(v) || 0).toLocaleString('ko-KR') + '주'}
            labelStyle={{ fontSize: 11 }}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e8eb' }}
          />
          <Legend iconType="line" wrapperStyle={{ fontSize: 11 }} />
          <Line dataKey="foreign"     name="외국인" stroke="#3182f6" strokeWidth={1.5} dot={false} />
          <Line dataKey="institution" name="기관"   stroke="#fe9800" strokeWidth={1.5} dot={false} />
          <Line dataKey="individual"  name="개인"   stroke="#8b95a1" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
