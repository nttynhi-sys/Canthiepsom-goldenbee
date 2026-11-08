/* ===== Phân quyền, tài khoản, khung giao diện ===== */
const PW='123456';
/* Phần tiền (học phí, thu chi, công nợ, lương) chỉ Trưởng Trung tâm và Văn phòng xem và thao tác: Quản lý không có mục 'hp' và 'tl'. */
const ACCESS={
 ql:['dash','ns','hs','pc','lh','tn','cc','dd','hb','mt','bc','td','cp','tb','tk'],
 tt:['dash','ns','hs','pc','lh','tn','cc','dd','hb','hp','tl','mt','bc','td','cp','tb','tk'],
 vp:['dash','tn','cc','dd','hp','tl','tb','tk'],
 gv:['dash','hs','lh','tn','cc','dd','hb','tl','mt','bc','td','tb'],
 ph:['cp','lh','tn','hb','hp','tb']};
const NAV=[['dash','Dashboard','Tổng quan'],['ns','Nhân sự','Con người'],['hs','Học sinh'],['pc','Phân công'],['lh','Lịch học','Vận hành'],['tn','Thực đơn bán trú'],['cc','Chấm công'],['dd','Điểm danh'],['hb','Học bù'],['hp','Học phí','Tài chính'],['tl','Tiền lương'],['mt','Ngân hàng mục tiêu','Chuyên môn'],['bc','Báo cáo chuyên môn'],['td','Quản lý tài liệu'],['cp','Cổng phụ huynh','Phụ huynh'],['tb','Thông báo'],['tk','Thống kê','Báo cáo']];
const VLAB={gv:{hs:'Học sinh của tôi',lh:'Lịch dạy của tôi',cc:'Chấm công của tôi',dd:'Điểm danh',tl:'Phiếu lương của tôi',bc:'Báo cáo của tôi',td:'Tài liệu và video'},ph:{cp:'Cổng phụ huynh',hp:'Học phí',lh:'Lịch học của bé',tn:'Thực đơn bán trú'},vp:{cc:'Chấm công nhân sự',dd:'Ngày học và phép'}};
/* tiêu đề nhóm riêng cho từng vai trò (khi nhóm gốc không hiện ra với vai trò đó) */
const NAVG={vp:{tn:'Vận hành',tb:'Liên lạc'},ph:{cp:'Tổng quan',lh:'Lịch học',tb:'Liên lạc'}};
const vlab=v=>((VLAB[U&&U.role]||{})[v])||NAV.find(n=>n[0]===v)[1];
const isQL=()=>!!U&&U.role==='ql',isTT=()=>!!U&&U.role==='tt',isVP=()=>!!U&&U.role==='vp',isLead=()=>!!U&&(U.role==='ql'||U.role==='tt'),isGV=()=>!!U&&U.role==='gv',isPH=()=>!!U&&U.role==='ph';
/* canMoney: Trưởng Trung tâm và Văn phòng được xem và thao tác học phí, thu chi, công nợ, lương.
   canCfg: chỉ Trưởng Trung tâm đổi thông số tiền, mức lương và vai trò nhân sự.
   seesAll: thấy mọi học sinh và mọi nhân sự (Quản lý, Trưởng Trung tâm, Văn phòng).
   noFee/feeTx: Quản lý và Giáo viên không thấy chữ nào về phí; feeTx ẩn câu nhắc đến phí với hai vai trò này. */
const canMoney=()=>isTT()||isVP(),canCfg=()=>isTT(),seesAll=()=>isLead()||isVP(),noFee=()=>isQL()||isGV(),feeTx=t=>noFee()?'':t;
/* hồ sơ nhân sự Quản lý, Trưởng Trung tâm và Văn phòng chỉ Trưởng Trung tâm sửa (Quản lý chỉ sửa được hồ sơ của chính mình) */
const lockAcc=s=>!isTT()&&!!s&&(s.role==='tt'||s.role==='vp'||(s.role==='ql'&&(!U||s.id!==U.id)));
const myGroups=()=>isGV()?DB.groups.filter(g=>g.gv===U.id||g.tg===U.id):[];
function myKids(){if(!U)return[];if(seesAll())return DB.kids;
 if(isGV()){const gs=myGroups().map(g=>g.id);return DB.kids.filter(k=>k.gv===U.id||(k.gr&&gs.includes(k.gr))||DB.lich.some(l=>l.type==='bu'&&l.gv===U.id&&l.hs===k.id))}
 return DB.kids.filter(k=>k.pe===U.pe)}
