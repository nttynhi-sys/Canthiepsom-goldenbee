import json,re,collections,sys
d=json.load(open('lib_raw.json'))
vb=json.load(open('vb_raw.json'))

# ---- 8 lĩnh vực chính ----
LDOM=[
 ['nh','Ngôn ngữ hiểu','Hiểu','Bé hiểu lời nói và làm theo chỉ dẫn'],
 ['nd','Ngôn ngữ diễn đạt','Diễn đạt','Bé dùng lời, cử chỉ hoặc tranh để nói điều mình muốn'],
 ['cy','Chú ý, bắt chước và nề nếp','Chú ý','Bé tập trung, hợp tác, bắt chước và theo nề nếp lớp học'],
 ['xh','Chơi và tương tác xã hội','Xã hội','Bé chơi, giao tiếp và kết bạn với người khác'],
 ['nt','Nhận thức và học tập','Nhận thức','Bé nhận biết, so sánh, đếm, đọc và viết'],
 ['vt','Vận động tinh','Vận động tinh','Đôi tay khéo léo: cầm, nắm, cài, tô, vẽ'],
 ['vth','Vận động thô và thăng bằng','Vận động thô','Bé đi, chạy, nhảy, leo trèo và giữ thăng bằng'],
 ['tl','Tự lập, giác quan và hành vi','Tự lập','Bé tự ăn, mặc, vệ sinh; điều hòa cảm giác và hành vi'],
]
DI={x[0]:i for i,x in enumerate(LDOM)}

AB_DOM={'A':'Hợp tác và khen thưởng','B':'Khả năng quan sát','C':'Ngôn ngữ tiếp nhận','D':'Bắt chước','E':'Nhại lời / Nói theo','F':'Yêu cầu','G':'Gọi tên','H':'Hội thoại liên tưởng','I':'Ngôn ngữ tự phát','J':'Cú pháp và ngữ pháp','K':'Vui chơi và giải trí','L':'Tương tác xã hội','M':'Học nhóm','N':'Tuân theo nề nếp','P':'Khái quát tổng hợp','Q':'Đọc','R':'Toán','S':'Viết','T':'Ghép vần','U':'Mặc quần áo','V':'Ăn','W':'Tự chăm sóc','X':'Đi vệ sinh','Y':'Vận động thô','Z':'Vận động tinh'}
AB_MAP={'A':'cy','B':'nt','C':'nh','D':'cy','E':'nd','F':'nd','G':'nd','H':'nd','I':'nd','J':'nd','K':'xh','L':'xh','M':'cy','N':'cy','P':'cy','Q':'nt','R':'nt','S':'nt','T':'nt','U':'tl','V':'tl','W':'tl','X':'tl','Y':'vth','Z':'vt'}
ES_DOM={'GTN':'Giao tiếp tiếp nhận','GTD':'Giao tiếp diễn đạt','CYC':'Chú ý chung','XH':'Kỹ năng xã hội','BC':'Bắt chước','NT':'Nhận thức','C':'Chơi','VDT':'Vận động tinh','VDTH':'Vận động thô','HV':'Hành vi','TL':'Tự lập'}
ES_MAP={'GTN':'nh','GTD':'nd','CYC':'cy','XH':'xh','BC':'cy','NT':'nt','C':'xh','VDT':'vt','VDTH':'vth','HV':'tl','TL':'tl'}
ES_LV={1:('Cấp độ 1 · 12–18 tháng',1),2:('Cấp độ 2 · 18–24 tháng',1),3:('Cấp độ 3 · 24–36 tháng',2),4:('Cấp độ 4 · 36–48 tháng',3)}
MN_DOM={'TH':'Vận động thô','T':'Vận động tinh','CY':'Chú ý','NT':'Nhận thức','NNH':'Ngôn ngữ hiểu','NND':'Ngôn ngữ diễn đạt','XH':'Xã hội và hành vi'}
MN_MAP={'TH':'vth','T':'vt','CY':'cy','NT':'nt','NNH':'nh','NND':'nd','XH':'xh'}
MN_BIN={'3–6 tháng':0,'6–12 tháng':0,'12–18 tháng':1,'18–24 tháng':1,'12–24 tháng':1,'1–2 tuổi':1,'24–36 tháng':2,'2–3 tuổi':2,'3–4 tuổi':3,'4–5 tuổi':4,'5–6 tuổi':4}
OT_MAP={'TLC':'vth','ODV':'vth','TB':'vth','QDG':'vt','VT':'vt','BTNT':'vt','TNT':'vt','HT':'vt','TT':'vt','TM':'vt','NCNT':'vt','TG':'tl','THG':'tl','XG':'tl','TD':'tl','TTBT':'tl','MM':'nd'}
OT_G=d['ot_g']

heads=[];hidx={}
def H(src,text):
    k=(src,text)
    if k not in hidx:
        hidx[k]=len(heads);heads.append([src,text])
    return hidx[k]
ages=[];aidx={}
def A(label,b):
    if not label: return -1
    k=(label,tuple(b) if isinstance(b,list) else b)
    if k not in aidx:
        aidx[k]=len(ages);ages.append([label,b])
    return aidx[k]

raw={'ab':[],'ed':[],'vb':[],'mn':[],'ot':[]}
for x in d['ab']:
    L=re.match(r'[A-Z]+',x['c']).group(0)
    sc=[[s,t] for s,t in x['sc'] if t or s]
    raw['ab'].append([x['c'],DI[AB_MAP[L]],H('ab',AB_DOM[L]),x['n'],x['o'],x['ex'],-1,sc])
for x in d['es']:
    sub=x['g']
    t=ES_DOM[x['p']]+(' – '+sub if sub else '')
    lab,b=ES_LV[x['l']]
    raw['ed'].append([x['c'],DI[ES_MAP[x['p']]],H('ed',t),x['n'],x['o'],'',A(lab,b),None])
