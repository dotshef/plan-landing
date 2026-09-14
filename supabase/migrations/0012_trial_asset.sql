-- 0012_trial_asset.sql — 추천주 7일 체험 페이지 동적 이미지 (Supabase Storage 연동)
-- 접근 제어: 서버 서비스롤 전용. RLS 미사용(v1).
-- review 최대 3개 제한은 DB 제약이 아니라 업로드 API에서 검사한다(명확한 에러 메시지 목적).

create table if not exists trial_asset (
  id           bigserial primary key,
  kind         text not null check (kind in ('sms', 'chart', 'review')),
  group_no     smallint,                               -- sms·chart를 한 세트로 묶는 번호. review는 null
  storage_path text not null,                          -- Storage 오브젝트 경로 (trial/{kind}/{uuid}.{ext})
  alt          text,
  sort_order   int  not null default 0,
  created_at   timestamp not null default (now() at time zone 'Asia/Seoul')
);
create index if not exists trial_asset_kind_sort_idx on trial_asset (kind, sort_order);

-- Storage 버킷 (public read). 이미 있으면 무시.
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;
