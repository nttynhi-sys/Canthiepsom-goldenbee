# Tiến độ Golden Bee

Cập nhật 16/11/2026 (mã ứng dụng cuối: `154babd`). Quy tắc, nghiệp vụ và danh sách bài thử theo từng tính năng: `CLAUDE.md` mục 10 (không chép lại ở đây). Sau mỗi nhóm chức năng hoàn chỉnh: sửa dòng liên quan, thêm một dòng vào mục 10 của tệp này.

## 1. Kiến trúc
- HTML/JS thuần: `src/build/p*.js` + `c3.css`, ghép bằng `bash src/build/build-web.sh` thành `index.html` (cùng `all.js`, `page-test.html`; đều sinh ra, không sửa tay).
- `api/` (Vercel): `login`, `accounts`, `parent` (cổng phụ huynh), `plock` + `_lock` (khóa cổng), `_lib`.
- Supabase `bqvwibipmzyrkrwlfoqf`: `records` (collection: `CSH` ở `p02b-cloud.js`), `money_records` (`MONEYC`: lg, set, bon, vam, kpr), `profiles`; bucket riêng tư `gb-media`. Vai trò: tt, ql, vp, gv, ph, hc.
- `?demo`: dữ liệu mẫu trong trình duyệt, `DB.v`=7 (`migrate4`–`migrate7` ở `p99-boot.js`).

## 2. Bản đồ module (`src/build/`)
- Trang (mã menu → tệp): dash `p06` · ns `p07` · hs `p08` · pc `p09` · lh `p10` · tn `p21` · cc `p11` · vi `p26` · dd `p12-dd1` (+`dd2`, `dd3`) · hb `p13` · hp `p14` · tl `p15` · mt `p08b-ci` · bc `p16` · td `p17` · cp `p18` · tb, tk `p19`.
- Lõi: `p02-core` tiện ích, ngày · `p02b-cloud` đồng bộ Supabase · `p04-domain` học phí, lương, xung đột lịch, giáo viên–bé · `p04b-prog` mục tiêu, lĩnh vực · `p05-shell` menu, vai trò · `p99-boot` khởi động, nâng cấp dữ liệu · `p98-pw` hiện/ẩn mật khẩu · `p20-charts` biểu đồ.
- Riêng: `p17b-ref` tham khảo, tri ân · `p22-hol` ngày nghỉ · `p23-lock` khóa cổng · `p24-guard` lớp phủ phụ huynh · `p25-tree` cây mục tiêu.
- Dữ liệu mẫu: `p03-seed`, `p03c-seedprog`, `p03d-dx` (chẩn đoán).
- Bộ mục tiêu: `p03e-westby`, `p03f2-nl-tm` (nhỏ); dòng rất dài, không đọc nguyên tệp, `.ignore` loại khỏi tìm kiếm, tìm bằng `rg -o` kèm đường dẫn tệp: `p03b-lib` (8 lĩnh vực), `p03f-nl`, `p03g-sd`, `p03h-adhd`, `p03i-si`, `p01-logo`.

## 3. Đã hoàn thành (đã gộp `main`, có bài thử)
- Nền tảng: đăng nhập Supabase, phân quyền RLS, cổng phụ huynh qua `api/parent.js`, chế độ demo.
- Nhân sự: Fulltime/Partime, trình độ và chứng chỉ, chấm công do Quản lý, vi phạm nội quy trừ lương.
- Học sinh: hình thức học, sửa hồ sơ giữ dữ liệu, mã HS01-BT/CN và dồn mã, một bé nhiều giáo viên 1-1, giá riêng bán trú và theo loại 1-1.
- Lịch: lưới 1-1 chỉ hiện khung giờ có ca, lịch Chủ nhật, bỏ phòng học, nhiều giáo viên mỗi lớp bán trú, Quản lý được phân giao dạy.
- Tài chính: học phí bán trú, 1-1 và hoàn, ngày nghỉ lễ, khóa cổng quá hạn ngày 10.
- Chuyên môn: Ngân hàng mục tiêu (thư viện, Westby, Ngôn ngữ trị liệu, Rối loạn cảm giác, ADHD, Điều hòa cảm giác), cây mục tiêu ba tầng.
- Nội dung: ảnh, video, tài liệu theo bé; tài liệu tham khảo; góc tri ân.
- Vận hành: thực đơn, học bù, điểm danh, thông báo, thống kê, báo cáo chuyên môn.

## 4. Đang phát triển
- Không có chức năng nào. Cả 46 nhánh trên GitHub (trừ `main`) đã gộp hết vào `main` (kiểm tra 16/11/2026).

## 5. Chưa triển khai (README, "Giới hạn đã biết", ghi rõ là chưa có)
- Quên mật khẩu; giới hạn số lần đăng nhập sai ngoài mức mặc định của Supabase.
- Xóa dữ liệu do người khác làm chỉ hiện sau khi tải lại trang; tải điểm danh theo tháng (hiện tải toàn bộ).
- Tải tệp tiếp khi mất mạng; xem trước Word, Excel; xóa bé chưa xóa ảnh, video của bé trong kho.
- Chặn tuyệt đối chụp màn hình: không làm được trên web, chỉ răn đe.

