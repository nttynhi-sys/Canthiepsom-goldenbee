const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({dpr:1});
 const log=(...a)=>console.log(...a);
 await login(page,'ql');
 // --- thư viện mục tiêu
 await page.click('.nav button[data-v="hs"]');
 await page.click('.tab:has-text("Ngân hàng mục tiêu")');
 log('LIB header:',(await page.$eval('#main',e=>e.innerText)).split('\n').slice(0,6).join(' | '));
 const cnt=async()=>+(await page.$eval('#main .acts .sm b',e=>e.textContent));
 log('all items',await cnt());
 await page.click('.chip:has-text("Diễn đạt")');log('dom Diễn đạt',await cnt());
 const heads=await page.$$eval('#bk-h option',o=>o.length);log('heads options',heads);
 await page.selectOption('#bk-h',{index:2});log('after head',await cnt());
 await page.click('[data-a="lfclr"]');log('cleared',await cnt());
 await page.fill('#bk-q','chỉ tranh');await page.waitForTimeout(80);log('search "chỉ tranh"',await cnt());
 await page.click('[data-a="lfclr"]');
 await page.selectOption('#bk-a','2');log('age 24-36',await cnt());
 await page.click('[data-a="lfclr"]');
 await page.screenshot({path:'o1-lib.png',fullPage:false});
 // --- hồ sơ bé, kế hoạch
 await page.click('.tab:has-text("Danh sách học sinh")');
 await page.click('tr.k >> nth=0');
 await page.waitForSelector('.mdc');
 await page.click('.mdc .tab:has-text("Kế hoạch mục tiêu")');
 log('plan rows',await page.$$eval('.mdc .pl',e=>e.length));
 await page.screenshot({path:'o2-plan.png'});
 // picker
 await page.click('[data-a="pkopen"]');
 await page.waitForSelector('.gp-f');
 log('picker count',await cnt().catch(()=>'n/a'));
 const boxes=await page.$$('.gi input[type=checkbox]:not([disabled])');
 await boxes[0].check();await boxes[2].check();
 log('sel count text',await page.$eval('#gp-cnt',e=>e.textContent),'ok disabled?',await page.$eval('#gp-ok',e=>e.disabled));
 await page.screenshot({path:'o3-picker.png'});
 await page.click('#gp-ok');
 await page.waitForTimeout(80);
 log('plan rows after add',await page.$$eval('.mdc .pl',e=>e.length),'modal tab',await page.$eval('.mdc .tab.on',e=>e.textContent));
 // buổi can thiệp
 await page.click('.mdc .tab:has-text("Buổi can thiệp")');
 log('sess cards',await page.$$eval('.mdc .sess',e=>e.length));
 await page.screenshot({path:'o4-sess.png'});
 await page.click('.mdc [data-a="senew"]');
 await page.waitForSelector('.si');
 log('form items',await page.$$eval('.si',e=>e.length),'dom chips on',await page.$$eval('.chip.on',e=>e.length));
 // chạm kết quả: 7 đúng 2 sai
 const kidId=await page.evaluate(()=>S.modal.k);
 const trs=await page.$$('.si:first-of-type .trb .tb');
 for(let i=0;i<7;i++)await trs[i].click();
 // cần lấy lại phần tử sau render
 let t2=await page.$$('.si >> nth=0 >> .trb .tb');
 for(let i=0;i<2;i++){const tb=await page.$$('.si:nth-of-type(1) .trb .tb');await tb[7+i].click();await tb[7+i].click().catch(()=>{});}
 log('tr string now',await page.evaluate(()=>S.modal.it[0].tr));
 await page.screenshot({path:'o5-form.png'});
 await b.close();
 console.log('ERRS',errs.length);errs.slice(0,15).forEach(e=>console.log(e));
})();
