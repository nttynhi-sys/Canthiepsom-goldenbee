/* ===== 4. Phân công ===== */
const isGrStaff=id=>DB.groups.some(g=>grHas(g,id));
const pool11=()=>DB.staff.filter(s=>isTeacher(s)&&s.st==='dang'&&!isGrStaff(s.id));
const poolBt=()=>DB.staff.filter(s=>isTeacher(s)&&s.st==='dang'&&!DB.lich.some(l=>l.type==='11'&&l.gv===s.id&&l.day<=5));
VIEWS.pc=()=>{const p=S.pc=Object.assign({tab:'gv',q:'',gv:''},S.pc);
 return head('Phân công','Giáo viên phụ trách từng trẻ và các nhóm bán trú')+tabsH([['gv','Giáo viên 1-1'],['bt','Nhóm bán trú'],['kl','Khối lượng công việc']],p.tab,'pctab')+(p.tab==='gv'?pcGV():p.tab==='bt'?pcBt():pcLoad())};
ACT.pctab=v=>{S.pc.tab=v};
INP.pcq=v=>{S.pc.q=v;S.pg.pc=1};
CHG.pcg=v=>{S.pc.gv=v;S.pg.pc=1};
function pcGV(){const p=S.pc,q=p.q.toLowerCase(),ks=DB.kids.filter(k=>k.st==='dang'&&wk11(k.id)>0&&(!p.gv||k.gv===p.gv)&&(!q||k.n.toLowerCase().includes(q))),pp=pg('pc',ks,12),P=pool11();
 return`<div class="card"><div class="f2" style="margin-bottom:12px"><div><label for="pcq">Tìm theo tên bé</label><input id="pcq" data-i="pcq" value="${esc(p.q)}"></div><div><label for="pcg">Lọc theo giáo viên</label><select id="pcg" data-c="pcg"><option value="">Tất cả</option>${opts(P.map(s=>[s.id,tName(s)]),p.gv)}</select></div></div>`
 +tbl(['Trẻ','Buổi 1-1/tuần','Giáo viên hiện tại','Chuyển sang giáo viên khác'],pp.rows.map(k=>`<tr><td><b>${esc(k.n)}</b><br><span class="sm mu">${age(k.dob)} · ${esc(k.nd)}</span></td><td>${wk11(k.id)}</td><td>${esc(sn(k.gv))}</td><td><label class="sm" for="mv-${k.id}" style="position:absolute;left:-9999px">Chuyển ${esc(k.n)}</label><select id="mv-${k.id}" data-c="pcmv" data-k="${k.id}" style="max-width:240px"><option value="">Chọn giáo viên</option>${opts(P.filter(s=>s.id!==k.gv).map(s=>[s.id,tName(s)+' ('+DB.kids.filter(x=>x.gv===s.id&&x.st==='dang').length+' trẻ)']),'')}</select></td></tr>`).join(''),'Không có trẻ phù hợp.')+pp.html
 +`<p class="note sm" style="margin-top:10px">Khi chuyển, hệ thống kiểm tra giáo viên mới có rảnh đúng các khung giờ cố định của bé không. Nếu trùng sẽ báo rõ và không chuyển.</p></div>`}
function reassign(k,gv,dry){const ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id);
 for(const l of ls){const c=conflict(Object.assign({},l,{gv}));if(c)return c+' (bé học '+DAYS[l.day]+' '+slotLb(l.slot)+')'}
 if(!dry){ls.forEach(l=>l.gv=gv);k.gv=gv}return''}
CHG.pcmv=(v,t)=>{const k=kidBy(t.dataset.k);if(!v||!k)return;const c=reassign(k,v,1);
 if(c){toast(c);return}
 ask('Chuyển bé '+k.n+' từ '+sn(k.gv)+' sang '+sn(v)+'? Mọi buổi 1-1 cố định của bé sẽ do giáo viên mới phụ trách.',()=>{reassign(k,v);toast('Đã chuyển bé '+k.n+' sang '+sn(v))},'Chuyển')};
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
  if(DB.lich.some(l=>l.type==='11'&&l.gv===sid&&l.day<=5)){toast(s.n+' đang có buổi 1-1 cố định từ thứ Hai đến thứ Sáu nên chưa thể phụ trách lớp bán trú');return}
  grSet(g,ts.concat(sid));toast('Đã thêm '+s.n+' vào '+g.n)}
 else{if(!ts.includes(sid))return;grSet(g,ts.filter(x=>x!==sid));toast('Đã bỏ '+s.n+' khỏi '+g.n)}};
CHG.pcmvg=(v,t)=>{const k=kidBy(t.dataset.k);if(k&&v){k.gr=v;toast('Đã chuyển '+k.n+' sang '+grBy(v).n)}};
function pcLoad(){const rows=DB.staff.filter(s=>isTeacher(s)&&s.st==='dang').map(s=>{const gr=grOf(s.id),n=DB.lich.filter(l=>l.type==='11'&&l.gv===s.id).length,ks=DB.kids.filter(k=>k.gv===s.id&&k.st==='dang').length;return{s,gr,n,ks,u:Math.min(100,Math.round(n*100/LOAD_MAX))}});
 return`<div class="card">`+tbl(['Giáo viên','Vai trò','Trẻ 1-1','Buổi 1-1/tuần','Mức tải so với '+LOAD_MAX+' buổi/tuần'],rows.map(r=>`<tr><td><b>${esc(r.s.n)}</b></td><td>${esc(r.s.pos)}${r.gr?'<br><span class="sm mu">'+esc(r.gr.n)+' · giáo viên bán trú'+'</span>':''}</td><td>${r.ks}</td><td>${r.n}</td><td style="min-width:160px"><div style="display:flex;gap:8px;align-items:center"><div style="flex:1">${bar(r.u,r.u>75?'var(--er)':'')}</div><span class="sm">${r.u}%</span></div></td></tr>`).join(''))+`<p class="sm mu" style="margin-top:8px">Khung giờ 1-1 là ${DAY_OPEN}–${DAY_CLOSE}, ${SLOTS.length} ca mỗi ngày (mỗi ca ${SLOT_MIN} phút), thứ Hai đến thứ Bảy. Mức tải tính theo ${LOAD_MAX} buổi 1-1 mỗi tuần là đủ tải.</p></div>`}
