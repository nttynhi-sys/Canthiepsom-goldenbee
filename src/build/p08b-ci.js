/* ===== 3b. Can thiệp cá nhân: kế hoạch mục tiêu, buổi can thiệp, ngân hàng mục tiêu ===== */
const trunc=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
const domTag=(d,g)=>g&&isPlay(g)?`<span class="tag gy" title="Chơi (thuộc lĩnh vực ${esc(DM[d].n)})">Chơi</span>`:`<span class="tag gy" title="${esc(DM[d].n)}">${esc(DM[d].s)}</span>`;
const supTag=s=>`<span class="sp sp-${s}" title="${esc(SUP[s].n+': '+SUP[s].h)}">${esc(SUP[s].n)}</span>`;
const strip=tr=>`<span class="trs" role="img" aria-label="${trOk(tr)} lượt đúng trên ${trN(tr)} lượt">${tr.split('').map(c=>`<i class="${c==='V'?'tv':c==='X'?'tx':'to'}"></i>`).join('')}</span>`;
const kidGV=k=>k.gv||(grBy(k.gr)||{}).gv||'';
const canEditSess=s=>!!U&&canKid(s.k)&&(isLead()||(isGV()&&(s.by===U.id||kidGV(kidBy(s.k)||{})===U.id)&&s.date>=addD(TODAY,-14)));
const planBy=id=>DB.plans.find(p=>p.id===id);
function addPlanItem(k,g,h,up){if(DB.plans.some(p=>p.k===k&&p.g===g&&p.s!=='dat'))return false;const o={id:'p'+uid(),k,g,h,s:'dang',from:TODAY,due:addD(TODAY,HZ[h][2]),by:U?U.id:''},l=h==='n'&&up?planBy(up):null;if(l&&l.k===k&&l.h==='d')o.up=up;DB.plans.push(o);return o.id}

/* ---------- Kế hoạch mục tiêu của từng bé ---------- */
function planRow(p){const g=goalOf(p.g),m=masteryOf(p.k,p.g),lr=m.last,ready=m.ready&&p.s==='dang';
 const spark=m.rs.slice(-8).map(r=>{const sc=recSc(r);return`<i style="height:${Math.max(8,sc)}%" title="${sc}/100"></i>`}).join('');
 return`<div class="pl ${p.s==='dat'?'dn':''}"><div class="pl-m"><b>${esc(g?g.n:'(mục tiêu đã xóa)')}</b><div class="sm mu">${g?esc(g.t)+' · '+esc(gSrc(g))+(g.a?' · '+esc(g.a):''):''}</div>
 <div class="pl-t">${g?domTag(g.d,g):''} ${tg(PST[p.s][0],PST[p.s][1])}${ready?' '+tg('Đủ điều kiện đạt','ok'):''} <span class="sm mu">Từ ${vdm(p.from)} · hạn ${vdm(p.due)}${p.dt?' · đạt '+vdm(p.dt):''}</span></div></div>
 <div class="pl-r">${lr?`${supTag(lr.sup)} <b>${trPct(lr.tr)}%</b><span class="spk" aria-hidden="true">${spark}</span><span class="sm mu">${m.cnt} buổi</span>`:'<span class="sm mu">Chưa có số liệu</span>'}</div>
 <div class="pl-a">${p.s==='dang'?`<button class="btn s" data-a="plok" data-v="${p.id}">Đánh dấu đạt</button><button class="btn s" data-a="pltam" data-v="${p.id}">Tạm dừng</button>`:`<button class="btn s" data-a="plre" data-v="${p.id}">${p.s==='dat'?'Mở lại':'Tiếp tục'}</button>`}<button class="btn s" data-a="plhz" data-v="${p.id}">${p.h==='n'?'Chuyển sang dài hạn':'Chuyển sang ngắn hạn'}</button><button class="btn s no" data-a="pldel" data-v="${p.id}">Bỏ</button></div></div>`}
function hsPlan(k){const ps=kidPlans(k.id),done=ps.filter(p=>p.s==='dat'),tr=gtStaff(k),T=tr.T,ready=T.shorts.concat(T.longs).filter(n=>n.ready);
 const sug=done.filter(p=>p.dt&&p.dt>=addD(TODAY,-60)).map(p=>nextOf(p.g)).filter(g=>g&&!ps.some(q=>q.g===g.id)).slice(0,3);
 let h=`<div class="acts" style="margin-bottom:12px"><button class="btn p" data-a="pkopen" data-v="${k.id}">Chọn mục tiêu từ ngân hàng</button><button class="btn" data-a="senew" data-v="${k.id}">Ghi buổi can thiệp</button></div>`;
 if(ready.length)h+=`<div class="note" style="margin-bottom:12px"><b>${ready.length} mục tiêu đủ điều kiện đạt</b> (mọi mục tiêu con đã đạt: bé tự làm đúng từ 80% trở lên trong 3 buổi liên tiếp): ${ready.map(n=>esc(gName(n.p.g))).join('; ')}. Hãy kiểm tra rồi bấm “Đánh dấu đạt”.</div>`;
 h+=tr.html;
 if(sug.length)h+=`<div class="note" style="margin-top:12px"><b>Gợi ý mục tiêu kế tiếp</b> (liền sau mục tiêu vừa đạt trong ngân hàng mục tiêu)${sug.map(g=>`<div class="rw"><span>${esc(g.n)}<br><span class="sm mu">${esc(gSrc(g))}</span></span><button class="btn s p" data-a="plnext" data-v="${k.id}|${g.id}">Thêm vào kế hoạch</button></div>`).join('')}</div>`;
 return h}
const planBack=k=>{S.modal={t:'hs',id:k,tab:'kh'}};
ACT.plok=v=>{const p=planBy(v);if(p){p.s='dat';p.dt=TODAY;toast('Đã đánh dấu đạt: '+trunc(gName(p.g),40))}};
ACT.pltam=v=>{const p=planBy(v);if(p)p.s='tam'};
ACT.plre=v=>{const p=planBy(v);if(p){p.s='dang';delete p.dt}};
ACT.plhz=v=>{const p=planBy(v);if(p){p.h=p.h==='n'?'d':'n';p.due=addD(p.from,HZ[p.h][2]);delete p.up;if(p.h==='n')DB.plans.forEach(q=>{if(q.up===p.id)delete q.up})}};
ACT.pldel=v=>{const p=planBy(v);if(!p)return false;const nc=p.h==='d'?DB.plans.filter(q=>q.up===v).length:0;ask('Bỏ mục tiêu “'+gName(p.g)+'” khỏi kế hoạch? Số liệu các buổi đã ghi vẫn được giữ lại.'+(nc?' '+nc+' mục tiêu ngắn hạn thuộc mục tiêu này sẽ chuyển sang nhóm chưa gắn mục tiêu dài hạn.':''),()=>{DB.plans.forEach(q=>{if(q.up===v)delete q.up});DB.plans=DB.plans.filter(x=>x.id!==v);planBack(p.k)},'Bỏ')};
ACT.plnext=v=>{const [k,g]=v.split('|'),src=DB.plans.find(p=>p.k===k&&p.s==='dat'&&nextOf(p.g)&&nextOf(p.g).id===g);if(addPlanItem(k,g,'n',src&&src.h==='n'?src.up:''))toast('Đã thêm vào kế hoạch ngắn hạn')};

