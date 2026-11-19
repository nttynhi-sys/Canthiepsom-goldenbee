/* ===== Dạy thay: phân giáo viên khác dạy thay buổi của giáo viên nghỉ ốm, nghỉ phép ===== */
/* Trưởng Trung tâm, Quản lý, Văn phòng (hành chính) phân giáo viên dạy thay cho từng buổi của từng bé (ngày d, buổi sid).
   Dữ liệu: DB.sub (collection sub trong records, không phải tiền) = {id,d,sid,hs,gv,og,by,at,n}; xem subOf, effGv, ABS_ATT ở p04-domain.js.
   Buổi 1-1 hằng tuần không đổi; chỉ ngày d đổi người dạy. Giáo viên dạy thay điểm danh, ghi buổi và nhận tiền công theo ca của ngày đó.
   Lịch trống của giáo viên trong một ngày tính từ lịch dạy, ngày nghỉ phép, lớp bán trú; buổi của bé vắng (ABS_ATT) cũng được coi là giờ trống. */
const canSub=()=>isLead()||isVP();
const dsLeave=(gv,d)=>DB.lr.find(l=>l.st===gv&&l.s==='duyet'&&l.f<=d&&d<=l.t)||null;
const dsLesson=sid=>DB.lich.find(x=>x.id===sid);
const dsLessonsOn=d=>DB.lich.filter(l=>(l.type==='11'&&l.day===dow(d))||(l.type==='bu'&&l.date===d));
const dsTeachers=()=>DB.staff.filter(s=>s.st==='dang'&&isTeacher(s));
/* giáo viên gv dạy được ca bắt đầu lúc slot ngày d không (bỏ qua buổi sid đang xét): '' là được, ngược lại là lý do */
function dsWhy(gv,d,slot,sid){
 const t=stBy(gv);if(!t||t.st!=='dang'||!isTeacher(t))return'Không phải giáo viên đang làm việc';
 if(isClosed(d))return'Trung tâm nghỉ ngày này';
 if(dsLeave(gv,d))return'Đang nghỉ phép hoặc nghỉ ốm';
 const w=dow(d);if(DB.groups.some(g=>grHas(g,gv)&&grOpen(g,w)))return'Đang phụ trách lớp bán trú';
 for(const l of dsLessonsOn(d)){if(l.id===sid||!l.slot||!slotOver(l.slot,slot)||effGv(l,d)!==gv)continue;
  if(ABS_ATT.includes(DB.att[attKey(d,l.id,l.hs)]))continue;   /* bé vắng: giáo viên rảnh */
  return'Đang dạy '+given(kn(l.hs))+' lúc '+l.slot}
 return''}
/* các buổi của gv trong ngày d có bé vắng (giờ rảnh), kèm ghi chú */
const dsFreed=(gv,d)=>dsLessonsOn(d).filter(l=>effGv(l,d)===gv&&ABS_ATT.includes(DB.att[attKey(d,l.id,l.hs)])).sort((a,b)=>a.slot<b.slot?-1:1);
const dsFreedAt=(gv,d,slot,sid)=>dsFreed(gv,d).filter(l=>l.id!==sid&&slotOver(l.slot,slot));
/* khoảng giờ trống của gv trong ngày d, gộp các khung liền nhau */
function dsRanges(gv,d){const out=[];let cur=null;
 SLOTS.forEach(s=>{if(!dsWhy(gv,d,s,'')){if(cur)cur.e=s;else cur={b:s,e:s}}else if(cur){out.push(cur);cur=null}});
 if(cur)out.push(cur);return out.map(r=>r.b===r.e?slotLb(r.b):r.b+'–'+slotEnd(r.e))}
/* buổi cần người dạy thay trong ngày d: giáo viên gốc có đơn nghỉ đã duyệt */
const dsNeed=d=>dayList(d).filter(s=>(s.kind==='11'||s.kind==='bu')&&!s.sub&&(l=>l&&dsLeave(l.gv,d))(dsLesson(s.sid)));
function dsNeedCount(){let n=0;for(let i=0;i<7;i++){const d=addD(TODAY,i);if(isSch(d))n+=dsNeed(d).length}return n}
const dsDef=()=>({tab:'cv',d:isSch(WD)&&WD>=TODAY?WD:TODAY,all:0,q:''});

