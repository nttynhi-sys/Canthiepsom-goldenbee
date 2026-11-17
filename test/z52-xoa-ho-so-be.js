/* Xóa hồ sơ bé: Trưởng Trung tâm, Quản lý, Văn phòng (hành chính) bấm được trên giao diện thật; hộp xác nhận hiện lên;
   Giáo viên không có nút xóa; Văn phòng chỉ thấy danh sách và thông tin (không thấy hồ sơ chuyên môn). */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,500))}};
(async()=>{
 for(const role of ['tt','ql','vp']){
  const {b,page,errs}=await open();await login(page,role);
  const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||120);
  ok(role+': có mục Học sinh ở menu',await ev(()=>navList().includes('hs')));
  await ev(()=>{go('hs');render()});await page.waitForSelector('#main tr.k');
  const T=await ev(()=>({tabs:[...document.querySelectorAll('#main .tab')].map(e=>e.textContent.trim())}));
  if(role==='vp')ok('vp: chỉ thấy tab Danh sách học sinh (không có Buổi can thiệp, Ngân hàng mục tiêu)',T.tabs.length===1&&/Danh sách/.test(T.tabs[0]),T);
  /* 1. xóa từ nút "Xóa" ở danh sách; bấm Hủy thì giữ nguyên */
  const K=await ev(()=>{const k=DB.kids.find(x=>DB.sess.some(s=>s.k===x.id)&&DB.plans.some(p=>p.k===x.id)&&DB.lich.some(l=>l.hs===x.id));return{id:k.id,n:k.n,count:DB.kids.length,sess:DB.sess.filter(s=>s.k===k.id).length}});
  await ev(q=>{S.hs.q=q;S.pg.hs=1;render()},K.n);await page.waitForSelector('#main [data-a="hsdelk"]');
  await page.click('#main [data-a="hsdelk"] >> nth=0');await W();
  ok(role+': bấm Xóa ở danh sách thì hộp xác nhận hiện trên màn hình',await page.isVisible('[data-a="askyes"]')&&/Xóa hồ sơ của bé/.test(await page.textContent('.mdc')));
  await page.click('[data-a="askno"]');await W();
  ok(role+': bấm Hủy thì hồ sơ vẫn còn',await ev(id=>!!kidBy(id),K.id));
  await page.click('#main [data-a="hsdelk"] >> nth=0');await W();await page.click('[data-a="askyes"]');await W(200);
  const A=await ev(id=>({kid:!!kidBy(id),sess:DB.sess.filter(s=>s.k===id).length,plans:DB.plans.filter(p=>p.k===id).length,lich:DB.lich.filter(l=>l.hs===id).length,n:DB.kids.length}),K.id);
  ok(role+': xác nhận xóa: hồ sơ, buổi can thiệp, kế hoạch, lịch của bé đều mất',!A.kid&&A.sess===0&&A.plans===0&&A.lich===0&&A.n===K.count-1,A);
  /* 2. xóa từ cửa sổ hồ sơ bé (tab Thông tin) */
  const K2=await ev(()=>{const k=DB.kids[5];return{id:k.id,n:k.n}});
  await ev(id=>{S.modal={t:'hs',id,tab:'tt'};render()},K2.id);await page.waitForSelector('.mdc [data-a="hsdelk"]');
  const tabs=await ev(()=>[...document.querySelectorAll('.mdc .tab')].map(e=>e.textContent.trim()));
  if(role==='vp')ok('vp: cửa sổ hồ sơ bé chỉ có tab Thông tin',tabs.length===1&&tabs[0]==='Thông tin',tabs);
  else ok(role+': cửa sổ hồ sơ bé đủ các tab chuyên môn',tabs.length>=6,tabs);
  ok(role+': nút Sửa hồ sơ '+(role==='vp'?'không hiện (chỉ Trưởng Trung tâm, Quản lý sửa)':'hiện'),(!!await page.$('.mdc [data-a="hsedit"]'))===(role!=='vp'));
  await page.click('.mdc [data-a="hsdelk"]');await W();
  ok(role+': bấm Xóa trong hồ sơ bé: hộp xác nhận hiện, hồ sơ còn nguyên đến khi xác nhận',await page.isVisible('[data-a="askyes"]')&&await ev(id=>!!kidBy(id),K2.id));
  await page.click('[data-a="askyes"]');await W(200);
  ok(role+': xác nhận xóa từ hồ sơ bé: hồ sơ mất, cửa sổ đóng',await ev(id=>!kidBy(id)&&!S.modal,K2.id));
  ok(role+': không lỗi trình duyệt',errs.length===0,errs);
  await b.close();
 }
 /* giáo viên không có quyền xóa */
 {const {b,page,errs}=await open();await login(page,'gv');const ev=(f,a)=>page.evaluate(f,a);
  await ev(()=>{go('hs');render()});await page.waitForSelector('#main tr.k');
  ok('gv: danh sách học sinh không có nút Xóa',!(await page.$('#main [data-a="hsdelk"]')));
  const id=await ev(()=>myKids()[0].id);await ev(i=>{S.modal={t:'hs',id:i,tab:'tt'};render()},id);await page.waitForSelector('.mdc');
  ok('gv: hồ sơ bé không có nút Xóa',!(await page.$('.mdc [data-a="hsdelk"]')));
  ok('gv: gọi thẳng lệnh xóa cũng bị từ chối',await ev(i=>{const n=DB.kids.length;ACT.hsdelk(i);return DB.kids.length===n&&!(S.modal&&S.modal.t==='ask')},id));
  ok('gv: không lỗi trình duyệt',errs.length===0,errs);await b.close()}
 console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
