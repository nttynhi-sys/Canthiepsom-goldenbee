/* Z43: Nhân sự phân loại Fulltime (lương cố định hằng tháng) / Partime (trả theo ca 1-1): tích chọn trong hồ sơ, số lượng từng nhóm,
   nút lọc, cột Loại hình; Quản lý chỉ xem; dữ liệu cũ chưa có cờ vẫn phân nhóm đúng */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 /* số lượng mong đợi tính độc lập, trực tiếp từ hình thức trả lương trong dữ liệu */
 const want=()=>ev(()=>{const a=DB.staff.filter(s=>s.st==='dang'),f=a.filter(s=>s.pay.mode!=='buoi').length;return{all:a.length,ft:f,pt:a.length-f}});
 const shown=()=>ev(()=>({head:document.querySelector('#main .top, #main header, #main h1, #main .hd')?.parentElement?.innerText||'',
   chips:[...document.querySelectorAll('#main [data-a="nsft"]')].map(c=>c.innerText.replace(/\s+/g,' ').trim()),
   on:[...document.querySelectorAll('#main [data-a="nsft"].on')].map(c=>c.dataset.v),
   th:[...document.querySelectorAll('#main table thead th')].map(t=>t.innerText.trim()),
   tags:[...document.querySelectorAll('#main table tbody tr')].map(r=>r.cells[4]&&r.cells[4].innerText.trim()),
   rows:document.querySelectorAll('#main table tbody tr.k').length}));
 const openStaff=async id=>{await ev(id=>{ACT.nvopen(id);render()},id);await page.waitForSelector('#nvf');await W(60)};
 const closeM=async()=>{await ev(()=>{S.modal=null;render()});await W(40)};
 await login(page,'tt');
 await page.click('.nav button:has-text("Nhân sự")');await W(150);

 /* 1. số lượng trên đầu trang và nút lọc */
 let w=await want(),sh=await shown();
 ok('dữ liệu mẫu có cả hai nhóm',w.ft>0&&w.pt>0&&w.ft+w.pt===w.all,w);
 ok('đầu trang nêu số nhân sự đang làm, số Fulltime và số Partime',sh.head.includes(w.all+' nhân sự đang làm việc · '+w.ft+' Fulltime · '+w.pt+' Partime'),sh.head.slice(0,200));
 ok('ba nút lọc có số lượng đúng: Tất cả, Fulltime, Partime',sh.chips.length===3&&sh.chips[0]==='Tất cả '+w.all&&sh.chips[1]==='Fulltime '+w.ft&&sh.chips[2]==='Partime '+w.pt,sh.chips);
 ok('mặc định chọn "Tất cả"; bảng có cột Loại hình mỗi dòng hiện Fulltime hoặc Partime',sh.on.join()===''&&sh.th[4]==='Loại hình'&&sh.tags.every(t=>t==='Fulltime'||t==='Partime'),{on:sh.on,th:sh.th,tags:sh.tags.slice(0,4)});

 /* 2. lọc */
 await page.click('#main [data-a="nsft"][data-v="1"]');await W(80);sh=await shown();
 let list=await ev(()=>nsList0().map(s=>s.id));
 ok('lọc Fulltime: chỉ hiện nhân sự Fulltime, đủ số lượng, nút Fulltime sáng',sh.on.join()==='1'&&sh.tags.every(t=>t==='Fulltime')&&list.length===w.ft&&sh.rows===Math.min(w.ft,15),{on:sh.on,n:list.length,rows:sh.rows});
 await page.click('#main [data-a="nsft"][data-v="0"]');await W(80);sh=await shown();list=await ev(()=>nsList0().map(s=>s.id));
 ok('lọc Partime: chỉ hiện nhân sự Partime, đủ số lượng (chia trang)',sh.on.join()==='0'&&sh.tags.every(t=>t==='Partime')&&list.length===w.pt&&sh.rows===Math.min(w.pt,15),{on:sh.on,n:list.length,rows:sh.rows});
 await ev(()=>{S.ns.role='gv';render()});await W(60);
 const gvPt=await ev(()=>nsList0().length),gvPtW=await ev(()=>DB.staff.filter(s=>s.st==='dang'&&s.role==='gv'&&s.pay.mode==='buoi').length);
 ok('kết hợp lọc Partime với vai trò Giáo viên',gvPt===gvPtW&&gvPt>0,{gvPt,gvPtW});
 await ev(()=>{S.ns.role='';S.ns.ft='';render()});await W(60);

 /* 3. hồ sơ giáo viên 1-1 (nv04): Partime đang tích, chỉ có cách tính "theo ca 1-1" */
 await openStaff('nv04');
 let f=await ev(()=>({ft:document.querySelector('#nvf [name=ft]:checked').value,opts:[...document.querySelectorAll('#nv-mode option')].map(o=>o.value),mode:document.querySelector('#nv-mode').value,h:[...document.querySelectorAll('#nvf h3')].map(h=>h.textContent)}));
 ok('hồ sơ Partime: nút Partime đang tích, cách tính duy nhất là theo ca 1-1',f.ft==='0'&&f.opts.join()==='buoi'&&f.mode==='buoi'&&f.h.includes('Loại hình làm việc và hình thức trả lương'),f);
 /* đổi sang Fulltime: danh sách cách tính đổi theo, chữ đang gõ không mất */
 await ev(()=>{document.querySelector('#nv-base').value='4567000'});
 await page.click('label[for="nv-ft1"]');await W(60);
 f=await ev(()=>({opts:[...document.querySelectorAll('#nv-mode option')].map(o=>o.value),mode:document.querySelector('#nv-mode').value,base:document.querySelector('#nv-base').value,still:!!document.querySelector('#nvf')}));
 ok('tích Fulltime: cách tính thành cố định tháng hoặc cơ bản cộng ca; ô lương cơ bản đang gõ không mất',f.opts.join()==='thang,kethop'&&f.mode==='thang'&&f.base==='4567000'&&f.still,f);
 await page.click('#nvf button[type=submit]');await W(100);
 let s4=await ev(()=>{const s=stBy('nv04');return{ft:s.ft,mode:s.pay.mode,base:s.pay.base,cc:s.cc,needCC:needCC(s)}});
 ok('lưu Fulltime: s.ft=true, cách tính cố định tháng, lương đã nhập, phải chấm công',s4.ft===true&&s4.mode==='thang'&&s4.base===4567000&&s4.cc===true&&s4.needCC,s4);
 w=await want();sh=await shown();
 ok('số lượng cập nhật ngay: Fulltime +1, Partime -1',sh.chips[1]==='Fulltime '+w.ft&&sh.chips[2]==='Partime '+w.pt&&w.ft+w.pt===w.all&&sh.head.includes(w.ft+' Fulltime · '+w.pt+' Partime'),{chips:sh.chips,w});
 /* mở lại: Fulltime đang tích, chọn "Lương cơ bản cộng theo ca" rồi lưu: vẫn Fulltime, giữ kethop */
 await openStaff('nv04');
 await page.selectOption('#nv-mode','kethop');await page.click('#nvf button[type=submit]');await W(100);
 s4=await ev(()=>{const s=stBy('nv04');return{ft:s.ft,mode:s.pay.mode}});
 ok('Fulltime với "lương cơ bản cộng theo ca": vẫn tính Fulltime và giữ cách tính',s4.ft===true&&s4.mode==='kethop',s4);
 await openStaff('nv04');
 f=await ev(()=>({ft:document.querySelector('#nvf [name=ft]:checked').value,mode:document.querySelector('#nv-mode').value}));
 ok('mở lại hiện đúng: Fulltime, cách tính kethop',f.ft==='1'&&f.mode==='kethop',f);
 /* trả về Partime: cách tính về theo ca, cờ chấm công về false */
 await page.click('label[for="nv-ft0"]');await W(60);
 const o2=await ev(()=>[...document.querySelectorAll('#nv-mode option')].map(o=>o.value).join());
 await page.click('#nvf button[type=submit]');await W(100);
 s4=await ev(()=>{const s=stBy('nv04');return{ft:s.ft,mode:s.pay.mode,cc:s.cc,needCC:needCC(s)}});
 ok('tích lại Partime: cách tính theo ca 1-1, không cần chấm công',o2==='buoi'&&s4.ft===false&&s4.mode==='buoi'&&s4.cc===false&&!s4.needCC,{o2,s4});
 w=await want();sh=await shown();
 ok('số lượng trở lại như ban đầu',sh.chips[1]==='Fulltime '+w.ft&&sh.chips[2]==='Partime '+w.pt,sh.chips);

 /* 4. nhân sự đã nghỉ không tính vào số lượng; lọc theo nhóm chỉ hiện người đang làm */
 await ev(()=>{stBy('nv05').st='nghi';render()});await W(60);
 w=await want();sh=await shown();
 await page.click('#main [data-a="nsft"][data-v="0"]');await W(60);
 const hid=await ev(()=>!nsList0().some(s=>s.id==='nv05'));
 await page.click('#main [data-a="nsft"][data-v=""]');await W(60);
 const all=await ev(()=>nsList0().some(s=>s.id==='nv05'));
 ok('nhân sự đã nghỉ: không tính vào số lượng, ẩn khi lọc nhóm, vẫn có ở "Tất cả"',sh.chips[0]==='Tất cả '+w.all&&w.all===29&&hid&&all,{chips:sh.chips,hid,all});
 await ev(()=>{stBy('nv05').st='dang';render()});

 /* 5. thêm nhân viên mới: mặc định Fulltime; chọn Partime thì lưu theo ca */
 await closeM();
 const before=await want();
 await page.click('#main [data-a="nvnew"]');await page.waitForSelector('#nvf');
 f=await ev(()=>({ft:document.querySelector('#nvf [name=ft]:checked').value,mode:document.querySelector('#nv-mode').value}));
 ok('nhân viên mới: mặc định Fulltime, cố định tháng',f.ft==='1'&&f.mode==='thang',f);
 await page.fill('#nv-n','Cô Thử Partime');await page.click('label[for="nv-ft0"]');await page.click('#nvf button[type=submit]');await W(100);
 const nn=await ev(()=>{const s=DB.staff.find(x=>x.n==='Cô Thử Partime');return s?{ft:s.ft,mode:s.pay.mode,cc:s.cc}:null});
 w=await want();
 ok('thêm nhân viên Partime: lưu s.ft=false, theo ca, không chấm công; Partime tăng 1',nn&&nn.ft===false&&nn.mode==='buoi'&&nn.cc===false&&w.pt===before.pt+1&&w.ft===before.ft,{nn,before,w});

 /* 6. Quản lý (không thấy lương): thấy nhóm và số lượng đúng, không đổi được */
 await page.evaluate(()=>{localStorage.removeItem('gb_v2')});
 const q=await open();const pg=q.page;await login(pg,'ql');
 await pg.click('.nav button:has-text("Nhân sự")');await pg.waitForTimeout(150);
 const qs=await pg.evaluate(()=>{const a=DB.staff.filter(s=>s.st==='dang'),f=a.filter(s=>s.pay.mode!=='buoi').length;
  return{want:{all:a.length,ft:f,pt:a.length-f},chips:[...document.querySelectorAll('#main [data-a="nsft"]')].map(c=>c.innerText.replace(/\s+/g,' ').trim()),canM:canMoney(),
   tags:[...document.querySelectorAll('#main table tbody tr')].map(r=>r.cells[4]&&r.cells[4].innerText.trim())}});
 ok('Quản lý: không thấy lương nhưng vẫn thấy đúng số Fulltime / Partime và cột Loại hình (suy từ cờ chấm công khi chưa có s.ft)',!qs.canM&&qs.chips[1]==='Fulltime '+qs.want.ft&&qs.chips[2]==='Partime '+qs.want.pt&&qs.tags.every(t=>t==='Fulltime'||t==='Partime'),qs);
 await pg.evaluate(()=>{ACT.nvopen('nv04');render()});await pg.waitForSelector('#nvf');
 const qf=await pg.evaluate(()=>({radios:document.querySelectorAll('#nvf [name=ft]').length,mode:!!document.querySelector('#nv-mode'),txt:document.querySelector('#nvf').innerText}));
 ok('Quản lý: hồ sơ chỉ hiện nhãn Loại hình (không có nút tích, không có ô lương)',qf.radios===0&&!qf.mode&&/Loại hình làm việc/.test(qf.txt)&&/Partime/.test(qf.txt)&&/Trưởng Trung tâm đặt/.test(qf.txt),qf);
 /* Quản lý thêm nhân viên: không đụng cờ; hiện Fulltime theo cách tính mặc định */
 await pg.evaluate(()=>{S.modal=null;render()});await pg.waitForTimeout(40);
 await pg.click('#main [data-a="nvnew"]');await pg.waitForSelector('#nvf');await pg.fill('#nv-n','Cô Do Quản Lý Thêm');await pg.click('#nvf button[type=submit]');await pg.waitForTimeout(100);
 const qn=await pg.evaluate(()=>{const s=DB.staff.find(x=>x.n==='Cô Do Quản Lý Thêm');return s?{ft:s.ft,fl:isFT(s)}:null});
 ok('Quản lý thêm nhân viên: không ghi s.ft, nhóm mặc định Fulltime (cách tính mặc định cố định tháng)',qn&&qn.ft===undefined&&qn.fl===true,qn);
 await q.b.close();

 ok('không có lỗi JS',errs.length===0&&q.errs.length===0,errs.concat(q.errs));
 await b.close();
 console.log(passes+' PASS, '+fails+' FAIL');process.exit(fails?1:0)})();
