/* Công dạy thay: cuối tháng biết mỗi giáo viên dạy thay bao nhiêu ca, với học sinh nào; khớp bảng lương theo ca */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{
 const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 /* dựng dữ liệu: hai giáo viên dạy thay vài ca ở tháng trước, với các trạng thái điểm danh khác nhau */
 const S0=await ev(()=>{const m=sm(CM,-1);DB.sub=[];
  const ls=DB.lich.filter(l=>l.type==='11'&&kidBy(l.hs)&&kidBy(l.hs).st==='dang'),T=DB.staff.filter(s=>s.st==='dang'&&isTeacher(s));
  const g1=T[0],g2=T[1];const out=[];
  const pick=(n)=>{const r=[];for(const l of ls){if(r.length>=n)break;const d=mDates(m).find(x=>dow(x)===l.day&&!isClosed(x)&&x<TODAY&&!r.some(y=>y.d===x&&y.l.id===l.id));if(d&&l.gv!==g1.id&&l.gv!==g2.id)r.push({l,d})}return r};
  const R=pick(5);if(R.length<5)return{skip:1,n:R.length};
  const codes=['cm','cm','kp','p',''];
  R.forEach((x,i)=>{const g=i<3?g1:g2;DB.sub.push({id:'zs'+i,d:x.d,sid:x.l.id,hs:x.l.hs,gv:g.id,og:x.l.gv,by:'t',at:TODAY,n:''});if(codes[i])DB.att[attKey(x.d,x.l.id,x.l.hs)]=codes[i];else delete DB.att[attKey(x.d,x.l.id,x.l.hs)]});
  return{m,g1:g1.id,g2:g2.id,kids:[...new Set(R.slice(0,3).map(x=>x.l.hs))].length,n:R.length}});
 ok('dựng được 5 ca dạy thay của 2 giáo viên',!S0.skip,S0);
 const A=await ev(s=>{const a=subStat(s.g1,s.m),b=subStat(s.g2,s.m),pc=gvPct();return{a:{n:a.n,cm:a.cm,abs:a.abs,chua:a.chua,cong:a.cong,kids:a.kids.length},b:{n:b.n,cm:b.cm,abs:b.abs,chua:b.chua,cong:b.cong},pc}},S0);
 ok('giáo viên 1: 3 ca (2 có mặt, 1 bé nghỉ không phép), công = 2 + tỷ lệ nghỉ KP',A.a.n===3&&A.a.cm===2&&A.a.abs===1&&Math.abs(A.a.cong-(2+A.pc.kp/100))<1e-9,A);
 ok('giáo viên 2: 2 ca (1 bé nghỉ có phép, 1 chưa điểm danh)',A.b.n===2&&A.b.cm===0&&A.b.abs===1&&A.b.chua===1&&Math.abs(A.b.cong-A.pc.p/100)<1e-9,A);
 /* màn hình */
 await ev(s=>{S.ds=Object.assign({tab:'cg',m:s.m});go('ds');render()},S0);await page.waitForSelector('#main table');
 const txt=await page.textContent('#main');
 ok('tab "Công dạy thay": hiện giáo viên, số ca, công quy đổi và tên bé',/Công dạy thay/.test(txt)&&/Tổng hợp theo giáo viên/.test(txt)&&/Công quy đổi/.test(txt),txt.slice(0,260));
 const nm=await ev(s=>[subStat(s.g1,s.m).kids[0].k.n,sn(s.g1),sn(s.g2)],S0);
 ok('chi tiết: tên giáo viên dạy thay và tên bé dạy thay hiện đủ',nm.every(n=>txt.includes(n)),nm);
 ok('hiện các ngày dạy thay dạng thẻ trạng thái (có mặt, bé nghỉ, chưa điểm danh)',(await page.$$('#main .tag, #main .tg')).length>0||/\d\d\/\d\d/.test(txt));
 /* chuyển tháng */
 await page.click('[data-a="dsmon"][data-v="1"]');await W();
 ok('chuyển sang tháng sau: không có ca dạy thay thì báo trống',(await ev(()=>S.ds.m))===(await ev(()=>CM))&&/Chưa có ca dạy thay nào/.test(await page.textContent('#main')));
 await ev(s=>{S.ds.m=s.m;render()},S0);
 /* Excel */
 await ev(()=>{window.__x=null;window.exportXLSX=async(n,sh)=>{window.__x={n,sh}}});
 await page.click('[data-a="dscx"]');await W();
 const X=await ev(()=>window.__x?{n:window.__x.n,s:window.__x.sh.map(s=>[s.n,s.rows.length]),h:window.__x.sh[1].rows[0]}:null);
 ok('xuất Excel: sheet Tổng hợp (2 giáo viên) và Chi tiết (5 ca)',X&&X.s[0][1]===3&&X.s[1][1]===6&&X.h.includes('Họ tên bé'),X);
 /* phiếu lương */
 const SL=await ev(s=>{const g=stBy(s.g1);const L=slipLines(g,s.m).L.filter(x=>/Dạy thay/.test(x[0]));return{n:L.length,t:L[0]&&L[0][0],v:L[0]&&L[0][1],mode:g.pay&&g.pay.mode}},S0);
 ok('phiếu lương giáo viên có dòng "Dạy thay N ca", kèm tên bé, không có số tiền riêng',SL.n===1&&/Dạy thay 3 ca/.test(SL.t)&&SL.v===null,SL);
 /* tiền ca đã nằm trong lương theo ca: công dạy thay tính vào payroll (hình thức theo ca) */
 const PY=await ev(s=>{const g=stBy(s.g1);const before=payroll(g,s.m).teach;const sb=DB.sub.slice();DB.sub=DB.sub.filter(x=>x.gv!==g.id);const after=payroll(g,s.m).teach;DB.sub=sb;return{before,after,diff:before-after}},S0);
 ok('số ca có mặt trong lương tăng đúng bằng số ca dạy thay có mặt (2)',PY.diff===2,PY);
 /* quyền: giáo viên không có mục Dạy thay */
 await b.close();
 {const o=await open();await login(o.page,'gv');
  const G=await o.page.evaluate(()=>({sub:canSub()}));
  ok('giáo viên không có quyền xem màn Dạy thay',G.sub===false,G);await o.b.close()}
 ok('không lỗi trang',errs.length===0,errs);
 console.log(`\nKẾT QUẢ: ${passes} đạt, ${fails} lỗi`);process.exit(fails?1:0)})();
