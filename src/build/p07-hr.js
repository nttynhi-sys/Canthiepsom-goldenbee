/* ===== 2. Nhân sự ===== */
/* Thứ tự cột: Quản lý, Trưởng Trung tâm, Văn phòng, Giáo viên, Phụ huynh. Tiền (học phí, thu chi, công nợ, lương): chỉ Trưởng Trung tâm và Văn phòng. */
const PERM={
 dash:['Toàn trung tâm, không có số tiền','Toàn trung tâm, kể cả học phí và công nợ','Học phí, công nợ, lương, chấm công','Của mình','—'],
 ns:['Xem danh sách, sửa hồ sơ giáo viên và hành chính (không cấp vai trò, không thấy lương)','Xem và sửa mọi hồ sơ, cấp vai trò, đổi mức lương và thông số','—','—','—'],
 hs:['Xem và sửa mọi bé, không thấy công nợ','Xem và sửa mọi bé, thấy công nợ','—','Trẻ mình phụ trách','—'],
 mt:['Chọn mục tiêu cho mọi bé, thêm mục tiêu của Trung tâm','Chọn mục tiêu cho mọi bé, thêm mục tiêu của Trung tâm','—','Chọn mục tiêu cho trẻ mình phụ trách','—'],
 pc:['Phân công, đổi giáo viên','Phân công, đổi giáo viên','—','—','—'],
 lh:['Xem và sửa lịch','Xem và sửa lịch','—','Lịch dạy của mình','Lịch học và giờ 1-1 của bé'],
 tn:['Xem và sửa thực đơn','Xem và sửa thực đơn','Xem và sửa thực đơn','Xem','Xem thực đơn lớp bán trú của bé'],
 cc:['Duyệt đơn, sửa công','Duyệt đơn, sửa công','Xem công và đơn nghỉ của mọi nhân sự, không sửa','Công và đơn nghỉ của mình','—'],
 dd:['Điểm danh, sửa bảng, không thấy phí','Điểm danh, sửa bảng, tính phí','Xem số ngày học, phép và tính phí, không sửa điểm danh','Lớp mình phụ trách','—'],
 hb:['Xếp lịch bù','Xếp lịch bù','—','Đề xuất lịch cho trẻ mình','Đăng ký, chọn lịch bù'],
 hp:['—','Thu, hoàn, chuyển phí, đổi thông số tiền','Thu, hoàn, chuyển phí','—','Học phí của bé'],
 tl:['—','Tính lương mọi nhân sự, thưởng, đổi mức lương','Tính lương giáo viên, hành chính, quản lý, thưởng','Phiếu lương của mình','—'],
 bc:['Duyệt, gửi phụ huynh','Duyệt, gửi phụ huynh','—','Soạn báo cáo trẻ mình','—'],
 td:['Toàn bộ','Toàn bộ','—','Tải lên cho trẻ mình','—'],
 cp:['Gửi, theo dõi, không thấy phí','Gửi, theo dõi','—','—','Hồ sơ của con'],
 tb:['Soạn và gửi, không có thông báo học phí','Soạn và gửi','Soạn và gửi, kể cả thông báo học phí','Xem, soạn cho lớp mình','Xem'],
 tk:['Xem, xuất Excel và PDF, không có số tiền','Xem, xuất Excel và PDF','Xem, xuất Excel và PDF','—','—']};
const nsList0=()=>{const n=S.ns,q=n.q.toLowerCase();return DB.staff.filter(s=>(!n.role||s.role===n.role)&&(!q||(s.n+' '+s.id+' '+s.pos).toLowerCase().includes(q)))};
VIEWS.ns=()=>{const n=S.ns=Object.assign({tab:'ds',q:'',role:''},S.ns);
 const tabs=[['ds','Danh sách nhân sự'],['pq','Phân quyền']].concat(canCfg()?[['cd','Cài đặt']]:[]);
 if(!tabs.some(t=>t[0]===n.tab))n.tab='ds';
 return head('Nhân sự',DB.staff.filter(s=>s.st==='dang').length+' nhân sự đang làm việc',n.tab==='ds'?'<button class="btn p" data-a="nvnew">Thêm nhân viên</button>':'')+tabsH(tabs,n.tab,'nstab')+(n.tab==='ds'?nsList():n.tab==='pq'?nsPerm():nsHours()+nsCfg())};
