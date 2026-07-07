# KIS 지원 코스피·코스닥 상장 종목 조사

> 조사일: 2026-07-06
> 조사 원본: KIS 종목마스터 스냅샷. 앱은 이 데이터를 `stock_master` 테이블(→ [design/KIS_DB_SCHEMA.md](../design/KIS_DB_SCHEMA.md))로 이관해 사용. (초기 추출 스크립트는 레거시 `scripts/`, 제거 예정)

---

## 1. 결론

- KIS 국내주식 API는 **별도의 화이트리스트 없이 KRX 상장 전 종목을 지원**한다. 지원 종목의 원천은 KIS가 매영업일 배포하는 **종목마스터 파일**(`kospi_code.mst` / `kosdaq_code.mst`)이며, 여기 실린 단축코드(6자리)를 그대로 `FID_INPUT_ISCD`에 넣으면 조회된다.
- 시장구분코드는 KOSPI/KOSDAQ 구분 없이 **`FID_COND_MRKT_DIV_CODE=J` 하나로 통일** — 종목이 어느 시장인지 앱이 미리 알 필요 없음 (응답의 `rprs_mrkt_kor_name`으로 시장 확인 가능).
- 실측 기준(2026-07-06) 렌더링 대상이 되는 **상장사 주권은 KOSPI 918 + KOSDAQ 1,808 = 2,726종목**.

---

## 2. 종목마스터 파일

| 항목 | 내용 |
|---|---|
| KOSPI | https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip |
| KOSDAQ | https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip |
| 포맷 | cp949 인코딩 고정폭 텍스트. 앞부분 = 단축코드(9) + 표준코드/ISIN(12) + 한글명, 뒷부분 고정폭(개행 제외 KOSPI 227자 / KOSDAQ 221자)의 첫 2자가 증권그룹코드 |
| 갱신 | 매영업일 (신규상장/상장폐지 반영) — 공식 파서는 [koreainvestment/open-trading-api](https://github.com/koreainvestment/open-trading-api) 참고 |

---

## 3. 실측 집계 (2026-07-06)

### KOSPI — 전체 2,547 레코드

| 그룹코드 | 구분 | 종목 수 |
|---|---|---|
| **ST** | **주권 (상장사)** | **918** (보통주 810 + 우선주 108) |
| EF | ETF | 1,143 |
| EN | ETN | 379 |
| BC | 수익증권 | 69 |
| RT | 리츠 | 23 |
| 기타 | SW/SR/PF/IF/MF/DR/FS | 15 |

### KOSDAQ — 전체 1,827 레코드

| 그룹코드 | 구분 | 종목 수 |
|---|---|---|
| **ST** | **주권 (상장사)** | **1,808** (보통주 1,802 + 우선주 6) |
| FS | 외국주권 | 11 |
| DR | 주식예탁증서 | 8 |

> 화면의 "재무제표·투자의견" 섹션은 주권(ST)에만 의미가 있으므로, 종목 검색/목록 기능은 **그룹코드 `ST` 필터링을 기본**으로 하는 것을 권장. ETF/ETN 등은 시세·차트는 조회되지만 손익계산서·투자의견 데이터가 없음.

---

## 4. 실호출 검증

마스터 파일에 있는 종목이 실제 API로 조회되는지 표본 검증 (`inquire-price`, `FHKST01010100`):

| 종목 | 코드 | 시장 | 결과 |
|---|---|---|---|
| 삼성전자 | 005930 | KOSPI | ✅ (기존 scripts 전체 실측 완료) |
| 삼성전자우 (우선주) | 005935 | KOSPI | ✅ 현재가 206,000 |
| 알테오젠 | 196170 | KOSDAQ | ✅ 현재가 327,500 |
| 에코프로비엠 | 247540 | KOSDAQ | ✅ 현재가 118,000 |

KOSDAQ·우선주 모두 동일 endpoint·동일 파라미터(`J` + 6자리 코드)로 정상 조회 확인.

---

## 5. 앱 적용 시 참고

- 앱은 이 마스터를 `stock_master` 테이블로 이관해 전 주권(~2,726) 유니버스로 사용한다(→ [design/KIS_INGESTION.md](../design/KIS_INGESTION.md)). 목데이터 시절 `src/data/registry.ts` 4종 하드코딩은 대체됨.
- 단축코드는 문자열로 다뤄야 함 (선행 0 보존, 예: `005930`). ST 주권은 전부 6자리 숫자이나 ETF 신형코드(`0162Z0` 등)처럼 영문 포함 코드도 존재.
- 마스터 파일은 매영업일 갱신됨(신규상장/폐지 반영). `stock_master` 재시드 절차는 [design/KIS_INGESTION.md](../design/KIS_INGESTION.md) 참고.
- 상장폐지 종목은 마스터에서 빠지고, 거래정지 종목은 마스터에 남되 시세 API의 `temp_stop_yn`/`tr_stop_yn` 플래그로 식별 가능.
