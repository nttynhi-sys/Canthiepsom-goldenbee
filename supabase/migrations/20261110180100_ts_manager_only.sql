-- Chấm công do Quản lý thực hiện: giáo viên không tự chấm công nữa.
--  - Chỉ tt, ql, vp ghi được collection 'ts' (tt, ql chấm công cho nhân sự làm giờ cố định; vp giữ việc tự chấm công của mình); gv chỉ đọc.
--  - Áp dụng SAU khi giao diện mới (không còn nút tự chấm công của giáo viên) đã lên Production; trước đó giao diện cũ vẫn ghi 'ts' cho giáo viên.
--  - Không tạo bảng hay cột mới; không đổi dữ liệu cũ (công đã chấm vẫn nguyên).

create or replace function private.can_write_records(coll text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when coll = 'pul' then false   -- pul: mở khóa cổng phụ huynh quá hạn, chỉ api/plock.js (khóa secret) ghi
    when coll in ('ref','tri','vio') then private.my_role() in ('tt','ql')   -- tài liệu tham khảo, góc tri ân, vi phạm nội quy: chỉ Trưởng Trung tâm, Quản lý (vio còn bị vio_ok giới hạn thêm)
    when coll = 'ts' then private.my_role() in ('tt','vp','ql')   -- chấm công: giáo viên không tự chấm, chỉ xem
    when private.my_role() in ('tt','vp','ql') then true
    when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')   -- hol: ngày nghỉ lễ ảnh hưởng học phí, giáo viên chỉ đọc
    else false end
$$;

-- HOÀN TÁC (cho giáo viên ghi lại 'ts'):
--   create or replace function private.can_write_records(coll text) returns boolean
--   language sql stable security definer set search_path = '' as $f$
--     select case
--       when coll = 'pul' then false
--       when coll in ('ref','tri','vio') then private.my_role() in ('tt','ql')
--       when private.my_role() in ('tt','vp','ql') then true
--       when private.my_role() = 'gv' then coll not in ('staff','cfg','hol')
--       else false end
--   $f$;
