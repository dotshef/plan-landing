// 단위: ANNUAL_FINANCIALS → 십억원, QUARTERLY_EARNINGS → 억원

export const FINANCIAL_METRICS = {
  per: 35.0,
  pbr: 2.8,
  roe: 18.4,
  eps: 10590,
  dividendYield: 0.20,
}

export const ANNUAL_FINANCIALS = [
  { year: '2021',  revenue:  5_820, operatingProfit: 278, netProfit: 221, eps:  3_250 },
  { year: '2022',  revenue:  7_100, operatingProfit: 402, netProfit: 268, eps:  3_941 },
  { year: '2023',  revenue:  9_400, operatingProfit: 572, netProfit: 380, eps:  5_590 },
  { year: '2024E', revenue: 14_000, operatingProfit: 950, netProfit: 720, eps: 10_590 },
]

export const FINANCIAL_SUMMARY = {
  basis: '2024.03 기준',
  items: [
    { k: '매출액',     v: '32,800억', change: '+68.2%',   up: true },
    { k: '영업이익',   v: '2,150억',  change: '+144.3%',  up: true },
    { k: '당기순이익', v: '1,620억',  change: '+126.8%',  up: true },
    { k: '영업이익률', v: '6.6%',     change: '+2.8%p',   up: true },
    { k: 'ROE',        v: '18.4%',    change: '+9.2%p',   up: true },
  ],
}

export const DIVIDEND_INFO = {
  yield: 0.20,
  perShare: 750,
  payout: 7.1,
  history: [
    { year: '2020',  amount: 400 },
    { year: '2021',  amount: 500 },
    { year: '2022',  amount: 600 },
    { year: '2023',  amount: 700 },
    { year: '2024E', amount: 800 },
  ],
}

export const QUARTERLY_EARNINGS = [
  { quarter: '23.1Q',    revenue: 19_500, op:   880, opMargin:  4.5 },
  { quarter: '23.2Q',    revenue: 22_400, op: 1_200, opMargin:  5.4 },
  { quarter: '23.3Q',    revenue: 24_600, op: 1_580, opMargin:  6.4 },
  { quarter: '23.4Q',    revenue: 27_700, op: 2_040, opMargin:  7.4 },
  { quarter: '24.1Q',    revenue: 32_800, op: 2_150, opMargin:  6.6 },
  { quarter: '24.2Q',    revenue: 38_000, op: 2_500, opMargin:  6.6 },
  { quarter: '24.3Q(E)', revenue: 43_000, op: 2_800, opMargin:  6.5 },
  { quarter: '24.4Q(E)', revenue: 46_000, op: 2_550, opMargin:  5.5 },
]
