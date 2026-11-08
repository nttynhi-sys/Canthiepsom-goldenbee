const {open,login}=require('./h.js');
(async()=>{
 // desktop hub
 let {b,page,errs}=await open({h:900,dpr:1});
 await login(page,'ql');
 await page.click('.nav button[data-v="hs"]');await page.click('.tab:has-text("Buổi can thiệp")');await page.waitForTimeout(150);
 await page.screenshot({path:'shots/z-hub-desk.png'});
 await b.close();
 // phone hub + form
 ({b,page,errs}=await open({w:390,h:844,dpr:2}));
 await login(page,'ql');
 await page.evaluate(()=>{go('hs',{hs:{tab:'bi'}});});await page.waitForTimeout(150);
 await page.screenshot({path:'shots/z-hub-phone.png',fullPage:false});
 const ov=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);console.log('phone hub overflow px',ov);
 // open the session form on phone
 const kid=await page.evaluate(()=>DB.kids.find(k=>k.st==='dang').id);
 await page.evaluate(k=>{ACT.senew(k+'|'+WD);render()},kid);await page.waitForTimeout(150);
 await page.screenshot({path:'shots/z-form-phone.png'});
 console.log('form overflow px',await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),'modal overflow',await page.evaluate(()=>{const m=document.querySelector('.mdc');return m?m.scrollWidth-m.clientWidth:null}));
 console.log('ERRS',errs.length);
 await b.close();
})();
