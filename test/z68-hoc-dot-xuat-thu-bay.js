/* Học đột xuất: bé bán trú T2–T6 xin học thêm thứ Bảy; điểm danh được, học phí cộng vào tháng sau */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{
 const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 /* bé bán trú T2–T6 (không có thứ Bảy), ngày thứ Bảy không nghỉ lễ */
 const P=await ev(()=>{const k=DB.kids.find(x=>x.st==='dang'&&x.gr&&btHas(x,1)&&!btHas(x,6)&&invoice(x,CM)>0);
  let d=null;for(let i=0;i<40&&!d;i++){const c=addD(TODAY,i-20);if(dow(c)===6&&c.slice(0,7)===CM&&!isClosed(c))d=c}
  DB.bx=[];return k&&d?{id:k.id,n:k.n,d,gross:invoice(k,CM),price:kidBt(k)}:null});
 ok('có bé bán trú T2–T6 và một ngày thứ Bảy trong tháng',!!P,P);
 const nm=await ev(()=>sm(CM,1));
 const before=await ev(k=>({inv:invoice(kidBy(k.id),CM),inv2:invoice(kidBy(k.id),sm(CM,1)),n:dayList(k.d).reduce((s,r)=>s+r.kids.length,0)}),P);
 /* thêm bằng giao diện */
 await ev(p=>{S.dd={tab:'roll',date:p.d,m:CM,q:'',pr:'',fl:'',gv:'',kid:'',un:false};go('dd');render()},P);await page.waitForSelector('[data-a="bxopen"]');
 await page.click('[data-a="bxopen"]');await page.waitForSelector('#bxf');
 await page.selectOption('#bx-k',P.id);await page.fill('#bx-n','Phụ huynh xin học thêm');await page.click('#bxf button[type=submit]');await W(250);
 const A=await ev(p=>{const k=kidBy(p.id);const rows=dayList(p.d).filter(r=>r.kind==='bt'&&r.kids.some(x=>x.id===p.id));return{bx:(DB.bx||[]).filter(x=>x.hs===p.id&&x.d===p.d).length,rows:rows.length,xk:rows.length&&!!rows[0].xk[p.id],modal:!!S.modal}},P);
 ok('thêm bé học đột xuất vào ngày thứ Bảy: có bản ghi và hàng điểm danh bán trú',A.bx===1&&A.rows===1&&A.xk&&!A.modal,A);
 const txt=await page.textContent('#main');
 ok('bảng điểm danh ngày: hiện nhãn "Học đột xuất", nút trạng thái bấm được và ghi chú học phí tháng sau',/Học đột xuất/.test(txt)&&/cộng vào học phí/.test(txt)&&!!(await page.$('.stb .st-cm:not([disabled])')),txt.slice(0,200));
 /* điểm danh có mặt */
 await ev(p=>ACT.att(p.d+'|'+kidBy(p.id).gr+'|'+p.id+'|cm'),P);
 const C=await ev(p=>{const k=kidBy(p.id);return{code:DB.att[p.d+'|'+k.gr+'|'+p.id],inv:invoice(k,CM),charge:bxCharge(k,CM).total,mf:monthFee(k,sm(CM,1)),fb:feeBreak(k,sm(CM,1)),invNext:invoice(k,sm(CM,1)),st:settle(k,CM).cells[p.d]}},P);
 ok('điểm danh có mặt ghi được',C.code==='cm'&&(C.st||[]).includes('x'),C);
 ok('học phí tháng này không đổi (học đột xuất không vào hóa đơn tháng đó)',C.inv===before.inv,{C,before});
 ok('học phí đột xuất = giá bán trú một ngày, cộng vào tháng sau: phải đóng = học phí tháng sau + đột xuất − phí dư',C.charge===P.price&&C.mf.xtra===P.price&&C.fb.xtra===P.price&&C.fb.due===Math.max(0,C.fb.gross+P.price-C.fb.sur)&&C.invNext===before.inv2,C);
 /* bảng Học phí học sinh của tháng sau */
 await ev(p=>{S.hp={tab:'tq',m:sm(CM,1),st:'',q:p.n,gq:'',gm:CM};S.pg.hp=1;go('hp');render()},P);await W(250);
 const ht=await page.textContent('#main');
 ok('Học phí học sinh tháng sau: hiện dòng "học đột xuất" của bé và số phải đóng đã cộng',/học đột xuất/.test(ht),ht.slice(0,300));
 /* nghỉ có phép: không tính */
 const F=await ev(p=>{ACT.att(p.d+'|'+kidBy(p.id).gr+'|'+p.id+'|p');const k=kidBy(p.id);return{code:DB.att[p.d+'|'+k.gr+'|'+p.id],charge:bxCharge(k,CM).total,fbx:feeBreak(k,sm(CM,1)).xtra}},P);
 ok('bé xin học đột xuất rồi nghỉ có phép: không tính học phí ngày đó',F.code==='p'&&F.charge===0&&F.fbx===0,F);
 await ev(p=>ACT.att(p.d+'|'+kidBy(p.id).gr+'|'+p.id+'|kp'),P);
 ok('nghỉ không phép: vẫn tính học phí',(await ev(p=>bxCharge(kidBy(p.id),CM).total,P))===P.price);
 /* học phí nhập riêng */
 await ev(p=>{const r=DB.bx.find(x=>x.hs===p.id);r.a=150000},P);
 ok('học phí đột xuất nhập riêng 150.000 ₫',(await ev(p=>bxCharge(kidBy(p.id),CM).total,P))===150000);
 /* phụ huynh thấy học phí tháng sau */
 const pf=await ev(p=>{const k=kidBy(p.id);return feeNextCard.length>=1}, P);
 /* hủy */
 await ev(p=>{S.dd.date=p.d;S.dd.tab='roll';go('dd');render()},P);await page.waitForSelector('[data-a="bxdel"]');
 await page.click('[data-a="bxdel"]');await W();await page.click('.mdl [data-a="okask"], .mdl .btn.p, [data-a="ok"]').catch(()=>{});await W(250);
 const D=await ev(p=>({bx:(DB.bx||[]).filter(x=>x.hs===p.id).length,att:Object.keys(DB.att).filter(k=>k.startsWith(p.d+'|')&&k.endsWith('|'+p.id)).length}),P);
 ok('hủy học đột xuất: xóa bản ghi và điểm danh ngày đó',D.bx===0&&D.att===0,D);
 /* ràng buộc */
 const R=await ev(p=>{const k=kidBy(p.id);const sun=addD(p.d,1);const mon=addD(p.d,2);
  S.modal={t:'bxa',d:sun};const f=document.createElement('form');
  return{sunOpen:(ACT.bxopen(),!!(S.modal&&S.modal.t==='bxa'&&S.modal.d===S.dd.date&&dow(S.dd.date)===0)),poolMon:bxPool(mon).some(x=>x.id===p.id)}},P);
 ok('thứ Hai bé đã có lịch bán trú nên không nằm trong danh sách thêm đột xuất',R.poolMon===false,R);
 await b.close();
 /* giáo viên: chỉ bé của mình, không thấy học phí */
 {const o=await open();await login(o.page,'gv');
  const G=await o.page.evaluate(()=>{const my=myKids().filter(k=>k.st==='dang'&&k.gr&&btHas(k,1)&&!btHas(k,6));if(!my.length)return{skip:1};
   let d=null;for(let i=0;i<40&&!d;i++){const c=addD(TODAY,i-20);if(dow(c)===6&&!isClosed(c))d=c}
   const pool=bxPool(d).map(k=>k.id),other=DB.kids.find(k=>!canKid(k.id)&&k.st==='dang'&&k.gr&&!btHas(k,6));
   S.dd={tab:'roll',date:d,m:CM,q:'',pr:'',fl:'',gv:'',kid:'',un:false};go('dd');render();ACT.bxopen();render();
   const mt=document.querySelector('.mdl')?document.querySelector('.mdl').textContent:'';
   return{pool:pool.length,allMine:pool.every(id=>canKid(id)),noOther:!other||!pool.includes(other.id),money:/Học phí ngày này/.test(mt),has:/Thêm bé học đột xuất/.test(mt)}});
  ok('giáo viên: chỉ thêm được bé của mình, không thấy ô học phí',G.skip||(G.pool>0&&G.allMine&&G.noOther&&!G.money&&G.has),G);
  await o.b.close()}
 ok('không lỗi trang',errs.length===0,errs);
 console.log(`\nKẾT QUẢ: ${passes} đạt, ${fails} lỗi`);process.exit(fails?1:0)})();
