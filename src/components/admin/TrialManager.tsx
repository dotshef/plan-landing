'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Toast, useToast } from './Toast'

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
  const { toast, showToast } = useToast()
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
    try {
      const fd = new FormData()
      fd.set('file', file)
      fd.set('kind', pending.kind)
      if (pending.groupNo != null) fd.set('groupNo', String(pending.groupNo))
      const res = await fetch('/api/admin/trial-assets', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { showToast(false, data.error ?? '업로드에 실패했습니다.'); return }
      showToast(true, '이미지를 등록했습니다. 퍼블릭 페이지에 즉시 반영됩니다.')
      await load()
    } catch {
      showToast(false, '네트워크 오류가 발생했습니다.')
    } finally {
      setUploading(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(asset: Asset) {
    if (!window.confirm('이 이미지를 삭제할까요? 퍼블릭 페이지에서 즉시 사라집니다.')) return
    const res = await fetch(`/api/admin/trial-assets?id=${asset.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) showToast(true, '삭제했습니다.')
    else showToast(false, data.error ?? '삭제에 실패했습니다.')
    await load()
  }

  // 발송 기록 세트는 하나만 — 문자 캡처·차트 각 1장. 참여자 후기는 개수 제한 없음.
  const smsAsset = assets.find((a) => a.kind === 'sms')
  const chartAsset = assets.find((a) => a.kind === 'chart')
  const reviews = assets.filter((a) => a.kind === 'review')

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '4px 0 6px' }}>추천주 7일 체험 관리</h1>
      <p style={{ fontSize: 13.5, color: '#6B7684', margin: '0 0 20px' }}>
        JPG·PNG·WebP, 5MB 이하. 등록·삭제 즉시 퍼블릭 페이지(/trial)에 반영됩니다.
      </p>

      <input
        ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {loading ? (
        <div style={{ ...card, textAlign: 'center', color: '#8B95A1' }}>불러오는 중…</div>
      ) : (
        <>
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>발송 기록 세트 (문자 캡처 ↔ 차트)</div>
            <p style={{ fontSize: 12.5, color: '#8B95A1', margin: '0 0 16px' }}>
              세트는 하나만 등록됩니다. 문자 캡처와 차트가 좌우로 짝지어 노출됩니다.
            </p>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Slot asset={smsAsset} label="문자 캡처 이미지" onUpload={() => pickFile('sms', 1)} onDelete={(a) => void handleDelete(a)} uploading={uploading} uploadingKey="sms:1" />
              <Slot asset={chartAsset} label="차트 이미지" onUpload={() => pickFile('chart', 1)} onDelete={(a) => void handleDelete(a)} uploading={uploading} uploadingKey="chart:1" />
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>참여자 후기</div>
            <p style={{ fontSize: 12.5, color: '#8B95A1', margin: '0 0 16px' }}>
              등록된 순서대로 노출됩니다. 3개를 초과하면 퍼블릭 페이지에서 슬라이딩으로 노출됩니다.
            </p>
            {/* 4열 고정 그리드 — 줄바꿈된 업로드 슬롯도 카드와 같은 너비를 유지한다 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {reviews.map((r) => (
                <Slot key={r.id} asset={r} label="후기 이미지" onUpload={() => {}} onDelete={(a) => void handleDelete(a)} uploading={uploading} uploadingKey="review" />
              ))}
              <Slot asset={undefined} label="후기 이미지" onUpload={() => pickFile('review', null)} onDelete={() => {}} uploading={uploading} uploadingKey="review:" />
            </div>
          </div>
        </>
      )}

      <Toast toast={toast} />
    </div>
  )
}
