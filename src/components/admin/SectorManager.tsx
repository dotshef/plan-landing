'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, OctagonX, Trash2, TriangleAlert, X } from 'lucide-react'

import { Toast, useToast } from './Toast'

interface StockRef { code: string; name: string }
interface SectorRow {
  id: number
  name: string
  theme: string
  stocks: StockRef[]
}
interface Report {
  id: number
  year: number
  quarter: number
  kospi_avg_per: number | null
  status: 'draft' | 'published'
  base_date: string | null
  published_at: string | null
  sectors: SectorRow[]
}
interface StockIssue { level: 'error' | 'warn'; message: string }
interface Validation {
  deployable: boolean
  sectors: { sectorId: number; name: string; stocks: { code: string; name: string; issues: StockIssue[] }[] }[]
  dataStart: { price: string | null; investor: string | null }
  calendarDays: { cur: number; prev: number }
}
interface SearchHit { code: string; name: string; market: string }

const card: React.CSSProperties = { background: '#fff', border: '1px solid #EEF1F6', borderRadius: 16, padding: 24, marginBottom: 20 }
const inputStyle: React.CSSProperties = {
  height: 42, padding: '0 12px', border: '1.5px solid #E5E8EB', borderRadius: 10,
  fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#F8FAFC',
}

function btn(kind: 'primary' | 'ghost' | 'danger' | 'publish', disabled = false): React.CSSProperties {
  const base: React.CSSProperties = {
    height: 42, padding: '0 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer', border: '1px solid transparent',
  }
  if (kind === 'primary') return { ...base, background: disabled ? '#B0B8C1' : '#1B6CF2', color: '#fff', border: 'none' }
  if (kind === 'publish') return { ...base, background: disabled ? '#B0B8C1' : '#03B26C', color: '#fff', border: 'none', height: 50, fontSize: 15 }
  if (kind === 'danger') return { ...base, background: '#fff', color: '#E8342B', border: '1px solid #F3D2D0' }
  return { ...base, background: '#fff', color: '#4E5968', border: '1px solid #E5E8EB' }
}

