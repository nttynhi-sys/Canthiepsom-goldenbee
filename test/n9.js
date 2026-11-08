const {open,login,URL}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open();
 // --- nâng cấp từ bản 2
 await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('gb_v2'));d.v=2;delete d.plans;delete d.sess;delete d.cg;d.goals={x:1};
  d.kids[0].n='Bé Thử Nghiệm';delete d.cfg.addr;delete d.cfg.tel;
  d.rp.forEach(r=>{r.sec={tq:'OLD'}});d.rp.push({id:'rabc123',hs:d.kids[1].id,per:'2026-10',au:'nv04',s:'nhap',rv:'',cm:'',sec:{tq:'USER'}});
  localStorage.setItem('gb_v2',JSON.stringify(d))});
 await page.reload();await page.waitForSelector('.lg');
 const r=await page.evaluate(()=>({v:DB.v,k0:DB.kids[0].n,plans:DB.plans.length,sess:DB.sess.length,cg:DB.cg.length,goals:DB.goals,addr:DB.cfg.addr,tel:DB.cfg.tel,seeded:DB.rp.filter(x=>/^r\d{1,3}$/.test(x.id)).every(x=>x.sec.tq!=='OLD'&&x.sec.mt),user:DB.rp.find(x=>x.id==='rabc123').sec.tq,saved:JSON.parse(localStorage.getItem('gb_v2')).v}));
 console.log('migrate',JSON.stringify(r));
 // --- dữ liệu hỏng -> dựng lại
 await page.evaluate(()=>localStorage.setItem('gb_v2','{"v":2,"staff":[]}'));await page.reload();await page.waitForSelector('.lg');
 console.log('corrupt ->',await page.evaluate(()=>({v:DB.v,kids:DB.kids.length,plans:DB.plans.length})));
 // --- phiên bản chưa biết -> dựng lại
 await page.evaluate(()=>localStorage.setItem('gb_v2','{"v":9}'));await page.reload();await page.waitForSelector('.lg');
 console.log('v9 ->',await page.evaluate(()=>({v:DB.v,kids:DB.kids.length})));
 console.log('ERRS',errs.length);errs.slice(0,5).forEach(e=>console.log(e));
 await b.close();
})();
