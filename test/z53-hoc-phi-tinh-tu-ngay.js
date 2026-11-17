/* Học phí: bé vào học giữa tháng, thời gian tính phí riêng (k.fs tính từ ngày, k.fe đến hết ngày). Không đặt thì tính như cũ. */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{
 const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||120);
 /* ---------- A. tính toán ---------- */
 const A=await ev(()=>{const m=CM,k=DB.kids.find(x=>x.st==='dang'&&x.bt&&invoice(x,m)>0&&!hasFeeWin(x)),r={id:k.id};
  const full=invoice(k,m);r.full=full;r.same=invoice(k,m,true)===full;
  const mid=m+'-16';k.fs=mid;
  const exp=x=>sched(x,m).filter(y=>y.d>=mid);
  r.mid=invoice(k,m);r.midExp=exp(k).filter(x=>x.kind==='11'&&!x.inc).reduce((a,x)=>a+feeSlot(k,x.sid),0)+exp(k).filter(x=>x.kind==='bt').length*kidBt(k);
  r.raw=invoice(k,m,true);
  k.fs=sm(m,1)+'-01';r.after=invoice(k,m);r.afterNext=invoice(k,sm(m,1));
  delete k.fs;k.fe=m+'-10';r.endEarly=invoice(k,m);r.endExp=sched(k,m).filter(y=>y.d<=m+'-10').filter(x=>x.kind==='11'&&!x.inc).reduce((a,x)=>a+feeSlot(k,x.sid),0)+sched(k,m).filter(y=>y.d<=m+'-10'&&y.kind==='bt').length*kidBt(k);
  k.fs=m+'-05';k.fe=m+'-20';r.window=invoice(k,m);r.windowFeeBreak=feeBreak(k,m).gross;
  delete k.fs;delete k.fe;r.back=invoice(k,m);return r});
 ok('chưa đặt thời gian tính phí: học phí tính như cũ (trọn tháng)',A.same&&A.back===A.full&&A.full>0,A);
 ok('tính từ giữa tháng (16): chỉ tính các buổi từ ngày 16, nhỏ hơn trọn tháng',A.mid===A.midExp&&A.mid>0&&A.mid<A.full&&A.raw===A.full,A);
 ok('tính từ đầu tháng sau: tháng này 0, tháng sau có học phí',A.after===0&&A.afterNext>0,A);
 ok('tính đến hết ngày 10: chỉ tính các buổi đến ngày 10',A.endEarly===A.endExp&&A.endEarly>0&&A.endEarly<A.full,A);
 ok('khoảng từ 5 đến 20: học phí thẻ phụ huynh (feeBreak) khớp invoice',A.window===A.windowFeeBreak&&A.window>0&&A.window<A.full,A);
 /* ---------- B. ngày nghỉ lễ và hoàn phí chỉ tính trong khoảng ---------- */
 const B=await ev(()=>{const m=CM,k=DB.kids.find(x=>x.st==='dang'&&x.bt&&invoice(x,m)>0&&!hasFeeWin(x)&&btHas(x,1));
  const mon=mDates(m).find(d=>dow(d)===1&&d>m+'-20'),before=mDates(m).find(d=>dow(d)===1&&d<m+'-08');
  const base=holImpact(mon).bt,baseB=holImpact(before).bt;
  k.fs=m+'-21';const a1=holImpact(before).bt,a2=holImpact(mon).bt;delete k.fs;
  return{baseB,a1,base,a2}});
 ok('ngày nghỉ lễ trước ngày bắt đầu tính phí không tính cho bé đó; sau ngày đó vẫn tính',B.a1===B.baseB-1&&B.a2===B.base,B);
 const C=await ev(()=>{const m=CM,k=DB.kids.find(x=>x.st==='dang'&&x.bt&&invoice(x,m)>0&&!hasFeeWin(x)),d0=sched(k,m).find(x=>x.kind==='bt'&&x.d<WD);
  if(!d0)return{skip:true};DB.att[d0.d+'|'+d0.sid+'|'+k.id]='kp';const a=settle(k,m).lost;k.fs=addD(d0.d,1);const b2=settle(k,m).lost;delete k.fs;delete DB.att[d0.d+'|'+d0.sid+'|'+k.id];return{a,b2}});
 ok('nghỉ không phép trước ngày bắt đầu tính phí không bị tính phí nghỉ',C.skip||(C.a>0&&C.b2===0),C);
 /* ---------- C. giao diện: Trưởng Trung tâm lưu, hóa đơn đã lập được cập nhật ---------- */
 const K=await ev(()=>{const m=CM,k=DB.kids.find(x=>x.st==='dang'&&x.bt&&invoice(x,m)>0&&!hasFeeWin(x));
  DB.lg=DB.lg.filter(e=>!(e.hs===k.id&&e.kind==='hp'&&e.m===m));DB.lg.push({id:'eT'+uid(),hs:k.id,date:m+'-01',kind:'hp',amt:invoice(k,m),m,note:'Học phí '+mLow(m)});S.hp=Object.assign({tab:'tq',m,st:'',q:''},S.hp);go('hp');render();return{id:k.id,n:k.n,m,full:invoice(k,m)}});
 await ev(n=>{S.hp.q=n;S.hp.tab='cn';S.pg.hp=1;render()},K.n);
 const hasBtn=await page.$('#main [data-a="kfwopen"]');
 ok('Học phí: có nút "Thời gian tính phí" ở dòng của bé',!!hasBtn);
 await ev(id=>{ACT.kfwopen(id);render()},K.id);await page.waitForSelector('#kfwf');
 ok('cửa sổ có ngày bắt đầu đi học, tính phí từ, tính phí đến, và bảng so sánh 3 tháng',!!(await page.$('#kf-sd'))&&!!(await page.$('#kf-fs'))&&!!(await page.$('#kf-fe'))&&(await page.$$('#kfwf table tbody tr')).length===3);
 await page.fill('#kf-fs',K.m+'-16');await page.fill('#kf-fe','');await page.click('#kfwf button[type=submit]');await W();
 const ask1=await ev(()=>({t:S.modal&&S.modal.t,msg:S.modal&&S.modal.msg}));
 ok('lưu: hỏi có cập nhật hóa đơn đã lập không, nêu số cũ và số mới',ask1.t==='ask'&&/hóa đơn đã lập/.test(ask1.msg)&&/→/.test(ask1.msg),ask1);
 await page.click('[data-a="askyes"]');await W(200);
 const D=await ev(k=>{const kid=kidBy(k.id),es=DB.lg.filter(e=>e.hs===k.id&&e.kind==='hp'&&e.m===k.m);return{fs:kid.fs,amt:es[0]&&es[0].amt,inv:invoice(kid,k.m),n:es.length}},K);
 ok('hóa đơn đã lập được cập nhật theo thời gian tính phí mới',D.fs===K.m+'-16'&&D.n===1&&D.amt===D.inv&&D.amt<K.full,D);
 /* kiểm tra dữ liệu */
 await ev(id=>{ACT.kfwopen(id);render()},K.id);await page.waitForSelector('#kfwf');
 await page.fill('#kf-fs',K.m+'-20');await page.fill('#kf-fe',K.m+'-10');await page.click('#kfwf button[type=submit]');await W();
 ok('ngày kết thúc trước ngày bắt đầu: báo lỗi, không lưu',/cùng ngày hoặc sau/.test(await page.textContent('#kfwf .err'))&&await ev(id=>kidBy(id).fs,K.id)===K.m+'-16');
 await page.click('[data-a="kfwclr"]');await W();
 ok('Bỏ thời gian tính phí riêng: trở về tính trọn tháng',await ev(id=>{const k=kidBy(id);return !k.fs&&!k.fe&&!S.modal},K.id));
 ok('không lỗi trình duyệt (Trưởng Trung tâm)',errs.length===0,errs);
 await b.close();
 /* ---------- D. quyền: Văn phòng làm được, Quản lý và Giáo viên không ---------- */
 for(const role of ['vp','ql','gv']){
  const o=await open();await login(o.page,role);
  const r=await o.page.evaluate(()=>{const k=DB.kids.find(x=>x.st==='dang'&&myKids().some(y=>y.id===x.id));const before=k.fs;ACT.kfwopen(k.id);return{canMoney:canMoney(),modal:S.modal&&S.modal.t}});
  ok(role+': '+(role==='vp'?'mở được cửa sổ thời gian tính phí':'không mở được (không có quyền tiền)'),(role==='vp')===(r.modal==='kfw'),r);
  await o.b.close()}
 console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
