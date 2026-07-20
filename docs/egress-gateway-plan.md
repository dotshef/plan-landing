# Egress Gateway 구현 계획

> 작성일: 2026-07-20
> 상태: 설계 확정, 구현 대기

## 배경

- 알리고 SMS API는 발신 서버의 **고정 IP 등록**이 필요하다.
- 현재 이 프로젝트(plan-landing) 하나를 위해 Vercel Static IPs(월 $100)를 결제 중이다.
- 앞으로 여러 프로젝트(A랜딩, B랜딩, C대시보드)가 알리고를 사용하고, C대시보드는 디비포스 API(역시 고정 IP 필요)도 사용할 예정이다.
- 프로젝트마다 Static IPs를 결제하는 대신, **아웃바운드 전용 공통 서버(Egress Gateway)** 하나로 집약한다.

### 확정된 결정

| 항목 | 결정 | 비고 |
|---|---|---|
| 명칭 | Egress Gateway | 단순 릴레이가 아닌 도메인 API 방식 (B 전략) |
| 배포 | Vercel 새 프로젝트 + Static IPs | $100는 게이트웨이 한 곳으로 집약. 속도 우선으로 VPS 대신 Vercel 선택 |
| 프레임워크 | Hono + Node (TypeScript) | 기존 프로젝트들과 같은 TS 생태계, 타입 공유 가능 |
| 로그 저장 | PostgreSQL | Neon 또는 Vercel Postgres — 서버리스용 HTTP 드라이버 사용 |
| 1차 범위 | 알리고 SMS만 | 디비포스는 스코프 자리만 잡아두고 추후 구현 |

### 비용 구조의 의미

이 아키텍처의 효과는 "$100 제거"가 아니라 "**$100를 게이트웨이 한 곳으로 집약**"이다.
A·B·C 각 프로젝트는 Static IPs 없이 게이트웨이만 호출하므로, 프로젝트가 늘수록 절감 효과가 커진다.
$100 자체를 없애려면 $5 VPS로 가야 하지만, 지금은 구축 속도를 우선하여 Vercel을 유지한다.

## 1. 아키텍처

```
A랜딩 ──┐
B랜딩 ──┤──(HTTPS + x-api-key)──▶ egress-gateway (Vercel + Static IPs) ──▶ apis.aligo.in
C대시 ──┘                              │                                  └▶ (추후) 디비포스
                                       └──▶ PostgreSQL (요청 로그 + 발송 이력)
```

원칙:

- 각 프로젝트는 알리고를 모른다. 게이트웨이의 `/sms`만 호출한다.
- `ALIGO_API_KEY` 등 서드파티 크리덴셜은 **게이트웨이 환경변수에만** 존재한다.
- 클라이언트(프로젝트)별 API 키 + 스코프로 권한을 검사하고, 스코프 불일치 시 403을 반환한다.
- 모든 요청(거부 포함)과 발송 이력을 Postgres에 기록한다.

## 2. 프로젝트 구성 (새 저장소 `egress-gateway`)

```
egress-gateway/
├── api/index.ts            # Vercel 엔트리 (hono/vercel 어댑터)
├── src/
│   ├── app.ts              # Hono 앱 조립 (미들웨어 + 라우트)
│   ├── middleware/
│   │   ├── auth.ts         # API 키 검증 + 스코프 검사 (401/403)
│   │   └── log.ts          # 요청/응답 로깅 → Postgres
│   ├── routes/
│   │   ├── health.ts       # GET /health
│   │   └── sms.ts          # POST /sms
│   ├── services/
│   │   └── aligo.ts        # plan-landing의 src/lib/sms/aligo.ts가 이사 오는 곳
│   ├── db.ts               # Postgres 클라이언트 (Neon serverless driver)
│   └── clients.ts          # 클라이언트 키 → { name, scopes } 매핑
├── drizzle/ 또는 sql/      # 스키마 마이그레이션
└── vercel.json
```

Vercel 서버리스 제약 반영: 파일 로그 불가(→ Postgres 필수), 상시 프로세스 없음(→ pm2 불필요), 콜드스타트 존재(SMS 발송엔 무방).

## 3. DB 스키마 (PostgreSQL)

