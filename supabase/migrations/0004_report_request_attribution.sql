-- 리포트 신청 시 광고 유입 매체와 네이버 광고 키워드 적재

alter table report_request
  add column if not exists traffic_source text not null default 'unknown',
  add column if not exists ad_keyword text;

alter table report_request
  drop constraint if exists report_request_traffic_source_check;

alter table report_request
  add constraint report_request_traffic_source_check
  check (traffic_source in ('google', 'naver', 'unknown'));
