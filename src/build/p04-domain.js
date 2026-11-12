/* ===== Nghiệp vụ: tra cứu, học phí, hoàn phí, lịch, chấm công, lương ===== */
const kidBy=id=>DB.kids.find(k=>k.id===id);
const stBy=id=>DB.staff.find(s=>s.id===id);
const grBy=id=>DB.groups.find(g=>g.id===id);
const kn=id=>{const k=kidBy(id);return k?k.n:'(đã xóa)'};
const sn=id=>{const s=stBy(id);return s?s.n:'Chưa phân công'};
const policyH=k=>`<div class="note"><b>${esc(POLICY[k].t)}</b>${POLICY[k].p.map(t=>`<p style="margin-top:6px">${esc(t)}</p>`).join('')}</div>`;

/* --- Học phí và bảng tính chấm công học sinh --- */
const fee11=k=>k.f11||DB.cfg.p11;
/* Loại can thiệp 1-1 và giá mỗi giờ (đồng). Mỗi ca 1-1 trong lịch mang mã loại (l.lt); ca cũ chưa có loại thì tính theo giá chung fee11. */
const LT=[{c:'ng',n:'Học cá nhân ngôn ngữ',f:180000},{c:'nh',n:'Học nhóm',f:180000},{c:'gq',n:'Học vận động – giác quan',f:200000},{c:'ms',n:'Massage điều hoà cảm thụ bản thể',f:200000},{c:'vd',n:'Học vận động thô – vận động tinh',f:200000},{c:'tc',n:'Học kỹ năng tự chăm sóc: mặc áo, đánh răng...',f:180000},{c:'nc',n:'Học vận động dưới nước',f:190000}];
const LTM=Object.fromEntries(LT.map(x=>[x.c,x]));
/* Giá từng loại do Trưởng Trung tâm chỉnh ở Nhân sự → Cài đặt (DB.cfg['lt_'+mã], tiền nên đi theo CFG_MONEY); chưa chỉnh thì dùng giá gốc x.f. */
const ltFee=x=>{const v=DB.cfg&&DB.cfg['lt_'+x.c];return v==null?x.f:v};
/* Giá riêng từng bé (money_records, collection kpr, khóa = mã bé, {mã loại: giá}): đứng trước giá chung của loại. Không có thì dùng giá chung. */
const kidLt=(k,c)=>{const o=(DB.kpr||{})[k.id];return o&&o[c]!=null?o[c]:null};
const feeSlot=(k,sid)=>{const l=DB.lich.find(x=>x.id===sid);if(l&&l.lt&&LTM[l.lt]){const p=kidLt(k,l.lt);return p!=null?p:ltFee(LTM[l.lt])}return fee11(k)};
/* --- Thời khóa biểu bán trú và giờ 1-1 --- */
const tmin=t=>{const [h,m]=String(t).split(':').map(Number);return h*60+m};
const tkbRows=gid=>(DB.tkb||[]).filter(r=>r.gr===gid||!r.gr).slice().sort((a,b)=>tmin(a.s)-tmin(b.s)||tmin(a.e)-tmin(b.e));
/* nhắc khi ca 1-1 của bé bán trú nằm ngoài giờ bán trú hoặc trùng giờ ăn, ngủ trưa của lớp */
function btWarn(k,w,slot){if(!btHas(k,w))return'';const e=slotEnd(slot);
 if(tmin(slot)<tmin(BT.s)||tmin(e)>tmin(BT.e))return'ca nằm ngoài giờ bán trú ('+BTLB+')';
 const hit=tkbRows(k.gr).find(r=>(r.k==='an'||r.k==='ngu')&&tmin(slot)<tmin(r.e)&&tmin(e)>tmin(r.s));
 return hit?'trùng giờ "'+hit.n.toLowerCase()+'" của lớp ('+hit.s+'–'+hit.e+')':''}
