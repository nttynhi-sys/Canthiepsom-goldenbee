const {chromium}=require('playwright');const path=require('path');
const {makeServer}=require('./cloud-mock.js');
const URL='file://'+path.resolve(__dirname,'../src/build/page-test.html')+'?cloud';
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('PASS',n)}else{fail++;console.log('FAIL',n,x===undefined?'':x)}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const users={'tt@gb.vn':{pw:'pw1',uid:'u-tt',role:'tt',name:'Trưởng TT',email:'tt@gb.vn'},
 'huynhminhanh@goldenbee.vn':{pw:'pw1',uid:'u-ql',role:'ql',name:'Quản lý',email:'huynhminhanh@goldenbee.vn'},
 'vp@gb.vn':{pw:'pw1',uid:'u-vp',role:'vp',name:'VP',email:'vp@gb.vn'},
 'ph@gb.vn':{pw:'pw1',uid:'u-ph',role:'ph',name:'PH',email:'ph@gb.vn'},
 'noprofile@gb.vn':{pw:'pw1',uid:'u-no',role:'zz',name:'X',email:'noprofile@gb.vn'}};
async function newPage(b,srv,errs,storage){const ctx=await b.newContext({viewport:{width:1366,height:900},acceptDownloads:true});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|net::/.test(m.text()))errs.push('CONSOLE '+m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await ctx.addInitScript(()=>{window.GB_API='https://gb.test'});await page.route('https://gb.test/api/accounts',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({accounts:[]})}));await srv.attach(page);await page.goto(URL);return{ctx,page}}
async function login(page,e,p){await page.waitForSelector('#login');await page.fill('#lg-e',e);await page.fill('#lg-p',p);await page.click('#login button[type=submit]')}
(async()=>{const b=await chromium.launch();const errs=[];
 const srv=makeServer(Object.assign({},users));
 let {ctx,page}=await newPage(b,srv,errs);
 await login(page,'tt@gb.vn','pw1');await page.waitForSelector('[data-a="csetup"]');await page.click('[data-a="csetup"][data-v="demo"]');await page.waitForSelector('.nav');
 for(let i=0;i<30&&(srv.recs.size<3000);i++)await sleep(500);await sleep(1500);
 /* chọn một bé có bán trú và ít nhất 2 ca 1-1 trong dữ liệu mẫu; tìm khung giờ trống cho ca đầu */
 const P=await page.evaluate(()=>{const k=DB.kids.find(x=>x.st==='dang'&&x.bt&&DB.lich.filter(l=>l.type==='11'&&l.hs===x.id).length>=3);if(!k)return null;
  const ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).sort((a,b)=>a.day-b.day||(a.slot<b.slot?-1:1)),l0=ls[0],l1=ls[1];
  const fr=(l,s)=>ROOMS.some(r=>!conflict({id:l.id,day:l.day,slot:s,gv:l.gv,hs:l.hs,room:r})),pick=l=>[...SLOTS].reverse().find(s=>s!==l.slot&&fr(l,s)&&ls.filter(o=>o.id!==l.id&&o.day===l.day).every(o=>Math.abs(tmin(o.slot)-tmin(s))>=SLOT_MIN));
  return{id:k.id,n:ls.length,l0:{id:l0.id,day:l0.day,slot:l0.slot,lt:l0.lt||''},l1:{id:l1.id},new0:pick(l0)}});
 ok('có bé mẫu bán trú với từ 3 ca 1-1 để thử',!!P&&!!P.new0,P);
 const lessonOf=lid=>srv.recs.get('lich|'+lid);
 const openEdit=async()=>{await page.evaluate(id=>{S.modal={t:'hsf',id};render()},P.id);await page.waitForSelector('#hsff');await sleep(150)};
 /* 1. mở form sửa: các ca đã lưu hiện sẵn từ dữ liệu máy chủ */
 await openEdit();
 const u=await page.evaluate(()=>({rows:[...document.querySelectorAll('#s11 .s11r')].map(r=>[r.dataset.lid,+r.querySelector('[name=s11day]').value,r.querySelector('[name=s11tm]').value]),h11:document.querySelector('#hsff').elements.h11.checked,bt:document.querySelector('#hsff').elements.hbt.checked,d11:[...document.querySelectorAll('#s11d input[data-s11w]')].filter(c=>c.checked).length}));
 ok('Chế độ cloud: form sửa hiện sẵn tất cả ca 1-1, hai hình thức tích sẵn, nút ngày 1-1 bật',u.rows.length===P.n&&u.h11&&u.bt&&u.d11>=1,u);
 /* 2. đổi giờ ca đầu rồi lưu: máy chủ nhận đúng buổi đó với giờ mới */
 await page.evaluate(s=>{document.querySelector('#s11 .s11r').querySelector('[name=s11tm]').value=s},P.new0);
 await page.click('#hsff button[type=submit]');
 let rec;for(let i=0;i<24;i++){await sleep(400);rec=lessonOf(P.l0.id);if(rec&&rec.data.slot===P.new0)break}
 ok('Máy chủ nhận ca đã sửa: cùng mã buổi, giờ mới, giữ loại và giáo viên',rec&&rec.data.slot===P.new0&&rec.data.day===P.l0.day&&(rec.data.lt||'')===P.l0.lt,rec&&rec.data);
 /* 3. bấm Xóa ca ở ca thứ hai rồi lưu: máy chủ không còn buổi đó, ca khác còn */
 await openEdit();
 await page.evaluate(lid=>{document.querySelector('#s11 .s11r[data-lid="'+lid+'"] [data-a="s11del"]').click()},P.l1.id);
 await page.click('#hsff button[type=submit]');
 for(let i=0;i<24;i++){await sleep(400);if(!lessonOf(P.l1.id))break}
 ok('Máy chủ đã xóa đúng ca được chọn Xóa ca, các ca khác còn',!lessonOf(P.l1.id)&&!!lessonOf(P.l0.id),{has1:!!lessonOf(P.l1.id),has0:!!lessonOf(P.l0.id)});
 await ctx.close();
 /* 4. máy khác đăng nhập lại: form sửa hiện đúng dữ liệu mới từ máy chủ */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(1500);
 await openEdit();
 const r2=await page.evaluate(()=>[...document.querySelectorAll('#s11 .s11r')].map(r=>[r.dataset.lid,r.querySelector('[name=s11tm]').value]));
 ok('Đăng nhập lại ở máy khác: form sửa hiện số ca mới (đã bớt 1) và giờ đã đổi',r2.length===P.n-1&&r2.some(x=>x[0]===P.l0.id&&x[1]===P.new0)&&!r2.some(x=>x[0]===P.l1.id),r2);
 await ctx.close();
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
