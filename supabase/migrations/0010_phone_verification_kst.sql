-- phone_verification.created_at / verified_at을 KST(Asia/Seoul) 벽시계로 저장하도록 변경
-- Supabase 테이블 에디터에서 서울 시각이 그대로 표시되도록 timestamptz → timestamp(tz 없음) 전환.
-- 기존 UTC 값은 at time zone 'Asia/Seoul'로 KST 벽시계로 변환.
-- expires_at은 Date.now()와만 비교하는 순수 만료 판정용이라 timestamptz 유지.

-- 기존 default(now(), timestamptz)를 먼저 제거해야 타입 변경 충돌이 없음
alter table phone_verification
  alter column created_at drop default;

alter table phone_verification
  alter column created_at type timestamp
    using (created_at at time zone 'Asia/Seoul'),
  alter column verified_at type timestamp
    using (verified_at at time zone 'Asia/Seoul');

-- 신규 행은 KST 벽시계로 기본값 지정
alter table phone_verification
  alter column created_at set default (now() at time zone 'Asia/Seoul');

-- 인증 요청자 이름 수집 (기존 행은 값 없음 → nullable)
alter table phone_verification
  add column if not exists name text;
