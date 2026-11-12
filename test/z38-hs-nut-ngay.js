/* Z38: hồ sơ học sinh có nút bấm chọn hình thức (Bán trú, Can thiệp 1-1) và nút các ngày học (T2–T7) cho cả hai hình thức */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,800))}};
const SP='/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/';
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 const toastTx=()=>ev(()=>{const t=document.querySelector('.toast,#toast');return t?t.textContent:''});
 const rows=()=>ev(()=>[...document.querySelectorAll('#hsff #s11 .s11r')].map(r=>({d:+r.querySelector('[name=s11day]').value,lt:r.querySelector('[name=s11lt]').value,tm:r.querySelector('[name=s11tm]').value})));
 const btn11=()=>ev(()=>[...document.querySelectorAll('#s11d input[data-s11w]')].map(c=>c.checked));
 const day11=w=>page.click(`#s11d label:has(input[data-s11w="${w}"])`);
 const dayBt=w=>page.click(`#hth-bt label:has(input[name="bd${w}"])`);
 await login(page,'tt');
 await page.click('.nav button:has-text("Học sinh")');await W(120);
 await page.click('[data-a="hsnew"]');await page.waitForSelector('#hsff');

 /* ---------- A. hai nút lớn chọn hình thức ---------- */
 const A=await ev(()=>{const l=[...document.querySelectorAll('.hth-pick label.bpk.big')];return{n:l.length,tx:l.map(x=>x.textContent.replace(/\s+/g,' ').trim()),h:l.map(x=>Math.round(x.getBoundingClientRect().height)),
  btHid:document.querySelector('#hth-bt').hidden,oneHid:document.querySelector('#hth-11').hidden,
  oldHead:!!document.querySelector('.hth-h')}});
 ok('có 2 nút lớn: Bán trú (07:30–17:00) và Can thiệp 1-1 (ca 50 phút); chưa chọn thì hai phần bên dưới ẩn',A.n===2&&/^Bán trú\s*07:30–17:00$/.test(A.tx[0])&&/^Can thiệp 1-1\s*Ca 50 phút$/.test(A.tx[1])&&A.btHid&&A.oneHid&&!A.oldHead,A);
 ok('nút đủ lớn để bấm bằng ngón tay (cao từ 44px)',A.h.every(h=>h>=44),A.h);
 await page.click('label[for=hf-hbt]');await W(40);
 let S1=await ev(()=>({bt:document.querySelector('#hf-hbt').checked,hid:document.querySelector('#hth-bt').hidden,one:document.querySelector('#hth-11').hidden}));
 ok('bấm nút Bán trú: hiện phần chọn lớp và ngày bán trú, 1-1 vẫn ẩn',S1.bt&&!S1.hid&&S1.one,S1);
 await page.click('label[for=hf-h11]');await W(40);
 S1=await ev(()=>({h11:document.querySelector('#hf-h11').checked,one:document.querySelector('#hth-11').hidden}));
 ok('bấm thêm nút Can thiệp 1-1: học cả hai, hiện phần 1-1',S1.h11&&!S1.one,S1);
 await page.click('label[for=hf-hbt]');await W(40);
 S1=await ev(()=>({bt:document.querySelector('#hf-hbt').checked,hid:document.querySelector('#hth-bt').hidden}));
 ok('bấm lại nút Bán trú: bỏ chọn, ẩn phần bán trú',!S1.bt&&S1.hid,S1);
 /* bàn phím: Tab tới ô, phím cách để chọn */
 await ev(()=>document.querySelector('#hf-hbt').focus());await page.keyboard.press('Space');await W(40);
 S1=await ev(()=>({bt:document.querySelector('#hf-hbt').checked,hid:document.querySelector('#hth-bt').hidden}));
 ok('dùng bàn phím (phím cách) chọn được nút Bán trú',S1.bt&&!S1.hid,S1);

 /* ---------- B. nút ngày bán trú ---------- */
 const B=await ev(()=>{const f=document.querySelector('#hsff'),bx=[...document.querySelectorAll('#hth-bt label.bpk.day')];return{lb:bx.map(x=>x.textContent.trim()),on:[1,2,3,4,5,6].filter(w=>f.elements['bd'+w].checked),h:Math.round(bx[0].getBoundingClientRect().height)}});
 ok('6 nút ngày bán trú T2–T7, mặc định T2–T6 sáng, T7 không',JSON.stringify(B.lb)===JSON.stringify(['T2','T3','T4','T5','T6','T7'])&&JSON.stringify(B.on)===JSON.stringify([1,2,3,4,5])&&B.h>=44,B);
 await dayBt(2);await dayBt(4);await dayBt(5);await W(30);   /* bỏ T3, T5; thêm... T6 đã sáng nên bấm T6 là bỏ */
 let on=await ev(()=>[1,2,3,4,5,6].filter(w=>document.querySelector('#hsff').elements['bd'+w].checked));
 ok('bấm T3, T5, T6 thì bỏ ba ngày đó (bé học ít ngày: còn T2, T4)',JSON.stringify(on)===JSON.stringify([1,3]),on);
 await page.click('#hth-bt [data-a="dayset"][data-v="bd|1,2,3,4,5,6"]');await W(300);
 on=await ev(()=>[1,2,3,4,5,6].filter(w=>document.querySelector('#hsff').elements['bd'+w].checked));
 const lit=await ev(()=>[...document.querySelectorAll('#hth-bt .bpk.day input')].map(i=>getComputedStyle(i.nextElementSibling).backgroundColor));
 ok('nút nhanh T2–T7: sáng cả 6 nút (màu nền đổi theo ô tích)',on.length===6&&new Set(lit).size===1,{on,lit});
 await page.click('#hth-bt [data-a="dayset"][data-v="bd|"]');await W(30);
 on=await ev(()=>[1,2,3,4,5,6].filter(w=>document.querySelector('#hsff').elements['bd'+w].checked));
 ok('nút Bỏ chọn: tắt hết các ngày',on.length===0,on);
 await dayBt(1);await dayBt(3);await W(30);   /* T2 và T4 */

 /* ---------- C. nút ngày 1-1: bấm ngày thì thêm ca ---------- */
 const C0=await ev(()=>({lb:[...document.querySelectorAll('#s11d label.bpk.day')].map(x=>x.textContent.trim()),checked:[...document.querySelectorAll('#s11d input')].map(c=>c.checked),n:document.querySelectorAll('#s11 .s11r').length,
  quick:[...document.querySelectorAll('#hth-11 [data-a="s11days"]')].map(x=>x.textContent.trim())}));
 ok('1-1 có 6 nút ngày T2–T7 và 3 nút nhanh (T2–T6, T2–T7, Bỏ chọn); chưa chọn ngày nào, chưa có ca',JSON.stringify(C0.lb)===JSON.stringify(['T2','T3','T4','T5','T6','T7'])&&C0.checked.every(x=>!x)&&C0.n===0&&JSON.stringify(C0.quick)===JSON.stringify(['T2–T6','T2–T7','Bỏ chọn']),C0);
 await ev(()=>{const f=document.querySelector('#hsff');f.elements['lt_gq'].checked=true;f.elements['lq_gq'].value=1});
 await day11(1);await W(30);
 let R=await rows();
 ok('bấm T2: thêm 1 ca ngày Thứ Hai, loại là loại đã tích (Học nhóm), giờ để trống',R.length===1&&R[0].d===1&&R[0].lt==='gq'&&R[0].tm==='',R);
 await ev(()=>{document.querySelector('#s11 .s11r [name=s11tm]').value='17:30'});
 await day11(3);await day11(5);await W(30);
 R=await rows();
 ok('bấm tiếp T4, T6: thêm ca, giờ lấy theo ca đầu đã nhập (17:30), sắp theo thứ',R.length===3&&JSON.stringify(R.map(r=>r.d))===JSON.stringify([1,3,5])&&R.every(r=>r.tm==='17:30'&&r.lt==='gq'),R);
 ok('3 nút T2, T4, T6 sáng, các nút còn lại tắt',JSON.stringify(await btn11())===JSON.stringify([true,false,true,false,true,false]),await btn11());
 await day11(3);await W(30);
 R=await rows();
 ok('bấm lại T4: bỏ ca của ngày đó, nút tắt',R.length===2&&!R.some(r=>r.d===3)&&(await btn11())[2]===false,R);
 /* đổi giờ riêng của một ngày rồi bấm thêm ngày khác: không đổi ca đã có */
 await ev(()=>{document.querySelectorAll('#s11 .s11r')[1].querySelector('[name=s11tm]').value='18:20'});
 await day11(2);await W(30);
 R=await rows();
 ok('đổi giờ riêng ca T6 (18:20), bấm thêm T3: các ca cũ giữ nguyên giờ riêng',JSON.stringify(R.map(r=>[r.d,r.tm]))===JSON.stringify([[1,'17:30'],[2,'17:30'],[5,'18:20']]),R);
 /* đổi ngày bằng danh sách chọn thì nút tự đổi theo */
 await ev(()=>{const s=document.querySelectorAll('#s11 .s11r')[1].querySelector('[name=s11day]');s.value='4';s.dispatchEvent(new Event('change',{bubbles:true}))});
 ok('đổi ngày của một ca (T3 thành T5) bằng danh sách: nút ngày tự cập nhật',JSON.stringify(await btn11())===JSON.stringify([true,false,false,true,true,false]),await btn11());
 /* xóa ca thì nút tắt */
 await page.click('#s11 .s11r:nth-child(2) [data-a="s11del"]');await W(30);
 ok('bấm Xóa ca: nút ngày của ca đó tắt',JSON.stringify(await btn11())===JSON.stringify([true,false,false,false,true,false])&&(await rows()).length===2,await btn11());
 /* nút nhanh */
 await page.click('#hth-11 [data-a="s11days"][data-v="1,2,3,4,5"]');await W(30);
 R=await rows();
 ok('nút nhanh T2–T6: đủ 5 ca, ca đã có giữ nguyên giờ riêng',R.length===5&&JSON.stringify(R.map(r=>r.d))===JSON.stringify([1,2,3,4,5])&&R.find(r=>r.d===5).tm==='18:20'&&R.find(r=>r.d===1).tm==='17:30',R);
 await page.click('#hth-11 [data-a="s11days"][data-v="1,2,3,4,5,6"]');await W(30);
 ok('nút nhanh T2–T7: thêm T7, 6 ca',(await rows()).length===6&&(await btn11()).every(Boolean),await rows());
 await page.click('#hth-11 [data-a="s11days"][data-v=""]');await W(30);
 ok('nút Bỏ chọn: xóa hết ca, tắt hết nút',(await rows()).length===0&&(await btn11()).every(x=>!x));
 /* + Thêm ca: ngày còn trống kế tiếp; hết ngày thì cho thêm cùng ngày */
 await day11(1);await page.click('#hth-11 [data-a="s11add"]');await W(30);
 R=await rows();
 ok('+ Thêm ca khi đã có T2: tự chọn ngày kế tiếp còn trống (T3), nút T3 sáng',R.length===2&&R[1].d===2&&(await btn11())[1]===true,R);
 await page.click('#hth-11 [data-a="s11days"][data-v="1,2,3,4,5,6"]');await page.click('#hth-11 [data-a="s11add"]');await W(30);
 R=await rows();
 ok('đủ 6 ngày mà bấm + Thêm ca: thêm ca thứ hai trong cùng một ngày (bé học nhiều ca một ngày)',R.length===7&&R.filter(r=>r.d===1).length===2,R.map(r=>r.d));
 /* bỏ một ngày có 2 ca: xóa cả hai */
 await day11(1);await W(30);
 R=await rows();
 ok('bỏ nút một ngày có 2 ca: xóa cả hai ca của ngày đó',R.length===5&&!R.some(r=>r.d===1),R.map(r=>r.d));
 await page.click('#hth-11 [data-a="s11days"][data-v=""]');await W(30);

 /* ---------- D. lưu hồ sơ bé học ít ngày: bán trú T2, T4 + 1-1 vào T3, T5 ---------- */
 await page.fill('#hf-n','Bé Thử Nút Ngày');await page.fill('#hf-pn','Mẹ Thử');await page.fill('#hf-pp','0905123456');
 const gv=await ev(()=>pool11()[0].id);
 /* tìm giờ trống của giáo viên cho T3 và T5 */
 const T=await ev(g=>{const fr=(w,s)=>ROOMS.some(r=>!conflict({day:w,slot:s,gv:g,hs:'hsX',room:r})),rs=[...SLOTS].reverse();return rs.find(s=>fr(2,s)&&fr(4,s))},gv);
 ok('tìm được giờ trống cho giáo viên thử',!!T,T);
 await page.selectOption('#hf-gv',gv);
 await day11(2);await day11(4);await W(30);
 await ev(t=>{const f=document.querySelector('#hsff');f.elements['lt_gq'].checked=true;f.elements['lq_gq'].value=1;document.querySelectorAll('#s11 .s11r').forEach(r=>{r.querySelector('[name=s11tm]').value=t})},T);
 await page.click('#hsff button[type=submit]');await W(120);
 const D=await ev(()=>{const k=DB.kids.find(x=>x.n==='Bé Thử Nút Ngày');if(!k)return null;const ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id);return{bt:k.bt,btd:k.btd,lt:k.lt,days:ls.map(l=>l.day).sort(),lts:ls.map(l=>l.lt),gv:k.gv,m11:k.m11}});
 ok('lưu hồ sơ: bán trú chỉ T2, T4; 1-1 chỉ T3, T5 (học ít ngày), đúng loại, giáo viên',D&&D.bt&&JSON.stringify(D.btd)===JSON.stringify([1,3])&&JSON.stringify(D.days)===JSON.stringify([2,4])&&D.lts.every(x=>x==='gq')&&D.lt&&D.lt.gq===1&&D.gv===gv&&D.m11===2,D);

 /* ---------- E. sửa hồ sơ: ngày bán trú tích sẵn; nút 1-1 để thêm ca mới, không đụng ca cũ ---------- */
 await ev(()=>{S.modal=null;render();const k=DB.kids.find(x=>x.n==='Bé Thử Nút Ngày');ACT.hsedit(k.id);render()});await page.waitForSelector('#hsff');
 const E=await ev(()=>{const f=document.querySelector('#hsff');return{bd:[1,2,3,4,5,6].filter(w=>f.elements['bd'+w].checked),btns:[...document.querySelectorAll('#s11d input')].map(c=>c.checked),rows:document.querySelectorAll('#s11 .s11r').length,note:(document.querySelector('#hth-11 .note')||{}).textContent||'',btOn:f.elements.hbt.checked,h11On:f.elements.h11.checked}});
 ok('sửa hồ sơ: hai nút hình thức sáng sẵn, nút ngày bán trú T2, T4 sáng, nút ngày 1-1 sáng đúng các ngày đã lưu (T3, T5) và 2 dòng ca hiện sẵn',E.btOn&&E.h11On&&JSON.stringify(E.bd)===JSON.stringify([1,3])&&JSON.stringify(E.btns)===JSON.stringify([false,true,false,true,false,false])&&E.rows===2&&/2 ca 1-1/.test(E.note),E);
 const nb=await ev(()=>DB.lich.filter(l=>l.type==='11').length);
 await page.click('#hsff button[type=submit]');await W(100);
 const nb2=await ev(()=>DB.lich.filter(l=>l.type==='11').length);
 ok('lưu lại hồ sơ mà không đổi gì ở các ca: không thêm, không mất ca nào',nb===nb2,{nb,nb2});

 /* ---------- F. giao diện: không tràn ngang ở điện thoại, màu sáng/tối ---------- */
 await ev(()=>{S.modal=null;render();S.modal={t:'hsf'};render()});await page.waitForSelector('#hsff');
 await page.click('label[for=hf-hbt]');await page.click('label[for=hf-h11]');await day11(1);await day11(2);await day11(3);
 await page.setViewportSize({width:390,height:844});await W(250);
 const F=await ev(()=>{const m=document.querySelector('.mdc');return{doc:document.documentElement.scrollWidth-innerWidth,mdl:m.scrollWidth-m.clientWidth,rowOver:[...document.querySelectorAll('#hsff .s11r,#hsff .bpks,#hsff .lt-row')].filter(r=>r.scrollWidth>r.clientWidth+1).length}});
 ok('điện thoại 390px: không tràn ngang (trang, hộp thoại, hàng ca, hàng nút)',F.doc<=0&&F.mdl<=0&&F.rowOver===0,F);
 await page.screenshot({path:SP+'z38-mobile.png'});
 await page.setViewportSize({width:1366,height:900});
 await ev(()=>{document.documentElement.setAttribute('data-theme','dark')});await W(150);
 const dk=await ev(()=>{const c=document.querySelector('#s11d input[data-s11w="1"]'),sp=c.nextElementSibling,s2=document.querySelector('#s11d input[data-s11w="6"]').nextElementSibling,cs=getComputedStyle(sp),c2=getComputedStyle(s2);return{on:[cs.backgroundColor,cs.color],off:[c2.backgroundColor,c2.color]}});
 ok('nền tối: nút được chọn và chưa chọn khác màu nền, chữ đọc được',dk.on[0]!==dk.off[0]&&dk.on[0]!==dk.on[1]&&dk.off[0]!==dk.off[1],dk);
 await page.screenshot({path:SP+'z38-dark.png'});
 await ev(()=>{document.documentElement.removeAttribute('data-theme')});

 ok('không có lỗi trình duyệt',errs.length===0,errs.slice(0,3));
 await b.close();
 console.log(`\nKẾT QUẢ: ${passes} PASS, ${fails} FAIL`);
 process.exit(fails?1:0);
})().catch(e=>{console.log('LỖI',e.message);process.exit(2)});
