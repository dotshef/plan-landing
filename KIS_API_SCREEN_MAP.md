# KIS API 화면 렌더링 가능 여부

> 실측 기준: 삼성전자 (005930), 2026-07-02

---

## 1. 호출 가능

| 데이터 항목 | 화면 위치 | API (tr_id) |
|------------|-----------|-------------|
| 현재가 | StockSidebar | inquire-price (FHKST01010100) |
| 전일대비 | StockSidebar, Screen2RightSidebar | inquire-price (FHKST01010100) |
| 등락률 | StockSidebar, Screen2RightSidebar | inquire-price (FHKST01010100) |
| 시가 | StockSidebar | inquire-price (FHKST01010100) |
| 고가 | StockSidebar | inquire-price (FHKST01010100) |
| 저가 | StockSidebar | inquire-price (FHKST01010100) |
| 거래량 | StockSidebar | inquire-price (FHKST01010100) |
| 거래대금 | StockSidebar | inquire-price (FHKST01010100) |
| 시가총액 | StockSidebar, FinancialTable | inquire-price (FHKST01010100) |
| PER | StockSidebar, FinancialTable | inquire-price (FHKST01010100) |
| PBR | StockSidebar, FinancialTable | inquire-price (FHKST01010100) |
| EPS | FinancialTable | inquire-price (FHKST01010100) |
| 52주 최고가 | Screen2RightSidebar | inquire-price (FHKST01010100) |
| 52주 최저가 | Screen2RightSidebar | inquire-price (FHKST01010100) |
| 외국인 보유율 | Screen2RightSidebar | inquire-price (FHKST01010100) |
| 업종명 | NewsAndAI (기업개요) | inquire-price (FHKST01010100) |
| 일봉 OHLCV | CandlestickChart | inquire-daily-itemchartprice (FHKST03010100) |
| 최근 1년 주가 추이 | Screen2RightSidebar | inquire-daily-itemchartprice (FHKST03010100) |
| 개인 순매수량 | InvestorTrendBar, NetBuyCards | inquire-investor (FHKST01010900) |
| 외국인 순매수량 | InvestorTrendBar, NetBuyCards | inquire-investor (FHKST01010900) |
| 기관 순매수량 | InvestorTrendBar, NetBuyCards | inquire-investor (FHKST01010900) |
| 투자자별 누적 수급 차트 | SupplyDemandChart | inquire-investor (FHKST01010900) |
| ROE | FinancialTable | balance-sheet endpoint (FHKST66430300) |
| BPS | FinancialTable | balance-sheet endpoint (FHKST66430300) |
| 연간 매출액 | FinancialTable | income-statement (FHKST66430200) |
| 연간 영업이익 | FinancialTable | income-statement (FHKST66430200) |
| 연간 당기순이익 | FinancialTable | income-statement (FHKST66430200) |
| 분기별 매출액 | FinancialBottomSection | income-statement (FHKST66430200) |
| 분기별 영업이익 | FinancialBottomSection | income-statement (FHKST66430200) |
| RSI / MACD / 볼린저밴드 / 이동평균 | TechnicalIndicators | OHLCV 기반 앱 내 계산 |

---

## 2. 호출 불가

| 데이터 항목 | 화면 위치 | 불가 사유 |
|------------|-----------|-----------|
| 배당수익률 | StockSidebar, FinancialTable | inquire-price 응답에 필드 없음. KIS REST 미제공 |
| 주당배당금 | FinancialBottomSection | KIS REST 미제공 |
| 배당성향 | FinancialBottomSection | KIS REST 미제공 |
| 연간 배당 히스토리 | FinancialBottomSection | KIS REST 미제공 |
| 베타(1Y) | Screen2RightSidebar | KIS REST 직접 제공 필드 없음 |
| 주주구성 비율 (개인/기관/기타) | MajorShareholders | KIS 미제공. 외국인보유율 단일 수치만 가능 |
| 프로그램 매매 (차익/비차익) | ProgramTradeSection | WebSocket 전용. REST 엔드포인트 없음 |
| 뉴스 | NewsAndAI | KIS REST 범위 밖 |
| 기업 소개글 | NewsAndAI (기업개요) | KIS 미제공 |
| CEO | NewsAndAI (기업개요) | KIS 미제공 |
| 설립일 | NewsAndAI (기업개요) | KIS 미제공 |
| 임직원 수 | NewsAndAI (기업개요) | KIS 미제공 |
| AI 한줄 분석 | Screen2RightSidebar | KIS API 데이터 아님 |
| AI 분석 인사이트 | AiInsightSection | KIS API 데이터 아님 |
| 증권사 리포트 / 목표주가 | ReportContent | KIS API 범위 밖 |
