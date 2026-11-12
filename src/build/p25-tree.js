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
function gtUp(p){const l=p&&p.h==='n'&&p.up?planBy(p.up):null;return l&&l.k===p.k&&l.h==='d'?l:null}
/* kế hoạch mà một dòng mục tiêu trong buổi thuộc về */
function gtItemPlan(k,it,byG){if(it.pl){const p=planBy(it.pl);if(p&&p.k===k)return p}
 const a=byG[it.g];return a?(a.find(p=>p.s!=='dat')||a[0]):null}

/* dựng cây cho một bé: {longs:[nút dài hạn], orph:[nút ngắn hạn chưa gắn], shorts:[mọi nút ngắn hạn]} */
function gtTree(kid){
 const ps=kidPlans(kid),byG={};ps.forEach(p=>(byG[p.g]=byG[p.g]||[]).push(p));
 const recs={},seen={};
 sessOf(kid,'','9999-12-31',true).forEach(s=>s.it.forEach(it=>{const p=gtItemPlan(kid,it,byG);if(!p)return;
  (seen[p.id]=seen[p.id]||{})[it.g]=1;if(!trN(it.tr))return;const sc=recSc(it);if(sc==null)return;
  const o=recs[p.id]=recs[p.id]||{};(o[it.g]=o[it.g]||[]).push({d:s.date,g:it.g,sup:it.sup,tr:it.tr,sc})}));
 const goalsOf=p=>Object.keys(seen[p.id]||{}).map(g=>Object.assign({g},gtState((recs[p.id]||{})[g]||[]))).sort((a,b)=>(b.last?b.last.d:'')<(a.last?a.last.d:'')?-1:1);
 const alive=n=>n.p.s!=='tam';
 const shorts=ps.filter(p=>p.h==='n').map(p=>{const gs=goalsOf(p),dn=gs.filter(x=>x.st==='dat').length,any=gs.some(x=>x.n);
  const pct=p.s==='dat'?100:gs.length?Math.round(avg(gs.map(x=>x.pct))):0,
   st=p.s==='dat'?'dat':p.s==='tam'?'tam':!any?'moi':dn===gs.length?'gan':gs.some(x=>x.st==='dat'||x.st==='tien')?'tien':'luyen';
  return{p,gs,dn,total:gs.length,pct,st,ready:p.s==='dang'&&gs.length>0&&dn===gs.length}});
 const longs=ps.filter(p=>p.h==='d').map(p=>{const ch=shorts.filter(s=>gtUp(s.p)&&s.p.up===p.id),gs=goalsOf(p),live=ch.filter(alive),
   units=live.map(s=>s.pct).concat(gs.map(x=>x.pct)),dn=live.filter(s=>s.st==='dat').length+gs.filter(x=>x.st==='dat').length,total=live.length+gs.length,
   any=live.some(s=>s.gs.some(x=>x.n))||gs.some(x=>x.n),
   pct=p.s==='dat'?100:units.length?Math.round(avg(units)):0,
   st=p.s==='dat'?'dat':p.s==='tam'?'tam':!any?'moi':total&&dn===total?'gan':(live.some(s=>s.st==='dat'||s.st==='gan'||s.st==='tien')||gs.some(x=>x.st==='dat'||x.st==='tien'))?'tien':'luyen';
  return{p,ch,gs,dn,total,pct,st,ready:p.s==='dang'&&total>0&&dn===total}});
 const orph=shorts.filter(s=>!gtUp(s.p));
 return{longs,orph,shorts}}

