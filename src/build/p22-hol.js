/* ===== 22. Ngày nghỉ lễ, Trung tâm cho nghỉ, học phí trả trước và phí dư ===== */
/* Học phí đóng trước đầu tháng nên Trung tâm đặt sẵn các ngày nghỉ. Ngày nghỉ không tính học phí bán trú, ca 1-1 và không cần điểm danh
   (xem sched, dayList, conflict, tsSt, payroll trong p04-domain.js). Học phí tháng sau của phụ huynh = học phí tháng sau trừ phí dư của tháng trước. */
const canHol=()=>isLead()||isVP();
const holList=()=>(DB.hol||[]).slice().sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
const holTag=h=>tg(HOLK[h.k]||HOLK.le,h.k==='tt'?'wa':'in');

/* Ảnh hưởng của một ngày nghỉ: bao nhiêu bé bán trú, buổi 1-1 tính riêng, lượt điểm danh đã ghi, và số tiền học phí giảm */
function holImpact(d){const w=dow(d),r={bt:0,s11:0,money:0,att:0,bu:0};if(w===0)return r;
 DB.kids.forEach(k=>{if(k.st!=='dang'||k.sd.slice(0,7)>d.slice(0,7))return;
  if(btHas(k,w)){r.bt++;r.money+=DB.cfg.pbtDay||0}
  const inc=incIdW(k,w);
  DB.lich.forEach(l=>{if(l.type==='11'&&l.hs===k.id&&l.day===w&&l.id!==inc){r.s11++;r.money+=fee11(k)}})});
 r.bu=DB.lich.filter(l=>l.type==='bu'&&l.date===d).length;
 r.att=Object.keys(DB.att).filter(key=>key.startsWith(d+'|')).length;
 return r}
const holMonthsBilled=ds=>[...new Set(ds.map(d=>d.slice(0,7)))].filter(m=>DB.lg.some(e=>e.kind==='hp'&&e.m===m));

CHG.holall=(v,t)=>{S.hol=Object.assign({},S.hol,{all:t.checked});S.pg.hol=1};
function holTab(){const h=S.hol=Object.assign({all:false},S.hol),ed=canHol(),L=canMoney(),all=holList();
 const rows=all.filter(x=>h.all||x.d>=TODAY),p=pg('hol',rows,12),up=all.filter(x=>x.d>=TODAY&&dow(x.d)!==0).length;
 const yr=+TODAY.slice(0,4);
 const list=`<div class="card"><div class="top"><div><h2>Ngày nghỉ lễ và Trung tâm cho nghỉ</h2><p class="mu sm">Học phí đóng trước đầu tháng, nên hãy đặt các ngày nghỉ trước khi tạo hóa đơn. Những ngày này không tính học phí bán trú và ca 1-1, không cần điểm danh, giáo viên theo tháng vẫn hưởng ngày công, giáo viên theo ca không có ca dạy.</p></div>
  <label class="chk" style="margin:0"><input type="checkbox" data-c="holall" ${h.all?'checked':''}> Hiện cả ngày đã qua</label></div>
  <div class="grid" style="margin:12px 0">${kpi('Ngày nghỉ sắp tới',up,'từ hôm nay trở đi')}${kpi('Tháng này',holIn(CM).length,mLabel(CM))}${kpi('Tháng sau',holIn(sm(CM,1)).length,mLabel(sm(CM,1)))}</div>`
  +tbl(['Ngày','Tên ngày nghỉ','Loại','Ảnh hưởng'].concat(L?['>Học phí giảm']:[]).concat(ed?['']:[]),p.rows.map(x=>{const im=holImpact(x.d);
   return`<tr><td class="nw"><b>${DAYN[dow(x.d)]}</b> ${vd(x.d)}</td><td>${esc(x.n)}</td><td>${holTag(x)}</td><td class="sm">${dow(x.d)===0?'Chủ nhật vốn nghỉ':im.bt+' bé bán trú, '+im.s11+' buổi 1-1 tính riêng'+(im.att?'<br><span class="mu">Đã có '+im.att+' lượt điểm danh ngày này, sẽ không còn được tính</span>':'')}</td>${L?`<td class="r nw">${im.money?'-'+fnum(im.money):'–'}</td>`:''}${ed?`<td class="r"><button class="btn s no" data-a="holdel" data-v="${x.id}">Xóa</button></td>`:''}</tr>`}).join(''),h.all?'Chưa có ngày nghỉ nào.':'Chưa có ngày nghỉ sắp tới. Hãy thêm các ngày nghỉ lễ, Tết và ngày Trung tâm cho nghỉ.')+p.html
  +`<p class="sm mu" style="margin-top:8px">Chủ nhật Trung tâm luôn nghỉ nên không cần nhập. Sau khi hóa đơn của tháng đã tạo, hóa đơn không tự đổi theo ngày nghỉ thêm vào sau; hãy đối chiếu ở mục Học phí, tab Tạo hóa đơn.</p></div>`;
 const form=ed?`<div class="card"><h2>Thêm ngày nghỉ</h2><form id="holf" class="f"><div class="f2"><div><label for="hl-a">Từ ngày</label><input id="hl-a" name="from" type="date" required></div><div><label for="hl-b">Đến ngày (bỏ trống nếu chỉ một ngày)</label><input id="hl-b" name="to" type="date"></div><div><label for="hl-n">Tên ngày nghỉ</label><input id="hl-n" name="n" placeholder="Ví dụ: Tết Nguyên đán, Giỗ Tổ Hùng Vương" required></div><div><label for="hl-k">Loại</label><select id="hl-k" name="k">${opts(Object.entries(HOLK),'le')}</select></div></div>
  <div class="acts" style="justify-content:flex-end"><button class="btn p" type="submit">Thêm ngày nghỉ</button></div></form>
  <div class="note sm" style="margin-top:12px"><b>Ngày lễ dương lịch cố định</b> (1/1, 30/4, 1/5, 2/9): <button class="btn s" data-a="holsol" data-v="${yr}">Thêm năm ${yr}</button> <button class="btn s" data-a="holsol" data-v="${yr+1}">Thêm năm ${yr+1}</button><br>Tết Nguyên đán và Giỗ Tổ Hùng Vương tính theo âm lịch và mỗi năm lệch ngày dương lịch, nên hãy nhập thủ công theo thông báo nghỉ chính thức.</div></div>`:'';
 return list+form}

