/* ===== 6. Chấm công nhân viên ===== */
const hm=()=>{const d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes())};
const CSYM={ok:['x','Đủ công'],late:['M','Đi muộn'],leave:['P','Nghỉ phép'],kl:['K','Nghỉ không lương'],half:['N','Nghỉ nửa ngày'],halfkl:['Q','Nghỉ nửa ngày không lương'],abs:['A','Vắng không phép'],chua:['·','Chưa chấm'],hol:['L','Nghỉ lễ']};
const LRT={phep:'Nghỉ phép',om:'Nghỉ ốm',kl:'Nghỉ không lương'};
const LRS={cho:['Chờ duyệt','wa'],duyet:['Đã duyệt','ok'],tuchoi:['Từ chối','er']};
/* Chấm công do Quản lý hoặc Trưởng Trung tâm thực hiện cho nhân sự làm giờ cố định (lương cố định tháng); giáo viên không tự chấm công. Nhân sự chỉ trả lương theo ca 1-1 (s.cc===false) không cần chấm công, xem needCC ở p04-domain.js. */
/* Nghỉ nửa ngày hoặc cả ngày do người chấm công ghi thẳng vào chấm công của giáo viên fulltime (DB.ts[nhânviên|ngày] = {i,o,l,lk}): l = 'full' nghỉ cả ngày, 'am' nghỉ nửa ngày sáng (làm từ 13:00), 'pm' nghỉ nửa ngày chiều (làm đến 12:00); lk:1 là nghỉ không lương. Trưởng Trung tâm, Quản lý và Văn phòng (hành chính) ghi được. */
const CC_AM_END='12:00',CC_PM_START='13:00',canLeaveMark=()=>isLead()||isVP();
const tsLv=(id,d)=>{const r=DB.ts[id+'|'+d];return r&&(r.l==='full'||r.l==='am'||r.l==='pm')?r:null};
const LVT={full:'Nghỉ cả ngày',am:'Nghỉ nửa ngày sáng',pm:'Nghỉ nửa ngày chiều'};
const ccCls=k=>k==='ok'?'ok':k==='late'?'wa':k==='leave'||k==='kl'||k==='half'||k==='halfkl'?'in':k==='abs'?'er':'gy';
const ccIn=()=>DB.cfg.ccIn||'07:15',ccOut=()=>DB.cfg.ccOut||'18:00';
const selfCC=()=>!!U&&!isGV()&&!isPH()&&needCC(stBy(U.id));   /* Trưởng Trung tâm, Quản lý, Văn phòng vẫn tự chấm công của mình */
const ccStaff=()=>DB.staff.filter(s=>s.st==='dang'&&needCC(s));
const ccDay=()=>{const d=S.cc&&S.cc.d;return d&&d<=TODAY?d:WD};
const lrDays=l=>{let n=0;for(let d=l.f;d<=l.t;d=addD(d,1))if(isW(d))n++;return n};
VIEWS.cc=()=>{const c=S.cc=Object.assign({tab:'hn',m:CM},S.cc),pend=DB.lr.filter(l=>l.s==='cho').length;
 const tabs=seesAll()?[['hn','Hôm nay'],['bang','Bảng công tháng'],['m11','Chấm công 1-1'],['don','Đơn nghỉ phép'+(pend?' ('+pend+')':'')]]:[['hn','Chấm công của tôi']].concat(isGV()?[['m11','Chấm công 1-1 của tôi']]:[],[['don','Đơn nghỉ phép của tôi']]);
 if(!tabs.some(t=>t[0]===c.tab))c.tab='hn';
 return head(isGV()?'Chấm công của tôi':'Chấm công',isGV()?'Quản lý chấm công cho giáo viên làm giờ cố định; giáo viên trả theo ca không cần chấm công':'Quản lý chấm công cho nhân sự làm giờ cố định; nhân sự trả theo ca 1-1 không cần chấm công',c.tab==='don'?'<button class="btn p" data-a="lrnew">Tạo đơn nghỉ</button>':canLeaveMark()&&seesAll()?'<button class="btn p" data-a="tsm">Chấm nghỉ nhiều ngày</button>':'')+tabsH(tabs,c.tab,'cctab')+(c.tab==='hn'?ccToday():c.tab==='bang'?ccGrid():c.tab==='m11'?cc11():ccLeave())};
