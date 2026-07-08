// stock 시드 CSV 생성 (DB·시크릿 미접근 — 순수 변환).
// stock-master.ts 스냅샷 → scripts/stock-seed.csv
// 실행: npx tsx scripts/export-stock-csv.ts
// 이후 Supabase 대시보드 Table Editor에서 stock 테이블에 CSV import.
//
// cron 수집 유니버스 = 주권(ST)만. ETF/ETN/리츠/수익증권 등은 수집 대상이 아니라 시드에서 제외.
// (우선주는 ST라 포함 — is_common으로 top_view 표시에서만 제외됨)
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MASTER } from '../src/lib/kis/stock-master'

// is_common(generated)·industry(야간 수집)는 넣지 않음.
const HEADER = ['code', 'name', 'group_code', 'market'] as const

const esc = (v: unknown): string => {
  const s = String(v ?? '')
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const lines = [HEADER.join(',')]
let count = 0
for (const [code, [name, group, market]] of Object.entries(MASTER)) {
  if (group !== 'ST') continue // 주권만
  lines.push([code, name, group, market].map(esc).join(','))
  count++
}

const dir = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(dir, 'stock-seed.csv')
fs.writeFileSync(out, lines.join('\n'), 'utf-8') // BOM 없이 UTF-8

console.log(`✅ 주권(ST) ${count}종목 → ${out}`)
