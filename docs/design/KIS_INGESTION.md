# KIS 데이터 수집·저장 설계 (Ingestion)

목데이터를 KIS 실데이터로 교체하기 위한 **수집(ingestion) 설계**.
DB 테이블 정의는 [KIS_DB_SCHEMA.md](KIS_DB_SCHEMA.md), API·화면 매핑은 [KIS_API_CALL_LIST.md](KIS_API_CALL_LIST.md), 실측 스펙은 [KIS_API_SPEC_TEST.md](KIS_API_SPEC_TEST.md) 참고.

데이터 흐름: `KIS → 야간 Vercel Cron 배치 → Supabase → 클라이언트(항상 DB만 읽음)`.

> **제품 전제:** 이 사이트는 실시간 시세를 파는 MTS가 아니라 투자그룹 플랜의 **신뢰성 제고용 랜딩**이다. 정확도·실시간성보다 UI·리포트가 중요하므로, **모든 데이터는 장마감 기준 야간 스냅샷**으로 충분하다. → 전면 cron.

---

## 1. 설계 원칙

1. **전면 cron. read-through 없음.**
   요청 경로는 KIS를 **절대 호출하지 않는다.** 오직 야간 cron만 KIS를 부르고 DB에 적재한다. → 요청 경로의 동시성 이슈·전역 rate limit 조율·토큰 발급이 **원천 소멸**.
2. **수집 진행상태를 `ingest_state` 한 테이블로 중앙화.**
   "이 종목을 언제 마지막에 수집했나?"(재개 커서), "ETF라 재무가 없나?"(`unavailable`)를 데이터 로드 없이 이 테이블로 판정.

---

## 2. 수집 정책

**모든 데이터셋을 야간 cron으로 일괄 수집한다.** 유니버스는 **전 주권(ST) ~2,726종목**, 기준은 **장마감**.

| 데이터셋 | `dataset` 키 | API (tr_id) | 종목당 콜 |
|---|---|---|---|
| 국내·해외 지수 | `indices` | `FHPUP02100000` + `FHKST03030100` | 시장 4 |
| HTS 조회상위 | `top_view` | `HHMCM000100C0` | 시장 1 |
| 현재가 | `quote` | `FHKST01010100` | 1 |
| 일봉 OHLCV | `daily` | `FHKST03010100` | 1 |
| 투자자 순매수 | `investor` | `FHKST01010900` | 1 |
| 뉴스 | `news` | `FHKST01011800` | 1 |
| 손익계산서(연/분기) | `income` | `FHKST66430200` (param 0/1) | 2 |
| 재무비율(ROE/BPS) | `ratio` | `FHKST66430300` | 1 |
| 배당 | `dividend` | `HHKDB669102C0` | 1 |
| 프로그램매매 | `program` | `FHPPG04650201` | 1 |
| 투자의견 | `opinion` | `FHKST663300C0` | 1 |
| 증권사별 의견 | `opinion_sec` | `FHKST663400C0` | 1 |

- **유니버스**: `stock_master` 테이블의 주권(`group_code='ST'`) 코드 전체(~2,726, 우선주 포함). 요청 경로는 이 종목들을 **항상 DB에서만** 읽는다. (`is_common`은 top_view 보통주 필터용으로 유지)
- **주권 전용 분기**: 재무·투자의견은 주권에만 데이터 존재. cron이 응답 없음을 만나면 `status='unavailable'`로 찍고 재호출 억제.
- 종목당 최대 ~11콜 × 2,726 ≈ **30,000콜/야간**. 장마감 후 시간창이 넉넉해 레이트리밋은 실질 병목이 아님.

---

## 3. 수집 아키텍처 — 단일 Cron 펌프

Vercel Cron(Pro)으로 구동. **cron 스케줄은 하나**이고, 그것을 **청크 펌프**로 돌린다. (병렬 cron 금지 — KIS 20/초는 계좌 단위 공유라 병렬 워커가 합산 초과함.)

```
단일 cron 스케줄(KST 18:00~, 5분 간격 · Vercel은 UTC 고정 → 표현식은 09:00 UTC 기준)
  매 실행(cron 1회):
    1. 리스 락 획득 시도 → 실패(이미 실행 중)면 즉시 종료
    2. 커서로 "가장 오래 전 수집된(또는 미수집) 종목 N개" 선택
    3. 레이트리밋 큐(≤10~15/초)로 각 종목 데이터셋 수집 → 멱등 upsert
    4. ingest_state 갱신(진행), 리스 연장
  → 저녁 시간창 동안 순차적으로 전 주권 소진
```

