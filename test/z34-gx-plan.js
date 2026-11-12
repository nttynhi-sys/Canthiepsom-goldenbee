/* Vấn đề, mục tiêu và bài tập của ADHD, Tích hợp giác quan, Điều hòa cảm giác: hiện trong kế hoạch của bé (nhân viên) và cổng phụ huynh */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
const SP='/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/';

/* dựng kế hoạch: dài hạn = Điều hòa cảm giác, ngắn hạn = ADHD và Tích hợp giác quan, ngắn hạn thường (ABLLS) để đối chứng */
const SETUP=()=>{const k=myKids()[0]||DB.kids.find(x=>x.st==='dang');
 const si=LIBI.find(x=>x.s==='si'&&(x.bl||[]).length>3);
 const ad=LIBI.find(x=>x.s==='ad'&&!/^Bài tập · /.test(x.t)&&(x.bt||[]).length>=4);
 const sd=LIBI.find(x=>x.s==='sd'&&x.t==='Phản xạ Moro (giật mình)'&&!/^Bài tập · /.test(x.t));
 const ab=LIBI.find(x=>x.s==='ab'&&x.d==='nd');
 DB.plans=DB.plans.filter(p=>p.k!==k.id);DB.sess=DB.sess.filter(s=>s.k!==k.id);
 const P=(id,g,h,up)=>DB.plans.push(Object.assign({id,k:k.id,g,h,s:'dang',from:addD(TODAY,-30),due:addD(TODAY,200),by:'x'},up?{up}:{}));
 P('L1',si.id,'d');P('S1',ad.id,'n','L1');P('S2',sd.id,'n','L1');P('S3',ab.id,'n');
 DB.sess.push({id:'t1',k:k.id,date:addD(TODAY,-3),by:'x',st:'xong',dom:['cgq'],it:[{g:ad.id,sup:'I',tr:'VVVVVVVVVV',pl:'S1'}],note:'',home:''});
 return{kid:k.id,si:si.id,ad:ad.id,sd:sd.id,ab:ab.id}};

