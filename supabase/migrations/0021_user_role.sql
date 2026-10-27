-- 0021_user_role.sql - 관리자 계정 역할(role) 구분: admin | member
--   - admin  : 전체 기능 (고객 신청(리드) 조회, 관리자 계정 관리 포함)
--   - member : 콘텐츠 관리만. 고객 신청(개인정보)·관리자 계정 관리 접근 불가
-- 기존 계정은 지금까지 전체 기능을 써 왔으므로 admin으로 채우고, 이후 기본값은 최소 권한인 member.
-- SQL로 첫 계정을 직접 넣을 때는 role = 'admin'을 명시해야 관리자 관리 화면에 들어갈 수 있다.
-- 인가 판정은 앱 서버 lib/admin/session.ts(can) 한 곳에서만 수행한다 (RLS 미사용, 0011과 동일).

alter table "user"
  add column if not exists role text not null default 'admin'
    constraint user_role_check check (role in ('admin', 'member'));

alter table "user" alter column role set default 'member';
