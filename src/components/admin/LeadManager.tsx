'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'

import DateRangePicker from './DateRangePicker'
import Pagination from './Pagination'
import Select, { type SelectOption } from './Select'
import s from './admin.module.css'
import { btnStyle, card, inputStyle, pageDesc, pageTitle } from './ui'

interface Lead {
  id: number
  name: string
  phone: string
  stock: string | null
  traffic_source: 'google' | 'naver' | 'unknown'
  ad_keyword: string | null
  ad_campaign_id: string | null
  ad_campaign_label: string | null
  landing_url: string | null
  requested_at: string
}

interface Filters { q: string; from: string; to: string; source: string }

const EMPTY: Filters = { q: '', from: '', to: '', source: '' }

const SOURCE_LABEL: Record<Lead['traffic_source'], { text: string; bg: string; color: string }> = {
  google: { text: '구글', bg: '#EAF1FE', color: '#1B6CF2' },
  naver: { text: '네이버', bg: '#E6F8EE', color: '#03A94D' },
  unknown: { text: '기타', bg: '#F2F4F6', color: '#6B7684' },
}

const SOURCE_OPTIONS: SelectOption[] = [
  { value: '', label: '전체 유입' },
  { value: 'google', label: '구글' },
  { value: 'naver', label: '네이버' },
  { value: 'unknown', label: '기타' },
]

const th: React.CSSProperties = {
  padding: '12px 14px', textAlign: 'left', fontSize: 12.5, color: '#8B95A1', fontWeight: 600,
  borderBottom: '1px solid #F2F4F6', whiteSpace: 'nowrap',
}
const td: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid #F2F4F6', verticalAlign: 'top' }

/** 숫자만 저장된 연락처 → 010-1234-5678 */
function formatPhone(phone: string): string {
  if (/^\d{11}$/.test(phone)) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`
  if (/^\d{10}$/.test(phone)) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
  return phone
}

/** 랜딩 URL → 경로만(예: /income). 파싱 실패 시 원문. */
function landingPath(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

type FetchResult = { leads: Lead[]; total: number; pageSize: number } | { error: string }

async function fetchLeads(kind: string, filters: Filters, page: number): Promise<FetchResult> {
  const params = new URLSearchParams({ page: String(page) })
  for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v)
  try {
    const res = await fetch(`/api/admin/leads/${kind}?${params}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data.error ?? '목록을 불러오지 못했습니다.' }
    return { leads: data.leads ?? [], total: data.total ?? 0, pageSize: data.pageSize ?? 50 }
  } catch {
    return { error: '네트워크 오류가 발생했습니다.' }
  }
}

