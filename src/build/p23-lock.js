/* ===== Khóa cổng phụ huynh khi quá hạn học phí (sau ngày 10 hàng tháng) =====
   Bản chạy thật tính khóa ở máy chủ (api/_lock.js, api/parent.js); đây là bản tương đương cho chế độ ?demo và phần giao diện.
   Quy tắc phải khớp api/_lock.js: học phí tháng M trả trước, hạn hết ngày 10 của tháng M.
   Từ ngày 11 phải đã đóng đủ các tháng đến M; từ ngày 1 đến 10 chỉ cần đủ các tháng đến M-1.
   Khoản đã thu, giảm giá, hoàn phí, nhận chuyển phí trừ lần lượt vào tháng cũ nhất, gộp mọi bé của cùng phụ huynh. */
const LKS={hp:1,cfo:1,thu:-1,gg:-1,hoan:-1,cfi:-1},LK_MIN=1000,LK_MAX_DAYS=93;
const lkDue=t=>+t.slice(8,10)>10?t.slice(0,7):sm(t.slice(0,7),-1);
const lkNext10=t=>(+t.slice(8,10)<=10?t.slice(0,7):sm(t.slice(0,7),1))+'-10';
function lkCalc(entries,today,pul){
 const due=lkDue(today),ch={};let credit=0;
 (entries||[]).forEach(e=>{const s=LKS[e.kind],a=+e.amt;if(!s||!(a>0))return;
  if(s<0){credit+=a;return}
  const m=/^\d{4}-\d{2}$/.test(e.m||'')?e.m:String(e.date||'').slice(0,7);if(/^\d{4}-\d{2}$/.test(m))ch[m]=(ch[m]||0)+a});
 let amt=0;const months=[];
 Object.keys(ch).sort().forEach(m=>{const take=Math.min(credit,ch[m]);credit-=take;const rem=ch[m]-take;if(rem>0&&m<=due){amt+=rem;months.push(m)}});
 const over=amt>=LK_MIN,un=!!(pul&&/^\d{4}-\d{2}-\d{2}$/.test(String(pul.until||''))&&pul.until>=today);
 return{locked:over&&!un,overdue:over,unlocked:over&&un,amt:over?amt:0,months:over?months:[],due,until:over&&un?pul.until:'',by:(pul&&pul.by)||'',at:(pul&&pul.at)||'',note:(pul&&pul.note)||''}}

/* chế độ ?demo: tính từ sổ học phí trong trình duyệt */
function phLockOf(key){
 const ids=DB.kids.filter(k=>pkeyOf(k)===key).map(k=>k.id);
 return Object.assign(lkCalc(DB.lg.filter(e=>ids.includes(e.hs)),TODAY,(DB.pul||{})[key]),{today:TODAY,tel:DB.cfg.tel||'',name:DB.cfg.name||''})}
function plRowsLocal(){
 const by={};DB.kids.forEach(k=>{const key=pkeyOf(k);if(!key)return;const g=by[key]=by[key]||{key,name:k.pn,kids:[],ids:[]};g.kids.push(k.n);g.ids.push(k.id)});
 return Object.values(by).map(g=>Object.assign({key:g.key,name:g.name,kids:g.kids},lkCalc(DB.lg.filter(e=>g.ids.includes(e.hs)),TODAY,(DB.pul||{})[g.key]))).filter(r=>r.overdue)
  .sort((a,b)=>(b.locked-a.locked)||(b.amt-a.amt)||(a.name<b.name?-1:1))}

