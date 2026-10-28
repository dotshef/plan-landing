-- 0019_main_proof.sql - 메인(/) 히어로 '말이 아닌 결과로 증명합니다' 공증 자료 벽
-- 이미지는 Storage public-assets 버킷 proof/ 폴더에 올리고, image_url에 공개 URL을 그대로 저장한다(income_proof와 동일).
-- 노출 순서는 sort_order 오름차순(같으면 id 순). 화면에서 홀수 번째는 왼쪽 열, 짝수 번째는 오른쪽 열에 놓인다.
-- 접근 제어: 서버 서비스롤 전용. RLS 미사용(trial_asset과 동일).
-- 시각 컬럼은 KST(Asia/Seoul) 벽시계로 저장(0006과 동일).

create table if not exists main_proof (
  id          bigserial primary key,
  alt         text not null,                                    -- 이미지 대체 텍스트 (예: 2026년 4월 추천 종목 청산 내역)
  image_url   text not null,                                    -- 공증 자료 이미지 공개 URL
  sort_order  int  not null default 0,
  created_at  timestamp not null default (now() at time zone 'Asia/Seoul')
);

-- 초기 자료 6건 - 2026년 4~6월 사실확인서 1쪽(요약)·2쪽(청산 내역) (테이블이 비어 있을 때만)
insert into main_proof (alt, image_url, sort_order)
select * from (values
  ('2026년 4월 추천 종목 청산 수익률 사실확인서', 'https://lgpdodusjdkmqpyxngzm.supabase.co/storage/v1/object/public/public-assets/proof/2026-04-1.webp', 1),
  ('2026년 4월 추천 종목 청산 내역',             'https://lgpdodusjdkmqpyxngzm.supabase.co/storage/v1/object/public/public-assets/proof/2026-04-2.webp', 2),
  ('2026년 5월 추천 종목 청산 수익률 사실확인서', 'https://lgpdodusjdkmqpyxngzm.supabase.co/storage/v1/object/public/public-assets/proof/2026-05-1.webp', 3),
  ('2026년 5월 추천 종목 청산 내역',             'https://lgpdodusjdkmqpyxngzm.supabase.co/storage/v1/object/public/public-assets/proof/2026-05-2.webp', 4),
  ('2026년 6월 추천 종목 청산 수익률 사실확인서', 'https://lgpdodusjdkmqpyxngzm.supabase.co/storage/v1/object/public/public-assets/proof/2026-06-1.webp', 5),
  ('2026년 6월 추천 종목 청산 내역',             'https://lgpdodusjdkmqpyxngzm.supabase.co/storage/v1/object/public/public-assets/proof/2026-06-2.webp', 6)
) as v(alt, image_url, sort_order)
where not exists (select 1 from main_proof);
