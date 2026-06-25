'use client'

import { useEffect, useRef } from 'react'
import type { ISeriesApi } from 'lightweight-charts'
import { useStockData } from '@/context/StockDataContext'

function calcMA(data: { close: number }[], len: number) {
  return data.map((_, i) => {
    if (i < len - 1) return null
    return data.slice(i - len + 1, i + 1).reduce((s, d) => s + d.close, 0) / len
  })
}

export default function CandlestickChart() {
  const { chart: chartData } = useStockData()
  const candleDataRef = useRef(chartData.CANDLESTICK_DATA)
  const containerRef = useRef<HTMLDivElement>(null)
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ma5Ref   = useRef<ISeriesApi<'Line'> | null>(null)
  const ma20Ref  = useRef<ISeriesApi<'Line'> | null>(null)
  const ma60Ref  = useRef<ISeriesApi<'Line'> | null>(null)
  const chartRef = useRef<{ timeScale(): { fitContent(): void; setVisibleLogicalRange(r: { from: number; to: number }): void }; remove(): void; applyOptions(o: object): void; priceScale(id: string): { applyOptions(o: object): void } } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false
    let cleanupFn: (() => void) | undefined

    import('lightweight-charts').then(({ createChart, CandlestickSeries, HistogramSeries, LineSeries }) => {
      if (cancelled || !containerRef.current) return
      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 380,
        layout: { background: { color: '#ffffff' }, textColor: '#4e5968' },
        grid: { vertLines: { color: '#f2f4f6' }, horzLines: { color: '#f2f4f6' } },
        rightPriceScale: { borderColor: '#e5e8eb' },
        timeScale: {
          borderColor: '#e5e8eb',
          timeVisible: true,
          fixLeftEdge: true,
          fixRightEdge: true,
        },
      })
      chartRef.current = chart as never

      const candle = chart.addSeries(CandlestickSeries, {
        upColor: '#f04452', downColor: '#3182f6',
        borderUpColor: '#f04452', borderDownColor: '#3182f6',
        wickUpColor: '#f04452', wickDownColor: '#3182f6',
      })
      candleRef.current = candle as never
      const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'volume', lastValueVisible: false, priceLineVisible: false })
      volumeRef.current = volume as never
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } })
      const ma5  = chart.addSeries(LineSeries, { color: '#fe9800', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
      const ma20 = chart.addSeries(LineSeries, { color: '#03b26c', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
      const ma60 = chart.addSeries(LineSeries, { color: '#a234c7', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
      ma5Ref.current  = ma5  as never
      ma20Ref.current = ma20 as never
      ma60Ref.current = ma60 as never

      const raw = candleDataRef.current['3년']
      candle.setData(raw.map(d => ({ time: d.time as never, open: d.open, high: d.high, low: d.low, close: d.close })))
      volume.setData(raw.map(d => ({ time: d.time as never, value: d.volume, color: d.close >= d.open ? '#ffc0c5' : '#c0d0ff' })))
      const ma5v  = calcMA(raw, 5)
      const ma20v = calcMA(raw, 20)
      const ma60v = calcMA(raw, 60)
      ma5.setData(raw.flatMap((d, i) => ma5v[i] != null ? [{ time: d.time as never, value: ma5v[i]! }] : []))
      ma20.setData(raw.flatMap((d, i) => ma20v[i] != null ? [{ time: d.time as never, value: ma20v[i]! }] : []))
      ma60.setData(raw.flatMap((d, i) => ma60v[i] != null ? [{ time: d.time as never, value: ma60v[i]! }] : []))

      // 기본으로 최근 3개월 구간 표시
      chart.timeScale().setVisibleLogicalRange({ from: raw.length - 65 - 0.5, to: raw.length - 0.5 })

      const ro = new ResizeObserver(() => {
        if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
      })
      ro.observe(containerRef.current)
      cleanupFn = () => { ro.disconnect(); chart.remove() }
    })

    return () => { cancelled = true; cleanupFn?.() }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div ref={containerRef} className="w-full" />
      <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 700 }}>
        <span style={{ color: '#fe9800' }}>5일 이동평균선</span>
        <span style={{ color: '#03b26c' }}>20일 이동평균선</span>
        <span style={{ color: '#a234c7' }}>60일 이동평균선</span>
      </div>
    </div>
  )
}