VIEWS.ds=()=>{
 const c=S.ds=Object.assign(dsDef(),S.ds),T=[['cv','Buổi cần dạy thay'],['gt','Lịch trống giáo viên']];
 const body=c.tab==='gt'?dsFreeTab(c):dsLessonTab(c);
 return head('Dạy thay','Phân giáo viên khác dạy thay khi giáo viên nghỉ ốm, nghỉ phép')
 +`<div class="card"><div class="f2"><div><label for="ds-d">Ngày</label><div style="display:flex;gap:6px;align-items:center"><button class="btn s" data-a="dsday" data-v="-1" aria-label="Ngày trước">‹</button><input id="ds-d" type="date" value="${esc(c.d)}" data-c="dsd" style="width:auto"><button class="btn s" data-a="dsday" data-v="1" aria-label="Ngày sau">›</button><button class="btn s" data-a="dsday" data-v="0">Hôm nay</button></div></div>
 <div><label for="ds-q">Tìm theo tên bé</label><input id="ds-q" type="search" value="${esc(c.q)}" data-c="dsq" placeholder="Tên hoặc mã bé" autocomplete="off"></div></div><p class="sm mu" style="margin:8px 0 0">${DAYN[dow(c.d)]} ${vd(c.d)}${isClosed(c.d)?' · Trung tâm nghỉ ('+esc(holOf(c.d).n)+')':''}</p></div>`
 +tabsH(T,c.tab,'dstab')+body};
ACT.dstab=v=>{S.ds.tab=v};
CHG.dsd=v=>{if(/^\d{4}-\d{2}-\d{2}$/.test(v||''))S.ds.d=v};
CHG.dsq=v=>{S.ds.q=v;setTimeout(render,0);return false};
ACT.dsday=v=>{S.ds.d=+v===0?TODAY:addD(S.ds.d,+v)};
CHG.dsall=v=>{S.ds.all=v==='1'?1:0};
ACT.dskid=id=>{if(!canSub())return false;S.modal=null;go('ds',{ds:Object.assign(dsDef(),{q:kcode(kidBy(id)||{id:''})})})};
/* thẻ trong hồ sơ bé, tab Lịch học (Trưởng Trung tâm, Quản lý) */
function dsKidCard(k){if(!canSub())return'';const n=(DB.sub||[]).filter(s=>s.hs===k.id&&s.d>=TODAY).length;
 return`<div class="card"><h2>Dạy thay</h2><p class="sm mu" style="margin-bottom:8px">Khi giáo viên của bé nghỉ ốm hoặc nghỉ phép, phân giáo viên khác dạy thay cho từng buổi.${n?' Bé đang có <b>'+n+'</b> buổi dạy thay sắp tới.':''}</p><div class="acts"><button class="btn p" data-a="dskid" data-v="${k.id}">Phân giáo viên dạy thay</button></div></div>`}

