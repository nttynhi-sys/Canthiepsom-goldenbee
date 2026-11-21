/* Cloud: số trừ phí dư nhập tay lưu ở bảng tiền (money_records: set và lg), máy khác nhận được, về tự động thì xóa */
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
 const P=await page.evaluate(()=>{const m=CM,pm=sm(CM,-1);
  for(const k of DB.kids.filter(x=>x.st==='dang')){if(!(feeBreak(k,m).gross>0)||DB.set[k.id+'|'+pm])continue;
   S.hp={tab:'hd',m:CM,st:'',q:'',gq:kcode(k),gm:m};S.pg.hpg=1;go('hp');render();return{id:k.id,m,pm}}return null});
 ok('có bé để thử',!!P,P);
 const sel='#main input[data-c="surv"][data-v="'+P.id+'|'+P.m+'"]';
 await page.waitForSelector(sel);await page.fill(sel,'1500000');await page.dispatchEvent(sel,'change');
 let s1,l1;for(let i=0;i<40;i++){await sleep(400);s1=srv.mon.get('set|'+P.id+'|'+P.pm);l1=[...srv.mon.entries()].find(([k,v])=>k.startsWith('lg|')&&v.data&&v.data.hs===P.id&&v.data.kind==='hoan'&&v.data.m===P.m&&v.data.src===P.id+'|'+P.pm);if(s1&&l1)break}
 ok('máy chủ nhận số trừ phí dư nhập tay ở bảng tiền (set), đánh dấu man, đúng số tiền',!!s1&&s1.data.man===1&&s1.data.amt===1500000,s1&&s1.data);
 ok('máy chủ nhận khoản hoàn trong sổ công nợ (lg) tương ứng',!!l1&&l1[1].data.amt===1500000&&l1[1].data.man===1,l1&&l1[1].data);
 ok('không nằm ở bảng records (dữ liệu tiền)',![...srv.recs.keys()].some(k=>k.startsWith('set|'+P.id+'|')));
 await ctx.close();
 /* máy khác thấy số nhập tay */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(2500);
 const Q=await page.evaluate(p=>{const f=feeBreak(kidBy(p.id),p.m);return{sur:f.sur,posted:f.posted,man:!!(DB.set[p.id+'|'+p.pm]||{}).man}},P);
 ok('đăng nhập máy khác: học phí tháng này đã trừ đúng số nhập tay',Q.sur===1500000&&Q.posted&&Q.man,Q);
 /* về tự động */
 await page.evaluate(p=>{S.hp={tab:'hd',m:CM,st:'',q:'',gq:kcode(kidBy(p.id)),gm:p.m};S.pg.hpg=1;go('hp');render()},P);
 await page.waitForSelector('[data-a="surauto"][data-v="'+P.id+'|'+P.m+'"]');await page.click('[data-a="surauto"][data-v="'+P.id+'|'+P.m+'"]');
 let gone=false;for(let i=0;i<40;i++){await sleep(400);gone=!srv.mon.get('set|'+P.id+'|'+P.pm)&&![...srv.mon.entries()].some(([k,v])=>k.startsWith('lg|')&&v.data&&v.data.hs===P.id&&v.data.kind==='hoan'&&v.data.m===P.m&&v.data.src===P.id+'|'+P.pm&&!v.del);if(gone)break}
 ok('về tự động: máy chủ xóa số nhập tay và khoản hoàn tương ứng',gone);
 await ctx.close();
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
