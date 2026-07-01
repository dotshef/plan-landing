# 랜딩 UX 수정 계획

`KIS_API_SCREEN_MAP.md`에 정리된 KIS API 실측 결과를 기준으로, KIS API로 렌더링 불가한 데이터만 화면에서 제거·수정한다.

---

## 제거 기준

전수 조사 결과 아래 항목만 KIS API로 호출 불가 확정.

| 데이터 | 사유 |
|--------|------|
| 1년 베타 | KIS REST 직접 제공 필드 없음 |
| 주주구성 세부 비율 (개인/기관/기타) | KIS 미제공 (외국인보유율만 가능) |
| 프로그램 매매 차익/비차익 분리 (종목별) | 종목별은 매수/매도 합계만. 차익/비차익 분리는 시장 종합만 가능 |
| AI 인사이트 / 한줄 분석 | API 데이터 아님 |
| 리포트 상세 본문 / 애널리스트 코멘트 | 목표주가·투자의견까지만 제공 |
| 기업 소개글 / CEO / 설립일 / 임직원 수 | KIS 미제공 (업종/상장일만 가능) |
| 현금흐름표 | KIS REST 미제공 |

> **레거시 문서 대비 변경점**: 배당 정보(주당배당금·배당수익률·배당성향·배당 히스토리), 뉴스, 목표주가·투자의견은 KIS API로 호출 가능함이 재조사에서 확인됨. **제거하지 않고 유지·구현 대상**.

---

## 1. 완전 제거 — 컴포넌트 삭제

### `AiInsightSection.tsx`
- **사유**: AI 인사이트 문장은 KIS API 데이터 아님
- **영향**: 해당 컴포넌트를 렌더링하는 곳 확인 후 제거

### `MajorShareholders.tsx`
- **사유**: 주주구성 세부 비율(개인/기관/기타) 호출 불가. 외국인 보유율은 `inquire-price`로 가능하나 도넛 차트로 표현할 수 있는 구성 데이터 자체가 없음
- **영향**: `SupplyBottomSection.tsx`에서 제거. 외국인 보유율은 `StockSidebar` 또는 `Screen2RightSidebar`에 이미 표시 중이므로 중복 제거로 처리

---

## 2. 섹션 부분 제거 — 컴포넌트 내 특정 블록 삭제

### `Screen2RightSidebar.tsx` — 두 블록 제거
- **제거 대상 1**: `베타(1Y)` 항목 (주요 지표 요약 리스트에서 해당 행만 삭제)
- **제거 대상 2**: AI 한줄 분석 카드 전체 (배경색 박스 + 버튼 포함)
- **유지 대상**: 전일대비 / 등락률 / 52주 최고·최저 / 외국인 보유율 / 최근 1년 주가 추이 차트

### `NewsAndAI.tsx` — 기업 개요 카드 항목 축소
- **제거 대상**: 기업 개요 카드 내 `CEO` / `설립일` / `임직원` 행 + 상단 소개글(`description`)
- **유지 대상**:
  - 오늘의 뉴스 카드 (`news-title` API로 실데이터 연결)
  - 기업 개요 카드 내 `업종` 행만 유지 (`inquire-price.bstp_kor_isnm` 또는 `search-stock-info.std_idst_clsf_cd_name`)
  - 상장일 추가 검토 가능 (`search-stock-info.scts_mket_lstg_dt`)

---

## 3. 컴포넌트 로직 변경 — API 데이터 소스 재편

### `ProgramTradeSection.tsx` — 차트 데이터 구조 변경
- **현재**: 차익 / 비차익 2개 바 시리즈
- **변경 후**: 종목별 전체 순매수(`whol_smtn_ntby_qty`) 단일 바 시리즈로 재구성
- **사유**: `program-trade-by-stock-daily` (FHPPG04650201)는 종목별 차익/비차익 분리 미제공. 매수·매도·순매수 합계만 제공
- **결과**: 컴포넌트 유지, 라벨/필드만 변경

### `FinancialBottomSection.tsx` — 배당 데이터 소스 연결
- **변경**: 배당 정보 섹션 유지. 데이터 출처를 `ksdinfo/dividend` (HHKDB669102C0)로 연결
  - 주당배당금 → `per_sto_divi_amt` 직접 조회
  - 배당수익률 → 연간 주당배당금 / 현재가 × 100 (앱 내 계산)
  - 배당성향 → 연간 주당배당금 / EPS × 100 (앱 내 계산)
  - 연간 주당배당금 히스토리 → 3년치 실데이터

### `StockSidebar.tsx` — 배당수익률 유지
- **변경**: 배당수익률 행 유지 (제거하지 않음). 데이터 소스만 앱 내 계산으로 연결

### `StockPageContent.tsx` — 뉴스 탭 유지
- **변경**: `{ key: 'dead', label: '뉴스' }`를 활성 탭으로 전환. `news-title` API로 데이터 연결

### `ReportContent.tsx` (또는 리포트 관련 컴포넌트) — 실데이터 연결 가능
- **변경**: 목표주가 / 투자의견 / 증권사명 / 괴리율은 `invest-opinion` (FHKST663300C0) 실데이터로 연결 가능
- **주의**: 리포트 상세 본문 텍스트·애널리스트 코멘트는 여전히 하드코딩 또는 제거 필요

---

## 4. 레이아웃 후속 조정

| 변경 위치 | 현재 | 변경 후 |
|-----------|------|---------|
| `SupplyBottomSection.tsx` | MajorShareholders + ProgramTradeSection 2열 | MajorShareholders 제거, ProgramTradeSection 1열 전체 너비 |
| `Screen2RightSidebar.tsx` | 지표요약 + 주가추이 + AI분석 3블록 | 지표요약 + 주가추이 2블록 |
| `NewsAndAI.tsx` | 뉴스 + 기업개요 2열 (그대로 유지) | 그대로 유지 (기업개요 카드 내부 항목만 축소) |
| `FinancialBottomSection.tsx` | 배당 + 분기실적 2열 (그대로 유지) | 그대로 유지 (배당 데이터 소스만 실 API로 교체) |

---

## 5. 유지 — 변경 없음

| 컴포넌트 | 데이터 출처 |
|----------|------------|
| `CandlestickChart.tsx` | 일봉 OHLCV (`inquire-daily-itemchartprice`) |
| `InvestorTrendBar.tsx` | 투자자별 수급 (`inquire-investor`) |
| `TechnicalIndicators.tsx` | OHLCV 원천 데이터로 앱 내 계산 |
| `FinancialTable.tsx` | 재무비율 / 손익계산서 / 대차대조표 API |
| `SupplyDemandChart.tsx` | 투자자별 수급 차트 (`inquire-investor`) |
| `NetBuyCards.tsx` | 개인/외국인/기관 순매수 요약 (`inquire-investor`) |
| `StockSidebar.tsx` | 현재가/시가·고가·저가/거래량/시총/PER/PBR/배당수익률(계산) |
| `Screen2RightSidebar.tsx` (베타·AI 제외) | 52주 최고·최저 / 외국인 보유율 / 주가 추이 |
| `ReportPreviewSidebar.tsx` | 리포트 CTA (하드코딩 마케팅 문구) — API 데이터 아님, 유지 |
