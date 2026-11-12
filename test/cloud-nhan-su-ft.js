/* Cloud: loại hình làm việc của nhân sự (Fulltime / Partime): cờ s.ft nằm trên hồ sơ nhân sự (records), tiền lương vẫn ở money_records;
   Trưởng Trung tâm đăng nhập thì cờ được ghi một lần cho dữ liệu cũ; đổi trong hồ sơ ghi lên máy chủ; Quản lý (không đọc được lương) thấy đúng nhóm */
const {chromium}=require('playwright');const path=require('path');
const {makeServer}=require('./cloud-mock.js');
const URL='file://'+path.resolve(__dirname,'../src/build/page-test.html')+'?cloud';
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('PASS',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const users={'tt@gb.vn':{pw:'pw1',uid:'u-tt',role:'tt',name:'Trưởng TT',email:'tt@gb.vn'},
 'huynhminhanh@goldenbee.vn':{pw:'pw1',uid:'u-ql',role:'ql',name:'Quản lý',email:'huynhminhanh@goldenbee.vn'}};
async function newPage(b,srv,errs){const ctx=await b.newContext({viewport:{width:1366,height:900}});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|net::/.test(m.text()))errs.push('CONSOLE '+m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await ctx.addInitScript(()=>{window.GB_API='https://gb.test'});await page.route('https://gb.test/api/accounts',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({accounts:[]})}));await srv.attach(page);await page.goto(URL);return{ctx,page}}
async function login(page,e,p){await page.waitForSelector('#login');await page.fill('#lg-e',e);await page.fill('#lg-p',p);await page.click('#login button[type=submit]')}
(async()=>{const b=await chromium.launch();const errs=[];
 const srv=makeServer(Object.assign({},users));
 const st=id=>srv.recs.get('staff|'+id),pay=id=>srv.mon.get('pay|'+id);
 const waitFor=async f=>{for(let i=0;i<30;i++){await sleep(400);if(f())return true}return false};
 let {ctx,page}=await newPage(b,srv,errs);
 await login(page,'tt@gb.vn','pw1');await page.waitForSelector('[data-a="csetup"]');await page.click('[data-a="csetup"][data-v="demo"]');await page.waitForSelector('.nav');
 for(let i=0;i<30&&(srv.recs.size<3000);i++)await sleep(500);await sleep(1500);
 ok('máy chủ có hồ sơ nhân sự; tiền lương nằm ở bảng tiền, không lẫn vào hồ sơ',!!st('nv04')&&st('nv04').data.pay===undefined&&!!pay('nv04')&&pay('nv04').data.mode==='buoi',{pay:st('nv04')&&st('nv04').data.pay,mon:pay('nv04')&&pay('nv04').data.mode});
 await ctx.close();

 /* 1. Trưởng Trung tâm đăng nhập lại: dữ liệu cũ chưa có cờ thì được ghi một lần */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');
 const got=await waitFor(()=>st('nv04')&&typeof st('nv04').data.ft==='boolean'&&typeof st('nv18').data.ft==='boolean');
 ok('Trưởng Trung tâm đăng nhập: cờ s.ft ghi cho dữ liệu cũ (giáo viên 1-1 nv04 = Partime, giáo viên bán trú nv18 = Fulltime)',got&&st('nv04').data.ft===false&&st('nv18').data.ft===true,{nv04:st('nv04')&&st('nv04').data.ft,nv18:st('nv18')&&st('nv18').data.ft});
 const nFt=[...srv.recs.values()].filter(r=>r.collection==='staff'&&r.data.ft===true).length,nPt=[...srv.recs.values()].filter(r=>r.collection==='staff'&&r.data.ft===false).length;
 ok('mọi nhân sự đều có cờ: Fulltime + Partime = 30',nFt+nPt===30&&nFt===12&&nPt===18,{nFt,nPt});
 ok('hồ sơ nhân sự trên máy chủ vẫn không chứa lương',[...srv.recs.values()].filter(r=>r.collection==='staff').every(r=>r.data.pay===undefined));

 /* 2. đổi nv04 sang Fulltime trong hồ sơ: máy chủ nhận cờ mới ở hồ sơ và cách tính mới ở bảng tiền */
 await page.evaluate(()=>{go('ns');render()});await sleep(200);
 await page.evaluate(()=>{ACT.nvopen('nv04');render()});await page.waitForSelector('#nvf');await sleep(100);
 await page.click('label[for="nv-ft1"]');await page.click('#nvf button[type=submit]');
 const ch=await waitFor(()=>st('nv04').data.ft===true&&pay('nv04').data.mode==='thang');
 ok('đổi sang Fulltime: hồ sơ nhận ft=true, bảng tiền nhận cách tính cố định tháng',ch,{ft:st('nv04').data.ft,mode:pay('nv04').data.mode});
 ok('đồng thời cờ chấm công đổi theo (phải chấm công)',st('nv04').data.cc===true,st('nv04').data.cc);
 await ctx.close();

 /* 3. Quản lý đăng nhập: không đọc được lương nhưng thấy đúng nhóm và số lượng */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'huynhminhanh@goldenbee.vn','pw1');await page.waitForSelector('.nav');await sleep(1800);
 await page.evaluate(()=>{go('ns');render()});await sleep(200);
 const q=await page.evaluate(()=>({canM:canMoney(),chips:[...document.querySelectorAll('#main [data-a="nsft"]')].map(c=>c.innerText.replace(/\s+/g,' ').trim()),
   hasPay:DB.staff.some(s=>s.pay&&s.pay.base>0),ft04:isFT(stBy('nv04')),ft05:isFT(stBy('nv05'))}));
 ok('Quản lý: không đọc được lương, thấy Fulltime 13 / Partime 17 sau khi nv04 đổi (đọc từ cờ s.ft trên máy chủ)',!q.canM&&!q.hasPay&&q.chips[0]==='Tất cả 30'&&q.chips[1]==='Fulltime 13'&&q.chips[2]==='Partime 17'&&q.ft04===true&&q.ft05===false,q);
 await page.click('#main [data-a="nsft"][data-v="0"]');await sleep(100);
 const pt=await page.evaluate(()=>({n:nsList0().length,ids:nsList0().map(s=>s.id)}));
 ok('Quản lý lọc Partime: 17 người, không có nv04',pt.n===17&&!pt.ids.includes('nv04'),pt);
 await ctx.close();

 /* 4. đổi lại Partime rồi Quản lý tải lại: cập nhật đúng */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(1500);
 await page.evaluate(()=>{go('ns');render()});await sleep(200);
 await page.evaluate(()=>{ACT.nvopen('nv04');render()});await page.waitForSelector('#nvf');await sleep(100);
 await page.click('label[for="nv-ft0"]');await page.click('#nvf button[type=submit]');
 ok('trả lại Partime: máy chủ nhận ft=false, cách tính theo ca, không còn chấm công',await waitFor(()=>st('nv04').data.ft===false&&pay('nv04').data.mode==='buoi'&&st('nv04').data.cc===false),{ft:st('nv04').data.ft,mode:pay('nv04').data.mode,cc:st('nv04').data.cc});
 await ctx.close();

 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