/* ---------- Danh sách buổi can thiệp ---------- */
function sessCard(s,showKid){const k=kidBy(s.k),pl=s.st==='kh',rs=s.it.filter(i=>trN(i.tr)),pc=rs.length?Math.round(avg(rs.map(recSc))):null;
 return`<div class="sess"><div class="sess-h"><div><b>${DAYS[dow(s.date)]} ${vd(s.date)}</b>${showKid&&k?' · <b>'+esc(k.n)+'</b>':''} <span class="sm mu">· ${esc(given(sn(s.by)))}</span> ${pl?tg('Kế hoạch','y'):tg('Đã ghi','ok')}${pc!=null?' <span class="sm mu">chỉ số tự làm '+pc+'</span>':''}</div><div class="acts"><button class="btn s" data-a="sesview" data-v="${s.id}">Xem</button>${canEditSess(s)?`<button class="btn s ${pl?'p':''}" data-a="seedit" data-v="${s.id}">${pl?'Ghi kết quả':'Sửa'}</button>`:''}</div></div>
 <div class="sess-d">${(s.dom||[]).map(domTag).join(' ')}</div>
 <ul class="sess-i">${s.it.map(i=>`<li><span class="gn">${esc(gName(i.g))}</span> ${supTag(i.sup)} ${trN(i.tr)?strip(i.tr)+' <b>'+trPct(i.tr)+'%</b>':'<span class="sm mu">chưa ghi kết quả</span>'}</li>`).join('')}</ul>
 ${s.note?`<p class="sm"><b>Nhận xét:</b> ${esc(s.note)}</p>`:''}${s.home?`<p class="sm"><b>Gợi ý ở nhà:</b> ${esc(s.home)}</p>`:''}</div>`}
function hsSess(k){const ss=sessOf(k.id,'','9999-12-31',true).reverse();
 return`<div class="acts" style="margin-bottom:12px"><button class="btn p" data-a="senew" data-v="${k.id}">Ghi buổi can thiệp</button><span class="sm mu">${ss.filter(s=>s.st==='xong').length} buổi đã ghi${ss.some(s=>s.st==='kh')?', '+ss.filter(s=>s.st==='kh').length+' buổi kế hoạch':''}</span></div>`+(ss.length?ss.slice(0,10).map(s=>sessCard(s,false)).join(''):'<p class="empty">Chưa có buổi can thiệp nào. Bấm “Ghi buổi can thiệp” để bắt đầu.</p>')+(ss.length>10?'<p class="sm mu">Hiển thị 10 buổi gần nhất.</p>':'')}
ACT.sesview=v=>{S.modal={t:'sev',id:v,back:S.modal&&S.modal.t==='hs'?S.modal:null}};
MODALS.sev=()=>{const s=DB.sess.find(x=>x.id===S.modal.id);if(!s||!canKid(s.k)){S.modal=null;return''}const k=kidBy(s.k),pl=s.st==='kh';
 return mdl('Buổi can thiệp · '+k.n,`<p class="mu sm" style="margin-bottom:10px">${DAYN[dow(s.date)]}, ${vd(s.date)} · Giáo viên ${esc(sn(s.by))} · ${pl?'Kế hoạch buổi, chưa ghi kết quả':'Đã ghi kết quả'}</p><div class="sess-d" style="margin-bottom:8px">${(s.dom||[]).map(domTag).join(' ')}</div>`
 +tbl(['Mục tiêu','Mức hỗ trợ','Kết quả','>Đúng','>Chỉ số tự làm'],s.it.map(i=>{const g=goalOf(i.g),sc=recSc(i);return`<tr><td>${esc(g?g.n:'(mục tiêu đã xóa)')}<br><span class="sm mu">${g?esc(g.t)+' · '+esc(gSrc(g)):''}</span>${i.nt?`<br><span class="sm">Ghi chú: ${esc(i.nt)}</span>`:''}</td><td>${supTag(i.sup)}</td><td>${trN(i.tr)?strip(i.tr):'<span class="sm mu">Chưa ghi</span>'}</td><td class="r nw">${trN(i.tr)?trOk(i.tr)+'/'+trN(i.tr)+' ('+trPct(i.tr)+'%)':'–'}</td><td class="r">${sc==null?'–':sc}</td></tr>`}).join(''))
 +(s.note?`<p style="margin-top:10px"><b>Nhận xét:</b> ${esc(s.note)}</p>`:'')+(s.home?`<p style="margin-top:6px"><b>Gợi ý luyện tập ở nhà:</b> ${esc(s.home)}</p>`:'')
 +`<div class="acts" style="margin-top:14px;justify-content:flex-end">${S.modal.back?'<button class="btn" data-a="sevback">Quay lại hồ sơ bé</button>':''}${canEditSess(s)?`<button class="btn no" data-a="sedel" data-v="${s.id}">Xóa buổi</button><button class="btn p" data-a="seedit" data-v="${s.id}">${pl?'Ghi kết quả':'Sửa buổi'}</button>`:''}</div>`,1)};
ACT.sevback=()=>{S.modal=S.modal.back||null};
ACT.sedel=v=>{const s=DB.sess.find(x=>x.id===v);if(!s||!canEditSess(s))return false;const back=S.modal.back||null;ask('Xóa buổi can thiệp ngày '+vd(s.date)+' của bé '+kn(s.k)+'? Số liệu của buổi này sẽ không còn trong biểu đồ tiến bộ.',()=>{DB.sess=DB.sess.filter(x=>x.id!==v);S.modal=back;toast('Đã xóa buổi can thiệp')},'Xóa')};

