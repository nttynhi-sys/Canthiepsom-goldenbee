const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({h:1000});
 const log=(...a)=>console.log(...a);
 const toast=async()=>page.evaluate(()=>{const t=document.querySelector('.toast');return t?t.textContent:''});
 await login(page,'ql');
 const kid=await page.evaluate(()=>DB.kids.find(k=>k.st==='dang'&&DB.sess.filter(s=>s.k===k.id&&s.st==='xong').length>20).id);
 await page.evaluate(k=>{go('hs');S.modal={t:'hs',id:k,tab:'kh'};render()},kid);await page.waitForSelector('.mdc');
 const st=()=>page.evaluate(k=>DB.plans.filter(p=>p.k===k).map(p=>p.id+':'+p.s+':'+p.h).join(' '),kid);
 const pid=await page.evaluate(k=>DB.plans.find(p=>p.k===k&&p.s==='dang').id,kid);
 log('plan',pid,'before',(await st()).split(' ').filter(x=>x.startsWith(pid+':')).join());
 const act=async(a)=>{await page.evaluate(([a,v])=>{ACT[a](v);render()},[a,pid]);await page.waitForTimeout(40);return (await st()).split(' ').filter(x=>x.startsWith(pid+':')).join()||'(gone)'};
 log('pltam ->',await act('pltam'));log('plre ->',await act('plre'));log('plhz ->',await act('plhz'));log('plhz again ->',await act('plhz'));log('plok ->',await act('plok'),await toast());log('plre ->',await act('plre'));
 // click path through real buttons in UI: check each plan row exposes buttons
 const btns=await page.$$eval('.mdc .pl',rows=>rows.map(r=>[...r.querySelectorAll('[data-a]')].map(x=>x.dataset.a).join('/')));log('row buttons sample',JSON.stringify(btns.slice(0,4)));
 // plan delete with cancel -> back to hs modal on the same tab
 await page.click(`.mdc [data-a="pldel"][data-v="${pid}"]`);await page.waitForTimeout(40);
 log('pldel ask visible',await page.evaluate(()=>S.modal.t));
 await page.click('[data-a="askno"]');await page.waitForTimeout(40);log('cancel back ->',await page.evaluate(()=>S.modal.t+'/'+S.modal.tab),'plan kept',(await st()).includes(pid+':'));
 await page.click(`.mdc [data-a="pldel"][data-v="${pid}"]`);await page.click('[data-a="askyes"]');await page.waitForTimeout(40);
 log('after delete modal ->',await page.evaluate(()=>S.modal&&S.modal.t+'/'+S.modal.tab),'plan gone',!(await st()).includes(pid+':'));
 // session edit through UI
 await page.click('.mdc .tab:has-text("Buổi can thiệp")');await page.waitForTimeout(40);
 const cnt0=await page.evaluate(k=>DB.sess.filter(s=>s.k===k).length,kid);
 const sid=await page.evaluate(k=>DB.sess.filter(s=>s.k===k&&s.st==='xong').sort((a,b)=>a.date<b.date?1:-1)[0].id,kid);
 await page.evaluate(([id])=>{ACT.sesview(id);render()},[sid]);await page.waitForSelector('.mdc');
 const editBtn=await page.$$eval('.mdc [data-a="seedit"]',e=>e.length);log('seedit button in view',editBtn);
 await page.click('.mdc [data-a="seedit"]');await page.waitForSelector('#sef, .gp-f');
 log('form open; items =',await page.$$eval('.si',e=>e.length),'support seg =',await page.$$eval('.seg .sg',e=>e.length));
 // change first item's support to MP and trial to all V
 await page.locator('.si').nth(0).locator('.seg .sg').nth(3).click();await page.waitForTimeout(30);
 for(let i=0;i<10;i++){await page.locator('.si').nth(0).locator('.trb .tb').nth(i).click();await page.waitForTimeout(8)}
 const tr=await page.evaluate(()=>S.modal.f?JSON.stringify(S.modal.f.it[0]):'?');log('item0 state',tr);
 await page.click('[data-a="sesave"]');await page.waitForTimeout(80);
 log('saved; toast',await toast(),'| count same',cnt0===await page.evaluate(k=>DB.sess.filter(s=>s.k===k).length,kid),'| edited tr',await page.evaluate(id=>JSON.stringify(DB.sess.find(s=>s.id===id).it[0]),sid));
 // parent cannot reach hs
 await page.evaluate(()=>{localStorage.removeItem('gb_u')});
 const ctx2=await open({h:900});await login(ctx2.page,'ph');
 const nav=await ctx2.page.$$eval('.nav button',e=>e.map(x=>x.dataset.v).join(','));log('parent nav',nav);
 await ctx2.page.evaluate(()=>{go('hs');});await ctx2.page.waitForTimeout(40);
 log('parent go(hs) ->',await ctx2.page.evaluate(()=>S.v),'| has Thư viện?',await ctx2.page.evaluate(()=>/Ngân hàng mục tiêu/.test(document.body.innerText)));
 // parent can't open progress modal of another kid
 const other=await ctx2.page.evaluate(()=>{const mine=myKids().map(k=>k.id);return DB.kids.find(k=>!mine.includes(k.id)).id});
 await ctx2.page.evaluate(k=>{S.modal={t:'hs',id:k,tab:'tb'};render()},other);await ctx2.page.waitForTimeout(40);
 log('parent modal other kid ->',await ctx2.page.evaluate(()=>S.modal),'| .mdc',await ctx2.page.$$eval('.mdc',e=>e.length));
 log('ERRS',errs.length,ctx2.errs.length);[...errs,...ctx2.errs].slice(0,6).forEach(e=>console.log(e));
 await ctx2.b.close();await b.close();
})();
