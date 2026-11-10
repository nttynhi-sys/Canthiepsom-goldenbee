# GOLDEN BEE – AI DEVELOPER RULES

## 1. Vai trò
Bạn là Senior Full-stack Developer, Database Architect và DevOps Engineer phụ trách phát triển ứng dụng quản lý Trung tâm can thiệp sớm Golden Bee.

## 2. Kiến trúc
- Frontend: HTML/JS thuần, một tệp `index.html` ghép từ `src/build/` (hiện chưa dùng Next.js / React; chỉ đổi khi chủ dự án yêu cầu).
- Source code: GitHub (`nttynhi-sys/canthiepsom-goldenbee`).
- Hosting: Vercel, kèm các hàm máy chủ trong `api/`.
- Database: Supabase PostgreSQL.
- Authentication: Supabase Auth.
- File storage: Supabase Storage (bucket riêng tư `gb-media`, đang dùng; xem mục 10).

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
Mục này mô tả chi tiết mã nguồn hiện có. Mục 2 đã được chỉnh cho khớp thực tế; nếu hai mục lệch nhau, theo mục này, và không đổi công nghệ nếu chủ dự án chưa yêu cầu. Các mục 1 đến 9 vẫn giữ nguyên hiệu lực.

### Kiến trúc thực tế
- Frontend không dùng Next.js hay React. Đây là ứng dụng HTML/JS thuần, một tệp `index.html` ghép từ `src/build/p*.js` và `src/build/c3.css`. Không sửa tay `index.html`: sửa trong `src/build/`, chạy `bash src/build/build-web.sh` (sinh `index.html` và `src/build/page-test.html`), rồi commit cả hai.
- Máy chủ: các hàm Vercel trong `api/` (`accounts.js`, `login.js`, `parent.js`, `plock.js`, `_lock.js`, `_lib.js`). Khóa secret chỉ nằm ở biến môi trường `SUPABASE_SECRET_KEY` trên Vercel, tuyệt đối không đưa vào `index.html`, `src/` hay mã gửi về trình duyệt.
- Supabase: dự án `bqvwibipmzyrkrwlfoqf`. Bảng `records` (dữ liệu chung, theo `collection` và `id`), `money_records` (tiền), `profiles` (vai trò). Lược đồ và chính sách RLS ở `supabase/schema.sql` và `supabase/policies-v3.sql` (chạy lại nhiều lần vẫn an toàn; v3 là bản chuẩn, đưa dự án về đúng trạng thái hiện tại). Ba hàm hỗ trợ chính sách (`my_role`, `my_staff_id`, `can_write_records`) nằm ở schema `private` với `search_path` rỗng, không lộ ra `/rest/v1/rpc` và `anon` không gọi được; chính sách phải gọi `private.my_role()`, không tạo lại hàm trong `public`. Thêm một loại dữ liệu mới (ví dụ `tkb`) chỉ cần thêm `collection`, không cần bảng mới. Khi phải đổi lược đồ: (1) viết tệp migration trong `supabase/migrations/` đặt tên `AAAAMMDDHHMMSS_ten.sql`, có ghi chú cách hoàn tác ở cuối; (2) cập nhật `policies-v3.sql` nếu đổi chính sách và thêm ca thử vào `test/sql-cases.sql` hoặc `test/sql-structure.sql`; (3) chạy `bash test/sql-test.sh` (cần Postgres cục bộ); (4) mới áp dụng lên Supabase bằng `apply_migration` với cùng nội dung. Sau khi đổi, chạy `get_advisors` loại security.
- Vercel: `.vercelignore` giữ `src/`, `test/`, `supabase/`, `tools/`, `README.md`, `CLAUDE.md` ra khỏi bản triển khai. Thêm tệp nội bộ mới thì thêm vào đó (`vendor/` được triển khai vì chứa pdf.js cho phụ huynh). Không có `vercel.json`.
- Supabase Storage: bucket riêng tư `gb-media` (tối đa 50 MB, chỉ các loại ảnh, video, PDF, Office, văn bản), tạo bằng migration `20261109150000_media_bucket.sql` (cũng nằm trong `policies-v3.sql`, thử ở `test/sql-cases.sql` với phần giả lập schema `storage` ở `test/sql-boot.sql`). Chỉ `tt`, `vp`, `ql`, `gv` đọc và tải lên; xóa: `tt`, `vp`, `ql` mọi tệp, `gv` chỉ tệp mình tải. `ph` và `anon` không có chính sách nào. Không bao giờ công khai bucket, không dùng đường `/object/public/`. Phụ huynh nhận đường xem tạm (15 phút) chỉ qua `api/parent.js` hành động `sign`, sau khi kiểm tra tệp đã chia sẻ, có bé của họ và cổng không khóa. Danh mục tệp là collection `media` trong `records` (`{id,kind,t,p,ct,sz,d,by,bn,at,ks,gr,sh,n,cat}`); `api/parent.js` không bao giờ trả `p` hay mã bé khác cho phụ huynh. Mã tải lên, thư viện, gắn bé: `src/build/p17-td.js`.
- Tài liệu tham khảo (`ref`) và Góc tri ân (`tri`): hai collection trong `records`, **chỉ `tt` và `ql` ghi** (`private.can_write_records`); `vp`, `gv` chỉ đọc, `ph` không đọc bảng. Tệp ở tiền tố `r/` (ref) và `t/` (tri) của `gb-media`, chỉ `tt`, `ql` tải lên và xóa; tiền tố `m/` giữ nguyên quy tắc cũ. Tạo bằng migration `20261109210000_ref_tri_collections.sql` (mirror ở `policies-v3.sql`, thử ở `test/sql-cases.sql`). `api/parent.js` lọc bằng `parentRef`/`parentTri` (không trả đường dẫn kho, mã bé, tên nhân viên; tri cần `sh` và `cs` đồng ý), ký đường xem 15 phút theo khóa `r:<id>` và `t:<id>:<n>`, trả 423 khi cổng khóa, và trả danh sách `live` khi đồng bộ gia tăng để máy phụ huynh bỏ mục đã xóa. Giao diện ở `src/build/p17b-ref.js`. PDF xem bằng pdf.js tự lưu ở `vendor/pdfjs/` (không CDN; `window.GB_PDFJS` đổi đường dẫn khi thử), vẽ từng trang lên canvas; video `controlsList="nodownload noremoteplayback"`. Không hứa chặn được chụp màn hình hay lấy đường xem tạm bằng công cụ nhà phát triển. Mục "Tài liệu" cũ của từng bé đổi tên "Hồ sơ, giáo án" (nội bộ).

