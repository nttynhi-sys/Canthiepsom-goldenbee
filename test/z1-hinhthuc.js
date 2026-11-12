/* Z1: ô "Hình thức học" (Bán trú, 1-1) trong hồ sơ bé, mỗi hình thức tích các buổi cụ thể */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 const toastTx=()=>ev(()=>{const t=document.querySelector('.toast,#toast');return t?t.textContent:''});
 /* trợ giúp: ca 1-1 mới (ngày, loại, giờ riêng), loại đăng ký và số giờ/ngày */
 const addCa=(w,lt,tm)=>ev(([w,lt,tm])=>{const f=document.querySelector('#hsff');const rs=[...f.querySelectorAll('#s11 .s11r')];let r=rs[rs.length-1];if(!r||r.querySelector('[name=s11tm]').value){ACT.s11add(null,f.querySelector('#hth-11 [data-a="s11add"]'));const all=f.querySelectorAll('#s11 .s11r');r=all[all.length-1]}r.querySelector('[name=s11day]').value=w;r.querySelector('[name=s11lt]').value=lt;r.querySelector('[name=s11tm]').value=tm||''},[w,lt,tm]);
 const clearCa=()=>ev(()=>{document.querySelectorAll('#hsff #s11 .s11r').forEach(r=>r.remove())});
 const ltOn=(lt,q)=>ev(([lt,q])=>{const f=document.querySelector('#hsff');f.elements['lt_'+lt].checked=true;f.elements['lq_'+lt].value=q},[lt,q]);
 await login(page,'ql');
 await page.click('.nav button:has-text("Học sinh")');await W(120);
 await page.click('[data-a="hsnew"]');await page.waitForSelector('#hsff');

 /* 1. giao diện: hai hình thức, ban đầu chưa tích thì phần buổi học ẩn */
 const ui=await ev(()=>{const f=document.querySelector('#hsff');return{hbt:!!f.elements.hbt,h11:!!f.elements.h11,btHidden:document.querySelector('#hth-bt').hidden,oneHidden:document.querySelector('#hth-11').hidden,
  oldSel:!!document.querySelector('#hf-bt'),days11:!!document.querySelector('#s11')&&document.querySelectorAll('#hth-11 .lt-row').length===7,daysBt:[1,2,3,4,5,6].every(w=>f.elements['bd'+w]),
  h3:[...document.querySelectorAll('#hsff h3')].map(e=>e.textContent)}});
 ok('form có hai ô tích Bán trú và Can thiệp 1-1, mỗi hình thức có ô tích 6 buổi (T2–T7)',ui.hbt&&ui.h11&&ui.days11&&ui.daysBt&&!ui.oldSel,ui);
 ok('mới mở: chưa tích hình thức nào nên phần chọn buổi đang ẩn; có mục "Hình thức học"',ui.btHidden&&ui.oneHidden&&ui.h3.includes('Hình thức học'),ui);
 await page.check('#hf-hbt');await W(40);
 ok('tích Bán trú: hiện lớp bán trú và các ngày',await ev(()=>!document.querySelector('#hth-bt').hidden&&document.querySelector('#hth-11').hidden));
 await page.check('#hf-h11');await W(40);
 ok('tích 1-1: hiện giáo viên, loại 1-1, phòng và các ca',await ev(()=>!document.querySelector('#hth-11').hidden));
 await page.uncheck('#hf-hbt');await W(40);
 ok('bỏ tích Bán trú: phần bán trú ẩn lại',await ev(()=>document.querySelector('#hth-bt').hidden));
 await page.check('#hf-hbt');await W(40);

 /* 2. kiểm tra các lỗi nhập */
 await page.fill('#hf-n','Bé Thử Hình Thức');await page.fill('#hf-pn','Mẹ Thử');await page.fill('#hf-pp','0905123456');
 await ev(()=>{const f=document.querySelector('#hsff');[1,2,3,4,5,6].forEach(w=>{f.elements['bd'+w].checked=false})});
 await page.click('#hsff button[type=submit]');await W(60);
 ok('tích Bán trú mà không tích ngày nào: báo lỗi, chưa lưu',/ít nhất một buổi bán trú/.test(await toastTx())&&!(await ev(()=>DB.kids.some(k=>k.n==='Bé Thử Hình Thức'))),await toastTx());
 await ev(()=>{const f=document.querySelector('#hsff');[1,3,5].forEach(w=>{f.elements['bd'+w].checked=true})});
 await page.click('#hsff button[type=submit]');await W(60);
 ok('tích 1-1 mà không tích buổi nào: báo lỗi',/ít nhất một (loại|ca) 1-1/.test(await toastTx()),await toastTx());
 await ltOn('ng',1);await addCa(1,'ng','10:00');await addCa(2,'ng','10:00');await addCa(4,'ng','10:00');
 await page.click('#hsff button[type=submit]');await W(60);
 ok('tích buổi 1-1 mà chưa chọn giáo viên: báo lỗi',/chọn giáo viên/.test(await toastTx()),await toastTx());
 const gvs=await ev(()=>pool11().map(s=>s.id));
 /* dữ liệu mẫu xếp dày: tìm khung giờ còn trống phòng và giáo viên cho các ngày cần dùng */
 const T=await ev(g=>{const fr=(w,s)=>ROOMS.some(r=>!conflict({day:w,slot:s,gv:g,hs:'hsX',room:r})),rs=[...SLOTS].reverse();
  const A=rs.find(s=>fr(1,s)),C=rs.find(s=>s!==A&&Math.abs(tmin(s)-tmin(A))>=SLOT_MIN&&[2,3,4].every(w=>fr(w,s))),B=rs.find(s=>s!==A&&s!==C&&Math.abs(tmin(s)-tmin(C))>=SLOT_MIN&&Math.abs(tmin(s)-tmin(A))>=SLOT_MIN&&fr(5,s));return{A,C,B}},gvs[0]);
 ok('tìm được khung giờ trống cho giáo viên thử',T.A&&T.C&&T.B,T);
 await page.selectOption('#hf-gv',gvs[0]);
 await clearCa();await addCa(2,'ng','06:00');
 await page.click('#hsff button[type=submit]');await W(60);
 ok('giờ 1-1 ngoài khung 07:15–20:00: báo lỗi nêu khung giờ',/07:15/.test(await toastTx())&&/T3/.test(await toastTx()),await toastTx());
 ok('các lần báo lỗi không tạo hồ sơ',!(await ev(()=>DB.kids.some(k=>k.n==='Bé Thử Hình Thức'))));

 /* 3. lưu thành công: bán trú T2,T4,T6 (1,3,5) + 1-1 vào T2 (giờ chung), T3 (giờ riêng 09:20), T5 (giờ chung) */
 await clearCa();await addCa(1,'ng',T.A);await addCa(2,'ng',T.C);await addCa(4,'ng',T.C);
 const before=await ev(()=>({kids:DB.kids.length,lich:DB.lich.length}));
 await page.click('#hsff button[type=submit]');await W(120);
 const r=await ev(()=>{const k=DB.kids.find(x=>x.n==='Bé Thử Hình Thức'),ls=k?DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).sort((a,b)=>a.day-b.day):[];
  return k?{id:k.id,bt:k.bt,btd:k.btd,gr:k.gr,gv:k.gv,m11:k.m11,ls:ls.map(l=>[l.day,l.slot,l.gv,!!l.room]),modal:S.modal&&{t:S.modal.t,tab:S.modal.tab},prog:progShort(k),wk:wk11(k.id)}:null});
 ok('lưu hồ sơ: bán trú T2, T4, T6; có lớp bán trú theo tuổi',r&&r.bt&&JSON.stringify(r.btd)===JSON.stringify([1,3,5])&&!!r.gr,r);
 ok('lưu 3 buổi 1-1: T2 giờ riêng, T3 và T5 giờ chung, có phòng, đúng giáo viên',r&&r.ls.length===3&&JSON.stringify(r.ls.map(x=>[x[0],x[1]]))===JSON.stringify([[1,T.A],[2,T.C],[4,T.C]])&&r.ls.every(x=>x[2]===gvs[0]&&x[3]),r);
 ok('giáo viên 1-1 chính của bé là giáo viên đã chọn; số buổi/tuần cập nhật',r&&r.gv===gvs[0]&&r.m11===3&&r.wk===3,r);
 ok('tóm tắt chương trình: Bán trú T2, T4, T6 + 1-1 thêm 2 buổi (ca của ngày bán trú nằm trong gói)',r&&/Bán trú/.test(r.prog)&&/1-1 x2 thêm/.test(r.prog),r.prog);
 const rw=await ev(()=>S.modal.res);
 ok('ca 1-1 T2 buổi tối nằm ngoài giờ bán trú: vẫn lưu nhưng nhắc lưu ý và mở thẻ Lịch học',r&&r.modal&&r.modal.t==='hs'&&r.modal.tab==='lh'&&rw.ok===3&&rw.bad.length===0&&rw.warn.length===1&&/ngoài giờ bán trú/.test(rw.warn[0]),{modal:r&&r.modal,rw});
 /* học phí: ca 1-1 sớm nhất của ngày bán trú tính trong gói, 2 ca 1-1 ngoài gói tính riêng */
 const fee=await ev(()=>{const k=kidBy(DB.kids.find(x=>x.n==='Bé Thử Hình Thức').id),m=TODAY.slice(0,7),xs=sched(k,m);return{inc:xs.filter(x=>x.kind==='11'&&x.inc).length,extra:xs.filter(x=>x.kind==='11'&&!x.inc).length,bt:xs.filter(x=>x.kind==='bt').length}});
 ok('lịch tháng: ca 1-1 ngày bán trú nằm trong gói, ca ngày T3 và T5 thì tính thêm',fee.inc>0&&fee.extra>0&&fee.bt>0,fee);

 /* 4. xung đột: bé mới, cùng giáo viên, cùng giờ T3 08:30 → lưu hồ sơ nhưng báo buổi không thêm được và mở thẻ Lịch học */
 await page.click('.mdc [data-a="mx"],.mdc .x');await W(60).catch(()=>{});
 await ev(()=>{S.modal=null;render()});await W(60);
 await page.click('[data-a="hsnew"]');await page.waitForSelector('#hsff');
 await page.fill('#hf-n','Bé Trùng Giờ');await page.fill('#hf-pn','Ba Thử');await page.fill('#hf-pp','0905987654');
 await page.check('#hf-h11');
 await page.selectOption('#hf-gv',gvs[0]);
 await ltOn('ng',1);await addCa(2,'ng',T.C);await addCa(3,'ng',T.C);
 await page.click('#hsff button[type=submit]');await W(120);
 const c=await ev(()=>{const k=DB.kids.find(x=>x.n==='Bé Trùng Giờ'),ls=k?DB.lich.filter(l=>l.type==='11'&&l.hs===k.id):[];return k?{ls:ls.map(l=>[l.day,l.slot]),tab:S.modal.tab,res:S.modal.res,bt:k.bt}:null});
 ok('trùng giờ giáo viên ở T3: vẫn lưu hồ sơ, thêm được T4 (còn trống), T3 báo không thêm được',c&&c.ls.length===1&&c.ls[0][0]===3&&c.res.bad.length===1&&/T3/.test(c.res.bad[0])&&/Giáo viên đã có buổi/.test(c.res.bad[0]),c);
 ok('có cảnh báo thì tự mở thẻ Lịch học để xem kết quả; bé không tích bán trú thì không bán trú',c&&c.tab==='lh'&&c.bt===false,c);
 const lhTx=await ev(()=>document.querySelector('.mdc').innerText);
 ok('thẻ Lịch học hiện dòng "Không thêm được" kèm lý do',/Không thêm được/.test(lhTx)&&/Giáo viên đã có buổi/.test(lhTx),lhTx.slice(0,300));

 /* 5. sửa hồ sơ: 1-1 đang có thì tích sẵn, liệt kê buổi hiện có; không bỏ tích khi còn buổi; thêm buổi mới được */
 await ev(()=>{S.modal=null;render();const k=DB.kids.find(x=>x.n==='Bé Thử Hình Thức');ACT.hsedit(k.id);render()});await page.waitForSelector('#hsff');
 const ed=await ev(()=>{const f=document.querySelector('#hsff');return{hbt:f.elements.hbt.checked,h11:f.elements.h11.checked,bd:[1,2,3,4,5,6].filter(w=>f.elements['bd'+w].checked),note:(document.querySelector('#hth-11 .note')||{}).textContent,gv:f.elements.gv.value,rows:[...document.querySelectorAll('#s11 .s11r')].map(r=>[+r.querySelector('[name=s11day]').value,r.querySelector('[name=s11tm]').value]),d11:[...document.querySelectorAll('#s11d input[data-s11w]')].filter(c=>c.checked).map(c=>+c.dataset.s11w)}});
 ok('sửa hồ sơ: tích sẵn Bán trú và 1-1, ngày bán trú T2, T4, T6; 3 ca 1-1 đang có hiện sẵn thành 3 dòng (thứ, giờ) và 3 nút ngày 1-1 đã bật',ed.hbt&&ed.h11&&JSON.stringify(ed.bd)===JSON.stringify([1,3,5])&&/3 ca 1-1/.test(ed.note||'')&&ed.rows.length===3&&ed.rows.some(r=>r[0]===1&&r[1]===T.A)&&ed.d11.length===3,ed);
 await page.uncheck('#hf-h11');await page.click('#hsff button[type=submit]');await W(80);
 ok('bỏ tích 1-1 khi bé còn buổi 1-1: báo phải xóa từng buổi ở thẻ Lịch học, không xóa gì',/xóa từng buổi/.test(await toastTx())&&(await ev(()=>wk11(DB.kids.find(x=>x.n==='Bé Thử Hình Thức').id)))===3,await toastTx());
 await page.check('#hf-h11');
 await addCa(5,'ng',T.B);
 await page.click('#hsff button[type=submit]');await W(120);
 const ed2=await ev(()=>{const k=DB.kids.find(x=>x.n==='Bé Thử Hình Thức');return{ls:DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).map(l=>[l.day,l.slot]).sort((a,b)=>a[0]-b[0]||(a[1]<b[1]?-1:1)),btd:k.btd}});
 ok('sửa hồ sơ, tích thêm T6 giờ riêng: thêm đúng 1 buổi, các buổi cũ giữ nguyên',ed2.ls.length===4&&ed2.ls.some(x=>x[0]===5&&x[1]===T.B)&&JSON.stringify(ed2.btd)===JSON.stringify([1,3,5]),ed2);

 /* 6. hình thức chỉ bán trú, chỉ 1-1 */
 await ev(()=>{S.modal=null;render()});await W(60);
 await page.click('[data-a="hsnew"]');await page.waitForSelector('#hsff');
 await page.fill('#hf-n','Bé Chỉ Bán Trú');await page.fill('#hf-pn','Mẹ B');await page.fill('#hf-pp','0905000111');
 await page.check('#hf-hbt');
 await page.click('#hsff button[type=submit]');await W(100);
 const o1=await ev(()=>{const k=DB.kids.find(x=>x.n==='Bé Chỉ Bán Trú');return{bt:k.bt,btd:k.btd,wk:wk11(k.id),gv:k.gv,prog:progShort(k)}});
 ok('chỉ tích Bán trú (mặc định T2–T6): lưu được, không có buổi 1-1',o1.bt&&JSON.stringify(o1.btd)===JSON.stringify([1,2,3,4,5])&&o1.wk===0&&o1.gv===null,o1);
 await ev(()=>{S.modal=null;render()});await W(60);
 await page.click('[data-a="hsnew"]');await page.waitForSelector('#hsff');
 await page.fill('#hf-n','Bé Chưa Chọn');await page.fill('#hf-pn','Mẹ C');await page.fill('#hf-pp','0905000222');
 await page.click('#hsff button[type=submit]');await W(100);
 const o2=await ev(()=>{const k=DB.kids.find(x=>x.n==='Bé Chưa Chọn');return{bt:k.bt,gr:k.gr,wk:wk11(k.id),btd:k.btd||null}});
 ok('không tích hình thức nào: vẫn lưu hồ sơ (chưa có lịch), không bán trú',o2&&o2.bt===false&&o2.gr===''&&o2.wk===0&&o2.btd===null,o2);

 /* 7. số giờ đăng ký trong 1 ngày: vượt số giờ của loại thì báo lỗi, không lưu */
 await ev(()=>{S.modal=null;render()});await W(60);
 await page.click('[data-a="hsnew"]');await page.waitForSelector('#hsff');
 await page.fill('#hf-n','Bé Số Giờ');await page.fill('#hf-pn','Mẹ D');await page.fill('#hf-pp','0905000333');
 await page.check('#hf-h11');await ltOn('ng',1);await page.selectOption('#hf-gv',gvs[0]);
 await clearCa();await addCa(1,'ng','10:00');await addCa(1,'ng','11:00');
 await page.click('#hsff button[type=submit]');await W(80);
 ok('2 ca cùng loại trong 1 ngày nhưng đăng ký 1 giờ/ngày: báo lỗi, không lưu hồ sơ',/vượt số giờ đăng ký/.test(await toastTx())&&!(await ev(()=>DB.kids.some(k=>k.n==='Bé Số Giờ'))),await toastTx());

 /* 8. điện thoại 390px: không tràn ngang */
 await page.setViewportSize({width:390,height:800});await W(120);
 const ov=await ev(()=>{const m=document.querySelector('.mdc'),f=document.querySelector('#hsff');return{doc:document.documentElement.scrollWidth-innerWidth,mdl:m.scrollWidth-m.clientWidth,rowOver:[...f.querySelectorAll('.s11r')].some(r=>r.getBoundingClientRect().right>innerWidth+1)}});
 ok('390px: modal hồ sơ bé không tràn ngang, các dòng buổi 1-1 nằm gọn',ov.doc<=1&&ov.mdl<=1&&!ov.rowOver,ov);

 ok('không có lỗi JS',errs.length===0,errs);
 await b.close();
 console.log(passes+' PASS, '+fails+' FAIL');process.exit(fails?1:0)})();
