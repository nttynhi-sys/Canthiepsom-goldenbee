/* ===== Biểu đồ tiến bộ: dễ hiểu cho phụ huynh, đầy đủ hơn cho giáo viên ===== */
const r0=Math.round,PDFC={c1:'#047781'};
/* chú giải khi di chuột, chạm hoặc dùng bàn phím */
let TIPEL=null,TIPT=0;
function hideTip(){clearTimeout(TIPT);if(TIPEL){TIPEL.remove();TIPEL=null}}
function showTip(el){hideTip();const t=el.getAttribute('data-tip');if(!t)return;TIPEL=document.createElement('div');TIPEL.className='vtip';TIPEL.setAttribute('role','tooltip');TIPEL.textContent=t;document.body.appendChild(TIPEL);
 const r=el.getBoundingClientRect(),w=TIPEL.offsetWidth,h=TIPEL.offsetHeight;let x=r.left+r.width/2-w/2,y=r.top-h-8;x=Math.max(8,Math.min(innerWidth-w-8,x));if(y<8)y=r.bottom+8;TIPEL.style.left=x+'px';TIPEL.style.top=y+'px'}
document.addEventListener('mouseover',e=>{const t=e.target.closest&&e.target.closest('[data-tip]');if(t)showTip(t);else if(TIPEL)hideTip()});
document.addEventListener('focusin',e=>{const t=e.target.closest&&e.target.closest('[data-tip]');if(t)showTip(t)});
document.addEventListener('focusout',hideTip);
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-tip]');if(t){showTip(t);TIPT=setTimeout(hideTip,3500)}else hideTip()},true);
window.addEventListener('scroll',hideTip,true);

const wkLab=k=>vdm(k),moLab=k=>'Tháng '+(+k.slice(5,7));
const spChip=s=>`<span class="sp sp-${s}">${esc(SUP[s].p)}</span>`;

/* --- số liệu nổi bật --- */
function heroFig(P,par){const has=P.now!=null,d=P.dAll;
 const t=!has?'Chưa có số liệu buổi can thiệp trong khoảng thời gian này.':d==null?'Bé mới bắt đầu luyện nên chưa đủ số liệu để so với đầu kỳ.':`${d>=0?'Tăng':'Giảm'} <b>${Math.abs(r0(d))} điểm</b> so với đầu kỳ, tính trên ${P.np} mục tiêu luyện từ 2 buổi trở lên: ${trendWord(d)}.`;
 return`<div class="hero"><div class="hero-n" role="img" aria-label="Chỉ số tự làm hiện tại ${has?r0(P.now):'chưa có'} trên 100"><span class="hn">${has?r0(P.now):'–'}</span><span class="hu">/100</span></div><div class="hero-t"><b>Chỉ số tự làm</b><p>${t}</p><p class="sm mu" style="margin-top:6px">${par?'Chỉ số cho biết bé làm đúng nhiều hay ít và cần cô giúp nhiều hay ít: 0 là cần giúp hoàn toàn, 100 là bé tự làm đúng hết.':'Chỉ số tự làm = tỉ lệ lượt đúng × hệ số mức hỗ trợ ('+SUPK.map(s=>SUP[s].a+' '+SUP[s].w).join(', ')+'), lấy trung bình trên các mục tiêu.'}</p></div></div>`}
function tiles(k,P){return`<div class="grid">${kpi('Buổi can thiệp',P.ss,'đã ghi trong kỳ')}${kpi('Mục tiêu đang luyện',kidPlans(k.id,'dang').length,P.goals.length+' mục có số liệu')}${kpi('Mục tiêu mới đạt',P.dat.length,'trong kỳ',P.dat.length?'ok':'')}${kpi('Lượt luyện',P.recs,'lượt có kết quả')}</div>`}

