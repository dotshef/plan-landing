'use client'

import { useEffect, useState, type FormEvent } from 'react'

type TrafficSource = 'google' | 'naver' | 'unknown'

interface AdAttribution {
  trafficSource: TrafficSource
  adKeyword: string | null
  adCampaignId: string | null
  landingUrl: string | null
}

const ATTRIBUTION_STORAGE_KEY = 'report_ad_attribution'

const UNKNOWN_ATTRIBUTION: AdAttribution = {
  trafficSource: 'unknown',
  adKeyword: null,
  adCampaignId: null,
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
      landingUrl,
    }
  }

  return {
    trafficSource: 'naver',
    adKeyword: params.get('n_query')?.trim().slice(0, 200) || null,
    adCampaignId: null,
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

  const phoneValid = /^\d{10,11}$/.test(form.phone)
  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  // 연락처 입력 변경 — 숫자만 유지하고 인증 상태 초기화
  function handlePhoneChange(raw: string) {
    const next = raw.replace(/\D/g, '').slice(0, 11)
    setForm((p) => ({ ...p, phone: next }))
    setCodeSent(false); setVerified(false); setCode(''); setSecondsLeft(0)
  }

  async function handleSendCode() {
    if (!phoneValid) { setErrors((p) => ({ ...p, phone: '올바른 연락처를 입력해주세요' })); return }
    setSending(true)
    setErrors((p) => ({ ...p, phone: '', code: '' }))
    try {
      const res = await fetch('/api/sms/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
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
  }
}