## 6. Lỗi đang tồn tại (xác nhận 16/11/2026 trên `154babd`)
- `test/z25-sd-bank.js`: 6 đạt, 1 lỗi ở kiểm tra "bộ Rối loạn cảm giác – Tích hợp giác quan có trong danh sách (Cu vẫn cuối)". Chưa tìm nguyên nhân.
- `test/n2.js`: dừng ở dòng 49 với `Cannot read properties of undefined (reading 'click')`. Lỗi từ trước.

## 7. Database và migration
- Lược đồ `supabase/schema.sql`; chính sách chuẩn `supabase/policies-v3.sql` (chạy lại an toàn).
- 10 migration trong `supabase/migrations/`, cả 10 đã áp dụng trên Supabase (đối chiếu tên 16/11/2026). 09/11: siết quyền và chuyển hàm RLS sang schema `private`, `hol` chỉ tt, ql, vp ghi, `pul` chỉ máy chủ ghi, bucket `gb-media`, collection `ref`/`tri`. 10/11: giới hạn tệp 500 MB, thêm định dạng video, chính sách `vio`, `ts` chỉ tt, ql, vp ghi.
- Phần lớn tính năng chỉ thêm trường hoặc collection trong `records`, `money_records`, không cần migration (ghi rõ ở từng mục `CLAUDE.md`). Trường cũ (`room`, `g.gv`, `g.tg`, `k.gv`) giữ nguyên để dữ liệu cũ vẫn chạy.

## 8. Quyết định kỹ thuật (chi tiết ở `CLAUDE.md`)
- HTML/JS thuần, không chuyển Next.js/React khi chưa được yêu cầu; `index.html` commit sẵn, không có `vercel.json`.
- Dữ liệu mới = collection mới, không tạo bảng; tiền luôn vào `money_records` (chỉ tt, vp).
- Quyền kiểm ở máy chủ và RLS (hàm ở schema `private`); phụ huynh chỉ qua `api/parent.js`; `gb-media` luôn riêng tư.
- `k.id` không bao giờ đổi; tính tiền một bé luôn qua `kidBt(k)`; hóa đơn đã lập không tự đổi.
- Không có phòng học; Chủ nhật không phải ngày công. Nhánh riêng, xem Preview, chủ dự án xác nhận mới lên Production.

## 9. Công việc tiếp theo
- Chờ chủ dự án quyết: tách `CLAUDE.md` mục 10 thành tệp theo chủ đề trong `docs/`, thu gọn README, gỡ tệp thừa (`chk.js`, `chk2.js`, `page.html`, `trung-tam-tri-lieu.html`), dọn 46 nhánh đã gộp.
- Chủ dự án trên Supabase: các việc ở README, "Gói Supabase, sao lưu và phục hồi".
- Kỹ thuật: tìm nguyên nhân `z25-sd-bank` và `n2.js`. Chưa có yêu cầu tính năng nào đang chờ.

