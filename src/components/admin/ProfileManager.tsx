'use client'

import { useCallback, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { ROLE_LABEL, type AdminRole } from '@/lib/admin/roles'
import PasswordChangeModal from './PasswordChangeModal'
import { Toast, useToast } from './Toast'
import { btnStyle, card, hintStyle, inputStyle, labelStyle, pageDesc, pageTitle } from './ui'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #F2F4F6', fontSize: 14 }}>
      <div style={{ width: 110, flexShrink: 0, color: '#8B95A1', fontWeight: 600 }}>{label}</div>
      <div style={{ color: '#191F28', fontWeight: 700, wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}

export default function ProfileManager({ email, name: initialName, role, createdAt, lastLoginAt }: {
  email: string
  name: string | null
  role: AdminRole
  createdAt: string
  lastLoginAt: string | null
}) {
  const router = useRouter()
  const [saved, setSaved] = useState(initialName ?? '')
  const [name, setName] = useState(initialName ?? '')
  const [busy, setBusy] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  // PasswordChangeModal은 onClose가 바뀌면 폼을 초기화하므로 참조를 고정한다
  const closePassword = useCallback(() => setPasswordOpen(false), [])
  const { toast, showToast } = useToast()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { showToast(false, data.error ?? '저장에 실패했습니다.'); return }
      setSaved(data.name ?? '')
      setName(data.name ?? '')
      showToast(true, '내 정보를 저장했습니다.')
      router.refresh() // LNB 하단 이름 갱신
    } catch {
      showToast(false, '네트워크 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const dirty = name.trim() !== saved

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={pageTitle}>내 정보 관리</h1>
      <p style={{ ...pageDesc, marginBottom: 20 }}>로그인한 관리자 계정의 정보를 확인하고 수정합니다.</p>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>계정 정보</div>
        <InfoRow label="이메일" value={email} />
        <InfoRow label="역할" value={ROLE_LABEL[role]} />
        <InfoRow label="등록일" value={createdAt.slice(0, 10)} />
        <InfoRow label="마지막 로그인" value={lastLoginAt ? lastLoginAt.slice(0, 16).replace('T', ' ') : '-'} />

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <label htmlFor="me-name" style={labelStyle}>이름</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="me-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50}
              placeholder="홍길동" style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" disabled={busy || !dirty} style={{ ...btnStyle('primary', busy || !dirty), height: 44 }}>
              {busy ? '저장 중…' : '저장'}
            </button>
          </div>
          <p style={hintStyle}>관리자 목록과 왼쪽 메뉴 하단에 표시됩니다. 이메일(로그인 ID)은 변경할 수 없습니다.</p>
        </form>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>비밀번호</div>
            <p style={{ ...hintStyle, marginTop: 4 }}>변경하면 다른 기기의 로그인은 모두 해제됩니다.</p>
          </div>
          <button type="button" onClick={() => setPasswordOpen(true)} style={btnStyle('ghost')}>
            비밀번호 변경
          </button>
        </div>
      </div>

      <PasswordChangeModal open={passwordOpen} email={email} onClose={closePassword} />
      <Toast toast={toast} />
    </div>
  )
}
