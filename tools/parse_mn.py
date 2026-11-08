import re,json,collections
from openpyxl import load_workbook
wb=load_workbook("/mnt/user-data/uploads/1794138558208_Dữ_liệu_Golden_Bee.xlsx",read_only=True,data_only=True)
ws=wb['Mầm Non ĐG']
rows=[[("" if c is None else str(c).strip().replace('\n',' ')) for c in r] for r in ws.iter_rows(values_only=True)]
CODE=re.compile(r'^([A-Z]{1,3})(\d+)$')
DOMH={'Bảng liệt kê vận động thô':'TH','Bảng liệt kê vận động tinh':'T','Chú ý':'CY','Nhận thức':'NT','Ngôn ngữ hiểu':'NNH','Ngôn Ngữ diễn đạt':'NND'}
items=[];dom=None;band='';grp='';seq=[]
for i,r in enumerate(rows,1):
    r=r+['']*4
    a,b,c=r[0].strip(),r[1].strip(),r[2].strip()
    if i<6: continue
    key=a.strip()
    if key in DOMH: dom=DOMH[key];band='';grp='';continue
    if dom is None: continue
    if c and re.search(r'(tháng|tuổi)',c): band=re.sub(r'\s+',' ',c.replace(' tháng tuổi',' tháng').replace('tuổi','tuổi')).strip()
    m=CODE.match(a)
    if m:
        items.append({'row':i,'code':a,'pre':m.group(1),'dom':dom,'band':band,'grp':grp,'name':b})
    elif b and not a:
        grp=b
print(len(items))
cnt=collections.Counter((x['dom'],x['pre']) for x in items);print(cnt)
bands=collections.OrderedDict()
for x in items: bands.setdefault((x['dom'],x['band']),0);bands[(x['dom'],x['band'])]+=1
for k,v in bands.items(): print(k,v)
print(collections.Counter((x['dom'],x['grp']) for x in items).most_common(70))
dup=[c for c,n in collections.Counter(x['code'] for x in items).items() if n>1];print('dups',dup)
json.dump(items,open('mn_raw.json','w'),ensure_ascii=False)
