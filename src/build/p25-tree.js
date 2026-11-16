/* ===== Cây mục tiêu: mục tiêu buổi ⇒ mục tiêu ngắn hạn ⇒ mục tiêu dài hạn =====
   - Mục tiêu dài hạn là kế hoạch h:'d'. Mục tiêu ngắn hạn là kế hoạch h:'n', trường `up` giữ mã kế hoạch dài hạn mà nó thuộc về.
   - Mục tiêu buổi là một dòng mục tiêu trong buổi can thiệp, trường `pl` giữ mã kế hoạch ngắn hạn mà dòng đó thuộc về.
   - Dữ liệu cũ chưa có `up` hay `pl` vẫn chạy: dòng buổi gắn vào kế hoạch có cùng mục tiêu; ngắn hạn chưa gắn nằm ở nhóm "chưa gắn".
   - Trạng thái "đạt" của mục tiêu buổi theo số liệu: bé tự làm (mức Độc lập) đúng từ 80% trở lên trong 3 buổi liên tiếp.
     Mục tiêu ngắn hạn và dài hạn chỉ là "Đã đạt" khi nhân viên bấm xác nhận; khi mọi mục tiêu con đã đạt thì hiện "Gần đạt". */
const GTS={dat:['Đã đạt','✓'],gan:['Gần đạt','✓'],tien:['Đang tiến bộ','↗'],luyen:['Cần luyện thêm','!'],moi:['Sắp luyện','○'],tam:['Tạm dừng','‖']};
const gtChip=(st,big)=>`<span class="gt-chip s-${st}${big?' big':''}"><span class="gt-i" aria-hidden="true">${GTS[st][1]}</span>${GTS[st][0]}</span>`;
const gtBar=(pct,st,lb)=>`<div class="gt-bar s-${st}" role="img" aria-label="${esc(lb||'Hoàn thành')} ${pct}%"><i style="width:${Math.max(0,Math.min(100,pct))}%"></i></div>`;

/* trạng thái của MỘT mục tiêu buổi từ các lượt luyện của nó (theo thứ tự thời gian) */
function gtState(rs){const n=rs.length;if(!n)return{st:'moi',pct:0,n:0,run:0,last:null,rs};
 let run=0;for(let i=n-1;i>=0;i--){const r=rs[i];if(r.sup==='I'&&trN(r.tr)>=5&&trOk(r.tr)/trN(r.tr)>=.8)run++;else break}
 const l=avg(rs.slice(-2).map(r=>r.sc)),f=avg(rs.slice(0,2).map(r=>r.sc)),dl=n>=2?l-f:null,st=run>=3?'dat':((dl!=null&&dl>=2)||l>=60)?'tien':'luyen';
 return{st,pct:st==='dat'?100:Math.round(l),n,run,last:rs[n-1],dl,rs}}

/* mục tiêu dài hạn mà kế hoạch ngắn hạn p đang thuộc về (null nếu chưa gắn hoặc mã không còn hợp lệ) */
function gtUp(){return null}   /* đã bỏ tầng dài hạn: mọi kế hoạch là mục tiêu ngắn hạn */
/* kế hoạch mà một dòng mục tiêu trong buổi thuộc về */
function gtItemPlan(k,it,byG){if(it.pl){const p=planBy(it.pl);if(p&&p.k===k)return p}
 const a=byG[it.g];return a?(a.find(p=>p.s!=='dat')||a[0]):null}

/* dựng cây cho một bé: {longs:[nút dài hạn], orph:[nút ngắn hạn chưa gắn], shorts:[mọi nút ngắn hạn]} */
function gtTree(kid){
 const ps=kidPlans(kid),byG={};ps.forEach(p=>(byG[p.g]=byG[p.g]||[]).push(p));
 const recs={},seen={};
 sessOf(kid,'','9999-12-31',true).forEach(s=>s.it.forEach(it=>{const p=gtItemPlan(kid,it,byG);if(!p)return;
  (seen[p.id]=seen[p.id]||{})[it.g]=1;if(!trN(it.tr))return;const sc=recSc(it);if(sc==null)return;
  const o=recs[p.id]=recs[p.id]||{};(o[it.g]=o[it.g]||[]).push({d:s.date,g:it.g,sup:it.sup,tr:it.tr,sc,sg:it.sg||''})}));
 const goalsOf=p=>Object.keys(seen[p.id]||{}).map(g=>Object.assign({g},gtState((recs[p.id]||{})[g]||[]))).sort((a,b)=>(b.last?b.last.d:'')<(a.last?a.last.d:'')?-1:1);
 const alive=n=>n.p.s!=='tam';
 const shorts=ps.map(p=>{const gs=goalsOf(p),dn=gs.filter(x=>x.st==='dat').length,any=gs.some(x=>x.n);
  const pct=p.s==='dat'?100:gs.length?Math.round(avg(gs.map(x=>x.pct))):0,
   st=p.s==='dat'?'dat':p.s==='tam'?'tam':!any?'moi':dn===gs.length?'gan':gs.some(x=>x.st==='dat'||x.st==='tien')?'tien':'luyen';
  return{p,gs,dn,total:gs.length,pct,st,ready:p.s==='dang'&&gs.length>0&&dn===gs.length}});
 const longs=[];
 const orph=shorts.filter(s=>!gtUp(s.p));
 return{longs,orph,shorts}}

