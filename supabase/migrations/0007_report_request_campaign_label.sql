-- 구글 광고 최종 URL의 직접 지정 캠페인 라벨(c 파라미터, 예: cam4) 적재
-- 자동 태깅 숫자 ID(ad_campaign_id, gad_campaignid)와 별개의 사용자 지정 값

alter table report_request
  add column if not exists ad_campaign_label text;