function dsLessonTab(c){
 const q=ascii(c.q||''),rows=dayList(c.d).filter(s=>s.kind==='11'||s.kind==='bu').map(s=>({s,l:dsLesson(s.sid),k:s.kids[0]})).filter(r=>r.l&&r.k)
  .filter(r=>!q||ascii(r.k.n+' '+kcode(r.k)).includes(q)).map(r=>Object.assign(r,{lv:dsLeave(r.l.gv,c.d)}))
  .filter(r=>c.all||q||r.lv||r.s.sub).sort((a,b)=>(!!b.lv-!!a.lv)||(a.s.slot<b.s.slot?-1:1));
 const need=rows.filter(r=>r.lv&&!r.s.sub).length;
 const ctl=`<div class="card"><div class="top" style="gap:10px;margin:0"><p style="margin:0">${need?`<b>${need}</b> buổi chưa có người dạy thay`:'Không có buổi nào đang chờ người dạy thay'}${c.all||q?'':' · chỉ hiện buổi của giáo viên nghỉ và buổi đã có người dạy thay'}</p>
  <label class="sm" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-c="dsall" value="1" ${c.all?'checked':''}> Hiện tất cả buổi trong ngày</label></div></div>`;
 if(!rows.length)return ctl+'<p class="empty">'+(isClosed(c.d)?'Trung tâm nghỉ ngày này.':c.all||q?'Ngày này không có buổi 1-1 hay học bù nào.':'Không có giáo viên nào nghỉ có buổi dạy ngày này. Bấm “Hiện tất cả buổi trong ngày” để phân dạy thay cho giáo viên nghỉ đột xuất chưa có đơn.')+'</p>';
 return ctl+`<div class="card tbl"><table><thead><tr><th>Giờ</th><th>Học sinh</th><th>Giáo viên của bé</th><th>Dạy thay</th><th></th></tr></thead><tbody>`
 +rows.map(r=>{const sb=r.s.sub,ab=ABS_ATT.includes(DB.att[attKey(c.d,r.s.sid,r.k.id)])&&!sb&&!r.lv;
  return`<tr><td>${slotLb(r.l.slot)}<br><span class="sm mu">${r.l.type==='bu'?'Học bù':'1-1'}</span></td><td><b>${esc(r.k.n)}</b><br><span class="sm mu">${esc(kcode(r.k))}</span></td>
  <td>${esc(sn(r.l.gv))}${r.lv?'<br>'+tg('Nghỉ '+(r.lv.type==='kl'?'không lương':'có phép'),'wa'):''}${ab?'<br>'+tg('Bé vắng','gy'):''}</td>
  <td>${sb?`<b>${esc(sn(sb.gv))}</b>${sb.n?'<br><span class="sm mu">'+esc(sb.n)+'</span>':''}`:(r.lv?tg('Chưa có người dạy thay','er'):'<span class="mu">—</span>')}</td>
  <td style="white-space:nowrap"><button class="btn s ${sb||!r.lv?'':'p'}" data-a="dsopen" data-v="${esc(c.d+'|'+r.s.sid)}">${sb?'Đổi người':'Phân công'}</button>${sb?` <button class="btn s no" data-a="dsdel" data-v="${esc(c.d+'|'+r.s.sid)}">Bỏ dạy thay</button>`:''}</td></tr>`}).join('')+`</tbody></table></div>`}

function dsFreeTab(c){
 if(isClosed(c.d))return'<p class="empty">Trung tâm nghỉ ngày này.</p>';
 const tc=dsTeachers().map(t=>{const lv=dsLeave(t.id,c.d),w=dow(c.d),gr=DB.groups.some(g=>grHas(g,t.id)&&grOpen(g,w)),
   own=dsLessonsOn(c.d).filter(l=>effGv(l,c.d)===t.id).sort((a,b)=>a.slot<b.slot?-1:1),fr=dsFreed(t.id,c.d),rg=lv||gr?[]:dsRanges(t.id,c.d),subs=(DB.sub||[]).filter(x=>x.d===c.d&&x.gv===t.id);
   return{t,lv,gr,own,fr,rg,subs}}).sort((a,b)=>((!!a.lv||a.gr)-(!!b.lv||b.gr))||(b.rg.length-a.rg.length)||(a.t.n<b.t.n?-1:1));
 const q=ascii(c.q||''),list=q?tc.filter(x=>ascii(x.t.n).includes(q)):tc,n=tc.filter(x=>!x.lv&&!x.gr&&x.rg.length).length;
 const ch=(a,b)=>`<span class="tag ${a}" style="margin:2px 4px 2px 0;display:inline-block">${b}</span>`;
 return`<div class="card"><p style="margin:0"><b>${n}</b> giáo viên còn giờ trống ngày ${vdm(c.d)}. Giờ có bé vắng (nghỉ P, KP, nhập viện, Trung tâm nghỉ) được tính là giờ trống.</p></div>
 <div class="card tbl"><table><thead><tr><th>Giáo viên</th><th>Giờ trống</th><th>Buổi có bé vắng (giờ rảnh)</th><th>Đang dạy</th></tr></thead><tbody>`
 +list.map(x=>{const busy=x.own.filter(l=>!ABS_ATT.includes(DB.att[attKey(c.d,l.id,l.hs)]));
  return`<tr><td><b>${esc(tName(x.t))}</b>${x.lv?'<br>'+tg('Nghỉ '+(x.lv.type==='kl'?'không lương':'có phép'),'wa'):''}${x.gr?'<br>'+tg('Lớp bán trú','in'):''}</td>
  <td>${x.lv||x.gr?'<span class="mu">Không dạy thay được</span>':x.rg.length?x.rg.map(r=>ch('ok',esc(r))).join(''):'<span class="mu">Hết giờ trống</span>'}</td>
  <td>${x.fr.length?x.fr.map(l=>ch('y',esc(l.slot+' · '+given(kn(l.hs))+' ('+AC[DB.att[attKey(c.d,l.id,l.hs)]]+')'))).join(''):'<span class="mu">—</span>'}</td>
  <td>${busy.length?busy.map(l=>ch('gy',esc(l.slot+' · '+given(kn(l.hs))))).join(''):'<span class="mu">—</span>'}${x.subs.map(s=>ch('in','Dạy thay '+esc(dsLesson(s.sid)?dsLesson(s.sid).slot:'')+' · '+esc(given(kn(s.hs))))).join('')}</td></tr>`}).join('')+`</tbody></table></div>
 <div class="acts"><button class="btn p" data-a="dstab" data-v="cv">Phân công dạy thay cho các buổi</button></div>`}

