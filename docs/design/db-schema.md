# 데이터베이스 스키마 설계

## **테이블 구조**

### **수집 인프라**

```sql
-- 토큰 캐시 (단일 행). cron 청크 간 재사용 → 발급 "1분당 1회" 제한 회피.
create table kis_token (
  id           smallint primary key default 1 check (id = 1),
  access_token text        not null,
  token_type   text        not null default 'Bearer',
  expires_at   timestamptz not null,
  updated_at   timestamptz not null default now()
);

-- 수집 진행상태(재개 커서) + 가용성 표시.
create table ingest_state (
  code       text        not null,          -- 종목코드. 시장전역은 '_MARKET_'
  dataset    text        not null,          -- KIS_INGESTION.md §2 데이터셋 키
  status     text        not null default 'ok',  -- 'ok' | 'unavailable' | 'error'
  fetched_at timestamptz not null default now(),
  error      text,
  primary key (code, dataset)
);
create index on ingest_state (dataset, fetched_at);

-- 리스 락 (cron 겹침 방지, 크래시 내성).
create table cron_lock (
  name       text        primary key,
  owner      text,
  expires_at timestamptz not null
);
```

### **종목 디멘션**

```sql
-- 종목 마스터 + 정적 속성. 이름·유니버스·보통주 판별의 단일 출처.
-- 시드: 종목마스터 스냅샷(~4,374). industry는 야간 수집 시 갱신.
create table stock (
  code       text    primary key,           -- 단축코드 6자리
  name       text    not null,
  group_code text    not null,              -- 'ST'(주권) 'EF'(ETF) 'EN'(ETN) ...
  market     char(1) not null,              -- 'K'(KOSPI) | 'Q'(KOSDAQ)
  industry   text,                          -- 업종명 (inquire-price bstp_kor_isnm)
  is_common  boolean generated always as (group_code = 'ST' and right(code, 1) = '0') stored
);
create index on stock (group_code);          -- cron 유니버스(ST) 조회용
```

### **시장 단위**

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

-- 조회상위 → 보통주(is_common) 필터 후 상위 N. 종목명은 stock 조인.
-- 갱신 시 전체 삭제 후 재삽입(트랜잭션)으로 원자 교체.
create table top_view (
  rank       int  primary key,
  code       text not null references stock(code),
  fetched_at timestamptz not null default now()
);
```

### **일별 팩트 (`_daily`)**

```sql
-- 일봉 OHLCV + 거래활동. 무한 누적. "현재가" = 최신 행의 close.
create table price_daily (
  code          text   not null references stock(code),
  date          date   not null,
  open          bigint, high bigint, low bigint, close bigint,
  volume        bigint,                      -- acml_vol
  trading_value bigint,                      -- acml_tr_pbmn (거래대금)
  primary key (code, date)
);

-- 투자자별 순매수 (수량 + 금액).
create table investor_trend_daily (
  code                   text not null references stock(code),
  date                   date not null,
  individual_net         bigint,            -- prsn_ntby_qty
  foreign_net            bigint,            -- frgn_ntby_qty
  institution_net        bigint,            -- orgn_ntby_qty
  individual_net_amount  bigint,            -- prsn_ntby_tr_pbmn
  foreign_net_amount     bigint,            -- frgn_ntby_tr_pbmn
  institution_net_amount bigint,            -- orgn_ntby_tr_pbmn
  primary key (code, date)
);

-- 프로그램매매 (종목별은 전체 순매수 합계만 제공 — 차익/비차익 분리 없음).
create table program_trade_daily (
  code       text   not null references stock(code),
  date       date   not null,
  net_qty    bigint,                         -- whol_smtn_ntby_qty
  net_amount bigint,                         -- whol_smtn_ntby_tr_pbmn (공식 예제로 존재 확인)
  primary key (code, date)
);
```

### **종목 지표 스냅샷**

```sql
-- inquire-price 지표군 스냅샷 (밸류에이션·주당지표·52주·보유율). 종목당 1행, 야간 upsert.
-- 당일 가격/거래는 price_daily로 일원화되어 여기 없음.
create table fundamental (
  code              text primary key references stock(code),
  market_cap        bigint,                  -- hts_avls (KIS 원값; 정규화는 매핑층)
  per numeric, pbr numeric, eps numeric, bps numeric,
  week52_high       bigint,                  -- w52_hgpr (일봉 백필 한계로 API값 저장)
  week52_low        bigint,                  -- w52_lwpr
  foreign_ownership numeric,                 -- hts_frgn_ehrt
  as_of             timestamptz not null     -- 수집 기준시각(장마감)
);
```

### **기간 팩트 (재무)**

```sql
-- 손익계산서 (연간/분기). eps 없음 — 실측상 응답에 미포함(재무비율 소속).
create table income_statement (
  code             text    not null references stock(code),
  period_type      char(1) not null,         -- 'A' 연간 | 'Q' 분기 (FID_DIV_CLS_CODE 0/1)
  period           text    not null,         -- stac_yymm 'YYYYMM'
  revenue          bigint,                   -- sale_account
  operating_profit bigint,                   -- bsop_prti
  net_profit       bigint,                   -- thtr_ntin
  primary key (code, period_type, period)
);

-- 재무비율 (연간만 수집: FID_DIV_CLS_CODE=0).
create table financial_ratio (
  code       text not null references stock(code),
  period     text not null,                  -- stac_yymm
  roe        numeric,                        -- roe_val
  eps        numeric,
  bps        numeric,
  debt_ratio numeric,                        -- lblt_rate
  primary key (code, period)
);

