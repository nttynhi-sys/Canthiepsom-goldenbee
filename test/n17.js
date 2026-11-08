const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:390,h:844,dpr:2});
 await login(page,'ql');
 const kid=await page.evaluate(()=>DB.kids.find(k=>k.st==='dang').id);
 await page.evaluate(()=>{go('hs',{hs:{tab:'bi'}});render()});await page.waitForTimeout(150);
 await page.screenshot({path:'shots/z-hub-phone.png'});
 await page.evaluate(k=>{ACT.senew(k+'|'+WD);render()},kid);await page.waitForTimeout(150);
 await page.screenshot({path:'shots/z-form-phone-top.png'});
 console.log(JSON.stringify(await page.evaluate(()=>{const f=document.querySelector('.gp-f').getBoundingClientRect();return{footBottom:f.bottom,vh:innerHeight}})));
 await page.evaluate(()=>{const l=document.querySelector('.mdl');l.scrollTop=l.scrollHeight});await page.waitForTimeout(80);
 await page.screenshot({path:'shots/z-form-phone-end.png'});
 console.log('end',JSON.stringify(await page.evaluate(()=>{const f=document.querySelector('.gp-f').getBoundingClientRect(),c=document.querySelector('.mdc').getBoundingClientRect();return{footBottom:f.bottom,cardBottom:c.bottom,vh:innerHeight}})));
 console.log('ERRS',errs.length);
 await b.close();
})();
