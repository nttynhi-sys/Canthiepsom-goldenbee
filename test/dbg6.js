const {open}=require('./h.js');
(async()=>{const {b,page}=await open();
 const r=await page.evaluate(()=>DB.kids.filter(k=>k.gr&&k.st==='dang'&&k.gr!==grByAge(k.dob)).map(k=>k.id+':'+k.gr+':'+mo(k.dob)));
 console.log(r);await b.close()})();
