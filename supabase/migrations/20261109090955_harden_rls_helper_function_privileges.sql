-- Siết quyền gọi các hàm hỗ trợ RLS và cố định search_path cho hàm cập nhật thời gian.
-- Đã áp dụng lên dự án bqvwibipmzyrkrwlfoqf ngày 2026-11-09 (phiên bản 20261109090955). Chạy lại nhiều lần vẫn an toàn.
-- Trước đó: người chưa đăng nhập (anon) gọi được 3 hàm này qua /rest/v1/rpc.
revoke execute on function public.my_role() from public, anon;
revoke execute on function public.my_staff_id() from public, anon;
revoke execute on function public.can_write_records(text) from public, anon;
grant execute on function public.my_role() to authenticated, service_role;
grant execute on function public.my_staff_id() to authenticated, service_role;
grant execute on function public.can_write_records(text) to authenticated, service_role;
alter function public.touch_meta() set search_path = '';

-- HOÀN TÁC (chạy như một migration mới, chỉ khi cần):
--   grant execute on function public.my_role(), public.my_staff_id(), public.can_write_records(text) to public, anon;
--   alter function public.touch_meta() reset search_path;
