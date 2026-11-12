/* Cloud: xóa hồ sơ bé -> máy chủ nhận số hiển thị (kids.no) đã dồn, khóa nội bộ không đổi; đăng nhập lại ở máy khác vẫn thấy mã đúng;
   nút "Sắp xếp lại mã" ghi lên máy chủ; bé phía trước không bị ghi gì thêm */
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
 let {ctx,page}=await newPage(b,srv,errs);
 await login(page,'tt@gb.vn','pw1');await page.waitForSelector('[data-a="csetup"]');await page.click('[data-a="csetup"][data-v="demo"]');await page.waitForSelector('.nav');
 for(let i=0;i<30&&(srv.recs.size<3000);i++)await sleep(500);await sleep(1500);
 const kid=id=>srv.recs.get('kids|'+id);
 const waitFor=async(f)=>{for(let i=0;i<30;i++){await sleep(400);if(f())return true}return false};
 ok('máy chủ có đủ 100 bé mẫu, chưa bé nào có số hiển thị riêng',kid('hs010')&&kid('hs100')&&kid('hs011').data.no===undefined);

 /* 1. xóa bé ở giữa: máy chủ bỏ bé đó, các bé sau nhận số hiển thị đã dồn, bé trước không bị ghi thêm gì */
 await page.evaluate(()=>{ACT.hsdelk('hs010');render()});await sleep(80);
 await page.evaluate(()=>{ACT.askyes();render()});
 const got=await waitFor(()=>!kid('hs010')&&kid('hs100')&&kid('hs100').data.no===99);
 ok('máy chủ đã xóa hs010 và dồn: hs011 -> 10, hs100 -> 99',got&&kid('hs011').data.no===10&&kid('hs100').data.no===99&&!kid('hs010'),{h11:kid('hs011')&&kid('hs011').data.no,h100:kid('hs100')&&kid('hs100').data.no});
 ok('bé phía trước không bị ghi số hiển thị (hs009 vẫn không có no)',kid('hs009').data.no===undefined);
 ok('khóa nội bộ không đổi trên máy chủ: vẫn là hs011..hs100, không có mã mới nào',[...srv.recs.keys()].filter(k=>k.startsWith('kids|')).length===99&&kid('hs011').data.id==='hs011');
 /* dữ liệu nối theo khóa vẫn còn nguyên: buổi học của hs011 còn trên máy chủ */
 ok('buổi học của bé dồn mã (hs011) vẫn nằm trên máy chủ, gắn đúng bé',[...srv.recs.values()].some(r=>r.collection==='lich'&&r.data&&r.data.hs==='hs011'));
 await ctx.close();

 /* 2. máy khác đăng nhập lại: mã hiển thị đúng ngay từ máy chủ */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(1800);
 const c1=await page.evaluate(()=>({n:DB.kids.length,c11:kcode(kidBy('hs011')),c100:kcode(kidBy('hs100')),c9:kcode(kidBy('hs009')),plan:kidRenumPlan().length}));
 ok('đăng nhập lại: 99 bé, hs011 hiện HS10-BT, hs100 hiện HS99-BT, hs009 vẫn HS09-CN, không còn gì phải sắp xếp',c1.n===99&&c1.c11==='HS10-BT'&&c1.c100==='HS99-BT'&&c1.c9==='HS09-CN'&&c1.plan===0,c1);

 /* 3. tạo chỗ đứt quãng rồi bấm nút: máy chủ nhận đủ số mới */
 await page.evaluate(()=>{go('hs');render();DB.kids=DB.kids.filter(k=>!['hs001','hs002'].includes(k.id));S.hs.q='';S.hs.st='';render()});
 await waitFor(()=>!kid('hs001')&&!kid('hs002'));
 const had=await page.evaluate(()=>kidRenumPlan().length);
 ok('mất hs001, hs002: còn nút sắp xếp lại và có bé cần đổi số',had>=1&&await page.evaluate(()=>!!document.querySelector('#main [data-a="krenopen"]')),had);
 await page.click('#main [data-a="krenopen"]');await page.waitForSelector('.mdc');await page.click('.mdc [data-a="krenyes"]');
 const done=await waitFor(()=>kid('hs003')&&kid('hs003').data.no===1);
 ok('máy chủ nhận số mới: hs003 -> 1, hs004 -> 2',done&&kid('hs004').data.no===2,{h3:kid('hs003').data.no,h4:kid('hs004').data.no});
 const allNos=[...srv.recs.values()].filter(r=>r.collection==='kids').map(r=>r.data.no||(+String(r.id).replace(/\D/g,''))).sort((a,b)=>a-b);
 ok('trên máy chủ, số hiển thị của mọi bé liên tục 1..97 và không trùng',allNos.length===97&&allNos.every((n,i)=>n===i+1),allNos.slice(0,5));
 await ctx.close();

 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
