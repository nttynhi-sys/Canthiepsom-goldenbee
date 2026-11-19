/* ===== 8. Học bù ===== */
const MKS={dk:['Chờ đề xuất giờ','wa'],tt:['Chờ phụ huynh chọn','in'],xn:['Đã xác nhận lịch','ok'],xong:['Đã học bù','ok'],huy:['Không học bù','gy']};
const MKW=['dk','tt','xn','xong'];
const who={ph:'Phụ huynh',gv:'Giáo viên',tt:'Trung tâm'};
function syncMk(){DB.mk.forEach(r=>{if(r.s==='xn'){const l=DB.lich.find(x=>x.mk===r.id);if(l&&DB.att[l.date+'|'+l.id+'|'+r.hs]==='cm')r.s='xong'}})}
const mkSteps=r=>`<div class="steps">${[['dk','1. Đăng ký'],['tt','2. Đề xuất giờ'],['xn','3. Xác nhận'],['xong','Đã học']].map(([k,l],i)=>{const cur=MKW.indexOf(r.s);return`<span class="stp ${r.s==='huy'?'':i<cur?'ok':i===cur?'on':''}">${l}</span>`}).join('')}</div>`;
const mkOrigin=r=>{const l=DB.lich.find(x=>x.id===r.from.sid),c=DB.att[r.from.d+'|'+r.from.sid+'|'+r.hs];return DAYS[dow(r.from.d)]+' '+vdm(r.from.d)+' · '+slotLb(r.from.slot)+(c?' · '+AC[c]:'')};
VIEWS.hb=()=>{syncMk();const h=S.hb=Object.assign({f:''},S.hb),all=DB.mk.filter(r=>canKid(r.hs)).sort((a,b)=>a.from.d<b.from.d?1:-1),list=all.filter(r=>!h.f||r.s===h.f),p=pg('hb',list,12);
 const cnt=k=>all.filter(r=>r.s===k).length;
 return head('Học bù',isPH()?'Đăng ký và chọn giờ học bù cho bé':'Quy trình học bù 3 bước: đăng ký, đề xuất giờ, xác nhận','<button class="btn p" data-a="mknew">Đăng ký học bù</button>')
 +`<div class="grid">${kpi('Chờ đề xuất giờ',cnt('dk'),'cần giáo viên hoặc Trung tâm xếp',cnt('dk')&&!isPH()?'er':'')}${kpi('Chờ phụ huynh chọn',cnt('tt'),'đã có giờ đề xuất')}${kpi('Đã xác nhận',cnt('xn'),'sắp học bù')}${kpi('Đã học bù',cnt('xong'),'hoàn tất','ok')}</div>`
 +`<div class="card"><div class="f2" style="margin-bottom:12px"><div><label for="hbf">Trạng thái</label><select id="hbf" data-c="hbf"><option value="">Tất cả</option>${opts(Object.entries(MKS).map(([k,v])=>[k,v[0]]),h.f)}</select></div></div>`
 +tbl(['Bé','Buổi nghỉ gốc','Người đăng ký','Lý do','Tiến độ',''],p.rows.map(r=>{const l=DB.lich.find(x=>x.mk===r.id);return`<tr class="k" data-a="mkopen" data-v="${r.id}"><td><b>${esc(kn(r.hs))}</b></td><td class="nw">${mkOrigin(r)}</td><td>${who[r.by]}</td><td>${esc(r.why)}</td><td>${r.s==='huy'?tg(MKS.huy[0],'gy'):mkSteps(r)}${l&&(r.s==='xn'||r.s==='xong')?`<div class="sm mu" style="margin-top:4px">Học bù ${vdm(l.date)} · ${slotLb(l.slot)}</div>`:''}</td><td class="nw">${r.s==='dk'&&!isPH()?`<button class="btn s p" data-a="mkprop" data-v="${r.id}">Đề xuất giờ</button>`:r.s==='tt'?`<button class="btn s" data-a="mkopen" data-v="${r.id}">${isPH()?'Chọn giờ':'Xem'}</button>`:''}</td></tr>`}).join(''),'Chưa có yêu cầu học bù nào.')+p.html
 +`<p class="note sm" style="margin-top:10px">Trung tâm chỉ giải quyết học bù khi hai bên cùng thỏa thuận.${feeTx(' Nếu không học bù, phí nghỉ được tính theo quy định ở mục Điểm danh.')}</p></div>`};
