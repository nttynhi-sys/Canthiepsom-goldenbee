/* Học phí: cột "Trừ phí dư tháng trước" tự điền theo điểm danh, sửa được bằng cách gõ số tiền (kể cả 0 và tháng chưa có điểm danh), về tự động, tự động ghi phí dư khi tạo hóa đơn */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
(async()=>{const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||200);
 /* bé có ca 1-1 riêng trong tháng trước (để có phí dư tự tính khi nghỉ có phép) và học phí tháng này */
 const P=await ev(()=>{const m=CM,pm=sm(CM,-1);
  for(const k of DB.kids.filter(x=>x.st==='dang')){const xs=schedF(k,pm).filter(x=>x.kind==='11'&&!x.inc);if(!xs.length||!(feeBreak(k,m).gross>0))continue;
   if(DB.lg.some(e=>e.hs===k.id&&e.kind==='hoan'&&e.m===m)||DB.set[k.id+'|'+pm])continue;
   const x=xs[0];DB.att[x.d+'|'+x.sid+'|'+k.id]='p';   /* nghỉ có phép: hoàn 70% ca 1-1 */
   const auto=settle(k,pm).refund;if(!(auto>0))continue;
   return{id:k.id,n:k.n,m,pm,auto,bal0:balance(k.id)}}return null});
 ok('có bé có phí dư tự tính (nghỉ có phép tháng trước) và học phí tháng này',!!P,P);
 const go_=async(gm)=>{await ev(g=>{S.hp={tab:'hd',m:CM,st:'',q:'',gq:'',gm:g};S.pg.hpg=1;go('hp');render()},gm)};
 await go_(P.m);await page.waitForSelector('#main input[data-c="surv"]');
 const sel='#main input[data-c="surv"][data-v="'+P.id+'|'+P.m+'"]';
 /* 1. tự điền theo điểm danh */
 if(!(await page.$(sel))){await ev(p=>{S.hp.gq=kcode(kidBy(p.id));render()},P)}
 await page.waitForSelector(sel);
 const v0=await page.inputValue(sel);
 ok('ô trừ phí dư tự điền số tính từ điểm danh tháng trước, ghi chú "Tạm tính"',v0.replace(/\D/g,'')===String(P.auto)&&/Tạm tính/.test(await page.textContent('#main tr:has(input[data-v="'+P.id+'|'+P.m+'"])')),[v0,P.auto]);
 ok('chưa ghi gì vào công nợ khi mới xem số tạm tính',await ev(p=>!DB.lg.some(e=>e.hs===p.id&&e.kind==='hoan'&&e.m===p.m)&&!DB.set[p.id+'|'+p.pm],P));
 /* 2. nhập tay số tiền (tháng 10 chưa có điểm danh: số nhập tay vẫn dùng được) */
 await page.fill(sel,'1.500.000');await page.dispatchEvent(sel,'change');await W(300);
 const A=await ev(p=>{const f=feeBreak(kidBy(p.id),p.m),e=DB.lg.filter(x=>x.hs===p.id&&x.kind==='hoan'&&x.m===p.m),s=DB.set[p.id+'|'+p.pm];return{sur:f.sur,posted:f.posted,due:f.due,gross:f.gross,n:e.length,amt:e[0]&&e[0].amt,man:s&&s.man,sa:s&&s.amt,bal:balance(p.id)}},P);
 ok('gõ 1.500.000: phí dư trừ = 1.500.000, ghi vào công nợ đúng một khoản, đánh dấu nhập tay',A.sur===1500000&&A.posted&&A.n===1&&A.amt===1500000&&A.man===1&&A.sa===1500000,A);
 ok('phải đóng = học phí tháng trừ số nhập tay (không âm); công nợ giảm đúng số đã nhập',A.due===Math.max(0,A.gross-1500000)&&A.bal===P.bal0-1500000,[A,P.bal0]);
 await page.waitForSelector(sel);
 ok('ô hiện số đã nhập, nhãn "Nhập tay" và nút "Về tự động"',(await page.inputValue(sel)).replace(/\D/g,'')==='1500000'&&/Nhập tay/.test(await page.textContent('#main tr:has(input[data-v="'+P.id+'|'+P.m+'"])'))&&!!(await page.$('[data-a="surauto"][data-v="'+P.id+'|'+P.m+'"]')));
 /* 3. sửa lại: thay khoản cũ, không cộng dồn */
 await page.fill(sel,'200000');await page.dispatchEvent(sel,'change');await W(300);
 const B=await ev(p=>({n:DB.lg.filter(x=>x.hs===p.id&&x.kind==='hoan'&&x.m===p.m).length,amt:(DB.lg.find(x=>x.hs===p.id&&x.kind==='hoan'&&x.m===p.m)||{}).amt,bal:balance(p.id)}),P);
 ok('sửa số: thay khoản cũ (vẫn một khoản), công nợ theo số mới',B.n===1&&B.amt===200000&&B.bal===P.bal0-200000,[B,P.bal0]);
 /* 4. nhập 0: không trừ gì dù số tự tính > 0 */
 await page.fill(sel,'0');await page.dispatchEvent(sel,'change');await W(300);
 const Z=await ev(p=>({sur:feeBreak(kidBy(p.id),p.m).sur,n:DB.lg.filter(x=>x.hs===p.id&&x.kind==='hoan'&&x.m===p.m).length,s:DB.set[p.id+'|'+p.pm],bal:balance(p.id),auto:settle(kidBy(p.id),p.pm).refund}),P);
 ok('nhập 0: không trừ phí dư (kể cả khi tự tính > 0), không có khoản hoàn trong sổ, vẫn là số nhập tay',Z.sur===0&&Z.n===0&&Z.s&&Z.s.man===1&&Z.s.amt===0&&Z.bal===P.bal0&&Z.auto===P.auto,Z);
 /* 5. ghi khoản hoàn từ điểm danh không đè số nhập tay */
 await page.fill(sel,'50000');await page.dispatchEvent(sel,'change');await W(300);
 await ev(p=>{postSettle(kidBy(p.id),p.pm)},P);
 ok('postSettle (Ghi khoản hoàn ở Điểm danh) giữ nguyên số nhập tay',await ev(p=>{const e=DB.lg.filter(x=>x.hs===p.id&&x.kind==='hoan'&&x.m===p.m);return e.length===1&&e[0].amt===50000&&DB.set[p.id+'|'+p.pm].man===1},P));
 /* 6. về tự động: xóa trống ô */
 await page.fill(sel,'');await page.dispatchEvent(sel,'change');await W(300);
 const T=await ev(p=>{const f=feeBreak(kidBy(p.id),p.m);return{sur:f.sur,posted:f.posted,n:DB.lg.filter(x=>x.hs===p.id&&x.kind==='hoan'&&x.m===p.m).length,s:DB.set[p.id+'|'+p.pm],bal:balance(p.id)}},P);
 ok('xóa trống ô: về tự động (số tính từ điểm danh, chưa ghi, bỏ khoản nhập tay)',T.sur===P.auto&&!T.posted&&T.n===0&&!T.s&&T.bal===P.bal0,[T,P]);
 /* nút Về tự động */
 await page.fill(sel,'70000');await page.dispatchEvent(sel,'change');await W(300);
 await page.click('[data-a="surauto"][data-v="'+P.id+'|'+P.m+'"]');await W(300);
 ok('nút "Về tự động": bỏ số nhập tay',await ev(p=>!DB.set[p.id+'|'+p.pm]&&feeBreak(kidBy(p.id),p.m).sur===settle(kidBy(p.id),p.pm).refund,P));
 /* 7. nhập chữ không hợp lệ: bỏ qua */
 await page.fill(sel,'abc');await page.dispatchEvent(sel,'change');await W(250);
 ok('nhập chữ (không có số): bỏ qua, không đổi gì',await ev(p=>!DB.set[p.id+'|'+p.pm],P));
 /* 8. bảng Công nợ học sinh cũng sửa được */
 await ev(p=>{S.hp={tab:'tq',m:p.m,st:'',q:kidBy(p.id).n};S.pg.hp=1;go('hp');render()},P);await page.waitForSelector('#main input[data-c="surv"]');
 const sel2='#main input[data-c="surv"][data-v="'+P.id+'|'+P.m+'"]';
 ok('Công nợ học sinh: cột Trừ phí dư tháng trước cũng là ô sửa được, tự điền số tự tính',!!(await page.$(sel2))&&(await page.inputValue(sel2)).replace(/\D/g,'')===String(P.auto));
 await page.fill(sel2,'123000');await page.dispatchEvent(sel2,'change');await W(300);
 ok('sửa ở Công nợ học sinh: cùng một cơ chế (nhập tay, ghi sổ)',await ev(p=>{const s=DB.set[p.id+'|'+p.pm];return s&&s.man===1&&s.amt===123000&&balance(p.id)===p.bal0-123000},P));
 await ev(p=>surManual(kidBy(p.id),p.m,null),P);
 /* 9. tạo hóa đơn: tự động ghi phí dư tháng trước, có thể tắt */
 const G=await ev(()=>{const gm=sm(CM,1),pm=CM;const ks=DB.kids.filter(k=>k.st==='dang'&&!DB.lg.some(e=>e.hs===k.id&&e.kind==='hp'&&e.m===gm)&&invoice(k,gm)>0);
  const auto=ks.filter(k=>!DB.set[k.id+'|'+pm]&&settle(k,pm).refund>0);return{gm,pm,n:ks.length,auto:auto.map(k=>k.id)}});
 ok('có bé chưa có hóa đơn tháng sau và có phí dư tháng này để thử tự động ghi',G.n>0&&G.auto.length>0,G);
 await ev(g=>{S.hp={tab:'hd',m:CM,st:'',q:'',gq:'',gm:g.gm,auto:0};go('hp');render()},G);await page.waitForSelector('[data-c="hpauto"]');
 ok('ô "Tự động ghi phí dư khi tạo hóa đơn": mặc định tích (khi chưa chỉnh)',await ev(g=>{S.hp.auto=undefined;render();return document.querySelector('[data-c="hpauto"]').checked},G));
 await page.uncheck('[data-c="hpauto"]');await W(200);
 ok('bỏ tích: lưu lựa chọn',await ev(()=>S.hp.auto===0));
 await page.click('[data-a="hpgen"]');await W(300);
 ok('tạo hóa đơn khi TẮT tự động: không ghi phí dư vào công nợ',await ev(g=>g.auto.every(id=>!DB.set[id+'|'+g.pm]&&!DB.lg.some(e=>e.hs===id&&e.kind==='hoan'&&e.m===g.gm)),G));
 await ev(g=>{DB.lg=DB.lg.filter(e=>!(e.kind==='hp'&&e.m===g.gm));S.hp.auto=1;S.hp.gm=g.gm;render()},G);await page.waitForSelector('[data-c="hpauto"]');
 ok('bật lại: ô tích sáng',await page.isChecked('[data-c="hpauto"]'));
 await page.click('[data-a="hpgen"]');await W(300);
 ok('tạo hóa đơn khi BẬT tự động: ghi phí dư tháng trước (tạm tính) vào công nợ cho các bé có phí dư',await ev(g=>g.auto.every(id=>!!DB.set[id+'|'+g.pm]&&DB.lg.some(e=>e.hs===id&&e.kind==='hoan'&&e.m===g.gm)),G));
 /* nút Ghi phí dư tạm tính */
 await ev(g=>{DB.lg=DB.lg.filter(e=>!(e.kind==='hoan'&&e.m===g.gm));g.auto.forEach(id=>delete DB.set[id+'|'+g.pm]);S.hp={tab:'hd',m:CM,st:'',q:'',gq:'',gm:g.gm};go('hp');render()},G);await page.waitForSelector('[data-a="surpost"]');
 ok('nút "Ghi phí dư tạm tính" hiện số bé cần ghi',/Ghi phí dư tạm tính \(\d+ bé\)/.test(await page.textContent('[data-a="surpost"]')));
 await page.click('[data-a="surpost"]');await W(300);
 ok('bấm: ghi phí dư tạm tính cho các bé chưa ghi',await ev(g=>g.auto.every(id=>!!DB.set[id+'|'+g.pm]),G));
 /* 10. tìm kiếm và phân trang ở bảng tạo hóa đơn */
 const PG=await ev(()=>{S.hp={tab:'hd',m:CM,st:'',q:'',gq:'',gm:sm(CM,1)};S.pg.hpg=1;go('hp');render();return{rows:document.querySelectorAll('#main tbody tr').length,pager:!!document.querySelector('#main .pager,#main [data-a="pg"]')}});
 ok('bảng tạo hóa đơn: phân trang (không còn cắt ở 12 bé)',PG.rows>0&&PG.rows<=15,PG);
 await page.fill('#hgq','zzzkhongco');await page.dispatchEvent('#hgq','input');await W(250);
 ok('ô tìm theo tên hoặc mã bé lọc bảng',await ev(()=>document.querySelectorAll('#main tbody tr td input[data-c="surv"]').length===0));
 /* 11. phụ huynh thấy học phí dự kiến theo số trừ đã đặt */
 const H=await ev(p=>{const k=kidBy(p.id);surManual(k,p.m,300000);const f=feeBreak(k,p.m);const r={sur:f.sur,posted:f.posted};surManual(k,p.m,null);return r},P);
 ok('feeBreak (dùng cho thẻ học phí của phụ huynh) lấy số nhập tay, tính là đã ghi',H.sur===300000&&H.posted,H);
 /* 12. quyền: Văn phòng sửa được, Quản lý không có mục Học phí */
 const R=await ev(p=>{const o={};for(const role of ['vp','ql']){setUser(findAccount(DB.staff.find(s=>s.role===role&&s.st==='dang').em));o[role]={money:canMoney(),nav:navList().includes('hp')}}
  setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));return o},P);
 ok('Văn phòng sửa được phí dư (như dữ liệu tiền); Quản lý không có mục Học phí',R.vp.money&&R.vp.nav&&!R.ql.money&&!R.ql.nav,R);
 ok('không lỗi trình duyệt',errs.length===0,errs);
 await b.close();console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
