'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Asset {
  id: number
  kind: 'sms' | 'chart' | 'review'
  group_no: number | null
  url: string
  alt: string | null
}

const card: React.CSSProperties = { background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: 24, marginBottom: 20 }

function Slot({ asset, label, onUpload, onDelete, uploading, uploadingKey }: {
  asset: Asset | undefined
  label: string
  onUpload: () => void
  onDelete: (asset: Asset) => void
  uploading: string | null
  uploadingKey: string
}) {
  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#6B7684', marginBottom: 6 }}>{label}</div>
      {asset ? (
        <div style={{ position: 'relative', border: '1px solid #E5E8EB', borderRadius: 12, overflow: 'hidden', background: '#F8FAFC' }}>
          {/* Storage 공개 URL 렌더 — next/image 미사용(v1, remotePatterns 불필요) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.url} alt={asset.alt ?? label} style={{ display: 'block', width: '100%', height: 180, objectFit: 'contain', background: '#fff' }} />
          <button
            onClick={() => onDelete(asset)}
            style={{ position: 'absolute', top: 8, right: 8, border: 'none', borderRadius: 8, background: 'rgba(17,24,39,.75)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 10px', cursor: 'pointer' }}
          >
            삭제
          </button>
        </div>
      ) : (
        <button
          onClick={onUpload}
          disabled={uploading !== null}
          style={{
            width: '100%', height: 180, border: '2px dashed #CBD5E1', borderRadius: 12, background: '#F8FAFC',
            color: '#8B95A1', fontSize: 13, fontWeight: 700,
            cursor: uploading !== null ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading === uploadingKey ? '업로드 중…' : '+ 이미지 업로드'}
        </button>
      )}
    </div>
  )
}

export default function TrialManager() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [uploading, setUploading] = useState<string | null>(null) // 'sms:1' | 'chart:1' | 'review'
  const fileRef = useRef<HTMLInputElement | null>(null)
  const pendingRef = useRef<{ kind: Asset['kind']; groupNo: number | null } | null>(null)

  const load = useCallback(async () => {
    // 최초 로딩 상태는 useState(true)가 담당 — 이펙트 내 동기 setState 회피
    try {
      const res = await fetch('/api/admin/trial-assets')
      const data = await res.json().catch(() => ({}))
      if (res.ok) setAssets(data.assets ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  function pickFile(kind: Asset['kind'], groupNo: number | null) {
    pendingRef.current = { kind, groupNo }
    fileRef.current?.click()
  }

  async function handleFile(file: File | undefined) {
    const pending = pendingRef.current
    pendingRef.current = null
    if (!file || !pending) return
    const key = `${pending.kind}:${pending.groupNo ?? ''}`
    setUploading(key)
    setNotice(null)
    try {
      const fd = new FormData()
      fd.set('file', file)
      fd.set('kind', pending.kind)
      if (pending.groupNo != null) fd.set('groupNo', String(pending.groupNo))
      const res = await fetch('/api/admin/trial-assets', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setNotice({ ok: false, text: data.error ?? '업로드에 실패했습니다.' }); return }
      setNotice({ ok: true, text: '이미지를 등록했습니다. 퍼블릭 페이지에 즉시 반영됩니다.' })
      await load()
    } catch {
      setNotice({ ok: false, text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setUploading(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(asset: Asset) {
    if (!window.confirm('이 이미지를 삭제할까요? 퍼블릭 페이지에서 즉시 사라집니다.')) return
    const res = await fetch(`/api/admin/trial-assets?id=${asset.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setNotice(res.ok ? { ok: true, text: '삭제했습니다.' } : { ok: false, text: data.error ?? '삭제에 실패했습니다.' })
    await load()
  }

  const sms = assets.filter((a) => a.kind === 'sms')
  const charts = assets.filter((a) => a.kind === 'chart')
  const reviews = assets.filter((a) => a.kind === 'review')

  // 문자캡처·차트 세트: 존재하는 group_no 모음 + 새 세트 추가 슬롯
  const groupNos = [...new Set([...sms, ...charts].map((a) => a.group_no ?? 0))].sort((a, b) => a - b)
  const nextGroupNo = groupNos.length ? Math.max(...groupNos) + 1 : 1

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '4px 0 6px' }}>추천주 7일 체험 이미지</h1>
      <p style={{ fontSize: 13.5, color: '#6B7684', margin: '0 0 20px' }}>
        JPG·PNG·WebP, 5MB 이하. 등록·삭제 즉시 퍼블릭 페이지(/trial)에 반영됩니다.
      </p>

      <input
        ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {notice && (
        <div style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 12, fontSize: 13.5, fontWeight: 600,
          background: notice.ok ? '#EAF7F1' : '#FCEEED', color: notice.ok ? '#03B26C' : '#E8342B',
        }}>
          {notice.text}
        </div>
      )}

      {loading ? (
        <div style={{ ...card, textAlign: 'center', color: '#8B95A1' }}>불러오는 중…</div>
      ) : (
        <>
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>발송 기록 세트 (문자 캡처 ↔ 차트)</div>
            <p style={{ fontSize: 12.5, color: '#8B95A1', margin: '0 0 16px' }}>
              같은 세트의 문자 캡처와 차트가 좌우로 짝지어 노출됩니다.
            </p>
            {[...groupNos, nextGroupNo].map((g) => {
              const s = sms.find((a) => (a.group_no ?? 0) === g)
              const c = charts.find((a) => (a.group_no ?? 0) === g)
              const isNew = !s && !c
              return (
                <div key={g} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap', padding: '14px 0', borderTop: g === groupNos[0] || (isNew && groupNos.length === 0) ? 'none' : '1px solid #F2F4F6' }}>
                  <div style={{ width: 60, paddingTop: 24, fontSize: 13, fontWeight: 800, color: isNew ? '#B0B8C1' : '#1B6CF2' }}>
                    {isNew ? '새 세트' : `세트 ${g}`}
                  </div>
                  <Slot asset={s} label="문자 캡처 이미지" onUpload={() => pickFile('sms', g)} onDelete={(a) => void handleDelete(a)} uploading={uploading} uploadingKey={`sms:${g}`} />
                  <Slot asset={c} label="차트 이미지" onUpload={() => pickFile('chart', g)} onDelete={(a) => void handleDelete(a)} uploading={uploading} uploadingKey={`chart:${g}`} />
                </div>
              )
            })}
          </div>

          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>참여자 후기 (최대 3개)</div>
            <p style={{ fontSize: 12.5, color: '#8B95A1', margin: '0 0 16px' }}>등록된 순서대로 노출됩니다.</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ flex: '1 1 200px', maxWidth: 320 }}>
                  <Slot asset={r} label="후기 이미지" onUpload={() => {}} onDelete={(a) => void handleDelete(a)} uploading={uploading} uploadingKey="review" />
                </div>
              ))}
              {reviews.length < 3 && (
                <div style={{ flex: '1 1 200px', maxWidth: 320 }}>
                  <Slot asset={undefined} label="후기 이미지" onUpload={() => pickFile('review', null)} onDelete={() => {}} uploading={uploading} uploadingKey="review:" />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
