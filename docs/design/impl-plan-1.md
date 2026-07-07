# 구현 계획 1 — DB 스키마 적용 & 목데이터 → KIS 실데이터 전환

기준 문서: [db-schema.md](db-schema.md), [KIS_INGESTION.md](KIS_INGESTION.md)
전제: 데이터 흐름 `KIS → 야간 Vercel Cron → Supabase(Postgres) → 클라이언트(항상 DB만 읽음)`.

---

## 0. 현황 요약 (코드 seam)

전환 대상 seam을 코드에서 확정했다. 이 지점만 바꾸면 화면 컴포넌트는 건드릴 필요가 없다.

| 계층 | 현재 (목) | 핵심 파일 | 전환 방향 |
|---|---|---|---|
| 종목 데이터 진입점 | 동기 `getStockData(code): StockData` | [src/data/loader.ts](../../src/data/loader.ts) | **비동기 DB 조회**로 교체. 반환 타입 `StockData` 유지 |
| 데이터 계약(타입) | `StockQuote/Chart/Financials/Report` | [src/data/types.ts](../../src/data/types.ts) | **그대로 유지** (매핑 목표 타입) |
| 화면 공급 | `StockDataProvider` → `useStockData()` | [src/context/StockDataContext.tsx](../../src/context/StockDataContext.tsx) | 유지. page에서 `await` 후 주입 |
| 지수 | 정적 배열 + seededRng | [src/data/market-indices.ts](../../src/data/market-indices.ts) | `market_index` 테이블 조회로 교체 |
| 종목 리스트/카드 | 하드코딩 4종목 | [src/data/registry.ts](../../src/data/registry.ts) | `stock` + `top_view` 조회로 교체 |
| KIS 접근 | Node 스크립트(CommonJS) | [scripts/auth.js](../../scripts/auth.js), [scripts/api.js](../../scripts/api.js) | `src/lib/kis/`로 TS 이식(토큰은 `kis_token` 테이블) |
| 종목 마스터 | TS 스냅샷 4,374종목 | [src/lib/kis/stock-master.ts](../../src/lib/kis/stock-master.ts) | `stock` 테이블 **시드 소스로만** 사용 |

**소비 페이지**: [stock/[code]/page.tsx](../../src/app/stock/[code]/page.tsx), [report/[code]/page.tsx](../../src/app/report/[code]/page.tsx) — 이미 `async` 서버 컴포넌트라 `await getStockData(code)`로 바꾸기만 하면 됨.

**아직 없는 것**: Supabase 클라이언트 의존성(`@supabase/supabase-js` 미설치), `src/lib/db`·`src/lib/kis`(TS), 마이그레이션, cron 라우트, `vercel.json`.

---

## 1. 결정사항 (검토 완료)

초안에서 잡았던 "매핑 갭"은 실제 렌더링 컴포넌트·실측 문서로 확인한 결과 대부분 해소됨. 남은 실제 결정 없음.

1. **DB = Supabase Postgres** — ✅ 확정 (서비스롤 커넥션, RLS 미사용).
2. **리포트/기업개요 = KIS로 충족** — ✅ 화면에 **실제 렌더되는** 값은 전부 KIS·스키마로 커버:
   - 투자의견·목표주가·발간일 → `invest_opinion` ([ReportContent.tsx](../../src/components/report/ReportContent.tsx))
   - 업종명 → `stock.industry` ([NewsAndAI.tsx](../../src/components/stock/NewsAndAI.tsx) 기업개요)
   - `nextUpdateDate`는 발간일+주기로 파생, `legalNotice`는 정적 상수.
   - 목데이터의 리포트 본문 산문(analyst/summary/checkpoints)·회사소개(description/CEO/설립일/직원수)는 **화면에 렌더되지 않음**("무료 신청 후 확인" 잠금 티저). KIS도 실측 미제공([SPEC_TEST §미제공](../reference/KIS_API_SPEC_TEST.md)). → **별도 `report` 테이블 불필요.** 신청 후 제공되는 실제 전문 리포트가 제품에 있다면 편집/CMS 영역(스키마 범위 밖).
3. **프로그램매매** — ✅ 해소. 화면([ProgramTradeSection.tsx](../../src/components/stock/ProgramTradeSection.tsx))이 순매수 합계만 표시 → `program_trade_daily.net_qty` 직결. **타입 `ProgramTradeDay{netBuy}` 단일 필드로 정리 완료.**
4. **`beta1Y`** — ✅ 해소. 어느 컴포넌트에도 미렌더(죽은 필드) → **타입·목데이터에서 제거 완료.**
5. **`invest_opinion` 두 API 중복** (db-schema 검증2) — 실측 후 `opinion_sec` 콜 유지/제거(콜 예산 최적화, 블로커 아님).

