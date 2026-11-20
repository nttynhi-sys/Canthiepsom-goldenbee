/* ===== Dạy thay: phân giáo viên khác dạy thay buổi của giáo viên nghỉ ốm, nghỉ phép ===== */
/* Trưởng Trung tâm, Quản lý, Văn phòng (hành chính) phân giáo viên dạy thay cho từng buổi của từng bé (ngày d, buổi sid).
   Dữ liệu: DB.sub (collection sub trong records, không phải tiền) = {id,d,sid,hs,gv,og,by,at,n}; xem subOf, effGv, ABS_ATT ở p04-domain.js.
   Buổi 1-1 hằng tuần không đổi; chỉ ngày d đổi người dạy. Giáo viên dạy thay điểm danh, ghi buổi và nhận tiền công theo ca của ngày đó.
   Lịch trống của giáo viên trong một ngày tính từ lịch dạy, ngày nghỉ phép, lớp bán trú; buổi của bé vắng (ABS_ATT) cũng được coi là giờ trống. */
const canSub=()=>isLead()||isVP();
/* giáo viên nghỉ vào ngày d: đơn nghỉ đã duyệt, hoặc chấm công nghỉ cả ngày; chấm công nghỉ nửa ngày chỉ tính khi truyền giờ slot rơi vào nửa ngày nghỉ */
function dsLeave(gv,d,slot){const l=DB.lr.find(x=>x.st===gv&&x.s==='duyet'&&x.f<=d&&d<=x.t);if(l)return l;
 const r=tsLv(gv,d);if(!r)return null;
 if(r.l==='full'||(slot&&(r.l==='am'?slot<CC_AM_END:slot>=CC_AM_END)))return{type:r.lk?'kl':'phep',half:r.l==='full'?'':r.l,ts:1};
 return null}
const dsLvT=lv=>'Nghỉ '+(lv.half==='am'?'nửa ngày sáng':lv.half==='pm'?'nửa ngày chiều':lv.type==='kl'?'không lương':'có phép');
const dsLesson=sid=>DB.lich.find(x=>x.id===sid);
const dsLessonsOn=d=>DB.lich.filter(l=>(l.type==='11'&&l.day===dow(d))||(l.type==='bu'&&l.date===d));
const dsTeachers=()=>DB.staff.filter(s=>s.st==='dang'&&isTeacher(s));
/* giáo viên gv dạy được ca bắt đầu lúc slot ngày d không (bỏ qua buổi sid đang xét): '' là được, ngược lại là lý do */
function dsWhy(gv,d,slot,sid){
 const t=stBy(gv);if(!t||t.st!=='dang'||!isTeacher(t))return'Không phải giáo viên đang làm việc';
 if(isClosed(d))return'Trung tâm nghỉ ngày này';
 if(dsLeave(gv,d,slot))return'Đang nghỉ (phép, ốm hoặc nửa ngày)';
 const w=dow(d);if(DB.groups.some(g=>grHas(g,gv)&&grOpen(g,w)))return'Đang phụ trách lớp bán trú';
 for(const l of dsLessonsOn(d)){const ls=effSlot(l,d);if(l.id===sid||!ls||!slotOver(ls,slot)||effGv(l,d)!==gv)continue;
  if(ABS_ATT.includes(DB.att[attKey(d,l.id,l.hs)]))continue;   /* bé vắng: giáo viên rảnh */
  return'Đang dạy '+given(kn(l.hs))+' lúc '+ls}
 return''}
/* các buổi của gv trong ngày d có bé vắng (giờ rảnh), kèm ghi chú */
const dsFreed=(gv,d)=>dsLessonsOn(d).filter(l=>effGv(l,d)===gv&&ABS_ATT.includes(DB.att[attKey(d,l.id,l.hs)])).sort((a,b)=>effSlot(a,d)<effSlot(b,d)?-1:1);
const dsFreedAt=(gv,d,slot,sid)=>dsFreed(gv,d).filter(l=>l.id!==sid&&slotOver(effSlot(l,d),slot));
/* khoảng giờ trống của gv trong ngày d, gộp các khung liền nhau */
function dsRanges(gv,d){const out=[];let cur=null;
 SLOTS.forEach(s=>{if(!dsWhy(gv,d,s,'')){if(cur)cur.e=s;else cur={b:s,e:s}}else if(cur){out.push(cur);cur=null}});
 if(cur)out.push(cur);return out.map(r=>r.b===r.e?slotLb(r.b):r.b+'–'+slotEnd(r.e))}