/* --- biểu đồ 1: đầu kỳ so với hiện tại theo lĩnh vực --- */
function chDom(P){const act=LDOM.map(dd=>({dd,d:P.doms.find(x=>x.id===dd.id)})).filter(x=>x.d&&x.d.l!=null);
 if(!act.length)return'<p class="mu sm">Chưa có số liệu.</p>';
 const pos=v=>Math.max(0,Math.min(100,v)),
 rows=act.map(({dd,d})=>{const a=d.f,b=d.l,dl=a!=null?b-a:null;
  return`<div class="db-r" role="listitem"><div class="db-l">${esc(dd.s)}<small>${d.n} mục tiêu</small></div><div class="db-t" role="img" aria-label="${esc(dd.n)}: ${a!=null?'đầu kỳ '+r0(a)+', ':''}hiện tại ${r0(b)} trên 100">${a!=null?`<i class="db-ln" style="left:${pos(Math.min(a,b))}%;width:${Math.abs(pos(b)-pos(a))}%"></i><b class="db-p0" tabindex="0" style="left:${pos(a)}%" data-tip="${esc(dd.n+' · Đầu kỳ: '+r0(a)+' điểm')}"></b>`:''}<b class="db-p1" tabindex="0" style="left:${pos(b)}%" data-tip="${esc(dd.n+' · Hiện tại: '+r0(b)+' điểm')}"></b></div><div class="db-v"><b>${r0(b)}</b>${dl==null?' <small class="mu">mới</small>':` <small class="${dl>=2?'up':dl<=-2?'dn':'mu'}">${dl>=0?'+':'−'}${Math.abs(r0(dl))}</small>`}</div></div>`}).join('');
 return`<div class="db" role="list"><div class="db-r db-ax" aria-hidden="true"><span></span><span class="db-tk"><i style="left:0">0</i><i style="left:50%">50</i><i style="left:100%">100</i></span><span></span></div>${rows}</div><div class="lgd"><span><i class="sw sw0"></i>Đầu kỳ</span><span><i class="sw sw1"></i>Hiện tại</span><span class="mu">Chấm càng gần 100, bé càng tự làm được</span></div>`}

/* --- biểu đồ 2: mức hỗ trợ theo thời gian --- */
function chStack(P,bands){if(!P.stack.length)return'<p class="mu sm">Chưa có số liệu.</p>';
 const lv=bands?BANDS.map((b,i)=>({n:b.n,s:b.s,c:'var(--b'+(i+1)+')',t:'var(--bt'+(i+1)+')',h:b.s.map(x=>SUP[x].p).join(', ')})):SUPK.map((s,i)=>({n:SUP[s].n,s:[s],c:'var(--o'+(i+1)+')',t:'var(--ot'+(i+1)+')',h:SUP[s].h}));
 const rows=P.stack.map(r=>{const lab=P.unit==='m'?moLab(r.k):'Tuần '+wkLab(r.k);
  return`<div class="sk-r"><div class="sk-l">${esc(lab)}<small>${r.t} lượt</small></div><div class="sk-b" role="img" aria-label="${esc(lab)}: ${lv.map(L=>{const c=L.s.reduce((a,s)=>a+r.c[s],0);return L.n+' '+r0(c*100/r.t)+'%'}).join(', ')}">${lv.map(L=>{const c=L.s.reduce((a,s)=>a+r.c[s],0),p=c*100/r.t;return c?`<i class="sk-s" tabindex="0" style="flex:${c} 1 0%;background:${L.c};color:${L.t}" data-tip="${esc(lab+' · '+L.n+': '+r0(p)+'% ('+c+' lượt)')}">${p>=14?r0(p)+'%':''}</i>`:''}).join('')}</div></div>`}).join('');
 return`<div class="sk">${rows}</div><div class="lgd">${lv.map(L=>`<span title="${esc(L.h)}"><i class="sw" style="background:${L.c}"></i>${esc(L.n)}</span>`).join('')}</div><p class="sm mu" style="margin-top:6px">Mỗi thanh là 100% lượt luyện của ${P.unit==='m'?'tháng':'tuần'}. Thanh càng nhiều màu đậm bên trái, bé càng cần ít hỗ trợ.</p>`}