/* Ca 1-1 nằm trong gói bán trú: mỗi ngày bán trú của bé có đúng một ca 1-1 (ca sớm nhất trong ngày) tính vào phí bán trú, không tính riêng. */
function incIdW(k,w){if(!k||!btHas(k,w))return '';let b=null;DB.lich.forEach(l=>{if(l.type==='11'&&l.hs===k.id&&l.day===w&&(!b||l.slot<b.slot))b=l});return b?b.id:''}
const incSession=(k,d)=>incIdW(k,dow(d));
/* lớp bán trú có học vào thứ này không: thứ Hai đến thứ Sáu luôn mở; thứ Bảy chỉ mở khi có bé đăng ký học thứ Bảy */
const grOpen=(g,w)=>w>=1&&w<=5||(w===6&&DB.kids.some(k=>k.gr===g.id&&k.st==='dang'&&btHas(k,6)));
/* --- Ngày nghỉ lễ / Trung tâm cho nghỉ: Trung tâm đặt trước, học phí trả trước tính theo lịch đã trừ các ngày này --- */
const holOf=d=>(DB.hol||[]).find(h=>h.d===d)||null;
const isClosed=d=>!!holOf(d);
const HOLK={le:'Nghỉ lễ',tt:'Trung tâm cho nghỉ'};
const holIn=m=>(DB.hol||[]).filter(h=>h.d.slice(0,7)===m&&dow(h.d)!==0).sort((a,b)=>a.d<b.d?-1:1);
function sched(k,m){const out=[],ls=DB.lich.filter(l=>l.hs===k.id),bd=btOf(k);
 for(const d of mDates(m)){const w=dow(d);if(!w||isClosed(d))continue;
  const day=ls.filter(l=>l.type==='11'&&l.day===w).sort((x,y)=>x.slot<y.slot?-1:x.slot>y.slot?1:0),inBt=bd.includes(w);
  day.forEach((l,i)=>out.push({d,sid:l.id,kind:'11',slot:l.slot,inc:inBt&&i===0}));
  ls.forEach(l=>{if(l.type==='bu'&&l.date===d)out.push({d,sid:l.id,kind:'bu',slot:l.slot})});
  if(inBt)out.push({d,sid:k.gr,kind:'bt',slot:BT.s})}
 return out}
/* Học phí tháng = số ca 1-1 tính riêng × giá ca + số ngày bán trú × giá ngày bán trú (gồm sẵn 1 ca 1-1 mỗi ngày) */
function invoice(k,m){if(k.st!=='dang'||k.sd.slice(0,7)>m)return 0;const xs=sched(k,m);
 return xs.filter(x=>x.kind==='11'&&!x.inc).reduce((a,x)=>a+feeSlot(k,x.sid),0)+xs.filter(x=>x.kind==='bt').length*(DB.cfg.pbtDay||0)}
const makeupFor=(h,d,s)=>DB.mk.find(r=>r.hs===h&&r.from.d===d&&r.from.sid===s&&(r.s==='xn'||r.s==='xong'));
const CL={cm:'x',p:'P',kp:'K',tt:'N',bv:'V'};
/* Nhập viện có giấy, ngày bán trú: phí bán trú (không gồm ca 1-1) hoàn bvRefund% (mặc định 50%), riêng phí ca 1-1 trong ngày hoàn bvRefund11% (mặc định 100%) */
const bv11=R=>{const v=R&&R.bvRefund11;return v==null||v===''||isNaN(+v)?100:Math.max(0,Math.min(100,+v))};
function feeOf(k,kind,d,sid,code,m){
 const R=DB.cfg.rule,f=feeSlot(k,sid),dAll=DB.cfg.pbtDay||0,dCN=Math.min(DB.cfg.pbtDay11||0,dAll);
 let rf=0,ls=0,note='';
 if(kind==='11'){const mk=makeupFor(k.id,d,sid);
  if(code==='p'){if(mk)note='Đã thỏa thuận học bù nên không tính phí nghỉ';else{rf=f*(100-R.pLoss)/100;ls=f*R.pLoss/100;note='Có phép: mất '+R.pLoss+'% phí buổi, hoàn '+(100-R.pLoss)+'% trừ vào học phí tháng sau'}}
  else if(code==='kp'){if(mk)note='Đã thỏa thuận học bù nên không tính phí nghỉ';else{ls=f;note='Không phép: mất 100% phí buổi'}}
  else if(code==='tt'){if(mk)note='Trung tâm hoặc giáo viên nghỉ, hai bên đã thỏa thuận học bù';else{rf=f*R.ttRefund/100;note='Trung tâm hoặc giáo viên nghỉ, không học bù: hoàn '+R.ttRefund+'% phí buổi'}}}
 else{
  if(code==='p'){rf=dCN;ls=dAll-dCN;note='Báo trước 1 ngày hoặc trước 7g sáng: hoàn phí can thiệp cá nhân (ca 1-1 trong ngày), không hoàn chi phí khác'}
  else if(code==='kp'){ls=dAll;note='Báo muộn hoặc không báo: không hoàn phí'}
  else if(code==='bv'){const rB=Math.max(dAll-dCN,0),r11=bv11(R),a=rB*R.bvRefund/100,b=dCN*r11/100;rf=a+b;ls=dAll-rf;
   note='Nhập viện có giấy: hoàn '+R.bvRefund+'% phí bán trú ('+fmt(a)+') và '+r11+'% phí ca 1-1 trong ngày ('+fmt(b)+')'}
  else if(code==='tt'){note='Trung tâm cho nghỉ (thiên tai, dịch bệnh...): xếp học bù, không tính phí nghỉ'}}
 return{rf:Math.round(rf),ls:Math.round(ls),note}}
