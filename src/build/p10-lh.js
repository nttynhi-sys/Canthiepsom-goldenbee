/* ===== 5. Lịch học ===== */
const monOf=d=>{let x=d;while(dow(x)!==1)x=addD(x,-1);return x};
const onLeave=(id,d)=>DB.lr.some(x=>x.st===id&&x.s==='duyet'&&x.f<=d&&d<=x.t);
VIEWS.lh=()=>isPH()?lhParent():lhStaff();
const lhStaff=()=>{const h=S.lh=Object.assign({tab:'wk',mode:'gv',wk:monOf(WD),gv:'',room:ROOMS[0],kid:''},S.lh);
 if(isGV()){h.mode='gv';h.gv=U.id}else if(!h.gv)h.gv=pool11()[0].id;
 if(!h.kid)h.kid=(myKids().find(k=>k.st==='dang'&&wk11(k.id))||{}).id||'';
 return head(isGV()?'Lịch dạy của tôi':'Lịch học','Lịch 1-1 cố định theo tuần ('+DAY_OPEN+'–'+DAY_CLOSE+', mỗi ca '+SLOT_MIN+' phút), lịch học bù và bán trú')+tabsH([['wk','Lịch 1-1 theo tuần'],['bt','Bán trú']],h.tab,'lhtab')+(h.tab==='wk'?lhWeek(h):lhBt())};
