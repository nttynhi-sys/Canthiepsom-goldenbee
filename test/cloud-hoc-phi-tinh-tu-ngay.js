/* Cloud: Trưởng Trung tâm đặt thời gian tính phí của bé (k.fs, k.fe ở hồ sơ bé) -> máy chủ nhận ngày; hóa đơn đã lập (bảng tiền) được cập nhật;
   máy khác đăng nhập lại thấy học phí theo thời gian tính phí mới */
const {chromium}=require('playwright');const path=require('path');
const {makeServer}=require('./cloud-mock.js');
const URL='file://'+path.resolve(__dirname,'../src/build/page-test.html')+'?cloud';
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('PASS',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const users={'tt@gb.vn':{pw:'pw1',uid:'u-tt',role:'tt',name:'Trưởng TT',email:'tt@gb.vn'}};
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
 const P=await page.evaluate(()=>{const m=CM,k=DB.kids.find(x=>x.st==='dang'&&x.bt&&invoice(x,m)>0&&!hasFeeWin(x));
  DB.lg=DB.lg.filter(e=>!(e.hs===k.id&&e.kind==='hp'&&e.m===m));DB.lg.push({id:'eC'+uid(),hs:k.id,date:m+'-01',kind:'hp',amt:invoice(k,m),m,note:'Học phí '+mLow(m)});
  S.hp=Object.assign({tab:'cn',m,st:'',q:k.n},S.hp);S.hp.q=k.n;S.hp.tab='cn';go('hp');render();return{id:k.id,n:k.n,m,full:invoice(k,m)}});
 await sleep(1200);
 const waitFor=async f=>{for(let i=0;i<30;i++){await sleep(400);if(f())return true}return false};
 ok('máy chủ có bé và hóa đơn học phí trọn tháng trước khi sửa',!!srv.recs.get('kids|'+P.id)&&(await waitFor(()=>[...srv.mon.values()].some(r=>r.collection==='lg'&&r.data.hs===P.id&&r.data.kind==='hp'&&r.data.m===P.m&&r.data.amt===P.full))),P);
 await page.waitForSelector('#main [data-a="kfwopen"][data-v="'+P.id+'"]');await page.click('#main [data-a="kfwopen"][data-v="'+P.id+'"]');await page.waitForSelector('#kfwf');
 await page.fill('#kf-fs',P.m+'-16');await page.click('#kfwf button[type=submit]');await page.waitForSelector('[data-a="askyes"]');await page.click('[data-a="askyes"]');
 const got=await waitFor(()=>{const k=srv.recs.get('kids|'+P.id);return k&&k.data.fs===P.m+'-16'});
 ok('máy chủ nhận ngày bắt đầu tính phí ở hồ sơ bé (fs)',got,srv.recs.get('kids|'+P.id).data.fs);
 const upd=await waitFor(()=>[...srv.mon.values()].some(r=>r.collection==='lg'&&r.data.hs===P.id&&r.data.kind==='hp'&&r.data.m===P.m&&r.data.amt<P.full&&r.data.amt>0));
 ok('máy chủ nhận hóa đơn học phí đã cập nhật (nhỏ hơn trọn tháng)',upd);
 await ctx.close();
 /* máy khác: học phí dự kiến theo thời gian tính phí mới */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(2200);
 const R=await page.evaluate(id=>{const k=kidBy(id);return{fs:k.fs,inv:invoice(k,CM),raw:invoice(k,CM,true)}},P.id);
 ok('đăng nhập lại ở máy khác: bé có fs và học phí nhỏ hơn trọn tháng',R.fs===P.m+'-16'&&R.inv<R.raw&&R.inv>0,R);
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
