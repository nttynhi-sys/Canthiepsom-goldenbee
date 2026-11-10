/* ===== Mục tiêu, mức hỗ trợ và số liệu tiến bộ ===== */
/* Mức hỗ trợ theo mẫu ghi dữ liệu của Trung tâm: Ind, Thời gian trễ, GP, MP, PP, FP (w: hệ số độc lập, giả định của hệ thống) */
const SUPK=['I','TD','GP','MP','PP','FP'];
const SUP={
 I:{n:'Độc lập',a:'Ind',w:100,p:'Tự làm',h:'Bé tự thực hiện, không cần nhắc'},
 TD:{n:'Thời gian trễ',a:'TG trễ',w:85,p:'Chờ vài giây rồi tự làm',h:'Chờ vài giây để bé tự thực hiện'},
 GP:{n:'Gợi ý cử chỉ',a:'GP',w:65,p:'Cô gợi ý bằng cử chỉ',h:'Hỗ trợ cử chỉ: chỉ tay, ra hiệu'},
 MP:{n:'Làm mẫu',a:'MP',w:50,p:'Cô làm mẫu cho bé',h:'Giáo viên làm mẫu để bé làm theo'},
 PP:{n:'Hỗ trợ thể chất một phần',a:'PP',w:30,p:'Cô đỡ tay một phần',h:'Đỡ tay hoặc dẫn dắt một phần động tác'},
 FP:{n:'Hỗ trợ thể chất toàn phần',a:'FP',w:15,p:'Cô cầm tay làm cùng',h:'Cầm tay bé làm cùng toàn bộ động tác'}};
const BANDS=[{n:'Tự làm',s:['I','TD']},{n:'Cần gợi ý',s:['GP','MP']},{n:'Cần cầm tay hỗ trợ',s:['PP','FP']}];
const bandOf=s=>s==='I'||s==='TD'?0:s==='GP'||s==='MP'?1:2;
const PST={dang:['Đang luyện',''],dat:['Đã đạt','ok'],tam:['Tạm dừng','gy']};
const HZ={n:['Ngắn hạn','1–3 tháng',90],d:['Dài hạn','6–12 tháng',270]};
const HOMETIP={
 nh:'Nói một yêu cầu ngắn mỗi lần, ví dụ “đưa bóng cho mẹ”, rồi chờ vài giây cho bé phản hồi trước khi giúp.',
 nd:'Chờ bé tự yêu cầu bằng lời, cử chỉ hoặc chỉ tranh trước khi đưa đồ chơi hay đồ ăn; khen ngay khi bé thử.',
 cy:'Mỗi ngày chơi cùng bé 10 đến 15 phút với món bé thích; bé nhìn, chờ hoặc bắt chước thì khen ngay.',
 xh:'Chơi các trò luân phiên đơn giản như lăn bóng, xếp khối và nói “đến lượt con, đến lượt mẹ”.',
 nt:'Cho bé ghép đôi và phân loại đồ vật trong nhà (tất, muỗng, giày); bắt đầu với 2 loại rồi tăng dần.',
 vt:'Cho bé chơi đất nặn, nhặt hạt, xâu vòng, dùng kẹp mỗi ngày vài phút.',
 vth:'Cho bé leo trèo, đi trên đường thẳng, bật nhảy và đá bóng ở nơi thoáng, có người lớn bên cạnh.',
 tl:'Để bé tự làm từng bước nhỏ như cầm muỗng, kéo quần, rửa tay; người lớn chỉ đỡ khi bé cần.'};