/* ---- màn hình khóa của phụ huynh (chữ lớn, dễ đọc) ---- */
const lkMonths=ms=>(ms||[]).map(m=>(+m.slice(5,7))+'/'+m.slice(0,4)).join(', ');
function lockHtml(lk){
 const tel=lk.tel?`<p class="plg-tel">Liên hệ Trung tâm: <b>${esc(lk.tel)}</b></p>`:'';
 return`<div class="lg"><div class="lgl"><img src="${LOGO}" alt="Logo Trung tâm Can thiệp sớm Golden Bee"><h1>${esc(lk.name||CL_NAME)}</h1></div>
 <div class="lgr"><div class="lgc plg"><h2>Cổng phụ huynh đang tạm khóa</h2>
 <p class="plg-big" role="alert">Học phí ${lk.months&&lk.months.length?'tháng '+esc(lkMonths(lk.months)):''} chưa được thanh toán sau hạn ngày 10.</p>
 ${lk.amt?`<div class="plg-amt"><span>Số tiền còn phải đóng</span><b>${fmt(lk.amt)}</b></div>`:''}
 <p>Khi Trung tâm ghi nhận khoản thanh toán, cổng sẽ tự động mở lại. Nếu bạn đã chuyển khoản, hãy báo cho Trung tâm rồi bấm “Kiểm tra lại”.</p>${tel}
 <div class="acts" style="margin-top:16px"><button class="btn p" data-a="lockchk">Kiểm tra lại</button><button class="btn" data-a="logout">Đăng xuất</button></div></div></div></div>`}
ACT.lockchk=()=>{if(CLOUDMODE){phLoad();return false}};      /* bản demo: vẽ lại là đủ */

/* ---- phía nhân viên: danh sách phụ huynh quá hạn, mở khóa tạm, khóa lại ---- */
const canPlock=()=>isTT()||isQL()||isVP();
const plRows=()=>CLOUDMODE?(CLD.plock?CLD.plock.rows:null):plRowsLocal();
async function plApi(body,again){
 const r=await fetch((typeof window.GB_API==='string'?window.GB_API:'')+'/api/plock',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+CLD.ss.at},body:JSON.stringify(body)});
 if(r.status===401&&!again&&await sbRefresh())return plApi(body,true);
 if(r.status===404)throw new Error('Máy chủ chưa có chức năng khóa cổng phụ huynh.');
 const j=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(j.error||('Lỗi '+r.status));
 return j}
async function plLoad(quiet){if(!CLOUDMODE||!U||!canPlock())return;
 try{const j=await plApi({action:'list'});const same=CLD.plock&&JSON.stringify(CLD.plock.rows)===JSON.stringify(j.rows)&&!CLD.plockErr;CLD.plock=j;CLD.plockErr='';if(!same&&CLD.stage==='app')softRender()}
 catch(e){const was=CLD.plockErr;CLD.plockErr=e.message;if(!quiet||was!==e.message){if(CLD.stage==='app')softRender()}}}

function plStatus(r){return r.locked?tg('Đang khóa','er'):`${tg('Đã mở khóa','wa')}<br><span class="sm mu">đến ${vd(r.until)}</span>`}
function plockCard(always){
 if(!canPlock())return'';
 const err=CLOUDMODE&&CLD.plockErr,rows=plRows();
 if(err)return`<div class="card"><h2>Cổng phụ huynh quá hạn học phí</h2><p class="note sm">Chưa lấy được danh sách: ${esc(err)}</p></div>`;
 if(rows===null)return'';
 if(!rows.length)return always?`<div class="card"><h2>Cổng phụ huynh quá hạn học phí</h2><p class="mu">Không có phụ huynh nào quá hạn. Phụ huynh chưa đóng học phí sau ngày 10 hàng tháng sẽ tự động bị khóa cổng, ghi nhận thu đủ là tự mở lại.</p></div>`:'';
 const p=pg('plk',rows,8),$=canMoney(),nl=rows.filter(r=>r.locked).length;
 return`<div class="card" id="plock"><div class="top" style="align-items:center"><h2 style="margin:0">Cổng phụ huynh quá hạn học phí</h2>${tg(nl+' đang khóa',nl?'er':'ok')}</div>
 <p class="sm mu" style="margin:6px 0 10px">Phụ huynh chưa đóng đủ học phí sau ngày 10 hàng tháng bị khóa cổng tự động; ghi nhận thu đủ là cổng tự mở lại. Trưởng Trung tâm, Quản lý và Văn phòng có thể mở khóa tạm.</p>`
 +tbl(['Phụ huynh','Quá hạn',...($?['>Số tiền']:[]),'Tình trạng',''],p.rows.map(r=>`<tr><td><b>${esc(r.name||'(chưa có tên)')}</b><br><span class="sm mu">${esc((r.kids||[]).join(', '))}</span></td><td class="nw">${esc(lkMonths(r.months))}</td>${$?`<td class="r nw"><b>${fnum(r.amt)}</b></td>`:''}<td>${plStatus(r)}${r.unlocked&&r.by?`<br><span class="sm mu">bởi ${esc(r.by)}</span>`:''}</td><td class="nw">${r.unlocked?`<button class="btn s" data-a="plrelock" data-v="${esc(r.key)}">Khóa lại</button>`:`<button class="btn s p" data-a="plopen" data-v="${esc(r.key)}">Mở khóa</button>`}</td></tr>`).join(''))+p.html+`</div>`}

