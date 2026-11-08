const {chromium}=require('playwright');
const URL='file://'+require('path').resolve(__dirname,'../src/build/page-test.html');
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await ctx.newPage();
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await page.goto(URL);await page.waitForSelector('.lg');
 await page.click('.roles [data-v="ql"]');await page.waitForSelector('.hamb');
 const r=await page.evaluate(()=>{const s=document.querySelector('.side');const out=[];out.push('offsetParent='+(s.offsetParent&&s.offsetParent.tagName));
  for(let p=s.parentElement;p;p=p.parentElement){const c=getComputedStyle(p);out.push(p.tagName+'#'+p.id+'.'+p.className+' tr='+c.transform+' ct='+c.contain+' ctype='+c.containerType+' flt='+c.filter+' wc='+c.willChange+' pos='+c.position+' h='+c.height+' ov='+c.overflowY)}
  const c=getComputedStyle(s);out.push('side h='+c.height+' minh='+c.minHeight+' maxh='+c.maxHeight+' as='+c.alignSelf+' bs='+c.boxSizing+' disp='+c.display);
return out});
 r.forEach(x=>console.log(x));
 await b.close();
})();
