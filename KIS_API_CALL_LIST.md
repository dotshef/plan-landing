# KIS API 호출 목록 (화면 렌더링 기준)

> 조사일: 2026-07-06 | 실전투자 REST: `https://openapi.koreainvestment.com:9443`
> 필드 단위 실측 상세는 [KIS_API_SPEC.md](KIS_API_SPEC.md), 항목별 렌더링 가능 여부는 [KIS_API_SCREEN_MAP.md](KIS_API_SCREEN_MAP.md), 지수는 [KIS_API_INDEX.md](KIS_API_INDEX.md) 참고.
> 테스트 스크립트: [scripts/](scripts/) (test-01 ~ test-12, 전부 실호출 검증 완료)

---

## 0. 인증 (모든 호출의 전제)

| 항목 | 값 |
|---|---|
| endpoint | `POST /oauth2/tokenP` |
| body | `grant_type=client_credentials`, `appkey`, `appsecret` (`.env`의 `KIS_APP_KEY`, `KIS_APP_SECRET`) |
| 토큰 유효기간 | 24시간 — 재발급 남용 시 제한되므로 캐시 필수 ([scripts/auth.js](scripts/auth.js)는 23h 파일 캐시) |

---

## 1. 화면별 필요 API 요약

> "화면 1~4" 번호는 [reference/](reference/) 시안 PNG 기준. 실제 라우트는 3개이며, **화면 3은 별도 페이지가 아니라 종목 상세(`/stock/[code]`)의 재무/수급 탭**으로 구현되어 있음.
>
> | 시안 | 실제 라우트 |
> |---|---|
> | 화면 1 | `/` (랜딩) |
> | 화면 2 | `/stock/[code]` — 종합/차트 탭 |
> | 화면 3 | `/stock/[code]?tab=financial` / `?tab=supply` — 재무/수급 탭 |
> | 화면 4 | `/report/[code]` (전문가 리포트) |

### 화면 1 — 랜딩 (`/`)

| 컴포넌트 | 데이터 | API (tr_id) | 호출 수 |
|---|---|---|---|
| MarketIndexCards | KOSPI / KOSDAQ 지수 | 국내지수 `FHPUP02100000` | 2 |
| MarketIndexCards | NASDAQ / S&P500 지수 + sparkline | 해외지수 `FHKST03030100` | 2 |
| ReportCards | 종목 카드 시세 (현재가·등락률) | 현재가 `FHKST01010100` | 종목 수만큼 (현재 4) |

### 화면 2 — 종목 상세, 종합/차트 탭 (`/stock/[code]`)

| 컴포넌트 | 데이터 | API (tr_id) | 호출 수 |
|---|---|---|---|
| StockSidebar | 현재가·등락·시가/고가/저가·거래량·거래대금·시총·PER·PBR·배당수익률* | 현재가 `FHKST01010100` | 1 |
| CandlestickChart | 일봉 OHLCV | 기간별시세 `FHKST03010100` | 1 |
| TechnicalIndicators | RSI/MACD/볼린저/이동평균 | 기간별시세 응답으로 앱 내 계산 (추가 호출 없음) | 0 |
| InvestorTrendBar | 개인/외국인/기관 순매수 | 투자자동향 `FHKST01010900` | 1 |
| NewsAndAI | 뉴스 제목·출처·시각 | 뉴스 `FHKST01011800` | 1 |
| NewsAndAI (기업개요) | 업종명 / 상장주식수·상장일 | 현재가 응답 재사용 / 기본정보 `CTPF1002R` | 0~1 |
| StockRightSidebar | 52주 고저·외국인보유율 / 1년 추이 | 현재가·기간별시세 응답 재사용 | 0 |

*배당수익률 = ksdinfo/dividend의 주당배당금 + 현재가로 계산 (화면 3에서 함께 호출 시 재사용)

**화면 2 신규 호출: 4~5건**

### 화면 3 — 종목 상세, 재무/수급 탭 (`/stock/[code]?tab=financial|supply`)

> 별도 페이지가 아님. 화면 2와 같은 페이지에서 탭 전환 시 렌더링되므로, 현재가·투자자동향 응답은 화면 2에서 받은 것을 재사용한다.

| 컴포넌트 | 데이터 | API (tr_id) | 호출 수 |
|---|---|---|---|
| FinancialTable | 연간 매출·영업이익·순이익 | 손익계산서 `FHKST66430200` (연간 `FID_DIV_CLS_CODE=0`) | 1 |
| FinancialBottomSection | 분기 매출·영업이익 | 손익계산서 `FHKST66430200` (분기 `FID_DIV_CLS_CODE=1`) | 1 |
| FinancialTable | ROE·BPS | 재무비율 `FHKST66430300` | 1 |
| FinancialTable | PER·PBR·EPS·시총 | 현재가 응답 재사용 | 0 |
| FinancialBottomSection | 주당배당금·배당 히스토리·배당성향 | 예탁원 배당 `HHKDB669102C0` | 1 |
| NetBuyCards / SupplyDemandChart | 투자자별 순매수·누적 수급 | 투자자동향 응답 재사용 | 0 |
| ProgramTradeSection | 프로그램매매 일별 순매수 | 프로그램매매 `FHPPG04650201` | 1 |
| ~~MajorShareholders~~ | 주주구성 세부 비율 | ❌ KIS 미제공 — 2026-07-06 리팩토링으로 컴포넌트 삭제 | — |
| ~~AiInsightSection~~ | AI 인사이트 | KIS 데이터 아님 — 2026-07-06 리팩토링으로 컴포넌트 삭제 (ReportPreviewSidebar도 함께 삭제) | — |

**화면 3 신규 호출: 5건** (재무 탭 4건 + 수급 탭 1건)

