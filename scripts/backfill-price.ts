import { loadEnvConfig } from '@next/env'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

loadEnvConfig(process.cwd())

const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443'
const PRICE_ENDPOINT = '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice'
const PRICE_TR_ID = 'FHKST03010100'
const RATE_LIMIT_CODE = 'EGW00201'
const EXPIRY_MARGIN_MS = 10 * 60 * 1000
const WINDOW_DAYS = 100
const PAGE_SIZE = 1000

type BackfillArgs = {
  code?: string
  all: boolean
  years: number
  days?: number
  from?: string
  to?: string
  limit?: number
  delayMs: number
  dryRun: boolean
}

type KisResponse<T = unknown> = {
  rt_cd: string
  msg_cd: string
  msg1: string
  output?: T
  output1?: T
  output2?: T
}

type PriceRow = {
  code: string
  date: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
  trading_value: number | null
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} 환경변수가 필요합니다.`)
  return value
}

function createDb(): SupabaseClient {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function parseArgs(argv: string[]): BackfillArgs {
  const args: BackfillArgs = { all: false, years: 1, delayMs: 120, dryRun: false }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') {
      args.dryRun = true
      continue
    }
    if (arg === '--all') {
      args.all = true
      continue
    }

    const [key, inlineValue] = arg.split('=', 2)
    if (!key.startsWith('--')) throw new Error(`알 수 없는 인자: ${arg}`)
    const value = inlineValue ?? argv[i + 1]
    if (value == null || value.startsWith('--')) throw new Error(`${key} 값을 지정해야 합니다.`)
    if (inlineValue == null) i++

    switch (key) {
      case '--code':
        args.code = value
        break
      case '--years':
        args.years = positiveInt(value, key)
        break
      case '--days':
        args.days = positiveInt(value, key)
        break
      case '--from':
        args.from = normalizeDate(value, key)
        break
      case '--to':
        args.to = normalizeDate(value, key)
        break
      case '--limit':
        args.limit = positiveInt(value, key)
        break
      case '--delay-ms':
        args.delayMs = nonNegativeInt(value, key)
        break
      default:
        throw new Error(`알 수 없는 인자: ${arg}`)
    }
  }

  if ((args.from && !args.to) || (!args.from && args.to)) {
    throw new Error('--from과 --to는 같이 지정해야 합니다.')
  }
  if (args.code && args.all) {
    throw new Error('--code와 --all은 같이 지정할 수 없습니다.')
  }

  return args
}

function positiveInt(value: string, key: string): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${key}는 양의 정수여야 합니다.`)
  return n
}

function nonNegativeInt(value: string, key: string): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0) throw new Error(`${key}는 0 이상의 정수여야 합니다.`)
  return n
}

function normalizeDate(value: string, key: string): string {
  const s = value.replace(/-/g, '')
  if (!/^\d{8}$/.test(s)) throw new Error(`${key}는 YYYY-MM-DD 또는 YYYYMMDD 형식이어야 합니다.`)
  return s
}

function yyyymmdd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function addDays(value: string, days: number): string {
  const d = parseDate(value)
  d.setDate(d.getDate() + days)
  return yyyymmdd(d)
}

function parseDate(value: string): Date {
  return new Date(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)))
}

function compareDate(a: string, b: string): number {
  return a.localeCompare(b)
}

function dateRange(args: BackfillArgs): { from: string; to: string } {
  if (args.from && args.to) return { from: args.from, to: args.to }

  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - (args.days ?? args.years * 365))
  return { from: yyyymmdd(from), to: yyyymmdd(to) }
}

function splitWindows(from: string, to: string): Array<{ from: string; to: string }> {
  const windows: Array<{ from: string; to: string }> = []
  let start = from

  while (compareDate(start, to) <= 0) {
    const end = minDate(addDays(start, WINDOW_DAYS - 1), to)
    windows.push({ from: start, to: end })
    start = addDays(end, 1)
  }

  return windows
}

function minDate(a: string, b: string): string {
  return compareDate(a, b) <= 0 ? a : b
}

