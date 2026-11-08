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
function mkCands(h){const out=[];for(const key in DB.att){const [d,sid,hs]=key.split('|');if(hs!==h||d<addD(TODAY,-45))continue;const c=DB.att[key];if(!['p','kp','tt'].includes(c))continue;const l=DB.lich.find(x=>x.id===sid&&x.type==='11');if(!l||mkFor(h,d,sid))continue;out.push({d,sid,slot:l.slot,c})}return out.sort((a,b)=>a.d<b.d?1:-1)}
const mkMake=(h,d,sid,why)=>{const l=DB.lich.find(x=>x.id===sid);DB.mk.push({id:'mk'+uid(),hs:h,from:{d,sid,kind:'11',slot:l?l.slot:''},by:isPH()?'ph':isLead()?'tt':'gv',why,s:'dk',props:[],pick:null,log:[{at:TODAY,by:isPH()?'ph':'gv',tx:'Đăng ký học bù'}]})};
ACT.mkfrom=v=>{const [d,sid,h]=v.split('|');if(!canKid(h))return false;mkMake(h,d,sid,AC[DB.att[attKey(d,sid,h)]]||'Nghỉ');toast('Đã tạo yêu cầu học bù. Mở mục Học bù để đề xuất giờ.')};
ACT.mknew=()=>{const ks=myKids().filter(k=>k.st==='dang'&&wk11(k.id));S.modal={t:'mkn',k:ks.length?ks[0].id:''}};
CHG.mknk=v=>{S.modal.k=v};
MODALS.mkn=()=>{const m=S.modal,ks=myKids().filter(k=>k.st==='dang'&&wk11(k.id)),cs=m.k?mkCands(m.k):[];
 return mdl('Đăng ký học bù',`<form id="mknf" class="f"><div><label for="mk-k">Bé</label><select id="mk-k" data-c="mknk">${opts(ks.map(k=>[k.id,k.n]),m.k)}</select></div>
 <div><label for="mk-s">Buổi đã nghỉ cần học bù</label><select id="mk-s" name="s">${cs.length?opts(cs.map(c=>[c.d+'|'+c.sid,DAYS[dow(c.d)]+' '+vd(c.d)+' · '+slotLb(c.slot)+' · '+AC[c.c]]),''):'<option value="">Không có buổi nghỉ nào cần học bù</option>'}</select></div>
 <div><label for="mk-w">Ghi chú</label><input id="mk-w" name="w" placeholder="Ví dụ: gia đình đi công tác"></div>
 <p class="note sm">Chỉ các buổi 1-1 đã được điểm danh nghỉ trong 45 ngày gần đây mới hiện ở đây.</p>
 <div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit" ${cs.length?'':'disabled'}>Gửi yêu cầu</button></div></form>`)};
FORM.mknf=f=>{const v=f.elements.s.value;if(!v)return false;const [d,sid]=v.split('|');mkMake(S.modal.k,d,sid,f.elements.w.value.trim()||'Xin học bù');S.modal=null;toast('Đã gửi yêu cầu học bù')};
ACT.mkopen=v=>{S.modal={t:'mkd',id:v}};
function mkGV(r){const l=DB.lich.find(x=>x.id===r.from.sid);return(l&&l.gv)||(kidBy(r.hs)||{}).gv||(pool11()[0]||{}).id||''}
MODALS.mkd=()=>{const r=DB.mk.find(x=>x.id===S.modal.id);if(!r||!canKid(r.hs)){S.modal=null;return''}
 const open=r.s==='dk'||r.s==='tt',staff=!isPH();
 const props=r.props.map(p=>`<div class="rw"><span><b>${DAYN[dow(p.d)]} ${vd(p.d)}</b> · ${slotLb(p.slot)} · ${esc(p.room)} · ${esc(sn(p.gv))}</span>${r.s==='tt'&&(isPH()||isLead())?`<button class="btn s p" data-a="mkpick" data-v="${r.id}|${p.id}">${isPH()?'Chọn giờ này':'Xác nhận thay phụ huynh'}</button>`:r.pick===p.id?tg('Đã chọn','ok'):''}</div>`).join('');
 return mdl('Học bù của bé '+kn(r.hs),`<p class="mu sm" style="margin-bottom:8px">Buổi nghỉ gốc: ${mkOrigin(r)}</p>${r.s==='huy'?tg(MKS.huy[0],'gy'):mkSteps(r)}
 <h3 style="margin-top:14px">Giờ đề xuất</h3>${props||'<p class="empty">Chưa có giờ đề xuất.</p>'}
 ${r.s==='dk'&&staff?`<div style="margin-top:10px"><button class="btn p" data-a="mkprop" data-v="${r.id}">Đề xuất giờ học bù</button></div>`:''}
 <h3 style="margin-top:14px">Nhật ký</h3>${r.log.map(x=>`<div class="rw sm"><span>${vd(x.at)} · ${who[x.by]||x.by}</span><span>${esc(x.tx)}</span></div>`).join('')}
 ${open||r.s==='xn'?`<div class="acts" style="margin-top:14px;justify-content:flex-end"><button class="btn no" data-a="mkno" data-v="${r.id}">Không học bù</button></div>${feeTx('<p class="sm mu" style="margin-top:6px">Chọn “Không học bù” thì phí nghỉ được tính theo quy định, không còn được miễn vì học bù.</p>')}`:''}`)};
