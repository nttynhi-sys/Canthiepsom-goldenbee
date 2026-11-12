/* ===== 3. Học sinh ===== */
const wk11=id=>DB.lich.filter(l=>l.type==='11'&&l.hs===id).length;
/* số ca 1-1 hằng tuần ngoài các ca nằm trong gói bán trú (mỗi ngày bán trú có tối đa một ca trong gói) */
/* Mã hồ sơ bé: HS01, HS02, HS03... Số thứ tự nằm trong mã (HS01 -> 1, mã cũ hs012 -> 12); mã không có số (hỏng) -> 0. */
const kidNo=id=>{const m=/^[Hh][Ss](\d+)$/.exec(String(id||''));return m?+m[1]:0};
/* Mã cho bé mới = số lớn nhất đang có cộng 1, bắt đầu từ HS01 khi chưa có bé nào (trước đây Math.max của danh sách rỗng ra -Infinity thành mã "hs-Infinity"), và không bao giờ trùng mã đang có. */
function newKidId(){const ks=DB.kids||[];let n=ks.reduce((a,k)=>Math.max(a,kidNo(k.id)),0)+1,id;do{id='HS'+pad(n++)}while(ks.some(k=>k.id===id));return id}
/* Mã học sinh hiển thị: HS01-BT (có bán trú, kèm 1-1) hoặc HS01-CN (chỉ can thiệp 1-1 cá nhân). Mã nội bộ k.id làm khóa dữ liệu nên không đổi; bé học cả bán trú và 1-1 thêm tính là BT.
   Số trong mã hiển thị là k.no (số thứ tự hiển thị) nếu bé có, chưa có thì lấy số trong k.id nên dữ liệu cũ không đổi. Khi xóa hồ sơ bé thì các số còn lại được dồn cho liên tục (kidRenumber),
   chỉ đổi k.no chứ không đổi k.id: khóa nối bé với buổi học, kế hoạch, điểm danh, học phí và tài khoản phụ huynh vẫn nguyên. Muốn trả về mã cũ thì bỏ k.no. */
const kNo=k=>k&&Number.isInteger(k.no)&&k.no>0?k.no:kidNo(k&&k.id);
const kStt=k=>{const n=kNo(k);return n?'HS'+pad(n):String((k&&k.id)||'')};
/* số hiển thị cho bé mới: số lớn nhất đang có cộng 1 (khóa k.id vẫn lấy từ newKidId, hai số này có thể khác nhau sau khi đã dồn mã) */
const nextKNo=()=>(DB.kids||[]).reduce((a,k)=>Math.max(a,kNo(k)),0)+1;
/* kế hoạch dồn mã: xếp theo số hiển thị hiện có (giữ nguyên thứ tự), đánh lại 1..N; chỉ liệt kê bé phải đổi số. Tính trên toàn bộ DB.kids nên chỉ dùng cho Trưởng Trung tâm, Quản lý (thấy đủ mọi bé). */
function kidRenumPlan(){
 const ks=(DB.kids||[]).slice().sort((a,b)=>(kNo(a)||1e9)-(kNo(b)||1e9)||kidNo(a.id)-kidNo(b.id)||String(a.id).localeCompare(String(b.id)));
 return ks.map((k,i)=>({k,from:kNo(k),to:i+1})).filter(x=>x.from!==x.to)}
function kidRenumber(){const pl=kidRenumPlan();pl.forEach(x=>{x.k.no=x.to});return pl.length}
const kcode=k=>kStt(k)+'-'+(k&&k.bt?'BT':'CN');
const kcodeOf=id=>{const k=kidBy(id);return k?kcode(k):String(id||'')};
const ex11=k=>{const bd=btOf(k),ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id);return ls.length-bd.filter(w=>ls.some(l=>l.day===w)).length};
const progOf=k=>{const bd=btOf(k),g=bd.length&&grBy(k.gr),e=ex11(k),a=[];
 if(g)a.push('Bán trú '+g.n+' ('+dayTx(bd)+')');
 if(e>0)a.push(g?'1-1 thêm '+e+' buổi/tuần':'1-1 ('+e+' buổi/tuần)');
 return a.join(', ')||'Chưa đăng ký'};
const mainGV=k=>k.gv?sn(k.gv):(grBy(k.gr)?grNames(grBy(k.gr)):'Chưa phân công');
const grByAge=dob=>mo(dob)<72?'G1':'G2'; /* Ong non: dưới 6 tuổi, Ong mật: từ 6 tuổi (chỉ là gợi ý, chọn lớp tay được) */
const hsInit=()=>S.hs=Object.assign({tab:'ds',q:'',st:'dang',pr:'',gv:'',dx:'',lib:{dom:'',src:'',head:'',age:'',q:''},bi:{date:WD,gv:'',q:''}},S.hs);
VIEWS.hs=()=>{const h=hsInit();
 const tabs=[['ds',isGV()?'Học sinh của tôi':'Danh sách học sinh'],['bi','Buổi can thiệp'],['mt','Ngân hàng mục tiêu']];
 if(!tabs.some(t=>t[0]===h.tab))h.tab='ds';
 return head(isGV()?'Học sinh của tôi':'Học sinh',myKids().filter(k=>k.st==='dang').length+' trẻ đang học',isLead()&&h.tab==='ds'?(kidRenumPlan().length?'<button class="btn" data-a="krenopen">Sắp xếp lại mã</button> ':'')+'<button class="btn p" data-a="hsnew">Thêm học sinh</button>':h.tab==='mt'&&isLead()?'<button class="btn p" data-a="cgnew">Thêm mục tiêu của Trung tâm</button>':'')+tabsH(tabs,h.tab,'hstab')+(h.tab==='ds'?hsList():h.tab==='bi'?hsBi():hsLib())};
