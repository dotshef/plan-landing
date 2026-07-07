# KIS API 스펙 정리

> 테스트 종목: 삼성전자 (005930) | 실전투자 REST: https://openapi.koreainvestment.com:9443
> 생성 일시: 2026. 7. 2. 오전 7:59:38

---

## 호출 가능 API (8개)

### ✅ 주식현재가 시세

- **tr_id**: `FHKST01010100`
- **endpoint**: `GET /uapi/domestic-stock/v1/quotations/inquire-price`

**응답 필드 (실측)**

```
stck_prpr (현재가): 314500
prdy_vrss (전일대비): 0
prdy_ctrt (등락률): 0.00%
stck_oprc (시가): 0
stck_hgpr (고가): 0
stck_lwpr (저가): 0
acml_vol (거래량): 0
acml_tr_pbmn (거래대금): 0
hts_avls (시가총액): 18386546
per: 47.91
pbr: 4.91
eps: 6564.00
bps: 63997.00
roe_val (ROE): ❌없음
d250_hgpr (52주최고): 374500
d250_lwpr (52주최저): 59800
hts_frgn_ehrt (외국인보유율): 46.88%
bstp_kor_isnm (업종명): 전기·전자
[전체키] iscd_stat_cls_code, marg_rate, rprs_mrkt_kor_name, bstp_kor_isnm, temp_stop_yn, oprc_rang_cont_yn, clpr_rang_cont_yn, crdt_able_yn, grmn_rate_cls_code, elw_pblc_yn, stck_prpr, prdy_vrss, prdy_vrss_sign, prdy_ctrt, acml_tr_pbmn, acml_vol, prdy_vrss_vol_rate, stck_oprc, stck_hgpr, stck_lwpr, stck_mxpr, stck_llam, stck_sdpr, wghn_avrg_stck_prc, hts_frgn_ehrt, frgn_ntby_qty, pgtr_ntby_qty, pvt_scnd_dmrs_prc, pvt_frst_dmrs_prc, pvt_pont_val, pvt_frst_dmsp_prc, pvt_scnd_dmsp_prc, dmrs_val, dmsp_val, cpfn, rstc_wdth_prc, stck_fcam, stck_sspr, aspr_unit, hts_deal_qty_unit_val, lstn_stcn, hts_avls, per, pbr, stac_month, vol_tnrt, eps, bps, d250_hgpr, d250_hgpr_date, d250_hgpr_vrss_prpr_rate, d250_lwpr, d250_lwpr_date, d250_lwpr_vrss_prpr_rate, stck_dryy_hgpr, dryy_hgpr_vrss_prpr_rate, dryy_hgpr_date, stck_dryy_lwpr, dryy_lwpr_vrss_prpr_rate, dryy_lwpr_date, w52_hgpr, w52_hgpr_vrss_prpr_ctrt, w52_hgpr_date, w52_lwpr, w52_lwpr_vrss_prpr_ctrt, w52_lwpr_date, whol_loan_rmnd_rate, ssts_yn, stck_shrn_iscd, fcam_cnnm, cpfn_cnnm, frgn_hldn_qty, vi_cls_code, ovtm_vi_cls_code, last_ssts_cntg_qty, invt_caful_yn, mrkt_warn_cls_code, short_over_yn, sltr_yn, mang_issu_cls_code
```

### ✅ 기간별시세 (일봉 OHLCV)

- **tr_id**: `FHKST03010100`
- **endpoint**: `GET /uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice`

**응답 필드 (실측)**

```
수신 건수: 22
stck_bsop_date (날짜): 20260701
stck_oprc (시가): 334500
stck_hgpr (고가): 339000
stck_lwpr (저가): 311500
stck_clpr (종가): 314500
acml_vol (거래량): 24968382
[전체키] stck_bsop_date, stck_clpr, stck_oprc, stck_hgpr, stck_lwpr, acml_vol, acml_tr_pbmn, flng_cls_code, prtt_rate, mod_yn, prdy_vrss_sign, prdy_vrss, revl_issu_reas
```

### ✅ 투자자매매동향

- **tr_id**: `FHKST01010900`
- **endpoint**: `GET /uapi/domestic-stock/v1/quotations/inquire-investor`

**응답 필드 (실측)**

