/* Z48: lịch Chủ nhật. Chủ nhật chỉ xếp được ca 1-1 hằng tuần và buổi học bù; bán trú, thực đơn, ngày nghỉ lễ vẫn T2–T7.
   Học phí mỗi ca 1-1 Chủ nhật tính như ngày thường; lương theo ca tính cho giáo viên dạy; lương cố định không tính thêm công và không chấm công.
   Dữ liệu đã nhập trước đó (ca T2–T7) không đổi. */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 await login(page,'tt');

 /* chọn người và bé dùng cho bài thử, tính ngày theo đồng hồ hiện tại (không phụ thuộc hôm nay là thứ mấy) */
 const P=await ev(()=>{
  const mine=s=>isTeacher(s)&&s.st==='dang';
  const T=DB.staff.filter(s=>mine(s)&&!isGrStaff(s.id)&&s.pay&&s.pay.mode==='buoi'&&s.pay.rate>0);
  const TF=DB.staff.find(s=>mine(s)&&s.pay&&s.pay.mode==='thang'),GT=DB.groups.map(g=>grTs(g)[0]).find(Boolean);
  const early=sm(CM,-1)+'-01',free=DB.kids.filter(k=>k.st==='dang'&&k.sd<early&&!k.bt);
  const bt=DB.kids.find(k=>k.st==='dang'&&k.sd<early&&k.bt&&btOf(k).length);
  let ls=TODAY;while(dow(ls)!==0||!(ls<WD&&ls<=TODAY))ls=addD(ls,-1);   /* Chủ nhật gần nhất đã qua và trước ngày làm việc gần nhất */
  let ns=addD(TODAY,1);while(dow(ns)!==0)ns=addD(ns,1);                /* Chủ nhật sắp tới */
  return{T1:T[0].id,T2:T[1].id,T3:T[2].id,rate:T[0].pay.rate,TF:TF.id,GT,K:free[0].id,K2:free[1].id,K3:bt.id,ls,ns,mls:ls.slice(0,7),mns:ns.slice(0,7),sat:addD(ls,-1),mon:monOf(ls)}});
 const {T1,T2,T3,TF,GT,K,K2,K3,ls,ns,mls,mns,sat}=P;

 /* 0. nền: Chủ nhật vẫn không phải ngày công; DAY_ALL (bán trú, thời khóa biểu) vẫn T2–T7; DAY_11 thêm Chủ nhật ở cuối */
 const base=await ev(([ls,K,K3,T1,TF])=>({isW:isW(ls),isSch:isSch(ls),all:DAY_ALL.join(),d11:DAY_11.join(),bt:DAY_BT.join(),
  inv:invoice(kidBy(K),CM),inv3:invoice(kidBy(K3),CM),dl:dayList(ls).length,p:payroll(stBy(T1),CM),pf:payroll(stBy(TF),CM),
  planBt3:sched(kidBy(K3),CM).filter(x=>x.kind==='bt').length}),[ls,K,K3,T1,TF]);
 ok('Chủ nhật vẫn không phải ngày làm việc (isW), chưa có ca nào nên chưa là ngày có lịch',base.isW===false&&base.isSch===false&&base.dl===0,base);
 ok('DAY_ALL và DAY_BT giữ nguyên, DAY_11 thêm Chủ nhật',base.all==='1,2,3,4,5,6'&&base.bt==='1,2,3,4,5'&&base.d11==='1,2,3,4,5,6,0',base);

 /* 1. điểm danh: chưa có ca Chủ nhật thì "Ngày sau" từ thứ Bảy nhảy qua Chủ nhật như cũ */
 const skip=await ev(([sat])=>{S.dd=Object.assign(S.dd||{},{date:sat});ACT.ddday('1');return S.dd.date},[sat]);
 ok('chưa có ca Chủ nhật: "Ngày sau" từ thứ Bảy nhảy sang thứ Hai',skip===addDays(sat,2),{skip,sat});
 function addDays(d,n){const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}

 /* 2. lưới Lịch 1-1 theo tuần: người quản lý xem theo giáo viên luôn thấy cột Chủ nhật, thêm ca bằng biểu mẫu */
 await ev(([T1,wk])=>{go('lh');render();S.lh.tab='wk';S.lh.mode='gv';S.lh.gv=T1;S.lh.wk=wk;render()},[T1,P.mon]);await W(120);
 let g=await ev(()=>({th:[...document.querySelectorAll('#main table.wkt thead th')].map(t=>t.innerText.replace(/\s+/g,' ').trim()),rng:document.querySelector('#main .acts b').textContent}));
 ok('lưới tuần có 7 cột ngày, cột cuối là Chủ nhật',g.th.length===8&&/^Chủ nhật/.test(g.th[7])&&/^Thứ Hai/.test(g.th[1]),g.th);
 ok('khoảng ngày của tuần kết thúc ở Chủ nhật',g.rng.endsWith(ls.split('-').reverse().join('/')),g);
 await ev(()=>document.querySelector('#main [data-a="lsadd"][data-v="1|"]').click());await page.waitForSelector('#lsf');
 const opt=await ev(()=>[...document.querySelectorAll('#ls-d option')].map(o=>o.value+':'+o.textContent));
 ok('biểu mẫu thêm ca có đủ 7 lựa chọn, Chủ nhật ở cuối',opt.length===7&&opt[6]==='0:Chủ nhật'&&opt[0]==='1:Thứ Hai',opt);
 await ev(([K])=>{const f=document.querySelector('#lsf');f.elements.day.value='0';f.elements.hs.value=K;f.elements.slot.value='09:05'},[K]);
 await page.click('#lsf button[type=submit]');await W(150);
 const l1=await ev(([T1,K])=>DB.lich.find(l=>l.gv===T1&&l.hs===K&&l.day===0),[T1,K]);
 ok('lưu được ca 1-1 Chủ nhật (day 0, đúng giáo viên, bé, giờ)',!!l1&&l1.type==='11'&&l1.slot==='09:05',l1);
 g=await ev(()=>{const c=[...document.querySelectorAll('#main table.wkt tbody tr:first-child td')];return{n:c.length,last:c[c.length-1]&&c[c.length-1].innerText}});
 ok('ca hiện ở ô Chủ nhật của lưới',g.n===7&&/\S/.test(g.last||''),g);
 ok('Chủ nhật bây giờ là ngày có lịch, vẫn không phải ngày công',await ev(ls=>isSch(ls)&&!isW(ls)&&tsSt('nv01',ls)==='',ls));
 /* người xem không thể thêm ca (giáo viên) chỉ thấy cột Chủ nhật khi bản thân có ca Chủ nhật */
 const sunCols=await ev(([T2,K])=>{const r=[];['gv','kid','all'].forEach(m=>{S.lh.mode=m;S.lh.gv=T2;S.lh.kid=K;const h=lhWeek(S.lh);r.push(m+':'+/Chủ nhật/.test(h))});return r.join(' ')},[T2,K]);
 ok('theo giáo viên khác không có ca Chủ nhật: người quản lý vẫn có cột để xếp ca; xem theo bé có ca và tổng hợp có cột',sunCols==='gv:true kid:true all:true',sunCols);
 const noSun=await ev(([T2,K2])=>{const keep=U;U=Object.assign({},U,{role:'gv'});S.lh.mode='gv';S.lh.gv=T2;const a=/Chủ nhật/.test(lhWeek(S.lh));U=keep;
  const sv=DB.lich.slice();DB.lich=DB.lich.filter(l=>l.day!==0);S.lh.mode='kid';S.lh.kid=K2;const b=/Chủ nhật/.test(lhWeek(S.lh));DB.lich=sv;return[a,b]},[T2,K2]);
 ok('giáo viên không có ca Chủ nhật và bé không có ca Chủ nhật: không hiện cột Chủ nhật (giao diện cũ giữ nguyên)',noSun[0]===false&&noSun[1]===false,noSun);

 /* 3. trùng lịch: giáo viên và bé như ngày thường; giáo viên bán trú không bị chặn vào Chủ nhật */
 const cf=await ev(([T1,T2,K,K2,GT])=>({
  gv:conflict({day:0,slot:'09:20',gv:T1,hs:K2}),kid:conflict({day:0,slot:'09:20',gv:T2,hs:K}),
  far:conflict({day:0,slot:'10:00',gv:T1,hs:K2}),grp:conflict({day:0,slot:'09:05',gv:GT,hs:K2})}),[T1,T2,K,K2,GT]);
 ok('trùng giờ cùng giáo viên và cùng bé vẫn bị chặn; giờ cách ≥50 phút thì được',/Giáo viên đã có buổi khác/.test(cf.gv)&&/Trẻ đã có buổi khác/.test(cf.kid)&&cf.far==='',cf);
 ok('giáo viên bán trú không bị chặn vào Chủ nhật (lớp bán trú không học Chủ nhật)',cf.grp==='',cf);

 /* 4. học phí: mỗi ca 1-1 Chủ nhật tính riêng như ngày thường; bán trú không đổi */
 const fee=await ev(([K,K3,T1,mls])=>{const k=kidBy(K),sid=DB.lich.find(l=>l.hs===K&&l.day===0).id;
  const nSun=m=>mDates(m).filter(d=>dow(d)===0&&!isClosed(d)).length,out={};
  [CM,sm(CM,-1)].forEach(m=>{const xs=sched(k,m).filter(x=>dow(x.d)===0);out[m]={n:xs.length,exp:nSun(m),kinds:[...new Set(xs.map(x=>x.kind))].join(),inc:xs.some(x=>x.inc),inv:invoice(k,m),fee:feeSlot(k,sid)}});
  return out},[K,K3,T1,mls]);
 const [m0,m1]=await ev(()=>[CM,sm(CM,-1)]);
 ok('sched của bé có đúng một ca ở mỗi Chủ nhật trong tháng, loại 1-1, không nằm trong gói',fee[m0].n===fee[m0].exp&&fee[m1].n===fee[m1].exp&&fee[m0].n>0&&fee[m0].kinds==='11'&&!fee[m0].inc,fee);
 ok('học phí tăng đúng số Chủ nhật × giá ca (như ngày thường)',fee[m0].inv-base.inv===fee[m0].n*fee[m0].fee&&fee[m0].fee>0,{fee,base:base.inv});
 const CMv=m0;
 const bt3=await ev(([K3,T2,m])=>{const k=kidBy(K3),b=sched(k,m).filter(x=>x.kind==='bt').length,i0=invoice(k,m);
  const l={id:'lz48b',type:'11',day:0,slot:'11:00',gv:T2,hs:K3,lt:null};DB.lich.push(l);const x=sched(k,m).filter(y=>dow(y.d)===0),i1=invoice(k,m),fs=feeSlot(k,l.id),nb=sched(k,m).filter(x=>x.kind==='bt').length;DB.lich=DB.lich.filter(y=>y!==l);
  return{b,nb,n:x.length,inc:x.some(y=>y.inc),delta:i1-i0,fs,i2:invoice(k,m)===i0}},[K3,T2,CMv]);
 ok('bé bán trú: ca Chủ nhật tính riêng (không thuộc gói), số ngày bán trú không đổi',bt3.b===bt3.nb&&bt3.b===base.planBt3&&bt3.n>0&&!bt3.inc&&bt3.delta===bt3.n*bt3.fs&&bt3.i2,bt3);

 /* 5. điểm danh Chủ nhật */
 const dd=await ev(([ls,K,sat])=>{S.dd=Object.assign(S.dd||{},{date:sat});ACT.ddday('1');const a=S.dd.date;ACT.ddday('1');const b=S.dd.date;
  S.dd.date=ls;S.dd.tab='roll';go('dd');render();return{a,b,list:dayList(ls).map(s=>s.kind+'|'+s.kids[0].id)}},[ls,K,sat]);
 await W(120);
 ok('"Ngày sau" từ thứ Bảy dừng ở Chủ nhật có ca, lần nữa sang thứ Hai',dd.a===ls&&dd.b===addDays(ls,1),dd);
 ok('danh sách ngày Chủ nhật chỉ có ca 1-1 (không có lớp bán trú)',dd.list.length>=1&&dd.list.every(x=>x.startsWith('11|'))&&dd.list.includes('11|'+K),dd.list);
 const roll=await ev(K=>({txt:document.querySelector('#main').innerText,k:kidBy(K).n,btn:document.querySelectorAll('#main .stb .st').length}),K);
 ok('màn Điểm danh hiện bé và nút trạng thái cho ngày Chủ nhật',roll.txt.includes(roll.k)&&roll.btn>0&&!/Chủ nhật không có buổi/.test(roll.txt),roll.txt.slice(0,200));
 const lid=l1.id;
 await ev(([ls,lid,K])=>ACT.att(ls+'|'+lid+'|'+K+'|cm'),[ls,lid,K]);
 const st=await ev(([K,ls,mls])=>{const r=settle(kidBy(K),mls);return{att:DB.att[ls+'|'+DB.lich.find(l=>l.hs===K&&l.day===0).id+'|'+K],cm:r.cm,cell:(r.cells[ls]||[]).join()}},[K,ls,mls]);
 ok('ghi có mặt Chủ nhật: tính vào số buổi có mặt và hiện ký hiệu ở bảng chấm công học sinh',st.att==='cm'&&st.cm>=1&&st.cell==='x',st);
 const cell=await ev(([K,ls])=>{S.dd.tab='sheet';S.dd.m=ls.slice(0,7);S.dd.kid='';S.dd.q='';render();return cellH(kidBy(K),settle(kidBy(K),ls.slice(0,7)),ls)},[K,ls]);
 ok('bảng chấm công học sinh: ô Chủ nhật có ca hiện nút, Chủ nhật không có ca vẫn trống',/dcell/.test(cell),cell);
 ok('ô Chủ nhật không có ca vẫn là ô trống',await ev(([K,ls])=>{const d=addD(ls,-7),k=kidBy(K);const sv=DB.lich.slice();DB.lich=DB.lich.filter(l=>l.day!==0);const h=cellH(k,settle(k,d.slice(0,7)),d);DB.lich=sv;return h==='<td class="dc sun"></td>'},[K,ls]));

 /* 6. lương: ca Chủ nhật tính theo ca cho người dạy, không tính ngày công; lương cố định không tăng */
 const ref=await ev(([T1,ls,mls,K])=>{const sv=DB.lich.slice(),att=Object.assign({},DB.att),s=stBy(T1);
  const key=ls+'|'+DB.lich.find(l=>l.gv===T1&&l.day===0).id+'|'+K;const on=payroll(s,mls);delete DB.att[key];const off=payroll(s,mls);DB.att[key]='cm';return{on:[on.teach,on.cong,on.btd,on.late,on.abs,on.byDay,on.bySess,on.gross],off:[off.teach,off.cong,off.btd,off.late,off.abs,off.byDay,off.bySess,off.gross]}},[T1,ls,mls,K]);
 ok('ca Chủ nhật đã dạy: số ca +1 và tiền theo ca +1 mức giá; công, đi muộn, vắng, ngày bán trú không đổi',ref.on[0]-ref.off[0]===1&&Math.round(ref.on[6]-ref.off[6])===P.rate&&ref.on[1]===ref.off[1]&&ref.on[2]===ref.off[2]&&ref.on[3]===ref.off[3]&&ref.on[4]===ref.off[4]&&ref.on[5]===ref.off[5],ref);
 const tf=await ev(([TF,K2,ls,mls])=>{const s=stBy(TF),a=payroll(s,mls),l={id:'lz48f',type:'11',day:0,slot:'13:00',gv:TF,hs:K2,lt:null};DB.lich.push(l);DB.att[ls+'|lz48f|'+K2]='cm';
  const c=payroll(s,mls);delete DB.att[ls+'|lz48f|'+K2];DB.lich=DB.lich.filter(x=>x!==l);return{gross:[a.gross,c.gross],cong:[a.cong,c.cong],net:[a.net,c.net],sess:[a.bySess,c.bySess],mode:s.pay.mode}},[TF,K2,ls,mls]);
 ok('nhân sự lương cố định tháng: dạy ca Chủ nhật không tăng lương, không tăng công',tf.mode==='thang'&&tf.gross[0]===tf.gross[1]&&tf.net[0]===tf.net[1]&&tf.cong[0]===tf.cong[1]&&tf.sess[0]===tf.sess[1],tf);
 const nc=await ev(([T1,ls])=>({ts:tsSt(T1,ls),can:needCC(stBy(T1)),open:isW(ls)&&!isClosed(ls)}),[T1,ls]);
 ok('Chủ nhật không có chấm công cho nhân sự',nc.ts===''&&nc.open===false,nc);

 /* 7. học bù Chủ nhật và giờ trống */
 const hb=await ev(([T1,T3,K2,ns,mns])=>{const sun=a=>a.some(x=>dow(x.date)===0);
  const f1=freeSlots(T1,K2,TODAY,40),f3=freeSlots(T3,K2,TODAY,40),conf=conflict({date:ns,slot:'10:30',gv:T1,hs:K2});
  const l={id:'lz48h',type:'bu',date:ns,slot:'10:30',gv:T1,hs:K2};DB.lich.push(l);
  const sc=sched(kidBy(K2),mns).filter(x=>x.d===ns&&x.kind==='bu').length,dl=dayList(ns).filter(s=>s.kind==='bu'&&s.kids[0].id===K2).length,sch=isSch(ns);
  DB.lich=DB.lich.filter(x=>x!==l);return{s1:sun(f1),s3:sun(f3),conf,sc,dl,sch}},[T1,T3,K2,ns,mns]);
 ok('giờ trống học bù gợi ý Chủ nhật cho giáo viên có ca Chủ nhật, không gợi ý cho giáo viên khác',hb.s1===true&&hb.s3===false,hb);
 ok('buổi học bù Chủ nhật: không trùng thì xếp được, hiện trong lịch của bé và danh sách ngày',hb.conf===''&&hb.sc===1&&hb.dl===1&&hb.sch===true,hb);

 /* 8. giáo viên nghỉ phép: ca Chủ nhật trong thời gian nghỉ cũng được ghi Trung tâm/GV nghỉ */
 const lv=await ev(([T1,K,ns])=>{const id=DB.lich.find(l=>l.gv===T1&&l.day===0).id,n=applyLeave({f:addD(ns,-1),t:addD(ns,1),st:T1});
  return{n,att:DB.att[ns+'|'+id+'|'+K],mk:DB.mk.some(r=>r.hs===K&&r.from.d===ns&&r.from.sid===id)}},[T1,K,ns]);
 ok('duyệt đơn nghỉ của giáo viên: ca Chủ nhật được ghi Trung tâm/GV nghỉ và tạo yêu cầu học bù',lv.att==='tt'&&lv.mk===true&&lv.n>=1,lv);

 /* 9. bán trú, thực đơn, ngày nghỉ lễ không đổi */
 const un=await ev(([ls,K,ns])=>({grp:DB.groups.some(g=>grOpen(g,0)),bday:dow(bday(ls)),holSun:holIn(ls.slice(0,7)).some(h=>dow(h.d)===0),
  boxes:(dayBoxes('bd',[1]).match(/<input/g)||[]).length,cn:/>CN</.test(dayBoxes('bd',[1])),btDay:dayList(ls).some(s=>s.kind==='bt'),
  daysTx:dayTx([1,2,3,4,5,6])}),[ls,K,ns]);
 ok('bán trú không mở Chủ nhật, thực đơn Chủ nhật chuyển sang thứ Hai, chọn ngày bán trú vẫn T2–T7',un.grp===false&&un.bday===1&&un.holSun===false&&un.boxes===6&&un.cn===false&&un.btDay===false,un);

 /* 10. hồ sơ bé: Chủ nhật hiện ở nút chọn ngày và danh sách ca; nút chọn nhanh không làm mất ca Chủ nhật; lưu không đổi gì */
 const before=await ev(K=>JSON.stringify(DB.lich.filter(l=>l.type==='11'&&l.hs===K).map(l=>[l.id,l.day,l.slot,l.gv,l.lt||null]).sort()),K);
 await ev(K=>{S.modal={t:'hsf',id:K};render()},K);await page.waitForSelector('#hsff');await W(80);
 const f=await ev(()=>({btn:[...document.querySelectorAll('#s11d input[data-s11w]')].map(c=>c.dataset.s11w+(c.checked?'*':'')).join(),
  rows:[...document.querySelectorAll('#s11 .s11r [name=s11day]')].map(s=>s.value).join(),opts:[...document.querySelectorAll('#s11 .s11r:first-child [name=s11day] option')].map(o=>o.value).join(),lbl:[...document.querySelectorAll('#s11d .bpk span')].map(s=>s.textContent).join()}));
 ok('hồ sơ bé: nút ngày 1-1 T2–T7 rồi CN, CN đang chọn; danh sách ca đặt CN cuối; ô chọn ngày của ca có CN',f.btn.endsWith(',0*')&&f.btn.startsWith('1')&&f.lbl.endsWith('CN')&&f.rows.endsWith(',0')&&f.opts==='1,2,3,4,5,6,0',f);
 const q=await ev(()=>{const sunGone=()=>[...document.querySelectorAll('#s11 .s11r')].some(r=>r.querySelector('[name=s11day]').value==='0'&&r.classList.contains('gone')),click=v=>document.querySelector('[data-a="s11days"][data-v="'+v+'"]').click(),o={};
  click('1,2,3,4,5');o.t6=sunGone();click('1,2,3,4,5,6');o.t7=sunGone();click('');o.none=sunGone();return o});
 ok('nút T2–T6 và T2–T7 giữ ca Chủ nhật đang có; chỉ "Bỏ chọn" mới đánh dấu bỏ',q.t6===false&&q.t7===false&&q.none===true,q);
 await page.click('#hsff [data-a="mx"]');await W(80);
 ok('đóng biểu mẫu không lưu: ca Chủ nhật còn nguyên',await ev(K=>DB.lich.some(l=>l.hs===K&&l.day===0),K));
 await ev(K=>{S.modal={t:'hsf',id:K};render()},K);await page.waitForSelector('#hsff');await W(80);
 await page.click('#hsff button[type=submit]');await W(150);
 const after=await ev(K=>JSON.stringify(DB.lich.filter(l=>l.type==='11'&&l.hs===K).map(l=>[l.id,l.day,l.slot,l.gv,l.lt||null]).sort()),K);
 ok('mở hồ sơ rồi lưu không sửa gì: mọi ca 1-1 (kể cả Chủ nhật) giữ nguyên',before===after&&/,0,/.test(after),{before,after});

 /* 11. Phân công: ca Chủ nhật không chặn giáo viên đảm nhận lớp bán trú T2–T6 */
 const pb=await ev(GT=>{const had=DB.lich.some(l=>l.type==='11'&&l.gv===GT&&l.day>=1&&l.day<=5),l={id:'lz48g',type:'11',day:0,slot:'15:00',gv:GT,hs:DB.kids[0].id,lt:null};DB.lich.push(l);
  const inPool=poolBt().some(s=>s.id===GT);DB.lich=DB.lich.filter(x=>x!==l);return{had,inPool}},GT);
 ok('giáo viên chỉ có ca Chủ nhật vẫn được chọn làm bán trú T2–T6',pb.had===false&&pb.inPool===true,pb);

 /* 12. phụ huynh thấy ca Chủ nhật của bé mình */
 const o2=await open();await login(o2.page,'ph');
 const ph=await o2.page.evaluate(([T1])=>{const k=myKids().find(x=>x.st==='dang');
  DB.lich.push({id:'lz48p',type:'11',day:0,slot:'09:05',gv:T1,hs:k.id,lt:null});
  const up=upcoming(k,12),sun=up.filter(x=>dow(x.d)===0).length;go('lh');S.lh={kid:k.id};render();
  return{sun,txt:document.querySelector('#main').innerText}},[T1]);
 ok('phụ huynh: "Lịch học sắp tới" và Lịch 14 ngày tới có ngày Chủ nhật; thời khóa biểu của bé có cột Chủ nhật',ph.sun>=1&&/Chủ nhật/.test(ph.txt),ph.txt.slice(0,300));
 await o2.b.close();

 /* 13. mã nguồn: không viết lại điều kiện cũ, DAY_11 chỉ dùng cho ca 1-1 */
 const fs=require('fs'),src=['p03-seed','p04-domain','p08-hs','p09-pc','p10-lh','p12-dd1','p12-dd2','p11-cc','p06-dash','p18-cp','p08b-ci'].map(n=>fs.readFileSync(__dirname+'/../src/build/'+n+'.js','utf8')).join('\n');
 ok('hằng DAY_ALL, DAY_BT không bị đổi; isW giữ nghĩa ngày làm việc',/DAY_BT=\[1,2,3,4,5\],DAY_ALL=\[1,2,3,4,5,6\]/.test(src)&&/const isW=s=>dow\(s\)!==0/.test(fs.readFileSync(__dirname+'/../src/build/p02-core.js','utf8')));
 ok('mọi so sánh l.day<=5 đều có cận dưới l.day>=1 nên không lọt ca Chủ nhật (day 0)',(src.match(/l\.day<=5/g)||[]).length===(src.match(/l\.day>=1&&l\.day<=5/g)||[]).length);
 ok('không có lỗi JS',errs.length===0&&o2.errs.length===0,errs.concat(o2.errs));
 await b.close();
 console.log(passes+' PASS, '+fails+' FAIL');process.exit(fails?1:0)})();
