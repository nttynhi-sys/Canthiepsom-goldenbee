/* ===== 3. Học sinh ===== */
const wk11=id=>DB.lich.filter(l=>l.type==='11'&&l.hs===id).length;
/* số ca 1-1 hằng tuần ngoài các ca nằm trong gói bán trú (mỗi ngày bán trú có tối đa một ca trong gói) */
const ex11=k=>{const bd=btOf(k),ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id);return ls.length-bd.filter(w=>ls.some(l=>l.day===w)).length};
const progOf=k=>{const bd=btOf(k),g=bd.length&&grBy(k.gr),e=ex11(k),a=[];
 if(g)a.push('Bán trú '+g.n+' ('+dayTx(bd)+')');
 if(e>0)a.push(g?'1-1 thêm '+e+' buổi/tuần':'1-1 ('+e+' buổi/tuần)');
 return a.join(', ')||'Chưa đăng ký'};
const mainGV=k=>k.gv?sn(k.gv):(grBy(k.gr)?sn(grBy(k.gr).gv):'Chưa phân công');
const grByAge=dob=>mo(dob)<72?'G1':'G2'; /* Ong non: dưới 6 tuổi, Ong mật: từ 6 tuổi (chỉ là gợi ý, chọn lớp tay được) */
const hsInit=()=>S.hs=Object.assign({tab:'ds',q:'',st:'dang',pr:'',gv:'',dx:'',lib:{dom:'',src:'',head:'',age:'',q:''},bi:{date:WD,gv:'',q:''}},S.hs);
VIEWS.hs=()=>{const h=hsInit();
 const tabs=[['ds',isGV()?'Học sinh của tôi':'Danh sách học sinh'],['bi','Buổi can thiệp'],['mt','Ngân hàng mục tiêu']];
 if(!tabs.some(t=>t[0]===h.tab))h.tab='ds';
 return head(isGV()?'Học sinh của tôi':'Học sinh',myKids().filter(k=>k.st==='dang').length+' trẻ đang học',isLead()&&h.tab==='ds'?'<button class="btn p" data-a="hsnew">Thêm học sinh</button>':h.tab==='mt'&&isLead()?'<button class="btn p" data-a="cgnew">Thêm mục tiêu của Trung tâm</button>':'')+tabsH(tabs,h.tab,'hstab')+(h.tab==='ds'?hsList():h.tab==='bi'?hsBi():hsLib())};
ACT.hstab=v=>{S.hs.tab=v};
INP.hsq=v=>{S.hs.q=v;S.pg.hs=1};
CHG.hsf1=v=>{S.hs.st=v;S.pg.hs=1};CHG.hsf2=v=>{S.hs.pr=v;S.pg.hs=1};CHG.hsf3=v=>{S.hs.gv=v;S.pg.hs=1};CHG.hsf4=v=>{S.hs.dx=v;S.pg.hs=1};
const dxCell=k=>{const a=dxNames(k);return a.length?esc(a.slice(0,2).join('; '))+(a.length>2?' <b>+'+(a.length-2)+'</b>':''):'<span class="mu">Chưa ghi</span>'};
function hsList(){const h=S.hs,q=h.q.toLowerCase();
 const all=myKids().filter(k=>(!h.st||k.st===h.st)&&(!h.pr||(h.pr==='11'?wk11(k.id)>0:k.bt))&&(!h.gv||k.gv===h.gv||(grBy(k.gr)||{}).gv===h.gv)&&(!h.dx||dxOf(k).includes(h.dx))&&(!q||(k.n+' '+k.id+' '+k.pn+' '+k.pp+' '+dxNames(k).join(' ')).toLowerCase().includes(q))),p=pg('hs',all,15);
 const dxUsed=DXG.map(g=>[g.t,g.a.filter(x=>DB.kids.some(k=>dxOf(k).includes(x[0])))]).filter(g=>g[1].length);
 return`<div class="card"><div class="f2" style="margin-bottom:12px"><div><label for="hsq">Tìm theo tên bé, mã, phụ huynh hoặc chẩn đoán</label><input id="hsq" data-i="hsq" value="${esc(h.q)}"></div><div><label for="hs1">Trạng thái</label><select id="hs1" data-c="hsf1"><option value="">Tất cả</option>${opts(Object.entries(KST),h.st)}</select></div><div><label for="hs2">Chương trình</label><select id="hs2" data-c="hsf2"><option value="">Tất cả</option>${opts([['11','Có can thiệp 1-1'],['bt','Có bán trú']],h.pr)}</select></div><div><label for="hs4">Chẩn đoán</label><select id="hs4" data-c="hsf4"><option value="">Tất cả</option>${dxUsed.map(g=>`<optgroup label="${esc(g[0])}">${opts(g[1].map(x=>[x[0],dxShort(x[0])]),h.dx)}</optgroup>`).join('')}</select></div>${isLead()?`<div><label for="hs3">Giáo viên</label><select id="hs3" data-c="hsf3"><option value="">Tất cả</option>${opts(DB.staff.filter(s=>s.role==='gv').map(s=>[s.id,s.n]),h.gv)}</select></div>`:''}</div>`
 +tbl(['Mã','Họ tên','Tuổi','Nhu cầu, chẩn đoán','Chương trình','Giáo viên','Phụ huynh','Trạng thái'],p.rows.map(k=>`<tr class="k" data-a="hsopen" data-v="${k.id}"><td>${k.id}</td><td><b>${esc(k.n)}</b></td><td class="nw">${age(k.dob)}</td><td>${esc(k.nd)}<br><span class="sm">${dxCell(k)}</span></td><td>${esc(progOf(k))}</td><td>${esc(mainGV(k))}</td><td>${esc(k.pr)} ${esc(given(k.pn))}<br><span class="sm mu">${esc(k.pp)}</span></td><td>${tg(KST[k.st],k.st==='dang'?'ok':k.st==='bl'?'wa':'gy')}</td></tr>`).join(''),'Không có học sinh phù hợp.')+p.html+`</div>`}
