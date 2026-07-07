// 데이터셋 수집기 공통 타입·헬퍼.
// 각 데이터셋: fetch(KIS) → map → 멱등 upsert. KIS_INGESTION.md §2/§3.

export type DatasetResult = 'ok' | 'unavailable'

export interface StockDataset {
  key: string
  run(code: string): Promise<DatasetResult>
}

export interface MarketDataset {
  key: string
  run(): Promise<DatasetResult>
}

// 시장 전역 행의 ingest_state.code 값.
export const MARKET_CODE = '_MARKET_'

// KIS 문자열 숫자 → number | null (빈 문자열·null·NaN → null).
export function num(v: unknown): number | null {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

// 'YYYYMMDD' → 'YYYY-MM-DD' (date 컬럼용). 유효하지 않으면 null.
export function toDate(yyyymmdd: unknown): string | null {
  const s = String(yyyymmdd ?? '').trim()
  if (!/^\d{8}$/.test(s)) return null
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

// data_dt('YYYYMMDD') + data_tm('HHMMSS') → ISO timestamptz | null.
export function toTimestamp(dt: unknown, tm: unknown): string | null {
  const d = String(dt ?? '').trim()
  if (!/^\d{8}$/.test(d)) return null
  const t = String(tm ?? '').trim().padStart(6, '0').slice(0, 6)
  const hh = /^\d{6}$/.test(t) ? t : '000000'
  // KST(+09:00) 기준으로 해석.
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${hh.slice(0, 2)}:${hh.slice(2, 4)}:${hh.slice(4, 6)}+09:00`
}

// KIS 등락 부호코드: 1 상한 2 상승 3 보합 4 하한 5 하락.
export function isRiseFromSign(sign: unknown): boolean | null {
  const s = String(sign ?? '').trim()
  if (s === '1' || s === '2') return true
  if (s === '4' || s === '5') return false
  if (s === '3') return false
  return null
}
