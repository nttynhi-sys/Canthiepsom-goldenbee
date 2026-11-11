/* Z4: Thang chơi biểu tượng Westby và chuỗi phát triển chơi trong lĩnh vực Chơi của Ngân hàng mục tiêu */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 await login(page,'ql');

 const d=await ev(()=>{const we=LIBI.filter(i=>i.s==='we'),cp=LIBI.filter(i=>i.s==='cp');
  return{we:we.length,cp:cp.length,weHeads:[...new Set(we.map(i=>i.hi))].length,cpHeads:[...new Set(cp.map(i=>i.hi))].length,
   dom:[...new Set(we.concat(cp).map(i=>i.d))],ids:new Set(LIBI.map(i=>i.id)).size===LIBI.length,
   keys:Object.keys(LSRC),first:we[0]&&we[0].id,
   noName:we.concat(cp).filter(i=>!i.n||!i.t||!i.k).length,
   lg:we.filter(i=>!i.lg).length,
   stage5:we.filter(i=>i.t.startsWith('Giai đoạn V ·')).map(i=>i.n)}});
 ok('Westby có 10 giai đoạn (10 tiêu đề)',d.weHeads===10,d);
 ok('Westby có 35 mục tiêu cụ thể theo tài liệu',d.we===35,d.we);
 ok('chuỗi chơi 0–4 tuổi có 6 tiêu đề và 34 mục',d.cpHeads===6&&d.cp===34,{h:d.cpHeads,n:d.cp});
 ok('tất cả nằm trong lĩnh vực gốc xh (Chơi và tương tác xã hội) và lọc được bằng nút "Chơi"',d.dom.length===1&&d.dom[0]==='xh',d.dom);
 ok('mã mục không trùng, mục nào cũng có tên, tiêu đề, khóa tìm',d.ids&&d.noName===0,d);
 ok('mọi mục Westby có ghi ngôn ngữ đi cùng giai đoạn',d.lg===0,d.lg);
 ok('danh sách bộ công cụ: Westby và Chuỗi chơi nằm trước mục Trung tâm tự thêm',JSON.stringify(d.keys)===JSON.stringify(['ab','ed','vb','mn','ot','we','cp','nl','sd','ad','cu']),d.keys);

 /* mốc tuổi: giai đoạn I (9–12 tháng) nằm ở nhóm dưới 12 tháng; giai đoạn X (5 tuổi) ở 48–72 tháng; mức 5 không tự suy ra tuổi */
 const ag=await ev(()=>{const g=(t)=>LIBI.filter(i=>i.s==='we'&&i.t.startsWith(t));
  return{I:g('Giai đoạn I ·')[0].m,X:g('Giai đoạn X ·')[0].m,VII:g('Giai đoạn VII ·')[0].m,
   lv5:LIBI.filter(i=>i.s==='cp'&&i.t.startsWith('Giả vờ theo thứ bậc')).map(i=>[i.m,i.a])}});
 ok('mốc tuổi: GĐ I → <12 tháng (0), GĐ VII → 36–48 (3), GĐ X → 48–72 (4)',ag.I===0&&ag.VII===3&&ag.X===4,ag);
 ok('mức 5 không có tuổi trong tài liệu gốc: m=-1 cho hai mục đầu, IIID 3–4 tuổi',ag.lv5[0][0]===-1&&ag.lv5[1][0]===-1&&ag.lv5[2][0]===3&&/chưa ghi mốc tuổi/.test(ag.lv5[0][1]),ag.lv5);

 /* mục tiếp theo đi tiếp sang giai đoạn sau */
 const nx=await ev(()=>{const a=LIBI.filter(i=>i.s==='we'),last1=a.find(i=>i.t.startsWith('Giai đoạn I ·')&&i.c==='GĐ I.3');return{n:nextOf(last1.id).c,end:nextOf(a[a.length-1].id)}});
 ok('mục tiếp theo của GĐ I.3 là GĐ II.1; mục cuối chuỗi không còn mục sau',nx.n==='GĐ II.1'&&nx.end===null,nx);

 /* giao diện: mở ngân hàng mục tiêu, lọc theo lĩnh vực Chơi + bộ Westby */
 await page.click('.nav button:has-text("Ngân hàng mục tiêu")');await W(120);
 await ev(()=>{S.hs.lib.dom='choi';S.hs.lib.src='we';S.hs.lib.head='';S.hs.lib.age='';S.hs.lib.q='';S.pg.lib=1;render()});await W(120);
 const ui=await ev(()=>({cnt:document.querySelector('.acts .sm b')&&document.querySelector('.acts .sm b').textContent,
  opts:[...document.querySelectorAll('#bk-s option')].map(o=>o.textContent),heads:[...document.querySelectorAll('#bk-h option')].map(o=>o.textContent).slice(0,4),
  sample:(document.querySelector('.gi .gi-n')||{}).textContent,src:(document.querySelector('.gi .sm.mu')||{}).textContent}));
 ok('lọc nút Chơi + Westby: hiện đúng 35 mục',ui.cnt==='35',ui);
 ok('hộp Bộ công cụ có "Westby" và "Chuỗi chơi 0–4 tuổi"',ui.opts.includes('Westby')&&ui.opts.includes('Chuỗi chơi 0–4 tuổi'),ui.opts);
 ok('hộp Tiêu đề liệt kê giai đoạn Westby theo thứ tự',/^Giai đoạn I · 9–12 tháng/.test(ui.heads[1]||''),ui.heads);
 ok('dòng mục ghi nguồn "Westby · GĐ I.1" và mốc tuổi',/Westby · GĐ I\.1/.test(ui.src)&&/9–12 tháng/.test(ui.src),ui.src);
 /* tìm theo từ khóa */
 await ev(()=>{S.hs.lib.src='';S.hs.lib.dom='';S.hs.lib.q='westby';S.pg.lib=1;render()});await W(120);
 const q1=await ev(()=>document.querySelector('.acts .sm b').textContent);
 ok('tìm "westby" ra các mục Westby',+q1===35,q1);
 await ev(()=>{S.hs.lib.q='nuoc cat';S.pg.lib=1;render()});await W(120);
 const q2=await ev(()=>({n:document.querySelector('.acts .sm b').textContent,t:[...document.querySelectorAll('.gi-n')].map(e=>e.textContent)}));
 ok('tìm "nước cát" ra mục chơi cát và nước',+q2.n>=1&&q2.t.some(t=>/cát và nước/.test(t)),q2);
 /* lọc theo mốc 36–48 tháng cho Westby */
 await ev(()=>{S.hs.lib.q='';S.hs.lib.src='we';S.hs.lib.age='3';S.pg.lib=1;render()});await W(120);
 const q3=await ev(()=>document.querySelector('.acts .sm b').textContent);
 ok('lọc mốc 36–48 tháng cho Westby: GĐ VII, VIII, IX = 3+3+... mục',+q3===(await ev(()=>LIBI.filter(i=>i.s==='we'&&[].concat(i.m).includes(3)).length)),q3);
 /* chi tiết hiện mô tả, ví dụ, ngôn ngữ đi cùng và nguồn */
 await ev(()=>{S.hs.lib.age='';S.hs.lib.q='giai doan vii';S.pg.lib=1;render()});await W(100);
 const dt=await ev(()=>{const g=document.querySelector('.gi details.gd');g.open=true;return g.innerText});
 ok('chi tiết có “Ngôn ngữ thường đi cùng” và nguồn Westby (1980)',/Ngôn ngữ thường đi cùng/.test(dt)&&/Westby, C\.E\. \(1980\)/.test(dt),dt.slice(0,400));

 /* chọn mục Westby cho bé và đưa vào kế hoạch, rồi hiện đúng tên mục tiêu */
 const add=await ev(()=>{const k=bkKids()[0];const g=LIBI.find(i=>i.id==='we:GĐ V.4'||(i.s==='we'&&i.c==='GĐ V.4'));addPlanItem(k.id,g.id,'n','');return{name:gName(g.id),dom:gDom(g.id),src:gSrc(g),inPlan:DB.plans.some(p=>p.k===k.id&&p.g===g.id)}});
 ok('thêm mục Westby vào kế hoạch của bé: tên, lĩnh vực và nguồn đúng',add.inPlan&&/Chơi cát và nước/.test(add.name)&&add.dom==='xh'&&add.src==='Westby · GĐ V.4',add);

 ok('không có lỗi JS',errs.length===0,errs);
 await b.close();
 console.log(passes+' PASS, '+fails+' FAIL');process.exit(fails?1:0)})();