const canKid=id=>myKids().some(k=>k.id===id);
const rdKey=n=>n.id+'|'+(U?U.id:'');
function noticesFor(){if(!U)return[];
 return DB.nt.filter(n=>{if(n.fin&&noFee())return false;
  if(seesAll())return true;
  if(n.aud==='nb')return isGV();
  if(isGV())return n.by===U.id;
  if(n.tg==='all')return true;
  const ks=myKids();return ks.some(k=>k.id===n.tg||k.gr===n.tg)}).sort((a,b)=>(b.pin-a.pin)||(a.at<b.at?1:-1))}
const unread=()=>noticesFor().filter(n=>!DB.rd[rdKey(n)]&&n.by!==(U&&U.id)).length;
function badge(v){if(!U)return 0;const ks=myKids().map(k=>k.id);
 if(v==='cc'&&isLead())return DB.lr.filter(l=>l.s==='cho').length;
 if(v==='hb')return DB.mk.filter(r=>ks.includes(r.hs)&&(isPH()?r.s==='tt':r.s==='dk')).length;
 if(v==='bc'&&isLead())return DB.rp.filter(r=>r.s==='cho').length;
 if(v==='bc'&&isGV())return DB.rp.filter(r=>r.au===U.id&&(r.s==='nhap')).length;
 if(v==='tb')return unread();
 if(v==='hp'&&isPH())return ks.some(h=>balance(h)>0)?1:0;
 return 0}

/* --- tài khoản --- */
function findAccount(em){em=(em||'').trim().toLowerCase();if(!em)return null;
 const s=DB.staff.find(x=>x.em.toLowerCase()===em&&x.st==='dang'&&x.role!=='hc');
 if(s)return{role:s.role,id:s.id,name:s.n,em:s.em};
 const ks=DB.kids.filter(k=>k.pe.toLowerCase()===em);
 return ks.length?{role:'ph',id:'ph|'+em,name:ks[0].pn,pe:ks[0].pe,em:ks[0].pe}:null}
function demoAcc(r){
 const pick={ql:'nv01',tt:'nv02',vp:'nv26',gv:'nv04'}[r];
 if(pick){let s=stBy(pick);if(!s||s.role!==r||s.st!=='dang')s=DB.staff.find(x=>x.role===r&&x.st==='dang');return s?findAccount(s.em):null}
 const k=DB.kids.find(x=>x.st==='dang'&&x.m11>0&&x.bt)||DB.kids[0];return findAccount(k.pe)}
function setUser(u){if(CLOUDMODE&&u&&(!CLD.ss||u.em!==CLD.ss.email))return;U=u;S.modal=null;S.menu=false;S.top=1;
 if(u){S.v=ACCESS[u.role][0];try{localStorage.setItem('gb_u',u.em)}catch(e){}}else{try{localStorage.removeItem('gb_u')}catch(e){}}}
ACT.demo=r=>{setUser(demoAcc(r))};
ACT.logout=()=>{if(CLOUDMODE){cloudLogout();return false}setUser(null)};
CHG.role=r=>{setUser(demoAcc(r))};
FORM.login=f=>{if(CLOUDMODE){cloudLogin(f.elements.e.value.trim().toLowerCase(),f.elements.p.value);return false}const a=findAccount(f.elements.e.value);
 if(!a||f.elements.p.value!==PW){S.err='Email hoặc mật khẩu chưa đúng. Bản trình diễn dùng mật khẩu chung 123456.';return}
 S.err='';setUser(a)};
ACT.theme=()=>{const h=document.documentElement,dark=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches,cur=h.dataset.theme||(dark?'dark':'light'),nx=cur==='dark'?'light':'dark';h.dataset.theme=nx;try{localStorage.setItem('gb_th',nx)}catch(e){}};

function vLogin(){
 return`<div class="lg"><div class="lgl"><img src="${LOGO}" alt="Logo Trung tâm Can thiệp sớm Golden Bee"><h1>${esc(DB.cfg.name)}</h1><p style="max-width:34ch;color:var(--sidemu)">Hệ thống quản lý can thiệp sớm: hồ sơ trẻ, lịch học 1-1 và bán trú, điểm danh, học phí, báo cáo chuyên môn và cổng phụ huynh.</p></div>
 <div class="lgr"><div class="lgc"><h2>Đăng nhập</h2>
 <form id="login" class="f" autocomplete="off"><div><label for="lg-e">Email</label><input id="lg-e" name="e" type="email" required placeholder="ten@goldenbee.vn"></div><div><label for="lg-p">Mật khẩu</label><input id="lg-p" name="p" type="password" required placeholder="123456"></div><div class="err" role="alert">${esc(S.err||'')}</div><button class="btn p" type="submit">Đăng nhập</button></form>
 <p class="sm mu" style="margin:16px 0 8px">Hoặc vào nhanh để xem thử theo từng vai trò:</p>
 <div class="roles">
 <button class="btn" data-a="demo" data-v="ql"><b>Quản lý</b><span>Mọi học sinh, không xem tiền và lương</span></button>
 <button class="btn" data-a="demo" data-v="tt"><b>Trưởng Trung tâm</b><span>Toàn quyền, kể cả học phí, thu chi, lương</span></button>
 <button class="btn" data-a="demo" data-v="vp"><b>Văn phòng</b><span>Tính học phí, lương, chấm công, ngày học</span></button>
 <button class="btn" data-a="demo" data-v="gv"><b>Giáo viên</b><span>Lớp, lịch dạy, điểm danh</span></button>
 <button class="btn" data-a="demo" data-v="ph"><b>Phụ huynh</b><span>Lịch học, thực đơn, học phí, báo cáo của bé</span></button></div>
 <p class="note sm" style="margin-top:16px">Đây là bản trình diễn chạy ngay trong trình duyệt: dữ liệu học sinh và nhân viên là mẫu giả lập, phân quyền chỉ ẩn hiện giao diện. Khi dùng thật cần có máy chủ để xác thực và lưu hồ sơ an toàn.</p></div></div></div>`}

