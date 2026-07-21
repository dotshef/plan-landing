# Egress Gateway API 안내 (클라이언트 연동 가이드)

> 작성일: 2026-07-20
> 대상: 게이트웨이를 통해 SMS를 발송하려는 앞단 서버(랜딩/대시보드) 개발자.
> 이 문서만 보고 연동 코드를 작성할 수 있도록 필요한 내용을 모두 담았다.

## 1. 개요

게이트웨이는 고정 IP가 필요한 서드파티 API(알리고 SMS)를 대신 호출해 주는 아웃바운드 전용 서버다.
클라이언트는 알리고 크리덴셜 없이, 발급받은 API 키 하나로 게이트웨이만 호출하면 된다.

```
앞단 서버 ──(HTTPS + x-api-key)──▶ egress-gateway ──▶ apis.aligo.in
```

**반드시 서버에서만 호출할 것.** API 키가 브라우저(클라이언트 사이드 JS)에 노출되면 안 된다.

## 2. 접속 정보와 환경변수

클라이언트 프로젝트에 아래 두 환경변수를 설정한다 (값은 게이트웨이 운영자에게 발급받는다):

| 변수 | 예시 | 설명 |
|---|---|---|
| `EGRESS_GATEWAY_URL` | `https://egress-gateway-xxx.vercel.app` | 게이트웨이 베이스 URL (끝에 `/` 없음) |
| `EGRESS_GATEWAY_KEY` | 64자 hex 문자열 | 프로젝트 전용 API 키 |

기존에 쓰던 `ALIGO_API_KEY` / `ALIGO_USER_ID` / `ALIGO_SENDER`는 **제거한다** — 게이트웨이에만 존재해야 한다.

## 3. 인증

모든 요청(`/health` 제외)에 `x-api-key` 헤더로 키를 담아 보낸다:

```
x-api-key: <EGRESS_GATEWAY_KEY>
```

키는 클라이언트(프로젝트)별로 다르며, 키마다 허용된 스코프(경로)가 정해져 있다.
현재 스코프는 `sms` 하나이고, 추후 다른 아웃바운드 API가 추가되면 스코프가 늘어난다.

## 4. 공통 규칙

- 요청/응답 본문은 모두 JSON (`Content-Type: application/json`)
- 오류 응답은 전부 `{ "error": string }` 형태로 통일
- 상태 코드 의미:

| 상태 | 의미 | 클라이언트가 할 일 |
|---|---|---|
| 200 | 게이트웨이·알리고 통신 성공 (**알리고가 거부한 경우 포함** — `ok` 필드 확인) | `ok`/`resultCode`로 성패 판별 후 기록 |
| 400 | 요청 본문 검증 실패 (`error`에 상세) | 요청 데이터 수정. 재시도 무의미 |
| 401 | 키 없음 또는 불일치 | 환경변수 확인. 재시도 무의미 |
| 403 | 키는 유효하나 해당 경로 권한 없음 | 게이트웨이 운영자에게 스코프 요청 |
| 502 | 게이트웨이→알리고 네트워크 오류 또는 응답 파싱 불가 | §5.4 재시도 주의사항 참고 |

## 5. 엔드포인트

### 5.1 `GET /health`

인증 불필요. 게이트웨이 생존 확인용 (업타임 모니터링에 사용).

```
200 { "ok": true }
```

### 5.2 `POST /sms`

알리고 문자보내기 API를 대신 호출한다.

**요청 본문**:

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `receiver` | string | O | 숫자만 9~12자리. 하이픈 제거 후 전송 (`/^[0-9]{9,12}$/`) |
| `msg` | string | O | 1자 이상. 90바이트 초과 시 알리고가 LMS로 자동 전환 |
| `msgType` | `"SMS" \| "LMS" \| "MMS"` | X | 미지정 시 알리고가 자동 판별 |
| `title` | string | X | LMS/MMS 제목 |

**200 응답** (`SmsResponse`):

| 필드 | 타입 | 설명 |
|---|---|---|
| `ok` | boolean | `resultCode === 1` 여부 (알리고 성공 코드) |
| `resultCode` | number | 알리고 result_code (실패 원인 판별용) |
| `message` | string | 알리고 응답 메시지 |
| `msgId` | number? | 알리고 메시지 ID (성공 시) |

