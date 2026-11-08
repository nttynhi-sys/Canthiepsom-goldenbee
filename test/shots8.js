const {open,login}=require('./h.js');
(async()=>{
 for(const [tag,o] of [['d',{w:1366,h:900}],['m',{w:390,h:844}]]){
  const {b,page,errs}=await open(o);
  await page.screenshot({path:`shots/v8-${tag}-login.png`});
  const shot=async(name,fn)=>{await fn();await page.waitForTimeout(80);await page.screenshot({path:`shots/v8-${tag}-${name}.png`,fullPage:false})};
  await login(page,'vp');
  await shot('vp-dash',async()=>{});
  await shot('vp-hp',async()=>{await page.evaluate(()=>{go('hp');render()})});
  await shot('vp-dd',async()=>{await page.evaluate(()=>{go('dd');S.dd={tab:'roll'};render()})});
  await page.evaluate(()=>{setUser(demoAcc('ph'));render()});
  await shot('ph-lh',async()=>{await page.evaluate(()=>{go('lh');render()})});
  await shot('ph-tn',async()=>{await page.evaluate(()=>{go('tn');render()})});
  await shot('ph-cp',async()=>{await page.evaluate(()=>{go('cp');render()})});
  await page.evaluate(()=>{setUser(demoAcc('tt'));render()});
  await shot('tt-cd',async()=>{await page.evaluate(()=>{go('ns',{ns:{tab:'cd',q:'',role:''}});render()})});
  await shot('tt-tn',async()=>{await page.evaluate(()=>{go('tn');render()})});
  await shot('tt-pq',async()=>{await page.evaluate(()=>{go('ns',{ns:{tab:'pq',q:'',role:''}});render()})});
  console.log(tag,errs);
  await b.close();
 }
})();
