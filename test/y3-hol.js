/* Yêu cầu 3: ngày nghỉ lễ / Trung tâm cho nghỉ đặt trước, học phí trả trước tính theo lịch đã trừ ngày nghỉ,
   học phí tháng sau = học phí tháng sau trừ phí dư tháng trước, ngưng đột ngột không hoàn phí dư */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
const sw=async(page,r)=>{await page.selectOption('#demo-role',r);await page.waitForSelector('.nav');await page.waitForTimeout(40)};
const main=page=>page.evaluate(()=>document.querySelector('#main').innerText);
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||60);
 await login(page,'tt');

 /* ---------- 1. dữ liệu và nâng cấp ---------- */
 const d0=await ev(()=>({v:DB.v,hol:DB.hol.length,d:DB.hol[0]&&DB.hol[0].d,isArr:Array.isArray(DB.hol)}));
 ok('dữ liệu mẫu bản 6 có danh sách ngày nghỉ (mẫu: Tết Dương lịch sắp tới)',d0.v===6&&d0.isArr&&d0.hol===1&&/-01-01$/.test(d0.d),d0);
 const mg=await ev(()=>{const d=JSON.parse(JSON.stringify(DB));delete d.hol;d.v=5;migrate6(d);const r={v:d.v,hol:Array.isArray(d.hol)&&d.hol.length===0};DB=JSON.parse(JSON.stringify(DB));return r});
 ok('nâng cấp bản 5 lên bản 6: thêm hol rỗng, giữ nguyên dữ liệu',mg.v===6&&mg.hol,mg);

 /* dữ liệu bản 5 đã lưu trong trình duyệt: mở lại thì tự nâng lên bản 6, không mất dữ liệu */
 const before=await ev(()=>{const d=JSON.parse(JSON.stringify(DB));delete d.hol;d.v=5;localStorage.setItem('gb_v2',JSON.stringify(d));return{kids:d.kids.length,lg:d.lg.length,att:Object.keys(d.att).length,lich:d.lich.length}});
 await page.reload();await page.waitForSelector('.nav,.lg');if(await page.$('.lg'))await login(page,'tt');
 const after=await ev(()=>({v:DB.v,hol:Array.isArray(DB.hol)&&DB.hol.length===0,kids:DB.kids.length,lg:DB.lg.length,att:Object.keys(DB.att).length,lich:DB.lich.length,stored:JSON.parse(localStorage.getItem('gb_v2')).v}));
 ok('mở lại dữ liệu bản 5 đã lưu: nâng lên bản 6, giữ nguyên bé, công nợ, điểm danh, lịch',after.v===6&&after.stored===6&&after.hol&&after.kids===before.kids&&after.lg===before.lg&&after.att===before.att&&after.lich===before.lich,{before,after});
 await ev(()=>{DB.hol=[]});

 /* ---------- 2. học phí trả trước trừ ngày nghỉ ---------- */
 const M=await ev(()=>sm(CM,1));
 const t1=await ev(m=>{
  DB.hol=[];
  const ds=mDates(m),wed=ds.filter(d=>dow(d)===3),thu=ds.filter(d=>dow(d)===4),sun=ds.find(d=>dow(d)===0);
  const k={id:'y3a',n:'Bé Thử Y3',g:'M',dob:'2021-01-01',sd:'2026-01-01',st:'dang',nd:'Ngôn ngữ',bt:true,gr:'G1',btd:[3,4],pr:'Mẹ',pn:'PH Thử',pp:'0900000001',pe:'',m11:0,gv:null,dx:[]};
  DB.kids.push(k);DB.lich=DB.lich.filter(l=>l.hs!=='y3a');
  DB.lich.push({id:'ya1',type:'11',day:3,slot:'08:05',gv:'nv10',hs:'y3a',room:'Phòng 1'},{id:'ya2',type:'11',day:3,slot:'09:45',gv:'nv10',hs:'y3a',room:'Phòng 2'},{id:'ya3',type:'11',day:4,slot:'08:05',gv:'nv10',hs:'y3a',room:'Phòng 3'});
  const base=invoice(k,m),exp=(wed.length+thu.length)*DB.cfg.pbtDay+wed.length*DB.cfg.p11;
  DB.hol=[{id:'t1',d:wed[1],n:'Nghỉ thử thứ Tư',k:'tt'}];
  const afterWed=invoice(k,m);
  DB.hol.push({id:'t2',d:thu[0],n:'Nghỉ thử thứ Năm',k:'le'});
  const afterThu=invoice(k,m);
  DB.hol.push({id:'t3',d:sun,n:'Chủ nhật',k:'le'});
  const afterSun=invoice(k,m);
  const fb=feeBreak(k,m);
  return{base,exp,wedDelta:base-afterWed,thuDelta:afterWed-afterThu,sunDelta:afterThu-afterSun,bt:fb.bt,s11:fb.s11,closed:fb.closed.length,nW:wed.length,nT:thu.length,pbt:DB.cfg.pbtDay,p11:DB.cfg.p11}},M);
 ok('hóa đơn theo lịch: bán trú T4+T5 và 1-1 thêm thứ Tư',t1.base===t1.exp,t1);
 ok('ngày nghỉ thứ Tư trừ ngày bán trú 380.000 và ca 1-1 tính riêng 180.000 (ca trong gói không trừ lần hai)',t1.wedDelta===t1.pbt+t1.p11,t1);
 ok('ngày nghỉ thứ Năm trừ đúng 380.000 (ca 1-1 nằm trong gói bán trú)',t1.thuDelta===t1.pbt,t1);
 ok('ngày nghỉ rơi vào Chủ nhật không đổi học phí và không tính vào danh sách ngày nghỉ của tháng',t1.sunDelta===0&&t1.closed===2,t1);
 ok('feeBreak đếm đúng số ngày bán trú và buổi 1-1 riêng sau khi trừ ngày nghỉ',t1.bt===t1.nW+t1.nT-2&&t1.s11===t1.nW-1,t1);

 /* ---------- 3. lịch, điểm danh, học bù, chấm công ---------- */
 const t2=await ev(m=>{
  const hd=DB.hol.find(h=>h.id==='t1').d,w=dow(hd);
  const k=kidBy('y3a'),xs=sched(k,m).filter(x=>x.d===hd).length;
  const dl=dayList(hd).length;
  const cf=conflict({id:'zz',type:'bu',date:hd,slot:'14:00',gv:'nv10',hs:'y3a',room:'Phòng 1'});
  const fs=freeSlots('nv10','y3a',addD(hd,-2),14).some(s=>s.date===hd);
  const st=tsSt('nv10',hd);
  return{hd,w,xs,dl,cf,fs,st}},M);
 ok('ngày nghỉ: bé không có buổi nào trong lịch và danh sách điểm danh ngày đó trống',t2.xs===0&&t2.dl===0,t2);
 ok('ngày nghỉ: không xếp được học bù, tìm khung giờ trống bỏ qua ngày nghỉ',/Trung tâm nghỉ ngày này/.test(t2.cf)&&!t2.fs,t2);
 ok('ngày nghỉ: nhân viên được ghi là nghỉ lễ (không phải vắng)',t2.st==='hol',t2);
 /* lương: ngày nghỉ lễ tính đủ công cho giáo viên theo tháng; giáo viên theo ca không có ca */
 const pr=await ev(()=>{
  const pm=sm(CM,-1),hd=mDates(pm).filter(d=>dow(d)===2)[0];
  const sm_=DB.staff.find(s=>s.pay&&s.pay.mode==='thang'&&s.role==='gv'&&s.st==='dang'),sb=DB.staff.find(s=>s.pay&&s.pay.mode==='buoi'&&s.st==='dang');
  DB.hol=[];const a1=payroll(sm_,pm),b1=payroll(sb,pm);
  DB.hol=[{id:'p1',d:hd,n:'Nghỉ thử',k:'le'}];const a2=payroll(sm_,pm),b2=payroll(sb,pm);
  DB.hol=[];
  return{hd,cong1:a1.cong,cong2:a2.cong,hol2:a2.hol,abs1:a1.abs,abs2:a2.abs,sess1:b1.teach+b1.kp+b1.p,sess2:b2.teach+b2.kp+b2.p,net1:a1.net,net2:a2.net}});
 ok('lương giáo viên theo tháng: ngày nghỉ lễ tính là ngày công hưởng lương, không bị tính vắng',pr.hol2===1&&pr.cong2>=pr.cong1&&pr.abs2<=pr.abs1,pr);
 ok('giáo viên theo ca: ngày nghỉ lễ không có ca dạy nên không tăng số ca',pr.sess2<=pr.sess1,pr);

 /* ---------- 4. giao diện: tab Ngày nghỉ lễ, thêm, xóa, quyền ---------- */
 await ev(()=>{DB.hol=[];go('lh');render();S.lh.tab='hol';render()});await W(100);
 let tx=await main(page);
 ok('Lịch học có tab Ngày nghỉ lễ và hướng dẫn đặt trước khi tạo hóa đơn',/Ngày nghỉ lễ/.test(tx)&&/Học phí đóng trước đầu tháng/.test(tx)&&!!(await page.$('#holf')),tx.slice(0,200));
 const d1=await ev(()=>{const m=sm(CM,1);return mDates(m).filter(d=>dow(d)===1).slice(0,1).concat(mDates(m).filter(d=>dow(d)===0).slice(0,1))});   /* một thứ Hai và chủ nhật liền sau */
 const a=await ev(()=>{const m=sm(CM,1),ds=mDates(m);const i=ds.findIndex(d=>dow(d)===6);return[ds[i],ds[i+2]]});   /* thứ Bảy đến thứ Hai: có chủ nhật ở giữa */
 await page.fill('#hl-a',a[0]);await page.fill('#hl-b',a[1]);await page.fill('#hl-n','Nghỉ Tết thử');await page.selectOption('#hl-k','tt');
 await page.click('#holf button[type=submit]');await W(120);
 const h1=await ev(()=>DB.hol.map(h=>h.d+'|'+h.n+'|'+h.k));
 ok('thêm khoảng ngày thứ Bảy đến thứ Hai: bỏ qua Chủ nhật, lưu 2 ngày',h1.length===2&&h1.every(x=>/Nghỉ Tết thử\|tt$/.test(x))&&!h1.some(x=>x.startsWith(addDays(a[0],1))),h1);
 await page.fill('#hl-a',a[0]);await page.fill('#hl-n','Trùng');await page.click('#holf button[type=submit]');await W(100);
 ok('thêm lại ngày đã có: không tạo bản trùng',(await ev(()=>DB.hol.length))===2);
 tx=await main(page);
 ok('danh sách hiện ngày nghỉ, loại và ảnh hưởng',/Nghỉ Tết thử/.test(tx)&&/Trung tâm cho nghỉ/.test(tx)&&/bé bán trú/.test(tx),tx.slice(0,500));
 ok('Trưởng Trung tâm thấy cột học phí giảm',/Học phí giảm/.test(tx));
 /* lưới tuần hiện ô nghỉ */
 await ev(a=>{S.lh.tab='wk';S.lh.wk=monOf(a);S.lh.mode='all';render()},a[0]);await W(100);
 const gt=await ev(()=>document.querySelector('#main table.wkt').innerText);
 ok('lưới tuần có đánh dấu Nghỉ và tên ngày nghỉ ở ô',/Nghỉ/.test(gt)&&/Nghỉ Tết thử/.test(gt),gt.slice(0,200));
 /* điểm danh ngày nghỉ */
 await ev(a=>{go('dd');render();S.dd.tab='roll';S.dd.date=a[0];render()},a[0]);await W(100);
 /* thêm ngày đã điểm danh phải hỏi lại */
 const wa=await ev(()=>{const d=addD(TODAY,-1);const dd=isW(d)?d:addD(d,-1);DB.hol=[];const k=DB.kids.find(x=>x.st==='dang');DB.att[dd+'|zz|'+k.id]='cm';go('lh');render();S.lh.tab='hol';render();return dd});
 await page.fill('#hl-a',wa);await page.fill('#hl-n','Đã điểm danh');await page.click('#holf button[type=submit]');await W(100);
 ok('ngày đã có điểm danh: hỏi xác nhận trước khi đặt là ngày nghỉ',(await ev(()=>!!S.modal&&S.modal.t==='ask'))&&(await ev(()=>DB.hol.length))===0);
 await page.click('.mdc [data-a="mx"],.mdc .btn:not(.p)').catch(()=>{});await ev(()=>{S.modal=null;render()});
 await ev(()=>{delete DB.att[Object.keys(DB.att).find(k=>k.includes('|zz|'))]});
 /* quick-add dương lịch */
 await ev(()=>{DB.hol=[];render()});
 await page.click('[data-a="holsol"]');await W(80);
 const sol=await ev(()=>DB.hol.map(h=>h.d.slice(5)).sort().join());
 ok('thêm nhanh 4 ngày lễ dương lịch: 1/1, 30/4, 1/5, 2/9',sol==='01-01,04-30,05-01,09-02'||sol==='01-01,04-30,05-01,09-02'.split(',').filter(x=>true).join(),sol);
 await page.click('[data-a="holsol"]');await W(80);
 ok('bấm thêm lần hai không tạo bản trùng',(await ev(()=>DB.hol.length))===4);
 /* xóa */
 const del=await ev(()=>{const id=DB.hol[0].id;ACT.holdel(id);return id});await W(40);
 await page.click('.mdc .btn.p, .mdc .btn.no').catch(()=>{});await W(60);
 ok('xóa ngày nghỉ có hỏi xác nhận',(await ev(()=>DB.hol.length))===3||(await ev(()=>!!S.modal)),null);
 await ev(()=>{S.modal=null;render()});

 /* quyền: tt, ql, vp được sửa; gv và ph không */
 const perm=async(r,dt)=>{await sw(page,r);return ev(dt=>{const n=DB.hol.length;const f=document.createElement('form');f.innerHTML='<input name=from value='+dt+'><input name=to><input name=n value=Thử><input name=k value=le>';const rf=FORM.holf(f);const a=ACT.holsol('2031');const dl=ACT.holdel(DB.hol[0].id);const added=DB.hol.length-n;if(S.modal)S.modal=null;return{rf,sol:a,del:dl,added}},dt)};
 const pv=await perm('vp','2030-05-06'),pq=await perm('ql','2030-05-07'),pg_=await perm('gv','2030-05-08'),pp=await perm('ph','2030-05-09');
 ok('Văn phòng được thêm ngày nghỉ',pv.added>0,pv);
 ok('Quản lý được thêm ngày nghỉ',pq.added>0,pq);
 ok('Giáo viên không sửa được ngày nghỉ (gọi thẳng cũng bị từ chối)',pg_.rf===false&&pg_.sol===false&&pg_.del===false&&pg_.added===0,pg_);
 ok('Phụ huynh không sửa được ngày nghỉ',pp.rf===false&&pp.sol===false&&pp.del===false&&pp.added===0,pp);
 await sw(page,'tt');

 /* ---------- 5. phí dư tháng trước và học phí tháng sau ---------- */
 const sp=await ev(()=>{
  DB.hol=[];const pm=sm(CM,-1),nm=CM;
  const k=kidBy('y3a');k.btd=[3];k.bt=true;k.gr='G1';
  DB.lich=DB.lich.filter(l=>l.hs!=='y3a');
  DB.lich.push({id:'yb1',type:'11',day:2,slot:'08:05',gv:'nv10',hs:'y3a',room:'Phòng 1'});   /* 1-1 thứ Ba */
  const d=mDates(pm).filter(x=>dow(x)===2&&x<WD)[0];DB.att[d+'|yb1|y3a']='p';   /* nghỉ có phép: hoàn 70% */
  const r=settle(k,pm),f0=feeBreak(k,nm);
  postSettle(k,pm);const f1=feeBreak(k,nm);
  return{refund:r.refund,sur0:f0.sur,posted0:f0.posted,sur1:f1.sur,posted1:f1.posted,gross:f1.gross,due:f1.due,exp:Math.round(DB.cfg.p11*(100-DB.cfg.rule.pLoss)/100),bal:balance('y3a')}});
 ok('nghỉ có phép 1 buổi 1-1: phí dư = 70% × 180.000 = 126.000',sp.refund===126000&&sp.exp===126000,sp);
 ok('trước khi ghi vào công nợ, phí dư là số tạm tính; sau khi ghi là số chính thức',sp.sur0===126000&&!sp.posted0&&sp.sur1===126000&&sp.posted1,sp);
 ok('học phí tháng sau phải đóng = học phí tháng sau − phí dư tháng trước',sp.due===sp.gross-126000,sp);
 /* tạo hóa đơn: công nợ = hóa đơn − phí dư */
 const gen=await ev(()=>{const nm=CM;DB.lg=DB.lg.filter(e=>!(e.hs==='y3a'&&e.kind==='hp'));ACT.hpgen(nm);const hp=DB.lg.filter(e=>e.hs==='y3a'&&e.kind==='hp').reduce((s,e)=>s+e.amt,0);return{hp,bal:balance('y3a'),sur:surM('y3a',nm)}});
 ok('sau khi tạo hóa đơn, công nợ của bé = hóa đơn − phí dư tháng trước',gen.hp>0&&gen.bal===gen.hp-gen.sur&&gen.sur===126000,gen);
 /* bé ngưng đột ngột: không còn phí dư mới, không hoàn */
 const stop=await ev(()=>{const pm=sm(CM,-1),k=kidBy('y3a');k.st='nghi';DB.lg=DB.lg.filter(e=>!(e.hs==='y3a'&&e.kind==='hoan'));
  const r=settle(k,pm),sp=surplusPrev(k,CM);postSettle(k,pm);return{refund:r.refund,stop:r.stop,sur:sp.amt,posted:DB.lg.filter(e=>e.hs==='y3a'&&e.kind==='hoan').length,tag:balTag(-5000,k)}});
 ok('bé ngưng đột ngột: phí dư bằng 0, không ghi khoản hoàn nào, nhãn "Dư không hoàn"',stop.refund===0&&stop.stop&&stop.sur===0&&stop.posted===0&&/Dư không hoàn/.test(stop.tag),stop);
 await ev(()=>{kidBy('y3a').st='dang'});

 /* ---------- 6. giao diện học phí ---------- */
 await ev(()=>{DB.hol=[{id:'q1',d:mDates(sm(CM,1)).find(d=>dow(d)===3),n:'Nghỉ thử',k:'tt'}];go('hp');render();S.hp.tab='hd';S.hp.gm=sm(CM,1);render()});await W(100);
 tx=await main(page);
 ok('Tạo hóa đơn: nêu ngày nghỉ không tính học phí, có cột Trừ phí dư tháng trước và Phải đóng',/1 ngày nghỉ không tính học phí/.test(tx)&&/Trừ phí dư tháng trước/.test(tx)&&/Phải đóng/.test(tx)&&/Xem và thêm ngày nghỉ/.test(tx),tx.slice(0,600));
 await ev(()=>{DB.hol=[];render()});await W(60);
 tx=await main(page);
 ok('Tạo hóa đơn: cảnh báo khi chưa đặt ngày nghỉ nào',/Chưa đặt ngày nghỉ nào/.test(tx),tx.slice(0,400));
 await page.click('[data-a="holgo"]');await W(80);
 ok('nút Xem và thêm ngày nghỉ mở tab Ngày nghỉ lễ trong Học phí',!!(await page.$('#holf')));
 await ev(()=>{S.hp.tab='tq';render()});await W(60);
 ok('Công nợ học sinh có cột Trừ phí dư tháng trước',/Trừ phí dư tháng trước/.test(await main(page)));

 /* ---------- 7. phụ huynh ---------- */
 await ev(()=>{DB.hol=[{id:'q2',d:addD(TODAY,3),n:'Nghỉ lễ thử',k:'le'}];DB.hol=DB.hol});
 await sw(page,'ph');
 const pk=await ev(()=>{const k=myKids().find(x=>x.st==='dang');return k&&k.id});
 await ev(()=>{go('hp');render()});await W(80);
 tx=await main(page);
 ok('Phụ huynh: thấy thẻ Học phí tháng sau với phí dư và số phải đóng',/dự kiến/.test(tx)&&/Trừ phí dư/.test(tx)&&/Phải đóng/.test(tx)&&/Học phí đóng trước đầu tháng/.test(tx),tx.slice(0,700));
 await ev(()=>{go('lh');render()});await W(80);
 tx=await main(page);
 ok('Phụ huynh: lịch học có thẻ Ngày Trung tâm nghỉ',/Ngày Trung tâm nghỉ/.test(tx)&&/Nghỉ lễ thử/.test(tx),tx.slice(0,300));
 ok('Phụ huynh không có tab hay form sửa ngày nghỉ',!(await page.$('#holf')));
 await sw(page,'tt');

 ok('không có lỗi JS',errs.length===0,errs);
 await b.close();
 console.log(passes+' PASS, '+fails+' FAIL');process.exit(fails?1:0)})();
function addDays(d,n){const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}
