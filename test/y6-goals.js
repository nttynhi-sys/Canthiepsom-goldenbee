/* Yêu cầu 6: mục tiêu buổi ⇒ mục tiêu ngắn hạn ⇒ mục tiêu dài hạn; báo cáo phụ huynh trực quan, chữ lớn */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
const SP='/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/';
const lum=c=>{const m=c.match(/[\d.]+/g).map(Number),f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};
const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};

(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);

 /* ---------- A. dữ liệu mẫu có đủ ba tầng ---------- */
 await login(page,'tt');
 const A=await ev(()=>{const r={kids:0,shorts:0,badUp:0,orph:0,items:0,itemsPl:0,badPl:0,badPct:0,longsWithCh:0,longs:0};
  DB.kids.filter(k=>k.st==='dang').forEach(k=>{const ps=kidPlans(k.id);if(!ps.length)return;r.kids++;
   ps.filter(p=>p.h==='n').forEach(p=>{r.shorts++;if(p.up){const l=planBy(p.up);if(!l||l.k!==k.id||l.h!=='d')r.badUp++}else r.orph++});
   DB.sess.filter(s=>s.k===k.id).forEach(s=>s.it.forEach(i=>{r.items++;if(i.pl){r.itemsPl++;const p=planBy(i.pl);if(!p||p.k!==k.id||p.h!=='n')r.badPl++}}));
   const T=gtTree(k.id);if(T.longs.length+0>=0&&[...T.longs,...T.shorts].some(n=>!(n.pct>=0&&n.pct<=100)))r.badPct++;
   r.longs+=T.longs.length;r.longsWithCh+=T.longs.filter(n=>n.ch.length).length;
   if(T.orph.length+T.longs.reduce((a,n)=>a+n.ch.length,0)!==T.shorts.length)r.badPct+=100});
  return r});
 ok('dữ liệu mẫu: mọi mục tiêu ngắn hạn đều gắn vào một mục tiêu dài hạn hợp lệ',A.shorts>0&&A.badUp===0,A);
 ok('dữ liệu mẫu: dòng mục tiêu trong buổi gắn vào mục tiêu ngắn hạn của chính bé đó',A.items>0&&A.itemsPl>0&&A.badPl===0,A);
 ok('cây dựng đúng: mọi ngắn hạn nằm đúng một chỗ, phần trăm trong 0 đến 100',A.badPct===0&&A.longs>0&&A.longsWithCh>0,A);

 /* ---------- B. số liệu cuộn lên từ buổi ⇒ ngắn hạn ⇒ dài hạn ---------- */
 const K=await ev(()=>{const k=DB.kids.find(x=>x.st==='dang');
  const G=LIBI.filter(x=>x.d==='nd'&&x.s==='ab').slice(0,8).map(x=>x.id);
  DB.plans=DB.plans.filter(p=>p.k!==k.id);DB.sess=DB.sess.filter(s=>s.k!==k.id);
  const P=(id,g,h,up)=>DB.plans.push(Object.assign({id,k:k.id,g,h,s:'dang',from:addD(TODAY,-60),due:addD(TODAY,200),by:'x'},up?{up}:{}));
  P('L1',G[0],'d');P('S1',G[1],'n','L1');P('S2',G[2],'n','L1');P('S3',G[3],'n');
  let n=0;const S=(d,g,sup,tr,pl)=>DB.sess.push({id:'t'+(++n),k:k.id,date:addD(TODAY,-d),by:'x',st:'xong',dom:['nd'],it:[Object.assign({g,sup,tr},pl?{pl}:{})],note:'',home:''});
  S(20,G[1],'I','VVVVVVVVVV','S1');S(19,G[1],'I','VVVVVVVVVV','S1');S(18,G[1],'I','VVVVVVVVVV','S1');       /* ba buổi độc lập 100% ⇒ đạt */
  S(10,G[4],'GP','VVVVVVVVVV','S1');S(9,G[4],'GP','VVVVVVVVVV','S1');                                         /* mục tiêu buổi thứ hai: 65 điểm ⇒ đang tiến bộ */
  S(8,G[2],'MP','VVVVVVVVVV','S2');S(7,G[2],'GP','VVVVVVVVVV','S2');                                          /* 57,5 điểm ⇒ cần luyện thêm */
  return{id:k.id,G}});
 const B=await ev(id=>{const T=gtTree(id),f=x=>T.shorts.find(s=>s.p.id===x),l=T.longs[0];
  return{nL:T.longs.length,orph:T.orph.map(s=>s.p.id),s1:{st:f('S1').st,pct:f('S1').pct,total:f('S1').total,dn:f('S1').dn,ready:f('S1').ready},s2:{st:f('S2').st,pct:f('S2').pct},s3:{st:f('S3').st,pct:f('S3').pct},
   l1:{ch:l.ch.map(s=>s.p.id).sort(),st:l.st,pct:l.pct,dn:l.dn,total:l.total}}},K.id);
 ok('một mục tiêu dài hạn, ngắn hạn S1 và S2 thuộc nó, S3 chưa gắn',B.nL===1&&B.l1.ch.join()==='S1,S2'&&B.orph.join()==='S3',B);
 ok('S1 có 2 mục tiêu buổi, 1 đã đạt, trạng thái đang tiến bộ, 83%',B.s1.total===2&&B.s1.dn===1&&B.s1.st==='tien'&&B.s1.pct===83&&!B.s1.ready,B.s1);
 ok('S2 cần luyện thêm (58%), S3 sắp luyện (0%)',B.s2.st==='luyen'&&B.s2.pct===58&&B.s3.st==='moi'&&B.s3.pct===0,[B.s2,B.s3]);
 ok('mục tiêu dài hạn là trung bình các ngắn hạn con (71%), đang tiến bộ, chưa có con nào đạt',B.l1.pct===71&&B.l1.st==='tien'&&B.l1.dn===0&&B.l1.total===2,B.l1);
 /* thêm 3 buổi độc lập cho mục tiêu buổi còn lại của S1 ⇒ S1 gần đạt (chờ xác nhận), rồi xác nhận đạt */
 const B2=await ev(id=>{const G=LIBI.filter(x=>x.d==='nd'&&x.s==='ab').slice(0,8).map(x=>x.id);
  [3,2,1].forEach((d,i)=>DB.sess.push({id:'u'+i,k:id,date:addD(TODAY,-d),by:'x',st:'xong',dom:['nd'],it:[{g:G[4],sup:'I',tr:'VVVVVVVVVV',pl:'S1'}],note:'',home:''}));
  const a=gtTree(id).shorts.find(s=>s.p.id==='S1');const r1={st:a.st,ready:a.ready,pct:a.pct};
  ACT.plok('S1');const T=gtTree(id),s=T.shorts.find(x=>x.p.id==='S1'),l=T.longs[0];
  return{r1,after:{st:s.st,pct:s.pct},l:{dn:l.dn,total:l.total,pct:l.pct}}},K.id);
 ok('mọi mục tiêu buổi của S1 đã đạt ⇒ "Gần đạt" và đủ điều kiện, chưa tự đạt',B2.r1.st==='gan'&&B2.r1.ready&&B2.r1.pct===100,B2.r1);
 ok('nhân viên bấm đạt ⇒ S1 "Đã đạt" 100%, mục tiêu dài hạn đếm 1/2 con đã đạt',B2.after.st==='dat'&&B2.after.pct===100&&B2.l.dn===1&&B2.l.total===2&&B2.l.pct===79,B2);

 /* ---------- C. nhân viên: cây trong tab Kế hoạch mục tiêu ---------- */
 await ev(id=>{S.modal={t:'hs',id,tab:'kh'};render()},K.id);await page.waitForSelector('.gt-b');
 const C=await ev(()=>({blocks:document.querySelectorAll('.gt-b').length,text:document.querySelector('#modal, .mdc, .modal')?.innerText||document.body.innerText,sel:[...document.querySelectorAll('.gt-up select')].map(s=>s.id)}));
 ok('tab Kế hoạch mục tiêu: có khối mục tiêu dài hạn, ngắn hạn con và nhóm chưa gắn',C.blocks===1&&/Mục tiêu dài hạn/.test(C.text)&&/chưa gắn mục tiêu dài hạn/i.test(C.text)&&/Mục tiêu buổi/.test(C.text),C.text.slice(0,300));
 await page.screenshot({path:SP+'y6-staff-plan.png'});
 await page.selectOption('#gu-S3','L1');await W();
 ok('chọn "Thuộc mục tiêu dài hạn" cho S3 ⇒ lưu up và S3 chuyển vào mục tiêu dài hạn',await ev(()=>planBy('S3').up==='L1'&&gtTree(DB.plans.find(p=>p.id==='S3').k).orph.length===0));
 await page.selectOption('#gu-S3','');await W();
 ok('chọn lại "Chưa gắn" ⇒ bỏ up',await ev(()=>planBy('S3').up===undefined&&gtTree(planBy('S3').k).orph.length===1));
 await page.click('[data-a="plauto"]');await W();
 ok('"Tự gắn theo lĩnh vực" gắn ngắn hạn cùng lĩnh vực vào mục tiêu dài hạn',await ev(()=>planBy('S3').up==='L1'));
 /* chuyển hạn và bỏ mục tiêu dài hạn không để lại tham chiếu treo */
 const D=await ev(()=>{ACT.plhz('L1');const a=DB.plans.filter(p=>p.up==='L1').length;ACT.plhz('L1');return{afterToShort:a,backLong:planBy('L1').h}});
 ok('chuyển mục tiêu dài hạn sang ngắn hạn thì gỡ mọi up trỏ tới nó',D.afterToShort===0&&D.backLong==='d',D);
 await ev(()=>{DB.plans.filter(p=>['S1','S2','S3'].includes(p.id)).forEach(p=>p.up='L1');S.modal={t:'hs',id:planBy('L1').k,tab:'kh'};render()});
 await page.click('[data-a="pkopenu"][data-v="L1"]');await page.waitForSelector('#gp-up');
 ok('"Thêm mục tiêu ngắn hạn" trong khối dài hạn mở bộ chọn đã đặt sẵn mục tiêu dài hạn',await ev(()=>S.modal.t==='gp'&&S.modal.up==='L1'&&S.modal.hz==='n'&&document.querySelector('#gp-up').value==='L1'&&!document.querySelector('#gp-up').disabled));
 await page.selectOption('#gp-hz','d');await W(40);
 ok('chọn loại Dài hạn thì ô "Thuộc mục tiêu dài hạn" bị khóa',await ev(()=>document.querySelector('#gp-up').disabled));
 await page.selectOption('#gp-hz','n');
 const newG=await ev(()=>{const g=LIBI.filter(x=>x.d==='nd'&&x.s==='ab')[10].id;S.modal.sel=[g];return g});
 await ev(()=>{ACT.gpok();render()});
 ok('thêm từ bộ chọn: mục tiêu ngắn hạn mới thuộc mục tiêu dài hạn đã chọn',await ev(g=>{const p=DB.plans.find(x=>x.g===g);return !!p&&p.h==='n'&&p.up==='L1'},newG));
 await ev(()=>{DB.plans=DB.plans.filter(p=>['L1','S1','S2','S3'].includes(p.id));S.modal={t:'hs',id:planBy('L1').k,tab:'kh'};render()});
 const AK=await ev(()=>{ACT.pldel('L1');render();return{t:S.modal.t,msg:S.modal.msg}});
 ok('bỏ mục tiêu dài hạn: hộp xác nhận nhắc số ngắn hạn sẽ chuyển sang nhóm chưa gắn',AK.t==='ask'&&/3 mục tiêu ngắn hạn thuộc mục tiêu này sẽ chuyển sang nhóm chưa gắn/.test(AK.msg),AK);
 await page.click('[data-a="askyes"]');await W();
 ok('bỏ mục tiêu dài hạn ⇒ ngắn hạn con thành chưa gắn, không còn up treo',await ev(()=>!planBy('L1')&&DB.plans.every(p=>!p.up)&&gtTree(DB.plans[0].k).orph.length===3));
 /* dựng lại để thử form buổi */
 await ev(id=>{DB.plans.push({id:'L1',k:id,g:LIBI.filter(x=>x.d==='nd'&&x.s==='ab')[0].id,h:'d',s:'dang',from:addD(TODAY,-60),due:addD(TODAY,200),by:'x'});planBy('S1').up='L1';planBy('S2').up='L1';S.modal=null;render()},K.id);

 /* ---------- D. form ghi buổi: chọn mục tiêu ngắn hạn cho từng dòng ---------- */
 await ev(id=>{ACT.senew(id);render()},K.id);await page.waitForSelector('.si-pl');
 const Dn=await ev(()=>({n:document.querySelectorAll('.si-pl').length,opts:[...document.querySelector('.si-pl').options].map(o=>o.textContent),chain:[...document.querySelectorAll('.gt-ch')].map(e=>e.innerText),pls:S.modal.it.map(i=>i.pl)}));
 ok('form buổi: mỗi dòng mục tiêu có ô chọn mục tiêu ngắn hạn, mặc định gắn đúng kế hoạch',Dn.n>=1&&Dn.opts.length>=3&&Dn.pls.every(x=>x),Dn);
 ok('form buổi: dưới ô chọn hiện chuỗi ngắn hạn ⇒ dài hạn',Dn.chain.some(t=>/Mục tiêu ngắn hạn/.test(t)&&/Mục tiêu dài hạn/.test(t)),Dn.chain);
 await page.selectOption('.si-pl >> nth=0','S2');await W();
 await ev(()=>{S.modal.it[0].tr='VVVVVVVVVV'});
 await page.click('[data-a="sesave"]');await W();
 const sv=await ev(id=>{const s=DB.sess.filter(x=>x.k===id&&!/^[tu]\d+$/.test(x.id)).pop();return{pl:s.it.map(i=>i.pl),st:s.st,n:s.it.length}},K.id);
 ok('lưu buổi: dòng đầu mang pl = S2 (mục tiêu ngắn hạn đã chọn)',sv.pl[0]==='S2'&&sv.st==='xong',sv);
 /* chọn từ ngân hàng ở chế độ tự chọn: cùng lĩnh vực thì gắn vào ngắn hạn sẵn có, khác lĩnh vực thì tạo ngắn hạn mới */
 const Pk=await ev(id=>{const before=DB.plans.length;ACT.senew(id);render();
  const gn=LIBI.filter(x=>x.d==='nd'&&x.s==='ab')[14].id,gc=LIBI.filter(x=>x.d==='cy'&&x.s==='ab')[3].id;
  ACT.sepick('');S.modal.sel=[gn,gc];const m=S.modal;ACT.gpok();render();
  const it=S.modal.it.filter(i=>i.g===gn||i.g===gc),pn=planBy(it.find(i=>i.g===gn).pl),pc=planBy(it.find(i=>i.g===gc).pl);
  return{added:DB.plans.length-before,nd:{h:pn&&pn.h,dom:pn&&gDom(pn.g)},cy:{h:pc&&pc.h,own:pc&&pc.g===gc,up:pc&&pc.up||''},mode:m.pl}},K.id);
 ok('bộ chọn cho buổi (tự chọn): cùng lĩnh vực gắn vào ngắn hạn sẵn có, khác lĩnh vực tạo ngắn hạn mới',Pk.added===1&&Pk.nd.h==='n'&&Pk.nd.dom==='nd'&&Pk.cy.h==='n'&&Pk.cy.own,Pk);
 await ev(()=>{ACT.seclose();render()});

 /* ---------- E. tương thích dữ liệu cũ: chưa có up, pl ---------- */
 const E=await ev(()=>{const r={err:'',orph:0,shorts:0,linked:0,items:0};
  try{DB.plans.forEach(p=>delete p.up);DB.sess.forEach(s=>s.it.forEach(i=>delete i.pl));
   DB.kids.filter(k=>k.st==='dang').forEach(k=>{const T=gtTree(k.id);r.orph+=T.orph.length;r.shorts+=T.shorts.length;
    T.shorts.forEach(s=>{r.items+=s.gs.length});r.linked+=T.shorts.filter(s=>s.gs.length).length});
   S.modal={t:'hs',id:DB.kids.find(k=>kidPlans(k.id).length).id,tab:'kh'};render();
   progView(DB.kids[0],{parent:true})}catch(e){r.err=e.message}
  return r});
 ok('dữ liệu cũ (không up, pl): không lỗi, ngắn hạn thành nhóm chưa gắn, dòng buổi vẫn gắn theo mục tiêu trùng',E.err===''&&E.orph===E.shorts&&E.linked>0,E);
 await ev(()=>{S.modal=null;render()});

 /* ---------- E2. điện thoại 390px: các màn hình nhân viên mới không tràn ngang ---------- */
 await page.setViewportSize({width:390,height:844});
 const ovf=()=>ev(()=>[...document.querySelectorAll('#app *, .mdl *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&!e.closest('.tw,.side,.tabs,.sheet')&&getComputedStyle(e).position!=='fixed'}).slice(0,4).map(e=>e.tagName+'.'+String(e.className).slice(0,20)+' r='+Math.round(e.getBoundingClientRect().right)));
 await ev(id=>{S.modal=null;DB.plans.push({id:'L9',k:id,g:LIBI.filter(x=>x.d==='cy'&&x.s==='ab')[20].id,h:'d',s:'dang',from:TODAY,due:addD(TODAY,200),by:'x'});S.modal={t:'hs',id,tab:'kh'};render()},K.id);await W(120);
 ok('điện thoại: tab Kế hoạch mục tiêu (cây) không tràn ngang',(await ovf()).length===0,await ovf());
 await ev(id=>{ACT.senew(id);render()},K.id);await W(120);
 ok('điện thoại: form ghi buổi (có ô mục tiêu ngắn hạn) không tràn ngang',(await ovf()).length===0,await ovf());
 await ev(()=>{ACT.sepick('');render()});await W(120);
 ok('điện thoại: bộ chọn mục tiêu cho buổi không tràn ngang',(await ovf()).length===0,await ovf());
 await ev(id=>{S.modal=null;S.modal={t:'hs',id,tab:'kh'};render();ACT.pkopen(id);render()},K.id);await W(120);
 ok('điện thoại: bộ chọn mục tiêu cho kế hoạch (ô Thuộc mục tiêu dài hạn) không tràn ngang',(await ovf()).length===0,await ovf());
 await ev(id=>{S.modal=null;go('mt');S.bk={kid:id,hz:'n',up:'',sel:[]};render()},K.id);await W(120);
 ok('điện thoại: ngân hàng mục tiêu đã chọn bé (ô Thuộc mục tiêu dài hạn) không tràn ngang',(await ovf()).length===0,await ovf());
 await page.setViewportSize({width:1366,height:900});await ev(()=>{S.modal=null;render()});

 /* ---------- F. cổng phụ huynh: chữ lớn, dễ nhìn ---------- */
 const o2=await open();const p2=o2.page,ev2=(f,a)=>p2.evaluate(f,a);
 await ev2(()=>{setUser(demoAcc('ph'));render()});await p2.waitForSelector('.nav');
 await ev2(()=>{const k=myKids()[0];S.cp={tab:'tb',kid:k.id,m:WD.slice(0,7)};render()});await p2.waitForSelector('.gtp');
 const F=await ev2(()=>{const q=s=>document.querySelector(s),fs=s=>q(s)?parseFloat(getComputedStyle(q(s)).fontSize):0;
  return{long:document.querySelectorAll('.gtp').length,shorts:document.querySelectorAll('.gts').length,goals:document.querySelectorAll('.gtg li').length,
   t:fs('.gtp-t'),sh:fs('.gts-t b'),gn:fs('.gtg-n'),sub:fs('.gtg-s'),chipBig:fs('.gt-chip.big'),sumN:fs('.gt-n b'),help:fs('.gt-help'),
   chips:[...new Set([...document.querySelectorAll('.gt-chip')].map(e=>e.innerText.replace(/^\S\s*/,'').trim()))],
   bars:document.querySelectorAll('.gt-bar[role="img"]').length,pc:fs('.gt-pb b'),
   txt:document.querySelector('#main').innerText,first:(q('.card h2')||{}).innerText}});
 ok('phụ huynh: tab Tiến bộ mở đầu bằng thẻ "Mục tiêu của bé" với mục tiêu dài hạn, ngắn hạn, mục tiêu buổi',F.long>=1&&F.shorts>=1&&F.goals>=1&&/Mục tiêu của bé: bé đã đạt chưa\?/.test(F.txt),F);
 ok('chữ lớn: tên mục tiêu dài hạn ≥ 21px, ngắn hạn ≥ 18px, mục tiêu buổi ≥ 16px, ghi chú ≥ 15px, phần trăm ≥ 19px',F.t>=21&&F.sh>=18&&F.gn>=16&&F.sub>=15&&F.pc>=19&&F.chipBig>=16&&F.sumN>=30,F);
 ok('trạng thái viết bằng chữ tiếng Việt kèm biểu tượng (không chỉ màu), có chú giải cách tính đạt',F.chips.every(c=>['Đã đạt','Gần đạt','Đang tiến bộ','Cần luyện thêm','Sắp luyện'].includes(c))&&F.chips.length>=2&&/8\/10 lượt trở lên trong 3 buổi liên tiếp/.test(F.txt)&&F.bars>=F.long,F.chips);
 ok('thanh tiến độ có mô tả đọc được cho trình đọc màn hình',await ev2(()=>[...document.querySelectorAll('.gt-bar')].every(e=>/\d+%$/.test(e.getAttribute('aria-label')||''))));
 ok('không còn chữ nhỏ dưới 14px trong thẻ mục tiêu',await ev2(()=>[...document.querySelectorAll('.gt-card *')].filter(e=>e.children.length===0&&(e.textContent||'').trim()&&e.closest('.gt-card')).every(e=>parseFloat(getComputedStyle(e).fontSize)>=12.9)));
 await p2.screenshot({path:SP+'y6-parent-desktop.png',fullPage:false});
 await ev2(()=>{document.querySelector('.gt-card').scrollIntoView()});await p2.screenshot({path:SP+'y6-parent-card.png'});
 /* mục tiêu tạm dừng không hiện cho phụ huynh */
 const PZ=await ev2(()=>{const k=myKids()[0],p=kidPlans(k.id,'dang').find(x=>x.h==='n');p.s='tam';S.cp.tab='tb';render();const n=gName(p.g),hit=document.querySelector('#main').innerText.includes(n);p.s='dang';render();return{hit}});
 ok('mục tiêu đang tạm dừng không hiện ở cổng phụ huynh',PZ.hit===false,PZ);
 /* Tổng quan: bản gọn */
 await ev2(()=>{S.cp.tab='tq';render()});
 const M=await ev2(()=>({mini:document.querySelectorAll('.gtl .gtp').length,sum:!!document.querySelector('.gt-sum'),btn:!!document.querySelector('[data-a="cptab"][data-v="tb"]'),h:document.body.innerText.includes('Bé đã đạt mục tiêu chưa?')}));
 ok('trang Tổng quan: có tóm tắt đã đạt / đang tiến bộ / cần luyện thêm / sắp luyện và nút xem chi tiết',M.mini>=1&&M.sum&&M.btn&&M.h,M);
 await p2.screenshot({path:SP+'y6-parent-home.png'});
 /* PDF và báo cáo */
 const PD=await ev2(()=>{const k=myKids()[0],R=prRange('90'),P=progData(k.id,R.from,R.to),h=progBlocks(P,P,k,true,{tips:1,tree:1}),h2=progBlocks(P,P,k,true,{m:1});return{tree:/Mục tiêu của bé/.test(h)&&/class="gtp /.test(h),mo:/gtp/.test(h2),hasSessions:P.ss>0}});
 ok('PDF tiến bộ có phần Mục tiêu của bé; báo cáo tháng không chèn cây (cây tính đến hôm nay)',PD.tree&&!PD.mo&&PD.hasSessions,PD);
 /* điện thoại */
 await p2.setViewportSize({width:390,height:844});
 await ev2(()=>{S.cp.tab='tb';render();document.querySelector('.gt-card').scrollIntoView()});await p2.waitForTimeout(100);
 const MB=await ev2(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,over:[...document.querySelectorAll('.gt-card *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).length}));
 ok('điện thoại 390px: không tràn ngang',MB.sw<=MB.iw+1&&MB.over===0,MB);
 await p2.screenshot({path:SP+'y6-parent-phone.png'});
 /* bố cục khóa/bảo vệ vẫn hoạt động cùng cây mục tiêu */
 ok('lớp phủ truy vết vẫn còn trên trang mục tiêu',!!(await p2.$('#gmark')));
 /* độ tương phản chip trạng thái, sáng và tối */
 const CS=async pg=>pg.evaluate(()=>{const out={};['dat','tien','luyen','moi'].forEach(st=>{const h=document.createElement('span');h.className='gt-chip s-'+st;h.textContent='x';document.body.appendChild(h);const s=getComputedStyle(h);out[st]=[s.color,s.backgroundColor];h.remove();
   const i=document.createElement('span');i.className='gt-ic s-'+st;document.body.appendChild(i);const t=getComputedStyle(i);out[st+'i']=[t.color,t.backgroundColor];i.remove()});return out});
 const cl=await CS(p2);
 ok('tương phản chip/biểu tượng ≥ 4.5:1 (nền sáng)',Object.values(cl).every(([f,g])=>cr(f,g)>=4.5),Object.fromEntries(Object.entries(cl).map(([k,v])=>[k,cr(v[0],v[1]).toFixed(2)])));
 const o3=await open({dark:true});await o3.page.evaluate(()=>{setUser(demoAcc('ph'));render()});await o3.page.waitForSelector('.nav');
 await o3.page.evaluate(()=>{const k=myKids()[0];S.cp={tab:'tb',kid:k.id,m:WD.slice(0,7)};render()});await o3.page.waitForSelector('.gtp');
 const cd=await CS(o3.page);
 ok('tương phản chip/biểu tượng ≥ 4.5:1 (nền tối)',Object.values(cd).every(([f,g])=>cr(f,g)>=4.5),Object.fromEntries(Object.entries(cd).map(([k,v])=>[k,cr(v[0],v[1]).toFixed(2)])));
 await o3.page.evaluate(()=>document.querySelector('.gt-card').scrollIntoView());await o3.page.screenshot({path:SP+'y6-parent-dark.png'});
 ok('không lỗi script / console',errs.length===0&&o2.errs.length===0&&o3.errs.length===0,[...errs,...o2.errs,...o3.errs]);
 await b.close();await o2.b.close();await o3.b.close();
 console.log(`\n${passes} pass, ${fails} fail`);process.exit(fails?1:0)})();
