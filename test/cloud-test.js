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
 const srv=makeServer(users);
 /* --- A. Trưởng Trung tâm vào lần đầu, máy chủ trống --- */
 let {ctx,page}=await newPage(b,srv,errs);
 ok('Có màn hình đăng nhập (không có nút xem thử vai trò)',await page.$('#login')&&!(await page.$('.roles [data-a="demo"]')));
 await login(page,'tt@gb.vn','sai');await page.waitForSelector('.err:not(:empty)');
 ok('Sai mật khẩu báo lỗi tiếng Việt',/chưa đúng/.test(await page.textContent('.err')));
 await login(page,'tt@gb.vn','pw1');await page.waitForSelector('[data-a="csetup"]');
 ok('Máy chủ trống: Trưởng Trung tâm thấy màn hình khởi tạo',true);
 await page.click('[data-a="csetup"][data-v="empty"]');await page.waitForSelector('.nav');await sleep(800);
 ok('Dữ liệu trống: vào được ứng dụng với vai trò Trưởng Trung tâm',/Trưởng Trung tâm/.test(await page.textContent('.bar0')));
 ok('Máy chủ có cấu hình trung tâm',srv.recs.has('cfg|_'));
 const st=srv.recs.get('staff|nv01');
 ok('Hồ sơ nhân sự trên máy chủ KHÔNG chứa lương',st&&!('pay' in st.data)&&st.data.em==='tt@gb.vn');
 ok('Lương và cấu hình tiền nằm ở bảng riêng',srv.mon.has('pay|nv01')&&srv.mon.has('cfgm|_'));
 ok('Bảng chung không chứa thuế, giảm trừ, đơn giá',!JSON.stringify(srv.recs.get('cfg|_').data).match(/giamTru|thue|pbtCN|p11/));
 const n0=srv.log.length;await sleep(1500);
 ok('Không ghi thừa sau khi tải xong (so sánh dữ liệu ổn định)',srv.log.slice(n0).filter(x=>/^(POST|DELETE)/.test(x)).length===0,srv.log.slice(n0).join(' | '));
 /* thêm một trẻ */
 await page.evaluate(()=>{DB.kids.push({id:'hs900',n:'Bé Thử',g:'M',dob:'2022-01-01',sd:TODAY,st:'dang',nd:'Chậm ngôn ngữ',m11:2,bt:false,gv:null,gr:'',pn:'Phụ huynh Thử',pr:'Mẹ',pp:'0900000000',pe:'phuhuynh@x.vn'});render()});
 await sleep(1200);
 ok('Thêm trẻ lên máy chủ',srv.recs.has('kids|hs900')&&srv.recs.get('kids|hs900').data.n==='Bé Thử');
 /* tải lại trang: phiên được giữ */
 await page.reload();await page.waitForSelector('.nav',{timeout:8000});
 ok('Tải lại trang vẫn đăng nhập và có trẻ vừa thêm',await page.evaluate(()=>DB.kids.some(k=>k.id==='hs900')));
 ok('Lương được ghép lại cho Trưởng Trung tâm',await page.evaluate(()=>DB.staff[0].pay&&DB.cfg.thue!==undefined));
 /* đăng xuất */
 await page.click('[data-a="logout"]');await page.waitForSelector('#login');
 ok('Đăng xuất về màn hình đăng nhập và xóa phiên',!(await page.evaluate(()=>localStorage.getItem('gb_sb'))));
 await ctx.close();
 /* --- B. Máy chủ mới, nạp dữ liệu mẫu --- */
 const srv2=makeServer(Object.assign({},users));
 ({ctx,page}=await newPage(b,srv2,errs));
 await login(page,'tt@gb.vn','pw1');await page.waitForSelector('[data-a="csetup"]');await page.click('[data-a="csetup"][data-v="demo"]');await page.waitForSelector('.nav');
 for(let i=0;i<30&&(srv2.recs.size<3000);i++)await sleep(500);await sleep(1500);
 const cnt=c=>[...srv2.recs.values()].filter(r=>r.collection===c).length,cntM=c=>[...srv2.mon.values()].filter(r=>r.collection===c).length;
 ok('Dữ liệu mẫu lên máy chủ: 100 trẻ, 30 nhân sự',cnt('kids')===100&&cnt('staff')===30,cnt('kids')+'/'+cnt('staff'));
 ok('Sổ học phí (lg) ở bảng tiền, không ở bảng chung',cntM('lg')>500&&cnt('lg')===0);
 ok('Lương 30 nhân sự ở bảng tiền',cntM('pay')===30);
 const dbA=await page.evaluate(()=>JSON.stringify({k:DB.kids.length,s:DB.staff.length,lg:DB.lg.length,att:Object.keys(DB.att).length,sess:DB.sess.length}));
 await ctx.close();
 /* Mở lại bằng tài khoản Trưởng Trung tâm: dữ liệu giống hệt */
 ({ctx,page}=await newPage(b,srv2,errs));await login(page,'tt@gb.vn','pw1');await page.waitForSelector('.nav',{timeout:30000});
 const dbB=await page.evaluate(()=>JSON.stringify({k:DB.kids.length,s:DB.staff.length,lg:DB.lg.length,att:Object.keys(DB.att).length,sess:DB.sess.length}));
 ok('Tải lại từ máy chủ cho đúng số liệu đã lưu',dbA===dbB,dbA+' vs '+dbB);
 const n1=srv2.log.length;await sleep(1500);
 ok('Tải xong không ghi thừa (dữ liệu mẫu)',srv2.log.slice(n1).filter(x=>/^(POST|DELETE)/.test(x)).length===0);
 const ttState=await page.evaluate(()=>({kids:JSON.stringify(DB.kids),staff:JSON.stringify(DB.staff.map(s=>s.pay.mode))}));
 await ctx.close();
 /* --- C. Quản lý: không thấy tiền --- */
 const qlStaff=srv2.recs.get('staff|nv01').data.em;srv2.users[qlStaff]=Object.assign({},srv2.users['huynhminhanh@goldenbee.vn'],{email:qlStaff});
 const qi=srv2.log.length;({ctx,page}=await newPage(b,srv2,errs));await login(page,qlStaff,'pw1');await page.waitForSelector('.nav',{timeout:30000});
 const ql=await page.evaluate(()=>({lg:DB.lg.length,set:Object.keys(DB.set).length,bon:Object.keys(DB.bon).length,pays:DB.staff.every(s=>s.pay.base===0&&s.pay.rate===0&&s.pay.allow===0),cfg:[DB.cfg.p11,DB.cfg.pbtCN,DB.cfg.giamTru,DB.cfg.thue],role:U.role}));
 ok('Quản lý: không nhận sổ học phí, quyết toán, thưởng',ql.lg===0&&ql.set===0&&ql.bon===0,JSON.stringify(ql));
 ok('Quản lý: lương và đơn giá chỉ là giá trị rỗng, không có số thật',ql.pays&&ql.cfg.every(x=>x===0));
 ok('Quản lý không hề gọi bảng tiền',!srv2.log.slice(qi).some(l=>/money_records/.test(l)));
 let bad=[];const views=await page.evaluate(()=>ACCESS[U.role]);
 for(const v of views){await page.evaluate(v=>{go(v);render()},v);await sleep(60);const t=await page.textContent('#main');if(/\d\s?₫|Tiền lương|Học phí và công nợ/.test(t))bad.push(v)}
 ok('Quản lý: không trang nào hiện số tiền ('+views.length+' trang)',bad.length===0,bad.join(','));
 /* Quản lý sửa dữ liệu thường: được ghi; ghi tiền: bị từ chối */
 await page.evaluate(()=>{DB.kids[0].nd='Đã sửa bởi quản lý';render()});await sleep(1200);
 ok('Quản lý sửa hồ sơ trẻ: lưu thành công',srv2.recs.get('kids|hs001').data.nd==='Đã sửa bởi quản lý');
 const posted=srv2.log.length;
 ok('Quản lý không ghi lương hay học phí lên máy chủ',!srv2.log.slice(qi).some(l=>/(POST|DELETE) \/rest\/v1\/money_records/.test(l)));
 await ctx.close();
 /* --- D. Văn phòng: thấy tiền; đồng bộ giữa hai người --- */
 srv2.profiles['u-vp']={role:'vp',full_name:'VP'};
 const vpStaff=srv2.recs.get('staff|nv26').data.em;srv2.users[vpStaff]=Object.assign({},srv2.users['vp@gb.vn'],{email:vpStaff});
 ({ctx,page}=await newPage(b,srv2,errs));await login(page,vpStaff,'pw1');await page.waitForSelector('.nav',{timeout:30000});
 const vp=await page.evaluate(()=>({lg:DB.lg.length,pay:DB.staff.some(s=>s.pay.base>0),role:U.role}));
 ok('Văn phòng: có sổ học phí và lương thật',vp.lg>500&&vp.pay&&vp.role==='vp',JSON.stringify(vp));
 const ctxT=await b.newContext({viewport:{width:1366,height:900}});const pt=await ctxT.newPage();pt.on('pageerror',e=>errs.push('PAGEERROR '+e.message));await pt.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());await srv2.attach(pt);await pt.goto(URL);
 await login(pt,'tt@gb.vn','pw1');await pt.waitForSelector('.nav',{timeout:30000});
 await pt.evaluate(()=>{DB.kids.push({id:'hs901',n:'Bé Đồng Bộ',g:'F',dob:'2022-02-02',sd:TODAY,st:'dang',nd:'x',m11:1,bt:false,gv:null,gr:'',pn:'A',pr:'Bố',pp:'0',pe:'a@x.vn'});DB.lg.push({id:'e900',hs:'hs901',date:TODAY,kind:'hp',amt:1234000,m:CM,note:'thử'});render()});await sleep(1200);
 const m0=srv2.log.length;
 await page.evaluate(()=>cloudPull());await sleep(800);
 ok('Văn phòng nhận được trẻ và dòng học phí mới do Trưởng TT thêm',await page.evaluate(()=>DB.kids.some(k=>k.id==='hs901')&&DB.lg.some(e=>e.id==='e900')));
 ok('Nhận đồng bộ không phát sinh ghi ngược',srv2.log.slice(m0).filter(x=>/^(POST|DELETE)/.test(x)).length===0);
 /* xóa */
 await pt.evaluate(()=>{DB.kids=DB.kids.filter(k=>k.id!=='hs901');render()});await sleep(1200);
 ok('Xóa trẻ: dòng bị xóa trên máy chủ',!srv2.recs.has('kids|hs901'));
 /* văn phòng tính lương: ghi bảng tiền được */
 await page.evaluate(()=>{DB.bon['nv04|2026-10']=500000;render()});await sleep(1200);
 ok('Văn phòng lưu thưởng (bảng tiền) thành công',srv2.mon.has('bon|nv04|2026-10'));
 await ctx.close();await ctxT.close();
 /* --- E. Giáo viên: chỉ thấy lương của mình --- */
 const gvStaff=srv2.recs.get('staff|nv04').data.em;srv2.users[gvStaff]={pw:'pw1',uid:'u-gv',role:'gv',name:'GV',email:gvStaff};srv2.profiles['u-gv']={role:'gv',full_name:'GV'};
 ({ctx,page}=await newPage(b,srv2,errs));await login(page,gvStaff,'pw1');await page.waitForSelector('.nav',{timeout:30000});
 const gv=await page.evaluate(()=>({lg:DB.lg.length,own:DB.staff.find(s=>s.id==='nv04').pay.base+DB.staff.find(s=>s.id==='nv04').pay.rate,others:DB.staff.filter(s=>s.id!=='nv04').every(s=>s.pay.base===0&&s.pay.rate===0),cfg:DB.cfg.thue,role:U.role}));
 ok('Giáo viên: không có sổ học phí, chỉ có lương của mình',gv.lg===0&&gv.own>0&&gv.others,JSON.stringify(gv));
 await page.evaluate(()=>{go('tl');render()});await sleep(100);
 ok('Giáo viên xem được phiếu lương của mình',/Phiếu lương của tôi/.test(await page.textContent('#main'))&&/Thực nhận/.test(await page.textContent('#main')));
 await page.evaluate(()=>{DB.staff.find(s=>s.id==='nv04').em='khac@x.vn';DB.kids[0].nd='gv sửa hồ sơ trẻ';render()});await sleep(1500);
 ok('Giáo viên sửa hồ sơ trẻ được lưu, sửa hồ sơ nhân sự bị máy chủ từ chối',srv2.recs.get('kids|hs001').data.nd==='gv sửa hồ sơ trẻ'&&srv2.recs.get('staff|nv04').data.em===gvStaff&&(await page.evaluate(()=>CLD.st))==='err');
 await ctx.close();
 /* --- F. Phụ huynh và tài khoản không có vai trò --- */
 ({ctx,page}=await newPage(b,srv2,errs));await login(page,'ph@gb.vn','pw1');await page.waitForSelector('[role=alert]');
 ok('Tài khoản phụ huynh: báo cổng phụ huynh chưa mở, không tải dữ liệu',/Cổng phụ huynh chưa mở/.test(await page.textContent('.lgc'))&&!srv2.log.some(l=>/ph@gb|GET \/rest\/v1\/records.*u-ph/.test(l)));
 await ctx.close();
 ({ctx,page}=await newPage(b,srv2,errs));await login(page,'noprofile@gb.vn','pw1');await page.waitForSelector('[role=alert]');
 ok('Tài khoản có vai trò lạ không vào được',/chưa mở|chưa được cấp/.test(await page.textContent('.lgc')));
 await ctx.close();
 /* --- G. Tải tệp trên web thường (không có khả năng tải của artifact) --- */
 ({ctx,page}=await newPage(b,srv2,errs));await login(page,'vp@gb.vn','pw1').catch(()=>{});
 await ctx.close();
 console.log('\nLỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