/* --- tra cứu mục tiêu: thư viện + mục tiêu Trung tâm tự thêm --- */
const cgItems=()=>(DB.cg||[]).map(c=>({id:'cu:'+c.id,s:'cu',c:'TC'+c.id.replace(/\D/g,''),d:c.d,hi:-1,t:c.t||'Mục tiêu của Trung tâm',n:c.n,o:c.o||'',x:'',a:'',m:-1,sc:null,k:ascii((c.t||'')+c.n+(c.o||''))}));
function goalOf(id){return GL[id]||cgItems().find(g=>g.id===id)||null}
const gName=id=>{const g=goalOf(id);return g?g.n:'(mục tiêu đã xóa)'};
const gDom=id=>{const g=goalOf(id);return g?g.d:'nh'};
const gSrc=g=>LSRC[g.s].n+' · '+g.c;
const AGEB=[['0','Dưới 12 tháng'],['1','12–24 tháng'],['2','24–36 tháng'],['3','36–48 tháng'],['4','48–72 tháng']];
const ageBin=m=>m<12?0:m<24?1:m<36?2:m<48?3:4;
const libAll=()=>LIBI.concat(cgItems());
/* Lĩnh vực "Chơi": tách từ lĩnh vực xh (Chơi và tương tác xã hội) để lọc nhanh. Gồm Westby, Chuỗi chơi 0–4 tuổi và mọi mục có tiêu đề bắt đầu bằng "Chơi" hoặc "Vui chơi".
   Dữ liệu của bé vẫn ghi lĩnh vực xh như cũ; chỉ bộ lọc ngân hàng mục tiêu phân đôi: "Chơi" (choi) và "Xã hội" (xh, phần còn lại). */
const isPlay=i=>i.d==='xh'&&(i.s==='we'||i.s==='cp'||/^(Vui chơi|Chơi)/.test(i.t||''));
const domHit=(dom,i)=>!dom||(dom==='choi'?isPlay(i):dom==='xh'?(i.d==='xh'&&!isPlay(i)):i.d===dom);
const LCHIPS=LDOM.reduce((a,d)=>d.id==='xh'?a.concat([{id:'choi',s:'Chơi',d:'Chơi thực hành, chơi chức năng, chơi biểu tượng (thang Westby, chuỗi chơi 0–4 tuổi), chơi độc lập'},Object.assign({},d,{d:'Giao tiếp xã hội, kết bạn, chơi chung với bạn'})]):a.concat([d]),[]);
function libFind(f){const qs=(f.q||'').trim().split(/\s+/).map(ascii).filter(Boolean);
 return libAll().filter(i=>domHit(f.dom,i)&&(!f.src||i.s===f.src)&&(f.head===''||f.head==null||String(i.hi)===String(f.head))&&(f.age===''||f.age==null||[].concat(i.m).some(b=>String(b)===String(f.age)))&&qs.every(q=>i.k.includes(q)))}
function libHeads(f){const m=new Map();libAll().forEach(i=>{if(!domHit(f.dom,i))return;if(f.src&&i.s!==f.src)return;m.set(i.hi,(m.get(i.hi)||0)+1)});
 return[...m.entries()].sort((a,b)=>a[0]-b[0]).map(([h,n])=>[String(h),(h<0?'Mục tiêu Trung tâm tự thêm':LHEAD[h][1]+' · '+LSRC[LHEAD[h][0]].n)+' ('+n+')'])}
/* mục tiếp theo: với VB-MAPP đi theo thứ tự dạy (các bước nhỏ a, b, c... rồi đến mốc), còn lại theo thứ tự trong ngân hàng */
function nextOf(id){const g=GL[id];if(!g)return null;
 if(g.s==='vb'){const o=x=>x.ms*30+(x.st?x.st.charCodeAt(0)-96:29),a=LIBI.filter(x=>x.s==='vb'&&x.hi===g.hi).sort((p,q)=>o(p)-o(q));return a[a.indexOf(g)+1]||null}
 if(g.s==='we'||g.s==='cp'){const a=LIBI.filter(x=>x.s===g.s);return a[a.indexOf(g)+1]||null}   /* chuỗi phát triển chơi: đi tiếp sang giai đoạn sau */
 const n=LIBI[LIBI.indexOf(g)+1];return n&&n.hi===g.hi?n:null}

