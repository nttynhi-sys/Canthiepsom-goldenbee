/* ===== 7. Điểm danh: theo ngày ===== */
const STB={'11':['cm','p','kp','tt'],bt:['cm','p','kp','bv','tt'],bu:['cm','p','kp'],inc:['cm','p','kp','bv','tt']};
/* Trưởng Trung tâm, Quản lý và Giáo viên sửa được điểm danh mọi ngày đã qua, mọi tháng (giáo viên chỉ với trẻ của mình: canKid, rowHas); ngày chưa đến thì chưa điểm danh được */
const canEditAtt=d=>isLead()||isGV();   /* mọi ngày (cả ngày đã qua, hôm nay và ngày sắp tới), mọi tháng; giáo viên chỉ với trẻ của mình (canKid, rowHas) */
const attKey=(d,s,h)=>d+'|'+s+'|'+h;
const mkFor=(h,d,sid)=>DB.mk.find(r=>r.hs===h&&r.from.d===d&&r.from.sid===sid);
VIEWS.dd=()=>{const t=S.dd=Object.assign({tab:seesAll()?'sheet':'roll',date:WD,m:WD.slice(0,7),q:'',pr:'',fl:'',gv:'',kid:'',un:false},S.dd);
 if(t.tab==='rule'&&!canMoney())t.tab='sheet';
 return head(isVP()?'Ngày học và phép':'Điểm danh',canMoney()?'Điểm danh từng ngày và bảng chấm công học sinh để tính học phí, hoàn phí':'Điểm danh từng ngày và bảng chấm công học sinh: số ngày học, nghỉ có phép và không phép')+tabsH([['roll','Điểm danh theo ngày'],['sheet',isGV()?'Bảng chấm công của lớp':'Bảng chấm công học sinh']].concat(canMoney()?[['rule','Quy định học phí và hoàn phí']]:[]),t.tab,'ddtab')+(t.tab==='roll'?ddRoll():t.tab==='sheet'?ddSheet():ddRule())};
ACT.ddtab=v=>{S.dd.tab=v};
ACT.ddkid=v=>{go('dd',{dd:Object.assign(S.dd||{},{tab:'sheet',kid:v,fl:'',pr:'',q:''})})};
CHG.dddate=v=>{if(v)S.dd.date=v};
ACT.ddday=v=>{let d=addD(S.dd.date,+v);if(!isSch(d))d=addD(d,+v);S.dd.date=d};   /* bỏ qua Chủ nhật không có ca nào */
CHG.ddgv=v=>{S.dd.gv=v};
CHG.ddun=(v,t)=>{S.dd.un=t.checked};
const stb=(d,s,k,can)=>{const cur=DB.att[attKey(d,s.sid,k.id)]||'';
 return`<div class="stb" role="group" aria-label="Trạng thái của ${esc(k.n)}">${STB[s.inc?'inc':s.kind].map(c=>`<button class="st st-${c} ${cur===c?'on':''}" data-a="att" data-v="${d}|${s.sid}|${k.id}|${c}" aria-pressed="${cur===c}" ${can?'':'disabled'}>${AC[c]}</button>`).join('')}</div>`};
/* bé học đột xuất ngoài lịch bán trú (xem bxCharge ở p04-domain.js): ghi chú học phí và nút hủy */
function bxNote(d,k,x,can){const cur=DB.att[attKey(d,x.gr||k.gr,k.id)]||'',nm=mLow(sm(d.slice(0,7),1));
 const fee=!canMoney()?'<span class="sm mu">Học đột xuất: học phí tính vào tháng sau</span>':BX_FREE.includes(cur)?'<span class="sm mu">Bé nghỉ: không tính học phí ngày học đột xuất</span>':'<span class="sm">Học phí học đột xuất <b>'+fnum(bxAmt(k,x))+' ₫</b>, cộng vào học phí '+nm+'</span>';
 return fee+(can?' <button class="btn s no" data-a="bxdel" data-v="'+esc(x.id)+'">Hủy học đột xuất</button>':'')}
const feeNote=(d,s,k)=>{if(s.xk&&s.xk[k.id])return bxNote(d,k,s.xk[k.id],canEditAtt(d)&&canKid(k.id));const cur=DB.att[attKey(d,s.sid,k.id)];if(!cur||cur==='cm')return'';
 if(s.kind==='bu')return noFee()?'':'<span class="sm mu">Buổi học bù, không tính thêm phí</span>';
 if(s.inc)return canMoney()?'<span class="sm mu">Ca 1-1 nằm trong phí bán trú, tính theo ngày bán trú</span>':'';
 if(!canMoney())return'';
 const o=feeOf(k,s.kind,d,s.sid,cur,d.slice(0,7));
 return`<span class="sm">${esc(o.note)}${o.ls||o.rf?'. Mất <b>'+fnum(o.ls)+' ₫</b>, hoàn <b>'+fnum(o.rf)+' ₫</b>':''}</span>`};
