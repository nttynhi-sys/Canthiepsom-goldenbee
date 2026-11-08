import re,json,collections
from openpyxl import load_workbook
SRC="/mnt/user-data/uploads/1794138558208_Dữ_liệu_Golden_Bee.xlsx"
wb=load_workbook(SRC,read_only=True,data_only=True)
def grid(name):
    ws=wb[name]
    return [[("" if c is None else str(c).strip().replace('\r','').replace('\n',' ')) for c in r] for r in ws.iter_rows(values_only=True)]
sp=lambda s:re.sub(r'\s+',' ',s).strip()
def cap(s):
    s=sp(s);return s[:1].upper()+s[1:] if s else s

# ---------- ABLLS-R ----------
AB_DOM={'A':'Hợp tác và khen thưởng','B':'Khả năng quan sát','C':'Ngôn ngữ tiếp nhận','D':'Bắt chước','E':'Nhại lời / Nói theo','F':'Yêu cầu','G':'Gọi tên','H':'Hội thoại liên tưởng','I':'Ngôn ngữ tự phát','J':'Cú pháp và ngữ pháp','K':'Vui chơi và giải trí','L':'Tương tác xã hội','M':'Học nhóm','N':'Tuân theo nề nếp','P':'Khái quát tổng hợp','Q':'Đọc','R':'Toán','S':'Viết','T':'Ghép vần','U':'Mặc quần áo','V':'Ăn','W':'Tự chăm sóc','X':'Đi vệ sinh','Y':'Vận động thô','Z':'Vận động tinh'}
rows=grid('sheet4')
ab=[];cur=None
for r in rows[2:]:
    r=r+['']*9
    code,name,obj,q,ex,sc,crit,note,age=r[:9]
    if code:
        cur={'c':code,'n':sp(name),'o':sp(obj),'ex':sp(ex),'sc':[]}
        ab.append(cur)
    if cur is not None and (sc or crit):
        cur['sc'].append([sc,sp(crit)])
for x in ab:
    x['sc'].sort(key=lambda t:-int(t[0]) if t[0].isdigit() else 0)
print('ablls',len(ab))
# ---------- ESDM ----------
ES_DOM={'GTN':'Giao tiếp tiếp nhận','GTD':'Giao tiếp diễn đạt','CYC':'Chú ý chung','XH':'Kỹ năng xã hội','BC':'Bắt chước','NT':'Nhận thức','C':'Chơi','VDT':'Vận động tinh','VDTH':'Vận động thô','HV':'Hành vi','TL':'Tự lập'}
ES_LV={1:'Cấp độ 1 (12–18 tháng)',2:'Cấp độ 2 (18–24 tháng)',3:'Cấp độ 3 (24–36 tháng)',4:'Cấp độ 4 (36–48 tháng)'}
raw=json.load(open('esdm_raw.json'))
cnt=collections.Counter()
es=[]
grpseq=collections.defaultdict(int)
for x in raw:
    key=(x['pre'],x['level']);grpseq[key]+=1
for x in raw: cnt[(x['pre'],x['level'])]+=1
seen=collections.Counter()
for x in raw:
    key=(x['pre'],x['level']);seen[key]+=1
    n=x['n']
    if key in (('C',1),('NT',1)): n=seen[key]
    h=sp(x['head']);sub=''
    if ':' in h: sub=h.split(':',1)[1].strip()
    sub=re.sub(r'^(các |các kỹ năng xã hội )','',sub,flags=re.I) if sub else ''
    sub=sub.replace('Việc khác','việc khác')
    desc=sp(x['desc'])
    if x.get('sub'): desc=(desc+' '+' · '.join(sp(s) for s in x['sub'])).strip()
    es.append({'c':f"{x['pre']}.{x['level']}.{n}",'p':x['pre'],'l':x['level'],'g':cap(sub) if sub else '','n':sp(x['name']),'o':desc})
print('esdm',len(es))
# ---------- Mầm non ----------
mn_raw=json.load(open('mn_raw.json'))
MN_DOM={'TH':'Vận động thô','T':'Vận động tinh','CY':'Chú ý','NT':'Nhận thức','NNH':'Ngôn ngữ hiểu','NND':'Ngôn ngữ diễn đạt','XH':'Xã hội – hành vi'}
HEADWORDS={'Chơi','Hành vi văn hoá- ứng xử','Giao tiếp xã hội'}
def band_norm(b):
    b=sp(b).replace('tuổi đến','đến').replace('18 tháng đến 24 tháng','18 đến 24 tháng')
    b=re.sub(r'(\d+) đến (\d+) tháng$',r'\1–\2 tháng',b)
    b=re.sub(r'(\d+) đến (\d+) tuổi$',r'\1–\2 tuổi',b)
    b=re.sub(r'(\d+) đến (\d+)$',r'\1–\2',b)
    return b
mn=[];seen=collections.Counter();xhg=''
for x in mn_raw:
    pre=x['pre'];name=sp(x['name'])
    if pre=='XH' and name in HEADWORDS:
        xhg=name;continue
    grp=sp(x['grp'])
    if pre=='XH': grp=xhg
    elif x['dom']=='NND' and grp=='Làm quen đọc, viết' and x['pre']=='XH': grp=''
    seen[x['code']]+=1
    code=x['code']+('b' if seen[x['code']]>1 else '')
    mn.append({'c':code,'p':pre,'b':band_norm(x['band']),'g':grp,'n':name})
print('mầm non',len(mn),collections.Counter(x['p'] for x in mn))
# ---------- OT ----------
ws=grid('MT OT')
ot=[];grp=None;OT_G={}
for r in ws:
    r=r+['']*5
    a,b,c,d=r[:4]
    if a and re.fullmatch(r'[A-Z]{2,4}',a): grp=a;OT_G[grp]=sp(b);continue
    if a and re.fullmatch(r'[A-Z]{2,4}\d+',a): ot.append({'c':a,'p':grp,'n':sp(b),'o':sp(c),'h':sp(d)})
print('ot',len(ot),len(OT_G))
json.dump({'ab':ab,'es':es,'mn':mn,'ot':ot,'ot_g':OT_G},open('lib_raw.json','w'),ensure_ascii=False)
for k,v in {'ab':ab,'es':es,'mn':mn,'ot':ot}.items(): print(k,len(json.dumps(v,ensure_ascii=False).encode()),'bytes')