> 3·4는 이미 코드 반영됨(`types.ts`·목데이터·`ProgramTradeSection.tsx`, 타입체크 통과).

---

## 2. 아키텍처 개요

```
[쓰기 경로 — 야간 cron만]
  Vercel Cron(단일 스케줄, 5분 간격)
   └ /api/cron/ingest  (route handler, CRON_SECRET 검증)
       └ 리스 락(cron_lock) → 커서 선택(ingest_state) → 청크 150종목
           └ src/lib/kis/*  (토큰=kis_token, rate-limit 큐 10~15/s)
               └ dataset fetcher → 매퍼 → 멱등 upsert(Supabase 서비스롤)

[읽기 경로 — 요청 시]
  서버 컴포넌트(page.tsx)
   └ src/data/loader.ts  (DB 조회 + 파생값 계산)
       └ StockDataProvider → useStockData()  (화면 그대로)
```

**원칙(INGESTION §1)**: 요청 경로는 KIS를 절대 호출하지 않는다. 오직 DB만 읽는다.

---

## 3. Phase 0 — 기반 (DB·클라이언트·마이그레이션)

**목표**: 스키마를 실제 DB에 올리고, 서버 전용 커넥션을 만든다.

- `npm i @supabase/supabase-js`
- `.env` 추가: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, (기존) `KIS_APP_KEY`/`KIS_APP_SECRET`. **`NEXT_PUBLIC_` 금지**(db-schema §접근제어).
- `supabase/migrations/0001_init.sql` — [db-schema.md](db-schema.md)의 CREATE TABLE 전량을 그대로 이관. 인덱스·`generated` 컬럼·FK 포함.
- `src/lib/db/server.ts` — 서비스롤 Supabase 클라이언트 싱글턴(서버 전용, `import 'server-only'`).

**산출물**: 마이그레이션 적용된 빈 DB, `db()` 헬퍼.
**검증**: 마이그레이션 apply 후 12개 테이블 존재, `stock.is_common` generated 컬럼 동작.

---

## 4. Phase 1 — `stock` 시드

**목표**: 유니버스·이름 해석 출처를 `stock-master.ts` → `stock` 테이블로 이관(INGESTION §4).

- `scripts/seed-stock.ts`(1회성) — [stock-master.ts](../../src/lib/kis/stock-master.ts)의 `MASTER`(4,374) 순회 → `stock`에 upsert(`code,name,group_code,market`). `industry`는 null(야간 수집이 채움).
- `is_common`은 generated이므로 삽입하지 않음.
- 시드 후 앱은 TS 파일에 의존하지 않음(단, 재시드 소스로 파일 보존 — INGESTION §남은 미결).

**검증**: `select count(*) from stock` ≈ 4,374, `group_code='ST'` ≈ 2,726.

---

## 5. Phase 2 — KIS 클라이언트 라이브러리 (TS 이식)

**목표**: `scripts/auth.js`·`api.js` 로직을 서버 런타임(TS)으로 이식하되, 토큰을 파일 캐시 → `kis_token` 테이블로.

- `src/lib/kis/token.ts` — `getAccessToken()`: `kis_token` 단일행 조회 → 만료 전이면 재사용, 아니면 `/oauth2/tokenP` 발급 후 upsert. (발급 "1분당 1회" 제한 회피 — cron 청크 간 공유. INGESTION §3)
- `src/lib/kis/client.ts` — `kisGet(urlPath, params, trId, {custtype?})`: `api.js` 이식. `rt_cd !== '0'`이면 에러. `EGW00201`(rate)은 **백오프 후 재시도**, 그 외는 throw.
- `src/lib/kis/rate-limit.ts` — 토큰버킷/큐 10~15/초(INGESTION §3 rate 마진). 단일 워커 순차 호출.

**참고**: BASE_URL·헤더(`appkey/appsecret/tr_id`) 형식은 [api.js](../../scripts/api.js) 그대로. `top_view`는 `custtype:'P'` 헤더 필요(db-schema 매핑표).

**검증**: 로컬에서 `getAccessToken()` → `kisGet(현재가)` 1건 성공, 토큰 재호출 시 캐시 히트.

---

## 6. Phase 3 — 데이터셋 수집기(fetcher + 매퍼 + upsert)

**목표**: 12개 데이터셋(INGESTION §2) 각각 `fetch → map → upsert`. 기존 `scripts/test-*.js`가 각 API의 param·응답 필드를 이미 검증했으므로 그 매핑을 재사용.

`src/lib/kis/datasets/` 아래 데이터셋별 모듈. 시그니처 통일:
```ts
type Dataset = {
  key: string                    // ingest_state.dataset
  scope: 'stock' | 'market'
  run(code: string): Promise<'ok' | 'unavailable'>   // upsert까지 수행
}
```

