'use client'

import { useEffect, useMemo, useRef } from 'react'
import { ImagePlus } from 'lucide-react'
import { labelStyle, hintStyle } from './ui'

const MAX_BYTES = 5 * 1024 * 1024 // 서버(publicAssets) 제한과 동일

/**
 * 이미지 선택 + 미리보기. 새로 고른 파일이 있으면 그걸, 없으면 기존 이미지(currentUrl)를 보여준다.
 * 형식·용량은 서버에서 최종 검증하고, 여기서는 즉시 안내용으로만 거른다.
 */
export default function ImagePicker({
  label,
  currentUrl,
  file,
  onChange,
  onInvalid,
  height = 220,
}: {
  label: string
  currentUrl: string | null
  file: File | null
  onChange: (file: File | null) => void
  onInvalid: (message: string) => void
  height?: number
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const shown = previewUrl ?? currentUrl

  function handlePick(picked: File | undefined) {
    if (inputRef.current) inputRef.current.value = ''
    if (!picked) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(picked.type)) {
      onInvalid('JPG·PNG·WebP 이미지만 업로드할 수 있습니다.')
      return
    }
    if (picked.size > MAX_BYTES) {
      onInvalid('파일 크기는 5MB 이하여야 합니다.')
      return
    }
    onChange(picked)
  }

  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <input
        ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
        onChange={(e) => handlePick(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height,
          padding: 0, border: shown ? '1px solid #E5E8EB' : '2px dashed #CBD5E1', borderRadius: 12,
          background: shown ? '#fff' : '#F8FAFC', overflow: 'hidden', cursor: 'pointer',
        }}
      >
        {shown ? (
          <>
            {/* Storage 공개 URL·로컬 blob 미리보기 - next/image 미사용(TrialManager와 동일) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown} alt="" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} />
            <span style={{ position: 'absolute', right: 8, bottom: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(17,24,39,.75)', color: '#fff', fontSize: 12, fontWeight: 700 }}>
              이미지 변경
            </span>
          </>
        ) : (
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#8B95A1', fontSize: 13, fontWeight: 700 }}>
            <ImagePlus size={24} />
            이미지 선택
          </span>
        )}
      </button>
      <p style={hintStyle}>
        JPG·PNG·WebP, 5MB 이하.{file && currentUrl ? ' 저장하면 기존 이미지가 교체됩니다.' : ''}
      </p>
    </div>
  )
}
