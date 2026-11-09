const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({dpr:1});
 const log=(...a)=>console.log(...a);
 await login(page,'ql');
 await page.click('.nav button[data-v="hs"]');
 await page.click('tr.k >> nth=0');await page.waitForSelector('.mdc');
 await page.click('.mdc .tab:has-text("Buổi can thiệp")');
 const before=await page.$$eval('.mdc .sess',e=>e.length);
 // sửa buổi kế hoạch ngày mai? dùng "Ghi buổi can thiệp" mới cho hôm nay
 await page.click('.mdc [data-a="senew"]');await page.waitForSelector('.si');
 log('form items',await page.locator('.si').count(),'doms on',await page.locator('.chip.on').count(),'date',await page.inputValue('#se-d'));
 const it0=page.locator('.si').nth(0);
 for(let i=0;i<7;i++)await it0.locator('.tb').nth(i).click();     // 7 đúng
 await it0.locator('.tb').nth(7).click();await it0.locator('.tb').nth(7).click();  // sai
 log('tr0',await page.evaluate(()=>S.modal.it[0].tr));
 await it0.locator('.sg:has-text("Ind")').click();
 log('sup0',await page.evaluate(()=>S.modal.it[0].sup));
 // mục tiêu thứ 2 : GP với 5 đúng
 const it1=page.locator('.si').nth(1);
 for(let i=0;i<5;i++)await it1.locator('.tb').nth(i).click();
 await it1.locator('.sg:has-text("MP")').click();
 // ghi chú
 await it1.locator('input').fill('Bé tự thử trước');await it1.locator('input').blur();
 // thêm lĩnh vực chip
 await page.locator('.chip:has-text("Xã hội")').click();
 await page.fill('#se-n','Bé hợp tác tốt trong buổi.');await page.fill('#se-h','Chơi lăn bóng 10 phút mỗi ngày.');
 await page.screenshot({path:'o5-form.png'});
 // thêm từ gợi ý (+)
 const sug=await page.locator('.acts .btn.s:has-text("+ ")').count();log('suggest buttons',sug);
 if(sug)await page.locator('.acts .btn.s:has-text("+ ")').first().click();
 log('items now',await page.locator('.si').count());
 // chọn từ thư viện
 await page.click('[data-a="sepick"]');await page.waitForSelector('.gp-f');
 await page.locator('.mdc .chip:has-text("Tất cả lĩnh vực")').first().click().catch(()=>{});await page.waitForTimeout(60);await page.fill('#lf-q','gọi tên');await page.waitForTimeout(80);
 log('picker session mode, hits',await page.$eval('.acts .sm b',e=>e.textContent));
 await page.locator('.gi input[type=checkbox]:not([disabled])').nth(0).check();
 await page.screenshot({path:'o6-pick-ses.png'});
 await page.click('#gp-ok');await page.waitForSelector('.si');
 log('items after pick',await page.locator('.si').count(),'modal is se?',await page.evaluate(()=>S.modal.t));
 // lưu
 await page.click('[data-a="sesave"]');await page.waitForTimeout(100);
 log('modal after save',await page.evaluate(()=>S.modal&&S.modal.t+':'+S.modal.tab));
 log('sess cards now',await page.$$eval('.mdc .sess',e=>e.length),'(before',before+')');
 const first=await page.$eval('.mdc .sess',e=>e.innerText.replace(/\n+/g,' | ').slice(0,400));log('first card:',first);
 // kế hoạch đã có mục tiêu thêm từ thư viện (addPlan default true)
 await page.click('.mdc .tab:has-text("Kế hoạch mục tiêu")');
 log('plan rows',await page.$$eval('.mdc .pl',e=>e.length));
 // tiến bộ
 await page.click('.mdc .tab:has-text("Tiến bộ")');
 await page.waitForTimeout(100);
 await page.screenshot({path:'o7-prog.png',fullPage:false});
 log('prog text:',(await page.$eval('.mdc',e=>e.innerText)).replace(/\n+/g,' | ').slice(0,900));
 await b.close();
 console.log('ERRS',errs.length);errs.slice(0,15).forEach(e=>console.log(e));
})();
