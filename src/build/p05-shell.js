/* ===== Phân quyền, tài khoản, khung giao diện ===== */
const PW='123456';
/* Phần tiền (học phí, thu chi, công nợ, lương) chỉ Trưởng Trung tâm và Văn phòng xem và thao tác: Quản lý không có mục 'hp' và 'tl'. */
const ACCESS={
 ql:['dash','ns','hs','pc','lh','tn','cc','vi','dd','hb','mt','bc','td','cp','tb','tk'],
 tt:['dash','ns','hs','pc','lh','tn','cc','vi','dd','hb','hp','tl','mt','bc','td','cp','tb','tk'],
 vp:['dash','tn','cc','vi','dd','hp','tl','td','tb','tk'],
 gv:['dash','hs','lh','tn','cc','vi','dd','hb','tl','mt','bc','td','tb'],
 ph:['cp','lh','tn','hb','hp','tb']};
const NAV=[['dash','Dashboard','Tổng quan'],['ns','Nhân sự','Con người'],['hs','Học sinh'],['pc','Phân công'],['lh','Lịch học','Vận hành'],['tn','Thực đơn bán trú'],['cc','Chấm công'],['vi','Vi phạm nội quy'],['dd','Điểm danh'],['hb','Học bù'],['hp','Học phí','Tài chính'],['tl','Tiền lương'],['mt','Ngân hàng mục tiêu','Chuyên môn'],['bc','Báo cáo chuyên môn'],['td','Ảnh, video và tài liệu'],['cp','Cổng phụ huynh','Phụ huynh'],['tb','Thông báo'],['tk','Thống kê','Báo cáo']];
const VLAB={gv:{hs:'Học sinh của tôi',lh:'Lịch dạy của tôi',cc:'Chấm công của tôi',vi:'Vi phạm của tôi',dd:'Điểm danh',tl:'Phiếu lương của tôi',bc:'Báo cáo của tôi',td:'Ảnh, video và tài liệu'},ph:{cp:'Cổng phụ huynh',hp:'Học phí',lh:'Lịch học của bé',tn:'Thực đơn bán trú'},vp:{cc:'Chấm công nhân sự',dd:'Ngày học và phép'}};
/* tiêu đề nhóm riêng cho từng vai trò (khi nhóm gốc không hiện ra với vai trò đó) */
const NAVG={vp:{tn:'Vận hành',tb:'Liên lạc'},ph:{cp:'Tổng quan',lh:'Lịch học',tb:'Liên lạc'}};
const vlab=v=>((VLAB[U&&U.role]||{})[v])||NAV.find(n=>n[0]===v)[1];
const isQL=()=>!!U&&U.role==='ql',isTT=()=>!!U&&U.role==='tt',isVP=()=>!!U&&U.role==='vp',isLead=()=>!!U&&(U.role==='ql'||U.role==='tt'),isGV=()=>!!U&&U.role==='gv',isPH=()=>!!U&&U.role==='ph';
/* Người được phân giao dạy trẻ (1-1, bán trú, học bù): Giáo viên (gv) và Quản lý (ql). Trưởng Trung tâm, Văn phòng và hành chính không nằm trong danh sách phân giao. Quản lý vẫn giữ quyền Quản lý của mình, chỉ thêm việc được chọn làm người dạy. */
const TEACH_ROLES=['gv','ql'],isTeacher=s=>!!s&&TEACH_ROLES.includes(s.role);
/* Quản lý đang thực sự dạy: có bé 1-1 đang học, có ca 1-1 cố định hoặc phụ trách nhóm bán trú. Dùng để đếm số giáo viên mà không tính quản lý chưa dạy. */
const teachesNow=id=>DB.kids.some(k=>k.gv===id&&k.st==='dang')||DB.lich.some(l=>l.gv===id)||DB.groups.some(g=>grHas(g,id));
/* Tên hiển thị trong danh sách chọn người dạy: quản lý có ghi chú để phân biệt với giáo viên. */
const tName=s=>s.n+(s.role==='ql'?' (Quản lý)':'');
const activeTeachers=()=>DB.staff.filter(s=>s.st==='dang'&&(s.role==='gv'||(s.role==='ql'&&teachesNow(s.id))));
/* canMoney: Trưởng Trung tâm và Văn phòng được xem và thao tác học phí, thu chi, công nợ, lương.
   canCfg: chỉ Trưởng Trung tâm đổi thông số tiền, mức lương và vai trò nhân sự.
   seesAll: thấy mọi học sinh và mọi nhân sự (Quản lý, Trưởng Trung tâm, Văn phòng).
   noFee/feeTx: Quản lý và Giáo viên không thấy chữ nào về phí; feeTx ẩn câu nhắc đến phí với hai vai trò này. */