ACT.cctab=v=>{S.cc.tab=v};
ACT.ccm=v=>{S.cc.m=sm(S.cc.m,+v)};
ACT.ci=()=>{if(!selfCC())return false;const k=U.id+'|'+WD,r=DB.ts[k]||(DB.ts[k]={i:'',o:''});if(!r.i){r.i=hm();toast('Đã chấm công vào lúc '+r.i)}else if(!r.o){r.o=hm();toast('Đã chấm công ra lúc '+r.o)}};
function ccMe(){const me=stBy(U.id),t=DB.ts[U.id+'|'+WD],st=tsSt(U.id,WD);
 if(!needCC(me))return`<div class="card"><h2>Chấm công</h2><p>Bạn được trả lương theo ca 1-1 nên <b>không cần chấm công</b>. Tiền công tính theo số ca bạn đã dạy và điểm danh của bé.</p></div>`;
 if(!selfCC())return`<div class="card"><h2>Chấm công ngày ${DAYN[dow(WD)]} ${vd(WD)}</h2><p>${st==='leave'||st==='kl'?'Hôm nay bạn nghỉ'+(tsLv(U.id,WD)?' (Quản lý đã chấm công nghỉ cả ngày).':' phép đã được duyệt.'):st==='half'||st==='halfkl'?'Hôm nay bạn nghỉ nửa ngày ('+(tsLv(U.id,WD).l==='am'?'buổi sáng, làm từ '+CC_PM_START:'buổi chiều, làm đến '+CC_AM_END)+').':t&&t.i?'Quản lý đã chấm công: vào lúc <b>'+t.i+'</b>'+(st==='late'?' '+tg('Đi muộn','wa'):'')+(t.o?', ra lúc <b>'+t.o+'</b>':''):'Quản lý chưa chấm công cho bạn.'}</p><p class="sm mu" style="margin-top:8px">Giáo viên làm giờ cố định không tự chấm công. Quản lý hoặc Trưởng Trung tâm chấm công cho bạn mỗi ngày; nếu thấy sai, hãy báo Quản lý. Đi muộn nếu vào sau ${DB.cfg.lateAfter}.</p></div>`;
 return`<div class="card"><h2>Chấm công ngày ${DAYN[dow(WD)]} ${vd(WD)}</h2><p>${t&&t.i?'Vào lúc <b>'+t.i+'</b>'+(st==='late'?' '+tg('Đi muộn','wa'):''):'Bạn chưa chấm công vào.'}${t&&t.o?', ra lúc <b>'+t.o+'</b>':''}</p><div class="acts" style="margin-top:10px"><button class="btn y" data-a="ci" ${t&&t.o?'disabled':''}>${t&&t.i?'Chấm công ra':'Chấm công vào'}</button></div><p class="sm mu" style="margin-top:8px">Quy định: vào sau ${DB.cfg.lateAfter} tính là đi muộn. ${WD!==TODAY?'Hôm nay là ngày nghỉ nên hệ thống ghi vào ngày làm việc gần nhất.':''}</p></div>`}
function ccToday(){let h=ccMe();
 if(seesAll())h+=ccRoster();
 else if(needCC(stBy(U.id)))h+=ccMine(S.cc.m);
 return h}
/* Bảng chấm công trong ngày do Quản lý, Trưởng Trung tâm thực hiện (Văn phòng chỉ xem) */
function ccRoster(){const d=ccDay(),st=ccStaff(),cnt={},skip=DB.staff.filter(s=>s.st==='dang'&&!needCC(s)),open=isW(d)&&!isClosed(d),edit=isLead()&&open,mark=canLeaveMark()&&open;
 st.forEach(s=>{const k=tsSt(s.id,d);cnt[k]=(cnt[k]||0)+1});
 const todo=(cnt.chua||0)+(cnt.abs||0);
 return`<div class="card"><div class="top"><h2>Chấm công ngày ${DAYN[dow(d)]} ${vd(d)}</h2><div class="acts"><div><label class="sm mu" for="cc-d">Ngày</label><input id="cc-d" type="date" data-c="ccdate" value="${d}" max="${TODAY}"></div>${edit?`<button class="btn p" data-a="ccall" ${todo?'':'disabled'}>Chấm có mặt cho ${todo} người chưa chấm</button>`:''}</div></div>
 <div class="grid">${kpi('Đúng giờ',cnt.ok||0,'ngày '+vdm(d),'ok')}${kpi('Đi muộn',cnt.late||0,'vào sau '+DB.cfg.lateAfter)}${kpi('Nghỉ phép',(cnt.leave||0)+(cnt.kl||0)+(cnt.half||0)+(cnt.halfkl||0),'đã duyệt hoặc đã chấm'+((cnt.half||0)+(cnt.halfkl||0)?', trong đó '+((cnt.half||0)+(cnt.halfkl||0))+' nửa ngày':''))}${kpi('Chưa chấm công',todo,'chưa có giờ vào',todo?'er':'')}</div>
 ${open?'':`<p class="note sm" style="margin:10px 0">Ngày ${vdm(d)} là ngày nghỉ, không chấm công.</p>`}
 `+tbl(['Nhân viên','Chức vụ','Giờ vào','Giờ ra','Trạng thái',''],st.map(s=>{const t=DB.ts[s.id+'|'+d],k=tsSt(s.id,d),lvm=tsLv(s.id,d),lrOn=DB.lr.some(l=>l.st===s.id&&l.s==='duyet'&&l.f<=d&&d<=l.t),can=edit&&!lrOn&&!lvm&&k!=='hol';
  return`<tr><td><b>${esc(s.n)}</b></td><td>${esc(s.pos)}</td><td>${t?t.i||'–':'–'}</td><td>${t?t.o||'–':'–'}</td><td>${k?tg((CSYM[k]?CSYM[k][1]:'–')+(lvm&&lvm.l!=='full'?' ('+(lvm.l==='am'?'sáng':'chiều')+')':''),ccCls(k)):''}</td><td class="nw">${mark&&!lrOn&&k!=='hol'?`<button class="btn s" data-a="tsl" data-v="${s.id}|${d}">${lvm?'Sửa nghỉ':'Nghỉ'}</button> `:''}${can&&(k==='chua'||k==='abs')?`<button class="btn s p" data-a="ccon" data-v="${s.id}|${d}" title="Ghi vào ${ccIn()}, ra ${ccOut()}">Có mặt</button> `:''}${can?`<button class="btn s" data-a="tsedit" data-v="${s.id}|${d}">Sửa giờ</button>`:''}</td></tr>`}).join(''),'Chưa có nhân sự cần chấm công.')
 +`<p class="sm mu" style="margin-top:8px">${isLead()?`Nút "Có mặt" ghi giờ vào ${ccIn()} và giờ ra ${ccOut()} (hôm nay chưa đến giờ ra thì chỉ ghi giờ vào). Nhân sự đi muộn hoặc về sớm thì bấm "Sửa giờ"; nhân sự nghỉ cả ngày hoặc nửa ngày thì bấm "Nghỉ". Đổi giờ mặc định ở Nhân sự, Cài đặt.`:'Chỉ xem, việc chấm công do Quản lý hoặc Trưởng Trung tâm thực hiện.'}</p>`
 +(skip.length?`<p class="sm mu" style="margin-top:6px">Không cần chấm công (trả lương theo ca 1-1): ${skip.map(s=>esc(s.n)).join(', ')}.</p>`:'')+`</div>`}
