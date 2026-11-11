/* ===== 5. Lịch học ===== */
const monOf=d=>{let x=d;while(dow(x)!==1)x=addD(x,-1);return x};
const onLeave=(id,d)=>DB.lr.some(x=>x.st===id&&x.s==='duyet'&&x.f<=d&&d<=x.t);
VIEWS.lh=()=>isPH()?lhParent():lhStaff();
const lhStaff=()=>{const h=S.lh=Object.assign({tab:'wk',mode:'gv',wk:monOf(WD),gv:'',room:ROOMS[0],kid:''},S.lh);
 if(isGV()){h.mode='gv';h.gv=U.id}else if(!h.gv)h.gv=(pool11().find(s=>U&&s.id===U.id)||pool11()[0]||{}).id||'';
 if(!h.kid)h.kid=(myKids().find(k=>k.st==='dang'&&wk11(k.id))||{}).id||'';
 return head(isGV()?'Lịch dạy của tôi':'Lịch học','Lịch 1-1 cố định theo tuần ('+DAY_OPEN+'–'+DAY_CLOSE+', mỗi ca '+SLOT_MIN+' phút), lịch học bù và thời khóa biểu bán trú')+tabsH([['wk','Lịch 1-1 theo tuần'],['bt','Thời khóa biểu bán trú'],['hol','Ngày nghỉ lễ']],h.tab,'lhtab')+(h.tab==='wk'?lhWeek(h):h.tab==='hol'?holTab():lhBt())};
