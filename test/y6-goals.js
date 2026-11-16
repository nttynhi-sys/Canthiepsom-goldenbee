/* Mục tiêu buổi ⇒ mục tiêu ngắn hạn (đã bỏ tầng dài hạn), nội dung SMART, mức hỗ trợ; báo cáo phụ huynh trực quan, chữ lớn */
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

 /* ---------- A. dữ liệu mẫu: chỉ còn hai tầng (mục tiêu buổi ⇒ mục tiêu ngắn hạn) ---------- */
 await login(page,'tt');
 const A=await ev(()=>{const r={kids:0,shorts:0,orph:0,items:0,itemsPl:0,badPl:0,badPct:0,longs:0};
  DB.kids.filter(k=>k.st==='dang').forEach(k=>{const ps=kidPlans(k.id);if(!ps.length)return;r.kids++;r.shorts+=ps.length;
   DB.sess.filter(s=>s.k===k.id).forEach(s=>s.it.forEach(i=>{r.items++;if(i.pl){r.itemsPl++;const p=planBy(i.pl);if(!p||p.k!==k.id)r.badPl++}}));
   const T=gtTree(k.id);if(T.shorts.some(n=>!(n.pct>=0&&n.pct<=100)))r.badPct++;
   r.longs+=T.longs.length;if(T.orph.length!==T.shorts.length||T.shorts.length!==ps.length)r.badPct+=100});
  return r});
 ok('dữ liệu mẫu: không còn tầng dài hạn, mọi kế hoạch hiện như mục tiêu ngắn hạn',A.shorts>0&&A.longs===0&&A.badPct===0,A);
 ok('dữ liệu mẫu: dòng mục tiêu trong buổi gắn vào mục tiêu ngắn hạn của chính bé đó',A.items>0&&A.itemsPl>0&&A.badPl===0,A);

 /* ---------- B. số liệu cuộn lên từ mục tiêu buổi ⇒ mục tiêu ngắn hạn ---------- */
 const K=await ev(()=>{const k=DB.kids.find(x=>x.st==='dang');
  const G=LIBI.filter(x=>x.d==='nd'&&x.s==='ab').slice(0,8).map(x=>x.id);
  DB.plans=DB.plans.filter(p=>p.k!==k.id);DB.sess=DB.sess.filter(s=>s.k!==k.id);
  const P=(id,g)=>DB.plans.push({id,k:k.id,g,h:'n',s:'dang',from:addD(TODAY,-60),due:addD(TODAY,200),by:'x'});
  P('S1',G[1]);P('S2',G[2]);P('S3',G[3]);
  let n=0;const S=(d,g,sup,tr,pl)=>DB.sess.push({id:'t'+(++n),k:k.id,date:addD(TODAY,-d),by:'x',st:'xong',dom:['nd'],it:[Object.assign({g,sup,tr},pl?{pl}:{})],note:'',home:''});
  S(20,G[1],'I','VVVVVVVVVV','S1');S(19,G[1],'I','VVVVVVVVVV','S1');S(18,G[1],'I','VVVVVVVVVV','S1');
  S(10,G[4],'GP','VVVVVVVVVV','S1');S(9,G[4],'GP','VVVVVVVVVV','S1');
  S(8,G[2],'MP','VVVVVVVVVV','S2');S(7,G[2],'GP','VVVVVVVVVV','S2');
  return{id:k.id,G}});
 const B=await ev(id=>{const T=gtTree(id),f=x=>T.shorts.find(s=>s.p.id===x);
  return{nL:T.longs.length,orph:T.orph.map(s=>s.p.id).sort(),s1:{st:f('S1').st,pct:f('S1').pct,total:f('S1').total,dn:f('S1').dn,ready:f('S1').ready},s2:{st:f('S2').st,pct:f('S2').pct},s3:{st:f('S3').st,pct:f('S3').pct}}},K.id);
 ok('không có mục tiêu dài hạn; S1, S2, S3 đều là mục tiêu ngắn hạn',B.nL===0&&B.orph.join()==='S1,S2,S3',B);
 ok('S1 có 2 mục tiêu buổi, 1 đã đạt, trạng thái đang tiến bộ, 83%',B.s1.total===2&&B.s1.dn===1&&B.s1.st==='tien'&&B.s1.pct===83&&!B.s1.ready,B.s1);
 ok('S2 cần luyện thêm (58%), S3 sắp luyện (0%)',B.s2.st==='luyen'&&B.s2.pct===58&&B.s3.st==='moi'&&B.s3.pct===0,[B.s2,B.s3]);
 const B2=await ev(id=>{const G=LIBI.filter(x=>x.d==='nd'&&x.s==='ab').slice(0,8).map(x=>x.id);
  [3,2,1].forEach((d,i)=>DB.sess.push({id:'u'+i,k:id,date:addD(TODAY,-d),by:'x',st:'xong',dom:['nd'],it:[{g:G[4],sup:'I',tr:'VVVVVVVVVV',pl:'S1'}],note:'',home:''}));
  const a=gtTree(id).shorts.find(s=>s.p.id==='S1');const r1={st:a.st,ready:a.ready,pct:a.pct};
  ACT.plok('S1');const s=gtTree(id).shorts.find(x=>x.p.id==='S1');
  return{r1,after:{st:s.st,pct:s.pct}}},K.id);
 ok('mọi mục tiêu buổi của S1 đã đạt ⇒ "Gần đạt" và đủ điều kiện, chưa tự đạt',B2.r1.st==='gan'&&B2.r1.ready&&B2.r1.pct===100,B2.r1);
 ok('nhân viên bấm đạt ⇒ S1 "Đã đạt" 100%',B2.after.st==='dat'&&B2.after.pct===100,B2);

 /* ---------- C. nhân viên: tab Kế hoạch mục tiêu chỉ còn mục tiêu ngắn hạn, có ô SMART ---------- */
 await ev(id=>{S.modal={t:'hs',id,tab:'kh'};render()},K.id);await page.waitForSelector('textarea[data-c="plsm"]');
 const C=await ev(()=>({text:document.body.innerText,sm:document.querySelectorAll('textarea[data-c="plsm"]').length,hz:!!document.querySelector('[data-a="plhz"],[data-a="plauto"],.gt-up')}));
 ok('tab Kế hoạch mục tiêu: không còn chữ "dài hạn", không còn nút chuyển hạn hay ô gắn dài hạn',!/dài hạn/i.test(C.text)&&!C.hz&&/Mục tiêu ngắn hạn/.test(C.text),C.text.slice(0,300));
 ok('mỗi mục tiêu ngắn hạn đang mở có ô nhập mục tiêu buổi theo SMART',C.sm>=2,C.sm);
 await page.fill('#sm-S1','Trong buổi này, bé gọi tên đúng 5/10 đồ vật khi cô chỉ tranh.');await page.dispatchEvent('#sm-S1','change');await W();
 ok('nhập SMART ở kế hoạch: lưu vào p.sm',await ev(()=>/5\/10 đồ vật/.test(planBy('S1').sm||'')));
 await page.fill('#sm-S1','');await page.dispatchEvent('#sm-S1','change');await W();
 ok('xóa trắng ô SMART: bỏ trường sm',await ev(()=>planBy('S1').sm===undefined));
 await ev(()=>{planBy('S2').sm='Bé nhìn cô khi gọi tên 8/10 lượt trong 1 buổi.'});
 await ev(()=>{ACT.pldel('S3');render()});await page.click('[data-a="askyes"]');await W();
 ok('bỏ mục tiêu: không còn S3',await ev(()=>!planBy('S3')));
 await ev(id=>{DB.plans.push({id:'S3',k:id,g:LIBI.filter(x=>x.d==='nd'&&x.s==='ab')[3].id,h:'n',s:'dang',from:addD(TODAY,-60),due:addD(TODAY,200),by:'x'});S.modal=null;render()},K.id);

 /* ---------- D. bộ chọn từ ngân hàng: không còn loại dài hạn; SMART đi theo mục tiêu ---------- */
 await ev(id=>{S.modal=null;ACT.pkopen(id);render()},K.id);await page.waitForSelector('#gp-sm');
 ok('bộ chọn cho kế hoạch: không còn ô loại mục tiêu / thuộc dài hạn, có ô SMART',await ev(()=>!document.querySelector('#gp-hz')&&!document.querySelector('#gp-up')&&!!document.querySelector('#gp-sm')));
 const newG=await ev(()=>{const g=LIBI.filter(x=>x.d==='nd'&&x.s==='ab')[10].id;S.modal.sel=[g];S.modal.sm='Bé chỉ đúng 4/5 hình khi nghe tên.';return g});
 await ev(()=>{ACT.gpok();render()});
 ok('thêm từ bộ chọn: mục tiêu ngắn hạn mới mang nội dung SMART',await ev(g=>{const p=DB.plans.find(x=>x.g===g);return !!p&&p.h==='n'&&!p.up&&p.sm==='Bé chỉ đúng 4/5 hình khi nghe tên.'},newG));
 /* mục tiêu tự viết */
 const TG=await ev(id=>{S.modal={t:'tg'};render();const f=document.querySelector('#tgf');
  return{lv:[...f.elements.lv.options].map(o=>o.value),sm:!!f.elements.sm}},K.id);
 ok('form tự viết mục tiêu: chỉ còn ngắn hạn và buổi trị liệu, có ô SMART',TG.lv.join()==='n,buoi'&&TG.sm,TG);
 await ev(id=>{const f=document.querySelector('#tgf');f.elements.k.value=id;f.elements.lv.value='n';f.elements.n.value='Trẻ gọi tên bạn khi bạn chào';f.elements.sm.value='Trong 10 lượt, bé gọi tên bạn đúng 6 lượt.';FORM.tgf(f)},K.id);
 ok('tự viết mục tiêu ngắn hạn: vào kế hoạch của bé kèm SMART',await ev(()=>{const t=DB.tg[DB.tg.length-1],p=DB.plans.find(x=>x.g==='tg:'+t.id);return !!p&&p.h==='n'&&/6 lượt/.test(p.sm||'')}));
 await ev(id=>{DB.plans=DB.plans.filter(p=>['S1','S2','S3'].includes(p.id));S.modal=null;render()},K.id);

 /* ---------- E. form ghi buổi: nội dung SMART cho từng mục tiêu buổi, mức hỗ trợ mới ---------- */
 await ev(id=>{ACT.senew(id);render()},K.id);await page.waitForSelector('.si-pl');
 const Dn=await ev(()=>({n:document.querySelectorAll('.si-pl').length,sg:[...document.querySelectorAll('textarea[data-c="sesg"]')].map(t=>t.value),sups:[...document.querySelector('.seg').querySelectorAll('.sg')].map(b=>b.textContent.trim()),chain:[...document.querySelectorAll('.gt-ch')].map(e=>e.innerText),text:document.body.innerText}));
 ok('form buổi: mỗi dòng có ô SMART; dòng của S2 được điền sẵn từ kế hoạch',Dn.n>=1&&Dn.sg.length===Dn.n&&Dn.sg.some(x=>/8\/10 lượt/.test(x)),Dn);
 ok('form buổi: không còn nhắc mục tiêu dài hạn',!/dài hạn/i.test(Dn.text)&&Dn.chain.every(t=>!/dài hạn/i.test(t)),Dn.chain);
 ok('mức hỗ trợ xếp FP, PP, MP, GP, Gợi nhắc bằng lời, Gợi nhắc hình ảnh, TG trễ, Ind',Dn.sups.join('|')==='FP|PP|MP|GP|Gợi nhắc bằng lời|Gợi nhắc hình ảnh|TG trễ|Ind',Dn.sups);
 await page.fill('textarea[data-c="sesg"] >> nth=0','Trong buổi, bé nhìn cô 8/10 lượt khi được gọi tên.');await page.dispatchEvent('textarea[data-c="sesg"] >> nth=0','change');
 await ev(()=>{S.modal.it[0].tr='VVVVVVVVVV';S.modal.it[0].sup='VP'});
 await page.click('[data-a="sesave"]');await W();
 const sv=await ev(id=>{const s=DB.sess.filter(x=>x.k===id&&!/^[tu]\d+$/.test(x.id)).pop();return{sg:s.it[0].sg,sup:s.it[0].sup,pl:s.it[0].pl,st:s.st}},K.id);
 ok('lưu buổi: giữ nội dung SMART, mức "Gợi nhắc bằng lời" và gắn mục tiêu ngắn hạn',/8\/10 lượt/.test(sv.sg||'')&&sv.sup==='VP'&&sv.pl&&sv.st==='xong',sv);
 const rs=await ev(id=>{const k=id;return{sc:recSc({tr:'VVVVVVVVVV',sup:'VP'}),vs:recSc({tr:'VVVVVVVVVV',sup:'VS'}),gp:recSc({tr:'VVVVVVVVVV',sup:'GP'}),td:recSc({tr:'VVVVVVVVVV',sup:'TD'}),band:[bandOf('VP'),bandOf('VS')]}},K.id);
 ok('điểm: GP 65 < Gợi nhắc bằng lời 72 < hình ảnh 78 < TG trễ 85; cả hai thuộc nhóm "Cần gợi ý"',rs.gp===65&&rs.sc===72&&rs.vs===78&&rs.td===85&&rs.band.join()==='1,1',rs);
 await ev(()=>{S.modal=null;render()});
 const Pk=await ev(id=>{const before=DB.plans.length;ACT.senew(id);render();
  const gn=LIBI.filter(x=>x.d==='nd'&&x.s==='ab')[14].id,gc=LIBI.filter(x=>x.d==='cy'&&x.s==='ab')[3].id;
  ACT.sepick('');S.modal.sel=[gn,gc];ACT.gpok();render();
  const it=S.modal.it.filter(i=>i.g===gn||i.g===gc);return{added:DB.plans.length-before,hs:it.map(i=>planBy(i.pl)&&planBy(i.pl).h)}},K.id);
 ok('bộ chọn cho buổi (tự chọn): tạo mục tiêu ngắn hạn cho lĩnh vực chưa có',Pk.added>=1&&Pk.hs.every(h=>h==='n'),Pk);
 await ev(()=>{ACT.seclose();render()});

 /* ---------- E1. tương thích dữ liệu cũ: kế hoạch h:'d', up, chưa có pl ---------- */
 const E=await ev(()=>{const r={err:'',orph:0,shorts:0,old:0};
  try{const p0=DB.plans[0];p0.h='d';p0.up='zzz';DB.sess.forEach(s=>s.it.forEach(i=>delete i.pl));
   DB.kids.filter(k=>k.st==='dang').forEach(k=>{const T=gtTree(k.id);r.orph+=T.orph.length;r.shorts+=T.shorts.length;r.old+=T.shorts.filter(s=>s.p.h==='d').length});
   S.modal={t:'hs',id:p0.k,tab:'kh'};render();progView(DB.kids[0],{parent:true})}catch(e){r.err=e.message}
  return r});
 ok('dữ liệu cũ (h:"d", up lạ, không pl): không lỗi, kế hoạch dài hạn cũ hiện như mục tiêu ngắn hạn',E.err===''&&E.orph===E.shorts&&E.old>=1,E);
 await ev(()=>{S.modal=null;render()});

 /* ---------- E2. điện thoại 390px ---------- */
 await page.setViewportSize({width:390,height:844});
 const ovf=()=>ev(()=>[...document.querySelectorAll('#app *, .mdl *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&!e.closest('.tw,.side,.tabs,.sheet')&&getComputedStyle(e).position!=='fixed'}).slice(0,4).map(e=>e.tagName+'.'+String(e.className).slice(0,20)+' r='+Math.round(e.getBoundingClientRect().right)));
 await ev(id=>{S.modal={t:'hs',id,tab:'kh'};render()},K.id);await W(120);
 ok('điện thoại: tab Kế hoạch mục tiêu không tràn ngang',(await ovf()).length===0,await ovf());
 await ev(id=>{ACT.senew(id);render()},K.id);await W(120);
 ok('điện thoại: form ghi buổi (8 mức hỗ trợ, ô SMART) không tràn ngang',(await ovf()).length===0,await ovf());
 await ev(()=>{ACT.sepick('');render()});await W(120);
 ok('điện thoại: bộ chọn mục tiêu cho buổi không tràn ngang',(await ovf()).length===0,await ovf());
 await ev(id=>{S.modal=null;S.modal={t:'hs',id,tab:'kh'};render();ACT.pkopen(id);render()},K.id);await W(120);
 ok('điện thoại: bộ chọn mục tiêu cho kế hoạch (ô SMART) không tràn ngang',(await ovf()).length===0,await ovf());
 await ev(id=>{S.modal=null;go('mt');S.bk={kid:id,sel:[]};render()},K.id);await W(120);
 ok('điện thoại: ngân hàng mục tiêu đã chọn bé không tràn ngang',(await ovf()).length===0,await ovf());
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
 ok('phụ huynh: tab Tiến bộ mở đầu bằng thẻ "Mục tiêu của bé" với mục tiêu ngắn hạn, mục tiêu buổi',F.long>=1&&F.shorts>=1&&F.goals>=1&&/Mục tiêu của bé: bé đã đạt chưa\?/.test(F.txt),F);
 ok('chữ lớn: ngắn hạn ≥ 18px, mục tiêu buổi ≥ 16px, ghi chú ≥ 15px, phần trăm ≥ 19px',F.sh>=18&&F.gn>=16&&F.sub>=15&&F.pc>=19&&F.sumN>=30,F);
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
