const {chromium}=require('playwright');
const URL='file:///tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/build/page-test.html';
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await ctx.newPage();
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await page.goto(URL);await page.waitForSelector('.lg');
 await page.click('.roles [data-v="ql"]');await page.waitForSelector('.hamb');
 for(const v of ['dash','tk']){
  await page.evaluate(x=>{go(x);render()},v);await page.waitForTimeout(80);
  const r=await page.evaluate(()=>{
   const out=[];
   const clipped=el=>{for(let p=el;p&&p!==document.body;p=p.parentElement){const o=getComputedStyle(p);if(/(auto|scroll|hidden|clip)/.test(o.overflowX))return true}return false};
   const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
   while(n=w.nextNode()){if(!n.textContent.trim())continue;const rg=document.createRange();rg.selectNodeContents(n);const r=rg.getBoundingClientRect();
    if(r.right>392&&!clipped(n.parentElement)){const p=n.parentElement;out.push(Math.round(r.right)+' '+p.tagName+'.'+(typeof p.className==='string'?p.className:'')+' < '+p.parentElement.tagName+'.'+(typeof p.parentElement.className==='string'?p.parentElement.className:'')+' | '+n.textContent.trim().slice(0,40)+' | parentW='+Math.round(p.getBoundingClientRect().width)+' ws='+getComputedStyle(p).whiteSpace)}}
   return out.slice(0,20)});
  console.log('== '+v);r.forEach(x=>console.log(x));
 }
 await b.close();
})();