const canMoney=()=>isTT()||isVP(),canCfg=()=>isTT(),seesAll=()=>isLead()||isVP(),noFee=()=>isQL()||isGV(),feeTx=t=>noFee()?'':t;
/* hồ sơ nhân sự Quản lý, Trưởng Trung tâm và Văn phòng chỉ Trưởng Trung tâm sửa (Quản lý chỉ sửa được hồ sơ của chính mình) */
const lockAcc=s=>!isTT()&&!!s&&(s.role==='tt'||s.role==='vp'||(s.role==='ql'&&(!U||s.id!==U.id)));
const myGroups=()=>isGV()?DB.groups.filter(g=>grHas(g,U.id)):[];
/* Thực đơn và thời khóa biểu bán trú: Trưởng Trung tâm, Quản lý, Văn phòng, phụ huynh và giáo viên đứng lớp bán trú (mọi giáo viên được phân vào lớp, ngang nhau). Giáo viên chỉ dạy 1-1 không thấy. */
const btView=()=>!isGV()||myGroups().length>0;
const navList=()=>ACCESS[U.role].filter(v=>v!=='tn'||btView());
function myKids(){if(!U)return[];if(seesAll())return DB.kids;
 if(isGV()){const gs=myGroups().map(g=>g.id);return DB.kids.filter(k=>k.gv===U.id||(k.gr&&gs.includes(k.gr))||DB.lich.some(l=>l.gv===U.id&&l.hs===k.id))}
 return DB.kids.filter(k=>pkeyOf(k)===U.pkey)}
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
 if(v==='vi'&&isTT())return DB.vio.filter(x=>x.s==='cho').length;
 if(v==='hb')return DB.mk.filter(r=>ks.includes(r.hs)&&(isPH()?r.s==='tt':r.s==='dk')).length;
 if(v==='bc'&&isLead())return DB.rp.filter(r=>r.s==='cho').length;
 if(v==='bc'&&isGV())return DB.rp.filter(r=>r.au===U.id&&(r.s==='nhap')).length;
 if(v==='td'&&canUpload())return medWait().filter(medEdit).length;
 if(v==='tb')return unread();
 if(v==='hp'&&isPH())return ks.some(h=>balance(h)>0)?1:0;
 return 0}

/* --- tài khoản --- */
/* em: email, hoặc 'tel:số' (số điện thoại đã chuẩn hóa) cho tài khoản chỉ có số điện thoại */
function findAccount(em){em=(em||'').trim().toLowerCase();if(!em)return null;
 const tel=em.startsWith('tel:')?em.slice(4):'';
 const s=DB.staff.find(x=>x.st==='dang'&&x.role!=='hc'&&(tel?telNorm(x.ph)===tel:x.em&&x.em.toLowerCase()===em));
 if(s)return{role:s.role,id:s.id,name:s.n,em:s.em||em};
 const ks=DB.kids.filter(k=>pkeyOf(k)===em);
 return ks.length?{role:'ph',id:'ph|'+em,name:ks[0].pn,pe:ks[0].pe,em:ks[0].pe||em,pkey:em}:null}
function demoAcc(r){
 const pick={ql:'nv01',tt:'nv02',vp:'nv26',gv:'nv04'}[r];
 if(pick){let s=stBy(pick);if(!s||s.role!==r||s.st!=='dang')s=DB.staff.find(x=>x.role===r&&x.st==='dang');return s?findAccount(s.em):null}
 const ok=x=>x.st==='dang'&&x.m11>0&&x.bt,k=DB.kids.find(x=>ok(x)&&!phLockOf(pkeyOf(x)).locked)||DB.kids.find(ok)||DB.kids[0];return findAccount(pkeyOf(k))}
function setUser(u){if(CLOUDMODE&&u&&(!CLD.ss||u.em!==CLD.ss.email))return;U=u;S.modal=null;S.menu=false;S.top=1;
 if(u){S.v=ACCESS[u.role][0];try{localStorage.setItem('gb_u',u.em)}catch(e){}}else{try{localStorage.removeItem('gb_u')}catch(e){}}}
