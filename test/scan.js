const {chromium}=require('playwright');
const URL='file://'+require('path').resolve(__dirname,'../src/build/page-test.html');
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1366,height:900}});
 const page=await ctx.newPage();
 const errs=[];
 page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_/.test(m.text()))errs.push('CONSOLE '+m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await page.goto(URL);await page.waitForSelector('.lg');
 // data sanity
 const info=await page.evaluate(()=>{
  const act=DB.kids.filter(k=>k.st==='dang');
  const m=WD.slice(0,7), pm=sm(m,-1);
  const sets=Object.keys(DB.set).length;
  let refSum=0,lostSum=0,nan=0;
  act.forEach(k=>{[pm,m].forEach(x=>{const r=settle(k,x);refSum+=(x===pm?r.refund:0);lostSum+=(x===pm?r.lost:0);if(isNaN(r.refund)||isNaN(r.lost))nan++})});
  const bal=act.map(k=>balance(k.id));
  const pay=DB.staff.map(s=>payroll(s,pm)).map(p=>Math.round(p.net));
  return {WD,TODAY,kids:DB.kids.length,act:act.length,staff:DB.staff.length,lich:DB.lich.length,att:Object.keys(DB.att).length,lg:DB.lg.length,sets,refSum,lostSum,nan,
   debtors:bal.filter(x=>x>0).length,credit:bal.filter(x=>x<0).length,maxDebt:Math.max(...bal),minBal:Math.min(...bal),
   payMin:Math.min(...pay),payMax:Math.max(...pay),paySample:pay.slice(0,8),mk:DB.mk.map(r=>r.s).join(','),rp:DB.rp.length,lr:DB.lr.length,
   inv:act.slice(0,3).map(k=>[k.n,invoice(k,m),wk11(k.id),k.bt])};
 });
 console.log(JSON.stringify(info));
 for(const role of ['ql','tt','gv','ph']){
  await page.evaluate(()=>{try{localStorage.removeItem('gb_u')}catch(e){}});
  await page.goto(URL);await page.waitForSelector('.lg');
  await page.click(`.roles [data-v="${role}"]`);await page.waitForSelector('.nav');
  const navs=await page.$$eval('.nav button',els=>els.map(e=>e.dataset.v));
  for(const v of navs){
   await page.click(`.nav button[data-v="${v}"]`);await page.waitForTimeout(50);
   const t=await page.$eval('#main',e=>e.innerText);
   const bad=t.match(/NaN|undefined|\[object|null\b/g);
   if(bad)console.log(role,v,'BAD TEXT',bad.slice(0,5));
  }
 }
 console.log('ERRS',errs.length);errs.slice(0,15).forEach(e=>console.log(e));
 await b.close();
})();
