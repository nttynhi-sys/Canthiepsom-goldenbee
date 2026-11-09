-- Golden Bee: chính sách bảo mật v3. Chạy MỘT LẦN trong SQL Editor (chạy sau schema.sql; chạy lại nhiều lần vẫn an toàn).
-- Thay thế hoàn toàn policies-v2.sql, nên không cần chạy v2 nếu chạy v3.
-- Bổ sung so với v2:
--  1. Cột số điện thoại trong profiles để đăng nhập bằng số điện thoại (mỗi số chỉ thuộc một tài khoản).
--  2. Giáo viên đọc lương và thưởng của mình theo mã nhân viên (không phụ thuộc vào email), dùng được cho tài khoản chỉ có số điện thoại.
--  3. Khẳng định lại: phụ huynh (ph) không đọc hay ghi trực tiếp bảng nào. Phụ huynh chỉ đi qua cổng /api/parent.

alter table public.profiles add column if not exists phone text;
create unique index if not exists profiles_phone_uniq on public.profiles (phone) where phone is not null;

-- Mã nhân viên của người đang đăng nhập (để giáo viên đọc lương của chính mình)
create or replace function public.my_staff_id() returns text
language sql stable security definer set search_path = public as $$
  select staff_id from public.profiles where user_id = auth.uid()
$$;

-- Quyền ghi dữ liệu chung theo từng nhóm
create or replace function public.can_write_records(coll text) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when public.my_role() in ('tt','vp','ql') then true
    when public.my_role() = 'gv' then coll not in ('staff','cfg')
    else false end
$$;

drop policy if exists "records_read"      on public.records;
drop policy if exists "records_write"     on public.records;
drop policy if exists "records_ins"       on public.records;
drop policy if exists "records_upd"       on public.records;
drop policy if exists "records_del"       on public.records;
drop policy if exists "money_tt_vp"       on public.money_records;
drop policy if exists "money_gv_read_own" on public.money_records;

-- Dữ liệu chung: nhân viên trung tâm đọc được. Phụ huynh (ph) không có quyền.
create policy "records_read" on public.records for select
  using (public.my_role() in ('tt','vp','ql','gv'));
create policy "records_ins" on public.records for insert
  with check (public.can_write_records(collection));
create policy "records_upd" on public.records for update
  using (public.can_write_records(collection)) with check (public.can_write_records(collection));
create policy "records_del" on public.records for delete
  using (public.can_write_records(collection));

-- Dữ liệu tiền: Trưởng Trung tâm và Văn phòng đọc và ghi toàn bộ
create policy "money_tt_vp" on public.money_records for all
  using (public.my_role() in ('tt','vp')) with check (public.my_role() in ('tt','vp'));

-- Giáo viên chỉ ĐỌC: cấu hình tiền chung (để tính phiếu lương), lương và thưởng của chính mình
create policy "money_gv_read_own" on public.money_records for select
  using (
    public.my_role() = 'gv' and (
      collection = 'cfgm'
      or (collection = 'pay' and money_records.id = public.my_staff_id())
      or (collection = 'bon' and split_part(money_records.id, '|', 1) = public.my_staff_id())
    )
  );
