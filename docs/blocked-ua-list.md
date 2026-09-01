# 차단된 User-Agent 목록

> 코드 위치: [src/app/api/sms/send-code/route.ts:13-29](../src/app/api/sms/send-code/route.ts#L13-L29)
> 상태: SMS 인증번호 발송 API(`/api/sms/send-code`)에 적용된 **임시 응급조치**. 서브넷 레이트리밋 도입 후 제거 예정.
> 비교 방식: **완전일치**와 **부분일치** 두 종류의 규칙을 병행한다 (아래 참조).

## 규칙 종류

| 규칙 | 상수 | 사용 기준 |
|---|---|---|
| 완전일치 | `BLOCKED_UA_EXACT` | 기본값. 특정 UA 지문 하나만 차단 |
| 부분일치 | `BLOCKED_UA_INCLUDES` | 완전일치로 열거하면 **버전만 바꿔 즉시 우회되는** 경우에 한해 사용 |

⚠️ **Chrome 계열 지문은 부분일치 금지.** Edge·웨일 등 정상 브라우저 UA가 `Chrome/...` 문자열을 그대로 포함하므로 부분일치로 바꾸면 즉시 오탐이 발생한다. 새 지문을 부분일치로 추가할 때는 반드시 정상 사용자 UA와의 충돌 여부를 로그로 먼저 검증할 것.

## 완전일치 목록 (`BLOCKED_UA_EXACT`)

| # | User-Agent 문자열 | 추가 사유 / 비고 |
|---|---|---|
| 1 | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36` | SMS 펌핑 공격 UA 지문 |
| 2 | `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36` | 펌핑 우회 대응으로 추가 (2026-07-23). ⚠️ stock 안드로이드 크롬의 흔한 UA와 완전 동일 → 실제 모바일 고객 일부도 차단될 수 있음. verify-code 성공률 급감 시 즉시 제거 검토 |
| 3 | `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Whale/3.9.14.9 Mobile Safari/537.36` | 웨일 모바일 UA 위장 펌핑 공격으로 추가 (2026-07-24, ip=203.234.237.71) |

## 부분일치 목록 (`BLOCKED_UA_INCLUDES`)

| # | 포함 문자열 | 추가 사유 / 비고 |
|---|---|---|
| 1 | `Firefox/` | Firefox 계열 전체 차단 (2026-07-30 추가). 공격자가 Chrome 계열 차단을 인지한 뒤 Firefox로 전환하고 `150`/`152`/`153` 버전을 섞어 로테이션 중이라 완전일치로는 버전 변경만으로 우회됨. 상세 분석: [공격 패턴 및 공격 방식](공격-패턴-및-공격-방식.md) |

### `Firefox/` 부분일치 근거 (2026-07-30 로그 검증)

[분석 로그](plan-landing-log-export-2026-07-30T06-48-05.csv) 전수 조사 결과:

- `Firefox` 문자열을 포함한 UA는 아래 **4종뿐이며 전부 공격 트래픽**이었다.
  - `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0` (주력)
  - `Mozilla/5.0 (Android 12; Mobile; rv:153.0) Gecko/153.0 Firefox/153.0` (소량)
  - `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0` (소량)
  - `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0` (소량)
- 정상 사용자 UA 계열(`SamsungBrowser` 32건, `Whale` 27건, `NAVER` 인앱 24건, `Edg/` 4건)과의 `Firefox` 문자열 충돌은 **0건** → 현재 오탐 위험 없음.
- 단, 이 규칙은 **모든 실제 Firefox 사용자를 차단**한다. 분석 시점 정상 Firefox 사용자가 0명이라 감수한 트레이드오프이며, 유입 경로가 바뀌면 재검토가 필요하다.
- 공격자가 삼성 브라우저·인앱 웹뷰 UA로 위장하면 이 규칙은 무력화된다. 어디까지나 응급조치이며, 구조적 대응(서브넷 레이트리밋, verify 미수행 블랙리스트)이 본 해법이다.

## 동작

- 요청 헤더의 `user-agent`가 완전일치 목록과 **정확히 같거나**, 부분일치 목록의 문자열을 **포함하면** `403`과 함께 `보안 정책에 따라 차단되었습니다. 다른 브라우저로 시도해주세요` 메시지를 반환한다.
- 차단 시 서버 로그에 `[sms/send-code] ua-blocked | ip=... | phone=... | ua=...` 형식으로 기록된다. UA 로테이션 추적을 위해 차단된 UA 원문을 함께 남긴다.
- 검사 위치는 Turnstile 검증 **이전**이므로, 차단된 UA는 Turnstile 호출 비용도 발생시키지 않는다.

## 관련 문서

- [공격 패턴 및 공격 방식](공격-패턴-및-공격-방식.md)
