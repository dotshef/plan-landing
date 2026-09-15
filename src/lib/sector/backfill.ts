import 'server-only'
import { db } from '@/lib/db/server'
import { kisGet } from '@/lib/kis/client'
import { dedupeByKey, num, toDate } from '@/lib/kis/datasets/shared'
import { prevQuarter, quarterRange, type QuarterRef } from './quarter'

// 섹터 등록 종목의 과거 분기 데이터 온디맨드 백필.
// - 시세+수급: investor-trade-by-stock-daily(FHPTJ04160001) 하나로 동시 적재
//   (기준일부터 과거 30영업일 반환 → 기준일을 뒤로 밀며 반복)
// - 분기 재무: income-statement / financial-ratio DIV=1 (호출 1회에 최근 30개 분기)
// 모든 적재는 기존 PK 기준 upsert — 멱등.

// 거래일 달력 기준 종목(삼성전자). 검증의 완전성 판정 기준이므로 백필 대상에 항상 포함한다.
export const CALENDAR_CODE = '005930'

function yyyymmdd(iso: string): string {
  return iso.replace(/-/g, '')
}

function prevDayYyyymmdd(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

/** N-1분기 시작 ~ N분기 끝(미래면 전일)의 시세·수급을 채운다. */
async function backfillDaily(code: string, q: QuarterRef): Promise<void> {
  const { from } = quarterRange(prevQuarter(q))
  const { to } = quarterRange(q)
  // 당일을 기준일로 주면 KIS가 집계 완료(15:40) 전까지 OPSQ2001(TIME LIMIT)로 거절한다.
  // 백필은 과거 구간용이므로 항상 전일(KST)까지만 조회 — 당일 행은 야간 cron이 채운다.
  const kstYesterday = new Date(Date.now() + 9 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const end = to < kstYesterday ? to : kstYesterday

  let cursor = yyyymmdd(end)
  // 2개 분기 ≈ 120영업일, 1회 30영업일 → 4~5회. 이상 응답 대비 상한.
  for (let i = 0; i < 12; i++) {
    const res = await kisGet<unknown>(
      '/uapi/domestic-stock/v1/quotations/investor-trade-by-stock-daily',
      {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: code,
        FID_INPUT_DATE_1: cursor,
        FID_ORG_ADJ_PRC: '',
        FID_ETC_CLS_CODE: '',
      },
      'FHPTJ04160001',
      { custtype: 'P' },
    )
    const list = (res.output2 ?? []) as Record<string, string>[]
    if (list.length === 0) break

    const priceRows = list
      .map((r) => ({
        code,
        date: toDate(r.stck_bsop_date),
        open: num(r.stck_oprc),
        high: num(r.stck_hgpr),
        low: num(r.stck_lwpr),
        close: num(r.stck_clpr),
        volume: num(r.acml_vol),
        trading_value: num(r.acml_tr_pbmn),
      }))
      .filter((r) => r.date)
    const investorRows = list
      .map((r) => ({
        code,
        date: toDate(r.stck_bsop_date),
        individual_net: num(r.prsn_ntby_qty),
        foreign_net: num(r.frgn_ntby_qty),
        institution_net: num(r.orgn_ntby_qty),
        individual_net_amount: num(r.prsn_ntby_tr_pbmn),
        foreign_net_amount: num(r.frgn_ntby_tr_pbmn),
        institution_net_amount: num(r.orgn_ntby_tr_pbmn),
      }))
      .filter((r) => r.date)

    const { error: pErr } = await db()
      .from('price_daily')
      .upsert(dedupeByKey(priceRows, (r) => r.date!), { onConflict: 'code,date' })
    if (pErr) throw new Error(`price_daily upsert: ${pErr.message}`)

    const { error: iErr } = await db()
      .from('investor_trend_daily')
      .upsert(dedupeByKey(investorRows, (r) => r.date!), { onConflict: 'code,date' })
    if (iErr) throw new Error(`investor_trend_daily upsert: ${iErr.message}`)

    const oldest = [...list].map((r) => toDate(r.stck_bsop_date)).filter(Boolean).sort()[0]
    if (!oldest || oldest <= from) break
    cursor = prevDayYyyymmdd(oldest)
  }
}

/** 분기 손익계산서(누적) 적재. */
async function backfillIncome(code: string): Promise<void> {
  const res = await kisGet<unknown>(
    '/uapi/domestic-stock/v1/finance/income-statement',
    { FID_DIV_CLS_CODE: '1', fid_cond_mrkt_div_code: 'J', fid_input_iscd: code },
    'FHKST66430200',
  )
  const list = (res.output ?? []) as Record<string, string>[]
  const rows = list
    .map((r) => ({
      code,
      period_type: 'Q',
      period: String(r.stac_yymm ?? '').trim(),
      revenue: num(r.sale_account),
      operating_profit: num(r.bsop_prti),
      net_profit: num(r.thtr_ntin),
    }))
    .filter((r) => /^\d{6}$/.test(r.period))
  if (rows.length === 0) return
  const { error } = await db()
    .from('income_statement')
    .upsert(dedupeByKey(rows, (r) => r.period), { onConflict: 'code,period_type,period' })
  if (error) throw new Error(`income_statement upsert: ${error.message}`)
}

/** 분기 재무비율(누적 EPS 등) 적재. */
async function backfillRatio(code: string): Promise<void> {
  const res = await kisGet<unknown>(
    '/uapi/domestic-stock/v1/finance/financial-ratio',
    { FID_DIV_CLS_CODE: '1', fid_cond_mrkt_div_code: 'J', fid_input_iscd: code },
    'FHKST66430300',
  )
  const list = (res.output ?? []) as Record<string, string>[]
  const rows = list
    .map((r) => ({
      code,
      period_type: 'Q',
      period: String(r.stac_yymm ?? '').trim(),
      roe: num(r.roe_val),
      eps: num(r.eps),
      bps: num(r.bps),
      debt_ratio: num(r.lblt_rate),
    }))
    .filter((r) => /^\d{6}$/.test(r.period))
  if (rows.length === 0) return
  const { error } = await db()
    .from('financial_ratio')
    .upsert(dedupeByKey(rows, (r) => r.period), { onConflict: 'code,period_type,period' })
  if (error) throw new Error(`financial_ratio upsert: ${error.message}`)
}

export interface BackfillResult {
  code: string
  ok: boolean
  error?: string
}

/** 한 종목의 시세·수급·분기재무를 채운다. */
export async function backfillStock(code: string, q: QuarterRef): Promise<BackfillResult> {
  try {
    await backfillDaily(code, q)
    await backfillIncome(code)
    await backfillRatio(code)
    return { code, ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[sector/backfill] ${code} failed: ${msg}`)
    return { code, ok: false, error: msg }
  }
}

/** 여러 종목 순차 백필(레이트리밋은 kisGet 내부 큐가 담당). 달력 종목을 자동 포함. */
export async function backfillStocks(codes: string[], q: QuarterRef): Promise<BackfillResult[]> {
  const unique = [...new Set([CALENDAR_CODE, ...codes])]
  const results: BackfillResult[] = []
  for (const code of unique) {
    results.push(await backfillStock(code, q))
  }
  return results
}