```
수신 건수: 30
stck_bsop_date (날짜): 20260702
prsn_ntby_qty (개인순매수량): 
frgn_ntby_qty (외국인순매수량): 
orgn_ntby_qty (기관순매수량): 
prsn_ntby_tr_pbmn (개인순매수금액): 
frgn_ntby_tr_pbmn (외국인순매수금액): 
orgn_ntby_tr_pbmn (기관순매수금액): 
[전체키] stck_bsop_date, stck_clpr, prdy_vrss, prdy_vrss_sign, prsn_ntby_qty, frgn_ntby_qty, orgn_ntby_qty, prsn_ntby_tr_pbmn, frgn_ntby_tr_pbmn, orgn_ntby_tr_pbmn, prsn_shnu_vol, frgn_shnu_vol, orgn_shnu_vol, prsn_shnu_tr_pbmn, frgn_shnu_tr_pbmn, orgn_shnu_tr_pbmn, prsn_seln_vol, frgn_seln_vol, orgn_seln_vol, prsn_seln_tr_pbmn, frgn_seln_tr_pbmn, orgn_seln_tr_pbmn
```

### ✅ 자본구조 (financial-ratio endpoint)

- **tr_id**: `FHKST66430100`
- **endpoint**: `GET /uapi/domestic-stock/v1/finance/financial-ratio`

**응답 필드 (실측)**

```
수신 건수: 23
stac_yymm (기준연도): 202603
cras (유동자산): 3062201.00
fxas (비유동자산): 3271195.00
total_aset (자산총계): 6333396.00
flow_lblt (유동부채): 1206038.00
fix_lblt (고정부채): 260999.00
total_lblt (부채총계): 1467036.00
cpfn (자본금): 8975
cfp_surp (자본잉여금): 99.99
prfi_surp (이익잉여금): 99.99
total_cptl (자본총계): 4866360.00
[전체키] stac_yymm, cras, fxas, total_aset, flow_lblt, fix_lblt, total_lblt, cpfn, cfp_surp, prfi_surp, total_cptl
```

### ✅ 손익계산서 (income-statement endpoint)

- **tr_id**: `FHKST66430200`
- **endpoint**: `GET /uapi/domestic-stock/v1/finance/income-statement`

**응답 필드 (실측)**

```
수신 건수: 30 (FID_DIV_CLS_CODE=1: 분기 / 0: 연간)
stac_yymm (기준분기): 202603
sale_account (매출액): 1338734.00
sale_cost (매출원가): 519602.00
sale_totl_prfi (매출총이익): 819132
sell_mang (판관비): 99.99
bsop_prti (영업이익): 572328.00
op_prfi (경상이익): 588284.00
thtr_ntin (당기순이익): 472253.00
[전체키] stac_yymm, sale_account, sale_cost, sale_totl_prfi, depr_cost, sell_mang, bsop_prti, bsop_non_ernn, bsop_non_expn, op_prfi, spec_prfi, spec_loss, thtr_ntin
```

### ✅ 성장성·수익성 지표 (balance-sheet endpoint)

- **tr_id**: `FHKST66430300`
- **endpoint**: `GET /uapi/domestic-stock/v1/finance/balance-sheet`

**응답 필드 (실측)**

```
수신 건수: 30
stac_yymm (기준분기): 202603
grs (매출성장률): 69.1600
bsop_prfi_inrt (영업이익증가율): 756.1000
ntin_inrt (순이익증가율): 474.3200
roe_val (ROE): 19.16
eps (EPS): 6993.00
sps (SPS 주당매출액): 57655
bps (BPS): 71907.00
rsrv_rate (유보율): 50140.0200
lblt_rate (부채비율): 30.1500
[전체키] stac_yymm, grs, bsop_prfi_inrt, ntin_inrt, roe_val, eps, sps, bps, rsrv_rate, lblt_rate
```

### ✅ 종목기본정보

- **tr_id**: `CTPF1002R`
- **endpoint**: `GET /uapi/domestic-stock/v1/quotations/search-stock-info`

**응답 필드 (실측)**

