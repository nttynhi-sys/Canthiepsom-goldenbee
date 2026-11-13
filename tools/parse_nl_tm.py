"""Đọc file Excel "Mục tiêu thông minh – Bổ sung Ngân hàng mục tiêu Ngôn ngữ trị liệu" và ghi tools/nl_tm_raw.json.

Chạy: python3 tools/parse_nl_tm.py <đường dẫn file .xlsx>
Chỉ lấy các cột nội dung (số, giai đoạn, nhóm kỹ năng, tên, nội dung nguyên văn, tiêu chí đạt, trang PDF).
Không lấy cột trạng thái duyệt: bộ Ngôn ngữ trị liệu không hiển thị trạng thái duyệt cho người dùng.
"""
import json, sys
from openpyxl import load_workbook

path = sys.argv[1]
wb = load_workbook(path, data_only=True, read_only=True)
ws = wb['Mục tiêu thông minh']
rows = list(ws.iter_rows(values_only=True))
hdr = [str(h or '').strip() for h in rows[0]]
col = {h: i for i, h in enumerate(hdr)}
need = ['Số trong file', 'Lĩnh vực (giai đoạn)', 'Nhóm kỹ năng', 'Tên mục tiêu',
        'Nội dung mục tiêu (nguyên văn file)', 'Tiêu chí đạt (trích từ nội dung)', 'Trang PDF']
for h in need:
    if h not in col:
        sys.exit('Thiếu cột: ' + h)
out = []
for r in rows[1:]:
    if not r[col['Số trong file']]:
        continue
    out.append({
        'num': int(r[col['Số trong file']]),
        'phase': str(r[col['Lĩnh vực (giai đoạn)']]).strip(),
        'group': str(r[col['Nhóm kỹ năng']]).strip(),
        'name': str(r[col['Tên mục tiêu']]).strip(),
        'content': str(r[col['Nội dung mục tiêu (nguyên văn file)']]).strip(),
        'crit': str(r[col['Tiêu chí đạt (trích từ nội dung)']]).strip(),
        'page': int(r[col['Trang PDF']]),
    })
assert len(out) == 80, len(out)
with open('tools/nl_tm_raw.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print('ghi', len(out), 'mục vào tools/nl_tm_raw.json')
