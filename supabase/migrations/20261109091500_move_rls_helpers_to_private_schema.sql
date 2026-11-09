-- Chuyển 3 hàm hỗ trợ RLS sang schema private để không lộ ra API (/rest/v1/rpc chỉ thấy schema public).
-- Chính sách RLS lưu tham chiếu hàm theo mã nội bộ (OID) nên tự đi theo hàm sang schema mới, không cần viết lại chính sách.
-- Hàm chỉ trả vai trò hoặc mã nhân viên của chính người gọi, cố định search_path rỗng và gọi tên đầy đủ.
-- Chạy sau schema.sql, policies-v3.sql và migration 20261109090955.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter function public.my_role() set schema private;
alter function public.my_staff_id() set schema private;
alter function public.can_write_records(text) set schema private;

create or replace function private.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create or replace function private.my_staff_id() returns text
language sql stable security definer set search_path = '' as $$
  select staff_id from public.profiles where user_id = auth.uid()
$$;

create or replace function private.can_write_records(coll text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when private.my_role() in ('tt','vp','ql') then true
    when private.my_role() = 'gv' then coll not in ('staff','cfg')
    else false end
$$;

revoke execute on function private.my_role(), private.my_staff_id(), private.can_write_records(text) from public, anon;
grant  execute on function private.my_role(), private.my_staff_id(), private.can_write_records(text) to authenticated, service_role;

-- HOÀN TÁC (chạy như một migration mới, chỉ khi cần):
--   alter function private.my_role() set schema public;
--   alter function private.my_staff_id() set schema public;
--   alter function private.can_write_records(text) set schema public;
--   create or replace function public.can_write_records(coll text) returns boolean language sql stable security definer set search_path = public as $f$
--     select case when public.my_role() in ('tt','vp','ql') then true when public.my_role() = 'gv' then coll not in ('staff','cfg') else false end $f$;
--   (rồi cấp lại quyền gọi nếu cần theo migration 20261109090955)
