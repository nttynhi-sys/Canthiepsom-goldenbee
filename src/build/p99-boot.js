/* ===== Khởi động ===== */
/* Nâng cấp dữ liệu đã lưu từ bản 2 (chưa có thư viện mục tiêu) lên bản 3, giữ nguyên nhân sự, học sinh, lịch, điểm danh, học phí */
function migrate(d){
 DB=d;
 d.cfg.addr=d.cfg.addr||'28 Trường Thi 1, Quận Hải Châu, TP. Đà Nẵng';d.cfg.tel=d.cfg.tel||'0793502567';
 delete d.goals;
 seedProg(d);
 d.rp.forEach(r=>{if(/^r\d{1,3}$/.test(r.id)){const k=d.kids.find(x=>x.id===r.hs);if(k)r.sec=autoSec(k,r.per)}});
 d.v=3}
/* Bản 4: thêm vai trò Văn phòng, khung giờ 07:15–20:00 (ca 50 phút), hai lớp bán trú Ong non và Ong mật, thực đơn bán trú.
   Giữ nguyên học sinh, lịch, điểm danh, học phí, kế hoạch mục tiêu, báo cáo; chỉ đổi giờ ca, gộp 4 nhóm bán trú cũ thành 2 lớp. */
function migrate4(d){
 DB=d;
 const near=s=>{if(SLOTS.includes(s))return s;const m=x=>{const [h,n]=String(x).split(':').map(Number);return h*60+n},t=m(s);let b=SLOTS[0];SLOTS.forEach(x=>{const a=Math.abs(m(x)-t),c=Math.abs(m(b)-t);if(a<c||(a===c&&m(x)>m(b)))b=x});return b};
 d.lich.forEach(l=>{if(l.slot)l.slot=near(l.slot)});
 d.mk.forEach(r=>{if(r.from&&r.from.slot)r.from.slot=near(r.from.slot);(r.props||[]).forEach(p=>{if(p.slot)p.slot=near(p.slot)})});
 /* 4 nhóm bán trú cũ: Mầm, Chồi (dưới 6 tuổi) thành Ong non; Lá, Nắng thành Ong mật */
 const old=d.groups.slice(),map={G1:'G1',G2:'G1',G3:'G2',G4:'G2'};
 if(old.length!==2||old[0].n!==BTN[0]||old[1].n!==BTN[1]){
  const o1=old.find(g=>g.id==='G1'),o2=old.find(g=>g.id==='G2')||old[1]||old[0];
  d.groups=[{id:'G1',n:BTN[0],gv:o1?o1.gv:'nv18',tg:o1?o1.tg:'nv20'},{id:'G2',n:BTN[1],gv:o2?o2.gv:'nv19',tg:o2?o2.tg:'nv21'}];
  const keep=new Set([d.groups[0].gv,d.groups[0].tg,d.groups[1].gv,d.groups[1].tg]);
  /* giáo viên của các nhóm cũ không còn phụ trách lớp bán trú: chuyển sang dạy 1-1 nếu hồ sơ còn nguyên mặc định */
  old.forEach(g=>[g.gv,g.tg].forEach(id=>{const s=d.staff.find(x=>x.id===id);
   if(s&&!keep.has(id)&&s.role==='gv'&&/bán trú/i.test(s.pos)&&s.pay&&(s.pay.rateBt===30e3||s.pay.rateBt===20e3)&&(s.pay.base===9e6||s.pay.base===7e6)){
    s.pos=['Giáo viên ngôn ngữ trị liệu','Giáo viên giáo dục đặc biệt','Chuyên viên hoạt động trị liệu'][(+id.slice(2)||0)%3];s.pay={mode:'buoi',base:0,rate:220e3,rateBt:0,allow:5e5,bh:0,latePen:s.pay.latePen||0}}}));
  d.kids.forEach(k=>{if(k.gr)k.gr=map[k.gr]||(k.gr==='G1'?'G1':'G2')});
  const att={};Object.keys(d.att).forEach(key=>{const p=key.split('|');if(/^G\d+$/.test(p[1]))p[1]=map[p[1]]||'G2';const nk=p.join('|');if(!(nk in att))att[nk]=d.att[key]});d.att=att;
  d.nt.forEach(n=>{if(map[n.tg])n.tg=map[n.tg]});
  d.nt.forEach(n=>{if(n.t==='Hoạt động ngoại khóa Nhóm Chồi'){n.t='Hoạt động ngoại khóa lớp Ong non';n.b='Lớp Ong non có hoạt động vận động ngoài trời vào thứ Sáu tuần này. Bé mặc quần áo thoải mái, mang theo nước uống.';n.tg='G1';if(n.by==='nv19')n.by='nv18'}})}
 /* Văn phòng: nhân viên kế toán cũ (nv26) giữ chức vụ văn phòng nếu chưa có ai giữ vai trò này */
 if(!d.staff.some(s=>s.role==='vp')){const s=d.staff.find(x=>x.id==='nv26'&&x.role==='hc')||d.staff.find(x=>x.role==='hc'&&/kế toán/i.test(x.pos));
  if(s){s.role='vp';if(/kế toán/i.test(s.pos))s.pos='Nhân viên văn phòng';s.sup=s.sup||'nv02'}}
 /* thông báo về học phí hoặc lương chỉ Trưởng Trung tâm và Văn phòng thấy */
 d.nt.forEach(n=>{if(n.fin===undefined)n.fin=/học phí|lương|thu chi|công nợ|đóng tiền/i.test(n.t+' '+n.b);
  if(n.t==='Nhắc đóng học phí đầu tháng'&&n.by==='nv01'&&d.staff.some(s=>s.id==='nv26'&&s.role==='vp'))n.by='nv26'});
 if(!d.nt.some(n=>n.t==='Giờ học 1-1 và bán trú'))d.nt.push({id:'n'+uid(),aud:'ph',tg:'all',t:'Giờ học 1-1 và bán trú',b:'Can thiệp 1-1 nhận bé từ '+DAY_OPEN+' đến '+DAY_CLOSE+', mỗi ca '+SLOT_MIN+' phút. Bán trú hai lớp Ong non và Ong mật học từ '+BT.s+' đến '+BT.e+' (thứ Hai đến thứ Sáu). Phụ huynh xem lịch học và giờ 1-1 của bé ở mục Lịch học của bé, thực đơn bán trú ở mục Thực đơn bán trú.',by:'nv02',at:TODAY,pin:false,fin:false});
 if(!d.menu||typeof d.menu!=='object')seedMenu(d);
 d.v=4}