/* ghi có mặt đủ giờ cho một người trong ngày d; chỉ khi ngày đó còn trống (chưa chấm hoặc vắng) */
function ccMark(id,d){const s=stBy(id);if(!s||!needCC(s)||d>TODAY)return false;const k=tsSt(id,d);if(k!=='chua'&&k!=='abs')return false;
 const now=hm();DB.ts[id+'|'+d]={i:d===TODAY&&now<ccIn()?now:ccIn(),o:d<TODAY||now>=ccOut()?ccOut():''};return true}
CHG.ccdate=v=>{if(!v||v>TODAY)return false;S.cc.d=v};
ACT.ccon=v=>{if(!isLead())return false;const [id,d]=v.split('|');if(!ccMark(id,d))return false;toast('Đã chấm công cho '+sn(id))};
ACT.ccall=()=>{if(!isLead())return false;const d=ccDay();let n=0;ccStaff().forEach(s=>{if(ccMark(s.id,d))n++});if(!n)return false;toast('Đã chấm có mặt cho '+n+' người')};
function ccMine(m){const s=stBy(U.id),p=payroll(s,m),rows=mDates(m).filter(d=>isW(d)&&d<=TODAY);
 return`<div class="card"><div class="top"><h2>${mLabel(m)}</h2><div class="acts"><button class="btn s" data-a="ccm" data-v="-1">Tháng trước</button><button class="btn s" data-a="ccm" data-v="1" ${m>=CM?'disabled':''}>Tháng sau</button></div></div><p class="mu sm" style="margin-bottom:8px">Công ${p.cong}/${DB.cfg.cc} · đi muộn ${p.late} lần · nghỉ phép ${p.leave} ngày · vắng ${p.abs} ngày</p>`
 +tbl(['Ngày','Giờ vào','Giờ ra','Trạng thái'],rows.reverse().map(d=>{const t=DB.ts[U.id+'|'+d],k=tsSt(U.id,d);return`<tr><td class="nw">${DAYS[dow(d)]} ${vdm(d)}</td><td>${t?t.i||'–':'–'}</td><td>${t?t.o||'–':'–'}</td><td>${k?tg(CSYM[k][1],ccCls(k)):''}</td></tr>`}).join(''),'Chưa có ngày làm việc nào.')+`</div>`}
function ccGrid(){const m=S.cc.m,ds=mDates(m),st=ccStaff(),skip=DB.staff.filter(s=>s.st==='dang'&&!needCC(s)),R=ccOneRows(m);
 return`<div class="card"><div class="top"><h2>Bảng công ${mLabel(m)}</h2><div class="acts"><button class="btn s" data-a="ccm" data-v="-1">Tháng trước</button><button class="btn s" data-a="ccm" data-v="1" ${m>=CM?'disabled':''}>Tháng sau</button><button class="btn s" data-a="ccxl">Xuất Excel</button></div></div>
 <div class="legend">${Object.entries(CSYM).map(([k,v])=>`<span><i class="sc sc-${v[0]==='·'?'q':v[0]}">${v[0]}</i> ${v[1]}</span>`).join('')}</div>
 <div class="tw"><table class="sheet"><thead><tr><th class="s1">Nhân viên</th>${ds.map(d=>`<th class="dc ${dow(d)===0?'sun':''}">${pd(d).getDate()}<br><span class="mu">${DAYS[dow(d)]}</span></th>`).join('')}<th class="r">Công</th><th class="r">Muộn</th><th class="r">Phép</th><th class="r" title="Chấm công 1-1: số ca 1-1 giáo viên dạy trong tháng (theo lịch)">Ca 1-1</th><th class="r" title="Số ca 1-1 bé có mặt">Có mặt</th><th class="r" title="Số ca 1-1 bé nghỉ có phép">Nghỉ P</th><th class="r" title="Số ca 1-1 bé nghỉ không phép">Nghỉ KP</th></tr></thead><tbody>
 ${st.map(s=>{const p=payroll(s,m),o=ccOneStat(s.id,m,R);return`<tr><td class="s1"><b>${esc(given(s.n))}</b></td>${ds.map(d=>{const k=dow(d)===0?'':tsSt(s.id,d),sy=k?CSYM[k][0]:'';return`<td class="dc ${dow(d)===0?'sun':''}">${sy?`<button class="sc sc-${sy==='·'?'q':sy}" data-a="tsedit" data-v="${s.id}|${d}" title="${CSYM[k][1]}" ${(canLeaveMark()&&tsLv(s.id,d))||(d<=TODAY&&isLead())?'':'disabled'}>${sy}</button>`:''}</td>`}).join('')}<td class="r"><b>${p.cong}</b></td><td class="r">${p.late}</td><td class="r">${p.leave}</td><td class="r"><b>${o.n||'–'}</b></td><td class="r">${o.n?o.cm:'–'}</td><td class="r">${o.n?o.p:'–'}</td><td class="r">${o.n?o.kp:'–'}</td></tr>`}).join('')}</tbody></table></div><p class="sm mu" style="margin-top:8px">${isLead()?'Bấm vào một ô để sửa giờ vào ra. ':'Chỉ xem, việc sửa công do Quản lý hoặc Trưởng Trung tâm thực hiện. '}Công chuẩn mỗi tháng là ${DB.cfg.cc} ngày.${skip.length?' Không cần chấm công (trả lương theo ca 1-1): '+skip.map(s=>esc(s.n)).join(', ')+'.':''}</p></div>`}
