'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'

import AdminModal, { ModalBody, ModalFooter } from './AdminModal'
import ImagePicker from './ImagePicker'
import { Toast, useToast } from './Toast'
import { btnStyle, card, errorBox, hintStyle, iconBtnStyle, inputStyle, labelStyle, pageDesc, pageTitle } from './ui'

interface Proof {
  id: number
  alt: string
  image_url: string
  sort_order: number
}

type Editing = Proof | 'new' | null

function ProofFormModal({ editing, onClose, onSaved }: {
  editing: Editing
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const target = editing && editing !== 'new' ? editing : null
  const [alt, setAlt] = useState(target?.alt ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.set('alt', alt)
      if (file) fd.set('file', file)
      const res = await fetch(target ? `/api/admin/main-proofs/${target.id}` : '/api/admin/main-proofs', {
        method: target ? 'PATCH' : 'POST',
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? '저장에 실패했습니다.'); return }
      onSaved(target ? '공증 자료를 수정했습니다.' : '공증 자료를 등록했습니다. 메인 페이지에 즉시 반영됩니다.')
      onClose()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminModal open={editing !== null} title={target ? '공증 자료 수정' : '공증 자료 추가'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ModalBody>
          <ImagePicker
            label="자료 이미지 (필수)" currentUrl={target?.image_url ?? null} file={file}
            onChange={setFile} onInvalid={setError} height={260}
          />
          <div>
            <label htmlFor="proof-alt" style={labelStyle}>자료 설명 (필수)</label>
            <input
              id="proof-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={100}
              placeholder="예: 2026년 7월 추천 종목 청산 수익률 사실확인서" style={inputStyle}
            />
            <p style={hintStyle}>이미지 대체 텍스트로 쓰입니다. 화면에는 보이지 않지만 검색·스크린리더에 노출됩니다.</p>
          </div>
          {error && <div style={errorBox}>{error}</div>}
        </ModalBody>
        <ModalFooter
          onCancel={onClose} busy={busy} submitLabel={target ? '저장' : '등록'}
          canSubmit={Boolean(alt.trim()) && (Boolean(target) || Boolean(file))}
        />
      </form>
    </AdminModal>
  )
}

export default function MainProofManager() {
  const [proofs, setProofs] = useState<Proof[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Editing>(null)
  const [reordering, setReordering] = useState(false)
  const { toast, showToast } = useToast()

  const load = useCallback(async () => {
    // 최초 로딩 상태는 useState(true)가 담당 - 이펙트 내 동기 setState 회피
    try {
      const res = await fetch('/api/admin/main-proofs')
      const data = await res.json().catch(() => ({}))
      if (res.ok) setProofs(data.proofs ?? [])
      else showToast(false, data.error ?? '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { void load() }, [load])

  async function move(index: number, delta: -1 | 1) {
    const to = index + delta
    if (to < 0 || to >= proofs.length || reordering) return
    const next = [...proofs]
    ;[next[index], next[to]] = [next[to], next[index]]
    setProofs(next) // 낙관적 반영 - 실패 시 다시 불러온다
    setReordering(true)
    try {
      const res = await fetch('/api/admin/main-proofs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((p) => p.id) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showToast(false, data.error ?? '순서 변경에 실패했습니다.')
        await load()
      }
    } finally {
      setReordering(false)
    }
  }

  async function handleDelete(proof: Proof) {
    if (!window.confirm(`'${proof.alt}' 자료를 삭제할까요?\n메인 페이지에서 즉시 사라지고 이미지 파일도 함께 삭제됩니다.`)) return
    const res = await fetch(`/api/admin/main-proofs/${proof.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) showToast(true, '삭제했습니다.')
    else showToast(false, data.error ?? '삭제에 실패했습니다.')
    await load()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={pageTitle}>공증 자료 관리</h1>
          <p style={pageDesc}>
            메인 페이지 &lsquo;말이 아닌 결과로 증명합니다&rsquo; 영역의 공증 자료입니다.<br />
            순서대로 홀수 번째는 왼쪽 열, 짝수 번째는 오른쪽 열에 놓입니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/" target="_blank" rel="noreferrer" style={{ ...btnStyle('ghost'), textDecoration: 'none' }}>
            <ExternalLink size={14} /> 메인에서 보기
          </a>
          <button type="button" onClick={() => setEditing('new')} style={btnStyle('primary')}>
            <Plus size={16} /> 자료 추가
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ ...card, textAlign: 'center', color: '#8B95A1' }}>불러오는 중…</div>
      ) : proofs.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#8B95A1' }}>
          등록된 공증 자료가 없습니다. 자료가 없으면 메인 페이지에서 자료 벽이 비어 보입니다.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {proofs.map((p, i) => (
            <div key={p.id} style={{ background: '#fff', border: '1px solid #EEF1F6', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', background: '#F8FAFC', borderBottom: '1px solid #F2F4F6' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt={p.alt} style={{ display: 'block', width: '100%', height: 240, objectFit: 'contain' }} />
                <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 6, background: 'rgba(17,24,39,.75)', color: '#fff', fontSize: 11.5, fontWeight: 700 }}>
                  {i + 1} · {i % 2 === 0 ? '왼쪽 열' : '오른쪽 열'}
                </span>
              </div>
              <div style={{ padding: '12px 14px', flex: 1, fontSize: 13, fontWeight: 600, color: '#333D4B', lineHeight: 1.5, wordBreak: 'keep-all' }}>
                {p.alt}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px 14px' }}>
                <button type="button" aria-label="앞으로" title="앞으로" disabled={i === 0 || reordering} onClick={() => void move(i, -1)} style={iconBtnStyle(i === 0 || reordering)}>
                  <ArrowLeft size={15} />
                </button>
                <button type="button" aria-label="뒤로" title="뒤로" disabled={i === proofs.length - 1 || reordering} onClick={() => void move(i, 1)} style={iconBtnStyle(i === proofs.length - 1 || reordering)}>
                  <ArrowRight size={15} />
                </button>
                <span style={{ flex: 1 }} />
                <button type="button" aria-label="수정" title="수정" onClick={() => setEditing(p)} style={iconBtnStyle()}>
                  <Pencil size={15} />
                </button>
                <button type="button" aria-label="삭제" title="삭제" onClick={() => void handleDelete(p)} style={iconBtnStyle(false, true)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* key로 대상이 바뀔 때마다 폼 상태를 새로 만든다 */}
      <ProofFormModal
        key={editing === null ? 'closed' : editing === 'new' ? 'new' : editing.id}
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={(message) => { showToast(true, message); void load() }}
      />

      <Toast toast={toast} />
    </div>
  )
}
