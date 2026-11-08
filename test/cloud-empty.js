const {chromium}=require('playwright');const path=require('path');const {makeServer}=require('./cloud-mock.js');
const URL='file://'+path.resolve(__dirname,'../src/build/page-test.html')+'?cloud';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch(),errs=[];
 const srv=makeServer({'tt@gb.vn':{pw:'pw1',uid:'u-tt',role:'tt',name:'Trưởng TT',email:'tt@gb.vn'}});
 const ctx=await b.newContext({viewport:{width:1366,height:900},acceptDownloads:true}),page=await ctx.newPage();
 page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|net::/.test(m.text()))errs.push('CONSOLE '+m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());await srv.attach(page);await page.goto(URL);
 await page.waitForSelector('#login');await page.fill('#lg-e','tt@gb.vn');await page.fill('#lg-p','pw1');await page.click('#login button[type=submit]');
 await page.waitForSelector('[data-a="csetup"]');await page.click('[data-v="empty"]');await page.waitForSelector('.nav');
 const views=await page.evaluate(()=>ACCESS[U.role]);const bad=[];
 for(const v of views){await page.evaluate(v=>{go(v);render()},v);await sleep(80);const t=await page.textContent('#main');if(/Chưa hiển thị được trang này/.test(t))bad.push(v+': '+t.slice(0,160))}
 console.log('Trang kiểm tra (dữ liệu trống):',views.length,'| lỗi:',bad.length?bad.join('\n'):'không');
 /* tải tệp trên web thường */
 const dl=page.waitForEvent('download',{timeout:5000}).catch(()=>null);
 await page.evaluate(()=>saveFile('thu.txt','xin chào'));const d=await dl;
 console.log('Tải tệp (không có khả năng tải của artifact):',d?('OK '+d.suggestedFilename()):'KHÔNG tải được');
 console.log('Lỗi trang:',errs.length?errs.join('\n'):'không');await b.close();process.exit(bad.length||errs.length||!d?1:0)})();
