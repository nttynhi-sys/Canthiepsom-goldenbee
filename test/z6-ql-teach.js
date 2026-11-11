/* Z6: Quản lý (ql) cũng được phân giao dạy trẻ 1-1 và bán trú kèm 1-1 */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 const nav=async t=>{while(await page.$('.mdl [data-a="mx"]')){await page.click('.mdl [data-a="mx"]');await W(80)}await page.click('.nav button:has-text("'+t+'")');await W(150)};
 const toastTx=()=>ev(()=>{const t=document.querySelector('.toast,#toast');return t?t.textContent:''});
 await login(page,'ql');

 /* ---------- 1. Ai được phân giao dạy ---------- */
 const t1=await ev(()=>{
  /* thêm hai Quản lý nữa (một người để dạy 1-1, một người để phụ trách nhóm bán trú) */
  const base=DB.staff.find(s=>s.role==='ql');
  ['nv90','nv91'].forEach((id,i)=>DB.staff.push(Object.assign(JSON.parse(JSON.stringify(base)),{id,n:'Quản Lý Thử '+(i+1),pos:'Quản lý',em:'ql'+i+'@x.vn'})));
  const ids=a=>a.map(s=>s.id),P=pool11(),B=poolBt(),gvs=DB.staff.filter(s=>s.role==='gv'&&s.st==='dang');
  return{roles:['gv','ql','tt','vp','hc','ph'].map(r=>isTeacher({role:r})),none:isTeacher(null),
   pool:ids(P),poolBt:ids(B),
   qlInPool:['nv01','nv90','nv91'].every(i=>ids(P).includes(i)),qlInBt:['nv01','nv90','nv91'].every(i=>ids(B).includes(i)),
   gvInPool:gvs.filter(s=>!isGrStaff(s.id)).every(s=>ids(P).includes(s.id)),
   onlyTeach:P.every(s=>s.role==='gv'||s.role==='ql')&&B.every(s=>s.role==='gv'||s.role==='ql'),
   tt:DB.staff.filter(s=>s.role==='tt'||s.role==='vp'||s.role==='hc').some(s=>ids(P).includes(s.id)||ids(B).includes(s.id)),
   lbQl:tName(stBy('nv90')),lbGv:tName(gvs[0])===gvs[0].n}});
 ok('chỉ Giáo viên và Quản lý được coi là người dạy (Trưởng Trung tâm, Văn phòng, hành chính, phụ huynh thì không)',JSON.stringify(t1.roles)==='[true,true,false,false,false,false]'&&!t1.none,t1.roles);
 ok('Quản lý có trong danh sách chọn giáo viên 1-1 và giáo viên bán trú; giáo viên vẫn đủ',t1.qlInPool&&t1.qlInBt&&t1.gvInPool,t1);
 ok('hai danh sách chỉ gồm giáo viên và quản lý, không lẫn Trưởng Trung tâm hay Văn phòng',t1.onlyTeach&&!t1.tt,t1);
 ok('trong danh sách chọn, Quản lý có ghi chú "(Quản lý)", giáo viên giữ nguyên tên',/ \(Quản lý\)$/.test(t1.lbQl)&&t1.lbGv,t1);

 /* ---------- 2. Phân công: chuyển bé 1-1 sang Quản lý ---------- */
 await nav('Phân công');
 const pc=await ev(()=>{const k=DB.kids.find(k=>k.st==='dang'&&wk11(k.id)>0&&!reassign(k,'nv90',1));return k?{id:k.id,n:k.n,was:k.gv,ls:DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).length}:null});
 ok('tìm được bé 1-1 chuyển sang Quản lý không trùng giờ',pc&&pc.ls>0,pc);
 await page.fill('#pcq',pc.n);await W(120);
 const opt=await ev(id=>{const s=document.querySelector('#mv-'+id),f=document.querySelector('#pcg');
  return{mv:s?[...s.options].filter(o=>o.value==='nv90').map(o=>o.textContent):null,flt:f?[...f.options].filter(o=>o.value==='nv90').map(o=>o.textContent):null}},pc.id);
 ok('Phân công → Giáo viên 1-1: Quản lý hiện ở ô chuyển giáo viên và ô lọc, có ghi chú "(Quản lý)"',opt.mv&&opt.mv.length===1&&/Quản lý\)/.test(opt.mv[0])&&opt.flt&&opt.flt.length===1,opt);
 await page.selectOption('#mv-'+pc.id,'nv90');await W(80);
 await page.click('[data-a="askyes"]');await W(120);
 const mv=await ev(id=>{const k=kidBy(id),ls=DB.lich.filter(l=>l.type==='11'&&l.hs===id);return{gv:k.gv,all:ls.length>0&&ls.every(l=>l.gv==='nv90'),code:kcode(k)}},pc.id);
 ok('chuyển bé sang Quản lý: giáo viên chính của bé và mọi buổi 1-1 cố định đều là Quản lý đó',mv.gv==='nv90'&&mv.all,mv);

 /* ---------- 3. Hồ sơ bé mới: chỉ 1-1 (CN) và bán trú kèm 1-1 (BT) do Quản lý dạy ---------- */
 const slots=await ev(()=>{const fr=(w,s,g)=>ROOMS.some(r=>!conflict({day:w,slot:s,gv:g,hs:'hsX',room:r})),rs=[...SLOTS].reverse();
  const A=rs.find(s=>fr(1,s,'nv01')&&fr(3,s,'nv01')),C=rs.find(s=>s!==A&&Math.abs(tmin(s)-tmin(A))>=SLOT_MIN&&fr(2,s,'nv01')&&fr(4,s,'nv01'));return{A,C}});
 ok('tìm được khung giờ trống của Quản lý để xếp bé mới',slots.A&&slots.C,slots);
 const fill=async(name,h11,hbt,days,slot,bd)=>{
  await nav('Học sinh');await page.click('[data-a="hsnew"]');await page.waitForSelector('#hsff');
  await page.fill('#hf-n',name);await page.fill('#hf-pn','Phụ huynh thử');await page.fill('#hf-pp','0905123456');
  if(hbt)await page.check('#hf-hbt');if(h11)await page.check('#hf-h11');await W(40);
  const opts=await ev(()=>[...document.querySelector('#hf-gv').options].filter(o=>o.value==='nv01').map(o=>o.textContent));
  await page.selectOption('#hf-gv','nv01');
  await ev(([days,slot,bd])=>{const f=document.querySelector('#hsff');if(f.elements.lt_ng){f.elements.lt_ng.checked=true;f.elements.lq_ng.value=1}
   if(days&&days.length){const rs=[...f.querySelectorAll('#s11 .s11r')];rs.forEach(r=>r.remove());days.forEach(w=>{ACT.s11add(null,f.querySelector('#hth-11 [data-a="s11add"]'));const all=f.querySelectorAll('#s11 .s11r'),r=all[all.length-1];r.querySelector('[name=s11day]').value=w;r.querySelector('[name=s11lt]').value='ng';r.querySelector('[name=s11tm]').value=slot})}
   if(bd)[1,2,3,4,5,6].forEach(w=>{f.elements['bd'+w].checked=bd.includes(w)})},[days,slot,bd]);
  await page.click('#hsff button[type=submit]');await W(150);return opts};
 const o1=await fill('Bé Thử Chỉ 1-1',true,false,[1,3],slots.A,null);
 const cn=await ev(()=>{const k=DB.kids.find(x=>x.n==='Bé Thử Chỉ 1-1'),ls=k?DB.lich.filter(l=>l.type==='11'&&l.hs===k.id):[];return k?{id:k.id,bt:!!k.bt,gv:k.gv,n:ls.length,all:ls.length>0&&ls.every(l=>l.gv==='nv01'&&l.room),code:kcode(k)}:null});
 ok('ô giáo viên trong form thêm bé có Quản lý (ghi chú "(Quản lý)")',o1.length===1&&/Quản lý\)/.test(o1[0]),o1);
 ok('bé chỉ học 1-1 giao cho Quản lý: lưu đủ 2 buổi, mã dạng HSnn-CN, giáo viên là Quản lý',cn&&!cn.bt&&cn.gv==='nv01'&&cn.n===2&&cn.all&&/-CN$/.test(cn.code),cn||await toastTx());
 const o2=await fill('Bé Thử Bán Trú',true,true,[2,4],slots.C,[1,2,3,4,5]);
 const bt=await ev(()=>{const k=DB.kids.find(x=>x.n==='Bé Thử Bán Trú'),ls=k?DB.lich.filter(l=>l.type==='11'&&l.hs===k.id):[];return k?{id:k.id,bt:!!k.bt,gr:k.gr,gv:k.gv,n:ls.length,all:ls.length>0&&ls.every(l=>l.gv==='nv01'),code:kcode(k)}:null});
 ok('bé bán trú kèm 1-1 giao cho Quản lý: vào lớp bán trú, 1-1 do Quản lý dạy, mã dạng HSnn-BT',bt&&bt.bt&&!!bt.gr&&bt.gv==='nv01'&&bt.n>=1&&bt.all&&/-BT$/.test(bt.code),bt||await toastTx());
 const dup=await ev(()=>{const a=DB.kids.map(k=>k.id);return a.length===new Set(a).size});
 ok('mã bé mới nối tiếp, không trùng nhau',dup);

 /* ---------- 4. Lịch học, điểm danh, bộ lọc ---------- */
 await nav('Lịch học');
 const lh=await ev(()=>({sel:document.querySelector('#lhg')?document.querySelector('#lhg').value:null,txt:[...(document.querySelector('#lhg')||{options:[]}).options].filter(o=>o.value==='nv01').map(o=>o.textContent),n:document.querySelectorAll('.ls:not(.add)').length,def:S.lh.gv}));
 ok('Lịch học: Quản lý đang dạy được chọn mặc định là chính mình và thấy các buổi của mình',lh.sel==='nv01'&&lh.n>=2&&lh.txt.length===1,lh);
 await nav('Điểm danh');await page.click('button:has-text("Điểm danh theo ngày")');await W(150);
 const dd=await ev(()=>[...(document.querySelector('#dd-g')||{options:[]}).options].filter(o=>o.value==='nv01').length);
 ok('Điểm danh: bộ lọc giáo viên có Quản lý',dd===1,dd);
 await nav('Học sinh');
 const hs=await ev(()=>[...(document.querySelector('#hs3')||{options:[]}).options].filter(o=>o.value==='nv01').length);
 ok('Học sinh: bộ lọc giáo viên có Quản lý',hs===1,hs);
 await page.click('.tabs [data-v="bi"], [data-a="hstab"][data-v="bi"]').catch(()=>{});await W(120);
 const bi=await ev(()=>[...(document.querySelector('#bi-g')||{options:[]}).options].filter(o=>o.value==='nv01').length);
 ok('Buổi can thiệp: bộ lọc giáo viên có Quản lý',bi===1,bi);

 /* ---------- 5. Nhóm bán trú: Quản lý phụ trách nhóm ---------- */
 await nav('Phân công');await page.click('[data-a="pctab"][data-v="bt"]');await W(120);
 const g=await ev(()=>({gv:DB.groups[0].gv,tg:DB.groups[0].tg,opt:[...document.querySelectorAll('#g-G1-gv option')].filter(o=>o.value==='nv91').map(o=>o.textContent)}));
 ok('Phân công → Nhóm bán trú: Quản lý có trong ô giáo viên chính, có ghi chú "(Quản lý)"',g.opt.length===1&&/Quản lý\)/.test(g.opt[0]),g);
 await page.selectOption('#g-G1-gv','nv91');await W(100);
 const g2=await ev(()=>({gv:DB.groups[0].gv,grp:isGrStaff('nv91'),in11:pool11().some(s=>s.id==='nv91')}));
 ok('Quản lý được giao làm giáo viên chính nhóm bán trú; người phụ trách nhóm không bị xếp thêm 1-1 (quy tắc cũ giữ nguyên)',g2.gv==='nv91'&&g2.grp&&!g2.in11,g2);

 /* ---------- 6. Lương và chấm công tính theo ca dạy ---------- */
 const pay=await ev(()=>{const q=stBy('nv01');q.pay=Object.assign({},q.pay,{mode:'kethop',base:0,rate:60000,rateBt:0,allow:0,bh:0,latePen:0});
  const m=sm(CM,-1),k=DB.kids.find(x=>x.n==='Bé Thử Chỉ 1-1'),l=DB.lich.find(x=>x.type==='11'&&x.hs===k.id),d=mDates(m).filter(isW).find(x=>dow(x)===l.day);
  DB.att[d+'|'+l.id+'|'+k.id]='cm';DB.ts['nv01|'+d]={i:'07:30',o:'17:00'};const p=payroll(q,m);
  return{d,teach:p.teach,bySess:p.bySess}});
 ok('Quản lý tính lương theo ca 1-1 như giáo viên (1 ca có mặt × 60.000 ₫)',pay.teach>=1&&pay.bySess>=60000,pay);
 const money=await ev(()=>({canMoney:canMoney(),slip:slipOK('nv01'),tl:VIEWS.tl().includes('không dành cho vai trò')}));
 ok('Quản lý vẫn không xem được dữ liệu tiền (quyền không đổi)',!money.canMoney&&!money.slip&&money.tl,money);

 /* ---------- 7. Thống kê, đếm giáo viên ---------- */
 const cnt=await ev(()=>{const at=activeTeachers(),ids=at.map(s=>s.id);return{ql:ids.filter(i=>stBy(i).role==='ql'),has01:ids.includes('nv01'),has90:ids.includes('nv90'),noTeachQl:at.every(s=>s.role==='gv'||teachesNow(s.id))}});
 ok('đếm "giáo viên và trợ giảng": chỉ tính Quản lý đang thực sự dạy',cnt.has01&&cnt.has90&&cnt.noTeachQl,cnt);
 await ev(()=>{DB.staff=DB.staff.filter(s=>s.id!=='nv90'&&s.id!=='nv91')});

 ok('không lỗi JS khi chạy',errs.length===0,errs);
 console.log(passes+' PASS, '+fails+' FAIL');
 await b.close();process.exit(fails?1:0);
})().catch(e=>{console.log('FAIL exception',e.message);process.exit(1)});
