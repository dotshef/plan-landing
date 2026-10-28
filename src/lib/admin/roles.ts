// 관리자 계정 역할 값·표시 이름 (서버·클라이언트 공용).
// 역할별 권한 판정(can)은 session.ts 한 곳에서만 한다 - 여기에 판정 로직을 두지 않는다.

export type AdminRole = 'admin' | 'member'
export const ADMIN_ROLES: readonly AdminRole[] = ['admin', 'member']

export const ROLE_LABEL: Record<AdminRole, string> = { admin: 'Admin', member: 'Member' }

/** 권한 단위. leads: 고객 신청(리드) 조회, users: 관리자 계정 관리(초대·역할 변경·삭제·비번 재발급) */
export type Permission = 'leads' | 'users'
export const PERMISSIONS: readonly Permission[] = ['leads', 'users']

export function isAdminRole(value: unknown): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole)
}
