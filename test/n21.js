const {open,login}=require('./h.js');
(async()=>{
 // phone, GV
 let {b,page,errs}=await open({w:390,h:844,dpr:2});
 await login(page,'gv');
 await page.evaluate(()=>{go('mt');render()});await page.waitForTimeout(150);
 const kid=await page.evaluate(()=>bkKids()[0].id);
 await page.selectOption('#bk-k',kid);await page.waitForTimeout(60);
 await page.click('[data-a="lfdom"][data-v="nd"]');await page.waitForTimeout(60);
 const cbs=page.locator('.gi:not(.tk) input[type=checkbox]');await cbs.nth(0).check();await cbs.nth(1).check();await page.waitForTimeout(40);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'shots/p1-bank-top.png'});
 await page.evaluate(()=>window.scrollBy(0,700));await page.waitForTimeout(80);
 await page.screenshot({path:'shots/p2-bank-mid.png'});
 console.log('phone overflow',await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),'foot bottom',await page.evaluate(()=>Math.round(document.querySelector('.bk-f').getBoundingClientRect().bottom)),'vh',844);
 console.log('ERRS',errs.length);await b.close();
 // dark, desktop, lead
 ({b,page,errs}=await open({w:1366,h:900,dpr:1,dark:true}));
 await login(page,'ql');
 await page.click('.nav button:has-text("Ngân hàng mục tiêu")');await page.waitForTimeout(120);
 await page.click('[data-a="lfdom"][data-v="vth"]');await page.waitForTimeout(80);
 console.log('lead nav label',await page.$eval('.nav button.on',e=>e.textContent.trim()),'| kids in select',await page.$$eval('#bk-k option',o=>o.length-1),'| edit btns on cu items',await page.$$eval('[data-a="cgedit"]',e=>e.length),'| header btn',await page.$$eval('.top [data-a="cgnew"]',e=>e.length));
 await page.selectOption('#bk-s','cu');await page.waitForTimeout(60);
 console.log('cu items',await page.$eval('.acts .sm b',e=>e.textContent),'edit btns',await page.$$eval('[data-a="cgedit"]',e=>e.length));
 await page.click('[data-a="lfclr"]');await page.waitForTimeout(60);
 await page.screenshot({path:'shots/d1-bank-dark.png'});
 console.log('ERRS',errs.length);await b.close();
})();
