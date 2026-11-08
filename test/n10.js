const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({h:1000});
 const log=(...a)=>console.log(...a);
 await login(page,'gv');
 const me=await page.evaluate(()=>({id:U.id,name:U.name,kids:myKids().length,own:myKids().filter(k=>k.gv===U.id).length}));log('GV',JSON.stringify(me));
 // dashboard widget
 await page.click('.nav button[data-v="dash"]');
 log('dash card rows',await page.$$eval('.card:has(h2:text-matches("Ghi buổi can thiệp")) .rw',e=>e.length));
 const btn=page.locator('.card:has(h2:text-matches("Ghi buổi can thiệp")) .rw .btn').first();
 if(await btn.count()){await btn.click();await page.waitForSelector('.si');log('form from dash: modal',await page.evaluate(()=>S.modal.t+' '+S.modal.date+' '+S.modal.k));await page.click('[data-a="seclose"]');log('closed',await page.evaluate(()=>S.modal))}
 // hs views
 await page.click('.nav button[data-v="hs"]');
 log('hs rows',await page.$$eval('tr.k',e=>e.length));
 log('add-goal btn on lib tab?');
 await page.click('.tab:has-text("Ngân hàng mục tiêu")');
 log('  btn cgnew',await page.$$eval('[data-a="cgnew"]',e=>e.length),'cgedit',await page.$$eval('[data-a="cgedit"]',e=>e.length));
 await page.click('.tab:has-text("Buổi can thiệp")');
 const hub=await page.evaluate(()=>({kpis:[...document.querySelectorAll('.kpi .big')].map(e=>e.textContent),rows:document.querySelectorAll('.card table tbody tr').length,ownOnly:[...document.querySelectorAll('.card table tbody tr td:nth-child(3)')].every(td=>td.textContent.trim()===given(U.name).trim()||true)}));log('hub',JSON.stringify(hub));
 await page.screenshot({path:'r1-hub-gv.png'});
 // quyền: kid không thuộc GV
 const other=await page.evaluate(()=>{const k=DB.kids.find(x=>!canKid(x.id));ACT.senew(k.id+'|'+WD);return{modal:S.modal&&S.modal.t,toast:document.querySelector('.toast')&&document.querySelector('.toast').textContent}});log('other kid',JSON.stringify(other));
 // buổi cũ hơn 14 ngày của chính GV: không có nút Sửa
 const old=await page.evaluate(()=>{const s=DB.sess.find(x=>x.st==='xong'&&canKid(x.k)&&x.date<addD(TODAY,-20)&&kidBy(x.k).gv===U.id);return{id:s&&s.id,canEdit:s&&canEditSess(s),recent:DB.sess.filter(x=>canKid(x.k)&&x.date>=addD(TODAY,-10)&&x.st==='xong'&&(x.by===U.id)).slice(0,1).map(x=>canEditSess(x))}});log('old session',JSON.stringify(old));
 // mở hồ sơ bé của GV: ghi buổi, lưu, mastery
 await page.click('.tab:has-text("Danh sách") , .tab:has-text("Học sinh của tôi")');
 await page.click('tr.k >> nth=0');await page.waitForSelector('.mdc');
 await page.click('.mdc .tab:has-text("Kế hoạch mục tiêu")');
 log('plan buttons: pkopen',await page.$$eval('[data-a="pkopen"]',e=>e.length),'senew',await page.$$eval('[data-a="senew"]',e=>e.length));
 // ghi buổi với kết quả tương lai -> bị chặn
 await page.click('.mdc [data-a="senew"]');await page.waitForSelector('.si');
 await page.fill('#se-d',await page.evaluate(()=>addD(TODAY,3)));await page.locator('.si').nth(0).locator('.tb').nth(0).click();
 await page.click('[data-a="sesave"]');await page.waitForTimeout(60);
 log('future+results -> still form?',await page.evaluate(()=>S.modal.t),'toast:',await page.evaluate(()=>document.querySelector('.toast').textContent));
 // xóa kết quả, lưu thành kế hoạch
 await page.locator('.si').nth(0).locator('[data-a="setrc"]').click();
 await page.click('[data-a="sesave"]');await page.waitForTimeout(60);
 log('plan-only saved -> modal',await page.evaluate(()=>S.modal&&S.modal.t+':'+S.modal.tab),'st of newest',await page.evaluate(()=>{const k=S.modal.id;const s=DB.sess.filter(x=>x.k===k).sort((a,c)=>a.date<c.date?1:-1)[0];return s.date+' '+s.st}));
 console.log('ERRS',errs.length);errs.slice(0,8).forEach(e=>console.log(e));
 await b.close();
})();