function settle(k,m){
 const r={k:k.id,m,rows:[],cells:{},plan:0,planInc:0,planBt:0,cm:0,p:0,kp:0,tt:0,bv:0,bu:0,none:0,lost:0,refund:0,stop:k.st==='nghi'};
 const put=(d,c)=>{const a=r.cells[d]=r.cells[d]||[];if(!a.includes(c))a.push(c)};
 for(const x of sched(k,m)){
  const code=DB.att[x.d+'|'+x.sid+'|'+k.id]||'';
  if(x.kind==='bu'){if(code==='cm'){r.bu++;put(x.d,'B')}else if(x.d<WD)put(x.d,'?');continue}
  if(x.kind==='11'){if(x.inc){r.planInc++;continue}r.plan++}else r.planBt++;   /* ca 1-1 trong gói bán trú tính theo ngày bán trú, không tính riêng */
  if(!code){if(x.d<WD){r.none++;put(x.d,'?')}continue}
  put(x.d,CL[code]);r[code]++;
  if(code==='cm')continue;
  const o=feeOf(k,x.kind,x.d,x.sid,code,m);
  r.rows.push({d:x.d,kind:x.kind,slot:x.slot,code,note:o.note,rf:o.rf,ls:o.ls});
  r.refund+=o.rf;r.lost+=o.ls}
 if(r.stop){r.refund=0;r.rows.forEach(x=>{x.rf=0;x.note+=' (bé đã ngưng can thiệp: không hoàn)'})}
 r.refund=Math.round(r.refund);r.lost=Math.round(r.lost);return r}
function postSettle(k,m){const key=k.id+'|'+m,old=DB.set[key],r=settle(k,m);
 if(old)DB.lg=DB.lg.filter(x=>x.id!==old.ref);
 if(r.refund>0){const nm=sm(m,1),e={id:uid(),hs:k.id,date:nm+'-01',kind:'hoan',amt:r.refund,m:nm,note:'Hoàn phí nghỉ '+mLow(m)+', trừ vào học phí tháng sau',src:key};DB.lg.push(e);DB.set[key]={ref:e.id,amt:e.amt,at:TODAY}}
 else delete DB.set[key]}
const balance=h=>DB.lg.filter(e=>e.hs===h).reduce((s,e)=>s+LGK[e.kind][2]*e.amt,0);

