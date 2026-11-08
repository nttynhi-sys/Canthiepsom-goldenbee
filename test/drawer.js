const {chromium}=require('playwright');
const URL='file:///tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/build/page-test.html';
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await ctx.newPage();
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await page.goto(URL);await page.waitForSelector('.lg');
 await page.click('.roles [data-v="ql"]');await page.waitForSelector('.hamb');
 await page.click('.hamb');await page.waitForTimeout(400);
 const r=await page.evaluate(()=>{const s=document.querySelector('.side'),c=getComputedStyle(s),b=s.getBoundingClientRect();return{rect:[b.left,b.top,b.width,b.height],pos:c.position,top:c.top,bottom:c.bottom,h:c.height,inner:[innerWidth,innerHeight],cls:s.className,sh:s.scrollHeight}});
 console.log(JSON.stringify(r));
 await page.screenshot({path:'m3b-drawer-ql.png'});
 await b.close();
})();