ACT.demo=r=>{setUser(demoAcc(r))};
ACT.logout=()=>{if(CLOUDMODE){cloudLogout();return false}setUser(null)};
CHG.role=r=>{setUser(demoAcc(r))};
FORM.login=f=>{if(CLOUDMODE){cloudLogin(f.elements.e.value.trim(),f.elements.p.value);return false}
 const v=f.elements.e.value.trim(),a=findAccount(v.includes('@')||!telNorm(v)?v:'tel:'+telNorm(v));
 if(!a||f.elements.p.value!==PW){S.err='Email, số điện thoại hoặc mật khẩu chưa đúng. Bản trình diễn dùng mật khẩu chung 123456.';return}
 S.err='';setUser(a)};
ACT.theme=()=>{const h=document.documentElement,dark=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches,cur=h.dataset.theme||(dark?'dark':'light'),nx=cur==='dark'?'light':'dark';h.dataset.theme=nx;try{localStorage.setItem('gb_th',nx)}catch(e){}};

function vLogin(){
 return`<div class="lg"><div class="lgl"><img src="${LOGO}" alt="Logo Trung tâm Can thiệp sớm Golden Bee"><h1>${esc(DB.cfg.name)}</h1>${lgInfo()}</div>
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
 <div class="acts">${CLOUDMODE?`<span id="cl-st" class="sm ${CLD.st==='err'?'er':'mu'}" role="status">${stText()}</span>`:`<label class="sm mu" style="margin:0" for="demo-role">Xem thử vai trò</label><select id="demo-role" data-c="role" style="width:auto" aria-label="Chuyển vai trò xem thử">${opts([['ql','Quản lý'],['tt','Trưởng Trung tâm'],['vp','Văn phòng'],['gv','Giáo viên'],['ph','Phụ huynh']],U.role)}</select>`}<button class="btn s" data-a="theme">Sáng/Tối</button>${CLOUDMODE?'<button class="btn s" data-a="pwopen">Đổi mật khẩu</button>':''}<button class="btn s" data-a="logout">Đăng xuất</button></div></div>`}
function vSide(){
 let h=`<aside class="side ${S.menu?'open':''}" aria-label="Menu chính"><div class="brand"><img src="${LOGO}" alt="Logo Golden Bee"><b>${esc(DB.cfg.name)}</b></div><nav class="nav">`;
 navList().forEach(v=>{const[,l,g]=NAV.find(x=>x[0]===v),gl=(NAVG[U.role]||{})[v]||g;if(gl)h+=`<div class="ng">${gl}</div>`;const b=badge(v);
  h+=`<button data-a="nav" data-v="${v}" class="${S.v===v?'on':''}" ${S.v===v?'aria-current="page"':''}><span>${esc(vlab(v))}</span>${b?`<span class="bdg">${b}</span>`:''}</button>`});
 return h+`</nav><p class="sm" style="color:var(--sidemu);padding:18px 10px 0">${isPH()?'Thông tin chỉ dành cho gia đình bé. Vui lòng không chụp màn hình hoặc chia sẻ ra bên ngoài.':CLOUDMODE?'Dữ liệu dùng chung trên máy chủ':'Bản trình diễn · dữ liệu mẫu'}</p></aside>${S.menu?'<div class="scrim" data-a="menu"></div>':''}`}

let SVT=0;
function render(){
 const app=$q('#app');if(!app)return;
 if(CLOUDMODE&&(CLD.stage!=='app'||!DB||!U)){app.innerHTML=cloudScreen();return}
 if(!DB)return;
 const y=S.top?0:window.scrollY,sd0=$q('.side'),sy=sd0?sd0.scrollTop:0,md0=$q('.mdl'),my=md0?md0.scrollTop:0;S.top=0;
 if(!U){app.innerHTML=vLogin();window.scrollTo(0,y);return}
 if(U.role==='ph'&&!CLOUDMODE){const lk=phLockOf(U.pkey);if(lk.locked){app.innerHTML=lockHtml(lk);window.scrollTo(0,0);return}}
 if(!navList().includes(S.v))S.v=navList()[0];
 let body;try{body=VIEWS[S.v]()}catch(e){console.error(e);body=`<div class="card"><h2>Chưa hiển thị được trang này</h2><p class="mu">${esc(e.message)}</p></div>`}
 let mh='';if(S.modal&&MODALS[S.modal.t]){try{mh=MODALS[S.modal.t]()}catch(e){console.error(e);S.modal=null}}
 app.innerHTML=`<div class="shell">${vSide()}<main id="main">${vTop()}${body}</main></div>${mh}`;
 const sd=$q('.side');if(sd)sd.scrollTop=sy;const md=$q('.mdl');if(md)md.scrollTop=my;window.scrollTo(0,y);
 clearTimeout(SVT);SVT=setTimeout(save,300)}
