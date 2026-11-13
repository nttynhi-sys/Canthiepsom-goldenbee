/* Giá từng loại can thiệp 1-1 chỉnh được ở Nhân sự → Cài đặt */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
const SP='/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/';

(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 await login(page,'tt');

 /* ---------- A. mặc định và khớp với khai báo lưu tiền ---------- */
 const A=await ev(()=>({
  same:LT.every(x=>ltFee(x)===x.f),
  def:LT.every(x=>CFG_DEF['lt_'+x.c]===x.f),
  money:LT.every(x=>CFG_MONEY.includes('lt_'+x.c)),
  n:LT.length,
  noKeys:LT.every(x=>DB.cfg['lt_'+x.c]==null)}));
 ok('chưa chỉnh: mọi loại dùng giá gốc (dữ liệu cũ không cần nâng cấp)',A.same&&A.noKeys&&A.n===7,A);
 ok('giá gốc khớp CFG_DEF và mọi khóa giá nằm trong CFG_MONEY (lưu ở bảng tiền)',A.def&&A.money,A);

 /* ---------- B. màn Cài đặt có đủ ô giá ---------- */
 await ev(()=>{S.v='ns';S.ns=Object.assign(S.ns||{},{tab:'cd'});render()});
 const hasForm=await page.waitForSelector('#cfgf',{timeout:4000}).then(()=>true).catch(()=>false);
 if(!hasForm){await ev(()=>{const t=document.querySelector('[data-a="nstab"][data-v="cd"]');t&&t.click()});await page.waitForSelector('#cfgf')}
 const B=await ev(()=>{const f=document.querySelector('#cfgf');
  return{inputs:LT.map(x=>{const i=f.elements['lt_'+x.c];return i?{c:x.c,v:+i.value,label:(f.querySelector('label[for="lt_'+x.c+'"]')||{}).innerText,type:i.type,min:i.min,req:i.required}:null}),
   h3:[...f.querySelectorAll('h3')].map(h=>h.innerText)}});
 ok('Cài đặt: có phần "Giá từng loại can thiệp 1-1" với 7 ô, mỗi ô ghi đúng tên loại và giá hiện hành',B.inputs.every(Boolean)&&B.inputs.length===7&&B.h3.some(t=>/Giá từng loại can thiệp 1-1/.test(t))&&B.inputs.every(i=>i.type==='number'&&i.min==='0'&&i.req)&&B.inputs[0].v===180000&&B.inputs[2].v===200000&&B.inputs[6].v===190000&&B.inputs[2].label==='Học vận động – giác quan',B);
 await page.screenshot({path:SP+'z35-settings.png'});

 /* ---------- C. đổi giá và lưu ---------- */
 const lt=await ev(()=>{const k=DB.kids.find(x=>x.st==='dang');
  /* hai ca 1-1 của bé: một ca loại gq, một ca cũ chưa có loại */
  const mk=(id,slot,t)=>DB.lich.push(Object.assign({id,type:'11',day:1,slot,gv:DB.staff[0].id,hs:k.id},t?{lt:t}:{}));
  mk('zz-gq',SLOTS[2],'gq');mk('zz-old',SLOTS[4],null);mk('zz-nc',SLOTS[6],'nc');
  return{kid:k.id,p11:DB.cfg.p11,before:{gq:feeSlot(k,'zz-gq'),old:feeSlot(k,'zz-old'),nc:feeSlot(k,'zz-nc')}}});
 ok('trước khi đổi: ca loại gq 200.000, ca nước 190.000, ca cũ không loại theo giá chung',lt.before.gq===200000&&lt.before.nc===190000&&lt.before.old===lt.p11,lt);
 await ev(()=>{const f=document.querySelector('#cfgf');f.elements.lt_gq.value='250000';f.elements.lt_nc.value='230000';f.elements.lt_ng.value='0';f.requestSubmit()});
 await page.waitForTimeout(150);
 const C=await ev(id=>{const k=kidBy(id);return{cfg:{gq:DB.cfg.lt_gq,nc:DB.cfg.lt_nc,ng:DB.cfg.lt_ng,nh:DB.cfg.lt_nh,ms:DB.cfg.lt_ms},after:{gq:feeSlot(k,'zz-gq'),old:feeSlot(k,'zz-old'),nc:feeSlot(k,'zz-nc')},p11:DB.cfg.p11,
   fmtInp:document.querySelector('#cfgf')&&document.querySelector('#cfgf').elements.lt_gq.value}},lt.kid);
 ok('lưu: cấu hình chứa giá mới của cả 7 loại',C.cfg.gq===250000&&C.cfg.nc===230000&&C.cfg.ng===0&&C.cfg.nh===180000&&C.cfg.ms===200000,C.cfg);
 ok('học phí từng ca theo giá mới của loại; ca cũ không loại vẫn theo giá chung',C.after.gq===250000&&C.after.nc===230000&&C.after.old===C.p11,C);

 /* học phí tháng đi theo giá mới: chênh lệch là bội của 50.000 (số buổi loại gq trong tháng × phần tăng) */
 const D=await ev(id=>{const k=kidBy(id),m=TODAY.slice(0,7),keep=DB.cfg.lt_gq;
  DB.cfg.lt_gq=200000;const a=invoice(k,m);DB.cfg.lt_gq=250000;const c=invoice(k,m);DB.cfg.lt_gq=keep;
  return{a,c,d:c-a}},lt.kid);
 ok('học phí tháng của bé đổi theo giá loại (chênh lệch dương, đúng bội của phần tăng 50.000)',D.d>0&&D.d%50000===0,D);
 const E=await ev(id=>{const k=kidBy(id),r=DB.cfg.rule;
  /* hoàn khi Trung tâm nghỉ = ttRefund% giá của chính ca bị nghỉ */
  const f=feeSlot(k,'zz-gq');return{f,ref:Math.round(f*r.ttRefund/100)}},lt.kid);
 ok('hoàn phí lấy theo giá của loại ca bị nghỉ (250.000)',E.f===250000&&E.ref===250000*(await ev(()=>DB.cfg.rule.ttRefund))/100,E);

 /* ---------- D. nút điền lại giá gốc: chỉ điền ô, chưa lưu ---------- */
 await ev(()=>{S.v='ns';S.ns=Object.assign(S.ns||{},{tab:'cd'});render()});await page.waitForSelector('#cfgf');
 const F=await ev(()=>{const f=document.querySelector('#cfgf'),before=f.elements.lt_gq.value;f.querySelector('[data-a="ltdef"]').click();
  return{before,after:LT.map(x=>+f.elements['lt_'+x.c].value),db:DB.cfg.lt_gq,defs:LT.map(x=>x.f)}});
 ok('"Điền lại giá gốc": ô về giá gốc nhưng dữ liệu chưa đổi cho tới khi bấm Lưu',F.before==='250000'&&JSON.stringify(F.after)===JSON.stringify(F.defs)&&F.db===250000,F);
 await ev(()=>{document.querySelector('#cfgf').requestSubmit()});await page.waitForTimeout(150);
 ok('bấm Lưu sau khi điền lại: giá về gốc',await ev(()=>LT.every(x=>ltFee(x)===x.f)));

 /* ---------- E. giá âm hoặc không phải số ---------- */
 const G=await ev(()=>{const f=document.querySelector('#cfgf'),o={};f.elements.lt_gq.value='-5';f.elements.lt_ms.value='abc';
  o.valid=f.checkValidity();f.requestSubmit();o.blocked=DB.cfg.lt_gq===200000;     /* trình duyệt chặn gửi form khi ô không hợp lệ */
  FORM.cfgf(f);o.gq=DB.cfg.lt_gq;o.ms=DB.cfg.lt_ms;return o});
 ok('giá âm hoặc không phải số: trình duyệt không cho gửi; nếu lọt vào máy khách thì lưu 0, không bao giờ âm hay NaN',G.valid===false&&G.blocked&&G.gq===0&&G.ms===0,G);
 await ev(()=>{DB.cfg.lt_gq=250000;DB.cfg.lt_ms=200000});

 /* ---------- F. hiển thị giá ở nơi khác ---------- */
 const H=await ev(()=>{const t=ltBlock({lt:{}});const out={tt:t};
  setUser(demoAcc('ql'));out.ql=ltBlock({lt:{}});out.qlCanMoney=canMoney();
  setUser(demoAcc('vp'));out.vp=ltBlock({lt:{}});
  setUser(demoAcc('tt'));
  return{tt:/250\.000/.test(out.tt)&&/₫\/giờ/.test(out.tt),ql:!/₫|\d\.\d{3}/.test(out.ql),qlMoney:out.qlCanMoney,vp:/250\.000/.test(out.vp)}});
 ok('form thêm/sửa bé: Trưởng TT và Văn phòng thấy giá mới; Quản lý không thấy giá',H.tt&&H.vp&&H.ql&&!H.qlMoney,H);
 const R=await ev(()=>{S.v='dd';S.dd=Object.assign(S.dd||{},{tab:'rule'});render();return document.querySelector('#main').innerText});
 ok('trang Quy định: liệt kê giá theo loại 1-1 đang áp dụng',/Giá theo loại 1-1/.test(R)&&/Học vận động – giác quan 250\.000/.test(R),R.slice(R.indexOf('Đơn giá'),R.indexOf('Đơn giá')+500));

 /* ---------- G. phân quyền: chỉ Trưởng Trung tâm sửa được ---------- */
 const P=await ev(()=>{const out={};
  setUser(demoAcc('ql'));const f=document.createElement('form');f.innerHTML=LT.map(x=>`<input name="lt_${x.c}" value="1">`).join('')+['name','p11','pbtDay','pbtDay11','lateAfter','cc','giamTru','thue','ccIn','ccOut','v1','v2','pLoss','ttRefund','bvRefund','bvRefund11','gvKp','gvP'].map(n=>`<input name="${n}" value="1">`).join('');
  out.qlRes=FORM.cfgf(f);out.qlGq=DB.cfg.lt_gq;
  setUser(demoAcc('vp'));out.vpRes=FORM.cfgf(f);out.vpGq=DB.cfg.lt_gq;setUser(demoAcc('tt'));return out});
 ok('Quản lý và Văn phòng không đổi được giá (máy khách từ chối)',P.qlRes===false&&P.vpRes===false&&P.qlGq===250000&&P.vpGq===250000,P);

 /* ---------- H. lưu lên máy chủ: giá nằm ở bảng tiền, không lẫn vào bảng chung ---------- */
 const S2=await ev(()=>{const M=cflat(DB,true),rows=[...M.values()];
  const cfg=JSON.parse(rows.find(r=>r.t==='records'&&r.c==='cfg').s),cm=JSON.parse(rows.find(r=>r.t==='money'&&r.c==='cfgm').s);
  const noM=[...cflat(DB,false).values()];
  /* tải về: tài khoản có tiền thiếu khóa giá thì lấy giá gốc; tài khoản không có tiền không có giá */
  const d1=cFinish(cEmpty(),{},{_has:1,p11:180000}),d2=cFinish(cEmpty(),{},{});
  const d3=cFinish(cEmpty(),{},{_has:1,lt_gq:260000});
  return{cfgLeak:LT.some(x=>('lt_'+x.c) in cfg),cm:LT.every(x=>('lt_'+x.c) in cm)&&cm.lt_gq===250000,noMoneyRow:!noM.some(r=>r.t==='money'),
   defHas:LT.every(x=>d1.cfg['lt_'+x.c]===x.f),noRole:LT.every(x=>d2.cfg['lt_'+x.c]===0),custom:d3.cfg.lt_gq===260000&&d3.cfg.lt_ng===180000}});
 ok('lưu: giá theo loại vào bảng tiền (cfgm), không lọt vào cấu hình chung; vai trò không có tiền không gửi',S2.cm&&!S2.cfgLeak&&S2.noMoneyRow,S2);
 ok('tải: thiếu khóa giá thì dùng giá gốc, có thì dùng giá đã lưu',S2.defHas&&S2.custom,S2);

 ok('không lỗi trang',errs.length===0,errs);
 await b.close();
 console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0);
})();