/* --- biểu đồ 3: xu hướng theo tuần --- */
function chTrend(P,pdf){const w=P.weeks,n=w.length;if(n<2)return'<p class="mu sm">Cần số liệu của ít nhất 2 tuần để vẽ xu hướng.</p>';
 const X=i=>4+92*i/(n-1),Y=v=>100-v,pts=w.map((p,i)=>[+X(i).toFixed(2),Y(p.sc)]),line='M'+pts.map(p=>p[0]+' '+p[1]).join('L'),area=line+`L${pts[n-1][0]} 100L${pts[0][0]} 100Z`;
 const step=Math.ceil(n/6),col=pdf?PDFC.c1:'var(--c1)',sty=a=>pdf?a:'',attr=(f,s)=>pdf?`fill="${f}" stroke="${s}"`:`style="fill:${f};stroke:${s}"`;
 return`<div class="tr" role="img" aria-label="Chỉ số tự làm theo tuần, từ ${w[0].sc} điểm ở tuần ${wkLab(w[0].w)} đến ${w[n-1].sc} điểm ở tuần ${wkLab(w[n-1].w)}">
 <div class="tr-y" aria-hidden="true">${[0,25,50,75,100].map(v=>`<span style="bottom:${v}%">${v}</span>`).join('')}</div>
 <div class="tr-p">${[0,25,50,75,100].map(v=>`<i class="tgl" style="bottom:${v}%"></i>`).join('')}
 <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${area}" ${attr(col,'none')} fill-opacity=".1"/><path d="${line}" ${attr('none',col)} stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>
 ${w.map((p,i)=>`<b class="dt" tabindex="0" style="left:${X(i)}%;bottom:${p.sc}%" data-tip="${esc('Tuần '+wkLab(p.w)+': '+p.sc+' điểm ('+p.n+' lượt luyện)')}"></b>`).join('')}
 <span class="dtl" style="left:${X(n-1)}%;bottom:${w[n-1].sc}%">${w[n-1].sc}</span></div>
 <div class="tr-x" aria-hidden="true">${w.map((p,i)=>i%step===0||i===n-1?`<span style="left:${X(i)}%">${wkLab(p.w)}</span>`:'').join('')}</div></div>`}

/* --- mục tiêu nổi bật, gợi ý ở nhà, bảng số liệu --- */
function gcard(kind,x,par){const dm=x.dm||gDom(x.g);
 const tagk={dat:tg('Mới đạt','ok'),top:tg('Tiến bộ nhiều','in'),slow:tg('Cần thêm thời gian','wa')}[kind];
 const body=kind==='dat'?`<p class="sm">${x.dt?'Đạt ngày '+vd(x.dt)+': bé tự làm đúng từ 80% trở lên trong 3 buổi liên tiếp.':''}</p>`
  :`<div class="gc-l">${spChip(x.fs)}<span class="gc-t"><span aria-hidden="true">→</span> ${spChip(x.ls)}</span></div><p class="sm mu">Số lượt đúng: ${x.fk} → ${x.lk}${x.dl!=null?' · '+(x.dl>=0?'+':'−')+Math.abs(r0(x.dl))+' điểm':''}</p>`;
 return`<div class="gc"><div class="gc-h">${tagk} ${domTag(dm)}</div><b>${esc(gName(x.g))}</b>${body}</div>`}
function goalCards(P,par){const c=[],dg=P.dat.map(p=>p.g);P.dat.forEach(p=>c.push(gcard('dat',{g:p.g,dt:p.dt},par)));P.top.filter(x=>!dg.includes(x.g)).slice(0,4).forEach(x=>c.push(gcard('top',x,par)));if(!par)P.slow.forEach(x=>c.push(gcard('slow',x,par)));
 return c.length?`<div class="gc-grid">${c.join('')}</div>`:'<p class="mu sm">Chưa có mục tiêu nổi bật trong khoảng thời gian này. Khi bé có thêm buổi luyện, các mục tiêu mới đạt và tiến bộ nhiều sẽ hiện ở đây.</p>'}
