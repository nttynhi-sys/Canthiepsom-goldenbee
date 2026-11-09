-- Kiểm tra cấu trúc: hàm hỗ trợ chính sách (không phụ thuộc dữ liệu mẫu)
reset role;
do $$ begin
  if to_regprocedure('public.my_role()') is not null or to_regprocedure('public.my_staff_id()') is not null or to_regprocedure('public.can_write_records(text)') is not null then
    raise exception 'FAIL còn hàm hỗ trợ ở schema public';
  end if;
  raise notice 'PASS không còn hàm hỗ trợ ở schema public (không gọi được qua /rest/v1/rpc)';
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'private' and (p.proconfig is null or not p.proconfig @> array['search_path=""'])) then
    raise exception 'FAIL hàm ở private chưa cố định search_path';
  end if;
  raise notice 'PASS hàm ở private cố định search_path rỗng';
  if not (select proconfig @> array['search_path=""'] from pg_proc where oid = 'public.touch_meta'::regproc) then
    raise exception 'FAIL touch_meta chưa cố định search_path';
  end if;
  raise notice 'PASS touch_meta cố định search_path';
end $$;
set role anon;
do $$ begin
  begin perform private.my_role(); raise exception 'FAIL anon gọi được private.my_role';
  exception when insufficient_privilege then raise notice 'PASS anon không gọi được hàm ở private'; end;
end $$;
reset role;
