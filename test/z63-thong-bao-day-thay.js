/* Dạy thay: gửi thông báo riêng cho giáo viên dạy thay (phân công, đổi người, hủy, nhắc lại) */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
(async()=>{const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 const P=await ev(()=>{for(const l of DB.lich.filter(x=>x.type==='11'&&x.day>=1&&x.day<=5&&kidBy(x.hs)&&kidBy(x.hs).st==='dang'&&stBy(x.gv)&&stBy(x.gv).role==='gv')){
   let d=addD(TODAY,3);for(let i=0;i<14&&dow(d)!==l.day;i++)d=addD(d,1);const ds=[0,1,2].map(i=>addD(d,i*7));if(ds.some(x=>isClosed(x)||subOf(x,l.id)))continue;
   const free=dsTeachers().filter(t=>t.id!==l.gv&&t.role==='gv'&&ds.every(x=>!dsWhy(t.id,x,l.slot,l.id)&&!dsKidWhy(l,x,l.slot)));if(free.length<3)continue;
   return{sid:l.id,ds,T1:l.gv,T2:free[0].id,T3:free[1].id,T4:free[2].id,hs:l.hs,slot:l.slot}}return null});
 ok('có buổi 1-1 hằng tuần và ít nhất 3 giáo viên rảnh cả 3 tuần',!!P,P);
 const nt0=await ev(()=>DB.nt.length);
 /* 1. phân công: mặc định có gửi thông báo */
 await ev(p=>{S.ds={tab:'cv',d:p.ds[0],all:1,q:''};go('ds');render();ACT.dsopen(p.ds[0]+'|'+p.sid);render()},P);await page.waitForSelector('#dsaf');
 ok('hộp phân công có ô "Gửi thông báo cho giáo viên dạy thay", mặc định tích',await page.isChecked('#dsaf input[name=nt]'));
 await page.selectOption('#ds-g',P.T2);await W(150);
 await page.fill('#ds-t',P.ds[2]);await page.dispatchEvent('#ds-t','change');await W(200);
 await page.fill('#ds-n','Cô nghỉ ốm cả tuần');await page.dispatchEvent('#ds-n','change');
 await page.click('#dsaf button[type=submit]');await W(300);
 const N1=await ev(p=>{const n=DB.nt.slice(-1)[0];return{n:DB.nt.length,aud:n&&n.aud,to:n&&n.to,t:n&&n.t,b:n&&n.b,by:n&&n.by}},P);
 ok('đã phân 3 ngày: có đúng 1 thông báo gửi riêng cho giáo viên dạy thay',N1.n===nt0+1&&N1.aud==='nb'&&N1.to&&N1.to.join()===P.T2&&N1.t==='Phân công dạy thay',N1);
 const kn=await ev(p=>kidBy(p.hs).n,P),t1n=await ev(p=>stBy(p.T1).n,P);
 ok('nội dung: liệt kê cả 3 ngày, giờ, tên bé, giáo viên được thay và ghi chú',(N1.b.match(/^• /gm)||[]).length===3&&N1.b.includes(kn)&&N1.b.includes('thay '+t1n)&&/Ghi chú: Cô nghỉ ốm cả tuần/.test(N1.b)&&/3 buổi/.test(N1.b),N1.b);
 /* 2. ai thấy thông báo */
 const V=await ev(p=>{const id=DB.nt.slice(-1)[0].id,out={};
  const as=(sid)=>{setUser(findAccount(stBy(sid).em));return{see:noticesFor().some(n=>n.id===id),unread:unread()}};
  out.T2=as(p.T2);out.T3=as(p.T3);
  setUser(findAccount(DB.staff.find(s=>s.role==='ql'&&s.st==='dang').em));out.ql={see:noticesFor().some(n=>n.id===id),unread:noticesFor().filter(n=>n.id===id&&!DB.rd[rdKey(n)]&&ntMine(n)).length};
  setUser(demoAcc('ph'));out.ph=noticesFor().some(n=>n.id===id);
  setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));return out},P);
 ok('giáo viên dạy thay thấy thông báo và tính là chưa đọc',V.T2.see&&V.T2.unread>=1,V.T2);
 ok('giáo viên khác không thấy, phụ huynh không thấy',!V.T3.see&&!V.ph,V);
 ok('Quản lý xem được nhưng không bị tính là chưa đọc',V.ql.see&&V.ql.unread===0,V.ql);
 const TB=await ev(p=>{setUser(findAccount(stBy(p.T2).em));S.v='tb';render();const t=document.querySelector('#main').innerText;setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));render();return t},P);
 ok('trang Thông báo của giáo viên dạy thay: có tiêu đề, "Mới" và nơi gửi',/Phân công dạy thay/.test(TB)&&/Mới/.test(TB)&&/Gửi riêng cho/.test(TB),TB.slice(0,300));
 /* 3. bỏ tích: không gửi */
 await ev(p=>{DB.sub=DB.sub.filter(s=>s.sid!==p.sid);ACT.dsopen(p.ds[0]+'|'+p.sid);render()},P);await page.waitForSelector('#dsaf');
 const n3=await ev(()=>DB.nt.length);
 await page.selectOption('#ds-g',P.T2);await W(150);await page.uncheck('#dsaf input[name=nt]');await page.click('#dsaf button[type=submit]');await W(250);
 ok('bỏ tích gửi thông báo: vẫn phân công nhưng không có thông báo mới',await ev(p=>DB.nt.length,P)===n3&&await ev(p=>!!subOf(p.ds[0],p.sid),P));
 /* 4. đổi người: báo hủy cho người cũ, báo phân công cho người mới */
 await ev(p=>{ACT.dsopen(p.ds[0]+'|'+p.sid);render()},P);await page.waitForSelector('#dsaf');
 await page.selectOption('#ds-g',P.T3);await W(150);await page.click('#dsaf button[type=submit]');await W(300);
 const N4=await ev(()=>DB.nt.slice(-2).map(n=>({t:n.t,to:n.to&&n.to.join()})),P);
 ok('đổi người dạy thay: người mới nhận "Phân công dạy thay"',N4.some(n=>n.t==='Phân công dạy thay'&&n.to===P.T3),N4);
 ok('đổi người dạy thay: người cũ (đã được phân trước đó) nhận "Hủy phân công dạy thay"',await ev(p=>DB.nt.some(n=>n.t==='Hủy phân công dạy thay'&&n.to&&n.to.join()===p.T2&&/đã được hủy/.test(n.b)),P),N4);
 /* 5. nhắc lại */
 await ev(p=>{S.ds={tab:'cv',d:p.ds[0],all:1,q:''};S.modal=null;S.v='ds';render()},P);await page.waitForSelector('[data-a="dsnotify"][data-v="'+P.ds[0]+'|'+P.sid+'"]');
 const n5=await ev(()=>DB.nt.length);
 await page.click('[data-a="dsnotify"][data-v="'+P.ds[0]+'|'+P.sid+'"]');await W(200);
 const N5=await ev(()=>DB.nt.slice(-1)[0]);
 ok('nút Thông báo: gửi thêm "Nhắc lịch dạy thay" cho giáo viên dạy thay của buổi đó',await ev(()=>DB.nt.length)===n5+1&&N5.t==='Nhắc lịch dạy thay'&&N5.to.join()===P.T3,N5);
 /* 6. bỏ dạy thay: báo hủy */
 await page.click('[data-a="dsdel"][data-v="'+P.ds[0]+'|'+P.sid+'"]');await page.click('[data-a="askyes"]');await W(250);
 const N6=await ev(()=>DB.nt.slice(-1)[0]);
 ok('bỏ dạy thay: giáo viên dạy thay nhận "Hủy phân công dạy thay"',N6.t==='Hủy phân công dạy thay'&&N6.to.join()===P.T3&&/đã được hủy/.test(N6.b),N6);
 ok('không lỗi trình duyệt',errs.length===0,errs);
 await b.close();console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
