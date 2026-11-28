/* Bàn giao ca giữa giáo viên: giáo viên cũ nghỉ việc giữa tháng, giáo viên mới nhận ca từ một ngày; các buổi trước đó vẫn tính cho giáo viên cũ nhưng giáo viên mới điểm danh hộ được; học phí của bé không đổi */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
(async()=>{
 const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 const P=await ev(()=>{const m=sm(CM,-1);DB.sub=[];
  const lessons=DB.lich.filter(l=>l.type==='11'&&l.day>=1&&l.day<=5&&kidBy(l.hs)&&kidBy(l.hs).st==='dang');
  const cnt={};lessons.forEach(l=>{cnt[l.gv]=(cnt[l.gv]||0)+1});
  const A=Object.keys(cnt).filter(id=>stBy(id)&&isTeacher(stBy(id))&&cnt[id]>=4).sort((a,b)=>cnt[b]-cnt[a])[0];
  const used=new Set(lessons.map(l=>l.gv));
  const B=DB.staff.find(s=>s.st==='dang'&&isTeacher(s)&&s.id!==A&&!isGrStaff(s.id)&&!used.has(s.id))||DB.staff.find(s=>s.st==='dang'&&isTeacher(s)&&s.id!==A&&!isGrStaff(s.id));
  /* giáo viên mới là Partime để tiền ca được tính; giáo viên cũ nghỉ việc */
  B.ft=false;B.cc=false;B.pay=Object.assign({},B.pay,{mode:'buoi',rate:60000});
  const sA=stBy(A);sA.ft=false;sA.cc=false;sA.pay=Object.assign({},sA.pay,{mode:'buoi',rate:60000});
  const mine=lessons.filter(l=>l.gv===A),all=DB.lich.filter(l=>l.gv===A&&l.type==='11'),bus=DB.lich.filter(l=>l.gv===A&&l.type==='bu');
  const dates=mDates(m).filter(d=>isW(d)&&!isClosed(d)&&d<TODAY);const mid=dates[Math.floor(dates.length/2)];
  /* điểm danh có mặt cho mọi ca 1-1 của giáo viên A trong tháng trước (kể cả thứ Bảy) */
  dates.forEach(d=>{all.forEach(l=>{if(l.day===dow(d))DB.att[attKey(d,l.id,l.hs)]='cm'})});
  const cm=(ls,f)=>{let n=0;dates.forEach(d=>{ls.forEach(l=>{if((l.type==='11'&&l.day===dow(d))||(l.type==='bu'&&l.date===d))if(DB.att[attKey(d,l.id,l.hs)]==='cm'&&f(d))n++})});return n};
  const pre=cm(all,d=>d<mid),post=cm(all,d=>d>=mid),buN=cm(bus,()=>true);
  const kids=[...new Set(all.map(l=>l.hs))];
  const before={A:payroll(sA,m).teach,B:payroll(B,m).teach,inv:kids.map(k=>invoice(kidBy(k),m)).join(','),cm:kids.map(k=>settle(kidBy(k),m).cm).join(',')};
  return{m,A,B:B.id,mid,pre,post,buN,before,kids,n:all.length}});
 ok('dựng được giáo viên cũ có nhiều ca, giáo viên mới và ngày bàn giao giữa tháng',!!P.A&&!!P.B&&P.pre>0&&P.post>0,P);
 ok('trước bàn giao: toàn bộ ca trong tháng tính cho giáo viên cũ',P.before.A===P.pre+P.post+P.buN&&P.before.B===0,P);
 /* giáo viên cũ nghỉ việc, bàn giao bằng giao diện */
 await ev(p=>{stBy(p.A).st='nghi';S.pc={tab:'gv',q:'',gv:''};go('pc');render()},P);await page.waitForSelector('[data-a="bgopen"]');
 await page.click('[data-a="bgopen"]');await page.waitForSelector('#bgf');
 const pre=await ev(()=>({from:S.modal.from,opts:[...document.querySelectorAll('#bg-f option')].map(o=>o.textContent)}));
 ok('hộp Bàn giao ca tự chọn sẵn giáo viên đã nghỉ việc, ghi "(đã nghỉ việc)"',pre.from===P.A&&pre.opts.some(o=>/đã nghỉ việc/.test(o)),pre);
 await page.selectOption('#bg-t',P.B);await page.fill('#bg-d',P.mid);await page.dispatchEvent('#bg-d','change');await W();
 await page.click('#bgf button[type=submit]');await page.waitForSelector('[data-a="askyes"]');await page.click('[data-a="askyes"]');await W(300);
 const A1=await ev(p=>{const ls=DB.lich.filter(l=>l.type==='11'&&(l.ph||[]).some(x=>x.g===p.A));const l0=ls[0];
  const d1=mDates(p.m).find(d=>isW(d)&&d<p.mid&&dow(d)===l0.day),d2=mDates(p.m).find(d=>isW(d)&&d>=p.mid&&dow(d)===l0.day);
  return{n:ls.length,gv:ls.every(l=>l.gv===p.B),ph:ls.every(l=>l.ph.length===1&&l.ph[0].u===p.mid&&l.ph[0].g===p.A),e1:effGv(l0,d1),e2:effGv(l0,d2),b1:baseGv(l0,d1),kts:kTs(kidBy(l0.hs)),d1,d2,id:l0.id,hs:l0.hs,modal:!!S.modal}},P);
 ok('bàn giao xong: mọi ca của giáo viên cũ chuyển cho giáo viên mới, ghi lịch sử bàn giao từ ngày tiếp quản',A1.n===P.n&&A1.gv&&A1.ph&&!A1.modal,A1);
 ok('buổi trước ngày tiếp quản thuộc giáo viên cũ, từ ngày tiếp quản thuộc giáo viên mới',A1.e1===P.A&&A1.e2===P.B,A1);
 ok('danh sách giáo viên của bé chuyển sang giáo viên mới',A1.kts.includes(P.B)&&!A1.kts.includes(P.A),A1);
 /* công và tiền */
 const C=await ev(p=>{const a=payroll(stBy(p.A),p.m),b=payroll(stBy(p.B),p.m);return{a:a.teach,b:b.teach,aG:a.bySess,bG:b.bySess}},P);
 ok('công dạy: giáo viên cũ chỉ được các buổi trước ngày tiếp quản (và học bù còn lại), giáo viên mới chỉ từ ngày tiếp quản',C.a===P.pre+P.buN&&C.b===P.post,{C,pre:P.pre,post:P.post,bu:P.buN});
 ok('tiền theo ca đúng theo công (60.000 ₫ mỗi ca có mặt)',C.aG===(P.pre+P.buN)*60000&&C.bG===P.post*60000,C);
 /* học phí không đổi */
 const T=await ev(p=>({inv:p.kids.map(k=>invoice(kidBy(k),p.m)).join(','),cm:p.kids.map(k=>settle(kidBy(k),p.m).cm).join(',')}),P);
 ok('học phí và số buổi bé đi học của tháng không đổi sau bàn giao',T.inv===P.before.inv&&T.cm===P.before.cm,{T,before:P.before});
 /* giáo viên mới điểm danh hộ ngày trước */
 const V=await ev(a=>{const p=a;setUser(findAccount(stBy(p.B).em));S.dd={tab:'roll',date:p.d1,m:p.d1.slice(0,7),q:'',pr:'',fl:'',gv:'',kid:'',un:false};go('dd');render();
  const row=dayList(p.d1).find(r=>r.sid===p.id);const key=attKey(p.d1,p.id,p.hs),old=DB.att[key];
  ACT.att(p.d1+'|'+p.id+'|'+p.hs+'|p');const after=DB.att[key];ACT.att(p.d1+'|'+p.id+'|'+p.hs+'|cm');
  return{see:!!row&&rowHas(row,U.id),gvShown:row&&row.gv,hand:row&&row.hand,can:canKidOn(p.hs,p.d1,p.id),wrote:old==='cm'&&after==='p'&&DB.att[key]==='cm',html:document.querySelector('#main').textContent.includes(kidBy(p.hs).n)}},{...P,...A1});
 ok('giáo viên mới thấy bé ở các ngày trước ngày tiếp quản và điểm danh hộ được',V.see&&V.can&&V.wrote&&V.html,V);
 ok('hàng điểm danh ngày trước vẫn ghi giáo viên cũ phụ trách (công tính cho giáo viên cũ)',V.gvShown===P.A&&V.hand===true,V);
 /* công 1-1 và lương hiển thị giáo viên đã nghỉ việc */
 await ev(()=>{setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));render()});
 const L=await ev(p=>{const R=ccOneRows(p.m),ids=cc11List(p.m,R).map(x=>x.gv),sa=ccOneStat(p.A,p.m,R),sb=ccOneStat(p.B,p.m,R);
  S.tl={m:p.m};go('tl');render();const tx=document.querySelector('#main').textContent;
  return{inList:ids.includes(p.A)&&ids.includes(p.B),a:sa.n,b:sb.n,tl:/Đã nghỉ việc/.test(tx)}},P);
 ok('Chấm công 1-1: giáo viên đã nghỉ việc vẫn hiện với các buổi trước bàn giao; giáo viên mới chỉ từ ngày tiếp quản',L.inList&&L.a>0&&L.b>0,L);
 ok('Tiền lương: giáo viên đã nghỉ việc còn ca trong tháng vẫn hiện, kèm nhãn',L.tl,L);
 /* lưới lịch */
 const G=await ev(p=>{const l=DB.lich.find(x=>x.id===p.id);const f=(g,d)=>lhEnt({mode:'gv',gv:g},d,l.slot).filter(e=>e.l.id===l.id).length;return{a1:f(p.A,p.d1),b1:f(p.B,p.d1),a2:f(p.A,p.d2),b2:f(p.B,p.d2)}},{...P,...A1});
 ok('Lịch học: ngày trước tiếp quản hiện ở lưới giáo viên cũ, ngày sau hiện ở lưới giáo viên mới',G.a1===1&&G.b1===0&&G.a2===0&&G.b2===1,G);
 /* kiểm tra ràng buộc */
 const E=await ev(p=>{const l=DB.lich.find(x=>x.id===p.id);const m1={from:p.B,to:p.B,d:p.mid,off:[]};const e1=bgRun(m1,1);
  const m2={from:p.B,to:DB.staff.find(s=>s.st==='dang'&&isTeacher(s)&&s.id!==p.B&&!isGrStaff(s.id)).id,d:addD(p.mid,-3),off:[]};const e2=bgRun(m2,1);return{e1,e2}},{...P,...A1});
 ok('không bàn giao cho chính mình; ngày tiếp quản không được trước lần bàn giao trước',/khác nhau/.test(E.e1)&&/đã bàn giao đến/.test(E.e2),E);
 ok('không lỗi trang',errs.length===0,errs);
 await b.close();
 console.log(`\nKẾT QUẢ: ${passes} đạt, ${fails} lỗi`);process.exit(fails?1:0)})();