ACT.nstab=v=>{S.ns.tab=v};
INP.nsq=v=>{S.ns.q=v;S.pg.ns=1};
CHG.nsrole=v=>{S.ns.role=v;S.pg.ns=1};
function nsList(){const n=S.ns,all=nsList0(),p=pg('ns',all,15);
 return`<div class="card"><div class="f2" style="margin-bottom:12px"><div><label for="nsq">Tìm theo tên, mã hoặc chức vụ</label><input id="nsq" data-i="nsq" value="${esc(n.q)}"></div><div><label for="nsr">Vai trò</label><select id="nsr" data-c="nsrole"><option value="">Tất cả</option>${opts(Object.entries(ROLE),n.role)}</select></div></div>`
 +tbl(['Mã','Họ tên','Chức vụ','Vai trò','Điện thoại','Email đăng nhập','Vào làm','Trạng thái'].concat(accCol()?['Tài khoản']:[]),p.rows.map(s=>`<tr class="k" data-a="nvopen" data-v="${s.id}"><td>${s.id}</td><td><b>${esc(s.n)}</b></td><td>${esc(s.pos)}</td><td>${tg(ROLE[s.role],s.role==='ql'?'er':s.role==='tt'?'y':s.role==='vp'?'ok':s.role==='gv'?'in':'gy')}</td><td class="nw">${esc(s.ph)}</td><td>${esc(s.em)}</td><td class="nw">${vd(s.sd)}</td><td>${tg(s.st==='dang'?'Đang làm':'Đã nghỉ',s.st==='dang'?'ok':'gy')}</td>${accCol()?`<td>${accTag(s)}</td>`:''}</tr>`).join(''),'Không có nhân sự phù hợp.')+p.html+`<p class="sm mu" style="margin-top:8px">${CLOUDMODE?'Nhân viên hành chính không có tài khoản đăng nhập. Trưởng Trung tâm cấp tài khoản trong hồ sơ từng nhân viên.':'Nhân viên hành chính không có tài khoản đăng nhập. Mật khẩu chung của bản trình diễn là '+PW+'.'}</p></div>`}
function nsPerm(){const rl=['ql','tt','vp','gv','ph'];
 return`<div class="card"><h2>Ma trận phân quyền 5 vai trò</h2><p class="mu sm" style="margin-bottom:10px">Mỗi vai trò chỉ thấy các mục được cấp, và dữ liệu bị giới hạn theo phạm vi ghi ở từng ô. Phần tiền (học phí, thu chi, công nợ, lương) chỉ Trưởng Trung tâm và Văn phòng thấy; chỉ Trưởng Trung tâm đổi thông số tiền, mức lương và cấp vai trò. ${CLOUDMODE?'Dữ liệu tiền được máy chủ giới hạn theo vai trò; các giới hạn khác do giao diện áp dụng.':'Đây là phân quyền trên giao diện của bản trình diễn.'}</p>`
 +tbl(['Mục'].concat(rl.map(r=>ROLE[r])),NAV.map(([v,l])=>`<tr><td><b>${l}</b></td>${rl.map((r,i)=>{const t=PERM[v][i];return`<td>${t==='—'?'<span class="mu">Không có quyền</span>':esc(t)}</td>`}).join('')}</tr>`).join(''))+`</div>`}
/* khung giờ học: cài sẵn trong hệ thống, chỉ để xem */
function nsHours(){const L=SLOTS[SLOTS.length-1];
 return`<div class="card"><h2>Khung giờ học</h2><div class="rw"><span>Can thiệp 1-1</span><b>${DAY_OPEN}–${DAY_CLOSE}, mỗi ca ${SLOT_MIN} phút</b></div><div class="rw"><span>Số ca mỗi ngày</span><b>${SLOTS.length} ca (${slotLb(SLOTS[0])} đến ${slotLb(L)})</b></div><div class="rw"><span>Bán trú ${DB.groups.map(g=>esc(g.n)).join(' và ')}</span><b>${BTLB}, thứ Hai đến thứ Sáu</b></div><p class="sm mu" style="margin-top:8px">Các ca xếp liên tiếp, ca cuối kết thúc lúc ${slotEnd(L)}. Khung giờ được cài sẵn trong hệ thống nên không đổi ở đây.</p></div>`}