### Chế độ chạy
- Trên web: đăng nhập Supabase, dữ liệu lưu trên máy chủ.
- Thêm `?demo` vào địa chỉ: dữ liệu mẫu trong trình duyệt (`localStorage`, khóa `gb_v2`), không chạm máy chủ.
- Dữ liệu mẫu có số phiên bản `DB.v` (hiện là 6). Đổi cấu trúc dữ liệu thì thêm hàm nâng cấp (`migrateN` trong `p99-boot.js`) để dữ liệu cũ vẫn chạy.

### Phân quyền (kiểm tra ở máy chủ, không chỉ ở giao diện)
- Vai trò: `tt` (Trưởng Trung tâm), `ql` (Quản lý), `vp` (Văn phòng), `gv` (Giáo viên), `ph` (Phụ huynh); nhân sự hành chính `hc` không đăng nhập.
- Dữ liệu tiền (học phí, thu chi, lương, thưởng, thuế, đơn giá) chỉ `tt` và `vp` thấy. `ql` không nhận dữ liệu tiền. `gv` chỉ thấy lương và thưởng của mình.
- `ph` không đọc hay ghi bảng trực tiếp, chỉ qua `api/parent.js`, chỉ dữ liệu của bé gắn với tài khoản.
- Việc thêm loại dữ liệu tiền mới phải đi vào `money_records` (xem `MONEYC` và `CFG_MONEY` trong `src/build/p02b-cloud.js`).

