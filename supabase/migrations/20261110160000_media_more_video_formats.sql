-- Mở thêm định dạng video từ điện thoại cho kho riêng tư gb-media (ảnh, video, tài liệu của bé).
--  - Thêm: M4V (x-m4v), 3GP, 3G2, MKV, AVI, MPEG, WMV. Giữ nguyên các loại cũ (MP4, WebM, MOV, ảnh, PDF, Office, CSV, văn bản).
--  - Không đổi tính riêng tư (public = false), giới hạn dung lượng hay chính sách truy cập; không đổi dữ liệu cũ.
--  - Lưu ý: trình duyệt không phát được mọi định dạng (ví dụ MKV, AVI có thể không xem trực tiếp được), nhưng tệp vẫn được lưu và tải về.

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg','image/png','image/webp','image/gif',
  'video/mp4','video/webm','video/quicktime','video/x-m4v','video/3gpp','video/3gpp2',
  'video/x-matroska','video/x-msvideo','video/mpeg','video/x-ms-wmv',
  'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv','text/plain','text/markdown']
where id = 'gb-media';

-- HOÀN TÁC (đưa về danh sách cũ; tệp đã tải với định dạng mới phải xóa trước, nếu không sẽ không khớp):
--   update storage.buckets set allowed_mime_types = array[
--     'image/jpeg','image/png','image/webp','image/gif',
--     'video/mp4','video/webm','video/quicktime',
--     'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
--     'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
--     'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
--     'text/csv','text/plain','text/markdown']
--   where id = 'gb-media';
