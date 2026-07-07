-- 0001_init.sql — 초기 스키마 (docs/design/db-schema.md 기준)
-- 데이터 흐름: KIS → 야간 Vercel Cron → Supabase → 클라이언트(항상 DB만 읽음)
-- 접근 제어: 서버 서비스롤 전용. RLS 미사용(v1). kis_token은 시크릿.

-- ─── 수집 인프라 ────────────────────────────────────────────────────────────

-- 토큰 캐시 (단일 행). cron 청크 간 재사용 → 발급 "1분당 1회" 제한 회피.
create table if not exists kis_token (
  id           smallint primary key default 1 check (id = 1),
  access_token text        not null,
  token_type   text        not null default 'Bearer',
  expires_at   timestamptz not null,
  updated_at   timestamptz not null default now()
);

-- 수집 진행상태(재개 커서) + 가용성 표시.
create table if not exists ingest_state (
  code       text        not null,          -- 종목코드. 시장전역은 '_MARKET_'
  dataset    text        not null,          -- KIS_INGESTION.md §2 데이터셋 키
  status     text        not null default 'ok',  -- 'ok' | 'unavailable' | 'error'
  fetched_at timestamptz not null default now(),
  error      text,
  primary key (code, dataset)
);
create index if not exists ingest_state_dataset_fetched_idx on ingest_state (dataset, fetched_at);

-- 리스 락 (cron 겹침 방지, 크래시 내성).
create table if not exists cron_lock (
  name       text        primary key,
  owner      text,
  expires_at timestamptz not null
);

-- ─── 종목 디멘션 ────────────────────────────────────────────────────────────

-- 종목 마스터 + 정적 속성. 이름·유니버스·보통주 판별의 단일 출처.
-- 시드: 종목마스터 스냅샷(~4,374). industry는 야간 수집 시 갱신.
create table if not exists stock (
  code       text    primary key,           -- 단축코드 6자리
  name       text    not null,
  group_code text    not null,              -- 'ST'(주권) 'EF'(ETF) 'EN'(ETN) ...
  market     char(1) not null,              -- 'K'(KOSPI) | 'Q'(KOSDAQ)
  industry   text,                          -- 업종명 (inquire-price bstp_kor_isnm)
  is_common  boolean generated always as (group_code = 'ST' and right(code, 1) = '0') stored
);
create index if not exists stock_group_code_idx on stock (group_code);  -- cron 유니버스(ST) 조회용

-- ─── 시장 단위 ──────────────────────────────────────────────────────────────

create table if not exists market_index (
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
create table if not exists top_view (
  rank       int  primary key,
  code       text not null references stock(code),
  fetched_at timestamptz not null default now()
);

-- ─── 일별 팩트 (_daily) ─────────────────────────────────────────────────────

-- 일봉 OHLCV + 거래활동. 무한 누적. "현재가" = 최신 행의 close.
create table if not exists price_daily (
  code          text   not null references stock(code),
  date          date   not null,
  open          bigint, high bigint, low bigint, close bigint,
  volume        bigint,                      -- acml_vol
  trading_value bigint,                      -- acml_tr_pbmn (거래대금)
  primary key (code, date)
);

-- 투자자별 순매수 (수량 + 금액).
create table if not exists investor_trend_daily (
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
create table if not exists program_trade_daily (
  code       text   not null references stock(code),
  date       date   not null,
  net_qty    bigint,                         -- whol_smtn_ntby_qty
  net_amount bigint,                         -- whol_smtn_ntby_tr_pbmn
  primary key (code, date)
);

-- ─── 종목 지표 스냅샷 ───────────────────────────────────────────────────────

-- inquire-price 지표군 스냅샷 (밸류에이션·주당지표·52주·보유율). 종목당 1행, 야간 upsert.
create table if not exists fundamental (
  code              text primary key references stock(code),
  market_cap        bigint,                  -- hts_avls (KIS 원값; 정규화는 매핑층)
  per numeric, pbr numeric, eps numeric, bps numeric,
  week52_high       bigint,                  -- w52_hgpr
  week52_low        bigint,                  -- w52_lwpr
  foreign_ownership numeric,                 -- hts_frgn_ehrt
  as_of             timestamptz not null     -- 수집 기준시각(장마감)
);

-- ─── 기간 팩트 (재무) ───────────────────────────────────────────────────────

-- 손익계산서 (연간/분기). eps 없음 — 실측상 응답에 미포함(재무비율 소속).
create table if not exists income_statement (
  code             text    not null references stock(code),
  period_type      char(1) not null,         -- 'A' 연간 | 'Q' 분기 (FID_DIV_CLS_CODE 0/1)
  period           text    not null,         -- stac_yymm 'YYYYMM'
  revenue          bigint,                   -- sale_account
  operating_profit bigint,                   -- bsop_prti
  net_profit       bigint,                   -- thtr_ntin
  primary key (code, period_type, period)
);

-- 재무비율 (연간만 수집: FID_DIV_CLS_CODE=0).
create table if not exists financial_ratio (
  code       text not null references stock(code),
  period     text not null,                  -- stac_yymm
  roe        numeric,                        -- roe_val
  eps        numeric,
  bps        numeric,
  debt_ratio numeric,                        -- lblt_rate
  primary key (code, period)
);

-- 예탁원 배당 이벤트. 분기/중간배당 대응 위해 기준일 단위.
create table if not exists dividend (
  code      text    not null references stock(code),
  base_date date    not null,                -- 배당 기준일
  per_share numeric not null,                -- per_sto_divi_amt (주당배당금)
  pay_date  date,                            -- 지급일
  primary key (code, base_date)
);

-- ─── 이벤트 ─────────────────────────────────────────────────────────────────

-- 종목 뉴스. 재수집 중복은 unique로 흡수.
create table if not exists news (
  id           bigserial primary key,
  code         text not null references stock(code),
  title        text not null,                -- hts_pbnt_titl_cntt
  source       text,                          -- dorg
  published_at timestamptz,                   -- data_dt + data_tm
  unique (code, published_at, title)
);
create index if not exists news_code_published_idx on news (code, published_at desc);

-- 투자의견 이벤트 (증권사 × 발표일). 두 API가 같은 테이블에 upsert — PK로 중복 흡수.
create table if not exists invest_opinion (
  code         text   not null references stock(code),
  opinion_date date   not null,               -- 발표일
  firm         text   not null,               -- mbcr_name
  opinion      text,                          -- invt_opnn (매수/중립/매도)
  target_price bigint,                        -- hts_goal_prc
  gap_rate     numeric,                       -- dprt (괴리율)
  primary key (code, opinion_date, firm)
);
create index if not exists invest_opinion_code_date_idx on invest_opinion (code, opinion_date desc);
