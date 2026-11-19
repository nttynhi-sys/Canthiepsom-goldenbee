/* (1) Phụ huynh thấy giáo viên dạy thay; (2) giáo viên fulltime được chấm công nghỉ nửa ngày (sáng, chiều) hoặc cả ngày, có phép hoặc không lương;
   Trưởng Trung tâm, Quản lý, Văn phòng ghi được; công và lương đúng; giờ nghỉ nửa ngày cần dạy thay */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 /* giáo viên fulltime cần chấm công và một ngày làm việc đã qua trong tháng */
 const P=await ev(()=>{const T=DB.staff.find(s=>s.role==='gv'&&s.st==='dang'&&needCC(s)&&isFT(s));if(!T)return null;
  for(let d=addD(WD,-1);d>=CM+'-01';d=addD(d,-1)){if(!isW(d)||isClosed(d)||DB.lr.some(l=>l.st===T.id&&l.f<=d&&d<=l.t))continue;return{T:T.id,d}}return null});
 ok('có giáo viên fulltime và ngày làm việc đã qua để thử',!!P,P);
 const pay=()=>ev(p=>{const q=payroll(stBy(p.T),CM);return{cong:q.cong,leave:q.leave,abs:q.abs,st:tsSt(p.T,p.d)}},P);
 await ev(p=>{DB.ts[p.T+'|'+p.d]={i:'07:15',o:'18:00'}},P);const P0=await pay();
 ok('có mặt đủ ngày: tính 1 công',P0.st==='ok',P0);
 /* chấm nghỉ qua giao diện: Trưởng Trung tâm */
 await ev(p=>{S.cc={tab:'hn',m:CM,d:p.d};go('cc');render()},P);await page.waitForSelector('[data-a="tsl"][data-v="'+P.T+'|'+P.d+'"]');
 ok('bảng chấm công trong ngày: mỗi giáo viên có nút Nghỉ',!!(await page.$('[data-a="tsl"][data-v="'+P.T+'|'+P.d+'"]')));
 await page.click('[data-a="tsl"][data-v="'+P.T+'|'+P.d+'"]');await page.waitForSelector('#tslf');
 ok('hộp chấm công nghỉ: 3 lựa chọn (cả ngày, nửa ngày sáng, nửa ngày chiều) và loại có phép / không lương',(await page.$$('#tslf input[name=l]')).length===3&&/không lương/.test(await page.textContent('#tl-k')));
 await page.check('#tslf input[value=am]');await page.click('#tslf button[type=submit]');await W(200);
 const A=await ev(p=>({r:DB.ts[p.T+'|'+p.d]}),P),P1=await pay();
 ok('nghỉ nửa ngày sáng có phép: ghi l=am, làm từ 13:00, trạng thái nửa ngày',A.r&&A.r.l==='am'&&A.r.i==='13:00'&&!A.r.lk&&P1.st==='half',[A,P1]);
 ok('nửa ngày có phép: vẫn hưởng đủ công, nghỉ phép tính 0,5 ngày',P1.cong===P0.cong&&Math.abs(P1.leave-P0.leave-0.5)<1e-9,[P0,P1]);
 /* nửa ngày chiều không lương */
 await ev(p=>{S.modal={t:'tsl',id:p.T,d:p.d};render()},P);await page.waitForSelector('#tslf');
 ok('mở lại hộp: hiện lựa chọn đã ghi và nút Bỏ nghỉ',await page.isChecked('#tslf input[value=am]')&&!!(await page.$('[data-a="tslclr"]')));
 await page.check('#tslf input[value=pm]');await page.selectOption('#tl-k','1');await page.click('#tslf button[type=submit]');await W(200);
 const P2=await pay(),A2=await ev(p=>DB.ts[p.T+'|'+p.d],P);
 ok('nghỉ nửa ngày chiều không lương: làm đến 12:00, trạng thái nửa ngày không lương',A2.l==='pm'&&A2.lk===1&&A2.o==='12:00'&&P2.st==='halfkl',[A2,P2]);
 ok('nửa ngày không lương: tính nửa công, vắng 0,5 ngày',Math.abs(P2.cong-(P0.cong-0.5))<1e-9&&Math.abs(P2.abs-(P0.abs+0.5))<1e-9,[P0,P2]);
 /* cả ngày */
 await ev(p=>{S.modal={t:'tsl',id:p.T,d:p.d};render()},P);await page.waitForSelector('#tslf');
 await page.check('#tslf input[value=full]');await page.selectOption('#tl-k','');await page.click('#tslf button[type=submit]');await W(200);
 const P3=await pay();
 ok('nghỉ cả ngày có phép: trạng thái Nghỉ phép, hưởng đủ công, nghỉ phép 1 ngày',P3.st==='leave'&&P3.cong===P0.cong&&Math.abs(P3.leave-P0.leave-1)<1e-9,[P0,P3]);
 await ev(p=>{DB.ts[p.T+'|'+p.d].lk=1},P);const P4=await pay();
 ok('nghỉ cả ngày không lương: không tính công, vắng 1 ngày',P4.st==='kl'&&Math.abs(P4.cong-(P0.cong-1))<1e-9&&Math.abs(P4.abs-(P0.abs+1))<1e-9,[P0,P4]);
 /* bảng công tháng: ký hiệu nửa ngày và chú giải */
 await ev(p=>{DB.ts[p.T+'|'+p.d]={i:'13:00',o:'18:00',l:'am'};S.cc={tab:'bang',m:CM};go('cc');render()},P);await page.waitForSelector('.sheet');
 ok('bảng công tháng: có ký hiệu N (nghỉ nửa ngày) ở chú giải và trong ô',/Nghỉ nửa ngày/.test(await page.textContent('.legend'))&&!!(await page.$('.sheet button.sc-N')));
 /* quyền */
 const Q=await ev(p=>{const out={};for(const role of ['ql','vp','gv']){setUser(findAccount(DB.staff.find(s=>s.role===role&&s.st==='dang').em));out[role]={can:canLeaveMark()}}
  setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));return out},P);
 ok('Quản lý, Văn phòng chấm nghỉ được; Giáo viên không',Q.ql.can&&Q.vp.can&&!Q.gv.can,Q);
 const V=await ev(p=>{setUser(findAccount(DB.staff.find(s=>s.role==='vp'&&s.st==='dang').em));delete DB.ts[p.T+'|'+p.d];S.cc={tab:'hn',m:CM,d:p.d};go('cc');render();
  const btn=!!document.querySelector('[data-a="tsl"][data-v="'+p.T+'|'+p.d+'"]'),on=!!document.querySelector('[data-a="ccon"]');
  const r1=ACT.tsl(p.T+'|'+p.d);S.modal={t:'tsl',id:p.T,d:p.d};const f=document.createElement('form');f.innerHTML='<input name="l" value="am"><input name="lk" value="">';FORM.tslf(f);
  return{btn,on,rec:DB.ts[p.T+'|'+p.d]&&DB.ts[p.T+'|'+p.d].l,ccon:ACT.ccon(p.T+'|'+p.d)}},P);
 ok('Văn phòng: thấy nút Nghỉ, ghi được nghỉ nửa ngày, nhưng không có nút Có mặt (việc đó vẫn của Trưởng Trung tâm, Quản lý)',V.btn&&!V.on&&V.rec==='am'&&V.ccon===false,V);
 const G=await ev(p=>{setUser(findAccount(DB.staff.find(s=>s.role==='gv'&&s.st==='dang').em));return{tsl:ACT.tsl(p.T+'|'+p.d)}},P);
 ok('Giáo viên không chấm nghỉ được',G.tsl===false,G);
 await ev(()=>{setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));render()});
 /* bỏ nghỉ */
 await ev(p=>{S.modal={t:'tsl',id:p.T,d:p.d};render()},P);await page.click('[data-a="tslclr"]');await W(150);
 const C=await ev(p=>({rec:DB.ts[p.T+'|'+p.d],st:tsSt(p.T,p.d)}),P);
 ok('Bỏ nghỉ: xóa chấm công ngày đó (về chưa chấm công, chấm lại được)',!C.rec&&(C.st==='abs'||C.st==='chua'),C);
 /* nghỉ nửa ngày cần dạy thay: chỉ buổi rơi vào nửa ngày nghỉ */
 const D=await ev(()=>{for(const T of DB.staff.filter(s=>s.role==='gv'&&s.st==='dang')){
   const ls=DB.lich.filter(l=>l.type==='11'&&l.gv===T.id&&l.day>=1&&l.day<=5&&kidBy(l.hs)&&kidBy(l.hs).st==='dang');if(!ls.length)continue;
   const l=ls[0];let d=addD(TODAY,1);for(let i=0;i<14&&dow(d)!==l.day;i++)d=addD(d,1);if(isClosed(d)||DB.lr.some(x=>x.st===T.id&&x.f<=d&&d<=x.t))continue;
   DB.ts[T.id+'|'+d]={i:'',o:'',l:'am'};const am=dsLeave(T.id,d,l.slot),needAm=dsNeed(d).some(s=>s.sid===l.id);
   DB.ts[T.id+'|'+d]={i:'',o:'',l:'pm'};const pm=dsLeave(T.id,d,l.slot),needPm=dsNeed(d).some(s=>s.sid===l.id);
   DB.ts[T.id+'|'+d]={i:'',o:'',l:'full'};const full=dsLeave(T.id,d,l.slot),needFull=dsNeed(d).some(s=>s.sid===l.id);
   delete DB.ts[T.id+'|'+d];
   return{slot:l.slot,morning:l.slot<CC_AM_END,am:!!am,needAm,pm:!!pm,needPm,full:!!full,needFull}}return null});
 ok('dạy thay: nghỉ nửa ngày sáng cần dạy thay buổi buổi sáng, nghỉ nửa ngày chiều cần dạy thay buổi buổi chiều, nghỉ cả ngày cần dạy thay mọi buổi',D&&D.am===D.morning&&D.needAm===D.morning&&D.pm===!D.morning&&D.needPm===!D.morning&&D.full&&D.needFull,D);
 /* (1) Phụ huynh thấy giáo viên dạy thay */
 const H=await ev(()=>{setUser(demoAcc('ph'));render();const k=myKids().find(x=>x.st==='dang');const up=upcoming(k,10).find(x=>x.kind==='11');if(!up)return{skip:1};
  const l=dsLesson(up.sid),T2=dsTeachers().find(t=>t.id!==l.gv);
  /* ghi dạy thay như Trưởng Trung tâm */
  const keep=U;setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));dsApply(l,up.d,T2.id,'Cô ốm, lý do riêng');setUser(keep);S.cp={tab:'tq',kid:k.id};S.v='cp';render();
  const home=document.querySelector('#main').innerText;S.v='lh';S.lh={kid:k.id};render();const lh=document.querySelector('#main').innerText;
  return{name:given(T2.n),home,lh,row:!!(DB.sub||[]).find(s=>s.sid===l.id&&s.d===up.d)}});
 ok('phụ huynh: Lịch học sắp tới ở Tổng quan ghi giáo viên dạy thay kèm tên',H.skip||(H.row&&/Giáo viên dạy thay/.test(H.home)&&H.home.includes(H.name)),H.skip?H:{name:H.name,home:H.home.slice(0,300)});
 ok('phụ huynh: Lịch học của bé (14 ngày tới) ghi giáo viên dạy thay kèm tên',H.skip||(/Giáo viên dạy thay/.test(H.lh)&&H.lh.includes(H.name)),H.skip?H:H.lh.slice(0,300));
 ok('phụ huynh không thấy lý do nghỉ của giáo viên trên màn hình',H.skip||!/lý do riêng/.test(H.home+H.lh));
 ok('không lỗi trình duyệt',errs.length===0,errs);
 await b.close();console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