(async()=>{
 /* ---------- A. dữ liệu: hàm gxData ---------- */
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 await login(page,'tt');
 const A=await ev(()=>{const r={};
  const si=LIBI.find(x=>x.s==='si'&&(x.bl||[]).length>3),d1=gxData(si);
  r.si={prob:d1.prob===si.n,head:d1.head,n:d1.ex.length,same:d1.ex.length===si.bl.length,goal:d1.goal};
  const ad=LIBI.find(x=>x.s==='ad'&&!/^Bài tập · /.test(x.t)&&x.c==='NT-01'),d2=gxData(ad);
  r.ad={prob:d2.prob,goal:d2.goal===ad.n,crit:d2.crit,cr2:d2.cr2,ex:d2.ex.map(e=>e.n),how:d2.ex.every(e=>e.o)};
  const sd=LIBI.find(x=>x.s==='sd'&&x.c==='PX-01'),d3=gxData(sd);
  r.sd={prob:d3.prob,goal:d3.goal===sd.n,n:d3.ex.length,expect:LIBI.filter(x=>x.s==='sd'&&x.t==='Bài tập · Phản xạ Moro (giật mình)').length};
  r.other=['ab','ed','vb','mn','ot','we','cp','nl'].map(s=>gxData(LIBI.find(x=>x.s===s))).every(x=>x===null);
  r.nullGoal=gxData(null)===null&&gxHtml(null,'s')==='';
  /* bài tập được chọn làm mục tiêu */
  const bt=LIBI.find(x=>x.s==='sd'&&/^Bài tập · /.test(x.t)),d4=gxData(bt);
  r.bt={prob:d4.prob,how:!!d4.how,ex:d4.ex.length,html:gxHtml(bt,'s',{open:1}).includes('Cách làm')};
  /* mọi mục của ba bộ đều dựng được khối, không lỗi */
  let bad=0,n=0;LIBI.forEach(x=>{if(GXS[x.s]){n++;try{const h=gxHtml(x,'s')+gxHtml(x,'p')+gxHtml(x,'pdf');if(!h.includes('Vấn đề'))bad++}catch(e){bad+=1000}}});
  r.all={n,bad};
  return r});
 ok('Điều hòa cảm giác: vấn đề là tên mục, có hệ giác quan, đủ bài tập như trong dữ liệu',A.si.prob&&A.si.head&&A.si.same&&A.si.n>3&&A.si.goal==='',A.si);
 ok('ADHD: vấn đề là nhóm kỹ năng, mục tiêu là tên mục, có tiêu chí đạt và các bài tập kèm cách làm',A.ad.prob==='Giấc ngủ'&&A.ad.goal&&A.ad.crit&&/5\/7/.test(A.ad.cr2)&&A.ad.ex.length===4&&A.ad.how,A.ad);
 ok('Tích hợp giác quan: bài tập là các mục "Bài tập · nhóm" cùng nhóm với mục tiêu',A.sd.prob==='Phản xạ Moro (giật mình)'&&A.sd.goal&&A.sd.n>0&&A.sd.n===A.sd.expect,A.sd);
 ok('các bộ khác không bị đụng tới (trả rỗng)',A.other&&A.nullGoal,A);
 ok('mục là bài tập: hiện nhóm và cách làm, không lặp danh sách bài tập',A.bt.prob&&A.bt.how&&A.bt.ex===0&&A.bt.html,A.bt);
 ok('mọi mục của ba bộ dựng được khối ở cả ba chế độ (nhân viên, phụ huynh, bản in)',A.all.n>700&&A.all.bad===0,A.all);

 /* ---------- B. nhân viên: tab Kế hoạch mục tiêu ---------- */
 const ids=await ev(SETUP);
 await ev(id=>{S.modal={t:'hs',id,tab:'kh'};render()},ids.kid);await page.waitForSelector('.gt-b');
 const B=await ev(ids=>{const rows=[...document.querySelectorAll('.pl')].map(r=>({name:r.querySelector('.pl-m>b').innerText,gx:!!r.querySelector('details.gx'),open:!!r.querySelector('details.gx[open]'),txt:(r.querySelector('details.gx')||{innerText:''}).innerText}));
  return{rows,n:document.querySelectorAll('.pl details.gx').length,all:document.querySelector('.gt-b').closest('div').innerText}},ids);
 /* so khớp theo tên thật */
 const names=await ev(ids=>({si:gName(ids.si),ad:gName(ids.ad),sd:gName(ids.sd),ab:gName(ids.ab)}),ids);
 const row=n=>B.rows.find(r=>r.name===names[n]);
 ok('kế hoạch: 3 mục của ba bộ có khối "Vấn đề, mục tiêu và bài tập", mở sẵn',B.n===3&&row('si').gx&&row('ad').gx&&row('sd').gx&&row('si').open&&row('ad').open&&row('sd').open,B.rows.map(r=>[r.name.slice(0,30),r.gx,r.open]));
 ok('mục của bộ khác (ABLLS) không có khối này',row('ab')&&!row('ab').gx,row('ab'));
 ok('ADHD: hiện Vấn đề, Mục tiêu, Tiêu chí đạt và bài tập (kèm "Xem thêm" khi quá 3)',/Vấn đề: Giấc ngủ|Vấn đề: .+/.test(row('ad').txt)&&/Mục tiêu:/.test(row('ad').txt)&&/Tiêu chí đạt:/.test(row('ad').txt)&&/Bài tập \(4\)/.test(row('ad').txt)&&/Xem thêm 1 bài tập/.test(row('ad').txt),row('ad').txt);
 ok('Điều hòa cảm giác: hiện Vấn đề kèm hệ giác quan và danh sách bài tập',/Vấn đề: .+\(.+\)/.test(row('si').txt)&&/Bài tập \(\d+\)/.test(row('si').txt),row('si').txt);
 ok('Tích hợp giác quan: nhân viên thấy cả lưu ý an toàn của bài tập',/Lưu ý:/.test(row('sd').txt)&&/Dụng cụ:/.test(row('sd').txt),row('sd').txt);
 await page.screenshot({path:SP+'z34-staff-plan.png'});
 /* không tràn ngang ở điện thoại */
 await page.setViewportSize({width:390,height:844});
 ok('điện thoại (nhân viên): không tràn ngang',await ev(()=>document.documentElement.scrollWidth<=window.innerWidth+1),await ev(()=>[document.documentElement.scrollWidth,window.innerWidth]));
 await page.screenshot({path:SP+'z34-staff-plan-mobile.png'});
 ok('nhân viên: không lỗi trang',errs.length===0,errs);
 await b.close();

 /* ---------- C. cổng phụ huynh ---------- */
 const o2=await open();const p2=o2.page,ev2=(f,a)=>p2.evaluate(f,a);
 await ev2(()=>{setUser(demoAcc('ph'));render()});await p2.waitForSelector('.nav');
 const ids2=await ev2(SETUP);
 await ev2(id=>{S.cp={tab:'tb',kid:id,m:WD.slice(0,7)};render()},ids2.kid);await p2.waitForSelector('.gtp');
 const C=await ev2(ids=>{const q=s=>[...document.querySelectorAll(s)],t=e=>e.innerText;
  const lg=q('.gtp.nb')[0],shorts=q('.gts');
  return{longGx:!!(lg&&lg.querySelector(':scope > details.gx[open]')),longTxt:lg?t(lg.querySelector(':scope > details.gx')||lg):'',
   shortGx:shorts.filter(s=>s.querySelector(':scope > details.gx[open]')).length,shorts:shorts.length,
   sessGx:q('.gtg li details.gx').length,sessOpen:q('.gtg li details.gx[open]').length,
   all:document.querySelector('#main').innerText,fs:parseFloat(getComputedStyle(document.querySelector('.gtp details.gx')).fontSize),
   html:document.querySelector('#main').innerHTML}},ids2);
 ok('phụ huynh: mục tiêu dài hạn (Điều hòa cảm giác) hiện khối vấn đề, bài tập mở sẵn',C.longGx&&/Vấn đề: .+/.test(C.longTxt)&&/Bài tập \(\d+\)/.test(C.longTxt),C.longTxt);
 ok('phụ huynh: mục tiêu ngắn hạn của ADHD và Tích hợp giác quan có khối riêng, mục ngắn hạn ABLLS thì không',C.shortGx===2&&C.shorts>=3,[C.shortGx,C.shorts]);
 ok('phụ huynh: mục tiêu buổi (trong lần luyện) có khối gập sẵn, không mở',C.sessGx>=1&&C.sessOpen===0,[C.sessGx,C.sessOpen]);
 ok('phụ huynh: chữ trong khối ≥ 16px',C.fs>=16,C.fs);
 ok('phụ huynh: không lộ ghi chú lâm sàng, lưu ý an toàn, chữ "đề xuất" hay "OT duyệt"',!/Ghi chú lâm sàng|Lưu ý|đề xuất|OT duyệt|bác sĩ đánh giá/i.test(C.all),(C.all.match(/.{30}(Ghi chú lâm sàng|Lưu ý|đề xuất|OT duyệt|bác sĩ đánh giá).{30}/i)||[])[0]);
 ok('phụ huynh: không lộ mã bé hay mã mục (DHCG, BT-, NT-)',!/DHCG-|BT-|\bNT-\d|\bPX-\d/.test(C.all),(C.all.match(/.{20}(DHCG-|BT-|\bNT-\d|\bPX-\d).{20}/)||[])[0]);
 await p2.screenshot({path:SP+'z34-parent.png'});
 await ev2(()=>{document.querySelector('.gtp details.gx').scrollIntoView()});await p2.screenshot({path:SP+'z34-parent-gx.png'});
 /* bản in: mở hết, không gập, đủ bài tập */
 const D=await ev2(ids=>{const h=gtParent(ids.kid,{pdf:true}),d=document.createElement('div');d.innerHTML=h;const si=LIBI.find(x=>x.id===ids.si);
  return{gxDiv:d.querySelectorAll('div.gx').length,details:d.querySelectorAll('details.gx').length,hasH:d.querySelectorAll('.gx-h').length,li:d.querySelectorAll('.gx ol.bl li').length,more:/Xem thêm/.test(h),siN:si.bl.length}},ids2);
 ok('bản in: khối mở hết (không gập, không "Xem thêm"), mục tiêu buổi không lặp lại khối',D.gxDiv>=3&&D.details===0&&D.more===false&&D.li>=D.siN,D);
 /* điện thoại */
 await p2.setViewportSize({width:390,height:844});await ev2(()=>render());
 ok('điện thoại (phụ huynh): không tràn ngang',await ev2(()=>document.documentElement.scrollWidth<=window.innerWidth+1),await ev2(()=>[document.documentElement.scrollWidth,window.innerWidth]));
 await p2.screenshot({path:SP+'z34-parent-mobile.png'});
 ok('phụ huynh: không lỗi trang',o2.errs.length===0,o2.errs);
 await o2.b.close();

 /* ---------- D. chế độ tối ---------- */
 const o3=await open({dark:true});
 await o3.page.evaluate(()=>{setUser(demoAcc('ph'));render()});await o3.page.waitForSelector('.nav');
 const ids3=await o3.page.evaluate(SETUP);
 await o3.page.evaluate(id=>{S.cp={tab:'tb',kid:id,m:WD.slice(0,7)};render()},ids3.kid);await o3.page.waitForSelector('.gtp details.gx');
 await o3.page.screenshot({path:SP+'z34-parent-dark.png'});
 ok('chế độ tối: khối có nền và chữ tách bạch',await o3.page.evaluate(()=>{const e=document.querySelector('.gtp details.gx'),c=getComputedStyle(e);return c.backgroundColor!==c.color&&c.backgroundColor!=='rgba(0, 0, 0, 0)'}));
 await o3.b.close();

 console.log(`\n${passes} đạt, ${fails} lỗi`);process.exit(fails?1:0);
})();
