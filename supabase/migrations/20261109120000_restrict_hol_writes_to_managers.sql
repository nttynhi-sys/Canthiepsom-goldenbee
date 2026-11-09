-- Ngày nghỉ lễ / Trung tâm cho nghỉ (collection 'hol' trong bảng records) quyết định học phí trả trước và công,
-- nên chỉ Trưởng Trung tâm, Quản lý và Văn phòng được ghi. Giáo viên chỉ đọc; phụ huynh nhận qua api/parent.js.
-- Hàm vẫn ở schema private, search_path rỗng, quyền thực thi giữ nguyên (create or replace không đổi quyền).
create or replace function private.can_write_records(coll text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when private.my_role() in ('tt','vp','ql') then true
    when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')
    else false end
$$;

-- HOÀN TÁC (chạy lại hàm với danh sách cũ):
--   create or replace function private.can_write_records(coll text) returns boolean
--   language sql stable security definer set search_path = '' as $$
--     select case
--       when private.my_role() in ('tt','vp','ql') then true
--       when private.my_role() = 'gv' then coll not in ('staff','cfg')
--       else false end
--   $$;