function tipsBox(k,P){const t=homeTips(k.id,P,3);return t.length?`<ul class="tips">${t.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="mu sm">Chưa có gợi ý.</p>'}
function tvDom(P){return`<details class="tvw"><summary class="sm">Xem số liệu dạng bảng</summary>`+tbl(['Lĩnh vực','>Số mục tiêu','>Đầu kỳ','>Hiện tại','>Thay đổi'],LDOM.map(dd=>{const d=P.doms.find(x=>x.id===dd.id);return`<tr><td>${esc(dd.n)}</td><td class="r">${d.n}</td><td class="r">${d.f==null?'–':r0(d.f)}</td><td class="r">${d.l==null?'–':r0(d.l)}</td><td class="r">${d.f==null||d.l==null?'–':(d.l-d.f>=0?'+':'−')+Math.abs(r0(d.l-d.f))}</td></tr>`}).join(''))+`</details>`}
function tvStack(P){return`<details class="tvw"><summary class="sm">Xem số liệu dạng bảng</summary>`+tbl(['Kỳ',...SUPK.map(s=>'>'+SUP[s].a),'>Tổng lượt'],P.stack.map(r=>`<tr><td>${esc(P.unit==='m'?moLab(r.k):'Tuần '+wkLab(r.k))}</td>${SUPK.map(s=>`<td class="r">${r.c[s]}</td>`).join('')}<td class="r">${r.t}</td></tr>`).join(''))+`</details>`}
function tvTrend(P){return`<details class="tvw"><summary class="sm">Xem số liệu dạng bảng</summary>`+tbl(['Tuần bắt đầu','>Chỉ số tự làm','>Số lượt'],P.weeks.map(w=>`<tr><td>${vd(w.w)}</td><td class="r">${w.sc}</td><td class="r">${w.n}</td></tr>`).join(''))+`</details>`}
function goalTable(P){return tbl(['Mục tiêu','Lĩnh vực','Đầu kỳ','Hiện tại','>Số buổi','>Thay đổi'],P.goals.sort((a,b)=>a.dm<b.dm?-1:a.dm>b.dm?1:b.cnt-a.cnt).map(x=>`<tr><td>${esc(gName(x.g))}</td><td>${domTag(x.dm)}</td><td>${spChip(x.fs)} <span class="sm">${x.fk}</span></td><td>${spChip(x.ls)} <span class="sm">${x.lk}</span></td><td class="r">${x.cnt}</td><td class="r">${x.dl==null?'–':(x.dl>=0?'+':'−')+Math.abs(r0(x.dl))}</td></tr>`).join(''),'Chưa có mục tiêu nào có số liệu trong kỳ.')}
const readHelp=par=>`<details class="tvw"><summary class="sm"><b>Cách đọc các biểu đồ</b></summary><div class="sm" style="padding-top:6px"><p><b>Chỉ số tự làm (0 đến 100):</b> kết hợp hai điều, bé làm đúng bao nhiêu trong 10 lượt và cần cô hỗ trợ nhiều hay ít.</p><ul class="rd">${SUPK.map(s=>`<li>${spChip(s)} ${esc(SUP[s].h)}</li>`).join('')}</ul><p style="margin-top:6px">${par?'Bé càng tự làm, thanh màu đậm bên trái càng dài và chỉ số càng gần 100.':'Mục tiêu được đánh dấu đạt khi bé làm độc lập từ 80% trở lên trong 3 buổi liên tiếp.'} Đầu kỳ và hiện tại được so sánh trên cùng các mục tiêu đã luyện từ 2 buổi trở lên.</p></div></details>`;

/* --- trang Tiến bộ (cổng phụ huynh và hồ sơ bé) --- */
ACT.prp=v=>{S.pr=Object.assign({p:'90'},S.pr,{p:v})};
function periodChips(st){return`<div class="chips" role="group" aria-label="Khoảng thời gian" style="margin-bottom:12px">${PRD.map(([v,l])=>`<button type="button" class="chip ${st.p===v?'on':''}" data-a="prp" data-v="${v}" aria-pressed="${st.p===v}">${l}</button>`).join('')}</div>`}
const gtCard=(k,par)=>`<div class="card gt-card"><h2>${par?'Mục tiêu của bé: bé đã đạt chưa?':'Cây mục tiêu của bé'}</h2>${par?'':'<p class="sm mu" style="margin:-4px 0 10px">Tính đến hôm nay, không phụ thuộc khoảng thời gian chọn bên dưới.</p>'}${gtParent(k.id)}</div>`;
function progView(k,o){o=o||{};const par=!!o.parent,st=S.pr=Object.assign({p:'90'},S.pr),R=prRange(st.p),P=progData(k.id,R.from,R.to);
 if(!P.ss)return gtCard(k,par)+periodChips(st)+`<div class="card"><p class="empty">${par?'Chưa có buổi can thiệp nào được ghi trong khoảng thời gian này. Khi giáo viên ghi buổi học, biểu đồ tiến bộ của bé sẽ hiện ở đây.':'Chưa có buổi can thiệp nào được ghi trong khoảng thời gian này.'}</p></div>`;
 const recent=sessOf(k.id,R.from,R.to).filter(s=>s.note).slice(-3).reverse();
 return gtCard(k,par)+periodChips(st)+`<p class="mu sm" style="margin:-4px 0 12px">Từ ${vd(R.from)} đến ${vd(R.to)}${par?'':' · '+esc(k.n)}</p>`
 +`<div class="card">${heroFig(P,par)}</div>`+tiles(k,P)
 +`<div class="card"><h2>${par?'Bé tiến bộ ở lĩnh vực nào?':'Tiến bộ theo lĩnh vực'}</h2>${chDom(P)}${par?'':tvDom(P)}</div>`
 +`<div class="card"><h2>${par?'Bé cần cô hỗ trợ ít dần':'Mức hỗ trợ theo '+(P.unit==='m'?'tháng':'tuần')}</h2>${chStack(P,par)}${par?'':tvStack(P)}</div>`
 +`<div class="card"><h2>Xu hướng chỉ số tự làm theo tuần</h2>${chTrend(P)}${par?'':tvTrend(P)}</div>`
 +`<div class="card"><h2>${par?'Điểm nổi bật của bé':'Mục tiêu nổi bật'}</h2>${goalCards(P,par)}</div>`
 +(par?'':`<div class="card"><h2>Chi tiết theo mục tiêu</h2>${goalTable(P)}</div>`)
 +`<div class="card"><h2>Gợi ý luyện tập tại nhà</h2>${tipsBox(k,P)}${recent.length?`<h3 style="margin-top:12px">Nhận xét gần đây của giáo viên</h3>${recent.map(s=>`<div class="rw"><span><b>${vd(s.date)}</b> · ${esc(s.note)}</span></div>`).join('')}`:''}</div>`
 +`<div class="card">${readHelp(par)}<div class="acts" style="margin-top:12px"><button class="btn p" data-a="prpdf" data-v="${k.id}">Tải báo cáo tiến bộ (PDF)</button></div></div>`}
/* bản gọn cho trang Tổng quan của phụ huynh */
function progMini(k){const R=prRange('90'),P=progData(k.id,R.from,R.to),gt=gtParent(k.id,{mini:1});
 if(!P.ss)return(/class="empty"/.test(gt)?'':gt)+'<p class="empty">Chưa có số liệu buổi can thiệp. Khi giáo viên ghi buổi học, biểu đồ sẽ hiện ở đây.</p>';
 return(/class="empty"/.test(gt)?'':'<h3 style="margin:0 0 8px">Bé đã đạt mục tiêu chưa?</h3>'+gt+'<h3 style="margin:18px 0 8px">Chỉ số tự làm của bé</h3>')+heroFig(P,true)+`<h3 style="margin:14px 0 8px">Bé tiến bộ ở lĩnh vực nào?</h3>`+chDom(P)+`<div class="acts" style="margin-top:12px"><button class="btn p" data-a="cptab" data-v="tb">Xem đầy đủ tiến bộ của bé</button></div>`}
/* khối biểu đồ đưa vào báo cáo chuyên môn hằng tháng và tệp PDF (mỗi khối .nb không bị cắt giữa hai trang PDF) */
function progBlocks(P,T,k,pdf,o){const nb=(t,h)=>`<div class="nb"><h4>${t}</h4>${h}</div>`,rg=`từ ${vd(T.from)} đến ${vd(T.to)}`;
 return(o&&o.tree?nb('Mục tiêu của bé: bé đã đạt chưa?',gtParent(k.id,{pdf:pdf})):'')+`<div class="nb">${heroFig(P,true)}</div>`
  +nb('Tiến bộ theo lĩnh vực'+(o&&o.m?' trong tháng':''),chDom(P))
  +nb('Bé cần cô hỗ trợ ít dần <span class="mu">('+rg+')</span>',chStack(T,true))
  +nb('Xu hướng chỉ số tự làm theo tuần <span class="mu">('+rg+')</span>',chTrend(T,pdf))
  +nb('Điểm nổi bật',goalCards(P,true))
  +(o&&o.tips?nb('Gợi ý luyện tập tại nhà',tipsBox(k,P)):'')}
function progReport(k,per,pdf){const from=per+'-01',to=mDates(per).slice(-1)[0],P=progData(k.id,from,to);
 if(!P.ss)return'';
 return`<div class="prg"><h3 style="margin-top:14px">Biểu đồ tiến bộ của bé trong ${mLow(per)}</h3>${progBlocks(P,progData(k.id,addD(from,-60),to),k,pdf,{m:1})}</div>`}
ACT.prpdf=v=>{const k=kidBy(v);if(!k||!canKid(k.id))return false;const st=S.pr||{p:'90'},R=prRange(st.p),P=progData(k.id,R.from,R.to);
 const html=`<h2 style="margin:0 0 4px;font:700 17px 'Baloo 2','Be Vietnam Pro',sans-serif">BÁO CÁO TIẾN BỘ CỦA BÉ</h2><p style="margin-bottom:8px"><b>${esc(k.n)}</b> · ${age(k.dob)} · Từ ${vd(R.from)} đến ${vd(R.to)}</p><div class="prg">${P.ss?progBlocks(P,P,k,true,{tips:1,tree:1}):'<p>Chưa có buổi can thiệp nào được ghi trong khoảng thời gian này.</p>'}</div>`;
 exportPDF('tien-bo-'+ascii(k.n)+'-'+R.to+'.pdf',html);return false};
