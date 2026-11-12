# Quản lý Golden Bee

Ứng dụng quản lý Trung tâm can thiệp sớm Golden Bee (Đà Nẵng): hồ sơ trẻ, lịch học 1-1 và bán trú, điểm danh, học phí, lương, báo cáo, ngân hàng mục tiêu (ABLLS, ESDM, VB-MAPP).

## Cấu trúc
- `index.html`: bản chạy trên web (Vercel). Đăng nhập thật bằng Supabase, dữ liệu dùng chung.
- `src/build/`: mã nguồn chia nhỏ (`p03-seed.js` dữ liệu mẫu, `p03d-dx.js` thư viện chẩn đoán, `p04-domain.js` học phí, lịch, lương). Chạy `src/build/build-web.sh` để ghép lại thành `index.html`.
- `supabase/schema.sql`, `supabase/policies-v3.sql`: bảng và chính sách bảo mật. Chạy theo thứ tự này trong SQL Editor (v3 chạy lại nhiều lần vẫn an toàn và thay thế `policies-v2.sql`). Các hàm hỗ trợ chính sách nằm ở schema `private` (không lộ ra API công khai).
- `supabase/migrations/`: các thay đổi lược đồ đã áp dụng lên dự án thật, theo thứ tự thời gian, mỗi tệp có cách hoàn tác. Dự án mới chỉ cần `schema.sql` và `policies-v3.sql`, không cần chạy migration.
- `api/`: các hàm chạy trên Vercel, dùng khóa secret của Supabase (biến môi trường `SUPABASE_SECRET_KEY` trong Vercel → Settings → Environment Variables; khóa này không bao giờ nằm trong mã hay trình duyệt):
  - `accounts.js`: Trưởng Trung tâm cấp, đặt lại mật khẩu, thu hồi tài khoản nhân viên và phụ huynh ngay trong app.
  - `login.js`: đổi số điện thoại thành email đăng nhập (Supabase đăng nhập bằng email).
  - `parent.js`: cổng dữ liệu cho phụ huynh (xem phần Phụ huynh): tải dữ liệu của bé mình, ghi vài loại hẹp, cấp đường xem tạm cho ảnh/video (`sign`).
  - `plock.js`, `_lock.js`: khóa cổng phụ huynh quá hạn học phí (xem phần Khóa cổng phụ huynh).
  - `_lib.js`: phần dùng chung.
- `test/`: kiểm thử. `phone-api.js` (hàm máy chủ), `cloud-phone-ui.js` (giao diện đầu-cuối), `sql-test.sh` (chính sách SQL trên Postgres cục bộ, cả cài mới lẫn nâng cấp từ dự án đang chạy), cùng `cloud-test.js`, `cloud-empty.js`, `cloud-acc-ui.js`, `api-test.js`, `n27-btfee.js` (học phí bán trú, lịch 1-1 linh hoạt, chẩn đoán, thời khóa biểu, lương theo ca).
- `trung-tam-tri-lieu.html`: bản trình diễn cũ (dữ liệu mẫu trong trình duyệt).

