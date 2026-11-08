-- Golden Bee: chính sách bảo mật v2. Chạy MỘT LẦN trong SQL Editor, sau schema.sql.
-- Thay các chính sách cũ: phụ huynh chưa đọc được gì, lương của giáo viên chỉ đọc phần của mình,
-- giáo viên không sửa được hồ sơ nhân sự và cấu hình.

drop policy if exists "records_read"  on public.records;
drop policy if exists "records_write" on public.records;
drop policy if exists "money_tt_vp"   on public.money_records;

-- Quyền ghi dữ liệu chung theo từng nhóm
create or replace function public.can_write_records(coll text) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when public.my_role() in ('tt','vp','ql') then true
    when public.my_role() = 'gv' then coll not in ('staff','cfg')
    else false end
$$;

-- Dữ liệu chung: nhân viên trung tâm đọc được. Phụ huynh (ph) chưa có quyền.
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
      or (collection = 'pay' and exists (
            select 1 from public.records s
            where s.collection = 'staff' and s.id = money_records.id
              and lower(s.data->>'em') = lower(auth.jwt()->>'email')))
      or (collection = 'bon' and exists (
            select 1 from public.records s
            where s.collection = 'staff' and s.id = split_part(money_records.id, '|', 1)
              and lower(s.data->>'em') = lower(auth.jwt()->>'email')))
    )
  );