/* thêm một danh sách ngày (đã lọc), cảnh báo nếu tháng đó đã tạo hóa đơn */
function holAdd(ds,n,k){const ex=new Set((DB.hol||[]).map(x=>x.d));let c=0;DB.hol=DB.hol||[];
 ds.forEach(d=>{if(ex.has(d)||dow(d)===0)return;DB.hol.push({id:'hl'+uid(),d,n,k});c++});
 const mb=holMonthsBilled(ds);
 toast(c?'Đã thêm '+c+' ngày nghỉ'+(mb.length?'. Hóa đơn '+mb.map(m=>m.slice(5)+'/'+m.slice(0,4)).join(', ')+' đã tạo trước đó, hãy đối chiếu ở mục Học phí':''):'Các ngày này đã có trong danh sách');return c}
FORM.holf=f=>{if(!canHol())return false;const e=f.elements,a=e.from.value,b=e.to.value||a,n=e.n.value.trim(),k=HOLK[e.k.value]?e.k.value:'le';
 if(!a||!n){toast('Hãy chọn ngày và nhập tên ngày nghỉ');return false}
 if(b<a){toast('Ngày kết thúc phải cùng ngày hoặc sau ngày bắt đầu');return false}
 const ds=[];for(let d=a;d<=b&&ds.length<=40;d=addD(d,1))if(dow(d)!==0)ds.push(d);
 if(ds.length>40){toast('Mỗi lần chỉ thêm tối đa 40 ngày liên tiếp');return false}
 const fresh=ds.filter(d=>!isClosed(d));if(!fresh.length){toast('Các ngày này đã có trong danh sách');return false}
 const wa=fresh.filter(d=>holImpact(d).att>0);
 if(wa.length){ask('Đã có điểm danh ở '+wa.length+' ngày ('+wa.slice(0,4).map(vdm).join(', ')+(wa.length>4?'...':'')+'). Nếu đặt các ngày này là ngày nghỉ thì các lượt điểm danh đó không còn được tính vào học phí và lương. Tiếp tục?',()=>{holAdd(fresh,n,k)},'Vẫn thêm');return}
 holAdd(fresh,n,k);f.reset()};
ACT.holsol=v=>{if(!canHol())return false;const y=String(+v||TODAY.slice(0,4));
 const fixed=[['01-01','Tết Dương lịch'],['04-30','Ngày Giải phóng miền Nam'],['05-01','Ngày Quốc tế Lao động'],['09-02','Quốc khánh']];
 let c=0;fixed.forEach(([md,n])=>{c+=holAdd([y+'-'+md],n,'le')});toast(c?'Đã thêm '+c+' ngày lễ dương lịch năm '+y:'Các ngày lễ dương lịch năm '+y+' đã có trong danh sách')};
