/* Giáo viên chấm công học sinh và ghi buổi can thiệp ở mọi ngày, mọi tháng (trước đây: điểm danh 7 ngày, buổi 14 ngày);
   chọn được ngày bắt đầu mục tiêu ngắn hạn; vẫn chỉ với trẻ của mình; ngày chưa đến vẫn chưa điểm danh được */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{
 const {b,page,errs}=await open();await login(page,'gv');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||120);
 /* ngày đã qua có buổi 1-1 của chính giáo viên, cách hôm nay: >7 ngày và >2 tháng */
 const F=await ev(()=>{const find=(from,to)=>{for(let i=from;i<=to;i++){const d=addD(TODAY,-i);if(!isSch(d))continue;const r=dayList(d).find(s=>s.kind==='11'&&!s.inc&&rowHas(s,U.id));if(r)return{d,sid:r.sid,k:r.kids[0].id,n:r.kids[0].n}}return null};
  return{a:find(10,30),b:find(75,120),role:U.role}});
 ok('giáo viên mẫu có buổi 1-1 ở ngày cũ hơn 7 ngày và cũ hơn 2 tháng',!!F.a&&!!F.b&&F.role==='gv',F);
 /* 1. điểm danh ngày cũ */
 const A=await ev(f=>({a:canEditAtt(f.a.d),b:canEditAtt(f.b.d),today:canEditAtt(TODAY),future:canEditAtt(addD(TODAY,1))}),F);
 ok('giáo viên sửa được điểm danh ngày cũ hơn 7 ngày và cả tháng trước; ngày chưa đến vẫn chưa được',A.a&&A.b&&A.today&&!A.future,A);
 await ev(f=>{S.dd=Object.assign(S.dd||{},{tab:'roll',date:f.b.d});go('dd');render()},F);await page.waitForSelector('.stb');
 ok('màn Điểm danh theo ngày: ngày cũ hiện nút trạng thái bấm được, không có cảnh báo "chỉ sửa 7 ngày"',!(await page.$('.stb .st[disabled]'))&&!/7 ngày gần nhất/.test(await page.textContent('#main')));
 await page.click('.stb .st-p >> nth=0');await W();
 const R=await ev(f=>({v:DB.att[f.b.d+'|'+f.sid+'|'+f.k]}),F);
 const R2=await ev(f=>{const d=f.b.d,row=dayList(d).find(s=>rowHas(s,U.id));const k=row.kids[0];return{v:DB.att[attKey(d,row.sid,k.id)]}},F);
 ok('bấm "Nghỉ có phép" ở ngày 2–4 tháng trước: ghi vào điểm danh',R2.v==='p'||R.v==='p',{R,R2});
 /* chọn ngày bằng ô ngày */
 await page.fill('#dd-d',F.a.d);await page.dispatchEvent('#dd-d','change');await W();
 ok('chọn ngày bằng ô ngày: hiện đúng ngày đã chọn',(await page.inputValue('#dd-d'))===F.a.d&&await ev(()=>S.dd.date)===F.a.d);
 /* bảng chấm công: sửa ô ở tháng trước */
 const S1=await ev(f=>{ACT.scopen(f.b.k+'|'+f.b.d);render();return{can:canEditAtt(f.b.d)}},F);await page.waitForSelector('.mdc');
 ok('Bảng chấm công: mở ô ngày cũ cho sửa (không báo "chưa sửa được ngày này")',S1.can&&!/Bạn chưa sửa được ngày này/.test(await page.textContent('.mdc')));
 await ev(()=>{S.modal=null;render()});
 /* chỉ trẻ của mình */
 const O=await ev(f=>{const other=DB.kids.find(k=>!canKid(k.id));if(!other)return{skip:true};const key=f.b.d+'|x|'+other.id;ACT.att(f.b.d+'|x|'+other.id+'|cm');return{wrote:DB.att[key]!==undefined}},F);
 ok('trẻ không thuộc mình: vẫn không điểm danh được',O.skip||!O.wrote,O);
 /* 2. buổi can thiệp mọi ngày */
 const kid=F.a.k;
 await ev(f=>{hsInit();go('hs');S.hs.tab='bi';ACT.senew(f.a.k+'|'+f.b.d);render()},F);await page.waitForSelector('#se-d');
 ok('ghi buổi: chọn được ngày 2–4 tháng trước (ô ngày không giới hạn quá khứ)',await page.inputValue('#se-d')===F.b.d&&!(await page.getAttribute('#se-d','min')));
 const SV=await ev(f=>{const m=S.modal;if(!m.it.length){const g=LIBI.find(x=>x.s==='ab');seAddTo(m,[g.id])}m.it[0].tr='VVVVVVVVVV';m.it[0].sg='Ghi lại cho ngày cũ';ACT.sesave();render();return DB.sess.filter(s=>s.k===f.a.k&&s.date===f.b.d&&s.by===U.id).length},F);
 ok('lưu được buổi can thiệp ở ngày cũ',SV>=1,SV);
 const E=await ev(f=>{const s=DB.sess.find(x=>x.k===f.a.k&&x.date===f.b.d&&x.by===U.id);return{can:canEditSess(s),id:s.id,old:s.date<addD(TODAY,-14)}},F);
 ok('sửa được buổi cũ hơn 14 ngày (Sửa, Xóa)',E.can&&E.old,E);
 await ev(id=>{ACT.seedit(id);render()},E.id);await page.waitForSelector('#se-d');
 ok('mở sửa buổi cũ: hiện form đủ dữ liệu cũ',/Ghi lại cho ngày cũ/.test(await ev(()=>document.querySelector('.mdc').innerHTML)));
 await ev(()=>{S.modal=null;render()});
 const D=await ev(id=>{ACT.sesview(id);render();ACT.sedel(id);render();return{t:S.modal&&S.modal.t}},E.id);
 ok('Xóa buổi cũ: hỏi xác nhận',D.t==='ask');await page.click('[data-a="askyes"]');await W();
 ok('xác nhận: buổi đã xóa',await ev(id=>!DB.sess.some(s=>s.id===id),E.id));
 /* 3. ngày bắt đầu mục tiêu ngắn hạn */
 const P=await ev(f=>{const k=f.a.k,g=LIBI.filter(x=>x.s==='ab')[7].id,d=addD(TODAY,-40);DB.plans=DB.plans.filter(p=>!(p.k===k&&p.g===g));
  S.modal={t:'gp',mode:'plan',k,back:null,f:{dom:'',src:'',head:'',age:'',q:''},sel:[g],sm:'',d};S.pg.gp=1;render();
  const has=!!document.querySelector('#gp-d');ACT.gpok();const p=DB.plans.find(x=>x.k===k&&x.g===g);return{has,from:p&&p.from,due:p&&p.due,want:d,wantDue:addD(d,90)}},F);
 ok('bộ chọn mục tiêu: có ô Ngày bắt đầu; mục tiêu ngắn hạn nhận đúng ngày đã chọn (kể cả ngày cũ)',P.has&&P.from===P.want&&P.due===P.wantDue,P);
 await ev(f=>{S.modal={t:'hs',id:f.a.k,tab:'kh'};render()},F);await page.waitForSelector('input[data-c="plfrom"]');
 const nd=await ev(()=>addD(TODAY,-100));
 await page.fill('input[data-c="plfrom"] >> nth=0',nd);await page.dispatchEvent('input[data-c="plfrom"] >> nth=0','change');await W(250);
 ok('thẻ kế hoạch: sửa được ngày bắt đầu mục tiêu',await ev(d=>DB.plans.some(p=>p.from===d),nd));
 const T=await ev(f=>{S.modal={t:'tg'};render();const form=document.querySelector('#tgf');form.elements.k.value=f.a.k;form.elements.lv.value='n';form.elements.n.value='Mục tiêu tự viết có ngày';form.elements.d0.value=addD(TODAY,-20);FORM.tgf(form);const t=DB.tg[DB.tg.length-1],p=DB.plans.find(x=>x.g==='tg:'+t.id);return{from:p&&p.from,want:addD(TODAY,-20)}},F);
 ok('form tự viết mục tiêu: chọn được ngày bắt đầu',T.from===T.want,T);
 ok('không lỗi trình duyệt (Giáo viên)',errs.length===0,errs);
 await b.close();
 /* ---------- quyền khác không đổi ---------- */
 for(const role of ['tt','ql','vp']){
  const o=await open();await login(o.page,role);
  const r=await o.page.evaluate(()=>({old:canEditAtt(addD(TODAY,-90)),fut:canEditAtt(addD(TODAY,1))}));
  ok(role+': '+(role==='vp'?'vẫn chỉ xem điểm danh':'sửa được điểm danh ngày cũ'),role==='vp'?(!r.old&&!r.fut):(r.old&&!r.fut),r);
  await o.b.close()}
 console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
