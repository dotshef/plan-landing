-- 0014_report_request_source.sql — 신청 폼 출처 구분
-- 신규 3개 페이지(추천주 7일 체험·영상 속 자료 받기·4분기 섹터)도 기존 리드 플로우를
-- 그대로 쓰되, 어느 페이지에서 무엇을 요청했는지 구분한다.

alter table report_request
  add column if not exists source_page text not null default 'main',
  add column if not exists requested_items text;       -- '영상 속 자료 받기'에서 선택한 자료명(쉼표 구분)

alter table report_request
  drop constraint if exists report_request_source_page_check;

alter table report_request
  add constraint report_request_source_page_check
  check (source_page in ('main', 'trial', 'indicators', 'sector'));