/* --- Lịch học --- */
function lichAt(w,slot,date){return DB.lich.filter(l=>l.slot===slot&&((l.type==='11'&&l.day===w)||(l.type==='bu'&&l.date===date)))}
/* các buổi chồng giờ với ca bắt đầu lúc `slot` (dùng để kiểm tra trùng khi giờ bắt đầu chọn tự do) */
function lichNear(w,slot,date){return DB.lich.filter(l=>l.slot&&slotOver(l.slot,slot)&&((l.type==='11'&&l.day===w)||(l.type==='bu'&&l.date===date)))}
function conflict(x){const w=x.date?dow(x.date):x.day;
 if(x.date&&isClosed(x.date))return 'Trung tâm nghỉ ngày này ('+holOf(x.date).n+')';
 if(DB.groups.some(g=>(g.gv===x.gv||g.tg===x.gv)&&grOpen(g,w)))return 'Giáo viên đang phụ trách lớp bán trú vào ngày này';
 const same=lichNear(w,x.slot,x.date).filter(l=>l.id!==x.id);
 if(same.some(l=>l.gv===x.gv))return 'Giáo viên đã có buổi khác ở khung giờ này';
 if(same.some(l=>l.hs===x.hs))return 'Trẻ đã có buổi khác ở khung giờ này';
 if(x.room&&same.some(l=>l.room===x.room))return 'Phòng đã được dùng ở khung giờ này';
 if(x.date&&DB.lr.some(l=>l.st===x.gv&&l.s==='duyet'&&l.f<=x.date&&x.date<=l.t))return 'Giáo viên có đơn nghỉ đã duyệt vào ngày này';
 return ''}
function freeSlots(gv,hs,from,n){const out=[];let d=from;
 for(let i=0;i<28&&out.length<n;i++,d=addD(d,1)){if(!isW(d)||isClosed(d))continue;let c=0;
  for(const s of SLOTS){if(c>=2)break;const room=ROOMS.find(r=>!conflict({date:d,slot:s,gv,hs,room:r}));if(room){out.push({date:d,slot:s,room});c++}}}
 return out}
function dayList(date){const w=dow(date),out=[],first={};if(isClosed(date))return out;
 DB.lich.forEach(l=>{if(l.type==='11'&&l.day===w&&(!first[l.hs]||l.slot<first[l.hs].slot))first[l.hs]=l});
 DB.lich.forEach(l=>{if((l.type==='11'&&l.day===w)||(l.type==='bu'&&l.date===date)){const k=kidBy(l.hs);
  if(k&&k.st==='dang')out.push({sid:l.id,kind:l.type,label:(l.type==='bu'?'Học bù · ':'1-1 · ')+slotLb(l.slot),gv:l.gv,slot:l.slot,room:l.room,kids:[k],inc:l.type==='11'&&first[l.hs]===l&&btHas(k,w)})}});
 DB.groups.forEach(g=>{const ks=DB.kids.filter(k=>k.gr===g.id&&k.st==='dang'&&btHas(k,w));if(ks.length)out.push({sid:g.id,kind:'bt',label:g.n+' · Bán trú',gv:g.gv,tg:g.tg,slot:BT.s,room:'',kids:ks})});
 return out.sort((a,b)=>a.slot<b.slot?-1:a.slot>b.slot?1:0)}

/* --- Chấm công nhân viên và lương --- */
/* Chấm công do Quản lý hoặc Trưởng Trung tâm thực hiện, chỉ cho nhân sự có lương cố định hoặc lương cơ bản (làm giờ cố định). Nhân sự trả lương theo ca 1-1 (s.cc===false) không chấm công: lương tính theo ca đã dạy. s.cc là bản sao không phải số tiền của hình thức trả lương, để Quản lý (không thấy lương) vẫn biết ai cần chấm công; chưa có thì coi là cần chấm công. */
const needCC=s=>!s||s.cc!==false,ccOf=pay=>!!pay&&(pay.mode!=='buoi'||(+pay.rateBt||0)>0);
function tsSt(id,d){const l=DB.lr.find(x=>x.st===id&&x.s==='duyet'&&x.f<=d&&d<=x.t);if(l)return l.type==='kl'?'kl':'leave';
 if(!needCC(stBy(id)))return isW(d)&&isClosed(d)?'hol':'';
 const r=DB.ts[id+'|'+d];if(r&&r.i)return r.i>DB.cfg.lateAfter?'late':'ok';
 if(isW(d)&&isClosed(d))return 'hol';
 if(d>TODAY||!isW(d))return '';return d>=WD?'chua':'abs'}
