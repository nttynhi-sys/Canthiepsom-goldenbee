-- Dạy thay: phân giáo viên khác dạy thay buổi của giáo viên nghỉ ốm, nghỉ phép.
--  - Dữ liệu là collection 'sub' trong bảng records (không phải tiền, không tạo bảng hay cột mới).
--  - Chỉ tt, ql, vp ghi được 'sub' (như 'ts'); gv chỉ đọc để biết mình được phân dạy thay; ph không đọc bảng.
--  - Chỉ đổi hàm private.can_write_records; không đổi dữ liệu cũ.

create or replace function private.can_write_records(coll text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when coll = 'pul' then false   -- pul: mở khóa cổng phụ huynh quá hạn, chỉ api/plock.js (khóa secret) ghi
    when coll in ('ref','tri','vio') then private.my_role() in ('tt','ql')   -- tài liệu tham khảo, góc tri ân, vi phạm nội quy: chỉ Trưởng Trung tâm, Quản lý (vio còn bị vio_ok giới hạn thêm)
    when coll in ('ts','sub') then private.my_role() in ('tt','vp','ql')   -- chấm công, dạy thay: giáo viên chỉ xem
    when private.my_role() in ('tt','vp','ql') then true
    when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')   -- hol: ngày nghỉ lễ ảnh hưởng học phí, giáo viên chỉ đọc
    else false end
$$;

-- HOÀN TÁC (cho giáo viên ghi lại 'sub'; các dòng sub đã có giữ nguyên):
--   create or replace function private.can_write_records(coll text) returns boolean
--   language sql stable security definer set search_path = '' as $f$
--     select case
--       when coll = 'pul' then false
--       when coll in ('ref','tri','vio') then private.my_role() in ('tt','ql')
--       when coll = 'ts' then private.my_role() in ('tt','vp','ql')
--       when private.my_role() in ('tt','vp','ql') then true
--       when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')
--       else false end
--   $f$;
