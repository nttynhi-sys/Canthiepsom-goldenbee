/* ===== Nghiệp vụ: tra cứu, học phí, hoàn phí, lịch, chấm công, lương ===== */
const kidBy=id=>DB.kids.find(k=>k.id===id);
const stBy=id=>DB.staff.find(s=>s.id===id);
const grBy=id=>DB.groups.find(g=>g.id===id);
const kn=id=>{const k=kidBy(id);return k?k.n:'(đã xóa)'};
const sn=id=>{const s=stBy(id);return s?s.n:'Chưa phân công'};
const policyH=k=>`<div class="note"><b>${esc(POLICY[k].t)}</b>${POLICY[k].p.map(t=>`<p style="margin-top:6px">${esc(t)}</p>`).join('')}</div>`;

/* --- Học phí và bảng tính chấm công học sinh --- */
const fee11=k=>k.f11||DB.cfg.p11;
const btDays=m=>mDates(m).filter(d=>{const w=dow(d);return w>=1&&w<=5}).length;
function sched(k,m){const out=[],ls=DB.lich.filter(l=>l.hs===k.id);
 for(const d of mDates(m)){const w=dow(d);if(!w)continue;
  ls.forEach(l=>{if((l.type==='11'&&l.day===w)||(l.type==='bu'&&l.date===d))out.push({d,sid:l.id,kind:l.type,slot:l.slot})});
  if(k.gr&&w<=5)out.push({d,sid:k.gr,kind:'bt',slot:BT.s})}
 return out}
function invoice(k,m){if(k.st!=='dang'||k.sd.slice(0,7)>m)return 0;return sched(k,m).filter(x=>x.kind==='11').length*fee11(k)+(k.bt?DB.cfg.pbtCN+DB.cfg.pbtKhac:0)}
const makeupFor=(h,d,s)=>DB.mk.find(r=>r.hs===h&&r.from.d===d&&r.from.sid===s&&(r.s==='xn'||r.s==='xong'));
const CL={cm:'x',p:'P',kp:'K',tt:'N',bv:'V'};
function feeOf(k,kind,d,sid,code,m){
 const R=DB.cfg.rule,f=fee11(k),bd=btDays(m)||1,dCN=DB.cfg.pbtCN/bd,dAll=(DB.cfg.pbtCN+DB.cfg.pbtKhac)/bd;
 let rf=0,ls=0,note='';
 if(kind==='11'){const mk=makeupFor(k.id,d,sid);
  if(code==='p'){if(mk)note='Đã thỏa thuận học bù nên không tính phí nghỉ';else{rf=f*(100-R.pLoss)/100;ls=f*R.pLoss/100;note='Có phép: mất '+R.pLoss+'% phí buổi, hoàn '+(100-R.pLoss)+'% trừ vào học phí tháng sau'}}
  else if(code==='kp'){if(mk)note='Đã thỏa thuận học bù nên không tính phí nghỉ';else{ls=f;note='Không phép: mất 100% phí buổi'}}
  else if(code==='tt'){if(mk)note='Trung tâm hoặc giáo viên nghỉ, hai bên đã thỏa thuận học bù';else{rf=f*R.ttRefund/100;note='Trung tâm hoặc giáo viên nghỉ, không học bù: hoàn '+R.ttRefund+'% phí buổi'}}}
 else{
  if(code==='p'){rf=dCN;ls=dAll-dCN;note='Báo trước 1 ngày hoặc trước 7g sáng: hoàn phí can thiệp cá nhân, không hoàn chi phí khác'}
  else if(code==='kp'){ls=dAll;note='Báo muộn hoặc không báo: không hoàn phí'}
  else if(code==='bv'){rf=dAll*R.bvRefund/100;note='Nhập viện có giấy: hoàn '+R.bvRefund+'% phí của ngày nhập viện'}
  else if(code==='tt'){note='Trung tâm cho nghỉ (thiên tai, dịch bệnh...): xếp học bù, không tính phí nghỉ'}}
 return{rf:Math.round(rf),ls:Math.round(ls),note}}
