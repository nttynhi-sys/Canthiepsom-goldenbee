/* Z5: lĩnh vực "Chơi" lọc nhanh Westby và chuỗi chơi 0–4 tuổi; mã học sinh dạng STT-BT / STT-CN */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,700))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 await login(page,'ql');

 /* ---------- 1. Lĩnh vực "Chơi" ---------- */
 const d=await ev(()=>{const xh=libAll().filter(i=>i.d==='xh'),pl=xh.filter(isPlay),so=xh.filter(i=>!isPlay(i));
  const f=o=>libFind(Object.assign({dom:'',src:'',head:'',age:'',q:''},o));
  const heads=(o)=>libHeads(Object.assign({dom:'',src:'',head:'',age:'',q:''},o)).map(h=>h[1]);
  return{chips:LCHIPS.map(c=>c.id+':'+c.s),xh:xh.length,pl:pl.length,so:so.length,
   choi:f({dom:'choi'}).length,xhF:f({dom:'xh'}).length,
   weAll:LIBI.filter(i=>i.s==='we').every(isPlay),cpAll:LIBI.filter(i=>i.s==='cp').every(isPlay),
   choiWe:f({dom:'choi',src:'we'}).length,choiCp:f({dom:'choi',src:'cp'}).length,xhWe:f({dom:'xh',src:'we'}).length,
   choiOther:f({dom:'choi'}).filter(i=>i.d!=='xh').length,
   plHeads:[...new Set(pl.map(i=>i.t))].filter(t=>!/^(Vui chơi|Chơi)/.test(t)),
   soHeadsPlay:[...new Set(so.map(i=>i.t))].filter(t=>/^(Vui chơi|Chơi)/.test(t)),
   headsChoi:heads({dom:'choi'}).length,headsXh:heads({dom:'xh'}).length,
   noChoiInXh:heads({dom:'xh'}).filter(h=>/Westby|Chuỗi chơi/.test(h)).length,
   westbyQ:f({dom:'choi',q:'westby'}).length,
   qChoi:f({dom:'choi',q:'giai doan vii'}).length,
   other:f({dom:'nh'}).length,all:f({}).length}});
 ok('thanh lĩnh vực có nút "Chơi" nằm ngay trước "Xã hội"',/choi:Chơi,xh:Xã hội/.test(d.chips.join(',')),d.chips);
 ok('"Chơi" + "Xã hội" gộp lại đủ mọi mục của lĩnh vực xh cũ (405 mục có sẵn + mục Trung tâm tự thêm), không trùng',d.choi+d.xhF===d.xh&&d.choi===d.pl&&d.xhF===d.so&&d.choi>0&&d.xhF>0,d);
 ok('lọc "Chơi" ra đủ 35 mục Westby và 34 mục Chuỗi chơi 0–4 tuổi',d.choiWe===35&&d.choiCp===34&&d.weAll&&d.cpAll,d);
 ok('lọc "Xã hội" không còn lẫn Westby hay Chuỗi chơi',d.xhWe===0&&d.noChoiInXh===0,d);
 ok('mục "Chơi" gồm cả tiêu đề chơi của ABLLS-R, ESDM, VB-MAPP, Mầm non (chơi độc lập, vui chơi...)',d.plHeads.every(t=>/Giai đoạn|thực hành|biểu tượng|Giả vờ|chức năng/.test(t))&&d.soHeadsPlay.length===0,d);
 ok('các lĩnh vực khác không bị đổi (Ngôn ngữ hiểu vẫn lọc bình thường)',d.other>0&&d.other<d.all&&d.choiOther===0,d);
 ok('tìm "westby" trong Chơi ra 35 mục; tìm "giai đoạn VII" ra đúng giai đoạn',d.westbyQ===35&&d.qChoi>=3,d);

 await page.click('.nav button:has-text("Ngân hàng mục tiêu")');await W(150);
 const ui1=await ev(()=>({chips:[...document.querySelectorAll('.chips .chip')].map(c=>c.textContent.trim())}));
 ok('giao diện Ngân hàng mục tiêu hiện nút "Chơi" và "Xã hội"',ui1.chips.includes('Chơi')&&ui1.chips.includes('Xã hội')&&ui1.chips.indexOf('Chơi')+1===ui1.chips.indexOf('Xã hội'),ui1);
 await page.click('.chips .chip:has-text("Chơi")');await W(150);
 const ui2=await ev(()=>({pressed:[...document.querySelectorAll('.chips .chip[aria-pressed="true"]')].map(c=>c.textContent.trim()),
  cnt:document.querySelector('.acts .sm b').textContent,
  srcOpts:[...document.querySelectorAll('select[data-c="lfsrc"] option')].map(o=>o.textContent),
  heads:[...document.querySelectorAll('select[data-c="lfhead"] option')].map(o=>o.textContent),
  tags:[...new Set([...document.querySelectorAll('.gl .gi .tag')].map(t=>t.textContent))]}));
 ok('bấm "Chơi": nút sáng lên, số mục khớp bộ lọc',ui2.pressed.length===1&&ui2.pressed[0]==='Chơi'&&+ui2.cnt===d.choi,ui2);
 ok('trong "Chơi" có tiêu đề Westby và Chuỗi chơi trong hộp Tiêu đề',ui2.heads.some(h=>/Giai đoạn I · 9–12 tháng.*Westby/.test(h))&&ui2.heads.some(h=>/Chơi thực hành.*Chuỗi chơi/.test(h)),ui2.heads.slice(0,6));
 ok('mỗi mục trong danh sách mang nhãn "Chơi"',ui2.tags.length===1&&ui2.tags[0]==='Chơi',ui2.tags);
 /* kết hợp với bộ công cụ Westby và độ tuổi */
 await ev(()=>{S.hs.lib.src='we';S.hs.lib.age='';S.pg.lib=1;render()});await W(100);
 ok('Chơi + Westby: 35 mục',await ev(()=>document.querySelector('.acts .sm b').textContent)==='35');
 await ev(()=>{S.hs.lib.src='';S.hs.lib.head='';S.hs.lib.age='0';S.pg.lib=1;render()});await W(100);
 const young=await ev(()=>+document.querySelector('.acts .sm b').textContent);
 ok('Chơi + mốc dưới 12 tháng: lọc được chuỗi chơi sớm',young>0&&young<d.choi,young);
 await page.click('.chips .chip:has-text("Xã hội")');await W(120);
 ok('bấm "Xã hội": chỉ còn mục xã hội',await ev(()=>document.querySelector('.chips .chip.on').textContent.trim()==='Xã hội'&&!document.querySelector('.gl').textContent.includes('Westby')));
 await ev(()=>{S.hs.lib.dom='';S.hs.lib.age='';S.hs.lib.src='';S.pg.lib=1;render()});await W(60);

 /* hộp chọn mục tiêu khi thêm kế hoạch cho bé cũng có nút Chơi */
 const gp=await ev(()=>{const k=bkKids()[0];S.modal={t:'gp',mode:'plan',k:k.id,back:null,f:{dom:'choi',src:'',head:'',age:'',q:''},sel:[],hz:'n'};S.pg.gp=1;render();
  return{chips:[...document.querySelectorAll('.mdc .chips .chip')].map(c=>c.textContent.trim()),on:(document.querySelector('.mdc .chips .chip.on')||{}).textContent,n:document.querySelector('.mdc .acts .sm b')&&document.querySelector('.mdc .acts .sm b').textContent}});
 ok('hộp "Chọn mục tiêu cho bé" cũng có nút Chơi và lọc đúng',gp.chips.includes('Chơi')&&gp.on==='Chơi'&&+gp.n===d.choi,gp);
 await ev(()=>{S.modal=null;render()});await W(60);

 /* ---------- 2. Mã học sinh STT-BT / STT-CN ---------- */
 const c=await ev(()=>{const ks=DB.kids,bad=ks.filter(k=>!/^\d{3}-(BT|CN)$/.test(kcode(k)));
  const bt=ks.find(k=>k.bt),cn=ks.find(k=>!k.bt);
  return{n:ks.length,bad:bad.map(k=>k.id+':'+kcode(k)),bt:bt&&[bt.id,kcode(bt)],cn:cn&&[cn.id,kcode(cn)],
   uniq:new Set(ks.map(kcode)).size===ks.length,
   ex:{a:kcode({id:'hs012',bt:true}),b:kcode({id:'hs007',bt:false}),c:kcode({id:'hs100',bt:true}),d:kcode({id:'hs001'})}}});
 ok('mọi bé đều có mã dạng 3 chữ số-BT hoặc 3 chữ số-CN, không trùng nhau',c.bad.length===0&&c.uniq,c);
 ok('mẫu: hs012 bán trú = 012-BT; hs007 1-1 = 007-CN; hs100 = 100-BT; không rõ thì CN',c.ex.a==='012-BT'&&c.ex.b==='007-CN'&&c.ex.c==='100-BT'&&c.ex.d==='001-CN',c.ex);
 ok('bé bán trú có hậu tố BT, bé chỉ 1-1 có hậu tố CN, số khớp mã hồ sơ',c.bt&&c.cn&&c.bt[1]===c.bt[0].replace(/^hs/,'')+'-BT'&&c.cn[1]===c.cn[0].replace(/^hs/,'')+'-CN',c);
 ok('mã nội bộ k.id vẫn là hsNNN (dữ liệu cũ không đổi)',await ev(()=>DB.kids.every(k=>/^hs\d{3}$/.test(k.id))));

 await page.click('.nav button:has-text("Học sinh")');await W(150);
 const lst=await ev(()=>({head:[...document.querySelectorAll('table th')].map(t=>t.textContent).slice(0,2),codes:[...document.querySelectorAll('table tr.k td:first-child')].map(t=>t.textContent),
  raw:[...document.querySelectorAll('table tr.k td:first-child')].filter(t=>/^hs\d/.test(t.textContent)).length}));
 ok('danh sách học sinh: cột Mã hiện STT-BT/STT-CN',lst.codes.length>0&&lst.codes.every(t=>/^\d{3}-(BT|CN)$/.test(t))&&lst.raw===0,lst);
 /* tìm theo mã */
 const find=await ev(()=>{const k=DB.kids.find(x=>x.bt&&x.st==='dang');S.hs.q=kcode(k).toLowerCase();S.pg.hs=1;render();
  const rows=[...document.querySelectorAll('table tr.k td:first-child')].map(t=>t.textContent);
  const k2=DB.kids.find(x=>!x.bt&&x.st==='dang');S.hs.q='-cn';S.pg.hs=1;render();
  const rows2=[...document.querySelectorAll('table tr.k td:first-child')].map(t=>t.textContent);S.hs.q='';S.pg.hs=1;render();
  return{want:kcode(k),rows,rows2,k2:!!k2}});
 ok('gõ mã (ví dụ 012-bt) vào ô tìm kiếm ra đúng bé; gõ "-cn" ra các bé 1-1',find.rows.includes(find.want)&&find.rows.length>=1&&find.rows2.length>0&&find.rows2.every(t=>/-CN$/.test(t)),find);
 /* hồ sơ bé: tiêu đề cửa sổ */
 const ttl=await ev(()=>{const k=DB.kids.find(x=>x.bt);S.modal={t:'hs',id:k.id,tab:'tt'};render();return{want:kcode(k),txt:document.querySelector('.mdc h2').textContent}});
 ok('cửa sổ hồ sơ bé ghi mã STT-BT trong tiêu đề',ttl.txt.includes(ttl.want)&&!/hs\d{3}/.test(ttl.txt),ttl);
 await ev(()=>{S.modal=null;render()});await W(60);

 /* bé mới thêm: mã theo hình thức */
 const mk=await ev(()=>{const base=Math.max(...DB.kids.map(x=>+x.id.slice(2)));
  const add=(bt)=>{const k={id:'hs'+String(Math.max(...DB.kids.map(x=>+x.id.slice(2)))+1).padStart(3,'0'),n:'Thử '+(bt?'BT':'CN'),bt,st:'dang',pn:'P',pp:'0905000000',dob:'2021-01-01',sd:TODAY,gr:bt?'Ong non':''};DB.kids.push(k);return kcode(k)};
  const a=add(true),c2=add(false);return{base,a,c2}});
 ok('bé mới: STT nối tiếp, hậu tố theo hình thức',mk.a===String(mk.base+1).padStart(3,'0')+'-BT'&&mk.c2===String(mk.base+2).padStart(3,'0')+'-CN',mk);
 await ev(()=>{DB.kids=DB.kids.filter(k=>!/^Thử (BT|CN)$/.test(k.n))});

 /* ---------- 3. Xuất Excel dùng mã mới (cần vai trò xem tiền: Trưởng Trung tâm) ---------- */
 await b.close();
 const o2=await open();const P2=o2.page,ev2=(f,a)=>P2.evaluate(f,a);
 await login(P2,'tt');
 await ev2(()=>{window.__x=[];window.exportXLSX=async(name,sheets)=>{window.__x.push({name,sheets})};
  S.dd={tab:'sheet',date:WD,m:WD.slice(0,7),q:'',pr:'',fl:'',gv:'',kid:'',un:false};S.hp={tab:'tq',m:CM,st:'',q:''}});
 const ex=await ev2(async()=>{const out={};
  try{ACT.ddxl()}catch(e){out.ddErr=String(e)}
  try{ACT.hpxl()}catch(e){out.hpErr=String(e)}
  await new Promise(r=>setTimeout(r,80));
  out.names=__x.map(x=>x.name);
  const colA=__x.flatMap(x=>x.sheets.filter(s=>s.rows[0]&&/^Mã( bé)?$/.test(s.rows[0][0]||s.rows[0][1]||'')).flatMap(s=>s.rows.slice(1).map(r=>r[0])));
  const led=__x.flatMap(x=>x.sheets.filter(s=>s.rows[0]&&s.rows[0][1]==='Mã bé').flatMap(s=>s.rows.slice(1).map(r=>r[1])));
  out.n=colA.length;out.raw=colA.filter(v=>/^hs\d/.test(String(v))).length;out.okCodes=colA.filter(v=>/^\d{3}-(BT|CN)$/.test(String(v))).length;
  out.ledN=led.length;out.ledRaw=led.filter(v=>/^hs\d/.test(String(v))).length;
  return out});
 ok('xuất Excel Bảng chấm công và Công nợ: cột Mã là STT-BT/CN, không còn hsNNN',ex.names.length===2&&!ex.ddErr&&!ex.hpErr&&ex.n>0&&ex.raw===0&&ex.okCodes>0&&ex.ledRaw===0,ex);
 const tbx=await ev2(async()=>{__x.length=0;S.tb=S.tb||{};const f=ACT.tbxl||ACT.tbxlsx;return{has:!!f}});
 /* thống kê tổng hợp: gọi hàm xuất nếu có */
 const tb=await ev2(async()=>{const k=Object.keys(ACT).find(n=>/^tb.*x/i.test(n));if(!k)return{skip:true};__x.length=0;try{ACT[k]()}catch(e){return{err:String(e)}}await new Promise(r=>setTimeout(r,80));
  const s=__x.flatMap(x=>x.sheets).filter(s=>s.rows[0]&&s.rows[0][0]==='Mã'&&s.rows[0][1]==='Họ tên'&&s.rows[0][2]==='Tuổi');
  return{k,sheets:s.length,raw:s.flatMap(x=>x.rows.slice(1).map(r=>r[0])).filter(v=>/^hs\d/.test(String(v))).length}});
 ok('xuất Excel Thống kê: sheet Học sinh dùng mã mới',tb.skip||(tb.sheets>=1&&tb.raw===0),tb);
 /* xem nhanh các trang nhân viên: không còn hiện mã hồ sơ thô hsNNN trên màn hình */
 const raw=[];
 const labs=await ev2(()=>[...document.querySelectorAll('.nav button')].map(b=>b.textContent.trim()).filter(Boolean));
 for(const lb of labs){
  if(!(await P2.$('.nav button:has-text("'+lb.replace(/"/g,'')+'")')))continue;
  await P2.click('.nav button:has-text("'+lb.replace(/"/g,'')+'")');await P2.waitForTimeout(120);
  const t=await ev2(()=>(document.querySelector('main')||document.body).innerText);const m=t.match(/\bhs\d{3}\b/g);if(m)raw.push(lb+':'+m.slice(0,3).join(','));}
 ok('mọi trang trong thanh điều hướng (Trưởng Trung tâm) không hiện mã thô hsNNN',raw.length===0&&labs.length>=8,{raw,labs:labs.length});
 ok('không có lỗi JS (phiên Trưởng Trung tâm)',o2.errs.length===0,o2.errs);
 await o2.b.close();

 ok('không có lỗi JS (phiên Quản lý)',errs.length===0,errs);
 console.log(passes+' PASS, '+fails+' FAIL');process.exit(fails?1:0)})();