/* --- lượt thử: chuỗi 10 ký tự, V đúng, X sai, . chưa làm --- */
const TR0='..........';
const trOk=t=>((t||'').match(/V/g)||[]).length;
const trN=t=>((t||'').match(/[VX]/g)||[]).length;
const trPct=t=>{const n=trN(t);return n?Math.round(trOk(t)*100/n):null};
const recSc=i=>{const n=trN(i.tr);return n&&SUP[i.sup]?Math.round(trOk(i.tr)/n*SUP[i.sup].w):null};
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const wkStart=d=>addD(d,-((dow(d)+6)%7));
const kidPlans=(k,st)=>DB.plans.filter(p=>p.k===k&&(!st||p.s===st));
const sessOf=(k,from,to,all)=>DB.sess.filter(s=>s.k===k&&(all||s.st==='xong')&&(!from||s.date>=from)&&(!to||s.date<=to)).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
function lastRec(k,g){const ss=sessOf(k,'','9999-12-31');for(let i=ss.length-1;i>=0;i--){const it=ss[i].it.find(x=>x.g===g&&trN(x.tr));if(it)return Object.assign({d:ss[i].date},it)}return null}
/* điều kiện đạt: độc lập, từ 80% trở lên (ít nhất 5 lượt) trong 3 buổi liên tiếp */
function masteryOf(k,g){let run=0,cnt=0;const ss=sessOf(k,'','9999-12-31'),rs=[];ss.forEach(s=>s.it.forEach(i=>{if(i.g===g&&trN(i.tr))rs.push(i)}));cnt=rs.length;
 for(let i=rs.length-1;i>=0;i--){const r=rs[i];if(r.sup==='I'&&trN(r.tr)>=5&&trOk(r.tr)/trN(r.tr)>=.8)run++;else break}
 return{run,cnt,ready:run>=3,last:rs[rs.length-1]||null,rs}}

/* --- số liệu tiến bộ trong một khoảng ngày --- */
function progData(kid,from,to){
 const ss=sessOf(kid,from,to),rs=[];
 ss.forEach(s=>s.it.forEach(i=>{const sc=recSc(i);if(sc!=null)rs.push({d:s.date,g:i.g,dm:gDom(i.g),sup:i.sup,ok:trOk(i.tr),n:trN(i.tr),sc})}));
 const byG={};rs.forEach(r=>(byG[r.g]=byG[r.g]||[]).push(r));
 const goals=Object.keys(byG).map(g=>{const a=byG[g],z=a[a.length-1],x={g,dm:a[0].dm,cnt:a.length,f:avg(a.slice(0,2).map(r=>r.sc)),l:avg(a.slice(-2).map(r=>r.sc)),fs:a[0].sup,ls:z.sup,fk:a[0].ok+'/'+a[0].n,lk:z.ok+'/'+z.n,fd:a[0].d,ld:z.d,a};x.dl=a.length>=2?x.l-x.f:null;return x});
 const doms=LDOM.map(d=>{const gs=goals.filter(x=>x.dm===d.id),pr=gs.filter(x=>x.dl!=null);
  return{id:d.id,n:gs.length,np:pr.length,f:pr.length?avg(pr.map(x=>x.f)):null,l:pr.length?avg(pr.map(x=>x.l)):gs.length?avg(gs.map(x=>x.l)):null}});
 const paired=goals.filter(x=>x.dl!=null);
 const wk={};rs.forEach(r=>{const w=wkStart(r.d);(wk[w]=wk[w]||[]).push(r.sc)});
 const weeks=Object.keys(wk).sort().map(w=>({w,sc:Math.round(avg(wk[w])),n:wk[w].length}));
 const span=(pd(to)-pd(from))/864e5,unit=span>45?'m':'w',key=d=>unit==='m'?d.slice(0,7):wkStart(d),st={};
 rs.forEach(r=>{const k=key(r.d),o=st[k]=st[k]||{k,c:{I:0,TD:0,GP:0,MP:0,PP:0,FP:0},t:0};o.c[r.sup]++;o.t++});
 const stack=Object.values(st).sort((a,b)=>a.k<b.k?-1:1);
 const dat=DB.plans.filter(p=>p.k===kid&&p.s==='dat'&&p.dt&&p.dt>=from&&p.dt<=to);
 return{from,to,ss:ss.length,recs:rs.length,goals,doms,weeks,stack,unit,dat,
  now:goals.length?avg(goals.map(x=>x.l)):null,start:paired.length?avg(paired.map(x=>x.f)):null,
  dAll:paired.length?avg(paired.map(x=>x.dl)):null,np:paired.length,
  top:goals.filter(x=>x.dl!=null&&x.dl>0).sort((a,b)=>b.dl-a.dl).slice(0,4),
  slow:goals.filter(x=>x.cnt>=4&&x.dl!=null&&x.dl<=3&&x.l<60).sort((a,b)=>a.l-b.l).slice(0,3)}}
