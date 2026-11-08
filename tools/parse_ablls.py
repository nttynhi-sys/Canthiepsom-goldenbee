import re,json,collections
from openpyxl import load_workbook
wb=load_workbook("/mnt/user-data/uploads/1794138558208_Dữ_liệu_Golden_Bee.xlsx",read_only=True,data_only=True)
ws=wb['sheet4']
rows=[[("" if c is None else str(c).strip()) for c in r] for r in ws.iter_rows(values_only=True)]
hdr=rows[1]
print(hdr)
items=[];cur=None
for r in rows[2:]:
    r=r+['']*(9-len(r))
    code,name,obj,q,ex,sc,crit,note,age=r[:9]
    if code:
        cur={'c':code,'n':name,'o':obj,'q':q,'ex':ex,'note':note,'age':age,'sc':[]}
        items.append(cur)
    if cur is not None and (sc or crit):
        cur['sc'].append((sc,crit))
print(len(items))
cnt=collections.Counter(re.match(r'[A-Z]+',i['c']).group(0) if re.match(r'[A-Z]+',i['c']) else '?' for i in items)
print(sorted(cnt.items()))
bad=[i['c'] for i in items if not re.match(r'^[A-Z]\d+$',i['c'])]
print('odd codes',bad[:30],len(bad))
ages=collections.Counter(i['age'] for i in items);print('ages',sorted(ages.items())[:30])
print('scale lens',collections.Counter(len(i['sc']) for i in items))
# dup codes
d=[c for c,n in collections.Counter(i['c'] for i in items).items() if n>1];print('dups',d[:20])
for i in items[:2]+items[100:102]+items[-3:]:
    print(json.dumps(i,ensure_ascii=False)[:600])
json.dump(items,open('ablls_sheet4.json','w'),ensure_ascii=False)
