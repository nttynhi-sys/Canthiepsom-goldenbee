/* Dạy thay: giáo viên Partime được tính công và tiền ca dạy thay; Fulltime chỉ ghi nhận công, không cộng tiền; giáo viên nghỉ không được tính ca đó; giáo viên dạy thay thấy bé ở điểm danh hôm đó */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
(async()=>{
 const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 const S0=await ev(()=>{const m=sm(CM,-1);DB.sub=[];
  const T=DB.staff.filter(s=>s.st==='dang'&&isTeacher(s)&&s.role==='gv');
  const ls=DB.lich.filter(l=>l.type==='11'&&kidBy(l.hs)&&kidBy(l.hs).st==='dang');
  const l0=ls[0],og=stBy(l0.gv);
  const others=T.filter(t=>t.id!==og.id&&t.id!==l0.gv);
  const tf=others[0],tp=others[1];
  /* tf: Fulltime lương kết hợp (lương cơ bản + theo ca); tp: Partime trả theo ca */
  tf.ft=true;tf.cc=true;tf.pay=Object.assign({},tf.pay,{mode:'kethop',base:6000000,rate:60000});
  tp.ft=false;tp.cc=false;tp.pay=Object.assign({},tp.pay,{mode:'buoi',base:0,rate:60000});
  /* chọn 2 buổi của giáo viên gốc ở tháng trước, mỗi buổi một ngày khác nhau */
  const mine=ls.filter(l=>l.gv===og.id&&l.day>=1&&l.day<=5);if(mine.length<2)return{skip:1,n:mine.length};
  const dayOf=l=>mDates(m).find(x=>dow(x)===l.day&&!isClosed(x)&&x<TODAY);
  const a=mine[0],c=mine[1],da=dayOf(a),dc=dayOf(c);
  DB.att[attKey(da,a.id,a.hs)]='cm';DB.att[attKey(dc,c.id,c.hs)]='cm';
  const base={og:payroll(og,m).teach,tf:payroll(tf,m).teach,tp:payroll(tp,m).teach,tfG:payroll(tf,m).bySess,tpG:payroll(tp,m).bySess};
  DB.sub.push({id:'zf1',d:da,sid:a.id,hs:a.hs,gv:tf.id,og:og.id,by:'t',at:TODAY});
  DB.sub.push({id:'zp1',d:dc,sid:c.id,hs:c.hs,gv:tp.id,og:og.id,by:'t',at:TODAY});
  const after={og:payroll(og,m).teach,tf:payroll(tf,m).teach,tp:payroll(tp,m).teach,tfG:payroll(tf,m).bySess,tpG:payroll(tp,m).bySess,tpGross:payroll(tp,m).gross};
  return{m,og:og.id,tf:tf.id,tp:tp.id,a:{id:a.id,hs:a.hs,d:da},c:{id:c.id,hs:c.hs,d:dc},base,after,ftIs:isFT(tf),ptIs:isFT(tp)}});
 ok('dựng được giáo viên Fulltime, Partime và 2 buổi dạy thay',!S0.skip&&S0.ftIs===true&&S0.ptIs===false,S0);
 ok('Partime: ca dạy thay có mặt được tính (số ca tăng 1, tiền theo ca tăng 60.000 ₫)',S0.after.tp===S0.base.tp+1&&S0.after.tpG-S0.base.tpG===60000,S0);
 ok('Fulltime: ca dạy thay KHÔNG được cộng vào tiền theo ca (số ca và tiền theo ca không đổi)',S0.after.tf===S0.base.tf&&S0.after.tfG===S0.base.tfG,S0);
 ok('giáo viên nghỉ (giáo viên gốc): không được tính 2 ca đã có người dạy thay',S0.after.og===S0.base.og-2,S0);
 /* báo cáo công dạy thay */
 const R=await ev(s=>{const f=subStat(s.tf,s.m),p=subStat(s.tp,s.m),sf=subPay(s.tf,f),sp=subPay(s.tp,p);return{fn:f.n,fcong:f.cong,pn:p.n,pcong:p.cong,fAuto:sf&&sf.auto,pAuto:sp&&sp.auto,pAmt:sp&&sp.amt}},S0);
 ok('Fulltime vẫn được ghi nhận công dạy thay (1 ca, 1 công) nhưng không có tiền ca',R.fn===1&&R.fcong===1&&R.fAuto===false,R);
 ok('Partime: công dạy thay 1 công, tiền ca 60.000 ₫',R.pn===1&&R.pcong===1&&R.pAuto===true&&R.pAmt===60000,R);
 await ev(s=>{S.ds={tab:'cg',m:s.m};go('ds');render()},S0);await page.waitForSelector('#main table');
 const tx=await page.textContent('#main');
 ok('màn Công dạy thay: ghi "Fulltime: chỉ ghi công, không cộng tiền" và giải thích quy tắc',/Fulltime: chỉ ghi công, không cộng tiền/.test(tx)&&/Giáo viên Partime \(trả theo ca\) được tính tiền/.test(tx),tx.slice(0,300));
 /* phiếu lương */
 const SL=await ev(s=>({f:slipLines(stBy(s.tf),s.m).L.filter(x=>/Dạy thay/.test(x[0])).map(x=>x[0]),p:slipLines(stBy(s.tp),s.m).L.filter(x=>/Dạy thay/.test(x[0])).map(x=>x[0])}),S0);
 ok('phiếu lương Fulltime ghi chỉ ghi nhận công, không cộng tiền; Partime ghi đã tính tiền',SL.f.length===1&&/Fulltime: chỉ ghi nhận công dạy thay, không cộng thêm tiền/.test(SL.f[0])&&SL.p.length===1&&/Đã tính tiền/.test(SL.p[0]),SL);
 /* giáo viên dạy thay thấy bé ở điểm danh hôm đó, giáo viên nghỉ thì không */
 const V=await ev(s=>{setUser(findAccount(stBy(s.tf).em));S.dd={tab:'roll',date:s.a.d,m:s.a.d.slice(0,7),q:'',pr:'',fl:'',gv:'',kid:'',un:false};go('dd');render();
  const row=dayList(s.a.d).find(r=>r.sid===s.a.id);
  const k0=DB.att[attKey(s.a.d,s.a.id,s.a.hs)];ACT.att(s.a.d+'|'+s.a.id+'|'+s.a.hs+'|kp');const k1=DB.att[attKey(s.a.d,s.a.id,s.a.hs)];ACT.att(s.a.d+'|'+s.a.id+'|'+s.a.hs+'|cm');return{see:rowHas(row,U.id),can:canKidOn(s.a.hs,s.a.d,s.a.id),wrote:k1==='kp'&&DB.att[attKey(s.a.d,s.a.id,s.a.hs)]==='cm'&&k0==='cm',edit:canEditAtt(s.a.d),html:document.querySelector('#main')?document.querySelector('#main').textContent:''}},S0);
 ok('giáo viên dạy thay: thấy bé trong Điểm danh hôm đó, kèm nhãn "Dạy thay", ghi điểm danh được',V.see&&V.can&&V.wrote&&V.edit&&/Dạy thay/.test(V.html)&&V.html.includes(await ev(h=>kidBy(h).n,S0.a.hs)),{see:V.see,can:V.can,edit:V.edit,tag:/Dạy thay/.test(V.html),kid:V.html.includes(await ev(h=>kidBy(h).n,S0.a.hs)),n:await ev(h=>kidBy(h).n,S0.a.hs),t:V.html.slice(300,700)});
 const O=await ev(s=>{setUser(findAccount(stBy(s.og).em));S.dd={tab:'roll',date:s.a.d,m:s.a.d.slice(0,7),q:'',pr:'',fl:'',gv:'',kid:'',un:false};go('dd');render();const row=dayList(s.a.d).find(r=>r.sid===s.a.id);return{see:rowHas(row,U.id),html:document.querySelector('#main').textContent}},S0);
 ok('giáo viên nghỉ: không còn thấy buổi đã giao người dạy thay trong Điểm danh hôm đó',!O.see&&!O.html.includes('Dạy thay'),O.html.slice(0,200));
 await b.close();
 ok('không lỗi trang',errs.length===0,errs);
 console.log(`\nKẾT QUẢ: ${passes} đạt, ${fails} lỗi`);process.exit(fails?1:0)})();
