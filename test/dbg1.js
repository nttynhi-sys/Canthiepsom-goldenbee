const {open,login}=require('./h.js');
(async()=>{
 const m=await open({w:390,h:844,dpr:1});
 await login(m.page,'gv');
 console.log('v before',await m.page.evaluate(()=>S.v));
 await m.page.evaluate(()=>go('mt'));await m.page.waitForTimeout(200);
 console.log('v after',await m.page.evaluate(()=>S.v), 'ids', await m.page.$$eval('main [id]',e=>e.slice(0,12).map(x=>x.id)));
 console.log('modal class names', await m.page.evaluate(()=>{S.modal={t:'hs',id:DB.kids[0].id,tab:'kh'};render();return [...document.querySelectorAll('[class*=mod],[role=dialog]')].map(x=>x.className+'|'+x.tagName).slice(0,6)}));
 await m.b.close();
})();