### Quy tắc nghiệp vụ đang áp dụng
- Ca 1-1: 07:15 đến 20:00, mỗi ca 50 phút. Lớp bán trú Ong non, Ong mật: 07:30 đến 17:00.
- Học phí bán trú 380.000 ₫ mỗi ngày, gồm phí bán trú 200.000 ₫ và 1 ca 1-1 180.000 ₫. Mỗi buổi 1-1 tính riêng 180.000 ₫. Buổi 1-1 riêng: nghỉ P mất 30% hoàn 70%, nghỉ KP mất 100%, Trung tâm hoặc giáo viên nghỉ hoàn 100%. Bán trú nhập viện có giấy: hoàn 50% phí bán trú (100.000 ₫) và 100% ca 1-1 (180.000 ₫). Mọi khoản hoàn trừ vào học phí tháng sau. Bé chọn ngày bán trú riêng (T2–T6, T2–T7 hoặc tùy chọn). Ca 1-1 sớm nhất mỗi ngày bán trú là ca nằm trong gói, ca khác tính riêng.
- Lương: giáo viên bán trú lương cố định; giáo viên 1-1 theo ca (60.000 ₫ hoặc 80.000 ₫ tùy người). Bé nghỉ không phép: 50%; dạy bù: 100%; nghỉ có phép và Trung tâm nghỉ: 0% theo mặc định, chỉnh ở Nhân sự → Cài đặt.
- Thực đơn bán trú nhập T2 đến T7. Giờ 1-1 chọn tự do trong khung 07:15 đến 20:00 (ca 50 phút, bắt đầu muộn nhất 19:10); trùng giờ khi hai ca cách nhau dưới 50 phút (kiểm tra cả ở `api/parent.js`).
- Ngày nghỉ lễ / Trung tâm cho nghỉ (`hol`, `tt`, `ql`, `vp` sửa; `gv` chỉ đọc) trừ khỏi học phí trả trước. Học phí tháng sau = học phí tháng sau trừ phí dư tháng trước; bé ngưng đột ngột không hoàn phí dư. Hóa đơn đã lập không tự đổi.
- Khóa cổng phụ huynh: học phí tháng M hạn hết ngày 10 (giờ Việt Nam); từ ngày 11 chưa đóng đủ thì `api/parent.js` trả 423 (kể cả `sign`). Chỉ `tt`, `ql`, `vp` mở khóa tạm hoặc khóa lại, qua `api/plock.js`; bản ghi `pul` chỉ khóa secret ghi được. Quy tắc phải giữ giống nhau ở `api/_lock.js` và `src/build/p23-lock.js`.
- Cổng phụ huynh có lớp phủ tên, liên hệ, giờ xem và chặn chuột phải, sao chép, in (`p24-guard.js`); không chặn hẳn được chụp màn hình trên web, đừng hứa là chặn được.
- Mục tiêu ba tầng: buổi (`sess[].it[].pl`) → ngắn hạn (`plans` `h:'n'`, `up`) → dài hạn (`h:'d'`); "Đạt" của mục tiêu buổi theo số liệu (3 buổi liên tiếp, từ 80% độc lập, ít nhất 5 lượt), ngắn hạn và dài hạn chỉ đạt khi nhân viên xác nhận (`p25-tree.js`).
- Ảnh, video hoạt động chung lớp bán trú: cô bán trú tải lên kèm lớp, giáo viên gắn bé, chỉ phụ huynh của bé được gắn và đã chia sẻ mới xem. Tài liệu "Hồ sơ trẻ" bắt buộc gắn bé.
- Form thêm/sửa bé có khối "Hình thức học" (`hthField` ở `p08-hs.js`): Bán trú và/hoặc 1-1, mỗi hình thức tích buổi cụ thể; lưu `k.bt`, `k.gr`, `k.btd` và `DB.lich`.
- Mã học sinh hiển thị là `STT-BT` (có bán trú, kèm 1-1) hoặc `STT-CN` (chỉ 1-1), tính bằng `kcode(k)` ở `p08-hs.js` từ số trong `k.id` và `k.bt`. Không đổi `k.id` (hsNNN) vì là khóa dữ liệu. Mọi chỗ hiển thị hay xuất Excel mã bé phải dùng `kcode`, không in `k.id` ra màn hình.
- Bộ lọc Lĩnh vực của Ngân hàng mục tiêu tách `xh` thành "Chơi" (`choi`, hàm `isPlay`) và "Xã hội" (`xh`, phần còn lại) qua `domHit` và `LCHIPS` ở `p04b-prog.js`; dữ liệu mục tiêu vẫn ghi `d:'xh'`.
- Ngân hàng mục tiêu, lĩnh vực Chơi (`xh`) có bộ công cụ Westby (`we`, 10 giai đoạn) và Chuỗi chơi 0–4 tuổi (`cp`) ở `src/build/p03e-westby.js`; mức không có mốc tuổi trong tài liệu gốc để `m:-1`, không tự đoán.
- Giao diện và thông báo bằng tiếng Việt.

