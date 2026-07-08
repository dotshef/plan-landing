// stock 시드 CSV 생성 (DB·시크릿 미접근 — 순수 변환).
// stock-master.ts 스냅샷 → scripts/stock-seed.csv
// 실행: npx tsx scripts/export-stock-csv.ts
// 이후 Supabase 대시보드 Table Editor에서 stock 테이블에 CSV import.
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
for (const [code, [name, group, market]] of Object.entries(MASTER)) {
  lines.push([code, name, group, market].map(esc).join(','))
}

const dir = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(dir, 'stock-seed.csv')
fs.writeFileSync(out, lines.join('\n'), 'utf-8') // BOM 없이 UTF-8

console.log(`✅ ${lines.length - 1}종목 → ${out}`)
