/* ===== 3. Học sinh ===== */
const wk11=id=>DB.lich.filter(l=>l.type==='11'&&l.hs===id).length;
const progOf=k=>(k.m11||wk11(k.id)?'1-1 ('+wk11(k.id)+' buổi/tuần)':'')+(k.bt&&grBy(k.gr)?(wk11(k.id)?', ':'')+'Bán trú '+grBy(k.gr).n:'')||'Chưa đăng ký';
const mainGV=k=>k.gv?sn(k.gv):(grBy(k.gr)?sn(grBy(k.gr).gv):'Chưa phân công');
const grByAge=dob=>mo(dob)<72?'G1':'G2'; /* Ong non: dưới 6 tuổi, Ong mật: từ 6 tuổi (chỉ là gợi ý, chọn lớp tay được) */
const hsInit=()=>S.hs=Object.assign({tab:'ds',q:'',st:'dang',pr:'',gv:'',lib:{dom:'',src:'',head:'',age:'',q:''},bi:{date:WD,gv:'',q:''}},S.hs);
VIEWS.hs=()=>{const h=hsInit();
 const tabs=[['ds',isGV()?'Học sinh của tôi':'Danh sách học sinh'],['bi','Buổi can thiệp'],['mt','Ngân hàng mục tiêu']];
 if(!tabs.some(t=>t[0]===h.tab))h.tab='ds';
 return head(isGV()?'Học sinh của tôi':'Học sinh',myKids().filter(k=>k.st==='dang').length+' trẻ đang học',isLead()&&h.tab==='ds'?'<button class="btn p" data-a="hsnew">Thêm học sinh</button>':h.tab==='mt'&&isLead()?'<button class="btn p" data-a="cgnew">Thêm mục tiêu của Trung tâm</button>':'')+tabsH(tabs,h.tab,'hstab')+(h.tab==='ds'?hsList():h.tab==='bi'?hsBi():hsLib())};
ACT.hstab=v=>{S.hs.tab=v};
INP.hsq=v=>{S.hs.q=v;S.pg.hs=1};
CHG.hsf1=v=>{S.hs.st=v;S.pg.hs=1};CHG.hsf2=v=>{S.hs.pr=v;S.pg.hs=1};CHG.hsf3=v=>{S.hs.gv=v;S.pg.hs=1};
function hsList(){const h=S.hs,q=h.q.toLowerCase();
 const all=myKids().filter(k=>(!h.st||k.st===h.st)&&(!h.pr||(h.pr==='11'?wk11(k.id)>0:k.bt))&&(!h.gv||k.gv===h.gv||(grBy(k.gr)||{}).gv===h.gv)&&(!q||(k.n+' '+k.id+' '+k.pn+' '+k.pp).toLowerCase().includes(q))),p=pg('hs',all,15);
 return`<div class="card"><div class="f2" style="margin-bottom:12px"><div><label for="hsq">Tìm theo tên bé, mã hoặc phụ huynh</label><input id="hsq" data-i="hsq" value="${esc(h.q)}"></div><div><label for="hs1">Trạng thái</label><select id="hs1" data-c="hsf1"><option value="">Tất cả</option>${opts(Object.entries(KST),h.st)}</select></div><div><label for="hs2">Chương trình</label><select id="hs2" data-c="hsf2"><option value="">Tất cả</option>${opts([['11','Có can thiệp 1-1'],['bt','Có bán trú']],h.pr)}</select></div>${isLead()?`<div><label for="hs3">Giáo viên</label><select id="hs3" data-c="hsf3"><option value="">Tất cả</option>${opts(DB.staff.filter(s=>s.role==='gv').map(s=>[s.id,s.n]),h.gv)}</select></div>`:''}</div>`
 +tbl(['Mã','Họ tên','Tuổi','Nhu cầu','Chương trình','Giáo viên','Phụ huynh','Trạng thái'],p.rows.map(k=>`<tr class="k" data-a="hsopen" data-v="${k.id}"><td>${k.id}</td><td><b>${esc(k.n)}</b></td><td class="nw">${age(k.dob)}</td><td>${esc(k.nd)}</td><td>${esc(progOf(k))}</td><td>${esc(mainGV(k))}</td><td>${esc(k.pr)} ${esc(given(k.pn))}<br><span class="sm mu">${esc(k.pp)}</span></td><td>${tg(KST[k.st],k.st==='dang'?'ok':k.st==='bl'?'wa':'gy')}</td></tr>`).join(''),'Không có học sinh phù hợp.')+p.html+`</div>`}
ACT.hsopen=v=>{S.modal={t:'hs',id:v,tab:'tt'}};
ACT.hstab2=v=>{S.modal.tab=v};
MODALS.hs=()=>{const m=S.modal,k=kidBy(m.id);if(!k||!canKid(k.id)){S.modal=null;return''}
 const T=[['tt','Thông tin'],['kh','Kế hoạch mục tiêu'],['bt','Buổi can thiệp'],['tb','Tiến bộ'],['vd','Video'],['td','Tài liệu']];
 let b;switch(m.tab){case'kh':b=hsPlan(k);break;case'bt':b=hsSess(k);break;case'tb':b=progView(k,{staff:true});break;case'vd':b=vidList(k.id);break;case'td':b=docList(k.id);break;default:b=hsInfo(k)}
 return mdl(k.n+' · '+k.id,tabsH(T,m.tab,'hstab2')+b,1)};
