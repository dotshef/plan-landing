'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { normalizePhone } from '@/lib/phone'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

type TrafficSource = 'google' | 'naver' | 'unknown'

interface AdAttribution {
  trafficSource: TrafficSource
  adKeyword: string | null
  adCampaignId: string | null
  adCampaignLabel: string | null
  landingUrl: string | null
}

const ATTRIBUTION_STORAGE_KEY = 'report_ad_attribution'

const UNKNOWN_ATTRIBUTION: AdAttribution = {
  trafficSource: 'unknown',
  adKeyword: null,
  adCampaignId: null,
  adCampaignLabel: null,
  landingUrl: null,
}

function detectAdAttribution(search: string, href: string): AdAttribution {
  const params = new URLSearchParams(search)
  const isGoogle = ['gclid', 'gbraid', 'wbraid', 'gad_campaignid']
    .some((key) => params.has(key))
  const isNaver = ['n_media', 'n_ad_group', 'n_ad', 'napm']
    .some((key) => params.has(key))

  if (isGoogle === isNaver) {
    return UNKNOWN_ATTRIBUTION
  }

  const landingUrl = href.slice(0, 2000) || null

  if (isGoogle) {
    return {
      trafficSource: 'google',
      adKeyword: null,
      adCampaignId: params.get('gad_campaignid')?.trim().slice(0, 100) || null,
      adCampaignLabel: params.get('c')?.trim().slice(0, 100) || null,
      landingUrl,
    }
  }

  return {
    trafficSource: 'naver',
    adKeyword: params.get('n_query')?.trim().slice(0, 200) || null,
    adCampaignId: null,
    adCampaignLabel: null,
    landingUrl,
  }
}

function readStoredAdAttribution(): AdAttribution {
  if (typeof window === 'undefined') {
    return UNKNOWN_ATTRIBUTION
  }

  try {
    const stored = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (!stored) return detectAdAttribution(window.location.search, window.location.href)

    const parsed = JSON.parse(stored) as Partial<AdAttribution>
    const landingUrl = typeof parsed.landingUrl === 'string'
      ? parsed.landingUrl.slice(0, 2000) || null
      : null
    if (parsed.trafficSource === 'google') {
      return {
        trafficSource: 'google',
        adKeyword: null,
        adCampaignId: typeof parsed.adCampaignId === 'string'
          ? parsed.adCampaignId.trim().slice(0, 100) || null
          : null,
        adCampaignLabel: typeof parsed.adCampaignLabel === 'string'
          ? parsed.adCampaignLabel.trim().slice(0, 100) || null
          : null,
        landingUrl,
      }
    }
    if (parsed.trafficSource === 'naver') {
      return {
        trafficSource: 'naver',
        adKeyword: typeof parsed.adKeyword === 'string'
          ? parsed.adKeyword.trim().slice(0, 200) || null
          : null,
        adCampaignId: null,
        adCampaignLabel: null,
        landingUrl,
      }
    }
  } catch {
    // 저장소를 사용할 수 없거나 값이 손상된 경우 기타 유입으로 제출한다.
  }

  return UNKNOWN_ATTRIBUTION
}

/**
 * 무료 리포트 신청 폼의 상태·검증·휴대폰 인증·제출 로직.
 * 세로형 ApplicationPanel과 가로형 CompactLeadFormSection이 공유한다.
 */