/* buổi cần người dạy thay trong ngày d: giáo viên gốc có đơn nghỉ đã duyệt */
const dsNeed=d=>dayList(d).filter(s=>(s.kind==='11'||s.kind==='bu')&&!s.sub&&(l=>l&&dsLeave(l.gv,d,l.slot))(dsLesson(s.sid)));
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
CHG.dsall=(v,t)=>{S.ds.all=t.checked?1:0};
ACT.dskid=id=>{if(!canSub())return false;S.modal=null;go('ds',{ds:Object.assign(dsDef(),{q:kcode(kidBy(id)||{id:''})})})};
/* thẻ trong hồ sơ bé, tab Lịch học (Trưởng Trung tâm, Quản lý) */
function dsKidCard(k){if(!canSub())return'';const n=(DB.sub||[]).filter(s=>s.hs===k.id&&s.d>=TODAY).length;
 return`<div class="card"><h2>Dạy thay</h2><p class="sm mu" style="margin-bottom:8px">Khi giáo viên của bé nghỉ ốm hoặc nghỉ phép, phân giáo viên khác dạy thay cho từng buổi.${n?' Bé đang có <b>'+n+'</b> buổi dạy thay sắp tới.':''}</p><div class="acts"><button class="btn p" data-a="dskid" data-v="${k.id}">Phân giáo viên dạy thay</button></div></div>`}

function dsLessonTab(c){
 const q=ascii(c.q||''),rows=dayList(c.d).filter(s=>s.kind==='11'||s.kind==='bu').map(s=>({s,l:dsLesson(s.sid),k:s.kids[0]})).filter(r=>r.l&&r.k)
  .filter(r=>!q||ascii(r.k.n+' '+kcode(r.k)).includes(q)).map(r=>Object.assign(r,{lv:dsLeave(r.l.gv,c.d,r.l.slot)}))
  .filter(r=>c.all||q||r.lv||r.s.sub).sort((a,b)=>(!!b.lv-!!a.lv)||(a.s.slot<b.s.slot?-1:1));
 const need=rows.filter(r=>r.lv&&!r.s.sub).length;
 const ctl=`<div class="card"><div class="top" style="gap:10px;margin:0"><p style="margin:0">${need?`<b>${need}</b> buổi chưa có người dạy thay`:'Không có buổi nào đang chờ người dạy thay'}${c.all||q?'':' · chỉ hiện buổi của giáo viên nghỉ và buổi đã có người dạy thay'}</p>
  <label class="sm" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-c="dsall" value="1" ${c.all?'checked':''}> Hiện tất cả buổi trong ngày</label></div></div>`;
 if(!rows.length)return ctl+'<p class="empty">'+(isClosed(c.d)?'Trung tâm nghỉ ngày này.':c.all||q?'Ngày này không có buổi 1-1 hay học bù nào.':'Không có giáo viên nào nghỉ có buổi dạy ngày này. Bấm “Hiện tất cả buổi trong ngày” để phân dạy thay cho giáo viên nghỉ đột xuất chưa có đơn.')+'</p>';
 return ctl+`<div class="card tbl"><table><thead><tr><th>Giờ</th><th>Học sinh</th><th>Giáo viên của bé</th><th>Dạy thay</th><th></th></tr></thead><tbody>`
 +rows.map(r=>{const sb=r.s.sub,ab=ABS_ATT.includes(DB.att[attKey(c.d,r.s.sid,r.k.id)])&&!sb&&!r.lv;
  return`<tr><td>${slotLb(effSlot(r.l,c.d))}<br><span class="sm mu">${r.l.type==='bu'?'Học bù':'1-1'}${r.s.sub&&r.s.sub.slot?' · giờ gốc '+r.l.slot:''}</span></td><td><b>${esc(r.k.n)}</b><br><span class="sm mu">${esc(kcode(r.k))}</span></td>
  <td>${esc(sn(r.l.gv))}${r.lv?'<br>'+tg(dsLvT(r.lv),'wa'):''}${ab?'<br>'+tg('Bé vắng','gy'):''}</td>
  <td>${sb?`<b>${esc(sn(sb.gv))}</b>${sb.slot?'<br>'+tg('Đổi giờ','wa'):''}${sb.n?'<br><span class="sm mu">'+esc(sb.n)+'</span>':''}`:(r.lv?tg('Chưa có người dạy thay','er'):'<span class="mu">—</span>')}</td>
  <td style="white-space:nowrap"><button class="btn s ${sb||!r.lv?'':'p'}" data-a="dsopen" data-v="${esc(c.d+'|'+r.s.sid)}">${sb?'Đổi người':'Phân công'}</button>${sb?` <button class="btn s" data-a="dsnotify" data-v="${esc(c.d+'|'+r.s.sid)}" title="Gửi thông báo cho giáo viên dạy thay">Thông báo</button> <button class="btn s no" data-a="dsdel" data-v="${esc(c.d+'|'+r.s.sid)}">Bỏ dạy thay</button>`:''}</td></tr>`}).join('')+`</tbody></table></div>`}