ACT.mkno=v=>{const r=DB.mk.find(x=>x.id===v);if(!r)return;ask('Đóng yêu cầu học bù này?'+feeTx(' Phí nghỉ sẽ được tính theo quy định.'),()=>{DB.lich=DB.lich.filter(x=>x.mk!==v);r.s='huy';r.pick=null;r.log.push({at:TODAY,by:isPH()?'ph':'gv',tx:'Không học bù'});S.modal=null;toast('Đã đóng yêu cầu học bù')},'Đóng yêu cầu')};
ACT.mkpick=v=>{const [id,pid]=v.split('|'),r=DB.mk.find(x=>x.id===id),p=r&&r.props.find(x=>x.id===pid);if(!p)return false;
 const x={id:'lb'+uid(),type:'bu',date:p.d,slot:p.slot,gv:p.gv,hs:r.hs,room:p.room,mk:r.id},c=conflict(x);
 if(c){toast('Giờ này không còn trống: '+c);r.props=r.props.filter(y=>y.id!==pid);return}
 DB.lich=DB.lich.filter(l=>l.mk!==r.id);DB.lich.push(x);r.pick=pid;r.s='xn';r.log.push({at:TODAY,by:isPH()?'ph':'tt',tx:isPH()?'Phụ huynh đồng ý lịch bù':'Trung tâm xác nhận thay phụ huynh'});toast('Đã xác nhận lịch học bù')};
/* --- đề xuất giờ --- */
ACT.mkprop=v=>{const r=DB.mk.find(x=>x.id===v);if(!r)return false;S.modal={t:'mkp',id:v,gv:mkGV(r)}};
CHG.mkpgv=v=>{S.modal.gv=v};
MODALS.mkp=()=>{const m=S.modal,r=DB.mk.find(x=>x.id===m.id),from=addD(TODAY>r.from.d?TODAY:r.from.d,1),fs=freeSlots(m.gv,r.hs,from,8);
 return mdl('Đề xuất giờ học bù cho '+kn(r.hs),`<form id="mkpf" class="f"><div><label for="mp-g">Giáo viên dạy bù</label><select id="mp-g" data-c="mkpgv">${opts(pool11().map(s=>[s.id,s.n]),m.gv)}</select></div>
 <fieldset style="border:1px solid var(--bd);border-radius:10px;padding:10px"><legend class="sm mu">Khung giờ còn trống (chọn tối đa 3)</legend>${fs.length?fs.map((s,i)=>`<label class="chk" style="padding:4px 0"><input type="checkbox" name="s" value="${s.date}|${s.slot}|${s.room}"> ${DAYN[dow(s.date)]} ${vd(s.date)} · ${slotLb(s.slot)} · ${s.room}</label>`).join(''):'<p class="empty">Giáo viên không còn khung giờ trống trong 4 tuần tới.</p>'}</fieldset>
 <div class="err" role="alert">${esc(m.err||'')}</div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit" ${fs.length?'':'disabled'}>Gửi đề xuất cho phụ huynh</button></div></form>`)};
FORM.mkpf=f=>{const ch=Array.from(f.querySelectorAll('input[name=s]:checked')).map(x=>x.value);if(!ch.length||ch.length>3){S.modal.err='Hãy chọn từ 1 đến 3 khung giờ';return}
 const r=DB.mk.find(x=>x.id===S.modal.id);r.props=ch.map((v,i)=>{const [d,slot,room]=v.split('|');return{id:'p'+i,d,slot,gv:S.modal.gv,room,by:'gv'}});r.s='tt';r.log.push({at:TODAY,by:isLead()?'tt':'gv',tx:'Đề xuất '+ch.length+' khung giờ học bù'});S.modal=null;toast('Đã gửi đề xuất cho phụ huynh')};