## Bán trú, học phí và lương
- **Học phí bán trú:** 380.000 ₫ mỗi ngày, đã gồm 1 ca can thiệp 1-1 (50 phút, 180.000 ₫). Đặt ở Nhân sự → Cài đặt (`pbtDay`, `pbtDay11`). Trong 380.000 ₫ có 200.000 ₫ phí bán trú và 180.000 ₫ phí ca 1-1. Hóa đơn tháng = số ngày bán trú của bé × 380.000 + số ca 1-1 tính riêng × giá buổi 1-1 (`p11`, mặc định 180.000 ₫).
- **Ngày bán trú riêng từng bé:** mở hồ sơ bé → thẻ Lịch học. Chọn T2–T6, T2–T7 hoặc từng ngày (`btd`; bé cũ chưa có thì mặc định T2–T6). Lớp chỉ mở thứ Bảy khi có bé chọn T7.
- **Lịch 1-1 linh hoạt:** cùng thẻ Lịch học, thêm cùng lúc nhiều ngày cho một giáo viên và một ca. Hệ thống kiểm tra trùng giáo viên, bé, phòng, lớp bán trú từng ngày, chỉ thêm các ngày còn trống và báo ngày không thêm được kèm lý do. Bé không bán trú học vài buổi mỗi tuần thì chỉ tính theo số buổi.
- **Ca 1-1 trong gói:** mỗi ngày bán trú, ca 1-1 sớm nhất của bé là ca nằm trong gói (không tính riêng). Ca thứ hai trở đi trong ngày tính riêng. Ghi nghỉ ở ngày bán trú thì ca trong gói nghỉ theo. Nghỉ có phép (báo trước) hoàn 180.000 ₫ phí 1-1, mất phần còn lại; nghỉ không phép mất cả ngày. Nhập viện có giấy: hoàn 50% phí bán trú (100.000 ₫) và 100% phí ca 1-1 (180.000 ₫), tổng 280.000 ₫ mỗi ngày (chỉnh ở Nhân sự → Cài đặt: `bvRefund`, `bvRefund11`; cấu hình cũ chưa có `bvRefund11` tự dùng 100%). Buổi 1-1 riêng: nghỉ có phép mất 30% và hoàn 70%, nghỉ không phép mất 100%, Trung tâm hoặc giáo viên nghỉ hoàn 100%. Mọi khoản hoàn trừ vào học phí tháng sau, ghi vào công nợ ngày đầu tháng đó.
- **Thời khóa biểu bán trú** (Lịch học → Thời khóa biểu bán trú): thời khóa biểu lớp kiểu mầm non (đón trẻ, thể dục sáng, ăn, ngủ, hoạt động...) theo từng lớp, sửa được (Trưởng Trung tâm, Quản lý). Giờ 1-1 của từng bé ghép lên thời khóa biểu: tên bé hiện ở ô giờ ra học 1-1; có chế độ xem từng bé. Phụ huynh xem thời khóa biểu của bé mình. Lưu ở bộ sưu tập `tkb` của bảng `records`, không cần chạy thêm SQL.
- **Chẩn đoán** (hồ sơ bé): chọn nhiều trong thư viện hơn 120 mục chia nhóm (ngôn ngữ, nói, giao tiếp xã hội và phổ tự kỷ, phát triển, thính giác, thần kinh, hành vi và cảm xúc...) kèm mã ICD-10 để tra cứu, có ô lọc nhanh, thêm ô "chẩn đoán khác" và nơi chẩn đoán. Thư viện ở `src/build/p03d-dx.js`.
- **Lương giáo viên:** giáo viên bán trú lương cố định theo tháng. Giáo viên 1-1 trả theo ca: 60.000 ₫ hoặc 80.000 ₫ tùy người (Nhân sự → hồ sơ → lương). Bé có mặt hoặc dạy bù: trả đủ. Bé nghỉ không phép: 50% (30.000 ₫ hoặc 40.000 ₫). Bé nghỉ có phép, Trung tâm nghỉ, nhập viện: 0% theo mặc định. Các tỉ lệ này chỉnh ở Nhân sự → Cài đặt → Lương giáo viên 1-1 theo ca. Ca của giáo viên tính theo điểm danh của bé trong ca đó.
- Dữ liệu mẫu bản 7 (`DB.v`): bản cũ tự nâng cấp lên (giá theo ngày, thời khóa biểu, chẩn đoán, danh sách ngày nghỉ `hol`, bản ghi mở khóa `pul`, vi phạm nội quy `vio`/`vam` và cờ chấm công `cc` của nhân sự); phí bán trú theo tháng cũ (`pbtCN`, `pbtKhac`) được thay bằng giá theo ngày. Danh mục ảnh, video (`media`) được tạo khi dùng lần đầu.

## Thực đơn, giờ 1-1 và ngày nghỉ
- **Thực đơn bán trú** nhập từ thứ Hai đến thứ Bảy (6 ngày); sao chép tuần có cả thứ Bảy, Chủ nhật chuyển sang thứ Hai.
- **Giờ 1-1 chọn tự do** như giờ bán trú: gõ giờ bắt đầu bất kỳ trong khung 07:15 đến 20:00 (ca cuối bắt đầu muộn nhất 19:10), mỗi ca 50 phút, giờ kết thúc tự tính. Trùng giáo viên, bé, phòng kiểm tra theo khoảng giờ chồng nhau (hai ca cách nhau dưới 50 phút là trùng); phòng có thể để "Tự chọn phòng trống". Quy tắc này chạy cả ở trình duyệt và ở `api/parent.js` (phụ huynh đăng ký học bù).
- **Ngày nghỉ lễ, Trung tâm cho nghỉ** (`hol`, mục Lịch học → Ngày nghỉ): đặt trước để lên học phí đầu tháng. Ngày nghỉ không tính học phí bán trú, ca 1-1 và không cần điểm danh. Học phí tháng sau của phụ huynh = học phí tháng sau trừ phí dư của tháng trước; bé ngưng đột ngột thì phí dư không hoàn ("Dư không hoàn"). Trưởng Trung tâm, Quản lý, Văn phòng sửa được; giáo viên chỉ đọc. Hóa đơn đã lập không tự đổi khi thêm ngày nghỉ sau đó.

