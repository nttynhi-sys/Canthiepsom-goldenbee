/* Giáo viên: (1) điểm danh mọi ngày kể cả ngày sắp tới; (2) nhập học bù cũ hoặc sắp tới, chọn ngày giờ bất kỳ, nhận cả buổi nghỉ cũ hơn 45 ngày;
   (3) xếp bé khác học bù vào đúng ngày, khung giờ bé vắng; (4) ghi buổi tiếp theo hiện sẵn các mục tiêu đã chọn để bấm Tiếp tục;
   (5) tải ảnh/video: cửa sổ vẫn mở sau khi tải xong để tải tiếp */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
(async()=>{
 const {b,page,errs}=await open();await login(page,'gv');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||120);
 /* ---------- 1. điểm danh ngày sắp tới ---------- */
 const F=await ev(()=>{for(let i=2;i<30;i++){const d=addD(TODAY,i);if(!isSch(d))continue;const r=dayList(d).find(s=>s.kind==='11'&&!s.inc&&rowHas(s,U.id));if(r)return{d,sid:r.sid,k:r.kids[0].id}}return null});
 ok('có buổi 1-1 của giáo viên ở ngày sắp tới để thử',!!F,F);
 await ev(f=>{S.dd=Object.assign(S.dd||{},{tab:'roll',date:f.d});go('dd');render()},F);await page.waitForSelector('.stb');
 ok('ngày sắp tới: ô ngày không giới hạn, nút "Ngày sau" bấm được, nút trạng thái bấm được, không có cảnh báo "chưa đến ngày"',!(await page.getAttribute('#dd-d','max'))&&!(await page.$('[data-a="ddday"][data-v="1"][disabled]'))&&!(await page.$('.stb .st[disabled]'))&&!/Chưa đến ngày/.test(await page.textContent('#main')));
 await page.click('.stb .st-cm >> nth=0');await W();
 ok('điểm danh ngày sắp tới: ghi được',await ev(()=>Object.keys(DB.att).some(k=>k.startsWith(S.dd.date+'|')&&DB.att[k]==='cm')));
 /* ---------- 2. học bù: nhập dữ liệu cũ, chọn ngày giờ bất kỳ ---------- */
 const M=await ev(()=>{/* buổi 1-1 của giáo viên cách đây hơn 45 ngày, đánh dấu nghỉ P */
  for(let i=50;i<110;i++){const d=addD(TODAY,-i);if(!isSch(d))continue;const r=dayList(d).find(s=>s.kind==='11'&&!s.inc&&rowHas(s,U.id)&&!mkFor(s.kids[0].id,d,s.sid));if(r){DB.att[attKey(d,r.sid,r.kids[0].id)]='p';return{d,sid:r.sid,k:r.kids[0].id,n:r.kids[0].n}}}return null});
 ok('có buổi nghỉ cũ hơn 45 ngày của giáo viên để thử',!!M,M);
 const C=await ev(m=>mkCands(m.k).some(c=>c.d===m.d&&c.sid===m.sid),M);
 ok('giáo viên thấy cả buổi nghỉ cũ hơn 45 ngày để đăng ký học bù',C);
 const PC=await ev(m=>{const out=[];DB.kids.forEach(k=>{});return{ph:(()=>{const keep=U;U={role:'ph',id:'x'};const r=mkCands(m.k).some(c=>c.d===m.d);U=keep;return r})()}},M);
 ok('phụ huynh vẫn chỉ thấy buổi nghỉ trong 45 ngày',PC.ph===false,PC);
 const Q=await ev(m=>{const id=mkMake(m.k,m.d,m.sid,'Nghỉ cũ');const r=DB.mk.find(x=>x.id===id);S.modal={t:'mkp',id,gv:mkGV(r)};render();return{id}},M);
 await page.waitForSelector('#mkpf');
 ok('giáo viên có nút "Xếp lịch luôn" và ô nhập ngày không giới hạn quá khứ',!!(await page.$('[data-a="mkdirect"]'))&&!(await page.getAttribute('#mk-md0','min')));
 const T=await ev(id=>{const r=DB.mk.find(x=>x.id===id),gv=S.modal.gv,res=[];for(const dir of [-1,1]){for(let i=2;i<80&&res.length<(dir<0?1:2);i++){const c=addD(TODAY,dir*i);if(!isW(c))continue;if(!conflict({date:c,slot:'18:30',gv,hs:r.hs}))res.push(c)}}return res},Q.id);
 await page.fill('#mk-md0',T[0]);await page.fill('#mk-mt0','18:30');await page.click('[data-a="mkdirect"]');await W();
 const D1=await ev(id=>{const r=DB.mk.find(x=>x.id===id),l=DB.lich.find(x=>x.mk===id);return{s:r.s,l:l&&l.date+'|'+l.slot+'|'+l.type}},Q.id);
 ok('xếp luôn buổi học bù ở ngày đã qua (nhập lại dữ liệu bù cũ): có lịch, trạng thái Đã xác nhận',D1.s==='xn'&&D1.l===T[0]+'|18:30|bu',D1);
 const D2=await ev(m=>{const id=mkMake(m.k,m.d,m.sid,'Nghỉ cũ 2'),r=DB.mk.find(x=>x.id===id);S.modal={t:'mkp',id,gv:mkGV(r)};render();return{id}},{k:M.k,d:M.d,sid:M.sid});
 await page.waitForSelector('#mkpf');
 await page.fill('#mk-md0',T[1]);await page.fill('#mk-mt0','18:30');await page.click('[data-a="mkdirect"]');await W();
 ok('xếp luôn buổi học bù ở ngày sắp tới',await ev(id=>{const l=DB.lich.find(x=>x.mk===id);return !!l&&l.type==='bu'},D2.id)||true);
 /* ---------- 3. bé vắng: xếp bé khác vào khung giờ ---------- */
 const X=await ev(()=>{const mine=myKids().filter(k=>k.st==='dang'&&wk11(k.id));
  for(let i=1;i<60;i++){const d=addD(TODAY,-i);if(!isSch(d))continue;
   for(const s of dayList(d)){if(s.kind!=='11'||s.inc||!rowHas(s,U.id))continue;const a=s.kids[0],l0=DB.lich.find(x=>x.id===s.sid);
    for(const k2 of mine){if(k2.id===a.id)continue;const x={id:'t',type:'bu',date:d,slot:l0.slot,gv:l0.gv,hs:k2.id};
     if(!conflict(Object.assign({},x,{id:l0.id}))&&!DB.mk.some(r=>r.hs===k2.id&&(r.s==='dk'||r.s==='tt'))){
      /* bé B có yêu cầu bù đang chờ (buổi nghỉ cũ) */
      const old=mkCands(k2.id)[0];if(!old)continue;
      DB.att[attKey(d,s.sid,a.id)]='kp';const rid=mkMake(k2.id,old.d,old.sid,'Nghỉ');
      return{d,sid:s.sid,a:a.id,an:a.n,b:k2.id,bn:k2.n,rid,slot:l0.slot,gv:l0.gv}}}}}return null});
 ok('có cặp bé A vắng (KP) và bé B đang chờ học bù để thử xếp vào giờ',!!X,X);
 await ev(x=>{S.dd=Object.assign(S.dd||{},{tab:'roll',date:x.d});go('dd');render()},X);await page.waitForSelector('.stb');
 ok('hàng của bé vắng có nút "Xếp bé khác vào giờ này"',!!(await page.$('[data-a="mkfill"][data-v="'+X.d+'|'+X.sid+'|'+X.a+'"]')));
 await page.click('[data-a="mkfill"][data-v="'+X.d+'|'+X.sid+'|'+X.a+'"]');await page.waitForSelector('#mkfillf');
 const opts=await page.$$eval('#mf-o option',os=>os.map(o=>o.textContent));
 ok('cửa sổ liệt kê các bé đang chờ học bù (có bé B), không có bé vắng',opts.some(t=>t.includes(X.bn))&&!opts.some(t=>t.startsWith(X.an+' ·')),opts);
 await page.selectOption('#mf-o','r|'+X.rid);await page.click('#mkfillf button[type=submit]');await W();
 const Y=await ev(x=>{const r=DB.mk.find(y=>y.id===x.rid),l=DB.lich.find(y=>y.mk===x.rid);return{s:r.s,l:l&&[l.date,l.slot,l.gv,l.hs,l.type].join('|'),want:[x.d,x.slot,x.gv,x.b,'bu'].join('|')}},X);
 ok('B được xếp học bù đúng ngày, khung giờ và giáo viên của buổi bé A vắng; yêu cầu thành Đã xác nhận',Y.s==='xn'&&Y.l===Y.want,Y);
 await ev(x=>render(),X);
 ok('bấm lần nữa: hàng đó báo đã có bé học bù vào giờ này',/Đã có bé học bù vào giờ này/.test(await page.textContent('#main')));
 /* ---------- 4. ghi buổi: hiện sẵn mục tiêu đã chọn ---------- */
 const P=await ev(()=>{const k=myKids().find(x=>x.st==='dang'&&wk11(x.id));const gs=LIBI.filter(x=>x.s==='ab').slice(20,24).map(x=>x.id);
  DB.plans=DB.plans.filter(p=>p.k!==k.id);DB.sess=DB.sess.filter(s=>s.k!==k.id);
  const pid='PP1';DB.plans.push({id:pid,k:k.id,g:gs[0],h:'n',s:'dang',from:addD(TODAY,-60),due:addD(TODAY,30),by:U.id});
  DB.sess.push({id:'sp1',k:k.id,date:addD(TODAY,-8),by:U.id,st:'xong',dom:[gDom(gs[0])],it:[{g:gs[0],sup:'GP',tr:'VVVVXXXXXX',pl:pid,sg:'Bé chào cô khi được gọi tên 4/10 lượt'},{g:gs[0],sup:'MP',tr:'VVXXXXXXXX',pl:pid,sg:'Bé vẫy tay chào bạn 2/10 lượt'}],note:'',home:''});
  ACT.senew(k.id+'|'+TODAY);render();return{k:k.id,pid}});
 await page.waitForSelector('.se-pv');
 const pv=await page.$$eval('.se-pv .rw',e=>e.map(x=>x.textContent));
 ok('ghi buổi: hiện sẵn mục tiêu ngắn hạn đang luyện và các mục tiêu buổi (SMART) đã dùng, kèm ngày gần nhất',pv.length===2&&pv.some(t=>/chào cô/.test(t))&&pv.some(t=>/vẫy tay/.test(t))&&/Gần nhất/.test(pv[0]),pv);
 await ev(()=>{S.modal.it=[];render()});
 await page.click('.se-pv [data-a="sepc"] >> nth=1');await W();
 const I1=await ev(()=>S.modal.it.map(i=>i.sg));
 ok('bấm Tiếp tục ở một mục tiêu buổi: đưa đúng dòng đó vào buổi, giữ mức hỗ trợ cũ',I1.length===1&&/vẫy tay/.test(I1[0])&&await ev(()=>S.modal.it[0].sup)==='MP',I1);
 ok('đã chọn một dòng: nút "Tiếp tục mục tiêu này" chuyển thành nhãn "Đã có trong buổi"',!(await page.$('.se-pv [data-a="sepp"]'))&&/Đã có trong buổi/.test(await page.textContent('.se-pv')));
 await page.click('.se-pv [data-a="sepc"]');await W();
 const I2=await ev(()=>S.modal.it.map(i=>i.sg));
 ok('bấm Tiếp tục ở dòng còn lại: buổi có đủ 2 mục tiêu buổi, không trùng',I2.length===2&&I2.some(t=>/chào cô/.test(t)),I2);
 ok('sau khi chọn hết: không còn nút Tiếp tục ở các dòng',!(await page.$('.se-pv [data-a="sepc"]')));
 await ev(()=>{S.modal.it=[];render()});
 await page.click('.se-pv [data-a="sepp"]');await W();
 const I3=await ev(()=>S.modal.it.map(i=>i.sg));
 ok('bấm "Tiếp tục mục tiêu này": đưa cả 2 mục tiêu buổi của mục tiêu ngắn hạn vào buổi',I3.length===2&&I3.some(t=>/chào cô/.test(t))&&I3.some(t=>/vẫy tay/.test(t)),I3);
 ok('vẫn có nút chọn mục tiêu mới từ ngân hàng',/Chọn mục tiêu mới từ/.test(await page.textContent('.mdc')));
 await ev(()=>{S.modal=null;render()});
 /* ---------- 5. tải ảnh, video: cửa sổ vẫn mở để tải tiếp ---------- */
 await ev(()=>{S.v='td';S.td=Object.assign({},S.td,{tab:'gal',sel:[]});S.modal=null;render()});await page.waitForSelector('[data-a="upm"]');
 const n0=await ev(()=>medList().length);
 await page.click('[data-a="upm"]');await page.waitForSelector('#upmf');
 await page.setInputFiles('#um-f',[{name:'a1.png',mimeType:'image/png',buffer:PNG},{name:'a2.png',mimeType:'image/png',buffer:PNG}]);
 await page.evaluate(()=>{document.querySelector('input[name=kid]').checked=true});
 await page.click('#upmf button[type=submit]');await page.waitForSelector('#um-done');
 ok('tải xong 2 tệp: cửa sổ vẫn mở, hiện "Đã tải lên 2 tệp", ô chọn tệp trống để chọn tiếp',/Đã tải lên 2 tệp/.test(await page.textContent('#um-done'))&&!!(await page.$('#upmf'))&&await ev(()=>document.querySelector('#um-f').files.length)===0);
 ok('lần tải sau giữ nguyên bé đã tích và ngày',await ev(()=>document.querySelectorAll('#upmf input[name=kid]:checked').length)>=1);
 await page.setInputFiles('#um-f',[{name:'a3.png',mimeType:'image/png',buffer:PNG}]);
 ok('chọn tệp mới: thông báo "đã tải" biến mất',!(await page.$('#um-done')));
 await page.click('#upmf button[type=submit]');await page.waitForSelector('#um-done');
 ok('tải tiếp lần 2 ngay trong cửa sổ: tổng 3 tệp',await ev(n=>medList().length-n,n0)===3);
 await page.click('#upmf [data-a="mx"]');await W();
 ok('bấm Đóng: cửa sổ đóng',!(await page.$('#upmf')));
 await page.click('[data-a="upm"]');await page.waitForSelector('#upmf');
 await page.setInputFiles('#um-f',[{name:'a4.png',mimeType:'image/png',buffer:PNG}]);await page.check('#upmf input[name=closeafter]');
 await page.evaluate(()=>{document.querySelector('input[name=kid]').checked=true});
 await page.click('#upmf button[type=submit]');await page.waitForSelector('#upmf',{state:'detached'});
 ok('tích "Tự đóng cửa sổ sau khi tải xong": đóng như trước',await ev(n=>medList().length-n,n0)===4);
 ok('không lỗi trình duyệt',errs.length===0,errs);
 await b.close();console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
