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
   const clipped=el=>{for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const o=getComputedStyle(p);if(/(auto|scroll|hidden|clip)/.test(o.overflowX))return true}return false};
   document.querySelectorAll('body *').forEach(el=>{const r=el.getBoundingClientRect();if(r.width&&r.right>392&&!clipped(el)){out.push(el.tagName+'.'+(el.className&&el.className.baseVal===undefined?el.className:'')+' #'+el.id+' right='+Math.round(r.right)+' w='+Math.round(r.width)+' | '+(el.textContent||'').trim().slice(0,40))}});
   return out.slice(0,25)});
  console.log('== '+v);r.forEach(x=>console.log(x));
 }
 await b.close();
})();