## Khóa cổng phụ huynh quá hạn học phí
- Học phí tháng M đóng trước, hạn hết ngày 10 (giờ Việt Nam). Từ ngày 11, phụ huynh chưa đóng đủ các tháng đến M bị khóa: chỉ thấy màn hình khóa (số tiền, tháng quá hạn, số điện thoại Trung tâm), không nhận dữ liệu của bé, không ghi được (`api/parent.js` trả 423; kể cả đường xem ảnh/video). Khoản thu, giảm giá, hoàn phí, nhận chuyển phí trừ lần lượt vào tháng cũ nhất, gộp mọi bé của cùng phụ huynh; dưới 1.000 ₫ bỏ qua.
- Ghi nhận thu đủ là cổng tự mở lại. Trưởng Trung tâm, Quản lý, Văn phòng thấy danh sách phụ huynh quá hạn (Quản lý không thấy số tiền) và có thể mở khóa tạm (mặc định đến ngày 10 kế tiếp, tối đa 93 ngày) hoặc khóa lại. Bản ghi mở khóa (`pul`) chỉ `api/plock.js` ghi được (chính sách SQL chặn trình duyệt).
- Cùng một quy tắc được tính ở `api/_lock.js` và `src/build/p23-lock.js` (chế độ `?demo`); hai nơi phải giữ giống nhau.

## Cổng phụ huynh: hạn chế chụp màn hình
- Trình duyệt web **không thể chặn hẳn** chụp màn hình của hệ điều hành hay chụp bằng điện thoại khác. `src/build/p24-guard.js` làm khó và răn đe: lớp phủ gắn tên phụ huynh, email hoặc số điện thoại và giờ xem lên mọi khung hình (truy được nguồn nếu ảnh bị đưa ra ngoài), chặn chuột phải, sao chép, in, lưu trang, che nội dung khi bấm PrintScreen hoặc phím chụp của Mac hoặc khi cửa sổ mất tiêu điểm. Chỉ áp dụng cho tài khoản phụ huynh. Chặn thật cần ứng dụng riêng (Android FLAG_SECURE, iOS phát hiện chụp màn hình).

## Mục tiêu: buổi, ngắn hạn, dài hạn
- Ba tầng: mục tiêu buổi (dòng mục tiêu trong buổi can thiệp, trường `pl`) → mục tiêu ngắn hạn (kế hoạch `h:'n'`, trường `up`) → mục tiêu dài hạn (kế hoạch `h:'d'`). Dữ liệu cũ chưa có `up`, `pl` vẫn chạy (gắn theo cùng mục tiêu; ngắn hạn chưa gắn nằm ở nhóm "chưa gắn"). Logic ở `src/build/p25-tree.js`.
- Mục tiêu buổi "Đạt" theo số liệu: bé tự làm (mức Độc lập) đúng từ 80% trở lên (ít nhất 5 lượt) trong 3 buổi liên tiếp. Ngắn hạn và dài hạn chỉ là "Đã đạt" khi nhân viên xác nhận; khi mọi mục tiêu con đã đạt thì hiện "Gần đạt".
- Phụ huynh thấy cây mục tiêu bằng chữ lớn, màu và biểu tượng (không chỉ màu) để biết con đã đạt hay chưa; báo cáo PDF cho phụ huynh có cây mục tiêu, báo cáo tháng thì không.

