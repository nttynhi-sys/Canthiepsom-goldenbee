const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:1366,h:900,dpr:1});
 await login(page,'gv');
 await page.click('.nav button:has-text("Ngân hàng mục tiêu")');await page.waitForTimeout(100);
 await page.selectOption('#bk-a','1');await page.waitForTimeout(80);
 console.log('note:',await page.$eval('main .card > .acts .sm.mu, main .card .acts .sm.mu',e=>e.textContent));
 await page.screenshot({path:'shots/f1-age-note.png',clip:{x:250,y:380,width:1100,height:180}});
 console.log('ERRS',errs.length);await b.close();
})();