const mkBtn=(d,s,k)=>{const cur=DB.att[attKey(d,s.sid,k.id)];if(s.kind!=='11'||s.inc||!['p','kp','tt'].includes(cur)||!canEditAtt(d))return'';
 const r=mkFor(k.id,d,s.sid),fill=!DB.lich.some(l=>l.type==='bu'&&l.date===d&&l.slot===(DB.lich.find(x=>x.id===s.sid)||{}).slot&&l.gv===(DB.lich.find(x=>x.id===s.sid)||{}).gv)?`<button class="btn s" data-a="mkfill" data-v="${d}|${s.sid}|${k.id}" title="Xếp bé khác học bù vào đúng ngày và khung giờ bé này vắng">Xếp bé khác vào giờ này</button>`:'<span class="sm mu">Đã có bé học bù vào giờ này</span>';
 return(r?`<button class="btn s" data-a="nav" data-v="hb">Học bù: ${esc(MKS[r.s]?MKS[r.s][0]:'')}</button>`:`<button class="btn s" data-a="mkfrom" data-v="${d}|${s.sid}|${k.id}">Tạo yêu cầu học bù</button>`)+' '+fill};
ACT.att=v=>{const [d,sid,h,c]=v.split('|');if(!canKidOn(h,d,sid)||!canEditAtt(d)){toast('Bạn chưa thể sửa điểm danh này');return false}
 const key=attKey(d,sid,h),old=DB.att[key];if(old===c)delete DB.att[key];else DB.att[key]=c;
 /* ngày bán trú: ca 1-1 trong gói đi theo tình trạng nghỉ của ngày (ghi nghỉ thì ca 1-1 cũng nghỉ; bỏ hoặc đổi sang có mặt thì bỏ theo) */
 const k=kidBy(h);if(k&&grBy(sid)){const li=incSession(k,d);if(li){const lk=attKey(d,li,h),cur=DB.att[lk],now=DB.att[key];
  if(now&&now!=='cm'){if(!cur||cur===old)DB.att[lk]=now}else if(cur&&old&&old!=='cm'&&cur===old)delete DB.att[lk]}}};
ACT.attall=v=>{const [d,sid]=v.split('|'),s=dayList(d).find(x=>x.sid===sid);if(!s||!canEditAtt(d)){toast('Bạn chưa thể sửa điểm danh này');return false}
 let n=0;s.kids.forEach(k=>{const key=attKey(d,sid,k.id);if(!DB.att[key]){DB.att[key]='cm';n++}});toast(n?'Đã ghi có mặt cho '+n+' trẻ':'Mọi trẻ đã được điểm danh')};
