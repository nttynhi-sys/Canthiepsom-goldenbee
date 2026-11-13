/* Cloud: một bé nhiều giáo viên (k.ts, k.tc) và giáo viên từng ca (l.gv) lưu lên máy chủ, đăng nhập lại ở máy khác vẫn đọc đúng; dữ liệu cũ chỉ có k.gv mở sửa thấy sẵn 1 giáo viên */
const {chromium}=require('playwright');const path=require('path');
const {makeServer}=require('./cloud-mock.js');
const URL='file://'+path.resolve(__dirname,'../src/build/page-test.html')+'?cloud';
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('PASS',n)}else{fail++;console.log('FAIL',n,x===undefined?'':x)}};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
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
 const kidRec=id=>srv.recs.get('kids|'+id),lessonOf=lid=>srv.recs.get('lich|'+lid);
 /* chọn một bé có ít nhất 2 ca 1-1 và một giáo viên khác rảnh đúng giờ ca đầu và ca thứ hai */
 const P=await page.evaluate(()=>{const gvs=pool11().map(s=>s.id);
  for(const k of DB.kids.filter(x=>x.st==='dang'&&DB.lich.filter(l=>l.type==='11'&&l.hs===x.id).length>=2)){
   const ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).sort((a,b)=>a.day-b.day||(a.slot<b.slot?-1:1)),g1=kTs(k)[0]||ls[0].gv;
   const g2=gvs.find(g=>g!==g1&&ls.slice(0,2).every(l=>ROOMS.some(r=>!conflict({id:l.id,day:l.day,slot:l.slot,gv:g,hs:l.hs,room:r}))));
   if(g2)return{id:k.id,g1,g2,l0:ls[0].id,l1:ls[1].id,n:ls.length,old0:ls[0].gv,old1:ls[1].gv}}
  return null});
 ok('có bé mẫu với từ 2 ca 1-1 và giáo viên thứ hai rảnh để thử',!!P,P);
 const openEdit=async()=>{await page.evaluate(id=>{S.modal={t:'hsf',id};render()},P.id);await page.waitForSelector('#hsff');await sleep(150)};
 /* 1. thêm giáo viên thứ hai kèm nội dung, giao ca đầu cho người đó, lưu */
 await openEdit();
 const r0=await page.evaluate(()=>[...document.querySelectorAll('#gvl .gvr')].map(r=>r.querySelector('select').value));
 ok('Cloud: form sửa hiện sẵn giáo viên hiện tại của bé (dữ liệu cũ chỉ có k.gv)',r0.length>=1&&r0[0]===P.g1,r0);
 await page.fill('#gvl .gvr:nth-child(1) [name=tgc]','Ngôn ngữ');
 await page.click('[data-a="gvadd"]');await sleep(60);
 await page.selectOption('#gvl .gvr:nth-child(2) select',P.g2);await page.fill('#gvl .gvr:nth-child(2) [name=tgc]','Vận động – giác quan');
 await page.evaluate(([lid,g])=>{document.querySelector('#s11 .s11r[data-lid="'+lid+'"] [name=s11gv]').value=g},[P.l0,P.g2]);
 await page.click('#hsff button[type=submit]');
 let rec;for(let i=0;i<24;i++){await sleep(400);rec=lessonOf(P.l0);if(rec&&rec.data.gv===P.g2)break}
 ok('Máy chủ nhận ca đã đổi giáo viên: cùng mã buổi, giáo viên mới',rec&&rec.data.gv===P.g2,rec&&rec.data);
 let kr;for(let i=0;i<24;i++){await sleep(400);kr=kidRec(P.id);if(kr&&Array.isArray(kr.data.ts)&&kr.data.ts.length===2)break}
 ok('Máy chủ nhận hồ sơ bé có 2 giáo viên (ts), giáo viên đầu ở gv, nội dung phụ trách (tc)',kr&&eq(kr.data.ts,[P.g1,P.g2])&&kr.data.gv===P.g1&&kr.data.tc&&kr.data.tc[P.g1]==='Ngôn ngữ'&&kr.data.tc[P.g2]==='Vận động – giác quan',kr&&kr.data);
 ok('Ca còn lại của bé vẫn do giáo viên cũ dạy, không bị đổi',!!lessonOf(P.l1)&&lessonOf(P.l1).data.gv===P.old1,lessonOf(P.l1)&&lessonOf(P.l1).data);
 await ctx.close();
 /* 2. máy khác đăng nhập lại: đọc đúng danh sách giáo viên, nội dung và giáo viên từng ca từ máy chủ */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(1500);
 const st=await page.evaluate(([id,l0])=>{const k=kidBy(id);return{ts:kTs(k),tc:k.tc,main:mainGV(k),ca:DB.lich.find(l=>l.id===l0).gv}},[P.id,P.l0]);
 ok('Đăng nhập lại: bé có đủ 2 giáo viên, nội dung phụ trách, ca đầu do giáo viên thứ hai dạy',eq(st.ts,[P.g1,P.g2])&&st.tc[P.g2]==='Vận động – giác quan'&&st.ca===P.g2&&st.main.includes(','),st);
 await openEdit();
 const r2=await page.evaluate(([l0])=>({g:[...document.querySelectorAll('#gvl .gvr')].map(r=>[r.querySelector('select').value,r.querySelector('[name=tgc]').value]),ca:document.querySelector('#s11 .s11r[data-lid="'+l0+'"] [name=s11gv]').value}),[P.l0]);
 ok('Form sửa ở máy khác hiện 2 giáo viên kèm nội dung và ca đầu chọn sẵn người thứ hai',r2.g.length===2&&r2.g[0][0]===P.g1&&r2.g[0][1]==='Ngôn ngữ'&&r2.g[1][0]===P.g2&&r2.g[1][1]==='Vận động – giác quan'&&r2.ca===P.g2,r2);
 /* 3. lưu lại không đổi gì: không ghi thừa ca nào lên máy chủ */
 await page.click('#hsff button[type=submit]');await sleep(1800);
 ok('Lưu lại không đổi gì: hồ sơ giữ nguyên 2 giáo viên và ca vẫn do người đã chọn dạy',eq(kidRec(P.id).data.ts,[P.g1,P.g2])&&lessonOf(P.l0).data.gv===P.g2,kidRec(P.id).data);
 await ctx.close();
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