ACT.ccxl=()=>{const m=S.cc.m,ds=mDates(m).filter(isW),R1=ccOneRows(m);exportXLSX('bang-cong-nhan-vien-'+m+'.xlsx',[{n:'Bảng công',rows:[['Mã','Nhân viên','Chức vụ'].concat(ds.map(d=>pd(d).getDate()+'/'+(+m.slice(5,7))),['Công','Đi muộn','Nghỉ phép','Vắng','Ca 1-1','Ca 1-1 có mặt','Ca 1-1 nghỉ P','Ca 1-1 nghỉ KP'])].concat(ccStaff().map(s=>{const p=payroll(s,m),o=ccOneStat(s.id,m,R1);return[s.id,s.n,s.pos].concat(ds.map(d=>{const k=tsSt(s.id,d);return k?CSYM[k][0]:''}),[p.cong,p.late,p.leave,p.abs,o.n,o.cm,o.p,o.kp])}))}])};
ACT.tsedit=v=>{const [id,d]=v.split('|');if(!needCC(stBy(id)))return false;if(tsLv(id,d)&&canLeaveMark()){S.modal={t:'tsl',id,d};return}if(!isLead()||d>TODAY)return false;S.modal={t:'tse',id,d}};
MODALS.tse=()=>{const m=S.modal,t=DB.ts[m.id+'|'+m.d]||{i:'',o:''};
 return mdl('Chấm công '+sn(m.id),`<form id="tsef" class="f"><p class="mu sm">${DAYN[dow(m.d)]} ${vd(m.d)}</p><div class="f2"><div><label for="ts-i">Giờ vào</label><input id="ts-i" name="i" type="time" value="${t.i}"></div><div><label for="ts-o">Giờ ra</label><input id="ts-o" name="o" type="time" value="${t.o}"></div></div><div class="acts" style="justify-content:flex-end"><button class="btn no" type="button" data-a="tsclr">Xóa chấm công</button><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu</button></div></form>`)};
FORM.tsef=f=>{if(!isLead())return false;const m=S.modal,i=f.elements.i.value,o=f.elements.o.value;if(!i&&!o)delete DB.ts[m.id+'|'+m.d];else DB.ts[m.id+'|'+m.d]={i,o};S.modal=null;toast('Đã cập nhật chấm công')};
ACT.tsclr=()=>{if(!isLead())return false;delete DB.ts[S.modal.id+'|'+S.modal.d];S.modal=null;toast('Đã xóa chấm công')};
/* --- chấm công nghỉ cả ngày, nửa ngày --- */
/* bản ghi chấm công nghỉ: ngày đã qua ghi đủ giờ làm của nửa ngày còn lại, hôm nay ghi theo giờ hiện tại, ngày sắp tới chưa có giờ */
function tsRec(l,lk,d){const past=d<TODAY,fut=d>TODAY,now=hm(),r={i:'',o:'',l};if(lk)r.lk=1;
 if(l==='am'){if(past||(!fut&&now>=CC_PM_START))r.i=CC_PM_START;if(past||(!fut&&now>=ccOut()))r.o=ccOut()}
 else if(l==='pm'){if(past||(!fut&&now>=ccIn()))r.i=ccIn();if(past||(!fut&&now>=CC_AM_END))r.o=CC_AM_END}
 return r}
/* chấm nghỉ nhiều ngày, nhiều người, kể cả nhiều tháng và ngày sắp tới (chấm trước): chọn nhân sự, khoảng ngày, thứ trong tuần, cả ngày hoặc nửa ngày, có phép hoặc không lương */
const TSM_MAX=1100,TSM_WD=[1,2,3,4,5,6];
ACT.tsm=()=>{if(!canLeaveMark())return false;S.modal={t:'tsm',ids:[],from:TODAY,to:TODAY,l:'full',lk:'',wd:TSM_WD.slice(),err:''}};
CHG.tsmf=v=>{if(/^\d{4}-\d{2}-\d{2}$/.test(v||''))S.modal.from=v;S.modal.err=''};
CHG.tsmt=v=>{if(/^\d{4}-\d{2}-\d{2}$/.test(v||''))S.modal.to=v;S.modal.err=''};
CHG.tsml=v=>{S.modal.l=v;return false};
CHG.tsmk=v=>{S.modal.lk=v;return false};
CHG.tsms=(v,t)=>{const m=S.modal,a=new Set(m.ids);if(t.checked)a.add(v);else a.delete(v);m.ids=[...a];m.err=''};
CHG.tsmw=(v,t)=>{const m=S.modal,a=new Set(m.wd);if(t.checked)a.add(+v);else a.delete(+v);m.wd=[...a];m.err=''};
ACT.tsmall=v=>{S.modal.ids=+v?ccStaff().map(s=>s.id):[]};
function tsmDays(m){if(!m.from||!m.to||m.to<m.from)return null;const out=[];let n=0;
 for(let d=m.from;d<=m.to;d=addD(d,1)){if(++n>TSM_MAX)return false;if(isW(d)&&m.wd.includes(dow(d)))out.push(d)}return out}
