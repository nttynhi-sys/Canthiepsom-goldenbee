-- Kho tệp riêng tư cho ảnh, video và tài liệu (bucket gb-media).
--  - Không công khai: public = false. Không ai đọc được nếu không có đường dẫn ký tạm thời.
--  - Nhân viên (tt, vp, ql, gv) đọc và tải lên; xóa: tt, vp, ql xóa được mọi tệp, giáo viên chỉ xóa tệp do mình tải lên.
--  - Phụ huynh (ph) KHÔNG có chính sách nào: chỉ xem qua api/parent.js (khóa secret ký đường dẫn tạm thời, chỉ ảnh/video/tài liệu của bé mình).
--  - Giới hạn 50 MB mỗi tệp (gói Free của Supabase), chỉ nhận ảnh, video, PDF, Office, CSV, văn bản. Không nhận HTML hoặc SVG.
--  - Tệp nằm dưới tiền tố m/ . Thông tin ai được xem (bé nào, lớp nào, chia sẻ phụ huynh) lưu ở bảng records, collection 'media'.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gb-media', 'gb-media', false, 52428800, array[
  'image/jpeg','image/png','image/webp','image/gif',
  'video/mp4','video/webm','video/quicktime',
  'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv','text/plain','text/markdown'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "gbm_read"   on storage.objects;
drop policy if exists "gbm_insert" on storage.objects;
drop policy if exists "gbm_delete" on storage.objects;
create policy "gbm_read" on storage.objects for select to authenticated
  using (bucket_id = 'gb-media' and private.my_role() in ('tt','vp','ql','gv'));
create policy "gbm_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'gb-media' and name like 'm/%' and private.my_role() in ('tt','vp','ql','gv'));
create policy "gbm_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'gb-media' and (private.my_role() in ('tt','vp','ql') or (private.my_role() = 'gv' and owner_id = auth.uid()::text)));

-- HOÀN TÁC (chỉ khi kho đã rỗng; xóa tệp trước bằng giao diện hoặc API Storage, không xóa trực tiếp bảng storage.objects):
--   drop policy if exists "gbm_read" on storage.objects;
--   drop policy if exists "gbm_insert" on storage.objects;
--   drop policy if exists "gbm_delete" on storage.objects;
--   delete from storage.buckets where id = 'gb-media';
--   delete from public.records where collection = 'media';