### 왜 리스 락 + 멱등 + 재개 커서인가 (Vercel 문서 근거)

[Vercel Cron 문서](https://vercel.com/docs/cron-jobs/manage-cron-jobs)가 명시:
- **겹침을 막아주지 않음** — "Vercel can trigger a second instance while the first is still running. … use a lock mechanism." → 우리 상황은 공유 자원(KIS 20/초)이라 겹침이 `EGW00201`로 직결 → **락 필수**.
- **중복 딜리버리** — "cron delivery can occasionally invoke the same scheduled run more than once." → 실행이 빨라도 겹칠 수 있음 → 간격·rate 마진만으론 불충분.
- **실패 시 재시도 없음 / best-effort** — 누락 실행 발생 → **재개형(커서)** 으로 다음 실행이 catch-up.
- 결론(원문): "Use **both locks** and **idempotent reconciliation**."

### 세부

- **리스 락**: `cron_lock` 테이블. 만료시각 달린 소유권 → 워커가 크래시해도 리스 만료로 자동 해제(서버리스 크래시 내성). 진행 중 연장(heartbeat).
- **멱등 upsert**: 전 데이터 테이블이 PK 기준 upsert → 중복 실행돼도 결과 동일.
- **재개 커서**: `ingest_state.fetched_at`으로 "가장 오래된 것부터". 누락/중단 시 다음 실행이 자연 이어받음.
- **rate 마진**: 명목 20/초지만 실측상 근접 시 `EGW00201`([KIS_API_CALL_LIST.md](KIS_API_CALL_LIST.md)) → 큐를 10~15/초로 여유. 개별 콜 `EGW00201`은 **백오프 후 재시도**(청크 전체 중단 금지).
- **토큰**: cron 내부에서만 사용. 청크(=여러 invocation)가 공유하도록 `kis_token`에 보관(발급 "1분당 1회" 제한 회피). 요청 경로는 토큰을 만지지 않음.
- **엔드포인트 보호**: `CRON_SECRET` 환경변수 → `Authorization: Bearer` 검증.
- **스케줄**: KST 18:00 시작, 5분 간격. **Vercel Cron은 UTC 고정**이므로 표현식은 UTC로 — 예: `*/5 9-11 * * *`(= KST 18:00~19:55). 배수 실행은 무해(아래 신선도 조건으로 no-op).
- **청크 크기(= cron 1회 실행당 종목 수)**: **150종목.** 단일 워커가 순차 호출하므로 레이트리밋은 자동 준수(지연 때문에 초당 20건에 못 미침). 시간 제약도 **Pro `maxDuration`=800s**면 넉넉 — 150종목=1,650콜, 콜당 300ms(비관적)여도 ~495s < 800s. (콜당 소요는 실측 확인.) 전량 소진: 150/실행 × 5분 → 2,726 ÷ 150 ≈ **19회 ≈ 95분**(18:00 → ~19:35 완료).
- **신선도 조건(no-op)**: 커서는 `fetched_at < 오늘 배치 기준시각`인 종목만 선택. 당일 전량 갱신되면 이후 실행은 대상 없음 → 조용히 종료(윈도우 넉넉히 잡아도 안전).

---

## 4. 확정 사항 (구현 시 적용)

- **"실시간" 배지 제거** — [MarketIndexCards.tsx](../src/components/landing/MarketIndexCards.tsx)의 "실시간" 표기는 야간 스냅샷과 상충 → **넣지 않는다**(삭제).
- **cron 스케줄** — KST 18:00 시작, 5분 간격. Vercel은 UTC 고정이므로 표현식은 `*/5 9-11 * * *` 등(§3).
- **청크 크기 / maxDuration** — 150종목/실행, 함수 `maxDuration`=800s(Pro)(§3).
- **종목 마스터 DB화** — 유니버스·이름 해석의 출처를 `stock-master.ts` → `stock_master` 테이블로. 앱은 TS 파일에 의존하지 않음. TS 파일은 **초기 시드 소스로만**(시드 후 제거 가능). (테이블 정의는 [KIS_DB_SCHEMA.md](KIS_DB_SCHEMA.md))

### 남은 미결

- **`stock_master` 재시드 절차** — 신규 상장/폐지 반영은 마스터 재시드가 필요. 시드 데이터 출처(현 CSV/TS)와 갱신 주기 확정.