MODALS.tsm=()=>{const m=S.modal;if(!canLeaveMark()){S.modal=null;return''}
 const st=ccStaff().slice().sort((a,b)=>a.n<b.n?-1:1),days=tsmDays(m);
 return mdl('Chấm công nghỉ nhiều ngày',`<form id="tsmf" class="f"><p class="sm mu" style="margin:0">Chấm công nghỉ trước cho nhân sự làm giờ cố định, các ngày bất kỳ trong tháng hoặc nhiều tháng (kể cả ngày sắp tới). Chủ nhật và ngày Trung tâm nghỉ được bỏ qua.</p>
 <div><span class="lbl">Nhân sự</span><div class="acts" style="margin:4px 0"><button type="button" class="btn s" data-a="tsmall" data-v="1">Chọn tất cả</button><button type="button" class="btn s" data-a="tsmall" data-v="0">Bỏ chọn</button><span class="sm mu">Đã chọn ${m.ids.length}</span></div>
 <div style="max-height:170px;overflow:auto;border:1px solid var(--bd);border-radius:10px;padding:6px 10px">${st.map(s=>`<label style="display:flex;gap:8px;align-items:center;margin:3px 0"><input type="checkbox" data-c="tsms" value="${s.id}" ${m.ids.includes(s.id)?'checked':''}> ${esc(s.n)} <span class="mu sm">${esc(s.pos||'')}</span></label>`).join('')||'<span class="mu">Chưa có nhân sự cần chấm công.</span>'}</div></div>
 <div class="f2"><div><label for="tm-f">Từ ngày</label><input id="tm-f" type="date" value="${esc(m.from)}" data-c="tsmf"></div><div><label for="tm-t">Đến ngày</label><input id="tm-t" type="date" value="${esc(m.to)}" data-c="tsmt"></div></div>
 <div><span class="lbl">Các thứ trong tuần</span><div style="display:flex;flex-wrap:wrap;gap:4px 14px">${TSM_WD.map(w=>`<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-c="tsmw" value="${w}" ${m.wd.includes(w)?'checked':''}> ${DAYS[w]}</label>`).join('')}</div></div>
 <div><span class="lbl">Thời gian nghỉ</span>${[['full','Nghỉ cả ngày'],['am','Nghỉ nửa ngày sáng (đi làm từ '+CC_PM_START+')'],['pm','Nghỉ nửa ngày chiều (làm đến '+CC_AM_END+')']].map(([v,t])=>`<label style="display:flex;gap:8px;align-items:center;margin:4px 0"><input type="radio" name="l" data-c="tsml" value="${v}" ${m.l===v?'checked':''}> ${t}</label>`).join('')}</div>
 <div><label for="tm-k">Loại nghỉ</label><select id="tm-k" data-c="tsmk">${opts([['','Nghỉ có phép (hưởng lương)'],['1','Nghỉ không lương']],m.lk)}</select></div>
 <p class="sm mu" style="margin:0">${days===false?'Khoảng ngày quá dài (tối đa '+TSM_MAX+' ngày mỗi lần).':days===null?'Chọn khoảng ngày hợp lệ.':'Khoảng đã chọn có <b>'+days.length+'</b> ngày làm việc, '+m.ids.length+' nhân sự.'} Ngày nhân sự đã chấm có mặt (có giờ vào ra), đã có đơn nghỉ được duyệt hoặc Trung tâm nghỉ sẽ được bỏ qua. Các buổi 1-1 rơi vào giờ nghỉ hiện ở mục Dạy thay để phân giáo viên dạy thay.</p>
 <div class="err" role="alert">${esc(m.err||'')}</div><div class="acts" style="justify-content:flex-end"><button class="btn no" type="button" data-a="tsmclr">Bỏ nghỉ các ngày này</button><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Chấm nghỉ</button></div></form>`)};
/* áp dụng cho từng người, từng ngày; clear = bỏ dấu nghỉ đã chấm trước đó */
function tsmRun(clear){const m=S.modal;if(!canLeaveMark())return false;
 if(!m.ids.length){m.err='Hãy chọn ít nhất một nhân sự.';return}
 if(!m.wd.length){m.err='Hãy chọn ít nhất một thứ trong tuần.';return}
 const days=tsmDays(m);if(days===false){m.err='Khoảng ngày quá dài, tối đa '+TSM_MAX+' ngày mỗi lần.';return}
 if(days===null){m.err='Ngày kết thúc phải sau hoặc cùng ngày bắt đầu.';return}
 if(!days.length){m.err='Khoảng ngày đã chọn không có ngày làm việc nào.';return}
 let ok=0,closed=0,lr=0,pres=0,none=0;
 m.ids.forEach(id=>{const s=stBy(id);if(!s||!needCC(s))return;days.forEach(d=>{
  if(isClosed(d)){closed++;return}
  const k=id+'|'+d,r=DB.ts[k];
  if(clear){if(r&&r.l){delete DB.ts[k];ok++}else none++;return}
  if(DB.lr.some(x=>x.st===id&&x.s==='duyet'&&x.f<=d&&d<=x.t)){lr++;return}
  if(r&&!r.l&&(r.i||r.o)){pres++;return}
  DB.ts[k]=tsRec(m.l,!!m.lk,d);ok++})});
 if(!ok){m.err=clear?'Không có ngày nào đã chấm nghỉ trong khoảng này.':'Không chấm được ngày nào'+(pres||lr||closed?': '+[pres?pres+' lượt đã chấm có mặt':'',lr?lr+' lượt đã có đơn nghỉ duyệt':'',closed?closed+' lượt Trung tâm nghỉ':''].filter(Boolean).join(', '):'')+'.';return}
 S.modal=null;toast((clear?'Đã bỏ nghỉ ':'Đã chấm nghỉ ')+ok+' lượt (nhân sự × ngày)'+(clear?'':(pres||lr||closed?'. Bỏ qua: '+[pres?pres+' đã chấm có mặt':'',lr?lr+' đã có đơn nghỉ duyệt':'',closed?closed+' Trung tâm nghỉ':''].filter(Boolean).join(', '):'')))}
