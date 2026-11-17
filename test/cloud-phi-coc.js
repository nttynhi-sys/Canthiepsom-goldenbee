/* Cloud: phí cọc của bé lưu ở bảng tiền (money_records, collection dep, khóa = mã bé), không nằm ở bảng records;
   hoàn cọc ghi ngày hoàn lên máy chủ; Quản lý không nhận được dữ liệu cọc */
const {chromium}=require('playwright');const path=require('path');
const {makeServer}=require('./cloud-mock.js');
const URL='file://'+path.resolve(__dirname,'../src/build/page-test.html')+'?cloud';
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('PASS',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let users={'tt@gb.vn':{pw:'pw1',uid:'u-tt',role:'tt',name:'Trưởng TT',email:'tt@gb.vn'}};
async function newPage(b,srv,errs){const ctx=await b.newContext({viewport:{width:1366,height:900}});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|net::/.test(m.text()))errs.push('CONSOLE '+m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await ctx.addInitScript(()=>{window.GB_API='https://gb.test'});await page.route('https://gb.test/api/accounts',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({accounts:[]})}));await srv.attach(page);await page.goto(URL);return{ctx,page}}
async function login(page,e,p){await page.waitForSelector('#login');await page.fill('#lg-e',e);await page.fill('#lg-p',p);await page.click('#login button[type=submit]')}
(async()=>{const b=await chromium.launch();const errs=[];
 {const {open}=require('./h.js');const o=await open();const em=await o.page.evaluate(()=>DB.staff.find(x=>x.role==='ql').em);await o.b.close();users[em]={pw:'pw1',uid:'u-ql',role:'ql',name:'Quản lý',email:em};users.__ql=em}
 const QL=users.__ql;delete users.__ql;
 const srv=makeServer(Object.assign({},users));
 let {ctx,page}=await newPage(b,srv,errs);
 await login(page,'tt@gb.vn','pw1');await page.waitForSelector('[data-a="csetup"]');await page.click('[data-a="csetup"][data-v="demo"]');await page.waitForSelector('.nav');
 for(let i=0;i<30&&(srv.recs.size<3000);i++)await sleep(500);await sleep(1500);
 const P=await page.evaluate(()=>{const k=DB.kids.find(x=>x.st==='dang');S.hp=Object.assign({tab:'tq',m:CM,st:'',q:k.n},S.hp);S.hp.q=k.n;S.hp.tab='tq';go('hp');render();return{id:k.id,n:k.n}});
 const waitMon=async f=>{let r;for(let i=0;i<30;i++){await sleep(400);r=srv.mon.get('dep|'+P.id);if(f(r))break}return r};
 await page.waitForSelector('#main tr:has-text("'+P.n+'") input[data-c="depamt"]');
 await page.fill('#main tr:has-text("'+P.n+'") input[data-c="depamt"]','1500000');await page.dispatchEvent('#main tr:has-text("'+P.n+'") input[data-c="depamt"]','change');
 const r1=await waitMon(r=>r&&r.data&&r.data.a===1500000);
 ok('máy chủ nhận phí cọc ở bảng tiền (money_records), khóa = mã bé, không nằm ở bảng records',!!r1&&r1.data.a===1500000&&!srv.recs.has('dep|'+P.id),r1&&r1.data);
 /* cho bé ngưng học và không nợ, rồi hoàn cọc */
 await page.evaluate(id=>{kidBy(id).st='nghi';DB.lg=DB.lg.filter(e=>e.hs!==id);render()},P.id);await sleep(500);
 await page.waitForSelector('#main tr:has-text("'+P.n+'") [data-a="deprf"]');await page.click('#main tr:has-text("'+P.n+'") [data-a="deprf"]');
 await page.waitForSelector('[data-a="askyes"]');await page.click('[data-a="askyes"]');
 const r2=await waitMon(r=>r&&r.data&&r.data.r);
 ok('máy chủ nhận ngày hoàn cọc, số tiền cọc giữ nguyên',!!r2&&/^\d{4}-\d{2}-\d{2}$/.test(r2.data.r)&&r2.data.a===1500000,r2&&r2.data);
 await ctx.close();
 /* máy khác (Trưởng TT) thấy trạng thái đã hoàn; Quản lý không nhận dữ liệu cọc */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(2200);
 const T=await page.evaluate(id=>({dep:DB.dep&&DB.dep[id]}),P.id);
 ok('đăng nhập lại: thấy cọc đã hoàn',T.dep&&T.dep.a===1500000&&!!T.dep.r,T);
 await ctx.close();
 ({ctx,page}=await newPage(b,srv,errs));await login(page,QL,'pw1');await page.waitForSelector('.nav');await sleep(2200);
 const Q=await page.evaluate(()=>({n:Object.keys(DB.dep||{}).length}));
 ok('Quản lý không nhận dữ liệu phí cọc (dữ liệu tiền)',Q.n===0,Q);
 await ctx.close();
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
