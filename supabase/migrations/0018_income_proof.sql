-- 0018_income_proof.sql - 두 번째 월급(/income) '통장이 바뀌자 인생이 바뀐 사람들' 사례 카드
-- 이미지는 Storage public-assets 버킷 income/ 폴더에 올리고, image_url에 공개 URL을 그대로 저장한다.
-- 카드 노출 순서는 sort_order 오름차순(같으면 id 순).
-- 접근 제어: 서버 서비스롤 전용. RLS 미사용(trial_asset과 동일).
-- 시각 컬럼은 KST(Asia/Seoul) 벽시계로 저장(0006과 동일).

create table if not exists income_proof (
  id            bigserial primary key,
  title         text     not null,                                -- 카드 제목 (줄바꿈 \n 허용)
  tags          text[]   not null default '{}',                   -- 해시태그 ('#' 없이 저장, 화면에서 붙임)
  job           text     not null,                                -- 직업 (예: 가정주부)
  age_group     smallint not null,                                -- 나이대 (50 → '50대')
  member_months smallint not null,                                -- 가입 개월 수
  image_url     text     not null,                                -- 인증 이미지 공개 URL
  sort_order    int      not null default 0,
  created_at    timestamp not null default (now() at time zone 'Asia/Seoul'),
  constraint income_proof_age_group_check check (age_group between 10 and 90 and age_group % 10 = 0),
  constraint income_proof_member_months_check check (member_months > 0)
);

-- 초기 사례 3건 (테이블이 비어 있을 때만)
insert into income_proof (title, tags, job, age_group, member_months, image_url, sort_order)
select * from (values
  (E'내 이름으로 된\n첫 통장이 생겼다',   array['남편_월급만_보던_삶_끝', '내_용돈은_내가'], '가정주부', 50, 5,
   'https://lgpdodusjdkmqpyxngzm.supabase.co/storage/v1/object/public/public-assets/income/proof-1.jpg', 1),
  (E'월말 카드값\n걱정이 사라졌다',       array['빠듯함이_여유로', '퇴근_후가_편해짐'],      '직장인',   40, 4,
   'https://lgpdodusjdkmqpyxngzm.supabase.co/storage/v1/object/public/public-assets/income/proof-2.jpg', 2),
  (E'장사 안 되는 날도\n버틸 힘이 생겼다', array['비상금_6개월치', '불안이_줄었다'],          '자영업자', 50, 6,
   'https://lgpdodusjdkmqpyxngzm.supabase.co/storage/v1/object/public/public-assets/income/proof-3.jpg', 3)
) as v(title, tags, job, age_group, member_months, image_url, sort_order)
where not exists (select 1 from income_proof);