ACT.hsopen=v=>{S.modal={t:'hs',id:v,tab:'tt'}};
ACT.hstab2=v=>{S.modal.tab=v};
MODALS.hs=()=>{const m=S.modal,k=kidBy(m.id);if(!k||!canKid(k.id)){S.modal=null;return''}
 const T=[['tt','Thông tin'],['lh','Lịch học'],['kh','Kế hoạch mục tiêu'],['bt','Buổi can thiệp'],['tb','Tiến bộ'],['vd','Video'],['td','Tài liệu']];
 let b;switch(m.tab){case'lh':b=hsSchedule(k);break;case'kh':b=hsPlan(k);break;case'bt':b=hsSess(k);break;case'tb':b=progView(k,{staff:true});break;case'vd':b=vidList(k.id);break;case'td':b=docList(k.id);break;default:b=hsInfo(k)}
 return mdl(k.n+' · '+k.id,tabsH(T,m.tab,'hstab2')+b,1)};
function hsInfo(k){const g=grBy(k.gr),r=(a,b)=>`<div class="rw"><span class="mu">${a}</span><b>${b}</b></div>`;
 return`<div class="two"><div>${r('Giới tính',k.g==='M'?'Nam':'Nữ')}${r('Ngày sinh',vd(k.dob)+' ('+age(k.dob)+')')}${r('Ngày nhập học',vd(k.sd))}${r('Nhu cầu chính',esc(k.nd))}${r('Chẩn đoán',dxOf(k).length||k.dxo?dxNames(k,dxFull).map(x=>`<span style="display:block;text-align:right">${esc(x)}</span>`).join(''):'<span class="mu">Chưa ghi</span>')}${k.dxn?r('Nơi, bác sĩ, ngày chẩn đoán',esc(k.dxn)):''}${r('Trạng thái',tg(KST[k.st],k.st==='dang'?'ok':'gy'))}${r('Chương trình',esc(progOf(k)))}${r('Giáo viên 1-1',k.gv?esc(sn(k.gv)):'Không có')}${r('Nhóm bán trú',g&&k.bt?esc(g.n)+' · '+dayTx(btOf(k)):'Không có')}</div>
 <div>${r('Phụ huynh',esc(k.pr)+' '+esc(k.pn))}${r('Điện thoại',esc(k.pp))}${r('Email cổng phụ huynh',esc(k.pe||'—'))}${canMoney()?r('Công nợ',fmt(balance(k.id))):''}<div class="acts" style="margin-top:12px">${isLead()?`<button class="btn p" data-a="hsedit" data-v="${k.id}">Sửa hồ sơ</button>`:''}<button class="btn" data-a="ddkid" data-v="${k.id}">Bảng chấm công của bé</button></div></div></div>`}
