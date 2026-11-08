const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:390,h:844,dpr:2});
 await login(page,'ph');
 await page.evaluate(()=>{go('cp',{cp:{tab:'tb'}});render()});await page.waitForTimeout(250);
 await page.screenshot({path:'shots/z-parent-tb-1.png'});
 await page.evaluate(()=>window.scrollBy(0,820));await page.waitForTimeout(100);
 await page.screenshot({path:'shots/z-parent-tb-2.png'});
 await page.evaluate(()=>window.scrollBy(0,820));await page.waitForTimeout(100);
 await page.screenshot({path:'shots/z-parent-tb-3.png'});
 console.log('overflow',await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),'ERRS',errs.length);
 await b.close();
})();
