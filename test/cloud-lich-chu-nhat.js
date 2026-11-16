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
 /* Chủ nhật ở chế độ cloud: ca 1-1 Chủ nhật (day 0) lưu lên máy chủ, máy khác đăng nhập vẫn thấy, học phí và lương tính đúng sau khi tải lại */
 const P=await page.evaluate(()=>{const T=DB.staff.find(s=>isTeacher(s)&&s.st==='dang'&&!isGrStaff(s.id)&&s.pay&&s.pay.mode==='buoi'&&s.pay.rate>0),
  K=DB.kids.find(k=>k.st==='dang'&&!k.bt&&k.sd<sm(CM,-1)+'-01');let ls=TODAY;while(dow(ls)!==0||!(ls<WD&&ls<=TODAY))ls=addD(ls,-1);
  return{T:T.id,K:K.id,ls,m:ls.slice(0,7),rate:T.pay.rate,n:DB.lich.length,inv:invoice(K,ls.slice(0,7)),nSun:mDates(ls.slice(0,7)).filter(d=>dow(d)===0).length,mon:monOf(ls)}});
 ok('có giáo viên trả theo ca và bé để thử',!!P.T&&!!P.K,P);
 /* 1. thêm ca Chủ nhật bằng biểu mẫu của lưới tuần */
 await page.evaluate(([T,wk])=>{go('lh');render();S.lh.tab='wk';S.lh.mode='gv';S.lh.gv=T;S.lh.wk=wk;render()},[P.T,P.mon]);await sleep(150);
 await page.evaluate(()=>document.querySelector('#main [data-a="lsadd"][data-v="1|"]').click());await page.waitForSelector('#lsf');
 await page.evaluate(K=>{const f=document.querySelector('#lsf');f.elements.day.value='0';f.elements.hs.value=K;f.elements.slot.value='09:05'},P.K);
 await page.click('#lsf button[type=submit]');
 let rec;for(let i=0;i<24;i++){await sleep(400);rec=[...srv.recs.values()].find(r=>r.collection==='lich'&&r.data.day===0&&r.data.hs===P.K&&r.data.gv===P.T);if(rec)break}
 ok('Máy chủ nhận ca Chủ nhật: day 0, đúng bé, giáo viên và giờ',!!rec&&rec.data.type==='11'&&rec.data.slot==='09:05'&&rec.data.day===0,rec&&rec.data);
 /* 2. ghi có mặt Chủ nhật rồi kiểm tra điểm danh lên máy chủ */
 await page.evaluate(ls=>{S.dd=Object.assign(S.dd||{},{date:ls,tab:'roll',gv:'',un:false});go('dd');render()},P.ls);await sleep(200);
 await page.click('[data-a="att"][data-v="'+P.ls+'|'+rec.id+'|'+P.K+'|cm"]');
 let att;for(let i=0;i<24;i++){await sleep(400);att=srv.recs.get('att|'+P.ls+'|'+rec.id+'|'+P.K);if(att)break}
 ok('Máy chủ nhận điểm danh Chủ nhật',!!att&&att.data==='cm',att&&att.data);
 await ctx.close();
 /* 3. máy khác đăng nhập: thấy ca Chủ nhật, học phí tăng đúng số Chủ nhật × giá ca, lương theo ca tăng đúng 1 ca */
 ({ctx,page}=await newPage(b,srv,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav');await sleep(1800);
 const Q=await page.evaluate(([P,id])=>{const l=DB.lich.find(x=>x.id===id),k=kidBy(P.K),a=payroll(stBy(P.T),P.m),fee=l?feeSlot(k,id):0;
  const key=P.ls+'|'+id+'|'+P.K,sv=DB.att[key];delete DB.att[key];const b=payroll(stBy(P.T),P.m);DB.att[key]=sv;
  return{has:!!l&&l.day===0,inv:invoice(k,P.m),fee,sched:sched(k,P.m).filter(x=>dow(x.d)===0).length,teach:a.teach-b.teach,sess:Math.round(a.bySess-b.bySess),cong:a.cong===b.cong,isSch:isSch(P.ls),isW:isW(P.ls)}},[P,rec.id]);
 ok('Đăng nhập lại: ca Chủ nhật có mặt, Chủ nhật là ngày có lịch nhưng không phải ngày công',Q.has&&Q.isSch&&!Q.isW,Q);
 ok('Học phí tăng đúng số Chủ nhật × giá ca; lương theo ca tăng đúng một mức giá, công không đổi',Q.sched===P.nSun&&Q.inv-P.inv===P.nSun*Q.fee&&Q.teach===1&&Q.sess===P.rate&&Q.cong,{Q,P});
 await ctx.close();
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
