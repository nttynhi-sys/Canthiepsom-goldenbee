const {chromium}=require('playwright');
const URL='file:///tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/build/page-test.html';
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await ctx.newPage();
 const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 const W=ms=>page.waitForTimeout(ms);
 await page.goto(URL);await page.waitForSelector('.lg');
 await page.click('.roles [data-v="ql"]');await page.waitForSelector('.hamb');await W(150);
 await page.screenshot({path:'n1-dash.png'});
 await page.click('.hamb');await W(350);await page.screenshot({path:'n2-drawer.png'});
 await page.mouse.click(375,400);await W(250);
 await page.evaluate(()=>{go('dd');render()});await W(100);
 await page.evaluate(()=>{S.dd.tab='sheet';render()});await W(150);
 await page.evaluate(()=>window.scrollTo(0,420));await W(100);
 await page.screenshot({path:'n3-sheet.png'});
 await page.evaluate(()=>{go('tl');render()});await W(100);await page.screenshot({path:'n4-tl.png'});
 // dark theme
 await page.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark');go('dash');render()});await W(150);
 await page.screenshot({path:'n5-dark.png'});
 await page.evaluate(()=>document.documentElement.removeAttribute('data-theme'));
 // GV roll-call
 await page.evaluate(()=>{setUser(demoAcc('gv'));go('dd');render()});await W(150);
 await page.screenshot({path:'n6-gv-dd.png'});
 await page.evaluate(()=>{go('lh');render()});await W(150);
 await page.screenshot({path:'n7-gv-lh.png'});
 console.log('errors:',JSON.stringify(errs));
 await b.close();
})();
