-- 0003_report_request.sql — 리포트 신청 고객 정보 적재
-- 접근 제어: 서버 서비스롤 전용. RLS 미사용(v1, 0001·0002와 동일).
-- 리드 데이터는 기존 Google Sheet와 병행 저장(시트는 유지).

create table if not exists report_request (
  id           bigserial   primary key,
  name         text        not null,              -- 신청자 이름
  phone        text        not null,              -- 연락처 (숫자만, 10~11자리)
  stock        text,                              -- 관심 종목 (미입력 시 null)
  requested_at timestamptz not null default now(),-- 신청 시각
  created_at   timestamptz not null default now()
);

-- 최근 신청 조회용
create index if not exists report_request_requested_at_idx
  on report_request (requested_at desc);
