/* ===== 4. Phân công ===== */
const isGrStaff=id=>DB.groups.some(g=>grHas(g,id));
const pool11=()=>DB.staff.filter(s=>isTeacher(s)&&s.st==='dang'&&!isGrStaff(s.id));
const poolBt=()=>DB.staff.filter(s=>isTeacher(s)&&s.st==='dang'&&!DB.lich.some(l=>l.type==='11'&&l.gv===s.id&&l.day>=1&&l.day<=5));
VIEWS.pc=()=>{const p=S.pc=Object.assign({tab:'gv',q:'',gv:''},S.pc);
 return head('Phân công','Giáo viên phụ trách từng trẻ và các nhóm bán trú',isLead()?'<button class="btn" data-a="bgopen" title="Giáo viên nghỉ việc hoặc đổi người phụ trách: giao ca cho giáo viên mới từ một ngày, các buổi trước đó vẫn tính cho giáo viên cũ">Bàn giao ca giáo viên</button>':'')+tabsH([['gv','Giáo viên 1-1'],['bt','Nhóm bán trú'],['kl','Khối lượng công việc']],p.tab,'pctab')+(p.tab==='gv'?pcGV():p.tab==='bt'?pcBt():pcLoad())};
ACT.pctab=v=>{S.pc.tab=v};
INP.pcq=v=>{S.pc.q=v;S.pg.pc=1};
CHG.pcg=v=>{S.pc.gv=v;S.pg.pc=1};
/* tất cả giáo viên đang dạy một bé: người trong danh sách k.ts và người có ca 1-1 của bé, kèm số ca mỗi người */
const kTeachers=k=>{const cnt={};DB.lich.forEach(l=>{if(l.type==='11'&&l.hs===k.id)cnt[l.gv]=(cnt[l.gv]||0)+1});return[...new Set(kTs(k).concat(Object.keys(cnt)))].map(id=>({id,n:cnt[id]||0}))};
function pcGV(){const p=S.pc,q=p.q.toLowerCase(),ks=DB.kids.filter(k=>k.st==='dang'&&wk11(k.id)>0&&(!p.gv||kTeachers(k).some(t=>t.id===p.gv))&&(!q||k.n.toLowerCase().includes(q))),pp=pg('pc',ks,12),P=pool11();
 const cell=k=>kTeachers(k).map(t=>`<div>${esc(sn(t.id))} <span class="sm mu">· ${t.n} ca${kTc(k,t.id)?' · '+esc(kTc(k,t.id)):''}</span></div>`).join('')||'<span class="mu">Chưa phân công</span>';
 const nTre=id=>DB.kids.filter(x=>kHas(x,id)&&x.st==='dang').length;
 return`<div class="card"><div class="f2" style="margin-bottom:12px"><div><label for="pcq">Tìm theo tên bé</label><input id="pcq" data-i="pcq" value="${esc(p.q)}"></div><div><label for="pcg">Lọc theo giáo viên</label><select id="pcg" data-c="pcg"><option value="">Tất cả</option>${opts(P.map(s=>[s.id,tName(s)]),p.gv)}</select></div></div>`
 +tbl(['Trẻ','Buổi 1-1/tuần','Giáo viên hiện tại','Thay đổi'],pp.rows.map(k=>`<tr><td><b>${esc(k.n)}</b><br><span class="sm mu">${age(k.dob)} · ${esc(k.nd)}</span></td><td>${wk11(k.id)}</td><td>${cell(k)}</td><td><div style="display:grid;gap:6px;max-width:260px"><label class="sm" for="ad-${k.id}" style="position:absolute;left:-9999px">Thêm giáo viên dạy chung cho ${esc(k.n)}</label><select id="ad-${k.id}" data-c="pcadd" data-k="${k.id}"><option value="">Thêm giáo viên dạy chung</option>${opts(P.filter(s=>!kTeachers(k).some(t=>t.id===s.id)).map(s=>[s.id,tName(s)+' ('+nTre(s.id)+' trẻ)']),'')}</select><label class="sm" for="mv-${k.id}" style="position:absolute;left:-9999px">Chuyển tất cả ca của ${esc(k.n)}</label><select id="mv-${k.id}" data-c="pcmv" data-k="${k.id}"><option value="">Chuyển tất cả ca sang một giáo viên</option>${opts(P.filter(s=>kTeachers(k).length!==1||kTeachers(k)[0].id!==s.id).map(s=>[s.id,tName(s)+' ('+nTre(s.id)+' trẻ)']),'')}</select><button class="btn s" type="button" data-a="hsedit" data-v="${k.id}">Chia ca và nội dung theo giáo viên</button></div></td></tr>`).join(''),'Không có trẻ phù hợp.')+pp.html
 +`<p class="note sm" style="margin-top:10px">Một bé có thể có nhiều giáo viên dạy chung, ngang nhau, mỗi người một nội dung (ví dụ cô A dạy Ngôn ngữ, cô B dạy Vận động – giác quan). <b>Thêm giáo viên dạy chung</b> chỉ thêm người vào danh sách của bé; muốn giao ca cho người đó, bấm <b>Chia ca và nội dung theo giáo viên</b>. <b>Chuyển tất cả ca</b> giao mọi buổi 1-1 của bé cho một giáo viên (các giáo viên khác rời khỏi bé). Khi giao ca, hệ thống kiểm tra giáo viên mới có rảnh đúng các khung giờ của bé không; nếu trùng sẽ báo rõ và không đổi.</p></div>`}