## Ảnh, video và tài liệu
- Tệp nằm trong **Supabase Storage, bucket riêng tư `gb-media`** (không công khai; tạo bằng migration `20261109150000_media_bucket.sql`; giới hạn mỗi tệp nâng từ 50 MB lên 500 MB bằng migration `20261110120000_media_limit_pro.sql` sau khi nâng gói Pro, hằng số `MEDIA_MB` ở `src/build/p17-td.js` phải khớp; chỉ nhận ảnh JPG/PNG/WebP/GIF, video MP4/WebM/MOV, PDF, Word, Excel, PowerPoint, CSV, văn bản). Danh mục nằm ở bảng `records`, collection `media`: `{id,kind:'img'|'vid'|'doc',t,p (đường dẫn kho),ct,sz,d,by,bn,at,ks:[mã bé],gr (lớp bán trú),sh (chia sẻ),n,cat}`. Không cần bảng mới.
- Trưởng Trung tâm, Quản lý, Văn phòng và Giáo viên tải lên thẳng từ trình duyệt (không qua hàm Vercel, vì hàm giới hạn nội dung yêu cầu 4,5 MB). Ảnh tự thu nhỏ về tối đa 1600 điểm cạnh dài trước khi tải. Xem bằng đường xem tạm 1 giờ do Storage ký; phụ huynh không có quyền đọc kho, chỉ nhận đường xem tạm 15 phút qua `api/parent.js` (hành động `sign`), sau khi kiểm tra tệp đã chia sẻ, có bé của mình và cổng không bị khóa.
- **Hoạt động chung của lớp bán trú:** cô bán trú (mọi giáo viên được phân vào lớp) tải ảnh, video lên kèm lớp, chưa gắn bé. Mục Ảnh, video và tài liệu → tab Hoạt động chung: giáo viên chọn nhiều ảnh, bấm "Gắn bé", tích những bé có trong ảnh, rồi mới chia sẻ. Phụ huynh chỉ thấy tệp đã chia sẻ có gắn bé của mình, và dữ liệu họ nhận chỉ chứa mã bé của họ (không lộ bé khác trong cùng ảnh). Chỉ gắn những bé gia đình đã đồng ý cho chia sẻ hình ảnh.
- Xóa: Trưởng Trung tâm, Quản lý, Văn phòng xóa được mọi tệp; giáo viên chỉ xóa tệp mình tải (chính sách Storage kiểm tra cả ở máy chủ). Tài liệu "Hồ sơ trẻ" bắt buộc gắn bé; tài liệu không gắn bé chỉ nhân viên xem.
- Giáo viên đọc được mọi tệp trong kho nếu biết đường dẫn (cùng mức tin cậy với bảng `records`); giao diện chỉ hiện tệp của bé mình dạy, lớp mình phụ trách và tệp mình tải.
- `?demo`: ảnh mẫu SVG; ảnh tải lên được thu nhỏ lưu trong trình duyệt, video và tài liệu chỉ giữ trong phiên.

## Mã học sinh hiển thị
- Mã bé dạng **HS01, HS02, HS03…** (đệm đủ 2 chữ số, quá 99 thì HS100…). Mã hiển thị là **HS01-BT** (bé có bán trú, kèm 1-1) hoặc **HS01-CN** (bé chỉ học 1-1); hậu tố tính từ hình thức học hiện tại nên bé đổi từ 1-1 sang bán trú thì CN tự đổi thành BT, số HS giữ nguyên. Bé thêm mới lấy mã bằng `newKidId()` (số lớn nhất hiện có cộng 1, bỏ qua mã hỏng, bảo đảm không trùng); nhân sự mới lấy mã `nv01, nv02…` bằng `newStaffId()`, cùng cách làm. Dữ liệu mẫu và bé cũ mang mã `hsNNN` vẫn chạy bình thường: `k.id` là khóa dữ liệu nên không đổi, chỉ khi hiển thị `hs012` thành `HS12-BT`. Lỗi cũ: khi danh sách bé trống, `Math.max()` trả `-Infinity` nên bé đầu tiên mang mã `hs-Infinity` và bé thứ hai trùng mã đó (ghi đè nhau); đã sửa trong `newKidId`/`newStaffId` và có bài thử ở `test/z5-choi-ma.js`. Hiển thị ở danh sách học sinh (tìm được theo mã), tiêu đề hồ sơ bé, bảng chấm công, và các file Excel (chấm công, công nợ, thống kê). Mã: `kidNo`, `newKidId`, `kStt`, `kcode`, `kcodeOf` ở `src/build/p08-hs.js`.

## Quản lý được phân giao dạy trẻ
- Giáo viên (`gv`) và Quản lý (`ql`) đều được chọn làm người dạy: giáo viên 1-1 của bé (chỉ 1-1 hoặc bán trú kèm 1-1), giáo viên nhóm bán trú (mỗi lớp nhiều giáo viên ngang nhau, không phân chính hay phụ), người dạy bù. Danh sách chọn có ở form thêm/sửa bé, Phân công (cả ba tab), Lịch học, Học bù, bộ lọc ở Học sinh, Buổi can thiệp và Điểm danh. Quản lý hiện kèm "(Quản lý)" để phân biệt. Trưởng Trung tâm, Văn phòng và hành chính không nằm trong danh sách phân giao.
- Quyền của Quản lý không đổi: vẫn không thấy học phí, lương và các dữ liệu tiền. Lương của Quản lý đang dạy do Trưởng Trung tâm cài ở Nhân sự (cách tính "Theo ca 1-1" hoặc "Cơ bản và theo ca" thì ca dạy được tính như giáo viên; "Lương cố định" thì không tính thêm theo ca).
- Quy tắc cũ giữ nguyên: người phụ trách nhóm bán trú không xếp thêm ca 1-1, giáo viên bán trú phải rảnh T2–T6, kiểm tra trùng giờ như mọi giáo viên. Mã ở `src/build/p05-shell.js` (`isTeacher`, `tName`, `activeTeachers`) và `src/build/p09-pc.js`. Bài thử `test/z6-ql-teach.js`.

