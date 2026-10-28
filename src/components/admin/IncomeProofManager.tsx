'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'

import AdminModal, { ModalBody, ModalFooter } from './AdminModal'
import ImagePicker from './ImagePicker'
import Select, { type SelectOption } from './Select'
import { Toast, useToast } from './Toast'
import { btnStyle, card, errorBox, hintStyle, iconBtnStyle, inputStyle, labelStyle, pageDesc, pageTitle } from './ui'

interface Review {
  id: number
  title: string
  tags: string[]
  job: string
  age_group: number
  member_months: number
  image_url: string
  sort_order: number
}

type Editing = Review | 'new' | null

// DB 체크 제약(10~90, 10 단위)과 동일
const AGE_OPTIONS: SelectOption[] = [10, 20, 30, 40, 50, 60, 70, 80, 90].map((a) => ({ value: String(a), label: `${a}대` }))

function ReviewFormModal({ editing, onClose, onSaved }: {
  editing: Editing
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const target = editing && editing !== 'new' ? editing : null
  const [title, setTitle] = useState(target?.title ?? '')
  const [tags, setTags] = useState(target?.tags.join(', ') ?? '')
  const [job, setJob] = useState(target?.job ?? '')
  const [ageGroup, setAgeGroup] = useState(String(target?.age_group ?? ''))
  const [memberMonths, setMemberMonths] = useState(String(target?.member_months ?? ''))
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
      fd.set('title', title)
      fd.set('tags', tags)
      fd.set('job', job)
      fd.set('ageGroup', ageGroup)
      fd.set('memberMonths', memberMonths)
      if (file) fd.set('file', file)
      const res = await fetch(target ? `/api/admin/income-proofs/${target.id}` : '/api/admin/income-proofs', {
        method: target ? 'PATCH' : 'POST',
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? '저장에 실패했습니다.'); return }
      onSaved(target ? '후기를 수정했습니다.' : '후기를 등록했습니다. 두 번째 월급 페이지에 즉시 반영됩니다.')
      onClose()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = Boolean(title.trim() && job.trim() && ageGroup && memberMonths) && (Boolean(target) || Boolean(file))

  return (
    <AdminModal open={editing !== null} title={target ? '후기 수정' : '후기 추가'} onClose={onClose} maxWidth={520}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ModalBody>
          <ImagePicker
            label="인증 이미지 (필수)" currentUrl={target?.image_url ?? null} file={file}
            onChange={setFile} onInvalid={setError} height={200}
          />
          <div>
            <label htmlFor="review-title" style={labelStyle}>카드 제목 (필수)</label>
            <textarea
              id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} rows={2} maxLength={40}
              placeholder={'내 이름으로 된\n첫 통장이 생겼다'}
              style={{ ...inputStyle, height: 'auto', padding: '10px 12px', lineHeight: 1.5, resize: 'vertical' }}
            />
            <p style={hintStyle}>줄바꿈한 위치 그대로 카드에 표시됩니다.</p>
          </div>
          <div>
            <label htmlFor="review-tags" style={labelStyle}>해시태그</label>
            <input
              id="review-tags" value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="남편_월급만_보던_삶_끝, 내_용돈은_내가" style={inputStyle}
            />
            <p style={hintStyle}>쉼표로 구분, 최대 5개. &lsquo;#&rsquo;은 화면에서 자동으로 붙고, 띄어쓰기는 &lsquo;_&rsquo;로 바뀝니다.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 10 }}>
            <div>
              <label htmlFor="review-job" style={labelStyle}>직업 (필수)</label>
              <input id="review-job" value={job} onChange={(e) => setJob(e.target.value)} maxLength={20} placeholder="가정주부" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="review-age" style={labelStyle}>나이대 (필수)</label>
              <Select id="review-age" value={ageGroup} onChange={setAgeGroup} options={AGE_OPTIONS} />
            </div>
            <div>
              <label htmlFor="review-months" style={labelStyle}>가입 개월 (필수)</label>
              <input
                id="review-months" type="number" inputMode="numeric" min={1} max={600} value={memberMonths}
                onChange={(e) => setMemberMonths(e.target.value)} placeholder="5" style={inputStyle}
              />
            </div>
          </div>
          {error && <div style={errorBox}>{error}</div>}
        </ModalBody>
        <ModalFooter onCancel={onClose} busy={busy} submitLabel={target ? '저장' : '등록'} canSubmit={canSubmit} />
      </form>
    </AdminModal>
  )
}

