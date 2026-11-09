-- Golden Bee: chính sách bảo mật v3. Chạy MỘT LẦN trong SQL Editor (chạy sau schema.sql; chạy lại nhiều lần vẫn an toàn).
-- Thay thế hoàn toàn policies-v2.sql, nên không cần chạy v2 nếu chạy v3.
-- Bổ sung so với v2:
--  1. Cột số điện thoại trong profiles để đăng nhập bằng số điện thoại (mỗi số chỉ thuộc một tài khoản).
--  2. Giáo viên đọc lương và thưởng của mình theo mã nhân viên (không phụ thuộc vào email), dùng được cho tài khoản chỉ có số điện thoại.
--  3. Khẳng định lại: phụ huynh (ph) không đọc hay ghi trực tiếp bảng nào. Phụ huynh chỉ đi qua cổng /api/parent.
--  4. Ba hàm hỗ trợ chính sách (my_role, my_staff_id, can_write_records) nằm ở schema `private`, không lộ ra API công khai
--     (/rest/v1/rpc chỉ thấy schema public) và người chưa đăng nhập không gọi được. Tệp này đưa dự án về đúng trạng thái đó
--     dù trước đó dự án ở schema.sql, v2, v3 cũ hay đã chạy các migration trong supabase/migrations.

alter table public.profiles add column if not exists phone text;
create unique index if not exists profiles_phone_uniq on public.profiles (phone) where phone is not null;

-- Hàm hỗ trợ ở schema private: chỉ người đã đăng nhập (và máy chủ) dùng được
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- Vai trò của người đang đăng nhập
create or replace function private.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where user_id = auth.uid()
$$;

-- Mã nhân viên của người đang đăng nhập (để giáo viên đọc lương của chính mình)
create or replace function private.my_staff_id() returns text
language sql stable security definer set search_path = '' as $$
  select staff_id from public.profiles where user_id = auth.uid()
$$;

-- Quyền ghi dữ liệu chung theo từng nhóm
create or replace function private.can_write_records(coll text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when private.my_role() in ('tt','vp','ql') then true
    when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')   -- hol: ngày nghỉ lễ ảnh hưởng học phí, giáo viên chỉ đọc
    else false end
$$;

revoke execute on function private.my_role(), private.my_staff_id(), private.can_write_records(text) from public, anon;
grant  execute on function private.my_role(), private.my_staff_id(), private.can_write_records(text) to authenticated, service_role;

-- Hàm cập nhật thời gian sửa: cố định search_path
alter function public.touch_meta() set search_path = '';

-- Tạo lại toàn bộ chính sách (gồm cả profiles và các chính sách của schema.sql) để trỏ sang hàm ở private
drop policy if exists "profile_read_own"  on public.profiles;
drop policy if exists "profile_tt_manage" on public.profiles;
drop policy if exists "records_read"      on public.records;
drop policy if exists "records_write"     on public.records;
drop policy if exists "records_ins"       on public.records;
drop policy if exists "records_upd"       on public.records;
drop policy if exists "records_del"       on public.records;
drop policy if exists "money_tt_vp"       on public.money_records;
drop policy if exists "money_gv_read_own" on public.money_records;

-- profiles: mỗi người đọc hồ sơ của mình; chỉ tt được tạo và sửa vai trò
create policy "profile_read_own" on public.profiles for select
  using (user_id = auth.uid() or private.my_role() = 'tt');
create policy "profile_tt_manage" on public.profiles for all
  using (private.my_role() = 'tt') with check (private.my_role() = 'tt');

-- Dữ liệu chung: nhân viên trung tâm đọc được. Phụ huynh (ph) không có quyền.
create policy "records_read" on public.records for select
  using (private.my_role() in ('tt','vp','ql','gv'));
create policy "records_ins" on public.records for insert
  with check (private.can_write_records(collection));
create policy "records_upd" on public.records for update
  using (private.can_write_records(collection)) with check (private.can_write_records(collection));
create policy "records_del" on public.records for delete
  using (private.can_write_records(collection));

-- Dữ liệu tiền: Trưởng Trung tâm và Văn phòng đọc và ghi toàn bộ
create policy "money_tt_vp" on public.money_records for all
  using (private.my_role() in ('tt','vp')) with check (private.my_role() in ('tt','vp'));

-- Giáo viên chỉ ĐỌC: cấu hình tiền chung (để tính phiếu lương), lương và thưởng của chính mình
create policy "money_gv_read_own" on public.money_records for select
  using (
    private.my_role() = 'gv' and (
      collection = 'cfgm'
      or (collection = 'pay' and money_records.id = private.my_staff_id())
      or (collection = 'bon' and split_part(money_records.id, '|', 1) = private.my_staff_id())
    )
  );

-- Gỡ bản cũ ở schema public (chưa còn chính sách nào trỏ tới)
drop function if exists public.can_write_records(text);
drop function if exists public.my_staff_id();
drop function if exists public.my_role();