CHG.hbf=v=>{S.hb.f=v;S.pg.hb=1};
function mkCands(h){const out=[];for(const key in DB.att){const [d,sid,hs]=key.split('|');if(hs!==h||(isPH()&&d<addD(TODAY,-45)))continue;   /* nhân viên chọn được cả buổi nghỉ cũ hơn 45 ngày để nhập lại dữ liệu bù cũ */const c=DB.att[key];if(!['p','kp','tt'].includes(c))continue;const l=DB.lich.find(x=>x.id===sid&&x.type==='11');if(!l||mkFor(h,d,sid))continue;
  /* ca 1-1 trong gói bán trú: nếu cả ngày bán trú đã ghi nghỉ thì khoản hoàn xử lý theo ngày bán trú, không xếp học bù thêm */
  const k=kidBy(h),b=k&&k.gr?DB.att[d+'|'+k.gr+'|'+h]:'';if(b&&b!=='cm'&&incSession(k,d)===sid)continue;
  out.push({d,sid,slot:l.slot,c})}return out.sort((a,b)=>a.d<b.d?1:-1)}
const mkMake=(h,d,sid,why)=>{const l=DB.lich.find(x=>x.id===sid),mid='mk'+uid();DB.mk.push({id:mid,hs:h,from:{d,sid,kind:'11',slot:l?l.slot:''},by:isPH()?'ph':isLead()?'tt':'gv',why,s:'dk',props:[],pick:null,log:[{at:TODAY,by:isPH()?'ph':'gv',tx:'Đăng ký học bù'}]});return mid};
ACT.mkfrom=v=>{const [d,sid,h]=v.split('|');if(!canKid(h))return false;mkMake(h,d,sid,AC[DB.att[attKey(d,sid,h)]]||'Nghỉ');toast('Đã tạo yêu cầu học bù. Mở mục Học bù để đề xuất giờ.')};
ACT.mknew=()=>{const ks=myKids().filter(k=>k.st==='dang'&&wk11(k.id));S.modal={t:'mkn',k:ks.length?ks[0].id:''}};
CHG.mknk=v=>{S.modal.k=v};
MODALS.mkn=()=>{const m=S.modal,ks=myKids().filter(k=>k.st==='dang'&&wk11(k.id)),cs=m.k?mkCands(m.k):[];
 return mdl('Đăng ký học bù',`<form id="mknf" class="f"><div><label for="mk-k">Bé</label><select id="mk-k" data-c="mknk">${opts(ks.map(k=>[k.id,k.n]),m.k)}</select></div>
 <div><label for="mk-s">Buổi đã nghỉ cần học bù</label><select id="mk-s" name="s">${cs.length?opts(cs.map(c=>[c.d+'|'+c.sid,DAYS[dow(c.d)]+' '+vd(c.d)+' · '+slotLb(c.slot)+' · '+AC[c.c]]),''):'<option value="">Không có buổi nghỉ nào cần học bù</option>'}</select></div>
 <div><label for="mk-w">Ghi chú</label><input id="mk-w" name="w" placeholder="Ví dụ: gia đình đi công tác"></div>
 <p class="note sm">${isPH()?'Chỉ các buổi 1-1 đã được điểm danh nghỉ trong 45 ngày gần đây mới hiện ở đây.':'Hiện mọi buổi 1-1 đã điểm danh nghỉ chưa có yêu cầu học bù (kể cả buổi nghỉ cũ), để nhập lại dữ liệu bù.'}</p>
 <div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit" ${cs.length?'':'disabled'}>Gửi yêu cầu</button></div></form>`)};
