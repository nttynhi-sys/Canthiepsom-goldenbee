# Quản lý Golden Bee

Ứng dụng quản lý Trung tâm can thiệp sớm Golden Bee (Đà Nẵng): hồ sơ trẻ, lịch học 1-1 và bán trú, điểm danh, học phí, lương, báo cáo, ngân hàng mục tiêu (ABLLS, ESDM, VB-MAPP).

## Cấu trúc
- `index.html`: bản chạy trên web (Vercel). Đăng nhập thật bằng Supabase, dữ liệu dùng chung.
- `src/build/`: mã nguồn chia nhỏ. Chạy `src/build/build-web.sh` để ghép lại thành `index.html`.
- `supabase/schema.sql`, `supabase/policies-v3.sql`: bảng và chính sách bảo mật. Chạy theo thứ tự này trong SQL Editor (v3 chạy lại nhiều lần vẫn an toàn và thay thế `policies-v2.sql`).
- `api/`: các hàm chạy trên Vercel, dùng khóa secret của Supabase (biến môi trường `SUPABASE_SECRET_KEY` trong Vercel → Settings → Environment Variables; khóa này không bao giờ nằm trong mã hay trình duyệt):
  - `accounts.js`: Trưởng Trung tâm cấp, đặt lại mật khẩu, thu hồi tài khoản nhân viên và phụ huynh ngay trong app.
  - `login.js`: đổi số điện thoại thành email đăng nhập (Supabase đăng nhập bằng email).
  - `parent.js`: cổng dữ liệu cho phụ huynh (xem phần Phụ huynh).
  - `_lib.js`: phần dùng chung.
- `test/`: kiểm thử. `phone-api.js` (hàm máy chủ), `cloud-phone-ui.js` (giao diện đầu-cuối), `sql-test.sh` (chính sách SQL trên Postgres cục bộ), cùng `cloud-test.js`, `cloud-empty.js`, `cloud-acc-ui.js`, `api-test.js`.
- `trung-tam-tri-lieu.html`: bản trình diễn cũ (dữ liệu mẫu trong trình duyệt).

## Chế độ
- Mặc định (trên web): đăng nhập Supabase, dữ liệu lưu trên máy chủ.
- Thêm `?demo` vào địa chỉ: bản trình diễn dùng dữ liệu mẫu trong trình duyệt, không lưu lên máy chủ.

## Đăng nhập bằng email hoặc số điện thoại
- Mọi vai trò (Trưởng Trung tâm, Quản lý, Văn phòng, Giáo viên, Phụ huynh) đăng nhập bằng email hoặc số điện thoại cộng mật khẩu. Số điện thoại viết kiểu nào cũng được (`0901 234 567`, `+84 901 234 567`, `84901234567`).
- Số điện thoại được tra ra email ở `api/login.js` rồi đăng nhập Supabase như thường. Số lạ hoặc sai mật khẩu đều báo cùng một câu, nên không dò được số nào có tài khoản. Ai biết số điện thoại của một nhân viên có thể tra ra email đăng nhập của người đó (không tra ra được mật khẩu).
- Tài khoản chỉ có số điện thoại dùng một địa chỉ email nội bộ dạng `sdt84901234567@example.com` (tên miền dành riêng, không nhận được thư). Nếu Supabase từ chối địa chỉ này, đặt biến môi trường `PHONE_ALIAS_DOMAIN` trong Vercel bằng một tên miền có thật rồi cấp lại.
- Nhân viên: lấy email và số điện thoại từ hồ sơ nhân sự; tài khoản gắn với hồ sơ theo mã nhân viên, không phụ thuộc email. Mỗi số điện thoại chỉ thuộc một tài khoản.

## Phụ huynh
- Phụ huynh không đọc hay ghi trực tiếp bảng dữ liệu (chính sách SQL chặn hoàn toàn). Mọi thứ đi qua `api/parent.js`: hàm xác nhận phụ huynh, chỉ trả dữ liệu của các bé gắn với tài khoản, nhân viên chỉ lộ tên và chức vụ, học phí chỉ của bé mình.
- Phụ huynh được ghi: yêu cầu học bù của bé mình, lịch học bù của bé mình (kiểm tra trùng giáo viên, phòng, bé, lớp bán trú), đánh dấu đã đọc thông báo. Không ghi được gì khác.
- Bé gắn với tài khoản theo email phụ huynh trong hồ sơ bé, nếu không có email thì theo số điện thoại. Các bé cùng email (hoặc cùng số điện thoại) dùng chung một tài khoản.
- Cấp tài khoản: mục Cổng phụ huynh → nút Tài khoản cho từng người, hoặc "Cấp tài khoản cho phụ huynh chưa có" để cấp hàng loạt và tải danh sách mật khẩu (Excel). Mật khẩu chỉ có trong tệp tải về.

## Phân quyền dữ liệu (kiểm tra ở máy chủ)
- Trưởng Trung tâm, Văn phòng: đọc và ghi cả dữ liệu tiền (học phí, lương, thưởng, thuế).
- Quản lý: không nhận dữ liệu tiền.
- Giáo viên: chỉ đọc lương và thưởng của mình (theo mã nhân viên).
- Phụ huynh: chỉ qua `api/parent.js`, chỉ dữ liệu của bé mình.

## Giới hạn đã biết
- Tài khoản Trưởng Trung tâm đầu tiên tạo trong Supabase (Authentication) kèm một dòng `tt` trong bảng `profiles`. Các tài khoản khác cấp trong app: Nhân sự → mở hồ sơ → Tài khoản đăng nhập.
- Chưa có "quên mật khẩu": Trưởng Trung tâm đặt lại mật khẩu cho nhân viên và phụ huynh (phụ huynh chỉ có số điện thoại cũng không nhận được thư đặt lại).
- Chưa có giới hạn số lần đăng nhập sai ngoài giới hạn mặc định của Supabase.
- Xóa dữ liệu do người khác thực hiện chỉ hiện sau khi tải lại trang.
- Dữ liệu điểm danh được tải toàn bộ khi đăng nhập; với hàng trăm trẻ dùng nhiều năm cần tải theo tháng.
- Video và tài liệu giáo viên tải lên cần Supabase Storage (chưa nối).
