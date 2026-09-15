-- 0011_admin_auth.sql — 관리자 계정("user")·세션(user_session) (자체 세션 인증)
-- 접근 제어: 서버 서비스롤 전용. RLS 미사용(v1, 0001과 동일).
-- 인가 판정은 앱 서버 requireAdmin() 한 곳에서만 수행한다.
-- 삭제는 hard delete — 삭제 시 user_session은 FK cascade로 함께 제거된다.
-- 주의: user는 Postgres 예약어라 DDL에서는 "user"로 따옴표 필요. supabase-js 호출은 그대로 'user'.

create table if not exists "user" (
  id                       bigserial primary key,
  email                    text not null unique,
  name                     text,
  password_hash            text not null,              -- scrypt: N$r$p$salt$hash (평문·가역 저장 금지)
  must_change_password     boolean not null default true,
  temp_password_expires_at timestamptz,                -- 임시 비밀번호 만료(발급 + 7일). 만료 판정용이라 timestamptz
  fail_count               smallint not null default 0,-- 로그인 실패 횟수 (5회 → 잠금)
  locked_until             timestamptz,                -- 잠금 해제 시각 (10분)
  last_login_at            timestamp,                  -- KST 벽시계 (report_request와 동일 규칙)
  created_at               timestamp not null default (now() at time zone 'Asia/Seoul')
);

create table if not exists user_session (
  token_hash text        primary key,                  -- 랜덤 32B 토큰의 sha256. 원문은 쿠키에만 존재
  user_id    bigint      not null references "user"(id) on delete cascade,
  expires_at timestamptz not null,                     -- 순수 만료 판정용이라 timestamptz
  created_at timestamp   not null default (now() at time zone 'Asia/Seoul')
);
create index if not exists user_session_user_idx on user_session (user_id);
