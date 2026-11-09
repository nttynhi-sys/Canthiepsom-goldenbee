/* Bán trú 380.000đ/ngày (gồm ca 1-1 180.000đ), ngày học riêng từng bé, nhiều buổi 1-1 linh hoạt, chẩn đoán,
   thời khóa biểu bán trú ghép 1-1, lương giáo viên theo ca (60.000/80.000đ, KP 50%, dạy bù 100%) */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||50);
 await login(page,'tt');

 /* ---------- 1. cấu hình và dữ liệu mẫu ---------- */
 const cf=await ev(()=>({v:DB.v,p11:DB.cfg.p11,bv11:DB.cfg.rule.bvRefund11,pl:DB.cfg.rule.pLoss,tt:DB.cfg.rule.ttRefund,bv:DB.cfg.rule.bvRefund,day:DB.cfg.pbtDay,d11:DB.cfg.pbtDay11,kp:DB.cfg.rule.gvKp,p:DB.cfg.rule.gvP,old:[DB.cfg.pbtCN,DB.cfg.pbtKhac]}));
 ok('giá bán trú 380.000/ngày, trong đó 180.000 là ca 1-1; dữ liệu bản 6',cf.v===6&&cf.day===380000&&cf.d11===180000&&cf.old[0]===undefined&&cf.old[1]===undefined,cf);
 ok('lương giáo viên khi bé nghỉ KP mặc định 50%, nghỉ có phép 0%',cf.kp===50&&cf.p===0,cf);
 ok('mặc định: 1-1 mỗi buổi 180.000; P mất 30%; Trung tâm nghỉ hoàn 100%; nhập viện hoàn 50% phí bán trú và 100% ca 1-1',cf.p11===180000&&cf.pl===30&&cf.tt===100&&cf.bv===50&&cf.bv11===100,cf);
 const sd=await ev(()=>{const bt=DB.kids.filter(k=>k.bt&&k.st==='dang');
  return{n:bt.length,sat:bt.filter(k=>btHas(k,6)).length,fri:bt.filter(k=>!btHas(k,6)).length,
   miss:bt.filter(k=>btOf(k).some(w=>!DB.lich.some(l=>l.type==='11'&&l.hs===k.id&&l.day===w))).length,
   tkb:DB.tkb.length,tkbG:[...new Set(DB.tkb.map(r=>r.gr))].sort().join(),
   dx:DB.kids.filter(k=>Array.isArray(k.dx)&&k.dx.length).length,all:DB.kids.length,
   rates:[...new Set(DB.staff.filter(s=>s.pay.mode==='buoi').map(s=>s.pay.rate))].sort().join(),
   grp:DB.groups.every(g=>[g.gv,g.tg].every(id=>{const s=DB.staff.find(x=>x.id===id);return s&&s.pay.mode==='thang'&&s.pay.base>0}))}});
 ok('dữ liệu mẫu: có bé học T2–T7 và bé học T2–T6; mọi ngày bán trú đều có ca 1-1',sd.sat>0&&sd.fri>0&&sd.miss===0,sd);
 ok('dữ liệu mẫu: thời khóa biểu cho cả hai lớp, mọi bé có chẩn đoán',sd.tkb>=20&&sd.tkbG==='G1,G2'&&sd.dx===sd.all,sd);
 ok('dữ liệu mẫu: giáo viên bán trú lương cố định, giáo viên 1-1 theo ca 60.000/80.000',sd.grp&&sd.rates==='60000,80000',sd);

 /* ---------- 2. học phí: ngày bán trú theo lịch riêng từng bé ---------- */
 const fee=await ev(()=>{
  const m=sm(CM,-1),base=DB.kids.find(k=>k.bt&&k.st==='dang'),id='tst1';
  const mk=o=>Object.assign({},JSON.parse(JSON.stringify(base)),{id,sd:'2020-01-01',f11:0,st:'dang',bt:true},o);
  DB.kids=DB.kids.filter(k=>k.id!==id);DB.lich=DB.lich.filter(l=>l.hs!==id);
  const k=mk({btd:[1,2,3,4,5]});DB.kids.push(k);
  const cnt=ws=>mDates(m).filter(d=>ws.includes(dow(d))).length,out={m};
  out.n5=cnt([1,2,3,4,5]);out.n6=cnt([1,2,3,4,5,6]);out.nMon=cnt([1]);out.nTue=cnt([2]);out.nThu=cnt([4]);
  out.f11=fee11(k);
  out.a=invoice(k,m);                                   /* T2–T6, chưa có ca 1-1 */
  k.btd=[1,2,3,4,5,6];out.b=invoice(k,m);               /* T2–T7 */
  [1,2,3,4,5,6].forEach(w=>DB.lich.push({id:'tl'+w,type:'11',day:w,slot:'09:00',gv:'nv04',hs:id,room:'Phòng 1'}));
  out.c=invoice(k,m);                                   /* thêm một ca 1-1 mỗi ngày bán trú: nằm trong gói */
  DB.lich.push({id:'tlx',type:'11',day:1,slot:'15:00',gv:'nv04',hs:id,room:'Phòng 2'});
  out.d=invoice(k,m);                                   /* thêm ca thứ hai vào thứ Hai: tính riêng */
  k.bt=false;k.gr='';delete k.btd;DB.lich=DB.lich.filter(l=>l.hs!==id);
  [2,4].forEach(w=>DB.lich.push({id:'tn'+w,type:'11',day:w,slot:'10:00',gv:'nv04',hs:id,room:'Phòng 1'}));
  out.e=invoice(k,m);                                   /* không bán trú, học thứ Ba và thứ Năm */
  return out});
 ok('bán trú T2–T6: mỗi ngày 380.000',fee.a===fee.n5*380000,fee);
 ok('bán trú T2–T7: thêm các ngày thứ Bảy, vẫn 380.000 mỗi ngày',fee.b===fee.n6*380000&&fee.n6>fee.n5,fee);
 ok('ca 1-1 đầu tiên mỗi ngày bán trú nằm trong gói, không tính thêm',fee.c===fee.b,fee);
 ok('ca 1-1 thứ hai trong ngày bán trú tính riêng theo giá 1 buổi',fee.d===fee.c+fee.nMon*fee.f11,fee);
 ok('bé không bán trú học vài buổi/tuần: chỉ trả theo số buổi 1-1',fee.e===(fee.nTue+fee.nThu)*fee.f11,fee);

 /* ---------- 3. chọn ngày bán trú và thêm nhiều buổi 1-1 ngay trong hồ sơ bé ---------- */
 const kid=await ev(()=>{const k=DB.kids.find(x=>x.id==='tst1');k.bt=false;k.gr='';delete k.btd;DB.lich=DB.lich.filter(l=>l.hs!=='tst1');S.modal={t:'hs',id:'tst1',tab:'lh'};render();return k.n});
 await page.waitForSelector('#btf');
 await ev(()=>{DB.staff.push({id:'gvt0',n:'Giáo viên Thử',role:'gv',st:'dang',pos:'',em:'',ph:'',pay:{mode:'buoi',base:0,rate:60000,rateBt:0,allow:0,latePen:0,bh:0}});S.modal={t:'hs',id:'tst1',tab:'lh'};render()});
 await page.waitForSelector('#btf');
 const [SL1,SL2]=await ev(()=>SLOTS.map(sv=>[sv,DB.lich.filter(l=>l.type==='11'&&l.slot===sv).length]).sort((x,y)=>x[1]-y[1]||(x[0]<y[0]?-1:1)).slice(0,2).map(x=>x[0]));   /* hai ca còn nhiều chỗ trống */
 /* chọn có bán trú, T2–T7 */
 await page.selectOption('#btf [name=bt]','1');
 await page.click('#btf [data-a="dayset"][data-v="bd|1,2,3,4,5,6"]');await W();
 await page.click('#btf button[type=submit]');await W(80);
 let st=await ev(()=>{const k=DB.kids.find(x=>x.id==='tst1');return{bt:k.bt,gr:k.gr,btd:k.btd}});
 ok('hồ sơ bé: lưu bán trú T2–T7',st.bt&&!!st.gr&&st.btd.join()==='1,2,3,4,5,6',st);
 await page.waitForSelector('#btf');
 await page.click('#btf [data-a="dayset"][data-v="bd|1,2,3,4,5"]');await W();
 await page.click('#btf button[type=submit]');await W(80);
 st=await ev(()=>DB.kids.find(x=>x.id==='tst1').btd);
 ok('hồ sơ bé: đổi sang T2–T6',st.join()==='1,2,3,4,5',st);
 /* thêm buổi 1-1 cho nhiều ngày */
 await page.waitForSelector('#lsmf');
 await page.selectOption('#lsmf [name=gv]','gvt0');
 await page.fill('#lsmf [name=slot]',SL1);
 await page.click('#lsmf [data-a="dayset"][data-v="d|"]');
 for(const w of [2,4])await page.check(`#lsmf [name=d${w}]`);
 await page.click('#lsmf button[type=submit]');await W(80);
 let ls=await ev(()=>DB.lich.filter(l=>l.hs==='tst1').map(l=>l.day+'@'+l.slot).sort());
 ok('thêm cùng lúc 2 buổi 1-1 vào thứ Ba và thứ Năm',ls.join()===['2@'+SL1,'4@'+SL1].join(),{ls,SL1});
 /* trùng giờ: bé khác cùng giáo viên và ca ở thứ Ba thì không thêm được */
 await ev(sv=>{const o=DB.kids.find(x=>x.bt&&x.id!=='tst1'&&x.st==='dang');DB.lich=DB.lich.filter(l=>!(l.hs===o.id&&l.day===3));DB.lich.push({id:'tcf',type:'11',day:3,slot:sv,gv:'gvt0',hs:o.id,room:'Phòng 4'});S.modal={t:'hs',id:'tst1',tab:'lh'};render()},SL2);
 await page.waitForSelector('#lsmf');
 await page.selectOption('#lsmf [name=gv]','gvt0');
 await page.fill('#lsmf [name=slot]',SL2);
 await page.click('#lsmf [data-a="dayset"][data-v="d|"]');
 for(const w of [3,5])await page.check(`#lsmf [name=d${w}]`);
 await page.click('#lsmf button[type=submit]');await W(80);
 const res=await ev(()=>({res:S.modal.res,n:DB.lich.filter(l=>l.hs==='tst1').length}));
 ok('thêm nhiều ngày: ngày trùng giáo viên bị từ chối, ngày trống vẫn được thêm',res.res.ok===1&&res.res.bad.length===1&&/Giáo viên đã có buổi khác/.test(res.res.bad[0])&&res.n===3,res);
 ok('thông báo kết quả hiện trong hồ sơ bé',/Đã thêm 1 buổi/.test(await ev(()=>document.querySelector('.mdc').innerText))&&/Không thêm được/.test(await ev(()=>document.querySelector('.mdc').innerText)));
 const miss=await ev(()=>{const k=DB.kids.find(x=>x.id==='tst1');return btOf(k).filter(w=>!DB.lich.some(l=>l.type==='11'&&l.hs==='tst1'&&l.day===w))});
 ok('ngày bán trú chưa có ca 1-1 được báo trong hồ sơ',miss.join()==='1,3'&&/chưa có ca 1-1/.test(await ev(()=>document.querySelector('.mdc').innerText)),miss);
 await ev(()=>{S.modal=null;render()});

 /* ---------- 4. điểm danh: nghỉ ngày bán trú thì ca 1-1 trong gói nghỉ theo ---------- */
 const at=await ev(()=>{
  const k=DB.kids.find(x=>x.id==='tst1'),dm=mDates(sm(CM,-1)).filter(d=>dow(d)===2&&d<WD);const d=dm[0];
  const li=incSession(k,d),g=k.gr;
  ACT.att([d,g,'tst1','p'].join('|'));
  const mir=DB.att[d+'|'+li+'|tst1'];
  const s=settle(k,sm(CM,-1)),rows=s.rows.filter(x=>x.d===d);
  const rfP=rows.map(x=>[x.kind,x.rf,x.ls]);
  ACT.att([d,g,'tst1','p'].join('|'));   /* bấm lại để bỏ */
  const gone=DB.att[d+'|'+li+'|tst1']===undefined&&DB.att[d+'|'+g+'|tst1']===undefined;
  ACT.att([d,g,'tst1','kp'].join('|'));
  const rows2=settle(k,sm(CM,-1)).rows.filter(x=>x.d===d).map(x=>[x.kind,x.rf,x.ls]);
  ACT.att([d,g,'tst1','bv'].join('|'));
  const rowsBv=settle(k,sm(CM,-1)).rows.filter(x=>x.d===d).map(x=>[x.kind,x.rf,x.ls]);
  ACT.att([d,g,'tst1','bv'].join('|'));
  ACT.att([d,g,'tst1','tt'].join('|'));
  const rowsTt=settle(k,sm(CM,-1)).rows.filter(x=>x.d===d).map(x=>[x.kind,x.rf,x.ls]);
  DB.att[d+'|'+g+'|tst1']=undefined;delete DB.att[d+'|'+g+'|tst1'];delete DB.att[d+'|'+li+'|tst1'];
  /* quy tắc nhập viện chỉnh được: 50% phí bán trú, 100% ca 1-1 (mặc định); đổi ca 1-1 thành 0% */
  const old11=DB.cfg.rule.bvRefund11;DB.cfg.rule.bvRefund11=0;DB.att[d+'|'+g+'|tst1']='bv';
  const rowsBv0=settle(k,sm(CM,-1)).rows.filter(x=>x.d===d).map(x=>[x.kind,x.rf,x.ls]);
  DB.cfg.rule.bvRefund11=old11;delete DB.cfg.rule.bvRefund11;const rowsBvDef=settle(k,sm(CM,-1)).rows.filter(x=>x.d===d).map(x=>[x.kind,x.rf,x.ls]);
  DB.cfg.rule.bvRefund11=old11;if(old11===undefined)delete DB.cfg.rule.bvRefund11;
  delete DB.att[d+'|'+g+'|tst1'];
  return{d,li,mir,rfP,gone,rows2,rowsBv,rowsTt,rowsBv0,rowsBvDef}});
 ok('ghi nghỉ ngày bán trú: ca 1-1 trong gói nghỉ theo',at.mir==='p',at);
 ok('nghỉ có phép: hoàn 180.000 (phí 1-1), mất 200.000; chỉ một dòng quyết toán',at.rfP.length===1&&at.rfP[0][0]==='bt'&&at.rfP[0][1]===180000&&at.rfP[0][2]===200000,at);
 ok('bỏ điểm danh ngày bán trú thì ca 1-1 trong gói cũng bỏ',at.gone,at);
 ok('nghỉ không phép: mất cả 380.000, không hoàn',at.rows2.length===1&&at.rows2[0][1]===0&&at.rows2[0][2]===380000,at);
 ok('nhập viện có giấy: hoàn 50% phí bán trú 200.000 (=100.000) và 100% ca 1-1 180.000, tổng 280.000',at.rowsBv.length===1&&at.rowsBv[0][1]===280000&&at.rowsBv[0][2]===100000,at.rowsBv);
 ok('nhập viện: đổi hoàn ca 1-1 về 0% thì chỉ hoàn 100.000',at.rowsBv0.length===1&&at.rowsBv0[0][1]===100000&&at.rowsBv0[0][2]===280000,at.rowsBv0);
 ok('nhập viện: cấu hình cũ chưa có bvRefund11 vẫn hoàn 100% ca 1-1',at.rowsBvDef.length===1&&at.rowsBvDef[0][1]===280000,at.rowsBvDef);
 ok('Trung tâm nghỉ ngày bán trú: không tính phí nghỉ, xếp học bù',at.rowsTt.length===1&&at.rowsTt[0][1]===0&&at.rowsTt[0][2]===0,at.rowsTt);

 /* ---------- 5. lương giáo viên ---------- */
 const pay=await ev(()=>{
  const m=sm(CM,-1);const dts=mDates(m).filter(d=>dow(d)>=1&&dow(d)<=5&&d<WD);
  const mkT=(id,rate,mode)=>({id,n:'GV '+id,role:'gv',st:'dang',pay:{mode:mode||'buoi',base:mode==='thang'?8000000:0,rate:rate,rateBt:0,allow:0,latePen:0,bh:0}});
  const s60=mkT('gvt60',60000),s80=mkT('gvt80',80000),sf=mkT('gvtf',0,'thang');
  DB.staff.push(s60,s80,sf);
  const put=(sid,hs,day,i,code)=>{const dd=dts.filter(d=>dow(d)===day)[i];DB.lich.push({id:'p'+sid+hs+day+i,type:'11',day:day,slot:'11:00',gv:sid,hs:hs,room:'Phòng 5'});DB.att[dd+'|p'+sid+hs+day+i+'|'+hs]=code;return dd};
  const run=(sid,rate)=>{
   /* thứ Hai đến thứ Sáu: có mặt, nghỉ KP, nghỉ có phép, Trung tâm nghỉ, có mặt */
   put(sid,'tst9',1,0,'cm');put(sid,'tst9',2,0,'kp');put(sid,'tst9',3,0,'p');put(sid,'tst9',4,0,'tt');put(sid,'tst9',5,0,'cm');
   /* buổi học bù (dạy bù) một ngày thứ Hai khác */
   const d=dts.filter(x=>dow(x)===1)[1];DB.lich.push({id:'bu'+sid,type:'bu',date:d,slot:'12:00',gv:sid,hs:'tst9',room:'Phòng 5'});DB.att[d+'|bu'+sid+'|tst9']='cm'};
  run('gvt60');run('gvt80');run('gvtf');
  const A=payroll(s60,m),B=payroll(s80,m),F=payroll(sf,m);
  const r1={a:A.bySess,b:B.bySess,f:F.bySess,cm:A.teach,kp:A.kp,p:A.p,tt:A.tt,bu:A.bu};
  DB.cfg.rule.gvKp=100;const A100=payroll(s60,m).bySess;
  DB.cfg.rule.gvKp=50;DB.cfg.rule.gvP=50;const Ap=payroll(s60,m).bySess;DB.cfg.rule.gvP=0;
  return Object.assign(r1,{kp100:A100,p50:Ap,pc:gvPct()})});
 ok('ca đã dạy: có mặt 2 buổi và dạy bù 1 buổi được trả đủ',pay.cm===3&&pay.bu===1&&pay.kp===1&&pay.p===1&&pay.tt===1,pay);
 ok('giáo viên 60.000đ: 3 ca đủ + 1 ca bé nghỉ KP 50% (30.000), nghỉ có phép và Trung tâm nghỉ 0',pay.a===3*60000+30000,pay);
 ok('giáo viên 80.000đ: 3 ca đủ + 1 ca bé nghỉ KP 50% (40.000)',pay.b===3*80000+40000,pay);
 ok('giáo viên bán trú lương cố định: ca 1-1 không cộng thêm theo buổi',pay.f===0,pay);
 ok('đổi tỉ lệ ở Cài đặt có hiệu lực ngay (KP 100%, có phép 50%)',pay.kp100===4*60000+60000-60000+0&&pay.kp100===240000&&pay.p50===3*60000+30000+30000,pay);

 /* ---------- 6. chẩn đoán ---------- */
 const lib=await ev(()=>({groups:DXG.length,n:DXG.reduce((a,g)=>a+g.a.length,0),titles:DXG.map(g=>g.t).join('|'),names:DXG.map(g=>g.a.map(x=>x[1]+' '+x[2]).join(' ')).join(' ')}));
 ok('thư viện chẩn đoán đủ nhóm: ngôn ngữ, nói, giao tiếp xã hội, phát triển, khiếm thính, thần kinh, tâm lý',lib.groups>=7&&lib.n>=60&&/ngôn ngữ/i.test(lib.names)&&/tự kỷ/i.test(lib.names)&&/chậm nói/i.test(lib.names)&&/nói lắp/i.test(lib.names)&&/điếc|khiếm thính/i.test(lib.names)&&/ADHD|tăng động/i.test(lib.names)&&/chậm phát triển/i.test(lib.names)&&/não/i.test(lib.names),lib);
 const kid1=await ev(()=>{const k=DB.kids.find(x=>x.st==='dang');k.dx=[];k.dxo='';k.dxn='';S.modal={t:'hsf',id:k.id};render();return k.id});
 await page.waitForSelector('#dxq');
 const dxUi=await ev(()=>({has:/Chẩn đoán/.test(document.querySelector('.mdc').innerText),boxes:document.querySelectorAll('.mdc input[name=dx]').length,groups:document.querySelectorAll('.mdc details[data-fg]').length}));
 ok('form hồ sơ có mục Chẩn đoán với nhiều nhóm và lựa chọn',dxUi.has&&dxUi.boxes===lib.n&&dxUi.groups===lib.groups,dxUi);
 /* lọc theo từ khóa không dựng lại form, nội dung đang nhập không mất */
 await page.fill('#hf-dxo','Rối loạn khác thử');
 await page.fill('#dxq','noi lap');await W(60);
 const flt=await ev(()=>{const all=[...document.querySelectorAll('.mdc .dxi')],vis=all.filter(e=>!e.hidden&&getComputedStyle(e).display!=='none');return{tot:all.length,vis:vis.length,txt:vis.map(e=>e.textContent).join('|').slice(0,200),keep:document.querySelector('#hf-dxo').value}});
 ok('ô lọc chẩn đoán thu gọn danh sách và giữ nguyên nội dung đang nhập',flt.vis>=1&&flt.vis<flt.tot/4&&/nói lắp/i.test(flt.txt)&&flt.keep==='Rối loạn khác thử',flt);
 /* chọn nhiều chẩn đoán và lưu */
 await page.fill('#dxq','');await W(40);
 const pick=await ev(()=>{const ids=[];['tự kỷ','nói lắp','chậm nói'].forEach(t=>{const l=[...document.querySelectorAll('.mdc .dxi')].find(e=>new RegExp(t,'i').test(e.textContent));if(l){const c=l.querySelector('input');c.checked=true;ids.push(c.value)}});return ids});
 ok('tìm được 3 chẩn đoán để chọn',pick.length===3,pick);
 await page.fill('#hf-dxn','BV Nhi Đà Nẵng, 2026');
 await page.click('.mdc form button[type=submit]');await W(100);
 const saved=await ev(i=>{const k=kidBy(i);return{dx:k.dx,dxo:k.dxo,dxn:k.dxn,modal:!!S.modal,short:dxShort(k),names:dxNames(k)}},kid1);
 ok('lưu nhiều chẩn đoán cùng chẩn đoán khác và nơi chẩn đoán',pick.every(x=>saved.dx.includes(x))&&saved.dx.length===3&&saved.dxo==='Rối loạn khác thử'&&saved.dxn==='BV Nhi Đà Nẵng, 2026'&&Array.isArray(saved.names),saved);
 const show=await ev(i=>{S.modal={t:'hs',id:i,tab:'info'};render();return document.querySelector('.mdc').innerText},kid1);
 ok('hồ sơ bé hiển thị đủ các chẩn đoán đã chọn',/Chẩn đoán/.test(show)&&/tự kỷ/i.test(show)&&/nói lắp/i.test(show)&&/Rối loạn khác thử/.test(show),show.slice(0,300));
 await ev(()=>{S.modal=null;render()});
 await ev(()=>{DB.kids=DB.kids.filter(k=>k.id!=='tst1');DB.lich=DB.lich.filter(l=>l.hs!=='tst1'&&l.hs!=='tst9');DB.staff=DB.staff.filter(s=>!/^gvt/.test(s.id))});

 /* ---------- 7. thời khóa biểu bán trú ghép giờ 1-1 ---------- */
 await page.click('.nav button[data-v="lh"]');await W(80);
 const bt=await page.$('#main .tab[data-v="bt"]');if(bt){await bt.click();await W(80)}
 const t1=await ev(()=>({txt:document.querySelector('#main').innerText,rows:document.querySelectorAll('#main table.tkt tbody tr').length,chips:document.querySelectorAll('#main table.tkt .kc').length}));
 ok('Lịch học > Bán trú hiện thời khóa biểu lớp kiểu mầm non (nhiều khung giờ) kèm tên bé ra học 1-1',t1.rows>=8&&t1.chips>=1&&/Ăn|Ngủ|Vận động|Đón|Trả/i.test(t1.txt),t1);
 const g1=await ev(()=>({bd:DB.groups.map(g=>g.id)}));
 /* sửa thời khóa biểu */
 await page.click('[data-a="tkbedit"]');await page.waitForSelector('#tkbf');
 const n0=await ev(()=>S.modal.rows.length);
 await page.click('[data-a="tkbadd"]');await W(60);
 const n1=await ev(()=>S.modal.rows.length);
 await page.fill('#tkbf [name="n'+(n1-1)+'"]','Hoạt động thử');
 await page.fill('#tkbf [name="s'+(n1-1)+'"]','17:00');await page.fill('#tkbf [name="e'+(n1-1)+'"]','17:30');
 await page.click('#tkbf button[type=submit]');await W(80);
 const sv=await ev(()=>({n:DB.tkb.filter(r=>r.n==='Hoạt động thử').length,all:DB.tkb.length,m:S.modal}));
 ok('thêm một dòng vào thời khóa biểu và lưu',n1===n0+1&&sv.n===1&&!sv.m,{n0,n1,sv});
 /* chồng giờ bị chặn */
 await page.click('[data-a="tkbedit"]');await page.waitForSelector('#tkbf');
 await page.fill('#tkbf [name="s0"]','12:00');await page.fill('#tkbf [name="e0"]','12:00');
 await page.click('#tkbf button[type=submit]');await W(80);
 ok('giờ bắt đầu không trước giờ kết thúc bị chặn',await ev(()=>!!S.modal&&S.modal.t==='tkb'));
 await ev(()=>{S.modal=null;render()});
 /* góc nhìn từng bé */
 const mine=await ev(()=>{const g=DB.groups[0],k=DB.kids.find(x=>x.gr===g.id&&x.bt&&x.st==='dang');return{k:k.id,html:kidWeek(k),n:DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).length}});
 ok('thời khóa biểu từng bé ghép lịch lớp với các ca 1-1 riêng',/Khác|<table/.test(mine.html)&&(mine.html.match(/1-1 ·/g)||[]).length>=1,mine.n);

 /* ---------- 8. phân quyền thấy tiền / thời khóa biểu ---------- */
 for(const r of ['ql','gv','ph']){
  await page.selectOption('#demo-role',r);await page.waitForSelector('.nav');await W(60);
  await page.click('.nav button[data-v="lh"]');await W(80);
  const bt2=await page.$('#main .tab[data-v="bt"]');if(bt2){await bt2.click();await W(80)}
  const tx=await ev(()=>document.querySelector('#main').innerText);
  ok(r+': thấy thời khóa biểu, không thấy giá 380.000',!/380\.000|180\.000/.test(tx)&&/\d{2}:\d{2}/.test(tx),tx.slice(0,200));
  if(r==='ql'){
   await page.click('.nav button[data-v="tn"]').catch(()=>{});
  }
 }
 ok('không có lỗi trang trong suốt quá trình',errs.length===0,errs);
 await b.close();
 console.log(fails?`${fails} FAIL, ${passes} PASS`:'ALL PASS ('+passes+')');
 process.exit(fails?1:0)})();