function nsCfg(){const c=DB.cfg,r=c.rule,f=(id,l,v,t)=>`<div><label for="${id}">${l}</label><input id="${id}" name="${id}" type="${t||'number'}" ${t?'':'min="0" step="any"'} value="${esc(v)}" required></div>`;
 return`<form id="cfgf" class="card f"><h2>Thông số học phí, hoàn phí và lương</h2><div class="f2">${f('name','Tên trung tâm',c.name,'text')}${f('p11','Học phí 1 buổi 1-1 (₫)',c.p11)}${f('pbtCN','Bán trú: phí can thiệp cá nhân/tháng (₫)',c.pbtCN)}${f('pbtKhac','Bán trú: các chi phí khác/tháng (₫)',c.pbtKhac)}</div>
 <h3>Quy tắc nghỉ học</h3><div class="f2">${f('pLoss','1-1 nghỉ có phép: học phí buổi bị mất (%)',r.pLoss)}${f('ttRefund','Trung tâm hoặc giáo viên nghỉ: hoàn (%)',r.ttRefund)}${f('bvRefund','Bán trú nhập viện có giấy: hoàn (% phí ngày)',r.bvRefund)}</div>
 <h3>Chấm công và lương nhân viên</h3><div class="f2">${f('lateAfter','Đi muộn nếu vào sau (giờ:phút)',c.lateAfter,'time')}${f('cc','Số công chuẩn/tháng',c.cc)}${f('giamTru','Giảm trừ gia cảnh/tháng (₫)',c.giamTru)}${f('thue','Thuế TNCN tạm tính (%)',c.thue)}</div>
 <p class="note sm">Thay đổi thông số áp dụng cho các bảng tính từ nay. Những hóa đơn đã ghi vào công nợ không tự đổi; thuế chỉ là ước tính một mức cố định, cần đối chiếu với kế toán.</p>
 <div class="acts"><button class="btn p" type="submit">Lưu thông số</button>${CLOUDMODE?'':'<button class="btn no" type="button" data-a="reset">Đặt lại dữ liệu mẫu</button>'}</div></form>`}
FORM.cfgf=f=>{if(!canCfg())return false;const g=n=>f.elements[n].value,c=DB.cfg,N=n=>Math.max(0,+g(n)||0);
 Object.assign(c,{name:g('name').trim()||c.name,p11:N('p11'),pbtCN:N('pbtCN'),pbtKhac:N('pbtKhac'),lateAfter:g('lateAfter')||c.lateAfter,cc:N('cc')||26,giamTru:N('giamTru'),thue:Math.min(35,N('thue'))});
 Object.assign(c.rule,{pLoss:Math.min(100,N('pLoss')),ttRefund:Math.min(100,N('ttRefund')),bvRefund:Math.min(100,N('bvRefund'))});toast('Đã lưu thông số')};
