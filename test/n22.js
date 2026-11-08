const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:1366,h:900,dpr:1});
 const log=(...a)=>console.log(...a);
 await login(page,'gv');
 await page.click('.nav button:has-text("Ngân hàng mục tiêu")');await page.waitForTimeout(100);
 // chọn bé 5 tuổi trở lên
 const kid=await page.evaluate(()=>bkKids().find(k=>mo(k.dob)>=60)||bkKids()[0]).then(k=>k.id);
 const kinfo=await page.evaluate(k=>{const x=kidBy(k);return x.n+' '+age(x.dob)},kid);
 await page.selectOption('#bk-k',kid);await page.waitForTimeout(80);
 log('kid',kinfo,'| lfkid buttons',await page.$$eval('[data-a="lfkid"]',e=>e.length),'| text "Theo tuổi của bé" present',await page.evaluate(()=>/Theo tuổi của bé/.test(document.body.innerText)),'| age filter after choosing kid:',JSON.stringify(await page.evaluate(()=>S.hs.lib.age)));
 const all=await page.$eval('.acts .sm b',e=>e.textContent);
 await page.selectOption('#bk-a','1');await page.waitForTimeout(80);
 log('count all',all,'-> manual developmental filter 12–24 tháng:',await page.$eval('.acts .sm b',e=>e.textContent),'| note:',await page.$eval('.acts .sm.mu',e=>e.textContent));
 await page.selectOption('#bk-a','');await page.waitForTimeout(60);
 // picker từ hồ sơ bé
 await page.evaluate(k=>{S.modal={t:'hs',id:k,tab:'kh'};render()},kid);await page.waitForSelector('.mdc');
 await page.click('[data-a="pkopen"]');await page.waitForSelector('.gp-f');
 log('picker: lfkid',await page.$$eval('.mdc [data-a="lfkid"]',e=>e.length),'| age select present',await page.$$eval('.mdc #lf-a',e=>e.length));
 // session picker
 await page.evaluate(()=>{S.modal=null;render()});
 await page.evaluate(k=>{ACT.senew(k+'|'+WD);render()},kid);await page.waitForSelector('.si');
 await page.click('.mdc [data-a="sepick"][data-v=""]');await page.waitForSelector('.gp-f');
 log('session picker: lfkid',await page.$$eval('.mdc [data-a="lfkid"]',e=>e.length),'| filters',JSON.stringify(await page.evaluate(()=>S.modal.f)));
 log('ERRS',errs.length);
 await b.close();
})();