## Hình thức học khi thêm hồ sơ bé
- Form thêm/sửa bé có khối **Hình thức học**: tích Bán trú và/hoặc Can thiệp 1-1; mỗi hình thức tích các buổi (thứ) cụ thể. Bán trú chọn lớp (Ong non, Ong mật) và ngày học (T2–T6, T2–T7 hoặc tùy chọn); 1-1 chọn từng ngày và giờ riêng (ca 50 phút, trong khung 07:15 đến 20:00, kiểm tra trùng giờ). Bé học cả hai thì ca 1-1 sớm nhất mỗi ngày bán trú là ca nằm trong gói, ca khác tính riêng. Lưu vào `k.bt`, `k.gr`, `k.btd` và lịch 1-1 `DB.lich`, nên dữ liệu cũ vẫn chạy. Mã: `hthField` ở `src/build/p08-hs.js`.

## Ngân hàng mục tiêu: Ngôn ngữ trị liệu (0–6 tuổi)
- Bộ công cụ **Ngôn ngữ trị liệu** (`nl`, 313 mục) lấy từ file GOLDEN BEE MASTER GOAL BANK 0–6, chia theo độ tuổi như các bộ khác (mốc lọc `m` 0–4). Mã mục giữ nguyên từ file (`GT-01`…), khóa `nl:GT-01`.
- Mỗi mục có: hành vi quan sát được (mô tả), tiêu chí đạt, phương thức giao tiếp, ghi chú lâm sàng (nếu có), nguồn tham chiếu; các dòng này hiện ở phần "Chi tiết" của mục.
- Lĩnh vực của file được nối vào lĩnh vực có sẵn khi trùng nghĩa (Ngôn ngữ hiểu → Hiểu; Ngôn ngữ diễn đạt, Diễn ngôn → Diễn đạt; Ngữ dụng → Xã hội; Chơi và nhận thức biểu tượng → Xã hội/Chơi; Tiền đọc viết → Nhận thức). Năm lĩnh vực chưa có được thêm vào bộ lọc: **Tiền ngôn ngữ**, **Phát âm** (Lời nói và phát âm), **AAC**, **Ăn uống**, **Thính giác**.
- Mã nguồn: `src/build/p03f-nl.js` (sinh từ file Excel bằng script; sửa dữ liệu thì sửa file này hoặc chạy lại script). Bài thử: `test/z9-nl-bank.js`.

## Ngân hàng mục tiêu: Thang chơi biểu tượng Westby
- Lĩnh vực Chơi và tương tác xã hội (`xh`) có thêm hai bộ công cụ: **Westby** (`we`, 10 giai đoạn I–X, 35 mục tiêu cụ thể, kèm "ngôn ngữ thường đi cùng" từng giai đoạn) và **Chuỗi chơi 0–4 tuổi** (`cp`, 6 tiêu đề, 34 mục). Dữ liệu ở `src/build/p03e-westby.js`; lọc theo bộ công cụ, tiêu đề, mốc tuổi hoặc tìm bằng từ khóa. Mức "giả vờ theo thứ bậc" mức 5 không có mốc tuổi trong tài liệu gốc nên để trống mốc tuổi (`m:-1`), không tự đoán.
- Mục tiêu Westby thêm vào kế hoạch của bé như mọi mục khác trong ngân hàng; mục tiếp theo của chuỗi đi sang giai đoạn sau.
- **Nút lọc "Chơi"** trong thanh Lĩnh vực (Ngân hàng mục tiêu và hộp chọn mục tiêu cho bé): gom toàn bộ mục chơi (Westby, Chuỗi chơi 0–4 tuổi, và mọi tiêu đề bắt đầu bằng "Chơi" hoặc "Vui chơi" của ABLLS-R, ESDM, VB-MAPP, Mầm non). Nút "Xã hội" nay chỉ còn phần xã hội. Về dữ liệu, mọi mục vẫn thuộc lĩnh vực `xh` như cũ (kế hoạch, tiến bộ, biểu đồ của bé không đổi); chỉ bộ lọc tách đôi (`isPlay`, `domHit`, `LCHIPS` ở `src/build/p04b-prog.js`). Mục trong danh sách mang nhãn "Chơi".

