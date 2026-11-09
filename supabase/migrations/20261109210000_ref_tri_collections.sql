-- Hai nhóm dữ liệu mới cho phụ huynh đọc:
--   ref = Tài liệu tham khảo (hướng dẫn, video mẫu dạy bé tại nhà), chung cho mọi phụ huynh.
--   tri = Góc tri ân (ảnh bé tốt nghiệp, tiến bộ, lời cảm ơn của gia đình), chung cho mọi phụ huynh.
-- Chỉ Trưởng Trung tâm (tt) và Quản lý (ql) được thêm, sửa, xóa hai nhóm này; Văn phòng (vp) và Giáo viên (gv) chỉ đọc.
-- Phụ huynh (ph) không đọc bảng trực tiếp: api/parent.js trả bản đã lọc (chỉ mục đã đăng, không lộ đường dẫn kho).
-- Tệp nằm trong kho riêng tư gb-media: tiền tố r/ cho tài liệu tham khảo, t/ cho ảnh tri ân. Chỉ tt, ql tải lên và xóa ở hai tiền tố này.
-- Không tạo bảng hay cột mới; không đổi dữ liệu cũ.

create or replace function private.can_write_records(coll text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when coll = 'pul' then false   -- pul: mở khóa cổng phụ huynh quá hạn, chỉ api/plock.js (khóa secret) ghi
    when coll in ('ref','tri') then private.my_role() in ('tt','ql')   -- tài liệu tham khảo, góc tri ân: chỉ Trưởng Trung tâm, Quản lý
    when private.my_role() in ('tt','vp','ql') then true
    when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')   -- hol: ngày nghỉ lễ ảnh hưởng học phí, giáo viên chỉ đọc
    else false end
$$;
revoke execute on function private.can_write_records(text) from public, anon;
grant  execute on function private.can_write_records(text) to authenticated, service_role;

drop policy if exists "gbm_insert" on storage.objects;
drop policy if exists "gbm_delete" on storage.objects;
create policy "gbm_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'gb-media' and (
    (name like 'm/%' and private.my_role() in ('tt','vp','ql','gv'))
    or ((name like 'r/%' or name like 't/%') and private.my_role() in ('tt','ql'))));
create policy "gbm_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'gb-media' and (
    (name like 'r/%' or name like 't/%') and private.my_role() in ('tt','ql')
    or (name not like 'r/%' and name not like 't/%' and (private.my_role() in ('tt','vp','ql') or (private.my_role() = 'gv' and owner_id = auth.uid()::text)))));

-- HOÀN TÁC (xóa tệp ở r/ và t/ bằng giao diện hoặc API Storage trước nếu cần giữ kho gọn; không xóa trực tiếp bảng storage.objects):
--   create or replace function private.can_write_records(coll text) returns boolean
--   language sql stable security definer set search_path = '' as $f$
--     select case
--       when coll = 'pul' then false
--       when private.my_role() in ('tt','vp','ql') then true
--       when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')
--       else false end
--   $f$;
--   drop policy if exists "gbm_insert" on storage.objects;
--   drop policy if exists "gbm_delete" on storage.objects;
--   create policy "gbm_insert" on storage.objects for insert to authenticated
--     with check (bucket_id = 'gb-media' and name like 'm/%' and private.my_role() in ('tt','vp','ql','gv'));
--   create policy "gbm_delete" on storage.objects for delete to authenticated
--     using (bucket_id = 'gb-media' and (private.my_role() in ('tt','vp','ql') or (private.my_role() = 'gv' and owner_id = auth.uid()::text)));
--   delete from public.records where collection in ('ref','tri');   -- chỉ khi chắc chắn bỏ tính năng
