# [보류] is_common을 KIS 주식종류코드 기반으로 교정

> 상태: **보류(deferred)**. 현재는 코드 끝자리 휴리스틱을 신뢰하고 진행 중.
> 작성 맥락: 2026-07 시드 구축 중, 보통주 판별 근거 검토에서 파생.

## 현재 상태 (what we ship now)

`stock.is_common`은 **generated 컬럼**으로 코드 끝자리 규칙에 의존:

```sql
is_common boolean generated always as (group_code = 'ST' and right(code, 1) = '0') stored
```

- 근거: KRX 단축코드 관례(보통주=끝자리 0, 우선주=5/7/9).
- 용도: `top_view`(랜딩 인기 리포트 카드)에서 우선주·ETF 제외 — **표시용 필터, 저위험**.
- KIS API로 표준 케이스 검증 완료 → 관례가 KIS 분류와 일치함(아래).

## 왜 교정하려 했나

끝자리 규칙은 "관례 기반 추론"이라 신형 영숫자 단축코드 등 **edge case에서 틀릴 여지**가 있음. KIS가 직접 주는 분류 필드를 쓰는 게 더 정확.

## KIS 근거 (실측 2026-07 · search-stock-info CTPF1002R)

`stck_kind_cd`(주식종류코드)가 보통주/우선주를 명시적으로 구분:

| 종목 | code | stck_kind_cd | 표준코드(ISIN) |
|---|---|---|---|
| 삼성전자(보통) | 005930 | **101** | KR7005930003 |
| 삼성전자우(우선) | 005935 | **201** | KR7005931001 |
| 현대차(보통) | 005380 | **101** | KR7005380001 |
| 현대차우(우선) | 005385 | **201** | KR7005381009 |
| LG화학(보통) | 051910 | **101** | KR7051910008 |
| LG화학우(우선) | 051915 | **201** | KR7051911006 |

**`stck_kind_cd`: 101=보통주 / 201=우선주** (예외 없이 일관). ISIN 7번째 자리(`0`=보통, `1`=우선)로도 구분 가능하나 `stck_kind_cd`가 명료.

## 제약

- `stck_kind_cd`는 **종목별 API 호출(`search-stock-info`, CTPF1002R)**로만 획득. `.mst` 종목마스터엔 없음.
- 전 주권 정확 분류 = **~2,726콜 1회성**(레이트리밋 큐로 ~55분). 시드 시점에 감당하기 부담 → **야간 별도 수집으로 이관.**

## 교정 계획 (option C — 야간 수집으로 채워 교정)

1. **스키마 변경** ([db-schema.md](db-schema.md) / migration)
   - `stock`에 `stock_kind text` 컬럼 추가 (nullable, 야간 수집이 채움).
   - `is_common` generated 정의를 다음으로 교체(coalesce로 미수집 구간은 끝자리 규칙 폴백):
     ```sql
     is_common boolean generated always as (
       group_code = 'ST' and coalesce(stock_kind = '101', right(code, 1) = '0')
     ) stored
     ```
     ※ generated에서 다른 컬럼 참조 가능하나, 표현식 안정성 확인 필요. 여의치 않으면 트리거/뷰로.

2. **데이터셋 추가** ([src/lib/kis/datasets/stock.ts](../../src/lib/kis/datasets/stock.ts))
   - `kind` 데이터셋: `search-stock-info`(CTPF1002R) 호출 → `stck_kind_cd`를 `stock.stock_kind`에 update.
   - 종목당 +1콜 (11→12콜). 또는 저빈도(주1회) 별도 스케줄로 분리해 야간 콜 절감.

3. **재분류** — 채워진 뒤 `top_view` 필터가 자동으로 KIS 근거를 사용(is_common이 stock_kind 반영).

## 참고

- 현행 유지로도 top_view 필터는 정상 동작(표시용, KIS와 일치 검증됨). 이 교정은 **정확도 강화**이지 버그 수정 아님.
- 관련: [db-schema.md](db-schema.md) `stock` 테이블, [KIS_INGESTION.md](KIS_INGESTION.md) §2 데이터셋.
