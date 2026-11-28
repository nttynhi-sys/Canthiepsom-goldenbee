/* Cloud: học đột xuất lưu ở bảng records (collection bx); máy khác nhận được; hủy thì máy chủ xóa bản ghi */
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
 await ctx.addInitScript(()=>{window.GB_API='https://gb.test'});await page.route('https://gb.test/api/accounts',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({accounts:[]})}));await srv.attach(page);await page.goto(URL);
 return{ctx,page}}
async function login(page,e,p){await page.waitForSelector('#login');await page.fill('#lg-e',e);await page.fill('#lg-p',p);await page.click('#login button[type=submit]')}
(async()=>{const b=await chromium.launch();const errs=[];
 const srv=makeServer(Object.assign({},users));
 let {ctx,page}=await newPage(b,srv,errs);
 await login(page,'tt@gb.vn','pw1');await page.waitForSelector('[data-a="csetup"]');await page.click('[data-a="csetup"][data-v="demo"]');await page.waitForSelector('.nav');
 for(let i=0;i<30&&(srv.recs.size<3000);i++)await sleep(500);await sleep(1500);
 const P=await page.evaluate(()=>{const k=DB.kids.find(x=>x.st==='dang'&&x.gr&&btHas(x,1)&&!btHas(x,6));let d=null;for(let i=1;i<40&&!d;i++){const c=addD(TODAY,i);if(dow(c)===6&&!isClosed(c))d=c}
  if(!k||!d)return null;S.dd={tab:'roll',date:d,m:d.slice(0,7),q:'',pr:'',fl:'',gv:'',kid:'',un:false};go('dd');render();return{id:k.id,d,price:kidBt(k)}});
 ok('có bé bán trú T2–T6 và một thứ Bảy sắp tới',!!P,P);
 await page.waitForSelector('[data-a="bxopen"]');await page.click('[data-a="bxopen"]');await page.waitForSelector('#bxf');
 await page.selectOption('#bx-k',P.id);await page.fill('#bx-n','Xin học thêm');await page.click('#bxf button[type=submit]');
 let r1;for(let i=0;i<30;i++){await sleep(400);r1=[...srv.recs.entries()].find(([k,v])=>k.startsWith('bx|')&&v.data&&v.data.hs===P.id&&v.data.d===P.d);if(r1)break}
 ok('máy chủ nhận ngày học đột xuất ở bảng records (collection bx), đúng bé, ngày, lớp',!!r1&&r1[1].data.gr&&r1[1].data.d===P.d,r1&&r1[1].data);
 ok('học đột xuất không phải dữ liệu tiền: không nằm ở money_records',![...srv.mon.keys()].some(k=>k.startsWith('bx|')));
 await ctx.close();
 /* máy khác thấy ngày học đột xuất, học phí tháng sau đã cộng */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(2500);
 const Q=await page.evaluate(p=>{const k=kidBy(p.id);return{has:(DB.bx||[]).some(x=>x.hs===p.id&&x.d===p.d),row:dayList(p.d).some(r=>r.kind==='bt'&&r.xk&&r.xk[p.id]),xtra:feeBreak(k,sm(p.d.slice(0,7),1)).xtra}},P);
 ok('đăng nhập máy khác: thấy ngày học đột xuất, hàng điểm danh và học phí tháng sau đã cộng',Q.has&&Q.row&&Q.xtra===P.price,Q);
 await page.evaluate(p=>{S.dd={tab:'roll',date:p.d,m:p.d.slice(0,7),q:'',pr:'',fl:'',gv:'',kid:'',un:false};go('dd');render()},P);await page.waitForSelector('[data-a="bxdel"]');
 await page.click('[data-a="bxdel"]');await page.waitForSelector('[data-a="askyes"]');await page.click('[data-a="askyes"]');
 let gone=false;for(let i=0;i<30;i++){await sleep(400);gone=![...srv.recs.entries()].some(([k,v])=>k.startsWith('bx|')&&v.data&&v.data.hs===P.id&&!v.del);if(gone)break}
 ok('hủy học đột xuất: máy chủ xóa bản ghi',gone);
 await ctx.close();
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
