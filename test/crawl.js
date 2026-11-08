const {chromium}=require('playwright');
const URL='file:///tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/build/page.html';
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1366,height:900}});
 const page=await ctx.newPage();
 const errs=[];
 page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_/.test(m.text()))errs.push('CONSOLE '+m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await page.goto(URL);
 await page.waitForSelector('.lg');
 const out={};
 for(const role of ['ql','tt','gv','ph']){
  await page.evaluate(()=>{try{localStorage.removeItem('gb_u')}catch(e){}});
  await page.goto(URL);await page.waitForSelector('.lg');
  await page.click(`.roles [data-v="${role}"]`);
  await page.waitForSelector('.nav');
  const navs=await page.$$eval('.nav button',els=>els.map(e=>e.dataset.v));
  out[role]={};
  for(const v of navs){
   await page.click(`.nav button[data-v="${v}"]`);
   await page.waitForTimeout(60);
   const t=await page.$eval('#main',e=>e.innerText);
   out[role][v]=t.length+(/Chưa hiển thị được trang này/.test(t)?' ERROR: '+t.slice(t.indexOf('Chưa hiển thị'),t.indexOf('Chưa hiển thị')+200).replace(/\n/g,' '):'');
  }
 }
 console.log(JSON.stringify(out,null,1));
 console.log('ERRS',errs.length);errs.slice(0,15).forEach(e=>console.log(e));
 await b.close();
})();