ACT.hstab=v=>{S.hs.tab=v};
INP.hsq=v=>{S.hs.q=v;S.pg.hs=1};
CHG.hsf1=v=>{S.hs.st=v;S.pg.hs=1};CHG.hsf2=v=>{S.hs.pr=v;S.pg.hs=1};CHG.hsf3=v=>{S.hs.gv=v;S.pg.hs=1};CHG.hsf4=v=>{S.hs.dx=v;S.pg.hs=1};
const dxCell=k=>{const a=dxNames(k);return a.length?esc(a.slice(0,2).join('; '))+(a.length>2?' <b>+'+(a.length-2)+'</b>':''):'<span class="mu">Chưa ghi</span>'};
function hsList(){const h=S.hs,q=h.q.toLowerCase();
 const all=myKids().filter(k=>(!h.st||k.st===h.st)&&(!h.pr||(h.pr==='11'?wk11(k.id)>0:k.bt))&&(!h.gv||k.gv===h.gv||grHas(grBy(k.gr),h.gv))&&(!h.dx||dxOf(k).includes(h.dx))&&(!q||(k.n+' '+kcode(k)+' '+k.id+' '+k.pn+' '+k.pp+' '+dxNames(k).join(' ')).toLowerCase().includes(q))),p=pg('hs',all,15);
 const dxUsed=DXG.map(g=>[g.t,g.a.filter(x=>DB.kids.some(k=>dxOf(k).includes(x[0])))]).filter(g=>g[1].length);
 return`<div class="card"><div class="f2" style="margin-bottom:12px"><div><label for="hsq">Tìm theo tên bé, mã, phụ huynh hoặc chẩn đoán</label><input id="hsq" data-i="hsq" value="${esc(h.q)}"></div><div><label for="hs1">Trạng thái</label><select id="hs1" data-c="hsf1"><option value="">Tất cả</option>${opts(Object.entries(KST),h.st)}</select></div><div><label for="hs2">Chương trình</label><select id="hs2" data-c="hsf2"><option value="">Tất cả</option>${opts([['11','Có can thiệp 1-1'],['bt','Có bán trú']],h.pr)}</select></div><div><label for="hs4">Chẩn đoán</label><select id="hs4" data-c="hsf4"><option value="">Tất cả</option>${dxUsed.map(g=>`<optgroup label="${esc(g[0])}">${opts(g[1].map(x=>[x[0],dxShort(x[0])]),h.dx)}</optgroup>`).join('')}</select></div>${isLead()?`<div><label for="hs3">Giáo viên</label><select id="hs3" data-c="hsf3"><option value="">Tất cả</option>${opts(DB.staff.filter(isTeacher).map(s=>[s.id,tName(s)]),h.gv)}</select></div>`:''}</div>`
 +tbl(['Mã','Họ tên','Tuổi','Nhu cầu, chẩn đoán','Chương trình','Giáo viên','Phụ huynh','Trạng thái'],p.rows.map(k=>`<tr class="k" data-a="hsopen" data-v="${k.id}"><td class="nw"><b>${esc(kcode(k))}</b></td><td><b>${esc(k.n)}</b></td><td class="nw">${age(k.dob)}</td><td>${esc(k.nd)}<br><span class="sm">${dxCell(k)}</span></td><td>${esc(progOf(k))}</td><td>${esc(mainGV(k))}</td><td>${esc(k.pr)} ${esc(given(k.pn))}<br><span class="sm mu">${esc(k.pp)}</span></td><td>${tg(KST[k.st],k.st==='dang'?'ok':k.st==='bl'?'wa':'gy')}</td></tr>`).join(''),'Không có học sinh phù hợp.')+p.html+`</div>`}
/* --- sắp xếp lại mã học sinh: sau khi xóa hồ sơ, số thứ tự trong mã (HS01, HS02...) có thể đứt quãng; dồn lại cho liên tục, xem trước từng bé trước khi lưu --- */
MODALS.kren=()=>{if(!isLead()){S.modal=null;return''}const pl=kidRenumPlan();if(!pl.length){S.modal=null;return''}
 return mdl('Sắp xếp lại mã học sinh','<p>Mã học sinh đang đứt quãng do đã xóa hồ sơ. Bấm “Sắp xếp lại” để mã đi liên tục từ HS01, giữ nguyên thứ tự hiện có. Chỉ mã hiển thị đổi; buổi học, kế hoạch, điểm danh, học phí và tài khoản phụ huynh của bé không bị ảnh hưởng.</p>'
  +tbl(['Họ tên','Mã hiện tại','Mã mới'],pl.map(x=>`<tr><td>${esc(x.k.n)}</td><td class="nw">${esc(kcode(x.k))}</td><td class="nw"><b>${esc('HS'+pad(x.to)+'-'+(x.k.bt?'BT':'CN'))}</b></td></tr>`).join(''),'')
  +'<div class="acts" style="margin-top:14px;justify-content:flex-end"><button class="btn" data-a="mx">Hủy</button><button class="btn p" data-a="krenyes">Sắp xếp lại</button></div>')};
ACT.krenopen=()=>{if(!isLead())return false;if(!kidRenumPlan().length){toast('Mã học sinh đã liên tục, không cần sắp xếp lại');return false}S.modal={t:'kren'}};
ACT.krenyes=()=>{if(!isLead())return false;const n=kidRenumber();S.modal=null;toast(n?'Đã sắp xếp lại mã của '+n+' bé':'Mã học sinh đã liên tục')};
ACT.hsopen=v=>{S.modal={t:'hs',id:v,tab:'tt'}};
ACT.hstab2=v=>{S.modal.tab=v};
MODALS.hs=()=>{const m=S.modal,k=kidBy(m.id);if(!k||!canKid(k.id)){S.modal=null;return''}
 const T=[['tt','Thông tin'],['lh','Lịch học'],['kh','Kế hoạch mục tiêu'],['bt','Buổi can thiệp'],['tb','Tiến bộ'],['vd','Ảnh và video'],['td','Hồ sơ, giáo án']];
 let b;switch(m.tab){case'lh':b=hsSchedule(k);break;case'kh':b=hsPlan(k);break;case'bt':b=hsSess(k);break;case'tb':b=progView(k,{staff:true});break;case'vd':b=vidList(k.id);break;case'td':b=docList(k.id);break;default:b=hsInfo(k)}
 return mdl(k.n+' · '+kcode(k),tabsH(T,m.tab,'hstab2')+b,1)};
function hsInfo(k){const g=grBy(k.gr),r=(a,b)=>`<div class="rw"><span class="mu">${a}</span><b>${b}</b></div>`;
 return`<div class="two"><div>${r('Giới tính',k.g==='M'?'Nam':'Nữ')}${r('Ngày sinh',vd(k.dob)+' ('+age(k.dob)+')')}${r('Ngày nhập học',vd(k.sd))}${r('Nhu cầu chính',esc(k.nd))}${r('Chẩn đoán',dxOf(k).length||k.dxo?dxNames(k,dxFull).map(x=>`<span style="display:block;text-align:right">${esc(x)}</span>`).join(''):'<span class="mu">Chưa ghi</span>')}${k.dxn?r('Nơi, bác sĩ, ngày chẩn đoán',esc(k.dxn)):''}${r('Trạng thái',tg(KST[k.st],k.st==='dang'?'ok':'gy'))}${r('Chương trình',esc(progOf(k)))}${r('Giáo viên 1-1',k.gv?esc(sn(k.gv)):'Không có')}${r('Giờ 1-1 đăng ký',ltSummary(k))}${r('Nhóm bán trú',g&&k.bt?esc(g.n)+' · '+dayTx(btOf(k)):'Không có')}</div>
 <div>${r('Phụ huynh',esc(k.pr)+' '+esc(k.pn))}${r('Điện thoại',esc(k.pp))}${r('Email cổng phụ huynh',esc(k.pe||'—'))}${canMoney()?r('Công nợ',fmt(balance(k.id))):''}<div class="acts" style="margin-top:12px">${isLead()?`<button class="btn p" data-a="hsedit" data-v="${k.id}">Sửa hồ sơ</button> <button class="btn no" data-a="hsdelk" data-v="${k.id}">Xóa hồ sơ bé</button>`:''}<button class="btn" data-a="ddkid" data-v="${k.id}">Bảng chấm công của bé</button></div></div></div>`}