/* ---------------- Cổng phụ huynh và báo cáo: chữ lớn, màu và biểu tượng cho từng trạng thái ---------------- */
const gtLast=x=>x.last?`Buổi gần nhất: đúng <b>${trOk(x.last.tr)}/${trN(x.last.tr)}</b> lượt · ${esc(SUP[x.last.sup].p.toLowerCase())}`:'Chưa luyện';
function gtGoals(n,m){const gs=n.gs;if(!gs.length)return'';
 return`<ul class="gtg">${gs.map(x=>`<li class="s-${x.st}"><span class="gt-ic" aria-hidden="true">${GTS[x.st][1]}</span><div><span class="gt-k">Mục tiêu buổi</span><span class="gtg-n">${esc(gName(x.g))}</span><span class="gtg-s">${gtChip(x.st)} ${gtLast(x)}</span>${x.rs.length>1?`<span class="gtg-h">Các buổi gần đây: ${x.rs.slice(-5).map(r=>trOk(r.tr)+'/'+trN(r.tr)).join(' → ')}</span>`:''}${m==='pdf'?'':gxHtml(goalOf(x.g),'p')}</div></li>`).join('')}</ul>`}
function gtShort(s,par,m){return`<div class="gts s-${s.st}"><div class="gts-h"><span class="gt-ic" aria-hidden="true">${GTS[s.st][1]}</span><div class="gts-t"><span class="gt-k">Mục tiêu ngắn hạn</span><b>${esc(gName(s.p.g))}</b></div>${gtChip(s.st)}</div>
 <div class="gt-pb">${gtBar(s.pct,s.st)}<b>${s.pct}%</b></div>${s.total?`<p class="gt-sub">${s.dn}/${s.total} mục tiêu buổi đã đạt</p>`:'<p class="gt-sub">Chưa có mục tiêu buổi nào được ghi.</p>'}${gxHtml(goalOf(s.p.g),m==='pdf'?'pdf':'p',{open:1})}${gtGoals(s,m)}</div>`}
function gtParent(kid,o){o=o||{};const T=gtTree(kid),L=T.longs.filter(n=>n.p.s!=='tam'),O=T.orph.filter(s=>s.p.s!=='tam'),m=o.pdf?'pdf':'p';
 if(!L.length&&!O.length)return'<p class="empty">Giáo viên chưa đặt mục tiêu cho bé. Khi có mục tiêu, bé đạt hay chưa đạt sẽ hiện ở đây.</p>';
 const sh=T.shorts.filter(s=>s.p.s!=='tam'),cnt={dat:0,tien:0,luyen:0,moi:0};
 sh.forEach(s=>{cnt[s.st==='gan'?'tien':s.st]++});
 const box=(st,l)=>`<div class="gt-n s-${st}"><span class="gt-ic" aria-hidden="true">${GTS[st][1]}</span><b>${cnt[st]}</b><span>${l}</span></div>`;
 const sum=sh.length?`<div class="gt-sum" role="group" aria-label="Tóm tắt các mục tiêu ngắn hạn">${box('dat','mục tiêu đã đạt')}${box('tien','mục tiêu đang tiến bộ')}${box('luyen','mục tiêu cần luyện thêm')}${box('moi','mục tiêu sắp luyện')}</div>`:'';
 const lg=`<p class="gt-help">Bé <b>đạt</b> một mục tiêu buổi khi tự làm đúng từ 8/10 lượt trở lên trong 3 buổi liên tiếp. Mỗi mục tiêu dài hạn gồm nhiều mục tiêu ngắn hạn, mỗi mục tiêu ngắn hạn gồm nhiều mục tiêu buổi.</p>`;
 const mc=(lb,n)=>`<div class="gtp s-${n.st}"><div class="gtp-h"><div><span class="gt-k">${lb}</span><b class="gtp-t">${esc(gName(n.p.g))}</b></div>${gtChip(n.st,1)}</div><div class="gt-pb">${gtBar(n.pct,n.st)}<b>${n.pct}%</b></div></div>`;
 if(o.mini)return sum+`<div class="gtl">${L.map(n=>mc('Mục tiêu dài hạn',n)).join('')}${O.map(n=>mc('Mục tiêu ngắn hạn',n)).join('')}</div>`
  +`<div class="acts" style="margin-top:12px"><button class="btn p" data-a="cptab" data-v="tb">Xem từng mục tiêu của bé</button></div>`;
 const card=n=>`<article class="gtp nb s-${n.st}"><div class="gtp-h"><div><span class="gt-k">Mục tiêu dài hạn</span><h3 class="gtp-t">${esc(gName(n.p.g))}</h3></div>${gtChip(n.st,1)}</div>
  <div class="gt-pb">${gtBar(n.pct,n.st)}<b>${n.pct}%</b></div><p class="gt-sub">${n.total?n.dn+'/'+n.total+' mục tiêu con đã đạt':'Chưa có mục tiêu ngắn hạn.'}</p>
  ${gxHtml(goalOf(n.p.g),m==='pdf'?'pdf':'p',{open:1})}${n.ch.filter(s=>s.p.s!=='tam').map(s=>gtShort(s,1,m)).join('')}${n.gs.length?`<div class="gts"><div class="gts-h"><div class="gts-t"><span class="gt-k">Luyện trực tiếp</span></div></div>${gtGoals(n,m)}</div>`:''}</article>`;
 return sum+lg+L.map(card).join('')+(O.length?`<article class="gtp nb"><div class="gtp-h"><div><span class="gt-k">Mục tiêu ngắn hạn khác</span></div></div>${O.map(s=>gtShort(s,1,m)).join('')}</article>`:'')}

