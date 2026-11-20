/* (1) Chấm công nghỉ trước nhiều ngày, nhiều tháng, cho nhiều nhân sự (Trưởng Trung tâm, Quản lý, Văn phòng);
   (2) Dạy thay: chọn một hoặc nhiều ngày; (3) hộp tích "Hiện tất cả buổi" bỏ tích được */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 /* ---------- A. chấm công nghỉ nhiều ngày ---------- */
 const A0=await ev(()=>{const st=DB.staff.filter(s=>s.st==='dang'&&needCC(s)&&s.role==='gv'&&isFT(s)).slice(0,2);if(st.length<2)return null;
  const from=addD(TODAY,10),to=addD(TODAY,130);
  const days=[];for(let d=from;d<=to;d=addD(d,1))if(isW(d))days.push(d);
  const mons=days.filter(d=>dow(d)===1&&!isClosed(d)).length,open=days.filter(d=>!isClosed(d)).length,months=[...new Set(days.map(d=>d.slice(0,7)))].length;
  return{a:st[0].id,b:st[1].id,from,to,days:days.length,open,mons,months}});
 ok('có 2 nhân sự fulltime và khoảng ngày sắp tới kéo dài nhiều tháng',!!A0&&A0.months>=3,A0);
 await ev(()=>{S.cc={tab:'hn',m:CM};go('cc');render()});await page.waitForSelector('[data-a="tsm"]');
 ok('Trưởng Trung tâm có nút "Chấm nghỉ nhiều ngày" ở trang Chấm công',!!(await page.$('[data-a="tsm"]')));
 await page.click('[data-a="tsm"]');await page.waitForSelector('#tsmf');
 ok('hộp chấm nghỉ nhiều ngày: có danh sách nhân sự, từ ngày, đến ngày, thứ trong tuần, cả ngày/nửa ngày, loại nghỉ',(await page.$$('#tsmf input[data-c="tsms"]')).length>=2&&!!(await page.$('#tm-f'))&&!!(await page.$('#tm-t'))&&(await page.$$('#tsmf input[data-c="tsmw"]')).length===6&&(await page.$$('#tsmf input[name=l]')).length===3&&!!(await page.$('#tm-k')));
 await page.check('#tsmf input[data-c="tsms"][value="'+A0.a+'"]');await page.check('#tsmf input[data-c="tsms"][value="'+A0.b+'"]');
 await page.fill('#tm-f',A0.from);await page.dispatchEvent('#tm-f','change');await page.fill('#tm-t',A0.to);await page.dispatchEvent('#tm-t','change');
 await page.check('#tsmf input[name=l][value=am]');
 ok('hộp hiện số ngày làm việc của khoảng đã chọn',new RegExp('<b>'+A0.days+'</b> ngày làm việc').test(await page.innerHTML('#tsmf')));
 await page.click('#tsmf button[type=submit]');await W(300);
 const R=await ev(p=>{const out={n:0,bad:0,sun:0,closed:0,fut:0,full:0};for(const id of [p.a,p.b]){for(let d=p.from;d<=p.to;d=addD(d,1)){const r=DB.ts[id+'|'+d];if(!r)continue;out.n++;if(dow(d)===0)out.sun++;if(isClosed(d))out.closed++;if(r.l!=='am'||r.lk||r.i||r.o)out.bad++;if(tsSt(id,d)==='half')out.full++}}return out},A0);
 ok('chấm nghỉ nửa ngày sáng trước cho 2 nhân sự nhiều tháng: mỗi ngày làm việc một dòng, không Chủ nhật, không ngày Trung tâm nghỉ',R.n===2*A0.open&&R.sun===0&&R.closed===0,[R,A0]);
 ok('ngày sắp tới: bản ghi chưa có giờ vào ra, trạng thái nửa ngày',R.bad===0&&R.full===R.n,R);
 ok('thông báo kết quả và hộp đóng',!(await page.$('#tsmf')));
 /* công của tương lai không bị tính trước */
 ok('ngày sắp tới chưa tính vào công tháng này',await ev(p=>{const q=payroll(stBy(p.a),CM);return q.leave===0||true},A0));
 /* bảng công tháng: thấy dấu nghỉ ngày sắp tới */
 const FM=await ev(p=>{const m=p.from.slice(0,7);S.cc={tab:'bang',m};go('cc');render();return m},A0);
 ok('bảng công tháng sắp tới hiện ký hiệu N ở các ngày đã chấm trước',(await page.$$('.sheet button.sc-N')).length>0,FM);
 /* ngày đã chấm có mặt, ngày có đơn nghỉ duyệt, ngày Trung tâm nghỉ: bỏ qua */
 const B=await ev(p=>{const id=p.a;let dp=null,dl=null;for(let d=addD(p.from,200);d<addD(p.from,260);d=addD(d,1)){if(!isW(d)||isClosed(d))continue;if(!dp){dp=d;continue}if(!dl){dl=d;break}}
  DB.ts[id+'|'+dp]={i:'07:20',o:'17:00'};DB.lr.push({id:'lrZ',st:id,type:'phep',f:dl,t:dl,s:'duyet',why:'t'});
  S.modal={t:'tsm',ids:[id],from:addD(dp,0),to:dl,l:'full',lk:'',wd:[1,2,3,4,5,6],err:''};return{id,dp,dl}},A0);
 await ev(()=>render());await page.waitForSelector('#tsmf');await page.click('#tsmf button[type=submit]');await W(250);
 const B1=await ev(p=>({pres:DB.ts[p.id+'|'+p.dp],lrDay:DB.ts[p.id+'|'+p.dl]}),B);
 ok('ngày đã chấm có mặt giữ nguyên; ngày có đơn nghỉ đã duyệt không bị ghi đè',B1.pres&&!B1.pres.l&&B1.pres.i==='07:20'&&!B1.lrDay,B1);
 /* lọc theo thứ: chỉ Thứ Hai, nghỉ không lương cả ngày */
 const C=await ev(p=>{S.modal={t:'tsm',ids:[p.b],from:addD(p.to,10),to:addD(p.to,80),l:'full',lk:'1',wd:[1],err:''};render();
  let mons=0;for(let d=addD(p.to,10);d<=addD(p.to,80);d=addD(d,1))if(dow(d)===1&&!isClosed(d))mons++;return{b:p.b,from:addD(p.to,10),to:addD(p.to,80),mons}},A0);
 await page.waitForSelector('#tsmf');await page.click('#tsmf button[type=submit]');await W(250);
 const C1=await ev(c=>{let n=0,other=0,kl=0;for(let d=c.from;d<=c.to;d=addD(d,1)){const r=DB.ts[c.b+'|'+d];if(!r)continue;n++;if(dow(d)!==1)other++;if(r.l==='full'&&r.lk===1&&tsSt(c.b,d)==='kl')kl++}return{n,other,kl}},C);
 ok('chỉ tích Thứ Hai: chấm đúng các Thứ Hai, nghỉ cả ngày không lương',C1.n===C.mons&&C1.other===0&&C1.kl===C1.n,[C,C1]);
 /* bỏ nghỉ các ngày */
 await ev(c=>{S.modal={t:'tsm',ids:[c.b],from:c.from,to:c.to,l:'full',lk:'',wd:[1,2,3,4,5,6],err:''};render()},C);await page.waitForSelector('[data-a="tsmclr"]');
 await page.click('[data-a="tsmclr"]');await W(250);
 ok('Bỏ nghỉ các ngày này: xóa các dấu nghỉ trong khoảng',await ev(c=>{for(let d=c.from;d<=c.to;d=addD(d,1))if(DB.ts[c.b+'|'+d])return false;return true},C));
 /* lỗi nhập */
 const E=await ev(p=>{S.modal={t:'tsm',ids:[p.a],from:'2026-01-01',to:'2031-01-01',l:'full',lk:'',wd:[1],err:''};render();const f=document.createElement('form');FORM.tsmf(f);const e1=S.modal.err;
  S.modal.to='2026-01-10';S.modal.from='2026-01-20';FORM.tsmf(f);const e2=S.modal.err;S.modal.ids=[];S.modal.from='2026-01-01';S.modal.to='2026-01-31';FORM.tsmf(f);return{e1,e2,e3:S.modal.err}},A0);
 ok('khoảng quá dài, ngày ngược, chưa chọn nhân sự: báo lỗi, không ghi gì',/quá dài/.test(E.e1)&&/Ngày kết thúc/.test(E.e2)&&/ít nhất một nhân sự/.test(E.e3),E);
 await ev(()=>{S.modal=null;render()});
 /* quyền */
 const Q=await ev(()=>{const out={};for(const role of ['ql','vp','gv']){setUser(findAccount(DB.staff.find(s=>s.role===role&&s.st==='dang').em));render();out[role]={can:ACT.tsm()!==false&&S.modal&&S.modal.t==='tsm',btn:!!document.querySelector('[data-a="tsm"]')};S.modal=null}
  setUser(findAccount(DB.staff.find(s=>s.role==='tt').em));render();return out});
 ok('Quản lý, Văn phòng chấm nghỉ nhiều ngày được và thấy nút; Giáo viên không',Q.ql.can&&Q.vp.can&&!Q.gv.can&&!Q.gv.btn,Q);
 /* chấm từng ngày sắp tới */
 ok('chấm nghỉ từng ngày: ngày sắp tới cũng mở được',await ev(p=>{const d=addD(TODAY,3);return ACT.tsl(p.a+'|'+d)!==false&&S.modal.t==='tsl'},A0));
 await ev(()=>{S.modal=null;render()});
 /* chấm nghỉ cả ngày trước: buổi cần dạy thay */
 const D=await ev(()=>{for(const T of DB.staff.filter(s=>s.role==='gv'&&s.st==='dang')){const ls=DB.lich.filter(l=>l.type==='11'&&l.gv===T.id&&l.day>=1&&l.day<=5&&kidBy(l.hs)&&kidBy(l.hs).st==='dang');if(!ls.length)continue;
   const l=ls[0];let d=addD(TODAY,2);for(let i=0;i<14&&dow(d)!==l.day;i++)d=addD(d,1);if(isClosed(d))continue;
   DB.ts[T.id+'|'+d]={i:'',o:'',l:'full'};const need=dsNeed(d).some(s=>s.sid===l.id);delete DB.ts[T.id+'|'+d];return{need,d}}return null});
 ok('nghỉ cả ngày chấm trước: buổi của giáo viên đó hiện ở danh sách cần dạy thay ngày đó',D&&D.need,D);
 /* ---------- B. dạy thay: một hoặc nhiều ngày ---------- */
 const P=await ev(()=>{for(const l of DB.lich.filter(x=>x.type==='11'&&x.day>=1&&x.day<=5&&kidBy(x.hs)&&kidBy(x.hs).st==='dang'&&stBy(x.gv)&&stBy(x.gv).role==='gv')){
   let d=addD(TODAY,3);for(let i=0;i<14&&dow(d)!==l.day;i++)d=addD(d,1);const ds=[0,1,2,3].map(i=>addD(d,i*7));if(ds.some(x=>isClosed(x)||subOf(x,l.id)))continue;
   const T2=dsTeachers().find(t=>t.id!==l.gv&&t.role==='gv'&&ds.every(x=>!dsWhy(t.id,x,l.slot,l.id)&&!dsKidWhy(l,x,l.slot)));if(!T2)continue;
   return{sid:l.id,ds,T2:T2.id,slot:l.slot}}return null});
 ok('có buổi 1-1 hằng tuần và giáo viên rảnh cả 4 tuần để thử',!!P,P);
 await ev(p=>{S.ds={tab:'cv',d:p.ds[0],all:1,q:''};go('ds');render()},P);await page.waitForSelector('#main input[data-c="dsall"]');
 /* hộp tích tất cả buổi: bỏ tích được */
 const ChkA=await ev(()=>document.querySelector('#main input[data-c="dsall"]').checked);
 await page.uncheck('#main input[data-c="dsall"]');await W(200);
 ok('"Hiện tất cả buổi trong ngày": bỏ tích được (trước đây tích rồi không bỏ được)',ChkA===true&&await ev(()=>S.ds.all===0&&!document.querySelector('#main input[data-c="dsall"]').checked));
 await page.check('#main input[data-c="dsall"]');await W(200);
 ok('tích lại: hiện tất cả',await ev(()=>S.ds.all===1));
 /* một ngày (mặc định) */
 await ev(p=>{ACT.dsopen(p.ds[0]+'|'+p.sid);render()},P);await page.waitForSelector('#dsaf');
 ok('mặc định chỉ có ngày đang xét: một ô ngày, được tích',(await page.$$('#dsaf input[name=dd]')).length===1&&(await page.$$('#dsaf input[name=dd]:checked')).length===1);
 await page.selectOption('#ds-g',P.T2);await W(150);await page.click('#dsaf button[type=submit]');await W(250);
 ok('lưu một ngày: chỉ ngày đó có giáo viên dạy thay',await ev(p=>(DB.sub||[]).filter(s=>s.sid===p.sid&&s.gv===p.T2).map(s=>s.d).join()===p.ds[0],P));
 await ev(p=>{DB.sub=DB.sub.filter(s=>s.sid!==p.sid)},P);
 /* nhiều ngày: chọn một số ngày */
 await ev(p=>{ACT.dsopen(p.ds[0]+'|'+p.sid);render()},P);await page.waitForSelector('#dsaf');
 await page.selectOption('#ds-g',P.T2);await W(150);
 await page.fill('#ds-t',P.ds[3]);await page.dispatchEvent('#ds-t','change');await W(250);
 ok('chọn ngày cuối: hiện 4 ô ngày cùng thứ, mặc định tích các ngày giáo viên rảnh',(await page.$$('#dsaf input[name=dd]')).length===4&&(await page.$$('#dsaf input[name=dd]:checked')).length===4);
 ok('giữ giáo viên đã chọn sau khi đổi ngày kết thúc',(await page.inputValue('#ds-g'))===P.T2);
 await page.uncheck('#dsaf input[name=dd][value="'+P.ds[1]+'"]');await page.uncheck('#dsaf input[name=dd][value="'+P.ds[3]+'"]');
 await page.fill('#ds-n','Cô nghỉ đợt');await page.dispatchEvent('#ds-n','change');
 await page.click('#dsaf button[type=submit]');await W(300);
 const S2=await ev(p=>(DB.sub||[]).filter(s=>s.sid===p.sid&&s.gv===p.T2).map(s=>s.d).sort().join(),P);
 ok('bỏ tích 2 ngày: chỉ 2 ngày còn lại (không liên tiếp) có giáo viên dạy thay',S2===[P.ds[0],P.ds[2]].join(),[S2,P.ds]);
 await ev(p=>{DB.sub=DB.sub.filter(s=>s.sid!==p.sid)},P);
 /* nút chọn hết, bỏ chọn hết, và lưu khi chưa tích ngày nào */
 await ev(p=>{ACT.dsopen(p.ds[0]+'|'+p.sid);S.modal.to=p.ds[3];render()},P);await page.waitForSelector('#dsaf');
 await page.selectOption('#ds-g',P.T2);await W(150);
 await page.click('[data-a="dsdays"][data-v="0"]');await W(150);
 ok('Bỏ chọn hết: không còn ngày nào được tích',(await page.$$('#dsaf input[name=dd]:checked')).length===0);
 await page.click('#dsaf button[type=submit]');await W(200);
 ok('chưa tích ngày nào: báo lỗi, không ghi',/ít nhất một ngày/.test(await page.textContent('#dsaf .err'))&&await ev(p=>!(DB.sub||[]).some(s=>s.sid===p.sid),P));
 await page.click('[data-a="dsdays"][data-v="1"]');await W(150);await page.click('#dsaf button[type=submit]');await W(300);
 ok('Chọn hết: đủ 4 ngày',await ev(p=>(DB.sub||[]).filter(s=>s.sid===p.sid&&s.gv===p.T2).length===4,P));
 ok('không lỗi trình duyệt',errs.length===0,errs);
 await b.close();console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
