/* Z41: lưới "Lịch 1-1 theo tuần" chỉ hiện các khung giờ đang có giáo viên dạy 1-1 cho trẻ (không vẽ sẵn mốc giờ của hệ thống);
   thêm ca ở giờ mới bằng nút "+ Thêm buổi 1-1"; nút + của ô trống chỉ hiện khi rê chuột */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 /* mở lưới tuần với bộ lọc cho trước và trả về các dòng giờ, số nút ca, nút thêm */
 const view=async(mode,key)=>{await ev(([mode,key])=>{go('lh');render();S.lh.tab='wk';S.lh.mode=mode;if(mode==='gv')S.lh.gv=key;if(mode==='kid')S.lh.kid=key;S.lh.wk=monOf(WD);render()},[mode,key]);await W(120);
  return ev(()=>({th:[...document.querySelectorAll('#main table.wkt tbody th')].map(t=>t.innerText.replace(/\s+/g,' ').trim()),
   rowsNoBtn:[...document.querySelectorAll('#main table.wkt tbody tr')].filter(r=>r.querySelector('th')&&!r.querySelector('button.ls:not(.add), .tag')).length,
   add:document.querySelectorAll('#main [data-a="lsadd"][data-v="1|"]').length,addTx:(document.querySelector('#main [data-a="lsadd"][data-v="1|"]')||{}).textContent||'',
   empty:(document.querySelector('#main table.wkt td.empty')||{}).textContent||'',txt:document.querySelector('#main').innerText}))};
 /* các khung giờ đang có ca theo bộ lọc, tính trực tiếp từ dữ liệu */
 const want=(pred)=>ev(p=>{const days=[0,1,2,3,4,5].map(i=>addD(monOf(WD),i)),ds=new Set(days);return[...new Set(DB.lich.filter(l=>l.slot&&(l.type==='11'||ds.has(l.date))&&eval('('+p+')')(l)).map(l=>l.slot))].sort().map(s=>slotLb(s))},pred.toString());
 await login(page,'ql');

 /* 1. xem theo giáo viên: chỉ các dòng giờ giáo viên đó đang dạy */
 const T=await ev(()=>pool11().find(s=>DB.lich.filter(l=>l.type==='11'&&l.gv===s.id).length>=3).id);
 let v=await view('gv',T);
 let w=await want(`l=>l.gv==='${T}'`);
 ok('xem theo giáo viên: các dòng giờ đúng bằng các khung giờ giáo viên đó đang dạy',JSON.stringify(v.th.map(t=>t.replace(/ .*$/,'')))===JSON.stringify(w)&&v.th.length>=1,{th:v.th,w});
 const sys=await ev(()=>SLOTS.map(s=>slotLb(s)));
 /* khung giờ giáo viên đang dạy: ca 1-1 cố định cộng buổi học bù trong tuần đang xem (lưới tuần vẽ cả hai) */
 const lessonSlots=await ev(T=>{const wk=[0,1,2,3,4,5].map(i=>addD(monOf(WD),i));return[...new Set(DB.lich.filter(l=>l.gv===T&&(l.type==='11'||wk.includes(l.date))).map(l=>slotLb(l.slot)))]},T);
 ok('không còn dòng giờ của hệ thống nếu giáo viên không dạy giờ đó, và dòng nào cũng có ít nhất một ca',v.th.every(t=>lessonSlots.includes(t))&&v.rowsNoBtn===0&&sys.some(s=>!lessonSlots.includes(s)),{th:v.th,rowsNoBtn:v.rowsNoBtn});
 ok('không còn nhãn "giờ riêng" trên các dòng giờ',!v.th.some(t=>/giờ riêng/.test(t))&&!/giờ riêng/.test(v.txt),v.th);
 ok('quản lý xem theo giáo viên: có nút "+ Thêm buổi 1-1"',v.add===1&&/\+ Thêm buổi 1-1/.test(v.addTx),v);
 ok('ghi chú dưới bảng nói rõ chỉ hiện khung giờ đang dạy',/Chỉ hiện các khung giờ đang có giáo viên dạy 1-1/.test(v.txt));

 /* 2. xem theo bé, tổng hợp: cũng chỉ các khung giờ có ca, không có nút thêm; không còn chế độ xem theo phòng */
 const K=await ev(()=>DB.kids.find(k=>k.st==='dang'&&wk11(k.id)>=2).id);
 ok('ô "Xem theo" không còn lựa chọn Phòng',await ev(()=>{const o=[...document.querySelectorAll('#lhm option')];return o.length>=3&&!o.some(x=>x.value==='room'||/Phòng/.test(x.textContent))}));
 v=await view('kid',K);w=await want(`l=>l.hs==='${K}'`);
 ok('xem theo từng bé: chỉ các khung giờ của bé đó, không có nút thêm',JSON.stringify(v.th.map(t=>t.replace(/ .*$/,'')))===JSON.stringify(w)&&v.th.length>=1&&v.add===0,{th:v.th,w});
 v=await view('all','');w=await want('l=>true');
 ok('tổng hợp số buổi: chỉ các khung giờ có ít nhất một ca của trung tâm',JSON.stringify(v.th.map(t=>t.replace(/ .*$/,'')))===JSON.stringify(w)&&v.th.length>=1&&v.add===0,{th:v.th,w});

 /* 3. giáo viên chưa có ca nào: không có dòng giờ nào, có thông báo, vẫn có nút thêm */
 await ev(()=>{const base=DB.staff.find(s=>isTeacher(s)&&s.st==='dang'&&!isGrStaff(s.id));DB.staff.push(Object.assign(JSON.parse(JSON.stringify(base)),{id:'nvz41',n:'Cô Mới Chưa Có Ca',em:'z41@x.vn'}))});
 v=await view('gv','nvz41');
 ok('giáo viên chưa có ca: không vẽ dòng giờ nào, hiện thông báo chưa có buổi 1-1',v.th.length===0&&/chưa có buổi 1-1/.test(v.empty),v);
 ok('giáo viên chưa có ca: vẫn có nút "+ Thêm buổi 1-1" để bắt đầu xếp ca',v.add===1&&/Bấm “\+ Thêm buổi 1-1”/.test(v.empty),v);

 /* 4. thêm ca ở giờ không thuộc mốc hệ thống bằng nút: hiện thêm đúng một dòng giờ mới */
 v=await view('gv',T);const before=v.th.length;
 await page.click('#main [data-a="lsadd"][data-v="1|"]');await page.waitForSelector('#lsf');
 const m=await ev(()=>({slot:document.querySelector('#ls-s').value,day:document.querySelector('#ls-d').value,kid:document.querySelector('#ls-k').value,kids:document.querySelectorAll('#ls-k option').length}));
 ok('nút thêm mở hộp thoại với ô giờ để trống (người dùng tự nhập giờ thật), mặc định thứ Hai',m.slot===''&&m.day==='1'&&m.kids>=1,m);
 const free=await ev(([T,kid])=>{for(let h=7;h<=19;h++)for(const mm of [0,5,10,15,20,25,30,35,40,45,50,55]){const t=String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0');
   if(slotValid(t)&&!SLOTS.includes(t)&&!conflict({day:1,slot:t,gv:T,hs:kid }))return t}return''},[T,m.kid]);
 ok('tìm được giờ riêng còn trống để thử',/^\d\d:\d\d$/.test(free),free);
 await page.fill('#ls-s',free);await page.click('#lsf button[type=submit]');await W(150);
 const added=await ev(([T,t])=>DB.lich.some(l=>l.gv===T&&l.day===1&&l.slot===t&&l.type==='11'),[T,free]);
 v=await view('gv',T);
 ok('thêm ca bằng nút: lưu đúng giáo viên, thứ Hai, giờ đã nhập',added);
 ok('lưới tự thêm đúng một dòng giờ mới, các dòng cũ giữ nguyên',v.th.length===before+1&&v.th.some(t=>t.startsWith(free)),{before,th:v.th});

 /* 5. nút + của ô trống: chỉ hiện khi rê chuột (màn hình có chuột) */
 const hov=await ev(()=>matchMedia('(hover:hover)').matches);
 if(hov){await page.mouse.move(2,2);await W(60);
  const o=await ev(()=>{const a=[...document.querySelectorAll('#main .cell .ls.add')];return{n:a.length,op:a.length?getComputedStyle(a[0]).opacity:null}});
  ok('ô trống: nút + ẩn khi không rê chuột (đỡ rối mắt)',o.n>=1&&o.op==='0',o);
  const box=await page.locator('#main .cell:has(.ls.add)').first().boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await W(80);
  const o2=await ev(()=>{const a=document.querySelector('#main .cell:hover .ls.add');return a?getComputedStyle(a).opacity:null});
  ok('rê chuột vào ô trống: nút + hiện rõ và bấm được',o2==='1',o2);
  await page.mouse.move(2,2)}
 else ok('(thiết bị không có chuột: bỏ qua phép thử rê chuột)',true);

 /* 6. điện thoại 390px */
 await page.setViewportSize({width:390,height:844});await W(200);
 const mb=await ev(()=>{const b=document.querySelector('#main [data-a="lsadd"][data-v="1|"]'),r=b&&b.getBoundingClientRect();return{doc:document.documentElement.scrollWidth-innerWidth,btn:!!r&&r.width>0&&r.right<=innerWidth+1&&r.left>=0}});
 ok('390px: trang không tràn ngang, nút "+ Thêm buổi 1-1" nằm gọn trong màn hình',mb.doc<=1&&mb.btn,mb);
 await page.setViewportSize({width:1366,height:900});

 /* 7. giáo viên: lịch của mình chỉ các khung giờ mình dạy, không có nút thêm */
 await page.evaluate(()=>{localStorage.removeItem('gb_v2')});
 const o2=await open();const pg=o2.page;await login(pg,'gv');
 await pg.evaluate(()=>{go('lh');render();S.lh.wk=monOf(WD);render()});await pg.waitForTimeout(150);
 const g=await pg.evaluate(()=>{const me=U.id,days=[0,1,2,3,4,5].map(i=>addD(monOf(WD),i)),ds=new Set(days);
  return{th:[...document.querySelectorAll('#main table.wkt tbody th')].map(t=>t.innerText.replace(/\s+/g,' ').trim().replace(/ .*$/,'')),
   want:[...new Set(DB.lich.filter(l=>l.gv===me&&l.slot&&(l.type==='11'||ds.has(l.date))).map(l=>slotLb(l.slot)))].sort(),add:document.querySelectorAll('#main [data-a="lsadd"]').length,empty:(document.querySelector('#main td.empty')||{}).textContent||''}});
 ok('giáo viên: lịch dạy của tôi chỉ hiện các khung giờ mình dạy, không có nút thêm',JSON.stringify(g.th)===JSON.stringify(g.want)&&g.add===0&&(g.th.length>0||/Bạn chưa có buổi 1-1/.test(g.empty)),g);
 await o2.b.close();

 ok('không có lỗi JS',errs.length===0&&o2.errs.length===0,errs.concat(o2.errs));
 await b.close();
 console.log(passes+' PASS, '+fails+' FAIL');process.exit(fails?1:0)})();
