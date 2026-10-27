-- 0022_site_image.sql - 페이지 고정 이미지 칸(한 칸 = 이미지 한 장). 관리자 '페이지 이미지 관리'에서 이미지 교체만 한다(alt는 시드 값 고정).
--   main_journal_sms : 메인(/) '실제 매매일지와 추천 문자'
--   income_deposit   : 두 번째 월급(/income) 히어로 '월급날이 한 달에 두 번이 됐습니다'
-- 교체 이미지는 Storage public-assets 버킷 site/ 폴더에 매번 새 이름으로 올리고 image_url에 공개 URL을 저장한다.
-- 초기값은 저장소의 public/images 정적 파일 경로(교체 시 Storage 오브젝트가 아니므로 지우지 않는다).
-- width·height는 원본 픽셀 크기 - 화면에서 이미지 로드 전 비율 자리를 잡는 데 쓴다.
-- 접근 제어: 서버 서비스롤 전용. RLS 미사용(trial_asset과 동일).
-- 시각 컬럼은 KST(Asia/Seoul) 벽시계로 저장(0006과 동일).

create table if not exists site_image (
  key        text primary key,
  image_url  text not null,
  alt        text not null,
  width      int  not null,
  height     int  not null,
  updated_at timestamp not null default (now() at time zone 'Asia/Seoul')
);

insert into site_image (key, image_url, alt, width, height) values
  ('main_journal_sms', '/images/plan-journal-sms-example.jpg',
   '엑셀 매매일지와 추천 문자 화면 예시: 일자·종목명·매수가·매도가·수익률 내역과 투자그룹 플랜의 매수 시그널 문자. 클릭하면 원본 이미지가 새 탭에서 열립니다.',
   1024, 721),
  ('income_deposit', '/images/plan-deposit-notifications-example.png',
   '스마트폰 입금 알림 가상 예시: 파란색 배경에 노란색·파란색 은행 알림 두 개가 표시되며, 은행 아이콘과 개인정보·금액은 블러 처리되어 있습니다.',
   1586, 992)
on conflict (key) do nothing;