function reassign(k,gv,dry){const ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id);
 for(const l of ls){const c=conflict(Object.assign({},l,{gv}));if(c)return c+' (bé học '+DAYS[l.day]+' '+slotLb(l.slot)+')'}
 if(!dry){ls.forEach(l=>l.gv=gv);kSet(k,[gv])}return''}
CHG.pcmv=(v,t)=>{const k=kidBy(t.dataset.k);if(!v||!k)return;const c=reassign(k,v,1);
 if(c){toast(c);return}
 const cur=kTeachers(k).map(x=>sn(x.id)).join(', ')||'chưa phân công';
 ask('Chuyển bé '+k.n+' từ '+cur+' sang '+sn(v)+'? Mọi buổi 1-1 cố định của bé sẽ do '+sn(v)+' phụ trách'+(kTeachers(k).length>1?' (các giáo viên khác rời khỏi bé)':'')+'.',()=>{reassign(k,v);toast('Đã chuyển bé '+k.n+' sang '+sn(v))},'Chuyển')};
CHG.pcadd=(v,t)=>{const k=kidBy(t.dataset.k),s=stBy(v);if(!v||!k||!s)return;
 if(kTeachers(k).some(x=>x.id===v)){toast(s.n+' đã dạy bé '+k.n);return}
 kSet(k,kTs(k).concat(v));toast('Đã thêm '+s.n+' vào các giáo viên của '+k.n+'. Bấm "Chia ca và nội dung theo giáo viên" để giao ca và ghi nội dung phụ trách.')};
