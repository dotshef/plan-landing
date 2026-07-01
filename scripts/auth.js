const fs = require('fs')
const path = require('path')

const BASE_URL = 'https://openapi.koreainvestment.com:9443'
const CACHE_FILE = path.join(__dirname, '.token-cache.json')

function loadEnv() {
  const envPath = path.join(__dirname, '../.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
  }
}

async function getToken() {
  loadEnv()

  if (fs.existsSync(CACHE_FILE)) {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
    if (Date.now() < cache.expires_at) {
      return cache.access_token
    }
  }

  const res = await fetch(`${BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: process.env.KIS_APP_KEY,
      appsecret: process.env.KIS_APP_SECRET,
    }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`토큰 발급 실패 ${res.status}: ${text}`)

  const data = JSON.parse(text)
  if (!data.access_token) throw new Error(`토큰 없음: ${text}`)

  const cache = {
    access_token: data.access_token,
    expires_at: Date.now() + 23 * 60 * 60 * 1000, // 23시간 캐시
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
  console.log('✅ 토큰 발급 완료 (23h 캐시)')
  return data.access_token
}

module.exports = { getToken, BASE_URL, loadEnv }
