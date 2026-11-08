const {chromium}=require('playwright');
const URL='file:///tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/build/page-test.html';
(async()=>{
 const b=await chromium.launch();
 for(const mobile of [true,false]){
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
 const page=await ctx.newPage();
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await page.goto(URL);await page.waitForSelector('.lg');
 await page.click('.roles [data-v="ql"]');await page.waitForSelector('.hamb');
 const r=await page.evaluate(()=>{const s=document.querySelector('.side'),d=document.documentElement;
  const t=document.createElement('div');t.style.cssText='position:fixed;top:0;bottom:0;left:0;width:10px;visibility:hidden';document.body.appendChild(t);const th=t.getBoundingClientRect().height;t.remove();
  return{mobile:matchMedia('(max-width:900px)').matches,innerH:innerHeight,clientH:d.clientHeight,vvH:visualViewport.height,testFixedH:th,sideH:s.getBoundingClientRect().height,sideScrollH:s.scrollHeight}});
 console.log(mobile,JSON.stringify(r));
 await ctx.close();}
 await b.close();
})();
