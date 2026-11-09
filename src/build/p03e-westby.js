/* ===== Thang chơi biểu tượng Westby và chuỗi phát triển chơi 0–4 tuổi =====
   Bổ sung vào Ngân hàng mục tiêu, lĩnh vực "Chơi và tương tác xã hội" (xh), theo tài liệu "Kỹ năng chơi" (môn Phát triển ngôn ngữ không điển hình thuở ấu thơ).
   Hai bộ công cụ mới:
   - we: Thang chơi biểu tượng Westby (1980), 10 giai đoạn từ 9 tháng đến 5 tuổi, kèm ngôn ngữ thường đi cùng mỗi giai đoạn.
   - cp: Chuỗi phát triển chơi từ chơi thực hành đến chơi biểu tượng (Piaget 1951, McCune 1995, Nicolich 1977).
   Mỗi mục: c mã, n mục tiêu, o mô tả biểu hiện, x ví dụ (nếu tài liệu có), a và m mốc tuổi, lg ngôn ngữ đi cùng (chỉ Westby), rf nguồn.
   Tài liệu gốc không ghi mốc tuổi cho "Giả vờ theo thứ bậc" (mức 5): các mục đó để m = -1 và ghi rõ, không tự suy đoán tuổi. */
(function(){
 const WRF='Westby, C.E. (1980). Assessment of cognitive and language abilities through play. Language, Speech, and Hearing Services in Schools, 11, 154–168.';
 const CRF='Piaget (1951), McCune (1995), Nicolich (1977); mốc theo tuổi: Rosenblatt (1975, 1977), Fenson và cộng sự (1976).';
 /* đặt hai bộ mới trước mục "Trung tâm tự thêm" cho gọn danh sách chọn */
 const cu=LSRC.cu;delete LSRC.cu;
 LSRC.we={n:'Westby',d:'Thang chơi biểu tượng Westby: 10 giai đoạn chơi từ 9 tháng đến 5 tuổi, đối chiếu với phát triển ngôn ngữ'};
 LSRC.cp={n:'Chuỗi chơi 0–4 tuổi',d:'Chuỗi phát triển chơi từ chơi thực hành đến chơi biểu tượng. Mốc thường gặp: 9 tháng hơn 90% trẻ chơi tâm vận động với đồ chơi; 12 tháng khoảng 80% vẫn chơi tâm vận động với đồ chơi đơn, bắt đầu thể hiện sự đại diện nhưng chưa thường xuyên; 15 tháng chơi chức năng là hoạt động chủ yếu; 18 tháng chơi tâm vận động còn dưới 20% và hơn 50% hoạt động chơi là chơi thể hiện với đồ chơi đơn.'};
 LSRC.cu=cu;
 const D='xh';
 /* ---- 1. Thang Westby: [tiêu đề, tuổi, mốc lọc, ngôn ngữ đi cùng, [[mục tiêu, mô tả, ví dụ], ...]] ---- */
 const WE=[
  ['Giai đoạn I · 9–12 tháng','9–12 tháng',0,'Chưa dùng ngôn ngữ thật; có thể có những “từ” gắn với cả hành động hoặc tình huống. Thể hiện các chức năng giao tiếp: đề nghị (instrumental) và ra lệnh, đòi hỏi (regulatory).',[
   ['Tìm đồ chơi được giấu dưới khăn','Ý thức rằng đồ vật vẫn tồn tại khi không nhìn thấy.','Giấu đồ chơi dưới khăn, bé kéo khăn ra để lấy.'],
   ['Bò hoặc đi tới lấy thứ mình muốn, kéo đồ chơi có dây','Hành vi có chủ đích để đạt được thứ bé muốn.','Bò tới lấy xe, kéo xe đồ chơi theo dây.'],
   ['Dùng một số đồ chơi đúng cách thay vì cho vào miệng hoặc đập mọi thứ','Không còn cho vào miệng hoặc đập tất cả đồ chơi; dùng một số đồ phù hợp.','']]],
  ['Giai đoạn II · 13–17 tháng','13–17 tháng',1,'Dùng từ đơn còn phụ thuộc ngữ cảnh, ví dụ nói “xe” khi đang ngồi trên xe nhưng không nói khi nhìn thấy xe; từ mới dần vào vốn từ. Chức năng giao tiếp: đề nghị, phản đối, ra lệnh, gọi tên, tương tác, hồi đáp, cá nhân, chào hỏi.',[
   ['Khám phá đồ chơi có mục đích bằng thử sai','Tìm hiểu cấu tạo của đồ chơi thông qua thử sai, dùng nhiều cách vận động khác nhau.','Xoay, ấn, kéo, lắc hộp nhạc để tìm cách làm nó kêu.'],
   ['Đưa đồ chơi cho người lớn khi không tự mở được','Biết nhờ người lớn giúp khi gặp khó.',''],
   ['Đổ hết đồ trong chai ra','Hành động khám phá với đồ đựng.',''],
   ['Tìm đồ vật được giấu ở nhiều nơi khác nhau','Ý thức rằng đồ vật tồn tại tách biệt với nơi chốn.','']]],
  ['Giai đoạn III · 17–19 tháng','17–19 tháng',1,'Bắt đầu giao tiếp bằng lời thực sự. Các từ có chức năng và quan hệ ngữ nghĩa: tiếp diễn, chủ thể, sự tồn tại, tác nhân hoặc vật, sự không tồn tại, hành động hoặc trạng thái, sự từ chối, sự khước từ, địa điểm, đồ vật hoặc người liên quan đến đồ vật hoặc địa điểm.',[
   ['Chơi giả vờ lần đầu với chính mình','Giả vờ làm những việc của bản thân.','Giả vờ đi ngủ, uống từ cái cốc không, ăn từ cái thìa không.'],
   ['Dùng đúng cách các đồ vật và đồ chơi thông dụng nhất','','Dùng thìa để ăn, lược để chải tóc.'],
   ['Dùng vật trung gian để lấy đồ chơi','Sử dụng công cụ (tool-use).','Dùng cái que để với đồ chơi.'],
   ['Tìm đồ chơi được giấu trong hộp hoặc dưới hộp úp trên khăn','Tìm đồ chơi dù không nhìn thấy lúc giấu.','']]],
  ['Giai đoạn IV · 19–22 tháng','19–22 tháng',1,'Hướng đến đồ vật và người không có mặt. Bắt đầu kết hợp từ theo các quan hệ ngữ nghĩa: chủ thể–hành động, hành động–địa điểm, hành động–tác nhân, tác nhân–địa điểm, chủ thể–tác nhân, sở hữu, đặc điểm, dative.',[
   ['Chơi với búp bê: chải tóc, cho ăn, đắp chăn','Tính biểu tượng mở rộng hơn bản thân bé.','Chải tóc cho búp bê, cho búp bê ăn bằng chai, đắp chăn cho búp bê.'],
   ['Giả vờ với hơn một người hoặc đồ vật','Hoạt động giả vờ không chỉ hướng vào bản thân.','Tự ăn, rồi cho búp bê ăn, rồi cho mẹ và bạn ăn.'],
   ['Kết hợp hai đồ chơi trong chơi giả vờ','','Đút cái thìa vào chảo; rót nước từ bình vào cốc.']]],
  ['Giai đoạn V · 24 tháng','24 tháng',2,'Dùng các chức năng ngữ dụng sớm hơn và các quan hệ ngữ nghĩa trong cụm từ, câu ngắn. Xuất hiện dấu hiệu hình thái: thể tiếp diễn ở động từ, số nhiều, sở hữu.',[
   ['Tái hiện trải nghiệm hằng ngày: chơi gia đình mẹ, bố, con','Đồ vật được dùng như thực tế và gần với kích thước của đời sống.',''],
   ['Chơi các sự kiện ngắn và rời rạc, chuỗi tự giới hạn','Chưa có chuỗi thật; một số chuỗi tự giới hạn.','Cho đồ ăn vào chảo, khuấy, rồi ăn.'],
   ['Chơi khối vuông: xếp chồng lên rồi đổ xuống','',''],
   ['Chơi cát và nước: đổ vào, rót vào, đập ấn xuống','','']]],
  ['Giai đoạn VI · 2½ tuổi','2½ tuổi',2,'Trả lời phù hợp các câu hỏi có từ để hỏi trong bối cảnh: cái gì, ai, của ai, ở đâu, làm gì; tự hỏi câu hỏi có từ để hỏi, thường đặt ở đầu câu. Chưa trả lời phù hợp câu hỏi TẠI SAO, trừ những thói quen nổi bật như “Tại sao bác sĩ lại ở đây? … Em bé ốm”. Có hỏi TẠI SAO nhưng thường không phù hợp hoặc không chú ý đến câu trả lời.',[
   ['Chơi giả vờ vai bác sĩ, y tá, em bé ốm','Tái hiện sự kiện ít trải nghiệm, đặc biệt những sự kiện gây ấn tượng hoặc tổn thương. Sự kiện còn ngắn và tách biệt, vẫn cần vật liệu thật; vai nhân vật đổi rất nhanh.',''],
   ['Chơi giả vờ vai giáo viên và học trò','Sự kiện còn ngắn và tách biệt, vai đổi rất nhanh.',''],
   ['Chơi giả vờ cửa hàng, bán hàng','Vẫn cần vật liệu thật.','']]],
  ['Giai đoạn VII · 3 tuổi','3 tuổi',3,'Dùng thì quá khứ, ví dụ “Con đã ăn bánh”, “Con đã đi bộ”. Dùng dạng tương lai, ví dụ “Con sẽ đi rửa bát”.',[
   ['Chơi giả vờ theo chuỗi các sự kiện nối tiếp nhau','Tiếp tục hoạt động giả vờ của giai đoạn V và VI nhưng giờ chơi đã theo chuỗi, các sự kiện không tách rời. Chuỗi xuất hiện nhưng chưa được lên kế hoạch.','Trộn bánh, nướng, ăn, rửa bát. Bác sĩ khám bệnh nhân, gọi xe cứu thương, đưa bệnh nhân đi viện và mổ.'],
   ['Chơi bù (compensatory play)','Tái hiện lại sự kiện đã trải qua bằng những hệ quả mới.',''],
   ['Chơi tương tác với bạn (associative play)','','']]],
  ['Giai đoạn VIII · 3–3½ tuổi','3–3½ tuổi',3,'Từ miêu tả được mở rộng khi bé ý thức hơn về đặc tính tri giác: dùng các từ chỉ hình dạng, kích cỡ, màu, bề mặt, quan hệ không gian (nhưng chưa phải lúc nào cũng đúng). Tạo hội thoại với búp bê và rối. Dùng siêu ngôn ngữ, ví dụ “Anh ấy nói…”. Dùng lời đề nghị gián tiếp, ví dụ “Mẹ cho phép con ăn bánh quy để ăn sáng.” Thay đổi lời nói dựa vào người nghe.',[
   ['Chơi giả vờ với nhà búp bê và bộ đồ chơi chuồng trại, ga-ra, sân bay, làng','Thực hiện các hoạt động chơi của giai đoạn trước với nhà búp bê và đồ chơi kiểu Fisher-Price.',''],
   ['Dùng khối vuông hoặc hộp cát để chơi tưởng tượng','Khối vuông chủ yếu để xây, quây lại (hàng rào, nhà) cho vật nuôi và búp bê.',''],
   ['Dùng một đồ vật để thể hiện cho vật khác','Chơi chưa hoàn toàn dựa vào kích thích.',''],
   ['Dùng búp bê hoặc con rối như người tham gia trò chơi','','']]],
  ['Giai đoạn IX · 3½–4 tuổi','3½–4 tuổi',3,'Nói ra bằng lời các chủ định và sự kiện tương lai có thể xảy ra. Dùng các trợ động từ (có thể, sẽ, …) và liên từ (và, nhưng, nếu, vì thế, bởi vì); năng lực đầy đủ chưa phát triển cho đến sau 10–13 tuổi. Bắt đầu trả lời phù hợp câu hỏi TẠI SAO và NHƯ THẾ NÀO cần suy luận về tri giác.',[
   ['Chơi các sự kiện cần giải quyết vấn đề, có kế hoạch từ trước','Sự kiện chưa từng trải nghiệm; bé đưa ra giả định “điều gì xảy ra nếu…”.',''],
   ['Dùng búp bê và rối để diễn các tình huống','',''],
   ['Xây cấu trúc 3 chiều bằng khối vuông để tái hiện công trình đã nhìn thấy','','']]],
  ['Giai đoạn X · 5 tuổi','5 tuổi',4,'Dùng các từ chỉ quan hệ (sau đó, khi nào, đầu tiên, tiếp theo, cuối cùng, trong khi, trước đó). Khả năng đầy đủ chưa phát triển cho đến khoảng 10–12 tuổi.',[
   ['Lên kế hoạch chuỗi sự kiện giả vờ, sắp xếp đồ vật và các bạn theo ý muốn','Tổ chức sắp xếp những gì bé muốn, cả đồ vật lẫn trẻ khác.',''],
   ['Phối hợp nhiều hơn một sự kiện diễn ra cùng lúc','',''],
   ['Tưởng tượng cao: dựng bối cảnh không có dấu tích của thực tế','',''],
   ['Chơi phối hợp hoàn toàn với bạn','','']]]
 ];
 /* ---- 2. Chuỗi phát triển chơi: [tiêu đề, [[tên giai đoạn con, tuổi, mốc lọc, [[mục tiêu, mô tả, ví dụ], ...]], ...]] ---- */
 const CP=[
  ['Chơi thực hành · 2–18 tháng',[
   ['Chơi thực hành tâm vận động','2–5 tháng',0,[['Chơi thực hành tâm vận động','Giai đoạn đầu của chơi thực hành. Tài liệu gốc không liệt kê thêm biểu hiện cụ thể.','']]],
   ['Cấu trúc phối hợp thứ cấp','5–10 tháng',0,[
    ['Khám phá đồ vật: cầm, xoa, đưa vào miệng, di chuyển, thao tác, lắc, ném, đập','',''],
    ['Làm gì đó với đồ vật, thích thú với chính hoạt động','Chưa cần mang tính chức năng; thích thú với bản thân hoạt động, không nhất thiết theo cách thông thường hay mang tính đại diện.',''],
    ['Lắp ráp và thực hiện các hoạt động với đồ vật','Hoạt động lắp ráp; các hoạt động với đồ vật (instrumental activities).',''],
    ['Chơi hai hoặc nhiều đồ chơi nhưng chưa dùng cùng nhau','','']]],
   ['Thành tố hoạt động theo thói quen','10–18 tháng',[0,1],[
    ['Khám phá đồ vật phức tạp hơn, dùng nhiều đồ chơi bán-phù hợp','',''],
    ['Dùng đồ vật đúng cách nhưng chưa lâu, chưa định hướng chính xác','Đồ vật được dùng đúng nhưng không được lâu; có thể chưa định hướng chính xác.','Chải đầu với cái lược cầm ngược.'],
    ['Gom các đồ vật lại với nhau','Có thể chưa phân loại chính xác hoặc theo chủ đề nào.','Đặt các thứ vào một cái hộp.'],
    ['Chơi với nhiều hơn một đồ vật cùng lúc, phối kết hợp không thông thường','','Cầm thìa ấn vào quả bóng; xếp chồng các đồ chơi; cho các đồ chơi va chạm vào nhau.']]]]],
  ['Chơi tiền biểu tượng và chơi chức năng · dưới 18 tháng',[
   ['Cấu trúc chơi tiền biểu tượng (biểu tượng mức 1)','dưới 18 tháng',[0,1],[
    ['Thể hiện hiểu biết về cách dùng hoặc ý nghĩa của đồ vật thông thường','',''],
    ['Dùng cử chỉ ngắn để nhận diện cách dùng đồ vật','','Lấy cái lược, chạm vào tóc, rồi làm rơi lược.'],
    ['Dùng thông dụng các đồ vật nhưng chưa sắp xếp hoặc phân biệt tốt','Chưa giả vờ. Đặc tính của đồ vật cung cấp kích thích, chưa phải chức năng cần thiết. Bé thể hiện sự nghiêm túc hơn là thư giãn khi chơi.','Có thể chải tóc với lược, rồi chải lên sàn nhà, vào cốc, vào mặt.']]],
   ['Chơi chức năng','12–18 tháng',1,[
    ['Bắt đầu có chủ đề chơi theo các hoạt động xã hội thông thường','',''],
    ['Dùng đồ vật theo chức năng, thông dụng hoặc đặc trưng','Chơi chức năng nhiều hơn chơi thể hiện hay biểu tượng và dần có ưu thế.','']]]]],
  ['Chơi biểu tượng lần đầu · 18–24 tháng (mức 2)',[
   ['Cấu trúc chơi biểu tượng lần đầu (autosymbolic)','18–24 tháng',1,[
    ['Giả vờ ở những hoạt động liên quan đến bản thân','Tính biểu tượng liên quan trực tiếp đến cơ thể bé; bé thể hiện sự vui đùa, dường như đã ý thức về việc giả vờ.','Giả vờ uống từ cái cốc đồ chơi, ăn từ cái thìa không, nhắm mắt và đưa tay áp má để giả vờ ngủ.'],
    ['Dùng đồ vật quen thuộc theo cách xã hội hoặc theo chức năng','','']]],
   ['Dự đoán biểu tượng với đồ vật mới (1A)','18 tháng',1,[
    ['Hướng hành động quen thuộc từ bản thân sang đồ vật và người khác','Các hành động hướng vào bản thân trở thành hướng sang đối tượng khác.','Cho gấu bông lên giường đi ngủ.'],
    ['Chơi với gấu bông, búp bê là người chơi thụ động','Bé làm với chúng những hoạt động như ôm, hôn, cho ăn.','']]],
   ['Dự đoán cấu trúc bắt chước với đồ vật mới (1B)','18 tháng',1,[
    ['Bắt chước hành động của người khác','Các hành động không nhất thiết là một phần hoạt động hoặc thói quen đặc trưng của bé.','']]]]],
  ['Chơi biểu tượng đơn cấu trúc · 24–36 tháng (mức 3)',[
   ['Các trò chơi biểu tượng đơn cấu trúc','24–36 tháng',2,[
    ['Mở rộng tính biểu tượng sang chủ thể hoặc đồ vật khác của hành động','',''],
    ['Giả vờ hoạt động của người khác hoặc vật khác','','Cho búp bê ăn, chải tóc cho búp bê, giả vờ đọc sách, quét nhà, cho xe ô tô đồ chơi chạy và làm tiếng xe chạy.']]],
   ['Nhận diện đơn giản một đồ vật với đồ vật khác (IIA)','24–30 tháng',2,[
    ['Giả vờ một đồ vật là một đồ vật “thật” khác','Biểu tượng đã phi ngữ cảnh rõ ràng; bé thay thế đồ vật này cho đồ vật khác.','Dùng khối vuông như một cái xe; dùng vật khác giả vờ là đồ ăn.'],
    ['Cho búp bê, gấu bông làm bạn chơi chủ động','Búp bê và gấu bông được phối hợp vào các thói quen biểu tượng.','Búp bê và gấu bông thơm nhau; búp bê đi dạo.'],
    ['Thể hiện lại đồ vật vắng mặt','','Tưởng tượng có điện thoại; đội cái nón tưởng tượng lên đầu búp bê.']]],
   ['Nhận diện cơ thể mình với người khác và vật khác (IIB)','24–30 tháng',2,[
    ['Giả vờ mình là con vật hoặc đồ vật khác','','Giả vờ là con chó, xe, sư tử, cá, mèo, chuột.']]]]],
  ['Kết hợp các trò chơi biểu tượng · 24 tháng – 4 tuổi (mức 4)',[
   ['Kết hợp các trò chơi biểu tượng','24–36 tháng',2,[
    ['Lặp lại một hành động giả vờ với nhiều người hoặc nhiều đối tượng nhận khác nhau','Kết hợp theo chủ đề đơn, gồm cả bản thân.','Uống từ cái chai đồ chơi rồi cho búp bê uống từ chai đó. Đưa cái thìa không vào miệng mẹ, người lớn khác rồi vào miệng mình.'],
    ['Kết hợp nhiều hành động giả vờ liên quan nhau theo trật tự chuỗi','Kết hợp đa chủ đề: các hành động chơi giả vờ có liên quan theo một mạch.','Cho điện thoại vào tai, bấm số. Thơm búp bê, cho vào giường, đắp chăn.']]],
   ['Những kết hợp đơn giản (IIIA)','3–4 tuổi',3,[
    ['Đưa các chi tiết vào cùng một cảnh, tạo lại cảnh đơn giản từ thực tế','Dùng đồ vật tưởng tượng, như thật và thay thế. Còn cường điệu hóa một chút các hành động.','Tái hiện buổi tiệc trà, hoặc quá trình trọn vẹn rửa bát hay mặc quần áo.']]],
   ['Những kết hợp bù trừ (IIIB)','3–4 tuổi',3,[
    ['Sửa chữa thực tế ngay trong lúc giả vờ','Theo trình tự giả vờ, bé cố sửa chữa thực tế thay vì chỉ bắt chước; một số khía cạnh tiêu cực của thực tế được hoàn tác ngay trong tình huống trước mắt.','Không được phép chơi với nước thì lấy cốc, chơi gần xô và giả vờ rót nước.']]],
   ['Những kết hợp giải tỏa (IIIC, liquidating combinations)','3–4 tuổi',3,[
    ['Tái hiện lại tình huống khó khăn hoặc khó chịu sau khi sự việc đã xảy ra','Bé cố sửa chữa hoặc thay đổi một số thực tế, thường là sau sự kiện hoặc phi ngữ cảnh hơn; có thể là bản dựng lại sự kiện trong quá khứ.','']]]]],
  ['Giả vờ theo thứ bậc (mức 5)',[
   ['Giả vờ theo thứ bậc (hierarchical pretend)','chưa ghi mốc tuổi trong tài liệu gốc',-1,[
    ['Chơi biểu tượng hành động đơn có kế hoạch từ trước','Trò chơi hoặc chuỗi được lên kế hoạch rõ ràng trước khi diễn ra; kế hoạch có thể nói ra hoặc không.','Chuẩn bị không gian cho chuỗi biểu tượng: dọn các con vật trang trại đi và sắp xếp để cho búp bê ăn.'],
    ['Chơi chuỗi hành động biểu tượng nhiều tầng có kế hoạch','','Đặt đồ chơi nội thất vào chỗ để tổ chức tiệc trà, sắp bát đĩa, tổ chức tiệc, dọn dẹp sau tiệc. Lên kế hoạch cho búp bê ăn rồi cho búp bê đi ngủ.']]],
   ['Những kết hợp dự đoán (IIID, anticipatory combinations)','3–4 tuổi',3,[
    ['Lên kế hoạch, dự đoán kết quả và thích ứng hành động khi chơi','Có ý thức sáng tạo linh hoạt về kết quả dự kiến hoặc hệ quả; thể hiện được khả năng về các hệ quả thay thế nếu chọn hoặc không chọn một hành động cụ thể.',''],
    ['Giả vờ theo chuỗi dựa vào câu chuyện hoặc sự kiện đã biết','Không cần dựa vào việc tái dựng sự kiện đã qua; có thể dựa vào các sự kiện bé chưa tự trải qua.','']]]]]
 ];
 const add=(src,hi,code,n,o,x,a,m,extra)=>{const it=Object.assign({id:src+':'+code,s:src,c:code,d:D,hi,t:LHEAD[hi][1],n,o:o||'',x:x||'',a,m,sc:null,lg:'',rf:src==='we'?WRF:CRF},extra);
  it.k=ascii(it.c+' '+it.n+' '+it.t+' '+it.o+' '+it.x+' '+LSRC[src].n);LIBI.push(it);GL[it.id]=it};
 const RN=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
 WE.forEach((st,i)=>{LHEAD.push(['we',st[0]]);const hi=LHEAD.length-1;
  st[4].forEach((g,j)=>add('we',hi,'GĐ '+RN[i]+'.'+(j+1),g[0],g[1],g[2],st[1],st[2],{lg:st[3]}))});
 let cn=0;
 CP.forEach(h=>{LHEAD.push(['cp',h[0]]);const hi=LHEAD.length-1;
  h[1].forEach(sub=>sub[3].forEach(g=>{cn++;add('cp',hi,'CP'+cn,g[0],(sub[0]+'. '+(g[1]||'')).trim(),g[2],sub[1],sub[2])}))});
})();
