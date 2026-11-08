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
   const out=[];const d=document.documentElement;
   out.push('doc scrollWidth='+d.scrollWidth+' clientWidth='+d.clientWidth+' body scrollWidth='+document.body.scrollWidth+' innerWidth='+innerWidth+' vv='+(visualViewport&&visualViewport.width));
   // widest elements by right edge
   const all=[...document.querySelectorAll('body *')].map(el=>({el,r:el.getBoundingClientRect()})).filter(x=>x.r.width&&x.r.right>380).sort((a,b)=>b.r.right-a.r.right).slice(0,14);
   all.forEach(({el,r})=>{let anc='';for(let p=el.parentElement,i=0;p&&i<4;p=p.parentElement,i++)anc+=' < '+p.tagName+'.'+(typeof p.className==='string'?p.className:'');out.push(Math.round(r.right)+' w'+Math.round(r.width)+' '+el.tagName+'.'+(typeof el.className==='string'?el.className:'')+anc)});
   return out});
  console.log('== '+v);r.forEach(x=>console.log(x));
 }
 await b.close();
})();
