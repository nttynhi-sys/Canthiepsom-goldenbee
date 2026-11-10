/* Z7: chấm công do Quản lý thực hiện. Giáo viên không tự chấm công; Quản lý (và Trưởng Trung tâm) chấm công cho nhân sự làm giờ cố định
   (07:15 đến 18:00). Nhân sự chỉ trả lương theo ca 1-1 (s.cc===false) không cần chấm công. Chế độ ?demo (dữ liệu mẫu bản 7). */
const {open}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
const sw=async(page,r)=>{await page.selectOption('#demo-role',r);await page.waitForSelector('.nav');await page.waitForTimeout(60)};
const asId=async(page,id)=>{await page.evaluate(i=>{const s=stBy(i);setUser(findAccount(s.em));render()},id);await page.waitForSelector('.nav');await page.waitForTimeout(60)};
const nav=async(page,v)=>{await page.click(`.nav button[data-v="${v}"]`);await page.waitForTimeout(60)};
const main=page=>page.evaluate(()=>document.querySelector('#main').innerText);
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const {b,page,errs}=await open();
 await page.click('.roles [data-v="ql"]');await page.waitForSelector('.nav');
 /* ---------- A. mô hình dữ liệu ---------- */
 const A=await page.evaluate(()=>{const per=DB.staff.filter(s=>s.pay.mode==='buoi'&&!s.pay.rateBt),fix=DB.staff.filter(s=>s.pay.mode!=='buoi'||s.pay.rateBt>0);
  const pm=sm(CM,-1),p4=payroll(stBy('nv04'),pm),p18=payroll(stBy('nv18'),pm),wd=mDates(pm).filter(d=>isW(d)&&d<WD&&!isClosed(d))[2];
  return{v:DB.v,per:per.length,perAllFalse:per.every(s=>s.cc===false),fixAllTrue:fix.every(s=>s.cc===true),n04:needCC(stBy('nv04')),n18:needCC(stBy('nv18')),n26:needCC(stBy('nv26')),
   t04:tsSt('nv04',WD),t04p:tsSt('nv04',wd),hasTs04:Object.keys(DB.ts).some(k=>k.startsWith('nv04|')),hasTs18:Object.keys(DB.ts).some(k=>k.startsWith('nv18|')),
   c04:[p4.cong,p4.late,p4.abs,p4.leave],teach04:p4.teach,c18:p18.cong,cfg:[DB.cfg.ccIn,DB.cfg.ccOut,DB.cfg.v1,DB.cfg.v2],vio:Array.isArray(DB.vio),vam:!!DB.vam}});
 ok('dữ liệu mẫu bản 7 có vio, vam, giờ chấm công mặc định và mức trừ lương',A.v===7&&A.vio&&A.vam&&A.cfg.join()==='07:15,18:00,20000,30000',A);
 ok('nhân sự trả theo ca 1-1 (không phụ cấp bán trú) có cc=false, nhân sự giờ cố định có cc=true',A.per>=10&&A.perAllFalse&&A.fixAllTrue,A);
 ok('needCC: giáo viên 1-1 không cần chấm công; giáo viên bán trú và văn phòng cần',A.n04===false&&A.n18===true&&A.n26===true,A);
 ok('giáo viên trả theo ca: không có trạng thái chưa chấm hoặc vắng, không có dữ liệu chấm công mẫu',A.t04===''&&A.t04p===''&&!A.hasTs04&&A.hasTs18,A);
 ok('giáo viên trả theo ca: lương không dùng công (công, muộn, vắng bằng 0), ca dạy vẫn được tính',A.c04.slice(0,3).join()==='0,0,0'&&A.teach04>0&&A.c18>0,A);

 /* ---------- B. giáo viên không tự chấm công ---------- */
 await sw(page,'gv');
 let t=await main(page);
 ok('GV 1-1: Dashboard nói không cần chấm công, không có nút chấm công vào/ra',/không cần chấm công/.test(t)&&!(await page.$('[data-a="ci"]')),t.slice(0,400));
 await nav(page,'cc');t=await main(page);
 ok('GV 1-1: mục Chấm công của tôi giải thích tiền công tính theo ca, không có nút chấm công',/không cần chấm công/.test(t)&&!(await page.$('[data-a="ci"]')),t.slice(0,400));
 await asId(page,'nv18');await nav(page,'cc');t=await main(page);
 ok('GV bán trú (lương cố định): thấy công do Quản lý chấm, không có nút tự chấm',/Quản lý (đã|chưa) chấm công/.test(t)&&!(await page.$('[data-a="ci"]'))&&/Công \d+\/26/.test(t),t.slice(0,500));
 const before=await page.evaluate(()=>JSON.stringify(DB.ts));
 await page.evaluate(()=>{ACT.ci();render()});await W(60);
 ok('GV bấm chấm công bằng mã cũng không ghi được',(await page.evaluate(()=>JSON.stringify(DB.ts)))===before);
 await nav(page,'dash');ok('GV bán trú: Dashboard không có nút chấm công, ghi rõ Quản lý chấm công',!(await page.$('[data-a="ci"]'))&&/Quản lý (đã|chưa) chấm công/.test(await main(page)),(await main(page)).slice(0,300));

 /* ---------- C. Quản lý chấm công ---------- */
 await sw(page,'ql');
 const D=await page.evaluate(()=>{let d=addD(WD,-1);while(!isW(d)||isClosed(d))d=addD(d,-1);
  DB.staff.forEach(s=>{if(needCC(s)){delete DB.ts[s.id+'|'+d]}});DB.lr=DB.lr.filter(l=>!(l.f<=d&&d<=l.t));S.cc={tab:'hn',m:CM,d};render();return d});
 await nav(page,'cc');t=await main(page);
 ok('Quản lý: có bảng Chấm công theo ngày với chọn ngày, nút Có mặt và nút chấm có mặt cho tất cả',!!(await page.$('#cc-d'))&&(await page.$$('[data-a="ccon"]')).length>=8&&!!(await page.$('[data-a="ccall"]'))&&/Nhân sự/.test(t),t.slice(0,300));
 const names=await page.$$eval('#main table tbody tr td:first-child',e=>e.map(x=>x.innerText.trim()));
 const nm04=await page.evaluate(()=>stBy('nv04').n),nm18=await page.evaluate(()=>stBy('nv18').n);
 ok('bảng chấm công liệt kê giáo viên bán trú, không liệt kê giáo viên trả theo ca',names.includes(nm18)&&!names.includes(nm04),names.slice(0,6));
 ok('ghi chú danh sách nhân sự không cần chấm công (trả theo ca 1-1)',new RegExp('Không cần chấm công \\(trả lương theo ca 1-1\\)[^.]*'+nm04.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(await main(page)));
 await page.click(`[data-a="ccon"][data-v="nv18|${D}"]`);await W(80);
 const r1=await page.evaluate(d=>({r:DB.ts['nv18|'+d],st:tsSt('nv18',d)}),D);
 ok('bấm Có mặt: ghi giờ vào 07:15, giờ ra 18:00, trạng thái đúng giờ',r1.r&&r1.r.i==='07:15'&&r1.r.o==='18:00'&&r1.st==='ok',r1);
 await page.evaluate(d=>{S.modal={t:'tse',id:'nv19',d};render()},D);await page.waitForSelector('#tsef');
 await page.fill('#ts-i','08:40');await page.fill('#ts-o','17:30');await page.click('#tsef button[type=submit]');await W(80);
 ok('Sửa giờ: vào 08:40 tính đi muộn (sau 08:15)',(await page.evaluate(d=>tsSt('nv19',d),D))==='late');
 const left=await page.evaluate(d=>DB.staff.filter(s=>s.st==='dang'&&needCC(s)&&['chua','abs'].includes(tsSt(s.id,d))).length,D);
 await page.click('[data-a="ccall"]');await W(100);
 const C=await page.evaluate(d=>({left:DB.staff.filter(s=>s.st==='dang'&&needCC(s)&&['chua','abs'].includes(tsSt(s.id,d))).length,per:Object.keys(DB.ts).filter(k=>k.endsWith('|'+d)&&!needCC(stBy(k.split('|')[0]))).length,late:tsSt('nv19',d),n18:DB.ts['nv18|'+d].i}),D);
 ok('Chấm có mặt cho tất cả: không còn ai chưa chấm, giữ nguyên giờ đã sửa và giờ đã chấm',left>0&&C.left===0&&C.late==='late'&&C.n18==='07:15',[left,C]);
 ok('không tạo công cho nhân sự trả theo ca',C.per===0,C);
 const nl=await page.evaluate(d=>{const lv=DB.staff.find(s=>needCC(s)&&s.st==='dang'&&s.role!=='ql'&&s.id!=='nv19'&&s.id!=='nv18');DB.lr.push({id:'lrz',st:lv.id,type:'phep',f:d,t:d,why:'Thử',s:'duyet'});delete DB.ts[lv.id+'|'+d];render();return lv.id},D);
 await page.evaluate(([i,d])=>{ACT.ccon(i+'|'+d);render()},[nl,D]);
 ok('nhân sự đang nghỉ phép đã duyệt không bị chấm có mặt',(await page.evaluate(([i,d])=>[tsSt(i,d),!!DB.ts[i+'|'+d]],[nl,D])).join()==='leave,false');
 await page.evaluate(()=>{DB.lr=DB.lr.filter(l=>l.id!=='lrz')});

 /* ---------- D. Bảng công tháng, Excel chỉ nhân sự cần chấm công ---------- */
 await page.evaluate(()=>{S.cc.tab='bang';render()});await W(60);
 const rows=await page.$$eval('.sheet tbody tr td.s1',e=>e.map(x=>x.innerText.trim()));
 ok('bảng công tháng chỉ có nhân sự cần chấm công và ghi chú người trả theo ca',rows.length>=10&&!rows.some(r=>nm04.endsWith(r))&&/Không cần chấm công/.test(await main(page)),rows.length);

 /* ---------- E. Văn phòng chỉ xem; Trưởng Trung tâm chấm được ---------- */
 await page.evaluate(()=>{S.cc={tab:'hn',m:CM};render()});
 await sw(page,'vp');await nav(page,'cc');
 ok('Văn phòng xem được bảng chấm công, không có nút chấm hộ',!!(await page.$('#main table'))&&!(await page.$('[data-a="ccon"]'))&&!(await page.$('[data-a="ccall"]'))&&/Chỉ xem/.test(await main(page)));
 await sw(page,'tt');await nav(page,'cc');
 ok('Trưởng Trung tâm có nút Có mặt khi còn người chưa chấm hoặc nút Sửa giờ',(await page.$$('[data-a="ccon"],[data-a="tsedit"]')).length>0);

 /* ---------- F. Hồ sơ nhân sự: hình thức trả lương quyết định có cần chấm công ---------- */
 await nav(page,'ns');await page.evaluate(()=>{ACT.nvopen('nv04');render()});await page.waitForSelector('#nvf');
 ok('Hồ sơ có lời giải thích: lương cố định thì Quản lý chấm công, theo ca 1-1 thì không',/Quản lý chấm công/.test(await page.textContent('#nvf'))&&/không cần chấm công/.test(await page.textContent('#nvf')));
 await page.selectOption('#nv-mode','thang');await page.fill('#nvf [name=base]','8000000');await page.click('#nvf button[type=submit]');await W(80);
 ok('đổi sang lương cố định: nhân sự cần chấm công (cc=true)',(await page.evaluate(()=>stBy('nv04').cc))===true&&(await page.evaluate(()=>needCC(stBy('nv04')))));
 await page.evaluate(()=>{ACT.nvopen('nv04');render()});await page.waitForSelector('#nvf');
 await page.selectOption('#nv-mode','buoi');await page.fill('#nvf [name=rateBt]','0');await page.click('#nvf button[type=submit]');await W(80);
 ok('đổi về trả theo ca: không cần chấm công (cc=false)',(await page.evaluate(()=>stBy('nv04').cc))===false);
 await page.evaluate(()=>{ACT.nvopen('nv04');render()});await page.waitForSelector('#nvf');
 await page.selectOption('#nv-mode','buoi');await page.fill('#nvf [name=rateBt]','50000');await page.click('#nvf button[type=submit]');await W(80);
 ok('trả theo ca nhưng có phụ cấp bán trú theo ngày: vẫn cần chấm công',(await page.evaluate(()=>stBy('nv04').cc))===true);
 await page.evaluate(()=>{ACT.nvopen('nv04');render()});await page.waitForSelector('#nvf');
 await page.selectOption('#nv-mode','buoi');await page.fill('#nvf [name=rateBt]','0');await page.click('#nvf button[type=submit]');await W(80);

 /* ---------- G. Cài đặt giờ mặc định ---------- */
 await page.evaluate(()=>{S.ns.tab='cd';render()});await W(60);
 ok('Cài đặt có giờ vào, giờ ra mặc định và mức trừ lương vi phạm',!!(await page.$('#ccIn'))&&!!(await page.$('#ccOut'))&&!!(await page.$('#v1'))&&!!(await page.$('#v2')));
 await page.fill('#ccIn','07:30');await page.fill('#ccOut','17:45');await page.click('#cfgf button[type=submit]');await W(80);
 ok('lưu giờ mặc định mới',(await page.evaluate(()=>DB.cfg.ccIn+'-'+DB.cfg.ccOut))==='07:30-17:45');
 await page.evaluate(()=>{const d=S.cc&&S.cc.d||addD(WD,-1);let x=d;while(!isW(x)||isClosed(x)||x>=WD)x=addD(x,-1);delete DB.ts['nv20|'+x];DB.lr=DB.lr.filter(l=>!(l.st==='nv20'&&l.f<=x&&x<=l.t));window.__x=x;ACT.ccon('nv20|'+x);render()});
 const g=await page.evaluate(()=>DB.ts['nv20|'+window.__x]);
 ok('nút Có mặt dùng giờ mặc định mới',g&&g.i==='07:30'&&g.o==='17:45',g);
 await page.fill('#ccOut','07:00');await page.click('#cfgf button[type=submit]');await W(80);
 ok('giờ ra không sau giờ vào thì đặt lại 07:15 đến 18:00',(await page.evaluate(()=>DB.cfg.ccIn+'-'+DB.cfg.ccOut))==='07:15-18:00');

 /* ---------- H. Nâng cấp dữ liệu bản 6 ---------- */
 const H=await page.evaluate(()=>{const d=JSON.parse(JSON.stringify(DB));d.v=6;delete d.vio;delete d.vam;d.staff.forEach(s=>{delete s.cc});delete d.cfg.ccIn;delete d.cfg.ccOut;delete d.cfg.v1;delete d.cfg.v2;
  const keep=DB;migrate7(d);const r={v:d.v,vio:Array.isArray(d.vio),vam:Object.keys(d.vam).length,per:d.staff.filter(s=>s.cc===false).length,fix:d.staff.filter(s=>s.cc===true).length,cfg:[d.cfg.ccIn,d.cfg.ccOut,d.cfg.v1,d.cfg.v2].join()};DB=keep;return r});
 ok('nâng cấp bản 6 lên 7: thêm vio, vam, cờ cc theo hình thức trả lương, giờ mặc định',H.v===7&&H.vio&&H.vam===0&&H.per>=10&&H.fix>=8&&H.cfg==='07:15,18:00,20000,30000',H);

 ok('không có lỗi script',errs.length===0,errs);
 console.log(`\n${passes} pass, ${fails} fail`);await b.close();process.exit(fails?1:0)})();
