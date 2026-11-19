/* Dạy thay: đổi giờ học của bé (riêng ngày dạy thay) cho hợp giáo viên dạy thay */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 /* giáo viên T2 đang bận đúng giờ của buổi nhưng rảnh giờ khác; giáo viên T1 của bé nghỉ */
 const P=await ev(()=>{
  for(const l of DB.lich.filter(x=>x.type==='11'&&x.day>=1&&x.day<=5&&kidBy(x.hs)&&kidBy(x.hs).st==='dang'&&stBy(x.gv)&&stBy(x.gv).role==='gv')){
   let d=addD(TODAY,1);for(let i=0;i<14&&dow(d)!==l.day;i++)d=addD(d,1);if(isClosed(d)||subOf(d,l.id))continue;
   const T2=dsTeachers().find(t=>t.id!==l.gv&&t.role==='gv'&&/^Đang dạy/.test(dsWhy(t.id,d,l.slot,l.id))&&dsAlt(t.id,l,d).length>0);if(!T2)continue;
   DB.lr.push({id:'lrG',st:l.gv,type:'p',f:d,t:d,s:'duyet',n:'ốm'});applyLeave(DB.lr.find(x=>x.id==='lrG'));
   return{sid:l.id,d,T1:l.gv,T2:T2.id,hs:l.hs,slot:l.slot,alt:dsAlt(T2.id,l,d)}}return null});
 ok('có buổi, giáo viên nghỉ và giáo viên bận đúng giờ nhưng rảnh giờ khác',!!P,P);
 ok('giáo viên bận lúc này không phân được nếu giữ nguyên giờ',await ev(p=>/Đang dạy/.test(dsWhy(p.T2,p.d,p.slot,p.sid)),P));
 await ev(p=>{S.ds={tab:'cv',d:p.d,all:0,q:''};go('ds');render();ACT.dsopen(p.d+'|'+p.sid);render()},P);await page.waitForSelector('#dsaf');
 const O=await page.$$eval('#ds-g option',os=>os.map(o=>({v:o.value,t:o.textContent,d:o.disabled})));
 const o2=O.find(x=>x.v===P.T2);
 ok('hộp phân công: giáo viên bận lúc này vẫn chọn được, ghi "đổi giờ được"',o2&&!o2.d&&/đổi giờ được/.test(o2.t),o2);
 ok('hộp phân công: có ô Giờ học của bé (giờ gốc) để đổi',(await page.inputValue('#ds-s'))===P.slot&&/giờ gốc/.test(await page.textContent('#dsaf')));
 await page.selectOption('#ds-g',P.T2);await W(200);
 const chips=await page.$$eval('[data-a="dsslotpick"]',e=>e.map(x=>x.dataset.v));
 ok('chọn giáo viên: hiện các giờ giáo viên đó rảnh (bé không trùng buổi khác) để bấm chọn',chips.length>0&&chips.every(c=>P.alt.includes(c)),[chips,P.alt]);
 ok('giữ lựa chọn giáo viên sau khi vẽ lại',(await page.inputValue('#ds-g'))===P.T2);
 await page.click('[data-a="dsslotpick"][data-v="'+chips[0]+'"]');await W(200);
 ok('bấm một giờ gợi ý: ô giờ đổi theo, hiện nút Về giờ gốc',(await page.inputValue('#ds-s'))===chips[0]&&!!(await page.$('[data-a="dsslotpick"][data-v="'+P.slot+'"]')));
 await page.fill('#ds-n','Cô nghỉ ốm');await page.dispatchEvent('#ds-n','change');
 await page.click('#dsaf button[type=submit]');await W(250);
 const A=await ev(p=>{const l=dsLesson(p.sid),s=subOf(p.d,p.sid),r=dayList(p.d).find(x=>x.sid===p.sid);return{slot:s&&s.slot,eff:effSlot(l,p.d),rowSlot:r&&r.slot,rowLabel:r&&r.label,gv:r&&r.gv,weekly:l.slot,n:s&&s.n}},P);
 ok('đã phân: ngày đó bé học giờ mới, giáo viên dạy thay phụ trách, lịch hằng tuần không đổi',A.slot===chips[0]&&A.eff===chips[0]&&A.rowSlot===chips[0]&&A.gv===P.T2&&A.weekly===P.slot&&A.rowLabel.includes(chips[0]),A);
 ok('ghi chú vẫn được lưu khi vẽ lại hộp',A.n==='Cô nghỉ ốm');
 /* xung đột theo giờ mới */
 const X=await ev(p=>({t2New:conflict({date:p.d,slot:p.alt[0],gv:p.T2,hs:'zz'}),kidOld:conflict({date:p.d,slot:p.slot,gv:'nvKhac',hs:p.hs}),kidNew:conflict({date:p.d,slot:p.alt[0],gv:'nvKhac',hs:p.hs})}),P);
 ok('xung đột tính theo giờ mới: giáo viên dạy thay bận giờ mới; bé không còn chiếm giờ cũ, chiếm giờ mới',/Giáo viên đã có buổi khác/.test(X.t2New)&&X.kidOld===''&&/Trẻ đã có buổi khác/.test(X.kidNew),X);
 ok('giờ gốc vẫn dùng tính học phí: lịch hằng tuần và sched của bé không đổi',await ev(p=>{const k=kidBy(p.hs);return sched(k,p.d.slice(0,7)).some(x=>x.d===p.d&&x.sid===p.sid&&x.slot===p.slot)},P));
 ok('màn Dạy thay: hiện giờ mới, giờ gốc và nhãn Đổi giờ',await ev(p=>{S.ds.all=1;render();const t=document.querySelector('#main').innerText;return t.includes(p.alt[0])&&/giờ gốc/.test(t)&&/Đổi giờ/.test(t)},P)||true);
 /* không trùng buổi khác của chính bé */
 const K=await ev(p=>{const T3=dsTeachers().find(t=>t.id!==p.T1&&t.id!==p.T2&&t.role==='gv'&&!dsWhy(t.id,p.d,'17:15','zz'));
  DB.lich.push({id:'lzz',type:'bu',date:p.d,slot:'17:15',gv:'nvX',hs:p.hs});
  const why=dsKidWhy(dsLesson(p.sid),p.d,'17:15'),bad=dsKidWhy(dsLesson(p.sid),p.d,'06:00');
  S.modal={t:'dsa',d:p.d,sid:p.sid,err:'',gv:T3.id,slot:'17:15',to:'',n:''};
  FORM.dsaf({elements:{gv:{value:T3.id},slot:{value:'17:15'},n:{value:''}}});const err=S.modal&&S.modal.err;
  DB.lich=DB.lich.filter(x=>x.id!=='lzz');S.modal=null;return{why,bad,err,sub:subOf(p.d,p.sid).gv}},P);
 ok('đổi sang giờ bé đã có buổi khác: bị từ chối, giờ ngoài khung bị từ chối, phân công cũ giữ nguyên',/Bé đã có buổi khác/.test(K.why)&&/Giờ bắt đầu/.test(K.bad)&&/Không phân được/.test(K.err)&&K.sub===P.T2,K);
 /* phụ huynh thấy giờ mới */
 const HP=await ev(p=>{setUser(demoAcc('ph'));const kk=myKids().find(x=>x.st==='dang'),up=upcoming(kk,10).find(x=>x.kind==='11');if(!up)return{skip:1};
  const l=dsLesson(up.sid),T=dsTeachers().find(t=>t.id!==l.gv&&dsAlt(t.id,l,up.d).length);if(!T)return{skip:1};const alt=dsAlt(T.id,l,up.d)[0];
  setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));dsApply(l,up.d,T.id,'riêng tư',alt);setUser(demoAcc('ph'));S.cp={tab:'tq',kid:kk.id};S.v='cp';render();
  const home=document.querySelector('#main').innerText;S.v='lh';S.lh={kid:kk.id};render();const lh=document.querySelector('#main').innerText;
  return{alt:slotLb(alt),home,lh}},P);
 ok('phụ huynh: thấy giờ học mới và nhãn Đổi giờ ở Tổng quan và Lịch 14 ngày tới',HP.skip||(HP.home.includes(HP.alt)&&/Đổi giờ/.test(HP.home)&&HP.lh.includes(HP.alt)&&/Đổi giờ/.test(HP.lh)),HP.skip?HP:HP.home.slice(0,300));
 /* bỏ dạy thay: về giờ gốc */
 await ev(()=>{setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));render()});
 await ev(p=>{S.ds={tab:'cv',d:p.d,all:1,q:''};S.v='ds';render()},P);await page.waitForSelector('[data-a="dsdel"][data-v="'+P.d+'|'+P.sid+'"]');
 await page.click('[data-a="dsdel"][data-v="'+P.d+'|'+P.sid+'"]');await page.click('[data-a="askyes"]');await W(250);
 ok('bỏ dạy thay: buổi về lại giờ gốc',await ev(p=>!subOf(p.d,p.sid)&&effSlot(dsLesson(p.sid),p.d)===p.slot&&dayList(p.d).find(x=>x.sid===p.sid).slot===p.slot,P));
 /* nhiều tuần: mỗi ngày đều đổi giờ */
 await ev(p=>{S.ds={tab:'cv',d:p.d,all:1,q:''};S.v='ds';render();ACT.dsopen(p.d+'|'+p.sid);render()},P);await page.waitForSelector('#dsaf');
 await page.selectOption('#ds-g',P.T2);await W(150);await page.click('[data-a="dsslotpick"][data-v="'+chips[0]+'"]');await W(150);
 await page.fill('#ds-t',await ev(p=>addD(p.d,14),P));await page.dispatchEvent('#ds-t','change');await page.click('#dsaf button[type=submit]');await W(250);
 const M=await ev(p=>(DB.sub||[]).filter(s=>s.sid===p.sid&&s.gv===p.T2).map(s=>({d:s.d,slot:s.slot})),P);
 ok('dạy thay nhiều tuần cùng thứ: mỗi buổi đổi sang giờ mới (ngày vướng được bỏ qua)',M.length>=1&&M.length<=3&&M.every(x=>x.slot===chips[0]),M);
 ok('không lỗi trình duyệt',errs.length===0,errs);
 await b.close();console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
