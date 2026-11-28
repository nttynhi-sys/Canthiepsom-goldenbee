/* Học phí: bỏ cột công nợ cộng dồn; học phí tháng gõ tay được; phí dư tháng trước gồm học phí đã thu cho ngày nghỉ lễ đặt sau; tháng sau = ngày học trừ phí dư */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{
 const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||120);
 /* 1. màn Học phí không còn công nợ */
 await ev(()=>{S.hp={tab:'tq',m:CM,st:'',q:'',gq:'',gm:CM};go('hp');render()});await page.waitForSelector('#main table');
 const txt=await page.textContent('#main');
 const tt=await page.$eval('#main table:has(input[data-c="hpv"])',e=>e.textContent);
 ok('Học phí học sinh: không còn chữ "Công nợ", "Còn nợ", "Dư có" và cột "Tình trạng" trong bảng',!/Công nợ|công nợ|Còn nợ|Dư có/.test(txt)&&!/Tình trạng/.test(tt),txt.slice(0,300));
 const ths=await page.$$eval('#main table:has(input[data-c="hpv"]) thead th',e=>e.map(x=>x.textContent.trim()));
 ok('có các cột Học phí tháng, Trừ phí dư tháng trước, Phải đóng, Đã thu, Phí cọc',['Trừ phí dư tháng trước','Phải đóng','Đã thu','Phí cọc'].every(c=>ths.some(t=>t.includes(c)))&&ths.some(t=>/^Học phí \d\d\/\d{4}/.test(t)),ths);
 ok('tab đổi tên "Học phí học sinh"',(await page.$$eval('#main .tabs .tab',e=>e.map(x=>x.textContent.trim()))).includes('Học phí học sinh'));
 /* 2. học phí tháng gõ tay */
 const K=await ev(()=>{const k=DB.kids.find(x=>x.st==='dang'&&btOf(x).length>0&&feeBreak(x,CM).gross>0);return{id:k.id,n:k.n}});
 await ev(k=>{DB.lg=DB.lg.filter(e=>!(e.hs===k.id&&(e.kind==='hp'||e.kind==='hoan')));S.hp.q=k.n;S.pg.hp=1;render()},K);await page.waitForSelector('#main input[data-c="hpv"]');
 const sel='#main input[data-c="hpv"][data-v="'+K.id+'|'+await ev(()=>CM)+'"]';
 await page.fill(sel,'4.720.000');await page.dispatchEvent(sel,'change');await W(250);
 const hp1=await ev(k=>DB.lg.filter(e=>e.hs===k.id&&e.kind==='hp'&&e.m===CM).map(e=>({a:e.amt,man:e.man})),K);
 ok('gõ học phí tháng: ghi đúng một dòng học phí nhập tay',hp1.length===1&&hp1[0].a===4720000&&hp1[0].man===1,hp1);
 const f1=await ev(k=>monthFee(kidBy(k.id),CM),K);
 ok('phải đóng = học phí tháng trừ phí dư tháng trước (tháng 10 chưa có dữ liệu thì 0)',f1.fee===4720000&&f1.due===4720000-f1.sur,f1);
 await page.fill(sel,'');await page.dispatchEvent(sel,'change');await W(250);
 ok('để trống ô học phí: bỏ dòng nhập tay, tính lại theo lịch',(await ev(k=>DB.lg.filter(e=>e.hs===k.id&&e.kind==='hp'&&e.m===CM).length,K))===0);
 /* 3. phí dư do nghỉ lễ đặt sau khi đã thu */
 const R=await ev(k=>{const kid=kidBy(k.id),m=CM,nm=sm(CM,1);
  DB.hol=(DB.hol||[]).filter(h=>h.d.slice(0,7)!==m);DB.lg=DB.lg.filter(e=>!(e.hs===kid.id&&(e.kind==='hp'||e.kind==='hoan')));
  for(const key of Object.keys(DB.set))if(key.startsWith(kid.id+'|'))delete DB.set[key];
  /* học phí đã lập: đủ cả tháng, chưa biết ngày lễ */
  const gross=invoice(kid,m);DB.lg.push({id:'z67a',hs:kid.id,date:m+'-01',kind:'hp',amt:gross,m,note:'Học phí (nhập tay)',man:1});
  /* sau đó mới đặt ngày nghỉ lễ: một ngày bán trú trong tháng, sau hôm nay không cần */
  const d=mDates(m).find(x=>btHas(kid,dow(x))&&!isClosed(x));DB.hol.push({id:'z67h',d,n:'Nghỉ lễ thử',k:'le'});
  const net=invoice(kid,m),val=holVal(kid,m),cr=holCredit(kid,m);
  const sp=surplusPrev(kid,nm),fb=feeBreak(kid,nm),st=settle(kid,m);
  return{gross,net,val,cr,spAmt:sp.amt,spHol:sp.hol,gross12:fb.gross,due12:fb.due,rf:st.refund,sh:st.hol,rows:st.rows.filter(r=>r.kind==='hol').length,d}},K);
 ok('học phí đã lập đủ tháng, sau đó đặt ngày lễ: phí dư = học phí của ngày nghỉ',R.val>0&&R.net===R.gross-R.val&&R.cr===R.val,R);
 ok('phí dư tháng sau gồm khoản nghỉ lễ, có dòng giải thích trong cách tính',R.sh===R.cr&&R.rf>=R.cr&&R.rows===1&&R.spAmt===R.rf&&R.spHol===R.cr,R);
 ok('học phí tháng sau = ngày học tháng sau trừ phí dư tháng này',R.due12===Math.max(0,R.gross12-R.spAmt),R);
 const P1=await ev(k=>{const kid=kidBy(k.id),nm=sm(CM,1);postSettle(kid,CM);const e=DB.lg.filter(x=>x.hs===kid.id&&x.kind==='hoan'&&x.m===nm);return{n:e.length,a:e.reduce((s,x)=>s+x.amt,0),note:e[0]&&e[0].note,ex:settle(kid,CM).refund,sp:surplusPrev(kid,nm)}},K);
 ok('ghi vào sổ: một khoản "Phí dư" gồm cả phần nghỉ lễ, trừ vào học phí tháng sau',P1.n===1&&P1.a===P1.ex&&/Phí dư/.test(P1.note)&&/nghỉ lễ/.test(P1.note)&&P1.sp.posted&&P1.sp.hol===R.cr,P1);
 /* học phí đã lập bằng số đúng (đã trừ ngày lễ): không có phí dư */
 const N=await ev(k=>{const kid=kidBy(k.id),m=CM;DB.lg=DB.lg.filter(e=>!(e.hs===kid.id&&(e.kind==='hp'||e.kind==='hoan')));delete DB.set[kid.id+'|'+m];
  DB.lg.push({id:'z67b',hs:kid.id,date:m+'-01',kind:'hp',amt:invoice(kid,m),m,note:'Học phí đã trừ ngày lễ'});return{cr:holCredit(kid,m),hol:surplusPrev(kid,sm(m,1)).hol||0}},K);
 ok('học phí đã lập đúng số (đã trừ ngày lễ): không phát sinh phí dư nghỉ lễ',N.cr===0&&N.hol===0,N);
 /* bé không có lịch mà học phí nhập tay: không bị coi là phí dư */
 const Z=await ev(()=>{const kid=DB.kids.find(x=>x.st==='dang'&&!btOf(x).length&&!DB.lich.some(l=>l.hs===x.id));if(!kid)return{skip:1};const m=CM;
  DB.lg.push({id:'z67c',hs:kid.id,date:m+'-01',kind:'hp',amt:3000000,m,note:'nhập tay',man:1});return{cr:holCredit(kid,m)}});
 ok('bé chưa có lịch học trong hệ thống, học phí nhập tay: không bị tính phí dư',Z.skip||Z.cr===0,Z);
 await ev(()=>{DB.lg=DB.lg.filter(e=>!/^z67/.test(e.id));DB.hol=DB.hol.filter(h=>h.id!=='z67h');render()});
 /* 4. nơi khác không còn công nợ */
 await ev(k=>{S.modal={t:'sl',id:k.id};render()},K);await W();
 ok('Sổ học phí của bé không còn thẻ Công nợ hiện tại hay cột Còn lại',!/Công nợ|Còn lại/.test(await page.textContent('.modal, #modal, #app')),'');
 await ev(()=>{S.modal=null});
 await ev(()=>{S.hp.tab='sao';render()});await W();
 ok('Sổ thu chi vẫn hiện danh sách giao dịch',(await page.textContent('#main')).length>50);
 await ev(()=>{go('dash');render()});await W();
 ok('Dashboard trưởng trung tâm không còn Công nợ',!/Công nợ/.test(await page.textContent('#main')));
 await b.close();
 {const o=await open();await login(o.page,'vp');await o.page.evaluate(()=>{go('dash');render()});await o.page.waitForTimeout(150);
  ok('Dashboard Văn phòng không còn Công nợ, có thẻ Học phí tháng',!/Công nợ/.test(await o.page.textContent('#main'))&&/Học phí tháng/.test(await o.page.textContent('#main')));
  await o.page.evaluate(()=>{S.hp={tab:'tq',m:CM,st:'',q:'',gq:'',gm:CM};go('hp');render()});await o.page.waitForSelector('#main table');
  ok('Văn phòng: Học phí học sinh có nhập tay học phí và phí dư',!!(await o.page.$('#main input[data-c="hpv"]'))&&!!(await o.page.$('#main input[data-c="surv"]')));
  await o.b.close()}
 {const o=await open();await login(o.page,'ph');await o.page.evaluate(()=>{go('hp');render()});await o.page.waitForTimeout(200);
  const t=await o.page.textContent('#main');
  ok('Phụ huynh: học phí theo tháng (Học phí, Phải đóng), không còn "Còn phải đóng", "Dư có", công nợ',/Phải đóng/.test(t)&&!/Còn phải đóng|Dư có|Công nợ/.test(t),t.slice(0,300));
  await o.page.evaluate(()=>{go('home');render()});await o.page.waitForTimeout(150);
  ok('Phụ huynh: trang chủ hiện học phí tháng, không còn "còn phải đóng/dư có"',!/còn phải đóng|dư có/.test(await o.page.textContent('#main')));
  await o.b.close()}
 ok('không lỗi trang',errs.length===0,errs);
 console.log(`\nKẾT QUẢ: ${passes} đạt, ${fails} lỗi`);process.exit(fails?1:0)})();
