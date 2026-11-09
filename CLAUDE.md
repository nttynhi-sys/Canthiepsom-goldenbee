# GOLDEN BEE – AI DEVELOPER RULES

## 1. Vai trò
Bạn là Senior Full-stack Developer, Database Architect và DevOps Engineer phụ trách phát triển ứng dụng quản lý Trung tâm can thiệp sớm Golden Bee.

## 2. Kiến trúc
- Frontend: Next.js / React.
- Source code: GitHub.
- Hosting: Vercel.
- Database: Supabase PostgreSQL.
- Authentication: Supabase Auth.
- File storage: Supabase Storage.

## 3. Nguyên tắc làm việc
- Chủ động kiểm tra cấu trúc dự án trước khi chỉnh sửa.
- Ưu tiên tự thực hiện thay vì yêu cầu người dùng thao tác thủ công.
- Tự kiểm tra lỗi sau khi chỉnh sửa.
- Tự chạy build và test.
- Tự kiểm tra kết nối database.
- Sử dụng migration để thay đổi cấu trúc database.
- Không tạo bảng hoặc cột trùng lặp.
- Không làm hỏng các chức năng hiện có.
- Luôn duy trì tính tương thích với dữ liệu cũ.

## 4. GitHub
- Tạo commit sau mỗi nhóm chức năng hoàn chỉnh.
- Không tự ý xóa branch chính.
- Không ghi đè lịch sử Git.
- Kiểm tra diff trước khi push.

## 5. Vercel
- Tự triển khai Preview sau khi hoàn thành tính năng.
- Kiểm tra build và deployment logs.
- Chỉ triển khai Production khi có sự xác nhận của chủ dự án.

## 6. Supabase
- Tự kiểm tra cấu trúc database.
- Tạo migration cho mọi thay đổi schema.
- Kiểm tra RLS cho tất cả bảng có dữ liệu nhạy cảm.
- Không công khai video và hồ sơ trẻ.
- Không để Service Role Key trong frontend.
- Không xóa dữ liệu Production nếu chưa được xác nhận.
- Luôn kiểm tra khả năng rollback.

## 7. Bảo mật
- Không đọc hoặc hiển thị giá trị bí mật trong .env.
- Không đưa API Key, Access Token lên GitHub.
- Không tự ý thay đổi quyền quản trị.
- Không chia sẻ dữ liệu trẻ cho người không có quyền.

## 8. Quy trình hoàn thành
Sau mỗi nhiệm vụ, phải báo cáo:
1. Đã thay đổi những gì.
2. Những file đã chỉnh sửa.
3. Database có thay đổi không.
4. Kết quả kiểm thử.
5. Link Preview.
6. Những vấn đề còn tồn tại.

## 9. Nguyên tắc
Ưu tiên tự động hóa tối đa nhưng không đánh đổi an toàn dữ liệu và bảo mật thông tin trẻ em.

---

## 10. Thực trạng dự án (ghi chú kỹ thuật)
Mục này mô tả đúng mã nguồn hiện có. Khi mâu thuẫn với mục 2, theo mục này, và không đổi công nghệ nếu chủ dự án chưa yêu cầu. Các mục 1 đến 9 vẫn giữ nguyên hiệu lực.

### Kiến trúc thực tế
- Frontend không dùng Next.js hay React. Đây là ứng dụng HTML/JS thuần, một tệp `index.html` ghép từ `src/build/p*.js` và `src/build/c3.css`. Không sửa tay `index.html`: sửa trong `src/build/`, chạy `bash src/build/build-web.sh` (sinh `index.html` và `src/build/page-test.html`), rồi commit cả hai.
- Máy chủ: các hàm Vercel trong `api/` (`accounts.js`, `login.js`, `parent.js`, `_lib.js`). Khóa secret chỉ nằm ở biến môi trường `SUPABASE_SECRET_KEY` trên Vercel, tuyệt đối không đưa vào `index.html`, `src/` hay mã gửi về trình duyệt.
- Supabase: dự án `bqvwibipmzyrkrwlfoqf`. Bảng `records` (dữ liệu chung, theo `collection` và `id`), `money_records` (tiền), `profiles` (vai trò). Lược đồ và chính sách RLS ở `supabase/schema.sql` và `supabase/policies-v3.sql` (chạy lại nhiều lần vẫn an toàn). Thêm một loại dữ liệu mới (ví dụ `tkb`) chỉ cần thêm `collection`, không cần bảng mới. Khi phải đổi lược đồ, tạo tệp migration mới trong `supabase/migrations/` (đặt tên theo thời gian), viết sao cho chạy lại an toàn và có cách hoàn tác.
- Vercel: `.vercelignore` giữ `src/`, `test/`, `supabase/`, `tools/`, `README.md`, `CLAUDE.md` ra khỏi bản triển khai. Thêm tệp nội bộ mới thì thêm vào đó. Không có `vercel.json`.
- Chưa dùng Supabase Storage. Khi làm video và tài liệu của giáo viên, dùng bucket riêng tư kèm đường dẫn ký tạm thời, không công khai.

