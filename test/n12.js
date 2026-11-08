const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({h:1000});
 const log=(...a)=>console.log(...a);
 const toast=async()=>page.evaluate(()=>{const t=document.querySelector('.toast');return t?t.textContent:''});
 await login(page,'ql');
 // ---- mục tiêu của Trung tâm (CRUD)
 await page.click('.nav button[data-v="hs"]');await page.click('.tab:has-text("Ngân hàng mục tiêu")');
 const base=await page.evaluate(()=>DB.cg.length);
 await page.click('[data-a="cgnew"]');await page.waitForSelector('#cgf');
 await page.selectOption('#cg-d','xh');await page.fill('#cg-t','Trò chơi nhóm');await page.fill('#cg-n','Chờ đến lượt trong trò chơi nhóm 3 bạn');await page.fill('#cg-o','Bé đợi và chuyển vật cho bạn kế tiếp.');
 await page.click('#cgf [type=submit]');await page.waitForTimeout(60);
 log('cg added',base,'->',await page.evaluate(()=>DB.cg.length),'toast',await toast());
 await page.fill('#bk-q','chờ đến lượt');await page.waitForTimeout(60);
 log('search new goal hits',await page.$eval('.acts .sm b',e=>e.textContent),'edit btn',await page.$$eval('[data-a="cgedit"]',e=>e.length));
 await page.selectOption('#bk-s','cu');log('filter source cu ->',await page.$eval('.acts .sm b',e=>e.textContent));
 await page.click('[data-a="cgedit"]');await page.waitForSelector('#cgf');
 await page.fill('#cg-n','Chờ đến lượt trong trò chơi nhóm 4 bạn');await page.click('#cgf [type=submit]');await page.waitForTimeout(60);
 log('edited ->',await page.evaluate(()=>DB.cg.find(c=>/4 bạn/.test(c.n))?'ok':'missing'));
 // dùng mục tiêu tự thêm trong kế hoạch của bé rồi xóa -> hiển thị "đã xóa"
 const cid=await page.evaluate(()=>{const c=DB.cg.find(c=>/4 bạn/.test(c.n));const k=DB.kids.find(k=>k.st==='dang');addPlanItem(k.id,'cu:'+c.id,'n');return c.id+'|'+k.id});
 const [cg,kid]=cid.split('|');
 await page.click('[data-a="cgedit"]');await page.waitForSelector('#cgf');await page.click('[data-a="cgdel"]');await page.waitForTimeout(60);
 log('ask modal text:',(await page.$eval('.mdc',e=>e.innerText)).replace(/\n+/g,' | ').slice(0,200));
 await page.click('[data-a="askno"]');await page.waitForTimeout(40);log('cancel -> modal',await page.evaluate(()=>S.modal&&S.modal.t),'cg still',await page.evaluate(id=>!!DB.cg.find(c=>c.id===id),cg));
 await page.click('[data-a="cgdel"]');await page.click('[data-a="askyes"]');await page.waitForTimeout(60);
 log('deleted ->',await page.evaluate(id=>!!DB.cg.find(c=>c.id===id),cg),'plan name for orphan:',await page.evaluate(k=>gName(DB.plans.find(p=>p.k===k&&p.g.startsWith('cu:')).g),kid));
 await page.evaluate(k=>{DB.plans=DB.plans.filter(p=>!(p.k===k&&p.g.startsWith('cu:')))},kid);
 // ---- xóa buổi: hủy quay lại; xác nhận xóa
 await page.click('.tab:has-text("Buổi can thiệp")');await page.waitForTimeout(40);
 await page.click('.card .sess .btn:has-text("Xem") >> nth=0');await page.waitForSelector('.mdc');
 const sid=await page.evaluate(()=>S.modal.id);
 await page.click('[data-a="sedel"]');await page.waitForTimeout(40);await page.click('[data-a="askno"]');await page.waitForTimeout(40);
 log('sess delete cancel -> back to',await page.evaluate(()=>S.modal&&S.modal.t));
 await page.click('[data-a="sedel"]');await page.click('[data-a="askyes"]');await page.waitForTimeout(60);
 log('sess deleted',await page.evaluate(id=>!DB.sess.find(s=>s.id===id),sid),'modal',await page.evaluate(()=>S.modal));
 // ---- đủ điều kiện đạt (3 buổi độc lập >=80%)
 const info=await page.evaluate(()=>{const k=DB.kids.find(k=>k.st==='dang'&&k.m11>0);const g=LIBI.find(i=>i.s==='ed'&&i.d==='nd'&&!DB.plans.some(p=>p.k===k.id&&p.g===i.id)).id;addPlanItem(k.id,g,'n');
  for(let i=0;i<3;i++){DB.sess.push({id:'t'+i,k:k.id,date:addD(TODAY,-3+i),by:k.gv||'nv04',st:'xong',dom:[gDom(g)],it:[{g,sup:'I',tr:'VVVVVVVVXX'}],note:'',home:''})}
  return{k:k.id,g,m:masteryOf(k.id,g)}});
 log('mastery',JSON.stringify({run:info.m.run,ready:info.m.ready,cnt:info.m.cnt}));
 await page.evaluate(k=>{go('hs');S.modal={t:'hs',id:k,tab:'kh'};render()},info.k);await page.waitForSelector('.mdc');
 log('note ready shown:',(await page.$$eval('.mdc .note',e=>e.map(x=>x.innerText.slice(0,60)))).join(' || '));
 const row=page.locator('.pl',{hasText:'Đủ điều kiện đạt'}).first();await row.locator('[data-a="plok"]').click();await page.waitForTimeout(60);
 log('after mark: dat plans of kid',await page.evaluate(k=>DB.plans.filter(p=>p.k===k&&p.s==='dat').length,info.k),'suggest note:',(await page.$$eval('.mdc .note',e=>e.map(x=>x.innerText.slice(0,50)))).join(' || '));
 // ---- chỉnh sửa buổi, đổi kỳ báo cáo tiến bộ
 await page.click('.mdc .tab:has-text("Tiến bộ")');
 for(const p of ['30 ngày gần đây','Từ đầu đến nay','3 tháng gần đây']){await page.click(`.chip:has-text("${p}")`);await page.waitForTimeout(40);log('period',p,'hero:',await page.$eval('.hn',e=>e.textContent),'sessions kpi:',await page.$$eval('.kpi .big',e=>e[0].textContent))}
 // tooltip
 await page.hover('.db-p1 >> nth=0');await page.waitForTimeout(50);log('tooltip:',await page.$$eval('.vtip',e=>e.map(x=>x.textContent)));
 await page.mouse.move(5,5);await page.waitForTimeout(40);log('tooltip hidden:',await page.$$eval('.vtip',e=>e.length));
 // PDF offline
 await page.click('[data-a="prpdf"]');await page.waitForTimeout(500);log('pdf toast (offline):',await toast());
 log('ERRS',errs.length);errs.slice(0,8).forEach(e=>console.log(e));
 await b.close();
})();