function pcBt(){const free=poolBt();
 return`<div class="two">`+DB.groups.map(g=>{const ks=DB.kids.filter(k=>k.gr===g.id&&k.st==='dang'),ts=grTs(g),P=DB.staff.filter(s=>isTeacher(s)&&(ts.includes(s.id)||(s.st==='dang'&&free.includes(s))));
  const row=s=>{const on=ts.includes(s.id),o=grOf(s.id),other=o&&o.id!==g.id?o:null;
   return`<label class="chk pcts-r" style="display:flex;gap:8px;align-items:center;margin:0;padding:6px 0"><input type="checkbox" data-c="pcts" data-k="${g.id}|${s.id}" aria-label="${esc(tName(s))} phụ trách ${esc(g.n)}" ${on?'checked':''} ${other?'disabled':''}> <span>${esc(tName(s))} <span class="mu sm">${esc(s.pos)}${other?' · đang phụ trách '+esc(other.n):''}</span></span></label>`};
  return`<div class="card"><h2>${esc(g.n)} <span class="mu sm">· ${ks.length} trẻ</span></h2>
 <div role="group" aria-label="Giáo viên bán trú của ${esc(g.n)}"><p class="sm" style="margin:0 0 4px"><b>Giáo viên bán trú</b> <span class="mu">· ${ts.length?ts.length+' người, ngang nhau':'chưa chọn ai'}</span></p>${P.map(row).join('')||'<p class="empty">Chưa có giáo viên nào rảnh từ thứ Hai đến thứ Sáu.</p>'}</div>
 <details style="margin-top:10px"><summary class="sm" style="cursor:pointer">Danh sách trẻ và chuyển nhóm</summary>${ks.map(k=>`<div class="rw"><span>${esc(k.n)} <span class="mu sm">${age(k.dob)}</span></span><select data-c="pcmvg" data-k="${k.id}" aria-label="Chuyển nhóm cho ${esc(k.n)}" style="width:auto">${opts(DB.groups.map(x=>[x.id,x.n]),k.gr)}</select></div>`).join('')||'<p class="empty">Nhóm chưa có trẻ.</p>'}</details></div>`}).join('')+`</div><p class="note sm">Mỗi lớp chọn được nhiều giáo viên, tất cả ngang nhau. Mỗi người chỉ phụ trách một lớp. Giáo viên bán trú phải rảnh từ thứ Hai đến thứ Sáu, nên chỉ những giáo viên không có buổi 1-1 cố định các ngày này mới được chọn.</p>`}
CHG.pcts=(v,t)=>{const [id,sid]=t.dataset.k.split('|'),g=grBy(id),s=stBy(sid);if(!g||!s)return;const ts=grTs(g);
 if(t.checked){if(ts.includes(sid))return;const o=grOf(sid);
  if(o&&o.id!==id){toast(s.n+' đã phụ trách '+o.n+', hãy bỏ khỏi lớp đó trước');return}
  if(!isTeacher(s)||s.st!=='dang'){toast('Người này không thể phụ trách lớp bán trú');return}
  if(DB.lich.some(l=>l.type==='11'&&l.gv===sid&&l.day>=1&&l.day<=5)){toast(s.n+' đang có buổi 1-1 cố định từ thứ Hai đến thứ Sáu nên chưa thể phụ trách lớp bán trú');return}
  grSet(g,ts.concat(sid));toast('Đã thêm '+s.n+' vào '+g.n)}
 else{if(!ts.includes(sid))return;grSet(g,ts.filter(x=>x!==sid));toast('Đã bỏ '+s.n+' khỏi '+g.n)}};
CHG.pcmvg=(v,t)=>{const k=kidBy(t.dataset.k);if(k&&v){k.gr=v;toast('Đã chuyển '+k.n+' sang '+grBy(v).n)}};
function pcLoad(){const rows=DB.staff.filter(s=>isTeacher(s)&&s.st==='dang').map(s=>{const gr=grOf(s.id),n=DB.lich.filter(l=>l.type==='11'&&l.gv===s.id).length,ks=DB.kids.filter(k=>k.st==='dang'&&(kHas(k,s.id)||DB.lich.some(l=>l.type==='11'&&l.hs===k.id&&l.gv===s.id))).length;return{s,gr,n,ks,u:Math.min(100,Math.round(n*100/LOAD_MAX))}});
 return`<div class="card">`+tbl(['Giáo viên','Vai trò','Trẻ 1-1','Buổi 1-1/tuần','Mức tải so với '+LOAD_MAX+' buổi/tuần'],rows.map(r=>`<tr><td><b>${esc(r.s.n)}</b></td><td>${esc(r.s.pos)}${r.gr?'<br><span class="sm mu">'+esc(r.gr.n)+' · giáo viên bán trú'+'</span>':''}</td><td>${r.ks}</td><td>${r.n}</td><td style="min-width:160px"><div style="display:flex;gap:8px;align-items:center"><div style="flex:1">${bar(r.u,r.u>75?'var(--er)':'')}</div><span class="sm">${r.u}%</span></div></td></tr>`).join(''))+`<p class="sm mu" style="margin-top:8px">Khung giờ 1-1 là ${DAY_OPEN}–${DAY_CLOSE}, ${SLOTS.length} ca mỗi ngày (mỗi ca ${SLOT_MIN} phút), thứ Hai đến thứ Bảy. Mức tải tính theo ${LOAD_MAX} buổi 1-1 mỗi tuần là đủ tải.</p></div>`}