FORM.mknf=f=>{const v=f.elements.s.value;if(!v)return false;const [d,sid]=v.split('|');mkMake(S.modal.k,d,sid,f.elements.w.value.trim()||'Xin học bù');S.modal=null;toast('Đã gửi yêu cầu học bù')};
ACT.mkopen=v=>{S.modal={t:'mkd',id:v}};
function mkGV(r){const l=DB.lich.find(x=>x.id===r.from.sid);return(l&&l.gv)||(kidBy(r.hs)||{}).gv||(pool11()[0]||{}).id||''}
MODALS.mkd=()=>{const r=DB.mk.find(x=>x.id===S.modal.id);if(!r||!canKid(r.hs)){S.modal=null;return''}
 const open=r.s==='dk'||r.s==='tt',staff=!isPH();
 const props=r.props.map(p=>`<div class="rw"><span><b>${DAYN[dow(p.d)]} ${vd(p.d)}</b> · ${slotLb(p.slot)} · ${esc(sn(p.gv))}</span>${r.s==='tt'&&(isPH()||isLead())?`<button class="btn s p" data-a="mkpick" data-v="${r.id}|${p.id}">${isPH()?'Chọn giờ này':'Xác nhận thay phụ huynh'}</button>`:r.pick===p.id?tg('Đã chọn','ok'):''}</div>`).join('');
 return mdl('Học bù của bé '+kn(r.hs),`<p class="mu sm" style="margin-bottom:8px">Buổi nghỉ gốc: ${mkOrigin(r)}</p>${r.s==='huy'?tg(MKS.huy[0],'gy'):mkSteps(r)}
 <h3 style="margin-top:14px">Giờ đề xuất</h3>${props||'<p class="empty">Chưa có giờ đề xuất.</p>'}
 ${(r.s==='dk'||r.s==='tt')&&staff?`<div style="margin-top:10px"><button class="btn p" data-a="mkprop" data-v="${r.id}">${r.s==='tt'?'Đề xuất lại hoặc xếp lịch luôn':'Đề xuất hoặc xếp lịch luôn'}</button></div>`:''}
 <h3 style="margin-top:14px">Nhật ký</h3>${r.log.map(x=>`<div class="rw sm"><span>${vd(x.at)} · ${who[x.by]||x.by}</span><span>${esc(x.tx)}</span></div>`).join('')}
 ${open||r.s==='xn'?`<div class="acts" style="margin-top:14px;justify-content:flex-end"><button class="btn no" data-a="mkno" data-v="${r.id}">Không học bù</button></div>${feeTx('<p class="sm mu" style="margin-top:6px">Chọn “Không học bù” thì phí nghỉ được tính theo quy định, không còn được miễn vì học bù.</p>')}`:''}`)};
ACT.mkno=v=>{const r=DB.mk.find(x=>x.id===v);if(!r)return;ask('Đóng yêu cầu học bù này?'+feeTx(' Phí nghỉ sẽ được tính theo quy định.'),()=>{DB.lich=DB.lich.filter(x=>x.mk!==v);r.s='huy';r.pick=null;r.log.push({at:TODAY,by:isPH()?'ph':'gv',tx:'Không học bù'});S.modal=null;toast('Đã đóng yêu cầu học bù')},'Đóng yêu cầu')};
ACT.mkpick=v=>{const [id,pid]=v.split('|'),r=DB.mk.find(x=>x.id===id),p=r&&r.props.find(x=>x.id===pid);if(!p)return false;
 const x={id:'lb'+uid(),type:'bu',date:p.d,slot:p.slot,gv:p.gv,hs:r.hs,mk:r.id},c=conflict(x);
 if(c){toast('Giờ này không còn trống: '+c);r.props=r.props.filter(y=>y.id!==pid);return}
 DB.lich=DB.lich.filter(l=>l.mk!==r.id);DB.lich.push(x);r.pick=pid;r.s='xn';r.log.push({at:TODAY,by:isPH()?'ph':'tt',tx:isPH()?'Phụ huynh đồng ý lịch bù':'Trung tâm xác nhận thay phụ huynh'});toast('Đã xác nhận lịch học bù')};
/* --- đề xuất giờ --- */
ACT.mkprop=v=>{const r=DB.mk.find(x=>x.id===v);if(!r)return false;S.modal={t:'mkp',id:v,gv:mkGV(r)}};
CHG.mkpgv=v=>{S.modal.gv=v};
MODALS.mkp=()=>{const m=S.modal,r=DB.mk.find(x=>x.id===m.id),from=addD(TODAY>r.from.d?TODAY:r.from.d,1),fs=freeSlots(m.gv,r.hs,from,8);
 return mdl('Đề xuất giờ học bù cho '+kn(r.hs),`<form id="mkpf" class="f"><div><label for="mp-g">Giáo viên dạy bù</label><select id="mp-g" data-c="mkpgv">${opts(pool11().map(s=>[s.id,tName(s)]),m.gv)}</select></div>
 <fieldset style="border:1px solid var(--bd);border-radius:10px;padding:10px"><legend class="sm mu">Khung giờ còn trống (chọn tối đa 3)</legend>${fs.length?fs.map((s,i)=>`<label class="chk" style="padding:4px 0"><input type="checkbox" name="s" value="${s.date}|${s.slot}"> ${DAYN[dow(s.date)]} ${vd(s.date)} · ${slotLb(s.slot)}</label>`).join(''):'<p class="empty">Giáo viên không còn khung giờ trống trong 4 tuần tới.</p>'}</fieldset>
 <fieldset style="border:1px solid var(--bd);border-radius:10px;padding:10px"><legend class="sm mu">Hoặc tự nhập ngày, giờ học bù: chọn bất kỳ ngày nào, trước hay sau hôm nay (giờ bắt đầu từ ${DAY_OPEN} đến ${SLOT_LAST}, mỗi ca ${SLOT_MIN} phút)</legend>
  ${[0,1,2].map(i=>{const x=(m.man||[])[i]||{};return`<div class="f2 mk-man" style="margin-bottom:6px"><div><label class="sm" for="mk-md${i}">Ngày ${i+1}</label><input id="mk-md${i}" name="md" type="date" value="${esc(x.d||'')}"></div><div><label class="sm" for="mk-mt${i}">Giờ bắt đầu</label><input id="mk-mt${i}" name="mt" type="time" step="60" list="mkdl" value="${esc(x.t||'')}"></div></div>`}).join('')}<datalist id="mkdl">${SLOTS.map(t=>`<option value="${t}"></option>`).join('')}</datalist>
  <p class="sm mu" style="margin:4px 0 0">Tổng số khung giờ chọn và tự nhập tối đa 3. Giáo viên, bé hoặc ngày nghỉ bị trùng thì hệ thống báo ngay.</p></fieldset>
 <div class="err" role="alert">${esc(m.err||'')}</div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button>${isLead()||isGV()?'<button class="btn" type="button" data-a="mkdirect" title="Dùng khi phụ huynh đã đồng ý giờ này, hoặc để nhập lại buổi học bù đã diễn ra">Xếp lịch luôn (1 khung giờ)</button>':''}<button class="btn p" type="submit">Gửi đề xuất cho phụ huynh</button></div></form>`)};
