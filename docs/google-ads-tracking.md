# 구글 광고(Google Ads) 전환 추적 설치 가이드

광고 성과(신청 완료 = 전환)를 측정하기 위해 gtag.js를 설치한다.
제공받은 형태는 순수 HTML `<script>` 태그이지만, 이 프로젝트는 **Next.js 16 App Router**이므로
`<head>`에 raw `<script>`를 직접 넣는 대신 `next/script` 컴포넌트를 사용한다.

## 제공받은 값

| 항목 | 값 |
|------|------|
| 전환 ID | `AW-17776841330` |
| 전환 라벨(send_to) | `AW-17776841330/k1mnCOi70N8bEPKk1JxC` |
| 전환명 | 리드 양식 제출 |

---

## 1. 기본 태그(gtag.js) — 전역 로드

### 위치
- 파일: [`src/app/layout.tsx`](../src/app/layout.tsx)
- 지점: `RootLayout`의 `<body>` 내부 (기존 `<Analytics />` 옆)

### 이유
- 원본 안내는 "닫는 `</head>` 태그 이전"이지만, App Router에는 우리가 직접 만지는 `<head>`가 없다.
- `next/script`를 `strategy="afterInteractive"`로 쓰면 Next가 알아서 문서 상단에 주입하며,
  초기 렌더를 막지 않으면서 모든 페이지에서 **한 번만** 로드된다.
- 방문·페이지뷰 수집과 리마케팅 모수 확보를 담당한다.

### 코드

```tsx
// src/app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${maruBuri.variable}`}>
      <body className="font-sans">
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17776841330"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17776841330');`}
        </Script>

        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
```

> 참고: 원본 HTML의 `async`, `window.dataLayer`, `gtag('config', ...)` 로직은
> 위 `next/script` 두 개로 1:1 대응된다. 내용은 그대로이고 감싸는 방식만 바뀐 것.

---

## 2. 전환 이벤트(conversion) — 신청 완료 시점

### 위치
- 파일: [`src/components/report/ApplicationPanel.tsx`](../src/components/report/ApplicationPanel.tsx)
- 지점: `handleSubmit` 안에서 신청이 성공한 직후 — `setSubmitted(true)` ([현재 117번째 줄](../src/components/report/ApplicationPanel.tsx#L117)) 바로 옆

### 이유
- 기본 태그만으로는 "방문"만 잡히고, **"신청 완료"라는 실제 성과**는 잡히지 않는다.
- 원본 안내의 "전환 페이지"에 해당하는 지점이 이 프로젝트에서는 별도 완료 페이지가 아니라
  **폼 제출 성공 상태(`submitted = true`)** 이다. 따라서 그 순간에 이벤트를 직접 호출한다.
- API 응답이 `ok`일 때만 호출해야 실패 건이 전환으로 잡히지 않는다.

### 코드

```tsx
// src/components/report/ApplicationPanel.tsx > handleSubmit

if (!response.ok) {
  setErrors({ submit: result.error ?? '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' })
  return
}

setSubmitted(true)

// Google Ads 전환 측정 (리드 양식 제출)
if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
  window.gtag('event', 'conversion', {
    send_to: 'AW-17776841330/k1mnCOi70N8bEPKk1JxC',
    value: 1.0,
    currency: 'KRW',
  })
}
```

### 타입 처리 (TypeScript)
`window.gtag`는 기본 타입에 없으므로 전역 선언을 한 번 추가한다.
`src/types/gtag.d.ts` 같은 파일을 만들거나 컴포넌트 상단에 선언한다.

```ts
// src/types/gtag.d.ts
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}
export {}
```

---

## 정리표

| # | 넣는 것 | 파일 | 위치 | 역할 |
|---|---------|------|------|------|
| ① | gtag.js 기본 태그 | `src/app/layout.tsx` | `<body>` 내부 | 방문·페이지뷰 수집, 리마케팅 모수 |
| ② | `conversion` 이벤트 | `src/components/report/ApplicationPanel.tsx` | `setSubmitted(true)` 직후 | 신청 완료 = 광고 성과 측정 |
| ③ | `Window.gtag` 타입 선언 | `src/types/gtag.d.ts` | 신규 파일 | TS 빌드 에러 방지 |

## 검증 방법
1. 배포 후 Chrome 확장 **Google Tag Assistant**로 태그 로드 확인.
2. 실제로 신청 폼을 제출해 `conversion` 이벤트가 발생하는지 확인.
3. Google Ads → 목표(전환) 화면에서 상태가 "활성"으로 바뀌는지 확인 (집계까지 수 시간 소요될 수 있음).

## 주의
- 전환 이벤트는 **성공 응답(`response.ok`) 직후에만** 호출한다. 검증 실패·네트워크 오류 시 호출 금지.
- 값(`value: 1.0`, `currency: 'KRW'`)은 제공받은 스니펫 그대로 유지. 리드 1건의 가치를 다르게 잡고 싶으면 이 숫자만 조정.
- 개인정보(이름·연락처)는 절대 gtag 파라미터에 넣지 않는다.