/* --- thêm, sửa hồ sơ --- */
ACT.hsnew=()=>{S.modal={t:'hsf',id:''}};
ACT.hsedit=v=>{S.modal={t:'hsf',id:v}};
/* ô chọn các ngày trong tuần (T2 đến T7) kèm nút chọn nhanh */
const dayBoxes=(pre,sel)=>`<div class="dybx">${DAY_ALL.map(w=>`<label class="chk"><input type="checkbox" name="${pre}${w}" ${sel.includes(w)?'checked':''}> ${DAYS[w]}</label>`).join('')}</div><div class="acts" style="margin-top:6px"><button class="btn s" type="button" data-a="dayset" data-v="${pre}|1,2,3,4,5">T2–T6</button><button class="btn s" type="button" data-a="dayset" data-v="${pre}|1,2,3,4,5,6">T2–T7</button><button class="btn s" type="button" data-a="dayset" data-v="${pre}|">Bỏ chọn</button></div>`;
ACT.dayset=v=>{const [pre,list]=v.split('|'),on=list?list.split(',').map(Number):[];
 document.querySelectorAll('input[type=checkbox][name^="'+pre+'"]').forEach(c=>{const w=+c.name.slice(pre.length);if(w>=1&&w<=6)c.checked=on.includes(w)});return false};
const daysOf=(f,pre)=>DAY_ALL.filter(w=>f.elements[pre+w]&&f.elements[pre+w].checked);
/* khối chọn chẩn đoán: nhóm theo loại, chọn nhiều, có ô lọc nhanh */
const dxSumTx=n=>n?'Đã chọn '+n+' chẩn đoán':'Chưa chọn chẩn đoán nào';
function dxField(k){const sel=new Set(dxOf(k));
 return`<h3>Chẩn đoán</h3><div class="dxbox"><label for="dxq">Chọn tất cả chẩn đoán phù hợp với bé</label><input id="dxq" type="search" data-flt="1" placeholder="Gõ để lọc, ví dụ: tự kỷ, nói lắp, F80" autocomplete="off"><p class="sm mu" id="dxsum" style="margin:6px 0">${dxSumTx(sel.size)}</p>
 ${DXG.map(g=>{const n=g.a.filter(x=>sel.has(x[0])).length;return`<details data-fg="1" ${n?'open':''}><summary><b>${esc(g.t)}</b> <span class="mu sm">${g.a.length} mục${n?' · đã chọn '+n:''}</span></summary><div class="dxl">${g.a.map(x=>`<label class="chk dxi" data-ft="${esc(ascii(x[1]+' '+x[2]))}"><input type="checkbox" name="dx" value="${x[0]}" ${sel.has(x[0])?'checked':''}> <span>${esc(x[1])}${x[2]?' <span class="mu sm">'+esc(x[2])+'</span>':''}</span></label>`).join('')}</div></details>`}).join('')}
 <div class="f2" style="margin-top:8px"><div><label for="hf-dxo">Chẩn đoán khác (ghi rõ)</label><input id="hf-dxo" name="dxo" value="${esc(k.dxo||'')}"></div><div><label for="hf-dxn">Nơi chẩn đoán, bác sĩ, ngày</label><input id="hf-dxn" name="dxn" value="${esc(k.dxn||'')}"></div></div>
 <p class="sm mu" style="margin-top:6px">Mã ICD-10 chỉ để tra cứu. Chẩn đoán chính thức do bác sĩ hoặc cơ sở y tế đưa ra; hồ sơ ghi lại để giáo viên lập kế hoạch can thiệp.</p></div>`}
/* lọc nhanh danh sách chẩn đoán ngay trong trình duyệt, không dựng lại biểu mẫu nên không mất nội dung đang nhập */
document.addEventListener('input',e=>{const t=e.target;if(!t.dataset||!t.dataset.flt)return;const q=ascii(t.value),root=t.closest('form')||document;
 root.querySelectorAll('[data-ft]').forEach(el=>{el.hidden=!!q&&!el.dataset.ft.includes(q)});
 root.querySelectorAll('details[data-fg]').forEach(d=>{const any=!!d.querySelector('[data-ft]:not([hidden])');d.hidden=!any;if(q&&any)d.open=true})});