```
prdt_abrv_name (종목명): 삼성전자
std_idst_clsf_cd_name (업종명): 통신 및 방송 장비 제조업
lstg_stqt (상장주식수): 5846278608
scts_mket_lstg_dt (상장일): 19750611
cpfn (자본금): undefined
mket_id_cd (시장구분): STK
[전체키] pdno, prdt_type_cd, mket_id_cd, scty_grp_id_cd, excg_dvsn_cd, setl_mmdd, lstg_stqt, lstg_cptl_amt, cpta, papr, issu_pric, kospi200_item_yn, scts_mket_lstg_dt, scts_mket_lstg_abol_dt, kosdaq_mket_lstg_dt, kosdaq_mket_lstg_abol_dt, frbd_mket_lstg_dt, frbd_mket_lstg_abol_dt, reits_kind_cd, etf_dvsn_cd, oilf_fund_yn, idx_bztp_lcls_cd, idx_bztp_mcls_cd, idx_bztp_scls_cd, stck_kind_cd, mfnd_opng_dt, mfnd_end_dt, dpsi_erlm_cncl_dt, etf_cu_qty, prdt_name, prdt_name120, prdt_abrv_name, std_pdno, prdt_eng_name, prdt_eng_name120, prdt_eng_abrv_name, dpsi_aptm_erlm_yn, etf_txtn_type_cd, etf_type_cd, lstg_abol_dt, nwst_odst_dvsn_cd, sbst_pric, thco_sbst_pric, thco_sbst_pric_chng_dt, tr_stop_yn, admn_item_yn, thdt_clpr, bfdy_clpr, clpr_chng_dt, std_idst_clsf_cd, std_idst_clsf_cd_name, idx_bztp_lcls_cd_name, idx_bztp_mcls_cd_name, idx_bztp_scls_cd_name, ocr_no, crfd_item_yn, elec_scty_yn, issu_istt_cd, etf_chas_erng_rt_dbnb, etf_etn_ivst_heed_item_yn, stln_int_rt_dvsn_cd, frnr_psnl_lmt_rt, lstg_rqsr_issu_istt_cd, lstg_rqsr_item_cd, trst_istt_issu_istt_cd, nxt_tr_stop_yn, cptt_trad_tr_psbl_yn
```

### ✅ HTS 조회상위 20종목

- **tr_id**: `HHMCM000100C0`
- **endpoint**: `GET /uapi/domestic-stock/v1/ranking/hts-top-view`
- **파라미터**: 쿼리 파라미터 없음
- **주의**: 헤더에 `custtype: P` (개인 고객 구분) 필수 — 시세 API와 달리 이 헤더가 없으면 조회 실패

**응답 필드 (실측 2026-07-06)**

```
수신 건수: 20 (조회 순위순)
mrkt_div_cls_code (시장구분): J (코스피) | Q (코스닥)
mksc_shrn_iscd (종목코드): 005930
[전체키] mrkt_div_cls_code, mksc_shrn_iscd
[실측 상위 5건] 005930 삼성전자 → 000660 SK하이닉스 → 365660(Q) → 005935 삼성전자우 → 069500 KODEX 200(ETF)
```

- 응답에 **종목명·시세 없음** → 종목명은 종목마스터 캐시에서 매핑, 시세는 현재가 API 별도 호출
- **ETF·우선주도 순위에 포함**됨 → 상장사 주권만 쓰려면 종목마스터 그룹코드 `ST` 필터 필요

---

## 호출 불가 / 미제공 데이터

> ⚠️ 이 문서 초판(2026-07-02, 8개 API 기준)에 있던 "호출 불가" 표는 폐기됨.
> 이후 실측(2026-07-06)에서 **뉴스(`FHKST01011800`)·배당(`HHKDB669102C0`)·종목별 프로그램매매(`FHPPG04650201`)·투자의견(`FHKST663300C0`)이 호출 가능**으로 확인되어 내용이 틀렸다.
> 최신 "호출 가능/불가"는 [KIS_API_SCREEN_MAP.md](KIS_API_SCREEN_MAP.md) §2 참조.

---

## WebSocket 전용 (실시간)

| 데이터 | 서버 | 설명 |
|--------|------|------|
| 실시간 체결가 | ws://ops.koreainvestment.com:21000 | 종목별 실시간 체결 |
| 실시간 호가 | ws://ops.koreainvestment.com:21000 | 매수/매도 호가잔량 |
| 프로그램 매매 | ws://ops.koreainvestment.com:21000 | 프로그램 매매 종합 |
