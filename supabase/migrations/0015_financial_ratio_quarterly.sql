-- 0015_financial_ratio_quarterly.sql — 재무비율 분기 수집을 위한 연간/분기 구분
-- income_statement와 동일 패턴(period_type 'A' 연간 | 'Q' 분기).
-- 주의: KIS 분기 재무(손익·재무비율)는 YTD 누적값 — DB에는 받은 그대로 저장하고
--       단독 분기값·TTM EPS는 계산 시점에 차분으로 파생한다(섹터 업종 PER 계산 근거).
-- 이 마이그레이션은 cron ratio 데이터셋의 분기 수집 코드 배포보다 먼저 적용해야 한다.

alter table financial_ratio
  add column if not exists period_type char(1) not null default 'A';

alter table financial_ratio drop constraint if exists financial_ratio_pkey;
alter table financial_ratio add primary key (code, period_type, period);