function dsFreeTab(c){
 if(isClosed(c.d))return'<p class="empty">Trung tâm nghỉ ngày này.</p>';
 const tc=dsTeachers().map(t=>{const lv=dsLeave(t.id,c.d),w=dow(c.d),gr=DB.groups.some(g=>grHas(g,t.id)&&grOpen(g,w)),
   own=dsLessonsOn(c.d).filter(l=>effGv(l,c.d)===t.id).sort((a,b)=>effSlot(a,c.d)<effSlot(b,c.d)?-1:1),fr=dsFreed(t.id,c.d),rg=lv||gr?[]:dsRanges(t.id,c.d),subs=(DB.sub||[]).filter(x=>x.d===c.d&&x.gv===t.id);
   return{t,lv,hv:lv?null:tsLv(t.id,c.d),gr,own,fr,rg,subs}}).sort((a,b)=>((!!a.lv||a.gr)-(!!b.lv||b.gr))||(b.rg.length-a.rg.length)||(a.t.n<b.t.n?-1:1));
 const q=ascii(c.q||''),list=q?tc.filter(x=>ascii(x.t.n).includes(q)):tc,n=tc.filter(x=>!x.lv&&!x.gr&&x.rg.length).length;
 const ch=(a,b)=>`<span class="tag ${a}" style="margin:2px 4px 2px 0;display:inline-block">${b}</span>`;
 return`<div class="card"><p style="margin:0"><b>${n}</b> giáo viên còn giờ trống ngày ${vdm(c.d)}. Giờ có bé vắng (nghỉ P, KP, nhập viện, Trung tâm nghỉ) được tính là giờ trống.</p></div>
 <div class="card tbl"><table><thead><tr><th>Giáo viên</th><th>Giờ trống</th><th>Buổi có bé vắng (giờ rảnh)</th><th>Đang dạy</th></tr></thead><tbody>`
 +list.map(x=>{const busy=x.own.filter(l=>!ABS_ATT.includes(DB.att[attKey(c.d,l.id,l.hs)]));
  return`<tr><td><b>${esc(tName(x.t))}</b>${x.lv?'<br>'+tg(dsLvT(x.lv),'wa'):''}${!x.lv&&x.hv?'<br>'+tg(LVT[x.hv.l],'wa'):''}${x.gr?'<br>'+tg('Lớp bán trú','in'):''}</td>
  <td>${x.lv||x.gr?'<span class="mu">Không dạy thay được</span>':x.rg.length?x.rg.map(r=>ch('ok',esc(r))).join(''):'<span class="mu">Hết giờ trống</span>'}</td>
  <td>${x.fr.length?x.fr.map(l=>ch('y',esc(effSlot(l,c.d)+' · '+given(kn(l.hs))+' ('+AC[DB.att[attKey(c.d,l.id,l.hs)]]+')'))).join(''):'<span class="mu">—</span>'}</td>
  <td>${busy.length?busy.map(l=>ch('gy',esc(effSlot(l,c.d)+' · '+given(kn(l.hs))))).join(''):'<span class="mu">—</span>'}${x.subs.map(s=>ch('in','Dạy thay '+esc(dsLesson(s.sid)?effSlot(dsLesson(s.sid),c.d):'')+' · '+esc(given(kn(s.hs))))).join('')}</td></tr>`}).join('')+`</tbody></table></div>
 <div class="acts"><button class="btn p" data-a="dstab" data-v="cv">Phân công dạy thay cho các buổi</button></div>`}

