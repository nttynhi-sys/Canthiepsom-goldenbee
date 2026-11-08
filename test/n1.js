const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open();
 const out={};
 for(const role of ['ql','tt','gv','ph']){
  await page.evaluate(()=>{try{localStorage.removeItem('gb_u')}catch(e){}});
  await page.reload();await page.waitForSelector('.lg');
  await login(page,role);
  const navs=await page.$$eval('.nav button',els=>els.map(e=>e.dataset.v));
  out[role]={};
  for(const v of navs){
   await page.click(`.nav button[data-v="${v}"]`);await page.waitForTimeout(40);
   const t=await page.$eval('#main',e=>e.innerText);
   out[role][v]=t.length+(/Chưa hiển thị được trang này/.test(t)?' ERROR: '+t.slice(t.indexOf('Chưa hiển thị'),t.indexOf('Chưa hiển thị')+240).replace(/\n/g,' '):'');
  }
 }
 console.log(JSON.stringify(out));
 const st=await page.evaluate(()=>({plans:DB.plans.length,sess:DB.sess.length,xong:DB.sess.filter(s=>s.st==='xong').length,kh:DB.sess.filter(s=>s.st==='kh').length,dat:DB.plans.filter(p=>p.s==='dat').length,dang:DB.plans.filter(p=>p.s==='dang').length,rp:DB.rp.length,ls:localStorage.getItem('gb_v2').length,lib:LIBI.length,kids:DB.kids.filter(k=>k.st==='dang').length,kidsWithSess:new Set(DB.sess.map(s=>s.k)).size}));
 console.log(JSON.stringify(st));
 console.log('ERRS',errs.length);errs.slice(0,15).forEach(e=>console.log(e));
 await b.close();
})();
