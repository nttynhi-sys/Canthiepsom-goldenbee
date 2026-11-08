const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({dpr:1});
 await login(page,'ql');
 const r=await page.evaluate(()=>{const c=q=>libFind({q}).length;return{tranh:c('tranh'),chitranh:c('chỉ tranh'),chivao:c('chỉ vào'),batchuoc:c('bắt chước'),dem:c('đếm'),vd:LIBI.filter(i=>/tranh/i.test(i.n)).slice(0,6).map(i=>i.n)}});
 console.log(JSON.stringify(r));
 await b.close();
})();