/** 분기 선택 드롭다운 — 네이티브 select 대신 div 기반 */
function QuarterSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', width: 100 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        style={{
          ...inputStyle, width: '100%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
        }}
      >
        <span style={{ color: '#191F28' }}>{value}분기</span>
        <ChevronDown size={16} color="#8B95A1" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 46, left: 0, right: 0, zIndex: 20, background: '#fff', border: '1px solid #E5E8EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.08)', overflow: 'hidden' }}>
          {[1, 2, 3, 4].map((n) => {
            const selected = String(n) === value
            return (
              <button
                key={n}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(String(n)); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', padding: '10px 12px', border: 'none', textAlign: 'left',
                  fontSize: 13.5, fontFamily: 'inherit', cursor: 'pointer',
                  background: selected ? '#F2F6FF' : '#fff',
                  fontWeight: selected ? 700 : 400,
                  color: selected ? '#1B6CF2' : '#191F28',
                }}
              >
                {n}분기
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** 종목 검색 입력 — 기존 /api/search 재활용 */
function StockSearch({ onPick, disabled }: { onPick: (hit: SearchHit) => void; disabled: boolean }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    setQ(value)
    if (timer.current) clearTimeout(timer.current)
    if (!value.trim()) { setHits([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`)
        const data = (await res.json()) as SearchHit[]
        setHits(Array.isArray(data) ? data : [])
        setOpen(true)
      } catch {
        setHits([])
      }
    }, 250)
  }

  return (
    <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
      <input
        type="text" value={q} disabled={disabled}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => hits.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="종목명 또는 코드 검색"
        style={{ ...inputStyle, width: '100%' }}
      />
      {open && hits.length > 0 && (
        <div style={{ position: 'absolute', top: 46, left: 0, right: 0, zIndex: 20, background: '#fff', border: '1px solid #E5E8EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.08)', overflow: 'hidden' }}>
          {hits.map((h) => (
            <button
              key={h.code}
              onMouseDown={(e) => { e.preventDefault(); onPick(h); setQ(''); setHits([]); setOpen(false) }}
              style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 12px', border: 'none', background: '#fff', fontSize: 13.5, cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontWeight: 700, color: '#191F28' }}>{h.name}</span>
              <span style={{ color: '#8B95A1' }}>{h.code} · {h.market}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** 방문 사이트 반영 확인 모달 */
function PublishConfirmModal({ open, busy, onClose, onConfirm }: { open: boolean; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17,24,39,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(17,40,90,.24)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid #F2F4F6' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>방문 사이트에 반영할까요?</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', color: '#8B95A1' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 22px', fontSize: 14, color: '#4E5968', lineHeight: 1.7 }}>
              지표 4종을 계산해 저장하고 퍼블릭 페이지에 즉시 공개됩니다.
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '14px 22px', borderTop: '1px solid #F2F4F6' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                style={{ flex: 1, height: 46, borderRadius: 12, background: '#fff', color: '#4E5968', fontSize: 14, fontWeight: 700, border: '1px solid #E5E8EB', cursor: busy ? 'not-allowed' : 'pointer' }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                style={{
                  flex: 2, height: 46, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff',
                  background: busy ? '#B0B8C1' : '#03B26C',
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                {busy ? '반영 중…' : '반영하기'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** 섹터 추가 모달 */
function SectorAddModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => Promise<void> }) {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(''); setTheme(''); setError(null); setBusy(false)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy || !name.trim() || !theme.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/sector/sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, theme }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError((data.error as string) ?? '섹터 추가에 실패했습니다.'); return }
      await onCreated()
      onClose()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = !busy && Boolean(name.trim()) && Boolean(theme.trim())
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4E5968', marginBottom: 6 }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17,24,39,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(17,40,90,.24)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid #F2F4F6' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>섹터 추가</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', color: '#8B95A1' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label htmlFor="sector-name" style={labelStyle}>섹터 이름</label>
                  <input
                    id="sector-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="예: 전력기기" autoFocus style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
                <div>
                  <label htmlFor="sector-theme" style={labelStyle}>주제</label>
                  <input
                    id="sector-theme" type="text" value={theme} onChange={(e) => setTheme(e.target.value)}
                    placeholder="예: 수주가 쌓이는 곳" style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#FCEEED', color: '#E8342B' }}>
                    {error}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, padding: '14px 22px', borderTop: '1px solid #F2F4F6' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ flex: 1, height: 46, borderRadius: 12, background: '#fff', color: '#4E5968', fontSize: 14, fontWeight: 700, border: '1px solid #E5E8EB', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    flex: 2, height: 46, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff',
                    background: canSubmit ? '#1B6CF2' : '#B0B8C1',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                  }}
                >
                  {busy ? '추가 중…' : '섹터 추가'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function SectorManager() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast, showToast } = useToast()

  // 보고서 설정 폼
  const [year, setYear] = useState('')
  const [quarter, setQuarter] = useState('4')
  const [kospiPer, setKospiPer] = useState('')

  // 섹터 추가 모달
  const [addOpen, setAddOpen] = useState(false)

  // 방문 사이트 반영 확인 모달
  const [publishOpen, setPublishOpen] = useState(false)

  const [validation, setValidation] = useState<Validation | null>(null)
  const [busy, setBusy] = useState<string | null>(null) // 'save'|'sector'|'backfill'|'validate'|'publish'

  const load = useCallback(async (revalidate = false) => {
    // 최초 로딩 상태는 useState(true)가 담당 — 이펙트 내 동기 setState 회피
    try {
      const res = await fetch('/api/admin/sector/report')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const r = data.report as Report | null
        setReport(r)
        if (r) {
          setYear(String(r.year))
          setQuarter(String(r.quarter))
          setKospiPer(r.kospi_avg_per != null ? String(r.kospi_avg_per) : '')
        }
        if (revalidate && r && r.sectors.some((s) => s.stocks.length > 0)) {
          await runValidate()
        } else {
          setValidation(null)
        }
      }
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { void load(true) }, [load])

  async function api(path: string, init?: RequestInit): Promise<{ ok: boolean; data: Record<string, unknown> }> {
    try {
      const res = await fetch(path, init)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) showToast(false, (data.error as string) ?? '요청에 실패했습니다.')
      return { ok: res.ok, data }
    } catch {
      showToast(false, '네트워크 오류가 발생했습니다.')
      return { ok: false, data: {} }
    }
  }

  async function saveReport() {
    setBusy('save')
    const { ok } = await api('/api/admin/sector/report', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: Number(year), quarter: Number(quarter), kospiAvgPer: kospiPer === '' ? null : Number(kospiPer) }),
    })
    if (ok) { showToast(true, '보고서 설정을 저장했습니다.'); await load(true) }
    setBusy(null)
  }

  async function removeSector(s: SectorRow) {
    if (!window.confirm(`'${s.name}' 섹터를 삭제할까요? 등록된 종목 연결도 함께 삭제됩니다.`)) return
    const { ok } = await api(`/api/admin/sector/sectors/${s.id}`, { method: 'DELETE' })
    if (ok) await load(true)
  }

  async function addStock(sectorId: number, hit: SearchHit) {
    const { ok } = await api(`/api/admin/sector/sectors/${sectorId}/stocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: hit.code }),
    })
    if (ok) {
      showToast(true, `${hit.name}을(를) 등록했습니다. 데이터 백필을 실행해주세요.`)
      await load(true)
    }
  }

  async function removeStock(sectorId: number, stock: StockRef) {
    const { ok } = await api(`/api/admin/sector/sectors/${sectorId}/stocks?code=${stock.code}`, { method: 'DELETE' })
    if (ok) await load(true)
  }

  async function runBackfill() {
    setBusy('backfill')
    const { ok, data } = await api('/api/admin/sector/backfill', { method: 'POST' })
    if (ok) {
      const failed = (data.failed as { code: string }[]) ?? []
      if (failed.length === 0) {
        showToast(true, '데이터 백필이 완료되었습니다. 검증 결과를 확인해주세요.')
      } else {
        showToast(false, `일부 종목 백필 실패: ${failed.map((f) => f.code).join(', ')}`)
      }
      await runValidate()
    }
    setBusy(null)
  }

  async function runValidate() {
    setBusy('validate')
    const { ok, data } = await api('/api/admin/sector/validate')
    if (ok) setValidation(data as unknown as Validation)
    setBusy(null)
  }

  async function runPublish() {
    setBusy('publish')
    const { ok } = await api('/api/admin/sector/publish', { method: 'POST' })
    if (ok) showToast(true, '방문 사이트에 반영되었습니다. /sector 페이지에서 확인하세요.')
    setPublishOpen(false)
    await load(true)
    setBusy(null)
  }

  if (loading && !report) {
    return <div style={{ ...card, textAlign: 'center', color: '#8B95A1' }}>불러오는 중…</div>
  }

  const issuesBySector = new Map(validation?.sectors.map((s) => [s.sectorId, s.stocks]) ?? [])
  const hasStocks = (report?.sectors ?? []).some((s) => s.stocks.length > 0)
  const hasDataError = Boolean(validation?.sectors.some((s) => s.stocks.some((st) => st.issues.some((i) => i.level === 'error'))))
  const deployable = Boolean(validation?.deployable && report && report.kospi_avg_per != null)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 20px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>주도 섹터 관리</h1>
        {report && (
          <span style={{
            padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 800,
            background: report.status === 'published' ? '#EAF7F1' : '#FFF4E0',
            color: report.status === 'published' ? '#03B26C' : '#92610A',
          }}>
            {report.status === 'published' ? `공개 중 · ${report.published_at?.slice(0, 16).replace('T', ' ') ?? ''}` : '작성 중 (비공개)'}
          </span>
        )}
      </div>

      {/* 보고서 설정 */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 14 }}>보고서 설정</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#6B7684', marginBottom: 6 }}>연도</div>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" style={{ ...inputStyle, width: 110 }} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#6B7684', marginBottom: 6 }}>분기</div>
            <QuarterSelect value={quarter} onChange={setQuarter} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#6B7684', marginBottom: 6 }}>코스피 평균 PER (TTM 공표값)</div>
            <input type="number" step="0.01" value={kospiPer} onChange={(e) => setKospiPer(e.target.value)} placeholder="예: 18.6" style={{ ...inputStyle, width: 180 }} />
          </div>
          <button onClick={saveReport} disabled={busy !== null || !year} style={btn('primary', busy !== null || !year)}>
            {busy === 'save' ? '저장 중…' : '저장'}
          </button>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 12.5, color: '#8B95A1', lineHeight: 1.7 }}>
          입력한 연도·분기는 방문 사이트에 표시되는 <b>발표 분기</b>이며, 데이터 수집과 지표 계산은 <b>직전 분기</b> 기준으로 진행됩니다.
        </p>
        {validation && (
          <p style={{ margin: '14px 0 0', fontSize: 12.5, color: '#8B95A1', lineHeight: 1.7 }}>
            보유 데이터 시작일 — 시세: <b>{validation.dataStart.price ?? '없음'}</b> · 수급: <b>{validation.dataStart.investor ?? '없음'}</b>
            {' '}| 분기 거래일(달력 기준): 당분기 {validation.calendarDays.cur}일 · 직전분기 {validation.calendarDays.prev}일
          </p>
        )}
      </div>

      {/* 섹터 목록 */}
      {report && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>섹터</span>
            <span style={{ padding: '3px 9px', borderRadius: 7, fontSize: 12, fontWeight: 800, background: '#EAF1FE', color: '#1B6CF2' }}>
              {report.sectors.length}개 등록
            </span>
            <button onClick={() => setAddOpen(true)} disabled={busy !== null} style={{ ...btn('primary', busy !== null), marginLeft: 'auto', height: 36, padding: '0 14px', fontSize: 13 }}>
              + 섹터 추가
            </button>
          </div>

          {report.sectors.map((s) => {
            const checks = issuesBySector.get(s.id) ?? []
            return (
              <div key={s.id} style={{ border: '1px solid #F2F4F6', borderRadius: 12, padding: 18, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#191F28' }}>{s.name}</span>
                  <span style={{ fontSize: 13, color: '#6B7684' }}>{s.theme}</span>
                  <button
                    onClick={() => removeSector(s)}
                    aria-label={`${s.name} 섹터 삭제`}
                    title="섹터 삭제"
                    style={{
                      marginLeft: 'auto', width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, background: '#fff', color: '#E8342B', border: '1px solid #F3D2D0', borderRadius: 8, cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {s.stocks.map((st) => {
                    const check = checks.find((c) => c.code === st.code)
                    const hasError = check?.issues.some((i) => i.level === 'error')
                    const hasWarn = check?.issues.some((i) => i.level === 'warn')
                    return (
                      <span key={st.code} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8,
                        fontSize: 13, fontWeight: 700,
                        background: hasError ? '#FCEEED' : hasWarn ? '#FFF4E0' : '#EAF1FE',
                        color: hasError ? '#E8342B' : hasWarn ? '#92610A' : '#1B6CF2',
                      }}>
                        {st.name} <span style={{ fontWeight: 500, opacity: .75 }}>{st.code}</span>
                        <button
                          onClick={() => removeStock(s.id, st)}
                          style={{ border: 'none', background: 'transparent', color: 'inherit', fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}
                          aria-label={`${st.name} 제외`}
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                  <StockSearch onPick={(hit) => void addStock(s.id, hit)} disabled={busy !== null} />
                </div>

                {/* 종목별 검증 메시지 */}
                {checks.some((c) => c.issues.length > 0) && (
                  <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
                    {checks.flatMap((c) =>
                      c.issues.map((i, idx) => (
                        <div key={`${c.code}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: i.level === 'error' ? '#E8342B' : '#92610A' }}>
                          {i.level === 'error'
                            ? <OctagonX size={14} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                            : <TriangleAlert size={14} strokeWidth={2.2} style={{ flexShrink: 0 }} />}
                          {c.name}({c.code}) — {i.message}
                        </div>
                      )),
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {hasDataError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 10,
              background: '#FCEEED', color: '#E8342B', fontSize: 13, fontWeight: 700,
            }}>
              <OctagonX size={16} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              데이터베이스에 필요한 데이터가 부족합니다. 아래 &quot;데이터 백필&quot; 버튼을 눌러주세요
            </div>
          )}
        </div>
      )}

      <SectorAddModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={() => load(true)} />
      <PublishConfirmModal
        open={publishOpen}
        busy={busy === 'publish'}
        onClose={() => { if (busy !== 'publish') setPublishOpen(false) }}
        onConfirm={() => void runPublish()}
      />

      {/* 액션 */}
      {report && (
        <div style={{ ...card, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={runBackfill} disabled={busy !== null || !hasStocks} style={btn('ghost', busy !== null || !hasStocks)}>
            {busy === 'backfill' ? '백필 중… (최대 1분)' : '데이터 백필'}
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {validation && !validation.deployable && (
              <span style={{ fontSize: 13, fontWeight: 700, color: '#E8342B' }}>데이터가 불완전하여 반영할 수 없습니다</span>
            )}
            {validation?.deployable && report.kospi_avg_per == null && (
              <span style={{ fontSize: 13, fontWeight: 700, color: '#92610A' }}>코스피 평균 PER을 입력해주세요</span>
            )}
            <button onClick={() => setPublishOpen(true)} disabled={busy !== null || !deployable} style={btn('publish', busy !== null || !deployable)}>
              {busy === 'publish' ? '반영 중…' : '방문 사이트 반영'}
            </button>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