/* --- thêm, sửa hồ sơ --- */
ACT.hsnew=()=>{S.modal={t:'hsf',id:''}};
ACT.hsedit=v=>{S.modal={t:'hsf',id:v}};
/* ô chọn các ngày trong tuần (T2 đến T7) kèm nút chọn nhanh */
const dayBoxes=(pre,sel)=>`<div class="dybx bpks" role="group" aria-label="Chọn ngày học">${DAY_ALL.map(w=>`<label class="bpk day"><input type="checkbox" name="${pre}${w}" aria-label="${DAYN[w]}" ${sel.includes(w)?'checked':''}><span>${DAYS[w]}</span></label>`).join('')}</div><div class="acts" style="margin-top:6px"><button class="btn s" type="button" data-a="dayset" data-v="${pre}|1,2,3,4,5">T2–T6</button><button class="btn s" type="button" data-a="dayset" data-v="${pre}|1,2,3,4,5,6">T2–T7</button><button class="btn s" type="button" data-a="dayset" data-v="${pre}|">Bỏ chọn</button></div>`;
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
/* khối "Hình thức học": tích Bán trú và/hoặc Can thiệp 1-1; mỗi hình thức tích các buổi (thứ) học cụ thể, buổi 1-1 chọn được giờ riêng từng ngày */
/* Một dòng ca 1-1. Dòng của ca đã lưu (tham số l) mang mã buổi trong data-lid để lúc lưu biết sửa đúng buổi đó; ca cũ chưa chọn loại có thêm lựa chọn "Chưa chọn loại" để lưu lại không tự gán loại (loại quyết định giá). Bấm "Xóa ca" ở dòng đã lưu chỉ đánh dấu bỏ (gạch ngang, có nút Giữ lại), việc xóa thật diễn ra khi bấm Lưu hồ sơ; bấm Hủy thì mọi thứ giữ nguyên. */
function s11Row(w,lt,tm,l){const sv=!!l;return`<div class="s11r${sv?' sv':''}"${sv?` data-lid="${esc(l.id)}"`:''}><select name="s11day" aria-label="Ngày">${opts(DAY_ALL.map(x=>[x,DAYN[x]]),w)}</select><select name="s11lt" aria-label="Loại 1-1">${sv&&!l.lt?'<option value="" selected>Chưa chọn loại</option>':''}${opts(LT.map(x=>[x.c,x.n]),lt)}</select><input type="time" name="s11tm" step="60" value="${esc(tm||'')}" aria-label="Giờ bắt đầu ca (ca ${SLOT_MIN} phút)"><button class="btn s no" type="button" data-a="s11del">Xóa ca</button>${sv?`<span class="sm mu s11m"><span class="m1">Đã lưu · ${esc(given(sn(l.gv)))}${l.room?' · '+esc(l.room):''}</span><span class="m2">Sẽ bị xóa khi bấm Lưu hồ sơ (điểm danh cũ vẫn giữ). Bấm Giữ lại nếu không muốn xóa.</span></span>`:''}</div>`}
/* số giờ/ngày của từng loại: lấy số đã ghi ở hồ sơ, bổ sung từ các ca đã xếp (bé có ca gắn loại nhưng hồ sơ chưa ghi số giờ vẫn hiện đủ để xem lại) */
function ltEff(k,ls){const o=Object.assign({},k.lt||{}),cnt={};(ls||[]).forEach(l=>{if(l.lt&&LTM[l.lt]){const key=l.day+'|'+l.lt;cnt[key]=(cnt[key]||0)+1;o[l.lt]=Math.min(4,Math.max(o[l.lt]||0,cnt[key]))}});return o}
function ltBlock(k,eff){const on=eff||k.lt||{};return`<div class="lt-grid">${LT.map(x=>`<div class="lt-row"><label class="chk"><input type="checkbox" name="lt_${x.c}" ${on[x.c]?'checked':''}> ${esc(x.n)}</label><span class="sm mu">${canMoney()?fmt(ltFee(x))+' ₫/giờ':''}</span><label class="sm">Số giờ/ngày <input type="number" name="lq_${x.c}" min="1" max="4" step="1" value="${on[x.c]||''}" style="width:64px"></label></div>`).join('')}</div>`}
function ltSummary(k){const o=k.lt||{},a=LT.filter(x=>o[x.c]).map(x=>esc(x.n)+': '+o[x.c]+' giờ/ngày'+(canMoney()&&kidLt(k,x.c)!=null?' · giá riêng '+fnum(kidLt(k,x.c))+' ₫/giờ':''));return a.length?a.join('<br>'):'<span class="mu">Chưa ghi</span>'}
/* nút chọn ngày học 1-1: bấm một ngày thì thêm một ca cho ngày đó (loại là loại đầu đã tích, giờ lấy theo ca đầu đã nhập), bấm lại thì bỏ các ca của ngày đó */
const s11Days=f=>[...f.querySelectorAll('#s11 .s11r:not(.gone) [name=s11day]')].map(s=>+s.value);
const s11Sync=f=>{if(f)f.querySelectorAll('#s11d input[data-s11w]').forEach(c=>{c.checked=s11Days(f).includes(+c.dataset.s11w)})};
const s11Defs=f=>{const first=[...f.querySelectorAll('#s11 .s11r:not(.gone) [name=s11tm]')].find(i=>i.value),on=LT.find(x=>f.elements['lt_'+x.c]&&f.elements['lt_'+x.c].checked);return{lt:(on||LT[0]).c,tm:first?first.value:''}};
/* đánh dấu / bỏ đánh dấu một dòng ca đã lưu là "sẽ xóa khi lưu"; dòng mới thêm (chưa lưu) thì xóa thẳng khỏi biểu mẫu */
const s11Gone=(r,on)=>{if(!r.dataset.lid){if(on)r.remove();return}r.classList.toggle('gone',!!on);r.querySelectorAll('select,input').forEach(i=>{i.disabled=!!on});const b=r.querySelector('[data-a=s11del]');if(b)b.textContent=on?'Giữ lại':'Xóa ca'};
const s11Set=(f,list)=>{const box=f&&f.querySelector('#s11');if(!box)return;const d=s11Defs(f);
 [...box.querySelectorAll('.s11r:not(.gone)')].forEach(r=>{if(!list.includes(+r.querySelector('[name=s11day]').value))s11Gone(r,true)});
 const have=s11Days(f);list.forEach(w=>{if(have.includes(w))return;const back=[...box.querySelectorAll('.s11r.gone')].find(r=>+r.querySelector('[name=s11day]').value===w);   /* bấm lại ngày vừa bỏ thì giữ lại ca cũ, không tạo ca trùng */
  if(back)s11Gone(back,false);else box.insertAdjacentHTML('beforeend',s11Row(w,d.lt,d.tm))});
 [...box.querySelectorAll('.s11r')].sort((a,b)=>a.querySelector('[name=s11day]').value-b.querySelector('[name=s11day]').value).forEach(r=>box.appendChild(r));s11Sync(f)};
