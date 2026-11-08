const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:1366,h:900,dpr:1});
 await login(page,'gv');
 console.log('me',await page.evaluate(()=>U.id+' '+U.name),'| view',await page.evaluate(()=>S.v));
 console.log('nav',JSON.stringify(await page.$$eval('.nav button',e=>e.map(x=>x.textContent.trim().replace(/\s+/g,' ')))));
 await page.screenshot({path:'shots/g1-dash.png'});
 await page.click('.nav button[data-v="hs"]');await page.waitForTimeout(100);
 console.log('tabs',JSON.stringify(await page.$$eval('.tabs .tab',e=>e.map(x=>x.textContent.trim()))));
 await page.screenshot({path:'shots/g2-hs.png'});
 await page.click('.tab:has-text("Ngân hàng mục tiêu")');await page.waitForTimeout(100);
 await page.screenshot({path:'shots/g3-lib.png'});
 console.log('lib text head:',(await page.evaluate(()=>document.querySelector('main').innerText)).replace(/\s+/g,' ').slice(0,600));
 console.log('ERRS',errs.length);
 await b.close();
})();
