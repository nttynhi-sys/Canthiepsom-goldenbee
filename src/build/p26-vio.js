/* ===== Vi phạm nội quy và trừ lương ===== */
/* Theo thông báo "Nhắc nhở chung về giờ làm việc và quy định Trung tâm": các lỗi dưới đây được note lại và xử lý, mỗi lần bị note 20.000 đến 30.000 ₫;
   tùy mức độ, hậu quả và số lần tái diễn có thể cao hơn; trường hợp đặc biệt hoặc tái phạm nhiều lần do Trưởng Trung tâm quyết định.
   Quy trình: Quản lý ghi vi phạm và đề xuất mức (không thấy số tiền) → Trưởng Trung tâm duyệt và quyết định số tiền → chỉ vi phạm đã duyệt mới trừ vào lương của tháng có ngày vi phạm (payroll, vpen).
   Dữ liệu: DB.vio (collection vio, không phải tiền) = {id,st,d,r,n,lv,s,by,at,dby,dat,dn}; số tiền nằm ở DB.vam[nhânviên|mã] (money_records, collection vam: chỉ Trưởng Trung tâm, Văn phòng; nhân viên đọc phần của mình). */
const VIO_R=[['r1','Đi làm trễ nhưng không báo'],['r2','Đồ chơi, học cụ bị hư hỏng, thiếu nhưng không kiểm tra hoặc không báo lại'],['r3','Để học sinh làm hỏng đồ chơi, học cụ do thiếu giám sát'],['r4','Không note đồ chơi vào file danh sách mượn đồ chơi'],['r5','Sử dụng điện thoại trong giờ dạy khi không phục vụ công việc'],['r6','Nói chuyện, làm việc riêng, thiếu tập trung trong giờ dạy'],['r7','Gửi thiếu tiến độ, video hoặc hình ảnh giờ học theo yêu cầu'],['r8','Để học sinh chạy ra ngoài hoặc không đảm bảo an toàn cho học sinh'],['r9','Có hành vi, lời nói hoặc cách xử lý không phù hợp khi quản lý hành vi học sinh'],['r10','Dạy không đủ thời lượng (giáo viên cá nhân)'],['r11','Cắt bỏ tiết học của học sinh (giáo viên nhóm)'],['r12','Không báo cho phụ huynh khi phát hiện vết thương hoặc dấu hiệu bất thường của học sinh'],['rx','Lý do khác, ghi rõ ở ghi chú']];
const VIO_LV=[[1,'Mức 1, nhẹ'],[2,'Mức 2, vừa'],[3,'Mức cao hơn, trường hợp đặc biệt hoặc tái phạm']];
const VIO_ST={cho:['Chờ duyệt','wa'],duyet:['Đã duyệt','ok'],tuchoi:['Không áp dụng','gy']};
const vioR=id=>{const r=VIO_R.find(x=>x[0]===id);return r?r[1]:String(id||'')};
const vioLvT=n=>{const r=VIO_LV.find(x=>x[0]===+n);return r?r[1]:VIO_LV[0][1]};
const vioLvAmt=n=>+n===1?(+DB.cfg.v1||0):+n===2?(+DB.cfg.v2||0):0;
const vioOf=id=>(DB.vio||[]).find(v=>v.id===id);
const vioMoney=()=>canMoney()||isGV();   /* thấy số tiền trừ: Trưởng Trung tâm, Văn phòng, và nhân viên với phần của chính mình */
const vioKey=v=>v.st+'|'+v.id;
/* số lần đã được ghi nhận của cùng nhân sự trong cùng tháng (không tính lần đang xét và lần không áp dụng), để Trưởng Trung tâm cân nhắc tái diễn */
const vioPrev=v=>{const m=String(v.d).slice(0,7),o=DB.vio.filter(x=>x.id!==v.id&&x.st===v.st&&x.s!=='tuchoi'&&String(x.d).slice(0,7)===m);return{n:o.length,same:o.filter(x=>x.r===v.r).length}};
const vioMonths=()=>[0,-1,-2,-3,-4,-5].map(k=>sm(CM,k));

VIEWS.vi=()=>{const c=S.vi=Object.assign({tab:'ds',m:CM,st:''},S.vi),gv=isGV(),pend=DB.vio.filter(v=>v.s==='cho').length;
 const tabs=gv?[['ds','Của tôi'],['quy','Quy định']]:[['ds','Danh sách'+(pend?' ('+pend+' chờ duyệt)':'')],['quy','Quy định']];
 if(!tabs.some(t=>t[0]===c.tab))c.tab='ds';
 return head(gv?'Vi phạm của tôi':'Vi phạm nội quy',gv?'Các lần vi phạm đã được Trưởng Trung tâm duyệt':'Ghi nhận lỗi theo quy định Trung tâm và mức trừ lương',isLead()?'<button class="btn p" data-a="vinew">Ghi vi phạm</button>':'')+tabsH(tabs,c.tab,'vitab')+(c.tab==='quy'?vioRules():vioList2())};