ACT.lhtab=v=>{S.lh.tab=v};
ACT.lhwk=v=>{S.lh.wk=v==='0'?monOf(WD):addD(S.lh.wk,+v)};
CHG.lhmode=v=>{S.lh.mode=v};CHG.lhgv=v=>{S.lh.gv=v};CHG.lhroom=v=>{S.lh.room=v};CHG.lhkid=v=>{S.lh.kid=v};
/* các dòng giờ của lưới tuần: mốc gợi ý SLOTS cộng thêm các giờ riêng đang được dùng trong tuần (theo bộ lọc đang xem) */
function slotRows(days,pred){const ds=new Set(days),ex=DB.lich.filter(l=>l.slot&&(l.type==='11'||ds.has(l.date))&&(!pred||pred(l))).map(l=>l.slot);return[...new Set(SLOTS.concat(ex))].sort()}
function lhWeek(h){const mon=h.wk,days=[0,1,2,3,4,5].map(i=>addD(mon,i));
 const ctl=isGV()?'':`<div class="f2" style="margin-bottom:12px"><div><label for="lhm">Xem theo</label><select id="lhm" data-c="lhmode">${opts([['gv','Giáo viên'],['room','Phòng'],['kid','Từng bé'],['all','Tổng hợp số buổi']],h.mode)}</select></div>
 ${h.mode==='gv'?`<div><label for="lhg">Giáo viên</label><select id="lhg" data-c="lhgv">${opts(pool11().map(s=>[s.id,tName(s)]),h.gv)}</select></div>`:h.mode==='room'?`<div><label for="lhr">Phòng</label><select id="lhr" data-c="lhroom">${opts(ROOMS.map(r=>[r,r]),h.room)}</select></div>`:h.mode==='kid'?`<div><label for="lhk">Bé</label><select id="lhk" data-c="lhkid">${opts(DB.kids.filter(k=>k.st==='dang'&&wk11(k.id)).map(k=>[k.id,k.n]),h.kid)}</select></div>`:''}</div>`;
 const gr=h.mode==='gv'&&DB.groups.find(g=>g.gv===h.gv||g.tg===h.gv);
 const mineL=l=>h.mode==='gv'?l.gv===h.gv:h.mode==='room'?l.room===h.room:h.mode==='kid'?l.hs===h.kid:true;
 const rows=slotRows(days,mineL).map(s=>`<tr><th class="nw">${slotLb(s)}${SLOTS.includes(s)?'':'<br><small class="mu">giờ riêng</small>'}</th>${days.map((d,i)=>lhCell(h,d,i+1,s)).join('')}</tr>`).join('');
 return`<div class="card">${ctl}<div class="acts" style="justify-content:space-between;margin-bottom:10px"><div class="acts"><button class="btn s" data-a="lhwk" data-v="-7">Tuần trước</button><button class="btn s" data-a="lhwk" data-v="0">Tuần này</button><button class="btn s" data-a="lhwk" data-v="7">Tuần sau</button></div><b>${vd(days[0])} đến ${vd(days[5])}</b></div>
 ${gr?`<p class="note sm" style="margin-bottom:10px">${esc(sn(h.gv))} phụ trách ${esc(gr.n)} (${gr.gv===h.gv?'giáo viên chính':'trợ giảng'}) từ thứ Hai đến thứ Sáu nên không có ca 1-1 các ngày này.</p>`:''}
 <div class="tw"><table class="wkt"><thead><tr><th></th>${days.map(d=>`<th>${DAYN[dow(d)]}<br><span class="mu">${vdm(d)}</span>${isClosed(d)?'<br>'+tg('Nghỉ','in'):''}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
 <p class="sm mu" style="margin-top:8px">Ô vàng là buổi học bù, ô đỏ nhạt là buổi nghỉ. ${isLead()&&h.mode==='gv'?'Bấm dấu cộng để thêm buổi cố định cho giáo viên đang chọn.':''}</p></div>`}
function lhCell(h,d,w,s){if(isClosed(d))return`<td class="cell off"><span class="sm mu">${esc(holOf(d).n)}</span></td>`;const ls=lichAt(w,s,d);
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
 return mdl(l?'Sửa buổi 1-1 cố định':'Thêm buổi 1-1 cố định',`<form id="lsf" class="f"><p class="mu sm">Giáo viên: <b>${esc(sn(gv))}</b></p><div class="f2"><div><label for="ls-k">Bé</label><select id="ls-k" name="hs" ${l?'disabled':''}>${opts(ks.map(k=>[k.id,k.n+(k.gv?'':' (chưa phân công)')]),l?l.hs:'')}</select></div><div><label for="ls-d">Thứ</label><select id="ls-d" name="day">${opts([1,2,3,4,5,6].map(i=>[i,DAYN[i]]),m.day)}</select></div><div><label for="ls-s">Giờ bắt đầu</label>${slotInput('ls-s',m.slot)}<small class="mu">Ca ${SLOT_MIN} phút, tự tính giờ kết thúc. Chọn giờ gợi ý hoặc nhập giờ khác.</small></div><div><label for="ls-r">Phòng</label><select id="ls-r" name="room"><option value="">Tự chọn phòng trống</option>${opts(ROOMS.map(r=>[r,r]),l?l.room:'')}</select></div></div><div class="err" role="alert">${esc(m.err)}</div>
 <div class="acts" style="justify-content:space-between"><span>${l?`<button class="btn no" type="button" data-a="lsdel" data-v="${l.id}">Xóa buổi này</button>`:''}</span><span class="acts"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu</button></span></div></form>`)};
FORM.lsf=f=>{const m=S.modal,e=f.elements,old=m.id?DB.lich.find(x=>x.id===m.id):null,gv=old?old.gv:S.lh.gv,hs=old?old.hs:e.hs.value;
 if(!hs){m.err='Hãy chọn bé';return}
 const slot=String(e.slot.value||'').slice(0,5);m.day=+e.day.value;m.slot=slot;
 if(!slotValid(slot)){m.err=slotMsg+'.';return}
 const day=+e.day.value,room=e.room.value||ROOMS.find(r=>!conflict({id:old?old.id:'',day,slot,gv,hs,room:r}))||'',x={id:old?old.id:'l'+uid(),type:'11',day,slot,gv,hs,room},
  c=room?conflict(x):(conflict(Object.assign({},x,{room:''}))||'Không còn phòng trống');   /* hết phòng vì giáo viên hoặc bé đã bận thì báo đúng lý do */
 if(c){m.err=c+' (ca '+slotLb(slot)+'). Hãy chọn thứ, giờ hoặc phòng khác.';return}
 if(old)Object.assign(old,x);else DB.lich.push(x);
 const k=kidBy(hs);if(!k.gv)k.gv=gv;k.m11=wk11(hs);S.modal=null;toast('Đã lưu buổi học')};
ACT.lsdel=v=>{const l=DB.lich.find(x=>x.id===v),k=l&&kidBy(l.hs);if(!l)return;ask('Xóa buổi 1-1 cố định '+DAYN[l.day]+' '+slotLb(l.slot)+' của bé '+(k?k.n:'')+'? Các lần điểm danh trước đây vẫn được giữ.',()=>{DB.lich=DB.lich.filter(x=>x.id!==v);if(k)k.m11=wk11(k.id);toast('Đã xóa buổi học')},'Xóa buổi')};
/* --- bán trú: thời khóa biểu lớp (kiểu mầm non) ghép giờ can thiệp 1-1 của từng bé --- */
CHG.lhbtg=v=>{S.lh.btg=v};CHG.lhbtk=v=>{S.lh.btk=v};ACT.lhbtm=v=>{S.lh.btm=v};
const ovl1=(l,r)=>tmin(l.slot)<tmin(r.e)&&tmin(slotEnd(l.slot))>tmin(r.s);
const rowAt=(rows,l)=>rows.find(r=>tmin(r.s)<=tmin(l.slot)&&tmin(l.slot)<tmin(r.e));
const kindTag=r=>TKB_K[r.k]?tg(TKB_K[r.k][0],TKB_K[r.k][1]):'';
const tkRowHead=r=>`<th class="nw">${r.s}–${r.e}</th><td class="tkn"><b>${esc(r.n)}</b> ${kindTag(r)}${r.x?`<small>${esc(r.x)}</small>`:''}</td>`;
/* bảng của một lớp: mỗi ô có tên bé đang học 1-1 vào giờ đó */
function tkbClass(g,ks){const rows=tkbRows(g.id),byId={};ks.forEach(k=>{byId[k.id]=k});
 const ss=DB.lich.filter(l=>l.type==='11'&&byId[l.hs]&&btHas(byId[l.hs],l.day)).sort((a,b)=>a.slot<b.slot?-1:a.slot>b.slot?1:0);
 const chip=l=>`<span class="kc" title="${esc(sn(l.gv)+' · '+l.room+' · '+slotLb(l.slot))}">${esc(given(byId[l.hs].n))} <small>${l.slot}</small></span>`;
 const head=`<tr><th>Giờ</th><th>Hoạt động</th>${DAY_ALL.map(w=>`<th>${DAYN[w]}<br><small class="mu">${ks.filter(k=>btHas(k,w)).length} bé</small></th>`).join('')}</tr>`;
 const body=rows.map(r=>`<tr>${tkRowHead(r)}${DAY_ALL.map(w=>{const t=(r.d&&r.d[w])||'',c=ss.filter(l=>l.day===w&&rowAt(rows,l)===r);return`<td class="cell ${grOpen(g,w)?'':'off'}">${t?`<div class="tkc">${esc(t)}</div>`:''}${c.length?`<div class="tko"><small class="mu">Học 1-1:</small> ${c.map(chip).join('')}</div>`:''}</td>`}).join('')}</tr>`).join('');
 const out=ss.filter(l=>!rowAt(rows,l)),sl=[...new Set(out.map(l=>l.slot))].sort();
 const ex=sl.map(sv=>`<tr><th class="nw">${slotLb(sv)}</th><td class="tkn"><b>Ngoài khung thời khóa biểu</b></td>${DAY_ALL.map(w=>{const c=out.filter(l=>l.slot===sv&&l.day===w);return`<td class="cell">${c.length?c.map(chip).join(''):''}</td>`}).join('')}</tr>`).join('');
 return rows.length?`<div class="tw"><table class="wkt tkt"><thead>${head}</thead><tbody>${body}${ex}</tbody></table></div>`:'<p class="empty">Lớp chưa có thời khóa biểu.'+(isLead()?' Bấm “Sửa thời khóa biểu” để thêm các dòng hoạt động.':'')+'</p>'}
/* bảng tuần của một bé: thời khóa biểu lớp ghép với các ca 1-1 của riêng bé */
function kidWeek(k){const bd=btOf(k),g=bd.length?grBy(k.gr):null,ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).sort((a,b)=>a.slot<b.slot?-1:a.slot>b.slot?1:0);
 if(!ls.length&&!g)return'<p class="empty">Bé chưa có lịch học cố định.</p>';
 const chip=l=>`<div class="ls st"><b>1-1 · ${slotLb(l.slot)}</b><small>${esc(given(sn(l.gv)))} · ${esc(l.room)}</small></div>`;
 const rows=g?tkbRows(g.id):[];
 if(!rows.length){   /* chưa có thời khóa biểu lớp: bảng theo ca như trước */
  const slots=[...new Set(ls.map(l=>l.slot))].sort(),bt=g?`<tr><th class="nw">${BTLB}</th><td class="tkn"><b>Bán trú ${esc(g.n)}</b></td>${DAY_ALL.map(w=>`<td class="cell">${bd.includes(w)?'<div class="ls st bt"><b>Bán trú</b><small>'+esc(g.n)+'</small></div>':''}</td>`).join('')}</tr>`:'';
  return`<div class="tw"><table class="wkt tkt"><thead><tr><th>Giờ</th><th>Hoạt động</th>${DAY_ALL.map(w=>`<th>${DAYN[w]}</th>`).join('')}</tr></thead><tbody>${bt}${slots.map(sv=>`<tr><th class="nw">${slotLb(sv)}</th><td class="tkn"><b>Can thiệp 1-1</b></td>${DAY_ALL.map(w=>`<td class="cell">${ls.filter(l=>l.day===w&&l.slot===sv).map(chip).join('')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
 const body=rows.map(r=>`<tr>${tkRowHead(r)}${DAY_ALL.map(w=>{const on=bd.includes(w),mine=ls.filter(l=>l.day===w&&ovl1(l,r)),t=on?((r.d&&r.d[w])||''):'';
  return`<td class="cell ${on?'':'off'}">${t?`<div class="tkc ${mine.length?'dim':''}">${esc(t)}</div>`:''}${mine.map(l=>rowAt(rows,l)===r?chip(l):'<div class="sm mu">Đang học 1-1</div>').join('')}</td>`}).join('')}</tr>`).join('');
 const out=ls.filter(l=>!rowAt(rows,l)),sl=[...new Set(out.map(l=>l.slot))].sort();
 const ex=sl.map(sv=>`<tr><th class="nw">${slotLb(sv)}</th><td class="tkn"><b>Ngoài khung thời khóa biểu</b></td>${DAY_ALL.map(w=>`<td class="cell">${out.filter(l=>l.slot===sv&&l.day===w).map(chip).join('')}</td>`).join('')}</tr>`).join('');
 return`<div class="tw"><table class="wkt tkt"><thead><tr><th>Giờ</th><th>Hoạt động</th>${DAY_ALL.map(w=>`<th>${DAYN[w]}<br><small class="mu">${bd.includes(w)?'Bán trú':'Không bán trú'}</small></th>`).join('')}</tr></thead><tbody>${body}${ex}</tbody></table></div><p class="sm mu" style="margin-top:8px">Ô xanh là ca can thiệp 1-1 của bé (${SLOT_MIN} phút); hoạt động của lớp trong khung giờ đó bé không tham gia.</p>`}
function lhBt(){const gs=isGV()?myGroups():DB.groups;
 if(!gs.length)return'<div class="card"><p class="empty">Bạn không phụ trách lớp bán trú nào.</p></div>';
 const h=S.lh;if(!gs.some(g=>g.id===h.btg))h.btg=gs[0].id;if(!h.btm)h.btm='lop';
 const g=grBy(h.btg),ks=DB.kids.filter(k=>k.gr===g.id&&k.st==='dang'&&k.bt);
 if(!ks.some(k=>k.id===h.btk))h.btk=(ks[0]||{}).id||'';
 const miss=ks.filter(k=>btOf(k).some(w=>!DB.lich.some(l=>l.type==='11'&&l.hs===k.id&&l.day===w)));
 const ctl=`<div class="card"><div class="top" style="align-items:flex-end"><div class="f2" style="flex:1">${gs.length>1?`<div><label for="lhbg">Lớp</label><select id="lhbg" data-c="lhbtg">${opts(gs.map(x=>[x.id,x.n]),h.btg)}</select></div>`:''}${h.btm==='be'?`<div><label for="lhbk">Bé</label><select id="lhbk" data-c="lhbtk">${opts(ks.map(k=>[k.id,k.n]),h.btk)}</select></div>`:''}</div>${isLead()&&h.btm==='lop'?`<button class="btn p" data-a="tkbedit">Sửa thời khóa biểu</button>`:''}</div>
  <div style="margin-top:10px">${tabsH([['lop','Thời khóa biểu lớp'],['be','Từng bé']],h.btm,'lhbtm')}</div></div>`;
 const sum=`<div class="card"><h2>${esc(g.n)} <span class="mu sm">· ${ks.length} trẻ</span></h2><p class="sm">Giáo viên chính <b>${esc(sn(g.gv))}</b> · Trợ giảng <b>${esc(sn(g.tg))}</b> · ${BTLB}<br>Số bé theo ngày: ${DAY_ALL.map(w=>DAYS[w]+' '+ks.filter(k=>btHas(k,w)).length).join(' · ')}</p>${miss.length?`<p class="note sm" style="margin-top:8px"><b>Bé chưa đủ ca 1-1 cho các ngày bán trú:</b> ${esc(miss.map(k=>given(k.n)).join(', '))}. Mở hồ sơ bé, thẻ Lịch học, để xếp ca.</p>`:''}</div>`;
 if(h.btm==='be'){const k=kidBy(h.btk);return ctl+(k?`<div class="card"><h2>Thời khóa biểu của ${esc(k.n)}</h2><p class="sm mu" style="margin-bottom:8px">${esc(progOf(k))}${isLead()?' · <button class="lk" data-a="hsopenlh" data-v="'+k.id+'">Sửa lịch học của bé</button>':''}</p>${kidWeek(k)}</div>`:'<div class="card"><p class="empty">Lớp chưa có bé nào.</p></div>')}
 return ctl+sum+`<div class="card"><h2>Thời khóa biểu lớp ${esc(g.n)}</h2>${tkbClass(g,ks)}<p class="sm mu" style="margin-top:8px">Các hoạt động chung của lớp theo khung giờ. Tên bé hiện ở ô giờ bé ra học can thiệp 1-1 (giờ ghi cạnh tên); mỗi ngày bán trú mỗi bé có một ca 1-1 ${SLOT_MIN} phút. Bé được chọn ngày bán trú riêng: thứ Hai đến thứ Sáu hoặc thứ Hai đến thứ Bảy.</p></div>`}
ACT.hsopenlh=v=>{S.modal={t:'hs',id:v,tab:'lh'}};
/* --- sửa thời khóa biểu của lớp --- */
ACT.tkbedit=()=>{const g=S.lh.btg;S.modal={t:'tkb',gr:g,rows:(DB.tkb||[]).filter(r=>r.gr===g).sort((a,b)=>tmin(a.s)-tmin(b.s)).map(r=>JSON.parse(JSON.stringify(r)))}};
function tkbRead(f){const m=S.modal,e=f.elements;return m.rows.map((r,i)=>{const d={};DAY_ALL.forEach(w=>{const v=(e['d'+i+'_'+w].value||'').trim();if(v)d[w]=v});
 const x={id:r.id,gr:m.gr,s:e['s'+i].value,e:e['e'+i].value,n:e['n'+i].value.trim(),k:e['k'+i].value,x:e['x'+i].value.trim()};if(Object.keys(d).length)x.d=d;return x})}
const tkbSync=()=>{const f=$q('#tkbf');if(f&&S.modal&&S.modal.t==='tkb')S.modal.rows=tkbRead(f)};
ACT.tkbadd=()=>{tkbSync();const m=S.modal,last=m.rows.slice().sort((a,b)=>tmin(a.e)-tmin(b.e)).pop(),s0=last?last.e:'08:00',e0=pad(Math.min(23,Math.floor((tmin(s0)+45)/60)))+':'+pad((tmin(s0)+45)%60);
 m.rows.push({id:'tk'+m.gr+'-'+uid(),gr:m.gr,s:s0,e:e0,n:'',k:'hoc',x:''})};
ACT.tkbdel=v=>{tkbSync();S.modal.rows.splice(+v,1)};
ACT.tkbreset=()=>{const m=S.modal;ask('Thay các dòng đang sửa bằng thời khóa biểu mẫu của lớp này? Các thay đổi chưa lưu sẽ mất.',()=>{S.modal=Object.assign({},m,{rows:tkbDefault([grBy(m.gr)]).map(r=>r)})},'Dùng mẫu')};
MODALS.tkb=()=>{const m=S.modal,g=grBy(m.gr);if(!g||!isLead()){S.modal=null;return''}
 const KO=Object.entries(TKB_K).map(([k,v])=>[k,v[0]]);
 const row=(r,i)=>`<div class="card tkrow"><div class="f2"><div><label for="tk-s${i}">Từ giờ</label><input id="tk-s${i}" name="s${i}" type="time" value="${esc(r.s)}" required></div><div><label for="tk-e${i}">Đến giờ</label><input id="tk-e${i}" name="e${i}" type="time" value="${esc(r.e)}" required></div><div><label for="tk-k${i}">Loại</label><select id="tk-k${i}" name="k${i}">${opts(KO,r.k)}</select></div></div>
  <div class="f2" style="margin-top:6px"><div><label for="tk-n${i}">Tên hoạt động</label><input id="tk-n${i}" name="n${i}" value="${esc(r.n)}" required></div><div><label for="tk-x${i}">Mô tả chung cho mọi ngày</label><input id="tk-x${i}" name="x${i}" value="${esc(r.x||'')}"></div></div>
  <details style="margin-top:6px"><summary class="sm" style="cursor:pointer">Nội dung riêng từng thứ${r.d&&Object.keys(r.d).length?' (đã có)':''}</summary><div class="f2" style="margin-top:6px">${DAY_ALL.map(w=>`<div><label for="tk-d${i}-${w}">${DAYN[w]}</label><input id="tk-d${i}-${w}" name="d${i}_${w}" value="${esc((r.d||{})[w]||'')}"></div>`).join('')}</div></details>
  <div class="acts" style="justify-content:flex-end;margin-top:6px"><button class="btn s no" type="button" data-a="tkbdel" data-v="${i}">Xóa dòng</button></div></div>`;
 return mdl('Thời khóa biểu lớp '+g.n,`<form id="tkbf" class="f"><p class="sm mu">Mỗi dòng là một khung giờ hoạt động của lớp. Giờ can thiệp 1-1 của từng bé được ghép tự động lên thời khóa biểu theo lịch cá nhân của bé, nên không cần ghi ở đây.</p>${m.rows.map(row).join('')||'<p class="empty">Chưa có dòng nào.</p>'}
  <div class="acts" style="justify-content:space-between"><span class="acts"><button class="btn" type="button" data-a="tkbadd">Thêm dòng</button><button class="btn" type="button" data-a="tkbreset">Dùng thời khóa biểu mẫu</button></span><span class="acts"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu thời khóa biểu</button></span></div></form>`,1)};
FORM.tkbf=f=>{if(!isLead())return false;const m=S.modal,rows=tkbRead(f);
 for(const r of rows){if(!r.n){toast('Mỗi dòng cần có tên hoạt động');return false}if(!r.s||!r.e||tmin(r.s)>=tmin(r.e)){toast('Giờ của “'+r.n+'” chưa hợp lệ: giờ bắt đầu phải trước giờ kết thúc');return false}}
 const so=rows.slice().sort((a,b)=>tmin(a.s)-tmin(b.s));
 for(let i=1;i<so.length;i++)if(tmin(so[i].s)<tmin(so[i-1].e)){toast('“'+so[i].n+'” chồng giờ với “'+so[i-1].n+'”');return false}
 DB.tkb=(DB.tkb||[]).filter(r=>r.gr!==m.gr).concat(so);S.modal=null;toast('Đã lưu thời khóa biểu')};

/* --- góc nhìn phụ huynh: lịch học, giờ 1-1 và giờ bán trú của bé --- */
ACT.lhk=v=>{S.lh.kid=v};
function lhParent(){const ks=myKids().filter(k=>k.st==='dang');
 if(!ks.length)return head('Lịch học của bé','')+'<div class="card"><p class="empty">Tài khoản này chưa gắn với bé nào đang học. Hãy liên hệ Trung tâm.</p></div>';
 const h=S.lh=Object.assign({kid:ks[0].id},S.lh);if(!ks.some(k=>k.id===h.kid))h.kid=ks[0].id;
 const k=kidBy(h.kid),g=btOf(k).length?grBy(k.gr):null,ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id);
 const days=[];for(let i=0;i<14;i++){const d=addD(TODAY,i);if(!isW(d))continue;const xs=sched(k,d.slice(0,7)).filter(x=>x.d===d).sort((a,b)=>a.slot<b.slot?-1:1);if(xs.length)days.push({d,xs})}
 const line=(d,x)=>{const l=x.kind==='bt'?null:DB.lich.find(y=>y.id===x.sid),c=DB.att[d+'|'+x.sid+'|'+k.id];
  const what=x.kind==='bt'?'Bán trú '+esc(g?g.n:'')+' · '+BTLB:(x.kind==='bu'?'Học bù ':'Can thiệp 1-1 ')+slotLb(x.slot)+(l?' · '+esc(given(sn(l.gv)))+' · '+esc(l.room):'');
  return`<div class="rw"><span>${what}</span>${c?tg(AC[c],c==='cm'?'ok':c==='kp'?'er':c==='p'?'wa':'in'):''}</div>`};
 return head('Lịch học của bé','Giờ học 1-1 và giờ bán trú của bé trong tuần')+(ks.length>1?tabsH(ks.map(x=>[x.id,given(x.n)]),h.kid,'lhk'):'')
 +`<div class="grid"><div class="card kpi"><div class="mu sm">Học 1-1</div><div class="big">${ls.length} buổi</div><div class="sm mu">mỗi tuần${ls.length?', '+esc(given(mainGV(k))):''}</div></div><div class="card kpi"><div class="mu sm">Bán trú</div><div class="big">${g?esc(g.n):'Không'}</div><div class="sm mu">${g?BTLB+', '+esc(dayTx(btOf(k))):'Bé chưa đăng ký bán trú'}</div></div></div>`
 +`<div class="card"><h2>Thời khóa biểu của ${esc(given(k.n))}</h2>${kidWeek(k)}<p class="sm mu" style="margin-top:8px">Khi cần nghỉ hoặc đổi giờ, phụ huynh báo trong nhóm chung hoặc đăng ký học bù ở mục Học bù.</p></div>`
 +`${holCard(60)}<div class="card"><h2>Lịch 14 ngày tới</h2>${days.length?days.map(({d,xs})=>`<div class="mday" style="margin-bottom:8px"><div class="mh"><b>${DAYN[dow(d)]}</b> <span class="mu sm">${vdm(d)}</span>${d===TODAY?' '+tg('Hôm nay','y'):''}</div>${xs.map(x=>line(d,x)).join('')}</div>`).join(''):'<p class="empty">Chưa có lịch trong 14 ngày tới.</p>'}<div class="acts" style="margin-top:10px">${g?'<button class="btn s" data-a="nav" data-v="tn">Thực đơn bán trú</button>':''}<button class="btn s" data-a="nav" data-v="hb">Đăng ký học bù</button></div></div>`}
