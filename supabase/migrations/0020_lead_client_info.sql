-- 0020_lead_client_info.sql - 신청 시 클라이언트 IP / User-Agent 기록
-- report_request, income_request 공통. 기존 행은 값이 없으므로 nullable.
--   - ip_address : x-forwarded-for 첫 번째 값(없으면 x-real-ip). 헤더 위조 가능성이 있어 inet 대신 text.
--   - user_agent : 요청 User-Agent 헤더(최대 500자로 잘라 저장)

alter table report_request
  add column if not exists ip_address text,
  add column if not exists user_agent text;

alter table income_request
  add column if not exists ip_address text,
  add column if not exists user_agent text;
