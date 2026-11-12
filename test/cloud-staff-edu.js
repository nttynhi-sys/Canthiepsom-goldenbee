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
 /* Trưởng TT nhập trình độ và chứng chỉ cho một giáo viên bằng form thật */
 const id=await page.evaluate(()=>{const s=DB.staff.find(x=>x.role==='gv');S.v='ns';ACT.nvopen(s.id);render();return s.id});
 await page.waitForSelector('#nvf');
 await page.click('#nvf [data-a="edupick"][data-v="Cử nhân Ngôn ngữ trị liệu"]');
 await page.fill('#nv-cert','Chứng chỉ PECS, 2024\nChứng chỉ ESDM, 2025');
 await page.click('#nvf button[type="submit"]');
 let rec;for(let i=0;i<20;i++){await sleep(500);rec=srv.recs.get('staff|'+id);if(rec&&rec.data.edu)break}
 ok('Máy chủ nhận trình độ và chứng chỉ trong bản ghi nhân sự (bảng chung records)',rec&&rec.data.edu==='Cử nhân Ngôn ngữ trị liệu'&&rec.data.cert==='Chứng chỉ PECS, 2024\nChứng chỉ ESDM, 2025',rec&&rec.data);
 ok('Hai trường không bị đưa vào bảng tiền',![...srv.mon.values()].some(r=>JSON.stringify(r.data||{}).includes('Chứng chỉ PECS')));
 await ctx.close();
 /* máy khác đăng nhập lại: thấy đủ */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(1200);
 const r2=await page.evaluate(id=>{const s=DB.staff.find(x=>x.id===id);return{edu:s&&s.edu,cert:s&&s.cert}},id);
 ok('Đăng nhập lại ở máy khác: trình độ và chứng chỉ còn nguyên',r2.edu==='Cử nhân Ngôn ngữ trị liệu'&&r2.cert==='Chứng chỉ PECS, 2024\nChứng chỉ ESDM, 2025',r2);
 await ctx.close();
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