/* gom khung giờ đã tick và các dòng tự nhập; kiểm tra giờ hợp lệ, ngày không ở quá khứ, không trùng lịch */
function mkpCollect(f,m){const r=DB.mk.find(x=>x.id===m.id),out=Array.from(f.querySelectorAll('input[name=s]:checked')).map(x=>{const [d,slot]=x.value.split('|');return{d,slot}});
 m.man=Array.from(f.querySelectorAll('.mk-man')).map(e=>({d:e.querySelector('[name=md]').value,t:e.querySelector('[name=mt]').value}));
 for(const x of m.man){if(!x.d&&!x.t)continue;
  if(!x.d||!x.t)return{err:'Mỗi dòng tự nhập cần đủ cả ngày và giờ.'};
  if(!slotValid(x.t))return{err:slotMsg+'.'};
  out.push({d:x.d,slot:x.t})}
 const seen=new Set(),list=out.filter(x=>{const k=x.d+'|'+x.slot;if(seen.has(k))return false;seen.add(k);return true});
 for(const x of list){const c=conflict({date:x.d,slot:x.slot,gv:m.gv,hs:r.hs});if(c)return{err:DAYN[dow(x.d)]+' '+vd(x.d)+' '+x.slot+': '+c}}
 return{list}}
FORM.mkpf=f=>{const m=S.modal,c=mkpCollect(f,m);if(c.err){m.err=c.err;return}if(!c.list.length||c.list.length>3){m.err='Hãy chọn hoặc nhập từ 1 đến 3 khung giờ';return}
 const r=DB.mk.find(x=>x.id===m.id);r.props=c.list.map((x,i)=>({id:'p'+i,d:x.d,slot:x.slot,gv:m.gv,by:'gv'}));r.s='tt';r.log.push({at:TODAY,by:isLead()?'tt':'gv',tx:'Đề xuất '+c.list.length+' khung giờ học bù'});S.modal=null;toast('Đã gửi đề xuất cho phụ huynh')};
/* Trung tâm xếp luôn một khung giờ (phụ huynh đã đồng ý): tạo lịch học bù và chuyển sang "Đã xác nhận" */
ACT.mkdirect=()=>{const f=$q('#mkpf'),m=S.modal;if(!f||!(isLead()||isGV())||!m||m.t!=='mkp')return false;const c=mkpCollect(f,m);
 if(c.err){m.err=c.err;return}if(c.list.length!==1){m.err='Để xếp lịch luôn, hãy chọn hoặc nhập đúng 1 khung giờ.';return}
 const r=DB.mk.find(x=>x.id===m.id),p=c.list[0],x={id:'lb'+uid(),type:'bu',date:p.d,slot:p.slot,gv:m.gv,hs:r.hs,mk:r.id};
 DB.lich=DB.lich.filter(l=>l.mk!==r.id);DB.lich.push(x);r.props=[{id:'p0',d:p.d,slot:p.slot,gv:m.gv,by:'tt'}];r.pick='p0';r.s='xn';
 r.log.push({at:TODAY,by:isLead()?'tt':'gv',tx:(isLead()?'Trung tâm':'Giáo viên')+' xếp lịch học bù theo thỏa thuận với phụ huynh'});S.modal=null;toast('Đã xếp lịch học bù')};

