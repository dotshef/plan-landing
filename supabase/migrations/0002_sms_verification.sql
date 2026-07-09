-- 0002_sms_verification.sql — 휴대폰 SMS 인증 (알리고)
-- 접근 제어: 서버 서비스롤 전용. RLS 미사용(v1, 0001과 동일).
-- 인증번호는 평문 저장 금지 — HMAC 해시만 저장.

create table if not exists phone_verification (
  id          bigserial   primary key,
  phone       text        not null,              -- 수신 번호 (숫자만, 10~11자리)
  code_hash   text        not null,              -- 인증번호 HMAC 해시 (평문 저장 금지)
  expires_at  timestamptz not null,              -- 발송 시각 + 3분
  attempts    smallint    not null default 0,    -- 검증 실패 횟수 (서버 권위)
  verified_at timestamptz,                        -- 검증 성공 시각 (null = 미인증)
  created_at  timestamptz not null default now()
);

-- 최신 인증행 조회 + 번호별 발송 rate-limit 카운트 겸용
create index if not exists phone_verification_phone_created_idx
  on phone_verification (phone, created_at desc);
