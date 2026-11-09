-- Khóa cổng phụ huynh quá hạn học phí: bản ghi mở khóa tạm (collection 'pul' trong bảng records, id là khóa phụ huynh)
-- chỉ do hàm máy chủ api/plock.js ghi bằng khóa secret (bỏ qua RLS) sau khi kiểm tra vai trò Trưởng Trung tâm, Quản lý, Văn phòng.
-- Vì vậy không vai trò nào được ghi collection này trực tiếp từ trình duyệt (kể cả Trưởng Trung tâm), để người dùng không tự
-- mở khóa hoặc đặt ngày mở khóa tùy ý. Đọc vẫn theo chính sách chung. Hàm vẫn ở schema private, search_path rỗng.
create or replace function private.can_write_records(coll text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when coll = 'pul' then false
    when private.my_role() in ('tt','vp','ql') then true
    when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')
    else false end
$$;

-- HOÀN TÁC (về danh sách của bản trước, khi 'pul' chưa tồn tại):
--   create or replace function private.can_write_records(coll text) returns boolean
--   language sql stable security definer set search_path = '' as $$
--     select case
--       when private.my_role() in ('tt','vp','ql') then true
--       when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')
--       else false end
--   $$;
--   -- và xóa các bản ghi mở khóa nếu cần: delete from public.records where collection = 'pul';