## Tài liệu tham khảo (chung cho mọi phụ huynh)
- Collection `ref` trong `records`: hướng dẫn, video mẫu để phụ huynh dạy con tại nhà. **Chỉ Trưởng Trung tâm và Quản lý tải lên, sửa, ẩn, xóa**; Văn phòng và Giáo viên chỉ đọc; phụ huynh không đọc bảng trực tiếp. Phụ huynh thấy tab **Tài liệu tham khảo** (mọi phụ huynh thấy như nhau, không phụ thuộc bé). Mỗi tài liệu nhận PDF, ảnh hoặc video (tệp Word cần lưu thành PDF trước).
- Tệp nằm ở tiền tố `r/` của bucket riêng tư `gb-media`; chỉ `tt` và `ql` ghi, xóa được tiền tố này (chính sách Storage, migration `20261109210000_ref_tri_collections.sql`). `api/parent.js` chỉ trả `{id,t,k,d,n,cat,ct,...}` đã lọc: không có đường dẫn kho, không có mã bé, không có tên nhân viên; ký đường xem 15 phút theo từng lần mở (khóa `r:<id>`), và vẫn trả 423 khi cổng phụ huynh bị khóa vì quá hạn học phí.
- **Không cho tải về, không chụp màn hình** ở mức trình duyệt cho phép: PDF vẽ từng trang lên canvas bằng pdf.js (đóng gói sẵn ở `vendor/pdfjs/`, không gọi CDN; biến `window.GB_PDFJS` đổi đường dẫn khi thử), video có `controlsList="nodownload noremoteplayback"` và tắt hình trong hình, ảnh vẽ qua thẻ `img` không có đường tải. Cộng với lớp phủ tên, liên hệ, giờ xem và chặn chuột phải, sao chép, in của cổng phụ huynh. Trình duyệt **không thể chặn tuyệt đối** người cố tình chụp màn hình hay mở công cụ nhà phát triển để lấy đường xem tạm; chỉ làm khó và truy được nguồn.
- Mục "Tài liệu" cũ của từng bé (hồ sơ, giáo án nội bộ) đổi tên thành **Hồ sơ, giáo án** ở phía nhân viên; phụ huynh vẫn xem "Tài liệu riêng của bé" như trước.

## Góc tri ân (bé tốt nghiệp, tiến bộ, lời cảm ơn)
- Collection `tri` trong `records`: ảnh bé tốt nghiệp hoặc tiến bộ (tối đa 4 ảnh, chỉ ảnh, không video) và lời cảm ơn chung. Chỉ `tt` và `ql` đăng, sửa, ẩn, xóa (tiền tố `t/` của `gb-media`). Phụ huynh thấy tab **Góc tri ân**, mọi phụ huynh thấy như nhau, bản chia sẻ mới hiện.
- Bắt buộc tích **gia đình đã đồng ý** và ghi chú cách đồng ý (`cs`, `cn`) mới chia sẻ được; ghi chú đồng ý chỉ nhân viên thấy. Phụ huynh chỉ thấy tên viết tắt (ví dụ "Phụ huynh bé T."), không thấy tên bé, mã bé, tên nhân viên hay đường dẫn kho. Liên kết với hồ sơ bé (`k`) là tùy chọn và chỉ nội bộ. Đồng ý là lời khai của người đăng, ứng dụng không kiểm chứng được.
- Xóa hoặc ẩn xong, máy phụ huynh tự bỏ mục đó ở lần đồng bộ sau (API trả danh sách `live`).

## Chấm công do Quản lý thực hiện
- **Giáo viên không tự chấm công.** Chỉ nhân sự làm giờ cố định (lương cố định theo tháng, ví dụ giáo viên bán trú 07:15 đến 18:00) cần chấm công, và **Quản lý (hoặc Trưởng Trung tâm) chấm cho họ** ở mục Chấm công: chọn ngày, bấm "Có mặt" (giờ vào/ra mặc định 07:15 và 18:00, chỉnh ở Nhân sự → Cài đặt: `ccIn`, `ccOut`), "Sửa giờ" khi đến muộn hay về sớm, hoặc "Chấm có mặt cho N người chưa chấm" để chấm một lần cho cả danh sách. Văn phòng chỉ xem.
- **Giáo viên chỉ trả theo ca (1-1) không cần chấm công**: tiền tính theo ca được nhận dạy và điểm danh của bé. Bảng chấm công, file Excel chấm công và số ngày công chỉ gồm nhân sự cần chấm công; trong bảng lương, người không chấm công không bị tính ngày công hay số lần đi muộn.
- Phân loại lưu ở hồ sơ nhân sự là cờ `cc` (`false` = chỉ trả theo ca, không chấm công; không có hoặc `true` = cần chấm công), tự suy ra từ cấu hình lương khi Trưởng Trung tâm lưu: lương trả theo ca và không có mức lương bán trú thì `cc=false` (`needCC`, `ccOf` ở `src/build/p04-domain.js`). Cờ nằm ở hồ sơ nhân sự (không phải dữ liệu tiền) để Quản lý và Giáo viên đọc được; cấu hình lương vẫn ở `money_records`. Nhân sự cũ trên cloud chưa có cờ được gán một lần khi Trưởng Trung tâm hoặc Văn phòng đăng nhập (`ccBackfill`); trước đó nhân sự cũ vẫn được coi là cần chấm công.
- Trưởng Trung tâm, Quản lý, Văn phòng (không phải người dạy) vẫn tự bấm vào ca / ra ca của mình như trước. Giáo viên chỉ xem trạng thái "Quản lý đã / chưa chấm công" ở Chấm công và Dashboard.
- Chính sách RLS (migration `20261110180100_ts_manager_only.sql`): collection `ts` chỉ `tt`, `vp`, `ql` ghi; `gv` chỉ đọc.