| dataset | tr_id | 대상 테이블 | 매핑 근거 스크립트 | 비고 |
|---|---|---|---|---|
| `quote` | FHKST01010100 | `fundamental` + `stock.industry` | test-01, test-05 | 한 콜이 industry도 갱신 |
| `daily` | FHKST03010100 | `price_daily` | test-02 | `output2`, 증분 1콜 |
| `investor` | FHKST01010900 | `investor_trend_daily` | test-03 | 금액 필드 실값 확인(검증3) |
| `news` | FHKST01011800 | `news` | test-09? | unique 중복 흡수 |
| `income` | FHKST66430200 ×2 | `income_statement` | test-04 | 연간(0)+분기(1) |
| `ratio` | FHKST66430300 | `financial_ratio` | test-04 | 연간만(0) |
| `dividend` | HHKDB669102C0 | `dividend` | test-06 | 기준일 단위 |
| `program` | FHPPG04650201 | `program_trade_daily` | test-07/12 | 전체 순매수만 |
| `opinion` | FHKST663300C0 | `invest_opinion` | test-08 | |
| `opinion_sec` | FHKST663400C0 | `invest_opinion` | test-08 | 중복이면 제거(검증2) |
| `indices` | FHPUP02100000 + FHKST03030100 | `market_index` | test-10 | 시장 4콜, sparkline 계산 |
| `top_view` | HHMCM000100C0 | `top_view` | test-11 | `custtype:P`, is_common 필터, 원자 교체 |

**공통 규칙**
- **멱등 upsert**: 전 테이블 PK 기준 `upsert`(INGESTION §3).
- **주권 전용 분기**: 재무·투자의견은 응답 없으면 `'unavailable'` 반환 → cron이 `ingest_state`에 기록해 재호출 억제(INGESTION §2).
- **`top_view` 원자 교체**: 트랜잭션 내 전체 삭제 후 재삽입(db-schema 주석).
- 매퍼는 KIS 원값 저장(정규화는 읽기 매핑층). `fundamental.market_cap = hts_avls` 원값 등.

**검증**: 삼성전자(005930) 1종목 12 dataset 전량 실행 → 각 테이블 행 생성 확인. db-schema 검증항목 1(당일 캔들 포함), 3(투자자 금액), 5(stac_yymm 정렬) 실측.

---

## 7. Phase 4 — Cron 펌프 (락·커서·청크)

**목표**: 단일 cron이 청크 펌프로 전 주권 소진(INGESTION §3).

- `src/lib/ingest/lock.ts` — `cron_lock` 리스 락 획득/연장(heartbeat)/해제. 만료시각 기반 크래시 내성.
- `src/lib/ingest/cursor.ts` — `ingest_state.fetched_at < 오늘 배치 기준시각`인 종목 오래된 순 N개(150) 선택(신선도 no-op 조건).
- `src/lib/ingest/pump.ts` — 청크 순회: 종목별 dataset 실행 → rate 큐 경유 → `ingest_state` upsert(`status/fetched_at/error`) → 리스 연장.
- `src/app/api/cron/ingest/route.ts` — `Authorization: Bearer ${CRON_SECRET}` 검증 → 락 시도(실패 시 즉시 200 종료) → 시장 데이터셋(indices/top_view)은 락 소유자 1회 → pump 호출. `export const maxDuration = 800`(Pro).
- `vercel.json` — `crons: [{ path: '/api/cron/ingest', schedule: '*/5 9-11 * * *' }]`(UTC = KST 18:00~19:55, INGESTION §3).

**청크 산정(INGESTION §3)**: 150종목/실행 × 5분 → 2,726 ÷ 150 ≈ 19회 ≈ 95분. 150종목 ≈ 1,650콜 < maxDuration 800s.

**검증**: 로컬에서 route를 CRON_SECRET로 호출 → 150종목 처리·`ingest_state` 갱신. 2회 동시 호출 시 두 번째가 락 실패로 즉시 종료.

---

## 8. Phase 5 — 읽기 계층 교체 (DB → `StockData`)

**목표**: `getStockData`를 DB 조회 + 파생값 계산으로 교체. **반환 타입 `StockData` 불변** → 화면 무수정.

- `src/data/loader.ts` — `async getStockData(code): Promise<StockData>`:
  - `quote`: `fundamental` + `price_daily` 최신 2행(현재가·전일대비·등락률 파생) + `stock.name` + `dividend`/`price_daily`(배당수익률 파생).
  - `chart`: `price_daily`(CANDLESTICK/TECHNICAL 계산) + `investor_trend_daily`(SUPPLY_DEMAND/NET_BUY 파생) + `program_trade_daily`(PROGRAM_TRADE).
  - `fin`: `financial_ratio`/`income_statement`/`dividend`(배당성향 파생).
  - `rep`: `invest_opinion`(opinion/targetPrice/publishDate) + `stock.industry`. `nextUpdateDate`=발간일+주기, `legalNotice`=정적 상수. 미렌더 산문 필드는 목값 유지 or 빈값(§1-2).
