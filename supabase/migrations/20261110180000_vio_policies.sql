-- Vi phạm nội quy (collection vio) và số tiền trừ lương (money_records, collection vam).
--  1) Collection mới 'vio' (ghi nhận vi phạm nội quy của nhân sự) trong bảng records; số tiền trừ lương nằm ở
--     money_records, collection 'vam' (khóa 'mãNhânViên|mãViPhạm'). Không tạo bảng hay cột mới; không đổi dữ liệu cũ.
--     - Ghi vio: Trưởng Trung tâm (tt) mọi thao tác; Quản lý (ql) chỉ tạo, sửa, xóa bản ghi đang chờ duyệt (s = 'cho'),
--       và không ghi vi phạm về chính mình; Văn phòng (vp), Giáo viên (gv), phụ huynh không ghi.
--     - Đọc vio: tt, vp, ql đọc hết; Giáo viên chỉ đọc vi phạm ĐÃ DUYỆT của chính mình; phụ huynh không đọc bảng.
--     - vam (tiền): tt, vp đọc ghi (chính sách money_tt_vp có sẵn); Giáo viên chỉ đọc số tiền của chính mình; ql không thấy tiền.
--  (Việc chặn giáo viên tự chấm công 'ts' nằm ở migration riêng 20261110180100_ts_manager_only.sql, áp dụng sau khi bản giao diện mới lên Production,
--   để giao diện cũ đang chạy không bị lỗi khi giáo viên bấm chấm công.)

create or replace function private.can_write_records(coll text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when coll = 'pul' then false   -- pul: mở khóa cổng phụ huynh quá hạn, chỉ api/plock.js (khóa secret) ghi
    when coll in ('ref','tri','vio') then private.my_role() in ('tt','ql')   -- tài liệu tham khảo, góc tri ân, vi phạm nội quy: chỉ Trưởng Trung tâm, Quản lý (vio còn bị vio_ok giới hạn thêm)
    when private.my_role() in ('tt','vp','ql') then true
    when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')   -- hol: ngày nghỉ lễ ảnh hưởng học phí, giáo viên chỉ đọc
    else false end
$$;

-- Giới hạn thêm cho collection 'vio': tt làm mọi thao tác; ql chỉ với bản ghi chờ duyệt và không phải về chính mình
create or replace function private.vio_ok(coll text, d jsonb) returns boolean
language sql stable security definer set search_path = '' as $$
  select coll <> 'vio'
    or private.my_role() = 'tt'
    or (private.my_role() = 'ql' and d->>'s' = 'cho' and coalesce(d->>'st','') <> coalesce(private.my_staff_id(),''))
$$;

revoke execute on function private.can_write_records(text), private.vio_ok(text, jsonb) from public, anon;
grant  execute on function private.can_write_records(text), private.vio_ok(text, jsonb) to authenticated, service_role;

drop policy if exists "records_read" on public.records;
drop policy if exists "records_ins"  on public.records;
drop policy if exists "records_upd"  on public.records;
drop policy if exists "records_del"  on public.records;
drop policy if exists "money_gv_read_own" on public.money_records;

create policy "records_read" on public.records for select
  using (
    private.my_role() in ('tt','vp','ql')
    or (private.my_role() = 'gv' and (
      collection <> 'vio'
      or (data->>'st' = private.my_staff_id() and data->>'s' = 'duyet')))
  );
create policy "records_ins" on public.records for insert
  with check (private.can_write_records(collection) and private.vio_ok(collection, data));
create policy "records_upd" on public.records for update
  using (private.can_write_records(collection) and private.vio_ok(collection, data))
  with check (private.can_write_records(collection) and private.vio_ok(collection, data));
create policy "records_del" on public.records for delete
  using (private.can_write_records(collection) and private.vio_ok(collection, data));

create policy "money_gv_read_own" on public.money_records for select
  using (
    private.my_role() = 'gv' and (
      collection = 'cfgm'
      or (collection = 'pay' and money_records.id = private.my_staff_id())
      or (collection = 'bon' and split_part(money_records.id, '|', 1) = private.my_staff_id())
      or (collection = 'vam' and split_part(money_records.id, '|', 1) = private.my_staff_id())
    )
  );

-- HOÀN TÁC (đưa về trạng thái trước migration này; dữ liệu vio, vam đã ghi vẫn nằm trong bảng, xóa riêng nếu cần):
--   create or replace function private.can_write_records(coll text) returns boolean
--   language sql stable security definer set search_path = '' as $f$
--     select case
--       when coll = 'pul' then false
--       when coll in ('ref','tri') then private.my_role() in ('tt','ql')
--       when private.my_role() in ('tt','vp','ql') then true
--       when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')
--       else false end
--   $f$;
--   drop policy if exists "records_read" on public.records;  drop policy if exists "records_ins" on public.records;
--   drop policy if exists "records_upd"  on public.records;  drop policy if exists "records_del" on public.records;
--   drop policy if exists "money_gv_read_own" on public.money_records;
--   create policy "records_read" on public.records for select using (private.my_role() in ('tt','vp','ql','gv'));
--   create policy "records_ins" on public.records for insert with check (private.can_write_records(collection));
--   create policy "records_upd" on public.records for update using (private.can_write_records(collection)) with check (private.can_write_records(collection));
--   create policy "records_del" on public.records for delete using (private.can_write_records(collection));
--   create policy "money_gv_read_own" on public.money_records for select using (private.my_role() = 'gv' and (collection = 'cfgm'
--     or (collection = 'pay' and money_records.id = private.my_staff_id())
--     or (collection = 'bon' and split_part(money_records.id, '|', 1) = private.my_staff_id())));
--   drop function if exists private.vio_ok(text, jsonb);
--   delete from public.records where collection = 'vio';  delete from public.money_records where collection = 'vam';   -- chỉ khi chắc chắn bỏ tính năng
