import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// tsx 스크립트는 .env를 자동 로드하지 않음 → 수동 주입.
export function loadEnv(): void {
  const dir = path.dirname(fileURLToPath(import.meta.url))
  const envPath = path.join(dir, '..', '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    const key = trimmed.slice(0, idx).trim()
    if (!process.env[key]) process.env[key] = trimmed.slice(idx + 1).trim()
  }
}