/* ---------------- Cổng phụ huynh và báo cáo: chữ lớn, màu và biểu tượng cho từng trạng thái ---------------- */
const gtLast=x=>x.last?`Buổi gần nhất: đúng <b>${trOk(x.last.tr)}/${trN(x.last.tr)}</b> lượt · ${esc(SUP[x.last.sup].p.toLowerCase())}`:'Chưa luyện';
function gtGoals(n,m){const gs=n.gs;if(!gs.length)return'';
 return`<ul class="gtg">${gs.map(x=>`<li class="s-${x.st}"><span class="gt-ic" aria-hidden="true">${GTS[x.st][1]}</span><div><span class="gt-k">Mục tiêu buổi</span><span class="gtg-n">${esc(gName(x.g))}</span><span class="gtg-s">${gtChip(x.st)} ${gtLast(x)}</span>${x.last&&x.last.sg?`<span class="gtg-h"><b>Mục tiêu buổi (SMART):</b> ${esc(x.last.sg)}</span>`:''}${x.rs.length>1?`<span class="gtg-h">Các buổi gần đây: ${x.rs.slice(-5).map(r=>trOk(r.tr)+'/'+trN(r.tr)).join(' → ')}</span>`:''}${m==='pdf'?'':gxHtml(goalOf(x.g),'p')}</div></li>`).join('')}</ul>`}
function gtShort(s,par,m){return`<div class="gts s-${s.st}"><div class="gts-h"><span class="gt-ic" aria-hidden="true">${GTS[s.st][1]}</span><div class="gts-t"><span class="gt-k">Mục tiêu ngắn hạn</span><b>${esc(gName(s.p.g))}</b></div>${gtChip(s.st)}</div>
 <div class="gt-pb">${gtBar(s.pct,s.st)}<b>${s.pct}%</b></div>${s.total?`<p class="gt-sub">${s.dn}/${s.total} mục tiêu buổi đã đạt</p>`:'<p class="gt-sub">Chưa có mục tiêu buổi nào được ghi.</p>'}${gxHtml(goalOf(s.p.g),m==='pdf'?'pdf':'p',{open:1})}${gtGoals(s,m)}</div>`}
