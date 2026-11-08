const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:390,h:844,dpr:2});
 const ovf=async(tag)=>{const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,bad:[...document.querySelectorAll('#app *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&!e.closest('.tw,.mdl,.side,.tabs,.sheet')}).slice(0,5).map(e=>e.tagName+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right))}));console.log(tag,JSON.stringify(o))};
 await login(page,'ph');
 await page.waitForTimeout(120);
 await ovf('ph-home');
 await page.screenshot({path:'p1-home.png',fullPage:true});
 await page.click('.tab:has-text("Tiến bộ của bé")');await page.waitForTimeout(120);
 await ovf('ph-tb');
 await page.screenshot({path:'p2-tb.png',fullPage:true});
 await page.click('.tab:has-text("Báo cáo")');await page.waitForTimeout(120);
 await ovf('ph-bc');
 await page.screenshot({path:'p3-bc.png',fullPage:true});
 console.log('sess sample',await page.evaluate(()=>document.querySelector('#main').innerText.length));
 await b.close();
 console.log('ERRS',errs.length);errs.slice(0,15).forEach(e=>console.log(e));
})();