/* ---- phân công ---- */
ACT.dsopen=v=>{if(!canSub())return false;const [d,sid]=v.split('|'),l=dsLesson(sid);if(!l||!kidBy(l.hs))return false;const cur=subOf(d,sid);
 S.modal={t:'dsa',d,sid,err:'',gv:cur?cur.gv:'',slot:cur&&cur.slot?cur.slot:l.slot,to:'',n:cur?cur.n||'':'',sel:{},nt:true}};
/* các ngày có thể dạy thay của buổi: ca 1-1 hằng tuần thì các ngày cùng thứ từ ngày đang xét đến ngày kết thúc (tối đa 120 tuần), buổi học bù chỉ một ngày */
function dsDates(l,m){if(l.type!=='11')return[m.d];const to=m.to&&m.to>m.d?m.to:m.d,a=[];for(let d=m.d;d<=to&&a.length<120;d=addD(d,7))a.push(d);return a}
CHG.dsnt=(v,t)=>{S.modal.nt=t.checked;return false};
CHG.dsday=(v,t)=>{const m=S.modal;m.sel=m.sel||{};m.sel[v]=t.checked;return false};
ACT.dsdays=v=>{const m=S.modal,l=dsLesson(m.sid);m.sel={};dsDates(l,m).forEach(d=>{m.sel[d]=!!+v})};
/* đổi giờ học của bé cho hợp giáo viên dạy thay: giờ hợp lệ và bé không có buổi khác trùng giờ (buổi bé vắng không tính) */
function dsKidWhy(l,d,slot){if(!slotValid(slot))return'Giờ bắt đầu phải từ '+DAY_OPEN+' đến '+SLOT_LAST;
 for(const x of dsLessonsOn(d)){if(x.id===l.id||x.hs!==l.hs||!x.slot)continue;const xs=effSlot(x,d);if(!slotOver(xs,slot)||ABS_ATT.includes(DB.att[attKey(d,x.id,x.hs)]))continue;return'Bé đã có buổi khác lúc '+xs}
 return''}
/* các khung giờ giáo viên gv rảnh và bé không trùng buổi khác, để gợi ý đổi giờ */
const dsAlt=(gv,l,d)=>SLOTS.filter(s=>!dsWhy(gv,d,s,l.id)&&!dsKidWhy(l,d,s));
function dsOpts(d,l,slot){return dsTeachers().filter(t=>t.id!==l.gv).map(t=>{const why=dsWhy(t.id,d,slot,l.id),alt=why?dsAlt(t.id,l,d):[],fr=why?[]:dsFreedAt(t.id,d,slot,l.id);return{t,why,alt,fr}})
  .sort((a,b)=>(!!a.why-!!b.why)||((b.alt.length>0)-(a.alt.length>0))||(b.fr.length-a.fr.length)||(a.t.n<b.t.n?-1:1))}
