const {open,login}=require('./h.js');
(async()=>{
 const {b,page}=await open({w:1366,h:900});
 for(const role of ['ql','vp']){
  await page.evaluate(()=>{try{localStorage.removeItem('gb_u')}catch(e){}});await page.reload();await page.waitForSelector('.lg');await login(page,role);
  const has=await page.$('.nav button[data-v="ns"]');
  if(!has){console.log(role,'no ns');continue}
  await page.click('.nav button[data-v="ns"]');await page.click('.tab[data-v="pq"]');await page.waitForTimeout(80);
  console.log(role,'rows:',(await page.$$eval('table tbody tr',r=>r.map(x=>x.cells[0].innerText.trim()+' | '+[...x.cells].slice(1).map(c=>c.innerText.trim()).join(' / ')))).join('\n'));
  console.log('note:',await page.$eval('#main',e=>[...e.querySelectorAll('.note,p.sm')].map(x=>x.innerText.replace(/\s+/g,' ')).join(' || ').slice(0,700)));
 }
 await b.close();
})();