-- 예탁원 배당 이벤트. 분기/중간배당 대응 위해 기준일 단위.
create table dividend (
  code      text    not null references stock(code),
  base_date date    not null,                -- 배당 기준일
  per_share numeric not null,                -- per_sto_divi_amt (주당배당금)
  pay_date  date,                            -- 지급일
  primary key (code, base_date)
);
```

### **이벤트**

```sql
-- 종목 뉴스. 재수집 중복은 unique로 흡수.
create table news (
  id           bigserial primary key,
  code         text not null references stock(code),
  title        text not null,                -- hts_pbnt_titl_cntt
  source       text,                          -- dorg
  published_at timestamptz,                   -- data_dt + data_tm
  unique (code, published_at, title)
);
create index on news (code, published_at desc);

-- 투자의견 이벤트 (증권사 × 발표일). 두 API(투자의견·증권사별)가 같은 테이블에 upsert — PK로 중복 흡수.
-- "대표 의견"·"최신 목표주가"는 저장하지 않고 최신 행에서 파생.
create table invest_opinion (
  code         text   not null references stock(code),
  opinion_date date   not null,               -- 발표일
  firm         text   not null,               -- mbcr_name
  opinion      text,                          -- invt_opnn (매수/중립/매도)
  target_price bigint,                        -- hts_goal_prc
  gap_rate     numeric,                       -- dprt (괴리율)
  primary key (code, opinion_date, firm)
);
create index on invest_opinion (code, opinion_date desc);
```

### **접근 제어 (v1 유지 — RLS 미사용)**

- DB 접근은 서버 코드에서 서비스롤(또는 서버 전용 커넥션)로만. 자격증명 `NEXT_PUBLIC_` 금지.
- `kis_token`은 시크릿 — 클라이언트로 절대 내보내지 않는다.

---

## **테이블 ↔ 수집 API 매핑**

| 테이블 | 원천 API (tr_id) | 콜/종목 | 비고 |
| --- | --- | --- | --- |
| `stock` | 종목마스터 파일(시드) + 현재가 `FHKST01010100`(industry 갱신) | 0* | *현재가 콜에 편승 |
| `fundamental` | 현재가 `FHKST01010100` | 1 | 같은 콜이 stock.industry도 갱신 |
| `price_daily` | 기간별시세 `FHKST03010100` | 1 | 초기 백필 1년 ≈ 3콜(1회성, 콜당 최대 ~100행), 이후 증분 1콜 |
| `investor_trend_daily` | 투자자동향 `FHKST01010900` | 1 | 수량+금액 동일 응답 |
| `news` | 뉴스 `FHKST01011800` | 1 |  |
| `income_statement` | 손익계산서 `FHKST66430200` | 2 | 연간(0)+분기(1) |
| `financial_ratio` | 재무비율 `FHKST66430300` | 1 | 연간만(FID_DIV_CLS_CODE=0) |
| `dividend` | 예탁원 배당 `HHKDB669102C0` | 1 |  |
| `program_trade_daily` | 프로그램매매 `FHPPG04650201` | 1 | 전체 순매수만 |
| `invest_opinion` | 투자의견 `FHKST663300C0` + 증권사별 `FHKST663400C0` | 2→1? | 응답 중복이면 by-sec 콜 제거(§6) |
| `market_index` | 국내지수 `FHPUP02100000` ×2 + 해외지수 `FHKST03030100` ×2 | 시장 4 |  |
| `top_view` | HTS조회상위 `HHMCM000100C0` | 시장 1 | `custtype:P` 헤더 |

**종목당 11콜** (opinion 중복 확인 시 10콜) — [KIS_INGESTION.md](https://file+.vscode-resource.vscode-cdn.net/c%3A/D/SI/plan-landing/plan-landing/docs/design/KIS_INGESTION.md)의 배치 산정과 일치.

## **파생값 (저장하지 않고 읽기 시 계산)**

| 값 | 계산 | 원천 테이블 |
| --- | --- | --- |
| 현재가 | 최신 행 `close` | `price_daily` |
| 전일대비·등락률 | 최신 2행 `close` 차이 | `price_daily` |
| 배당수익률 | 최근 1년 `per_share` 합 ÷ 최신 `close` | `dividend` + `price_daily` |
| 배당성향 | 연간 `per_share` 합 ÷ `eps` | `dividend` + `financial_ratio` |
| 연간 배당 히스토리 | `base_date` 연도별 `per_share` 합계 | `dividend` |
| 대표 투자의견·목표주가 | 최신 `opinion_date` 행 | `invest_opinion` |
| 증권사별 의견 리스트 | 증권사별 최신 행 | `invest_opinion` |
| 기술적 지표(RSI/MACD/볼린저/이평) | OHLCV 계산 | `price_daily` |
| 누적 수급 차트 | 일별 순매수 누적합 | `investor_trend_daily` |

## **구현 시 검증 항목**

1. **장마감 후 일봉에 당일 행 포함 여부** — 18시 수집 시 `FHKST03010100` 응답에 당일 캔들이 있는지 (없으면 "현재가=최신 close" 전제가 전일이 됨).
2. **`invest_opinion` 두 API 응답 중복 여부** — `FHKST663400C0`(증권사별)가 `FHKST663300C0`와 사실상 같으면 콜 제거(11→10콜/종목).
3. **투자자동향 금액 필드 실값** — 실측 샘플에서 값이 공란이었음([SPEC_TEST](https://file+.vscode-resource.vscode-cdn.net/c%3A/D/SI/plan-landing/plan-landing/docs/reference/KIS_API_SPEC_TEST.md)). 채워지는지 확인.
4. **`price_daily` 초기 백필** — 1년치(차트·52주 참고용) 확보 절차. 콜당 ~100행 제한으로 종목당 ~3콜 1회성 배치.
5. **재무 API `stac_yymm` 정렬** — 응답이 최신순 보장 안 될 수 있음.