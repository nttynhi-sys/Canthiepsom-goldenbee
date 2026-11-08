const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:1366,h:900,dark:true});
 await login(page,'ph');
 const shot=async(name,fn)=>{await fn();await page.waitForTimeout(80);await page.screenshot({path:`shots/v8-dark-${name}.png`})};
 await shot('ph-lh',async()=>{await page.evaluate(()=>{go('lh');render()})});
 await shot('ph-tn',async()=>{await page.evaluate(()=>{go('tn');render()})});
 await page.evaluate(()=>{setUser(demoAcc('vp'));render()});
 await shot('vp-dd',async()=>{await page.evaluate(()=>{go('dd');S.dd={tab:'roll'};render()})});
 await shot('vp-tn-edit',async()=>{await page.evaluate(()=>{go('tn');S.modal={t:'tnd',d:Object.keys(DB.menu)[7]};render()})});
 console.log(errs);await b.close()})();