ACT.s11add=(v,b)=>{const f=b.closest('form'),box=b.closest('.hth-b').querySelector('#s11'),d=s11Defs(f);if(box)box.insertAdjacentHTML('beforeend',s11Row(DAY_ALL.find(w=>!s11Days(f).includes(w))||DAY_ALL[0],d.lt,d.tm));s11Sync(f);return false};
ACT.s11del=(v,b)=>{const f=b.closest('form'),r=b.closest('.s11r');if(r)s11Gone(r,!r.classList.contains('gone'));s11Sync(f);return false};
ACT.s11days=(v,b)=>{s11Set(b.closest('form'),v?v.split(',').map(Number):[]);return false};
document.addEventListener('change',e=>{const t=e.target,f=t&&t.closest&&t.closest('form');if(!f)return;
 if(t.dataset&&t.dataset.s11w){const w=+t.dataset.s11w,cur=s11Days(f);s11Set(f,t.checked?[...new Set(cur.concat(w))]:cur.filter(x=>x!==w))}
 else if(t.name==='s11day')s11Sync(f)});
/* Khi sửa hồ sơ, mọi thứ đã nhập trước đó phải hiện sẵn để chỉ xem lại và chỉnh một chút: hình thức học, lớp, các ngày bán trú, giáo viên, loại và số giờ 1-1, và từng ca 1-1 đã xếp (thứ, loại, giờ). */
function hthField(k,edit){const bt=!!k.bt,bd=k.bt&&Array.isArray(k.btd)&&k.btd.length?k.btd.filter(w=>w>=1&&w<=6):btOf(k),   /* ngày đã lưu hiện đúng như đã nhập, kể cả khi bé chưa có lớp */
  ls=edit?DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).sort((a,b)=>a.day-b.day||(a.slot<b.slot?-1:a.slot>b.slot?1:0)):[],has=ls.length>0,pool=pool11(),lte=ltEff(k,ls),has11=has||!!k.lt,
  cnt={};ls.forEach(l=>{cnt[l.gv]=(cnt[l.gv]||0)+1});
 const top=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0],gvSel=k.gv&&pool.some(s=>s.id===k.gv)?k.gv:(top&&pool.some(s=>s.id===top)?top:''),
  days=[...new Set(ls.map(l=>l.day))],
  ex=has?`<div class="note sm"><b>Bé đang có ${ls.length} ca 1-1, đã hiện sẵn bên dưới.</b> Chỉ cần sửa thứ, loại hoặc giờ của ca nào cần đổi rồi bấm Lưu hồ sơ; ca không đụng đến thì giữ nguyên. Bấm Xóa ca để bỏ một ca (chỉ xóa thật khi bấm Lưu hồ sơ). Giáo viên và phòng ở dưới áp dụng cho các ca thêm mới.</div>`:'';
 return`<h3>Hình thức học</h3><p class="sm mu" style="margin-bottom:8px">Bấm chọn hình thức bé học. Bé có thể học cả hai: bán trú và các ca 1-1.</p>
 <div class="bpks hth-pick" role="group" aria-label="Hình thức học"><label class="bpk big" for="hf-hbt"><input type="checkbox" id="hf-hbt" name="hbt" ${bt?'checked':''}><span><b>Bán trú</b><small>${BTLB}</small></span></label><label class="bpk big" for="hf-h11"><input type="checkbox" id="hf-h11" name="h11" ${has11?'checked':''}><span><b>Can thiệp 1-1</b><small>Ca ${SLOT_MIN} phút</small></span></label></div>
 <div class="hth">
  <div class="hth-b" id="hth-bt" ${bt?'':'hidden'}><b class="hth-t">Bán trú</b><div><label for="hf-gr">Lớp bán trú</label><select id="hf-gr" name="gr"><option value="">Tự chọn theo tuổi</option>${opts(DB.groups.map(g=>[g.id,g.n]),k.gr)}</select></div>
   <div><span class="lbl">Các ngày bán trú trong tuần (bấm chọn ngày bé học, ${BTLB})</span>${dayBoxes('bd',bd.length?bd:DAY_BT)}</div>
   <p class="sm mu">Mỗi ngày bán trú có một ca 1-1 nằm trong gói bán trú. Thứ Bảy chỉ chọn khi bé học thứ Bảy.</p></div>
  <div class="hth-b" id="hth-11" ${has11?'':'hidden'}><b class="hth-t">Can thiệp 1-1</b>${ex}
   <div class="f2"><div><label for="hf-gv">Giáo viên 1-1${has?' (cho ca thêm mới)':''}</label><select id="hf-gv" name="gv"><option value="">Chọn giáo viên</option>${opts(pool.map(s=>[s.id,tName(s)]),gvSel)}</select></div><div><label for="hf-rm">Phòng${has?' (cho ca thêm mới)':''}</label><select id="hf-rm" name="room"><option value="">Tự chọn phòng trống</option>${opts(ROOMS.map(r=>[r,r]),'')}</select></div></div>
   <div><span class="lbl">Loại 1-1 và số giờ đăng ký trong 1 ngày (tích loại bé học)</span>${ltBlock(k,lte)}</div>
   <div><span class="lbl">Các ngày học 1-1 (bấm chọn ngày bé học; mỗi ngày một ca)</span>
    <div class="dybx bpks" id="s11d" role="group" aria-label="Chọn ngày học 1-1">${DAY_ALL.map(w=>`<label class="bpk day"><input type="checkbox" data-s11w="${w}" aria-label="${DAYN[w]}" ${days.includes(w)?'checked':''}><span>${DAYS[w]}</span></label>`).join('')}</div>
    <div class="acts" style="margin-top:6px"><button class="btn s" type="button" data-a="s11days" data-v="1,2,3,4,5">T2–T6</button><button class="btn s" type="button" data-a="s11days" data-v="1,2,3,4,5,6">T2–T7</button><button class="btn s" type="button" data-a="s11days" data-v="">Bỏ chọn</button></div>
    <span class="lbl" style="margin-top:10px">Loại và giờ bắt đầu của từng ngày (ca ${SLOT_MIN} phút, đổi riêng từng ngày được)</span><div id="s11" data-ids="${esc(ls.map(l=>l.id).join(','))}">${ls.map(l=>s11Row(l.day,l.lt||'',l.slot,l)).join('')}</div>
    <div class="acts" style="margin-top:6px"><button class="btn s" type="button" data-a="s11add">+ Thêm ca</button><span class="sm mu">dùng khi một ngày bé học nhiều ca</span></div></div>
   <p class="sm mu">Số ca của một loại trong cùng một ngày không vượt số giờ đăng ký của loại đó. Ca cũ chưa chọn loại thì giữ nguyên, tính theo giá chung 1 buổi 1-1.</p>
  </div>
 </div>`}
