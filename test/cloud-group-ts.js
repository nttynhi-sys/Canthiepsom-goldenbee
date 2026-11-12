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
 /* Trưởng TT vào Phân công → Nhóm bán trú, chọn 3 giáo viên cho Ong non bằng ô tích thật */
 const ids=await page.evaluate(()=>{const base=DB.staff.find(s=>s.role==='gv'&&s.st==='dang');
  ['nvt1','nvt2','nvt3'].forEach((id,i)=>DB.staff.push(Object.assign(JSON.parse(JSON.stringify(base)),{id,n:'Cô Bán Trú '+(i+1),pos:'Giáo viên bán trú',em:'bt'+i+'@x.vn'})));
  go('pc');S.pc=Object.assign(S.pc||{},{tab:'bt'});render();return grTs(DB.groups[0])});
 for(let i=0;i<20;i++){await sleep(400);if(srv.recs.get('staff|nvt3'))break}
 await page.waitForSelector('[data-c="pcts"][data-k="G1|nvt1"]');
 for(const id of ids){await page.uncheck('[data-c="pcts"][data-k="G1|'+id+'"]');await sleep(150)}
 for(const id of ['nvt1','nvt2','nvt3']){await page.check('[data-c="pcts"][data-k="G1|'+id+'"]');await sleep(150)}
 let rec;for(let i=0;i<24;i++){await sleep(500);rec=srv.recs.get('groups|G1');if(rec&&Array.isArray(rec.data.ts)&&rec.data.ts.length===3)break}
 ok('Máy chủ nhận danh sách 3 giáo viên của Ong non (bảng chung records, collection groups)',rec&&JSON.stringify(rec.data.ts)==='["nvt1","nvt2","nvt3"]',rec&&rec.data);
 ok('Bản sao gv, tg cho bản cũ có đủ hai người đầu',rec&&rec.data.gv==='nvt1'&&rec.data.tg==='nvt2',rec&&rec.data);
 ok('Danh sách giáo viên lớp không đi vào bảng tiền',![...srv.mon.values()].some(r=>JSON.stringify(r.data||{}).includes('nvt3')));
 await ctx.close();
 /* máy khác đăng nhập lại: thấy đủ 3 giáo viên, ô tích đúng */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(1200);
 const r2=await page.evaluate(()=>{go('pc');S.pc=Object.assign(S.pc||{},{tab:'bt'});render();return{ts:grTs(DB.groups[0]),on:[...document.querySelectorAll('[data-c="pcts"][data-k^="G1|"]')].filter(x=>x.checked).map(x=>x.dataset.k.split('|')[1])}});
 ok('Đăng nhập lại ở máy khác: Ong non còn đủ 3 giáo viên, 3 ô tích đúng',JSON.stringify(r2.ts)==='["nvt1","nvt2","nvt3"]'&&JSON.stringify(r2.on.sort())==='["nvt1","nvt2","nvt3"]',r2);
 await ctx.close();
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