function hsInfo(k){const g=grBy(k.gr),r=(a,b)=>`<div class="rw"><span class="mu">${a}</span><b>${b}</b></div>`;
 return`<div class="two"><div>${r('Giới tính',k.g==='M'?'Nam':'Nữ')}${r('Ngày sinh',vd(k.dob)+' ('+age(k.dob)+')')}${r('Ngày nhập học',vd(k.sd))}${r('Nhu cầu',esc(k.nd))}${r('Trạng thái',tg(KST[k.st],k.st==='dang'?'ok':'gy'))}${r('Chương trình',esc(progOf(k)))}${r('Giáo viên 1-1',k.gv?esc(sn(k.gv)):'Không có')}${r('Nhóm bán trú',g?esc(g.n):'Không có')}</div>
 <div>${r('Phụ huynh',esc(k.pr)+' '+esc(k.pn))}${r('Điện thoại',esc(k.pp))}${r('Email cổng phụ huynh',esc(k.pe))}${canMoney()?r('Công nợ',fmt(balance(k.id))):''}<div class="acts" style="margin-top:12px">${isLead()?`<button class="btn p" data-a="hsedit" data-v="${k.id}">Sửa hồ sơ</button>`:''}<button class="btn" data-a="ddkid" data-v="${k.id}">Bảng chấm công của bé</button></div></div></div>`}
/* --- thêm, sửa hồ sơ --- */
ACT.hsnew=()=>{S.modal={t:'hsf',id:''}};
ACT.hsedit=v=>{S.modal={t:'hsf',id:v}};
MODALS.hsf=()=>{const id=S.modal.id,k=id?kidBy(id):{n:'',g:'M',dob:addD(TODAY,-365*4),sd:TODAY,st:'dang',nd:NEEDS[0],bt:false,gr:'',gv:'',pn:'',pr:'Mẹ',pp:'',pe:''};
 const f=(n,l,v,t,x)=>`<div><label for="hf-${n}">${l}</label><input id="hf-${n}" name="${n}" type="${t||'text'}" value="${esc(v)}" ${x||''}></div>`;
 return mdl(id?'Sửa hồ sơ '+k.n:'Thêm học sinh',`<form id="hsff" class="f"><div class="f2">${f('n','Họ và tên bé',k.n,'text','required')}<div><label for="hf-g">Giới tính</label><select id="hf-g" name="g">${opts([['M','Nam'],['F','Nữ']],k.g)}</select></div>${f('dob','Ngày sinh',k.dob,'date','required max="'+TODAY+'"')}${f('sd','Ngày nhập học',k.sd,'date')}<div><label for="hf-nd">Nhu cầu chính</label><select id="hf-nd" name="nd">${opts(NEEDS.map(x=>[x,x]),k.nd)}</select></div><div><label for="hf-st">Trạng thái</label><select id="hf-st" name="st">${opts(Object.entries(KST),k.st)}</select></div>
 <div><label for="hf-bt">Bán trú</label><select id="hf-bt" name="bt">${opts([['0','Không'],['1','Có']],k.bt?'1':'0')}</select></div><div><label for="hf-gr">Nhóm bán trú</label><select id="hf-gr" name="gr"><option value="">Tự chọn theo tuổi</option>${opts(DB.groups.map(g=>[g.id,g.n]),k.gr)}</select></div>
 ${id?'':`<div><label for="hf-gv">Giáo viên 1-1</label><select id="hf-gv" name="gv"><option value="">Chưa phân công</option>${opts(DB.staff.filter(s=>s.role==='gv'&&s.st==='dang').map(s=>[s.id,s.n]),'')}</select></div>`}</div>
 <h3>Phụ huynh</h3><div class="f2"><div><label for="hf-pr">Quan hệ</label><select id="hf-pr" name="pr">${opts(['Mẹ','Bố','Ông bà','Người giám hộ'].map(x=>[x,x]),k.pr)}</select></div>${f('pn','Họ tên phụ huynh',k.pn,'text','required')}${f('pp','Điện thoại',k.pp,'tel','required')}${f('pe','Email đăng nhập cổng phụ huynh',k.pe,'email','required')}</div>
 ${id?'<p class="note sm">Buổi 1-1 và giáo viên được thay đổi ở mục Lịch học và Phân công để hệ thống kiểm tra trùng lịch.</p>':'<p class="note sm">Sau khi thêm, hãy xếp các buổi 1-1 ở mục Lịch học.</p>'}
 <div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu hồ sơ</button></div></form>`)};
FORM.hsff=f=>{const g=n=>f.elements[n]?f.elements[n].value.trim():'',id=S.modal.id,isNew=!id;
 const k=isNew?{id:'hs'+String(Math.max(...DB.kids.map(x=>+x.id.slice(2)))+1).padStart(3,'0'),m11:0,gv:g('gv')||null}:kidBy(id);
 if(!g('n')||!g('pn')||!g('pe')){toast('Vui lòng nhập đủ tên bé, tên và email phụ huynh');return false}
 const bt=g('bt')==='1';Object.assign(k,{n:g('n'),g:g('g'),dob:g('dob'),sd:g('sd')||TODAY,st:g('st'),nd:g('nd'),bt,gr:bt?(g('gr')||grByAge(g('dob'))):'',pr:g('pr'),pn:g('pn'),pp:g('pp'),pe:g('pe').toLowerCase()});
 if(isNew)DB.kids.push(k);if(!bt)k.gr='';
 S.modal={t:'hs',id:k.id,tab:'tt'};toast(isNew?'Đã thêm học sinh':'Đã lưu hồ sơ')};