CHG.dsgv=v=>{S.modal.gv=v;S.modal.err=''};
CHG.dsslot=v=>{if(/^\d{2}:\d{2}$/.test(v||''))S.modal.slot=v;S.modal.err=''};
CHG.dsto=v=>{S.modal.to=/^\d{4}-\d{2}-\d{2}$/.test(v||'')?v:'';S.modal.err=''};
CHG.dsn=v=>{S.modal.n=String(v||'').slice(0,80);return false};
ACT.dsslotpick=v=>{S.modal.slot=v;S.modal.err=''};
MODALS.dsa=()=>{const m=S.modal,l=dsLesson(m.sid),k=l&&kidBy(l.hs);if(!l||!k||!canSub()){S.modal=null;return''}
 const slot=m.slot||l.slot,dl=dsDates(l,m).map(d=>{const why=isClosed(d)?'Trung tâm nghỉ':m.gv?(dsWhy(m.gv,d,slot,l.id)||dsKidWhy(l,d,slot)):'',sb=subOf(d,m.sid),on=m.sel&&m.sel[d]!==undefined?m.sel[d]:!why;return{d,why,on,note:why?'vướng: '+why:m.gv?'rảnh':sb?'đang dạy thay: '+given(sn(sb.gv)):''}}),cur=subOf(m.d,m.sid),o=dsOpts(m.d,l,slot),free=o.filter(x=>!x.why),lv=dsLeave(l.gv,m.d,l.slot),kw=dsKidWhy(l,m.d,slot),sel=o.find(x=>x.t.id===m.gv),moved=slot!==l.slot;
 const lab=x=>esc(tName(x.t))+' · '+(x.why?(x.alt.length?'bận lúc '+esc(slot)+', đổi giờ được':esc(x.why)):x.fr.length?'rảnh vì '+esc(given(kn(x.fr[0].hs)))+' nghỉ':'rảnh');
 const alt=sel&&sel.why&&sel.alt.length?`<div class="sm" style="margin:-4px 0 4px"><span class="mu">${esc(given(sel.t.n))} rảnh các giờ sau (bé không trùng buổi khác), bấm để chọn giờ học:</span><div style="margin-top:4px">${sel.alt.slice(0,16).map(s=>`<button type="button" class="btn s" data-a="dsslotpick" data-v="${s}" style="margin:2px 4px 2px 0">${s}</button>`).join('')}</div></div>`:'';
 return mdl('Phân giáo viên dạy thay',`<p class="sm" style="margin-bottom:8px"><b>${esc(k.n)}</b> · ${esc(kcode(k))}<br>${DAYN[dow(m.d)]} ${vd(m.d)} · ${slotLb(l.slot)}${cur&&cur.slot?' (đang đổi sang '+slotLb(cur.slot)+')':''} · ${l.type==='bu'?'Học bù':'1-1'}<br><span class="mu">Giáo viên của bé: ${esc(sn(l.gv))}${lv?' (đang nghỉ)':''}</span></p>
 <form id="dsaf" class="f"><div><label for="ds-g">Giáo viên dạy thay</label><select id="ds-g" name="gv" data-c="dsgv"><option value="">Chọn giáo viên</option>${o.map(x=>`<option value="${x.t.id}" ${x.why&&!x.alt.length?'disabled':''} ${m.gv===x.t.id?'selected':''}>${lab(x)}</option>`).join('')}</select></div>
 <div><label for="ds-s">Giờ học của bé ngày ${vdm(m.d)} <span class="mu">· đổi giờ nếu cần cho hợp giáo viên dạy thay (giờ gốc ${esc(l.slot)})</span></label><input id="ds-s" name="slot" type="time" min="${DAY_OPEN}" max="${SLOT_LAST}" step="300" value="${esc(slot)}" data-c="dsslot" style="width:auto"> ${moved?`<button type="button" class="btn s" data-a="dsslotpick" data-v="${esc(l.slot)}">Về giờ gốc ${esc(l.slot)}</button>`:''}</div>${alt}
 ${kw?`<p class="note sm" style="margin:0">${esc(kw)}. Hãy chọn giờ khác.</p>`:''}
 ${l.type==='11'?`<div><label for="ds-t">Đến ngày <span class="mu">· để dạy thay nhiều ngày cùng thứ, chọn ngày cuối rồi tích các ngày cần dạy thay</span></label><input id="ds-t" name="to" type="date" min="${m.d}" value="${esc(m.to||'')}" data-c="dsto"></div>`:''}
 <div><span class="lbl">Các ngày dạy thay <span class="mu">· ${dl.length>1?'tích một hoặc nhiều ngày':'một ngày'}</span></span>${dl.length>1?`<div class="acts" style="margin:4px 0"><button type="button" class="btn s" data-a="dsdays" data-v="1">Chọn hết</button><button type="button" class="btn s" data-a="dsdays" data-v="0">Bỏ chọn hết</button></div>`:''}
 <div style="max-height:170px;overflow:auto;border:1px solid var(--bd);border-radius:10px;padding:6px 10px">${dl.map(x=>`<label style="display:flex;gap:8px;align-items:center;margin:3px 0"><input type="checkbox" name="dd" value="${x.d}" data-c="dsday" ${x.on?'checked':''}> <b>${DAYN[dow(x.d)]} ${vd(x.d)}</b> <span class="sm ${x.why?'mu':''}">${esc(x.note)}</span></label>`).join('')}</div></div>
 <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="nt" data-c="dsnt" ${m.nt!==false?'checked':''}> Gửi thông báo cho giáo viên dạy thay (và báo hủy cho giáo viên được phân trước đó nếu đổi người)</label>
 <div><label for="ds-n">Ghi chú <span class="mu">· giáo viên dạy thay đọc được ghi chú này trong thông báo</span></label><input id="ds-n" name="n" maxlength="80" value="${esc(m.n||'')}" data-c="dsn" placeholder="Ví dụ: cô A nghỉ ốm"></div>
 <p class="sm mu" style="margin:0">${free.length?'Có <b>'+free.length+'</b> giáo viên rảnh lúc '+esc(slot)+'.':'Chưa có giáo viên nào rảnh lúc '+esc(slot)+'; chọn giáo viên rồi đổi sang giờ họ rảnh.'} Đổi giờ chỉ áp dụng cho ngày dạy thay (lịch hằng tuần và học phí của bé không đổi); phụ huynh thấy giờ mới kèm nhãn “Đổi giờ”. Xem lịch trống cả ngày ở thẻ “Lịch trống giáo viên”. Giáo viên dạy thay điểm danh, ghi buổi và nhận tiền công ca này.</p>
 <div class="err" role="alert">${esc(m.err||'')}</div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Phân công dạy thay</button></div></form>`)};
