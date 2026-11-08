const {chromium}=require('playwright');
const URL='file://'+require('path').resolve(__dirname,'../src/build/page-test.html');
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await ctx.newPage();
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 const W=ms=>page.waitForTimeout(ms);
 const bad=[];
 await page.goto(URL);await page.waitForSelector('.lg');
 const w0=await page.evaluate(()=>document.documentElement.scrollWidth);console.log('login scrollWidth',w0);
 await page.screenshot({path:'m1-login.png'});
 for(const role of ['ql','gv','ph']){
  await page.evaluate(()=>{try{localStorage.removeItem('gb_u')}catch(e){}});await page.goto(URL);await page.waitForSelector('.lg');
  await page.click(`.roles [data-v="${role}"]`);await page.waitForSelector('.hamb');
  const vs=await page.evaluate(()=>ACCESS[U.role]);
  for(const v of vs){
   await page.evaluate(x=>{go(x);render()},v);await W(60);
   const sw=await page.evaluate(()=>document.documentElement.scrollWidth);
   if(sw>392)bad.push(role+':'+v+' '+sw);
  }
 }
 console.log('overflow pages:',JSON.stringify(bad));
 // screenshots
 await page.evaluate(()=>{try{localStorage.removeItem('gb_u')}catch(e){}});await page.goto(URL);await page.waitForSelector('.lg');
 await page.click('.roles [data-v="ph"]');await page.waitForSelector('.hamb');
 await page.click('.tab[data-v="ch"]');await W(80);await page.screenshot({path:'m2-parent-month.png',fullPage:false});
 await page.click('.hamb');await W(250);await page.screenshot({path:'m3-drawer.png'});
 await page.mouse.click(375,400);await W(100);
 await page.evaluate(()=>{setUser(demoAcc('ql'));go('dd');render()});await W(100);await page.screenshot({path:'m4-sheet.png'});
 await b.close();
})();
