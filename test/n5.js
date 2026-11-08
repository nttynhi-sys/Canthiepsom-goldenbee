const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({dpr:1,h:1000});
 await login(page,'ql');
 await page.click('.nav button[data-v="hs"]');
 await page.click('tr.k >> nth=0');await page.waitForSelector('.mdc');
 await page.click('.mdc .tab:has-text("Tiến bộ")');
 await page.waitForTimeout(100);
 const H=await page.$eval('.mdl',e=>e.scrollHeight);console.log('modal scrollHeight',H);
 for(let i=0;i<3;i++){await page.$eval('.mdl',(e,y)=>{e.scrollTop=y},1000*(i)+(i?-60:0));await page.waitForTimeout(60);await page.screenshot({path:`o8${'abc'[i]}.png`})}
 await b.close();
 console.log('ERRS',errs.length);errs.slice(0,15).forEach(e=>console.log(e));
})();
