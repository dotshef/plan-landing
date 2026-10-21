-- 0017_income_request.sql — 신규 페이지 '두 번째 월급'(/income) 신청 고객 정보 적재
-- 기존 리드(report_request)와 분리된 별도 테이블. 컬럼 구성은 report_request를 따르되
-- income 페이지에서 쓰지 않는 값은 제외한다.
--   - stock           : income 폼에는 관심 종목 입력이 없음
--   - source_page     : 테이블 자체가 출처(income)를 의미함
--   - indicator_items : '영상 속 자료 받기' 전용 값
-- 접근 제어: 서버 서비스롤 전용. RLS 미사용(report_request와 동일).
-- 시각 컬럼은 KST(Asia/Seoul) 벽시계로 저장(0006과 동일).

create table if not exists income_request (
  id                bigserial primary key,
  name              text      not null,                              -- 신청자 이름
  phone             text      not null,                              -- 연락처 (숫자만, 10~11자리)
  traffic_source    text      not null default 'unknown',            -- 광고 유입 매체
  ad_keyword        text,                                            -- 네이버 광고 키워드
  ad_campaign_id    text,                                            -- 구글 광고 캠페인 ID (gad_campaignid)
  ad_campaign_label text,                                            -- 구글 광고 직접 지정 캠페인 라벨 (c 파라미터)
  landing_url       text,                                            -- 최초 유입 랜딩 URL
  requested_at      timestamp not null default (now() at time zone 'Asia/Seoul'), -- 신청 시각
  created_at        timestamp not null default (now() at time zone 'Asia/Seoul'),
  constraint income_request_traffic_source_check
    check (traffic_source in ('google', 'naver', 'unknown'))
);

-- 최근 신청 조회용
create index if not exists income_request_requested_at_idx
  on income_request (requested_at desc);

-- 최근 2개월 내 동일 이름/연락처 접수 이력 조회용
create index if not exists income_request_name_phone_requested_at_idx
  on income_request (name, phone, requested_at desc);
