# plan-landing: Egress Gateway 전환 작업 명세

> 작성일: 2026-07-20 / 상태: 작업 대기
> 이 문서는 **이 저장소(plan-landing)에서 수행할 변경**만 다룬다.
> 게이트웨이 서버 자체의 구현은 [egress-gateway-plan.md](./egress-gateway-plan.md) 참조.

## 목표

SMS 발송 경로를 "알리고 직접 호출"에서 "Egress Gateway 경유"로 교체한다.
이 저장소의 Vercel Static IPs(월 $100)를 해지할 수 있게 되는 것이 최종 효과다.

## 선행 조건 (이 작업을 시작하기 전에 충족되어야 함)

- [ ] Egress Gateway가 배포되어 `POST /sms`가 동작 중
- [ ] 게이트웨이의 고정 IP가 알리고 관리자 페이지에 등록됨 (기존 IP와 병행 등록)
- [ ] 이 프로젝트용 클라이언트 키(`landing-a`, scope: `sms`) 발급 완료

선행 조건이 미충족이면 코드 변경을 시작하지 않는다.

## 현재 상태 (변경 대상 전수 목록)

알리고 관련 코드는 아래 2개 파일이 전부다 (2026-07-20 기준 grep으로 확인):

| 파일 | 역할 |
|---|---|
| `src/lib/sms/aligo.ts` | 알리고 API 직접 호출. `SendSmsInput`/`SendSmsResult` 타입과 `sendSms()` export |
| `src/app/api/sms/send-code/route.ts` | 유일한 호출부. 2행에서 `import { sendSms } from '@/lib/sms/aligo'` |

환경변수(Vercel 대시보드): `ALIGO_API_KEY`, `ALIGO_USER_ID`, `ALIGO_SENDER`, (선택) `ALIGO_TESTMODE`

## 변경 내용

### 1. 신규: `src/lib/sms/gateway.ts`

`aligo.ts`의 공개 인터페이스(`SendSmsInput`, `SendSmsResult`, `sendSms`)를 그대로 유지한 채 내부 구현만 게이트웨이 호출로 바꾼 파일을 새로 만든다:

```ts
export interface SendSmsInput {
  /** 수신자 전화번호 (- 없이 숫자만) */
  receiver: string
  /** 메시지 내용 */
  msg: string
  /** SMS/LMS/MMS 지정 (미지정 시 알리고가 자동 판별) */
  msgType?: 'SMS' | 'LMS' | 'MMS'
  /** LMS/MMS 제목 */
  title?: string
}

export interface SendSmsResult {
  ok: boolean
  resultCode: number
  message: string
  msgId?: number
}

/**
 * Egress Gateway를 통해 SMS를 발송한다.
 * 필요한 환경변수: EGRESS_GATEWAY_URL, EGRESS_GATEWAY_KEY
 * 실제 알리고 호출과 크리덴셜 관리는 게이트웨이가 담당한다.
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const url = process.env.EGRESS_GATEWAY_URL
  const key = process.env.EGRESS_GATEWAY_KEY

  if (!url || !key) {
    throw new Error('EGRESS_GATEWAY_URL / EGRESS_GATEWAY_KEY 환경변수가 필요합니다.')
  }

  let res: Response
  try {
    res = await fetch(`${url}/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    throw new Error(`Egress Gateway 요청에 실패했습니다: ${(error as Error).message}`)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Egress Gateway 오류: ${res.status} ${text.slice(0, 200)}`)
  }

  return (await res.json()) as SendSmsResult
}
```

설계 노트:

- **에러 의미 보존**: 기존 `aligo.ts`는 "알리고가 발송을 거부"하면 `{ ok: false }`를 반환하고, "네트워크/파싱 실패"면 throw했다. 게이트웨이도 같은 규약(알리고 거부 → 200 + `ok:false`, 게이트웨이 장애 → 4xx/5xx)이므로, 이 클라이언트에서 `!res.ok`일 때 throw하면 호출부의 기존 분기(502 vs 500)가 그대로 유지된다.
- **타임아웃 10초**: 기존에는 없었으나, 게이트웨이라는 홉이 하나 늘었으므로 무한 대기를 막는다.
- `ALIGO_TESTMODE` 분기는 이 파일에 없다 — 테스트 모드는 게이트웨이 환경변수로 제어한다.

### 2. 수정: `src/app/api/sms/send-code/route.ts`

2행의 import 경로만 변경한다. **다른 로직은 일절 건드리지 않는다.**

```diff
-import { sendSms } from '@/lib/sms/aligo'
+import { sendSms } from '@/lib/sms/gateway'
```

타입·시그니처가 동일하므로 92행의 `sendSms({...})` 호출, 97~103행의 `result.ok` 분기, catch 블록 모두 변경 없음.
(98행 로그 문구 `'Aligo failed:'`는 동작과 무관하므로 그대로 둔다. 원하면 `'Gateway failed:'`로 바꿔도 된다.)

### 3. 삭제: `src/lib/sms/aligo.ts`

같은 커밋에서 삭제한다. 이 파일의 로직은 게이트웨이 저장소로 이식이 끝난 상태여야 한다(선행 조건).
롤백은 git revert로 처리한다 — 알리고에 구 IP가 병행 등록되어 있는 동안은 revert만으로 즉시 원복 가능.

### 4. 환경변수 (Vercel 대시보드 — 코드 변경과 함께 사람이 수행)

| 작업 | 변수 | 시점 |
|---|---|---|
| 추가 | `EGRESS_GATEWAY_URL` (예: `https://egress-gateway.vercel.app`) | 배포 전 |
| 추가 | `EGRESS_GATEWAY_KEY` (landing-a 키) | 배포 전 |
| 제거 | `ALIGO_API_KEY`, `ALIGO_USER_ID`, `ALIGO_SENDER`, `ALIGO_TESTMODE` | 실발송 검증 완료 후 |

`ALIGO_*` 제거를 검증 완료 후로 미루는 이유: 문제 발생 시 revert 원복이 환경변수 재설정 없이 즉시 가능해야 하기 때문.

## 검증 절차

1. `npx tsc --noEmit` (또는 `npm run build`) 통과
2. 저장소 전체에서 `aligo`/`ALIGO_` 잔존 참조가 docs 외에 없는지 grep 확인
3. 로컬(`npm run dev`) + 게이트웨이 `ALIGO_TESTMODE=Y` 상태에서 `POST /api/sms/send-code` 호출 → `{ ok: true, ttlMs }` 응답 확인
4. 게이트웨이 키를 일부러 틀리게 설정 → 500 응답과 `[sms/send-code] send error:` 로그 확인 (장애 시 사용자 노출 메시지 정상 동작)
5. 배포 후 실번호로 인증번호 수신 1건 확인
6. 검증 완료 → `ALIGO_*` 환경변수 제거 → Static IPs 해지는 별도 판단(전 프로젝트 전환 완료 후)

## 이 작업의 범위 제외

- 게이트웨이 서버 구현·배포 (별도 저장소)
- 게이트웨이 DB/로깅 방식 결정 (게이트웨이 쪽에서 별도 처리)
- B랜딩·C대시보드 전환 (각 저장소에서 동일 패턴으로 반복)
- Vercel Static IPs 해지 (전 프로젝트 전환 완료 후 사람이 수행)
