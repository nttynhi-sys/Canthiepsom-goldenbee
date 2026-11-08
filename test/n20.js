const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:1366,h:900,dpr:1});
 const log=(...a)=>console.log(...a);
 const toast=async()=>page.evaluate(()=>{const t=document.querySelector('.toast');return t?t.textContent:''});
 await login(page,'gv');
 log('nav',JSON.stringify(await page.$$eval('.nav button',e=>e.map(x=>x.textContent.trim().replace(/\s+/g,' ')))));
 await page.click('.nav button:has-text("Ngân hàng mục tiêu")');await page.waitForTimeout(150);
 log('title',await page.$eval('h1',e=>e.textContent),'| active nav',await page.$eval('.nav button.on',e=>e.textContent.trim()));
 await page.screenshot({path:'shots/g4-bank.png'});
 // chưa chọn bé -> thêm báo lỗi
 await page.click('[data-a="lfdom"][data-v="nh"]');await page.waitForTimeout(60);
 log('domain Hiểu items',await page.$eval('.acts .sm b',e=>e.textContent));
 await page.locator('.gi input[type=checkbox]').nth(0).check();await page.waitForTimeout(40);
 log('count',await page.$eval('#bk-cnt',e=>e.textContent));
 await page.click('[data-a="bkok"]');await page.waitForTimeout(60);log('no kid ->',await toast(),'| modal',await page.evaluate(()=>S.modal));
 // chọn bé
 const kid=await page.evaluate(()=>bkKids()[1].id);const kn=await page.evaluate(k=>kidBy(k).n,kid);
 await page.selectOption('#bk-k',kid);await page.waitForTimeout(80);
 log('kid chosen',kn,'| sel after kid change',await page.$eval('#bk-cnt',e=>e.textContent),'| hint',await page.$eval('.bk-w .sm',e=>e.textContent));
 // đổi lĩnh vực, tick nhiều mục tiêu ở 2 lĩnh vực
 const before=await page.evaluate(k=>kidPlans(k).filter(p=>p.s!=='dat').length,kid);
 const pick=async(n)=>{const cbs=page.locator('.gi:not(.tk) input[type=checkbox]');for(let i=0;i<n;i++){await cbs.nth(i).check();await page.waitForTimeout(25)}};
 await page.click('[data-a="lfdom"][data-v="nh"]');await page.waitForTimeout(60);await pick(2);
 await page.click('[data-a="lfdom"][data-v="xh"]');await page.waitForTimeout(60);await pick(1);
 log('count after 2 domains',await page.$eval('#bk-cnt',e=>e.textContent),'| sel',await page.evaluate(()=>S.bk.sel.map(x=>x).join(',')));
 // chuyển dài hạn
 await page.selectOption('#bk-hz','d');
 await page.screenshot({path:'shots/g5-bank-sel.png'});
 await page.click('[data-a="bkok"]');await page.waitForTimeout(80);
 log('toast',await toast());
 log('modal',await page.evaluate(()=>S.modal&&S.modal.t+'/'+S.modal.tab),'| plan count',before,'->',await page.evaluate(k=>kidPlans(k).filter(p=>p.s!=='dat').length,kid),'| horizons of 3 newest',await page.evaluate(k=>DB.plans.filter(p=>p.k===k).slice(-3).map(p=>p.h).join(','),kid));
 await page.screenshot({path:'shots/g6-plan-after.png'});
 // mở picker từ kế hoạch khi trang ngân hàng vẫn ở phía sau: ids không trùng
 await page.click('[data-a="pkopen"]');await page.waitForSelector('.gp-f');
 const dupIds=await page.evaluate(()=>{const m={};document.querySelectorAll('[id]').forEach(e=>m[e.id]=(m[e.id]||0)+1);return Object.keys(m).filter(k=>m[k]>1)});
 log('duplicate ids with bank page behind picker:',JSON.stringify(dupIds));
 await page.fill('.mdc #lf-q','gọi tên');await page.waitForTimeout(60);log('picker search keeps focus:',await page.evaluate(()=>document.activeElement&&document.activeElement.id),'| results',await page.$eval('.mdc .acts .sm b',e=>e.textContent));
 await page.click('[data-a="gpback"]');await page.waitForTimeout(40);
 await page.click('[data-a="mx"]').catch(()=>{});await page.evaluate(()=>{S.modal=null;render()});
 // đã có -> disabled
 log('taken items on page now:',await page.$$eval('.gi.tk',e=>e.length));
 // tab trong Học sinh
 await page.click('.nav button[data-v="hs"]');await page.click('.tab:has-text("Ngân hàng mục tiêu")');await page.waitForTimeout(80);
 log('hs tab bank shows select kid:',await page.$$eval('#bk-k',e=>e.length),'| kid kept',await page.$eval('#bk-k',e=>e.value)===kid);
 // GV dashboard shortcut
 await page.click('.nav button[data-v="dash"]');await page.waitForTimeout(60);
 log('dash shortcut btn',await page.$$eval('[data-a="nav"][data-v="mt"]:not(.nav button)',e=>e.map(x=>x.textContent)));
 // form ghi buổi: nút theo lĩnh vực
 const k2=await page.evaluate(()=>myKids().find(k=>k.st==='dang').id);
 await page.evaluate(k=>{ACT.senew(k+'|'+WD);render()},k2);await page.waitForSelector('.si');
 await page.click('.mdc [data-a="sedom"][data-v="cy"]').catch(()=>{});await page.waitForTimeout(40);
 log('session picker buttons',JSON.stringify(await page.$$eval('.mdc [data-a="sepick"]',e=>e.map(x=>x.textContent.trim()))));
 await page.click('.mdc [data-a="sepick"][data-v="cy"]');await page.waitForSelector('.gp-f');
 log('picker opened pre-filtered:',await page.evaluate(()=>S.modal.f.dom),'| active chip',await page.$eval('.mdc .chip.on',e=>e.textContent));
 await page.screenshot({path:'shots/g7-picker-dom.png'});
 log('ERRS',errs.length);errs.slice(0,6).forEach(e=>console.log(e));
 await b.close();
})();
