// 단위: ANNUAL_FINANCIALS → 십억원, QUARTERLY_EARNINGS → 억원

export const FINANCIAL_METRICS = {
  per: 7.2,
  pbr: 2.1,
  roe: 29.8,
  eps: 26064,
  dividendYield: 0.32,
}

export const ANNUAL_FINANCIALS = [
  { year: '2021',  revenue: 42_950, operatingProfit:  12_410, netProfit:  9_628, eps:  13_207 },
  { year: '2022',  revenue: 34_740, operatingProfit:  -1_766, netProfit: -2_316, eps:  -3_177 },
  { year: '2023',  revenue: 32_770, operatingProfit:  -7_732, netProfit: -7_980, eps: -10_945 },
  { year: '2024E', revenue: 65_000, operatingProfit:  22_000, netProfit: 19_000, eps:  26_064 },
]

export const FINANCIAL_SUMMARY = {
  basis: '2024.03 기준',
  items: [
    { k: '매출액',     v: '124,295억', change: '+144.2%',   up: true  },
    { k: '영업이익',   v: '28,691억',  change: '흑전',      up: true  },
    { k: '당기순이익', v: '21,234억',  change: '흑전',      up: true  },
    { k: '영업이익률', v: '23.1%',     change: '+89.9%p',   up: true  },
    { k: 'ROE',        v: '29.8%',     change: '흑전',      up: true  },
  ],
}

export const DIVIDEND_INFO = {
  yield: 0.32,
  perShare: 600,
  payout: 2.3,
  history: [
    { year: '2020',  amount: 1200 },
    { year: '2021',  amount: 1200 },
    { year: '2022',  amount:  600 },
    { year: '2023',  amount:  600 },
    { year: '2024E', amount:  800 },
  ],
}

export const QUARTERLY_EARNINGS = [
  { quarter: '23.1Q',    revenue:  50_900, op: -34_000, opMargin: -66.8 },
  { quarter: '23.2Q',    revenue:  73_100, op: -28_700, opMargin: -39.3 },
  { quarter: '23.3Q',    revenue:  90_700, op: -18_000, opMargin: -19.8 },
  { quarter: '23.4Q',    revenue: 113_000, op:  34_600, opMargin:  30.6 },
  { quarter: '24.1Q',    revenue: 124_295, op:  28_691, opMargin:  23.1 },
  { quarter: '24.2Q',    revenue: 164_200, op:  54_700, opMargin:  33.3 },
  { quarter: '24.3Q(E)', revenue: 190_000, op:  73_000, opMargin:  38.4 },
  { quarter: '24.4Q(E)', revenue: 210_000, op:  85_000, opMargin:  40.5 },
]
