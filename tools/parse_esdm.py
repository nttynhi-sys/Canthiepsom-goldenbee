import re,json,collections
from openpyxl import load_workbook
wb=load_workbook("/mnt/user-data/uploads/1794138558208_Dữ_liệu_Golden_Bee.xlsx",read_only=True,data_only=True)
ws=wb['Denver']
rows=[[("" if c is None else str(c).strip().replace('\n',' ')) for c in r] for r in ws.iter_rows(values_only=True)]
LV_RE=re.compile(r'^CẤP ĐỘ\s*(\d)\s*\(LEVEL\s*\d\)\s*:\s*(.*)$',re.I)
CODE_RE=re.compile(r'^([A-ZĐ]{1,4})\.?\s*(\d)\.?(\d{1,2})$')
items=[];level=None;lvlab='';head='';stop=False
for i,r in enumerate(rows,1):
    r=r+['']*6
    a,b,c=r[0],r[1],r[2]
    if a.startswith('Phụ lục'): break
    m=LV_RE.match(a)
    if m:
        level=int(m.group(1));lvlab=m.group(2).strip();head='';continue
    if level is None: continue
    if a in('Mã',): continue
    cm=CODE_RE.match(a.replace(' ',''))
    if cm:
        pre,lv,n=cm.group(1),int(cm.group(2)),int(cm.group(3))
        items.append({'row':i,'raw':a,'pre':pre,'lv':lv,'n':n,'level':level,'lvlab':lvlab,'head':head,'name':b,'desc':c})
    elif a and not b and not c:
        head=a
    elif a and not CODE_RE.match(a.replace(' ','')):
        print('?? row',i,repr(a[:60]),repr(b[:40]))
    elif not a and b:
        # continuation sub-step of previous item (e.g. example)
        if items: items[-1].setdefault('sub',[]).append(b)
print(len(items))
cnt=collections.Counter((x['pre'],x['level']) for x in items)
for k,v in sorted(cnt.items(),key=lambda t:(t[0][1],t[0][0])): print(k,v,end=' | ')
print()
# level mismatch
mm=[x for x in items if x['lv']!=x['level']]
print('level mismatches',len(mm),[ (x['raw'],x['level'],x['row']) for x in mm][:20])
codes=collections.Counter((x['pre'],x['lv'],x['n']) for x in items)
dups=[k for k,v in codes.items() if v>1]
print('dups',len(dups),dups[:20])
print(collections.Counter(x['head'] for x in items).most_common(60))
json.dump(items,open('esdm_raw.json','w'),ensure_ascii=False)