function toDate(yyyymmddValue: unknown): string | null {
  const s = String(yyyymmddValue ?? '').trim()
  if (!/^\d{8}$/.test(s)) return null
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

function num(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getCodes(db: SupabaseClient, args: BackfillArgs): Promise<string[]> {
  if (args.code) {
    return args.code.split(',').map((code) => code.trim()).filter(Boolean)
  }
  if (!args.all) {
    throw new Error('전체 종목을 백필하려면 --all을 명시하세요. 예: npm run backfill:price -- --all --years=1')
  }

  const codes: string[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from('stock')
      .select('code')
      .eq('group_code', 'ST')
      .order('code')
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(`stock 조회 실패: ${error.message}`)
    const rows = data ?? []

    for (const row of rows) {
      codes.push(row.code)
      if (args.limit && codes.length >= args.limit) return codes
    }

    if (rows.length < PAGE_SIZE) break
  }

  return codes
}

async function getAccessToken(db: SupabaseClient): Promise<string> {
  const { data: row } = await db
    .from('kis_token')
    .select('access_token, expires_at')
    .eq('id', 1)
    .maybeSingle()

  if (row && new Date(row.expires_at).getTime() - EXPIRY_MARGIN_MS > Date.now()) {
    return row.access_token
  }

  const res = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: requiredEnv('KIS_APP_KEY'),
      appsecret: requiredEnv('KIS_APP_SECRET'),
    }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`KIS 토큰 발급 실패 ${res.status}: ${text}`)

  const data = JSON.parse(text) as { access_token?: string; token_type?: string; expires_in?: number }
  if (!data.access_token) throw new Error(`KIS 토큰 응답에 access_token이 없습니다: ${text}`)

  const expiresAt = new Date(Date.now() + (data.expires_in ?? 86400) * 1000)
  const { error } = await db.from('kis_token').upsert(
    {
      id: 1,
      access_token: data.access_token,
      token_type: data.token_type ?? 'Bearer',
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw new Error(`KIS 토큰 저장 실패: ${error.message}`)

  return data.access_token
}

async function kisGet<T>(
  db: SupabaseClient,
  params: Record<string, string>,
  attempt = 0,
): Promise<KisResponse<T>> {
  const token = await getAccessToken(db)
  const url = new URL(KIS_BASE_URL + PRICE_ENDPOINT)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

  const res = await fetch(url.toString(), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      authorization: `Bearer ${token}`,
      appkey: requiredEnv('KIS_APP_KEY'),
      appsecret: requiredEnv('KIS_APP_SECRET'),
      tr_id: PRICE_TR_ID,
    },
  })

  const text = await res.text()
  const data = JSON.parse(text) as KisResponse<T>
  if (res.ok && data.rt_cd === '0') return data

  if (data.msg_cd === RATE_LIMIT_CODE && attempt < 4) {
    await sleep(500 * (attempt + 1))
    return kisGet<T>(db, params, attempt + 1)
  }

  throw new Error(`[${PRICE_TR_ID}] ${data.msg_cd ?? res.status}: ${data.msg1 ?? text}`)
}

async function fetchPriceRows(
  db: SupabaseClient,
  code: string,
  from: string,
  to: string,
): Promise<PriceRow[]> {
  const data = await kisGet<Record<string, string>[]>(db, {
    FID_COND_MRKT_DIV_CODE: 'J',
    FID_INPUT_ISCD: code,
    FID_INPUT_DATE_1: from,
    FID_INPUT_DATE_2: to,
    FID_PERIOD_DIV_CODE: 'D',
    FID_ORG_ADJ_PRC: '0',
  })

  const list = data.output2 ?? []
  const byDate = new Map<string, PriceRow>()
  for (const row of list) {
    const date = toDate(row.stck_bsop_date)
    if (!date) continue
    byDate.set(date, {
      code,
      date,
      open: num(row.stck_oprc),
      high: num(row.stck_hgpr),
      low: num(row.stck_lwpr),
      close: num(row.stck_clpr),
      volume: num(row.acml_vol),
      trading_value: num(row.acml_tr_pbmn),
    })
  }

  return [...byDate.values()]
}

async function upsertRows(db: SupabaseClient, rows: PriceRow[], dryRun: boolean): Promise<void> {
  if (rows.length === 0 || dryRun) return

  const { error } = await db.from('price_daily').upsert(rows, { onConflict: 'code,date' })
  if (error) throw new Error(`price_daily upsert 실패: ${error.message}`)
}

async function recordState(
  db: SupabaseClient,
  code: string,
  dataset: string,
  status: 'ok' | 'error',
  error?: string,
): Promise<void> {
  const { error: stateError } = await db.from('ingest_state').upsert(
    {
      code,
      dataset,
      status,
      fetched_at: new Date().toISOString(),
      error: error ?? null,
    },
    { onConflict: 'code,dataset' },
  )
  if (stateError) throw new Error(`ingest_state upsert 실패: ${stateError.message}`)
}

async function backfillCode(
  db: SupabaseClient,
  code: string,
  windows: Array<{ from: string; to: string }>,
  args: BackfillArgs,
  dataset: string,
): Promise<{ rows: number; ok: boolean }> {
  let totalRows = 0

  try {
    for (const window of windows) {
      const rows = await fetchPriceRows(db, code, window.from, window.to)
      await upsertRows(db, rows, args.dryRun)
      totalRows += rows.length
      console.log(
        `[price-backfill] ${code} ${window.from}-${window.to}: ${rows.length} rows${args.dryRun ? ' (dry-run)' : ''}`,
      )
      if (args.delayMs > 0) await sleep(args.delayMs)
    }

    if (!args.dryRun) await recordState(db, code, dataset, 'ok')
    return { rows: totalRows, ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (!args.dryRun) await recordState(db, code, dataset, 'error', message)
    console.error(`[price-backfill] ${code} failed: ${message}`)
    return { rows: totalRows, ok: false }
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const db = createDb()
  const range = dateRange(args)
  const windows = splitWindows(range.from, range.to)
  const dataset = `price_backfill_${range.from}_${range.to}`
  const codes = await getCodes(db, args)

  console.log(
    `[price-backfill] codes=${codes.length} range=${range.from}-${range.to} windows=${windows.length} delay=${args.delayMs}ms${args.dryRun ? ' dry-run' : ''}`,
  )

  let ok = 0
  let failed = 0
  let rows = 0

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]
    console.log(`[price-backfill] ${i + 1}/${codes.length} ${code}`)
    const result = await backfillCode(db, code, windows, args, dataset)
    rows += result.rows
    if (result.ok) ok++
    else failed++
  }

  console.log(`[price-backfill] done ok=${ok} failed=${failed} rows=${rows}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exitCode = 1
})
