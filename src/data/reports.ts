export const REPORT_DETAIL = {
  code: '005930',
  name: '삼성전자',
  opinion: '매수',
  targetPrice: 95000,
  fairValueLow: 82000,
  fairValueHigh: 98000,
  publishDate: '2024.06.24',
  analyst: '박지현 (K-Stock 리서치센터)',
  summary: '반도체 업황 회복과 HBM 수요 증가에 따른 실적 개선 기대. 목표주가 95,000원으로 상향 조정.',
  supplyDemandAnalysis: `최근 20거래일 외국인 순매수 1,246,817주로 수급 개선 확인. 기관은 소폭 매도세이나 외국인 주도 상승 흐름 유지. 공매도 잔고 비율 0.8%로 낮은 수준 유지 중. 주가 변동성(20일 ATR) 2,134원으로 안정적 흐름 형성.`,
  checkpoints: [
    'AI 서버용 고성능 메모리 수요 지속 확대',
    'HBM 시장 내 점유율 회복 및 고객사 다변화',
    '파운드리 수율 개선 및 주요 고객사 확보 진행',
    '스마트폰 및 IT 수요 회복에 따른 세트 사업 실적 개선',
  ],
  legalNotice: '본 리포트는 투자 권유 목적이 아닙니다. 수익을 보장하지 않으며, 투자 결정은 투자자 본인의 판단과 책임 하에 이루어져야 합니다. 과거 수익률이 미래 수익을 보장하지 않습니다.',
}

export const DUMMY_NEWS = [
  { title: '삼성전자, 3분기 영업이익 10조 회복 전망', source: '한국경제', time: '2시간 전' },
  { title: '외국인, 삼성전자 5거래일 연속 순매수', source: '머니투데이', time: '4시간 전' },
  { title: 'HBM4 개발 순항...내년 초 양산 목표', source: '전자신문', time: '6시간 전' },
]

export const COMPANY_OVERVIEW = {
  description: '삼성전자는 반도체, 모바일, 디스플레이 등 다양한 사업을 영위하는 글로벌 전자기업입니다. 메모리 반도체 분야에서 글로벌 시장 점유율 1위를 유지하고 있으며, 지속적인 기술 혁신을 통해 성장하고 있습니다.',
  ceo: '한종희',
  founded: '1969.01.13',
  employees: '약 26만 명',
  industry: '반도체·전자',
}

export const FINANCIAL_SUMMARY = {
  basis: '2024.03 기준',
  items: [
    { k: '매출액',    v: '719,156억', change: '-1.42%',    up: false },
    { k: '영업이익',  v: '66,060억',  change: '+931.25%',  up: true  },
    { k: '당기순이익', v: '67,547억',  change: '+1,525.43%', up: true  },
    { k: '영업이익률', v: '9.18%',    change: '+8.28%p',   up: true  },
    { k: 'ROE',       v: '9.36%',    change: '+8.10%p',   up: true  },
  ],
}

export const DIVIDEND_INFO = {
  yield: 2.14,
  perShare: 1444,
  payout: 20.5,
  history: [
    { year: '2020', amount: 1932 },
    { year: '2021', amount: 1444 },
    { year: '2022', amount: 1444 },
    { year: '2023', amount: 1444 },
    { year: '2024E', amount: 1500 },
  ],
}

export const QUARTERLY_EARNINGS = [
  { quarter: '23.1Q',    revenue: 637455, op: 6402,   opMargin: 1.0  },
  { quarter: '23.2Q',    revenue: 600050, op: 6685,   opMargin: 1.1  },
  { quarter: '23.3Q',    revenue: 671520, op: 24340,  opMargin: 3.6  },
  { quarter: '23.4Q',    revenue: 673210, op: 28120,  opMargin: 4.2  },
  { quarter: '24.1Q',    revenue: 710480, op: 66060,  opMargin: 9.3  },
  { quarter: '24.2Q',    revenue: 740000, op: 103470, opMargin: 14.0 },
  { quarter: '24.3Q(E)', revenue: 800000, op: 120000, opMargin: 15.0 },
  { quarter: '24.4Q(E)', revenue: 870000, op: 150000, opMargin: 17.2 },
]

export const AI_ONE_LINER = '외국인 수급 개선과 반도체 업황 회복이 맞물려 단기 상승 모멘텀 유효, 78,500원 저항선 돌파 시 추가 상승 기대.'

export const AI_INSIGHTS = [
  '외국인 순매수 전환: 최근 5일간 외국인 1.2백만주 순매수, 수급 개선 신호.',
  'HBM 수혜 지속: AI 서버용 HBM3E 수요 확대로 메모리 부문 수익성 개선 중.',
  '기술적 지지선 확인: 20일 이동평균선(75,400원) 위에서 견조한 흐름 유지.',
  '목표가 상향 여지: 2024E EPS 4,058원 기준 PER 23.4배 — 업종 평균 대비 저평가 구간.',
]
