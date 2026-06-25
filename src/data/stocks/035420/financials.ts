// 단위: ANNUAL_FINANCIALS → 십억원, QUARTERLY_EARNINGS → 억원

export const FINANCIAL_METRICS = {
  per: 22.1,
  pbr: 1.6,
  roe: 7.4,
  eps: 8589,
  dividendYield: 0.28,
}

export const ANNUAL_FINANCIALS = [
  { year: '2021',  revenue:  6_820, operatingProfit: 1_324, netProfit: 1_010, eps:  6_196 },
  { year: '2022',  revenue:  8_222, operatingProfit: 1_326, netProfit:   970, eps:  5_951 },
  { year: '2023',  revenue:  9_671, operatingProfit: 1_401, netProfit: 1_204, eps:  7_387 },
  { year: '2024E', revenue: 10_520, operatingProfit: 1_600, netProfit: 1_400, eps:  8_589 },
]

export const FINANCIAL_SUMMARY = {
  basis: '2024.03 기준',
  items: [
    { k: '매출액',     v: '25,683억', change: '+7.8%',    up: true  },
    { k: '영업이익',   v: '3,958억',  change: '+19.0%',   up: true  },
    { k: '당기순이익', v: '3,120억',  change: '+14.2%',   up: true  },
    { k: '영업이익률', v: '15.4%',    change: '+1.4%p',   up: true  },
    { k: 'ROE',        v: '7.4%',     change: '+0.8%p',   up: true  },
  ],
}

export const DIVIDEND_INFO = {
  yield: 0.28,
  perShare: 510,
  payout: 6.1,
  history: [
    { year: '2020',  amount: 381 },
    { year: '2021',  amount: 457 },
    { year: '2022',  amount: 483 },
    { year: '2023',  amount: 510 },
    { year: '2024E', amount: 560 },
  ],
}

export const QUARTERLY_EARNINGS = [
  { quarter: '23.1Q',    revenue: 23_815, op: 3_328, opMargin: 14.0 },
  { quarter: '23.2Q',    revenue: 24_072, op: 3_562, opMargin: 14.8 },
  { quarter: '23.3Q',    revenue: 24_465, op: 3_640, opMargin: 14.9 },
  { quarter: '23.4Q',    revenue: 24_349, op: 3_596, opMargin: 14.8 },
  { quarter: '24.1Q',    revenue: 25_683, op: 3_958, opMargin: 15.4 },
  { quarter: '24.2Q',    revenue: 26_800, op: 4_100, opMargin: 15.3 },
  { quarter: '24.3Q(E)', revenue: 27_500, op: 4_300, opMargin: 15.6 },
  { quarter: '24.4Q(E)', revenue: 28_200, op: 4_540, opMargin: 16.1 },
]
