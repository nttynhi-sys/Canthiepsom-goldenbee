/* Z9: Ngân hàng mục tiêu "Ngôn ngữ trị liệu" (313 mục, 0–6 tuổi) và các lĩnh vực mới trong bộ lọc */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 await login(page,'ql');

 const d=await ev(()=>{const nl=LIBI.filter(i=>i.s==='nl');
  const ages=[...new Set(nl.map(i=>i.a))];
  return{n:nl.length,heads:new Set(nl.map(i=>i.hi)).size,ids:new Set(LIBI.map(i=>i.id)).size===LIBI.length,
   keys:Object.keys(LSRC),name:LSRC.nl&&LSRC.nl.n,ages,
   badM:nl.filter(i=>![0,1,2,3,4,5,6,7].includes(i.m)).length,
   noText:nl.filter(i=>!i.n||!i.t||!i.k||!i.o).length,
   domOk:nl.every(i=>DM[i.d]),
   doms:LDOM.map(x=>x.id),
   newDoms:['gtl','lnp','aac','an','tn','nlp'].map(id=>[id,nl.filter(i=>i.d===id).length]),
   perDom:Object.fromEntries(LDOM.map(x=>[x.id,nl.filter(i=>i.d===x.id).length])),
   ex:nl[0]?{id:nl[0].id,n:nl[0].n,t:nl[0].t,a:nl[0].a,m:nl[0].m,ex:nl[0].ex,rf:nl[0].rf}:null,
   chips:LCHIPS.map(c=>c.id)}});
 ok('383 mục Ngôn ngữ trị liệu (313 + 70 tô vàng), mã mục không trùng',d.n===383&&d.ids,d.n);
 ok('279 nhóm kỹ năng thành 279 tiêu đề',d.heads===279,d.heads);
 ok('đặt tên "Ngôn ngữ trị liệu" và đứng trước mục "Trung tâm tự thêm"',d.name==='Ngôn ngữ trị liệu'&&d.keys.indexOf('nl')===d.keys.indexOf('cu')-1,d.keys);
 ok('nhãn độ tuổi gồm 8 nhóm của bảng gốc và 3 nhóm lô mới (6–12, 12–18, từ 18 tuổi)',d.ages.length===11&&['0–6 tháng','6–12 tháng','12–18 tháng','18–24 tháng','2–3 tuổi','3–4 tuổi','4–5 tuổi','5–6 tuổi','6–12 tuổi','12–18 tuổi','≥ 18 tuổi'].every(a=>d.ages.includes(a)),d.ages);
 ok('mốc lọc độ tuổi nằm trong 0–7 (0–4 như các chương trình khác, 5–7 thêm cho lô mới); mọi mục có nội dung, hành vi, khóa tìm',d.badM===0&&d.noText===0&&d.domOk,{badM:d.badM,noText:d.noText});
 ok('6 lĩnh vực mới có mục và đã được thêm vào danh sách lĩnh vực',d.newDoms.every(x=>x[1]>0)&&['gtl','lnp','aac','an','tn','nlp'].every(id=>d.doms.includes(id)),d.newDoms);
 ok('lĩnh vực trùng nghĩa được nối vào lĩnh vực có sẵn (không tạo trùng)',d.doms.length===14&&d.perDom.nh>0&&d.perDom.nd>0&&d.perDom.nt>0&&d.perDom.xh>0,d.doms);
 ok('chip lọc Chơi/Xã hội vẫn hoạt động, mục mới không làm lệch',d.chips.includes('choi')&&d.chips.includes('xh'),d.chips);
 ok('chi tiết mục có tiêu chí đạt, phương thức giao tiếp, nguồn',d.ex&&d.ex.ex.some(x=>x[0]==='Tiêu chí đạt'&&x[1])&&d.ex.ex.some(x=>x[0]==='Phương thức giao tiếp')&&/ASHA/.test(d.ex.rf),d.ex);

 /* giao diện: lọc theo bộ Ngôn ngữ trị liệu, theo lĩnh vực mới và theo độ tuổi */
 await page.click('.nav button:has-text("Ngân hàng mục tiêu")');await W(150);
 const cnt=()=>ev(()=>{const e=document.querySelector('.acts .sm b');return e?e.textContent:null});
 await ev(()=>{Object.assign(S.hs.lib,{dom:'',src:'nl',head:'',age:'',q:''});S.pg.lib=1;render()});await W(150);
 ok('lọc bộ Ngôn ngữ trị liệu: 383 mục phù hợp',(await cnt())==='383',await cnt());
 const opt=await ev(()=>[...document.querySelectorAll('#lf-s option, select[data-c="lfsrc"] option')].map(o=>o.textContent.trim()));
 ok('danh sách bộ công cụ có "Ngôn ngữ trị liệu"',opt.some(t=>t.indexOf('Ngôn ngữ trị liệu')===0),opt);
 const chips=await ev(()=>[...document.querySelectorAll('[data-a="lfdom"]')].map(c=>c.textContent.trim()));
 ok('bộ lọc lĩnh vực có 6 lĩnh vực mới',['Tiền ngôn ngữ','Phát âm','AAC','Ăn uống','Thính giác','Nói lắp'].every(t=>chips.some(c=>c.indexOf(t)>=0)),chips);
 const exp=await ev(()=>LIBI.filter(i=>i.s==='nl'&&i.d==='lnp').length);
 await ev(()=>{Object.assign(S.hs.lib,{dom:'lnp',src:'nl',head:'',age:'',q:''});S.pg.lib=1;render()});await W(150);
 ok('lọc lĩnh vực Lời nói và phát âm khớp số mục dữ liệu',(await cnt())===String(exp),{ui:await cnt(),exp});
 await ev(()=>{Object.assign(S.hs.lib,{dom:'',src:'nl',head:'',age:'0',q:''});S.pg.lib=1;render()});await W(150);
 const expAge=await ev(()=>LIBI.filter(i=>i.s==='nl'&&i.m===0).length);
 ok('lọc độ tuổi "dưới 12 tháng" bao gồm nhóm 0–6 tháng',(await cnt())===String(expAge)&&expAge>0,{ui:await cnt(),expAge});
 await ev(()=>{Object.assign(S.hs.lib,{dom:'',src:'',head:'',age:'',q:''});S.pg.lib=1;render()});await W(120);

 /* giao diện điện thoại: không tràn ngang */
 await page.setViewportSize({width:390,height:844});await W(150);
 const ov=await ev(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
 ok('màn hình 390px không tràn ngang trang Ngân hàng mục tiêu',!ov);
 await page.setViewportSize({width:1280,height:900});

 ok('không có lỗi script',errs.length===0,errs.slice(0,3));
 console.log(`\n${passes} PASS, ${fails} FAIL`);
 await b.close();
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