ACT.reset=()=>{if(CLOUDMODE||!canCfg())return false;ask('Xóa mọi thay đổi và nạp lại dữ liệu mẫu ban đầu? Hành động này không hoàn tác được.',()=>{seed();save();const u=U;if(u){const a=demoAcc(u.role);setUser(a)}toast('Đã nạp lại dữ liệu mẫu')},'Đặt lại')};
/* --- hồ sơ nhân viên --- */
ACT.nvnew=()=>{S.modal={t:'nv',id:''}};
ACT.nvopen=v=>{if(lockAcc(stBy(v))){toast('Hồ sơ này chỉ Trưởng Trung tâm xem và sửa');return false}S.accDone=null;S.modal={t:'nv',id:v}};
MODALS.nv=()=>{const id=S.modal.id,s=id?stBy(id):{n:'',pos:'',role:'gv',ph:'',em:'',sd:TODAY,sup:'',st:'dang',pay:{mode:'thang',base:0,rate:0,rateBt:0,allow:0,bh:0,latePen:0}};
 const roles=Object.entries(ROLE).filter(([k])=>k!=='ph'&&(canCfg()||k==='gv'||k==='hc'||k===s.role)),f=(n,l,v,t,x)=>`<div><label for="nv-${n}">${l}</label><input id="nv-${n}" name="${n}" type="${t||'text'}" value="${esc(v)}" ${x||''}></div>`;
 let st='';if(id){const p=payroll(s,CM),kids=DB.kids.filter(k=>k.gv===s.id&&k.st==='dang').length,ses=DB.lich.filter(l=>l.type==='11'&&l.gv===s.id).length;
  st=`<div class="grid" style="margin-bottom:12px">${kpi('Công '+mLow(CM),p.cong+'/'+DB.cfg.cc,p.late+' lần đi muộn, '+p.leave+' ngày nghỉ phép')}${kpi('Phụ trách',kids+' trẻ',ses+' buổi 1-1 mỗi tuần')}${canCfg()?kpi('Lương tạm tính',fmt(p.net),'sau BH và thuế'):''}</div>`}
 const pay=canCfg()?`<h3>Hình thức trả lương</h3><div class="f2"><div><label for="nv-mode">Cách tính</label><select id="nv-mode" name="mode">${opts([['thang','Lương tháng'],['buoi','Theo buổi'],['kethop','Lương cơ bản cộng theo buổi']],s.pay.mode)}</select></div>${f('base','Lương cơ bản/tháng (₫)',s.pay.base,'number','min="0"')}${f('rate','Đơn giá mỗi buổi 1-1 (₫)',s.pay.rate,'number','min="0"')}${f('rateBt','Đơn giá mỗi ngày bán trú (₫)',s.pay.rateBt,'number','min="0"')}${f('allow','Phụ cấp/tháng (₫)',s.pay.allow,'number','min="0"')}${f('bh','Bảo hiểm khấu trừ (% lương cơ bản)',s.pay.bh,'number','min="0" step="any"')}${f('latePen','Phạt mỗi lần đi muộn (₫)',s.pay.latePen,'number','min="0"')}</div>`:'<p class="note sm">Thông tin lương do Trưởng Trung tâm và Văn phòng quản lý, không hiển thị ở vai trò này.</p>';
 return mdl(id?'Hồ sơ '+s.n:'Thêm nhân viên',st+`<form id="nvf" class="f"><div class="f2">${f('n','Họ và tên',s.n,'text','required')}${f('pos','Chức vụ',s.pos)}<div><label for="nv-role">Vai trò hệ thống</label><select id="nv-role" name="role">${opts(roles,s.role)}</select></div><div><label for="nv-st">Trạng thái</label><select id="nv-st" name="st">${opts([['dang','Đang làm việc'],['nghi','Đã nghỉ việc']],s.st)}</select></div>${f('ph','Điện thoại',s.ph,'tel')}${f('em','Email đăng nhập',s.em,'email')}${f('sd','Ngày vào làm',s.sd,'date')}<div><label for="nv-sup">Quản lý trực tiếp</label><select id="nv-sup" name="sup"><option value="">Không có</option>${opts(DB.staff.filter(x=>x.id!==s.id&&(x.role==='ql'||x.role==='tt')).map(x=>[x.id,x.n]),s.sup)}</select></div></div>${pay}<div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu hồ sơ</button></div></form>`+(id?accSection(s):''),1)};
FORM.nvf=f=>{const g=n=>f.elements[n]?f.elements[n].value.trim():'',id=S.modal.id,isNew=!id;
 const s=isNew?{id:'nv'+pad(Math.max(...DB.staff.map(x=>+x.id.slice(2)))+1),pay:{mode:'thang',base:0,rate:0,rateBt:0,allow:0,bh:0,latePen:0}}:stBy(id),role=g('role'),em=g('em').toLowerCase();
 if(!isNew&&lockAcc(s)){toast('Hồ sơ này chỉ Trưởng Trung tâm sửa');return false}
 if(!canCfg()&&(role==='ql'||role==='tt'||role==='vp')&&role!==s.role){toast('Chỉ Trưởng Trung tâm được cấp vai trò Quản lý, Trưởng Trung tâm hoặc Văn phòng');return false}
 if(!g('n')){toast('Vui lòng nhập họ tên');return false}
 if(em&&DB.staff.some(x=>x.id!==s.id&&x.em.toLowerCase()===em)){toast('Email này đã có người dùng');return false}
 Object.assign(s,{n:g('n'),pos:g('pos'),role,ph:g('ph'),em,sd:g('sd'),sup:g('sup'),st:g('st')});
 if(canCfg()&&f.elements.mode)Object.assign(s.pay,{mode:g('mode'),base:+g('base')||0,rate:+g('rate')||0,rateBt:+g('rateBt')||0,allow:+g('allow')||0,bh:+g('bh')||0,latePen:+g('latePen')||0});
 if(isNew)DB.staff.push(s);S.modal=null;toast(isNew?'Đã thêm nhân viên':'Đã lưu hồ sơ')};