## Vi phạm nội quy và trừ lương
- Mục **Vi phạm nội quy** (menu cạnh Chấm công): Quản lý ghi nhận vi phạm của nhân sự (ngày, lý do chọn từ danh sách 12 lỗi trong poster "Nhắc nhở chung về giờ làm việc và quy định Trung tâm" hoặc "Lý do khác" kèm ghi chú, mức độ), **Trưởng Trung tâm duyệt và quyết định số tiền trừ**. Trưởng Trung tâm tự ghi thì duyệt luôn.
- Mức độ: Mức 1 (nhẹ) và Mức 2 (vừa) có số tiền gợi ý mặc định 20.000 ₫ và 30.000 ₫ (chỉnh ở Nhân sự → Cài đặt: `v1`, `v2`; theo poster, mỗi lần bị note 20.000 đến 30.000 ₫); Mức 3 (cao hơn: tùy hậu quả hay tái phạm) bắt buộc Trưởng Trung tâm nhập số tiền. Khi duyệt, màn hình hiển thị số lần cùng lý do trước đó để Trưởng Trung tâm cân nhắc. Trường hợp đặc biệt hay tái phạm nhiều lần do Trưởng Trung tâm quyết định.
- Trạng thái: chờ duyệt (`cho`), đã duyệt (`duyet`), từ chối (`tuchoi`). **Chỉ vi phạm đã duyệt mới trừ lương**: dòng "Trừ vi phạm nội quy (dd/mm: lý do)" trên phiếu lương, cột "Trừ vi phạm" trong file Excel lương, và trong tính toán lương (`vpen` ở `payroll`). Đã duyệt thì sửa, xóa được (xác nhận trước khi xóa) và lương tháng đó tự tính lại.
- Lưu trữ: bản ghi vi phạm ở collection `vio` trong `records` (không có số tiền); **số tiền nằm ở `money_records`, collection `vam`** (khóa `mãNhânViên|mãViPhạm`), nên Quản lý không bao giờ thấy số tiền. Giáo viên chỉ thấy vi phạm đã duyệt của chính mình (kèm số tiền của mình); nhân sự khác không đọc được vi phạm của người khác.
- Quyền (kiểm tra ở máy chủ, migration `20261110180000_vio_policies.sql`, hàm `private.vio_ok`): `tt` mọi thao tác; `ql` chỉ tạo, sửa, xóa bản ghi đang chờ duyệt và **không ghi vi phạm về chính mình**; `vp` chỉ xem danh sách (giao diện không cho sửa; số tiền xem được vì `vp` có quyền tiền), `gv` xem phần đã duyệt của mình, `ph` không đọc. Giao diện ở `src/build/p26-vio.js`.
- Quy tắc này khác với "thưởng": thưởng nằm ở `money_records` như cũ, hai khoản độc lập.

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
- Giáo viên: chỉ đọc lương, thưởng và khoản trừ vi phạm đã duyệt của mình (theo mã nhân viên). Không tự chấm công (collection `ts` chỉ `tt`, `vp`, `ql` ghi).
- Vi phạm nội quy (`vio`): chỉ `tt` và `ql` ghi; `ql` chỉ ghi bản chờ duyệt và không ghi về chính mình; số tiền trừ (`vam`) ở `money_records` nên chỉ `tt`, `vp` đọc ghi, giáo viên đọc phần của mình.
- Phụ huynh: chỉ qua `api/parent.js`, chỉ dữ liệu của bé mình.

