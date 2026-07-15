-- 구글 광고 캠페인 ID와 공통 최초 유입 랜딩 URL 적재

alter table report_request
  add column if not exists ad_campaign_id text,
  add column if not exists landing_url text;
