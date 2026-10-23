// 관리자 화면 공통 인라인 스타일 (기존 UsersManager·TrialManager와 같은 톤)

export const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: 24, marginBottom: 20,
}

export const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 12px', border: '1.5px solid #E5E8EB', borderRadius: 10,
  fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#F8FAFC',
}

export const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4E5968', marginBottom: 6,
}

export const hintStyle: React.CSSProperties = { margin: '6px 0 0', fontSize: 12, color: '#8B95A1', lineHeight: 1.5 }

export const errorBox: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#FCEEED', color: '#E8342B',
}

export function btnStyle(kind: 'primary' | 'ghost' | 'danger', disabled = false): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 40, padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer', border: '1px solid transparent', whiteSpace: 'nowrap',
  }
  if (kind === 'primary') return { ...base, background: disabled ? '#B0B8C1' : '#1B6CF2', color: '#fff', border: 'none' }
  if (kind === 'danger') return { ...base, background: '#fff', color: '#E8342B', border: '1px solid #F3D2D0', opacity: disabled ? 0.5 : 1 }
  return { ...base, background: '#fff', color: '#4E5968', border: '1px solid #E5E8EB', opacity: disabled ? 0.5 : 1 }
}

/** 작은 아이콘 버튼(순서 이동·수정·삭제) */
export function iconBtnStyle(disabled = false, danger = false): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32,
    borderRadius: 8, border: `1px solid ${danger ? '#F3D2D0' : '#E5E8EB'}`, background: '#fff',
    color: danger ? '#E8342B' : '#4E5968', opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

export const pageTitle: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }
export const pageDesc: React.CSSProperties = { fontSize: 13.5, color: '#6B7684', margin: '6px 0 0', lineHeight: 1.6 }
