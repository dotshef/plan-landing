-- 0016_rename_requested_items.sql — requested_items → indicator_items
-- 이 컬럼은 '영상 속 자료 받기'(source_page='indicators')에서 고른 지표/자료명만 담는다.
-- 다른 유입 페이지는 값을 채우지 않으므로 용도를 이름에 명시한다.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'report_request' and column_name = 'requested_items'
  ) and not exists (
    select 1 from information_schema.columns
    where table_name = 'report_request' and column_name = 'indicator_items'
  ) then
    alter table report_request rename column requested_items to indicator_items;
  end if;
end $$;

alter table report_request
  add column if not exists indicator_items text;       -- '영상 속 자료 받기'에서 선택한 자료명
