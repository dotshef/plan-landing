import type { StockData } from './types'

import { STOCK_QUOTE as q005930 } from './stocks/005930/index'
import * as f005930 from './stocks/005930/financials'
import * as r005930 from './stocks/005930/report'
import * as c005930 from './stocks/005930/chart'

import { STOCK_QUOTE as q000660 } from './stocks/000660/index'
import * as f000660 from './stocks/000660/financials'
import * as r000660 from './stocks/000660/report'
import * as c000660 from './stocks/000660/chart'

import { STOCK_QUOTE as q035420 } from './stocks/035420/index'
import * as f035420 from './stocks/035420/financials'
import * as r035420 from './stocks/035420/report'
import * as c035420 from './stocks/035420/chart'

import { STOCK_QUOTE as q012450 } from './stocks/012450/index'
import * as f012450 from './stocks/012450/financials'
import * as r012450 from './stocks/012450/report'
import * as c012450 from './stocks/012450/chart'

export type { StockData } from './types'

// Module namespace objects can't be passed to Client Components — spread them into plain objects
const STOCKS: Record<string, StockData> = {
  '005930': { quote: q005930, fin: { ...f005930 }, rep: { ...r005930 }, chart: { ...c005930 } },
  '000660': { quote: q000660, fin: { ...f000660 }, rep: { ...r000660 }, chart: { ...c000660 } },
  '035420': { quote: q035420, fin: { ...f035420 }, rep: { ...r035420 }, chart: { ...c035420 } },
  '012450': { quote: q012450, fin: { ...f012450 }, rep: { ...r012450 }, chart: { ...c012450 } },
}

export function getStockData(code: string): StockData {
  return STOCKS[code] ?? STOCKS['005930']
}
