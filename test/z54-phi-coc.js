/* Học phí: phí cọc của bé (nhập số tiền; chỉ hoàn khi bé đã ngưng học và đã đóng đủ học phí; đánh dấu "Đã hoàn tiền cọc").
   Cộng thêm: nút Xóa báo cáo và Xóa hồ sơ nhân sự phải hiện hộp xác nhận (cùng lỗi return false như xóa hồ sơ bé). */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{
 const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||120);
 const K=await ev(()=>{const k=DB.kids.find(x=>x.st==='dang'&&balance(x.id)===0)||DB.kids.find(x=>x.st==='dang');
  DB.lg=DB.lg.filter(e=>e.hs!==k.id);   /* công nợ 0 để thử */
  S.hp=Object.assign({tab:'tq',m:CM,st:'',q:''},S.hp);S.hp.q=k.n;S.hp.tab='tq';go('hp');render();return{id:k.id,n:k.n,bal:balance(k.id)}});
 await page.waitForSelector('#main input[data-c="depamt"]');
 ok('Học phí → Công nợ: có cột Phí cọc với ô nhập số tiền ở mỗi dòng',(await page.$$('#main input[data-c="depamt"]')).length>=1&&/Phí cọc/.test(await page.textContent('#main')));
 await page.fill('#main tr:has-text("'+K.n+'") input[data-c="depamt"]','2000000');await page.dispatchEvent('#main tr:has-text("'+K.n+'") input[data-c="depamt"]','change');await W();
 const A=await ev(id=>({dep:DB.dep[id],bal:balance(id)}),K.id);
 ok('nhập 2.000.000: lưu vào phí cọc của bé, không đổi công nợ học phí',A.dep&&A.dep.a===2000000&&!A.dep.r&&A.bal===K.bal,A);
 ok('ô nhập hiển thị lại số tiền đã lưu và có nút Hoàn cọc',await page.inputValue('#main tr:has-text("'+K.n+'") input[data-c="depamt"]')==='2000000'&&!!(await page.$('#main tr:has-text("'+K.n+'") [data-a="deprf"]')));
 /* bé còn đang học: chưa hoàn được */
 await page.click('#main tr:has-text("'+K.n+'") [data-a="deprf"]',{force:true});await W();
 ok('bé chưa ngưng học: bấm Hoàn cọc chỉ báo lý do, không hỏi xác nhận, chưa hoàn',await ev(id=>!(S.modal&&S.modal.t==='ask')&&!DB.dep[id].r&&/Chưa hoàn được cọc: Bé chưa ngưng học/.test(document.querySelector('.toast')?document.querySelector('.toast').textContent:''),K.id));
 /* ngưng học nhưng còn nợ */
 await ev(id=>{kidBy(id).st='nghi';DB.lg.push({id:'eD1',hs:id,date:CM+'-01',kind:'hp',amt:500000,m:CM,note:'Học phí'});render()},K.id);await W();
 await page.click('#main tr:has-text("'+K.n+'") [data-a="deprf"]',{force:true});await W();
 ok('bé đã ngưng: hỏi xác nhận (nhắc kiểm tra đã đóng đủ học phí), chưa hoàn khi chưa xác nhận',await ev(id=>!!(S.modal&&S.modal.t==='ask')&&!DB.dep[id].r&&/đóng đủ học phí/.test(document.querySelector('.modal')?document.querySelector('.modal').textContent:document.body.textContent),K.id));
 await ev(()=>{S.modal=null;render()});await W();
 ok('bé đã ngưng vẫn nằm trong danh sách khi còn cọc hoặc còn nợ',!!(await page.$('#main tr:has-text("'+K.n+'")')));
 /* đóng đủ: hoàn được */
 await ev(id=>{DB.lg.push({id:'eD2',hs:id,date:CM+'-05',kind:'thu',amt:500000,m:CM,note:'Thu'});render()},K.id);await W();
 await page.click('#main tr:has-text("'+K.n+'") [data-a="deprf"]');await W();
 ok('đã ngưng và đóng đủ học phí: bấm Hoàn cọc hiện hộp xác nhận',await page.isVisible('[data-a="askyes"]')&&/Hoàn tiền cọc/.test(await page.textContent('.mdc')));
 await page.click('[data-a="askno"]');await W();
 ok('bấm Hủy: chưa hoàn',await ev(id=>!DB.dep[id].r,K.id));
 await page.click('#main tr:has-text("'+K.n+'") [data-a="deprf"]');await W();await page.click('[data-a="askyes"]');await W(200);
 const R=await ev(id=>({r:DB.dep[id].r,a:DB.dep[id].a,today:TODAY,bal:balance(id)}),K.id);
 ok('xác nhận: ghi ngày hoàn hôm nay, số tiền cọc giữ nguyên, công nợ không đổi',R.r===R.today&&R.a===2000000&&R.bal===0,R);
 ok('hiện nút/nhãn "Đã hoàn tiền cọc", ô nhập bị khóa, không còn nút Hoàn cọc',/Đã hoàn tiền cọc/.test(await page.textContent('#main tr:has-text("'+K.n+'")'))&&await page.$eval('#main tr:has-text("'+K.n+'") input[data-c="depamt"]',e=>e.disabled)&&!(await page.$('#main tr:has-text("'+K.n+'") [data-a="deprf"]')));
 ok('tổng kết dưới bảng: cọc đã hoàn',/đã hoàn\s*2\.000\.000/.test(await page.textContent('#main')),(await page.textContent('#main')).slice(-300));
 /* sổ học phí và hủy hoàn */
 await ev(id=>{ACT.slopen(id);render()},K.id);await page.waitForSelector('.mdc');
 ok('Sổ học phí của bé: có dòng Phí cọc và trạng thái đã hoàn',/Phí cọc/.test(await page.textContent('.mdc'))&&/Đã hoàn tiền cọc/.test(await page.textContent('.mdc')));
 await ev(()=>{S.modal=null;render()});
 await page.click('#main tr:has-text("'+K.n+'") [data-a="depview"]');await W();
 ok('bấm nhãn Đã hoàn tiền cọc: hiện ngày hoàn và cho hủy hoàn',await page.isVisible('[data-a="askyes"]')&&/đã được hoàn tiền cọc/.test(await page.textContent('.mdc')));
 await page.click('[data-a="askyes"]');await W(200);
 ok('Hủy hoàn cọc: trở lại chưa hoàn, giữ số tiền',await ev(id=>DB.dep[id].r===''&&DB.dep[id].a===2000000,K.id));
 /* Excel và xóa bé */
 ok('bộ đếm cọc: đang giữ 2.000.000 (1 bé)',/đang giữ\s*2\.000\.000/.test(await page.textContent('#main')));
 const X=await ev(id=>{hsDelKid(id);return{has:!!(DB.dep&&DB.dep[id])}},K.id);
 ok('xóa hồ sơ bé: xóa luôn phí cọc của bé',!X.has,X);
 /* ---------- nút Xóa báo cáo, Xóa hồ sơ nhân sự ---------- */
 const BC=await ev(()=>{const r=DB.rp[0];go('bc');render();ACT.bcdel(r.id);render();return{id:r.id,shown:!!document.querySelector('[data-a="askyes"]'),t:S.modal&&S.modal.t}});
 ok('Xóa báo cáo: hộp xác nhận hiện trên màn hình',BC.t==='ask'&&BC.shown,BC);
 await page.click('[data-a="askyes"]');await W(200);
 ok('xác nhận: báo cáo bị xóa',await ev(id=>!DB.rp.some(r=>r.id===id),BC.id));
 const NV=await ev(()=>{const s=DB.staff.find(x=>x.role==='gv'&&!accOf(x)&&!DB.kids.some(k=>kHas(k,x.id))&&!DB.lich.some(l=>l.gv===x.id)&&!DB.groups.some(g=>grHas(g,x.id)))||DB.staff.find(x=>x.role==='hc');
  go('ns');render();const el=document.createElement('button');el.dataset.a='nvdel';el.dataset.v=s.id;document.body.appendChild(el);el.click();el.remove();return{id:s.id,t:S.modal&&S.modal.t,shown:!!document.querySelector('[data-a="askyes"]')}});
 ok('Xóa hồ sơ nhân sự: hộp xác nhận hiện trên màn hình',NV.t==='ask'&&NV.shown,NV);
 await page.click('[data-a="askyes"]');await W(200);
 ok('xác nhận: hồ sơ nhân sự bị xóa',await ev(id=>!DB.staff.some(s=>s.id===id),NV.id));
 ok('không lỗi trình duyệt (Trưởng Trung tâm)',errs.length===0,errs);
 await b.close();
 /* ---------- quyền ---------- */
 for(const role of ['vp','ql','gv']){
  const o=await open();await login(o.page,role);
  const r=await o.page.evaluate(()=>{const k=DB.kids.find(x=>x.st==='dang'&&myKids().some(y=>y.id===x.id));const n=Object.keys(DB.dep||{}).length;
   const inp=document.createElement('input');inp.dataset.c='depamt';inp.dataset.v=k.id;CHG.depamt('1000000',inp);const wrote=Object.keys(DB.dep||{}).length>n;
   const dm=ACT.deprf(k.id);return{wrote,menu:navList().includes('hp')}});
  ok(role+': '+(role==='vp'?'nhập được phí cọc':'không nhập được phí cọc (không có quyền tiền)'),(role==='vp')===r.wrote,r);
  await o.b.close()}
 console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
