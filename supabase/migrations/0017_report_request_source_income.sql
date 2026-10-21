-- 0017_report_request_source_income.sql — 신규 페이지 '두 번째 월급'(/income) 출처 추가
-- 기존 리드 플로우를 그대로 쓰되 source_page='income' 으로 구분한다.

alter table report_request
  drop constraint if exists report_request_source_page_check;

alter table report_request
  add constraint report_request_source_page_check
  check (source_page in ('main', 'trial', 'indicators', 'sector', 'income'));