document.addEventListener('change',e=>{const t=e.target;if(!t||t.name!=='dx')return;const f=t.closest('form'),s=f&&f.querySelector('#dxsum');if(s)s.textContent=dxSumTx(f.querySelectorAll('input[name=dx]:checked').length)});
MODALS.hsf=()=>{const id=S.modal.id,k=id?kidBy(id):{n:'',g:'M',dob:addD(TODAY,-365*4),sd:TODAY,st:'dang',nd:NEEDS[0],bt:false,gr:'',gv:'',pn:'',pr:'Mẹ',pp:'',pe:'',dx:[]};
 const f=(n,l,v,t,x)=>`<div><label for="hf-${n}">${l}</label><input id="hf-${n}" name="${n}" type="${t||'text'}" value="${esc(v)}" ${x||''}></div>`;
 return mdl(id?'Sửa hồ sơ '+k.n:'Thêm học sinh',`<form id="hsff" class="f"><div class="f2">${f('n','Họ và tên bé',k.n,'text','required')}<div><label for="hf-g">Giới tính</label><select id="hf-g" name="g">${opts([['M','Nam'],['F','Nữ']],k.g)}</select></div>${f('dob','Ngày sinh',k.dob,'date','required max="'+TODAY+'"')}${f('sd','Ngày nhập học',k.sd,'date')}<div><label for="hf-nd">Nhu cầu chính</label><select id="hf-nd" name="nd">${opts(NEEDS.map(x=>[x,x]),k.nd)}</select></div><div><label for="hf-st">Trạng thái</label><select id="hf-st" name="st">${opts(Object.entries(KST),k.st)}</select><small class="mu">Chọn “Đã nghỉ” khi bé ngưng can thiệp: học phí đã đóng và phí dư không được hoàn.</small></div>
 <div><label for="hf-bt">Bán trú</label><select id="hf-bt" name="bt">${opts([['0','Không'],['1','Có']],k.bt?'1':'0')}</select></div><div><label for="hf-gr">Nhóm bán trú</label><select id="hf-gr" name="gr"><option value="">Tự chọn theo tuổi</option>${opts(DB.groups.map(g=>[g.id,g.n]),k.gr)}</select></div>
 ${id?'':`<div><label for="hf-gv">Giáo viên 1-1</label><select id="hf-gv" name="gv"><option value="">Chưa phân công</option>${opts(DB.staff.filter(s=>s.role==='gv'&&s.st==='dang').map(s=>[s.id,s.n]),'')}</select></div>`}</div>
 <div style="margin-top:10px"><span class="lbl">Ngày học bán trú trong tuần (chỉ dùng khi chọn Có bán trú)</span>${dayBoxes('bd',k.btd&&k.btd.length?k.btd:DAY_BT)}</div>
 ${dxField(k)}
 <h3>Phụ huynh</h3><div class="f2"><div><label for="hf-pr">Quan hệ</label><select id="hf-pr" name="pr">${opts(['Mẹ','Bố','Ông bà','Người giám hộ'].map(x=>[x,x]),k.pr)}</select></div>${f('pn','Họ tên phụ huynh',k.pn,'text','required')}${f('pp','Điện thoại',k.pp,'tel','required')}${f('pe','Email cổng phụ huynh (hoặc dùng số điện thoại)',k.pe,'email')}</div>
 ${id?'<p class="note sm">Các buổi 1-1 hằng tuần của bé xếp ở thẻ Lịch học trong hồ sơ bé, hoặc ở mục Lịch học, để hệ thống kiểm tra trùng giáo viên, phòng.</p>':'<p class="note sm">Sau khi thêm, mở hồ sơ bé, vào thẻ Lịch học để chọn ngày bán trú và xếp các buổi 1-1.</p>'}
 <div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu hồ sơ</button></div></form>`)};
