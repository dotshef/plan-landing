# 광고 세션 게이트 (A-2) 구현 가이드

> 전략 근거: [sms-pumping-2026-08-31-incident-and-strategy.md](sms-pumping-2026-08-31-incident-and-strategy.md)
> 구성: [src/proxy.ts](../src/proxy.ts) (그랜트 발급) · [src/lib/adSession/grant.ts](../src/lib/adSession/grant.ts) (서명/검증) · [src/lib/adSession/store.ts](../src/lib/adSession/store.ts) (서버 상태) · [send-code route](../src/app/api/sms/send-code/route.ts) (게이트 적용)

## 동작 방식

1. 광고 파라미터(google: `gclid`·`gbraid`·`wbraid`·`gad_campaignid`, naver: `n_media`·`n_ad_group`·`n_ad`·`NaPm`)가 붙은 페이지 요청이 오면 **proxy가 서명된 `ad_grant` 쿠키를 발급**한다 (`HttpOnly`·`Secure`·`SameSite=Lax`, TTL 1시간, 사이트 내 이동 시 슬라이딩 갱신 — 세션 id는 유지되므로 수명 연장이 발송권 추가가 되지 않는다).
2. `/api/sms/send-code`는 유효한 그랜트가 없으면 **Turnstile·게이트웨이 호출 전에** 사유 비노출 403으로 거부한다.
3. 그랜트가 있으면 서버 테이블 `ad_session`에서 상태를 강제한다: **세션 1개 = 전화번호 1개, 발송 최대 3회(최초 1 + 재전송 2), 소진 후 재사용 불가.** 발송 직전 슬롯을 원자적으로 선점하므로 동시 요청으로 한도를 넘길 수 없다.
4. 인증 성공(`verify-code`) 시 세션은 즉시 소진 처리된다.
5. UA 블랙리스트는 제거됐다 — UA는 로그 기록용 보조 신호로만 남는다. Turnstile은 유지된다(솔버 강제로 공격 속도를 48초/건으로 묶는 효과).

## 배포 전 필수 작업

**1. Supabase에 테이블 생성** (SQL Editor에서 실행):

```sql
create table if not exists public.ad_session (
  id uuid primary key,
  traffic_source text not null,
  click_id_hash text,
  phone text,
  send_count integer not null default 0,
  consumed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists ad_session_phone_idx on public.ad_session (phone);
create index if not exists ad_session_created_idx on public.ad_session (created_at);
```

접근은 기존 서비스롤 키 경로(`db()`)로만 이뤄진다.

**2. 환경변수 (선택)**: 그랜트 서명 키는 `AD_SESSION_SECRET`을 쓰고, 없으면 기존 `SMS_VERIFICATION_SECRET`을 도메인 분리해 재사용한다. **추가 설정 없이 동작한다.** 전용 키를 원하면 Vercel에 `AD_SESSION_SECRET`만 추가하면 된다.

**3. 관찰 모드 (선택)**: `AD_SESSION_ENFORCE=0`이면 차단하지 않고 `ad-grant MISSING` / `ad-session BLOCKED` 로그만 남긴다. 오탐 규모를 먼저 재고 싶으면 이 모드로 하루 운영 후 변수 제거(=차단 활성).

**4. SMS 잔액 충전은 배포·검증 이후에** 한다 (배포 전 충전 금지 — 게이트 없는 상태에서 충전하면 공격이 즉시 재개된다).

## 배포 후 확인

- 광고 URL로 접속(`/?gclid=test123`) → 개발자도구에서 `ad_grant` 쿠키 확인 → 발송 정상 동작.
- 시크릿 창에서 파라미터 없이 접속 → 발송 시 403 + `ad-grant MISSING` 로그.
- 같은 세션으로 4번째 발송 시도 → 403 + `BLOCKED (limit)` 로그.

## 모니터링

- `ad-grant MISSING` 중 통신사 IP·정상 referer 비율 = 오탐 신호. verify 성공 건수 급감 시 즉시 `AD_SESSION_ENFORCE=0`으로 완화 후 원인 분석.
- 공격 재개 신호: `MISSING` 로그의 48초 격자, 특정 대역 집중, `traffic_source`별 세션 생성 급증(가짜 클릭ID 랜딩 자동화 = 이 게이트의 알려진 한계).
- 오래된 행 정리(선택): `delete from ad_session where created_at < now() - interval '7 days';`