/* ---- phân công ---- */
ACT.dsopen=v=>{if(!canSub())return false;const [d,sid]=v.split('|'),l=dsLesson(sid);if(!l||!kidBy(l.hs))return false;S.modal={t:'dsa',d,sid,err:''}};
function dsOpts(d,l){const o=dsTeachers().filter(t=>t.id!==l.gv).map(t=>{const why=dsWhy(t.id,d,l.slot,l.id),fr=why?[]:dsFreedAt(t.id,d,l.slot,l.id);return{t,why,fr}})
  .sort((a,b)=>(!!a.why-!!b.why)||(b.fr.length-a.fr.length)||(a.t.n<b.t.n?-1:1));return o}
MODALS.dsa=()=>{const m=S.modal,l=dsLesson(m.sid),k=l&&kidBy(l.hs);if(!l||!k||!canSub()){S.modal=null;return''}
 const cur=subOf(m.d,m.sid),o=dsOpts(m.d,l),free=o.filter(x=>!x.why),lv=dsLeave(l.gv,m.d);
 return mdl('Phân giáo viên dạy thay',`<p class="sm" style="margin-bottom:8px"><b>${esc(k.n)}</b> · ${esc(kcode(k))}<br>${DAYN[dow(m.d)]} ${vd(m.d)} · ${slotLb(l.slot)} · ${l.type==='bu'?'Học bù':'1-1'}<br><span class="mu">Giáo viên của bé: ${esc(sn(l.gv))}${lv?' (đang nghỉ)':''}</span></p>
 <form id="dsaf" class="f"><div><label for="ds-g">Giáo viên dạy thay</label><select id="ds-g" name="gv"><option value="">Chọn giáo viên</option>${o.map(x=>`<option value="${x.t.id}" ${x.why?'disabled':''} ${cur&&cur.gv===x.t.id?'selected':''}>${esc(tName(x.t))} · ${x.why?esc(x.why):x.fr.length?'rảnh vì '+esc(given(kn(x.fr[0].hs)))+' nghỉ':'rảnh'}</option>`).join('')}</select></div>
 ${l.type==='11'?`<div><label for="ds-t">Dạy thay đến hết ngày (cùng thứ mỗi tuần, để trống nếu chỉ ngày này)</label><input id="ds-t" name="to" type="date" min="${m.d}" value=""></div>`:''}
 <div><label for="ds-n">Ghi chú</label><input id="ds-n" name="n" maxlength="80" value="${esc(cur?cur.n||'':'')}" placeholder="Ví dụ: cô A nghỉ ốm"></div>
 <p class="sm mu" style="margin:0">${free.length?'Có <b>'+free.length+'</b> giáo viên rảnh khung giờ này.':'Chưa có giáo viên nào rảnh khung giờ này.'} Xem lịch trống cả ngày ở thẻ “Lịch trống giáo viên”. Giáo viên dạy thay điểm danh, ghi buổi và nhận tiền công ca này; buổi của bé không còn tính là giáo viên nghỉ.</p>
 <div class="err" role="alert">${esc(m.err||'')}</div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Phân công dạy thay</button></div></form>`)};
