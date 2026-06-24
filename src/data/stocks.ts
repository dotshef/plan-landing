export interface StockMeta {
  code: string
  name: string
  image: string
  market: string
  hot: boolean
  summary: string
}

export const STOCK_LIST: StockMeta[] = [
  {
    code: '005930',
    name: '삼성전자',
    image: '/images/samsung.svg',
    market: 'KOSPI',
    hot: true,
    summary: '외국인 순매수 전환, 반도체 업황 회복 기대감으로 상승 모멘텀 유지 중.',
  },
  {
    code: '000660',
    name: 'SK하이닉스',
    image: '/images/skhynix.svg',
    market: 'KOSPI',
    hot: false,
    summary: 'HBM 수요 확대 수혜 지속, 단기 차익 실현 압력으로 소폭 조정 중.',
  },
  {
    code: '035420',
    name: 'NAVER',
    image: '/images/naver.svg',
    market: 'KOSPI',
    hot: false,
    summary: 'AI 검색 광고 매출 성장 본격화, 클라우드 부문 흑자 전환 기대.',
  },
  {
    code: '012450',
    name: '한화에어로스페이스',
    image: '/images/hanhwa.png',
    market: 'KOSPI',
    hot: false,
    summary: '방산 수출 호조 및 우주 사업 성장, 연간 실적 상향 조정 가능성 높음.',
  },
]

export function getStockMeta(code: string): StockMeta | undefined {
  return STOCK_LIST.find((s) => s.code === code)
}

export const POPULAR_STOCKS = STOCK_LIST.map(({ name, code }) => ({ name, code }))
export const REPORT_CARDS = STOCK_LIST.map(({ code, name, image, hot, summary }) => ({ code, name, image, hot, summary }))

export const SAMSUNG = {
  code: '005930',
  name: '삼성전자',
  currentPrice: 77800,
  change: 800,
  changeRate: 1.04,
  open: 76900,
  high: 78100,
  low: 76500,
  volume: 12_840_619,
  tradingValue: 998_000_000_000,
  marketCap: 464_000_000_000_000,
  per: 14.2,
  pbr: 1.3,
  dividendYield: 2.14,
}