function settle(k,m){
 const r={k:k.id,m,rows:[],cells:{},plan:0,planBt:0,cm:0,p:0,kp:0,tt:0,bv:0,bu:0,none:0,lost:0,refund:0,stop:k.st==='nghi'};
 const put=(d,c)=>{const a=r.cells[d]=r.cells[d]||[];if(!a.includes(c))a.push(c)};
 for(const x of sched(k,m)){
  const code=DB.att[x.d+'|'+x.sid+'|'+k.id]||'';
  if(x.kind==='bu'){if(code==='cm'){r.bu++;put(x.d,'B')}else if(x.d<WD)put(x.d,'?');continue}
  if(x.kind==='11')r.plan++;else r.planBt++;
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
function conflict(x){const w=x.date?dow(x.date):x.day;
 if(DB.groups.some(g=>(g.gv===x.gv||g.tg===x.gv)&&w>=1&&w<=5))return 'Giáo viên đang phụ trách lớp bán trú vào ngày này';
 const same=lichAt(w,x.slot,x.date).filter(l=>l.id!==x.id);
 if(same.some(l=>l.gv===x.gv))return 'Giáo viên đã có buổi khác ở khung giờ này';
 if(same.some(l=>l.hs===x.hs))return 'Trẻ đã có buổi khác ở khung giờ này';
 if(x.room&&same.some(l=>l.room===x.room))return 'Phòng đã được dùng ở khung giờ này';
 if(x.date&&DB.lr.some(l=>l.st===x.gv&&l.s==='duyet'&&l.f<=x.date&&x.date<=l.t))return 'Giáo viên có đơn nghỉ đã duyệt vào ngày này';
 return ''}
function freeSlots(gv,hs,from,n){const out=[];let d=from;
 for(let i=0;i<28&&out.length<n;i++,d=addD(d,1)){if(!isW(d))continue;let c=0;
  for(const s of SLOTS){if(c>=2)break;const room=ROOMS.find(r=>!conflict({date:d,slot:s,gv,hs,room:r}));if(room){out.push({date:d,slot:s,room});c++}}}
 return out}
function dayList(date){const w=dow(date),out=[];
 DB.lich.forEach(l=>{if((l.type==='11'&&l.day===w)||(l.type==='bu'&&l.date===date)){const k=kidBy(l.hs);if(k&&k.st==='dang')out.push({sid:l.id,kind:l.type,label:(l.type==='bu'?'Học bù · ':'1-1 · ')+slotLb(l.slot),gv:l.gv,slot:l.slot,room:l.room,kids:[k]})}});
 if(w>=1&&w<=5)DB.groups.forEach(g=>{const ks=DB.kids.filter(k=>k.gr===g.id&&k.st==='dang');if(ks.length)out.push({sid:g.id,kind:'bt',label:g.n+' · Bán trú',gv:g.gv,tg:g.tg,slot:BT.s,room:'',kids:ks})});
 return out.sort((a,b)=>a.slot<b.slot?-1:a.slot>b.slot?1:0)}

/* --- Chấm công nhân viên và lương --- */
function tsSt(id,d){const l=DB.lr.find(x=>x.st===id&&x.s==='duyet'&&x.f<=d&&d<=x.t);if(l)return l.type==='kl'?'kl':'leave';
 const r=DB.ts[id+'|'+d];if(r&&r.i)return r.i>DB.cfg.lateAfter?'late':'ok';
 if(d>TODAY||!isW(d))return '';return d>=WD?'chua':'abs'}
function payroll(s,m){
 const f=s.pay||{},cfg=DB.cfg,dts=mDates(m).filter(d=>isW(d)&&d<WD),mine=DB.lich.filter(l=>l.gv===s.id),isGr=DB.groups.some(g=>g.gv===s.id||g.tg===s.id);
 let cong=0,late=0,teach=0,btd=0,leave=0,abs=0;
 for(const d of dts){const t=tsSt(s.id,d);
  if(t==='ok'||t==='late'){cong++;if(t==='late')late++;mine.forEach(l=>{if((l.type==='11'&&l.day===dow(d))||(l.type==='bu'&&l.date===d))teach++});if(isGr&&dow(d)<=5)btd++}
  else if(t==='leave'){cong++;leave++}else if(t==='abs'||t==='kl')abs++}
 const byDay=f.mode==='buoi'?0:(f.base||0)*Math.min(cong,cfg.cc)/cfg.cc,bySess=f.mode==='thang'?0:teach*(f.rate||0),byBt=btd*(f.rateBt||0),allow=f.allow||0,bonus=DB.bon[s.id+'|'+m]||0,pen=late*(f.latePen||0),bh=(f.base||0)*(f.bh||0)/100;
 const gross=byDay+bySess+byBt+allow+bonus-pen,tax=Math.max(0,gross-bh-cfg.giamTru)*cfg.thue/100;
 return{cong,late,teach,btd,leave,abs,byDay,bySess,byBt,allow,bonus,pen,bh,gross,tax,net:gross-bh-tax}}
