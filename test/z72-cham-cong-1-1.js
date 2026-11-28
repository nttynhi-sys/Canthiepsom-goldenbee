/* Chấm công 1-1: công của từng giáo viên trên các học sinh mình dạy 1-1 (cả Fulltime và Partime); cột riêng ở Bảng công tháng */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
(async()=>{
 const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 const P=await ev(()=>{const m=sm(CM,-1);DB.sub=[];
  const rows=ccOneRows(m);const byG={};rows.forEach(r=>{byG[r.g]=(byG[r.g]||0)+1});
  const ids=Object.keys(byG).filter(id=>stBy(id)&&byG[id]>=5).sort((a,b)=>byG[b]-byG[a]);
  const ft=ids[0],pt=ids[1];if(ft){const s=stBy(ft);s.ft=true;s.cc=true;s.pay=Object.assign({},s.pay,{mode:'kethop',base:6000000,rate:60000})}   /* giáo viên Fulltime làm 1-1 cá nhân */
  if(pt){const s=stBy(pt);s.ft=false;s.cc=false;s.pay=Object.assign({},s.pay,{mode:'buoi',rate:60000})}
  /* ghi điểm danh cho 4 ca đầu của giáo viên Fulltime: có mặt, có mặt, nghỉ P, nghỉ KP */
  const mine=rows.filter(r=>r.g===ft&&r.d<TODAY).slice(0,4);['cm','cm','p','kp'].forEach((c,i)=>{if(mine[i])DB.att[attKey(mine[i].d,mine[i].l.id,mine[i].l.hs)]=c});
  /* số ca theo lịch của giáo viên: dựa vào dayList độc lập */
  let exp=0;for(const d of mDates(m)){if(!isSch(d))continue;dayList(d).forEach(s=>{if((s.kind==='11'||s.kind==='bu')&&s.gv===ft)exp++})}
  return{m,ft,pt,ftIs:!!ft&&isFT(stBy(ft)),exp,k4:mine.length}});
 ok('có giáo viên Fulltime và giáo viên khác có từ 5 ca 1-1 trở lên trong tháng',!!P.ft&&!!P.pt,P);
 const S1=await ev(p=>{const o=ccOneStat(p.ft,p.m),pc=gvPct();return{n:o.n,cm:o.cm,p:o.p,kp:o.kp,cong:o.cong,kids:o.kids.length,sumKids:o.kids.reduce((a,x)=>a+x.n,0),pc}},P);
 ok('tổng số ca 1-1 của giáo viên khớp lịch ngày (dayList)',S1.n===P.exp&&S1.n>=5,{S1,exp:P.exp});
 ok('số buổi có mặt, nghỉ P, nghỉ KP khớp điểm danh đã ghi (2 có mặt, 1 P, 1 KP)',S1.cm>=2&&S1.p>=1&&S1.kp>=1,S1);
 ok('tổng ca theo từng bé cộng lại bằng tổng ca của giáo viên',S1.sumKids===S1.n&&S1.kids>=1,S1);
 ok('công 1-1 quy đổi theo tỷ lệ bảng lương (có mặt 100%, KP theo cấu hình)',Math.abs(S1.cong-(S1.cm+S1.kp*S1.pc.kp/100+S1.p*S1.pc.p/100))<1e-9,S1);
 /* màn hình tab mới */
 await ev(p=>{S.cc={tab:'m11',m:p.m};go('cc');render()},P);await page.waitForSelector('#main table');
 const tx=await page.textContent('#main');
 ok('có tab "Chấm công 1-1" với bảng tổng hợp: tổng ca, có mặt, nghỉ P, nghỉ KP, công 1-1',/Chấm công 1-1/.test(tx)&&/Tổng hợp theo giáo viên/.test(tx)&&/Nghỉ P/.test(tx)&&/Nghỉ KP/.test(tx)&&/Công 1-1/.test(tx),tx.slice(0,200));
 const nm=await ev(p=>[sn(p.ft),ccOneStat(p.ft,p.m).kids[0].k.n],P);
 ok('hiện tên giáo viên Fulltime (nhãn Fulltime) và tên học sinh mình dạy',nm.every(n=>tx.includes(n))&&/Fulltime/.test(tx),nm);
 const tabs=await page.$$eval('#main .tabs .tab',e=>e.map(x=>x.textContent.trim()));
 ok('tab nằm cạnh Hôm nay, Bảng công tháng, Đơn nghỉ phép',tabs.includes('Chấm công 1-1')&&tabs.includes('Bảng công tháng'),tabs);
 /* dạy thay: ca dạy thay tính cho người dạy thay, không tính cho giáo viên gốc */
 const D=await ev(p=>{const m=p.m,rows=ccOneRows(m).filter(r=>r.og===p.ft&&r.d<TODAY&&r.kind==='11');const r0=rows[rows.length-1];
  const T2=DB.staff.find(s=>s.st==='dang'&&isTeacher(s)&&s.id!==p.ft);const before={ft:ccOneStat(p.ft,m).n,t2:ccOneStat(T2.id,m).n};
  DB.sub.push({id:'zc1',d:r0.d,sid:r0.l.id,hs:r0.l.hs,gv:T2.id,og:p.ft,by:'t',at:TODAY});
  const a=ccOneStat(p.ft,m),b=ccOneStat(T2.id,m);return{before,ft:{n:a.n,given:a.given},t2:{n:b.n,subIn:b.subIn}}},P);
 ok('ca được người khác dạy thay: giáo viên gốc giảm 1 ca (ghi "Được thay"), người dạy thay tăng 1 ca (cột Dạy thay)',D.ft.n===D.before.ft-1&&D.ft.given>=1&&D.t2.n===D.before.t2+1&&D.t2.subIn>=1,D);
 /* Bảng công tháng có cột riêng */
 await ev(p=>{S.cc={tab:'bang',m:p.m};go('cc');render()},P);await page.waitForSelector('table.sheet');
 const ths=await page.$$eval('table.sheet thead th',e=>e.map(x=>x.textContent.trim()));
 ok('Bảng công tháng có cột riêng Ca 1-1, Có mặt, Nghỉ P, Nghỉ KP',['Ca 1-1','Có mặt','Nghỉ P','Nghỉ KP'].every(c=>ths.includes(c)),ths.slice(-8));
 const row=await ev(p=>{const tr=[...document.querySelectorAll('table.sheet tbody tr')].find(r=>r.textContent.includes(given(stBy(p.ft).n)));const tds=tr?[...tr.querySelectorAll('td')].map(x=>x.textContent.trim()):[];return tds.slice(-4)},P);
 const o2=await ev(p=>{const o=ccOneStat(p.ft,p.m);return[String(o.n),String(o.cm),String(o.p),String(o.kp)]},P);
 ok('dòng của giáo viên Fulltime ở Bảng công tháng hiện đúng số ca 1-1, có mặt, P, KP',JSON.stringify(row)===JSON.stringify(o2),{row,o2});
 /* Excel */
 await ev(()=>{window.__x=null;window.exportXLSX=async(n,sh)=>{window.__x={n,sh}}});
 await ev(p=>{S.cc={tab:'m11',m:p.m};go('cc');render()},P);await page.click('[data-a="cc11xl"]');await W();
 const X=await ev(()=>window.__x?{n:window.__x.n,s:window.__x.sh.map(s=>[s.n,s.rows.length])}:null);
 ok('xuất Excel chấm công 1-1: sheet Tổng hợp và Chi tiết',X&&X.s[0][0]==='Tổng hợp'&&X.s[1][0]==='Chi tiết'&&X.s[1][1]>5,X);
 ok('không lỗi trang',errs.length===0,errs);
 await b.close();
 /* giáo viên: chỉ thấy công 1-1 của mình */
 {const o=await open();await login(o.page,'gv');
  const G=await o.page.evaluate(()=>{const m=sm(CM,-1);S.cc={tab:'m11',m};go('cc');render();const tabs=[...document.querySelectorAll('#main .tabs .tab')].map(x=>x.textContent.trim());const L=cc11List(m,ccOneRows(m));
   return{tabs,onlyMe:L.every(x=>x.gv===U.id),n:L.length,x:!!document.querySelector('[data-a="cc11xl"]')}});
  ok('giáo viên: có tab "Chấm công 1-1 của tôi", chỉ thấy công của chính mình, không có nút xuất Excel toàn trung tâm',G.tabs.includes('Chấm công 1-1 của tôi')&&G.onlyMe&&!G.x,G);
  await o.b.close()}
 console.log(`\nKẾT QUẢ: ${passes} đạt, ${fails} lỗi`);process.exit(fails?1:0)})();
