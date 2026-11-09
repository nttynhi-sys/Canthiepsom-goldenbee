const {open,login}=require('./h.js');
let fails=0;const ok=(c,m,x)=>{if(!c){fails++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x))}else console.log('ok  ',m)};
(async()=>{
 const {b,page,errs}=await open({w:1366,h:900,dpr:1});
 await login(page,'gv');
 // ---- dữ liệu nạp vào bộ nhớ ----
 const d=await page.evaluate(()=>{
  const vb=LIBI.filter(i=>i.s==='vb');
  const per={};vb.forEach(i=>{per[i.sk]=per[i.sk]||{ms:0,st:0};per[i.sk][i.st?'st':'ms']++});
  const dom={};vb.forEach(i=>dom[i.d]=(dom[i.d]||0)+1);
  const nxt=id=>{const n=nextOf(id);return n?n.id:null};
  return{total:LIBI.length,vb:vb.length,ms:vb.filter(i=>!i.st).length,st:vb.filter(i=>i.st).length,per,dom,
   keys:Object.keys(LSRC),ids:new Set(LIBI.map(i=>i.id)).size,
   undef:vb.filter(i=>!i.n||/undefined|null/.test(i.n+i.t+i.a)).length,
   heads:[...new Set(vb.map(i=>i.t))],ages:[...new Set(vb.map(i=>i.a+'|'+JSON.stringify(i.m)))],
   n1:nxt('vb:YC1a'),n2:nxt('vb:YC1d'),n3:nxt('vb:YC1'),n4:nxt('vb:YC15'),n5:nxt('vb:TOAN15'),n6:nxt('vb:GT2'),n7:nxt('vb:GT3'),
   n8:nxt('ab:A1'),n9:nxt('ed:GTN.1.1'),
   x1:GL['vb:YC1'].x,x2:GL['vb:YC4'].x,x3:GL['vb:YC1a'].x,
   gm:LIBI.filter(i=>i.s==='vb'&&i.sk==='GM'&&!i.st&&!i.x).map(i=>i.c),
   dirKeys:Object.fromEntries(Object.entries(LVBD).map(([k,v])=>[k,Object.keys(v).length])),
   vbc:VBC['vb:YC1'],vbc2:VBC['vb:GT2'],
   gSrc:gSrc(GL['vb:YC1a']),goalOf:!!goalOf('vb:CXH7')}});
 console.log(JSON.stringify(d));
 ok(d.total===1599+900+69,'tổng mục tiêu 1.599 + 900 VB-MAPP + 69 Westby/chuỗi chơi = 2.568',d.total);
 ok(d.vb===900&&d.ms===155&&d.st===745,'VB-MAPP 900 mục: 155 mốc + 745 bước',[d.vb,d.ms,d.st]);
 ok(d.ids===d.total,'không trùng mã mục tiêu');
 ok(d.undef===0,'không có chữ undefined/null');
 ok(JSON.stringify(d.keys)===JSON.stringify(['ab','ed','vb','mn','ot','we','cp','cu']),'thứ tự bộ công cụ',d.keys);
 ok(d.dom.nd===306&&d.dom.nh===146&&d.dom.cy===115&&d.dom.xh===168&&d.dom.nt===165&&!d.dom.vt&&!d.dom.vth&&!d.dom.tl,'phân bổ lĩnh vực',d.dom);
 ok(d.heads.length===14,'14 tiêu đề kỹ năng',d.heads);
 ok(d.per.YC.ms===15&&d.per.YC.st===78&&d.per.BC.ms===10&&d.per.DOC.ms===5&&d.per.TOAN.st===24,'số mục từng trang',d.per);
 ok(d.n1==='vb:YC1b'&&d.n2==='vb:YC1'&&d.n3==='vb:YC2a'&&d.n4===null&&d.n5===null,'mục kế tiếp theo thứ tự dạy',[d.n1,d.n2,d.n3,d.n4,d.n5]);
 ok(d.n6==='vb:GT3a','mốc không có bước nhỏ nối sang mốc sau (GT2 -> GT3a)',[d.n6,d.n7]);
 ok(d.n8==='ab:A2'&&d.n9==='ed:GTN.1.2','nguồn khác giữ thứ tự cũ',[d.n8,d.n9]);
 ok(d.x1==='E'&&d.x2==='TO:60'&&d.x3==='','ký hiệu đánh giá chỉ ở mốc',[d.x1,d.x2,d.x3]);
 ok(d.gm.length===1,'đúng 1 mốc Ghép mẫu không có ký hiệu trong file gốc',d.gm);
 ok(d.dirKeys.YC===16&&d.dirKeys.PA===11&&d.dirKeys.LN===6&&d.dirKeys.FFC===10&&d.dirKeys.DOC===5,'bảng phương hướng',d.dirKeys);
 ok(d.vbc===4&&d.vbc2===undefined,'đếm bước nhỏ',[d.vbc,d.vbc2]);
 ok(d.gSrc==='VB-MAPP · YC1a'&&d.goalOf,'nhãn nguồn',d.gSrc);

 // ---- giao diện ngân hàng mục tiêu (giáo viên) ----
 await page.click('.nav button[data-v="mt"]');await page.waitForTimeout(150);
 const intro=await page.evaluate(()=>document.querySelector('main').innerText.replace(/\s+/g,' ').slice(0,420));
 console.log('intro:',intro);
 ok(/2\.568 mục tiêu/.test(intro)&&/VB-MAPP/.test(intro),'dòng giới thiệu có VB-MAPP và 2.568');
 const srcOpts=await page.$$eval('#bk-s option',e=>e.map(x=>x.textContent));
 ok(srcOpts.includes('VB-MAPP'),'ô Bộ công cụ có VB-MAPP',srcOpts);
 await page.selectOption('#bk-s','vb');await page.waitForTimeout(120);
 let cnt=await page.evaluate(()=>document.querySelector('.acts .sm b').textContent);
 ok(cnt==='900','lọc VB-MAPP: 900 mục',cnt);
 ok(await page.$('.vbp button[data-a="lfvbt"]')!==null,'có nút xem bảng phương hướng');
 const hOpts=await page.$$eval('#bk-h option',e=>e.map(x=>x.textContent));
 ok(hOpts.length===15&&hOpts[1].includes('VB-MAPP'),'tiêu đề chỉ còn VB-MAPP',hOpts.slice(0,4));
 // lĩnh vực
 await page.click('.chips .chip:has-text("Diễn đạt")');await page.waitForTimeout(100);
 cnt=await page.evaluate(()=>document.querySelector('.acts .sm b').textContent);
 ok(cnt==='306','Diễn đạt + VB-MAPP: 306',cnt);
 await page.click('.chips .chip:has-text("Tất cả lĩnh vực")');await page.waitForTimeout(100);
 // tiêu đề Yêu cầu
 const ycVal=await page.$$eval('#bk-h option',e=>{const o=e.find(x=>/^Yêu cầu · VB-MAPP/.test(x.textContent));return o?o.value:null});
 await page.selectOption('#bk-h',ycVal);await page.waitForTimeout(100);
 cnt=await page.evaluate(()=>document.querySelector('.acts .sm b').textContent);
 ok(cnt==='93','tiêu đề Yêu cầu: 93 mục',cnt);
 await page.screenshot({path:'shots/vb1-list.png'});
 // chi tiết mốc
 await page.click('.gi:nth-child(1) summary');await page.waitForTimeout(80);
 const det1=await page.evaluate(()=>document.querySelector('.gi:nth-child(1)').innerText.replace(/\s+/g,' '));
 console.log('chi tiết YC1:',det1);
 ok(/Mốc 1/.test(det1)&&/Có 4 bước nhỏ \(1a đến 1d\)/.test(det1)&&/Kiểm tra hoặc quan sát \(E\)/.test(det1)&&/Phương hướng can thiệp ở mốc 1:/.test(det1)&&/Khi bé chưa đạt mốc nào/.test(det1)&&/Cấp độ 1 · 0–18 tháng/.test(det1),'chi tiết mốc 1');
 await page.click('.gi:nth-child(2) summary');await page.waitForTimeout(80);
 const det2=await page.evaluate(()=>document.querySelector('.gi:nth-child(2)').innerText.replace(/\s+/g,' '));
 console.log('chi tiết YC1a:',det2);
 ok(/Bước 1a/.test(det2)&&/Bước nhỏ 1a của mốc 1: Phát ra 2 yêu cầu/.test(det2)&&/Phương hướng can thiệp ở mốc 1/.test(det2),'chi tiết bước 1a');
 // lọc tuổi: 12–24 tháng gồm cấp độ 1 và 2
 await page.selectOption('#bk-h','');await page.waitForTimeout(80);
 await page.selectOption('#bk-a','1');await page.waitForTimeout(100);
 const ages=await page.evaluate(()=>{const a=libFind(LF());return[...new Set(a.filter(i=>i.s==='vb').map(i=>i.a))]});
 ok(JSON.stringify(ages.sort())===JSON.stringify(['Cấp độ 1 · 0–18 tháng','Cấp độ 2 · 18–30 tháng']),'lọc 12–24 tháng: cấp độ 1 và 2',ages);
 await page.selectOption('#bk-a','3');await page.waitForTimeout(100);
 const ages3=await page.evaluate(()=>{const a=libFind(LF());return[...new Set(a.filter(i=>i.s==='vb').map(i=>i.a))]});
 ok(JSON.stringify(ages3)===JSON.stringify(['Cấp độ 3 · 30–48 tháng']),'lọc 36–48 tháng: cấp độ 3',ages3);
 await page.selectOption('#bk-a','4');await page.waitForTimeout(100);
 const ages4=await page.evaluate(()=>libFind(LF()).filter(i=>i.s==='vb').length);
 ok(ages4===0,'lọc 48–72 tháng: VB-MAPP không có',ages4);
 await page.selectOption('#bk-a','');await page.waitForTimeout(80);
 // tìm kiếm
 await page.fill('#bk-q','PECS');await page.waitForTimeout(150);
 const q=await page.evaluate(()=>libFind(LF()).map(i=>i.id));
 ok(q.includes('vb:YC1'),'tìm “PECS” ra mốc YC1',q.slice(0,5));
 await page.fill('#bk-q','');await page.waitForTimeout(100);

 // ---- bảng phương hướng ----
 await page.click('.vbp button[data-a="lfvbt"]');await page.waitForTimeout(100);
 ok(await page.$('#bk-vd')!==null,'mở bảng phương hướng');
 let rows=await page.$$eval('.vbp .note .rw',e=>e.length);
 ok(rows===16,'kỹ năng mặc định Yêu cầu: 16 dòng (điểm 0 đến mốc 15)',rows);
 await page.selectOption('#bk-vd','PA');await page.waitForTimeout(100);
 rows=await page.$$eval('.vbp .note .rw',e=>e.length);
 const still=await page.$('#bk-vd');
 ok(rows===11&&still!==null,'Phát âm: 11 dòng, bảng không tự đóng khi đổi kỹ năng',rows);
 await page.selectOption('#bk-vd','LN');await page.waitForTimeout(100);
 rows=await page.$$eval('.vbp .note .rw',e=>e.length);ok(rows===6,'Lời nói tự phát: 6 dòng',rows);
 const t0=await page.evaluate(()=>document.querySelector('.vbp .note .rw').innerText.replace(/\s+/g,' '));
 console.log('LN điểm 0:',t0);
 ok(/Điểm 0/.test(t0)&&/tăng cường cơ phát âm/i.test(t0),'nội dung dòng điểm 0 của Lời nói tự phát');
 await page.screenshot({path:'shots/vb2-panel.png'});
 await page.click('.vbp button[data-a="lfvbt"]');await page.waitForTimeout(80);
 ok(await page.$('#bk-vd')===null,'đóng bảng phương hướng');

 // ---- chọn bé và thêm vào kế hoạch ----
 const kid=await page.evaluate(()=>{const ks=bkKids();return ks[0]?ks[0].id:''});
 await page.selectOption('#bk-k',kid);await page.waitForTimeout(100);
 await page.selectOption('#bk-s','vb');await page.waitForTimeout(80);
 const before=await page.evaluate(k=>kidPlans(k).length,kid);
 await page.check('#bkc-vb\\:YC1');
 await page.check('#bkc-vb\\:YC1a').catch(()=>{});
 const sel=await page.evaluate(()=>S.bk.sel.slice());
 console.log('đã chọn',sel);
 await page.click('[data-a="bkok"]');await page.waitForTimeout(200);
 const after=await page.evaluate(k=>({n:kidPlans(k).length,vb:kidPlans(k).filter(p=>p.g.startsWith('vb:')).map(p=>p.g)}),kid);
 ok(after.n>before&&after.vb.includes('vb:YC1'),'thêm mục tiêu VB-MAPP vào kế hoạch của bé',after);
 // kế hoạch hiển thị tên + nguồn
 const planTxt=await page.evaluate(k=>{S.modal={t:'hs',id:k,tab:'kh'};render();return document.querySelector('.mdc')?document.querySelector('.mdc').innerText.replace(/\s+/g,' '):''},kid);
 ok(/VB-MAPP · YC1/.test(planTxt),'kế hoạch của bé ghi “VB-MAPP · YC1”',planTxt.slice(0,200));
 await page.screenshot({path:'shots/vb3-plan.png'});
 await page.evaluate(()=>{S.modal=null;render()});

 // ---- điện thoại ----
 const m=await open({w:390,h:844,dpr:1});
 await login(m.page,'gv');await m.page.evaluate(()=>{go('mt');render()});await m.page.waitForTimeout(150);
 await m.page.selectOption('#bk-s','vb');await m.page.waitForTimeout(80);
 await m.page.click('.vbp button[data-a="lfvbt"]');await m.page.waitForTimeout(100);
 await m.page.selectOption('#bk-vd','FFC');await m.page.waitForTimeout(80);
 const ov=await m.page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
 ok(ov.sw<=ov.cw,'điện thoại 390px không tràn ngang',ov);
 await m.page.screenshot({path:'shots/vb4-mobile.png'});
 ok(m.errs.length===0,'điện thoại không lỗi JS',m.errs);
 await m.b.close();
 ok(errs.length===0,'máy tính không lỗi JS',errs);
 console.log(fails?('FAILED '+fails):'ALL PASS');
 await b.close();
})();
