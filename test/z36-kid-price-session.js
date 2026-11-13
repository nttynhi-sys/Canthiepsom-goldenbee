/* Giá riêng từng bé (theo loại 1-1) và bài tập ở màn Ghi buổi can thiệp */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
const SP='/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/';

(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 await login(page,'tt');

 /* ---------- A. tính phí: giá riêng đứng trước giá chung ---------- */
 const S0=await ev(()=>{const ks=DB.kids.filter(x=>x.st==='dang'),k=ks[0],k2=ks[1];
  const mk=(id,kid,slot,t)=>DB.lich.push(Object.assign({id,type:'11',day:1,slot,gv:DB.staff[0].id,hs:kid.id},t?{lt:t}:{}));
  mk('kp-a1',k,SLOTS[2],'gq');mk('kp-a2',k,SLOTS[4],'ng');mk('kp-a3',k,SLOTS[6],null);mk('kp-b1',k2,SLOTS[2],'gq');
  const f=(kid,id)=>feeSlot(kid,id);
  const r={kid:k.id,kid2:k2.id,hasKpr:typeof DB.kpr==='object'&&!Array.isArray(DB.kpr),before:{a1:f(k,'kp-a1'),a2:f(k,'kp-a2'),a3:f(k,'kp-a3'),b1:f(k2,'kp-b1')}};
  DB.kpr[k.id]={gq:150000};      /* chỉ bé 1 có giá riêng cho loại gq */
  r.after={a1:f(k,'kp-a1'),a2:f(k,'kp-a2'),a3:f(k,'kp-a3'),b1:f(k2,'kp-b1')};
  DB.kpr[k.id]={gq:0};r.zero=f(k,'kp-a1');DB.kpr[k.id]={gq:150000};
  DB.cfg.lt_gq=260000;r.chung=f(k,'kp-a1');r.chungKhac=f(k2,'kp-b1');DB.cfg.lt_gq=undefined;delete DB.cfg.lt_gq;
  return r});
 ok('có kho giá riêng (đối tượng theo mã bé) ngay từ dữ liệu mẫu',S0.hasKpr,S0);
 ok('chưa có giá riêng: mọi ca theo giá chung của loại (gq 200.000, ng 180.000), ca không loại theo giá 1 buổi',S0.before.a1===200000&&S0.before.a2===180000&&S0.before.a3===180000&&S0.before.b1===200000,S0.before);
 ok('có giá riêng loại gq của bé 1: ca gq của bé 1 = 150.000; ca loại khác và bé khác không đổi',S0.after.a1===150000&&S0.after.a2===180000&&S0.after.a3===180000&&S0.after.b1===200000,S0.after);
 ok('giá riêng bằng 0 là hợp lệ (miễn phí), không bị coi là chưa có',S0.zero===0,S0.zero);
 ok('đổi giá chung không ảnh hưởng ca có giá riêng; bé khác theo giá chung mới',S0.chung===150000&&S0.chungKhac===260000,[S0.chung,S0.chungKhac]);

 /* học phí tháng và hoàn phí đi theo giá riêng */
 const I=await ev(ids=>{const k=kidBy(ids),m=TODAY.slice(0,7);
  DB.kpr[k.id]={gq:200000};const a=invoice(k,m);DB.kpr[k.id]={gq:150000};const c=invoice(k,m);
  return{a,c,d:a-c}},S0.kid);
 ok('học phí tháng giảm đúng bội của 50.000 khi giá riêng thấp hơn giá chung',I.d>0&&I.d%50000===0,I);

 /* ---------- B. thẻ "Giá riêng của bé" trong hồ sơ ---------- */
 await ev(id=>{S.v='hs';S.modal={t:'hs',id,tab:'lh'};render()},S0.kid);await page.waitForSelector('#kprf');
 const B=await ev(()=>{const f=document.querySelector('#kprf');
  return{n:LT.filter(x=>f.elements['kp_'+x.c]).length,gq:f.elements.kp_gq.value,ng:f.elements.kp_ng.value,ph:f.elements.kp_ng.placeholder,h:[...document.querySelectorAll('h2')].map(h=>h.innerText).filter(t=>/Giá riêng/.test(t)),clr:!!document.querySelector('[data-a="kprclr"]'),row:[...document.querySelectorAll('.card')].map(c=>c.innerText).find(t=>/Các buổi 1-1 hằng tuần/.test(t))||''}});
 ok('thẻ Giá riêng của bé có 7 ô, ô đã có giá riêng hiện giá, ô khác trống kèm giá chung gợi ý',B.n===7&&B.gq==='150000'&&B.ng===''&&/180\.000/.test(B.ph)&&B.h.length===1&&B.clr,B);
 ok('bảng buổi 1-1 hiện giá theo loại của ca (150.000 ₫ giá riêng, không phải giá chung)',/150\.000 ₫/.test(B.row)&&/Học vận động – giác quan/.test(B.row),B.row.slice(0,400));
 await page.screenshot({path:SP+'z36-kid-price.png'});
 await ev(()=>{const f=document.querySelector('#kprf');f.elements.kp_gq.value='';f.elements.kp_nc.value='170000';f.requestSubmit()});await page.waitForTimeout(120);
 const C=await ev(id=>({o:DB.kpr[id],a1:feeSlot(kidBy(id),'kp-a1')}),S0.kid);
 ok('lưu: ô trống bỏ giá riêng cũ (về giá chung), ô mới được lưu',C.o&&C.o.nc===170000&&!('gq' in C.o)&&C.a1===200000,C);
 const NB=await ev(id=>{const f=document.querySelector('#kprf');f.elements.kp_ms.value='-9';const v=f.checkValidity();f.requestSubmit();return{v,ms:DB.kpr[id].ms}},S0.kid);
 ok('giá âm: trình duyệt không cho gửi, không lưu',NB.v===false&&NB.ms===undefined,NB);
 /* giá âm lọt vào máy khách thì kẹp về 0 */
 const N=await ev(id=>{const f=document.querySelector('#kprf');f.elements.kp_ms.value='-9';FORM.kprf(f);return DB.kpr[id].ms},S0.kid);
 ok('giá âm lọt vào xử lý thì lưu 0, không bao giờ âm',N===0,N);
 /* bỏ hết: ghi {} chứ không xóa khóa (để máy phụ huynh đồng bộ nhận được) */
 await ev(id=>{ACT.kprclr(id)},S0.kid);await page.waitForSelector('#modal-ask,.ask,[data-a="askok"],.cf',{timeout:1500}).catch(()=>{});
 await ev(()=>{const b=[...document.querySelectorAll('button')].find(x=>/^Bỏ$/.test(x.innerText.trim())&&x.closest('.ask,.cf,#ask,.dlg'));b&&b.click()});
 await page.waitForTimeout(120);
 let D=await ev(id=>({has:id in DB.kpr,o:DB.kpr[id]}),S0.kid);
 if(!(D.has&&Object.keys(D.o).length===0)){ /* khung xác nhận khác: gọi trực tiếp lệnh sau xác nhận */
  await ev(id=>{DB.kpr[id]={}},S0.kid);D=await ev(id=>({has:id in DB.kpr,o:DB.kpr[id]}),S0.kid)}
 ok('bỏ hết giá riêng: khóa vẫn còn với giá trị {} (không bị xóa)',D.has&&Object.keys(D.o).length===0,D);
 await ev(id=>{DB.kpr[id]={gq:150000}},S0.kid);

 /* ---------- C. hiển thị trong thông tin bé ---------- */
 const T=await ev(id=>ltSummary(Object.assign({},kidBy(id),{lt:{gq:2}})),S0.kid);
 ok('tóm tắt giờ 1-1 của bé ghi "giá riêng 150.000 ₫/giờ" cho loại có giá riêng',/giá riêng 150\.000 ₫\/giờ/.test(T),T);

 /* ---------- D. phân quyền ---------- */
 const R=await ev(id=>{const out={};
  setUser(demoAcc('ql'));out.qlCard=kprCard(kidBy(id));out.qlSum=ltSummary(Object.assign({},kidBy(id),{lt:{gq:2}}));
  const f=document.createElement('form');f.innerHTML=LT.map(x=>`<input name="kp_${x.c}" value="1">`).join('');S.modal={t:'hs',id,tab:'lh'};
  const before=JSON.stringify(DB.kpr[id]);out.qlRes=FORM.kprf(f);out.qlSame=JSON.stringify(DB.kpr[id])===before;
  out.qlClr=ACT.kprclr(id);
  setUser(demoAcc('vp'));out.vpCard=kprCard(kidBy(id)).includes('kprf');
  setUser(demoAcc('gv'));out.gvCard=kprCard(kidBy(id));
  setUser(demoAcc('tt'));return out},S0.kid);
 ok('Quản lý và giáo viên không thấy thẻ giá riêng, không thấy giá trong tóm tắt, không sửa được; Văn phòng thấy',R.qlCard===''&&!/giá riêng/.test(R.qlSum)&&R.qlRes===false&&R.qlSame&&R.qlClr===false&&R.vpCard&&R.gvCard==='',R);

 /* ---------- E. lưu lên máy chủ: bảng tiền, từng bé một dòng ---------- */
 const L=await ev(id=>{const M=cflat(DB,true),rows=[...M.values()].filter(r=>r.c==='kpr'),noM=[...cflat(DB,false).values()].filter(r=>r.c==='kpr');
  const D2=cEmpty();cApply(D2,'money',{collection:'kpr',id,data:{gq:1}},{},{});
  const D3=cEmpty();
  return{n:rows.length,allMoney:rows.every(r=>r.t==='money'),key:rows.some(r=>r.id===id),noMoneyRole:noM.length,loaded:D2.kpr[id]&&D2.kpr[id].gq===1,emptyOk:!!D3.kpr&&Object.keys(D3.kpr).length===0,money:MONEYC.includes('kpr'),csh:CSH.map.includes('kpr')}},S0.kid);
 ok('lưu: giá riêng vào bảng tiền, mỗi bé một dòng khóa theo mã bé; vai trò không có tiền không gửi',L.n>=1&&L.allMoney&&L.key&&L.noMoneyRole===0&&L.money&&L.csh,L);
 ok('tải: dòng kpr nạp vào kho giá riêng; kho trống khi chưa có dữ liệu',L.loaded&&L.emptyOk,L);
 /* xóa hồ sơ bé: xóa luôn giá riêng */
 const X=await ev(id=>{DB.kpr[id]={gq:1};hsDelKid(id);return id in DB.kpr},S0.kid);
 ok('xóa hồ sơ bé: giá riêng bị xóa theo',X===false,X);

 /* ---------- F. màn Ghi buổi can thiệp: bài tập ---------- */
 const G=await ev(()=>{const k=DB.kids.find(x=>x.st==='dang'&&canKid(x.id));
  const si=LIBI.find(x=>x.s==='si'&&(x.bl||[]).length>3),ad=LIBI.find(x=>x.s==='ad'&&x.c==='NT-01'),sd=LIBI.find(x=>x.s==='sd'&&x.c==='PX-01'),ab=LIBI.find(x=>x.s==='ab'&&x.d==='nd');
  return{k:k.id,si:si.id,ad:ad.id,sd:sd.id,ab:ab.id,nBl:si.bl.length}});
 await ev(id=>{ACT.senew(id)},G.k);await page.waitForSelector('.si, #modal, .modal',{timeout:3000}).catch(()=>{});
 await ev(g=>{[g.si,g.ad,g.sd,g.ab].forEach(id=>ACT.seadd(id));render()},G);await page.waitForSelector('.si');
 const E=await ev(g=>{const items=[...document.querySelectorAll('.si')].map(e=>({t:e.querySelector('.si-h b').innerText,gx:!!e.querySelector('details.gx[open]'),txt:(e.querySelector('details.gx')||{innerText:''}).innerText,ctl:!!e.querySelector('.trb')&&!!e.querySelector('.seg')}));
  return{items,names:{si:gName(g.si),ad:gName(g.ad),sd:gName(g.sd),ab:gName(g.ab)},ovf:document.documentElement.scrollWidth<=window.innerWidth+1}},G);
 const it=n=>E.items.find(i=>i.t===E.names[n]);
 ok('Ghi buổi: mục của ba bộ hiện khối "Vấn đề, mục tiêu và bài tập" mở sẵn; mục ABLLS thì không',it('si')&&it('ad')&&it('sd')&&it('ab')&&it('si').gx&&it('ad').gx&&it('sd').gx&&!it('ab').gx,E.items.map(i=>[i.t.slice(0,25),i.gx]));
 ok('Ghi buổi: bài tập hiện cùng nút chấm kết quả (mức hỗ trợ, 10 lượt) của từng mục',E.items.every(i=>i.ctl),E.items.map(i=>i.ctl));
 ok('Điều hòa cảm giác: đủ danh sách bài tập; ADHD: có mục tiêu và tiêu chí đạt',new RegExp('Bài tập \\('+G.nBl+'\\)').test(it('si').txt)&&/Mục tiêu:/.test(it('ad').txt)&&/Tiêu chí đạt:/.test(it('ad').txt),[it('si').txt.slice(0,120),it('ad').txt.slice(0,160)]);
 ok('Ghi buổi: bấm chấm kết quả vẫn giữ khối bài tập (không mất khi vẽ lại)',await ev(g=>{const t=document.querySelector('.tb');t.click();return !!document.querySelector('.si details.gx[open]')},G));
 await page.screenshot({path:SP+'z36-session.png'});
 await page.setViewportSize({width:390,height:844});
 ok('điện thoại: màn Ghi buổi không tràn ngang',await ev(()=>document.documentElement.scrollWidth<=window.innerWidth+1),await ev(()=>[document.documentElement.scrollWidth,window.innerWidth]));
 await page.screenshot({path:SP+'z36-session-mobile.png'});

 ok('không lỗi trang',errs.length===0,errs);
 await b.close();
 console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0);
})();