FORM.hsff=f=>{const g=n=>f.elements[n]?f.elements[n].value.trim():'',id=S.modal.id,isNew=!id;
 const k=isNew?{id:'hs'+String(Math.max(...DB.kids.map(x=>+x.id.slice(2)))+1).padStart(3,'0'),m11:0,gv:g('gv')||null}:kidBy(id);
 if(!g('n')||!g('pn')||(!g('pe')&&!telNorm(g('pp')))){toast('Vui lòng nhập tên bé, tên phụ huynh và email hoặc số điện thoại phụ huynh');return false}
 const bt=g('bt')==='1',bd=daysOf(f,'bd'),wasSt=isNew?'dang':k.st;
 if(bt&&!bd.length){toast('Hãy chọn ít nhất một ngày học bán trú');return false}
 Object.assign(k,{n:g('n'),g:g('g'),dob:g('dob'),sd:g('sd')||TODAY,st:g('st'),nd:g('nd'),bt,gr:bt?(g('gr')||grByAge(g('dob'))):'',pr:g('pr'),pn:g('pn'),pp:g('pp'),pe:g('pe').toLowerCase(),
  dx:[...f.querySelectorAll('input[name=dx]:checked')].map(x=>x.value),dxo:g('dxo'),dxn:g('dxn')});
 if(bt)k.btd=bd;else delete k.btd;
 if(wasSt!=='nghi'&&k.st==='nghi')k.stopAt=TODAY;else if(k.st!=='nghi')delete k.stopAt;   /* ngưng đột ngột: không hoàn phí dư nào (xem settle) */
 if(isNew)DB.kids.push(k);if(!bt)k.gr='';
 S.modal={t:'hs',id:k.id,tab:'tt'};toast(isNew?'Đã thêm học sinh':wasSt!=='nghi'&&k.st==='nghi'?'Đã lưu: bé ngưng can thiệp, học phí đã đóng và phí dư không hoàn':'Đã lưu hồ sơ')};

/* --- thẻ Lịch học trong hồ sơ bé: ngày bán trú, các buổi 1-1 hằng tuần, thời khóa biểu --- */
function hsSchedule(k){const lead=isLead(),m=S.modal,bd=btOf(k),g=grBy(k.gr),$$=canMoney();
 const ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).sort((a,b)=>a.day-b.day||(a.slot<b.slot?-1:a.slot>b.slot?1:0)),inc=new Set(bd.map(w=>incIdW(k,w)).filter(Boolean));
 const miss=bd.filter(w=>!ls.some(l=>l.day===w));
 const bt=`<div class="card"><h2>Bán trú</h2>`+(lead?`<form id="btf" class="f"><div class="f2"><div><label for="bt-on">Học bán trú</label><select id="bt-on" name="bt">${opts([['0','Không'],['1','Có']],k.bt?'1':'0')}</select></div><div><label for="bt-gr">Lớp</label><select id="bt-gr" name="gr">${opts(DB.groups.map(x=>[x.id,x.n]),k.gr||grByAge(k.dob))}</select></div></div>
  <div style="margin-top:8px"><span class="lbl">Ngày bán trú trong tuần</span>${dayBoxes('bd',bd.length?bd:DAY_BT)}</div>
  <p class="sm mu">Mỗi ngày bán trú có một ca 1-1 (${SLOT_MIN} phút) nằm trong gói bán trú${$$?' ('+fmt(DB.cfg.pbtDay)+' mỗi ngày, trong đó '+fmt(DB.cfg.pbtDay11)+' là ca 1-1)':''}. Thứ Bảy chỉ chọn cho bé học thứ Bảy.</p>
  <div class="acts" style="justify-content:flex-end"><button class="btn p" type="submit">Lưu bán trú</button></div></form>`
  :`<p>${bd.length&&g?'Lớp <b>'+esc(g.n)+'</b>, học '+esc(dayTx(bd)):'Bé không học bán trú.'}</p>`)+`</div>`;
 const rows=ls.map(l=>`<tr><td class="nw">${DAYN[l.day]}</td><td class="nw">${slotLb(l.slot)}</td><td>${esc(sn(l.gv))}</td><td>${esc(l.room)}</td><td>${inc.has(l.id)?tg('Ca của bán trú','in'):tg('Ca 1-1 thêm','gy')}${$$&&!inc.has(l.id)?' <span class="sm mu">'+fnum(fee11(k))+' ₫</span>':''}${(btWarn(k,l.day,l.slot)?'<br><span class="sm mu">Lưu ý: '+esc(btWarn(k,l.day,l.slot))+'</span>':'')}</td>${lead?`<td class="r"><button class="btn s no" data-a="hslsdel" data-v="${l.id}">Xóa</button></td>`:''}</tr>`).join('');
 const res=m.res?`<div class="note sm" style="margin-bottom:10px">${m.res.ok?'<b>Đã thêm '+m.res.ok+' buổi.</b> ':''}${m.res.bad.length?'<b>Không thêm được:</b> '+esc(m.res.bad.join('; '))+'. ':''}${m.res.warn.length?'<b>Lưu ý:</b> '+esc(m.res.warn.join('; ')):''}</div>`:'';
 const pool=pool11(),one=`<div class="card"><h2>Các buổi 1-1 hằng tuần</h2>${res}${miss.length?`<p class="note sm" style="margin-bottom:10px">Ngày bán trú chưa có ca 1-1: ${esc(miss.map(w=>DAYS[w]).join(', '))}.</p>`:''}`
  +tbl(['Thứ','Ca','Giáo viên','Phòng','Loại'].concat(lead?['']:[]),rows,'Bé chưa có buổi 1-1 cố định.')
  +(lead?`<form id="lsmf" class="f" style="margin-top:14px"><h3>Thêm buổi 1-1 cho nhiều ngày cùng lúc</h3><div class="f2"><div><label for="lm-g">Giáo viên</label><select id="lm-g" name="gv"><option value="">Chọn giáo viên</option>${opts(pool.map(s=>[s.id,s.n]),k.gv&&pool.some(s=>s.id===k.gv)?k.gv:'')}</select></div><div><label for="lm-s">Giờ bắt đầu</label>${slotInput('lm-s',m.slot||SLOTS[1])}<small class="mu">Ca ${SLOT_MIN} phút, tự tính giờ kết thúc.</small></div><div><label for="lm-r">Phòng</label><select id="lm-r" name="room"><option value="">Tự chọn phòng trống</option>${opts(ROOMS.map(r=>[r,r]),'')}</select></div></div>
   <div><span class="lbl">Học vào các ngày</span>${dayBoxes('d',bd.length?bd:[])}</div>
   <p class="sm mu">Mỗi bé chọn ngày riêng: có bé học T2–T7, có bé chỉ vài buổi mỗi tuần. Hệ thống kiểm tra trùng giáo viên, bé, phòng ở từng ngày và chỉ thêm những ngày còn trống.</p>
   <div class="acts" style="justify-content:flex-end"><button class="btn p" type="submit">Thêm các buổi</button></div></form>`:'')+`</div>`;
 const tt=`<div class="card"><h2>Thời khóa biểu của ${esc(given(k.n))}</h2>${kidWeek(k)}</div>`;
 return bt+one+tt}
