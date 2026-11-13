/* Z46: lô "Mục tiêu thông minh" (80 mục) lồng vào bộ Ngôn ngữ trị liệu: đúng nguyên văn, đúng lĩnh vực của bộ lọc, hiện bài tập cụ thể, thêm được vào kế hoạch của bé */
const fs=require('fs'),path=require('path');
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
const RAW=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../tools/nl_tm_raw.json'),'utf8'));
(async()=>{
 ok('tệp nguồn có đủ 80 mục, số 1 đến 80',RAW.length===80&&RAW.every((r,i)=>r.num===i+1),RAW.length);
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||90);
 await login(page,'ql');

 /* --- dữ liệu --- */
 const d=await ev(()=>{const tm=LIBI.filter(i=>/^TM-\d\d$/.test(i.c)),nl=LIBI.filter(i=>i.s==='nl');
  const exv=(i,l)=>((i.ex||[]).find(e=>e[0]===l)||[])[1];
  return{n:tm.length,allNl:tm.every(i=>i.s==='nl'&&i.id==='nl:'+i.c),uniq:new Set(LIBI.map(i=>i.id)).size===LIBI.length,
   nlN:nl.length,ldom:LDOM.length,
   items:tm.map(i=>({c:i.c,d:i.d,n:i.n,o:i.o,crit:exv(i,'Tiêu chí đạt'),phase:exv(i,'Giai đoạn'),rf:i.rf,a:i.a,m:i.m,t:i.t,hi:i.hi,ol:i.ol,tag:LHEAD[i.hi]&&LHEAD[i.hi][0],k:i.k})),
   perDom:tm.reduce((a,i)=>(a[i.d]=(a[i.d]||0)+1,a),{}),
   domOk:tm.every(i=>DM[i.d]&&LCHIPS.some(c=>c.id===i.d)),
   heads:[...new Set(tm.map(i=>i.hi))].length,
   blob:JSON.stringify(tm)}});
 ok('80 mục TM-01 đến TM-80 trong bộ Ngôn ngữ trị liệu, mã không trùng với mục nào khác',d.n===80&&d.allNl&&d.uniq,{n:d.n});
 ok('tổng bộ Ngôn ngữ trị liệu là 463 mục (383 cũ + 80 mới), không đổi số lĩnh vực (37)',d.nlN===463&&d.ldom===37,{nl:d.nlN,ldom:d.ldom});
 const bad=[];
 RAW.forEach(r=>{const i=d.items.find(x=>x.c==='TM-'+String(r.num).padStart(2,'0'));
  if(!i||i.n!==r.name||i.o!==r.content||i.crit!==r.crit||i.phase!==r.phase||!i.rf.endsWith('trang '+r.page))bad.push(r.num)});
 ok('tên, nội dung, tiêu chí đạt, giai đoạn, trang PDF khớp nguyên văn tệp Excel cho cả 80 mục',bad.length===0,bad);
 ok('lĩnh vực: Giao tiếp tiền ngôn ngữ 20, Ngôn ngữ hiểu 19, Ngôn ngữ diễn đạt 37, Lời nói và phát âm 3, Chơi và tương tác xã hội 1',
  d.perDom.gtl===20&&d.perDom.nh===19&&d.perDom.nd===37&&d.perDom.lnp===3&&d.perDom.xh===1&&Object.keys(d.perDom).length===5,d.perDom);
 ok('mọi mục nằm trong lĩnh vực có sẵn ở bộ lọc (không tạo lĩnh vực mới)',d.domOk);
 ok('17 tiêu đề nhóm kỹ năng: 8 tiền ngôn ngữ + 8 tập nói từ đơn + 1 diễn đạt câu',d.heads===17&&d.items.every(i=>i.tag==='nl'),d.heads);
 const t1=d.items.find(i=>i.c==='TM-01'),t80=d.items.find(i=>i.c==='TM-80'),t37=d.items.find(i=>i.c==='TM-37');
 ok('tiêu đề nhóm dạng "giai đoạn · nhóm" (viết hoa đầu câu), giai đoạn diễn đạt câu chỉ có tên giai đoạn',
  t1.t==='Tiền ngôn ngữ · I. Hiện diện – chú ý – tiếp nhận cơ bản'&&t80.t==='Giai đoạn diễn đạt câu'&&t37.t==='Giai đoạn tập nói từ đơn · II. Gọi tên – nhận biết đồ vật – hoạt động',[t1.t,t80.t,t37.t]);
 ok('file không nêu tuổi: a rỗng và m = -1 (không tự đoán)',d.items.every(i=>i.a===''&&i.m===-1));
 ok('nhãn "Bài tập cụ thể" cho nội dung mục tiêu',d.items.every(i=>i.ol==='Bài tập cụ thể'&&i.o.length>100));
 ok('không có chữ về trạng thái duyệt trong dữ liệu mục',!/Chưa duyệt|Trạng thái duyệt|Ghi chú duyệt|dự thảo/i.test(d.blob));
 ok('ánh xạ lĩnh vực theo kỹ năng: TM-01 gtl, TM-16 nh, TM-28 lnp, TM-31 nd, TM-49 xh, TM-60 nd',
  ['TM-01:gtl','TM-16:nh','TM-28:lnp','TM-31:nd','TM-49:xh','TM-60:nd'].every(s=>{const [c,dm]=s.split(':');return d.items.find(i=>i.c===c).d===dm}));

 /* --- tìm kiếm và lọc ở mức dữ liệu --- */
 const f=await ev(()=>({
  byName:libFind({src:'nl',q:'quay lai khi nghe goi ten'}).map(i=>i.c),
  byContent:libFind({src:'nl',q:'bong bong'}).filter(i=>/^TM-/.test(i.c)).length,
  byTag:libFind({src:'nl',q:'muc tieu thong minh'}).length,
  age:[0,1,2,3,4].map(a=>libFind({src:'nl',age:String(a)}).filter(i=>/^TM-/.test(i.c)).length),
  noAge:libFind({src:'nl',age:''}).length,
  gtl:libFind({src:'nl',dom:'gtl'}).length,gtlExp:LIBI.filter(i=>i.s==='nl'&&i.d==='gtl').length,
  tmGtl:libFind({src:'nl',dom:'gtl'}).filter(i=>/^TM-/.test(i.c)).length,
  choi:libFind({src:'nl',dom:'choi'}).filter(i=>/^TM-/.test(i.c)).length,
  xh:libFind({src:'nl',dom:'xh'}).filter(i=>/^TM-/.test(i.c)).length,
  head1:libFind({src:'nl',head:String(LIBI.find(i=>i.c==='TM-01').hi)}).map(i=>i.c),
  goal:{n:gName('nl:TM-01'),d:gDom('nl:TM-01'),s:gSrc(goalOf('nl:TM-01'))}}));
 ok('tìm theo tên mục tiêu thấy TM-01',f.byName.length===1&&f.byName[0]==='TM-01',f.byName);
 ok('tìm theo từ trong nội dung bài tập (bong bóng) và theo "mục tiêu thông minh"',f.byContent>3&&f.byTag===80,{c:f.byContent,t:f.byTag});
 ok('lọc độ tuổi 0–4 không lẫn mục chưa có tuổi; bỏ lọc tuổi thì thấy đủ 463',f.age.every(x=>x===0)&&f.noAge===463,f);
 ok('lọc lĩnh vực Giao tiếp tiền ngôn ngữ gồm 20 mục mới; chip Chơi không lẫn mục mới; chip Xã hội gồm TM-49',f.tmGtl===20&&f.gtl===f.gtlExp&&f.choi===0&&f.xh===1,f);
 ok('lọc theo nhóm kỹ năng "Hiện diện – chú ý" ra 5 mục TM-01 đến TM-05',JSON.stringify(f.head1)==='["TM-01","TM-02","TM-03","TM-04","TM-05"]',f.head1);
 ok('tra mục tiêu theo mã: tên, lĩnh vực, nguồn',f.goal.n==='Quay lại khi nghe gọi tên'&&f.goal.d==='gtl'&&f.goal.s==='Ngôn ngữ trị liệu · TM-01',f.goal);

 /* --- giao diện Ngân hàng mục tiêu --- */
 await page.click('.nav button:has-text("Ngân hàng mục tiêu")');await W(150);
 const cnt=()=>ev(()=>{const e=document.querySelector('.acts .sm b');return e?e.textContent:null});
 const setF=o=>ev(o=>{Object.assign(S.hs.lib,Object.assign({dom:'',src:'nl',head:'',age:'',q:''},o));S.pg.lib=1;render()},o);
 await setF({q:'quay lai khi nghe goi ten'});await W(150);
 ok('ô tìm kiếm: gõ tên mục tiêu ra đúng 1 mục',(await cnt())==='1',await cnt());
 const card=await ev(()=>{const e=document.querySelector('.gi');const dt=e&&e.querySelector('details.gd');return e?{html:e.textContent,hasDetails:!!dt,tag:(e.querySelector('.tag,.tg,.sm.mu')||{}).textContent}:null});
 ok('thẻ mục tiêu hiện tên, lĩnh vực, nhóm kỹ năng, mã và có phần Chi tiết',card&&/Quay lại khi nghe gọi tên/.test(card.html)&&/Tiền ngôn ngữ/.test(card.html)&&/Hiện diện – chú ý – tiếp nhận cơ bản/.test(card.html)&&/TM-01/.test(card.html)&&card.hasDetails,card&&card.html.slice(0,300));
 await ev(()=>{document.querySelector('.gi details.gd').open=true});
 const det=await ev(()=>document.querySelector('.gi details.gd > div.sm').textContent);
 ok('Chi tiết có nhãn "Bài tập cụ thể" với nội dung nguyên văn, tiêu chí đạt, giai đoạn, nguồn; không còn nhãn "Mô tả"',
  /Bài tập cụ thể:/.test(det)&&det.includes('cô gọi tên bé 1–2 lần')&&/Tiêu chí đạt: đạt 5\/8 cơ hội/.test(det)&&/Giai đoạn: Tiền ngôn ngữ/.test(det)&&/Kho mục tiêu thông minh/.test(det)&&!/Mô tả:/.test(det),det.slice(0,400));
 ok('Chi tiết nói rõ file gốc không nêu tuổi (thay vì để trống)',/File gốc không nêu tuổi/.test(det),det.slice(0,400));
 await setF({q:'NH-01'});await W(120);
 await ev(()=>{const d=document.querySelector('.gi details.gd');if(d)d.open=true});
 const old=await ev(()=>{const d=document.querySelector('.gi details.gd > div.sm');return d?d.textContent:''});
 ok('mục cũ của bộ vẫn hiện nhãn "Mô tả" như trước',/Mô tả:/.test(old)&&!/Bài tập cụ thể/.test(old),old.slice(0,200));

 /* chip lĩnh vực và bộ lọc nhóm kỹ năng trên giao diện */
 await setF({dom:'lnp'});await W(150);
 const lnpExp=await ev(()=>LIBI.filter(i=>i.s==='nl'&&i.d==='lnp').length);
 ok('chip Lời nói và phát âm: số mục khớp dữ liệu (đã gồm TM-28, TM-38, TM-39)',(await cnt())===String(lnpExp),{ui:await cnt(),lnpExp});
 await setF({dom:'nd'});await W(150);
 const ndExp=await ev(()=>LIBI.filter(i=>i.s==='nl'&&i.d==='nd').length);
 ok('chip Ngôn ngữ diễn đạt: số mục khớp dữ liệu (62 cũ + 37 mới)',(await cnt())===String(ndExp)&&ndExp===99,{ui:await cnt(),ndExp});
 await setF({dom:'nh'});await W(150);
 ok('chip Ngôn ngữ hiểu: 34 cũ + 19 mới',(await cnt())==='53',await cnt());
 const hi=await ev(()=>String(LIBI.find(i=>i.c==='TM-60').hi));
 await setF({head:hi});await W(150);
 ok('lọc nhóm "Giai đoạn diễn đạt câu": 21 mục',(await cnt())==='21',await cnt());
 const opts=await ev(()=>[...document.querySelectorAll('select[data-c="lfhead"] option')].map(o=>o.textContent.trim()));
 ok('danh sách nhóm kỹ năng có tiêu đề giai đoạn kèm số mục',opts.some(t=>t.indexOf('Giai đoạn diễn đạt câu · Ngôn ngữ trị liệu (21)')===0),opts.slice(0,3));

 /* điện thoại: chọn tiêu đề nhóm dài nhất, không tràn ngang */
 const longHi=await ev(()=>{const t=LIBI.filter(i=>/^TM-/.test(i.c)).sort((a,b)=>b.t.length-a.t.length)[0];return String(t.hi)});
 await setF({head:longHi});
 await page.setViewportSize({width:390,height:844});await W(200);
 const ov=await ev(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
 ok('màn hình 390px, nhóm có tiêu đề dài nhất: không tràn ngang',!ov);
 await page.setViewportSize({width:1280,height:900});
 await setF({});await W(100);

 /* --- thêm vào kế hoạch của một bé qua bộ chọn mục tiêu --- */
 const kid=await ev(()=>{const k=DB.kids.find(x=>true);return k.id});
 await ev(k=>{ACT.pkopen(k);render()},kid);await W(200);
 await ev(()=>{S.modal.f=Object.assign({},S.modal.f,{src:'nl',q:'quay lai khi nghe goi ten'});render()});await W(200);
 const pick=await ev(()=>{const c=document.querySelector('input[data-c="gpsel"][value="nl:TM-01"]');return !!c});
 ok('bộ chọn mục tiêu của bé liệt kê TM-01 để tick',pick);
 await page.click('input[data-c="gpsel"][value="nl:TM-01"]');await W(100);
 await page.click('[data-a="gpok"]');await W(200);
 const pl=await ev(k=>DB.plans.filter(p=>p.k===k&&p.g==='nl:TM-01').map(p=>({g:p.g,h:p.h,s:p.s})),kid);
 ok('thêm TM-01 vào kế hoạch ngắn hạn của bé thành công',pl.length===1&&pl[0].h==='n'&&pl[0].s==='dang',pl);
 const shown=await ev(()=>document.body.textContent.includes('Quay lại khi nghe gọi tên'));
 ok('kế hoạch của bé hiện tên mục tiêu mới',shown);

 ok('không có lỗi script',errs.length===0,errs.slice(0,3));
 console.log(`\n${passes} PASS, ${fails} FAIL`);
 await b.close();
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
