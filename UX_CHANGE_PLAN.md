# 랜딩 UX 수정 계획

KIS API 호출 불가 데이터를 기준으로 랜딩 페이지에서 제거 또는 수정할 항목을 정리한다.

---

## 제거 기준

아래 8개 데이터는 KIS API로 호출 불가가 확정되었다.

| 데이터 | 사유 |
|--------|------|
| 종목별 프로그램 매매 종합 | REST API 없음 (WebSocket 전용) |
| 현금흐름표 | KIS REST 미제공 |
| 배당 히스토리 / 주당배당금 / 배당성향 | KIS REST 미제공 |
| 1년 베타 | 직접 제공 필드 없음 |
| 뉴스 | KIS REST 범위 밖 |
| AI 인사이트 / 한줄 분석 | API 데이터 아님 |
| 증권사 리포트 / 목표주가 | KIS API 범위 밖 |
| 주주구성 세부 비율 (개인/기관/기타) | KIS 미제공 (외국인 보유율만 가능) |

---

## 1. 완전 제거 — 컴포넌트 삭제

### `ProgramTradeSection.tsx`
- **사유**: 종목별 프로그램 매매 데이터 호출 불가
- **영향**: `SupplyBottomSection.tsx`에서 import 제거, 레이아웃 재편 필요

### `AiInsightSection.tsx`
- **사유**: AI 인사이트 문장은 KIS API 데이터 아님
- **영향**: 해당 컴포넌트를 렌더링하는 곳 확인 후 제거

### `MajorShareholders.tsx`
- **사유**: 주주구성 세부 비율(개인/기관/기타) 호출 불가. 외국인 보유율은 `inquire-price`로 가능하나 도넛 차트로 표현할 수 있는 구성 데이터 자체가 없음
- **영향**: `SupplyBottomSection.tsx`에서 제거. 외국인 보유율은 `StockSidebar` 또는 `Screen2RightSidebar`에 이미 표시 중이므로 중복 제거로 처리

---

## 2. 섹션 부분 제거 — 컴포넌트 내 특정 블록 삭제

### `FinancialBottomSection.tsx` — 배당 정보 섹션 제거
- **제거 대상**: 배당수익률 / 주당배당금 / 배당성향 카드 3개 + 연간 주당배당금 추이 바 차트
- **유지 대상**: 분기별 실적 추이 차트 (손익계산서 API로 가능)
- **레이아웃**: 2열 → 1열 전체 너비로 변경

### `NewsAndAI.tsx` — 뉴스 섹션 제거
- **제거 대상**: 오늘의 뉴스 카드 전체
- **유지 대상**: 기업 개요 카드 (단, CEO/설립일/임직원 수는 KIS 미제공이므로 업종 정보만 남기거나 섹션 전체 제거 검토)
- **레이아웃**: 2열 → 기업 개요 1개만 남기거나 전체 제거 후 빈 공간 처리

### `Screen2RightSidebar.tsx` — 두 블록 제거
- **제거 대상 1**: `베타(1Y)` 항목 (주요 지표 요약 리스트에서 해당 행만 삭제)
- **제거 대상 2**: AI 한줄 분석 카드 전체 (배경색 박스 + 버튼 포함)
- **유지 대상**: 전일대비 / 등락률 / 52주 최고·최저 / 외국인 보유율 / 최근 1년 주가 추이 차트

### `StockSidebar.tsx` — 배당수익률 항목 제거
- **제거 대상**: `배당수익률` 행 (dividendYield)
- **유지 대상**: 시가/고가/저가/거래량/거래대금/시가총액/PER/PBR

### `StockPageContent.tsx` — 뉴스 탭 제거
- **제거 대상**: `{ key: 'dead', label: '뉴스' }` 탭 항목
- **유지 대상**: 종합 / 차트 / 재무 / 수급 탭

---

## 3. 레이아웃 후속 조정

| 변경 위치 | 현재 | 변경 후 |
|-----------|------|---------|
| `SupplyBottomSection.tsx` | MajorShareholders + ProgramTradeSection 2열 | 두 컴포넌트 모두 제거 → 섹션 자체 제거 또는 대체 컨텐츠 검토 |
| `FinancialBottomSection.tsx` | 배당 + 분기실적 2열 | 분기별 실적 1열 전체 너비 |
| `NewsAndAI.tsx` | 뉴스 + 기업개요 2열 | 기업개요 1열 or 전체 제거 |
| `Screen2RightSidebar.tsx` | 지표요약 + 주가추이 + AI분석 3블록 | 지표요약 + 주가추이 2블록 |

---

## 4. 유지 — 변경 없음

| 컴포넌트 | 데이터 출처 |
|----------|------------|
| `CandlestickChart.tsx` | 일봉 OHLCV (`inquire-daily-itemchartprice`) |
| `InvestorTrendBar.tsx` | 투자자별 수급 (`inquire-investor`) |
| `TechnicalIndicators.tsx` | OHLCV 원천 데이터로 앱 내 계산 |
| `FinancialTable.tsx` | 재무비율 / 손익계산서 / 대차대조표 API |
| `SupplyDemandChart.tsx` | 투자자별 수급 차트 |
| `NetBuyCards.tsx` | 개인/외국인/기관 순매수 요약 |
| `StockSidebar.tsx` (배당 제외) | 현재가 / 시가·고가·저가 / 거래량 / 시총 / PER / PBR |
| `Screen2RightSidebar.tsx` (베타·AI 제외) | 52주 최고·최저 / 외국인 보유율 / 주가 추이 |
| `ReportPreviewSidebar.tsx` | 리포트 CTA (하드코딩 마케팅 문구) — API 데이터 아님, 유지 |
