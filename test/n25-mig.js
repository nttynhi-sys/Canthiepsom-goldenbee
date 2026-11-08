/* Nâng cấp dữ liệu đã lưu của bản 7 (v3) lên bản 8 (v4) */
const {open}=require('./h.js');const fs=require('fs');
const SNAP=__dirname+'/mig/snap-v3.json',MARK=JSON.parse(fs.readFileSync(__dirname+'/mig/snap-mark.json','utf8'));
let fails=0;const ok=(n,c,x)=>{if(c)console.log('PASS',n);else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,300))}};
(async()=>{
 {
  const {b,page,errs}=await open({ls:SNAP});
  const r=await page.evaluate(()=>{
   const o={v:DB.v,SLOTS:SLOTS.slice()};
   o.lich=DB.lich.map(x=>x.id+'|'+x.slot);o.slotsIn=DB.lich.every(x=>SLOTS.includes(x.slot));
   o.groups=DB.groups.map(g=>g.id+':'+g.n+':'+g.gv+':'+g.tg);
   o.grOf=id=>0;
   o.gr={};DB.kids.forEach(k=>{const g=k.gr||'-';o.gr[k.id]=g});
   o.attG=Object.keys(DB.att).filter(k=>/\|G\d+\|/.test(k));
   o.attBad=Object.keys(DB.att).filter(k=>/\|G[34]\|/.test(k)).length;
   o.nv26=DB.staff.find(s=>s.id==='nv26');
   o.menuN=Object.keys(DB.menu||{}).length;
   o.nt=DB.nt.map(n=>({id:n.id,t:n.t,fin:n.fin,by:n.by,tg:n.tg}));
   o.conv=['nv20','nv21','nv24','nv25','nv18','nv22','nv19','nv23'].map(id=>{const s=DB.staff.find(x=>x.id===id);return id+'|'+s.pos+'|'+s.pay.mode+'|'+s.pay.rate+'|'+s.pay.rateBt+'|'+s.pay.base});
   o.kid0=DB.kids[0].n;o.nv99=DB.staff.some(s=>s.id==='nv99');
   o.attKp=DB.att['2026-11-05|'+(window.__l||'')]||null;
   o.eMIG=DB.lg.some(e=>e.id==='eMIG');o.bon=DB.bon['nv04|2026-10'];o.p11=DB.cfg.p11;
   o.cnt={staff:DB.staff.length,kids:DB.kids.length,plans:DB.plans.length,sess:DB.sess.length,rp:DB.rp.length,att:Object.keys(DB.att).length,lich:DB.lich.length};
   o.mk0=JSON.stringify(DB.mk[0].from);
   o.stored=JSON.parse(localStorage.getItem('gb_v2')).v;
   o.grFn=DB.kids.filter(k=>k.gr).map(k=>k.id+':'+k.gr);
   o.addr=DB.cfg.addr;
   return o});
  ok('nâng cấp: v=4 và đã lưu lại v=4',r.v===4&&r.stored===4,[r.v,r.stored]);
  ok('mọi ca 1-1 nằm trong khung giờ mới',r.slotsIn);
  const MAP={'07:30':'07:15','08:30':'08:55','09:30':'09:45','10:30':'10:35','13:30':'13:55','14:30':'14:45','15:30':'15:35','16:30':'16:25'};
  const exp=MARK.lichSlots.map(x=>{const [id,s]=x.split('|');return id+'|'+MAP[s]});
  ok('ca cũ được đổi sang ca gần nhất, không trùng giờ',JSON.stringify(exp)===JSON.stringify(r.lich),[exp.slice(0,3),r.lich.slice(0,3)]);
  ok('đúng 2 lớp bán trú Ong non, Ong mật',r.groups.length===2&&r.groups[0].startsWith('G1:Ong non:nv18:nv22')&&r.groups[1].startsWith('G2:Ong mật:nv19:nv23'),r.groups);
  const g=MARK.gr;
  ok('bé nhóm cũ G1,G2 sang Ong non; G3,G4 sang Ong mật',[...g.G1,...g.G2].every(id=>r.gr[id]==='G1')&&[...g.G3,...g.G4].every(id=>r.gr[id]==='G2'),r.grFn.slice(0,5));
  ok('không còn khóa điểm danh nhóm G3, G4; số khóa điểm danh giữ nguyên',r.attBad===0&&r.cnt.att>=2158,[r.attBad,r.cnt.att]);
  ok('kế toán cũ nv26 thành Văn phòng',r.nv26.role==='vp'&&/văn phòng/i.test(r.nv26.pos),r.nv26);
  ok('thực đơn bán trú được tạo',r.menuN>=15,r.menuN);
  const n1=r.nt.find(n=>n.id==='n1'),n2=r.nt.find(n=>n.id==='n2');
  ok('thông báo học phí có cờ fin và do Văn phòng gửi',n1.fin===true&&n1.by==='nv26',n1);
  ok('thông báo ngoại khóa đổi sang lớp Ong non',/Ong non/.test(n2.t)&&n2.tg==='G1'&&n2.by==='nv18',n2);
  ok('thông báo mới về giờ 1-1 và bán trú',r.nt.some(n=>n.t==='Giờ học 1-1 và bán trú'&&n.fin===false));
  ok('thông báo của người dùng không bị đánh dấu tiền',r.nt.find(n=>n.id==='nMIG').fin===false);
  ok('giáo viên bán trú nhóm cũ nv20,nv21,nv24,nv25 chuyển sang 1-1',r.conv.slice(0,4).every(x=>/\|buoi\|220000\|0\|0$/.test(x)&&!/bán trú/i.test(x)),r.conv);
  ok('nv18,nv22,nv19,nv23 giữ chức bán trú',r.conv.slice(4).every(x=>/bán trú/i.test(x)&&/\|thang\|/.test(x)),r.conv);
  ok('thay đổi của người dùng được giữ nguyên',r.kid0==='Bé Thử Nâng Cấp'&&r.nv99&&r.eMIG&&r.bon===123456&&r.p11===310000,r);
  ok('số lượng nhân sự, học sinh, kế hoạch, buổi can thiệp, báo cáo được giữ',r.cnt.staff===MARK.nvCount&&r.cnt.kids===MARK.kidCount&&r.cnt.plans===MARK.plans&&r.cnt.sess===MARK.sess&&r.cnt.rp===MARK.rp,[r.cnt,MARK.nvCount,MARK.kidCount,MARK.plans,MARK.sess,MARK.rp]);
  ok('đơn học bù: ca gốc được đổi sang khung mới',JSON.parse(r.mk0).slot==='07:15'&&JSON.parse(MARK.mk0).slot==='07:30',r.mk0);
  ok('địa chỉ trung tâm giữ nguyên',/Trường Thi 1/.test(r.addr));
  ok('không có lỗi JS khi nâng cấp',errs.length===0,errs);
  // tải lại: dùng thẳng dữ liệu bản 4, không nâng cấp lại
  await page.reload();await page.waitForSelector('.lg');
  const r2=await page.evaluate(()=>({v:DB.v,k:DB.kids[0].n,nv99:DB.staff.some(s=>s.id==='nv99'),menu:Object.keys(DB.menu).length,g:DB.groups.length}));
  ok('tải lại trang vẫn giữ dữ liệu đã nâng cấp',r2.v===4&&r2.k==='Bé Thử Nâng Cấp'&&r2.nv99&&r2.menu>=15&&r2.g===2,r2);
  ok('không có lỗi JS sau khi tải lại',errs.length===0,errs);
  await b.close();
 }
 // dữ liệu bản 2 (chưa có thư viện mục tiêu) nâng thẳng lên bản 4
 {
  const d=JSON.parse(fs.readFileSync(SNAP,'utf8'));d.v=2;delete d.plans;delete d.sess;delete d.cg;
  fs.writeFileSync(__dirname+'/mig/snap-v2.json',JSON.stringify(d));
  const {b,page,errs}=await open({ls:__dirname+'/mig/snap-v2.json'});
  const r=await page.evaluate(()=>({v:DB.v,pl:DB.plans.length,se:DB.sess.length,cg:DB.cg.length,k:DB.kids[0].n,g:DB.groups.length,menu:Object.keys(DB.menu).length,rpSec:DB.rp.filter(x=>x.sec).length}));
  ok('bản 2 nâng thẳng lên bản 4 (thư viện mục tiêu + khung giờ mới)',r.v===4&&r.pl>0&&r.se>0&&r.cg>0&&r.k==='Bé Thử Nâng Cấp'&&r.g===2&&r.menu>=15,r);
  ok('không có lỗi JS với dữ liệu bản 2',errs.length===0,errs);
  await b.close();
 }
 // dữ liệu hỏng: tạo lại dữ liệu mẫu, không treo
 for(const [name,mut] of [['dữ liệu không phải JSON',null],['thiếu danh sách mk (nâng cấp lỗi)',d=>{d.mk=null}],['thiếu cấu trúc bắt buộc',d=>{delete d.staff}]]){
  let txt='không phải json {{{';
  if(mut){const d=JSON.parse(fs.readFileSync(SNAP,'utf8'));mut(d);txt=JSON.stringify(d)}
  fs.writeFileSync(__dirname+'/mig/snap-bad.json',txt);
  const {b,page,errs}=await open({ls:__dirname+'/mig/snap-bad.json'});
  const r=await page.evaluate(()=>({v:DB.v,k:DB.kids.length,g:DB.groups.length,menu:Object.keys(DB.menu).length,ok:!!document.querySelector('.lg')}));
  ok('hỏng: '+name+' → tạo lại dữ liệu mẫu bản 4',r.v===4&&r.k>50&&r.g===2&&r.menu>=15&&r.ok,r);
  ok('hỏng: '+name+' → không có lỗi JS chưa bắt',errs.length===0,errs);
  await b.close();
 }
 console.log(fails?('FAILED '+fails):'ALL PASS');
})();
