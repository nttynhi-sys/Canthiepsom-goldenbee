const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:390,h:844,dpr:2});
 await login(page,'ql');
 const kid=await page.evaluate(()=>DB.kids.find(k=>k.st==='dang').id);
 await page.evaluate(k=>{ACT.senew(k+'|'+WD);render()},kid);await page.waitForTimeout(150);
 const m=await page.evaluate(()=>{const f=document.querySelector('.gp-f').getBoundingClientRect(),l=document.querySelector('.mdl'),c=document.querySelector('.mdc').getBoundingClientRect();return{footBottom:f.bottom,footTop:f.top,vh:innerHeight,mdlPadB:getComputedStyle(l).paddingBottom,mdlScroll:l.scrollTop,cardBottom:c.bottom,cardH:c.height}});
 console.log(JSON.stringify(m));
 // scroll to the end and measure again
 await page.evaluate(()=>{const l=document.querySelector('.mdl');l.scrollTop=l.scrollHeight});await page.waitForTimeout(60);
 console.log('end',JSON.stringify(await page.evaluate(()=>{const f=document.querySelector('.gp-f').getBoundingClientRect(),c=document.querySelector('.mdc').getBoundingClientRect();return{footBottom:f.bottom,cardBottom:c.bottom,vh:innerHeight}})));
 await b.close();
})();
