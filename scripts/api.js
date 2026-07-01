const { getToken, BASE_URL, loadEnv } = require('./auth')

async function kisGet(urlPath, params, trId) {
  loadEnv()
  const token = await getToken()

  const url = new URL(BASE_URL + urlPath)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString(), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      authorization: `Bearer ${token}`,
      appkey: process.env.KIS_APP_KEY,
      appsecret: process.env.KIS_APP_SECRET,
      tr_id: trId,
    },
  })

  const data = await res.json()
  if (data.rt_cd !== '0') {
    throw new Error(`[${trId}] ${data.msg_cd}: ${data.msg1}`)
  }
  return data
}

module.exports = { kisGet }
