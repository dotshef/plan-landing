# KIS API 화면 렌더링 가능 여부

> 실측 기준: 삼성전자 (005930), 2026-07-02

---

## 1. 호출 가능

| 데이터 항목 | 화면 위치 | API (tr_id) |
|------------|-----------|-------------|
| 현재가 | StockSidebar | inquire-price (FHKST01010100) |
| 전일대비 | StockSidebar, StockRightSidebar | inquire-price (FHKST01010100) |
| 등락률 | StockSidebar, StockRightSidebar | inquire-price (FHKST01010100) |
| 시가 | StockSidebar | inquire-price (FHKST01010100) |
| 고가 | StockSidebar | inquire-price (FHKST01010100) |
| 저가 | StockSidebar | inquire-price (FHKST01010100) |
| 거래량 | StockSidebar | inquire-price (FHKST01010100) |
| 거래대금 | StockSidebar | inquire-price (FHKST01010100) |
| 시가총액 | StockSidebar, FinancialTable | inquire-price (FHKST01010100) |
| PER | StockSidebar, FinancialTable | inquire-price (FHKST01010100) |
| PBR | StockSidebar, FinancialTable | inquire-price (FHKST01010100) |
| EPS | FinancialTable | inquire-price (FHKST01010100) |
| 52주 최고가 | StockRightSidebar | inquire-price (FHKST01010100) |
| 52주 최저가 | StockRightSidebar | inquire-price (FHKST01010100) |
| 외국인 보유율 | StockRightSidebar | inquire-price (FHKST01010100) |
| 업종명 | NewsAndAI (기업개요) | inquire-price (FHKST01010100) |
| 일봉 OHLCV | CandlestickChart | inquire-daily-itemchartprice (FHKST03010100) |
| 최근 1년 주가 추이 | StockRightSidebar | inquire-daily-itemchartprice (FHKST03010100) |
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
| 주당배당금 | FinancialBottomSection | ksdinfo/dividend (HHKDB669102C0) — `per_sto_divi_amt` |
| 연간 배당 히스토리 | FinancialBottomSection | ksdinfo/dividend (HHKDB669102C0) — 3년치 데이터 |
| 배당수익률 | StockSidebar, FinancialTable | 주당배당금 + 현재가로 앱 내 계산 |
| 배당성향 | FinancialBottomSection | 주당배당금 + EPS로 앱 내 계산 |
| **뉴스 (제목 + 출처 + 시각)** | NewsAndAI | **news-title (FHKST01011800)** — `hts_pbnt_titl_cntt`, `dorg`, `data_dt/tm` |
| **종목별 프로그램매매 (일별 전체 순매수)** | ProgramTradeSection | **program-trade-by-stock-daily (FHPPG04650201)** — `whol_smtn_ntby_qty` |
| **목표주가** | ReportContent | **invest-opinion (FHKST663300C0)** — `hts_goal_prc` |
| **투자의견 (BUY/HOLD/SELL)** | ReportContent | **invest-opinion (FHKST663300C0)** — `invt_opnn` |
| **증권사명 (리포트 발행처)** | ReportContent | **invest-opinion (FHKST663300C0)** — `mbcr_name` |
| **괴리율** | ReportContent | **invest-opinion (FHKST663300C0)** — `dprt` |
| **증권사별 투자의견 리스트** | ReportContent | **invest-opbysec (FHKST663400C0)** — 100건 리스트 |
| RSI / MACD / 볼린저밴드 / 이동평균 | TechnicalIndicators | OHLCV 기반 앱 내 계산 |

---

## 2. 호출 불가

| 데이터 항목 | 화면 위치 | 불가 사유 |
|------------|-----------|-----------|
| 베타(1Y) | StockRightSidebar | KIS REST 직접 제공 필드 없음. OHLCV + KOSPI 지수로 앱 내 계산 가능하나 별도 구현 필요 |
| 주주구성 세부 비율 (개인/기관/기타) | ~~MajorShareholders~~ (2026-07-06 컴포넌트 삭제) | KIS 전체 156개 국내주식 API 폴더 전수 검색 결과 관련 엔드포인트 없음. 외국인보유율(`hts_frgn_ehrt`) 단일 수치만 가능 |
| 프로그램매매 차익/비차익 분리 (종목별) | ProgramTradeSection | 종목별은 매수/매도 합계(`whol_smtn`)만 제공. 차익(arbt)/비차익(nabt) 분리는 시장 종합(코스피/코스닥)에서만 가능 |
| 기업 소개글 (description) | NewsAndAI (기업개요) | KIS 미제공 |
| CEO | NewsAndAI (기업개요) | KIS 미제공 (search-info, search-stock-info 모두 없음) |
| 설립일 | NewsAndAI (기업개요) | KIS 미제공. 상장일(`scts_mket_lstg_dt`)만 있음 |
| 임직원 수 | NewsAndAI (기업개요) | KIS 미제공 |
| AI 한줄 분석 | StockRightSidebar | KIS API 데이터 아님 (2026-07-06 목데이터 AI_ONE_LINER 제거) |
| AI 분석 인사이트 | ~~AiInsightSection~~ (2026-07-06 컴포넌트 삭제) | KIS API 데이터 아님 |
| 리포트 상세 본문 / 애널리스트 코멘트 | ReportContent | KIS는 목표주가·투자의견·괴리율까지만 제공. 리포트 본문 텍스트는 미제공 |