/* ===== Bàn giao ca giữa giáo viên (giáo viên cũ nghỉ việc giữa tháng, giáo viên mới nhận ca) =====
   Mỗi ca 1-1 bàn giao ghi l.ph.push({g:giáo viên cũ,u:ngày tiếp quản}) và đổi l.gv sang giáo viên mới (xem baseGv, effGv ở p04-domain.js). Buổi trước ngày tiếp quản vẫn thuộc giáo viên cũ (công, tiền, công 1-1),
   giáo viên mới điểm danh hộ được (dayList.ok); điểm danh của bé vẫn ghi theo buổi nên học phí tháng này và tháng sau không đổi. */
const bgFrom=()=>{const cnt={};DB.lich.forEach(l=>{if(l.type==='11'&&l.gv)cnt[l.gv]=(cnt[l.gv]||0)+1});return Object.keys(cnt).filter(id=>stBy(id)).map(id=>({id,n:cnt[id]})).sort((a,b)=>(stBy(a.id).st==='dang')-(stBy(b.id).st==='dang')||(sn(a.id)<sn(b.id)?-1:1))};
const bgKids=from=>{const by={};DB.lich.forEach(l=>{if(l.type==='11'&&l.gv===from&&kidBy(l.hs))(by[l.hs]=by[l.hs]||[]).push(l)});return Object.keys(by).map(id=>({k:kidBy(id),ls:by[id]})).sort((a,b)=>a.k.n<b.k.n?-1:1)};
ACT.bgopen=()=>{if(!isLead())return false;const f=bgFrom(),left=f.find(x=>stBy(x.id).st!=='dang');S.modal={t:'bg',from:(left||f[0]||{}).id||'',to:'',d:TODAY,off:[],err:''}};
CHG.bgfrom=v=>{S.modal.from=v;S.modal.off=[];S.modal.err=''};
CHG.bgto=v=>{S.modal.to=v;S.modal.err=''};
CHG.bgd=v=>{if(/^\d{4}-\d{2}-\d{2}$/.test(v||''))S.modal.d=v;S.modal.err=''};
CHG.bgk=(v,t)=>{const m=S.modal,a=new Set(m.off);if(t.checked)a.delete(v);else a.add(v);m.off=[...a];m.err=''};
MODALS.bg=()=>{const m=S.modal;if(!isLead()){S.modal=null;return''}
 const F=bgFrom(),T=pool11().filter(s=>s.id!==m.from),ks=m.from?bgKids(m.from):[],pick=ks.filter(x=>!m.off.includes(x.k.id));
 return mdl('Bàn giao ca giáo viên',`<form id="bgf" class="f"><p class="sm mu" style="margin-bottom:8px">Dùng khi giáo viên nghỉ việc hoặc đổi người phụ trách giữa tháng. Giáo viên mới nhận các ca 1-1 <b>từ ngày tiếp quản</b>; các buổi trước ngày đó vẫn tính công và tiền cho giáo viên cũ, nhưng giáo viên mới vẫn điểm danh được cho bé ở các ngày trước. Điểm danh của bé được giữ nguyên nên học phí tháng này và tháng sau không đổi.</p>
 <div class="f2"><div><label for="bg-f">Giáo viên cũ</label><select id="bg-f" data-c="bgfrom"><option value="">Chọn giáo viên</option>${F.map(x=>`<option value="${esc(x.id)}" ${x.id===m.from?'selected':''}>${esc(sn(x.id))}${stBy(x.id).st!=='dang'?' (đã nghỉ việc)':''} · ${x.n} ca</option>`).join('')}</select></div>
 <div><label for="bg-t">Giáo viên mới</label><select id="bg-t" data-c="bgto"><option value="">Chọn giáo viên</option>${T.map(s=>`<option value="${esc(s.id)}" ${s.id===m.to?'selected':''}>${esc(tName(s))}</option>`).join('')}</select></div>
 <div><label for="bg-d">Giáo viên mới tiếp quản từ ngày</label><input id="bg-d" type="date" value="${esc(m.d)}" data-c="bgd"></div></div>
 <p class="sm" style="margin:10px 0 4px"><b>Bé được bàn giao</b> <span class="mu">(${pick.length}/${ks.length} bé, ${pick.reduce((a,x)=>a+x.ls.length,0)} ca mỗi tuần)</span></p>
 <div style="max-height:220px;overflow:auto;border:1px solid var(--bd);border-radius:8px;padding:6px 10px">${ks.map(x=>`<label class="chk" style="display:flex;gap:8px;align-items:center;margin:0;padding:4px 0"><input type="checkbox" data-c="bgk" value="${esc(x.k.id)}" ${m.off.includes(x.k.id)?'':'checked'}> <span>${esc(x.k.n)} <span class="mu sm">· ${x.ls.map(l=>DAYS[l.day]+' '+l.slot).join(', ')}</span></span></label>`).join('')||'<p class="empty">Giáo viên này chưa có ca 1-1 nào.</p>'}</div>
 <div class="err" role="alert">${esc(m.err)}</div>
 <div class="acts" style="justify-content:flex-end;margin-top:10px"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit" ${m.from&&m.to&&pick.length?'':'disabled'}>Bàn giao ca</button></div></form>`,1)};
