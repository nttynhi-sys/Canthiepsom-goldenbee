/* Cloud: Văn phòng (vp) và Quản lý (ql) xóa hồ sơ bé bằng nút trên giao diện -> máy chủ xóa bé và dữ liệu đi kèm (buổi, kế hoạch, lịch);
   quyền ghi bảng records của vp, ql không bị chặn (RLS giả lập như chính sách thật) */
const {chromium}=require('playwright');const path=require('path');
const {makeServer}=require('./cloud-mock.js');
const URL='file://'+path.resolve(__dirname,'../src/build/page-test.html')+'?cloud';
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('PASS',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let users={'tt@gb.vn':{pw:'pw1',uid:'u-tt',role:'tt',name:'Trưởng TT',email:'tt@gb.vn'}};   /* vp, ql: lấy email nhân sự thật trong dữ liệu mẫu */
async function newPage(b,srv,errs){const ctx=await b.newContext({viewport:{width:1366,height:900}});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|net::|status of 40/.test(m.text()))errs.push('CONSOLE '+m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await ctx.addInitScript(()=>{window.GB_API='https://gb.test'});await page.route('https://gb.test/api/accounts',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({accounts:[]})}));await srv.attach(page);await page.goto(URL);return{ctx,page}}
async function login(page,e,p){await page.waitForSelector('#login');await page.fill('#lg-e',e);await page.fill('#lg-p',p);await page.click('#login button[type=submit]')}
(async()=>{const b=await chromium.launch();const errs=[];
 {const {open}=require('./h.js');const o=await open();const em=await o.page.evaluate(()=>({vp:DB.staff.find(x=>x.role==='vp').em,ql:DB.staff.find(x=>x.role==='ql').em}));await o.b.close();
  users[em.vp]={pw:'pw1',uid:'u-vp',role:'vp',name:'Văn phòng',email:em.vp};users[em.ql]={pw:'pw1',uid:'u-ql',role:'ql',name:'Quản lý',email:em.ql};users.__em=em}
 const EM=users.__em;delete users.__em;
 const srv=makeServer(Object.assign({},users));
 let {ctx,page}=await newPage(b,srv,errs);
 await login(page,'tt@gb.vn','pw1');await page.waitForSelector('[data-a="csetup"]');await page.click('[data-a="csetup"][data-v="demo"]');await page.waitForSelector('.nav');
 for(let i=0;i<30&&(srv.recs.size<3000);i++)await sleep(500);await sleep(1500);await ctx.close();
 const has=(coll,f)=>[...srv.recs.values()].some(r=>r.collection===coll&&f(r.data||{}));
 const waitFor=async f=>{for(let i=0;i<30;i++){await sleep(400);if(f())return true}return false};
 for(const [em,role,id] of [[EM.vp,'vp','hs020'],[EM.ql,'ql','hs030']]){
  ({ctx,page}=await newPage(b,srv,errs));await login(page,em,'pw1');await page.waitForSelector('.nav');await sleep(2200);
  ok(role+': máy chủ có bé, buổi và kế hoạch của '+id+' trước khi xóa',!!srv.recs.get('kids|'+id)&&has('lich',d=>d.hs===id));
  await page.evaluate(()=>{go('hs');render()});await page.waitForSelector('#main tr.k');
  const nm=await page.evaluate(i=>kidBy(i).n,id);
  await page.evaluate(n=>{S.hs.q=n;S.pg.hs=1;render()},nm);await page.waitForSelector('#main [data-a="hsdelk"]');
  await page.click('#main [data-a="hsdelk"] >> nth=0');await page.waitForSelector('[data-a="askyes"]');
  ok(role+': hộp xác nhận hiện trên màn hình ở chế độ máy chủ',await page.isVisible('[data-a="askyes"]'));
  await page.click('[data-a="askyes"]');
  const gone=await waitFor(()=>!srv.recs.get('kids|'+id)&&!has('lich',d=>d.hs===id)&&!has('plans',d=>d.k===id)&&!has('sess',d=>d.k===id));
  ok(role+': máy chủ đã xóa hồ sơ '+id+' cùng lịch, kế hoạch, buổi can thiệp',gone,{kid:!!srv.recs.get('kids|'+id),lich:has('lich',d=>d.hs===id),plans:has('plans',d=>d.k===id),sess:has('sess',d=>d.k===id)});
  ok(role+': số bé trên máy chủ giảm đúng 1',[...srv.recs.keys()].filter(k=>k.startsWith('kids|')).length===(role==='vp'?99:98));
  await ctx.close()}
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