/* ---------- Biểu mẫu ghi buổi can thiệp (theo mẫu ghi dữ liệu của Trung tâm) ---------- */
function seStart(o){const k=kidBy(o.k);if(!k||!canKid(k.id)){toast('Bạn chưa có quyền ghi buổi can thiệp cho bé này');return false}
 const back=S.modal&&S.modal.t==='hs'?S.modal:null,ex=o.id?DB.sess.find(s=>s.id===o.id):DB.sess.find(s=>s.k===o.k&&s.date===o.date&&(isLead()||s.by===U.id));
 if(ex){S.modal={t:'se',id:ex.id,k:ex.k,date:ex.date,by:ex.by,dom:(ex.dom||[]).slice(),it:ex.it.map(i=>Object.assign({nt:''},i,{pl:sePlOf(ex.k,i)})),note:ex.note||'',home:ex.home||'',back};return}
 const m={t:'se',id:'',k:o.k,date:o.date,by:isGV()?U.id:(kidGV(k)||U.id),dom:[],it:[],note:'',home:'',back};
 const act=kidPlans(o.k,'dang'),pool=act.some(p=>p.h==='n')?act.filter(p=>p.h==='n'):act,T=gtTree(o.k);
 pool.sort((a,b)=>(a.h<b.h?1:a.h>b.h?-1:0)||((lastRec(o.k,a.g)||{d:''}).d<(lastRec(o.k,b.g)||{d:''}).d?-1:1)).slice(0,3).forEach(p=>{const nd=T.shorts.find(s=>s.p.id===p.id),op=nd?nd.gs.find(x=>x.st!=='dat'):null;seAddTo(m,[op?op.g:p.g],p.h==='n'?p.id:'')});
 S.modal=m}
/* pl: mã kế hoạch ngắn hạn mà dòng mục tiêu này thuộc về; bỏ trống thì lấy theo lần luyện trước hoặc kế hoạch có cùng mục tiêu */
function sePlOf(k,i){const p=i.pl?planBy(i.pl):null;if(p&&p.k===k&&p.h==='n')return p.id;const o=kidPlans(k).find(q=>q.g===i.g&&q.h==='n'&&q.s!=='dat')||kidPlans(k).find(q=>q.g===i.g&&q.h==='n');return o?o.id:''}
function seAddTo(m,ids,pl){ids.forEach(g=>{if(m.it.some(i=>i.g===g))return;const lr=lastRec(m.k,g);m.it.push({g,sup:lr?lr.sup:'GP',tr:TR0,nt:'',pl:pl!==undefined?pl:sePlOf(m.k,lr?{g,pl:lr.pl}:{g})});const d=gDom(g);if(!m.dom.includes(d))m.dom.push(d)})}
ACT.senew=v=>{const [k,d]=v.split('|');return seStart({k,date:d||(WD<=TODAY?WD:TODAY)})};
ACT.seedit=v=>{const s=DB.sess.find(x=>x.id===v);if(!s||!canEditSess(s)){toast('Bạn chưa thể sửa buổi này');return false}return seStart({k:s.k,id:s.id,date:s.date})};
ACT.seclose=()=>{S.modal=S.modal.back||null};
CHG.sef=(v,t)=>{S.modal[t.dataset.f]=v;return false};
CHG.sein=(v,t)=>{S.modal.it[+t.dataset.v].nt=v;return false};
CHG.sepl=(v,t)=>{S.modal.it[+t.dataset.v].pl=v};
ACT.sedom=v=>{const m=S.modal;m.dom=m.dom.includes(v)?m.dom.filter(x=>x!==v):m.dom.concat(v)};
ACT.seadd=v=>{seAddTo(S.modal,[v])};
ACT.serm=v=>{S.modal.it.splice(+v,1)};
ACT.sesup=v=>{const [x,s]=v.split('|');S.modal.it[+x].sup=s};
ACT.setr=v=>{const [x,p]=v.split('|').map(Number),it=S.modal.it[x],c=it.tr[p];it.tr=it.tr.slice(0,p)+(c==='.'?'V':c==='V'?'X':'.')+it.tr.slice(p+1)};
ACT.setrc=v=>{S.modal.it[+v].tr=TR0};
ACT.sepick=v=>{const m=S.modal;S.modal={t:'gp',mode:'ses',k:m.k,back:m,f:{dom:v||'',src:'',head:'',age:'',q:''},sel:[],hz:'n',pl:'auto'};S.pg.gp=1};
const sePlOpts=(k,cur)=>[['','— Chưa gắn mục tiêu ngắn hạn —']].concat(kidPlans(k).filter(p=>p.h==='n'&&(p.s!=='dat'||p.id===cur)).map(p=>[p.id,gName(p.g)]));
function sePlChain(pl){const p=pl?planBy(pl):null;if(!p)return'<div class="sm mu gt-ch">Chưa gắn: dòng này vẫn tính vào biểu đồ tiến bộ nhưng chưa nằm trong cây mục tiêu.</div>';const l=gtUp(p);
 return`<div class="sm gt-ch">⇒ Mục tiêu ngắn hạn: <b>${esc(gName(p.g))}</b>${l?` ⇒ Mục tiêu dài hạn: <b>${esc(gName(l.g))}</b>`:' <span class="mu">(chưa gắn mục tiêu dài hạn)</span>'}</div>`}
function seItem(i,x){const g=goalOf(i.g),n=trN(i.tr);
 return`<div class="si"><div class="si-h"><div><b>${esc(g?g.n:'(mục tiêu đã xóa)')}</b><div class="sm mu">${g?esc(g.t)+' · '+esc(gSrc(g)):''}</div></div><button class="btn s no" data-a="serm" data-v="${x}" aria-label="Bỏ mục tiêu này khỏi buổi">Bỏ</button></div>
 <div class="si-l">Thuộc mục tiêu ngắn hạn <span class="mu">· mục tiêu buổi ⇒ ngắn hạn ⇒ dài hạn</span></div><select class="si-pl" data-c="sepl" data-v="${x}" aria-label="Thuộc mục tiêu ngắn hạn">${opts(sePlOpts(S.modal.k,i.pl||''),i.pl||'')}</select>${sePlChain(i.pl)}
 <div class="si-l">Mức hỗ trợ</div><div class="seg" role="group" aria-label="Mức hỗ trợ">${SUPK.map(s=>`<button type="button" class="sg sp-${s} ${i.sup===s?'on':''}" data-a="sesup" data-v="${x}|${s}" aria-pressed="${i.sup===s}" title="${esc(SUP[s].n+': '+SUP[s].h)}">${esc(SUP[s].a)}</button>`).join('')}</div>
 <div class="si-l">Kết quả 10 lượt <span class="mu">· chạm một lần: đúng, hai lần: sai, ba lần: bỏ trống</span></div>
 <div class="trb" role="group" aria-label="Kết quả từng lượt">${i.tr.split('').map((c,p)=>`<button type="button" class="tb tb-${c==='V'?'v':c==='X'?'x':'o'}" data-a="setr" data-v="${x}|${p}" aria-label="Lượt ${p+1}: ${c==='V'?'đúng':c==='X'?'sai':'chưa làm'}">${c==='V'?'✓':c==='X'?'✗':p+1}</button>`).join('')}</div>
 <div class="si-f"><span class="sm">${n?`<b>${trOk(i.tr)}/${n}</b> đúng · <b>${trPct(i.tr)}%</b> · ${esc(SUP[i.sup].p)}`:'<span class="mu">Chưa ghi kết quả</span>'}</span>${n?`<button class="btn s" data-a="setrc" data-v="${x}">Xóa kết quả</button>`:''}</div>
 <input class="sm" placeholder="Ghi chú riêng cho mục tiêu này (không bắt buộc)" value="${esc(i.nt||'')}" data-c="sein" data-v="${x}" aria-label="Ghi chú mục tiêu"></div>`}