function bgRun(m,dry){const from=m.from,to=m.to,d=m.d,sel=bgKids(from).filter(x=>!m.off.includes(x.k.id));
 if(!from||!to||from===to)return'Hãy chọn giáo viên cũ và giáo viên mới khác nhau';if(!d)return'Hãy chọn ngày tiếp quản';if(!sel.length)return'Chưa chọn bé nào';
 for(const x of sel)for(const l of x.ls){const last=(l.ph||[]).slice(-1)[0];if(last&&d<last.u)return'Ca '+DAYS[l.day]+' '+l.slot+' của '+x.k.n+' đã bàn giao đến '+vd(last.u)+', hãy chọn ngày từ đó trở đi';
  const c=conflict(Object.assign({},l,{gv:to}));if(c)return c+' (bé '+x.k.n+', '+DAYS[l.day]+' '+slotLb(l.slot)+')'}
 const bu=DB.lich.filter(l=>l.type==='bu'&&l.gv===from&&l.date>=d&&sel.some(x=>x.k.id===l.hs));   /* buổi học bù từ ngày tiếp quản trở đi cũng giao cho giáo viên mới */
 for(const l of bu){const c=conflict(Object.assign({},l,{gv:to}));if(c)return c+' (học bù '+vd(l.date)+')'}
 if(dry)return'';
 bu.forEach(l=>{l.gv=to});
 sel.forEach(x=>{x.ls.forEach(l=>{l.ph=(l.ph||[]).concat({g:from,u:d});l.gv=to});
  const tc=Object.assign({},x.k.tc||{});if(tc[from]){if(!tc[to])tc[to]=tc[from];delete tc[from]}
  kSet(x.k,kTs(x.k).filter(i=>i!==from).concat(to),tc)});
 return''}
FORM.bgf=f=>{const m=S.modal;if(!isLead()||!m||m.t!=='bg')return false;const e=bgRun(m,1);if(e){m.err=e;return}
 const n=bgKids(m.from).filter(x=>!m.off.includes(x.k.id)).length,t=m.d;
 ask('Bàn giao '+n+' bé của '+sn(m.from)+' cho '+sn(m.to)+' từ '+vd(t)+'? Các buổi trước ngày này vẫn tính cho '+sn(m.from)+'; '+sn(m.to)+' vẫn điểm danh được cho bé ở các ngày trước.',()=>{const e2=bgRun(m);if(e2){toast(e2);return}S.modal=null;toast('Đã bàn giao '+n+' bé từ '+sn(m.from)+' cho '+sn(m.to)+' (từ '+vd(t)+')')},'Bàn giao')};
