-- Nâng giới hạn dung lượng mỗi tệp của kho riêng tư gb-media từ 50 MB lên 500 MB (dự án đã nâng gói Supabase Pro).
--  - Chỉ đổi file_size_limit của bucket gb-media. Không đổi tính riêng tư (public = false), danh sách loại tệp hay chính sách truy cập.
--  - Không tạo bảng hay cột mới; không đổi dữ liệu cũ (các tệp đã tải vẫn nguyên).
--  - LƯU Ý: bucket không thể vượt giới hạn chung của cả dự án. Chủ dự án cần nâng thêm "Global file size limit"
--    ở Supabase → Storage → Settings lên ít nhất 500 MB; nếu không, tệp lớn hơn mức chung vẫn bị từ chối (HTTP 413).

update storage.buckets
set file_size_limit = 524288000        -- 500 MB
where id = 'gb-media';

-- Hoàn tác (đưa về 50 MB như gói Free):
--   update storage.buckets set file_size_limit = 52428800 where id = 'gb-media';