FORM.btf=f=>{if(!isLead())return false;const k=kidBy(S.modal.id),bt=f.elements.bt.value==='1',bd=daysOf(f,'bd');
 if(bt&&!bd.length){toast('Hãy chọn ít nhất một ngày bán trú');return false}
 k.bt=bt;if(bt){k.gr=f.elements.gr.value||grByAge(k.dob);k.btd=bd}else{k.gr='';delete k.btd}
 S.modal.res=null;toast('Đã lưu lịch bán trú')};
FORM.lsmf=f=>{if(!isLead())return false;const k=kidBy(S.modal.id),e=f.elements,gv=e.gv.value,slot=String(e.slot.value||'').slice(0,5),days=daysOf(f,'d');
 if(!gv){toast('Hãy chọn giáo viên');return false}
 if(!slotValid(slot)){toast(slotMsg);return false}
 if(!days.length){toast('Hãy chọn ít nhất một ngày');return false}
 const res={ok:0,bad:[],warn:[]};
 days.forEach(w=>{const room=e.room.value||ROOMS.find(r=>!conflict({day:w,slot,gv,hs:k.id,room:r}))||'',x={id:'l'+uid(),type:'11',day:w,slot,gv,hs:k.id,room},c=room?conflict(x):(conflict(Object.assign({},x,{room:''}))||'Không còn phòng trống');   /* hết phòng vì giáo viên hoặc bé đã bận thì báo đúng lý do */
  if(c){res.bad.push(DAYS[w]+': '+c);return}
  DB.lich.push(x);res.ok++;const wn=btWarn(k,w,slot);if(wn)res.warn.push(DAYS[w]+': '+wn)});
 if(res.ok&&!k.gv)k.gv=gv;k.m11=wk11(k.id);S.modal.res=res;S.modal.slot=slot;
 if(res.ok&&!res.bad.length)toast('Đã thêm '+res.ok+' buổi 1-1')};
ACT.hslsdel=v=>{const l=DB.lich.find(x=>x.id===v),k=l&&kidBy(l.hs),back=S.modal;if(!l||!k||!isLead())return false;
 ask('Xóa buổi 1-1 '+DAYN[l.day]+' '+slotLb(l.slot)+' của bé '+k.n+'? Các lần điểm danh trước đây vẫn được giữ.',()=>{DB.lich=DB.lich.filter(x=>x.id!==v);k.m11=wk11(k.id);S.modal=Object.assign({},back,{res:null});toast('Đã xóa buổi học')},'Xóa buổi')};
