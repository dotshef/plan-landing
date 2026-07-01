export interface StockMeta {
  code: string
  name: string
  color: string
  market: string
  hot: boolean
  summary: string
}

export const STOCK_LIST: StockMeta[] = [
  {
    code: '005930',
    name: '삼성전자',
    color: '#1428A0',
    market: 'KOSPI',
    hot: true,
    summary: '외국인 순매수 전환, 반도체 업황 회복 기대감으로 상승 모멘텀 유지 중.',
  },
  {
    code: '000660',
    name: 'SK하이닉스',
    color: '#EA002C',
    market: 'KOSPI',
    hot: false,
    summary: 'HBM 수요 확대 수혜 지속, 단기 차익 실현 압력으로 소폭 조정 중.',
  },
  {
    code: '035420',
    name: 'NAVER',
    color: '#03C75A',
    market: 'KOSPI',
    hot: false,
    summary: 'AI 검색 광고 매출 성장 본격화, 클라우드 부문 흑자 전환 기대.',
  },
  {
    code: '012450',
    name: '한화에어로스페이스',
    color: '#F58220',
    market: 'KOSPI',
    hot: false,
    summary: '방산 수출 호조 및 우주 사업 성장, 연간 실적 상향 조정 가능성 높음.',
  },
]

export function getStockMeta(code: string): StockMeta | undefined {
  return STOCK_LIST.find((s) => s.code === code)
}

export const POPULAR_STOCKS = STOCK_LIST.map(({ name, code }) => ({ name, code }))
export const REPORT_CARDS = STOCK_LIST.map(({ code, name, color, hot, summary }) => ({ code, name, color, hot, summary }))