export default function IncomeProofManager() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Editing>(null)
  const [reordering, setReordering] = useState(false)
  const { toast, showToast } = useToast()

  const load = useCallback(async () => {
    // 최초 로딩 상태는 useState(true)가 담당 - 이펙트 내 동기 setState 회피
    try {
      const res = await fetch('/api/admin/income-proofs')
      const data = await res.json().catch(() => ({}))
      if (res.ok) setReviews(data.proofs ?? [])
      else showToast(false, data.error ?? '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { void load() }, [load])

  async function move(index: number, delta: -1 | 1) {
    const to = index + delta
    if (to < 0 || to >= reviews.length || reordering) return
    const next = [...reviews]
    ;[next[index], next[to]] = [next[to], next[index]]
    setReviews(next) // 낙관적 반영 - 실패 시 다시 불러온다
    setReordering(true)
    try {
      const res = await fetch('/api/admin/income-proofs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((r) => r.id) }),
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

  async function handleDelete(review: Review) {
    if (!window.confirm(`'${review.title.replace(/\n/g, ' ')}' 후기를 삭제할까요?\n두 번째 월급 페이지에서 즉시 사라지고 이미지 파일도 함께 삭제됩니다.`)) return
    const res = await fetch(`/api/admin/income-proofs/${review.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) showToast(true, '삭제했습니다.')
    else showToast(false, data.error ?? '삭제에 실패했습니다.')
    await load()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={pageTitle}>두번째 월급 후기 관리</h1>
          <p style={pageDesc}>
            두 번째 월급 페이지 &lsquo;통장이 바뀌자 인생이 바뀐 사람들&rsquo; 사례 카드입니다.<br />
            위에서부터 순서대로 노출됩니다. 후기가 하나도 없으면 해당 영역이 숨겨집니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/income" target="_blank" rel="noreferrer" style={{ ...btnStyle('ghost'), textDecoration: 'none' }}>
            <ExternalLink size={14} /> 페이지에서 보기
          </a>
          <button type="button" onClick={() => setEditing('new')} style={btnStyle('primary')}>
            <Plus size={16} /> 후기 추가
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ ...card, textAlign: 'center', color: '#8B95A1' }}>불러오는 중…</div>
      ) : reviews.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#8B95A1' }}>등록된 후기가 없습니다.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #EEF1F6', borderRadius: 14, padding: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 28, textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#B0B8C1' }}>{i + 1}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.image_url} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 10, border: '1px solid #F2F4F6', background: '#F8FAFC', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#191F28', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{r.title}</div>
                {r.tags.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {r.tags.map((t) => (
                      <span key={t} style={{ fontSize: 12, fontWeight: 600, color: '#1B6CF2' }}>#{t}</span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 6, fontSize: 12.5, color: '#6B7684' }}>
                  {r.job} · {r.age_group}대 · 가입 {r.member_months}개월
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                <button type="button" aria-label="위로" title="위로" disabled={i === 0 || reordering} onClick={() => void move(i, -1)} style={iconBtnStyle(i === 0 || reordering)}>
                  <ArrowUp size={15} />
                </button>
                <button type="button" aria-label="아래로" title="아래로" disabled={i === reviews.length - 1 || reordering} onClick={() => void move(i, 1)} style={iconBtnStyle(i === reviews.length - 1 || reordering)}>
                  <ArrowDown size={15} />
                </button>
                <button type="button" aria-label="수정" title="수정" onClick={() => setEditing(r)} style={iconBtnStyle()}>
                  <Pencil size={15} />
                </button>
                <button type="button" aria-label="삭제" title="삭제" onClick={() => void handleDelete(r)} style={iconBtnStyle(false, true)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* key로 대상이 바뀔 때마다 폼 상태를 새로 만든다 */}
      <ReviewFormModal
        key={editing === null ? 'closed' : editing === 'new' ? 'new' : editing.id}
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={(message) => { showToast(true, message); void load() }}
      />

      <Toast toast={toast} />
    </div>
  )
}
