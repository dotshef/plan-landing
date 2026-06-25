'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useStockData } from '@/context/StockDataContext'

export default function MajorShareholders() {
  const { chart } = useStockData()
  const { SHAREHOLDERS, SHAREHOLDERS_DATE } = chart
  const foreign = SHAREHOLDERS.find((s) => s.name === '외국인')!
  return (
    <div style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>주요 주주 현황</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* 도넛 차트 */}
        <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SHAREHOLDERS}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={66}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {SHAREHOLDERS.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center', lineHeight: 1.3,
          }}>
            <div style={{ fontSize: 10, color: '#8B95A1', fontWeight: 600 }}>외국인 지분율</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{foreign.value.toFixed(2)}%</div>
          </div>
        </div>

        {/* 범례 */}
        <div style={{ flex: 1 }}>
          {SHAREHOLDERS.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: '#4E5968', flex: 1 }}>{s.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.value.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: '#B0B8C1', textAlign: 'right' }}>
        기준일: {SHAREHOLDERS_DATE}
      </div>
    </div>
  )
}