ACT.vitab=v=>{S.vi.tab=v};
CHG.vim=v=>{S.vi.m=v};
CHG.vist=v=>{S.vi.st=v};
function vioList2(){const c=S.vi,gv=isGV(),money=vioMoney();
 let rows=DB.vio.filter(v=>(!c.m||String(v.d).slice(0,7)===c.m)&&(!c.st||v.st===c.st)&&(!gv||(v.st===U.id&&v.s==='duyet'))).sort((a,b)=>a.s===b.s?(a.d<b.d?1:-1):a.s==='cho'?-1:b.s==='cho'?1:(a.d<b.d?1:-1));
 const tot=rows.filter(v=>v.s==='duyet').reduce((a,v)=>a+vioAmt(v),0);
 const ctl=`<div class="card"><div class="f2" style="margin-bottom:12px"><div><label for="vi-m">Tháng</label><select id="vi-m" data-c="vim">${opts([['','Mọi tháng']].concat(vioMonths().map(m=>[m,mLabel(m)])),c.m)}</select></div>${gv?'':`<div><label for="vi-s">Nhân sự</label><select id="vi-s" data-c="vist"><option value="">Tất cả</option>${opts(DB.staff.filter(s=>s.st==='dang').map(s=>[s.id,s.n]),c.st)}</select></div>`}</div>`;
 const th=['Ngày'].concat(gv?[]:['Nhân sự'],['Lý do','Mức'],money?['>Số tiền trừ']:[],['Ghi chú'],gv?[]:['Người ghi'],['Trạng thái',''].slice(0,gv?1:2));
 const body=rows.map(v=>{const st=VIO_ST[v.s]||VIO_ST.cho;
  return`<tr><td class="nw">${vd(v.d)}</td>${gv?'':`<td><b>${esc(sn(v.st))}</b></td>`}<td>${esc(vioR(v.r))}</td><td class="nw">${esc(vioLvT(v.lv).split(',')[0])}</td>${money?`<td class="r nw">${v.s==='duyet'?fmt(vioAmt(v)):'–'}</td>`:''}<td>${esc(v.n||'')}${v.dn?`<br><span class="sm mu">Trưởng Trung tâm: ${esc(v.dn)}</span>`:''}</td>${gv?'':`<td>${esc(sn(v.by))}</td>`}<td>${tg(st[0],st[1])}</td>${gv?'':`<td class="nw">${vioActs(v)}</td>`}</tr>`}).join('');
 return ctl+tbl(th,body,gv?'Bạn chưa có vi phạm nào được duyệt trong thời gian này.':'Chưa có ghi nhận vi phạm nào.')
  +(money&&rows.some(v=>v.s==='duyet')?`<p class="sm" style="margin-top:8px"><b>Tổng trừ lương đã duyệt: ${fmt(tot)}</b></p>`:'')
  +`<p class="sm mu" style="margin-top:8px">${gv?'Số tiền trừ được tính vào phiếu lương của tháng có ngày vi phạm.':isTT()?'Bấm "Duyệt" để quyết định số tiền trừ lương. Chỉ vi phạm đã duyệt mới trừ vào lương của tháng có ngày vi phạm.':isQL()?'Quản lý ghi vi phạm và đề xuất mức; Trưởng Trung tâm duyệt và quyết định số tiền. Quản lý không xem số tiền.':'Chỉ xem, việc ghi và duyệt do Quản lý và Trưởng Trung tâm thực hiện.'}</p></div>`}
function vioActs(v){
 if(isTT())return(v.s==='duyet'?`<button class="btn s" data-a="vinew" data-v="${v.id}">Sửa</button> `:`<button class="btn s p" data-a="videc" data-v="${v.id}">${v.s==='cho'?'Duyệt':'Duyệt lại'}</button> `)+`<button class="btn s no" data-a="videl" data-v="${v.id}">Xóa</button>`;
 if(isQL()&&v.s==='cho'&&v.st!==U.id)return`<button class="btn s" data-a="vinew" data-v="${v.id}">Sửa</button> <button class="btn s no" data-a="videl" data-v="${v.id}">Xóa</button>`;
 return''}
