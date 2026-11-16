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
 /* Giá bán trú riêng ở chế độ cloud: lưu vào bảng tiền (money_records, collection kpr), máy khác thấy, Quản lý không nhận được */
 const P=await page.evaluate(()=>{const nm=sm(CM,1),K=DB.kids.find(k=>k.st==='dang'&&k.bt&&k.sd.slice(0,7)<=nm&&sched(k,nm).some(x=>x.kind==='bt'));
  return{K:K.id,name:K.n,nm,n:sched(K,nm).filter(x=>x.kind==='bt').length,base:invoice(K,nm),P:DB.cfg.pbtDay,kpr:Object.keys(DB.kpr).length}});
 ok('có bé bán trú để thử và chưa ai có giá riêng',!!P.K&&P.n>0&&P.kpr===0,P);
 const waitRec=async(f)=>{let r;for(let i=0;i<30;i++){await sleep(400);r=srv.mon.get('kpr|'+P.K);if(r&&f(r.data))break}return r};
 /* 1. đặt giá bằng nút Giá riêng ở Học phí → Công nợ học sinh */
 await page.evaluate(()=>{S.hp={tab:'tq',m:CM,st:'',q:''};go('hp');render()});await page.waitForSelector('#hpq');
 await page.fill('#hpq',P.name);await page.waitForSelector('#main [data-a="kpropen"][data-v="'+P.K+'"]');
 await page.click('#main [data-a="kpropen"][data-v="'+P.K+'"]');await page.waitForSelector('.mdc #kprf');
 await page.fill('#kp-bt','350000');await page.click('.mdc #kprf button[type=submit]');
 let rec=await waitRec(d=>d&&d.bt===350000);
 ok('Máy chủ nhận giá bán trú riêng ở bảng tiền (money_records), khóa = mã bé, không nằm ở bảng records',!!rec&&rec.data.bt===350000&&Object.keys(rec.data).length===1&&!srv.recs.has('kpr|'+P.K),rec&&rec.data);
 const L=await page.evaluate(([K,nm])=>({inv:invoice(kidBy(K),nm),tag:[...document.querySelectorAll('#main .tag')].filter(t=>t.textContent==='Giá riêng').length}),[P.K,P.nm]);
 ok('học phí tháng sau của bé đổi đúng theo giá riêng và dòng bé có nhãn Giá riêng',L.inv===P.base+P.n*(350000-P.P)&&L.tag===1,{L,P});
 /* 2. bỏ trống mọi ô: máy chủ giữ dòng với {} (để máy phụ huynh đồng bộ nhận được thay đổi) */
 await page.click('#main [data-a="kpropen"][data-v="'+P.K+'"]');await page.waitForSelector('.mdc #kprf');
 const pre=await page.inputValue('#kp-bt');
 await page.fill('#kp-bt','');await page.click('.mdc #kprf button[type=submit]');
 rec=await waitRec(d=>d&&Object.keys(d).length===0);
 ok('mở lại hiện sẵn giá đã lưu; bỏ trống rồi lưu: máy chủ vẫn còn dòng với {} (không xóa dòng)',pre==='350000'&&!!rec&&Object.keys(rec.data).length===0,{pre,d:rec&&rec.data});
 /* đặt lại để thử máy khác */
 await page.click('#main [data-a="kpropen"][data-v="'+P.K+'"]');await page.waitForSelector('.mdc #kprf');
 await page.fill('#kp-bt','350000');await page.fill('#kp-gq','150000');await page.click('.mdc #kprf button[type=submit]');
 rec=await waitRec(d=>d&&d.bt===350000&&d.gq===150000);
 ok('đặt cả giá bán trú và giá loại 1-1: máy chủ nhận đủ {bt, gq}',!!rec&&rec.data.bt===350000&&rec.data.gq===150000,rec&&rec.data);
 await ctx.close();
 /* 3. máy khác đăng nhập (Trưởng TT): thấy giá riêng, học phí tính đúng */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(1800);
 const Q=await page.evaluate(([K,nm])=>({bt:DB.kpr[K]&&DB.kpr[K].bt,gq:DB.kpr[K]&&DB.kpr[K].gq,own:kidBt(kidBy(K)),has:hasKpr(kidBy(K)),inv:invoice(kidBy(K),nm)}),[P.K,P.nm]);
 ok('Đăng nhập lại: giá riêng còn nguyên, học phí tính theo giá riêng như trước khi thoát',Q.bt===350000&&Q.gq===150000&&Q.own===350000&&Q.has&&Q.inv===P.base+P.n*(350000-P.P),Q);
 await ctx.close();
 /* 4. Quản lý không nhận được dữ liệu tiền và không có nút */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'huynhminhanh@goldenbee.vn','pw1');await page.waitForSelector('.nav');await sleep(1800);
 const Z=await page.evaluate(K=>({n:Object.keys(DB.kpr||{}).length,has:!!(DB.kpr||{})[K],canMoney:canMoney(),open:ACT.kpropen(K),btn:/data-a="kpropen"/.test(String(VIEWS.hp()))}),P.K);
 ok('Quản lý: không nhận giá riêng nào của bé, không mở được hộp, không có nút',Z.n===0&&!Z.has&&!Z.canMoney&&Z.open===false&&!Z.btn,Z);
 await ctx.close();
 /* 5. Văn phòng nhận được và sửa được ngay từ trang Học phí; máy chủ nhận giá mới */
 const vpEm=[...srv.recs.values()].find(r=>r.collection==='staff'&&r.data.role==='vp').data.em;   /* tài khoản Văn phòng phải trùng email với một hồ sơ nhân sự vp */
 srv.profiles['u-vp']={role:'vp',full_name:'VP'};srv.users[vpEm]=Object.assign({},srv.users['vp@gb.vn'],{email:vpEm});
 ({ctx,page}=await newPage(b,srv,errs));await login(page,vpEm,'pw1');await page.waitForSelector('.nav');await sleep(1800);
 const Y=await page.evaluate(K=>({bt:DB.kpr[K]&&DB.kpr[K].bt,canMoney:canMoney()}),P.K);
 ok('Văn phòng: nhận được giá riêng của bé',Y.canMoney&&Y.bt===350000,Y);
 await page.evaluate(()=>{S.hp={tab:'tq',m:CM,st:'',q:''};go('hp');render()});await page.waitForSelector('#hpq');
 await page.fill('#hpq',P.name);await page.waitForSelector('#main [data-a="kpropen"][data-v="'+P.K+'"]');
 await page.click('#main [data-a="kpropen"][data-v="'+P.K+'"]');await page.waitForSelector('.mdc #kprf');
 await page.fill('#kp-bt','360000');await page.click('.mdc #kprf button[type=submit]');
 rec=await waitRec(d=>d&&d.bt===360000);
 ok('Văn phòng sửa giá bán trú riêng: máy chủ nhận 360.000 và giữ giá loại 1-1 (gq) đã đặt',!!rec&&rec.data.bt===360000&&rec.data.gq===150000,rec&&rec.data);
 await ctx.close();
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