### Kiểm thử và triển khai
- Kiểm thử bằng Playwright trong `test/`: chạy `node <tên>.js` từ thư mục `test/`. Trước khi đẩy lên, chạy tối thiểu `n26-roles`, `n27-btfee`, `flows1`, `flows2`, `flows3`, `cloud-test`, `phone-api`, `api-test` và các bài liên quan đến phần đã sửa (`y3-hol` ngày nghỉ, `y4-lock`, `plock-api`, `cloud-lock-ui` khóa cổng, `y5-guard` chụp màn hình, `y6-goals` cây mục tiêu, `y7-media` ảnh/video/tài liệu, `y12-menu-time` thực đơn và giờ 1-1, `z1-hinhthuc` hình thức học, `z4-westby` Westby, `z5-choi-ma` nút Chơi và mã STT-BT/CN, `z23-ref-tri` tài liệu tham khảo và góc tri ân). `cloud-*` dùng máy chủ giả `test/emu.js`; `test/sql-test.sh` thử chính sách RLS trên Postgres cục bộ. Bài `n2.js` lỗi từ trước, chưa liên quan đến các thay đổi gần đây.
- Làm việc trên nhánh riêng, không đẩy thẳng `main`. Vercel tự tạo Preview cho mỗi nhánh. Đẩy `main` là triển khai Production tự động, chỉ làm sau khi chủ dự án xác nhận rõ.
- Kết nối đã nối (Vercel và Supabase): Vercel team `team_clATcD9ZczgEhpgreeeIpLpz` (slug `nhi-8476`), dự án `prj_rwQ9LbyeIVpwzFTw7RWMo41NL13R` (`canthiepsom_goldenbee`), Production tại https://canthiepsomgoldenbee.vercel.app, mã nguồn ở GitHub `nttynhi-sys/canthiepsom-goldenbee`. Supabase dự án `bqvwibipmzyrkrwlfoqf` (ap-southeast-2, Postgres 17). Chỉ xem tên biến môi trường (`filter_project_envs`), không giải mã giá trị.
- Quy trình khi hoàn thành: đẩy nhánh, rồi kiểm tra Preview. Nếu Vercel không tự tạo Preview cho nhánh vừa đẩy, tạo bằng `create_deployment` (gitSource: GitHub, `nttynhi-sys`, `Canthiepsom-goldenbee`, `ref` là tên nhánh). Preview có bảo vệ đăng nhập Vercel, lấy liên kết xem được bằng `get_access_to_vercel_url`. Kiểm tra `get_deployment` ở trạng thái READY và `get_runtime_errors` không có lỗi mới.
- Lưu ý Preview: biến `SUPABASE_SECRET_KEY` chỉ có ở Production, nên các hàm trong `api/` không chạy đủ trên Preview; và Preview dùng chung cơ sở dữ liệu Production, vì vậy không ghi thử dữ liệu thật khi xem Preview. Thay đổi lược đồ áp dụng vào cơ sở dữ liệu dùng chung ngay, nên phải có hoàn tác sẵn.
- Việc không làm được qua kết nối, cần chủ dự án thao tác: xóa dự án Vercel (kết nối trả liên kết xóa để chủ dự án bấm), bật "Leaked password protection" ở Supabase → Authentication (cài đặt chỉ có trên bảng điều khiển và chỉ dùng được từ gói Pro trở lên; tổ chức hiện ở gói Free, nên đây là quyết định về chi phí của chủ dự án).