/* Bản 5: bán trú tính theo ngày (380.000 ₫/ngày gồm 180.000 ₫ ca 1-1), ngày bán trú theo từng bé, chẩn đoán, thời khóa biểu bán trú, lương giáo viên 1-1 theo ca.
   Giữ nguyên học sinh, lịch, điểm danh, công nợ. Phí bán trú theo tháng cũ được bỏ; hóa đơn đã ghi vào công nợ không đổi. */
function migrate5(d){
 DB=d;const c=d.cfg;
 if(c.pbtDay==null)c.pbtDay=380000;if(c.pbtDay11==null)c.pbtDay11=180000;
 delete c.pbtCN;delete c.pbtKhac;
 c.rule=Object.assign({gvKp:50,gvP:0},c.rule);
 if(!Array.isArray(d.tkb)||!d.tkb.length)d.tkb=tkbDefault(d.groups);
 d.kids.forEach(k=>{if(!Array.isArray(k.dx))k.dx=[]});
 d.v=5}
/* Bản 6: danh sách ngày nghỉ lễ / Trung tâm cho nghỉ (hol). Học phí trả trước tính theo lịch đã trừ các ngày này. Giữ nguyên mọi dữ liệu cũ. */
function migrate6(d){
 DB=d;
 if(!Array.isArray(d.hol))d.hol=[];
 if(!d.pul||typeof d.pul!=='object'||Array.isArray(d.pul))d.pul={};
 d.v=6}
/* Bản 7: chấm công do Quản lý thực hiện (cờ s.cc: nhân sự chỉ trả theo ca 1-1 không chấm công), vi phạm nội quy và trừ lương (vio, vam), giờ chấm công mặc định và mức trừ lương trong cấu hình. Giữ nguyên mọi dữ liệu cũ. */
function migrate7(d){
 DB=d;
 d.staff.forEach(s=>{if(s.cc==null)s.cc=ccOf(s.pay)});
 if(!Array.isArray(d.vio))d.vio=[];
 if(!d.vam||typeof d.vam!=='object'||Array.isArray(d.vam))d.vam={};
 const c=d.cfg;if(!c.ccIn)c.ccIn='07:15';if(!c.ccOut)c.ccOut='18:00';if(c.v1==null)c.v1=20000;if(c.v2==null)c.v2=30000;
 d.v=7}
const okDB=d=>d&&Array.isArray(d.staff)&&Array.isArray(d.kids)&&d.cfg&&d.cfg.rule&&d.set&&d.rd&&d.att&&Array.isArray(d.rp)&&Array.isArray(d.tpl);
(function boot(){
 if(CLOUDMODE){try{const th=localStorage.getItem('gb_th');if(th)document.documentElement.dataset.theme=th}catch(e){}cloudBoot();initCaps();return}
 let d=null;try{d=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
 if(okDB(d)&&d.v===7&&Array.isArray(d.vio)&&d.vam&&Array.isArray(d.hol)&&Array.isArray(d.plans)&&Array.isArray(d.sess)&&Array.isArray(d.cg)&&d.menu&&Array.isArray(d.groups)&&Array.isArray(d.tkb))DB=d;
 else if(okDB(d)&&d.v>=2&&d.v<=6){try{if(d.v===2)migrate(d);if(d.v<=3)migrate4(d);if(d.v<=4)migrate5(d);if(d.v<=5)migrate6(d);migrate7(d);save()}catch(e){DB=null;seed();save()}}
 else{seed();save()}
 try{const th=localStorage.getItem('gb_th');if(th)document.documentElement.dataset.theme=th}catch(e){}
 try{const em=localStorage.getItem('gb_u');if(em){const a=findAccount(em);if(a){U=a;S.v=ACCESS[a.role][0]}}}catch(e){}
 render();initCaps();
})();