VB_LV={int(k):v for k,v in vb['levels'].items()}
for x in vb['items']:
    dom=vb['sk'][x['sk']]
    lv=VB_LV[x['lv']]
    bins=[i for i,(lo,hi) in enumerate(vb['bins']) if lv[1]<hi and lv[2]>lo]
    lab='Cấp độ %d · %d–%d tháng'%(lv[0],lv[1],lv[2])
    raw['vb'].append([x['sk']+str(x['ms'])+x['st'],DI[dom[1]],H('vb',dom[0]),x['n'],'',x['mk'],A(lab,bins),None])
for x in d['mn']:
    t=x['g'] or MN_DOM[x['p']]
    b=x['b']
    raw['mn'].append([x['c'],DI[MN_MAP[x['p']]],H('mn',t),x['n'],'','',A(b,MN_BIN.get(b,-1)) if b else -1,None])
_seen=set();_cnt=collections.Counter()
for x in d['ot']:
    c=x['c']
    if c in _seen:
        # mã trùng trong sheet gốc (QDG1, QDG2 lặp lại): đánh số nối tiếp trong nhóm
        n=_cnt[x['p']]+1
        while x['p']+str(n) in _seen: n+=1
        c=x['p']+str(n)
    _seen.add(c);_cnt[x['p']]+=1
    raw['ot'].append([c,DI[OT_MAP[x['p']]],H('ot',OT_G[x['p']]),x['n'],x['o'],x['h'],-1,None])

# trim trailing None/empty for compactness
def trim(r):
    r=list(r)
    while r and (r[-1] in (None,'',[],-1)): r.pop()
    return r
for k in raw: raw[k]=[trim(r) for r in raw[k]]

J=lambda o:json.dumps(o,ensure_ascii=False,separators=(',',':'))
out=[]
out.append('/* ===== Thư viện mục tiêu: 8 lĩnh vực, tiêu đề và mục tiêu cụ thể (chuẩn hóa từ dữ liệu của Trung tâm) ===== */')
out.append('const LDOM='+J([{'id':a,'n':b,'s':c,'d':e} for a,b,c,e in LDOM])+';')
out.append("const LSRC={ab:{n:'ABLLS-R',d:'Đánh giá kỹ năng ngôn ngữ và học tập cơ bản'},ed:{n:'ESDM / Denver',d:'Chương trình Denver theo 4 cấp độ phát triển'},vb:{n:'VB-MAPP',d:'Mốc ngôn ngữ và hành vi theo 3 cấp độ, kèm phương hướng can thiệp từng mốc'},mn:{n:'Mầm non',d:'Mốc phát triển trẻ mầm non'},ot:{n:'Hoạt động OT',d:'Gợi ý hoạt động vận động và giác quan'},cu:{n:'Trung tâm tự thêm',d:'Mục tiêu do Trung tâm bổ sung'}};")
VB_DIRN=[['YC','Yêu cầu'],['GT','Gán tên'],['NH','Nghe hiểu'],['GM','Nhận thức thị giác và ghép mẫu'],['CDL','Chơi độc lập'],['CXH','Hành vi xã hội và chơi xã hội'],['BC','Bắt chước vận động'],['PA','Phát âm'],['LN','Lời nói tự phát'],['FFC','Nghe phản hồi theo chức năng, đặc tính và chủng loại (LRFFC)'],['HT','Hội thoại'],['KNN','Kỹ năng nhóm'],['NP','Cấu trúc ngữ pháp'],['DOC','Đọc'],['VIET','Viết'],['TOAN','Toán']]
out.append('/* VB-MAPP: bảng phương hướng can thiệp theo mốc (điểm 0 đến 15) của từng kỹ năng */')
out.append('const LVBS='+J(VB_DIRN)+';')
out.append('const LVBD='+J({k:vb['dirs'][k] for k,_ in VB_DIRN})+';')
out.append('const LHEAD='+J(heads)+';')
out.append('const LAGE='+J(ages)+';')
out.append('const LRAW='+J(raw)+';')
out.append("""const LIBI=[],GL={},DM={};
LDOM.forEach(d=>DM[d.id]=d);
Object.keys(LRAW).forEach(s=>LRAW[s].forEach(r=>{const a=LAGE[r[6]==null?-1:r[6]]||['',-1],h=LHEAD[r[2]];
 const it={id:s+':'+r[0],s,c:r[0],d:LDOM[r[1]].id,hi:r[2],t:h[1],n:r[3],o:r[4]||'',x:r[5]||'',a:a[0],m:a[1],sc:r[7]||null};
 it.k=ascii(it.c+it.n+it.t+it.o);LIBI.push(it);GL[it.id]=it}));
const VBC={},VBHK={};
LIBI.forEach(it=>{if(it.s!=='vb')return;const m=/^([A-Z]+)(\\d+)([a-z]?)$/.exec(it.c);it.sk=m[1];it.ms=+m[2];it.st=m[3];VBHK[it.hi]=it.sk;if(it.st){const p='vb:'+it.sk+it.ms;VBC[p]=(VBC[p]||0)+1}});
""")
js='\n'.join(out)+'\n'
open('/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/build/p03b-lib.js','w').write(js)
print('bytes',len(js.encode()))
# stats
cnt=collections.Counter()
for s,rows in raw.items():
    for r in rows: cnt[(LDOM[r[1]][0],s)]+=1
for dd in LDOM:
    print(dd[0],{s:cnt[(dd[0],s)] for s in raw})
print('heads',len(heads),'ages',len(ages))
perdom=collections.Counter()
for h,(s,t) in enumerate(heads): pass