function vTop(){
 const rn=ROLE[U.role],ini=given(U.name).split(' ').pop().charAt(0).toUpperCase();
 return`<div class="bar0"><div class="who"><button class="btn hamb" data-a="menu" aria-label="Mở menu">Menu</button><span class="av" aria-hidden="true">${esc(ini)}</span><div style="min-width:0"><b>${esc(U.name)}</b><div class="sm mu">${rn} · ${DAYN[dow(TODAY)]}, ${vd(TODAY)}</div></div></div>
 <div class="acts">${CLOUDMODE?`<span id="cl-st" class="sm ${CLD.st==='err'?'er':'mu'}" role="status">${stText()}</span>`:`<label class="sm mu" style="margin:0" for="demo-role">Xem thử vai trò</label><select id="demo-role" data-c="role" style="width:auto" aria-label="Chuyển vai trò xem thử">${opts([['ql','Quản lý'],['tt','Trưởng Trung tâm'],['vp','Văn phòng'],['gv','Giáo viên'],['ph','Phụ huynh']],U.role)}</select>`}<button class="btn s" data-a="theme">Sáng/Tối</button><button class="btn s" data-a="logout">Đăng xuất</button></div></div>`}
function vSide(){
 let h=`<aside class="side ${S.menu?'open':''}" aria-label="Menu chính"><div class="brand"><img src="${LOGO}" alt="Logo Golden Bee"><b>${esc(DB.cfg.name)}</b></div><nav class="nav">`;
 ACCESS[U.role].forEach(v=>{const[,l,g]=NAV.find(x=>x[0]===v),gl=(NAVG[U.role]||{})[v]||g;if(gl)h+=`<div class="ng">${gl}</div>`;const b=badge(v);
  h+=`<button data-a="nav" data-v="${v}" class="${S.v===v?'on':''}" ${S.v===v?'aria-current="page"':''}><span>${esc(vlab(v))}</span>${b?`<span class="bdg">${b}</span>`:''}</button>`});
 return h+`</nav><p class="sm" style="color:var(--sidemu);padding:18px 10px 0">${CLOUDMODE?'Dữ liệu dùng chung trên máy chủ':'Bản trình diễn · dữ liệu mẫu'}</p></aside>${S.menu?'<div class="scrim" data-a="menu"></div>':''}`}

let SVT=0;
function render(){
 const app=$q('#app');if(!app)return;
 if(CLOUDMODE&&(CLD.stage!=='app'||!DB||!U)){app.innerHTML=cloudScreen();return}
 if(!DB)return;
 const y=S.top?0:window.scrollY,sd0=$q('.side'),sy=sd0?sd0.scrollTop:0,md0=$q('.mdl'),my=md0?md0.scrollTop:0;S.top=0;
 if(!U){app.innerHTML=vLogin();window.scrollTo(0,y);return}
 if(!ACCESS[U.role].includes(S.v))S.v=ACCESS[U.role][0];
 let body;try{body=VIEWS[S.v]()}catch(e){console.error(e);body=`<div class="card"><h2>Chưa hiển thị được trang này</h2><p class="mu">${esc(e.message)}</p></div>`}
 let mh='';if(S.modal&&MODALS[S.modal.t]){try{mh=MODALS[S.modal.t]()}catch(e){console.error(e);S.modal=null}}
 app.innerHTML=`<div class="shell">${vSide()}<main id="main">${vTop()}${body}</main></div>${mh}`;
 const sd=$q('.side');if(sd)sd.scrollTop=sy;const md=$q('.mdl');if(md)md.scrollTop=my;window.scrollTo(0,y);
 clearTimeout(SVT);SVT=setTimeout(save,300)}