function gtParent(kid,o){o=o||{};const T=gtTree(kid),L=T.longs.filter(n=>n.p.s!=='tam'),O=T.orph.filter(s=>s.p.s!=='tam'),m=o.pdf?'pdf':'p';
 if(!L.length&&!O.length)return'<p class="empty">Giáo viên chưa đặt mục tiêu cho bé. Khi có mục tiêu, bé đạt hay chưa đạt sẽ hiện ở đây.</p>';
 const sh=T.shorts.filter(s=>s.p.s!=='tam'),cnt={dat:0,tien:0,luyen:0,moi:0};
 sh.forEach(s=>{cnt[s.st==='gan'?'tien':s.st]++});
 const box=(st,l)=>`<div class="gt-n s-${st}"><span class="gt-ic" aria-hidden="true">${GTS[st][1]}</span><b>${cnt[st]}</b><span>${l}</span></div>`;
 const sum=sh.length?`<div class="gt-sum" role="group" aria-label="Tóm tắt các mục tiêu ngắn hạn">${box('dat','mục tiêu đã đạt')}${box('tien','mục tiêu đang tiến bộ')}${box('luyen','mục tiêu cần luyện thêm')}${box('moi','mục tiêu sắp luyện')}</div>`:'';
 const lg=`<p class="gt-help">Bé <b>đạt</b> một mục tiêu buổi khi tự làm đúng từ 8/10 lượt trở lên trong 3 buổi liên tiếp. Mỗi mục tiêu ngắn hạn gồm nhiều mục tiêu buổi trị liệu.</p>`;
 const mc=(lb,n)=>`<div class="gtp s-${n.st}"><div class="gtp-h"><div><span class="gt-k">${lb}</span><b class="gtp-t">${esc(gName(n.p.g))}</b></div>${gtChip(n.st,1)}</div><div class="gt-pb">${gtBar(n.pct,n.st)}<b>${n.pct}%</b></div></div>`;
 if(o.mini)return sum+`<div class="gtl">${L.map(n=>mc('Mục tiêu dài hạn',n)).join('')}${O.map(n=>mc('Mục tiêu ngắn hạn',n)).join('')}</div>`
  +`<div class="acts" style="margin-top:12px"><button class="btn p" data-a="cptab" data-v="tb">Xem từng mục tiêu của bé</button></div>`;
 const card=n=>`<article class="gtp nb s-${n.st}"><div class="gtp-h"><div><span class="gt-k">Mục tiêu dài hạn</span><h3 class="gtp-t">${esc(gName(n.p.g))}</h3></div>${gtChip(n.st,1)}</div>
  <div class="gt-pb">${gtBar(n.pct,n.st)}<b>${n.pct}%</b></div><p class="gt-sub">${n.total?n.dn+'/'+n.total+' mục tiêu con đã đạt':'Chưa có mục tiêu ngắn hạn.'}</p>
  ${gxHtml(goalOf(n.p.g),m==='pdf'?'pdf':'p',{open:1})}${n.ch.filter(s=>s.p.s!=='tam').map(s=>gtShort(s,1,m)).join('')}${n.gs.length?`<div class="gts"><div class="gts-h"><div class="gts-t"><span class="gt-k">Luyện trực tiếp</span></div></div>${gtGoals(n,m)}</div>`:''}</article>`;
 return sum+lg+L.map(card).join('')+(O.length?`<article class="gtp nb"><div class="gtp-h"><div><span class="gt-k">Mục tiêu ngắn hạn</span></div></div>${O.map(s=>gtShort(s,1,m)).join('')}</article>`:'')}

/* ---------------- Phía nhân viên: cây trong tab Kế hoạch mục tiêu ---------------- */
function gtKidsStaff(n){if(!n.gs.length)return'';
 return`<ul class="gt-ks">${n.gs.map(x=>`<li>${gtChip(x.st)} <span class="gt-gn">${esc(gName(x.g))}</span> <span class="sm mu">${x.n?x.n+' buổi · '+gtLast(x).replace(/<\/?b>/g,''):'chưa luyện'}</span></li>`).join('')}</ul>`}
function gtShortStaff(s){return planRow(s.p)+`<div class="gt-x">${s.total?`<div class="sm"><b>Mục tiêu buổi</b> · ${s.dn}/${s.total} đã đạt · ${s.pct}%</div>`+gtKidsStaff(s):'<div class="sm mu">Chưa có mục tiêu buổi. Khi ghi buổi can thiệp, chọn mục tiêu ngắn hạn này cho từng dòng mục tiêu.</div>'}</div>`}
function gtStaff(k){const T=gtTree(k.id),open=T.shorts.filter(s=>s.p.s!=='dat'),done=T.shorts.filter(s=>s.p.s==='dat');
 let h=`<h3 style="margin-top:12px">Mục tiêu ngắn hạn <span class="mu sm">· ${HZ.n[1]} · ${open.length} mục tiêu</span></h3><p class="sm mu" style="margin:0 0 8px">Chọn mục tiêu từ ngân hàng mục tiêu hoặc tự viết mục tiêu khác. Mỗi mục tiêu ngắn hạn gồm các mục tiêu buổi trị liệu (các dòng mục tiêu trong buổi can thiệp); có thể ghi thêm nội dung theo SMART cho mục tiêu buổi.</p>`;
 h+=open.length?open.map(gtShortStaff).join(''):'<p class="mu sm" style="margin:0 0 8px">Chưa có mục tiêu ngắn hạn. Bấm “Chọn mục tiêu từ ngân hàng”.</p>';
 if(done.length)h+=`<h3 style="margin-top:14px">Đã đạt <span class="mu sm">· ${done.length} mục tiêu</span></h3>`+done.sort((a,b)=>(b.p.dt||'')<(a.p.dt||'')?-1:1).map(gtShortStaff).join('');
 return{html:h,T}}

/* ---------------- Thao tác ---------------- */
