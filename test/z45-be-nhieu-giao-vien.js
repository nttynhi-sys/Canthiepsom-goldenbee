/* Z45: một bé có nhiều giáo viên dạy chung, mỗi người một nội dung (cô A dạy Ngôn ngữ, cô B dạy Vận động – giác quan).
   Form hồ sơ: danh sách giáo viên kèm nội dung phụ trách, mỗi ca 1-1 chọn giáo viên riêng; lưu ra k.ts / k.tc / l.gv.
   Kiểm tra: xung đột giờ khi đổi giáo viên của ca (hoàn tác tất cả), chặn bỏ giáo viên còn ca, đổi người trong danh sách thì ca chuyển theo,
   giáo viên của bé thấy bé (myKids, quyền sửa buổi), màn Phân công (thêm giáo viên dạy chung, chuyển tất cả ca), thẻ Lịch học (đổi giáo viên từng ca),
   thêm ca từ lịch giáo viên, dữ liệu cũ chỉ có k.gv vẫn chạy, 390px không tràn ngang. */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 const toastTx=()=>ev(()=>{const t=document.querySelector('.toast,#toast');return t?t.textContent:''});
 /* thêm một dòng ca; trả về giáo viên mặc định sau khi đổi loại */
 const addCa=(w,lt,tm,gv)=>ev(([w,lt,tm,gv])=>{const f=document.querySelector('#hsff');ACT.s11add(null,f.querySelector('#hth-11 [data-a="s11add"]'));const all=f.querySelectorAll('#s11 .s11r'),r=all[all.length-1];
  r.querySelector('[name=s11day]').value=w;const l=r.querySelector('[name=s11lt]');l.value=lt;l.dispatchEvent(new Event('change',{bubbles:true}));r.querySelector('[name=s11tm]').value=tm;
  if(gv)r.querySelector('[name=s11gv]').value=gv;return r.querySelector('[name=s11gv]').value},[w,lt,tm,gv]);
 const clearCa=()=>ev(()=>{document.querySelectorAll('#hsff #s11 .s11r').forEach(r=>r.remove())});
 const ltOn=(lt,q)=>ev(([lt,q])=>{const f=document.querySelector('#hsff');f.elements['lt_'+lt].checked=true;f.elements['lq_'+lt].value=q},[lt,q]);
 const openEdit=async id=>{await ev(id=>{S.modal={t:'hsf',id};render()},id);await page.waitForSelector('#hsff');await W(60)};
 const submit=async()=>{await page.click('#hsff button[type=submit]');await W(150)};
 const gvRows=()=>ev(()=>[...document.querySelectorAll('#hsff #gvl .gvr')].map(r=>({id:r.querySelector('select').value,tc:r.querySelector('[name=tgc]').value,nm:r.querySelector('select').name})));
 const caRows=()=>ev(()=>[...document.querySelectorAll('#hsff #s11 .s11r')].map(r=>({lid:r.dataset.lid||'',day:+r.querySelector('[name=s11day]').value,lt:r.querySelector('[name=s11lt]').value,gv:r.querySelector('[name=s11gv]').value})));
 const kidOf=id=>ev(id=>{const k=kidBy(id);return k?{ts:kTs(k),gv:k.gv,tc:k.tc||null,hasTs:Array.isArray(k.ts)}:null},id);
 const caOf=id=>ev(id=>DB.lich.filter(l=>l.type==='11'&&l.hs===id).sort((a,b)=>a.day-b.day||(a.slot<b.slot?-1:1)).map(l=>({id:l.id,day:l.day,slot:l.slot,gv:l.gv,lt:l.lt||''})),id);
 const snapL=id=>ev(id=>DB.lich.filter(l=>l.type==='11'&&l.hs===id).map(l=>JSON.stringify(l)).sort(),id);
 await login(page,'ql');
 await page.click('.nav button:has-text("Học sinh")');await W(120);

 /* 0. hàm dùng chung: dữ liệu cũ chỉ có k.gv vẫn đọc được */
 const f0=await ev(()=>({a:kTs({gv:'x'}),b:kTs({gv:null}),c:kTs({ts:['a','b'],gv:'a'}),d:kTs({ts:[],gv:'x'}),e:kHas({gv:'x'},'x'),f:kHas({ts:['a','b']},'b'),g:kHas({ts:['a']},'z'),h:kHas({ts:['a']},'')}));
 ok('kTs/kHas: dữ liệu cũ chỉ có gv đọc ra đúng 1 người, danh sách mới đọc đủ, rỗng thì không ai',eq(f0.a,['x'])&&eq(f0.b,[])&&eq(f0.c,['a','b'])&&eq(f0.d,[])&&f0.e&&f0.f&&!f0.g&&!f0.h,f0);

 /* chọn 4 giáo viên và các khung giờ mà cả 4 đều rảnh */
 const gvs=await ev(()=>pool11().map(s=>s.id)),[G1,G2,G3,G4]=gvs;
 ok('có đủ 4 giáo viên 1-1 để thử',gvs.length>=4,gvs);
 const FREE=await ev(g=>{const fr=(w,s)=>g.every(x=>!conflict({day:w,slot:s,gv:x,hs:'hsX' })),rs=[...SLOTS].reverse(),
  pick=(w,ex)=>rs.find(s=>!ex.includes(s)&&ex.every(e=>Math.abs(tmin(s)-tmin(e))>=SLOT_MIN)&&fr(w,s));
  const a=pick(1,[]),b=pick(1,[a]),c=pick(3,[]),d=pick(3,[c]),e=pick(5,[]);return{a,b,c,d,e}},[G1,G2,G3,G4]);
 ok('tìm được các khung giờ rảnh cho cả 4 giáo viên',Object.values(FREE).every(Boolean),FREE);
 const NAME='Bé Thử Nhiều Giáo Viên';

 /* 1. tạo bé: G1 dạy Ngôn ngữ, G2 dạy Vận động – giác quan */
 await page.click('[data-a="hsnew"]');await page.waitForSelector('#hsff');
 await page.fill('#hf-n',NAME);await page.fill('#hf-pn','Mẹ Thử');await page.fill('#hf-pp','0905123499');
 await page.check('#hf-h11');
 const r0=await gvRows();
 ok('bé mới: danh sách giáo viên có sẵn 1 dòng trống (ô đầu tên gv, id hf-gv)',r0.length===1&&r0[0].id===''&&r0[0].nm==='gv'&&await ev(()=>!!document.querySelector('#hf-gv')),r0);
 await page.selectOption('#hf-gv',G1);await page.fill('#gvl .gvr:nth-child(1) [name=tgc]','Ngôn ngữ');
 await page.click('[data-a="gvadd"]');await W(40);
 const r1=await gvRows();
 ok('bấm + Thêm giáo viên: có dòng thứ hai (tên tgv) để chọn người và ghi nội dung',r1.length===2&&r1[1].id===''&&r1[1].nm==='tgv',r1);
 await page.selectOption('#gvl .gvr:nth-child(2) select',G2);await page.fill('#gvl .gvr:nth-child(2) [name=tgc]','Vận động – giác quan');
 await ltOn('ng',1);await ltOn('gq',1);await clearCa();
 const d1=await addCa(1,'ng',FREE.a),d2=await addCa(1,'gq',FREE.b),d3=await addCa(3,'gq',FREE.c),d4=await addCa(3,'ng',FREE.d);
 ok('ca mới mặc định: ca đầu nhận giáo viên đầu danh sách, ca cùng loại nhận người đang dạy loại đó',d1===G1&&d4===G1,{d1,d2,d3,d4});
 await ev(g=>{const rs=document.querySelectorAll('#hsff #s11 .s11r');rs[1].querySelector('[name=s11gv]').value=g;const l=rs[2].querySelector('[name=s11lt]');l.value='gq';l.dispatchEvent(new Event('change',{bubbles:true}))},G2);
 const ca1=await caRows();
 ok('chọn G2 cho ca Vận động – giác quan thứ nhất, ca gq thứ hai tự nhận G2 theo ca đó',ca1[0].gv===G1&&ca1[1].gv===G2&&ca1[2].gv===G2&&ca1[3].gv===G1,ca1);
 await submit();
 const KID=await ev(n=>{const k=DB.kids.find(x=>x.n===n);return k?k.id:null},NAME);
 ok('lưu được bé có 2 giáo viên và 4 ca 1-1',!!KID&&(await caOf(KID)).length===4,KID);
 const k1=await kidOf(KID),c1=await caOf(KID);
 ok('k.ts có đủ 2 giáo viên theo thứ tự, k.gv giữ người đầu để bản cũ đọc được',eq(k1.ts,[G1,G2])&&k1.gv===G1&&k1.hasTs,k1);
 ok('k.tc ghi nội dung phụ trách của từng giáo viên',k1.tc&&k1.tc[G1]==='Ngôn ngữ'&&k1.tc[G2]==='Vận động – giác quan',k1.tc);
 ok('mỗi ca do đúng giáo viên đã chọn: ngôn ngữ G1, vận động – giác quan G2',c1.filter(l=>l.lt==='ng').every(l=>l.gv===G1)&&c1.filter(l=>l.lt==='gq').every(l=>l.gv===G2)&&c1.length===4,c1);

 /* 2. mở lại để sửa: hai giáo viên và nội dung hiện sẵn, mỗi ca chọn sẵn đúng người */
 await openEdit(KID);
 const e1=await gvRows(),ce1=await caRows();
 ok('sửa hồ sơ: hai giáo viên và nội dung phụ trách hiện sẵn',e1.length===2&&e1[0].id===G1&&e1[0].tc==='Ngôn ngữ'&&e1[1].id===G2&&e1[1].tc==='Vận động – giác quan',e1);
 ok('sửa hồ sơ: ô giáo viên của từng ca chọn sẵn đúng người đã lưu',ce1.length===4&&ce1.filter(r=>r.lt==='gq').every(r=>r.gv===G2)&&ce1.filter(r=>r.lt==='ng').every(r=>r.gv===G1),ce1);
 const orig=await snapL(KID);

 /* 3. đổi giáo viên của một ca sang người đang bận đúng giờ đó: báo lý do, hoàn tác tất cả, chưa lưu */
 const OTHER=await ev(id=>DB.kids.find(k=>k.id!==id&&k.st==='dang').id,KID);
 await ev(([g,s,o])=>{DB.lich.push({id:'lDummy',type:'11',day:1,slot:s,gv:g,hs:o,lt:null})},[G3,FREE.b,OTHER]);
 await page.click('[data-a="gvadd"]');await W(40);
 await page.selectOption('#gvl .gvr:nth-child(3) select',G3);
 const opt3=await ev(()=>[...document.querySelectorAll('#hsff #s11 .s11r')[0].querySelector('[name=s11gv]').options].map(o=>o.value));
 ok('thêm G3 vào danh sách: G3 xuất hiện trong ô giáo viên của từng ca',opt3.includes(G3)&&opt3.includes(G1)&&opt3.includes(G2),opt3);
 await ev(g=>{const r=[...document.querySelectorAll('#hsff #s11 .s11r')].find(x=>+x.querySelector('[name=s11day]').value===1&&x.querySelector('[name=s11lt]').value==='gq');r.querySelector('[name=s11gv]').value=g},G3);
 await submit();
 const t3=await toastTx();
 ok('đổi giáo viên của ca sang người đã bận: báo "Giáo viên đã có buổi khác", hồ sơ chưa lưu',/Giáo viên đã có buổi khác/.test(t3)&&/chưa được lưu/.test(t3),t3);
 ok('xung đột: mọi ca giữ nguyên (không đổi giáo viên nào), danh sách giáo viên giữ nguyên',eq(await snapL(KID),orig)&&eq((await kidOf(KID)).ts,[G1,G2]),await kidOf(KID));
 await ev(()=>{DB.lich=DB.lich.filter(l=>l.id!=='lDummy')});

 /* 4. bỏ giáo viên còn ca: bị chặn; chuyển hết ca sang người khác rồi bỏ được */
 await openEdit(KID);
 await page.click('#gvl .gvr:nth-child(2) [data-a="gvdel"]');await W(40);
 const t4=await toastTx(),r4=await gvRows();
 ok('bỏ giáo viên còn ca: báo còn 2 ca, dòng vẫn còn',/còn 2 ca/.test(t4)&&r4.length===2,{t4,n:r4.length});
 await ev(g=>{document.querySelectorAll('#hsff #s11 .s11r').forEach(r=>{if(r.querySelector('[name=s11lt]').value==='gq')r.querySelector('[name=s11gv]').value=g})},G1);
 await page.click('#gvl .gvr:nth-child(2) [data-a="gvdel"]');await W(40);
 const r5=await gvRows();
 ok('hết ca của G2 rồi thì bỏ được dòng giáo viên',r5.length===1&&r5[0].id===G1,r5);
 await submit();
 const k5=await kidOf(KID),c5=await caOf(KID);
 ok('lưu: bé còn 1 giáo viên (k.ts, k.gv), nội dung của người đã bỏ không còn trong k.tc',eq(k5.ts,[G1])&&k5.gv===G1&&k5.tc&&k5.tc[G1]==='Ngôn ngữ'&&!k5.tc[G2],k5);
 ok('lưu: các ca vận động – giác quan chuyển sang G1, số ca không đổi',c5.length===4&&c5.every(l=>l.gv===G1),c5);

 /* 5. thêm lại giáo viên thứ hai rồi giao ca; đổi người trong danh sách thì ca của người đó chuyển theo */
 await openEdit(KID);
 await page.click('[data-a="gvadd"]');await W(40);
 await page.selectOption('#gvl .gvr:nth-child(2) select',G2);await page.fill('#gvl .gvr:nth-child(2) [name=tgc]','Vận động – giác quan');
 await ev(g=>{document.querySelectorAll('#hsff #s11 .s11r').forEach(r=>{if(r.querySelector('[name=s11lt]').value==='gq')r.querySelector('[name=s11gv]').value=g})},G2);
 await page.selectOption('#gvl .gvr:nth-child(2) select',G4);
 const cs=await caRows();
 ok('đổi G2 thành G4 trong danh sách: các ca của G2 chuyển theo sang G4, ca của G1 không đổi',cs.filter(r=>r.lt==='gq').every(r=>r.gv===G4)&&cs.filter(r=>r.lt==='ng').every(r=>r.gv===G1),cs);
 await submit();
 const k6=await kidOf(KID),c6=await caOf(KID);
 ok('lưu: bé có G1 và G4, nội dung đúng người; G2 không còn trong danh sách',eq(k6.ts,[G1,G4])&&k6.tc[G1]==='Ngôn ngữ'&&k6.tc[G4]==='Vận động – giác quan'&&!k6.tc[G2],k6);
 ok('lưu: ca vận động – giác quan do G4 dạy, ngôn ngữ do G1 dạy',c6.filter(l=>l.lt==='gq').length===2&&c6.filter(l=>l.lt==='gq').every(l=>l.gv===G4)&&c6.filter(l=>l.lt==='ng').every(l=>l.gv===G1),c6);

 /* 6. chọn trùng một giáo viên hai dòng: báo, chưa lưu */
 await openEdit(KID);
 await page.click('[data-a="gvadd"]');await W(40);await page.selectOption('#gvl .gvr:nth-child(3) select',G1);
 await submit();
 ok('hai dòng cùng một giáo viên: báo gộp nội dung, chưa lưu',/chỉ chọn một lần/.test(await toastTx())&&eq((await kidOf(KID)).ts,[G1,G4]),await toastTx());
 await ev(()=>{S.modal=null;render()});

 /* 7. quyền xem bé và sửa buổi ghi của từng giáo viên */
 const vis=await ev(([id,g1,g4,g3])=>{const old=U,res={};try{[['g1',g1],['g4',g4],['g3',g3]].forEach(([n,g])=>{U=Object.assign({},old,{id:g,role:'gv'});res[n]={my:myKids().some(k=>k.id===id),can:canKid(id),edit:canEditSess({k:id,by:'zz',date:TODAY})}})}finally{U=old}
  return Object.assign(res,{now4:teachesNow(g4),ids:kidGVs(kidBy(id))})},[KID,G1,G4,G3]);
 ok('cả hai giáo viên của bé đều thấy bé và sửa được buổi ghi của bé; giáo viên không liên quan thì không',vis.g1.my&&vis.g1.edit&&vis.g4.my&&vis.g4.can&&vis.g4.edit&&!vis.g3.my&&!vis.g3.edit,vis);
 ok('kidGVs trả đủ các giáo viên của bé, teachesNow tính cả giáo viên thứ hai',eq(vis.ids,[G1,G4])&&vis.now4,vis);

 /* 8. hồ sơ bé: tên giáo viên kèm nội dung; danh sách và lọc theo giáo viên */
 const prof=await ev(id=>{S.modal={t:'hs',id,tab:'tt'};render();return document.querySelector('.mdc').textContent},KID);
 ok('hồ sơ bé liệt kê cả hai giáo viên kèm nội dung phụ trách',prof.includes('Ngôn ngữ')&&prof.includes('Vận động – giác quan'),prof.slice(0,300));
 const lst=await ev(([id,g4,g3])=>{S.modal=null;S.hs=Object.assign(S.hs||{},{gv:g4});render();const a=[...document.querySelectorAll('tr.k')].some(r=>r.dataset.v===id);S.hs.gv=g3;render();const b=[...document.querySelectorAll('tr.k')].some(r=>r.dataset.v===id);S.hs.gv='';render();return{a,b}},[KID,G4,G3]);
 ok('lọc danh sách học sinh theo giáo viên thứ hai thì thấy bé, theo giáo viên khác thì không',lst.a&&!lst.b,lst);

 /* 9. màn Phân công */
 await page.click('.nav button:has-text("Phân công")');await W(150);
 await page.fill('#pcq',NAME);await W(120);
 const pc=await ev(id=>{const r=document.querySelector('#mv-'+id);const tr=r&&r.closest('tr');return tr?tr.children[2].textContent:''},KID);
 ok('Phân công: cột giáo viên liệt kê cả hai người kèm số ca và nội dung',pc.includes(await ev(g=>sn(g),G1))&&pc.includes(await ev(g=>sn(g),G4))&&(pc.match(/· 2 ca/g)||[]).length===2&&pc.includes('Ngôn ngữ')&&pc.includes('Vận động – giác quan'),pc);
 await page.selectOption('#pcg',G4);await W(120);
 const f4=await ev(id=>!!document.querySelector('#mv-'+id),KID);
 await page.selectOption('#pcg',G3);await W(120);
 const f3=await ev(id=>!!document.querySelector('#mv-'+id),KID);
 ok('Phân công: lọc theo giáo viên thứ hai thấy bé, theo giáo viên không dạy thì không',f4&&!f3,{f4,f3});
 await page.selectOption('#pcg','');await W(100);
 await page.selectOption('#ad-'+KID,G3);await W(120);
 const k7=await kidOf(KID),t7=await toastTx();
 ok('Phân công: thêm giáo viên dạy chung đưa G3 vào danh sách của bé (chưa có ca), không đổi ca nào',eq(k7.ts,[G1,G4,G3])&&(await caOf(KID)).every(l=>l.gv===G1||l.gv===G4)&&/Chia ca/.test(t7),{k7,t7});
 const seen3=await ev(([id,g])=>{const old=U;try{U=Object.assign({},old,{id:g,role:'gv'});return myKids().some(k=>k.id===id)}finally{U=old}},[KID,G3]);
 ok('giáo viên vừa được thêm dạy chung đã thấy bé trong danh sách học sinh của mình',seen3);
 await page.selectOption('#mv-'+KID,G1);await W(100);
 ok('chuyển tất cả ca sang một giáo viên: hỏi xác nhận, nhắc các giáo viên khác rời khỏi bé',await ev(()=>S.modal&&S.modal.t==='ask'&&/rời khỏi bé/.test(S.modal.msg)));
 await page.click('[data-a="askyes"]');await W(120);
 const k8=await kidOf(KID),c8=await caOf(KID);
 ok('sau khi chuyển tất cả: bé chỉ còn G1 (k.ts, k.gv), mọi ca do G1 dạy, nội dung của người rời đi bỏ',eq(k8.ts,[G1])&&k8.gv===G1&&c8.length===4&&c8.every(l=>l.gv===G1)&&k8.tc&&!k8.tc[G4]&&!k8.tc[G3],{k8,c8});

 /* 10. thẻ Lịch học của hồ sơ bé: đổi giáo viên từng ca */
 await ev(id=>{S.modal={t:'hs',id,tab:'lh'};render()},KID);await W(100);
 const sel=await ev(()=>[...document.querySelectorAll('select[data-c=lsgv]')].length);
 ok('thẻ Lịch học: mỗi ca 1-1 có ô chọn giáo viên',sel===4,sel);
 const lg=(await caOf(KID)).find(l=>l.lt==='gq'&&l.day===1);
 await ev(([g,s,o])=>{DB.lich.push({id:'lDummy2',type:'11',day:1,slot:s,gv:g,hs:o,lt:null})},[G2,lg.slot,OTHER]);
 await page.selectOption('select[data-c=lsgv][data-l="'+lg.id+'"]',G2);await W(120);
 const t10=await toastTx();
 ok('đổi giáo viên của ca sang người đang bận: báo lý do, không hỏi xác nhận, ca giữ nguyên',/Giáo viên đã có buổi khác/.test(t10)&&await ev(()=>!S.modal||S.modal.t!=='ask')&&(await caOf(KID)).find(l=>l.id===lg.id).gv===G1,t10);
 await ev(()=>{DB.lich=DB.lich.filter(l=>l.id!=='lDummy2')});
 await ev(id=>{S.modal={t:'hs',id,tab:'lh'};render()},KID);await W(80);
 await page.selectOption('select[data-c=lsgv][data-l="'+lg.id+'"]',G2);await W(120);
 ok('đổi giáo viên của ca: hỏi xác nhận, nêu rõ ảnh hưởng đến tiền công theo ca',await ev(()=>S.modal&&S.modal.t==='ask'&&/Tiền công theo ca/.test(S.modal.msg)));
 await page.click('[data-a="askno"]');await W(100);
 ok('bấm Hủy: ca giữ nguyên giáo viên cũ và vẫn ở thẻ Lịch học',(await caOf(KID)).find(l=>l.id===lg.id).gv===G1&&await ev(()=>S.modal&&S.modal.t==='hs'));
 await page.selectOption('select[data-c=lsgv][data-l="'+lg.id+'"]',G2);await W(120);
 await page.click('[data-a="askyes"]');await W(120);
 const k9=await kidOf(KID),c9=await caOf(KID);
 ok('xác nhận: ca đó do G2 dạy, G2 vào danh sách giáo viên của bé, các ca khác giữ nguyên',c9.find(l=>l.id===lg.id).gv===G2&&c9.filter(l=>l.gv===G1).length===3&&eq(k9.ts,[G1,G2])&&await ev(()=>S.modal&&S.modal.t==='hs'),{k9,c9});
 const line=await ev(()=>document.querySelector('.mdc').textContent);
 ok('thẻ Lịch học có dòng "Giáo viên dạy bé" khi bé có nhiều giáo viên',/Giáo viên dạy bé:/.test(line),line.slice(0,200));

 /* 11. thêm ca từ lịch của một giáo viên: bé đang có giáo viên khác vẫn chọn được, giáo viên này vào danh sách */
 await ev(([g,s])=>{S.modal=null;S.lh=Object.assign(S.lh||{},{gv:g});S.modal={t:'ls',id:'',day:5,slot:s,err:''};render()},[G3,FREE.e]);
 await page.waitForSelector('#lsf');
 const lopt=await ev(id=>[...document.querySelectorAll('#ls-k option')].map(o=>({v:o.value,t:o.textContent})).find(o=>o.v===id),KID);
 ok('thêm ca từ lịch giáo viên: bé đang có giáo viên khác hiện kèm ghi chú "đang do ... dạy, thêm giáo viên này"',lopt&&/đang do/.test(lopt.t)&&/thêm giáo viên này/.test(lopt.t),lopt);
 await page.selectOption('#ls-k',KID);await page.click('#lsf button[type=submit]');await W(150);
 const k10=await kidOf(KID),c10=await caOf(KID);
 ok('lưu ca từ lịch giáo viên: có ca mới của G3, G3 vào danh sách giáo viên của bé, các giáo viên cũ giữ nguyên',c10.length===5&&c10.some(l=>l.gv===G3&&l.day===5)&&k10.ts.includes(G3)&&k10.ts.includes(G1)&&k10.ts.includes(G2),{k10,c10});

 /* 12. dữ liệu cũ: bé chỉ có k.gv (không có k.ts) mở sửa, lưu không đổi gì thì ca y nguyên, k.ts được ghi đúng */
 const OLD=await ev(()=>{const k=DB.kids.find(x=>x.st==='dang'&&x.gv&&!Array.isArray(x.ts)&&DB.lich.filter(l=>l.type==='11'&&l.hs===x.id).length>0&&x.pn&&(x.pe||x.pp));return k?{id:k.id,gv:k.gv,n:DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).length,main:mainGV(k)}:null});
 ok('có bé dữ liệu cũ (chỉ có k.gv) để thử',!!OLD,OLD);
 ok('bé dữ liệu cũ: tên giáo viên hiển thị như trước',OLD.main===(await ev(g=>sn(g),OLD.gv)),OLD);
 const before=await snapL(OLD.id),tsBefore=await ev(id=>kTs(kidBy(id)),OLD.id);
 await openEdit(OLD.id);
 const og=await gvRows();
 ok('bé dữ liệu cũ: form sửa hiện đúng 1 giáo viên (k.gv) và các ca chọn sẵn người đó hoặc người dạy ca',og.length>=1&&og[0].id===OLD.gv,og);
 await submit();
 const kOld=await kidOf(OLD.id);
 ok('lưu không đổi gì: các ca y nguyên, k.ts được ghi thành danh sách có giáo viên cũ, k.gv không đổi',eq(await snapL(OLD.id),before)&&kOld.hasTs&&kOld.ts.includes(OLD.gv)&&kOld.gv===OLD.gv,{kOld,tsBefore});

 /* 13. điện thoại 390px */
 await openEdit(KID);
 await page.setViewportSize({width:390,height:800});await W(150);
 const ov=await ev(()=>{const m=document.querySelector('.mdc'),f=document.querySelector('#hsff');return{doc:document.documentElement.scrollWidth-innerWidth,mdl:m.scrollWidth-m.clientWidth,rowOver:[...f.querySelectorAll('.s11r,.gvr')].some(r=>r.getBoundingClientRect().right>innerWidth+1||r.scrollWidth>r.clientWidth+1),n:f.querySelectorAll('.gvr').length}});
 ok('390px: danh sách giáo viên và các dòng ca có ô giáo viên nằm gọn, không tràn ngang',ov.doc<=1&&ov.mdl<=1&&!ov.rowOver&&ov.n>=2,ov);

 ok('không có lỗi JS',errs.length===0,errs);
 await b.close();
 console.log(passes+' PASS, '+fails+' FAIL');process.exit(fails?1:0)})();