document.addEventListener('change',e=>{const t=e.target;if(!t||(t.name!=='hbt'&&t.name!=='h11'))return;const f=t.closest('form'),p=f&&f.querySelector(t.name==='hbt'?'#hth-bt':'#hth-11');if(p)p.hidden=!t.checked});
ACT.d11bt=()=>{const f=$q('#hsff');if(!f)return false;DAY_ALL.forEach(w=>{const a=f.elements['bd'+w],c=f.elements['d'+w];if(a&&c)c.checked=a.checked});return false};
/* thêm các buổi 1-1 cho một bé: mỗi buổi {w: thứ, slot: giờ bắt đầu}; kiểm tra trùng giáo viên, bé, phòng từng ngày */
function add11(k,picks,gv,room){const res={ok:0,bad:[],warn:[]};
 picks.forEach(p=>{const w=p.w,slot=p.slot,rm=room||ROOMS.find(r=>!conflict({day:w,slot,gv,hs:k.id,room:r}))||'',x={id:'l'+uid(),type:'11',day:w,slot,gv,hs:k.id,room:rm,lt:p.lt||null},c=rm?conflict(x):(conflict(Object.assign({},x,{room:''}))||'Không còn phòng trống');   /* hết phòng vì giáo viên hoặc bé đã bận thì báo đúng lý do */
  if(c){res.bad.push(DAYS[w]+': '+c);return}
  DB.lich.push(x);res.ok++;const wn=btWarn(k,w,slot);if(wn)res.warn.push(DAYS[w]+': '+wn)});
 if(res.ok&&!k.gv)k.gv=gv;k.m11=wk11(k.id);return res}
MODALS.hsf=()=>{const id=S.modal.id,k=id?kidBy(id):{n:'',g:'M',dob:addD(TODAY,-365*4),sd:TODAY,st:'dang',nd:NEEDS[0],bt:false,gr:'',gv:'',pn:'',pr:'Mẹ',pp:'',pe:'',dx:[]};
 const f=(n,l,v,t,x)=>`<div><label for="hf-${n}">${l}</label><input id="hf-${n}" name="${n}" type="${t||'text'}" value="${esc(v)}" ${x||''}></div>`;
 return mdl(id?'Sửa hồ sơ '+k.n:'Thêm học sinh',`<form id="hsff" class="f"><div class="f2">${f('n','Họ và tên bé',k.n,'text','required')}<div><label for="hf-g">Giới tính</label><select id="hf-g" name="g">${opts([['M','Nam'],['F','Nữ']],k.g)}</select></div>${f('dob','Ngày sinh',k.dob,'date','required max="'+TODAY+'"')}${f('sd','Ngày nhập học',k.sd,'date')}<div><label for="hf-nd">Nhu cầu chính</label><select id="hf-nd" name="nd">${opts(NEEDS.map(x=>[x,x]),k.nd)}</select></div><div><label for="hf-st">Trạng thái</label><select id="hf-st" name="st">${opts(Object.entries(KST),k.st)}</select><small class="mu">Chọn “Đã nghỉ” khi bé ngưng can thiệp: học phí đã đóng và phí dư không được hoàn.</small></div>
 </div>
 ${hthField(k,!!id)}
 ${dxField(k)}
 <h3>Phụ huynh</h3><div class="f2"><div><label for="hf-pr">Quan hệ</label><select id="hf-pr" name="pr">${opts(['Mẹ','Bố','Ông bà','Người giám hộ'].map(x=>[x,x]),k.pr)}</select></div>${f('pn','Họ tên phụ huynh',k.pn,'text','required')}${f('pp','Điện thoại',k.pp,'tel','required')}${f('pe','Email cổng phụ huynh (hoặc dùng số điện thoại)',k.pe,'email')}</div>
 <p class="note sm">Thông tin đã nhập được giữ lại: mở hồ sơ là thấy sẵn, chỉ sửa chỗ cần đổi rồi bấm Lưu. Hệ thống kiểm tra trùng giáo viên, bé và phòng khi thêm hoặc đổi giờ ca 1-1; nếu có ca không đổi được thì hồ sơ chưa được lưu và báo rõ lý do.</p>
 <div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu hồ sơ</button></div></form>`)};