/* ---------------- Phía nhân viên: cây trong tab Kế hoạch mục tiêu ---------------- */
function gtKidsStaff(n){if(!n.gs.length)return'';
 return`<ul class="gt-ks">${n.gs.map(x=>`<li>${gtChip(x.st)} <span class="gt-gn">${esc(gName(x.g))}</span> <span class="sm mu">${x.n?x.n+' buổi · '+gtLast(x).replace(/<\/?b>/g,''):'chưa luyện'}</span></li>`).join('')}</ul>`}
function gtUpSel(p,longs){return`<div class="gt-up"><label class="sm" for="gu-${p.id}">Thuộc mục tiêu dài hạn</label>${longs.length?`<select id="gu-${p.id}" data-c="plup" data-v="${p.id}">${opts([['','— Chưa gắn —']].concat(longs.map(l=>[l.id,gName(l.g)])),gtUp(p)?p.up:'')}</select>`:'<span class="sm mu">Chưa có mục tiêu dài hạn nào để gắn</span>'}</div>`}
function gtShortStaff(s,longs){return planRow(s.p)+`<div class="gt-x">${s.total?`<div class="sm"><b>Mục tiêu buổi</b> · ${s.dn}/${s.total} đã đạt · ${s.pct}%</div>`+gtKidsStaff(s):'<div class="sm mu">Chưa có mục tiêu buổi. Khi ghi buổi can thiệp, chọn mục tiêu ngắn hạn này cho từng dòng mục tiêu.</div>'}${gtUpSel(s.p,longs)}</div>`}
function gtLongStaff(n,longs){const sh=n.ch;
 return`<section class="gt-b s-${n.st}">${planRow(n.p)}<div class="gt-x"><div class="gt-pb">${gtBar(n.pct,n.st)}<b>${n.pct}%</b></div><div class="sm">${n.total?n.dn+'/'+n.total+' mục tiêu con đã đạt':'Chưa có mục tiêu ngắn hạn thuộc mục tiêu này'}</div>
  <div class="acts" style="margin-top:6px"><button class="btn s p" data-a="pkopenu" data-v="${n.p.id}">Thêm mục tiêu ngắn hạn</button></div></div>
  <div class="gt-in">${sh.map(s=>gtShortStaff(s,longs)).join('')}${n.gs.length?`<div class="gt-x"><div class="sm"><b>Luyện trực tiếp mục tiêu dài hạn</b></div>${gtKidsStaff(n)}</div>`:''}</div></section>`}
