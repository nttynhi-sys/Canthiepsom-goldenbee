/* Giá riêng của bé: giá bán trú 1 ngày riêng (khóa bt trong kpr) và nút "Giá riêng" ở Học phí → Công nợ học sinh.
   Bé không đặt giá riêng, giá riêng chỉ theo loại 1-1 và dữ liệu mẫu cũ đều giữ nguyên cách tính. */
const {open,login}=require('./h.js');
const fs=require('fs'),path=require('path');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
const SP='/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/';
const src=f=>fs.readFileSync(path.join(__dirname,'../src/build',f),'utf8');
const J=JSON.stringify;

(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 await login(page,'tt');

 /* ---------- A. tính học phí theo giá bán trú riêng ---------- */
 const A=await ev(()=>{
  const nm=sm(CM,1),pick=DB.kids.filter(k=>k.st==='dang'&&k.bt&&k.sd.slice(0,7)<=nm&&sched(k,nm).some(x=>x.kind==='bt'));
  const k=pick[0],k2=pick[1],n=sched(k,nm).filter(x=>x.kind==='bt').length,P=DB.cfg.pbtDay;
  const r={k:k.id,k2:k2.id,n,P,P11:DB.cfg.pbtDay11,nm,seedKpr:Object.keys(DB.kpr).length};
  DB.kpr={};r.base=invoice(k,nm);r.base2=invoice(k2,nm);
  DB.kpr[k.id]={bt:350000};r.low=invoice(k,nm);r.other=invoice(k2,nm);
  DB.kpr[k.id]={bt:0};r.free=invoice(k,nm);
  DB.kpr[k.id]={bt:450000};r.high=invoice(k,nm);
  DB.kpr[k.id]={gq:150000};r.ltBt=kidBt(k);r.ltHas=hasKpr(k);
  r.bad=['abc',-5,null,NaN,'350000'].map(v=>{DB.kpr[k.id]={bt:v};return invoice(k,nm)});
  DB.kpr[k.id]={bt:350000,gq:150000};r.both=kidBt(k);r.has=hasKpr(k);
  DB.kpr[k.id]={};r.emptyHas=hasKpr(k);
  DB.kpr={};r.hasNone=hasKpr(k);r.btNone=kidBt(k);
  return r});
 ok('dữ liệu mẫu chưa có giá riêng nào (kho kpr trống)',A.seedKpr===0&&A.n>0,A);
 ok('giá bán trú riêng thấp hơn giá chung: học phí giảm đúng (giá riêng − giá chung) × số ngày bán trú; bé khác không đổi',A.low===A.base+A.n*(350000-A.P)&&A.other===A.base2,A);
 ok('giá bán trú riêng cao hơn giá chung: học phí tăng đúng; giá 0 là hợp lệ (miễn phí bán trú), không bị coi là chưa đặt',A.high===A.base+A.n*(450000-A.P)&&A.free===A.base-A.n*A.P,A);
 ok('chỉ đặt giá loại 1-1 thì giá bán trú vẫn là giá chung; có giá riêng nào cũng được tính là "có giá riêng"',A.ltBt===A.P&&A.ltHas&&A.both===350000&&A.has,A);
 ok('giá không hợp lệ (chữ, số âm, rỗng, NaN, chuỗi số) không làm đổi học phí, tính theo giá chung',A.bad.every(v=>v===A.base),A.bad);
 ok('bỏ hết giá riêng ({} hoặc không có): không còn là có giá riêng',!A.emptyHas&&!A.hasNone&&A.btNone===A.P,A);

 /* quy tắc hoàn phí nghỉ chạy trên giá riêng; phần ca 1-1 trong gói vẫn theo thông số chung */
 const F=await ev(([id,nm])=>{const k=kidBy(id),R=DB.cfg.rule,d=mDates(nm).find(x=>isW(x)&&btHas(k,dow(x))),c11=DB.cfg.pbtDay11;
  const got=(bt,code)=>{DB.kpr={};if(bt!=null)DB.kpr[k.id]={bt};const o=feeOf(k,'bt',d,k.gr,code,nm);return[o.rf,o.ls]};
  const exp=(x,code)=>{const dCN=Math.min(c11,x);if(code==='p')return[dCN,x-dCN];if(code==='kp')return[0,x];
   const rB=Math.max(x-dCN,0),rf=Math.round(rB*R.bvRefund/100+dCN*bv11(R)/100);return[rf,x-rf]};
  const out={d,c11,bvR:R.bvRefund,rows:[]};
  [[null,DB.cfg.pbtDay],[350000,350000],[450000,450000],[100000,100000],[0,0]].forEach(([bt,x])=>['p','kp','bv'].forEach(code=>{
   const g=got(bt,code),e=exp(x,code);out.rows.push({bt,code,g,e,same:g[0]===e[0]&&g[1]===e[1]})}));
  DB.kpr={};return out},[A.k,A.nm]);
 ok('hoàn phí khi nghỉ P, KP, nhập viện: giá chung và các giá riêng (thấp, cao, nhỏ hơn phần 1-1, bằng 0) đều ra đúng công thức',F.rows.length===15&&F.rows.every(r=>r.same),F.rows.filter(r=>!r.same));
 ok('ví dụ cụ thể: giá riêng 350.000 nghỉ có phép hoàn 180.000 (ca 1-1 trong gói), mất 170.000; nghỉ không phép mất 350.000',J(F.rows.find(r=>r.bt===350000&&r.code==='p').g)===J([F.c11,350000-F.c11])&&J(F.rows.find(r=>r.bt===350000&&r.code==='kp').g)===J([0,350000]),F);

 /* quyết toán cả tháng và ảnh hưởng của ngày nghỉ lễ đi theo giá riêng */
 const S1=await ev(id=>{const k=kidBy(id),m=sm(CM,-1);
  Object.keys(DB.att).filter(x=>x.endsWith('|'+k.id)).forEach(x=>delete DB.att[x]);
  const d=mDates(m).filter(x=>isW(x)&&!isClosed(x)&&btHas(k,dow(x)))[0],key=d+'|'+k.gr+'|'+k.id,run=(code,bt)=>{DB.att[key]=code;DB.kpr={};if(bt!=null)DB.kpr[k.id]={bt};return settle(k,m)};
  const kpA=run('kp'),kpC=run('kp',350000),pA=run('p'),pC=run('p',350000);delete DB.att[key];DB.kpr={};
  const hd=mDates(sm(CM,1)).find(x=>isW(x)&&btHas(k,dow(x)));DB.kpr={};const h0=holImpact(hd).money;DB.kpr[k.id]={bt:350000};const h1=holImpact(hd).money;DB.kpr={};
  return{d,lostDiff:kpC.lost-kpA.lost,refundDiff:pC.refund-pA.refund,lostPDiff:pC.lost-pA.lost,P:DB.cfg.pbtDay,hol:h1-h0}},A.k);
 ok('quyết toán tháng trước: một ngày nghỉ KP mất đúng (giá riêng − giá chung) khác biệt; nghỉ P hoàn không đổi, phần mất đổi bằng chênh lệch giá',!!S1.d&&S1.lostDiff===350000-S1.P&&S1.refundDiff===0&&S1.lostPDiff===350000-S1.P,S1);
 ok('ngày nghỉ lễ: số tiền học phí giảm của một ngày bán trú đổi đúng (giá riêng − giá chung) cho bé có giá riêng',S1.hol===350000-S1.P,S1);

 /* bé không có giá bán trú riêng: mọi hóa đơn dữ liệu mẫu bằng đúng công thức cũ */
 const W=await ev(()=>{DB.kpr={};const bad=[];let n=0;DB.kids.forEach(k=>[sm(CM,-1),CM,sm(CM,1)].forEach(m=>{if(k.st!=='dang'||k.sd.slice(0,7)>m)return;n++;const xs=sched(k,m);
   const old=xs.filter(x=>x.kind==='11'&&!x.inc).reduce((a,x)=>a+feeSlot(k,x.sid),0)+xs.filter(x=>x.kind==='bt').length*(DB.cfg.pbtDay||0);
   if(old!==invoice(k,m))bad.push(k.id+'|'+m)}));return{n,bad}});
 ok('không giá riêng: hóa đơn mọi bé trong 3 tháng đúng công thức cũ (số ngày bán trú × giá chung + ca 1-1 tính riêng)',W.n>100&&W.bad.length===0,W);
 /* mọi nơi tính tiền một bé phải đi qua kidBt, không đọc thẳng giá chung */
 const raw=f=>(src(f).match(/DB\.cfg\.pbtDay(?!11)/g)||[]).length;
 ok('p04-domain chỉ đọc DB.cfg.pbtDay một lần (trong kidBt), p22-hol không đọc trực tiếp',raw('p04-domain.js')===1&&raw('p22-hol.js')===0,[raw('p04-domain.js'),raw('p22-hol.js')]);

 /* ---------- B. nút "Giá riêng" ở Học phí → Công nợ học sinh ---------- */
 await ev(()=>{DB.kpr={};S.hp={tab:'tq',m:CM,st:'',q:''};go('hp');render()});await page.waitForSelector('[data-a="kpropen"]');
 const U=await ev(()=>{const btn=[...document.querySelectorAll('#main [data-a="kpropen"]')],tb=btn[0].closest('table'),rows=[...tb.querySelectorAll('tbody tr')];
  return{rows:rows.length,btn:btn.length,all:rows.every(r=>r.querySelector('[data-a="kpropen"]')),tags:[...document.querySelectorAll('#main .tag')].filter(t=>t.textContent==='Giá riêng').length,id:btn[0].dataset.v,aria:btn[0].getAttribute('aria-label')}});
 ok('mỗi dòng bé ở Công nợ học sinh có nút Giá riêng; chưa ai có giá riêng nên chưa có nhãn',U.rows>0&&U.btn===U.rows&&U.all&&U.tags===0&&/^Giá riêng của /.test(U.aria),U);
 await ev(id=>{DB.kpr[id]={bt:350000};render()},U.id);
 const T=await ev(id=>{const tags=[...document.querySelectorAll('#main .tag')].filter(t=>t.textContent==='Giá riêng');
  return{n:tags.length,inRow:!!tags[0]&&tags[0].closest('tr').querySelector('[data-a="kpropen"]').dataset.v===id}},U.id);
 ok('bé có giá riêng hiện nhãn "Giá riêng" cạnh tên, đúng dòng của bé đó, các bé khác không có',T.n===1&&T.inRow,T);
 await page.click(`#main [data-a="kpropen"][data-v="${U.id}"]`);await page.waitForSelector('.mdc #kprf');
 const M=await ev(id=>{const f=document.querySelector('#kprf'),k=kidBy(id);return{h:document.querySelector('.mdc h2').textContent,bt:f.elements.kp_bt.value,ph:f.elements.kp_bt.placeholder,min:f.elements.kp_bt.min,
  n:LT.filter(x=>f.elements['kp_'+x.c]).length,txt:document.querySelector('.mdc').innerText,clr:!!document.querySelector('.mdc [data-a="kprclr"]'),name:k.n}},U.id);
 ok('hộp Giá riêng: tiêu đề có tên bé, ô bán trú hiện giá riêng đã lưu, gợi ý giá chung, 7 ô loại 1-1, nút Bỏ hết',M.h==='Giá riêng · '+M.name&&M.bt==='350000'&&/380\.000/.test(M.ph)&&M.min==='0'&&M.n===7&&M.clr,M);
 ok('hộp hiện giá đang tính, học phí tháng sau theo lịch hiện tại và giải thích phần 1-1 trong gói',/Bán trú đang tính: 350\.000/.test(M.txt)&&/giá riêng của bé; giá chung 380\.000/.test(M.txt)&&/Học phí tháng \d+\/\d+ theo lịch hiện tại/.test(M.txt)&&/phần ca 1-1 trong gói vẫn theo thông số chung/.test(M.txt),M.txt.slice(0,700));
 await page.screenshot({path:SP+'z49-kpr-modal.png'});
 /* lưu: ô bán trú và một loại 1-1, ô khác trống */
 await ev(()=>{const f=document.querySelector('#kprf');f.elements.kp_bt.value='320000';f.elements.kp_gq.value='150000';f.requestSubmit()});await page.waitForTimeout(150);
 const S2=await ev(id=>({o:DB.kpr[id],closed:!document.querySelector('#kprf'),modal:S.modal,tag:[...document.querySelectorAll('#main .tag')].filter(t=>t.textContent==='Giá riêng').length}),U.id);
 ok('lưu giá riêng: ghi đúng {bt, gq}, hộp đóng lại, nhãn vẫn hiện',S2.o&&S2.o.bt===320000&&S2.o.gq===150000&&Object.keys(S2.o).length===2&&S2.closed&&!S2.modal&&S2.tag===1,S2);
 /* ô trống bỏ giá riêng đã lưu; bỏ hết thì ghi {} (khóa vẫn còn để máy phụ huynh đồng bộ) và nhãn mất */
 await page.click(`#main [data-a="kpropen"][data-v="${U.id}"]`);await page.waitForSelector('.mdc #kprf');
 const R0=await ev(()=>{const f=document.querySelector('#kprf');return{bt:f.elements.kp_bt.value,gq:f.elements.kp_gq.value}});
 ok('mở lại: hiện đúng giá đã lưu (không bắt nhập lại)',R0.bt==='320000'&&R0.gq==='150000',R0);
 await ev(()=>{const f=document.querySelector('#kprf');f.elements.kp_bt.value='';f.elements.kp_gq.value='';f.requestSubmit()});await page.waitForTimeout(150);
 const S3=await ev(id=>({has:id in DB.kpr,o:DB.kpr[id],tag:[...document.querySelectorAll('#main .tag')].filter(t=>t.textContent==='Giá riêng').length}),U.id);
 ok('bỏ trống mọi ô rồi lưu: giá riêng về {} (giữ khóa), nhãn Giá riêng biến mất',S3.has&&Object.keys(S3.o).length===0&&S3.tag===0,S3);
 /* nút "Bỏ hết giá riêng" cũng ghi {} sau khi xác nhận */
 await ev(id=>{DB.kpr[id]={bt:350000,nc:170000};S.modal={t:'kpr',id};render()},U.id);await page.waitForSelector('.mdc [data-a="kprclr"]');
 await page.click('.mdc [data-a="kprclr"]');await page.waitForSelector('[data-a="askyes"]');await page.click('[data-a="askyes"]');await page.waitForTimeout(150);
 const S4=await ev(id=>({o:DB.kpr[id],bt:kidBt(kidBy(id)),P:DB.cfg.pbtDay}),U.id);
 ok('Bỏ hết giá riêng (có xác nhận): về {} và bán trú tính lại theo giá chung',S4.o&&Object.keys(S4.o).length===0&&S4.bt===S4.P,S4);
 /* giá âm lọt vào xử lý thì lưu 0, không bao giờ âm */
 const N=await ev(id=>{S.modal={t:'kpr',id};render();const f=document.querySelector('#kprf'),v0=(f.elements.kp_bt.value='-9',f.checkValidity());FORM.kprf(f);return{v0,bt:DB.kpr[id].bt}},U.id);
 ok('giá bán trú âm: trình duyệt không cho gửi; lọt vào xử lý thì lưu 0',N.v0===false&&N.bt===0,N);
 await ev(()=>{S.modal=null;render()});

 /* thẻ trong hồ sơ bé dùng chung form: sửa giá loại 1-1 không làm mất giá bán trú đã đặt */
 const H=await ev(id=>{DB.kpr[id]={bt:350000};S.v='hs';S.modal={t:'hs',id,tab:'lh'};render();const f=document.querySelector('#kprf');
  const r={has:!!f,bt:f&&f.elements.kp_bt.value,n:f?LT.filter(x=>f.elements['kp_'+x.c]).length:0,h:[...document.querySelectorAll('h2')].filter(h=>/^Giá riêng của bé/.test(h.textContent)).length};
  f.elements.kp_nc.value='170000';f.requestSubmit();return r},U.id);
 await page.waitForTimeout(150);
 const H2=await ev(id=>DB.kpr[id],U.id);
 ok('hồ sơ bé: thẻ Giá riêng của bé có ô bán trú (đã điền 350000) và 7 ô loại; lưu loại nc vẫn giữ bt',H.has&&H.bt==='350000'&&H.n===7&&H.h===1&&H2.bt===350000&&H2.nc===170000,[H,H2]);
 await ev(()=>{S.modal=null;DB.kpr={};go('hp');render()});

 /* ---------- C. quyền: Văn phòng được, Quản lý, Giáo viên, Phụ huynh không ---------- */
 const RV=await open();const evV=(f,a)=>RV.page.evaluate(f,a);await login(RV.page,'vp');
 await evV(()=>{S.hp={tab:'tq',m:CM,st:'',q:''};go('hp');render()});await RV.page.waitForSelector('[data-a="kpropen"]');
 const V=await evV(()=>{const id=document.querySelector('#main [data-a="kpropen"]').dataset.v;ACT.kpropen(id);render();const f=document.querySelector('#kprf');
  f.elements.kp_bt.value='360000';f.requestSubmit();return{id,bt:DB.kpr[id]&&DB.kpr[id].bt,canMoney:canMoney(),hasHs:!!document.querySelector('.nav [data-v="hs"]')}});
 errs.push(...RV.errs);await RV.b.close();
 ok('Văn phòng (có quyền tiền, không có mục Học sinh trong menu) mở và lưu được giá riêng ngay từ trang Học phí',V.canMoney&&V.bt===360000&&!V.hasHs,V);
 for(const role of ['ql','gv','ph']){
  const RR=await open();await login(RR.page,role);
  const X=await RR.page.evaluate(()=>{const k=DB.kids[0],before=JSON.stringify(DB.kpr),r=ACT.kpropen(k.id),m1=S.modal&&S.modal.t,h=String(VIEWS.hp());
   FORM.kprf&&(S.modal={t:'kpr',id:k.id});const w=FORM.kprf({elements:{}});
   return{ret:r,modal:m1,btn:/data-a="kpropen"/.test(h),card:kprCard(k)==='',modalHtml:typeof MODALS.kpr==='function'?(S.modal={t:'kpr',id:k.id},MODALS.kpr()):'',write:w,same:before===JSON.stringify(DB.kpr),canMoney:canMoney()}});
  errs.push(...RR.errs);await RR.b.close();
  ok('vai trò '+role+': không có quyền tiền — không mở được hộp, không có nút, thẻ giá riêng rỗng, hộp rỗng, không ghi được',X.canMoney===false&&X.ret===false&&X.modal!=='kpr'&&!X.btn&&X.card&&X.modalHtml===''&&X.write===false&&X.same,X);
 }
 ok('Không lỗi trang khi chạy',errs.length===0,errs);
 console.log(`\nKẾT QUẢ: ${passes} đạt, ${fails} lỗi`);await b.close();process.exit(fails?1:0)})();