export default function LeadManager({ kind, title, description, showStock }: {
  kind: 'main' | 'income'
  title: string
  description: string
  showStock: boolean
}) {
  const [draft, setDraft] = useState<Filters>(EMPTY) // 입력 중인 조건
  const [applied, setApplied] = useState<Filters>(EMPTY) // 조회에 쓰인 조건
  const [page, setPage] = useState(1)
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const seq = useRef(0) // 늦게 도착한 이전 응답 무시용

  // 상태 반영은 응답 콜백(then)에서만 - 이펙트 내 동기 setState 회피.
  // 로딩 표시는 호출하는 쪽(이벤트 핸들러)이 켠다.
  const load = useCallback((filters: Filters, nextPage: number) => {
    const mySeq = ++seq.current
    return fetchLeads(kind, filters, nextPage).then((result) => {
      if (mySeq !== seq.current) return
      if ('error' in result) {
        setError(result.error)
      } else {
        setError(null)
        setLeads(result.leads)
        setTotal(result.total)
        setPageSize(result.pageSize)
      }
      setLoading(false)
    })
  }, [kind])

  useEffect(() => { void load(EMPTY, 1) }, [load])

  function run(filters: Filters, nextPage: number) {
    setApplied(filters)
    setPage(nextPage)
    setLoading(true)
    void load(filters, nextPage)
  }

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    run(draft, 1)
  }

  // 표 하단에서 넘기므로 새 페이지는 맨 위부터 보이게
  function handlePage(nextPage: number) {
    run(applied, nextPage)
    window.scrollTo({ top: 0 })
  }

  function handleReset() {
    setDraft(EMPTY)
    run(EMPTY, 1)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const filtered = Object.values(applied).some(Boolean)
  const cols = showStock ? 9 : 8

  return (
    <div className={s.wide}>
      <h1 style={pageTitle}>{title}</h1>
      <p style={{ ...pageDesc, marginBottom: 20 }}>{description}</p>

      <form onSubmit={handleSearch} style={{ ...card, padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} maxLength={50}
          placeholder="이름 또는 연락처" aria-label="이름 또는 연락처"
          style={{ ...inputStyle, flex: '1 1 200px', width: 'auto', maxWidth: 320 }}
        />
        <DateRangePicker
          from={draft.from} to={draft.to} width={250} ariaLabel="신청 기간"
          onChange={(range) => setDraft({ ...draft, ...range })}
        />
        <Select
          value={draft.source} onChange={(source) => setDraft({ ...draft, source })} ariaLabel="유입 매체"
          options={SOURCE_OPTIONS} width={130}
        />
        <button type="submit" style={{ ...btnStyle('primary'), height: 44 }}>
          <Search size={15} /> 검색
        </button>
        {filtered && (
          <button type="button" onClick={handleReset} style={{ ...btnStyle('ghost'), height: 44 }}>초기화</button>
        )}
      </form>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 10px', fontSize: 13, color: '#6B7684' }}>
        <span>{filtered ? '검색 결과' : '전체'} <b style={{ color: '#191F28' }}>{total.toLocaleString('ko-KR')}</b>건</span>
        <span>최신 신청 순</span>
      </div>

      <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: showStock ? 1180 : 1080, borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={th}>신청 시각</th>
              <th style={th}>이름</th>
              <th style={th}>연락처</th>
              {showStock && <th style={th}>관심 종목</th>}
              <th style={th}>유입</th>
              <th style={th}>키워드</th>
              <th style={th}>캠페인 라벨</th>
              <th style={th}>캠페인 ID</th>
              <th style={th}>랜딩 페이지</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={cols} style={{ padding: 32, textAlign: 'center', color: '#8B95A1' }}>불러오는 중…</td></tr>
            ) : error ? (
              <tr><td colSpan={cols} style={{ padding: 32, textAlign: 'center', color: '#E8342B', fontWeight: 600 }}>{error}</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={cols} style={{ padding: 32, textAlign: 'center', color: '#8B95A1' }}>
                {filtered ? '조건에 맞는 신청이 없습니다.' : '아직 신청이 없습니다.'}
              </td></tr>
            ) : leads.map((l) => {
              const src = SOURCE_LABEL[l.traffic_source] ?? SOURCE_LABEL.unknown
              return (
                <tr key={l.id}>
                  <td style={{ ...td, color: '#6B7684', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {l.requested_at.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td style={{ ...td, fontWeight: 700, color: '#191F28', whiteSpace: 'nowrap' }}>{l.name}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    <a href={`tel:${l.phone}`} style={{ color: '#333D4B', textDecoration: 'none' }}>{formatPhone(l.phone)}</a>
                  </td>
                  {showStock && <td style={{ ...td, color: '#4E5968' }}>{l.stock ?? '-'}</td>}
                  <td style={td}>
                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: src.bg, color: src.color, whiteSpace: 'nowrap' }}>
                      {src.text}
                    </span>
                  </td>
                  <td style={{ ...td, color: '#4E5968', maxWidth: 200, wordBreak: 'break-all' }}>{l.ad_keyword ?? '-'}</td>
                  <td style={{ ...td, color: '#4E5968', maxWidth: 200, wordBreak: 'break-all' }}>{l.ad_campaign_label ?? '-'}</td>
                  <td style={{ ...td, color: '#4E5968', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{l.ad_campaign_id ?? '-'}</td>
                  <td style={{ ...td, color: '#4E5968', maxWidth: 200 }}>
                    {l.landing_url ? (
                      <span title={l.landing_url} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {landingPath(l.landing_url)}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} disabled={loading} onChange={handlePage} />
    </div>
  )
}
