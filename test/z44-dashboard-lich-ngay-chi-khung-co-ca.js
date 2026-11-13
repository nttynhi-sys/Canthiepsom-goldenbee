/* Z44: thẻ "Lịch ngày … theo ca" ở Dashboard chỉ liệt kê các khung giờ đang có ca 1-1 trong ngày (không vẽ sẵn mốc giờ của hệ thống);
   ngày chưa có ca nào thì hiện thông báo; ca ở giờ riêng được hiện; buổi bán trú không tính vào thẻ */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 const card=()=>ev(()=>{const c=[...document.querySelectorAll('#main .card')].find(c=>c.querySelector('h2')&&/theo ca/.test(c.querySelector('h2').textContent));
  if(!c)return null;return{h2:c.querySelector('h2').textContent.trim(),rows:[...c.querySelectorAll('.rw')].map(r=>({lb:r.querySelector('span').textContent.trim(),n:r.querySelector('b').textContent.trim()})),txt:c.innerText}});
 const show=async()=>{await ev(()=>{go('dash');render()});await W(150);return card()};
 /* khung giờ có ca 1-1 trong ngày, tính trực tiếp từ dữ liệu buổi của ngày đang xem */
 const want=()=>ev(()=>{const ds=dayList(WD).filter(x=>x.kind!=='bt'&&x.slot),sl=[...new Set(ds.map(x=>x.slot))].sort();return sl.map(s=>({lb:slotLb(s),n:ds.filter(x=>x.slot===s).length+' ca'}))});
 await login(page,'tt');
 let c=await show(),w=await want();
 ok('Dashboard có thẻ Lịch ngày theo ca',!!c&&/Lịch ngày/.test(c.h2),c);
 ok('ngày đang xem có ca 1-1 để thử',w.length>=1,w);
 ok('thẻ chỉ liệt kê đúng các khung giờ có ca 1-1 trong ngày, kèm số ca đang diễn ra',JSON.stringify(c.rows)===JSON.stringify(w),{c:c.rows,w});
 const sys=await ev(()=>SLOTS.map(s=>slotLb(s)));
 ok('không còn dòng giờ nào của hệ thống nếu ngày đó không có ca ở giờ ấy',sys.some(s=>!w.some(x=>x.lb===s))&&c.rows.every(r=>!/^0 /.test(r.n)),{sys,rows:c.rows});
 ok('mọi dòng đều có ít nhất một ca',c.rows.length>=1&&c.rows.every(r=>/^\d+ ca$/.test(r.n)&&+r.n.split(' ')[0]>=1),c.rows);
 ok('có ghi chú nói rõ chỉ liệt kê khung giờ có giáo viên dạy 1-1',/Chỉ liệt kê các khung giờ có giáo viên dạy 1-1/.test(c.txt)&&!/phòng/i.test(c.txt),c.txt);

 /* thêm ca ở giờ riêng, ngoài mốc hệ thống: hiện thêm đúng một dòng ở đúng chỗ */
 const free=await ev(()=>{const day=dow(WD),base=DB.lich.find(l=>l.type==='11'&&l.day===day&&l.slot);if(!base)return'';
  for(const t of ['18:20','18:25','19:05','17:35','12:20']){if(!SLOTS.includes(t)&&!dayList(WD).some(x=>x.slot===t)){DB.lich.push(Object.assign(JSON.parse(JSON.stringify(base)),{id:'lz44',slot:t}));return t}}return''});
 ok('thêm được một ca ở giờ riêng trong ngày đang xem',/^\d\d:\d\d$/.test(free),free);
 const before=w.length;c=await show();w=await want();
 ok('giờ riêng hiện thành một dòng mới, các dòng cũ giữ nguyên',c.rows.length===before+1&&c.rows.filter(r=>r.lb.startsWith(free)).length===1&&JSON.stringify(c.rows)===JSON.stringify(w),{free,rows:c.rows,w});

 /* ngày chưa có ca 1-1 nào: không vẽ dòng nào, hiện thông báo */
 await ev(()=>{const day=dow(WD);DB.lich=DB.lich.filter(l=>!(l.type==='11'&&l.day===day)&&!(l.type==='11'&&l.date===WD))});
 c=await show();w=await want();
 ok('ngày không còn ca 1-1: thẻ không có dòng giờ nào',w.length===0&&c.rows.length===0,{rows:c.rows,w});
 ok('ngày không còn ca 1-1: hiện thông báo thay cho các mốc hệ thống',/Ngày này chưa có ca 1-1 nào/.test(c.txt)&&!/Chỉ liệt kê các khung giờ/.test(c.txt)&&!sys.some(s=>c.txt.includes(s)),c.txt);

 ok('không có lỗi script',errs.length===0,errs);
 console.log(`\n${passes} PASS, ${fails} FAIL`);await b.close();process.exit(fails?1:0)})();