/* dạy thay thì buổi không còn là "giáo viên nghỉ": bỏ dấu TT/GV nghỉ do đơn nghỉ phép tự ghi và hủy yêu cầu học bù tự tạo; bỏ dạy thay thì khôi phục */
function dsApply(l,d,gv,n){
 DB.sub=(DB.sub||[]).filter(x=>!(x.d===d&&x.sid===l.id));
 DB.sub.push({id:'sb'+uid(),d,sid:l.id,hs:l.hs,gv,og:l.gv,by:U.id,at:TODAY,n:n||''});
 if(dsLeave(l.gv,d)){const key=attKey(d,l.id,l.hs);if(DB.att[key]==='tt')delete DB.att[key];
  DB.mk.forEach(r=>{if(r.hs===l.hs&&r.from.d===d&&r.from.sid===l.id&&r.why==='Giáo viên nghỉ phép'&&r.s==='dk'&&!(r.props||[]).length){r.s='huy';r.dsub=1;r.log.push({at:TODAY,by:U.id,tx:'Đã phân giáo viên dạy thay, không cần học bù'})}})}}
function dsUndo(l,d){
 DB.sub=(DB.sub||[]).filter(x=>!(x.d===d&&x.sid===l.id));
 if(dsLeave(l.gv,d)){const key=attKey(d,l.id,l.hs);if(!DB.att[key])DB.att[key]='tt';
  DB.mk.forEach(r=>{if(r.dsub&&r.hs===l.hs&&r.from.d===d&&r.from.sid===l.id&&r.s==='huy'){r.s='dk';delete r.dsub;r.log.push({at:TODAY,by:U.id,tx:'Bỏ dạy thay, mở lại yêu cầu học bù'})}})}}
FORM.dsaf=f=>{const m=S.modal,l=dsLesson(m.sid),gv=f.elements.gv.value,to=f.elements.to?f.elements.to.value:'',n=String(f.elements.n.value||'').trim().slice(0,80);
 if(!canSub()||!l||!kidBy(l.hs))return false;
 if(!gv){m.err='Hãy chọn giáo viên dạy thay.';return}
 if(gv===l.gv){m.err='Đây là giáo viên của bé. Hãy chọn giáo viên khác.';return}
 if(to&&to<m.d){m.err='Ngày kết thúc phải sau ngày bắt đầu.';return}
 const dates=l.type==='11'&&to?(()=>{const a=[];for(let d=m.d;d<=to&&a.length<60;d=addD(d,7))a.push(d);return a})():[m.d],ok=[],skip=[];
 dates.forEach(d=>{const why=dsWhy(gv,d,l.slot,l.id);if(why)skip.push(vdm(d)+': '+why);else{dsApply(l,d,gv,n);ok.push(d)}});
 if(!ok.length){m.err='Không phân được: '+skip.join('; ');return}
 S.modal=null;toast('Đã phân '+given(sn(gv))+' dạy thay '+ok.length+' buổi'+(skip.length?'. Bỏ qua '+skip.length+' ngày: '+skip.join('; '):''))};
ACT.dsdel=v=>{if(!canSub())return false;const [d,sid]=v.split('|'),l=dsLesson(sid),s=subOf(d,sid);if(!l||!s)return false;
 ask('Bỏ dạy thay buổi '+slotLb(l.slot)+' ngày '+vdm(d)+' của '+given(kn(l.hs))+'? Buổi sẽ về lại giáo viên của bé ('+given(sn(l.gv))+').',()=>{dsUndo(l,d);toast('Đã bỏ dạy thay')},'Bỏ dạy thay')};
