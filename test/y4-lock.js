/* Yêu cầu 4: phụ huynh chưa đóng học phí sau ngày 10 hàng tháng bị khóa cổng; chỉ Quản lý, Văn phòng, Trưởng Trung tâm mở khóa (bản demo) */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
const sw=async(page,r)=>{await page.selectOption('#demo-role',r);await page.waitForSelector('.nav,.plg');await page.waitForTimeout(40)};
const main=page=>page.evaluate(()=>(document.querySelector('#main')||document.querySelector('#app')).innerText);
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 await login(page,'tt');

 /* ---------- 1. quy tắc tính khóa (hàm thuần, ngày cố định) ---------- */
 const R=await ev(()=>{const e=(kind,amt,m)=>({kind,amt,m,date:m+'-01'}),L=lkCalc;return{
  due:[lkDue('2026-11-01'),lkDue('2026-11-10'),lkDue('2026-11-11'),lkDue('2027-01-05')],
  n10:[lkNext10('2026-11-03'),lkNext10('2026-11-10'),lkNext10('2026-11-11'),lkNext10('2026-12-20')],
  a:L([e('hp',380000,'2026-10')],'2026-11-09',null).locked,
  b:[L([e('hp',380000,'2026-11')],'2026-11-10',null).overdue,L([e('hp',380000,'2026-11')],'2026-11-11',null).locked],
  c:L([e('hp',380000,'2026-10'),e('thu',380000,'2026-10')],'2026-11-20',null).overdue,
  d:L([e('hp',380000,'2026-10'),e('thu',200000,'2026-10')],'2026-11-20',null).amt,
  e:L([e('hp',380000,'2026-10'),e('thu',379500,'2026-10')],'2026-11-20',null).overdue,
  f:L([e('hp',400000,'2026-11'),e('hoan',100000,'2026-12'),e('gg',100000,'2026-11'),e('thu',200000,'2026-11')],'2026-11-15',null).overdue,
  g:L([e('hp',380000,'2026-10'),e('thu',800000,'2026-10'),e('hp',380000,'2026-11')],'2026-11-15',null).overdue,
  h:L([e('hp',380000,'2026-10'),e('thu',380000,'2026-10'),e('hp',380000,'2026-12')],'2026-11-15',null).overdue,
  i:[L([e('hp',1e5,'2026-10')],'2026-11-12',{until:'2026-11-12'}).unlocked,L([e('hp',1e5,'2026-10')],'2026-11-13',{until:'2026-11-12'}).locked],
  j:L([e('hp',1e5,'2026-10')],'2026-11-12',{until:'abc'}).locked,
  k:L([{kind:'x',amt:5e6,m:'2026-10'},e('hp',-5,'2026-10'),{}],'2026-11-20',null).overdue}});
 ok('hạn: ngày 1–10 tính đến tháng trước, từ ngày 11 tính cả tháng này',R.due.join()==='2026-10,2026-10,2026-11,2026-12',R.due);
 ok('mặc định mở khóa đến ngày 10 sắp tới',R.n10.join()==='2026-11-10,2026-11-10,2026-12-10,2027-01-10',R.n10);
 ok('học phí tháng 10 chưa đóng, ngày 9/11 → khóa',R.a===true);
 ok('học phí tháng 11 chưa quá hạn đến hết 10/11, sang 11/11 thì khóa',R.b[0]===false&&R.b[1]===true,R.b);
 ok('đã đóng đủ thì không khóa',R.c===false);
 ok('đóng một phần vẫn khóa, số tiền là phần còn thiếu',R.d===180000,R.d);
 ok('thiếu dưới 1.000 ₫ không khóa',R.e===false);
 ok('hoàn phí và giảm giá được trừ',R.f===false);
 ok('tiền thu dư tháng trước bù cho tháng sau',R.g===false);
 ok('học phí tháng sau chưa đến hạn không làm khóa',R.h===false);
 ok('mở khóa tạm hết hiệu lực sau ngày đã chọn',R.i[0]===true&&R.i[1]===true,R.i);
 ok('ngày mở khóa hỏng không có tác dụng; dòng sổ lạ bỏ qua',R.j===true&&R.k===false);

 /* ---------- 2. dựng tình huống thật trong dữ liệu mẫu ---------- */
 const S0=await ev(()=>{
  const k=DB.kids.find(x=>x.st==='dang'&&x.m11>0&&x.bt),key=pkeyOf(k),ids=DB.kids.filter(x=>pkeyOf(x)===key).map(x=>x.id),due=lkDue(TODAY);
  DB.lg=DB.lg.filter(e=>!ids.includes(e.hs));
  DB.lg.push({id:'eL1',hs:k.id,date:due+'-01',kind:'hp',amt:380000,m:due,note:'Học phí thử'});
  DB.pul={};
  // các phụ huynh khác: xóa nợ quá hạn để chỉ còn một phụ huynh bị khóa
  DB.kids.forEach(x=>{const kk=pkeyOf(x);if(kk&&kk!==key){const id2=DB.kids.filter(y=>pkeyOf(y)===kk).map(y=>y.id);const l=lkCalc(DB.lg.filter(e=>id2.includes(e.hs)),TODAY,null);if(l.overdue)DB.lg.push({id:'eP'+kk,hs:x.id,date:TODAY,kind:'thu',amt:l.amt,m:due,note:'bù'})}});
  render();
  return{key,name:k.pn,kid:k.n,due,locked:phLockOf(key).locked,rows:plRowsLocal().map(r=>r.key),ids}});
 ok('phụ huynh thử bị khóa; chỉ phụ huynh đó nằm trong danh sách quá hạn',S0.locked&&S0.rows.join()===S0.key,S0);

 /* ---------- 3. nhân viên thấy danh sách ---------- */
 let t=await main(page);
 ok('Trưởng Trung tâm: dashboard có thẻ "Cổng phụ huynh quá hạn học phí", tên phụ huynh, "Đang khóa", số tiền',/Cổng phụ huynh quá hạn học phí/.test(t)&&t.includes(S0.name)&&/Đang khóa/.test(t)&&/380\.000/.test(t),t.slice(0,400));
 await sw(page,'vp');t=await main(page);
 ok('Văn phòng: thấy thẻ, số tiền, nút Mở khóa',/Cổng phụ huynh quá hạn học phí/.test(t)&&/380\.000/.test(t)&&!!(await page.$('[data-a="plopen"]')));
 await ev(()=>{S.v='hp';S.hp=Object.assign(S.hp||{},{tab:'tq'});render()});t=await main(page);
 ok('Văn phòng: tab Công nợ cũng có danh sách khóa',/Cổng phụ huynh quá hạn học phí/.test(t)&&!!(await page.$('#plock [data-a="plopen"]')));
 await sw(page,'ql');t=await main(page);
 ok('Quản lý: thấy ai bị khóa và mở khóa được, nhưng không thấy số tiền',/Cổng phụ huynh quá hạn học phí/.test(t)&&t.includes(S0.name)&&!/380\.000/.test(t)&&!!(await page.$('[data-a="plopen"]')),t.slice(0,300));
 await sw(page,'gv');t=await main(page);
 ok('Giáo viên: không thấy thẻ khóa cổng',!/Cổng phụ huynh quá hạn học phí/.test(t)&&!(await page.$('[data-a="plopen"]')));
 const gvTry=await ev(k=>{const a=ACT.plopen(k);const b=ACT.plrelock(k);FORM.plf({elements:{until:{value:lkNext10(TODAY)},note:{value:''}}});return{open:a,relock:b,modal:S.modal,pul:Object.keys(DB.pul||{}).length}},S0.key);
 ok('Giáo viên gọi thẳng thao tác mở khóa cũng bị từ chối',gvTry.open===false&&gvTry.relock===false&&gvTry.pul===0,gvTry);

 /* ---------- 4. phụ huynh bị khóa thấy màn hình khóa ---------- */
 await ev(k=>{setUser(findAccount(k));render()},S0.key);
 await page.waitForSelector('.plg');
 t=await main(page);
 ok('phụ huynh bị khóa: màn hình khóa có tiêu đề, số tiền, hướng dẫn, nút kiểm tra lại và đăng xuất',/Cổng phụ huynh đang tạm khóa/.test(t)&&/380\.000/.test(t)&&/sau hạn ngày 10/.test(t)&&/Kiểm tra lại/.test(t)&&/Đăng xuất/.test(t),t);
 ok('màn hình khóa có số điện thoại Trung tâm',t.includes('0793502567'));
 ok('màn hình khóa không lộ dữ liệu của bé và không có menu',!t.includes(S0.kid)&&!(await page.$('.nav'))&&!(await page.$('#main')));
 const lkf=await ev(()=>{const e=document.querySelector('.plg-big'),a=document.querySelector('.plg-amt b'),p=document.querySelector('.lgc.plg');return{big:parseFloat(getComputedStyle(e).fontSize),amt:parseFloat(getComputedStyle(a).fontSize),body:parseFloat(getComputedStyle(p).fontSize)}});
 ok('chữ trên màn hình khóa lớn (thân 18px, tiêu đề 20px, số tiền 34px)',lkf.body>=18&&lkf.big>=20&&lkf.amt>=32,lkf);
 await page.screenshot({path:'/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/lock-desktop.png'});
 await page.click('[data-a="lockchk"]');await page.waitForTimeout(60);
 ok('"Kiểm tra lại" khi vẫn quá hạn: vẫn ở màn hình khóa',!!(await page.$('.plg')));

 /* ---------- 5. nhân viên mở khóa tạm ---------- */
 await ev(()=>{setUser(demoAcc('tt'));render()});await page.waitForSelector('.nav');
 await page.click(`#plock [data-a="plopen"]`);await page.waitForSelector('#plf');
 const dv=await page.inputValue('#pl-d');
 ok('hộp mở khóa: mặc định đến ngày 10 sắp tới, có ghi chú',dv===(await ev(()=>lkNext10(TODAY)))&&!!(await page.$('#pl-n')),dv);
 await page.fill('#pl-n','Hẹn đóng ngày 12');
 await page.click('#plf button[type=submit]');await page.waitForTimeout(80);
 const P1=await ev(k=>({pul:DB.pul[k],locked:phLockOf(k).locked,un:phLockOf(k).unlocked}),S0.key);
 ok('mở khóa: lưu ngày, người mở, vai trò, ghi chú',P1.pul&&P1.pul.until===dv&&P1.pul.by&&P1.pul.role==='tt'&&P1.pul.note==='Hẹn đóng ngày 12'&&!P1.locked&&P1.un,P1);
 t=await main(page);
 ok('danh sách hiện "Đã mở khóa" kèm ngày và người mở, có nút Khóa lại',/Đã mở khóa/.test(t)&&/bởi/.test(t)&&!!(await page.$('[data-a="plrelock"]')),t.slice(0,500));
 await ev(k=>{setUser(findAccount(k));render()},S0.key);await page.waitForSelector('.nav,.plg');
 ok('phụ huynh được mở khóa vào được cổng, thấy bé của mình',!(await page.$('.plg'))&&(await main(page)).includes(S0.kid));
  await ev(()=>{setUser(demoAcc('vp'));render()});await page.waitForSelector('.nav');
 ok('Văn phòng (đang mở khóa tạm) có thể khóa lại',await ev(k=>{const before=!!DB.pul[k];ACT.plrelock(k);const r=before&&!!S.modal&&S.modal.t==='ask';render();return r},S0.key));
 await page.click('[data-a="askyes"]');await page.waitForTimeout(80);
 ok('khóa lại: xóa bản ghi mở khóa, phụ huynh bị khóa trở lại',await ev(k=>!DB.pul[k]&&phLockOf(k).locked,S0.key));

 /* ---------- 6. ghi nhận thu đủ thì tự mở, không cần mở khóa ---------- */
 const P2=await ev(S=>{const k=S.ids[0];DB.lg.push({id:'eL2',hs:k,date:TODAY,kind:'thu',amt:380000,m:S.due,note:'Thu đủ'});return{locked:phLockOf(S.key).locked,over:phLockOf(S.key).overdue,rows:plRowsLocal().length}},S0);
 ok('ghi nhận thu đủ: tự hết quá hạn, rời danh sách',!P2.locked&&!P2.over&&P2.rows===0,P2);
 await ev(k=>{setUser(findAccount(k));render()},S0.key);await page.waitForSelector('.nav,.plg');
 ok('phụ huynh đã đóng đủ: vào cổng bình thường',!(await page.$('.plg'))&&!!(await page.$('.nav')));

 /* ---------- 7. vào nhanh vai trò Phụ huynh ưu tiên phụ huynh không bị khóa ---------- */
 await ev(()=>{setUser(null);render()});
 const pick=await ev(()=>{const k1=DB.kids.find(x=>x.st==='dang'&&x.m11>0&&x.bt);const key1=pkeyOf(k1),ids=DB.kids.filter(x=>pkeyOf(x)===key1).map(x=>x.id);
  DB.lg=DB.lg.filter(e=>!ids.includes(e.hs));DB.lg.push({id:'eL3',hs:k1.id,date:'2020-01-01',kind:'hp',amt:500000,m:lkDue(TODAY),note:'nợ'});
  const a=demoAcc('ph');return{lockedFirst:phLockOf(key1).locked,picked:a&&a.pkey,key1,pickedLocked:a&&phLockOf(a.pkey).locked}});
 ok('"Phụ huynh" xem thử không rơi vào tài khoản đang bị khóa khi còn tài khoản khác',pick.lockedFirst&&pick.picked&&pick.picked!==pick.key1&&!pick.pickedLocked,pick);

 /* ---------- 8. lưu và nâng cấp dữ liệu ---------- */
 await ev(()=>{setUser(demoAcc('tt'));DB.pul={'x@y.vn':{k:'x@y.vn',until:'2099-01-01',by:'Thử'}};save()});
 await page.reload();await page.waitForSelector('.nav,.lg');if(await page.$('.lg'))await login(page,'tt');
 ok('dữ liệu mở khóa còn nguyên sau khi tải lại trang',(await ev(()=>DB.pul['x@y.vn']&&DB.pul['x@y.vn'].by))==='Thử');
 const mg=await ev(()=>{const d=JSON.parse(JSON.stringify(DB));delete d.pul;delete d.hol;d.v=5;migrate6(d);const r={v:d.v,pul:d.pul&&!Array.isArray(d.pul)&&Object.keys(d.pul).length===0};const d2=JSON.parse(JSON.stringify(DB));d2.v=5;d2.pul=[];d2.hol=[];migrate6(d2);r.fixArr=!Array.isArray(d2.pul);DB=JSON.parse(JSON.stringify(window.__keep||DB));return r});
 ok('nâng cấp bản 5 lên 6 tạo danh sách mở khóa rỗng, sửa dữ liệu hỏng',mg.v===6&&mg.pul&&mg.fixArr,mg);

 /* ---------- 9. màn hình điện thoại ---------- */
 await page.setViewportSize({width:390,height:844});
 await ev(()=>{const k=DB.kids.find(x=>x.st==='dang'),key=pkeyOf(k),ids=DB.kids.filter(x=>pkeyOf(x)===key).map(x=>x.id);DB.pul={};DB.lg=DB.lg.filter(e=>!ids.includes(e.hs));DB.lg.push({id:'eL9',hs:k.id,date:'2020-01-01',kind:'hp',amt:1234000,m:lkDue(TODAY),note:'nợ'});setUser(findAccount(key));render()});
 await page.waitForSelector('.plg');
 const ov=await ev(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
 ok('màn hình khóa trên điện thoại 390px không tràn ngang',ov.sw<=ov.cw+1,ov);
 await page.screenshot({path:'/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/lock-phone.png'});

 ok('không có lỗi script',errs.length===0,errs);
 console.log(`\n${passes} đạt, ${fails} lỗi`);await b.close();process.exit(fails?1:0)})().catch(e=>{console.error('CRASH',e);process.exit(2)});
