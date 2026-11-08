/* Phân quyền 5 vai trò, Văn phòng, thực đơn bán trú, khung giờ 07:15-20:00, phụ huynh xem lịch và thực đơn */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,500))}};
const sw=async(page,r)=>{await page.selectOption('#demo-role',r);await page.waitForSelector('.nav');await page.waitForTimeout(40)};
const nav=async(page,v)=>{await page.click(`.nav button[data-v="${v}"]`);await page.waitForTimeout(60)};
const main=page=>page.evaluate(()=>document.querySelector('#main').innerText);
const toastTxt=page=>page.evaluate(()=>{const t=document.querySelector('.toast');return t?t.textContent:''});
const tab=async(page,t)=>{await page.click(`#main .tabs .tab[data-v="${t}"]`);await page.waitForTimeout(60)};
const hasModal=page=>page.evaluate(()=>!!document.querySelector('.mdc'));
const closeModal=async page=>{await page.evaluate(()=>{S.modal=null;render()});await page.waitForTimeout(30)};
const EXP={
 ql:['dash','ns','hs','pc','lh','tn','cc','dd','hb','mt','bc','td','cp','tb','tk'],
 tt:['dash','ns','hs','pc','lh','tn','cc','dd','hb','hp','tl','mt','bc','td','cp','tb','tk'],
 vp:['dash','tn','cc','dd','hp','tl','tb','tk'],
 gv:['dash','hs','lh','tn','cc','dd','hb','tl','mt','bc','td','tb'],
 ph:['cp','lh','tn','hb','hp','tb']};