### 화면 4 — 전문가 리포트 (`/report/[code]`)

| 컴포넌트 | 데이터 | API (tr_id) | 호출 수 |
|---|---|---|---|
| ReportContent | 목표주가·투자의견·괴리율·발행 증권사 | 투자의견 `FHKST663300C0` | 1 |
| ReportContent | 증권사별 투자의견 리스트 | 증권사별의견 `FHKST663400C0` | 1 |
| ReportContent | 리포트 본문/애널리스트 코멘트 | ❌ KIS 미제공 (자체 생성) | — |

**화면 4 신규 호출: 2건**

---

## 2. API별 상세 (총 12개)

### 종목 단위 (10개)

| # | API | tr_id | endpoint | 핵심 파라미터 | 사용 화면 |
|---|---|---|---|---|---|
| 1 | 주식현재가 시세 | `FHKST01010100` | `GET /uapi/domestic-stock/v1/quotations/inquire-price` | `FID_COND_MRKT_DIV_CODE=J`, `FID_INPUT_ISCD=종목코드` | 1·2·3 |
| 2 | 기간별시세 (일봉) | `FHKST03010100` | `GET /uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice` | `J`, 종목코드, `FID_INPUT_DATE_1/2`, `FID_PERIOD_DIV_CODE=D`, `FID_ORG_ADJ_PRC=0` | 2 |
| 3 | 투자자별 매매동향 | `FHKST01010900` | `GET /uapi/domestic-stock/v1/quotations/inquire-investor` | `J`, 종목코드 | 2·3 |
| 4 | 손익계산서 | `FHKST66430200` | `GET /uapi/domestic-stock/v1/finance/income-statement` | `J`, 종목코드, `FID_DIV_CLS_CODE` 0=연간/1=분기 | 3 |
| 5 | 재무비율 (ROE/BPS) | `FHKST66430300` | `GET /uapi/domestic-stock/v1/finance/balance-sheet` | `J`, 종목코드, `FID_DIV_CLS_CODE` | 3 |
| 6 | 예탁원 배당일정 | `HHKDB669102C0` | `GET /uapi/domestic-stock/v1/ksdinfo/dividend` | `SHT_CD=종목코드`, `T_DT/F_DT`, `HIGH_GB=''`, `CTS=''`, `GB1=0` | 2*·3 |
| 7 | 종목 뉴스 | `FHKST01011800` | `GET /uapi/domestic-stock/v1/quotations/news-title` | `FID_INPUT_ISCD=종목코드` (나머지 공백 가능) | 2 |
| 8 | 프로그램매매 일별 | `FHPPG04650201` | `GET /uapi/domestic-stock/v1/quotations/program-trade-by-stock-daily` | `J`, 종목코드, `FID_INPUT_DATE_1` | 3 |
| 9 | 종목 투자의견 | `FHKST663300C0` | `GET /uapi/domestic-stock/v1/quotations/invest-opinion` | `J`, `FID_COND_SCR_DIV_CODE=16633`, 종목코드, 기간 | 4 |
| 10 | 증권사별 투자의견 | `FHKST663400C0` | `GET /uapi/domestic-stock/v1/quotations/invest-opbysec` | `J`, `FID_COND_SCR_DIV_CODE=16634`, 종목코드, `FID_DIV_CLS_CODE=0`, 기간 | 4 |

*배당수익률 계산용

보조: 종목기본정보 `CTPF1002R` (`GET /uapi/domestic-stock/v1/quotations/search-stock-info`, `PRDT_TYPE_CD=300`, `PDNO=종목코드`) — 상장주식수·상장일·시장구분이 필요할 때만.

### 시장 단위 (2개)

| # | API | tr_id | endpoint | 파라미터 | 사용 화면 |
|---|---|---|---|---|---|
| 11 | 국내 지수 | `FHPUP02100000` | `GET /uapi/domestic-stock/v1/quotations/inquire-index-price` | `FID_COND_MRKT_DIV_CODE=U`, `FID_INPUT_ISCD=0001`(KOSPI)/`1001`(KOSDAQ) | 1 |
| 12 | 해외 지수 | `FHKST03030100` | `GET /uapi/overseas-price/v1/quotations/inquire-daily-chartprice` | `FID_COND_MRKT_DIV_CODE=N`, `FID_INPUT_ISCD=COMP`(NASDAQ)/`SPX`(S&P500), 기간, `D` | 1 |

---

## 3. 호출량·운영 주의사항

- **초당 호출 제한**: 실전 계정 초당 20건이나 실측에서 연속 호출 시 `EGW00201: 초당 거래건수를 초과하였습니다` 발생 → 요청 간 최소 ~1초 지연 또는 큐잉 필수 (scripts는 1.1~1.5초 sleep 사용).
- **한 종목 기준 종목 상세 전체 탭(`/stock/[code]`) + 리포트(`/report/[code]`) 렌더링 시 총 호출 ≈ 11건** — 응답 재사용(현재가·일봉·투자자동향)을 전제로 함. 서버 사이드 캐시(예: 시세 1분, 재무 1일) 권장.
- **호출 불가 항목**은 [KIS_API_SCREEN_MAP.md](KIS_API_SCREEN_MAP.md) §2 참고: 베타, 주주구성 세부비율, 기업소개/CEO/설립일/임직원수, 프로그램매매 차익/비차익 분리(종목별), 리포트 본문, AI 분석.
- 해외 지수는 **전 영업일 종가 스냅샷** (실시간은 WebSocket 별도).
- 재무 API(손익계산서·재무비율)와 투자의견 API는 **주권(일반 상장사) 전용** — ETF/ETN/리츠에는 데이터가 없음.