## 10. Nhật ký
- 18/11 (3) mốc tuổi phát triển cho mục tiêu ngắn hạn (`plans[].ma`): tự lấy từ ngân hàng khi có đúng một mốc, giáo viên điền hoặc chọn "Không định mốc"; hiện ở bảng nhân viên và báo cáo phụ huynh (chỉ mục tiêu có mốc, kèm mốc cao nhất đã đạt theo lĩnh vực). Không đổi database. Bài thử `z58`.
- 18/11 (2) giáo viên điểm danh ngày bất kỳ (cả ngày sắp tới); học bù chọn mọi ngày giờ, giáo viên xếp lịch luôn, nhận cả buổi nghỉ cũ hơn 45 ngày; nút "Xếp bé khác vào giờ này" cho bé vắng (`mkfill`); form ghi buổi hiện sẵn mục tiêu đã chọn để bấm Tiếp tục (`sePrevPanel`); cửa sổ tải ảnh/video giữ mở để tải tiếp. Không đổi database. Bài thử `z57`; sửa `z51`, `z56`, `y7-media`.
- 18/11 giáo viên sửa điểm danh học sinh và buổi can thiệp của trẻ mình ở mọi ngày, mọi tháng (bỏ giới hạn 7 và 14 ngày); chọn và sửa được ngày bắt đầu mục tiêu ngắn hạn. Không đổi database. Bài thử `z56-gv-sua-moi-ngay`; sửa `flows3` (quy tắc cũ), `y3-hol` và `z51` (phụ thuộc ngày chạy).
- 17/11 phụ huynh thấy phí cọc của bé mình ở mục Học phí (đang giữ hoặc đã hoàn), chỉ đọc; `api/parent.js` thêm lấy `dep` theo mã bé. Không đổi database. Bài thử `z55-phu-huynh-phi-coc`, `phone-api`.
- 17/11 phí cọc của bé (cột Phí cọc, Hoàn cọc, nhãn Đã hoàn tiền cọc ở Học phí; chỉ hoàn khi bé ngưng và đã đóng đủ học phí; bảng tiền `dep`, không đổi lược đồ); sửa nút Xóa báo cáo và Xóa hồ sơ nhân sự (hộp xác nhận không hiện do `return false`). Bài thử `z54-phi-coc`, `cloud-phi-coc`.
- 17/11 học phí theo thời gian tính phí riêng của bé (`k.fs`, `k.fe`, sửa `k.sd`): nút Thời gian tính phí ở Học phí, học phí, hoàn phí nghỉ và ngày nghỉ lễ chỉ tính trong khoảng, hỏi cập nhật hóa đơn đã lập. Không đổi database. Bài thử `z53-hoc-phi-tinh-tu-ngay`, `cloud-hoc-phi-tinh-tu-ngay`.
- 17/11 xóa hồ sơ bé: sửa lỗi hộp xác nhận không hiện (`ACT.hsdelk` trả `false`), cho Trưởng Trung tâm, Quản lý, Văn phòng xóa (`canDelKid`), thêm nút Xóa ở danh sách; Văn phòng có mục Học sinh chỉ gồm danh sách và thông tin. Không đổi database. Bài thử `z52-xoa-ho-so-be`, `cloud-xoa-ho-so-be`.
- 17/11 (1) mục tiêu buổi SMART được lưu lại: buổi mới tự điền các dòng của buổi gần nhất cùng mục tiêu ngắn hạn, kết quả để trống (`seCarry`, `sePush`); (2) một dòng mục tiêu buổi chọn được nhiều mức hỗ trợ (`it.sups`, `it.sup` là mức cần hỗ trợ nhiều nhất); (3) tải ảnh, video: kéo thả, chọn thêm, tải song song 3 tệp, `accept` ảnh/video đơn giản cho điện thoại; (4) Học bù: tự nhập ngày giờ, "Xếp lịch luôn" cho Trung tâm (`mkpCollect`, `ACT.mkdirect`). Không đổi database. Bài thử `z51-hoc-bu-tu-nhap`, `y6-goals`, `z50-tai-nhieu-tep`.
- 16/11 kết quả 10 lượt: chạm ô số N là bé đúng N lượt (N=2 → 20%, N=5 → 50%), chạm lại ô đó để xóa, ô 0 = không đúng lượt nào (`ACT.setr` ở `p08b-ci.js`); khối bài tập (`gxHtml`) của mục tiêu ngân hàng vẫn mở sẵn ở nhóm và ở dòng chưa gắn mục tiêu ngắn hạn. Không đổi database; dữ liệu cũ (chuỗi V/X/.) đọc như cũ.
- 16/11 form ghi buổi phân tầng: Lĩnh vực ⇒ Mục tiêu ngắn hạn (chọn từ kế hoạch, lấy từ ngân hàng) ⇒ nhiều mục tiêu buổi trị liệu do giáo viên tự viết theo SMART; mỗi dòng không lặp lại tên mục tiêu (`seGroups`, `seItem` ở `p08b-ci.js`). Xem buổi và thẻ buổi lấy SMART làm nội dung chính. Không đổi database.
- 16/11 kế hoạch mục tiêu xếp theo lĩnh vực ("1. Ngôn ngữ hiểu", "2. …") dạng bảng STT / Mục tiêu ngắn hạn ⇒ mục tiêu buổi / Kết quả, ở tab Kế hoạch mục tiêu (`gtTable`, `gtByDom` ở `p25-tree.js`) và cổng phụ huynh. Không đổi database.
- 16/11 bỏ tầng Mục tiêu dài hạn (chỉ còn buổi ⇒ ngắn hạn), thêm ô SMART cho mục tiêu buổi (`plans[].sm`, `it[].sg`); mức hỗ trợ mới VP, VS và thứ tự FP, PP, MP, GP, VP, VS, TD, Ind; tải nhiều tệp có danh sách và "Chọn thêm tệp". Phụ huynh thấy SMART của buổi gần nhất ở từng mục tiêu buổi (`gtGoals`). Form ghi buổi nhóm theo mục tiêu ngắn hạn (ô chọn ở đầu nhóm), mỗi nhóm có nhiều mục tiêu buổi trị liệu kèm SMART riêng (`seGroups`, `ACT.sesub`, `CHG.segpl`). Không đổi database. `y6-goals`, `z34-gx-plan` cập nhật theo mô hình mới, thêm `z50-tai-nhieu-tep`.
- 16/11 gộp `chore/toi-uu-context`: thêm `.ignore`, tệp này; `.vercelignore` loại `docs/`, `.ignore`. Leaked password protection đã bật (chủ dự án xác nhận), advisors security rỗng.
- 16/11 `154babd` giá bán trú riêng, nút Giá riêng ở Học phí. `b101570` lịch Chủ nhật.
- 13/11 `5dcefff` bỏ phòng học. 12/11 `bbaeba1` Fulltime/Partime; `4095043` lưới 1-1 chỉ hiện khung giờ có ca.