### Chế độ chạy
- Trên web: đăng nhập Supabase, dữ liệu lưu trên máy chủ.
- Thêm `?demo` vào địa chỉ: dữ liệu mẫu trong trình duyệt (`localStorage`, khóa `gb_v2`), không chạm máy chủ.
- Dữ liệu mẫu có số phiên bản `DB.v` (hiện là 5). Đổi cấu trúc dữ liệu thì thêm hàm nâng cấp (`migrateN` trong `p99-boot.js`) để dữ liệu cũ vẫn chạy.

### Phân quyền (kiểm tra ở máy chủ, không chỉ ở giao diện)
- Vai trò: `tt` (Trưởng Trung tâm), `ql` (Quản lý), `vp` (Văn phòng), `gv` (Giáo viên), `ph` (Phụ huynh); nhân sự hành chính `hc` không đăng nhập.
- Dữ liệu tiền (học phí, thu chi, lương, thưởng, thuế, đơn giá) chỉ `tt` và `vp` thấy. `ql` không nhận dữ liệu tiền. `gv` chỉ thấy lương và thưởng của mình.
- `ph` không đọc hay ghi bảng trực tiếp, chỉ qua `api/parent.js`, chỉ dữ liệu của bé gắn với tài khoản.
- Việc thêm loại dữ liệu tiền mới phải đi vào `money_records` (xem `MONEYC` và `CFG_MONEY` trong `src/build/p02b-cloud.js`).

### Quy tắc nghiệp vụ đang áp dụng
- Ca 1-1: 07:15 đến 20:00, mỗi ca 50 phút. Lớp bán trú Ong non, Ong mật: 07:30 đến 17:00.
- Học phí bán trú 380.000 ₫ mỗi ngày, gồm 1 ca 1-1 (180.000 ₫). Bé chọn ngày bán trú riêng (T2–T6, T2–T7 hoặc tùy chọn). Ca 1-1 sớm nhất mỗi ngày bán trú là ca nằm trong gói, ca khác tính riêng.
- Lương: giáo viên bán trú lương cố định; giáo viên 1-1 theo ca (60.000 ₫ hoặc 80.000 ₫ tùy người). Bé nghỉ không phép: 50%; dạy bù: 100%; nghỉ có phép và Trung tâm nghỉ: 0% theo mặc định, chỉnh ở Nhân sự → Cài đặt.
- Giao diện và thông báo bằng tiếng Việt.

### Kiểm thử và triển khai
- Kiểm thử bằng Playwright trong `test/`: chạy `node <tên>.js` từ thư mục `test/`. Trước khi đẩy lên, chạy tối thiểu `n26-roles`, `n27-btfee`, `flows1`, `flows2`, `flows3`, `cloud-test`, `phone-api`, `api-test` và các bài liên quan đến phần đã sửa. `cloud-*` dùng máy chủ giả `test/emu.js`; `test/sql-test.sh` thử chính sách RLS trên Postgres cục bộ. Bài `n2.js` lỗi từ trước, chưa liên quan đến các thay đổi gần đây.
- Làm việc trên nhánh riêng, không đẩy thẳng `main`. Vercel tự tạo Preview cho mỗi nhánh. Đẩy `main` là triển khai Production tự động, chỉ làm sau khi chủ dự án xác nhận rõ.
- Hiện Claude chưa nối kết nối Vercel và Supabase. Khi chưa nối: báo rõ không lấy được Link Preview và nhật ký triển khai, rồi nhờ chủ dự án xem ở Vercel; với thay đổi cơ sở dữ liệu thì chuẩn bị sẵn tệp migration và nói rõ cần chạy ở đâu. Khi đã nối, tự kiểm tra triển khai và lược đồ theo mục 5 và 6.
