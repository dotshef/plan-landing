'use client'

import { createContext, useContext } from 'react'
import type { StockData } from '@/data/loader'

const StockDataContext = createContext<StockData | null>(null)

export function StockDataProvider({ data, children }: { data: StockData; children: React.ReactNode }) {
  return <StockDataContext.Provider value={data}>{children}</StockDataContext.Provider>
}

export function useStockData(): StockData {
  const ctx = useContext(StockDataContext)
  if (!ctx) throw new Error('useStockData must be used within StockDataProvider')
  return ctx
}
