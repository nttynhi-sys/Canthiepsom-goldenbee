"""Sinh src/build/p03f2-nl-tm.js từ tools/nl_tm_raw.json (80 "mục tiêu thông minh" lồng vào bộ Ngôn ngữ trị liệu).

Chạy từ thư mục gốc repo: python3 tools/gen_nl_tm.py
Sau đó: bash src/build/build-web.sh
Nội dung (tên, nội dung, tiêu chí đạt) giữ nguyên văn; chỉ tiêu đề nhóm kỹ năng viết hoa toàn bộ trong file được chuyển về chữ thường (viết hoa đầu câu).
"""
import json, re

raw = json.load(open('tools/nl_tm_raw.json', encoding='utf-8'))

# Lĩnh vực của bộ lọc (LDOM) cho từng mục, theo số trong file.
#   gtl Giao tiếp tiền ngôn ngữ | nh Ngôn ngữ hiểu | nd Ngôn ngữ diễn đạt | lnp Lời nói và phát âm | xh Chơi và tương tác xã hội
DOM = {}
for n in list(range(1, 16)) + [25, 26, 27, 29, 30]:
    DOM[n] = 'gtl'          # chú ý, chỉ tay, chia sẻ, lượt, bắt chước cử chỉ, gật/lắc đầu, khởi xướng giao tiếp
for n in list(range(16, 25)) + list(range(50, 60)):
    DOM[n] = 'nh'           # hiểu lời, nhận biết, phân loại, hiểu câu hỏi
for n in [28, 38, 39]:
    DOM[n] = 'lnp'          # bắt chước âm, từ, âm đầu/cuối
for n in list(range(31, 38)) + list(range(40, 49)) + list(range(60, 81)):
    DOM[n] = 'nd'           # nói từ đơn, gọi tên, yêu cầu, mô tả, ghép từ, câu
DOM[49] = 'xh'              # chia sẻ xã hội bằng chỉ + lời
assert sorted(DOM) == list(range(1, 81)), 'thiếu ánh xạ lĩnh vực'


def sentence(s):
    """'I. HIỆN DIỆN – CHÚ Ý' -> 'I. Hiện diện – chú ý'"""
    m = re.match(r'^([IVX]+\.\s*)(.*)$', s)
    pre, rest = (m.group(1), m.group(2)) if m else ('', s)
    rest = rest.lower()
    return pre + rest[:1].upper() + rest[1:]


def head(r):
    g = r['group']
    if g.startswith('('):          # "(không chia nhóm kỹ năng trong file)"
        return r['phase']
    return r['phase'] + ' · ' + sentence(g)


groups, gi_of = [], {}
rows = []
for r in raw:
    h = head(r)
    if h not in gi_of:
        gi_of[h] = len(groups)
        groups.append(h)
    rows.append(['TM-%02d' % r['num'], DOM[r['num']], gi_of[h], r['name'], r['content'], r['crit'], r['phase'], r['page']])

js = lambda v: json.dumps(v, ensure_ascii=False)
src = '''/* ===== Ngân hàng mục tiêu: lô "Mục tiêu thông minh" (80 mục) lồng vào bộ "Ngôn ngữ trị liệu" (nl) =====
   Nguồn: file "Mục tiêu thông minh – Bổ sung Ngân hàng mục tiêu Ngôn ngữ trị liệu" do Trung tâm cung cấp (kho mục tiêu 17 trang PDF); nội dung nguyên văn.
   - Cùng bộ nl (s:'nl'), mã TM-01 đến TM-80 (số thứ tự trong file). Không thêm lĩnh vực mới: mỗi mục xếp vào lĩnh vực có sẵn trong bộ lọc (gtl, nh, nd, lnp, xh).
   - Nhóm kỹ năng của file thành 17 tiêu đề dạng "<giai đoạn> · <nhóm>" (giai đoạn diễn đạt câu không chia nhóm nên chỉ có tên giai đoạn).
   - File không nêu độ tuổi: m:-1 và a rỗng, không tự đoán; mục này không xuất hiện khi lọc theo độ tuổi.
   - o giữ nguyên văn nội dung mục tiêu (tình huống, hành vi, số cơ hội, cách hỗ trợ của cô), hiện ở "Chi tiết" với nhãn "Bài tập cụ thể" (ol); tiêu chí đạt nằm ở ex.
   Sinh bằng tools/gen_nl_tm.py từ tools/nl_tm_raw.json. */
(function(){
 const NL_NAME=LSRC.nl.n;
 const GROUPS=%s;
 /* [mã, lĩnh vực, nhóm, tên mục tiêu, nội dung nguyên văn, tiêu chí đạt, giai đoạn, trang PDF] */
 const ROWS=%s;
 const head0=LHEAD.length;
 GROUPS.forEach(g=>LHEAD.push(['nl',g]));
 ROWS.forEach(r=>{
  const [code,dom,gi,n,o,crit,phase,page]=r;
  const it={id:'nl:'+code,s:'nl',c:code,d:dom,hi:head0+gi,t:GROUPS[gi],n,o,ol:'Bài tập cụ thể',x:'',a:'',m:-1,sc:null,lg:'',
   rf:'Kho mục tiêu thông minh (do Trung tâm cung cấp), trang '+page,
   ex:[['Tiêu chí đạt',crit],['Giai đoạn',phase],['Khoảng tuổi áp dụng','File gốc không nêu tuổi']]};
  it.k=ascii(it.c+' '+it.n+' '+it.t+' '+it.o+' mục tiêu thông minh '+NL_NAME);
  LIBI.push(it);GL[it.id]=it;
 });
})();
''' % (json.dumps(groups, ensure_ascii=False), '[' + ',\n  '.join(js(r) for r in rows) + ']')

open('src/build/p03f2-nl-tm.js', 'w', encoding='utf-8').write(src)
print('ghi src/build/p03f2-nl-tm.js:', len(rows), 'mục,', len(groups), 'tiêu đề nhóm')
from collections import Counter
print(Counter(r[1] for r in rows))