function ddRoll(){const t=S.dd,d=t.date,can=canEditAtt(d);
 let ds=dayList(d).filter(s=>seesAll()?(!t.gv||rowHas(s,t.gv)):rowHas(s,U.id));
 const pend=s=>s.kids.some(k=>!DB.att[attKey(d,s.sid,k.id)]);if(t.un)ds=ds.filter(pend);
 const one=ds.filter(s=>s.kind!=='bt'),grp=ds.filter(s=>s.kind==='bt');let tot=0,rec=0,cm=0;
 ds.forEach(s=>s.kids.forEach(k=>{tot++;const c=DB.att[attKey(d,s.sid,k.id)];if(c){rec++;if(c==='cm')cm++}}));
 const ctl=`<div class="card"><div class="f2"><div><label for="dd-d">Ngày</label><input id="dd-d" type="date" data-c="dddate" value="${d}"></div>${seesAll()?`<div><label for="dd-g">Giáo viên</label><select id="dd-g" data-c="ddgv"><option value="">Tất cả</option>${opts(DB.staff.filter(isTeacher).map(s=>[s.id,tName(s)]),t.gv)}</select></div>`:''}<div style="display:flex;align-items:end"><label class="chk" style="margin:0 0 8px"><input type="checkbox" data-c="ddun" ${t.un?'checked':''}> Chỉ hiện lượt chưa điểm danh</label></div></div>
 <div class="acts" style="margin-top:10px"><button class="btn s" data-a="ddday" data-v="-1">Ngày trước</button><button class="btn s" data-a="ddday" data-v="1">Ngày sau</button>${can&&dow(d)!==0&&!isClosed(d)?`<button class="btn s p" data-a="bxopen" title="Bé bán trú xin học thêm một ngày ngoài lịch, ví dụ thứ Bảy">Thêm bé học đột xuất</button>`:''}<b>${DAYN[dow(d)]}, ${vd(d)}</b>${d===WD&&WD!==TODAY?'<span class="mu sm">(ngày làm việc gần nhất)</span>':''}</div>
 ${!can?`<p class="note sm" style="margin-top:10px">${isVP()?'Văn phòng chỉ xem điểm danh. Việc ghi và sửa do giáo viên, Quản lý hoặc Trưởng Trung tâm thực hiện.':'Bạn không có quyền sửa điểm danh này.'}</p>`:''}</div>`;
 const kp=`<div class="grid">${kpi('Lượt học',tot,'trong ngày')}${kpi('Đã điểm danh',rec+'/'+tot,tot?Math.round(rec*100/tot)+'%':'',rec<tot?'er':'ok')}${kpi('Có mặt',cm,rec?Math.round(cm*100/rec)+'% số đã ghi':'')}${kpi('Nghỉ',rec-cm,'P, KP, TT/GV nghỉ, nhập viện')}</div>`;
 if(!ds.length)return ctl+`<div class="card"><p class="empty">${dow(d)===0?'Chủ nhật không có buổi 1-1 hay học bù nào (bán trú nghỉ).':isClosed(d)?'Trung tâm nghỉ ngày này: '+esc(holOf(d).n)+'. Ngày nghỉ không tính học phí và không cần điểm danh.':'Không có buổi học nào phù hợp trong ngày này.'}</p></div>`;
 const hint=`<p class="note sm" style="margin-bottom:12px"><b>Cách ghi P và KP:</b> Nghỉ P khi phụ huynh báo trong nhóm chung trước 7g sáng cùng ngày với ca sáng, trước 12g với ca chiều và tối (bán trú: báo trước 1 ngày hoặc trước 7g sáng). Báo sau mốc này hoặc không báo thì ghi KP. Bấm lại vào trạng thái đang chọn để xóa.</p>`;
 const t1=one.length?`<div class="card"><h2>Can thiệp 1-1 và học bù</h2>`+tbl(['Ca','Bé','Giáo viên','Trạng thái','Ghi chú'],one.map(s=>{const k=s.kids[0];return`<tr><td class="nw">${slotLb(s.slot)}${s.kind==='bu'?'<br>'+tg('Học bù','y'):''}${s.inc?'<br>'+tg('1-1 của bán trú','in'):''}</td><td><b>${esc(k.n)}</b></td><td>${esc(given(sn(s.gv)))}${s.sub?'<br>'+tg('Dạy thay','y')+(s.sub.slot?' '+tg('Đổi giờ','wa'):''):''}</td><td>${stb(d,s,k,can)}</td><td>${feeNote(d,s,k)} ${mkBtn(d,s,k)}</td></tr>`}).join(''))+`</div>`:'';
 const t2=grp.map(s=>`<div class="card"><div class="top"><div><h2>${esc(s.label)}</h2><p class="mu sm">Giáo viên ${esc(s.ts.map(sn).join(', ')||'Chưa phân công')} · ${s.kids.length} trẻ${s.xk&&Object.keys(s.xk).length?' (có '+Object.keys(s.xk).length+' bé học đột xuất)':''}</p></div><button class="btn s" data-a="attall" data-v="${d}|${s.sid}" ${can?'':'disabled'}>Ghi mọi trẻ có mặt</button></div>`+tbl(['Bé','Trạng thái','Ghi chú'],s.kids.map(k=>`<tr><td><b>${esc(k.n)}</b>${s.xk&&s.xk[k.id]?'<br>'+tg('Học đột xuất','y'):''}</td><td>${stb(d,s,k,can)}</td><td>${feeNote(d,s,k)}</td></tr>`).join(''))+`</div>`).join('');
 return ctl+kp+hint+t1+t2}
/* --- sửa nhanh một ô trong bảng chấm công --- */
ACT.scopen=v=>{const [h,d]=v.split('|');S.modal={t:'sc',id:h,d}};
MODALS.sc=()=>{const m=S.modal,k=kidBy(m.id),xs=sched(k,m.d.slice(0,7)).filter(x=>x.d===m.d),can=canEditAtt(m.d);
 return mdl(k.n+' · '+DAYN[dow(m.d)]+' '+vd(m.d),(can?'':'<p class="note sm" style="margin-bottom:10px">Bạn chưa sửa được ngày này.</p>')+(xs.map(x=>{const s={sid:x.sid,kind:x.kind,inc:x.inc,xk:x.xtra?{[k.id]:bxOn(k,m.d)}:null};return`<div class="card"><b>${x.kind==='bt'?(x.xtra?'Học đột xuất · ':'Bán trú · ')+esc((grBy(x.sid)||{}).n||''):x.kind==='bu'?'Học bù · '+slotLb(x.slot):(x.inc?'Ca 1-1 của bán trú · ':'Can thiệp 1-1 · ')+slotLb(x.slot)}</b><div style="margin:8px 0">${stb(m.d,s,k,can)}</div>${feeNote(m.d,s,k)} ${mkBtn(m.d,s,k)}</div>`}).join('')||'<p class="empty">Bé không có lịch học ngày này.</p>'))};

