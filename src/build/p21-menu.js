/* ===== 16. Thực đơn bán trú (lớp Ong non và Ong mật) ===== */
/* DB.menu[ngày] = {s: bữa sáng, t: bữa trưa, x: bữa xế, n: ghi chú}. Quản lý, Trưởng Trung tâm và Văn phòng sửa; giáo viên và phụ huynh chỉ xem. */
const MENU_S=['Cháo thịt bằm rau củ','Phở gà','Bánh mì trứng ốp la, sữa tươi','Xôi gà xé, sữa chua','Bún thịt bò viên','Cháo cá hồi, bông cải xanh','Mì Quảng gà'];
const MENU_T=['Cơm, cá hồi áp chảo, canh bí đỏ nấu thịt, rau cải luộc','Cơm, thịt kho trứng cút, canh rau ngót','Cơm, gà kho gừng, canh bầu nấu tôm','Cơm, thịt heo xào đậu que, canh bí xanh','Cơm, cá basa sốt cà chua, canh chua rau muống','Cơm, trứng chiên thịt bằm, canh mồng tơi','Cơm, sườn non rim, canh khoai tây cà rốt'];
const MENU_X=['Sữa chua, trái cây theo mùa','Bánh flan','Chè đậu xanh','Bánh bao nhân thịt','Sữa tươi, bánh quy','Sinh tố chuối','Cháo đậu xanh'];
const menuEdit=()=>isLead()||isVP();
const bday=d=>{while(dow(d)<1||dow(d)>5)d=addD(d,1);return d};
const menuDay=()=>bday(TODAY);
const menuDayLb=()=>'· '+DAYN[dow(menuDay())]+' '+vdm(menuDay())+(menuDay()===TODAY?' (hôm nay)':'');
function seedMenu(D){D.menu=D.menu||{};const w0=monOf(menuDay());let c=0;
 for(const w of[-1,0,1])for(let i=0;i<5;i++){const d=addD(w0,7*w+i);D.menu[d]={s:MENU_S[c%7],t:MENU_T[(c*2+1)%7],x:MENU_X[(c*3+2)%7],n:''};c++}}
const menuMini=d=>{const m=DB.menu[d];if(!m)return'<p class="empty">Chưa có thực đơn ngày này.</p>';
 return[['Bữa sáng',m.s],['Bữa trưa',m.t],['Bữa xế',m.x]].filter(x=>x[1]).map(([l,v])=>`<div class="rw" style="align-items:flex-start;flex-wrap:nowrap"><span class="mu sm" style="width:68px;flex:none">${l}</span><span style="flex:1;min-width:0">${esc(v)}</span></div>`).join('')+(m.n?`<p class="sm mu" style="margin-top:6px">${esc(m.n)}</p>`:'')};
VIEWS.tn=()=>{const t=S.tn=Object.assign({wk:monOf(menuDay())},S.tn),mon=t.wk,days=[0,1,2,3,4].map(i=>addD(mon,i)),E=menuEdit(),mine=isPH()?myKids().filter(k=>k.st==='dang'&&k.gr):[],cls=DB.groups.map(g=>esc(g.n)).join(' và ');
 return head('Thực đơn bán trú','Lớp '+cls+' · '+BTLB+', thứ Hai đến thứ Sáu',E?'<button class="btn s" data-a="tncopy">Sao chép từ tuần trước</button>':'')
 +(isPH()?`<div class="note sm" style="margin-bottom:12px">${mine.length?mine.map(k=>esc(given(k.n))+' học lớp '+esc((grBy(k.gr)||{}).n||'')).join('; ')+'. Thực đơn áp dụng chung cho hai lớp bán trú.':'Bé chưa đăng ký bán trú. Thực đơn dưới đây là của hai lớp bán trú '+cls+'.'}</div>`:'')
 +`<div class="card"><div class="acts" style="justify-content:space-between;margin-bottom:10px"><div class="acts"><button class="btn s" data-a="tnwk" data-v="-7">Tuần trước</button><button class="btn s" data-a="tnwk" data-v="0">Tuần này</button><button class="btn s" data-a="tnwk" data-v="7">Tuần sau</button></div><b>${vd(days[0])} đến ${vd(days[4])}</b></div>
 <div class="menu">${days.map(d=>`<div class="mday ${d===TODAY?'now':''}"><div class="mh"><b>${DAYN[dow(d)]}</b> <span class="mu sm">${vdm(d)}</span>${d===TODAY?' '+tg('Hôm nay','y'):''}</div>${menuMini(d)}${E?`<div class="acts" style="margin-top:8px"><button class="btn s" data-a="tnedit" data-v="${d}">${DB.menu[d]?'Sửa':'Thêm thực đơn'}</button></div>`:''}</div>`).join('')}</div>
 ${E?'<p class="sm mu" style="margin-top:10px">Thực đơn được phụ huynh và giáo viên xem theo từng tuần. Bấm “Sửa” ở từng ngày để nhập bữa sáng, trưa, xế.</p>':''}</div>`};
ACT.tnwk=v=>{S.tn.wk=v==='0'?monOf(menuDay()):addD(S.tn.wk,+v)};
ACT.tnedit=v=>{if(!menuEdit())return false;S.modal={t:'tnd',d:v}};
MODALS.tnd=()=>{const d=S.modal.d,m=DB.menu[d]||{s:'',t:'',x:'',n:''},f=(id,l,v)=>`<div><label for="tn-${id}">${l}</label><input id="tn-${id}" name="${id}" value="${esc(v)}" maxlength="200"></div>`;
 return mdl('Thực đơn '+DAYN[dow(d)]+' '+vd(d),`<form id="tndf" class="f">${f('s','Bữa sáng',m.s)}${f('t','Bữa trưa',m.t)}${f('x','Bữa xế',m.x)}${f('n','Ghi chú (không bắt buộc)',m.n)}<div class="acts" style="justify-content:space-between"><span>${DB.menu[d]?`<button class="btn no" type="button" data-a="tnclr" data-v="${d}">Xóa thực đơn ngày này</button>`:''}</span><span class="acts"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu</button></span></div></form>`)};
FORM.tndf=f=>{if(!menuEdit())return false;const e=f.elements,d=S.modal.d,v={s:e.s.value.trim(),t:e.t.value.trim(),x:e.x.value.trim(),n:e.n.value.trim()};
 if(!v.s&&!v.t&&!v.x&&!v.n)delete DB.menu[d];else DB.menu[d]=v;S.modal=null;toast('Đã lưu thực đơn '+vdm(d))};
ACT.tnclr=v=>{if(!menuEdit())return false;ask('Xóa thực đơn ngày '+vdm(v)+'?',()=>{delete DB.menu[v];toast('Đã xóa thực đơn')},'Xóa')};
ACT.tncopy=()=>{if(!menuEdit())return false;const mon=S.tn.wk,prev=addD(mon,-7);let n=0,has=0;
 for(let i=0;i<5;i++){const a=addD(prev,i),b=addD(mon,i);if(DB.menu[a]){has++;if(!DB.menu[b]){DB.menu[b]=Object.assign({},DB.menu[a]);n++}}}
 toast(!has?'Tuần trước chưa có thực đơn để sao chép':n?'Đã sao chép '+n+' ngày, ngày đã có thực đơn được giữ nguyên':'Các ngày của tuần này đã có thực đơn')};