/* Tỉ lệ lương một ca 1-1 theo tình trạng của bé: có mặt và dạy bù trả đủ 100%; bé nghỉ không phép được 50%; các trường hợp còn lại do Trung tâm đặt */
function gvPct(){const R=DB.cfg.rule||{},n=(v,d)=>v==null||v===''||isNaN(+v)?d:Math.max(0,Math.min(100,+v));
 return{cm:100,kp:n(R.gvKp,50),p:n(R.gvP,0),tt:n(R.gvTt,0),bv:n(R.gvBv,0)}}
/* Vi phạm nội quy (collection vio, mức tiền ở money_records vam theo khóa nhânviên|mãvipham): số tiền trừ lương trong tháng m của một nhân sự, chỉ tính vi phạm đã duyệt */
const vioAmt=v=>+((DB.vam||{})[v.st+'|'+v.id])||0;
const vioList=(id,m)=>(DB.vio||[]).filter(v=>v.st===id&&v.s==='duyet'&&(!m||String(v.d).slice(0,7)===m));
const vioSum=(id,m)=>vioList(id,m).reduce((a,v)=>a+vioAmt(v),0);
function payroll(s,m){
 const f=s.pay||{},cfg=DB.cfg,dts=mDates(m).filter(d=>isW(d)&&d<WD),mine=DB.lich.filter(l=>l.gv===s.id),pc=gvPct();
 const myGr=DB.groups.filter(g=>g.gv===s.id||g.tg===s.id),open6=myGr.some(g=>grOpen(g,6));
 let cong=0,late=0,btd=0,leave=0,abs=0,hol=0;
 const ss={cm:0,kp:0,p:0,tt:0,bv:0,bu:0,none:0},cc=needCC(s);
 for(const d of dts){const t=tsSt(s.id,d),w=dow(d),worked=cc?(t==='ok'||t==='late'):t==='';   /* trả theo ca: không chấm công, ngày làm việc thường (không nghỉ phép, không nghỉ lễ) coi là có mặt để đếm ca chưa điểm danh */
  if(!cc){if(t==='hol')continue}
  else if(worked){cong++;if(t==='late')late++;if(myGr.length&&(w<=5||(w===6&&open6)))btd++}
  else if(t==='leave'){cong++;leave++}else if(t==='hol'){cong++;hol++;continue}   /* ngày nghỉ lễ hưởng nguyên lương ngày công, không có ca dạy */
  else if(t==='abs'||t==='kl')abs++;
  /* ca 1-1 tính theo điểm danh của bé trong ca đó */
  mine.forEach(l=>{if((l.type==='11'&&l.day===w)||(l.type==='bu'&&l.date===d)){const c=DB.att[d+'|'+l.id+'|'+l.hs];
   if(c&&ss[c]!=null){ss[c]++;if(l.type==='bu'&&c==='cm')ss.bu++}else if(!c&&worked)ss.none++}})}
 const teach=ss.cm,units=ss.cm*pc.cm+ss.kp*pc.kp+ss.p*pc.p+ss.tt*pc.tt+ss.bv*pc.bv;
 const byDay=f.mode==='buoi'?0:(f.base||0)*Math.min(cong,cfg.cc)/cfg.cc,bySess=f.mode==='thang'?0:units/100*(f.rate||0),byBt=btd*(f.rateBt||0),allow=f.allow||0,bonus=DB.bon[s.id+'|'+m]||0,pen=late*(f.latePen||0),bh=(f.base||0)*(f.bh||0)/100;
 const vpen=vioSum(s.id,m);   /* trừ lương do vi phạm nội quy: chỉ tính các lần Trưởng Trung tâm đã duyệt */
 const gross=byDay+bySess+byBt+allow+bonus-pen-vpen,tax=Math.max(0,gross-bh-cfg.giamTru)*cfg.thue/100;
 return{cong,late,hol,teach,kp:ss.kp,p:ss.p,tt:ss.tt,bv:ss.bv,bu:ss.bu,none:ss.none,pc,btd,leave,abs,byDay,bySess,byBt,allow,bonus,pen,vpen,bh,gross,tax,net:gross-bh-tax}}