```sql
-- 모든 게이트웨이 요청 로그 (미들웨어가 자동 기록, 401/403 거부도 포함)
CREATE TABLE request_logs (
  id          BIGSERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,          -- landing-a / landing-b / dashboard-c / (unknown)
  path        TEXT NOT NULL,
  status      INT NOT NULL,
  duration_ms INT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- SMS 발송 이력 (사용량 집계 / 비용 배분용, 실패 포함)
CREATE TABLE sms_logs (
  id           BIGSERIAL PRIMARY KEY,
  client_name  TEXT NOT NULL,
  receiver     TEXT NOT NULL,
  msg_type     TEXT,
  ok           BOOLEAN NOT NULL,
  result_code  INT,
  result_msg   TEXT,
  aligo_msg_id BIGINT,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

## 4. 인증·권한 설계

클라이언트 키는 게이트웨이 환경변수로 관리한다 (키 발급 UI가 필요한 규모가 아직 아님):

```
GATEWAY_KEY_LANDING_A=랜덤64자
GATEWAY_KEY_LANDING_B=랜덤64자
GATEWAY_KEY_DASHBOARD_C=랜덤64자
```

```ts
// src/clients.ts
export const CLIENTS = new Map([
  [process.env.GATEWAY_KEY_LANDING_A!, { name: 'landing-a', scopes: ['sms'] }],
  [process.env.GATEWAY_KEY_LANDING_B!, { name: 'landing-b', scopes: ['sms'] }],
  [process.env.GATEWAY_KEY_DASHBOARD_C!, { name: 'dashboard-c', scopes: ['sms', 'dbforce'] }],
])
```

auth 미들웨어 규칙:

| 상황 | 응답 |
|---|---|
| `x-api-key` 없음 또는 불일치 | **401** |
| 키는 유효하나 경로 스코프(`/sms` → `sms`)가 `scopes`에 없음 | **403** |
| 통과 | `c.set('client', ...)` 후 다음 미들웨어로 |

- 키 비교는 timing-safe 비교(`crypto.timingSafeEqual`)를 사용한다.
- 게이트웨이 URL은 공개 인터넷에 노출되므로 키 없는 요청은 전부 401로 차단된다.

## 5. 엔드포인트

### `GET /health`

인증 없이 200. 업타임 모니터링용.

### `POST /sms` (scope: `sms`)

```
요청:  { receiver: string, msg: string, msgType?: 'SMS'|'LMS'|'MMS', title?: string }
응답:  { ok: boolean, resultCode: number, message: string, msgId?: number }
오류:  400(검증 실패) / 401 / 403 / 502(알리고 호출 실패)
```

- 내부 로직은 plan-landing의 `src/lib/sms/aligo.ts`를 그대로 이식한다:
  폼 인코딩, `ALIGO_TESTMODE=Y` 테스트 모드, `result_code` 문자열/숫자 혼용 처리 포함.
- 응답 스키마를 기존 `SendSmsResult`와 동일하게 맞춰 **각 프로젝트의 호출부 변경을 최소화**한다.
- 발송 시도마다(실패 포함) `sms_logs`에 기록한다.

### (추후) `POST /dbforce/...` (scope: `dbforce`)

스코프 체계에 자리만 잡아둔다. C대시보드 작업 시 디비포스 스펙 확정 후 엔드포인트를 설계·구현한다.

## 6. 각 프로젝트(클라이언트) 쪽 변경

A·B·C 공통으로 사용할 얇은 클라이언트. plan-landing 기준으로는 `src/lib/sms/aligo.ts`를 아래로 교체:

```ts
// src/lib/sms/gateway.ts
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const res = await fetch(`${process.env.EGRESS_GATEWAY_URL}/sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EGRESS_GATEWAY_KEY!,
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Egress gateway 오류: ${res.status} ${await res.text()}`)
  return res.json()
}
```

- `SendSmsInput` / `SendSmsResult` 타입과 함수 시그니처가 동일하므로 **호출부는 import 경로 외 변경 없음**.
- 환경변수: `ALIGO_API_KEY`, `ALIGO_USER_ID`, `ALIGO_SENDER` 제거 → `EGRESS_GATEWAY_URL`, `EGRESS_GATEWAY_KEY` 추가.

## 7. 구현·전환 순서

1. **게이트웨이 구축** — 저장소 생성 → Hono 앱 + auth/log 미들웨어 + `/health`, `/sms` → Postgres 스키마 적용
2. **Vercel 배포 + Static IPs 활성화** — 배포 후 게이트웨이의 고정 IP를 알리고 관리자 페이지에 등록
   (기존 IP와 병행 등록이 가능하므로 무중단 전환)
3. **테스트** — `ALIGO_TESTMODE=Y`로 E2E 확인 → 실발송 1건 확인 → 401/403 케이스 확인
4. **plan-landing 전환** — 클라이언트 교체 → 배포 → 실발송 확인
5. **B랜딩·C대시보드 순차 전환** — 각자 키 발급 후 동일 절차
6. **정리** — 전 프로젝트 전환 완료 후:
   - 각 프로젝트의 Vercel Static IPs 해지
   - 각 프로젝트의 `ALIGO_*` 환경변수 제거
   - 알리고 관리자에서 구 IP 등록 해제

## 8. 리스크 메모

- **단일 장애점**: 게이트웨이가 죽으면 전 프로젝트의 SMS가 중단된다. `/health`에 업타임 모니터링(UptimeRobot 등 무료)을 걸어둔다.
- **Static IPs의 IP 변경 가능성**: Vercel 플랜/리전 변경 시 IP가 바뀔 수 있다. 변경 시 알리고(추후 디비포스) IP 등록을 갱신해야 한다.
- **레이트리밋**: 현재는 키 인증만으로 충분하나, 남용 징후가 보이면 클라이언트별 레이트리밋을 추가한다.
