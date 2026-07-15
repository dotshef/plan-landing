-- 최근 2개월 내 동일 이름/연락처 접수 이력 조회 최적화
create index if not exists report_request_name_phone_requested_at_idx
  on report_request (name, phone, requested_at desc);
