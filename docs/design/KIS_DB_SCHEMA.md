# KIS 연동 DB 스키마 (Supabase / Postgres)

KIS 실데이터 저장용 **DB 테이블 정의**. 수집 파이프라인·정책·운영(cron 등)은 [KIS_INGESTION.md](KIS_INGESTION.md) 참고.
API·화면 매핑은 [KIS_API_CALL_LIST.md](KIS_API_CALL_LIST.md), 실측 스펙은 [KIS_API_SPEC_TEST.md](KIS_API_SPEC_TEST.md).

---

## 1. 스키마 원칙

1. **시계열은 정규화 테이블**(`(code, date)` PK). jsonb blob 지양 — 증분 upsert·조회 유연. 단 sparkline 같은 순수 표시용 소배열만 jsonb.
2. **서버 전용 접근 (RLS 미사용).** DB는 서버(서비스롤 또는 직접 Postgres 커넥션)에서만 접근하고, **클라이언트 번들엔 DB 자격증명을 절대 싣지 않는다.** 특히 `kis_token`은 시크릿이므로 클라이언트 노출 금지. (anon 키 미노출이 전제이므로 RLS는 두지 않음.)

> `kis_token` · `ingest_state` · `cron_lock`은 수집 인프라 테이블 — 운영상 역할은 [KIS_INGESTION.md](KIS_INGESTION.md)에 상술.

---

## 2. 스키마 (DDL)

### 2.1 공용 (수집 인프라 · 종목 마스터)

```sql
-- 토큰 캐시 (단일 행). cron 청크 간 재사용 → 발급 "1분당 1회" 제한 회피.
create table kis_token (
  id           smallint primary key default 1 check (id = 1),
  access_token text        not null,
  token_type   text        not null default 'Bearer',
  expires_at   timestamptz not null,        -- 발급응답 expires_in 기준(≈24h)
  updated_at   timestamptz not null default now()
);

-- 수집 진행상태(재개 커서) + 가용성 표시.
create table ingest_state (
  code       text        not null,          -- 종목코드. 시장전역은 '_MARKET_'
  dataset    text        not null,          -- 데이터셋 키 (KIS_INGESTION.md §2)
  status     text        not null default 'ok',  -- 'ok' | 'unavailable' | 'error'
  fetched_at timestamptz not null default now(),
  error      text,
  primary key (code, dataset)
);
create index on ingest_state (dataset, fetched_at);   -- 커서: 오래된 것부터 선택

-- 리스 락 (cron 겹침 방지, 크래시 내성).
create table cron_lock (
  name       text        primary key,       -- 예: 'ingest'
  owner      text,                            -- 실행 runId
  expires_at timestamptz not null
);

-- 종목 마스터 (stock-master.ts 대체). 이름 해석·유니버스·보통주 판별의 단일 출처.
-- 전 종목(KOSPI+KOSDAQ ~4,374) 보관. 초기 시드는 기존 마스터 스냅샷에서.
create table stock_master (
  code       text    primary key,           -- 단축코드 6자리
  name       text    not null,
  group_code text    not null,              -- 'ST'(주권) 'EF'(ETF) 'EN'(ETN) ...
  market     char(1) not null,              -- 'K'(KOSPI) | 'Q'(KOSDAQ)
  is_common  boolean generated always as (group_code = 'ST' and right(code, 1) = '0') stored
);
create index on stock_master (is_common);   -- cron 유니버스 조회용
```

### 2.2 시장 단위 (랜딩)

```sql
create table market_index (
  symbol      text primary key,             -- '0001'KOSPI '1001'KOSDAQ 'COMP'NASDAQ 'SPX'S&P500
  name        text        not null,
  value       numeric     not null,
  change      numeric     not null,
  change_rate numeric     not null,
  is_rise     boolean,
  sparkline   jsonb,                         -- number[] (표시용)
  fetched_at  timestamptz not null default now()
);

-- 조회상위 → 보통주 필터 후 상위 N만 저장. 종목명은 stock_master 테이블에서 매핑(미저장).
-- 갱신 시 전체 삭제 후 재삽입(트랜잭션)으로 원자 교체.
create table top_view (
  rank       int  primary key,              -- 1..N
  code       text not null,
  market     text not null,                 -- 'K'|'Q'
  fetched_at timestamptz not null default now()
);
```

### 2.3 시세

