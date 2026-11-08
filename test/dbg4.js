const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:1366,h:900});
 for(const role of ['ql','tt']){
  await page.evaluate(()=>{try{localStorage.removeItem('gb_u')}catch(e){}});
  await page.reload();await page.waitForSelector('.lg');await login(page,role);
  await page.click('.nav button[data-v="ns"]');await page.waitForTimeout(80);
  console.log(role,'ns tabs',await page.$$eval('.tabs .tab',e=>e.map(x=>x.dataset.v+':'+x.textContent.trim())));
  const pq=await page.$('.tab[data-v="pq"]');
  if(pq){await pq.click();await page.waitForTimeout(80);
   console.log(role,'rows',await page.$$eval('table tbody tr',r=>r.length),'headers',await page.$$eval('table thead th',e=>e.map(x=>x.textContent.trim())));}
 }
 // gv: dd tabs
 await page.evaluate(()=>{try{localStorage.removeItem('gb_u')}catch(e){}});
 await page.reload();await page.waitForSelector('.lg');await login(page,'gv');
 await page.click('.nav button[data-v="dd"]');await page.waitForTimeout(80);
 console.log('gv dd tabs',await page.$$eval('.tabs .tab',e=>e.map(x=>x.dataset.v+':'+x.textContent.trim())));
 await b.close();
})();