/* dạy thay thì buổi không còn là "giáo viên nghỉ": bỏ dấu TT/GV nghỉ do đơn nghỉ phép tự ghi và hủy yêu cầu học bù tự tạo; bỏ dạy thay thì khôi phục */
/* thông báo gửi riêng cho giáo viên dạy thay (collection nt, aud 'nb' kèm to): phân công mới, đổi người hoặc hủy. items = [{d,sid,hs,slot,og,old,n}] */
function dsNotify(gv,kind,items){if(!gv||!items.length||!stBy(gv))return false;
 const L=items.slice().sort((a,b)=>a.d<b.d?-1:1),show=L.slice(0,15);
 const line=x=>{const l=dsLesson(x.sid),k=kidBy(x.hs),sl=x.slot||(l?l.slot:'');
  return'• '+DAYN[dow(x.d)]+' '+vd(x.d)+', '+slotLb(sl)+(x.slot&&l&&x.slot!==l.slot?' (đổi từ giờ gốc '+l.slot+')':'')+' · '+(l&&l.type==='bu'?'học bù':'1-1')+' · bé '+(k?k.n+' ('+kcode(k)+')':'')+(x.og?' · thay '+sn(x.og):'')};
 const head={assign:'Bạn được phân công dạy thay '+L.length+' buổi:',cancel:'Phân công dạy thay đã được hủy cho '+L.length+' buổi:',remind:'Nhắc lịch dạy thay '+L.length+' buổi:'}[kind];
 const note=[...new Set(L.map(x=>x.n).filter(Boolean))].join('; ');
 DB.nt.push({id:'n'+uid(),aud:'nb',tg:'all',to:[gv],t:{assign:'Phân công dạy thay',cancel:'Hủy phân công dạy thay',remind:'Nhắc lịch dạy thay'}[kind],
  b:head+'\n'+show.map(line).join('\n')+(L.length>show.length?'\n… và '+(L.length-show.length)+' buổi nữa (xem lịch dạy hằng ngày).':'')+(kind==='assign'&&note?'\nGhi chú: '+note:'')+(kind==='assign'?'\nBạn điểm danh và ghi buổi can thiệp như các buổi của mình.':''),
  by:U.id,at:TODAY,pin:false});return true}
function dsApply(l,d,gv,n,slot){
 const prev=subOf(d,l.id);
 DB.sub=(DB.sub||[]).filter(x=>!(x.d===d&&x.sid===l.id));
 const r={id:'sb'+uid(),d,sid:l.id,hs:l.hs,gv,og:l.gv,by:U.id,at:TODAY,n:n||''};if(slot&&slot!==l.slot)r.slot=slot;DB.sub.push(r);
 if(dsLeave(l.gv,d,l.slot)){const key=attKey(d,l.id,l.hs);if(DB.att[key]==='tt')delete DB.att[key];
  DB.mk.forEach(r=>{if(r.hs===l.hs&&r.from.d===d&&r.from.sid===l.id&&r.why==='Giáo viên nghỉ phép'&&r.s==='dk'&&!(r.props||[]).length){r.s='huy';r.dsub=1;r.log.push({at:TODAY,by:U.id,tx:'Đã phân giáo viên dạy thay, không cần học bù'})}})};return prev}
