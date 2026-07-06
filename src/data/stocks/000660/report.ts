export const REPORT_DETAIL = {
  code: '000660',
  name: 'SK하이닉스',
  opinion: '매수',
  targetPrice: 240000,
  fairValueLow: 210000,
  fairValueHigh: 252000,
  publishDate: '2024.06.24',
  nextUpdateDate: '2024.09.06',
  analyst: '김도현 (K-Stock 리서치센터)',
  summary: 'HBM3E 독점 공급 및 AI 서버 수요 급증으로 역대 최대 실적 경신 기대. 목표주가 240,000원으로 상향 조정.',
  supplyDemandAnalysis: `최근 20거래일 외국인 순매수 3,814,207주로 수급 개선 뚜렷. 기관도 소폭 매수 전환. 공매도 잔고 비율 0.5%로 낮은 수준 유지. 주가 변동성(20일 ATR) 6,820원으로 고변동성 구간이나 상승 추세 유효.`,
  checkpoints: [
    'HBM3E 사실상 독점 공급 — NVIDIA 전체 AI 서버 물량 수혜',
    '2024년 연간 흑자 전환 확실, OP 22조 원 달성 가능',
    '1b 낸드 전환 가속으로 원가 구조 개선 진행 중',
    'DDR5 채택 확대로 범용 DRAM 수익성도 동반 회복',
  ],
  legalNotice: '본 리포트는 투자 권유 목적이 아닙니다. 수익을 보장하지 않으며, 투자 결정은 투자자 본인의 판단과 책임 하에 이루어져야 합니다. 과거 수익률이 미래 수익을 보장하지 않습니다.',
}

export const DUMMY_NEWS = [
  { title: 'SK하이닉스, HBM3E 8단 독점 공급…엔비디아 블랙웰 전용', source: '전자신문',   time: '1시간 전' },
  { title: '하이닉스 2Q 영업이익 5.5조 예상…어닝서프라이즈 가능성', source: '한국경제',   time: '3시간 전' },
  { title: '외국인 5거래일 연속 순매수 — HBM 기대감 반영',           source: '머니투데이', time: '5시간 전' },
]

export const COMPANY_OVERVIEW = {
  description: 'SK하이닉스는 DRAM·낸드플래시 메모리 반도체를 생산하는 글로벌 2위 메모리 기업입니다. AI 서버용 고대역폭 메모리(HBM) 분야에서 세계 1위 점유율을 보유하고 있으며, NVIDIA와의 전략적 파트너십을 통해 AI 반도체 공급망의 핵심 역할을 수행 중입니다.',
  ceo: '곽노정',
  founded: '1983.02.23',
  employees: '약 3만 명',
  industry: '반도체·메모리',
}
