"""Chuyển file Excel VB-MAPP của Trung tâm thành vb_raw.json (mục tiêu + bảng phương hướng).
Chỉ lấy nội dung chương trình (mốc, bước nhỏ, phương hướng), không có dữ liệu của bé nào."""
import openpyxl, re, json, collections, sys

SRC = '/mnt/user-data/attachments/efd1cc77-c428-5628-a76e-f62e732d0ec8/093677f5-1794145334116_3._Ph_n_t_ch_m_c_ti_u__ph__ng_h__ng_can_thi_p_M_c.xlsx'
OUT = '/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/xl/vb_raw.json'

wb = openpyxl.load_workbook(SRC, data_only=True)

# mã kỹ năng -> (tên tiêu đề, lĩnh vực trong ngân hàng mục tiêu)
SK = {
    'YC':   ('Yêu cầu', 'nd'),
    'GT':   ('Gán tên', 'nd'),
    'NH':   ('Nghe hiểu', 'nh'),
    'GM':   ('Nhận thức thị giác và ghép mẫu', 'nt'),
    'CDL':  ('Chơi độc lập', 'xh'),
    'CXH':  ('Hành vi xã hội và chơi xã hội', 'xh'),
    'BC':   ('Bắt chước vận động', 'cy'),
    'FFC':  ('Nghe phản hồi theo chức năng, đặc tính và chủng loại (LRFFC)', 'nh'),
    'HT':   ('Hội thoại', 'nd'),
    'KNN':  ('Kỹ năng nhóm', 'cy'),
    'NP':   ('Ngữ pháp', 'nd'),
    'DOC':  ('Đọc', 'nt'),
    'VIET': ('Viết', 'nt'),
    'TOAN': ('Toán', 'nt'),
}
# tên trang -> mã kỹ năng (trang 14,15&16 tách theo tiêu đề ĐỌC / VIẾT / TOÁN)
SHEETS = [
    ('1. Yêu cầu', 'YC'), ('2. Gán tên', 'GT'), ('3. Nghe hiểu', 'NH'), ('4. Ghép mẫu', 'GM'),
    ('5. Chơi độc lập', 'CDL'), ('6. Chơi xã hội', 'CXH'), ('7 Bắt chước vận động', 'BC'),
    ('10. Phản hồi FFC', 'FFC'), ('11. Hội thoại', 'HT'), ('12. Nhóm', 'KNN'), ('13. Ngữ pháp', 'NP'),
]
SECT = {'ĐỌC': 'DOC', 'VIẾT': 'VIET', 'TOÁN': 'TOAN'}
# cột của bảng phương hướng -> mã kỹ năng (PA, LN chưa có trang mục tiêu trong file)
DCOL = {1: 'YC', 2: 'GT', 3: 'NH', 4: 'GM', 5: 'CDL', 6: 'CXH', 7: 'BC', 8: 'PA', 9: 'LN', 10: 'FFC',
        11: 'HT', 12: 'KNN', 13: 'NP', 14: 'DOC', 15: 'VIET', 16: 'TOAN'}

MARK = re.compile(r'\s+(TO(?:\s+\d+\s*ph[uú]t)?|T|O|E)\s*$')
LV = re.compile(r'^Cấp độ\s+(\d+)\s*\((\d+)\s*-\s*(\d+)\s*tháng\)$')
BINS = [(0, 12), (12, 24), (24, 36), (36, 48), (48, 72)]


def norm(t):
    return re.sub(r'\s+', ' ', str(t).replace(' ', ' ')).strip()


def bins_of(a, b):
    return [i for i, (lo, hi) in enumerate(BINS) if a < hi and b > lo]


items = []
levels = {}
marks = collections.Counter()
nomark = []


def walk(ws, fixed_sk):
    sk = fixed_sk
    lv = None
    ms = None
    for row in ws.iter_rows(min_row=1, max_row=ws.max_row):
        cells = [(c.column - 1, norm(c.value)) for c in row if c.value is not None and norm(c.value) != '']
        if not cells:
            continue
        c0 = cells[0][1] if cells[0][0] == 0 else ''
        c1 = next((t for i, t in cells if i == 1), '')
        if len(cells) == 1 and c0 in SECT and fixed_sk is None:
            sk = SECT[c0]
            continue
        m = LV.match(c0)
        if m:
            lv = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
            levels[lv[0]] = lv
            continue
        m = re.fullmatch(r'(\d+)\.0', c0)
        if m:
            ms = int(m.group(1))
            mk = MARK.search(c1)
            name, code = c1, ''
            if mk:
                name = c1[:mk.start()].rstrip()
                code = mk.group(1)
                code = 'TO:' + re.search(r'\d+', code).group(0) if code.startswith('TO') and re.search(r'\d+', code) else code
                marks[code] += 1
            else:
                nomark.append((ws.title, row[0].row, c1[:80]))
            items.append({'sk': sk, 'ms': ms, 'st': '', 'lv': lv[0], 'n': name, 'mk': code, 'row': row[0].row, 'sh': ws.title})
            continue
        m = re.fullmatch(r'(\d+)-([a-z])', c0)
        if m:
            assert int(m.group(1)) == ms, (ws.title, row[0].row, c0, ms)
            items.append({'sk': sk, 'ms': ms, 'st': m.group(2), 'lv': lv[0], 'n': c1, 'mk': '', 'row': row[0].row, 'sh': ws.title})
            continue
        if len(cells) == 1 and row[0].row == 1:
            continue  # tiêu đề trang
        print('BỎ QUA', ws.title, row[0].row, cells[:2], file=sys.stderr)


for name, sk in SHEETS:
    walk(wb[name], sk)
walk(wb['14,15&16. Đọc, Viết & toán'], None)

# --- bảng phương hướng ---
ws = wb.worksheets[0]
dirs = collections.defaultdict(dict)
for row in ws.iter_rows(min_row=3, max_row=ws.max_row):
    sc = row[0].value
    if sc is None:
        continue
    s = int(float(sc))
    for ci, code in DCOL.items():
        v = row[ci].value
        if v not in (None, ''):
            dirs[code][str(s)] = norm(v)

# --- kiểm tra ---
cnt = collections.Counter((i['sk'], 'ms' if not i['st'] else 'st') for i in items)
for sk in SK:
    print(sk, dict(ms=cnt[(sk, 'ms')], st=cnt[(sk, 'st')]))
print('tổng mục', len(items), 'mốc', sum(1 for i in items if not i['st']), 'bước', sum(1 for i in items if i['st']))
print('ký hiệu cuối mốc', dict(marks))
print('mốc không có ký hiệu', nomark)
print('cấp độ', levels)
# mỗi mốc trong bảng phương hướng phải có dòng tương ứng
for sk in SK:
    mss = sorted({i['ms'] for i in items if i['sk'] == sk})
    miss = [m for m in mss if str(m) not in dirs[sk]]
    print(sk, 'mốc', mss[0], '-', mss[-1], 'thiếu phương hướng:', miss, 'có dòng 0:', '0' in dirs[sk])
print('PA', sorted(map(int, dirs['PA'])), 'LN', sorted(map(int, dirs['LN'])))
# bản sao trùng mã
seen = collections.Counter(i['sk'] + str(i['ms']) + i['st'] for i in items)
print('trùng mã', [k for k, v in seen.items() if v > 1])

json.dump({'sk': SK, 'items': items, 'levels': {str(k): v for k, v in levels.items()}, 'dirs': dirs, 'bins': BINS},
          open(OUT, 'w'), ensure_ascii=False)
print('đã ghi', OUT)
