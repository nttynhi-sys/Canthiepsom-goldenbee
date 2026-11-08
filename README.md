# Quản lý Golden Bee

Ứng dụng quản lý Trung tâm can thiệp sớm Golden Bee (Đà Nẵng): hồ sơ trẻ, lịch học 1-1 và bán trú, điểm danh, học phí, lương, báo cáo, ngân hàng mục tiêu (ABLLS, ESDM, VB-MAPP).

## Cấu trúc
- `index.html`: bản chạy trên web (Vercel). Đăng nhập thật bằng Supabase, dữ liệu dùng chung.
- `src/build/`: mã nguồn chia nhỏ. Chạy `src/build/build-web.sh` để ghép lại thành `index.html`.
- `supabase/schema.sql`, `supabase/policies-v2.sql`: bảng và chính sách bảo mật. Chạy theo thứ tự này trong SQL Editor.
- `api/accounts.js`: hàm chạy trên Vercel để Trưởng Trung tâm cấp, đặt lại mật khẩu và thu hồi tài khoản ngay trong app. Cần biến môi trường `SUPABASE_SECRET_KEY` (khóa secret) trong Vercel → Settings → Environment Variables. Khóa này không bao giờ nằm trong mã hay trình duyệt.
- `test/`: kiểm thử Playwright. `cloud-test.js`, `cloud-empty.js`, `cloud-acc-ui.js` kiểm tra chế độ máy chủ bằng máy chủ giả lập; `api-test.js` kiểm tra hàm cấp tài khoản.
- `trung-tam-tri-lieu.html`: bản trình diễn cũ (dữ liệu mẫu trong trình duyệt).

## Chế độ
- Mặc định (trên web): đăng nhập Supabase, dữ liệu lưu trên máy chủ.
- Thêm `?demo` vào địa chỉ: bản trình diễn dùng dữ liệu mẫu trong trình duyệt, không lưu lên máy chủ.

## Phân quyền dữ liệu (kiểm tra ở máy chủ)
- Trưởng Trung tâm, Văn phòng: đọc và ghi cả dữ liệu tiền (học phí, lương, thưởng, thuế).
- Quản lý: không nhận dữ liệu tiền.
- Giáo viên: chỉ đọc lương và thưởng của mình.
- Phụ huynh: chưa có quyền (giai đoạn sau).

## Giới hạn đã biết
- Tài khoản Trưởng Trung tâm đầu tiên tạo trong Supabase (Authentication) kèm một dòng `tt` trong bảng `profiles`. Các tài khoản khác cấp trong app: Nhân sự → mở hồ sơ → Tài khoản đăng nhập.
- Chưa có "quên mật khẩu" qua email: Trưởng Trung tâm đặt lại mật khẩu cho nhân viên.
- Xóa dữ liệu do người khác thực hiện chỉ hiện sau khi tải lại trang.
- Dữ liệu điểm danh được tải toàn bộ khi đăng nhập; với hàng trăm trẻ dùng nhiều năm cần tải theo tháng.
- Video và tài liệu giáo viên tải lên cần Supabase Storage (chưa nối).
