# KIS API 시장 지수 실측

> 실측 일시: 2026-07-02
> 테스트 스크립트: [scripts/test-10-index.js](scripts/test-10-index.js)

---

## 실측 결과

| 지수 | endpoint | tr_id | 심볼 (FID_INPUT_ISCD) | 실측값 |
|---|---|---|---|---|
| KOSPI | `/uapi/domestic-stock/v1/quotations/inquire-index-price` | `FHPUP02100000` | `0001` | 8,303.41 ✅ |
| KOSDAQ | 동일 | `FHPUP02100000` | `1001` | 929.35 ✅ |
| NASDAQ | `/uapi/overseas-price/v1/quotations/inquire-daily-chartprice` | `FHKST03030100` | `COMP` | 26,040.03 (▼0.66%) ✅ |
| S&P500 | 동일 | `FHKST03030100` | `SPX` | 7,483.23 (▼0.22%) ✅ |

4개 지수 모두 KIS REST API로 렌더링 가능.

---

## 요청 파라미터

### 국내 (KOSPI/KOSDAQ) — `FHPUP02100000`
```
FID_COND_MRKT_DIV_CODE: U
FID_INPUT_ISCD:         0001 (KOSPI) | 1001 (KOSDAQ)
```

### 해외 (NASDAQ/S&P500) — `FHKST03030100`
```
FID_COND_MRKT_DIV_CODE: N
FID_INPUT_ISCD:         COMP (NASDAQ) | SPX (S&P500)
FID_INPUT_DATE_1:       YYYYMMDD (시작일)
FID_INPUT_DATE_2:       YYYYMMDD (종료일)
FID_PERIOD_DIV_CODE:    D (일)
```

---

## 주요 응답 필드

### 국내 지수 (output)
| 필드 | 의미 |
|---|---|
| `bstp_nmix_prpr` | 현재 지수 |
| `bstp_nmix_prdy_vrss` | 전일 대비 |
| `bstp_nmix_prdy_ctrt` | 등락률 (%) |
| `prdy_vrss_sign` | 등락 부호 (2:상승, 5:하락, 3:보합) |
| `bstp_nmix_oprc` / `bstp_nmix_hgpr` / `bstp_nmix_lwpr` | 시가 / 고가 / 저가 |
| `acml_vol` / `acml_tr_pbmn` | 누적 거래량 / 거래대금 |

### 해외 지수 (output1: 현재 스냅샷)
| 필드 | 의미 |
|---|---|
| `ovrs_nmix_prpr` | 현재 지수 |
| `ovrs_nmix_prdy_vrss` | 전일 대비 |
| `prdy_ctrt` | 등락률 (%) |
| `ovrs_nmix_prdy_clpr` | 전일 종가 |
| `hts_kor_isnm` | 지수 한글명 (예: "나스닥 종합", "S&P500") |
| `ovrs_prod_oprc` / `ovrs_prod_hgpr` / `ovrs_prod_lwpr` | 당일 시가 / 고가 / 저가 |

### 해외 지수 sparkline용 (output2: 일별 시계열)
`daily-chartprice` 응답의 `output2`에 지정 기간 일별 시세 배열이 함께 제공됨 → 카드 하단 sparkline에 그대로 사용 가능.

---

## 주의사항

- **해외 지수 심볼은 `COMP`/`SPX`가 정답.** 점 붙인 `.IXIC`/`.SPX`는 HTTP 200이지만 값이 전부 0으로 리턴됨.
- 해외 지수는 실시간이 아닌 **전 영업일 종가 기준 스냅샷**. 실시간 스트리밍은 WebSocket 별도 신청 필요.
- 초당 호출 제한 존재 → 4개 지수 배치 조회 시 요청 사이 지연 필수 (실측 시 `EGW00201: 초당 거래건수를 초과하였습니다` 발생).
