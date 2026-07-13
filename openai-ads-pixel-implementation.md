# OpenAI Ads Measurement Pixel Implementation

## 목적

GPT 광고 성과 측정을 위해 OpenAI Ads 측정 픽셀을 사이트에 설치하고, 무료 리포트 신청이 정상 완료되었을 때 브라우저 전환 이벤트를 전송한다.

현재 프로젝트에는 Google Ads 추적 코드는 있지만 OpenAI Ads 측정 픽셀(`oaiq`) 관련 코드는 없다.

## 적용 기준

- Pixel ID: `JYM2uogRGo6SA8nYb1Ff3g`
- 전환 이벤트명: `lead_created`
- 전환 기준: 무료 리포트 신청 API가 성공 응답을 반환한 직후
- 이벤트 값:
  - `type`: `contents`
  - `amount`: `0`
  - `currency`: `KRW`
- `event_id`: 신청 1건마다 고유한 값

제공받은 예시의 `order_created`, `amount: 12999`, `currency: "USD"`, `event_id: "order_12345"`는 주문/결제 서비스용 샘플 값으로 보고, 현재 서비스의 무료 리드 신청 흐름에 맞게 `lead_created`로 적용한다.

## 1. 전역 픽셀 설치

파일: `src/app/layout.tsx`

기존 Google tag 설치 코드 근처에 OpenAI Ads 픽셀 초기화 코드를 추가한다. Next.js App Router 프로젝트이므로 raw `<script>`를 직접 넣기보다 `next/script`를 사용한다.

```tsx
{/* OpenAI Ads measurement pixel */}
<Script id="openai-ads-pixel-init" strategy="afterInteractive">
  {`window.oaiq = window.oaiq || function () {
      (window.oaiq.q = window.oaiq.q || []).push(arguments);
    };
    oaiq("init", { pixelId: "JYM2uogRGo6SA8nYb1Ff3g" });`}
</Script>
<Script
  src="https://bzrcdn.openai.com/sdk/oaiq.min.js"
  strategy="afterInteractive"
/>
```

## 2. Window 타입 선언 추가

파일: `src/types/tracking.d.ts`

기존 `gtag` 타입과 함께 `oaiq` 타입을 추가한다.

```ts
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    oaiq?: {
      (...args: unknown[]): void
      q?: unknown[][]
    }
  }
}

export {}
```

`oaiq.q`는 SDK가 로드되기 전 호출을 큐에 쌓기 위해 초기화 스니펫에서 사용하는 속성이다.

## 3. 전환 이벤트 발송

파일: `src/hooks/useReportRequest.ts`

현재 무료 리포트 신청 성공 처리는 `handleSubmit` 내부의 `response.ok` 확인 이후에 있다. 기존 Google Ads 전환 이벤트와 같은 성공 조건에서 OpenAI Ads 전환 이벤트를 발송한다.

```ts
setSubmitted(true)

const eventId =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `report_request_${crypto.randomUUID()}`
    : `report_request_${Date.now()}`

if (typeof window !== 'undefined' && typeof window.oaiq === 'function') {
  window.oaiq(
    'measure',
    'lead_created',
    {
      type: 'contents',
      amount: 0,
      currency: 'KRW',
    },
    {
      event_id: eventId,
    },
  )
}
```

## 구현 시 주의사항

- 신청 API가 실패했을 때는 전환 이벤트를 보내지 않는다.
- 폼 검증 실패, 휴대폰 인증 실패, 네트워크 오류는 전환으로 기록하지 않는다.
- `event_id`는 고정 문자열을 사용하지 않는다.
- 이름, 휴대폰 번호, 관심 종목 등 개인정보 또는 사용자가 입력한 값은 픽셀 payload에 포함하지 않는다.
- Google Ads 전환 이벤트는 그대로 유지하고, OpenAI Ads 이벤트만 추가한다.

## 검증 방법

1. `npm run lint`로 타입 및 린트 오류를 확인한다.
2. 로컬 또는 배포 환경에서 페이지 접속 후 Network 탭에서 `https://bzrcdn.openai.com/sdk/oaiq.min.js`가 로드되는지 확인한다.
3. 무료 리포트 신청을 정상 완료한다.
4. 브라우저 콘솔 또는 Network 탭에서 `lead_created` 전환 호출이 발생하는지 확인한다.
5. 광고 관리자 화면에서 전환 수집 상태를 확인한다. 광고 플랫폼 집계에는 지연이 있을 수 있다.