FORM.hsff=f=>{const g=n=>f.elements[n]?f.elements[n].value.trim():'',id=S.modal.id,isNew=!id;
 const old=isNew?null:kidBy(id);
 if(!g('n')||!g('pn')||(!g('pe')&&!telNorm(g('pp')))){toast('Vui lòng nhập tên bé, tên phụ huynh và email hoặc số điện thoại phụ huynh');return false}
 const bt=f.elements.hbt.checked,h11=f.elements.h11.checked,bd=daysOf(f,'bd'),wasSt=isNew?'dang':old.st;
 if(bt&&!bd.length){toast('Hãy tích ít nhất một buổi bán trú trong tuần');return false}
 const room=f.elements.room.value,gv=g('gv'),ltq={};
 LT.forEach(x=>{const c=f.elements['lt_'+x.c];if(h11&&c&&c.checked)ltq[x.c]=Math.min(4,Math.max(1,parseInt(f.elements['lq_'+x.c].value,10)||1))});
 /* Các dòng ca trong biểu mẫu. Dòng có data-lid là ca đã lưu (sửa đúng buổi đó); dòng không có là ca mới. Chỉ những ca đã hiện trong biểu mẫu lúc mở (data-ids) mới có thể bị xóa, nên ca do người khác vừa thêm trong lúc đang sửa không bị mất. */
 const box=f.querySelector('#s11'),loaded=new Set(((box&&box.dataset.ids)||'').split(',').filter(Boolean)),cur=isNew?[]:DB.lich.filter(l=>l.type==='11'&&l.hs===id),old11=cur.length,
  rows=h11?[...f.querySelectorAll('#s11 .s11r')].map(r=>({lid:r.dataset.lid||'',gone:r.classList.contains('gone'),w:+r.querySelector('[name=s11day]').value,lt:r.querySelector('[name=s11lt]').value,slot:String(r.querySelector('[name=s11tm]').value||'').slice(0,5)})):[];
 if(!h11&&old11){toast('Bé đang có '+old11+' buổi 1-1. Muốn bỏ hình thức 1-1, hãy xóa từng buổi: tích lại Can thiệp 1-1 rồi bấm Xóa ca ở từng ca (hoặc xóa ở thẻ Lịch học của hồ sơ bé)');return false}
 const act=rows.filter(r=>!r.gone&&(!r.lid||cur.some(l=>l.id===r.lid))),keepIds=new Set(act.filter(r=>r.lid).map(r=>r.lid)),
  gone=cur.filter(l=>loaded.has(l.id)&&!keepIds.has(l.id)),
  ups=act.filter(r=>r.lid).map(r=>{const l=cur.find(x=>x.id===r.lid);return{r,l,o:Object.assign({},l)}}).filter(u=>u.r.w!==u.o.day||u.r.slot!==u.o.slot||u.r.lt!==(u.o.lt||'')),
  news=act.filter(r=>!r.lid);
 if(h11&&news.length&&!Object.keys(ltq).length){toast('Hãy tích ít nhất một loại 1-1 và ghi số giờ mỗi ngày');return false}
 if(h11&&!act.length&&!old11){toast('Hãy thêm ít nhất một ca 1-1 (hoặc bỏ tích Can thiệp 1-1)');return false}
 const noLt=act.find(r=>r.lt?!ltq[r.lt]:!r.lid);   /* ca cũ chưa có loại thì để nguyên; ca đã có loại hoặc ca mới thì loại phải còn được tích */
 if(noLt){toast(noLt.lid&&noLt.lt?DAYN[noLt.w]+': loại "'+LTM[noLt.lt].n+'" chưa được tích ở phần loại 1-1. Hãy tích lại loại này hoặc đổi loại của ca':'Mỗi ca mới phải chọn một loại 1-1 đã tích');return false}
 const fin=act.map(r=>({w:r.w,lt:r.lt})).concat(cur.filter(l=>!loaded.has(l.id)).map(l=>({w:l.day,lt:l.lt||''})));   /* số ca mỗi loại trong ngày sau khi lưu */
 for(const p of fin){if(!p.lt||!ltq[p.lt])continue;if(fin.filter(q=>q.w===p.w&&q.lt===p.lt).length>ltq[p.lt]){toast(DAYN[p.w]+': '+LTM[p.lt].n+' vượt số giờ đăng ký '+ltq[p.lt]+' giờ/ngày');return false}}
 if(ups.length||news.length){if(news.length&&!gv){toast('Hãy chọn giáo viên 1-1');return false}
  const bad=ups.map(u=>u.r).concat(news).find(p=>!slotValid(p.slot));if(bad){toast(DAYS[bad.w]+': '+slotMsg);return false}}
 /* Sửa và xóa ca đã lưu làm trước, kiểm tra trùng giờ trên trạng thái sau khi đổi; có ca nào không đổi được thì hoàn tác tất cả và chưa lưu gì. */
 if(gone.length||ups.length){const snapL=DB.lich.slice(),undo=()=>{DB.lich=snapL;ups.forEach(u=>Object.assign(u.l,u.o))};
  DB.lich=DB.lich.filter(l=>!gone.some(x=>x.id===l.id));
  ups.forEach(u=>{u.l.day=u.r.w;u.l.slot=u.r.slot});
  for(const u of ups.filter(u=>u.r.w!==u.o.day||u.r.slot!==u.o.slot)){const l=u.l,base={id:l.id,day:l.day,slot:l.slot,gv:l.gv,hs:l.hs},
    keep=l.room&&!conflict(Object.assign({},base,{room:l.room})),rm=keep?l.room:(ROOMS.find(r=>!conflict(Object.assign({},base,{room:r})))||''),
    c=rm?'':(conflict(Object.assign({},base,{room:''}))||'Không còn phòng trống');
   if(c){undo();toast(DAYS[l.day]+' '+slotLb(l.slot)+': '+c+'. Hồ sơ chưa được lưu, hãy chọn thứ hoặc giờ khác');return false}
   l.room=rm}
  ups.forEach(u=>{if(u.r.lt!==(u.o.lt||''))u.l.lt=u.r.lt||null})}
 const k=isNew?{id:newKidId(),no:nextKNo(),m11:0,gv:news.length?gv:null}:old;
 Object.assign(k,{n:g('n'),g:g('g'),dob:g('dob'),sd:g('sd')||TODAY,st:g('st'),nd:g('nd'),bt,gr:bt?(g('gr')||grByAge(g('dob'))):'',pr:g('pr'),pn:g('pn'),pp:g('pp'),pe:g('pe').toLowerCase(),
  dx:[...f.querySelectorAll('input[name=dx]:checked')].map(x=>x.value),dxo:g('dxo'),dxn:g('dxn')});
 if(bt)k.btd=bd;else delete k.btd;
 if(!h11||(old11&&!act.length&&!(old11-gone.length)))delete k.lt;else if(Object.keys(ltq).length)k.lt=ltq;   /* bỏ hết ca thì bỏ luôn số giờ đã ghi; bé cũ có ca 1-1 chưa gắn loại: giữ nguyên, không bắt buộc */
 if(wasSt!=='nghi'&&k.st==='nghi')k.stopAt=TODAY;else if(k.st!=='nghi')delete k.stopAt;   /* ngưng đột ngột: không hoàn phí dư nào (xem settle) */
 if(isNew)DB.kids.push(k);if(!bt)k.gr='';
 const res=news.length?add11(k,news.map(r=>({w:r.w,lt:r.lt,slot:r.slot})),gv,room):null;
 const mvWarn=ups.map(u=>{const w=btWarn(k,u.l.day,u.l.slot);return(u.r.w!==u.o.day||u.r.slot!==u.o.slot)&&w?DAYS[u.l.day]+': '+w:''}).filter(Boolean);
 if(ups.length||gone.length)k.m11=wk11(k.id);
 const out=res||(mvWarn.length?{ok:0,bad:[],warn:[]}:null);if(out)out.warn=out.warn.concat(mvWarn);
 const flag=out&&(out.bad.length||out.warn.length),more=(ups.length?', sửa '+ups.length+' buổi 1-1':'')+(gone.length?', bỏ '+gone.length+' buổi 1-1':'');
 S.modal={t:'hs',id:k.id,tab:flag?'lh':'tt',res:out||null};
 toast(flag?'Đã lưu hồ sơ. Có buổi 1-1 chưa thêm được hoặc cần lưu ý, xem thẻ Lịch học':isNew?'Đã thêm học sinh'+(res?' và '+res.ok+' buổi 1-1':''):wasSt!=='nghi'&&k.st==='nghi'?'Đã lưu: bé ngưng can thiệp, học phí đã đóng và phí dư không hoàn':'Đã lưu hồ sơ'+(res?', thêm '+res.ok+' buổi 1-1':'')+more)};