const PRD=[['30','30 ngày gần đây'],['90','3 tháng gần đây'],['365','Từ đầu đến nay']];
const prRange=n=>({from:addD(TODAY,-(+n)+1),to:TODAY});
const trendWord=d=>d==null?'':d>=8?'tiến bộ rõ':d>=2?'tiến bộ nhẹ':d>-2?'giữ ổn định':'cần theo dõi thêm';
function homeTips(kid,P,n){n=n||3;const seen=[];
 DB.sess.filter(s=>s.k===kid&&s.home&&s.date>=P.from&&s.date<=P.to).sort((a,b)=>a.date<b.date?1:-1).forEach(s=>{if(!seen.includes(s.home))seen.push(s.home)});
 P.doms.filter(d=>d.l!=null).sort((a,b)=>a.l-b.l).forEach(d=>{if(seen.length<n&&!seen.includes(HOMETIP[d.id]))seen.push(HOMETIP[d.id])});
 return seen.slice(0,n)}

/* --- nội dung báo cáo chuyên môn điền sẵn từ số liệu buổi can thiệp --- */
function autoSec(k,per){per=per||sm(CM,-1);const from=per+'-01',to=mDates(per).slice(-1)[0],P=progData(k.id,from,to),nm=given(k.n);
 if(!P.ss)return{tq:'Trong '+mLow(per)+' chưa có số liệu buổi can thiệp cá nhân của bé.',mt:'Chưa có mục tiêu được ghi nhận trong kỳ.',kq:'',kk:'',gd:homeTips(k.id,P).map(t=>'• '+t).join('\n'),kh:''};
 const dn=[...new Set(P.goals.map(g=>DM[g.dm].n.toLowerCase()))];
 const tq=nm+' có '+P.ss+' buổi can thiệp cá nhân trong '+mLow(per)+', luyện '+P.goals.length+' mục tiêu thuộc '+dn.slice(0,4).join(', ')+(dn.length>4?' và '+(dn.length-4)+' lĩnh vực khác':'')+'. Chỉ số tự làm hiện tại '+Math.round(P.now)+'/100'+(P.dAll!=null?', '+(P.dAll>=0?'tăng ':'giảm ')+Math.abs(Math.round(P.dAll))+' điểm so với đầu tháng ('+trendWord(P.dAll)+').':'.');
 const mt=P.goals.slice().sort((a,b)=>a.dm<b.dm?-1:a.dm>b.dm?1:b.cnt-a.cnt).slice(0,8).map(x=>'• '+gName(x.g)+' ('+DM[x.dm].s+'): '+(x.cnt>1?SUP[x.fs].p+' ('+x.fk+') → ':'')+SUP[x.ls].p+' ('+x.lk+')').join('\n');
 const dt=P.dat.map(p=>gName(p.g));
 const kq=(dt.length?'Mục tiêu mới đạt: '+dt.join('; ')+'.':'Chưa có mục tiêu mới đạt trong tháng; bé đang củng cố các mục tiêu hiện tại.')+(P.top.length?'\nTiến bộ rõ nhất: '+P.top.slice(0,3).map(x=>gName(x.g)+' (+'+Math.round(x.dl)+' điểm)').join('; ')+'.':'');
 const kk=P.slow.length?'Cần thêm thời gian ở: '+P.slow.map(x=>gName(x.g)+' (hiện '+SUP[x.ls].p.toLowerCase()+')').join('; ')+'.':'Chưa ghi nhận khó khăn nổi bật; tiếp tục theo dõi khi chuyển hoạt động và khi gặp yêu cầu mới.';
 const nx=P.dat.map(p=>nextOf(p.g)).filter(Boolean).slice(0,2).map(g=>g.n),cur=kidPlans(k.id,'dang').slice(0,3).map(p=>gName(p.g));
 const kh=(cur.length?'Tiếp tục: '+cur.join('; ')+'.':'')+(nx.length?'\nDự kiến thêm: '+nx.join('; ')+'.':'');
 return{tq,mt,kq,kk,gd:homeTips(k.id,P).map(t=>'• '+t).join('\n'),kh:kh||'Tiếp tục các mục tiêu hiện tại và nâng dần mức độc lập.'}}