ACT.holdel=v=>{if(!canHol())return false;const x=(DB.hol||[]).find(y=>y.id===v);if(!x)return;
 const mb=holMonthsBilled([x.d]);
 ask('Xóa ngày nghỉ “'+x.n+'” ('+vd(x.d)+')? Ngày này sẽ được tính lại là ngày học bình thường.'+(mb.length?' Hóa đơn tháng '+x.d.slice(5,7)+'/'+x.d.slice(0,4)+' đã tạo trước đó nên không tự đổi.':''),()=>{DB.hol=DB.hol.filter(y=>y.id!==v);toast('Đã xóa ngày nghỉ')},'Xóa ngày nghỉ')};

/* các ngày nghỉ sắp tới, dùng cho phụ huynh và nhân viên xem nhanh */
function holUpcoming(days){const to=addD(TODAY,days||90);return holList().filter(x=>x.d>=TODAY&&x.d<=to&&dow(x.d)!==0)}
function holCard(days){const xs=holUpcoming(days);
 return`<div class="card"><h2>Ngày Trung tâm nghỉ</h2>${xs.length?xs.map(x=>`<div class="rw"><span><b>${DAYN[dow(x.d)]} ${vd(x.d)}</b> · ${esc(x.n)}</span>${holTag(x)}</div>`).join(''):'<p class="empty">Chưa có ngày nghỉ nào trong thời gian tới.</p>'}<p class="sm mu" style="margin-top:8px">Những ngày này Trung tâm không đón bé và không tính học phí.</p></div>`}

/* --- Học phí trả trước: học phí tháng m, trừ phí dư của tháng trước --- */
/* Phí dư của tháng trước (khoản hoàn do bé nghỉ có phép, Trung tâm nghỉ, nhập viện): lấy khoản đã ghi vào công nợ tháng m, chưa ghi thì tính tạm từ điểm danh.
   Bé đã ngưng can thiệp thì không có phí dư (settle trả hoàn 0). */
function surplusPrev(k,m){const posted=DB.lg.filter(e=>e.hs===k.id&&e.kind==='hoan'&&e.m===m);
 if(posted.length)return{amt:posted.reduce((s,e)=>s+e.amt,0),posted:true};
 if(k.st!=='dang')return{amt:0,posted:false};
 return{amt:settle(k,sm(m,-1)).refund,posted:false}}
function feeBreak(k,m){const xs=sched(k,m),gross=invoice(k,m),sp=surplusPrev(k,m),st=DB.lg.filter(e=>e.hs===k.id&&e.kind==='hp'&&e.m===m);
 return{bt:xs.filter(x=>x.kind==='bt').length,s11:xs.filter(x=>x.kind==='11'&&!x.inc).length,gross,sur:sp.amt,posted:sp.posted,due:Math.max(0,gross-sp.amt),closed:holIn(m),
  has:st.length>0,stored:st.reduce((s,e)=>s+e.amt,0)}}
/* thẻ học phí tháng sau cho phụ huynh: học phí theo lịch, trừ phí dư tháng trước, số phải đóng */
function feeNextCard(k){const nm=sm(CM,1),f=feeBreak(k,nm),pm=CM;
 if(k.st==='nghi')return`<div class="card"><h2>Bé đã ngưng can thiệp</h2><p class="sm mu">Khi bé ngưng đột ngột, học phí đã đóng và phí dư không được hoàn lại. Nếu cần hỗ trợ, phụ huynh liên hệ Trung tâm.</p></div>`;
 if(k.st!=='dang'||!f.gross)return'';
 const row=(l,v,c)=>`<div class="rw"><span>${l}</span><b class="${c||''}" style="font-size:1.1em">${v}</b></div>`;
 return`<div class="card"><h2>Học phí ${mLow(nm)} (dự kiến)</h2>
  ${row('Học phí theo lịch của bé',fmt(f.gross))}
  <p class="sm mu" style="margin:-2px 0 6px">${f.bt?f.bt+' ngày bán trú':''}${f.bt&&f.s11?', ':''}${f.s11?f.s11+' buổi 1-1 tính riêng':''}${f.closed.length?'. Đã trừ '+f.closed.length+' ngày Trung tâm nghỉ: '+f.closed.map(x=>vdm(x.d)+' '+esc(x.n)).join(', '):''}.</p>
  ${row('Trừ phí dư '+mLow(pm)+(f.posted?'':' (tạm tính)'),f.sur?'-'+fmt(f.sur):fmt(0),f.sur?'ok':'')}
  ${row('Phải đóng',fmt(f.due),'ok')}
  <p class="sm mu" style="margin-top:6px">Học phí đóng trước đầu tháng. Phí dư là khoản hoàn do bé nghỉ có phép, Trung tâm nghỉ hoặc nhập viện có giấy. Số tạm tính có thể đổi nếu còn buổi chưa điểm danh.</p></div>`}
