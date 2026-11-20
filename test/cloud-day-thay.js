/* Cloud: dạy thay lưu ở bảng records (collection sub); máy khác (Quản lý) nhận được; giáo viên dạy thay thấy buổi; bỏ dạy thay xóa bản ghi */
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
 {const {open}=require('./h.js');const o=await open();const em=await o.page.evaluate(()=>DB.staff.find(x=>x.role==='ql').em);await o.b.close();users[em]={pw:'pw1',uid:'u-ql',role:'ql',name:'Quản lý',email:em};users.__ql=em}
 const QL=users.__ql;delete users.__ql;
 const srv=makeServer(Object.assign({},users));
 let {ctx,page}=await newPage(b,srv,errs);
 await login(page,'tt@gb.vn','pw1');await page.waitForSelector('[data-a="csetup"]');await page.click('[data-a="csetup"][data-v="demo"]');await page.waitForSelector('.nav');
 for(let i=0;i<30&&(srv.recs.size<3000);i++)await sleep(500);await sleep(1500);
 const P=await page.evaluate(()=>{
  for(const l of DB.lich.filter(x=>x.type==='11'&&x.day>=1&&x.day<=5&&kidBy(x.hs)&&kidBy(x.hs).st==='dang')){
   let d=addD(TODAY,1);for(let i=0;i<14&&dow(d)!==l.day;i++)d=addD(d,1);if(isClosed(d)||subOf(d,l.id))continue;
   const T2=dsTeachers().find(t=>t.id!==l.gv&&!dsWhy(t.id,d,l.slot,l.id));if(!T2)continue;
   S.ds={tab:'cv',d,all:1,q:''};go('ds');render();return{sid:l.id,d,T1:l.gv,T2:T2.id,hs:l.hs}}return null});
 ok('có buổi và giáo viên rảnh để thử',!!P,P);
 await page.waitForSelector('[data-a="dsopen"][data-v="'+P.d+'|'+P.sid+'"]');await page.click('[data-a="dsopen"][data-v="'+P.d+'|'+P.sid+'"]');await page.waitForSelector('#dsaf');
 await page.selectOption('#ds-g',P.T2);await page.fill('#ds-n','Cô nghỉ ốm');await page.click('#dsaf button[type=submit]');
 let r1;for(let i=0;i<30;i++){await sleep(400);r1=[...srv.recs.entries()].find(([k,v])=>k.startsWith('sub|')&&v.data&&v.data.sid===P.sid);if(r1)break}
 ok('máy chủ nhận bản ghi dạy thay ở bảng records (collection sub), đúng ngày, buổi, giáo viên',!!r1&&r1[1].data.d===P.d&&r1[1].data.gv===P.T2&&r1[1].data.og===P.T1,r1&&r1[1].data);
 let nt;for(let i=0;i<30;i++){await sleep(400);nt=[...srv.recs.entries()].find(([k,v])=>k.startsWith('nt|')&&v.data&&v.data.to&&v.data.to.includes(P.T2));if(nt)break}
 ok('thông báo cho giáo viên dạy thay lưu ở bảng records (collection nt), gửi riêng kèm danh sách người nhận',!!nt&&nt[1].data.aud==='nb'&&nt[1].data.t==='Phân công dạy thay',nt&&nt[1].data);
 ok('dạy thay không phải dữ liệu tiền: không nằm ở money_records',![...srv.mon.keys()].some(k=>k.startsWith('sub|')));
 await ctx.close();
 /* Quản lý thấy bản ghi, và bỏ dạy thay thì máy chủ xóa bản ghi */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,QL,'pw1');await page.waitForSelector('.nav');await sleep(2200);
 const Q=await page.evaluate(p=>({has:(DB.sub||[]).some(s=>s.sid===p.sid&&s.d===p.d&&s.gv===p.T2),eff:effGv(dsLesson(p.sid),p.d)}),P);
 ok('Quản lý ở máy khác nhận được dạy thay, buổi ngày đó do giáo viên dạy thay phụ trách',Q.has&&Q.eff===P.T2,Q);
 await page.evaluate(p=>{S.ds={tab:'cv',d:p.d,all:1,q:''};go('ds');render()},P);await page.waitForSelector('[data-a="dsdel"]');
 await page.click('[data-a="dsdel"][data-v="'+P.d+'|'+P.sid+'"]');await page.waitForSelector('[data-a="askyes"]');await page.click('[data-a="askyes"]');
 let gone=false;for(let i=0;i<30;i++){await sleep(400);gone=![...srv.recs.entries()].some(([k,v])=>k.startsWith('sub|')&&v.data&&v.data.sid===P.sid&&!v.del);if(gone)break}
 ok('bỏ dạy thay: máy chủ xóa bản ghi',gone);
 await ctx.close();
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