function vioRules(){const mo=canMoney(),c=DB.cfg;
 return`<div class="card"><h2>Các lỗi được note lại và xử lý theo quy định</h2><ol class="sm" style="margin:8px 0 12px 20px;line-height:1.7">${VIO_R.slice(0,12).map(r=>`<li>${esc(r[1])}</li>`).join('')}<li>Các trường hợp khác (v.v.), Quản lý ghi rõ lý do.</li></ol>
 <h3>Mức xử lý</h3><p class="sm">${mo?`Mỗi lần bị note: mức 1 ${fmt(c.v1==null?20000:c.v1)}, mức 2 ${fmt(c.v2==null?30000:c.v2)} (đổi ở Nhân sự, Cài đặt).`:'Mỗi lần bị note, Trung tâm trừ lương theo mức đã thông báo chung.'} Tùy theo mức độ vi phạm, hậu quả và số lần tái diễn, mức xử lý có thể cao hơn. Các trường hợp đặc biệt hoặc tái phạm nhiều lần do Trưởng Trung tâm xem xét và quyết định mức xử lý cụ thể.</p>
 <p class="note sm" style="margin-top:10px">Quản lý ghi vi phạm và đề xuất mức; Trưởng Trung tâm duyệt và quyết định số tiền. Chỉ vi phạm đã duyệt mới trừ vào lương của tháng có ngày vi phạm, và hiện trên phiếu lương của nhân viên.</p></div>`}

/* --- ghi, sửa --- */
ACT.vinew=v=>{if(!isLead())return false;const x=v?vioOf(v):null;
 if(x&&!isTT()&&(x.s!=='cho'||x.st===U.id)){toast('Vi phạm đã được xử lý, chỉ Trưởng Trung tâm sửa được');return false}
 S.modal={t:'vif',id:x?x.id:''}};
MODALS.vif=()=>{const id=S.modal.id,v=id?vioOf(id):null,tt=isTT(),sl=DB.staff.filter(s=>s.st==='dang'&&(tt||s.id!==U.id)),amt=v&&DB.vam?DB.vam[vioKey(v)]:'';
 return mdl(v?'Sửa ghi nhận vi phạm':'Ghi nhận vi phạm',`<form id="vif" class="f"><div class="f2"><div><label for="vi-st">Nhân sự</label><select id="vi-st" name="st" required><option value="">Chọn nhân sự</option>${opts(sl.map(s=>[s.id,s.n+' · '+s.pos]),v?v.st:'')}</select></div><div><label for="vi-d">Ngày vi phạm</label><input id="vi-d" name="d" type="date" max="${TODAY}" value="${v?v.d:TODAY}" required></div></div>
 <div><label for="vi-r">Lý do (theo quy định của Trung tâm)</label><select id="vi-r" name="r">${opts(VIO_R,v?v.r:'r1')}</select></div>
 <div><label for="vi-n">Ghi chú chi tiết (bắt buộc nếu chọn "Lý do khác")</label><textarea id="vi-n" name="n" rows="3">${esc(v?v.n:'')}</textarea></div>
 <div class="f2"><div><label for="vi-lv">Mức xử lý${tt?'':' đề xuất'}</label><select id="vi-lv" name="lv">${opts(VIO_LV,v?v.lv:1)}</select></div>${tt?`<div><label for="vi-a">Số tiền trừ lương (₫)</label><input id="vi-a" name="a" type="number" min="0" step="1000" value="${amt||''}" placeholder="Để trống: theo mức 1 hoặc mức 2"></div>`:''}</div>
 <p class="sm mu">${tt?`Mức 1 là ${fmt(DB.cfg.v1)}, mức 2 là ${fmt(DB.cfg.v2)}. Mức cao hơn thì nhập số tiền. Trưởng Trung tâm ghi trực tiếp thì được duyệt luôn.`:'Quản lý ghi lý do và đề xuất mức, Trưởng Trung tâm sẽ duyệt và quyết định số tiền trừ lương.'} Ghi chú sẽ hiện cho nhân sự sau khi vi phạm được duyệt.</p>
 <div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">${tt?'Lưu và duyệt':'Gửi Trưởng Trung tâm duyệt'}</button></div></form>`)};