**호출 예시**:

```bash
curl -X POST "$EGRESS_GATEWAY_URL/sms" \
  -H "x-api-key: $EGRESS_GATEWAY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"receiver":"01012345678","msg":"[서비스명] 인증번호는 123456 입니다."}'
```

```jsonc
// 성공
{ "ok": true, "resultCode": 1, "message": "success", "msgId": 123456789 }
// 알리고 거부 (예: 발신번호 미등록) — 상태 코드는 200
{ "ok": false, "resultCode": -101, "message": "인증오류입니다." }
```

### 5.3 오류 전달 방식 (중요)

알리고에서 발생하는 오류는 **전부 클라이언트까지 전달된다**:

- **알리고가 거부** (잔액 부족, 발신번호 미등록 등) → `200` + `ok: false` + 알리고의 `resultCode`/`message` 원문
- **알리고 통신 실패** (네트워크 오류, 응답 파싱 불가) → `502` + `error`에 상세 메시지(알리고 원문 응답 일부 포함)

게이트웨이에는 DB가 없으므로 **발송 결과의 영구 기록은 클라이언트 책임이다.**
200 응답의 `SmsResponse`와 502/네트워크 예외를 모두 자체 DB에 기록할 것 (기존 알리고 직접 호출 시절과 동일한 책임 구조).

### 5.4 재시도 주의사항

- `400`/`401`/`403`: 재시도해도 결과가 같다. 원인 수정이 먼저다.
- `502`: **무조건 재시도하지 말 것.** 알리고 응답 "파싱 실패"의 경우 실제 발송은 성공했을 수 있다 (중복 발송 위험). 재시도가 필요하면 수신자에게 중복 발송돼도 무방한 메시지인지 판단 후 수행한다.
- `200` + `ok: false`: 알리고가 명시적으로 거부한 것. `resultCode`로 원인을 확인하고 코드/설정을 수정한다.

## 6. 연동 코드 (복사해서 사용)

기존 `src/lib/sms/aligo.ts`를 아래 `src/lib/sms/gateway.ts`로 교체한다. 함수 형태(입력 → `Promise<응답>`)가 기존과 동일하므로 호출부는 타입명만 맞추면 된다 (기존 `SendSmsInput`/`SendSmsResult`를 쓰고 있었다면 `SmsRequest`/`SmsResponse`로 일괄 치환):

```ts
export interface SmsRequest {
  receiver: string
  msg: string
  msgType?: 'SMS' | 'LMS' | 'MMS'
  title?: string
}

export interface SmsResponse {
  ok: boolean
  resultCode: number
  message: string
  msgId?: number
}

export async function sendSms(input: SmsRequest): Promise<SmsResponse> {
  const url = process.env.EGRESS_GATEWAY_URL
  const key = process.env.EGRESS_GATEWAY_KEY
  if (!url || !key) {
    throw new Error('EGRESS_GATEWAY_URL / EGRESS_GATEWAY_KEY 환경변수가 필요합니다.')
  }

  const res = await fetch(`${url}/sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Egress gateway 오류: ${res.status} ${await res.text()}`)
  return res.json() as Promise<SmsResponse>
}
```

## 7. 키 관리 수칙

- 키는 **서버 환경변수에만** 둔다. 저장소 커밋 금지, `NEXT_PUBLIC_` 등 클라이언트 노출 prefix 금지
- 키는 프로젝트별로 다르다. 다른 프로젝트와 공유하지 말 것 (사용 추적·차단이 프로젝트 단위로 이루어진다)
- 키 유출이 의심되면 즉시 게이트웨이 운영자에게 알려 재발급받는다 (게이트웨이 환경변수 교체 + 재배포로 즉시 무효화 가능)

## 8. 테스트

게이트웨이가 `ALIGO_TESTMODE=Y`로 배포된 환경에서는 실발송 없이 전체 플로우를 검증할 수 있다.
운영 게이트웨이는 실발송이므로, 연동 테스트는 반드시 운영자와 협의된 환경에서 수행할 것.
