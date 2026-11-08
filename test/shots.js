const {chromium}=require('playwright');
const URL='file://'+require('path').resolve(__dirname,'../src/build/page-test.html');
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1366,height:860}});
 const page=await ctx.newPage();
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await page.goto(URL);await page.waitForSelector('.lg');
 await page.screenshot({path:'s1-login.png'});
 await page.click('.roles [data-v="ql"]');await page.waitForSelector('.nav');
 await page.screenshot({path:'s2-dash.png'});
 await page.click('.nav button[data-v="dd"]');await page.waitForTimeout(100);
 await page.screenshot({path:'s3-sheet.png'});
 // open detail of a kid that has refund
 const id=await page.evaluate(()=>{const m=S.dd.m;const k=DB.kids.find(k=>k.st==='dang'&&settle(k,m).rows.length>1);return k.id});
 await page.click(`.lk[data-v="${id}|${await page.evaluate(()=>S.dd.m)}"]`);await page.waitForTimeout(100);
 await page.screenshot({path:'s4-detail.png'});
 await b.close();
})();