FORM.tsmf=f=>tsmRun(false);
ACT.tsmclr=()=>tsmRun(true);
ACT.tsl=v=>{const [id,d]=v.split('|');if(!canLeaveMark()||!needCC(stBy(id)))return false;S.modal={t:'tsl',id,d}};
MODALS.tsl=()=>{const m=S.modal,s=stBy(m.id);if(!s||!canLeaveMark()){S.modal=null;return''}const cur=tsLv(m.id,m.d),l=cur?cur.l:'full';
 return mdl('Chấm công nghỉ · '+s.n,`<form id="tslf" class="f"><p class="mu sm" style="margin:0">${DAYN[dow(m.d)]} ${vd(m.d)}</p>
 <div><span class="lbl">Thời gian nghỉ</span>${[['full','Nghỉ cả ngày'],['am','Nghỉ nửa ngày sáng (đi làm từ '+CC_PM_START+')'],['pm','Nghỉ nửa ngày chiều (làm đến '+CC_AM_END+')']].map(([v,t])=>`<label style="display:flex;gap:8px;align-items:center;margin:4px 0"><input type="radio" name="l" value="${v}" ${l===v?'checked':''}> ${t}</label>`).join('')}</div>
 <div><label for="tl-k">Loại nghỉ</label><select id="tl-k" name="lk">${opts([['','Nghỉ có phép (hưởng lương)'],['1','Nghỉ không lương']],cur&&cur.lk?'1':'')}</select></div>
 <p class="sm mu" style="margin:0">Nghỉ có phép: cả ngày hưởng đủ công, nửa ngày vẫn hưởng đủ công của ngày đó. Nghỉ không lương: cả ngày không tính công, nửa ngày tính nửa công. Các buổi 1-1 rơi vào giờ nghỉ cần phân giáo viên dạy thay ở mục Dạy thay.</p>
 <div class="acts" style="justify-content:flex-end">${cur?'<button class="btn no" type="button" data-a="tslclr">Bỏ nghỉ</button>':''}<button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu</button></div></form>`)};
FORM.tslf=f=>{if(!canLeaveMark())return false;const m=S.modal,s=stBy(m.id);if(!s||!needCC(s))return false;
 const l=f.elements.l.value,r=tsRec(l,f.elements.lk.value==='1',m.d);
 DB.ts[m.id+'|'+m.d]=r;S.modal=null;toast('Đã chấm công '+LVT[l].toLowerCase()+' cho '+given(s.n))};
ACT.tslclr=()=>{if(!canLeaveMark())return false;delete DB.ts[S.modal.id+'|'+S.modal.d];S.modal=null;toast('Đã bỏ nghỉ, chấm công lại cho ngày này')};
/* --- đơn nghỉ phép --- */
function ccLeave(){const rows=DB.lr.filter(l=>seesAll()||l.st===U.id).sort((a,b)=>a.s===b.s?(a.f<b.f?1:-1):a.s==='cho'?-1:1);
 return`<div class="card">`+tbl(['Nhân viên','Loại','Thời gian','Số ngày','Lý do','Trạng thái',''],rows.map(l=>`<tr><td><b>${esc(sn(l.st))}</b></td><td>${LRT[l.type]}</td><td class="nw">${vdm(l.f)}${l.t!==l.f?' đến '+vdm(l.t):''}</td><td>${lrDays(l)}</td><td>${esc(l.why)}</td><td>${tg(LRS[l.s][0],LRS[l.s][1])}</td><td class="nw">${l.s==='cho'&&isLead()?`<button class="btn s p" data-a="lrok" data-v="${l.id}">Duyệt</button> <button class="btn s no" data-a="lrno" data-v="${l.id}">Từ chối</button>`:l.s==='cho'&&l.st===U.id?`<button class="btn s no" data-a="lrdel" data-v="${l.id}">Hủy đơn</button>`:''}</td></tr>`).join(''),'Chưa có đơn nghỉ nào.')+`<p class="note sm" style="margin-top:10px">Khi duyệt đơn nghỉ của giáo viên, các buổi 1-1 rơi vào thời gian nghỉ tự động được ghi "Trung tâm/GV nghỉ" và tạo yêu cầu học bù cho từng bé.${feeTx(' Nếu gia đình không nhận học bù, trung tâm hoàn phí buổi đó theo quy định.')}</p></div>`}
function applyLeave(l){let n=0;
 for(let d=l.f;d<=l.t;d=addD(d,1)){if(!isSch(d))continue;   /* cả Chủ nhật có ca của giáo viên nghỉ */
  DB.lich.forEach(x=>{if(x.gv===l.st&&((x.type==='11'&&x.day===dow(d))||(x.type==='bu'&&x.date===d))){const key=d+'|'+x.id+'|'+x.hs;
   if(!DB.att[key]){DB.att[key]='tt';n++;if(x.type==='11'&&!DB.mk.some(r=>r.hs===x.hs&&r.from.d===d&&r.from.sid===x.id))DB.mk.push({id:'mk'+uid(),hs:x.hs,from:{d,sid:x.id,kind:'11',slot:x.slot},by:'gv',why:'Giáo viên nghỉ phép',s:'dk',props:[],pick:null,log:[{at:TODAY,by:'tt',tx:'Tạo tự động khi duyệt đơn nghỉ của giáo viên'}]})}}})}
 return n}
