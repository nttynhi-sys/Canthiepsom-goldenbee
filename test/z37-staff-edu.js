/* Nhân sự: Trình độ (chọn nhanh 5 loại hoặc tự gõ) và Các chứng chỉ đã học */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
const SP='/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/';
const EDU5=['Cử nhân Giáo dục đặc biệt','Cử nhân Ngôn ngữ trị liệu','Cử nhân Tâm lý học','Cử nhân Giáo dục mầm non','Cử nhân Công tác xã hội'];

(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 await login(page,'tt');

 /* ---------- A. form thêm nhân viên có 2 ô mới ---------- */
 await ev(()=>{S.v='ns';ACT.nvnew();render()});await page.waitForSelector('#nvf');
 const A=await ev(()=>{const f=document.querySelector('#nvf');
  return{edu:!!f.elements.edu,cert:!!f.elements.cert,certTag:f.elements.cert&&f.elements.cert.tagName,
   chips:[...f.querySelectorAll('[data-a="edupick"]')].map(c=>c.textContent.trim()),
   lbEdu:(document.querySelector('label[for="nv-edu"]')||{}).textContent,lbCert:(document.querySelector('label[for="nv-cert"]')||{}).textContent,
   on:f.querySelectorAll('[data-a="edupick"].on').length}});
 ok('form có ô Trình độ và ô Các chứng chỉ đã học (nhiều dòng)',A.edu&&A.cert&&A.certTag==='TEXTAREA'&&A.lbEdu==='Trình độ'&&A.lbCert==='Các chứng chỉ đã học',A);
 ok('5 nút chọn nhanh đúng tên và đúng thứ tự, chưa nút nào được chọn',JSON.stringify(A.chips)===JSON.stringify(EDU5)&&A.on===0,A.chips);

 /* ---------- B. bấm chọn nhanh, bỏ chọn, tự gõ thêm ---------- */
 const chip=n=>page.click(`#nvf [data-a="edupick"][data-v="${EDU5[n]}"]`);
 await chip(1);await chip(2);
 let B=await ev(()=>{const f=document.querySelector('#nvf');return{v:f.elements.edu.value,on:[...f.querySelectorAll('[data-a="edupick"].on')].map(c=>c.dataset.v),modal:!!S.modal}});
 ok('bấm 2 nút: ô Trình độ có cả hai, cách nhau bằng "; ", hai nút sáng lên',B.v===EDU5[1]+'; '+EDU5[2]&&B.on.length===2&&B.modal,B);
 await chip(1);
 B=await ev(()=>{const f=document.querySelector('#nvf');return{v:f.elements.edu.value,on:[...f.querySelectorAll('[data-a="edupick"].on')].map(c=>c.dataset.v)}});
 ok('bấm lại nút đã chọn thì bỏ chọn',B.v===EDU5[2]&&B.on.length===1&&B.on[0]===EDU5[2],B);
 /* tự gõ thêm trình độ khác, rồi bấm nút: ô giữ phần tự gõ */
 await page.fill('#nv-edu',EDU5[2]+'; Thạc sĩ Giáo dục học');
 await chip(0);
 B=await ev(()=>{const f=document.querySelector('#nvf');return{v:f.elements.edu.value,on:[...f.querySelectorAll('[data-a="edupick"].on')].map(c=>c.dataset.v)}});
 ok('tự gõ trình độ khác vẫn giữ khi bấm thêm nút chọn nhanh',B.v===EDU5[2]+'; Thạc sĩ Giáo dục học; '+EDU5[0]&&B.on.length===2,B);
 /* xóa tay trong ô rồi bấm nút: trạng thái các nút khớp lại với nội dung ô */
 await page.fill('#nv-edu','');
 await chip(3);
 B=await ev(()=>{const f=document.querySelector('#nvf');return{v:f.elements.edu.value,on:[...f.querySelectorAll('[data-a="edupick"].on')].map(c=>c.dataset.v)}});
 ok('xóa tay nội dung ô rồi bấm nút: các nút sáng khớp lại với ô',B.v===EDU5[3]&&B.on.length===1&&B.on[0]===EDU5[3],B);

 /* ---------- C. lưu và mở lại ---------- */
 await page.fill('#nv-n','Cô Thử Nghiệm');
 await page.fill('#nv-edu',EDU5[0]+'; '+EDU5[1]+';  Cử nhân Tự gõ ;');
 await page.fill('#nv-cert','  Chứng chỉ PECS, Hội Ngôn ngữ trị liệu, 2024 \n\n\n Chứng chỉ ESDM, 2025  \n');
 await page.click('#nvf button[type="submit"]');
 const C=await ev(()=>{const s=DB.staff.find(x=>x.n==='Cô Thử Nghiệm');return s?{id:s.id,edu:s.edu,cert:s.cert,modal:!!S.modal}:null});
 ok('lưu: trình độ chuẩn hóa (bỏ khoảng trắng và mục rỗng), chứng chỉ mỗi dòng một mục, bỏ dòng trống',C&&C.edu===EDU5[0]+'; '+EDU5[1]+'; Cử nhân Tự gõ'&&C.cert==='Chứng chỉ PECS, Hội Ngôn ngữ trị liệu, 2024\nChứng chỉ ESDM, 2025'&&!C.modal,C);
 await ev(id=>{ACT.nvopen(id);render()},C.id);await page.waitForSelector('#nvf');
 const D=await ev(()=>{const f=document.querySelector('#nvf');return{edu:f.elements.edu.value,cert:f.elements.cert.value,on:[...f.querySelectorAll('[data-a="edupick"].on')].map(c=>c.dataset.v)}});
 ok('mở lại hồ sơ: hai ô hiện đúng nội dung đã lưu, 2 nút chọn nhanh sáng',D.edu===C.edu&&D.cert===C.cert&&D.on.length===2&&D.on.includes(EDU5[0])&&D.on.includes(EDU5[1]),D);
 await page.screenshot({path:SP+'z37-staff-edu.png',fullPage:false});

 /* ---------- D. nhân viên cũ chưa có hai trường: mở và lưu vẫn bình thường, không ghi "undefined" ---------- */
 const E=await ev(()=>{const s=DB.staff.find(x=>x.role==='gv'&&x.id!==undefined);delete s.edu;delete s.cert;return s.id});
 await ev(id=>{ACT.nvopen(id);render()},E);await page.waitForSelector('#nvf');
 const F0=await ev(()=>{const f=document.querySelector('#nvf');return{edu:f.elements.edu.value,cert:f.elements.cert.value,html:f.innerHTML.includes('undefined')}});
 ok('hồ sơ cũ chưa có trình độ, chứng chỉ: hai ô trống, không hiện "undefined"',F0.edu===''&&F0.cert===''&&!F0.html,F0);
 await page.click('#nvf button[type="submit"]');
 const G=await ev(id=>{const s=DB.staff.find(x=>x.id===id);return{edu:s.edu,cert:s.cert}},E);
 ok('lưu hồ sơ cũ khi để trống: lưu chuỗi rỗng',G.edu===''&&G.cert==='',G);

 /* ---------- E. giới hạn độ dài và ký tự đặc biệt ---------- */
 await ev(id=>{ACT.nvopen(id);render()},E);await page.waitForSelector('#nvf');
 await page.fill('#nv-cert','Chứng chỉ "A" <b>x</b> & Co\n'+'x'.repeat(2500));
 await page.click('#nvf button[type="submit"]');
 const H=await ev(id=>{const s=DB.staff.find(x=>x.id===id);return{len:s.cert.length,first:s.cert.split('\n')[0]}},E);
 ok('chứng chỉ quá dài bị cắt ở 2000 ký tự; ký tự đặc biệt giữ nguyên trong dữ liệu',H.len===2000&&H.first==='Chứng chỉ "A" <b>x</b> & Co',H);
 await ev(id=>{ACT.nvopen(id);render()},E);await page.waitForSelector('#nvf');
 const I=await ev(()=>{const t=document.querySelector('#nv-cert');return{v:t.value.split('\n')[0],bold:!!document.querySelector('#nvf b')&&document.querySelector('#nvf textarea b')!==null}});
 ok('ký tự <b> trong chứng chỉ được thoát đúng, hiện nguyên văn trong ô',I.v==='Chứng chỉ "A" <b>x</b> & Co'&&!I.bold,I);

 /* ---------- F. vai trò khác: Quản lý sửa hồ sơ giáo viên được, ghi đủ hai trường ---------- */
 await ev(()=>{S.modal=null;render()});
 await ev(()=>{localStorage.setItem('gb_x','1')});
 await page.click('.topbar [data-a="logout"], [data-a="logout"]').catch(()=>{});
 await page.waitForSelector('.roles [data-v="ql"]');await login(page,'ql');
 const Q=await ev(id=>{const s=DB.staff.find(x=>x.id===id);S.v='ns';ACT.nvopen(id);render();return{role:U.role,can:!!S.modal,lock:lockAcc(s)}},E);
 if(Q.can){
  await page.waitForSelector('#nvf');
  await page.fill('#nv-edu',EDU5[4]);await page.click('#nvf button[type="submit"]');
  const Q2=await ev(id=>DB.staff.find(x=>x.id===id).edu,E);
  ok('Quản lý sửa hồ sơ giáo viên: lưu được Trình độ',Q2===EDU5[4],Q2);
 }else ok('Quản lý không mở được hồ sơ này (khóa hồ sơ) nên bỏ qua ca này',Q.lock,Q);

 /* ---------- G. nhân viên cũ vẫn tải bình thường từ dữ liệu mẫu đời cũ, không lỗi console ---------- */
 ok('không có lỗi trình duyệt khi mở, chọn, lưu',errs.length===0,errs.slice(0,3));

 await b.close();
 console.log(`\nKẾT QUẢ: ${passes} PASS, ${fails} FAIL`);
 process.exit(fails?1:0);
})().catch(e=>{console.log('LỖI',e.message);process.exit(2)});
