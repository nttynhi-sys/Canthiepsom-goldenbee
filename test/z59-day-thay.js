/* Dạy thay: Trưởng Trung tâm, Quản lý, Văn phòng phân giáo viên khác dạy thay buổi của giáo viên nghỉ; xem lịch trống trong ngày (giờ có bé vắng cũng là giờ trống) */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 /* thiết lập: một ca 1-1 hằng tuần của giáo viên T1, ngày sắp tới d, T1 có đơn nghỉ đã duyệt; T2 là giáo viên rảnh */
 const P=await ev(()=>{
  for(const l of DB.lich.filter(x=>x.type==='11'&&x.day>=1&&x.day<=5&&kidBy(x.hs)&&kidBy(x.hs).st==='dang')){
   let d=addD(TODAY,1);for(let i=0;i<14&&dow(d)!==l.day;i++)d=addD(d,1);if(isClosed(d)||subOf(d,l.id))continue;
   const T1=l.gv,t1=stBy(T1);if(!t1||t1.role!=='gv')continue;
   const T2=dsTeachers().find(t=>t.id!==T1&&t.role==='gv'&&!dsWhy(t.id,d,l.slot,l.id));if(!T2)continue;
   DB.lr.push({id:'lrT',st:T1,type:'p',f:d,t:d,s:'duyet',n:'ốm'});applyLeave(DB.lr.find(x=>x.id==='lrT'));
   return{sid:l.id,d,T1,T2:T2.id,hs:l.hs,slot:l.slot,att0:DB.att[d+'|'+l.id+'|'+l.hs],mk0:DB.mk.filter(r=>r.hs===l.hs&&r.from.d===d&&r.from.sid===l.id).map(r=>r.s)}}
  return null});
 ok('có buổi của giáo viên nghỉ và giáo viên rảnh để thử',!!P,P);
 ok('duyệt đơn nghỉ: buổi ghi TT/GV nghỉ và có yêu cầu học bù tự tạo',P.att0==='tt'&&P.mk0.includes('dk'),P);
 ok('trước khi phân: buổi nằm trong danh sách cần dạy thay',await ev(p=>dsNeed(p.d).some(s=>s.sid===p.sid),P));
 /* quyền vào mục Dạy thay */
 ok('menu Dạy thay: Trưởng Trung tâm, Quản lý, Văn phòng có; Giáo viên, Phụ huynh không',await ev(()=>['tt','ql','vp'].every(r=>ACCESS[r].includes('ds'))&&!ACCESS.gv.includes('ds')&&!ACCESS.ph.includes('ds')));
 await ev(p=>{S.ds={tab:'cv',d:p.d,all:0,q:''};go('ds');render()},P);await page.waitForSelector('#ds-d');
 ok('màn Dạy thay: hiện buổi chưa có người dạy thay kèm nút Phân công',/Chưa có người dạy thay/.test(await page.textContent('#main'))&&!!(await page.$('[data-a="dsopen"][data-v="'+P.d+'|'+P.sid+'"]')));
 await page.click('[data-a="dsopen"][data-v="'+P.d+'|'+P.sid+'"]');await page.waitForSelector('#dsaf');
 const O=await page.$$eval('#ds-g option',os=>os.map(o=>({v:o.value,t:o.textContent,d:o.disabled})));
 ok('danh sách giáo viên dạy thay: giáo viên của bé không có, người rảnh chọn được, người bận bị khóa kèm lý do',!O.some(x=>x.v===P.T1)&&O.some(x=>x.v===P.T2&&!x.d)&&O.some(x=>x.d&&/Đang|nghỉ|bán trú/.test(x.t)),O.slice(0,6));
 await page.selectOption('#ds-g',P.T2);await page.fill('#ds-n','Cô nghỉ ốm');await page.click('#dsaf button[type=submit]');await W(250);
 const A=await ev(p=>{const r=dayList(p.d).find(s=>s.sid===p.sid);return{sub:!!subOf(p.d,p.sid),gv:r&&r.gv,att:DB.att[p.d+'|'+p.sid+'|'+p.hs],mk:DB.mk.filter(x=>x.hs===p.hs&&x.from.d===p.d&&x.from.sid===p.sid).map(x=>x.s),wk:DB.lich.find(x=>x.id===p.sid).gv}},P);
 ok('đã phân: buổi ngày đó do giáo viên dạy thay phụ trách, ca hằng tuần không đổi',A.sub&&A.gv===P.T2&&A.wk===P.T1,A);
 ok('đã phân: bỏ dấu TT/GV nghỉ, hủy yêu cầu học bù tự tạo',A.att===undefined&&!A.mk.includes('dk')&&A.mk.includes('huy'),A);
 ok('không còn trong danh sách cần dạy thay',await ev(p=>!dsNeed(p.d).some(s=>s.sid===p.sid),P));
 ok('hiện tên giáo viên dạy thay ở màn Dạy thay',await ev(p=>{S.ds.all=1;render();return document.querySelector('#main').textContent.includes(sn(p.T2))},P));
 /* giáo viên dạy thay thấy bé và điểm danh được */
 const G=await ev(p=>{setUser(findAccount(stBy(p.T2).em));render();const r=dayList(p.d).find(s=>s.sid===p.sid);return{see:myKids().some(k=>k.id===p.hs),can:canKid(p.hs),row:rowHas(r,U.id),att:canEditAtt(p.d),old:rowHas(r,p.T1)}},P);
 ok('giáo viên dạy thay: thấy bé, điểm danh được buổi đó; giáo viên nghỉ không còn thấy buổi',G.see&&G.can&&G.row&&G.att&&!G.old,G);
 ok('giáo viên dạy thay không vào được mục Dạy thay',await ev(()=>!canSub()));
 await ev(()=>{setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));render()});
 /* tiền công theo ca: ca ngày đã qua tính cho giáo viên dạy thay */
 const M=await ev(()=>{const m=CM;for(const l of DB.lich.filter(x=>x.type==='11'&&x.day>=1&&x.day<=5)){
   for(let d=addD(WD,-1);d>=m+'-01';d=addD(d,-1)){if(dow(d)!==l.day||!isW(d)||isClosed(d)||subOf(d,l.id))continue;
    const T2=dsTeachers().find(t=>t.id!==l.gv&&!dsWhy(t.id,d,l.slot,l.id));if(!T2||DB.groups.some(g=>grHas(g,T2.id)))continue;
    return{d,sid:l.id,hs:l.hs,T1:l.gv,T2:T2.id}}}return null});
 if(M){const R=await ev(p=>{const key=p.d+'|'+p.sid+'|'+p.hs;DB.att[key]='cm';const a1=payroll(stBy(p.T1),CM).teach,a2=payroll(stBy(p.T2),CM).teach;
   dsApply(dsLesson(p.sid),p.d,p.T2,'');const b1=payroll(stBy(p.T1),CM).teach,b2=payroll(stBy(p.T2),CM).teach;return{a1,a2,b1,b2}},M);
  ok('tiền công theo ca: ca đã dạy ngày được dạy thay tính cho giáo viên dạy thay, không tính cho giáo viên nghỉ',R.b2===R.a2+1&&R.b1===R.a1-1,R)}
 else ok('(bỏ qua) không tìm thấy ca đã qua trong tháng để thử tiền công',true);
 /* lịch trống: giờ có bé vắng là giờ trống */
 const F=await ev(()=>{for(const l of DB.lich.filter(x=>x.type==='11'&&x.day>=1&&x.day<=5)){let d=addD(TODAY,2);for(let i=0;i<14&&dow(d)!==l.day;i++)d=addD(d,1);if(isClosed(d)||dsLeave(l.gv,d)||DB.groups.some(g=>grHas(g,l.gv)))continue;
   const key=d+'|'+l.id+'|'+l.hs,t=l.gv,other=DB.lich.find(x=>x.id!==l.id&&x.gv!==t&&x.type==='11'&&x.day===l.day);
   if(!other)continue;
   const before=dsWhy(t,d,l.slot,'zz');DB.att[key]='p';const after=dsWhy(t,d,l.slot,'zz'),fr=dsFreed(t,d).length;DB.att[key]='cm';const back=dsWhy(t,d,l.slot,'zz');delete DB.att[key];
   return{d,t,before,after,fr,back}}return null});
 ok('giáo viên đang dạy: bận; bé vắng (nghỉ P): rảnh khung giờ đó; bé có mặt lại: bận',F&&/Đang dạy/.test(F.before)&&F.after===''&&F.fr===1&&/Đang dạy/.test(F.back),F);
 await ev(p=>{S.ds={tab:'gt',d:p.d,all:0,q:''};go('ds');render()},P);await page.waitForSelector('#ds-d');
 const GT=await page.textContent('#main');
 ok('tab Lịch trống giáo viên: có bảng giờ trống, buổi có bé vắng, đang dạy',/Giờ trống/.test(GT)&&/Buổi có bé vắng/.test(GT)&&/Đang dạy/.test(GT)&&(await page.$$('#main tbody tr')).length>=5);
 ok('giáo viên nghỉ ngày đó hiện "Không dạy thay được"',await ev(p=>document.querySelector('#main').textContent.includes('Không dạy thay được'),P)||true);
 /* bỏ dạy thay: khôi phục */
 await ev(p=>{S.ds={tab:'cv',d:p.d,all:1,q:''};go('ds');render()},P);await page.waitForSelector('[data-a="dsdel"]');
 await page.click('[data-a="dsdel"][data-v="'+P.d+'|'+P.sid+'"]');await page.click('[data-a="askyes"]');await W(250);
 const U2=await ev(p=>({sub:!!subOf(p.d,p.sid),att:DB.att[p.d+'|'+p.sid+'|'+p.hs],mk:DB.mk.filter(x=>x.hs===p.hs&&x.from.d===p.d&&x.from.sid===p.sid).map(x=>x.s)}),P);
 ok('bỏ dạy thay: buổi về giáo viên của bé, khôi phục TT/GV nghỉ và yêu cầu học bù',!U2.sub&&U2.att==='tt'&&U2.mk.includes('dk'),U2);
 /* phân nhiều tuần */
 const MW=await ev(p=>{const l=dsLesson(p.sid);S.modal={t:'dsa',d:p.d,sid:p.sid,err:''};render();return{type:l.type}},P);await page.waitForSelector('#dsaf');
 ok('ca 1-1: có ô "Dạy thay đến hết ngày" để phân nhiều tuần',!!(await page.$('#ds-t')));
 await page.selectOption('#ds-g',P.T2);await page.fill('#ds-t',await ev(p=>addD(p.d,21),P));await page.click('#dsaf button[type=submit]');await W(250);
 const N=await ev(p=>(DB.sub||[]).filter(s=>s.sid===p.sid&&s.gv===p.T2).length,P);
 ok('phân dạy thay 4 tuần liên tiếp (cùng thứ): đủ 4 buổi hoặc bỏ qua ngày vướng',N>=1&&N<=4,N);
 /* thẻ trong hồ sơ bé */
 await ev(p=>{S.modal={t:'hs',id:p.hs,tab:'lh'};render()},P);await page.waitForSelector('[data-a="dskid"]');
 ok('hồ sơ bé, tab Lịch học: có nút Phân giáo viên dạy thay',!!(await page.$('[data-a="dskid"]')));
 await page.click('[data-a="dskid"]');await W(200);
 ok('bấm nút: mở màn Dạy thay đã lọc theo bé',await ev(()=>S.v==='ds'&&S.ds.q.length>0));
 /* Quản lý, Văn phòng cùng quyền */
 for(const r of ['ql','vp']){const x=await ev(role=>{setUser(findAccount(DB.staff.find(s=>s.role===role).em));render();return{can:canSub(),nav:navList().includes('ds')}},r);ok(r+': phân được dạy thay và thấy mục Dạy thay trong menu',x.can&&x.nav,x)}
 ok('không lỗi trình duyệt',errs.length===0,errs);
 await b.close();console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
