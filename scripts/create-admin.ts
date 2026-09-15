// 최초 관리자 계정 생성 스크립트 (1회 실행용)
// 사용법: npm run admin:create -- <이메일> <비밀번호> [이름]
// .env의 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY를 사용한다.
// 마이그레이션에 계정을 심지 않는 대신 이 스크립트로 생성한다(구현계획 §4.4).

import { readFileSync } from 'node:fs'
import { randomBytes, scrypt as scryptCb, type ScryptOptions } from 'node:crypto'

function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key)))
  })
}

// src/lib/admin/password.ts 와 동일 포맷 (N$r$p$salt$hash)
async function hashPassword(password: string): Promise<string> {
  const N = 16384, R = 8, P = 1
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, 64, { N, r: R, p: P, maxmem: 128 * 1024 * 1024 })
  return `${N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`
}

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  try {
    for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) env[m[1]] = m[2].trim()
    }
  } catch {
    // .env 없으면 process.env만 사용
  }
  return { ...env, ...(process.env as Record<string, string>) }
}

async function main() {
  const [email, password, name] = process.argv.slice(2)
  if (!email || !password) {
    console.error('사용법: npm run admin:create -- <이메일> <비밀번호> [이름]')
    process.exit(1)
  }
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    console.error('비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다.')
    process.exit(1)
  }

  const env = loadEnv()
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.')
    process.exit(1)
  }

  const res = await fetch(`${url}/rest/v1/user`, {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      name: name ?? null,
      password_hash: await hashPassword(password),
      must_change_password: false,
    }),
  })

  if (!res.ok) {
    console.error(`생성 실패 (${res.status}):`, await res.text())
    process.exit(1)
  }
  const [row] = (await res.json()) as { id: number; email: string }[]
  console.log(`관리자 생성 완료: #${row.id} ${row.email}`)
  console.log('로그인: https://www.plankor.kr/admin/login')
}

void main()