/* --- Bé vắng: xếp bé khác (đang chờ học bù, hoặc có buổi nghỉ chưa bù) vào đúng ngày và khung giờ của bé vắng --- */
ACT.mkfill=v=>{const [d,sid,h]=v.split('|');if(!canEditAtt(d)||!canKid(h)||!DB.lich.find(x=>x.id===sid))return false;S.modal={t:'mkfill',d,sid,h,err:''}};
function mkFillOpts(h){const o=[];
 DB.mk.filter(r=>(r.s==='dk'||r.s==='tt')&&r.hs!==h&&canKid(r.hs)).forEach(r=>o.push({v:'r|'+r.id,t:kn(r.hs)+' · đang chờ học bù (nghỉ '+vdm(r.from.d)+')'}));
 myKids().filter(k=>k.st==='dang'&&k.id!==h&&wk11(k.id)).forEach(k=>mkCands(k.id).forEach(c=>o.push({v:'c|'+c.d+'|'+c.sid+'|'+k.id,t:k.n+' · nghỉ '+vdm(c.d)+' ('+AC[c.c]+'), chưa có yêu cầu bù'})));
 return o}
MODALS.mkfill=()=>{const m=S.modal,l0=DB.lich.find(x=>x.id===m.sid),k=kidBy(m.h);if(!l0||!k){S.modal=null;return''}
 const o=mkFillOpts(m.h);
 return mdl('Xếp bé khác vào giờ của '+k.n,`<p class="sm" style="margin-bottom:8px"><b>${DAYN[dow(m.d)]} ${vd(m.d)} · ${slotLb(l0.slot)}</b> · Giáo viên ${esc(sn(l0.gv))}<br><span class="mu">Bé vắng: ${esc(k.n)} (${esc(AC[DB.att[attKey(m.d,m.sid,m.h)]]||'')})</span></p>
 <form id="mkfillf" class="f"><div><label for="mf-o">Chọn bé học bù vào khung giờ này</label><select id="mf-o" name="o">${o.length?opts(o.map(x=>[x.v,x.t]),''):'<option value="">Không có bé nào đang cần học bù</option>'}</select></div>
 <p class="sm mu" style="margin:0">Hiện các bé đang chờ học bù và các bé có buổi nghỉ chưa được bù. Buổi học bù được xếp luôn vào đúng ngày, giờ, giáo viên của buổi bé vắng.</p>
 <div class="err" role="alert">${esc(m.err||'')}</div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit" ${o.length?'':'disabled'}>Xếp vào giờ này</button></div></form>`)};
FORM.mkfillf=f=>{const m=S.modal,l0=DB.lich.find(x=>x.id===m.sid),v=f.elements.o.value;if(!l0||!(isLead()||isGV())||!canEditAtt(m.d))return false;
 if(!v){m.err='Hãy chọn bé.';return}
 let rid;
 if(v.startsWith('r|')){const r=DB.mk.find(x=>x.id===v.slice(2));if(!r||!canKid(r.hs)){m.err='Không còn yêu cầu học bù này.';return}rid=r.id}
 else{const [,d0,sid0,h0]=v.split('|');if(!canKid(h0)){m.err='Bạn chưa phụ trách bé này.';return}rid=mkMake(h0,d0,sid0,AC[DB.att[attKey(d0,sid0,h0)]]||'Nghỉ')}
 const r=DB.mk.find(x=>x.id===rid),x={id:'lb'+uid(),type:'bu',date:m.d,slot:effSlot(l0,m.d),gv:effGv(l0,m.d),hs:r.hs,mk:rid},
  c=conflict(Object.assign({},x,{id:l0.id}));   /* khung giờ của bé vắng được trống ra nên bỏ buổi gốc khỏi kiểm tra trùng */
 if(c){m.err=c+'.';if(!v.startsWith('r|'))DB.mk=DB.mk.filter(y=>y.id!==rid);return}
 DB.lich=DB.lich.filter(l=>l.mk!==rid);DB.lich.push(x);r.props=[{id:'p0',d:m.d,slot:x.slot,gv:x.gv,by:'gv'}];r.pick='p0';r.s='xn';
 r.log.push({at:TODAY,by:isLead()?'tt':'gv',tx:'Xếp vào khung giờ của '+kn(m.h)+' vắng ngày '+vdm(m.d)});S.modal=null;toast('Đã xếp '+kn(r.hs)+' học bù vào '+slotLb(x.slot)+' ngày '+vdm(m.d))};