MODALS.se=()=>{const m=S.modal,k=kidBy(m.k);if(!k||!canKid(k.id)){S.modal=null;return''}
 const free=kidPlans(k.id,'dang').filter(p=>!m.it.some(i=>i.g===p.g)),sug=(m.dom.length?free.filter(p=>m.dom.includes(gDom(p.g))):free).slice(0,6),hasRes=m.it.some(i=>trN(i.tr));
 return mdl((m.id?'Sửa buổi can thiệp':'Ghi buổi can thiệp')+' · '+k.n,
 `<p class="mu sm" style="margin-bottom:10px">${age(k.dob)} · ${esc(k.nd)}. Chọn lĩnh vực và mục tiêu của buổi, rồi ghi mức hỗ trợ và kết quả từng lượt. Nếu chưa dạy, lưu như kế hoạch buổi và ghi kết quả sau.</p>
 <div class="f2"><div><label for="se-d">Ngày</label><input id="se-d" type="date" value="${m.date}" max="${addD(TODAY,30)}" data-c="sef" data-f="date"></div><div><label for="se-by">Giáo viên</label>${isLead()?`<select id="se-by" data-c="sef" data-f="by">${opts(DB.staff.filter(isTeacher).map(s=>[s.id,tName(s)]),m.by)}</select>`:`<input id="se-by" value="${esc(sn(m.by))}" disabled>`}</div></div>
 <div style="margin-top:12px"><span class="lb">Lĩnh vực cần can thiệp trong buổi</span><div class="chips">${LDOM.map(d=>`<button type="button" class="chip ${m.dom.includes(d.id)?'on':''}" data-a="sedom" data-v="${d.id}" aria-pressed="${m.dom.includes(d.id)}" title="${esc(d.d)}">${esc(d.s)}</button>`).join('')}</div></div>
 <h3 style="margin-top:14px">Mục tiêu của buổi (${m.it.length})</h3>${m.it.map(seItem).join('')||'<p class="mu sm">Chưa chọn mục tiêu. Chọn từ kế hoạch của bé hoặc từ ngân hàng mục tiêu.</p>'}
 <div class="acts" style="margin:10px 0">${sug.map(p=>`<button class="btn s" data-a="seadd" data-v="${p.g}" title="${esc(gName(p.g))}">+ ${esc(trunc(gName(p.g),42))}</button>`).join('')}${m.dom.map(d=>`<button class="btn s p" data-a="sepick" data-v="${d}">Chọn mục tiêu ${esc(DM[d].s)}</button>`).join('')}<button class="btn s ${m.dom.length?'':'p'}" data-a="sepick" data-v="">${m.dom.length?'Chọn từ toàn bộ ngân hàng mục tiêu':'Chọn từ ngân hàng mục tiêu'}</button></div>
 <div class="f2"><div><label for="se-n">Nhận xét chung về buổi</label><textarea id="se-n" rows="3" data-c="sef" data-f="note">${esc(m.note)}</textarea></div><div><label for="se-h">Gợi ý luyện tập tại nhà</label><textarea id="se-h" rows="3" data-c="sef" data-f="home">${esc(m.home)}</textarea></div></div>
 <div class="gp-f" style="justify-content:flex-end"><button class="btn" data-a="seclose">Hủy</button><button class="btn p" data-a="sesave">${hasRes?'Lưu buổi can thiệp':'Lưu kế hoạch buổi'}</button></div>`,1)};
ACT.sesave=()=>{const m=S.modal,k=kidBy(m.k);if(!k||!canKid(k.id))return false;
 if(!m.date){toast('Hãy chọn ngày');return false}
 if(!m.it.length){toast('Hãy chọn ít nhất một mục tiêu cho buổi');return false}
 const it=m.it.map(i=>{const o={g:i.g,sup:i.sup,tr:i.tr};if(i.nt&&i.nt.trim())o.nt=i.nt.trim();const pp=i.pl?planBy(i.pl):null;if(pp&&pp.k===m.k&&pp.h==='n')o.pl=pp.id;return o}),done=it.some(i=>trN(i.tr));
 if(done&&m.date>TODAY){toast('Chưa đến ngày này nên chưa ghi kết quả được');return false}
 const o={k:m.k,date:m.date,by:m.by,st:done?'xong':'kh',dom:[...new Set(m.dom.concat(it.map(i=>gDom(i.g))))],it,note:(m.note||'').trim(),home:(m.home||'').trim()};
 if(m.id)Object.assign(DB.sess.find(s=>s.id===m.id),o);else DB.sess.push(Object.assign({id:'s'+uid()},o));
 const rd=it.filter(i=>trN(i.tr)).map(i=>i.g).filter(g=>{const p=kidPlans(m.k,'dang').find(q=>q.g===g);return p&&masteryOf(m.k,g).ready});
 toast(done?(rd.length?'Đã lưu buổi can thiệp. Có mục tiêu đủ điều kiện đạt, xem tab Kế hoạch mục tiêu':'Đã lưu buổi can thiệp'):'Đã lưu kế hoạch buổi');
 S.modal=m.back?Object.assign({},m.back,{tab:'bt'}):null};