- `src/data/derive.ts` — 파생값 유틸(db-schema §파생값 표 전량: 현재가/등락률/배당수익률/배당성향/기술적지표/누적수급/대표의견).
- `src/data/market-indices.ts` — `market_index` 조회로 교체(seededRng 제거).
- `src/data/registry.ts` — `STOCK_LIST`/`REPORT_CARDS`를 `stock`(+`top_view`) 조회로. `MarketIndexCards`의 "실시간" 배지 제거(INGESTION §4 확정).
- page.tsx 2곳: `getStockData(code)` → `await getStockData(code)`.

**파생값 매핑 표 (db-schema §파생값 → StockData 필드)**
| StockData 필드 | 계산 | 원천 |
|---|---|---|
| `quote.currentPrice` | 최신 `close` | price_daily |
| `quote.change/changeRate` | 최신 2행 close 차 | price_daily |
| `quote.dividendYield` | 최근1년 per_share 합 ÷ close | dividend+price_daily |
| `chart.TECHNICAL_INDICATORS` | RSI/MACD/볼린저/이평 | price_daily |
| `chart.SUPPLY_DEMAND` | 일별 순매수(누적차트는 누적합) | investor_trend_daily |
| `fin.DIVIDEND_INFO.payout` | 연 per_share 합 ÷ eps | dividend+financial_ratio |
| `rep`(대표의견/목표가) | 최신 opinion_date 행 | invest_opinion |

**검증**: 4종목(005930/000660/035420/012450) 페이지가 DB값으로 렌더, 목값과 형식 일치. `npm run build` 통과.

---

## 9. Phase 6 — 초기 백필 & 최종 검증

- **`price_daily` 1년 백필**(db-schema 검증4): 종목당 ~3콜 1회성 배치 스크립트(`scripts/backfill-price.ts`). 차트·52주 참고용.
- **재무 백필**: `income_statement`/`financial_ratio` 초기 수집(연간+분기).
- **db-schema 검증항목 5개** 실측 체크리스트로 소화:
  1. 18시 일봉에 당일 행 포함?
  2. `invest_opinion` 두 API 중복? → `opinion_sec` 유지/제거
  3. 투자자동향 금액 필드 실값?
  4. 백필 절차 확립
  5. `stac_yymm` 정렬(최신순 보장 안 될 수 있음 → 매퍼에서 정렬)

---

## 10. 리스크 / 매핑 갭

| 갭 | 내용 | 대응 |
|---|---|---|
| 투자자 금액 | 실측 공란 이력(SPEC_TEST) | 검증3 |
| `market_index.sparkline` | 표시용 배열 생성 방식 | indices 수집 시 최근 N일 close로 구성 |
| `stac_yymm` 정렬 | API 최신순 미보장 | 매퍼 정렬 |
| 리포트 산문(미렌더) | 신청 후 전문 리포트 본문 | 스키마 밖(편집/CMS). 현 화면 불필요 |

> **해소됨**: 프로그램매매 차익/비차익(순매수 합계로 통일, 코드 반영), `beta1Y`(제거), 리포트/기업개요 렌더값(KIS `invest_opinion`+`stock.industry`로 충족).

---

## 11. 신규/변경 파일 요약

**신규**
- `supabase/migrations/0001_init.sql`
- `src/lib/db/server.ts`
- `src/lib/kis/{token,client,rate-limit}.ts`, `src/lib/kis/datasets/*.ts`
- `src/lib/ingest/{lock,cursor,pump}.ts`
- `src/app/api/cron/ingest/route.ts`
- `src/data/derive.ts`
- `vercel.json`
- `scripts/seed-stock.ts`, `scripts/backfill-price.ts`

**변경**
- `src/data/loader.ts`(비동기 DB), `market-indices.ts`, `registry.ts`
- `src/app/stock/[code]/page.tsx`, `src/app/report/[code]/page.tsx`(`await`)
- `src/components/landing/MarketIndexCards.tsx`("실시간" 배지 제거)
- `.env`(SUPABASE_*, CRON_SECRET)
- `package.json`(`@supabase/supabase-js`)

**불변**: `src/data/types.ts`, `StockDataContext.tsx`, 화면 컴포넌트 대부분.

---

## 12. 권장 진행 순서

Phase 0 → 1(시드) → 2(KIS TS) → 3(단일종목 dataset 검증) → 6 검증항목 실측 → 4(cron 펌프) → 5(읽기 교체) → 6(백필). 각 Phase 끝에 검증 게이트 통과 후 다음으로.
