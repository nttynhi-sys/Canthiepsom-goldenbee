/* Z40: sửa hồ sơ bé phải hiện sẵn dữ liệu đã nhập (hình thức học, ngày bán trú, giáo viên, loại và số giờ 1-1, từng ca thứ/loại/giờ),
   chỉ cần chỉnh một chút rồi lưu: sửa đúng buổi đó, bỏ ca đã chọn Xóa ca, thêm ca mới; ca không đụng đến giữ nguyên; xung đột thì hoàn tác tất cả */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 const toastTx=()=>ev(()=>{const t=document.querySelector('.toast,#toast');return t?t.textContent:''});
 const addCa=(w,lt,tm)=>ev(([w,lt,tm])=>{const f=document.querySelector('#hsff');ACT.s11add(null,f.querySelector('#hth-11 [data-a="s11add"]'));const all=f.querySelectorAll('#s11 .s11r'),r=all[all.length-1];r.querySelector('[name=s11day]').value=w;r.querySelector('[name=s11lt]').value=lt;r.querySelector('[name=s11tm]').value=tm||''},[w,lt,tm]);
 const clearCa=()=>ev(()=>{document.querySelectorAll('#hsff #s11 .s11r').forEach(r=>r.remove())});
 const ltOn=(lt,q)=>ev(([lt,q])=>{const f=document.querySelector('#hsff');f.elements['lt_'+lt].checked=true;f.elements['lq_'+lt].value=q},[lt,q]);
 const snap=id=>ev(id=>DB.lich.filter(l=>l.type==='11'&&l.hs===id).sort((a,b)=>a.day-b.day).map(l=>JSON.stringify(l)),id);
 const openEdit=async id=>{await ev(id=>{S.modal={t:'hsf',id};render()},id);await page.waitForSelector('#hsff');await W(60)};
 const submit=async()=>{await page.click('#hsff button[type=submit]');await W(120)};
 const rowsOf=()=>ev(()=>[...document.querySelectorAll('#hsff #s11 .s11r')].map(r=>({lid:r.dataset.lid||'',day:+r.querySelector('[name=s11day]').value,lt:r.querySelector('[name=s11lt]').value,tm:r.querySelector('[name=s11tm]').value,gone:r.classList.contains('gone'),sv:r.classList.contains('sv')})));
 await login(page,'ql');
 await page.click('.nav button:has-text("Học sinh")');await W(120);

 /* khung giờ trống cho một giáo viên thử */
 const gvs=await ev(()=>pool11().map(s=>s.id)),G=gvs[0];
 const FREE=await ev(g=>{const fr=(w,s)=>ROOMS.some(r=>!conflict({day:w,slot:s,gv:g,hs:'hsX',room:r})),rs=[...SLOTS].reverse(),pick=(w,ex)=>rs.find(s=>!ex.includes(s)&&ex.every(e=>Math.abs(tmin(s)-tmin(e))>=SLOT_MIN)&&fr(w,s));
  const A=pick(1,[]),C=pick(2,[A]),D=pick(2,[A,C]),E=pick(2,[A,C,D]),F=pick(5,[A,C,D,E]),H=pick(3,[A,C,D,E,F]);return{A,C,D,E,F,H}},G);
 ok('tìm được các khung giờ trống cho giáo viên thử',Object.values(FREE).every(Boolean),FREE);

 /* 1. tạo bé: bán trú T2,T4,T6 + 1-1 T2 (A), T3 (C), T5 (C) */
 await page.click('[data-a="hsnew"]');await page.waitForSelector('#hsff');
 await page.fill('#hf-n','Bé Thử Sửa Hồ Sơ');await page.fill('#hf-pn','Mẹ Thử');await page.fill('#hf-pp','0905123456');
 await page.check('#hf-hbt');await page.check('#hf-h11');
 await ev(()=>{const f=document.querySelector('#hsff');[1,2,3,4,5,6].forEach(w=>{f.elements['bd'+w].checked=[1,3,5].includes(w)})});
 await page.selectOption('#hf-gv',G);await ltOn('ng',1);await clearCa();await addCa(1,'ng',FREE.A);await addCa(2,'ng',FREE.C);await addCa(4,'ng',FREE.C);
 await submit();
 const KID=await ev(()=>{const k=DB.kids.find(x=>x.n==='Bé Thử Sửa Hồ Sơ');return k?{id:k.id,gr:k.gr,bt:k.bt,btd:k.btd}:null});
 ok('tạo được bé thử có bán trú và 3 ca 1-1',KID&&KID.bt&&(await snap(KID.id)).length===3,KID);
 const id=KID.id,orig=await snap(id),L=await ev(id=>DB.lich.filter(l=>l.type==='11'&&l.hs===id).sort((a,b)=>a.day-b.day).map(l=>l.id),id);

 /* 2. mở lại để sửa: mọi thứ đã nhập hiện sẵn */
 await openEdit(id);
 const u=await ev(()=>{const f=document.querySelector('#hsff');return{hbt:f.elements.hbt.checked,h11:f.elements.h11.checked,btHid:document.querySelector('#hth-bt').hidden,oneHid:document.querySelector('#hth-11').hidden,
  bd:[1,2,3,4,5,6].filter(w=>f.elements['bd'+w].checked),gr:f.elements.gr.value,gv:f.elements.gv.value,ngOn:f.elements.lt_ng.checked,ngQ:f.elements.lq_ng.value,
  d11:[...document.querySelectorAll('#s11d input[data-s11w]')].filter(c=>c.checked).map(c=>+c.dataset.s11w),
  ids:document.querySelector('#s11').dataset.ids,foot:document.querySelector('#hsff .note.sm:last-of-type')?.textContent||''}});
 ok('sửa hồ sơ: hình thức Bán trú và 1-1 đã được tích, hai phần đều hiện',u.hbt&&u.h11&&!u.btHid&&!u.oneHid,u);
 ok('sửa hồ sơ: ngày bán trú đã chọn (T2, T4, T6) và lớp bán trú hiện đúng',JSON.stringify(u.bd)===JSON.stringify([1,3,5])&&u.gr===KID.gr,u);
 ok('sửa hồ sơ: giáo viên 1-1, loại và số giờ/ngày hiện đúng',u.gv===G&&u.ngOn&&u.ngQ==='1',u);
 ok('sửa hồ sơ: nút chọn ngày 1-1 đã bật đúng các ngày (T2, T3, T5)',JSON.stringify(u.d11)===JSON.stringify([1,2,4]),u);
 const r0=await rowsOf();
 ok('sửa hồ sơ: từng ca 1-1 đã lưu hiện sẵn (thứ, loại, giờ) kèm mã buổi',r0.length===3&&r0.every((r,i)=>r.sv&&r.lid===L[i]&&r.lt==='ng')&&JSON.stringify(r0.map(r=>[r.day,r.tm]))===JSON.stringify([[1,FREE.A],[2,FREE.C],[4,FREE.C]]),r0);
 ok('mỗi ca đã lưu ghi rõ "Đã lưu" cùng giáo viên',await ev(()=>[...document.querySelectorAll('#s11 .s11r.sv .m1')].every(e=>/Đã lưu/.test(e.textContent))&&document.querySelectorAll('#s11 .s11r.sv .m1').length===3));

 /* 3. lưu mà không đổi gì: các buổi giữ nguyên từng trường */
 await submit();
 ok('lưu không đổi gì: các buổi 1-1 giữ nguyên (cùng mã, giờ, phòng, giáo viên)',JSON.stringify(await snap(id))===JSON.stringify(orig),{a:await snap(id),b:orig});
 ok('lưu không đổi gì: không báo sửa hay bỏ buổi',!/sửa|bỏ/.test(await toastTx())&&/Đã lưu hồ sơ/.test(await toastTx()),await toastTx());

 /* 4. chỉ đổi giờ của ca T3: sửa đúng buổi đó, hai ca kia không đổi */
 await openEdit(id);
 await ev(D=>{const r=document.querySelectorAll('#s11 .s11r')[1];r.querySelector('[name=s11tm]').value=D},FREE.D);
 await submit();
 const a4=await ev(id=>DB.lich.filter(l=>l.type==='11'&&l.hs===id).sort((a,b)=>a.day-b.day).map(l=>({id:l.id,day:l.day,slot:l.slot,room:l.room,gv:l.gv,lt:l.lt})),id);
 ok('đổi giờ một ca: đúng buổi đó đổi sang giờ mới, giữ nguyên mã, giáo viên',a4.length===3&&a4[1].id===L[1]&&a4[1].slot===FREE.D&&a4[1].gv===G&&!!a4[1].room,a4);
 {const s4=await snap(id);ok('đổi giờ một ca: hai ca còn lại không đổi',s4[0]===orig[0]&&s4[2]===orig[2],{s4,orig})}
 ok('đổi giờ một ca: báo "sửa 1 buổi"',/sửa 1 buổi/.test(await toastTx()),await toastTx());

 /* 5. đổi thứ và loại của một ca */
 await openEdit(id);
 await ltOn('nh',1);
 await ev(F=>{const r=document.querySelectorAll('#s11 .s11r')[2];r.querySelector('[name=s11day]').value='5';r.querySelector('[name=s11lt]').value='nh';r.querySelector('[name=s11tm]').value=F},FREE.F);
 await submit();
 const l5=await ev(([id,lid])=>{const l=DB.lich.find(x=>x.id===lid);return l&&{day:l.day,slot:l.slot,lt:l.lt}},[id,L[2]]);
 ok('đổi thứ, loại và giờ của một ca: buổi đó cập nhật (T6, Học nhóm), không tạo thêm buổi',l5&&l5.day===5&&l5.slot===FREE.F&&l5.lt==='nh'&&(await snap(id)).length===3,l5);
 ok('số giờ/ngày của loại mới được ghi vào hồ sơ bé',await ev(id=>{const k=kidBy(id);return k.lt&&k.lt.nh===1&&k.lt.ng===1},id),await ev(id=>kidBy(id).lt,id));

 /* 6. Xóa ca: đánh dấu, đổi ý bằng nút ngày, xóa thật khi lưu */
 await openEdit(id);
 await ev(()=>{document.querySelectorAll('#s11 .s11r')[1].querySelector('[data-a="s11del"]').click()});await W(40);
 const g6=await ev(()=>{const r=document.querySelectorAll('#s11 .s11r')[1];return{gone:r.classList.contains('gone'),btn:r.querySelector('[data-a="s11del"]').textContent,still:document.querySelectorAll('#s11 .s11r').length,d11:[...document.querySelectorAll('#s11d input[data-s11w]')].filter(c=>c.checked).map(c=>+c.dataset.s11w)}});
 ok('bấm Xóa ca ở ca đã lưu: dòng bị đánh dấu sẽ xóa (chưa xóa thật), nút đổi thành Giữ lại, ngày tương ứng bỏ chọn',g6.gone&&g6.btn==='Giữ lại'&&g6.still===3&&!g6.d11.includes(2),g6);
 ok('chưa lưu thì chưa mất buổi nào',(await snap(id)).length===3);
 await ev(()=>{document.querySelector('#s11d input[data-s11w="2"]').click()});await W(40);
 const g6b=await ev(()=>({rows:document.querySelectorAll('#s11 .s11r').length,gone:document.querySelectorAll('#s11 .s11r.gone').length}));
 ok('bấm lại nút ngày vừa bỏ: ca cũ được giữ lại, không tạo ca trùng',g6b.rows===3&&g6b.gone===0,g6b);
 await ev(()=>{document.querySelectorAll('#s11 .s11r')[1].querySelector('[data-a="s11del"]').click()});await W(40);
 await page.click('#hsff [data-a="mx"]');await W(80);
 ok('bấm Hủy sau khi đánh dấu xóa: không mất buổi nào',(await snap(id)).length===3);
 await openEdit(id);
 await ev(()=>{document.querySelectorAll('#s11 .s11r')[1].querySelector('[data-a="s11del"]').click()});await W(40);
 await submit();
 const a6=await ev(([id,lid])=>({n:wk11(id),has:DB.lich.some(l=>l.id===lid),m11:kidBy(id).m11}),[id,L[1]]);
 ok('bấm Xóa ca rồi Lưu hồ sơ: buổi đó bị xóa, các buổi khác còn',a6.n===2&&!a6.has&&a6.m11===2&&/bỏ 1 buổi/.test(await toastTx()),{a6,t:await toastTx()});

 /* 7. thêm một ca mới khi sửa */
 await openEdit(id);
 await addCa(3,'ng',FREE.H);
 await submit();
 const a7=await ev(([id,H])=>({n:wk11(id),new:DB.lich.find(l=>l.hs===id&&l.type==='11'&&l.day===3&&l.slot===H),res:S.modal.res}),[id,FREE.H]);
 ok('thêm ca mới khi sửa: có thêm đúng 1 buổi, đúng giáo viên và loại, các ca cũ vẫn còn',a7.n===3&&a7.new&&a7.new.gv===G&&a7.new.lt==='ng',a7);

 /* 8. đổi sang giờ trùng với buổi khác của giáo viên: không lưu gì, hoàn tác cả việc xóa ca khác trong cùng lần lưu */
 await ev(([E,G])=>{const o=DB.kids.find(k=>k.n!=='Bé Thử Sửa Hồ Sơ');DB.lich.push({id:'lcf1',type:'11',day:1,slot:E,gv:G,hs:o.id,room:ROOMS[ROOMS.length-1],lt:null})},[FREE.E,G]);
 const before8=await snap(id);
 await openEdit(id);
 await ev(()=>{document.querySelectorAll('#s11 .s11r')[0].querySelector('[data-a="s11del"]').click()});   /* bỏ ca đầu */
 await ev(E=>{const r=document.querySelectorAll('#s11 .s11r')[2];r.querySelector('[name=s11day]').value='1';r.querySelector('[name=s11tm]').value=E},FREE.E);   /* ca khác đổi sang T2 trùng giờ */
 await submit();
 ok('đổi sang giờ trùng giáo viên: báo lý do, chưa lưu',/Giáo viên đã có buổi khác|Hồ sơ chưa được lưu/.test(await toastTx()),await toastTx());
 ok('xung đột: hoàn tác tất cả (ca định xóa vẫn còn, ca định đổi giữ nguyên giờ cũ)',JSON.stringify(await snap(id))===JSON.stringify(before8),{a:await snap(id),b:before8});
 await ev(()=>{DB.lich=DB.lich.filter(l=>l.id!=='lcf1');S.modal=null;render()});

 /* 9. ca cũ chưa gắn loại: hiện "Chưa chọn loại", lưu lại không tự gán loại và không bị chặn */
 await ev(([id,G])=>{const x=DB.lich.find(l=>l.hs===id&&l.type==='11'&&l.day===2);if(x)DB.lich=DB.lich.filter(l=>l.id!==x.id)},[id,G]);
 const FREE2=await ev(([g,id])=>{const fr=(w,s)=>ROOMS.some(r=>!conflict({day:w,slot:s,gv:g,hs:id,room:r}));return[...SLOTS].reverse().find(s=>fr(4,s))},[G,id]);
 await ev(([id,G,s])=>{DB.lich.push({id:'lold1',type:'11',day:4,slot:s,gv:G,hs:id,room:ROOMS[0]});kidBy(id).m11=wk11(id)},[id,G,FREE2]);
 await openEdit(id);
 const old9=await ev(()=>{const r=document.querySelector('#s11 .s11r[data-lid="lold1"]'),s=r&&r.querySelector('[name=s11lt]');return r?{lt:s.value,first:s.options[0].textContent}:null});
 ok('ca cũ chưa có loại: dòng hiện "Chưa chọn loại" thay vì tự chọn một loại',old9&&old9.lt===''&&/Chưa chọn loại/.test(old9.first),old9);
 await page.fill('#hf-pn','Mẹ Thử Đổi');await submit();
 const l9=await ev(()=>{const l=DB.lich.find(x=>x.id==='lold1');return l&&{lt:l.lt===undefined?'undef':l.lt,day:l.day}});
 ok('lưu lại hồ sơ: ca cũ chưa gắn loại vẫn y nguyên (không bị gán loại, không bị chặn), tên phụ huynh đã đổi',l9&&(l9.lt==='undef'||l9.lt===null)&&(await ev(id=>kidBy(id).pn,id))==='Mẹ Thử Đổi',l9);

 /* 10. bỏ tích loại còn ca đang dùng: báo rõ, không lưu */
 await openEdit(id);
 await ev(()=>{document.querySelector('#hsff').elements.lt_nh.checked=false});
 await submit();
 ok('bỏ tích loại còn ca đang dùng: báo loại chưa được tích, chưa lưu',/chưa được tích/.test(await toastTx())&&await ev(()=>S.modal.t==='hsf'),await toastTx());
 await ev(()=>{S.modal=null;render()});

 /* 11. ca do người khác vừa thêm lúc đang sửa không bị mất */
 await openEdit(id);
 await ev(([id,G])=>{DB.lich.push({id:'lnew1',type:'11',day:6,slot:'09:00',gv:G,hs:id,room:'',lt:null})},[id,G]);
 await submit();
 ok('ca thêm vào lúc đang sửa (chưa hiện trong biểu mẫu) không bị xóa khi lưu',await ev(()=>DB.lich.some(l=>l.id==='lnew1')));
 await ev(()=>{DB.lich=DB.lich.filter(l=>l.id!=='lnew1');S.modal=null;render()});

 /* 12. bỏ tích Can thiệp 1-1 khi còn ca: vẫn báo phải xóa từng ca, không xóa gì */
 await openEdit(id);
 await page.uncheck('#hf-h11');await submit();
 ok('bỏ tích 1-1 khi còn buổi: báo phải xóa từng buổi, không xóa gì',/xóa từng buổi/.test(await toastTx())&&(await snap(id)).length>=2,await toastTx());
 await ev(()=>{S.modal=null;render()});

 /* 13. thẻ Lịch học có lối tắt sang form sửa */
 await ev(id=>{S.modal={t:'hs',id,tab:'lh'};render()},id);await W(100);
 const sc=await ev(()=>({btn:!!document.querySelector('[data-a="hsedit"]')}));
 ok('thẻ Lịch học có nút mở form sửa các ca',sc.btn,sc);
 await page.click('[data-a="hsedit"]');await page.waitForSelector('#hsff');
 ok('nút đó mở form sửa với các ca đã hiện sẵn',(await rowsOf()).length>=2);

 /* 14. điện thoại 390px: dòng ca đã lưu không tràn ngang */
 await page.setViewportSize({width:390,height:800});await W(120);
 await ev(()=>{document.querySelectorAll('#s11 .s11r')[0].querySelector('[data-a="s11del"]').click()});await W(40);
 const ov=await ev(()=>{const m=document.querySelector('.mdc'),f=document.querySelector('#hsff');return{doc:document.documentElement.scrollWidth-innerWidth,mdl:m.scrollWidth-m.clientWidth,rowOver:[...f.querySelectorAll('.s11r')].some(r=>r.getBoundingClientRect().right>innerWidth+1)}});
 ok('390px: các dòng ca đã lưu (kể cả ca đang đánh dấu xóa) nằm gọn, không tràn ngang',ov.doc<=1&&ov.mdl<=1&&!ov.rowOver,ov);

 ok('không có lỗi JS',errs.length===0,errs);
 await b.close();
 console.log(passes+' PASS, '+fails+' FAIL');process.exit(fails?1:0)})();