/* ---------- Trang tổng hợp "Buổi can thiệp" ---------- */
CHG.bidate=v=>{if(v)S.hs.bi.date=v};CHG.bigv=v=>{S.hs.bi.gv=v;S.pg.bi=1};INP.biq=v=>{S.hs.bi.q=v;S.pg.bi=1};
ACT.biday=v=>{let d=addD(S.hs.bi.date,+v);if(!isW(d))d=addD(d,+v);S.hs.bi.date=d};
function hsBi(){const b=S.hs.bi,date=b.date,q=b.q.toLowerCase();
 const ds=dayList(date).filter(s=>s.kind!=='bt').filter(s=>isLead()?(!b.gv||s.gv===b.gv):s.gv===U.id);
 const ofDay=k=>DB.sess.filter(s=>s.k===k.id&&s.date===date);
 let nDone=0,nPlan=0,nNone=0;ds.forEach(s=>{const x=ofDay(s.kids[0]);if(x.some(y=>y.st==='xong'))nDone++;else if(x.length)nPlan++;else nNone++});
 const rows=ds.map(s=>{const k=s.kids[0],x=ofDay(k),a=DB.att[attKey(date,s.sid,k.id)],st=x.some(y=>y.st==='xong')?'xong':x.length?'kh':'';
  return`<div class="rw"><span><b>${esc(k.n)}</b> <span class="sm mu">· ${age(k.dob)}</span><br><span class="sm">${slotLb(s.slot)}${s.kind==='bu'?' '+tg('Học bù','y'):''} · ${esc(given(sn(s.gv)))}</span><br>${a?tg(AC[a],a==='cm'?'ok':a==='kp'?'er':'gy'):'<span class="sm mu">Chưa điểm danh</span>'} ${st==='xong'?tg('Đã ghi','ok'):st==='kh'?tg('Kế hoạch','y'):tg('Chưa ghi','wa')}</span><span class="acts">${x.length?`<button class="btn s" data-a="sesview" data-v="${x[0].id}">Xem</button>`:''}${canKid(k.id)&&date<=addD(TODAY,30)?`<button class="btn s ${st==='xong'?'':'p'}" data-a="senew" data-v="${k.id}|${date}">${st==='xong'?'Sửa':st==='kh'?'Ghi kết quả':'Ghi buổi'}</button>`:''}</span></div>`}).join('');
 const recent=DB.sess.filter(s=>canKid(s.k)&&(!q||kn(s.k).toLowerCase().includes(q))).sort((a,c)=>a.date<c.date?1:a.date>c.date?-1:0),pgd=pg('bi',recent,8);
 return`<div class="grid">${kpi('Lượt 1-1 trong ngày',ds.length,DAYN[dow(date)]+', '+vd(date))}${kpi('Đã ghi buổi',nDone,'có kết quả','ok')}${kpi('Kế hoạch',nPlan,'chưa ghi kết quả')}${kpi('Chưa ghi',nNone,'cần ghi',nNone&&date<=TODAY?'er':'')}</div>
 <div class="card"><div class="f2"><div><label for="bi-d">Ngày</label><input id="bi-d" type="date" data-c="bidate" value="${date}"></div>${isLead()?`<div><label for="bi-g">Giáo viên</label><select id="bi-g" data-c="bigv"><option value="">Tất cả</option>${opts(DB.staff.filter(isTeacher).map(s=>[s.id,tName(s)]),b.gv)}</select></div>`:''}<div style="display:flex;align-items:end;gap:6px"><button class="btn s" data-a="biday" data-v="-1">Ngày trước</button><button class="btn s" data-a="biday" data-v="1">Ngày sau</button></div></div></div>
 <div class="card"><h2>Buổi 1-1 và học bù ngày ${vd(date)}</h2>`+(rows||`<p class="empty">${dow(date)===0?'Chủ nhật trung tâm nghỉ.':'Không có buổi 1-1 nào trong ngày này.'}</p>`)+`<p class="sm mu" style="margin-top:8px">Bé bán trú được ghi buổi trong hồ sơ từng bé: mở hồ sơ, vào tab Buổi can thiệp.</p></div>
 <div class="card"><div class="top" style="margin-bottom:10px"><h2 style="margin:0">Các buổi can thiệp gần đây</h2><div style="min-width:220px"><label for="bi-q" class="sm">Tìm theo tên bé</label><input id="bi-q" data-i="biq" value="${esc(b.q)}"></div></div>`+(pgd.rows.map(s=>sessCard(s,true)).join('')||'<p class="empty">Chưa có buổi nào.</p>')+pgd.html+`</div>`}