ACT.plopen=v=>{if(!canPlock())return false;const r=(plRows()||[]).find(x=>x.key===v);if(!r)return false;S.modal={t:'pl',key:v}};
MODALS.pl=()=>{const r=(plRows()||[]).find(x=>x.key===S.modal.key);if(!r||!canPlock()){S.modal=null;return''}
 const d=lkNext10(TODAY);
 return mdl('Mở khóa cổng phụ huynh',`<p><b>${esc(r.name)}</b> · ${esc((r.kids||[]).join(', '))}</p><p class="sm mu">Quá hạn học phí ${esc(lkMonths(r.months))}${canMoney()?' · '+fmt(r.amt):''}. Mở khóa tạm cho phụ huynh vào xem; đến hết ngày đã chọn cổng sẽ khóa lại nếu vẫn chưa đóng đủ.</p>
 <form id="plf" class="f"><div class="f2"><div><label for="pl-d">Mở đến hết ngày</label><input id="pl-d" name="until" type="date" value="${d}" min="${TODAY}" max="${addD(TODAY,LK_MAX_DAYS)}" required></div><div><label for="pl-n">Ghi chú (không bắt buộc)</label><input id="pl-n" name="note" maxlength="200" placeholder="Ví dụ: hẹn đóng ngày 15"></div></div>
 <div class="acts"><button class="btn p" type="submit">Mở khóa</button><button class="btn" type="button" data-a="mx">Hủy</button></div></form>`)};
FORM.plf=f=>{if(!canPlock())return false;
 const key=S.modal.key,until=f.elements.until.value,note=f.elements.note.value.trim().slice(0,200);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(until)||until<TODAY||until>addD(TODAY,LK_MAX_DAYS)){toast('Ngày mở khóa phải từ hôm nay đến '+vd(addD(TODAY,LK_MAX_DAYS)));return false}
 if(!CLOUDMODE){DB.pul=DB.pul||{};DB.pul[key]={k:key,until,by:U.name,role:U.role,at:TODAY,note};S.modal=null;toast('Đã mở khóa đến hết ngày '+vd(until));return}
 plRun({action:'unlock',key,until,note},'Đã mở khóa đến hết ngày '+vd(until));return false};
ACT.plrelock=v=>{if(!canPlock())return false;const r=(plRows()||[]).find(x=>x.key===v);if(!r)return false;
 ask('Khóa lại cổng của phụ huynh '+(r.name||'')+'? Phụ huynh sẽ không vào được cho đến khi đóng đủ học phí hoặc được mở khóa lại.',()=>{
  if(!CLOUDMODE){if(DB.pul)delete DB.pul[v];toast('Đã khóa lại');return}
  plRun({action:'relock',key:v},'Đã khóa lại')},'Khóa lại')};
async function plRun(body,msg){
 try{await plApi(body);S.modal=null;toast(msg);await plLoad()}
 catch(e){toast(e.message)}
 render()}
