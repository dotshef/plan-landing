-- 0013_sector_report.sql — 4분기 섹터 보고서·섹터·종목
-- 접근 제어: 서버 서비스롤 전용. RLS 미사용(v1).
-- 지표 스냅샷은 "방문 사이트 반영" 시점에만 계산·확정된다(편집 중 퍼블릭 표시값 불변).

create table if not exists sector_report (
  id            bigserial primary key,
  year          int      not null,
  quarter       smallint not null check (quarter between 1 and 4),
  kospi_avg_per numeric,                               -- 관리자 수동 입력 (TTM 기준 공표값)
  status        text     not null default 'draft' check (status in ('draft', 'published')),
  base_date     date,                                  -- 계산 기준일(반영 시각의 KST 날짜)
  computed_at   timestamp,                             -- KST 벽시계
  published_at  timestamp,                             -- KST 벽시계
  created_at    timestamp not null default (now() at time zone 'Asia/Seoul'),
  unique (year, quarter)
);

create table if not exists sector (
  id         bigserial primary key,
  report_id  bigint not null references sector_report(id) on delete cascade,
  name       text   not null,                          -- 섹터 이름
  theme      text   not null,                          -- 섹터 주제
  sort_order int    not null default 0,
  -- 반영 시점에 확정되는 계산 스냅샷 (draft 상태에서는 전부 null)
  op_growth_rate            numeric,                   -- 영업이익 증가율 % (QoQ, 누적 차분 기반)
  sector_per                numeric,                   -- 업종 PER (TTM, 분기말 종가 ÷ TTM EPS 평균)
  trading_value_growth_rate numeric,                   -- 거래대금 증가율 %
  foreign_net_amount        numeric,                   -- 외국인 순매수 금액 합산(백만원 — KIS frgn_ntby_tr_pbmn 단위)
  op_trend                  jsonb,                     -- [{ "label": "3Q26", "value": 12345 }] 차트용
  unique (report_id, name)
);

create table if not exists sector_stock (
  sector_id  bigint not null references sector(id) on delete cascade,
  code       text   not null references stock(code),
  sort_order int    not null default 0,
  primary key (sector_id, code)
);