## Gói Supabase, sao lưu và phục hồi
- Dự án Supabase `bqvwibipmzyrkrwlfoqf` ở gói **Pro** (xác nhận ngày 10/11/2026): không tự tạm dừng khi ít dùng, 100 GB lưu trữ tệp, sao lưu cơ sở dữ liệu hằng ngày và giữ 7 ngày.
- Sao lưu hằng ngày chỉ chứa **cơ sở dữ liệu** (bảng `records`, `money_records`, `profiles`...). **Không chứa tệp** trong Storage (bucket `gb-media`): ảnh, video, tài liệu lỡ xóa thì không khôi phục được từ bản sao lưu, nên bản gốc quan trọng phải giữ ở nơi khác.
- Phục hồi: Supabase → Database → Backups → chọn bản → Restore. Thao tác này ghi đè dữ liệu hiện tại, chỉ làm khi chủ dự án xác nhận. Khôi phục theo từng thời điểm (PITR) là dịch vụ trả phí thêm, chưa bật.
- Việc chỉ chủ dự án làm được ở bảng điều khiển (không làm được qua kết nối của Claude):
  1. Authentication → bật "Leaked password protection" (chặn mật khẩu đã lộ).
  2. Storage → Settings → nâng "Global file size limit" lên ít nhất 500 MB.
  3. Database → Backups: ngày hôm sau khi nâng gói, kiểm tra đã có bản sao lưu đầu tiên.
  4. Giữ "Spend Cap" bật để không phát sinh chi phí ngoài gói.
  5. Bật xác thực hai lớp (MFA) cho tài khoản Supabase, GitHub và Vercel của chủ dự án.
  6. Thanh toán bằng thẻ tín dụng, hóa đơn tính bằng USD; hóa đơn quá hạn có thể khiến dự án bị tạm dừng và hạ về gói Free.

## Giới hạn đã biết
- Chưa bật "Leaked password protection" của Supabase Auth. Dự án đã ở gói Pro nên bật được, nhưng chỉ bật ở bảng điều khiển Supabase → Authentication (chủ dự án làm; xem mục "Gói Supabase, sao lưu và phục hồi"). Sau khi bật, chạy lại `get_advisors` loại security để xác nhận cảnh báo đã hết.
- Tài khoản Trưởng Trung tâm đầu tiên tạo trong Supabase (Authentication) kèm một dòng `tt` trong bảng `profiles`. Các tài khoản khác cấp trong app: Nhân sự → mở hồ sơ → Tài khoản đăng nhập.
- Chưa có "quên mật khẩu": Trưởng Trung tâm đặt lại mật khẩu cho nhân viên và phụ huynh (phụ huynh chỉ có số điện thoại cũng không nhận được thư đặt lại).
- Chưa có giới hạn số lần đăng nhập sai ngoài giới hạn mặc định của Supabase.
- Xóa dữ liệu do người khác thực hiện chỉ hiện sau khi tải lại trang.
- Dữ liệu điểm danh được tải toàn bộ khi đăng nhập; với hàng trăm trẻ dùng nhiều năm cần tải theo tháng.
- Ảnh, video: gói Pro có 100 GB lưu trữ tệp; mỗi tệp tối đa 500 MB và chỉ có hiệu lực khi "Global file size limit" của cả dự án (Supabase → Storage → Settings) cũng từ 500 MB trở lên, nếu không tệp lớn hơn mức chung bị từ chối (HTTP 413). Tải lên dùng một yêu cầu duy nhất, chưa có tải tiếp khi mất mạng giữa chừng: video rất lớn nên nén trước. Chưa có xem trước cho tài liệu Word, Excel (mở bằng ứng dụng của máy). Xóa bé không xóa ảnh, video của bé trong kho.
- Chấm công: nhân sự cũ trên cloud chỉ nhận cờ `cc` (không chấm công) khi Trưởng Trung tâm hoặc Văn phòng đăng nhập một lần; trước đó vẫn được coi là cần chấm công. Dữ liệu tự chấm công cũ của giáo viên giữ nguyên, nhưng giáo viên không ghi thêm được. Chính sách chặn giáo viên ghi `ts` (`20261110180100_ts_manager_only.sql`) áp dụng sau khi bản giao diện mới lên Production.
- Vi phạm nội quy: Văn phòng giữ quyền tiền theo mô hình hiện có nên xem được số tiền trừ; Quản lý không thấy số tiền nên chỉ thấy lý do, mức độ và trạng thái.
- Hạn chế chụp màn hình chỉ răn đe, không chặn tuyệt đối (xem phần Cổng phụ huynh: hạn chế chụp màn hình).
- Tài liệu tham khảo và Góc tri ân: tệp đã mở xem trong trình duyệt phụ huynh thì kỹ thuật viên vẫn lấy được đường xem tạm 15 phút từ công cụ nhà phát triển; không có cách chặn hẳn trên web. Tài liệu tham khảo chỉ nhận PDF, ảnh, video. Thêm pdf.js tự lưu (`vendor/pdfjs/`) làm bản triển khai nặng thêm khoảng 1,8 MB.
