/* ===== Dữ liệu mẫu giả lập: kế hoạch mục tiêu và buổi can thiệp (không phải trẻ thật) ===== */
function seedProg(D){
 let sd=70111983;const R=()=>(sd=(sd*1664525+1013904223)%4294967296)/4294967296,RI=(a,b)=>a+Math.floor(R()*(b-a+1)),P=a=>a[Math.floor(R()*a.length)],cl=(x,a,b)=>Math.max(a,Math.min(b,x));
 D.cg=[
  {id:'c1',d:'xh',t:'Nề nếp lớp học',n:'Chào cô và các bạn khi vào lớp',o:'Bé vẫy tay hoặc nói “chào” khi vào lớp và khi ra về.'},
  {id:'c2',d:'cy',t:'Nề nếp lớp học',n:'Ngồi đúng chỗ trong 5 phút',o:'Bé ngồi ghế, hướng về giáo viên và hoàn thành hoạt động bàn.'},
  {id:'c3',d:'nd',t:'Phát âm',n:'Phát âm đúng âm đầu /b/, /m/, /p/ trong từ đơn',o:'Bé nói đúng âm đầu khi nhìn tranh và gọi tên.'},
  {id:'c4',d:'tl',t:'Tự lập',n:'Tự cất balô và giày dép khi đến lớp',o:'Bé tự cất đồ vào đúng chỗ, không cần nhắc.'}];
 D.plans=[];D.sess=[];
 const NEED={'Chậm nói':['nd','nh','nd','cy','xh','nd'],'Khó khăn giao tiếp xã hội':['xh','cy','nd','nh','xh','cy'],'Rối loạn phát âm':['nd','nd','nh','vt','cy','nd'],'Chậm phát triển ngôn ngữ':['nh','nd','nh','nd','cy','xh'],'Cần hỗ trợ đa lĩnh vực':['nh','nd','cy','xh','vt','tl','nt','vth']};
 const lvOf=i=>+((i.a||'').match(/\d/)||[0])[0];
 const NOTES=['Bé hợp tác tốt, giữ chú ý lâu hơn mọi khi.','Cần nhắc nhở nhiều hơn khi chuyển hoạt động.','Có tiến bộ rõ ở mục tiêu mới, bé chủ động hơn.','Bé mệt, chỉ thực hiện được một phần mục tiêu.','Bé hào hứng với trò chơi luân phiên, nhìn cô khi được gọi tên.','Bé dễ xao nhãng khi có tiếng ồn, cần nhắc nhẹ.','Bé tự thử trước khi chờ cô giúp, rất đáng khen.'];
 let pn=0,sn=0;
 const grGV=k=>{const g=D.groups.find(x=>x.id===k.gr);return g?g.gv:null};
 const kids=D.kids.filter(k=>k.st==='dang');
 const W0=lastWork(addD(WD,-76)),attFrom=sm(CM,-1)+'-01';
 const sk={},plansOf={};
 /* chọn mục tiêu theo tuổi phát triển và nhu cầu */
 function pickGoal(dom,m,taken,hard){
  const da=m-RI(6,16)+(hard?10:0),src=P(['ab','ab','ab','ed','ed','mn','ot']);
  const byS=s=>{
   if(s==='ab'){const a=LIBI.filter(i=>i.s==='ab'&&i.d===dom);if(!a.length)return[];const fr=cl((m-20)/115+R()*.14-.04+(hard?.14:0),.03,.72),c=Math.floor(fr*a.length);return a.slice(Math.max(0,c-3),c+4)}
   if(s==='ed'){const lv=da<18?1:da<24?2:da<36?3:4;return LIBI.filter(i=>i.s==='ed'&&i.d===dom&&lvOf(i)===lv)}
   if(s==='mn')return LIBI.filter(i=>i.s==='mn'&&i.d===dom&&i.m===ageBin(Math.max(0,da)));
   return LIBI.filter(i=>i.s==='ot'&&i.d===dom)};
  for(const s of [src,'ab','ed','mn','ot']){const c=byS(s).filter(i=>!taken.includes(i.id));if(c.length)return P(c)}
  return null}
 function addPlan(k,g,h,from){
  const hz=h==='d'?270:90,p={id:'p'+(++pn),k:k.id,g,h,s:'dang',from,due:addD(from,hz),by:k.gv||grGV(k)||'nv04'};
  D.plans.push(p);(plansOf[k.id]=plansOf[k.id]||[]).push(p);
  sk[p.id]={z:.03+R()*.34,r:.02+R()*.045,last:'',hist:[],lastSup:null};return p}
 kids.forEach(k=>{
  const m=mo(k.dob),doms=(NEED[k.nd]||NEED['Cần hỗ trợ đa lĩnh vực']),n=RI(5,7),taken=[];k.sp=.5+R()*1.2;
  const from=k.sd>W0?k.sd:W0;
  for(let i=0;i<n;i++){const dom=doms[i%doms.length],long=i>=n-1||(n>=7&&i===n-2),g=pickGoal(dom,m,taken,long);if(!g)continue;taken.push(g.id);addPlan(k,g.id,long?'d':'n',from)}
  /* mục tiêu ngắn hạn thuộc mục tiêu dài hạn cùng lĩnh vực (nếu không có thì mục tiêu dài hạn đầu tiên) */
  const ls=(plansOf[k.id]||[]).filter(p=>p.h==='d');(plansOf[k.id]||[]).filter(p=>p.h==='n').forEach(p=>{const l=ls.find(x=>gDom(x.g)===gDom(p.g))||ls[0];if(l)p.up=l.id})});
 /* các buổi đã diễn ra trong khoảng 11 tuần gần đây */
 const slotsOf=k=>{const out=[];
  for(let d=W0;d<WD;d=addD(d,1)){if(!isW(d))continue;const w=dow(d);
   D.lich.forEach(l=>{if(l.type==='11'&&l.hs===k.id&&l.day===w){const a=D.att[d+'|'+l.id+'|'+k.id];if(a?a==='cm':(d<attFrom&&R()<.9))out.push({d,by:l.gv})}});
   if(!(k.m11>0)&&k.gr&&w===2){const a=D.att[d+'|'+k.gr+'|'+k.id];if(a?a==='cm':(d<attFrom&&R()<.9))out.push({d,by:grGV(k)})}}
  return out};
 kids.forEach(k=>{
  slotsOf(k).forEach(sl=>{
   const act=(plansOf[k.id]||[]).filter(p=>p.s==='dang'&&p.from<=sl.d);if(!act.length)return;
   act.sort((a,b)=>(sk[a.id].last<sk[b.id].last?-1:sk[a.id].last>sk[b.id].last?1:R()-.5));
   const pick=act.slice(0,Math.min(act.length,RI(3,4))),it=[],doms=[];
   pick.forEach(p=>{const s=sk[p.id],z=cl(s.z+(R()-.5)*.07,0,1),B=[.16,.30,.46,.62,.78,1.001],ix=B.findIndex(b=>z<b),sup=SUPK[5-ix],lo=ix?B[ix-1]:0,u=(z-lo)/(B[ix]-lo),po=sup==='I'?.58+.42*u:.32+.55*u,n=P([10,10,10,10,10,8,5]);
    let tr='';for(let i=0;i<10;i++)tr+=i<n?(R()<po?'V':'X'):'.';
    it.push(p.h==='n'?{g:p.g,sup,tr,pl:p.id}:{g:p.g,sup,tr});const dm=gDom(p.g);if(!doms.includes(dm))doms.push(dm);
    s.last=sl.d;s.z=Math.min(1.02,s.z+s.r*k.sp*(.5+R()));
    s.hist.push(sup==='I'&&n>=5&&trOk(tr)/n>=.8?1:0);s.lastSup=sup;
    if(s.hist.length>=3&&s.hist.slice(-3).every(x=>x)&&p.s==='dang'){p.s='dat';p.dt=sl.d;
     const nx=nextOf(p.g);if(nx&&!(plansOf[k.id]||[]).some(q=>q.g===nx.id)&&sl.d<addD(WD,-14)){const np=addPlan(k,nx.id,p.h,addD(sl.d,1));if(p.up)np.up=p.up}}});
   const o={id:'s'+(++sn),k:k.id,date:sl.d,by:sl.by||k.gv||'nv04',st:'xong',dom:doms,it,note:R()<.5?P(NOTES):'',home:R()<.3?HOMETIP[P(doms)]:''};
   D.sess.push(o)})});
 /* kế hoạch buổi cho ngày làm việc kế tiếp (chưa ghi kết quả) */
 const nd=(()=>{let d=addD(TODAY,1);while(!isW(d))d=addD(d,1);return d})();
 D.lich.forEach(l=>{if(l.type!=='11'||l.day!==dow(nd))return;const k=D.kids.find(x=>x.id===l.hs);if(!k||k.st!=='dang')return;
  const act=(plansOf[k.id]||[]).filter(p=>p.s==='dang');if(!act.length)return;
  act.sort((a,b)=>(sk[a.id].last<sk[b.id].last?-1:1));
  const it=act.slice(0,3).map(p=>Object.assign({g:p.g,sup:sk[p.id].lastSup||'GP',tr:TR0},p.h==='n'?{pl:p.id}:{}));
  D.sess.push({id:'s'+(++sn),k:k.id,date:nd,by:l.gv,st:'kh',dom:[...new Set(it.map(x=>gDom(x.g)))],it,note:'',home:''})});
 kids.forEach(k=>{delete k.sp})}