ACT.lrok=v=>{if(!isLead())return false;const l=DB.lr.find(x=>x.id===v);if(!l)return;l.s='duyet';const n=applyLeave(l);toast(n?'Đã duyệt. '+n+' buổi học được ghi nhận Trung tâm/GV nghỉ':'Đã duyệt đơn nghỉ')};
ACT.lrno=v=>{if(!isLead())return false;const l=DB.lr.find(x=>x.id===v);if(l){l.s='tuchoi';toast('Đã từ chối đơn')}};
ACT.lrdel=v=>{DB.lr=DB.lr.filter(x=>x.id!==v);toast('Đã hủy đơn')};
ACT.lrnew=()=>{S.modal={t:'lr'}};
MODALS.lr=()=>mdl('Tạo đơn nghỉ',`<form id="lrf" class="f">${isLead()?`<div><label for="lr-s">Nhân viên</label><select id="lr-s" name="st">${opts(DB.staff.filter(s=>s.st==='dang').map(s=>[s.id,s.n]),U.id)}</select></div>`:''}<div class="f2"><div><label for="lr-t">Loại nghỉ</label><select id="lr-t" name="type">${opts(Object.entries(LRT),'phep')}</select></div><div><label for="lr-f">Từ ngày</label><input id="lr-f" name="f" type="date" value="${addD(TODAY,1)}" required></div><div><label for="lr-e">Đến ngày</label><input id="lr-e" name="t" type="date" value="${addD(TODAY,1)}" required></div></div><div><label for="lr-w">Lý do</label><input id="lr-w" name="why" required></div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Gửi đơn</button></div></form>`);
FORM.lrf=f=>{const e=f.elements,fr=e.f.value,to=e.t.value;if(to<fr){toast('Ngày kết thúc phải sau ngày bắt đầu');return false}
 DB.lr.push({id:'lr'+uid(),st:e.st?e.st.value:U.id,type:e.type.value,f:fr,t:to,why:e.why.value.trim(),s:'cho'});S.modal=null;toast('Đã gửi đơn nghỉ, chờ duyệt')};

/* ===== Chấm công 1-1: công của từng giáo viên trên các học sinh mình dạy kèm 1-1 trong tháng =====
   Mỗi ca 1-1 hằng tuần (và buổi học bù) của bé đang học là một dòng; giáo viên dạy ngày đó là effGv (có tính dạy thay). Trạng thái theo điểm danh của bé: có mặt, nghỉ P, KP, TT/GV nghỉ, nhập viện,
   chưa điểm danh (ngày đã qua), sắp tới. Áp dụng cho cả giáo viên Fulltime lẫn Partime. Công 1-1 quy đổi dùng cùng tỷ lệ với bảng lương (gvPct). */
function ccOneRows(m){const out=[];
 for(const d of mDates(m)){if(isClosed(d)||!isSch(d))continue;const w=dow(d);
  DB.lich.forEach(l=>{if(!((l.type==='11'&&l.day===w)||(l.type==='bu'&&l.date===d)))return;const k=kidBy(l.hs);if(!k||k.st!=='dang')return;
   const sb=subOf(d,l.id),code=DB.att[attKey(d,l.id,l.hs)]||'';
   out.push({l,k,d,g:effGv(l,d),og:l.gv,sb,code,kind:l.type,slot:effSlot(l,d),st:code||(d<=TODAY?'chua':'sap')})})}
 return out}
function ccOneStat(gv,m,rows){rows=rows||ccOneRows(m);const pc=gvPct(),mine=rows.filter(r=>r.g===gv),given=rows.filter(r=>r.og===gv&&r.g!==gv),by={};
 const o={gv,rows:mine,n:mine.length,cm:0,bu:0,p:0,kp:0,tt:0,bv:0,chua:0,sap:0,subIn:0,given:given.length,givenRows:given,cong:0,kids:[]};
 mine.forEach(r=>{const c=r.st;if(c==='cm'){o.cm++;if(r.kind==='bu')o.bu++}else if(o[c]!=null)o[c]++;if(r.og!==gv)o.subIn++;o.cong+=r.code&&pc[r.code]!=null?pc[r.code]/100:0;
  const b=by[r.k.id]=by[r.k.id]||{k:r.k,n:0,cm:0,p:0,kp:0,tt:0,bv:0,chua:0,sap:0,cong:0,days:[]};b.n++;if(b[c]!=null)b[c]++;b.cong+=r.code&&pc[r.code]!=null?pc[r.code]/100:0;b.days.push(r)});
 o.kids=Object.values(by).sort((a,b)=>a.k.n<b.k.n?-1:1);return o}
const CC11={cm:['Có mặt','ok'],p:['Nghỉ P','wa'],kp:['Nghỉ KP','er'],tt:['TT/GV nghỉ','in'],bv:['Nhập viện','in'],chua:['Chưa điểm danh','er'],sap:['Sắp tới','gy']};
const cc11List=(m,rows)=>{const ids=[...new Set(rows.map(r=>r.g).concat(rows.map(r=>r.og)))].filter(id=>id&&stBy(id)&&stBy(id).st==='dang');
 return ids.filter(id=>!isGV()||id===U.id).map(id=>ccOneStat(id,m,rows)).filter(o=>o.n||o.given).sort((a,b)=>sn(a.gv)<sn(b.gv)?-1:1)};