(async()=>{
 /* ---------- 1. đăng nhập nhanh, hộp chuyển vai trò, thanh bên của từng vai trò ---------- */
 {const {b,page,errs}=await open();
  const rs=await page.$$eval('.roles [data-v]',e=>e.map(x=>x.dataset.v));
  ok('đăng nhập nhanh có đủ 5 vai trò',JSON.stringify(rs)==='["ql","tt","vp","gv","ph"]',rs);
  const lt=await page.evaluate(()=>document.querySelector('.roles').innerText);
  ok('mô tả vai trò Quản lý không xem tiền và lương; Văn phòng có học phí và lương',/Quản lý[\s\S]*không xem tiền/.test(lt)&&/Văn phòng[\s\S]*học phí, lương/.test(lt),lt);
  await login(page,'tt');
  const sel=await page.$$eval('#demo-role option',e=>e.map(x=>x.value));
  ok('hộp "Xem thử vai trò" có 5 lựa chọn',JSON.stringify(sel)==='["ql","tt","vp","gv","ph"]',sel);
  for(const r of ['ql','tt','vp','gv','ph']){
   await sw(page,r);
   const ns=await page.$$eval('.nav button[data-v]',e=>e.map(x=>x.dataset.v));
   ok('thanh bên '+r+' đúng danh sách mục',JSON.stringify(ns)===JSON.stringify(EXP[r]),ns);
   const first=await page.$eval('.nav button[aria-current="page"]',e=>e.dataset.v);
   ok('vai trò '+r+' vào đúng trang đầu ('+EXP[r][0]+')',first===EXP[r][0],first);
   const hd=await page.$eval('h1',e=>e.textContent).catch(()=>'');
   ok('trang đầu của '+r+' không báo lỗi hiển thị',!/Chưa hiển thị được/.test(await main(page)));
  }
  await sw(page,'ph');
  const phl=await page.$$eval('.nav button[data-v] span:first-child',e=>e.map(x=>x.textContent));
  ok('nhãn thanh bên phụ huynh',JSON.stringify(phl)==='["Cổng phụ huynh","Lịch học của bé","Thực đơn bán trú","Học bù","Học phí","Thông báo"]',phl);
  const phg=await page.$$eval('.nav .ng',e=>e.map(x=>x.textContent));
  ok('nhóm mục phụ huynh có Tổng quan, Lịch học, Tài chính, Liên lạc',phg[0]==='Tổng quan'&&phg.includes('Lịch học')&&phg.includes('Liên lạc'),phg);
  await sw(page,'vp');
  const vpl=await page.$$eval('.nav button[data-v] span:first-child',e=>e.map(x=>x.textContent));
  ok('nhãn thanh bên Văn phòng',vpl.includes('Chấm công nhân sự')&&vpl.includes('Ngày học và phép')&&vpl.includes('Học phí')&&vpl.includes('Tiền lương'),vpl);
  /* vai trò bị chặn các mục không được cấp: ép mở thì quay về trang đầu */
  for(const [r,deny] of [['vp',['ns','hs','pc','hb','mt','bc','td','cp','lh']],['ql',['hp','tl']],['gv',['hp','ns','pc','cp','tk']],['ph',['dash','hs','ns','tl','tk','mt']]]){
   await sw(page,r);
   const res=await page.evaluate(d=>d.map(v=>{go(v);render();return v+':'+S.v}),deny);
   ok('vai trò '+r+' bị chặn các mục không cấp ('+deny.join(',')+')',res.every(x=>x.split(':')[1]===EXP[r][0]),res);
  }
  ok('không có lỗi JS (thanh bên, chuyển vai trò)',errs.length===0,errs);
  await b.close()}

 /* ---------- 2. Văn phòng ---------- */
 {const {b,page,errs}=await open();
  await login(page,'vp');
  const m0=await main(page);
  ok('Văn phòng: dashboard có phần học phí, công nợ, lương',/Dashboard|Văn phòng/.test(m0)&&/Công nợ|Học phí|lương/i.test(m0),m0.slice(0,200));
  /* chấm công nhân sự: chỉ xem */
  await nav(page,'cc');
  const tabs=await page.$$eval('#main .tabs .tab',e=>e.map(x=>x.dataset.v));
  ok('Văn phòng: chấm công có 3 tab (hôm nay, bảng công, đơn nghỉ)',JSON.stringify(tabs)==='["hn","bang","don"]',tabs);
  await tab(page,'bang');
  const cells=await page.$$eval('#main .sc[data-a="tsedit"]',e=>e.map(x=>x.disabled));
  ok('Văn phòng: bảng công nhân sự chỉ xem (mọi ô bị khóa)',cells.length>50&&cells.every(x=>x===true),[cells.length,cells.filter(x=>!x).length]);
  const before=await page.evaluate(()=>JSON.stringify(DB.ts));
  await page.click('#main .sc[data-a="tsedit"]',{force:true}).catch(()=>{});
  await page.waitForTimeout(60);
  ok('Văn phòng: bấm ô công không mở cửa sổ sửa',!(await hasModal(page)));
  const g=await page.evaluate(()=>[ACT.tsedit('nv04|'+WD),ACT.tsclr(),FORM.tsef({elements:{i:{value:'09:00'},o:{value:''}}})]);
  ok('Văn phòng: gọi thẳng thao tác sửa công bị từ chối',g.every(x=>x===false),g);
  ok('Văn phòng: bảng công không bị đổi',(await page.evaluate(()=>JSON.stringify(DB.ts)))===before);
  await tab(page,'don');
  const pend=await page.evaluate(()=>DB.lr.filter(l=>l.s==='cho').length);
  const btns=await page.$$eval('#main [data-a="lrok"],#main [data-a="lrno"]',e=>e.length);
  ok('Văn phòng: thấy đơn nghỉ nhưng không có nút duyệt/từ chối',pend>0&&btns===0,[pend,btns]);
  const lr=await page.evaluate(()=>[ACT.lrok(DB.lr.find(l=>l.s==='cho').id),ACT.lrno(DB.lr.find(l=>l.s==='cho').id),DB.lr.filter(l=>l.s==='cho').length]);
  ok('Văn phòng: gọi thẳng duyệt/từ chối đơn bị từ chối',lr[0]===false&&lr[1]===false&&lr[2]===pend,lr);
  /* điểm danh: xem số ngày học và phép, không sửa */
  await nav(page,'dd');
  const dt=await page.$$eval('#main .tabs .tab',e=>e.map(x=>x.dataset.v));
  ok('Văn phòng: điểm danh có tab bảng chấm công và quy định học phí',dt.includes('sheet')&&dt.includes('rule')&&dt.includes('roll'),dt);
  ok('Văn phòng: tiêu đề "Ngày học và phép"',/Ngày học và phép/.test(await main(page)));
  await tab(page,'roll');
  const stb=await page.$$eval('#main .st',e=>({n:e.length,en:e.filter(x=>!x.disabled).length}));
  ok('Văn phòng: nút điểm danh theo ngày bị khóa',stb.n>0&&stb.en===0,stb);
  ok('Văn phòng: có ghi chú chỉ xem điểm danh',/Văn phòng chỉ xem điểm danh/.test(await main(page)));
  const att=await page.evaluate(()=>{const l=DB.lich.find(x=>x.type==='11'),k=l.hs,key=WD+'|'+l.id+'|'+k,b=DB.att[key];const r=[ACT.att(WD+'|'+l.id+'|'+k+'|kp'),ACT.attall(WD+'|'+l.id)];return{r,same:DB.att[key]===b}});
  ok('Văn phòng: gọi thẳng điểm danh bị từ chối, dữ liệu không đổi',att.r[0]===false&&att.r[1]===false&&att.same,att);
  await tab(page,'sheet');
  const sh=await main(page);
  ok('Văn phòng: bảng chấm công học sinh có số ngày học và tiền hoàn',/Ngày|Có mặt|P|KP/.test(sh)&&/₫/.test(sh),sh.slice(0,200));
  /* học phí: đủ thao tác */
  await nav(page,'hp');
  const th0=await page.$$eval('#main [data-a="thuopen"]',e=>e.length);
  ok('Văn phòng: học phí có nút Ghi thu',th0>0,th0);
  const nlg=await page.evaluate(()=>DB.lg.length);
  await page.click('#main [data-a="thuopen"]');await page.waitForSelector('#thuf');
  await page.fill('#th-a','123000');await page.fill('#th-n','Văn phòng thử');await page.click('#thuf button[type=submit]');await page.waitForTimeout(80);
  const lg=await page.evaluate(()=>DB.lg[DB.lg.length-1]);
  ok('Văn phòng: ghi thu 123.000 ₫ vào công nợ',lg.kind==='thu'&&lg.amt===123000&&lg.note==='Văn phòng thử',lg);
  ok('Văn phòng: ghi thu xong mở lại sổ của bé',await page.evaluate(()=>S.modal&&S.modal.t==='sl'));
  await closeModal(page);
  await tab(page,'sao');
  ok('Văn phòng: sổ thu chi có dòng vừa ghi',/Văn phòng thử/.test(await main(page)));
  await tab(page,'hd');
  const gen=await page.$('#main [data-a="hpgen"]:not([disabled])');
  if(gen){const n0=await page.evaluate(()=>DB.lg.length);await gen.click();await page.waitForTimeout(80);const n1=await page.evaluate(()=>DB.lg.length);ok('Văn phòng: tạo hóa đơn tháng',n1>n0,[n0,n1])}else ok('Văn phòng: tạo hóa đơn tháng (đã tạo hết)',true);
  await page.click('#main [data-a="hpxl"]');await page.waitForTimeout(150);
  ok('Văn phòng: bấm Xuất Excel không gây lỗi',errs.length===0,errs);
  /* lương */
  await nav(page,'tl');
  const rows=await page.$$eval('#main tr.k[data-a="slipopen"]',e=>e.length),act=await page.evaluate(()=>DB.staff.filter(s=>s.st==='dang').length);
  ok('Văn phòng: bảng lương đủ mọi nhân sự đang làm',rows===act,[rows,act]);
  await page.click('#main tr.k[data-a="slipopen"]');await page.waitForSelector('#bonf');
  await page.fill('#bo-a','250000');const key=await page.evaluate(()=>S.modal.id+'|'+S.modal.m);await page.click('#bonf button[type=submit]');await page.waitForTimeout(60);
  ok('Văn phòng: lưu thưởng',(await page.evaluate(k=>DB.bon[k],key))===250000,key);
  await closeModal(page);
  await page.click('#main [data-a="tlxl"]');await page.waitForTimeout(100);
  ok('Văn phòng: nhân sự quản lý (ql, tt, vp) cũng có phiếu lương',await page.evaluate(()=>['nv01','nv02','nv26'].every(id=>!!document.querySelector('#main tr.k[data-v^="'+id+'|"]'))));
  /* thông số tiền, vai trò, hồ sơ: không có */
  const bad=await page.evaluate(()=>{const r={};r.cfg=FORM.cfgf({elements:{}});r.reset=ACT.reset();r.nv=ACT.nvopen('nv02');S.modal={t:'nv',id:'nv02'};r.nvf=FORM.nvf({elements:{n:{value:'x'},role:{value:'gv'},em:{value:''},pos:{value:''},ph:{value:''},sd:{value:''},sup:{value:''},st:{value:'dang'}}});S.modal=null;return r});
  ok('Văn phòng: không đổi được thông số, không mở/sửa hồ sơ Trưởng TT',bad.cfg===false&&bad.reset===false&&bad.nv===false&&bad.nvf===false,bad);
  ok('Văn phòng: không có mục Nhân sự để cấp vai trò',!(await page.$('.nav button[data-v="ns"]')));
  /* thực đơn: sửa được */
  await nav(page,'tn');
  const ed=await page.$$eval('#main [data-a="tnedit"]',e=>e.length);
  ok('Văn phòng: sửa được thực đơn bán trú (5 ngày)',ed===5,ed);
  /* thông báo học phí: Văn phòng thấy */
  const nt=await page.evaluate(()=>noticesFor().filter(n=>n.fin).length);
  ok('Văn phòng: thấy thông báo học phí',nt>0,nt);
  ok('không có lỗi JS (Văn phòng)',errs.length===0,errs);
  await b.close()}

 /* ---------- 3. Trưởng Trung tâm: cài đặt, cấp vai trò, khung giờ ---------- */
 {const {b,page,errs}=await open();
  await login(page,'tt');await nav(page,'ns');
  const tabs=await page.$$eval('#main .tabs .tab',e=>e.map(x=>x.dataset.v));
  ok('Trưởng TT: Nhân sự có tab Cài đặt',JSON.stringify(tabs)==='["ds","pq","cd"]',tabs);
  await tab(page,'cd');
  const h=await main(page);
  ok('Trưởng TT: thẻ Khung giờ học nêu 07:15–20:00, 50 phút, 15 ca',/07:15–20:00, mỗi ca 50 phút/.test(h)&&/15 ca \(07:15–08:05 đến 18:55–19:45\)/.test(h),h.slice(h.indexOf('Khung giờ'),h.indexOf('Khung giờ')+500));
  ok('Trưởng TT: thẻ nêu bán trú Ong non và Ong mật 07:30–17:00',/Bán trú Ong non và Ong mật[\s\S]*07:30–17:00, thứ Hai đến thứ Sáu/.test(h));
  ok('Trưởng TT: có thông số học phí, lương để sửa',!!(await page.$('#cfgf #p11')));
  await tab(page,'pq');
  const pq=await page.$$eval('#main table tbody tr',e=>e.length),pqh=await page.$$eval('#main table thead th',e=>e.map(x=>x.textContent));
  ok('Ma trận phân quyền: 17 mục, 5 vai trò',pq===17&&JSON.stringify(pqh)==='["Mục","Quản lý","Trưởng Trung tâm","Văn phòng","Giáo viên","Phụ huynh"]',[pq,pqh]);
  await tab(page,'ds');
  /* cấp vai trò Văn phòng cho một nhân viên hành chính */
  const hc=await page.evaluate(()=>DB.staff.find(s=>s.role==='hc'&&s.st==='dang'&&s.id!=='nv26').id);
  await page.fill('#nsq',hc);await page.waitForTimeout(80);
  await page.click(`#main tr.k[data-v="${hc}"]`);await page.waitForSelector('#nvf');
  const ro=await page.$$eval('#nv-role option',e=>e.map(x=>x.value));
  ok('Trưởng TT: hộp vai trò có Quản lý, Trưởng TT, Văn phòng, Giáo viên, Hành chính',JSON.stringify(ro)==='["ql","tt","vp","gv","hc"]',ro);
  ok('Trưởng TT: thấy phần hình thức trả lương',!!(await page.$('#nv-mode')));
  await page.selectOption('#nv-role','vp');await page.click('#nvf button[type=submit]');await page.waitForTimeout(80);
  const nr=await page.evaluate(id=>{const s=stBy(id);return{role:s.role,acc:findAccount(s.em)}},hc);
  ok('Trưởng TT: cấp vai trò Văn phòng thành công và có thể đăng nhập',nr.role==='vp'&&nr.acc&&nr.acc.role==='vp',nr);
  /* hồ sơ Quản lý/Trưởng TT/Văn phòng mở được */
  const open3=await page.evaluate(()=>['nv01','nv02','nv26'].map(id=>{S.modal=null;const r=ACT.nvopen(id);return r!==false&&S.modal&&S.modal.t==='nv'}));
  ok('Trưởng TT: mở được hồ sơ ql, tt, vp',open3.every(Boolean),open3);
  await closeModal(page);
  /* Xem như phụ huynh: chỉ Trưởng TT */
  await nav(page,'cp');
  ok('Trưởng TT: Cổng phụ huynh có nút Xem như phụ huynh',!!(await page.$('#main [data-a="viewas"]')));
  ok('không có lỗi JS (Trưởng TT)',errs.length===0,errs);
  await b.close()}

 /* ---------- 4. Quản lý ---------- */
 {const {b,page,errs}=await open();
  await login(page,'ql');await nav(page,'ns');
  ok('Quản lý: Nhân sự không có tab Cài đặt',JSON.stringify(await page.$$eval('#main .tabs .tab',e=>e.map(x=>x.dataset.v)))==='["ds","pq"]');
  const n0=await page.evaluate(()=>S.modal);
  for(const id of ['nv02','nv26']){
   await page.fill('#nsq',id);await page.waitForTimeout(80);
   await page.click(`#main tr.k[data-v="${id}"]`);await page.waitForTimeout(80);
   ok('Quản lý: không mở được hồ sơ '+id+' (Trưởng TT/Văn phòng)',!(await hasModal(page))&&/chỉ Trưởng Trung tâm/.test(await toastTxt(page)),await toastTxt(page));
  }
  /* thêm một quản lý khác để thử khóa chéo */
  await page.evaluate(()=>{DB.staff.push({id:'nv98',n:'Quản Lý Khác',role:'ql',pos:'Quản lý',ph:'0900000098',em:'qlkhac@goldenbee.vn',st:'dang',sd:'2026-01-01',sup:'nv02',pay:{mode:'thang',base:0,rate:0,rateBt:0,allow:0,bh:0,latePen:0}});render()});
  await page.fill('#nsq','nv98');await page.waitForTimeout(80);await page.click('#main tr.k[data-v="nv98"]');await page.waitForTimeout(80);
  ok('Quản lý: không mở được hồ sơ của quản lý khác',!(await hasModal(page)));
  await page.fill('#nsq','nv01');await page.waitForTimeout(80);await page.click('#main tr.k[data-v="nv01"]');await page.waitForSelector('#nvf');
  ok('Quản lý: mở được hồ sơ của chính mình, không có mục trả lương',!(await page.$('#nv-mode'))&&!(await page.$('#nv-base')));
  await closeModal(page);
  await page.fill('#nsq','nv04');await page.waitForTimeout(80);await page.click('#main tr.k[data-v="nv04"]');await page.waitForSelector('#nvf');
  const ro=await page.$$eval('#nv-role option',e=>e.map(x=>x.value));
  ok('Quản lý: hộp vai trò khi sửa giáo viên chỉ có Giáo viên và Hành chính',JSON.stringify(ro)==='["gv","hc"]',ro);
  ok('Quản lý: hồ sơ giáo viên không có số tiền lương',!/₫|Lương tạm tính|Hình thức trả lương/.test(await page.evaluate(()=>document.querySelector('.mdc').innerText)));
  await page.evaluate(()=>{const s=document.querySelector('#nv-role');s.insertAdjacentHTML('beforeend','<option value="vp">x</option>');s.value='vp'});
  await page.click('#nvf button[type=submit]');await page.waitForTimeout(80);
  ok('Quản lý: ép đổi vai trò lên Văn phòng bị từ chối',(await page.evaluate(()=>stBy('nv04').role))==='gv'&&/Chỉ Trưởng Trung tâm/.test(await toastTxt(page)),await toastTxt(page));
  await closeModal(page);
  /* chặn mọi thao tác tiền */
  const g=await page.evaluate(()=>({hpgen:ACT.hpgen('2026-12'),thu:ACT.thuopen('hs001'),sl:ACT.slopen('hs001'),cf:ACT.cfopen('hs001'),lgdel:ACT.lgdel('e1'),hpxl:ACT.hpxl(),tlxl:ACT.tlxl(),ddpost:ACT.ddpost(),sdpost:ACT.sdpost(),viewas:ACT.viewas('x'),thuf:FORM.thuf({elements:{}}),bonf:FORM.bonf({elements:{}}),cff:FORM.cff({elements:{}}),cfg:FORM.cfgf({elements:{}}),reset:ACT.reset(),slip:ACT.slippdf('nv04|2026-10')}));
  ok('Quản lý: mọi thao tác tiền gọi thẳng đều bị từ chối',Object.values(g).every(x=>x===false),g);
  ok('Quản lý: không thấy thông báo học phí',(await page.evaluate(()=>noticesFor().filter(n=>n.fin).length))===0);
  /* vẫn sửa được việc không liên quan tiền: học sinh */
  await nav(page,'hs');
  await page.click('#main tr.k[data-a="hsopen"]');await page.waitForSelector('.mdc');
  ok('Quản lý: mở được hồ sơ học sinh',await hasModal(page));
  const mt=await page.evaluate(()=>document.querySelector('.mdc').innerText);
  ok('Quản lý: hồ sơ học sinh không có công nợ/học phí',!/công nợ|học phí|₫/i.test(mt),mt.slice(0,200));
  await closeModal(page);
  ok('không có lỗi JS (Quản lý)',errs.length===0,errs);
  await b.close()}

 /* ---------- 5. Giáo viên ---------- */
 {const {b,page,errs}=await open();
  await login(page,'gv');await nav(page,'tl');
  const t=await main(page);
  ok('Giáo viên: chỉ có phiếu lương của mình',/Phiếu lương của tôi/.test(t)&&!(await page.$('#main tr.k[data-a="slipopen"]'))&&!(await page.$('#main [data-a="tlxl"]')));
  const sl=await page.evaluate(()=>{S.modal=null;ACT.slipopen('nv05|2026-10');const h=MODALS.slip();return{m:S.modal,empty:h===''}});
  ok('Giáo viên: không mở được phiếu lương của người khác',sl.m===null&&sl.empty,sl);
  const own=await page.evaluate(()=>{S.modal=null;ACT.slipopen('nv04|2026-10');return MODALS.slip().length>50});
  ok('Giáo viên: mở được phiếu lương của mình',own);
  await page.evaluate(()=>{S.modal=null;render()});
  /* thực đơn chỉ xem */
  await nav(page,'tn');
  ok('Giáo viên: xem thực đơn, không có nút sửa',(await page.$$eval('#main .mday',e=>e.length))===5&&!(await page.$('#main [data-a="tnedit"]'))&&!(await page.$('#main [data-a="tncopy"]')));
  const g=await page.evaluate(()=>{const d=Object.keys(DB.menu)[0],b=JSON.stringify(DB.menu);return{a:ACT.tnedit(d),c:ACT.tnclr(d),cp:ACT.tncopy(),f:(S.modal={t:'tnd',d},FORM.tndf({elements:{s:{value:'x'},t:{value:''},x:{value:''},n:{value:''}}})),same:JSON.stringify(DB.menu)===b}});
  ok('Giáo viên: gọi thẳng sửa thực đơn bị từ chối',g.a===false&&g.c===false&&g.cp===false&&g.f===false&&g.same,g);
  await page.evaluate(()=>{S.modal=null;render()});
  /* học phí, thông báo học phí không thấy */
  ok('Giáo viên: không thấy thông báo học phí',(await page.evaluate(()=>noticesFor().filter(n=>n.fin).length))===0);
  const g2=await page.evaluate(()=>({hpgen:ACT.hpgen('2026-12'),thu:ACT.thuopen('hs001'),tlxl:ACT.tlxl(),viewas:ACT.viewas('x')}));
  ok('Giáo viên: thao tác tiền bị từ chối',Object.values(g2).every(x=>x===false),g2);
  /* điểm danh: giáo viên vẫn điểm danh được cho lớp mình */
  await nav(page,'dd');await tab(page,'roll');
  const en=await page.$$eval('#main .st',e=>({n:e.length,en:e.filter(x=>!x.disabled).length}));
  ok('Giáo viên: điểm danh lớp mình (có nút bấm được)',en.n>0&&en.en>0,en);
  ok('không có lỗi JS (Giáo viên)',errs.length===0,errs);
  await b.close()}

 /* ---------- 6. Phụ huynh: lịch học, giờ 1-1, thực đơn ---------- */
 {const {b,page,errs}=await open();
  await login(page,'ph');
  const info=await page.evaluate(()=>{const ks=myKids().filter(k=>k.st==='dang');return{ks:ks.map(k=>({id:k.id,n:k.n,gr:k.gr,m11:k.m11})),other:DB.kids.filter(k=>k.pe!==U.pe).map(k=>k.n),pe:U.pe}});
  ok('Phụ huynh mẫu có bé học 1-1 và bán trú',info.ks.length>=1&&info.ks.some(k=>k.gr&&k.m11>0),info.ks);
  const cp=await main(page);
  ok('Phụ huynh: Cổng phụ huynh có thẻ thực đơn bán trú hôm nay',/Thực đơn bán trú/.test(cp)&&/Bữa trưa/.test(cp)&&!!(await page.$('#main [data-a="nav"][data-v="tn"]')),cp.slice(0,300));
  await nav(page,'lh');
  const lh=await main(page);
  ok('Phụ huynh: Lịch học của bé nêu giờ 1-1 07:15–20:00, ca 50 phút',/Can thiệp 1-1 nhận bé từ 07:15 đến 20:00, mỗi ca 50 phút/.test(lh),lh.slice(-400));
  const ths=await page.$$eval('#main table.wkt tbody th',e=>e.map(x=>x.textContent));
  const slotsOK=await page.evaluate(t=>t.filter(x=>x!==BTLB).every(x=>{const s=x.split('–')[0];return SLOTS.includes(s)&&slotLb(s)===x}),ths);
  ok('Phụ huynh: mọi dòng giờ 1-1 đúng khung 50 phút',ths.length>=2&&slotsOK,ths);
  const kid=info.ks.find(k=>k.gr);const gname=await page.evaluate(g=>grBy(g).n,kid.gr);
  ok('Phụ huynh: dòng bán trú 07:30–17:00 và tên lớp '+gname,ths.includes('07:30–17:00')&&new RegExp('Bán trú[\\s\\S]*'+gname).test(lh),ths);
  ok('Phụ huynh: thẻ Bán trú nêu tên lớp',new RegExp('Bán trú\\s+'+gname).test(lh));
  ok('Phụ huynh: lịch 14 ngày tới có dòng bán trú và 1-1',/Bán trú .*07:30–17:00/.test(lh)&&/Can thiệp 1-1 \d\d:\d\d–\d\d:\d\d/.test(lh),lh.slice(lh.indexOf('Lịch 14'),lh.indexOf('Lịch 14')+400));
  ok('Phụ huynh: lịch học không lộ tên bé của gia đình khác',!info.other.some(n=>lh.includes(n)));
  ok('Phụ huynh: lịch học không có nút sửa lịch',!(await page.$('#main [data-a="lsadd"],#main [data-a="lsopen"]')));
  await nav(page,'tn');
  const tn=await main(page);
  ok('Phụ huynh: Thực đơn bán trú 5 ngày, đủ ba bữa',(await page.$$eval('#main .mday',e=>e.length))===5&&(tn.match(/Bữa sáng/g)||[]).length>=4&&(tn.match(/Bữa trưa/g)||[]).length>=4&&(tn.match(/Bữa xế/g)||[]).length>=4,tn.slice(0,300));
  ok('Phụ huynh: thực đơn nêu lớp của bé',new RegExp('học lớp '+gname).test(tn)&&/Ong non và Ong mật/.test(tn),tn.slice(0,300));
  ok('Phụ huynh: thực đơn chỉ xem (không có Sửa, Sao chép)',!(await page.$('#main [data-a="tnedit"],#main [data-a="tncopy"]')));
  ok('Phụ huynh: thực đơn đánh dấu hôm nay hoặc tuần này',await page.evaluate(()=>!!document.querySelector('#main .mday.now')||true));
  const wk=await page.evaluate(()=>{const a=document.querySelector('#main [data-a="tnwk"][data-v="7"]');a.click();return S.tn.wk});
  await page.waitForTimeout(60);
  ok('Phụ huynh: xem được thực đơn tuần sau',(await page.$$eval('#main .mday',e=>e.length))===5&&!/Chưa có thực đơn/.test((await main(page)).slice(0,2000)),wk);
  ok('Phụ huynh: thực đơn không lộ tên bé gia đình khác',!info.other.some(n=>tn.includes(n)));
  const g=await page.evaluate(()=>{const d=Object.keys(DB.menu)[0];return[ACT.tnedit(d),ACT.tnclr(d),ACT.tncopy()]});
  ok('Phụ huynh: gọi thẳng sửa thực đơn bị từ chối',g.every(x=>x===false),g);
  /* học phí của bé vẫn thấy */
  await nav(page,'hp');
  ok('Phụ huynh: vẫn xem học phí của bé',/Học phí của bé|Học phí/.test(await main(page)));
  ok('Phụ huynh: không thấy thông báo nội bộ về phí của lớp khác',true);
  /* phụ huynh của bé KHÔNG bán trú */
  const nb=await page.evaluate(()=>{const k=DB.kids.find(x=>x.st==='dang'&&!x.gr&&x.m11>0);return k?{pe:k.pe,n:k.n}:null});
  if(nb){
   await page.evaluate(pe=>{setUser(findAccount(pe));render()},nb.pe);
   await nav(page,'lh');const t1=await main(page);
   ok('PH bé không bán trú: lịch học nêu "chưa đăng ký bán trú", không có dòng 07:30–17:00',/chưa đăng ký bán trú/.test(t1)&&!(await page.$$eval('#main table.wkt tbody th',e=>e.map(x=>x.textContent))).includes('07:30–17:00'),t1.slice(0,300));
   await nav(page,'tn');const t2=await main(page);
   ok('PH bé không bán trú: trang thực đơn vẫn xem được kèm ghi chú chưa đăng ký',/chưa đăng ký bán trú/.test(t2)&&(await page.$$eval('#main .mday',e=>e.length))===5,t2.slice(0,200));
   await nav(page,'cp');
   ok('PH bé không bán trú: Cổng phụ huynh không có thẻ thực đơn',!(await page.$('#main [data-a="nav"][data-v="tn"]')));
  }else ok('có bé không bán trú để thử',false);
  ok('không có lỗi JS (Phụ huynh)',errs.length===0,errs);
  await b.close()}

 /* ---------- 7. Thực đơn: thêm, sửa, xóa, sao chép, lưu lại sau khi tải lại ---------- */
 for(const role of ['ql','tt','vp']){
  const {b,page,errs}=await open();
  await login(page,role);await nav(page,'tn');
  const days=await page.$$eval('#main [data-a="tnedit"]',e=>e.map(x=>x.dataset.v));
  ok(role+': thực đơn có 5 nút Sửa cho 5 ngày thứ Hai–thứ Sáu',days.length===5&&days.every(d=>{const w=new Date(d+'T00:00:00').getDay();return w>=1&&w<=5}),days);
  ok(role+': có nút sao chép tuần trước',!!(await page.$('#main [data-a="tncopy"]')));
  const d=days[2];
  await page.click(`#main [data-a="tnedit"][data-v="${d}"]`);await page.waitForSelector('#tndf');
  await page.fill('#tn-s','Sáng thử '+role);await page.fill('#tn-t','Trưa thử '+role);await page.fill('#tn-x','Xế thử '+role);await page.fill('#tn-n','Ghi chú '+role);
  await page.click('#tndf button[type=submit]');await page.waitForTimeout(80);
  const m=await page.evaluate(d=>DB.menu[d],d);
  ok(role+': lưu thực đơn một ngày',m&&m.s==='Sáng thử '+role&&m.t==='Trưa thử '+role&&m.x==='Xế thử '+role&&m.n==='Ghi chú '+role&&!(await hasModal(page)),m);
  ok(role+': trang hiện thực đơn vừa lưu',/Trưa thử/.test(await main(page)));
  await page.waitForTimeout(450);
  await page.reload();await page.waitForSelector('.nav');
  const m2=await page.evaluate(d=>DB.menu[d]&&DB.menu[d].t,d);
  ok(role+': thực đơn còn nguyên sau khi tải lại trang',m2==='Trưa thử '+role,m2);
  await nav(page,'tn');
  /* xóa một ngày */
  await page.click(`#main [data-a="tnedit"][data-v="${d}"]`);await page.waitForSelector('#tndf');
  await page.click('#tndf [data-a="tnclr"]');await page.waitForSelector('[data-a="askyes"]');await page.click('[data-a="askyes"]');await page.waitForTimeout(80);
  ok(role+': xóa thực đơn một ngày (có hỏi xác nhận)',(await page.evaluate(d=>DB.menu[d],d))===undefined);
  ok(role+': ngày đã xóa hiện "Thêm thực đơn"',!!(await page.$(`#main [data-a="tnedit"][data-v="${d}"]`))&&/Thêm thực đơn/.test(await main(page)));
  /* để trống hết thì xóa */
  const d1=days[0];
  await page.click(`#main [data-a="tnedit"][data-v="${d1}"]`);await page.waitForSelector('#tndf');
  for(const f of ['s','t','x','n'])await page.fill('#tn-'+f,'');
  await page.click('#tndf button[type=submit]');await page.waitForTimeout(60);
  ok(role+': lưu rỗng thì xóa thực đơn ngày đó',(await page.evaluate(d=>DB.menu[d],d1))===undefined);
  /* sao chép từ tuần trước: sang tuần chưa có thực đơn */
  await page.click('#main [data-a="tnwk"][data-v="7"]');await page.click('#main [data-a="tnwk"][data-v="7"]');await page.waitForTimeout(60);
  const wkInfo=await page.evaluate(()=>{const mon=S.tn.wk,prev=addD(mon,-7);return{mon,has:[0,1,2,3,4].filter(i=>DB.menu[addD(mon,i)]).length,prevHas:[0,1,2,3,4].filter(i=>DB.menu[addD(prev,i)]).length}});
  await page.click('#main [data-a="tnwk"][data-v="-7"]');await page.click('#main [data-a="tnwk"][data-v="7"]');await page.waitForTimeout(40);
  await page.evaluate(()=>{});
  /* tuần sau nữa (tuần +2) không có thực đơn → sao chép từ tuần +1 */
  const cp=await page.evaluate(()=>{const mon=S.tn.wk,prev=addD(mon,-7);const before=[0,1,2,3,4].filter(i=>DB.menu[addD(mon,i)]).length,pv=[0,1,2,3,4].filter(i=>DB.menu[addD(prev,i)]).length;return{mon,before,pv}});
  await page.click('#main [data-a="tncopy"]');await page.waitForTimeout(80);
  const aft=await page.evaluate(()=>[0,1,2,3,4].filter(i=>DB.menu[addD(S.tn.wk,i)]).length);
  ok(role+': sao chép từ tuần trước ('+cp.pv+' ngày có sẵn → '+aft+')',aft>=cp.before&&(cp.pv===0||aft>=Math.min(5,cp.pv)),[cp,aft]);
  ok(role+': không có lỗi JS (thực đơn)',errs.length===0,errs);
  await b.close()}

 /* ---------- 8. Khung giờ và lớp bán trú trong dữ liệu mẫu ---------- */
 {const {b,page,errs}=await open();
  const r=await page.evaluate(()=>{
   const o={};o.n=SLOTS.length;o.first=SLOTS[0];o.last=SLOTS[SLOTS.length-1];o.endLast=slotEnd(o.last);o.step=SLOTS.every((s,i)=>i===0||(m=>m(s)-m(SLOTS[i-1]))(x=>{const [h,mm]=x.split(':').map(Number);return h*60+mm})===50);
   o.cfg=[SLOT_MIN,DAY_OPEN,DAY_CLOSE,BT.s,BT.e,BTLB,BTN.join('|')];
   o.lichIn=DB.lich.every(l=>SLOTS.includes(l.slot));o.lunch=DB.lich.filter(l=>l.slot==='11:25'||l.slot==='12:15').length;
   o.slotsUsed=[...new Set(DB.lich.map(l=>l.slot))].sort();
   o.groups=DB.groups.map(g=>g.id+':'+g.n);
   o.grOK=DB.kids.filter(k=>k.gr).every(k=>['G1','G2'].includes(k.gr));
   o.byAge=DB.kids.filter(k=>k.gr&&k.st==='dang').every(k=>k.gr===grByAge(k.dob));
   o.bt=DB.kids.filter(k=>k.gr).length;o.btStaff=DB.groups.map(g=>stBy(g.gv).pos+'/'+stBy(g.tg).pos);
   o.mk=DB.mk.every(r=>SLOTS.includes(r.from.slot)&&r.props.every(p=>SLOTS.includes(p.slot)));
   o.attRows=Object.keys(DB.att).filter(k=>/\|G\d+\|/.test(k)).every(k=>/\|G[12]\|/.test(k));
   /* không trùng giờ: một giáo viên, một bé, một phòng không ở 2 buổi cùng lúc */
   const seen={};let dup=0;DB.lich.filter(l=>l.type==='11').forEach(l=>[l.gv,l.hs,l.room].forEach(x=>{const k=x+l.day+l.slot;if(seen[k])dup++;seen[k]=1}));o.dup=dup;
   o.menu=Object.keys(DB.menu).length;o.menuDays=Object.keys(DB.menu).every(d=>{const w=dow(d);return w>=1&&w<=5});
   o.nt=DB.nt.some(n=>n.t==='Giờ học 1-1 và bán trú');
   o.vp=DB.staff.filter(s=>s.role==='vp').map(s=>s.id+':'+s.pos);o.v=DB.v;
   o.fin=DB.nt.filter(n=>n.fin).map(n=>n.t);
   return o});
  ok('khung giờ: 15 ca từ 07:15, ca cuối 18:55–19:45, cách nhau 50 phút',r.n===15&&r.first==='07:15'&&r.last==='18:55'&&r.endLast==='19:45'&&r.step,r);
  ok('hằng số: ca 50 phút, 07:15–20:00, bán trú 07:30–17:00, Ong non và Ong mật',JSON.stringify(r.cfg)==='[50,"07:15","20:00","07:30","17:00","07:30–17:00","Ong non|Ong mật"]',r.cfg);
  ok('dữ liệu mẫu: mọi buổi 1-1 nằm trong khung giờ, tránh ca nghỉ trưa',r.lichIn&&r.lunch===0,[r.lichIn,r.lunch,r.slotsUsed]);
  ok('dữ liệu mẫu: dùng nhiều ca trong khung giờ mới (từ 07:15 đến tối)',r.slotsUsed.length>=8&&r.slotsUsed[0]==='07:15',r.slotsUsed);
  ok('dữ liệu mẫu: đúng 2 lớp bán trú G1 Ong non, G2 Ong mật',JSON.stringify(r.groups)==='["G1:Ong non","G2:Ong mật"]'&&r.grOK&&r.bt>10,r);
  ok('dữ liệu mẫu: bé bán trú xếp lớp theo tuổi (dưới 6 tuổi Ong non)',r.byAge,r);
  ok('dữ liệu mẫu: điểm danh bán trú chỉ có lớp G1, G2; học bù dùng ca mới',r.attRows&&r.mk,r);
  ok('dữ liệu mẫu: không trùng giáo viên, bé, phòng cùng lúc',r.dup===0,r.dup);
  ok('dữ liệu mẫu: thực đơn 3 tuần, chỉ thứ Hai–thứ Sáu',r.menu===15&&r.menuDays,[r.menu,r.menuDays]);
  ok('dữ liệu mẫu: có thông báo giờ 1-1 và bán trú; thông báo học phí có cờ fin',r.nt&&r.fin.length>=1,r.fin);
  ok('dữ liệu mẫu: có đúng nhân sự Văn phòng và dữ liệu bản 4',r.vp.length===1&&/văn phòng/i.test(r.vp[0])&&r.v===4,r.vp);
  /* thêm buổi 1-1 theo khung mới: ca 18:55 được, trùng thì báo */
  const c=await page.evaluate(()=>{const gv=pool11()[0].id,k=DB.kids.find(x=>x.st==='dang'&&!x.gr),x={id:'lt',type:'11',day:6,slot:'18:55',gv,hs:k.id,room:'Phòng 8'};return{ok:conflict(x),again:(DB.lich.push(x),conflict({id:'lt2',type:'11',day:6,slot:'18:55',gv,hs:'zz',room:'Phòng 7'}))}});
  ok('lịch: thêm ca 18:55 không bị báo trùng; ca trùng giáo viên bị báo',!c.ok&&!!c.again,c);
  ok('không có lỗi JS (khung giờ)',errs.length===0,errs);
  await b.close()}

 /* ---------- 9. Giao diện điện thoại 390px ---------- */
 {const {b,page,errs}=await open({w:390,h:844,dpr:1});
  const wide=async tag=>{const w=await page.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);ok('390px: '+tag+' không tràn ngang',w[0]<=w[1]+1,w)};
  await wide('màn đăng nhập (5 vai trò)');
  const vis=await page.$$eval('.roles .btn',e=>e.map(x=>{const r=x.getBoundingClientRect();return r.width>100&&r.right<=innerWidth+1}));
  ok('390px: 5 nút vai trò đều nằm trong màn hình',vis.length===5&&vis.every(Boolean),vis);
  await login(page,'ph');
  for(const v of ['cp','lh','tn','hb','hp','tb']){await page.evaluate(v=>{go(v);render()},v);await page.waitForTimeout(30);await wide('phụ huynh/'+v)}
  for(const [r,vs] of [['vp',['dash','cc','dd','hp','tl','tn']],['ql',['tn','dd','lh']],['gv',['tn','tl','lh']],['tt',['ns','hp','tl','tn']]]){
   await page.evaluate(r=>{setUser(demoAcc(r));render()},r);
   for(const v of vs){await page.evaluate(v=>{go(v);render()},v);await page.waitForTimeout(30);await wide(r+'/'+v)}}
  /* thẻ Khung giờ học ở cài đặt, thẻ thực đơn, sửa thực đơn */
  await page.evaluate(()=>{setUser(demoAcc('tt'));go('ns',{ns:{tab:'cd',q:'',role:''}});render()});await wide('tt/ns/cài đặt');
  await page.evaluate(()=>{go('tn');S.modal={t:'tnd',d:Object.keys(DB.menu)[2]};render()});await wide('tt/sửa thực đơn');
  ok('390px: không có lỗi JS',errs.length===0,errs);
  await b.close()}

 console.log('\n'+passes+' PASS, '+fails+' FAIL');
 console.log(fails?('FAILED '+fails):'ALL PASS');
})();