```sql
create table stock_quote (
  code              text primary key,
  name              text,
  current_price     bigint,                  -- KRW
  change            bigint,
  change_rate       numeric,
  open              bigint, high bigint, low bigint,
  volume            bigint,                  -- 거래량
  trading_value     bigint,                  -- 거래대금
  market_cap        bigint,                  -- 시총(KIS hts_avls; 단위 정규화는 매핑층)
  per numeric, pbr numeric, eps numeric, bps numeric,
  dividend_yield    numeric,                 -- 배당 수집 후 역산(현재가+주당배당)
  week52_high       bigint, week52_low bigint,
  foreign_ownership numeric,                 -- 외국인보유율 hts_frgn_ehrt
  industry          text,                    -- 업종명 bstp_kor_isnm
  as_of             timestamptz              -- 표시용 기준시각(장마감 기준)
);

create table stock_daily (                   -- 일봉 OHLCV (무한 누적)
  code   text   not null,
  date   date   not null,
  open   bigint, high bigint, low bigint, close bigint,
  volume bigint,
  primary key (code, date)
);

create table investor_trend (               -- 투자자별 일별 순매수(수량 + 금액)
  code                   text not null,
  date                   date not null,
  individual_net         bigint,            -- prsn_ntby_qty (수량)
  foreign_net            bigint,            -- frgn_ntby_qty
  institution_net        bigint,            -- orgn_ntby_qty
  individual_net_amount  bigint,            -- prsn_ntby_tr_pbmn (금액, KRW)
  foreign_net_amount     bigint,            -- frgn_ntby_tr_pbmn
  institution_net_amount bigint,            -- orgn_ntby_tr_pbmn
  primary key (code, date)
);

create table stock_news (
  id           bigserial primary key,
  code         text not null,
  title        text not null,
  source       text,
  published_at timestamptz,
  fetched_at   timestamptz not null default now()
);
create index on stock_news (code, published_at desc);
```

### 2.4 재무·수급

```sql
create table income_statement (             -- 손익계산서(연간/분기)
  code             text    not null,
  period_type      char(1) not null,         -- 'A' 연간 | 'Q' 분기
  period           text    not null,         -- stac_yymm 'YYYYMM'
  revenue          bigint,
  operating_profit bigint,
  net_profit       bigint,
  eps              numeric,
  primary key (code, period_type, period)
);

create table financial_ratio (              -- ROE/BPS 등
  code       text not null,
  period     text not null,                  -- stac_yymm
  roe        numeric,
  bps        numeric,
  eps        numeric,
  debt_ratio numeric,
  primary key (code, period)
);

create table dividend (                      -- 예탁원 배당 히스토리
  code      text    not null,
  year      text    not null,                -- 'YYYY'
  per_share numeric,                          -- 주당배당금
  payout    numeric,                          -- 배당성향
  primary key (code, year)
);

create table program_trade (                 -- 프로그램매매 일별
  code          text   not null,
  date          date   not null,
  arbitrage     bigint,                       -- 차익
  non_arbitrage bigint,                       -- 비차익
  primary key (code, date)
);
```

### 2.5 리포트 (주권 전용)

```sql
create table invest_opinion (                -- 종목 대표/최신 투자의견
  code         text primary key,
  opinion      text,                          -- 매수/중립/매도
  target_price bigint,
  publish_date date,
  firm         text,                          -- 발행 증권사
  gap_rate     numeric                        -- 괴리율
);

create table invest_opinion_by_sec (         -- 증권사별 의견 리스트
  id           bigserial primary key,
  code         text not null,
  firm         text not null,
  opinion      text,
  target_price bigint,
  opinion_date date
);
create index on invest_opinion_by_sec (code, opinion_date desc);
```

### 2.6 접근 제어 (RLS 미사용)

RLS는 두지 않는다. 대신 **접근 경로 자체를 서버로 제한**한다:
- DB 접근은 **서버 코드에서 서비스롤(또는 서버 전용 Postgres 커넥션 문자열)** 로만.
- 서비스롤 키·커넥션 문자열은 서버 환경변수에만 두고 **클라이언트 번들에 절대 포함하지 않는다**(`NEXT_PUBLIC_` 금지). anon 키를 클라이언트에 노출하지 않는 것이 전제.
- `kis_token`은 시크릿 — 어떤 경우에도 클라이언트로 내보내지 않는다.

---

## 3. 읽기 경로 (요청 시)

요청 경로엔 신선도 판정도, KIS 호출도 없다. **repository는 최신 DB 행만 읽어 뷰모델로 변환**한다.

```
컴포넌트(서버 컴포넌트) → repository → Supabase select (최신 행) → 뷰모델
```

- 재무·리포트 화면에서 쓰는 PER/PBR/시총/현재가는 `stock_quote`에서 그대로 읽음(파생 필드는 현재가에 얹혀 옴). 모든 값이 동일한 장마감 스냅샷이라 신선도 계층 혼합 문제 없음.
- **종목명·시장·보통주 판별은 `stock_master` 테이블에서 읽는다.** 앱은 `stock-master.ts`에 의존하지 않음(예: top_view 카드 이름 = `top_view` ⨝ `stock_master`).

---

## 4. 스키마 관련 결정·미결

- **일봉 보관** — `stock_daily` **무한 누적**(정리 안 함).
- **투자자동향** — `investor_trend`에 **순매수 수량 + 금액** 모두 저장(같은 응답에 포함).
- **단위** — KIS 원값 저장 + 매핑층 정규화(시총 억원 등 원값 그대로 컬럼에).
- **종목 마스터 DB화** — `stock_master` 테이블이 `stock-master.ts`를 대체(이름·유니버스·보통주 판별의 단일 출처). 수집·시드 관점은 [KIS_INGESTION.md](KIS_INGESTION.md).
- **(미결) `stock_master` 재시드 절차** — 신규 상장/폐지 반영은 마스터 재시드 필요. 시드 출처·주기 확정.
