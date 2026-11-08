const {open,login}=require('./h.js');
(async()=>{
 const m=await open({w:390,h:844,dpr:1});
 await login(m.page,'gv');
 await m.page.evaluate(()=>go('mt'));await m.page.waitForTimeout(300);
 console.log('main text:',(await m.page.evaluate(()=>document.querySelector('main').innerText.replace(/\s+/g,' '))).slice(0,300));
 console.log('errs',m.errs);
 console.log('go src:',await m.page.evaluate(()=>go.toString().slice(0,300)));
 console.log('VIEWS.mt:',await m.page.evaluate(()=>String(VIEWS.mt).slice(0,300)));
 // via desktop-like click on drawer
 const navs=await m.page.$$eval('[data-a="nav"]',e=>e.map(x=>x.dataset.v+':'+(x.offsetParent!==null)));
 console.log('nav buttons',navs.join(' '));
 await m.b.close();
})();