ACT.lhtab=v=>{S.lh.tab=v};
ACT.lhwk=v=>{S.lh.wk=v==='0'?monOf(WD):addD(S.lh.wk,+v)};
CHG.lhmode=v=>{S.lh.mode=v};CHG.lhgv=v=>{S.lh.gv=v};CHG.lhroom=v=>{S.lh.room=v};CHG.lhkid=v=>{S.lh.kid=v};
function lhWeek(h){const mon=h.wk,days=[0,1,2,3,4,5].map(i=>addD(mon,i));
 const ctl=isGV()?'':`<div class="f2" style="margin-bottom:12px"><div><label for="lhm">Xem theo</label><select id="lhm" data-c="lhmode">${opts([['gv','Giáo viên'],['room','Phòng'],['kid','Từng bé'],['all','Tổng hợp số buổi']],h.mode)}</select></div>
 ${h.mode==='gv'?`<div><label for="lhg">Giáo viên</label><select id="lhg" data-c="lhgv">${opts(pool11().map(s=>[s.id,s.n]),h.gv)}</select></div>`:h.mode==='room'?`<div><label for="lhr">Phòng</label><select id="lhr" data-c="lhroom">${opts(ROOMS.map(r=>[r,r]),h.room)}</select></div>`:h.mode==='kid'?`<div><label for="lhk">Bé</label><select id="lhk" data-c="lhkid">${opts(DB.kids.filter(k=>k.st==='dang'&&wk11(k.id)).map(k=>[k.id,k.n]),h.kid)}</select></div>`:''}</div>`;
 const gr=h.mode==='gv'&&DB.groups.find(g=>g.gv===h.gv||g.tg===h.gv);
 const rows=SLOTS.map(s=>`<tr><th class="nw">${slotLb(s)}</th>${days.map((d,i)=>lhCell(h,d,i+1,s)).join('')}</tr>`).join('');
 return`<div class="card">${ctl}<div class="acts" style="justify-content:space-between;margin-bottom:10px"><div class="acts"><button class="btn s" data-a="lhwk" data-v="-7">Tuần trước</button><button class="btn s" data-a="lhwk" data-v="0">Tuần này</button><button class="btn s" data-a="lhwk" data-v="7">Tuần sau</button></div><b>${vd(days[0])} đến ${vd(days[5])}</b></div>
 ${gr?`<p class="note sm" style="margin-bottom:10px">${esc(sn(h.gv))} phụ trách ${esc(gr.n)} (${gr.gv===h.gv?'giáo viên chính':'trợ giảng'}) từ thứ Hai đến thứ Sáu nên không có ca 1-1 các ngày này.</p>`:''}
 <div class="tw"><table class="wkt"><thead><tr><th></th>${days.map(d=>`<th>${DAYN[dow(d)]}<br><span class="mu">${vdm(d)}</span></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
 <p class="sm mu" style="margin-top:8px">Ô vàng là buổi học bù, ô đỏ nhạt là buổi nghỉ. ${isLead()&&h.mode==='gv'?'Bấm dấu cộng để thêm buổi cố định cho giáo viên đang chọn.':''}</p></div>`}
function lhCell(h,d,w,s){const ls=lichAt(w,s,d);
 if(h.mode==='all')return`<td class="cell"><span class="tag ${ls.length>=ROOMS.length?'er':ls.length?'in':'gy'}">${ls.length}/${ROOMS.length}</span></td>`;
 const mine=ls.filter(l=>h.mode==='gv'?l.gv===h.gv:h.mode==='room'?l.room===h.room:l.hs===h.kid),off=h.mode==='gv'&&onLeave(h.gv,d);
 const it=l=>{const k=kidBy(l.hs),c=DB.att[d+'|'+l.id+'|'+l.hs],sub=h.mode==='gv'?l.room:h.mode==='room'?given(sn(l.gv)):given(sn(l.gv))+' · '+l.room;
  return`<button class="ls ${l.type==='bu'?'bu':''} ${c&&c!=='cm'?'x':''}" data-a="lsopen" data-v="${l.id}|${d}">${esc(h.mode==='kid'?'Buổi 1-1':given(k?k.n:'?'))}<small>${esc(sub)}${l.type==='bu'?' · bù':''}${c&&c!=='cm'?' · '+AC[c]:''}</small></button>`};
 const add=isLead()&&h.mode==='gv'&&!off&&!mine.length&&!isGrStaff(h.gv)&&w>=1?`<button class="ls add" data-a="lsadd" data-v="${w}|${s}" aria-label="Thêm buổi">+</button>`:'';
 return`<td class="cell ${off?'off':''}">${off?'<span class="sm mu">Nghỉ phép</span>':mine.map(it).join('')+add}</td>`}
/* --- thêm, sửa, xóa buổi cố định --- */
ACT.lsadd=v=>{const [day,slot]=v.split('|');S.modal={t:'ls',id:'',day:+day,slot,err:''}};
ACT.lsopen=v=>{const [id,d]=v.split('|'),l=DB.lich.find(x=>x.id===id);if(!l)return;S.modal={t:'ls',id,day:l.day,slot:l.slot,date:d,err:''}};
MODALS.ls=()=>{const m=S.modal,l=m.id?DB.lich.find(x=>x.id===m.id):null;
 if(l&&l.type==='bu'){const k=kidBy(l.hs);return mdl('Buổi học bù',`<p><b>${esc(k?k.n:'')}</b> học bù ngày ${vd(l.date)}, ${slotLb(l.slot)}, ${esc(l.room)}, giáo viên ${esc(sn(l.gv))}.</p><div class="acts" style="margin-top:12px"><button class="btn" data-a="nav" data-v="hb">Mở mục Học bù</button></div>`)}
 const gv=l?l.gv:S.lh.gv,editable=isLead(),kid=l?kidBy(l.hs):null;
 if(l&&!editable){return mdl('Buổi 1-1',`<p><b>${esc(kid?kid.n:'')}</b><br>${DAYN[l.day]}, ${slotLb(l.slot)}, ${esc(l.room)}</p>`)}
 const ks=DB.kids.filter(k=>k.st==='dang'&&(k.gv===gv||!k.gv));
 return mdl(l?'Sửa buổi 1-1 cố định':'Thêm buổi 1-1 cố định',`<form id="lsf" class="f"><p class="mu sm">Giáo viên: <b>${esc(sn(gv))}</b></p><div class="f2"><div><label for="ls-k">Bé</label><select id="ls-k" name="hs" ${l?'disabled':''}>${opts(ks.map(k=>[k.id,k.n+(k.gv?'':' (chưa phân công)')]),l?l.hs:'')}</select></div><div><label for="ls-d">Thứ</label><select id="ls-d" name="day">${opts([1,2,3,4,5,6].map(i=>[i,DAYN[i]]),m.day)}</select></div><div><label for="ls-s">Ca học</label><select id="ls-s" name="slot">${opts(SLOTS.map(s=>[s,slotLb(s)]),m.slot)}</select></div><div><label for="ls-r">Phòng</label><select id="ls-r" name="room">${opts(ROOMS.map(r=>[r,r]),l?l.room:(ROOMS.find(r=>!conflict({day:m.day,slot:m.slot,gv,hs:'',room:r}))||ROOMS[0]))}</select></div></div><div class="err" role="alert">${esc(m.err)}</div>
 <div class="acts" style="justify-content:space-between"><span>${l?`<button class="btn no" type="button" data-a="lsdel" data-v="${l.id}">Xóa buổi này</button>`:''}</span><span class="acts"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu</button></span></div></form>`)};
FORM.lsf=f=>{const m=S.modal,e=f.elements,old=m.id?DB.lich.find(x=>x.id===m.id):null,gv=old?old.gv:S.lh.gv,hs=old?old.hs:e.hs.value;
 if(!hs){m.err='Hãy chọn bé';return}
 const x={id:old?old.id:'l'+uid(),type:'11',day:+e.day.value,slot:e.slot.value,gv,hs,room:e.room.value},c=conflict(x);
 if(c){m.err=c+'. Hãy chọn thứ, ca hoặc phòng khác.';return}
 if(old)Object.assign(old,x);else DB.lich.push(x);
 const k=kidBy(hs);if(!k.gv)k.gv=gv;k.m11=wk11(hs);S.modal=null;toast('Đã lưu buổi học')};
ACT.lsdel=v=>{const l=DB.lich.find(x=>x.id===v),k=l&&kidBy(l.hs);if(!l)return;ask('Xóa buổi 1-1 cố định '+DAYN[l.day]+' '+slotLb(l.slot)+' của bé '+(k?k.n:'')+'? Các lần điểm danh trước đây vẫn được giữ.',()=>{DB.lich=DB.lich.filter(x=>x.id!==v);if(k)k.m11=wk11(k.id);toast('Đã xóa buổi học')},'Xóa buổi')};
/* --- bán trú --- */
function lhBt(){const gs=isGV()?myGroups():DB.groups;
 return gs.length?`<div class="two">`+gs.map(g=>{const ks=DB.kids.filter(k=>k.gr===g.id&&k.st==='dang');
  return`<div class="card"><h2>${esc(g.n)} <span class="mu sm">· ${ks.length} trẻ</span></h2><p class="sm">Giáo viên chính <b>${esc(sn(g.gv))}</b><br>Trợ giảng <b>${esc(sn(g.tg))}</b><br>Học từ thứ Hai đến thứ Sáu, ${BTLB}</p><details style="margin-top:8px"><summary class="sm" style="cursor:pointer">Danh sách trẻ</summary><p class="sm" style="margin-top:6px">${esc(ks.map(k=>k.n).join(', '))||'Chưa có trẻ.'}</p></details></div>`}).join('')+`</div>`:'<div class="card"><p class="empty">Bạn không phụ trách nhóm bán trú nào.</p></div>'}
/* --- góc nhìn phụ huynh: lịch học, giờ 1-1 và giờ bán trú của bé --- */
ACT.lhk=v=>{S.lh.kid=v};
function lhParent(){const ks=myKids().filter(k=>k.st==='dang');
 if(!ks.length)return head('Lịch học của bé','')+'<div class="card"><p class="empty">Tài khoản này chưa gắn với bé nào đang học. Hãy liên hệ Trung tâm.</p></div>';
 const h=S.lh=Object.assign({kid:ks[0].id},S.lh);if(!ks.some(k=>k.id===h.kid))h.kid=ks[0].id;
 const k=kidBy(h.kid),g=k.gr?grBy(k.gr):null,ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).sort((a,b)=>a.day-b.day||(a.slot<b.slot?-1:1)),slots=[...new Set(ls.map(l=>l.slot))].sort(),D6=[1,2,3,4,5,6];
 const btRow=g?`<tr><th class="nw">${BTLB}</th>${D6.map(w=>`<td class="cell">${w<=5?`<div class="ls st bt"><b>Bán trú</b><small>${esc(g.n)}</small></div>`:''}</td>`).join('')}</tr>`:'';
 const rows=slots.map(sl=>`<tr><th class="nw">${slotLb(sl)}</th>${D6.map(w=>{const l=ls.find(x=>x.day===w&&x.slot===sl);return`<td class="cell">${l?`<div class="ls st"><b>1-1</b><small>${esc(given(sn(l.gv)))} · ${esc(l.room)}</small></div>`:''}</td>`}).join('')}</tr>`).join('');
 const days=[];for(let i=0;i<14;i++){const d=addD(TODAY,i);if(!isW(d))continue;const xs=sched(k,d.slice(0,7)).filter(x=>x.d===d).sort((a,b)=>a.slot<b.slot?-1:1);if(xs.length)days.push({d,xs})}
 const line=(d,x)=>{const l=x.kind==='bt'?null:DB.lich.find(y=>y.id===x.sid),c=DB.att[d+'|'+x.sid+'|'+k.id];
  const what=x.kind==='bt'?'Bán trú '+esc(g?g.n:'')+' · '+BTLB:(x.kind==='bu'?'Học bù ':'Can thiệp 1-1 ')+slotLb(x.slot)+(l?' · '+esc(given(sn(l.gv)))+' · '+esc(l.room):'');
  return`<div class="rw"><span>${what}</span>${c?tg(AC[c],c==='cm'?'ok':c==='kp'?'er':c==='p'?'wa':'in'):''}</div>`};
 return head('Lịch học của bé','Giờ học 1-1 và giờ bán trú của bé trong tuần')+(ks.length>1?tabsH(ks.map(x=>[x.id,given(x.n)]),h.kid,'lhk'):'')
 +`<div class="grid"><div class="card kpi"><div class="mu sm">Học 1-1</div><div class="big">${ls.length} buổi</div><div class="sm mu">mỗi tuần${ls.length?', '+esc(given(mainGV(k))):''}</div></div><div class="card kpi"><div class="mu sm">Bán trú</div><div class="big">${g?esc(g.n):'Không'}</div><div class="sm mu">${g?BTLB+', thứ Hai đến thứ Sáu':'Bé chưa đăng ký bán trú'}</div></div></div>`
 +`<div class="card"><h2>Thời khóa biểu của ${esc(given(k.n))}</h2>${ls.length||g?`<div class="tw"><table class="wkt" style="min-width:600px"><thead><tr><th></th>${D6.map(w=>`<th>${DAYN[w]}</th>`).join('')}</tr></thead><tbody>${btRow}${rows}</tbody></table></div>`:'<p class="empty">Bé chưa có lịch học cố định.</p>'}<p class="sm mu" style="margin-top:8px">Can thiệp 1-1 nhận bé từ ${DAY_OPEN} đến ${DAY_CLOSE}, mỗi ca ${SLOT_MIN} phút. Khi cần nghỉ hoặc đổi giờ, phụ huynh báo trong nhóm chung hoặc đăng ký học bù ở mục Học bù.</p></div>`
 +`<div class="card"><h2>Lịch 14 ngày tới</h2>${days.length?days.map(({d,xs})=>`<div class="mday" style="margin-bottom:8px"><div class="mh"><b>${DAYN[dow(d)]}</b> <span class="mu sm">${vdm(d)}</span>${d===TODAY?' '+tg('Hôm nay','y'):''}</div>${xs.map(x=>line(d,x)).join('')}</div>`).join(''):'<p class="empty">Chưa có lịch trong 14 ngày tới.</p>'}<div class="acts" style="margin-top:10px">${g?'<button class="btn s" data-a="nav" data-v="tn">Thực đơn bán trú</button>':''}<button class="btn s" data-a="nav" data-v="hb">Đăng ký học bù</button></div></div>`}
