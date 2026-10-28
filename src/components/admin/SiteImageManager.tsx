'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'

import AdminModal, { ModalBody, ModalFooter } from './AdminModal'
import ImagePicker from './ImagePicker'
import { Toast, useToast } from './Toast'
import { btnStyle, card, errorBox, pageDesc, pageTitle } from './ui'

interface Slot {
  key: string
  label: string
  page: string
  href: string
  image_url: string
  alt: string
  width: number
  height: number
  updated_at: string | null
}

function SlotFormModal({ target, onClose, onSaved }: {
  target: Slot | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!target || !file || busy) return
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.set('file', file)
      const res = await fetch(`/api/admin/site-images/${target.key}`, { method: 'PATCH', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? '교체에 실패했습니다.'); return }
      onSaved(`${target.page}에 새 이미지가 즉시 반영됩니다.`)
      onClose()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminModal open={target !== null} title={target ? `${target.label} 이미지 교체` : ''} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ModalBody>
          <ImagePicker
            label="이미지" currentUrl={target?.image_url ?? null} file={file}
            onChange={setFile} onInvalid={setError} height={260}
          />
          {error && <div style={errorBox}>{error}</div>}
        </ModalBody>
        <ModalFooter onCancel={onClose} busy={busy} submitLabel="교체" canSubmit={Boolean(file)} />
      </form>
    </AdminModal>
  )
}

export default function SiteImageManager() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Slot | null>(null)
  const { toast, showToast } = useToast()

  const load = useCallback(async () => {
    // 최초 로딩 상태는 useState(true)가 담당 - 이펙트 내 동기 setState 회피
    try {
      const res = await fetch('/api/admin/site-images')
      const data = await res.json().catch(() => ({}))
      if (res.ok) setSlots(data.images ?? [])
      else showToast(false, data.error ?? '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { void load() }, [load])

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={pageTitle}>페이지 이미지 관리</h1>
        <p style={pageDesc}>
          페이지에 한 장씩 들어가는 고정 이미지입니다. 교체하면 해당 페이지에 즉시 반영됩니다.<br />
          이미지는 영역 폭에 맞춰 원본 비율 그대로 표시됩니다. 이미지만 교체되며 페이지 문구는 바뀌지 않습니다.
        </p>
      </div>

      {loading ? (
        <div style={{ ...card, textAlign: 'center', color: '#8B95A1' }}>불러오는 중…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {slots.map((slot) => (
            <div key={slot.key} style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#F8FAFC', borderBottom: '1px solid #F2F4F6' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slot.image_url} alt={slot.alt} style={{ display: 'block', width: '100%', height: 240, objectFit: 'contain' }} />
              </div>
              <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1B6CF2' }}>{slot.page}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#191F28' }}>{slot.label}</div>
                <div style={{ fontSize: 12, color: '#8B95A1' }}>
                  {slot.width}×{slot.height}px{slot.updated_at && ` · 최종 수정 ${slot.updated_at.slice(0, 16).replace('T', ' ')}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                <a href={slot.href} target="_blank" rel="noreferrer" style={{ ...btnStyle('ghost'), flex: 1, textDecoration: 'none' }}>
                  <ExternalLink size={14} /> 페이지에서 보기
                </a>
                <button type="button" onClick={() => setEditing(slot)} style={{ ...btnStyle('primary'), flex: 1 }}>
                  <RefreshCw size={14} /> 교체
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* key로 대상이 바뀔 때마다 폼 상태를 새로 만든다 */}
      <SlotFormModal
        key={editing?.key ?? 'closed'}
        target={editing}
        onClose={() => setEditing(null)}
        onSaved={(message) => { showToast(true, message); void load() }}
      />

      <Toast toast={toast} />
    </div>
  )
}
