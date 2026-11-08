const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({h:1000});
 await login(page,'ql');
 const kid=await page.evaluate(()=>DB.kids.find(k=>k.st==='dang'&&DB.sess.filter(s=>s.k===k.id&&s.st==='xong').length>20).id);
 await page.evaluate(k=>{go('hs');S.modal={t:'hs',id:k,tab:'tb'};render()},kid);await page.waitForSelector('.mdc');
 for(const [v,l] of [['30','30 ngày'],['90','3 tháng'],['365','Từ đầu']]){
  await page.click(`.mdc [data-a="prp"][data-v="${v}"]`);await page.waitForTimeout(60);
  const t=await page.evaluate(()=>{const m=document.querySelector('.mdc');const hero=m.querySelector('.hero');return{hero:hero?hero.innerText.replace(/\s+/g,' ').slice(0,160):null,range:(m.querySelector('p.mu.sm')||{}).textContent,sessions:[...m.querySelectorAll('.tiles *')].map(e=>e.children.length?'':e.textContent).filter(Boolean).slice(0,12)}});
  console.log(l,JSON.stringify(t));
 }
 console.log('ERRS',errs.length);
 await b.close();
})();
