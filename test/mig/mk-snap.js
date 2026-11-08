/* Mở bản 7 đang chạy, thực hiện vài thay đổi như người dùng thật, rồi lấy dữ liệu đã lưu (gb_v2) làm mẫu để nâng cấp lên bản 8 */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:900}});const page=await ctx.newPage();const errs=[];
 page.on('pageerror',e=>errs.push(e.message));
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|claude\.ai|anthropic/,r=>r.abort());
 await page.goto('file://'+__dirname+'/v7.html');await page.waitForSelector('.lg');
 await page.click('.roles [data-v="tt"]');await page.waitForSelector('.nav');
 const mark=await page.evaluate(()=>{
  const m={};
  DB.kids[0].n='Bé Thử Nâng Cấp';m.kid0=DB.kids[0].id;
  DB.staff.push({id:'nv99',n:'Nhân Sự Thêm Mới',role:'gv',pos:'Giáo viên thử',ph:'0900000099',em:'themmoi@goldenbee.vn',st:'dang',sd:'2026-11-01',sup:'nv02',pay:{mode:'buoi',base:0,rate:200000,rateBt:0,allow:0,bh:0,latePen:0}});
  const l=DB.lich.find(x=>x.type==='11');m.l=l;DB.att['2026-11-05|'+l.id+'|'+l.hs]='kp';
  DB.lg.push({id:'eMIG',hs:'hs001',date:'2026-11-06',kind:'thu',amt:777000,m:'2026-10',note:'Chuyển khoản thử nâng cấp'});
  DB.bon['nv04|2026-10']=123456;
  DB.nt.unshift({id:'nMIG',aud:'ph',tg:'all',t:'Thông báo thử nâng cấp',b:'Nội dung do người dùng nhập.',by:'nv02',at:TODAY,pin:false});
  DB.cfg.p11=310000;
  /* các bé bán trú của 4 nhóm cũ */
  m.gr={};['G1','G2','G3','G4'].forEach(g=>{m.gr[g]=DB.kids.filter(k=>k.gr===g).map(k=>k.id)});
  m.lichSlots=DB.lich.map(x=>x.id+'|'+x.slot);m.mk0=JSON.stringify(DB.mk[0].from);
  m.attG=Object.keys(DB.att).filter(k=>/\|G[1-4]\|/.test(k)).length;
  m.staff=DB.staff.map(s=>s.id+'|'+s.role+'|'+s.pos+'|'+s.pay.mode+'|'+s.pay.base+'|'+s.pay.rate+'|'+s.pay.rateBt);
  m.nvCount=DB.staff.length;m.kidCount=DB.kids.length;m.plans=DB.plans.length;m.sess=DB.sess.length;m.rp=DB.rp.length;
  save();return m});
 await page.waitForTimeout(600);
 const ls=await page.evaluate(()=>localStorage.getItem('gb_v2'));
 const d=JSON.parse(ls);
 fs.writeFileSync(__dirname+'/snap-v3.json',ls);fs.writeFileSync(__dirname+'/snap-mark.json',JSON.stringify(mark));
 console.log('saved bytes',ls.length,'v',d.v,'errs',errs,'kid0',d.kids[0].n,'nv99',d.staff.some(s=>s.id==='nv99'));
 await b.close()})();
