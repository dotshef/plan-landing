-- report_request 시각 컬럼을 KST(Asia/Seoul) 벽시계로 저장하도록 변경
-- Supabase 테이블 에디터에서 서울 시각이 그대로 표시되도록 timestamptz → timestamp(tz 없음) 전환.
-- 기존 UTC 값은 at time zone 'Asia/Seoul'로 KST 벽시계로 변환.

-- 기존 default(now(), timestamptz)를 먼저 제거해야 타입 변경 충돌이 없음
alter table report_request
  alter column requested_at drop default,
  alter column created_at drop default;

alter table report_request
  alter column requested_at type timestamp
    using (requested_at at time zone 'Asia/Seoul'),
  alter column created_at type timestamp
    using (created_at at time zone 'Asia/Seoul');

-- 신규 행은 KST 벽시계로 기본값 지정
alter table report_request
  alter column requested_at set default (now() at time zone 'Asia/Seoul'),
  alter column created_at set default (now() at time zone 'Asia/Seoul');