export function useReportRequest(defaultStock = '') {
  const [form, setForm] = useState({ name: '', phone: '', stock: defaultStock, privacy: true, agree: true })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 휴대폰 인증 상태
  const [codeSent, setCodeSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [code, setCode] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)

  // 같은 탭에서 최초로 확인된 광고 유입 정보만 세션 동안 유지한다.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)) return

      const attribution = detectAdAttribution(window.location.search, window.location.href)
      if (attribution.trafficSource !== 'unknown') {
        window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution))
      }
    } catch {
      // 브라우저 설정으로 sessionStorage가 차단되어도 신청 기능은 계속 제공한다.
    }
  }, [])

  // 만료 카운트다운
  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  // ── Cloudflare Turnstile (봇 방지) ─────────────────────────────
  const turnstileRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const tokenResolverRef = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null)
  const tokenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTokenTimeout() {
    if (tokenTimeoutRef.current) {
      clearTimeout(tokenTimeoutRef.current)
      tokenTimeoutRef.current = null
    }
  }

  // 스크립트 로드 후 위젯을 1회 렌더 (interaction-only: 체크박스가 필요한 방문자에게만 표시)
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    const iv = setInterval(() => {
      const ts = window.turnstile
      if (!ts || !turnstileRef.current || widgetIdRef.current) return
      clearInterval(iv)
      widgetIdRef.current = ts.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        appearance: 'interaction-only',
        size: 'flexible',
        execution: 'execute',
        callback: (token) => {
          clearTokenTimeout()
          tokenResolverRef.current?.resolve(token)
          tokenResolverRef.current = null
        },
        'error-callback': () => {
          clearTokenTimeout()
          tokenResolverRef.current?.reject(new Error('turnstile-error'))
          tokenResolverRef.current = null
        },
        'expired-callback': () => {
          clearTokenTimeout()
          tokenResolverRef.current?.reject(new Error('turnstile-expired'))
          tokenResolverRef.current = null
        },
        // 인터랙티브 챌린지가 Cloudflare 자체 제한 시간 내 완료되지 않은 경우
        'timeout-callback': () => {
          clearTokenTimeout()
          tokenResolverRef.current?.reject(new Error('turnstile-interactive-timeout'))
          tokenResolverRef.current = null
        },
        // 체크박스가 표시되는 순간 — 사용자가 완료할 시간을 갖도록 15초 타임아웃 해제
        'before-interactive-callback': () => {
          clearTokenTimeout()
          setErrors((p) => ({ ...p, code: '보안 확인이 표시되었습니다. 확인을 완료하면 자동으로 진행됩니다' }))
        },
      })
    }, 200)
    return () => clearInterval(iv)
  }, [])

  // 발송 직전 챌린지를 실행해 1회용 토큰을 받는다. 로드 실패/타임아웃 시 reject → 발송 차단.
  function getTurnstileToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      const ts = window.turnstile
      if (!ts || !widgetIdRef.current) {
        reject(new Error('turnstile-not-ready'))
        return
      }
      tokenResolverRef.current = { resolve, reject }
      try {
        ts.reset(widgetIdRef.current)
        ts.execute(widgetIdRef.current)
      } catch (e) {
        tokenResolverRef.current = null
        reject(e as Error)
        return
      }
      // 체크박스가 뜨면 before-interactive-callback이 이 타이머를 해제한다
      tokenTimeoutRef.current = setTimeout(() => {
        tokenTimeoutRef.current = null
        if (tokenResolverRef.current) {
          tokenResolverRef.current = null
          reject(new Error('turnstile-timeout'))
        }
      }, 15000)
    })
  }

  const phoneValid = normalizePhone(form.phone) !== null
  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  // 연락처 입력 변경 — 숫자만 유지하고 인증 상태 초기화
  function handlePhoneChange(raw: string) {
    const next = raw.replace(/\D/g, '').slice(0, 11)
    setForm((p) => ({ ...p, phone: next }))
    setCodeSent(false); setVerified(false); setCode(''); setSecondsLeft(0)
  }

  async function handleSendCode() {
    if (!form.name.trim()) { setErrors((p) => ({ ...p, name: '이름을 입력해주세요' })); return }
    if (!phoneValid) { setErrors((p) => ({ ...p, phone: '올바른 연락처를 입력해주세요' })); return }
    setSending(true)
    setErrors((p) => ({ ...p, phone: '', code: '' }))
    try {
      // 봇 방지 토큰 획득 — 실패(로드 실패 포함) 시 발송 차단
      let turnstileToken: string
      try {
        turnstileToken = await getTurnstileToken()
      } catch {
        setErrors((p) => ({ ...p, code: '봇 방지 검증을 완료하지 못했습니다. 페이지를 새로고침 후 다시 시도해주세요' }))
        return
      }
      // 체크박스 안내 문구가 표시됐었다면 제거
      setErrors((p) => ({ ...p, code: '' }))
      const res = await fetch('/api/sms/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone, turnstileToken }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrors((p) => ({ ...p, code: result.error ?? '인증번호 발송에 실패했습니다' }))
        return
      }
      setCodeSent(true)
      setVerified(false)
      setCode('')
      setSecondsLeft(Math.floor((result.ttlMs ?? 180000) / 1000))
    } catch {
      setErrors((p) => ({ ...p, code: '네트워크 오류가 발생했습니다' }))
    } finally {
      setSending(false)
    }
  }

  async function handleVerifyCode() {
    if (!/^\d{6}$/.test(code)) { setErrors((p) => ({ ...p, code: '인증번호 6자리를 입력해주세요' })); return }
    setVerifying(true)
    setErrors((p) => ({ ...p, code: '' }))
    try {
      const res = await fetch('/api/sms/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, code }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrors((p) => ({ ...p, code: result.error ?? '인증에 실패했습니다' }))
        return
      }
      setVerified(true)
      setSecondsLeft(0)
    } catch {
      setErrors((p) => ({ ...p, code: '네트워크 오류가 발생했습니다' }))
    } finally {
      setVerifying(false)
    }
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = '이름을 입력해주세요'
    if (!form.phone.trim()) e.phone = '연락처를 입력해주세요'
    else if (!phoneValid) e.phone = '올바른 연락처를 입력해주세요'
    else if (!verified) e.code = '휴대폰 인증을 완료해주세요'
    if (!form.privacy) e.privacy = '개인정보 수집·이용에 동의해주세요'
    if (!form.agree) e.agree = '마케팅 정보 수신에 동의해주세요'
    return e
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setErrors({})

    try {
      const attribution = readStoredAdAttribution()
      const response = await fetch('/api/report-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          stock: form.stock,
          trafficSource: attribution.trafficSource,
          adKeyword: attribution.adKeyword,
          adCampaignId: attribution.adCampaignId,
          adCampaignLabel: attribution.adCampaignLabel,
          landingUrl: attribution.landingUrl,
        }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setErrors({ submit: result.error ?? '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' })
        return
      }

      setSubmitted(true)

      const eventId = `report_request_${
        globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`
      }`

      // GTM 맞춤 이벤트 트리거용 (상담/리포트 신청 완료)
      if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({ event: 'consultation_complete' })
      }

      // Google Ads 전환 측정 (리드 양식 제출)
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: 'AW-17776841330/qmgOCOLvgtAcEPKk1JxC',
          value: 100,
          currency: 'KRW',
        })
      }

      // OpenAI Ads measurement pixel (lead submission)
      if (typeof window !== 'undefined' && typeof window.oaiq === 'function') {
        window.oaiq(
          'measure',
          'lead_created',
          {
            type: 'contents',
            amount: 100,
            currency: 'KRW',
          },
          {
            event_id: eventId,
          },
        )
      }

      // 네이버 프리미엄 로그분석 전환 측정 (신청완료/lead)
      if (typeof window !== 'undefined' && window.wcs) {
        window.wcs_add = window.wcs_add || {}
        window.wcs_add['wa'] = 's_68759ef9d7a'
        window.wcs.trans({ type: 'lead' })
      }
    } catch {
      setErrors({ submit: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' })
    } finally {
      setSubmitting(false)
    }
  }

  return {
    form, setForm,
    submitted, submitting, errors,
    codeSent, sending, verifying, verified, code, setCode, secondsLeft,
    phoneValid, mmss,
    handlePhoneChange, handleSendCode, handleVerifyCode, handleSubmit,
    turnstileRef,
  }
}