function dsUndo(l,d){
 DB.sub=(DB.sub||[]).filter(x=>!(x.d===d&&x.sid===l.id));
 if(dsLeave(l.gv,d,l.slot)){const key=attKey(d,l.id,l.hs);if(!DB.att[key]&&DB.lr.some(x=>x.st===l.gv&&x.s==='duyet'&&x.f<=d&&d<=x.t))DB.att[key]='tt';
  DB.mk.forEach(r=>{if(r.dsub&&r.hs===l.hs&&r.from.d===d&&r.from.sid===l.id&&r.s==='huy'){r.s='dk';delete r.dsub;r.log.push({at:TODAY,by:U.id,tx:'Bỏ dạy thay, mở lại yêu cầu học bù'})}})}}
FORM.dsaf=f=>{const m=S.modal,l=dsLesson(m.sid),gv=f.elements.gv.value,n=String(f.elements.n.value||'').trim().slice(0,80),slot=(f.elements.slot&&f.elements.slot.value)||l.slot;
 if(!canSub()||!l||!kidBy(l.hs))return false;
 if(!gv){m.err='Hãy chọn giáo viên dạy thay.';return}
 if(gv===l.gv){m.err='Đây là giáo viên của bé. Hãy chọn giáo viên khác.';return}
 if(!slotValid(slot)){m.err='Giờ bắt đầu phải từ '+DAY_OPEN+' đến '+SLOT_LAST+'.';return}
 const chk=f.querySelectorAll?[...f.querySelectorAll('input[name=dd]:checked')].map(x=>x.value):null;
 if(chk&&!chk.length){m.err='Hãy tích ít nhất một ngày dạy thay.';return}
 const dates=chk||[m.d],ok=[],skip=[];
 const prevs=[];
 dates.forEach(d=>{const why=dsWhy(gv,d,slot,l.id)||dsKidWhy(l,d,slot);if(why)skip.push(vdm(d)+': '+why);else{const pv=dsApply(l,d,gv,n,slot);if(pv&&pv.gv!==gv)prevs.push({d,sid:l.id,hs:l.hs,slot:pv.slot||l.slot,og:l.gv,gv:pv.gv});ok.push(d)}});
 if(!ok.length){m.err='Không phân được: '+skip.join('; ');return}
 const send=f.elements.nt?f.elements.nt.checked:m.nt!==false;let sent=false;
 if(send){sent=dsNotify(gv,'assign',ok.map(d=>({d,sid:l.id,hs:l.hs,slot:slot!==l.slot?slot:'',og:l.gv,n})));
  [...new Set(prevs.map(x=>x.gv))].forEach(pg=>dsNotify(pg,'cancel',prevs.filter(x=>x.gv===pg)))}
 S.modal=null;toast('Đã phân '+given(sn(gv))+' dạy thay '+ok.length+' buổi'+(slot!==l.slot?', đổi giờ sang '+slot:'')+(sent?', đã gửi thông báo':'')+(skip.length?'. Bỏ qua '+skip.length+' ngày: '+skip.join('; '):''))};
ACT.dsdel=v=>{if(!canSub())return false;const [d,sid]=v.split('|'),l=dsLesson(sid),s=subOf(d,sid);if(!l||!s)return false;
 ask('Bỏ dạy thay buổi '+slotLb(effSlot(l,d))+' ngày '+vdm(d)+' của '+given(kn(l.hs))+'? Buổi sẽ về lại giáo viên của bé ('+given(sn(l.gv))+').',()=>{const sb=subOf(d,sid);dsUndo(l,d);if(sb)dsNotify(sb.gv,'cancel',[{d,sid,hs:l.hs,slot:sb.slot||'',og:l.gv}]);toast('Đã bỏ dạy thay'+(sb?' và báo cho '+given(sn(sb.gv)):''))},'Bỏ dạy thay')};
/* nhắc lại lịch dạy thay: gửi thêm một thông báo cho giáo viên dạy thay của buổi đó */
ACT.dsnotify=v=>{if(!canSub())return false;const [d,sid]=v.split('|'),l=dsLesson(sid),sb=subOf(d,sid);if(!l||!sb)return false;dsNotify(sb.gv,'remind',[{d,sid,hs:l.hs,slot:sb.slot||'',og:l.gv,n:sb.n}]);toast('Đã gửi thông báo cho '+given(sn(sb.gv)))};
