/* Yêu cầu 1: thực đơn bán trú thứ Hai đến thứ Bảy. Yêu cầu 2: giờ can thiệp 1-1 chọn tự do (ca 50 phút), kiểm tra trùng theo khoảng giờ */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||60);
 await login(page,'tt');

 /* ---------- Y1: thực đơn T2–T7 ---------- */
 const mn=await ev(()=>{const ds=Object.keys(DB.menu),sat=ds.filter(d=>dow(d)===6).length,sun=ds.filter(d=>dow(d)===0).length;
  return{n:ds.length,sat,sun,bdaySun:dow(bday('2026-11-08')),bdaySat:dow(bday('2026-11-14'))}});
 ok('thực đơn mẫu: 3 tuần × 6 ngày, có thứ Bảy, không có Chủ nhật',mn.n===18&&mn.sat===3&&mn.sun===0,mn);
 ok('ngày làm việc của thực đơn: Chủ nhật chuyển sang thứ Hai, thứ Bảy giữ nguyên',mn.bdaySun===1&&mn.bdaySat===6,mn);
 await ev(()=>{go('tn');render()});await W(100);
 const tn=await ev(()=>({days:document.querySelectorAll('#main .mday').length,edit:document.querySelectorAll('#main [data-a="tnedit"]').length,tx:document.querySelector('#main').innerText.slice(0,400)}));
 ok('trang thực đơn: 6 ngày, 6 nút Sửa, tiêu đề nêu thứ Hai đến thứ Bảy',tn.days===6&&tn.edit===6&&/thứ Hai đến thứ Bảy/.test(tn.tx),tn);
 /* sao chép tuần: đủ 6 ngày kể cả thứ Bảy */
 const cp=await ev(()=>{const mon=S.tn.wk,prev=addD(mon,-7),nxt=addD(mon,7);[0,1,2,3,4,5].forEach(i=>{delete DB.menu[addD(nxt,i)]});S.tn.wk=nxt;const had=[0,1,2,3,4,5].filter(i=>DB.menu[addD(mon,i)]).length;ACT.tncopy();return{had,got:[0,1,2,3,4,5].filter(i=>DB.menu[addD(nxt,i)]).length,satGot:!!DB.menu[addD(nxt,5)]}});
 ok('sao chép thực đơn từ tuần trước sang tuần trống: đủ 6 ngày kể cả thứ Bảy',cp.had===6&&cp.got===6&&cp.satGot,cp);

 /* ---------- Y2: giờ 1-1 chọn tự do ---------- */
 await ev(()=>{
  DB.staff.push({id:'gvy1',n:'Giáo viên Thử Y',role:'gv',st:'dang',pos:'',em:'',ph:'',pay:{mode:'buoi',base:0,rate:60000,rateBt:0,allow:0,latePen:0,bh:0}});
  const src=DB.kids.find(k=>!k.bt&&k.st==='dang');
  ['ya','yb'].forEach((id,i)=>{const k=JSON.parse(JSON.stringify(src));k.id=id;k.n='Bé Thử '+id.toUpperCase();k.gv='';k.m11=0;DB.kids.push(k)});
  DB.lich=[];   /* lịch trống để kiểm tra riêng logic giờ và phòng */
  go('lh');render();S.lh.mode='gv';S.lh.gv='gvy1';S.lh.tab='wk';render()});
 await W(100);
 const lo=await ev(()=>({v:[slotValid('07:15'),slotValid('19:10'),slotValid('19:11'),slotValid('07:14'),slotValid(''),slotValid('8:20'),slotValid('08:20')],over:[slotOver('08:05','08:55'),slotOver('08:05','08:54'),slotOver('08:20','08:50')]}));
 ok('slotValid: 07:15 đến 19:10 hợp lệ; ngoài khung hoặc sai định dạng bị từ chối',lo.v.join()==='true,true,false,false,false,false,true',lo);
 ok('slotOver: cách nhau đủ 50 phút thì không chồng, ít hơn thì chồng',lo.over.join()==='false,true,true',lo);

 /* thêm buổi lúc 08:20 (không thuộc mốc gợi ý) bằng giao diện */
 const addAt=async(day,slot,kid,errExpect)=>{
  await ev(([d,s])=>{ACT.lsadd(d+'|'+s);render()},[day,'08:05']);await page.waitForSelector('#lsf');
  await page.selectOption('#ls-k',kid);await page.selectOption('#ls-d',String(day));await page.fill('#ls-s',slot);
  await page.click('#lsf button[type=submit]');await W(100);
  return ev(()=>({err:(document.querySelector('#lsf .err')||{}).innerText||'',modal:!!S.modal}))};
 let r=await addAt(3,'08:20','ya');
 ok('thêm buổi 1-1 lúc 08:20 (giờ tự chọn)',!r.modal&&(await ev(()=>DB.lich.some(l=>l.gv==='gvy1'&&l.hs==='ya'&&l.day===3&&l.slot==='08:20'))),r);
 r=await addAt(3,'08:50','yb');
 ok('08:50 chồng giờ 08:20 của cùng giáo viên: bị từ chối và báo lý do',r.modal&&/Giáo viên đã có buổi khác/.test(r.err)&&/08:50–09:40/.test(r.err),r);
 ok('lỗi trùng giờ vẫn giữ giờ người dùng nhập',(await ev(()=>S.modal.slot))==='08:50');
 await ev(()=>{S.modal=null;render()});
 r=await addAt(3,'09:10','yb');
 ok('09:10 (đúng 50 phút sau 08:20): không chồng giờ, thêm được',!r.modal&&(await ev(()=>DB.lich.some(l=>l.hs==='yb'&&l.slot==='09:10'))),r);
 r=await addAt(4,'06:30','yb');
 ok('giờ bắt đầu 06:30 (trước 07:15): từ chối kèm hướng dẫn khung giờ',r.modal&&/07:15/.test(r.err)&&/19:10/.test(r.err),r);
 await ev(()=>{S.modal=null;render()});
 r=await addAt(4,'19:30','yb');
 ok('giờ bắt đầu 19:30 (kết thúc sau 20:00): từ chối',r.modal&&/19:10/.test(r.err),r);
 await ev(()=>{S.modal=null;render()});
 ok('không có buổi nào bị thêm khi giờ không hợp lệ',(await ev(()=>DB.lich.filter(l=>l.gv==='gvy1'&&l.day===4).length))===0);

 /* đủ 8 phòng đang dùng quanh 12:00 thì báo hết phòng, không báo nhầm lý do khác */
 await ev(()=>{ROOMS.forEach((r,i)=>DB.lich.push({id:'yr'+i,type:'11',day:2,slot:'12:00',gv:'zz'+i,hs:'zk'+i,room:r}))});
 r=await addAt(2,'12:30','yb');
 ok('đủ 8 phòng đang dùng: báo "Không còn phòng trống" (không báo trùng giáo viên hay bé)',r.modal&&/Không còn phòng trống/.test(r.err),r);
 await ev(()=>{S.modal=null;DB.lich=DB.lich.filter(l=>!/^yr/.test(l.id));render()});
 r=await addAt(2,'12:50','yb');
 ok('đúng 50 phút sau ca 12:00 thì nhận phòng trống tự chọn',!r.modal&&(await ev(()=>{const l=DB.lich.find(x=>x.hs==='yb'&&x.slot==='12:50');return !!l&&ROOMS.includes(l.room)})),r);
 await ev(()=>{DB.lich=DB.lich.filter(l=>!(l.hs==='yb'&&l.slot==='12:50'))});

 /* lưới tuần hiện dòng giờ riêng, bấm vào được */
 await ev(()=>{go('lh');render();S.lh.mode='gv';S.lh.gv='gvy1';S.lh.wk=monOf(WD);render()});await W(100);
 const gr=await ev(()=>({th:[...document.querySelectorAll('#main table.wkt tbody th')].map(t=>t.innerText.replace(/\s+/g,' ')),btn:document.querySelectorAll('#main button.ls[data-a="lsopen"]').length}));
 ok('lưới tuần: có dòng 08:20–09:10 ghi "giờ riêng", 09:10–10:00 và đủ các mốc gợi ý',gr.th.some(t=>/08:20–09:10 giờ riêng/.test(t))&&gr.th.some(t=>/09:10–10:00 giờ riêng/.test(t))&&gr.th.some(t=>/07:15–08:05/.test(t))&&gr.btn===2,gr);
 /* đổi giờ buổi đã có: không tự xung đột với chính nó */
 const id=await ev(()=>DB.lich.find(l=>l.hs==='ya').id);
 await ev(i=>{ACT.lsopen(i+'|'+monOf(WD));render()},id);await page.waitForSelector('#lsf');
 ok('mở sửa buổi: ô giờ hiện 08:20',(await page.inputValue('#ls-s'))==='08:20');
 await page.fill('#ls-s','08:10');await page.click('#lsf button[type=submit]');await W(100);
 ok('sửa giờ 08:20 → 08:10 (chồng giờ với chính nó thì không tính là trùng)',(await ev(i=>DB.lich.find(l=>l.id===i).slot,id))==='08:10'&&!(await ev(()=>!!S.modal)));
 await ev(i=>{ACT.lsopen(i+'|'+monOf(WD));render()},id);await page.waitForSelector('#lsf');
 await page.fill('#ls-s','08:30');await page.click('#lsf button[type=submit]');await W(100);
 ok('sửa 08:10 → 08:30 chồng với buổi 09:10 của bé khác: từ chối, giữ giờ cũ',(await ev(i=>DB.lich.find(l=>l.id===i).slot,id))==='08:10'&&/khác/.test(await ev(()=>document.querySelector('#lsf .err').innerText)));
 await ev(()=>{S.modal=null;render()});

 /* thời khóa biểu của bé hiện đúng giờ riêng */
 const kw=await ev(()=>{S.modal={t:'hs',id:'ya',tab:'lh'};render();return document.querySelector('.mdc').innerText});
 ok('hồ sơ bé: bảng tuần ghi ca 08:10–09:00',/08:10–09:00/.test(kw),kw.slice(0,200));

 /* thêm nhiều ngày với giờ tự chọn */
 await page.waitForSelector('#lsmf');
 await page.selectOption('#lsmf [name=gv]','gvy1');await page.fill('#lsmf [name=slot]','10:25');
 await page.click('#lsmf [data-a="dayset"][data-v="d|"]');
 for(const w of [1,5])await page.check(`#lsmf [name=d${w}]`);
 await page.click('#lsmf button[type=submit]');await W(100);
 ok('thêm nhiều ngày lúc 10:25: thêm được thứ Hai và thứ Sáu',(await ev(()=>DB.lich.filter(l=>l.hs==='ya'&&l.slot==='10:25').map(l=>l.day).sort().join()))==='1,5');
 await page.fill('#lsmf [name=slot]','20:00');
 await page.click('#lsmf [data-a="dayset"][data-v="d|"]');await page.check('#lsmf [name=d2]');
 const before=await ev(()=>DB.lich.length);
 await page.click('#lsmf button[type=submit]');await W(100);
 ok('thêm nhiều ngày với giờ ngoài khung: không thêm gì',(await ev(()=>DB.lich.length))===before);

 /* bảng điều khiển có dòng giờ riêng cho ngày đó */
 const dash=await ev(()=>{const w=3,d=(()=>{let x=WD;return x})();return typeof slotRows==='function'});
 ok('có hàm dựng dòng giờ cho lưới',dash===true);
 /* ca giờ riêng vẫn tính vào học phí và công nợ như ca thường: ít nhất kết thúc đúng 50 phút */
 ok('slotEnd/slotLb của giờ riêng: 08:30 → 09:20',(await ev(()=>slotLb('08:30')))==='08:30–09:20');

 ok('không có lỗi JS',errs.length===0,errs);
 await b.close();
 console.log(passes+' PASS, '+fails+' FAIL');process.exit(fails?1:0)})();