function cc11(){const m=S.cc.m,R=ccOneRows(m),L=cc11List(m,R),sum=f=>L.reduce((a,x)=>a+f(x),0);
 const ctl=`<div class="card"><div class="top"><h2>Chấm công 1-1 ${mLabel(m)}</h2><div class="acts"><button class="btn s" data-a="ccm" data-v="-1">Tháng trước</button><button class="btn s" data-a="ccm" data-v="1" ${m>=sm(CM,3)?'disabled':''}>Tháng sau</button>${isGV()?'':'<button class="btn s" data-a="cc11xl">Xuất Excel</button>'}</div></div>
 <p class="sm mu" style="margin:8px 0 0">Mỗi ca can thiệp 1-1 của bé (và buổi học bù) là một ca; công của giáo viên tính trên từng học sinh mình dạy, theo điểm danh của bé. Áp dụng cho cả giáo viên Fulltime và Partime. Ca được người khác dạy thay không tính cho giáo viên gốc, tính cho người dạy thay (cột Dạy thay). Công 1-1 quy đổi theo tỷ lệ bảng lương (có mặt 100%, nghỉ không phép ${gvPct().kp}%, nghỉ có phép ${gvPct().p}%, Trung tâm hoặc giáo viên nghỉ ${gvPct().tt}%, nhập viện ${gvPct().bv}%).</p></div>`;
 if(!L.length)return ctl+'<div class="card"><p class="empty">Chưa có ca 1-1 nào trong '+mLow(m)+'.</p></div>';
 const sumT=`<div class="grid">${kpi('Giáo viên có ca 1-1',L.length,mLabel(m))}${kpi('Tổng số ca 1-1',sum(x=>x.n),sum(x=>x.cm)+' ca có mặt')}${kpi('Bé nghỉ',sum(x=>x.p+x.kp+x.tt+x.bv),sum(x=>x.p)+' có phép · '+sum(x=>x.kp)+' không phép')}${kpi('Chưa điểm danh',sum(x=>x.chua),'ca đã qua chưa ghi',sum(x=>x.chua)?'er':'ok')}</div>`;
 const tb=`<div class="card"><h2>Tổng hợp theo giáo viên</h2>`+tbl(['Giáo viên','Loại','>Tổng ca','>Có mặt','>Học bù','>Nghỉ P','>Nghỉ KP','>TT/GV nghỉ','>Nhập viện','>Chưa ghi','>Sắp tới','>Dạy thay','>Được thay','>Công 1-1','>Số bé'],L.map(x=>{const s=stBy(x.gv);return`<tr><td><b>${esc(sn(x.gv))}</b></td><td>${s?tg(isFT(s)?'Fulltime':'Partime',isFT(s)?'in':'gy'):''}</td><td class="r"><b>${x.n}</b></td><td class="r">${x.cm}</td><td class="r">${x.bu}</td><td class="r">${x.p}</td><td class="r">${x.kp}</td><td class="r">${x.tt}</td><td class="r">${x.bv}</td><td class="r ${x.chua?'er':''}">${x.chua}</td><td class="r">${x.sap}</td><td class="r">${x.subIn}</td><td class="r">${x.given}</td><td class="r"><b>${cgf(x.cong)}</b></td><td class="r">${x.kids.length}</td></tr>`}).join(''))+`</div>`;
 const det=L.filter(x=>x.n).map(x=>`<div class="card"><div class="top"><div><h2>${esc(sn(x.gv))}</h2><p class="mu sm">${x.n} ca 1-1 · ${x.kids.length} bé · ${x.cm} có mặt · công 1-1 quy đổi <b>${cgf(x.cong)}</b>${x.given?' · '+x.given+' ca được người khác dạy thay (không tính)':''}</p></div></div>`
  +tbl(['Bé','>Số ca','>Có mặt','>Nghỉ P','>Nghỉ KP','>TT/GV','>Viện','>Công','Các ngày'],x.kids.map(o=>`<tr><td><b>${esc(o.k.n)}</b><br><span class="sm mu">${esc(kcode(o.k))}</span></td><td class="r">${o.n}</td><td class="r">${o.cm}</td><td class="r">${o.p}</td><td class="r">${o.kp}</td><td class="r">${o.tt}</td><td class="r">${o.bv}</td><td class="r"><b>${cgf(o.cong)}</b></td><td>${o.days.map(r=>`<span title="${esc(CC11[r.st][0])}${r.og!==x.gv?' · dạy thay '+esc(sn(r.og)):''}">${tg(vdm(r.d)+' '+slotLb(r.slot)+(r.kind==='bu'?' (bù)':'')+(r.og!==x.gv?' (thay)':''),CC11[r.st][1])}</span>`).join(' ')}</td></tr>`).join(''))+`</div>`).join('');
 return ctl+sumT+tb+det}
ACT.cc11xl=()=>{if(!seesAll())return false;const m=S.cc.m,R=ccOneRows(m),L=cc11List(m,R);
 exportXLSX('cham-cong-1-1-'+m+'.xlsx',[{n:'Tổng hợp',rows:[['Giáo viên','Loại','Tổng ca','Có mặt','Học bù','Nghỉ P','Nghỉ KP','TT/GV nghỉ','Nhập viện','Chưa ghi','Sắp tới','Dạy thay','Được thay','Công 1-1 quy đổi','Số bé']].concat(L.map(x=>{const s=stBy(x.gv);return[sn(x.gv),s?(isFT(s)?'Fulltime':'Partime'):'',x.n,x.cm,x.bu,x.p,x.kp,x.tt,x.bv,x.chua,x.sap,x.subIn,x.given,Math.round(x.cong*100)/100,x.kids.length]}))},
  {n:'Chi tiết',rows:[['Giáo viên','Ngày','Giờ','Loại','Mã bé','Họ tên bé','Trạng thái','Giáo viên gốc (nếu dạy thay)']].concat(L.reduce((a,x)=>a.concat(x.rows.map(r=>[sn(x.gv),vd(r.d),r.slot,r.kind==='bu'?'Học bù':'1-1',kcode(r.k),r.k.n,CC11[r.st][0],r.og!==x.gv?sn(r.og):''])),[]))}])};