function gtStaff(k){const T=gtTree(k.id),longs=T.longs.map(n=>n.p).filter(l=>l.s!=='dat');
 const open=T.longs.filter(n=>n.p.s!=='dat'),done=T.longs.filter(n=>n.p.s==='dat'),orph=T.orph;
 let h=`<h3 style="margin-top:12px">Mục tiêu dài hạn <span class="mu sm">· ${HZ.d[1]} · ${open.length} mục tiêu</span></h3><p class="sm mu" style="margin:0 0 8px">Mục tiêu buổi ⇒ mục tiêu ngắn hạn ⇒ mục tiêu dài hạn. Mỗi mục tiêu dài hạn gồm các mục tiêu ngắn hạn; mỗi mục tiêu ngắn hạn gồm các mục tiêu buổi (các dòng mục tiêu trong buổi can thiệp).</p>`;
 h+=open.length?open.map(n=>gtLongStaff(n,longs)).join(''):'<p class="mu sm" style="margin:0 0 8px">Chưa có mục tiêu dài hạn. Bấm “Chọn mục tiêu từ ngân hàng”, chọn loại “Dài hạn”.</p>';
 const oa=orph.filter(s=>s.p.s!=='dat');
 h+=`<h3 style="margin-top:14px">Mục tiêu ngắn hạn chưa gắn mục tiêu dài hạn <span class="mu sm">· ${oa.length} mục tiêu</span></h3>`;
 h+=oa.length?(longs.length?`<div class="acts" style="margin:0 0 6px"><button class="btn s" data-a="plauto" data-v="${k.id}">Tự gắn theo lĩnh vực</button><span class="sm mu">Gắn mỗi mục tiêu ngắn hạn vào mục tiêu dài hạn cùng lĩnh vực.</span></div>`:'')+oa.map(s=>gtShortStaff(s,longs)).join(''):'<p class="mu sm" style="margin:0 0 8px">Mọi mục tiêu ngắn hạn đều đã được gắn vào một mục tiêu dài hạn.</p>';
 if(done.length||orph.some(s=>s.p.s==='dat')){
  h+=`<h3 style="margin-top:14px">Đã đạt <span class="mu sm">· ${done.length+orph.filter(s=>s.p.s==='dat').length} mục tiêu</span></h3>`
   +done.sort((a,b)=>(b.p.dt||'')<(a.p.dt||'')?-1:1).map(n=>gtLongStaff(n,longs)).join('')+orph.filter(s=>s.p.s==='dat').map(s=>gtShortStaff(s,longs)).join('')}
 return{html:h,T}}

/* ---------------- Thao tác ---------------- */
CHG.plup=(v,t)=>{const p=planBy(t.dataset.v);if(!p||p.h!=='n'||!canKid(p.k))return false;
 const l=v?planBy(v):null;if(l&&l.k===p.k&&l.h==='d')p.up=v;else delete p.up};
ACT.plauto=v=>{if(!canKid(v))return false;const ls=kidPlans(v).filter(p=>p.h==='d'&&p.s!=='dat');let n=0;
 kidPlans(v).filter(p=>p.h==='n'&&p.s!=='dat'&&!gtUp(p)).forEach(p=>{const dm=gDom(p.g),l=ls.find(x=>x.s==='dang'&&gDom(x.g)===dm)||ls.find(x=>gDom(x.g)===dm);if(l){p.up=l.id;n++}});
 toast(n?'Đã gắn '+n+' mục tiêu ngắn hạn vào mục tiêu dài hạn cùng lĩnh vực':'Không có mục tiêu ngắn hạn nào cùng lĩnh vực với một mục tiêu dài hạn')};
ACT.pkopenu=v=>{const l=planBy(v);if(!l||!canKid(l.k))return false;
 S.modal={t:'gp',mode:'plan',k:l.k,up:l.id,back:S.modal&&S.modal.t==='hs'?S.modal:null,f:{dom:gDom(l.g),src:'',head:'',age:'',q:''},sel:[],hz:'n'};S.pg.gp=1};
/* mục tiêu dài hạn còn mở cùng lĩnh vực với mục tiêu g (để gắn mặc định cho mục tiêu ngắn hạn mới) */
const gtAutoUp=(k,g)=>{const dm=gDom(g),ls=kidPlans(k).filter(p=>p.h==='d'&&p.s!=='dat'),l=ls.find(x=>x.s==='dang'&&gDom(x.g)===dm);return l?l.id:''};