/* --- thẻ Lịch học trong hồ sơ bé: ngày bán trú, các buổi 1-1 hằng tuần, thời khóa biểu --- */
function hsSchedule(k){const lead=isLead(),m=S.modal,bd=btOf(k),g=grBy(k.gr),$$=canMoney();
 const ls=DB.lich.filter(l=>l.type==='11'&&l.hs===k.id).sort((a,b)=>a.day-b.day||(a.slot<b.slot?-1:a.slot>b.slot?1:0)),inc=new Set(bd.map(w=>incIdW(k,w)).filter(Boolean));
 const miss=bd.filter(w=>!ls.some(l=>l.day===w));
 const bt=`<div class="card"><h2>Bán trú</h2>`+(lead?`<form id="btf" class="f"><div class="f2"><div><label for="bt-on">Học bán trú</label><select id="bt-on" name="bt">${opts([['0','Không'],['1','Có']],k.bt?'1':'0')}</select></div><div><label for="bt-gr">Lớp</label><select id="bt-gr" name="gr">${opts(DB.groups.map(x=>[x.id,x.n]),k.gr||grByAge(k.dob))}</select></div></div>
  <div style="margin-top:8px"><span class="lbl">Ngày bán trú trong tuần</span>${dayBoxes('bd',bd.length?bd:DAY_BT)}</div>
  <p class="sm mu">Mỗi ngày bán trú có một ca 1-1 (${SLOT_MIN} phút) nằm trong gói bán trú${$$?' ('+fmt(DB.cfg.pbtDay)+' mỗi ngày, trong đó '+fmt(DB.cfg.pbtDay11)+' là ca 1-1)':''}. Thứ Bảy chỉ chọn cho bé học thứ Bảy.</p>
  <div class="acts" style="justify-content:flex-end"><button class="btn p" type="submit">Lưu bán trú</button></div></form>`
  :`<p>${bd.length&&g?'Lớp <b>'+esc(g.n)+'</b>, học '+esc(dayTx(bd)):'Bé không học bán trú.'}</p>`)+`</div>`;
 const rows=ls.map(l=>`<tr><td class="nw">${DAYN[l.day]}</td><td class="nw">${slotLb(l.slot)}${l.lt&&LTM[l.lt]?'<br><span class="sm mu">'+esc(LTM[l.lt].n)+'</span>':''}</td><td>${esc(sn(l.gv))}</td><td>${esc(l.room)}</td><td>${inc.has(l.id)?tg('Ca của bán trú','in'):tg('Ca 1-1 thêm','gy')}${$$&&!inc.has(l.id)?' <span class="sm mu">'+fnum(feeSlot(k,l.id))+' ₫</span>':''}${(btWarn(k,l.day,l.slot)?'<br><span class="sm mu">Lưu ý: '+esc(btWarn(k,l.day,l.slot))+'</span>':'')}</td>${lead?`<td class="r"><button class="btn s no" data-a="hslsdel" data-v="${l.id}">Xóa</button></td>`:''}</tr>`).join('');
 const res=m.res?`<div class="note sm" style="margin-bottom:10px">${m.res.ok?'<b>Đã thêm '+m.res.ok+' buổi.</b> ':''}${m.res.bad.length?'<b>Không thêm được:</b> '+esc(m.res.bad.join('; '))+'. ':''}${m.res.warn.length?'<b>Lưu ý:</b> '+esc(m.res.warn.join('; ')):''}</div>`:'';
 const pool=pool11(),one=`<div class="card"><h2>Các buổi 1-1 hằng tuần</h2>${res}${miss.length?`<p class="note sm" style="margin-bottom:10px">Ngày bán trú chưa có ca 1-1: ${esc(miss.map(w=>DAYS[w]).join(', '))}.</p>`:''}`
  +tbl(['Thứ','Ca','Giáo viên','Phòng','Loại'].concat(lead?['']:[]),rows,'Bé chưa có buổi 1-1 cố định.')
  +(lead&&ls.length?`<p class="sm mu" style="margin-top:8px">Muốn đổi thứ, giờ hoặc loại của các ca, mở hồ sơ để sửa: mọi ca đã lưu hiện sẵn, chỉ chỉnh chỗ cần đổi.</p><div class="acts"><button class="btn s" type="button" data-a="hsedit" data-v="${k.id}">Sửa các ca trong hồ sơ</button></div>`:'')
  +(lead?`<form id="lsmf" class="f" style="margin-top:14px"><h3>Thêm buổi 1-1 cho nhiều ngày cùng lúc</h3><div class="f2"><div><label for="lm-g">Giáo viên</label><select id="lm-g" name="gv"><option value="">Chọn giáo viên</option>${opts(pool.map(s=>[s.id,tName(s)]),k.gv&&pool.some(s=>s.id===k.gv)?k.gv:'')}</select></div><div><label for="lm-s">Giờ bắt đầu</label>${slotInput('lm-s',m.slot||SLOTS[1])}<small class="mu">Ca ${SLOT_MIN} phút, tự tính giờ kết thúc.</small></div><div><label for="lm-r">Phòng</label><select id="lm-r" name="room"><option value="">Tự chọn phòng trống</option>${opts(ROOMS.map(r=>[r,r]),'')}</select></div></div>
   <div><span class="lbl">Học vào các ngày</span>${dayBoxes('d',bd.length?bd:[])}</div>
   <p class="sm mu">Mỗi bé chọn ngày riêng: có bé học T2–T7, có bé chỉ vài buổi mỗi tuần. Hệ thống kiểm tra trùng giáo viên, bé, phòng ở từng ngày và chỉ thêm những ngày còn trống.</p>
   <div class="acts" style="justify-content:flex-end"><button class="btn p" type="submit">Thêm các buổi</button></div></form>`:'')+`</div>`;
 const tt=`<div class="card"><h2>Thời khóa biểu của ${esc(given(k.n))}</h2>${kidWeek(k)}</div>`;
 return bt+one+kprCard(k)+tt}
