/* Dạy thay: phụ huynh nhận thông báo khi đổi giáo viên hoặc đổi giờ học (không kèm lý do nghỉ, ghi chú) */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
(async()=>{const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 const P=await ev(()=>{for(const l of DB.lich.filter(x=>x.type==='11'&&x.day>=1&&x.day<=5&&kidBy(x.hs)&&kidBy(x.hs).st==='dang'&&pkeyOf(kidBy(x.hs))&&findAccount(pkeyOf(kidBy(x.hs)))&&!phLockOf(pkeyOf(kidBy(x.hs))).locked&&stBy(x.gv)&&stBy(x.gv).role==='gv')){
   let d=addD(TODAY,3);for(let i=0;i<14&&dow(d)!==l.day;i++)d=addD(d,1);const ds=[0,1].map(i=>addD(d,i*7));if(ds.some(x=>isClosed(x)||subOf(x,l.id)))continue;
   const free=dsTeachers().filter(t=>t.id!==l.gv&&t.role==='gv'&&ds.every(x=>!dsWhy(t.id,x,l.slot,l.id)&&!dsKidWhy(l,x,l.slot)));if(!free.length)continue;
   const alt=dsAlt(free[0].id,l,ds[0]).find(s=>s!==l.slot&&ds.every(x=>!dsWhy(free[0].id,x,s,l.id)&&!dsKidWhy(l,x,s)));if(!alt)continue;
   const other=DB.kids.find(k=>k.st==='dang'&&pkeyOf(k)&&pkeyOf(k)!==pkeyOf(kidBy(l.hs))&&findAccount(pkeyOf(k))&&!phLockOf(pkeyOf(k)).locked);if(!other)continue;
   return{sid:l.id,ds,T1:l.gv,T2:free[0].id,hs:l.hs,slot:l.slot,alt,pk:pkeyOf(kidBy(l.hs)),pk2:pkeyOf(other)}}return null});
 ok('có buổi, giáo viên rảnh (có giờ khác phù hợp) và hai phụ huynh khác nhau để thử',!!P,P);
 const open_=async()=>{await ev(p=>{S.ds={tab:'cv',d:p.ds[0],all:1,q:''};go('ds');render();ACT.dsopen(p.ds[0]+'|'+p.sid);render()},P);await page.waitForSelector('#dsaf')};
 /* 1. chỉ đổi giáo viên */
 await open_();
 ok('hộp phân công có ô "Gửi thông báo cho phụ huynh của bé", mặc định tích',await page.isChecked('#dsaf input[name=pn]'));
 await page.selectOption('#ds-g',P.T2);await W(150);
 await page.fill('#ds-n','Cô nghỉ ốm, lý do riêng tư');await page.dispatchEvent('#ds-n','change');
 await page.click('#dsaf button[type=submit]');await W(300);
 const N1=await ev(p=>DB.nt.filter(n=>n.aud==='ph'&&n.tg===p.hs).slice(-1)[0],P);
 const t2=await ev(p=>stBy(p.T2).n,P),t1=await ev(p=>stBy(p.T1).n,P);
 ok('đã phân: có thông báo cho phụ huynh của bé (aud ph, tg = mã bé), tiêu đề đổi giáo viên',!!N1&&N1.aud==='ph'&&N1.tg===P.hs&&N1.t==='Thay đổi giáo viên dạy',N1);
 ok('nội dung: ngày, tên giáo viên dạy thay, giờ học; không có lý do nghỉ, ghi chú hay tên giáo viên nghỉ',N1.b.includes(t2)&&N1.b.includes('dạy thay')&&N1.b.includes(P.slot.slice(0,5))&&!/ốm|riêng tư|Ghi chú/.test(N1.b)&&!N1.b.includes(t1),N1.b);
 /* phụ huynh thấy, phụ huynh khác không */
 const V=await ev(p=>{const id=DB.nt.filter(n=>n.aud==='ph'&&n.tg===p.hs).slice(-1)[0].id,out={};
  setUser(findAccount(p.pk));render();out.own={see:noticesFor().some(n=>n.id===id),unread:unread()};S.v='tb';render();out.text=document.querySelector('#main').innerText;
  setUser(findAccount(p.pk2));out.other=noticesFor().some(n=>n.id===id);
  setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));S.v='ds';render();return out},P);
 ok('phụ huynh của bé thấy thông báo, tính chưa đọc, hiện ở trang Thông báo',V.own.see&&V.own.unread>=1&&/Thay đổi giáo viên dạy/.test(V.text),[V.own,V.text.slice(0,200)]);
 ok('phụ huynh của bé khác không thấy',!V.other);
 /* 2. đổi giáo viên và giờ học */
 await ev(p=>{DB.sub=DB.sub.filter(s=>s.sid!==p.sid)},P);
 await open_();await page.selectOption('#ds-g',P.T2);await W(150);
 await page.fill('#ds-s',P.alt);await page.dispatchEvent('#ds-s','change');await W(200);
 await page.fill('#ds-t',P.ds[1]);await page.dispatchEvent('#ds-t','change');await W(250);
 await page.click('#dsaf button[type=submit]');await W(300);
 const N2=await ev(p=>DB.nt.filter(n=>n.aud==='ph'&&n.tg===p.hs).slice(-1)[0],P);
 ok('đổi cả giờ: tiêu đề "Thay đổi giáo viên và giờ học", liệt kê 2 buổi, giờ mới và giờ cũ',N2.t==='Thay đổi giáo viên và giờ học'&&(N2.b.match(/^• /gm)||[]).length===2&&N2.b.includes(P.alt)&&/đổi từ/.test(N2.b)&&/2 buổi/.test(N2.b),N2.b);
 /* 3. hủy: phụ huynh được báo vì trước đó đã báo */
 await ev(p=>{S.ds={tab:'cv',d:p.ds[0],all:1,q:''};S.modal=null;S.v='ds';render()},P);await page.waitForSelector('[data-a="dsdel"][data-v="'+P.ds[0]+'|'+P.sid+'"]');
 const n3=await ev(p=>DB.nt.filter(n=>n.aud==='ph').length,P);
 await page.click('[data-a="dsdel"][data-v="'+P.ds[0]+'|'+P.sid+'"]');await page.click('[data-a="askyes"]');await W(250);
 const N3=await ev(p=>DB.nt.filter(n=>n.aud==='ph'&&n.tg===p.hs).slice(-1)[0],P);
 ok('bỏ dạy thay: phụ huynh nhận "Lịch học trở lại như thường" kèm giáo viên và giờ gốc',N3.t==='Lịch học trở lại như thường'&&N3.b.includes(t1)&&N3.b.includes(P.slot.slice(0,5))&&await ev(()=>DB.nt.filter(n=>n.aud==='ph').length,P)===n3+1,N3);
 /* 4. bỏ tích: không báo phụ huynh, và bỏ dạy thay cũng không báo */
 await ev(p=>{DB.sub=DB.sub.filter(s=>s.sid!==p.sid)},P);
 const n4=await ev(()=>DB.nt.filter(n=>n.aud==='ph').length);
 await open_();await page.selectOption('#ds-g',P.T2);await W(150);await page.uncheck('#dsaf input[name=pn]');await page.click('#dsaf button[type=submit]');await W(300);
 ok('bỏ tích "Gửi thông báo cho phụ huynh": vẫn phân công nhưng không có thông báo cho phụ huynh',await ev(()=>DB.nt.filter(n=>n.aud==='ph').length)===n4&&await ev(p=>!!subOf(p.ds[0],p.sid),P));
 await ev(p=>{S.ds={tab:'cv',d:p.ds[0],all:1,q:''};S.modal=null;S.v='ds';render()},P);await page.waitForSelector('[data-a="dsdel"][data-v="'+P.ds[0]+'|'+P.sid+'"]');
 await page.click('[data-a="dsdel"][data-v="'+P.ds[0]+'|'+P.sid+'"]');await page.click('[data-a="askyes"]');await W(250);
 ok('bỏ dạy thay khi trước đó không báo phụ huynh: không gửi thông báo hủy cho phụ huynh',await ev(()=>DB.nt.filter(n=>n.aud==='ph').length)===n4);
 /* thông báo của giáo viên dạy thay vẫn độc lập */
 ok('thông báo gửi riêng cho giáo viên vẫn được gửi như trước',await ev(p=>DB.nt.some(n=>n.aud==='nb'&&n.to&&n.to.join()===p.T2&&n.t==='Phân công dạy thay'),P));
 ok('không lỗi trình duyệt',errs.length===0,errs);
 await b.close();console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