/* --- thêm bé bán trú học đột xuất vào ngày đang xem (ví dụ thứ Bảy) --- */
ACT.bxopen=()=>{const d=S.dd.date;if(!canEditAtt(d)||dow(d)===0||isClosed(d)){toast('Không thêm được học đột xuất vào ngày này');return false}S.modal={t:'bxa',d}};
const bxPool=d=>myKids().filter(k=>k.st==='dang'&&k.gr&&!btHas(k,dow(d))&&!bxOn(k,d)).sort((a,b)=>a.n<b.n?-1:1);
MODALS.bxa=()=>{const d=S.modal.d,ks=bxPool(d),nm=mLow(sm(d.slice(0,7),1));
 return mdl('Thêm bé học đột xuất · '+DAYN[dow(d)]+' '+vd(d),ks.length?`<form id="bxf" class="f"><p class="mu sm" style="margin-bottom:8px">Dành cho bé bán trú xin học thêm một ngày ngoài lịch của bé. Sau khi thêm, bé xuất hiện ở bảng điểm danh ngày này để ghi có mặt hoặc nghỉ. ${canMoney()?'Học phí ngày học đột xuất được cộng vào học phí '+nm+' (bé nghỉ có phép, Trung tâm nghỉ hoặc nhập viện thì không tính).':'Học phí ngày học đột xuất do Văn phòng tính vào tháng sau.'}</p>
 <div><label for="bx-k">Bé</label><select id="bx-k" name="k">${ks.map(k=>`<option value="${esc(k.id)}">${esc(k.n)} · ${esc(kcode(k))}</option>`).join('')}</select></div>
 ${canMoney()?`<div><label for="bx-a">Học phí ngày này (₫), để trống = giá bán trú một ngày của bé</label><input id="bx-a" name="a" type="number" min="0" step="1000" inputmode="numeric" placeholder="${fnum(kidBt(kidBy(ks[0].id)))}"></div>`:''}
 <div><label for="bx-n">Ghi chú (tùy chọn)</label><input id="bx-n" name="n" maxlength="120" placeholder="Ví dụ: phụ huynh xin học thêm thứ Bảy"></div>
 <div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Thêm vào điểm danh</button></div></form>`:'<p class="empty">Không còn bé bán trú nào để thêm vào ngày này (bé đã có lịch học ngày này hoặc không thuộc nhóm của bạn).</p>')};
FORM.bxf=f=>{const d=S.modal&&S.modal.d,e=f.elements,k=kidBy(e.k.value);
 if(!d||!k||!canEditAtt(d)||!canKid(k.id)||dow(d)===0||isClosed(d)||!k.gr||k.st!=='dang'||btHas(k,dow(d))||bxOn(k,d)){toast('Không thêm được bé này vào ngày học đột xuất');return false}
 const raw=e.a&&String(e.a.value).trim()!==''?+e.a.value:null;if(raw!==null&&!(isFinite(raw)&&raw>=0)){toast('Học phí không hợp lệ');return false}
 const r={id:'bx'+uid(),hs:k.id,d,gr:k.gr,n:e.n.value.trim().slice(0,120),by:U.id,at:TODAY};if(raw!==null)r.a=Math.round(raw);
 (DB.bx=DB.bx||[]).push(r);S.modal=null;toast('Đã thêm '+given(k.n)+' học đột xuất '+vd(d)+(canMoney()?'. Học phí '+fmt(bxAmt(k,r))+' cộng vào học phí '+mLow(sm(d.slice(0,7),1)):''))};
ACT.bxdel=v=>{const x=(DB.bx||[]).find(y=>y.id===v),k=x&&kidBy(x.hs);if(!x||!k||!canKid(k.id)||!canEditAtt(x.d))return false;
 ask('Hủy ngày học đột xuất '+vd(x.d)+' của '+k.n+'? Điểm danh ngày này của bé cũng được xóa và không tính học phí.',()=>{DB.bx=DB.bx.filter(y=>y.id!==v);delete DB.att[attKey(x.d,x.gr||k.gr,k.id)];toast('Đã hủy ngày học đột xuất')},'Hủy học đột xuất')};