/* Giá riêng của bé theo loại 1-1: chỉ Trưởng TT và Văn phòng thấy và sửa (là dữ liệu tiền). Bỏ trống = giá chung. Khi bỏ hết vẫn ghi {} (không xóa dòng) để máy phụ huynh đồng bộ gia tăng nhận được thay đổi. */
function kprCard(k){if(!canMoney())return'';const o=(DB.kpr||{})[k.id]||{},has=LT.some(x=>o[x.c]!=null);
 return`<div class="card"><h2>Giá riêng của bé</h2><p class="sm mu">Bỏ trống thì tính theo giá chung của loại (Nhân sự → Cài đặt). Giá riêng chỉ áp dụng cho ca 1-1 đã chọn đúng loại đó, tính từ nay; hóa đơn đã lập không tự đổi. Ca cũ chưa chọn loại thì tính theo giá chung 1 buổi 1-1.</p>
 <form id="kprf" class="f"><div class="f2">${LT.map(x=>`<div><label for="kp-${x.c}">${esc(x.n)}</label><input id="kp-${x.c}" name="kp_${x.c}" type="number" min="0" step="any" value="${o[x.c]!=null?esc(o[x.c]):''}" placeholder="${fnum(ltFee(x))} (giá chung)"></div>`).join('')}</div>
 <div class="acts" style="justify-content:flex-end">${has?`<button class="btn" type="button" data-a="kprclr" data-v="${k.id}">Bỏ hết giá riêng</button>`:''}<button class="btn p" type="submit">Lưu giá riêng</button></div></form></div>`}
FORM.kprf=f=>{if(!canMoney())return false;const k=kidBy(S.modal.id);if(!k)return false;const o={};
 LT.forEach(x=>{const v=f.elements['kp_'+x.c].value.trim();if(v!==''){const n=+v;if(isFinite(n))o[x.c]=Math.max(0,n)}});
 if(!DB.kpr)DB.kpr={};if(Object.keys(o).length||DB.kpr[k.id])DB.kpr[k.id]=o;
 toast(Object.keys(o).length?'Đã lưu giá riêng của '+given(k.n):'Không có giá riêng: '+given(k.n)+' tính theo giá chung')};
ACT.kprclr=v=>{const k=kidBy(v);if(!k||!canMoney())return false;ask('Bỏ hết giá riêng của '+given(k.n)+'? Các ca 1-1 sẽ tính theo giá chung của từng loại.',()=>{if(!DB.kpr)DB.kpr={};DB.kpr[v]={};toast('Đã bỏ giá riêng')},'Bỏ')};
FORM.btf=f=>{if(!isLead())return false;const k=kidBy(S.modal.id),bt=f.elements.bt.value==='1',bd=daysOf(f,'bd');
 if(bt&&!bd.length){toast('Hãy chọn ít nhất một ngày bán trú');return false}
 k.bt=bt;if(bt){k.gr=f.elements.gr.value||grByAge(k.dob);k.btd=bd}else{k.gr='';delete k.btd}
 S.modal.res=null;toast('Đã lưu lịch bán trú')};
FORM.lsmf=f=>{if(!isLead())return false;const k=kidBy(S.modal.id),e=f.elements,gv=e.gv.value,slot=String(e.slot.value||'').slice(0,5),days=daysOf(f,'d');
 if(!gv){toast('Hãy chọn giáo viên');return false}
 if(!slotValid(slot)){toast(slotMsg);return false}
 if(!days.length){toast('Hãy chọn ít nhất một ngày');return false}
 const res=add11(k,days.map(w=>({w,slot})),gv,e.room.value);
 S.modal.res=res;S.modal.slot=slot;
 if(res.ok&&!res.bad.length)toast('Đã thêm '+res.ok+' buổi 1-1')};
ACT.hslsdel=v=>{const l=DB.lich.find(x=>x.id===v),k=l&&kidBy(l.hs),back=S.modal;if(!l||!k||!isLead())return false;
 ask('Xóa buổi 1-1 '+DAYN[l.day]+' '+slotLb(l.slot)+' của bé '+k.n+'? Các lần điểm danh trước đây vẫn được giữ.',()=>{DB.lich=DB.lich.filter(x=>x.id!==v);k.m11=wk11(k.id);S.modal=Object.assign({},back,{res:null});toast('Đã xóa buổi học')},'Xóa buổi')};

/* --- xóa hồ sơ bé (Trưởng Trung tâm, Quản lý): nhập sai hoặc bé không còn học; bé chỉ nghỉ thì dùng "Ngưng can thiệp" --- */
function hsDelKid(id){
 if(DB.kpr)delete DB.kpr[id];
 DB.kids=DB.kids.filter(x=>x.id!==id);
 DB.sess=DB.sess.filter(x=>x.k!==id);
 DB.plans=DB.plans.filter(x=>x.k!==id);
 DB.lich=DB.lich.filter(x=>x.hs!==id);
 DB.mk=DB.mk.filter(x=>x.hs!==id);
 DB.rp=DB.rp.filter(x=>x.hs!==id);
 DB.lg=DB.lg.filter(x=>x.hs!==id);
 DB.media.forEach(m=>{if(Array.isArray(m.ks)&&m.ks.includes(id))m.ks=m.ks.filter(x=>x!==id)});
 Object.keys(DB.att).forEach(x=>{if(x.split('|').includes(id))delete DB.att[x]});
 Object.keys(DB.set).forEach(x=>{if(x.split('|').includes(id))delete DB.set[x]});
 kidRenumber();   /* dồn số hiển thị của các bé còn lại cho liên tục, không đụng đến khóa k.id */
}
ACT.hsdelk=v=>{const k=kidBy(v);if(!k||!isLead()||!canKid(k.id))return false;
 const n=DB.sess.filter(s=>s.k===k.id).length;
 const later=DB.kids.filter(x=>kNo(x)>kNo(k)).length;
 ask('Xóa hồ sơ của bé '+k.n+' ('+kcode(k)+')? Sẽ xóa cả '+n+' buổi can thiệp, kế hoạch, lịch 1-1, điểm danh, báo cáo và học phí của bé. Không hoàn tác được.'+(later?' Mã của '+later+' bé phía sau sẽ được dồn lên cho liên tục.':'')+' Nếu bé chỉ nghỉ, hãy dùng “Ngưng can thiệp” thay vì xóa.',()=>{hsDelKid(k.id);S.modal=null;toast('Đã xóa hồ sơ bé '+k.n);render()},'Xóa hồ sơ');return false};