FORM.vif=f=>{if(!isLead())return false;const e=f.elements,id=S.modal.id,old=id?vioOf(id):null,tt=isTT();
 const st=e.st.value,d=e.d.value,r=e.r.value,n=e.n.value.trim(),lv=Math.min(3,Math.max(1,+e.lv.value||1));
 if(!stBy(st)||!d){toast('Hãy chọn nhân sự và ngày vi phạm');return false}
 if(d>TODAY){toast('Ngày vi phạm không được ở tương lai');return false}
 if(r==='rx'&&!n){toast('Lý do khác cần ghi rõ ở ghi chú');return false}
 if(!tt&&st===U.id){toast('Quản lý không ghi vi phạm cho chính mình');return false}
 if(old&&!tt&&(old.s!=='cho'||old.st===U.id)){toast('Vi phạm đã được xử lý, chỉ Trưởng Trung tâm sửa được');return false}
 let a=0;if(tt){a=Math.round(+e.a.value)||vioLvAmt(lv);if(!(a>0)){toast('Mức cao hơn cần nhập số tiền trừ lương');return false}}
 const x=old||{id:'vi'+uid(),by:U.id,at:TODAY,s:'cho'};
 if(old&&DB.vam[vioKey(old)]!=null)delete DB.vam[vioKey(old)];   /* đổi nhân sự thì đổi khóa tiền */
 Object.assign(x,{st,d,r,n,lv});
 if(tt){x.s='duyet';x.dby=U.id;x.dat=TODAY;DB.vam[vioKey(x)]=a}
 if(!old)DB.vio.push(x);
 S.modal=null;toast(tt?'Đã ghi và duyệt vi phạm':'Đã gửi Trưởng Trung tâm duyệt')};

/* --- duyệt, không áp dụng, xóa (Trưởng Trung tâm) --- */
ACT.videc=v=>{if(!isTT()||!vioOf(v))return false;S.modal={t:'vid',id:v}};
MODALS.vid=()=>{const v=vioOf(S.modal.id);if(!v)return'';const pv=vioPrev(v),a=(DB.vam&&DB.vam[vioKey(v)])||vioLvAmt(v.lv)||'';
 return mdl('Duyệt vi phạm',`<p><b>${esc(sn(v.st))}</b> · ${vd(v.d)}</p><p style="margin-top:4px">${esc(vioR(v.r))}</p>${v.n?`<p class="mu sm" style="margin-top:4px">Ghi chú: ${esc(v.n)}</p>`:''}
 <p class="sm mu" style="margin:8px 0">Quản lý ${esc(sn(v.by))} đề xuất: ${esc(vioLvT(v.lv))}. Trong tháng này nhân sự đã có ${pv.n} lần được ghi nhận khác (${pv.same} lần cùng lý do).</p>
 <form id="vidf" class="f"><div class="f2"><div><label for="vd-a">Số tiền trừ lương (₫)</label><input id="vd-a" name="a" type="number" min="0" step="1000" value="${a}" required></div><div><label for="vd-n">Ghi chú của Trưởng Trung tâm (nếu có)</label><input id="vd-n" name="dn" value="${esc(v.dn||'')}"></div></div>
 <p class="sm mu">Mức 1 là ${fmt(DB.cfg.v1)}, mức 2 là ${fmt(DB.cfg.v2)}; tái diễn hoặc nặng thì nhập số cao hơn. Trừ vào lương tháng ${+v.d.slice(5,7)}/${v.d.slice(0,4)}.</p>
 <div class="acts" style="justify-content:flex-end"><button class="btn no" type="button" data-a="vireject">Không áp dụng</button><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Duyệt, trừ lương</button></div></form>`)};
FORM.vidf=f=>{if(!isTT())return false;const v=vioOf(S.modal.id);if(!v)return false;const a=Math.round(+f.elements.a.value);
 if(!(a>0)){toast('Hãy nhập số tiền trừ lương lớn hơn 0');return false}
 Object.assign(v,{s:'duyet',dby:U.id,dat:TODAY,dn:f.elements.dn.value.trim()});DB.vam[vioKey(v)]=a;S.modal=null;toast('Đã duyệt, trừ '+fmt(a)+' vào lương')};
ACT.vireject=()=>{if(!isTT())return false;const v=vioOf(S.modal&&S.modal.id);if(!v)return false;const n=$q('#vd-n');
 Object.assign(v,{s:'tuchoi',dby:U.id,dat:TODAY,dn:n?n.value.trim():''});delete DB.vam[vioKey(v)];S.modal=null;toast('Đã đặt không áp dụng, không trừ lương')};
ACT.videl=id=>{const v=vioOf(id);if(!v||!(isTT()||(isQL()&&v.s==='cho'&&v.st!==U.id)))return false;
 ask('Xóa ghi nhận vi phạm của '+sn(v.st)+' ngày '+vd(v.d)+'?'+(v.s==='duyet'?' Số tiền đã trừ sẽ không còn trong lương.':''),()=>{DB.vio=DB.vio.filter(x=>x.id!==id);delete DB.vam[vioKey(v)];toast('Đã xóa')},'Xóa')};