/* ---------- Ngân hàng mục tiêu: bộ lọc dùng chung cho tra cứu và chọn mục tiêu ---------- */
const LF=()=>S.modal&&S.modal.t==='gp'?S.modal.f:S.hs.lib,LPG=()=>S.modal&&S.modal.t==='gp'?'gp':'lib';
ACT.lfdom=v=>{const f=LF();f.dom=v;f.head='';S.pg[LPG()]=1};
CHG.lfsrc=v=>{const f=LF();f.src=v;f.head='';f.vbd='';S.pg[LPG()]=1};
CHG.lfhead=v=>{const f=LF();f.head=v;f.vbd='';S.pg[LPG()]=1};
CHG.lfvbd=v=>{LF().vbd=v};
ACT.lfvbt=()=>{const f=LF();f.vbo=!f.vbo};
CHG.lfage=v=>{LF().age=v;S.pg[LPG()]=1};
INP.lfq=v=>{LF().q=v;S.pg[LPG()]=1};
ACT.lfclr=()=>{Object.assign(LF(),{dom:'',src:'',head:'',age:'',q:''});S.pg[LPG()]=1};
/* --- VB-MAPP: chi tiết mốc và bước nhỏ, bảng phương hướng can thiệp --- */
function vbBul(t){const a=String(t||'').split(/\s*\(\d+\)\s*/).map(s=>s.trim()).filter(Boolean).map(s=>s.charAt(0).toUpperCase()+s.slice(1));return a.length>1?`<ul>${a.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:`<p>${esc(a[0]||'')}</p>`}
const vbMark=x=>x==='T'?'Kiểm tra trực tiếp (T)':x==='O'?'Quan sát (O)':x==='E'?'Kiểm tra hoặc quan sát (E)':/^TO:/.test(x)?'Quan sát trong thời gian giới hạn '+x.slice(3)+' phút (TO)':'';
function vbDetail(i){const D=LVBD[i.sk]||{},key='vb:'+i.sk+i.ms,par=i.st?GL[key]:null,nst=VBC[key];
 return(i.st?`<p><b>Bước nhỏ ${i.ms+i.st}</b> của mốc ${i.ms}${par?': '+esc(par.n):''}</p>`:`<p><b>Mốc ${i.ms}</b> của kỹ năng ${esc(i.t)}${nst?'. Có '+nst+' bước nhỏ ('+i.ms+'a đến '+i.ms+String.fromCharCode(96+nst)+') để dạy từng bước':' (tài liệu gốc chưa chia bước nhỏ)'}.</p>`)
 +(i.x&&vbMark(i.x)?`<p><b>Cách đánh giá:</b> ${esc(vbMark(i.x))}</p>`:'')
 +(D[i.ms]?`<p><b>Phương hướng can thiệp ở mốc ${i.ms}:</b></p>${vbBul(D[i.ms])}`:'')
 +(i.ms===1&&D[0]?`<p><b>Khi bé chưa đạt mốc nào (điểm 0):</b></p>${vbBul(D[0])}`:'')
 +(i.a?`<p><b>Cấp độ:</b> ${esc(i.a)}</p>`:'')}
function vbPanel(f,P){const open=!!f.vbo,sk=f.vbd||(f.head!==''&&f.head!=null&&VBHK[f.head])||'YC',D=LVBD[sk]||{},ks=Object.keys(D).map(Number).sort((a,b)=>a-b);
 return`<div class="vbp"><button type="button" class="btn s" data-a="lfvbt" aria-expanded="${open}">${open?'Ẩn':'Xem'} bảng phương hướng can thiệp VB-MAPP</button>`
 +(open?`<div class="note" style="margin-top:8px"><label for="${P}-vd">Kỹ năng</label><select id="${P}-vd" data-c="lfvbd">${opts(LVBS,sk)}</select>${ks.map(k=>`<div class="rw" style="align-items:flex-start;flex-wrap:nowrap"><span class="sm" style="width:58px;flex:none"><b>${k===0?'Điểm 0':'Mốc '+k}</b></span><span class="sm" style="flex:1;min-width:0">${vbBul(D[k])}</span></div>`).join('')}</div>`:'')+`</div>`}
function libDetail(i){if(i.s==='vb')return`<details class="gd"><summary class="sm">Chi tiết</summary><div class="sm">${vbDetail(i)}</div></details>`;
 const x=i.s==='ot'?'Cách làm gợi ý':'Ví dụ';
 return`<details class="gd"><summary class="sm">Chi tiết</summary><div class="sm">${i.o?`<p><b>${i.s==='ot'?'Mục đích':'Mô tả'}:</b> ${esc(i.o)}</p>`:''}${i.x?`<p><b>${x}:</b> ${esc(i.x)}</p>`:''}${i.sc&&i.sc.length?`<p><b>Tiêu chí chấm ABLLS-R:</b></p><ul>${i.sc.map(c=>`<li>Điểm ${esc(c[0])}: ${esc(c[1])}</li>`).join('')}</ul>`:''}${i.a?`<p><b>Mốc phát triển:</b> ${esc(i.a)}</p>`:''}${i.lg?`<p><b>Ngôn ngữ thường đi cùng ở giai đoạn này:</b> ${esc(i.lg)}</p>`:''}${i.rf?`<p class="mu">Nguồn: ${esc(i.rf)}</p>`:''}${!i.o&&!i.x&&!i.a&&!(i.sc&&i.sc.length)?'<p class="mu">Không có mô tả thêm trong dữ liệu gốc.</p>':''}</div></details>`}
function libItem(i,o){const tk=o.taken&&o.taken.includes(i.id),on=o.sel&&o.sel.includes(i.id),cnt=DB.plans.filter(p=>p.g===i.id&&p.s==='dang').length;
 return`<div class="gi ${tk?'tk':''}">${o.pick?`<input type="checkbox" id="${o.idp?o.idp+'c':'gc'}-${esc(i.id)}" data-c="${o.cn||'gpsel'}" value="${esc(i.id)}" ${on?'checked':''} ${tk?'disabled':''}>`:''}<div class="gi-b"><${o.pick?`label for="${o.idp?o.idp+'c':'gc'}-${esc(i.id)}"`:'div'} class="gi-n">${i.s==='vb'?tg(i.st?'Bước '+i.ms+i.st:'Mốc '+i.ms,i.st?'gy':'y')+' ':''}${esc(i.n)}</${o.pick?'label':'div'}><div class="sm mu">${domTag(i.d,i)} ${esc(i.t)} · ${esc(gSrc(i))}${i.a?' · '+esc(i.a):''}${tk?' · <b>Đã có</b>':''}${(!o.pick||o.edit)&&cnt?' · '+cnt+' bé đang luyện':''}</div>${libDetail(i)}</div>${o.edit&&i.s==='cu'&&isLead()?`<button class="btn s" data-a="cgedit" data-v="${esc(i.id.slice(3))}">Sửa</button>`:''}</div>`}
function libPanel(f,o){const P=o.idp||'lf',hs=libHeads(f),all=libFind(f),p=pg(LPG(),all,o.per||20),hasF=f.dom||f.src||f.head||f.age||f.q;
 return`<div class="chips" role="group" aria-label="Lĩnh vực"><button type="button" class="chip ${f.dom?'':'on'}" data-a="lfdom" data-v="" aria-pressed="${!f.dom}">Tất cả lĩnh vực</button>${LCHIPS.map(d=>`<button type="button" class="chip ${f.dom===d.id?'on':''}" data-a="lfdom" data-v="${d.id}" aria-pressed="${f.dom===d.id}" title="${esc(d.d)}">${esc(d.s)}</button>`).join('')}</div>
 <div class="f2" style="margin:10px 0"><div><label for="${P}-s">Bộ công cụ</label><select id="${P}-s" data-c="lfsrc"><option value="">Tất cả</option>${opts(Object.keys(LSRC).filter(s=>s!=='cu'||(DB.cg||[]).length).map(s=>[s,LSRC[s].n]),f.src)}</select></div><div><label for="${P}-h">Tiêu đề</label><select id="${P}-h" data-c="lfhead"><option value="">Tất cả tiêu đề (${hs.length})</option>${opts(hs,f.head)}</select></div><div><label for="${P}-a">Độ tuổi phát triển</label><select id="${P}-a" data-c="lfage"><option value="">Tất cả</option>${opts(AGEB,f.age)}</select></div><div><label for="${P}-q">Tìm mục tiêu</label><input id="${P}-q" data-i="lfq" value="${esc(f.q)}" placeholder="Ví dụ: bắt chước, đếm, gọi tên"></div></div>
 <div class="acts" style="margin-bottom:8px"><span class="sm"><b>${all.length}</b> mục phù hợp</span>${hasF?'<button class="btn s" data-a="lfclr">Xóa bộ lọc</button>':''}${f.age!==''&&f.age!=null?'<span class="sm mu">Đang lọc theo mốc phát triển của mục tiêu, không theo tuổi thật của bé. Bộ ABLLS-R và hoạt động OT không chia theo mốc tuổi nên không hiện khi lọc.</span>':''}</div>${f.src==='vb'?vbPanel(f,P):''}`
 +(p.rows.length?`<div class="gl">${p.rows.map(i=>libItem(i,o)).join('')}</div>`:'<p class="empty">Không có mục tiêu phù hợp. Hãy nới bộ lọc hoặc đổi từ khóa.</p>')+p.html}
/* ---------- Ngân hàng mục tiêu: chọn mục tiêu trực tiếp cho bé (giáo viên và quản lý) ---------- */
const bkInit=()=>S.bk=Object.assign({kid:'',hz:'n',up:'',sel:[]},S.bk);
const bkKids=()=>myKids().filter(k=>k.st==='dang').sort((a,b)=>a.n.localeCompare(b.n,'vi'));
const dots=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
function hsLib(){const b=bkInit(),ks=bkKids(),nc=(DB.cg||[]).length;
 if(!ks.some(k=>k.id===b.kid))b.kid=ks.length===1?ks[0].id:'';
 const kid=b.kid?kidBy(b.kid):null,own=kid?kidPlans(kid.id).filter(p=>p.s!=='dat'):[],taken=own.map(p=>p.g);
 b.sel=b.sel.filter(g=>!taken.includes(g));
 return`<div class="card"><p class="mu sm" style="margin-bottom:12px">${dots(LIBI.length)} mục tiêu chia theo 8 lĩnh vực (ABLLS-R, ESDM/Denver, VB-MAPP, mốc phát triển Mầm non, hoạt động OT, thang chơi Westby và chuỗi phát triển chơi)${nc?' và '+nc+' mục tiêu do Trung tâm tự thêm':''}. Cách chọn: chọn bé, chọn lĩnh vực rồi tick các mục tiêu cần luyện, sau đó bấm “Thêm vào kế hoạch”. Khi ghi buổi can thiệp, bạn cũng chọn mục tiêu theo lĩnh vực từ ngân hàng này.</p>
 <div class="bk-w"><label for="bk-k"><b>Chọn mục tiêu cho bé</b></label><select id="bk-k" data-c="bkkid"><option value="">${ks.length?'Chọn bé…':'Chưa có bé nào để chọn'}</option>${opts(ks.map(k=>[k.id,k.n+' · '+age(k.dob)]),b.kid)}</select>${kid?`<span class="sm mu">${esc(kid.nd)} · đang có ${own.length} mục tiêu trong kế hoạch</span>`:'<span class="sm mu">Chọn bé để thêm mục tiêu vào kế hoạch. Chưa chọn bé vẫn xem và tìm mục tiêu được.</span>'}</div>`
 +libPanel(S.hs.lib,{pick:true,cn:'bksel',idp:'bk',edit:true,sel:b.sel,taken,per:20})
 +`<div class="bk-f"><span class="bk-s sm"><b id="bk-cnt">${b.sel.length}</b> mục đã chọn${kid?' cho '+esc(kid.n):''}</span><button class="btn s" id="bk-clr" data-a="bkclr" ${b.sel.length?'':'disabled'}>Bỏ chọn</button><select id="bk-hz" data-c="bkhz" aria-label="Loại mục tiêu" title="Ngắn hạn: 1–3 tháng. Dài hạn: 6–12 tháng." style="width:auto">${opts([['n','Ngắn hạn'],['d','Dài hạn']],b.hz)}</select><select id="bk-up" data-c="bkup" aria-label="Thuộc mục tiêu dài hạn" title="Chỉ áp dụng cho mục tiêu ngắn hạn" style="width:auto;max-width:100%" ${kid&&b.hz==='n'?'':'disabled'}>${opts([['','Chưa gắn mục tiêu dài hạn']].concat(kid?kidPlans(kid.id).filter(p=>p.h==='d'&&p.s!=='dat').map(p=>[p.id,'Thuộc: '+gName(p.g)]):[]),b.up)}</select><button class="btn p" data-a="bkok">Thêm vào kế hoạch</button></div></div>`}
const bkCount=()=>{const b=S.bk,e=$q('#bk-cnt'),x=$q('#bk-clr');if(e)e.textContent=b.sel.length;if(x)x.disabled=!b.sel.length};
CHG.bkkid=v=>{const b=bkInit();b.kid=v;b.up=''};
CHG.bksel=(v,t)=>{const b=bkInit();b.sel=t.checked?b.sel.filter(x=>x!==v).concat(v):b.sel.filter(x=>x!==v);bkCount();return false};
CHG.bkhz=v=>{const b=bkInit();b.hz=v;const u=$q('#bk-up');if(u)u.disabled=!b.kid||v!=='n';return false};CHG.bkup=v=>{bkInit().up=v;return false};
ACT.bkclr=()=>{bkInit().sel=[]};
ACT.bkok=()=>{const b=bkInit(),k=b.kid?kidBy(b.kid):null;
 if(!k||!canKid(k.id)){toast('Hãy chọn bé ở ô “Chọn mục tiêu cho bé” trước');return false}
 if(!b.sel.length){toast('Hãy tick chọn ít nhất một mục tiêu');return false}
 let n=0;b.sel.forEach(g=>{if(addPlanItem(k.id,g,b.hz,b.hz==='n'?b.up:''))n++});b.sel=[];
 toast('Đã thêm '+n+' mục tiêu vào kế hoạch '+HZ[b.hz][0].toLowerCase()+' của '+k.n);
 S.modal={t:'hs',id:k.id,tab:'kh'}};
VIEWS.mt=()=>{hsInit();return head('Ngân hàng mục tiêu','Chọn mục tiêu theo lĩnh vực để đưa vào kế hoạch và buổi can thiệp của bé',isLead()?'<button class="btn p" data-a="cgnew">Thêm mục tiêu của Trung tâm</button>':'')+hsLib()};

/* ---------- Bộ chọn mục tiêu (thêm vào kế hoạch hoặc vào buổi) ---------- */
ACT.pkopen=v=>{S.modal={t:'gp',mode:'plan',k:v,back:S.modal&&S.modal.t==='hs'?S.modal:null,f:{dom:'',src:'',head:'',age:'',q:''},sel:[],hz:'n'};S.pg.gp=1};
const gpCount=()=>{const m=S.modal,e=$q('#gp-cnt'),b=$q('#gp-ok');if(e)e.textContent=m.sel.length;if(b)b.disabled=!m.sel.length};
CHG.gpsel=(v,t)=>{const m=S.modal;m.sel=t.checked?m.sel.filter(x=>x!==v).concat(v):m.sel.filter(x=>x!==v);gpCount();return false};
CHG.gphz=v=>{S.modal.hz=v;const u=$q('#gp-up');if(u)u.disabled=v!=='n';return false};CHG.gpup=v=>{S.modal.up=v;return false};CHG.gppl=v=>{S.modal.pl=v;return false};
ACT.gpback=()=>{S.modal=S.modal.back||null};
ACT.gpok=()=>{const m=S.modal;if(!m.sel.length)return false;
 if(m.mode==='plan'){let n=0;m.sel.forEach(g=>{if(addPlanItem(m.k,g,m.hz,m.hz==='n'?(m.up||''):''))n++});toast('Đã thêm '+n+' mục tiêu vào kế hoạch '+HZ[m.hz][0].toLowerCase());S.modal=m.back?Object.assign({},m.back,{tab:'kh'}):{t:'hs',id:m.k,tab:'kh'}}
 else{const b=m.back;let nn=0;
  m.sel.forEach(g=>{let pl='';
   if(m.pl&&m.pl!=='auto')pl=m.pl;
   else if(m.pl==='auto'){const dm=gDom(g),all=kidPlans(m.k,'dang').filter(p=>p.h==='n'),own=all.find(p=>p.g===g)||all.find(p=>gDom(p.g)===dm);
    if(own)pl=own.id;else{const id=addPlanItem(m.k,g,'n',gtAutoUp(m.k,g));if(id){pl=id;nn++}}}
   seAddTo(b,[g],pl)});
  S.modal=b;toast('Đã thêm '+m.sel.length+' mục tiêu vào buổi'+(nn?' và tạo '+nn+' mục tiêu ngắn hạn mới':''))}};
MODALS.gp=()=>{const m=S.modal,k=kidBy(m.k);if(!k){S.modal=null;return''}
 const taken=m.mode==='plan'?kidPlans(k.id).filter(p=>p.s!=='dat').map(p=>p.g):m.back.it.map(i=>i.g);
 return mdl('Chọn mục tiêu cho '+k.n,`<p class="mu sm" style="margin-bottom:10px">${m.mode==='plan'?'Chọn một hoặc nhiều mục tiêu để đưa vào kế hoạch của bé.':'Chọn mục tiêu để thêm vào buổi can thiệp.'} Bấm “Chi tiết” để xem mô tả, ví dụ và tiêu chí chấm.</p>`+libPanel(m.f,{pick:true,sel:m.sel,taken,per:12})
 +`<div class="gp-f"><span class="sm"><b id="gp-cnt">${m.sel.length}</b> mục đã chọn</span>${m.mode==='plan'?`<span style="display:flex;gap:6px 10px;align-items:center;flex-wrap:wrap"><label for="gp-hz" class="sm" style="margin:0">Loại mục tiêu</label><select id="gp-hz" data-c="gphz" style="width:auto">${opts([['n','Ngắn hạn (1–3 tháng)'],['d','Dài hạn (6–12 tháng)']],m.hz)}</select><label for="gp-up" class="sm" style="margin:0">Thuộc mục tiêu dài hạn</label><select id="gp-up" data-c="gpup" style="width:auto;max-width:100%" ${m.hz==='n'?'':'disabled'}>${opts([['','Chưa gắn']].concat(kidPlans(k.id).filter(p=>p.h==='d'&&p.s!=='dat').map(p=>[p.id,gName(p.g)])),m.up||'')}</select></span>`:`<span style="display:flex;gap:6px 10px;align-items:center;flex-wrap:wrap"><label for="gp-pl" class="sm" style="margin:0">Thuộc mục tiêu ngắn hạn</label><select id="gp-pl" data-c="gppl" style="width:auto;max-width:100%">${opts([['auto','Tự chọn theo lĩnh vực'],['','Chưa gắn mục tiêu ngắn hạn']].concat(kidPlans(k.id).filter(p=>p.h==='n'&&p.s!=='dat').map(p=>[p.id,gName(p.g)])),m.pl)}</select></span>`}<span class="acts"><button class="btn" data-a="gpback">Quay lại</button><button class="btn p" id="gp-ok" data-a="gpok" ${m.sel.length?'':'disabled'}>${m.mode==='plan'?'Thêm vào kế hoạch':'Thêm vào buổi'}</button></span></div>`,1)};

/* ---------- Mục tiêu do Trung tâm tự thêm ---------- */
ACT.cgnew=()=>{S.modal={t:'cg',id:''}};ACT.cgedit=v=>{S.modal={t:'cg',id:v}};
MODALS.cg=()=>{const id=S.modal.id,c=id?DB.cg.find(x=>x.id===id):{d:'nh',t:'',n:'',o:''};if(!c){S.modal=null;return''}
 return mdl(id?'Sửa mục tiêu của Trung tâm':'Thêm mục tiêu của Trung tâm',`<form id="cgf" class="f"><div class="f2"><div><label for="cg-d">Lĩnh vực</label><select id="cg-d" name="d">${opts(LDOM.map(d=>[d.id,d.n]),c.d)}</select></div><div><label for="cg-t">Tiêu đề</label><input id="cg-t" name="t" value="${esc(c.t)}" placeholder="Ví dụ: Nề nếp lớp học"></div></div><div><label for="cg-n">Mục tiêu cụ thể</label><input id="cg-n" name="n" value="${esc(c.n)}" required></div><div><label for="cg-o">Mô tả hoặc tiêu chí đạt</label><textarea id="cg-o" name="o" rows="3">${esc(c.o)}</textarea></div>
 <div class="acts" style="justify-content:flex-end">${id?'<button class="btn no" type="button" data-a="cgdel" data-v="'+esc(id)+'">Xóa</button>':''}<button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu</button></div></form>`)};
FORM.cgf=f=>{const e=f.elements,v={d:e.d.value,t:e.t.value.trim(),n:e.n.value.trim(),o:e.o.value.trim()};if(!v.n){toast('Hãy nhập mục tiêu cụ thể');return false}
 DB.cg=DB.cg||[];if(S.modal.id)Object.assign(DB.cg.find(x=>x.id===S.modal.id),v);else DB.cg.push(Object.assign({id:'c'+uid()},v));S.modal=null;toast('Đã lưu mục tiêu')};
ACT.cgdel=v=>{const n=DB.plans.filter(p=>p.g==='cu:'+v).length;ask('Xóa mục tiêu này khỏi ngân hàng mục tiêu?'+(n?' Có '+n+' bé đang có mục tiêu này trong kế hoạch, mục tiêu sẽ hiện là “đã xóa”.':''),()=>{DB.cg=DB.cg.filter(x=>x.id!==v);S.modal=null;toast('Đã xóa mục tiêu')},'Xóa')};
