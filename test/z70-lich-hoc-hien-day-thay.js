/* Lịch học (lưới 1-1 theo tuần): hiện học sinh và giờ dạy thay, ở giáo viên dạy thay, giáo viên nghỉ, theo bé và tổng hợp */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
(async()=>{
 const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
 const P=await ev(()=>{DB.sub=[];
  const ls=DB.lich.filter(l=>l.type==='11'&&l.day>=1&&l.day<=5&&kidBy(l.hs)&&kidBy(l.hs).st==='dang');
  const T=DB.staff.filter(s=>s.st==='dang'&&isTeacher(s));
  const day=l=>{let d=monOf(addD(TODAY,7));while(dow(d)!==l.day)d=addD(d,1);return d};
  let a=null,c=null;
  for(const l of ls){if(!a){a=l;continue}if(!c&&l.id!==a.id&&l.hs!==a.hs&&l.gv===a.gv&&l.slot!==a.slot){c=l;break}}
  if(!c)for(const l of ls){if(l.id!==a.id&&l.hs!==a.hs){c=l;break}}
  const g1=a.gv,g2=T.find(t=>t.id!==a.gv&&t.id!==c.gv).id;
  const d1=day(a),d2=day(c);
  DB.sub.push({id:'zl1',d:d1,sid:a.id,hs:a.hs,gv:g2,og:a.gv,by:'t',at:TODAY});
  DB.sub.push({id:'zl2',d:d2,sid:c.id,hs:c.hs,gv:g2,og:c.gv,by:'t',at:TODAY,slot:'18:30'});
  return{a:{id:a.id,hs:a.hs,gv:a.gv,slot:a.slot,n:kidBy(a.hs).n},c:{id:c.id,hs:c.hs,gv:c.gv,slot:c.slot,n:kidBy(c.hs).n},g2,g2n:sn(g2),g1n:sn(a.gv),c1n:sn(c.gv),d1,d2,mon:monOf(d1)}});
 const cell=(mode,id,d,s)=>ev(([m,i,dd,ss])=>{S.lh={tab:'wk',mode:m,wk:monOf(dd),gv:m==='gv'?i:'',kid:m==='kid'?i:''};return lhCell(S.lh,dd,dow(dd),ss)},[mode,id,d,s]);
 /* 1. giáo viên dạy thay: bé và nhãn Dạy thay ở giờ gốc */
 let h=await cell('gv',P.g2,P.d1,P.a.slot);
 ok('giáo viên dạy thay: ô giờ dạy hiện tên bé, nhãn "Dạy thay" và tên giáo viên được thay',h.includes(P.a.n.split(' ').pop())&&/Dạy thay/.test(h)&&h.includes('subin'),h);
 /* 2. giáo viên nghỉ: buổi hiện mờ, ghi ai dạy thay */
 h=await cell('gv',P.a.gv,P.d1,P.a.slot);
 ok('giáo viên được thay: buổi hiện mờ (nét đứt) kèm tên bé và người dạy thay',h.includes('subout')&&h.includes(P.a.n.split(' ').pop())&&/dạy thay/.test(h)&&h.includes(P.g2n.split(' ').pop()),h);
 /* 3. theo bé */
 h=await cell('kid',P.a.hs,P.d1,P.a.slot);
 ok('xem theo bé: buổi có nhãn "Dạy thay" và tên giáo viên dạy thay (không còn tên giáo viên gốc)',/Dạy thay/.test(h)&&h.includes(P.g2n.split(' ').pop())&&!h.includes('>'+P.g1n+'<'),h);
 /* 4. đổi giờ */
 h=await cell('gv',P.g2,P.d2,'18:30');
 ok('dạy thay đổi giờ: giáo viên dạy thay thấy bé ở giờ mới 18:30, ghi giờ gốc',h.includes(P.c.n.split(' ').pop())&&/giờ gốc/.test(h)&&h.includes(P.c.slot),h);
 h=await cell('gv',P.c.gv,P.d2,P.c.slot);
 ok('dạy thay đổi giờ: giáo viên gốc thấy buổi ở giờ gốc kèm "đổi sang 18:30"',h.includes('subout')&&/đổi sang 18:30/.test(h),h);
 h=await cell('kid',P.c.hs,P.d2,'18:30');
 ok('xem theo bé: buổi đổi giờ hiện ở giờ mới 18:30, ghi giờ gốc',/Dạy thay/.test(h)&&/giờ gốc/.test(h),h);
 h=await cell('kid',P.c.hs,P.d2,P.c.slot);
 ok('xem theo bé: ở giờ gốc không còn buổi (bé đã chuyển sang giờ dạy thay)',!/class="ls/.test(h),h);
 /* 5. tổng hợp đếm theo giờ đang áp dụng */
 const cnt=await ev(p=>{S.lh={tab:'wk',mode:'all',wk:monOf(p.d2),gv:'',kid:''};const t=s=>(lhCell(S.lh,p.d2,dow(p.d2),s).match(/>(\d+)<\/span>/)||[])[1];return{newSlot:t('18:30'),orig:t(p.c.slot)}},P);
 ok('tổng hợp: giờ dạy thay 18:30 có 1 buổi',+cnt.newSlot>=1,cnt);
 /* 6. màn hình thật: giờ phát sinh do dạy thay có hàng riêng, bấm ô mở hộp có ghi chú dạy thay */
 await ev(p=>{S.lh={tab:'wk',mode:'gv',wk:p.mon,gv:p.g2,kid:''};go('lh');render()},P);await page.waitForSelector('table.wkt');
 const tx=await page.textContent('table.wkt');
 ok('lưới tuần của giáo viên dạy thay có hàng giờ 18:30 và có nhãn Dạy thay',/18:30/.test(tx)&&/Dạy thay/.test(tx),tx.slice(0,200));
 await page.click('table.wkt .ls.subin >> nth=0');await page.waitForSelector('.mdl');
 const mt=await page.textContent('.mdl');
 ok('bấm buổi dạy thay: hộp ghi rõ giáo viên dạy thay và nút mở Dạy thay',/dạy thay/.test(mt)&&/Mở Dạy thay/.test(mt),mt.slice(0,250));
 await page.keyboard.press('Escape');await ev(()=>{S.modal=null;render()});
 /* 7. lưới của giáo viên không dạy thay không bị ảnh hưởng, buổi thường vẫn hiện */
 const d3=await ev(d=>addD(d,7),P.d1);h=await cell('gv',P.a.gv,d3,P.a.slot);
 ok('tuần khác (không dạy thay): buổi của giáo viên gốc hiện bình thường, không nhãn dạy thay',h.includes(P.a.n.split(' ').pop())&&!/subout|Dạy thay/.test(h),h);
 /* 8. giáo viên nghỉ phép: vẫn thấy ai dạy thay */
 const lv=await ev(p=>{DB.lr.push({id:'zlv',st:p.a.gv,s:'duyet',f:p.d1,t:p.d1,type:'phep'});return lhCell({tab:'wk',mode:'gv',gv:p.a.gv,kid:''},p.d1,dow(p.d1),p.a.slot)},P);
 ok('giáo viên nghỉ phép: ô ghi "Nghỉ phép" và vẫn hiện buổi đã có người dạy thay',/Nghỉ phép/.test(lv)&&lv.includes('subout'),lv);
 await ev(()=>{DB.lr=DB.lr.filter(x=>x.id!=='zlv')});
 await b.close();
 ok('không lỗi trang',errs.length===0,errs);
 console.log(`\nKẾT QUẢ: ${passes} đạt, ${fails} lỗi`);process.exit(fails?1:0)})();
