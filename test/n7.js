const {open,login}=require('./h.js');
(async()=>{
 // 1) PDF box (giao diện tối để kiểm tra token sáng của PDF)
 {const {b,page,errs}=await open({w:900,h:1000,dpr:1,dark:true});
  await login(page,'ql');
  const info=await page.evaluate(()=>{
   const r=DB.rp.find(x=>x.s==='gui')||DB.rp[0];const k=kidBy(r.hs);
   const box=document.createElement('div');box.className='pdfbox';box.id='pdfx';
   box.style.cssText='position:absolute;left:0;top:0;width:794px;padding:34px 38px;background:#fff;color:#1d1a16;font:13.5px/1.55 "Be Vietnam Pro",system-ui,sans-serif;z-index:9999';
   box.innerHTML=`<div style="display:flex;gap:12px;align-items:center;border-bottom:3px solid #f4d133;padding-bottom:10px;margin-bottom:14px"><img src="${LOGO}" style="width:58px;height:58px"><div><div style="font:700 15px 'Baloo 2','Be Vietnam Pro',sans-serif;color:#c8372b;text-transform:uppercase">${esc(DB.cfg.name)}</div><div style="font-size:12px;color:#6b5f50">${esc(DB.cfg.addr||'')} · ĐT ${esc(DB.cfg.tel||'')}</div><div style="font-size:12px;color:#6b5f50">Hồ sơ in từ hệ thống quản lý</div></div></div><h2 style="margin:0 0 6px;font:700 17px 'Baloo 2','Be Vietnam Pro',sans-serif">BÁO CÁO CHUYÊN MÔN ${mLabel(r.per).toUpperCase()}</h2>`+rpDoc(r,true);
   document.body.appendChild(box);return{id:r.id,kid:k.n,per:r.per,h:box.offsetHeight}});
  console.log(JSON.stringify(info));
  const el=await page.$('#pdfx');await el.screenshot({path:'q1-pdfbox.png'});
  console.log('ERRS',errs.length);errs.slice(0,5).forEach(e=>console.log(e));await b.close()}
 // 2) báo cáo trong cổng phụ huynh (điện thoại)
 {const {b,page,errs}=await open({w:390,h:844,dpr:2});
  const pe=await page.evaluate(()=>{const r=DB.rp.find(x=>x.s==='gui');const k=kidBy(r.hs);return k.pe});
  await page.evaluate(e=>localStorage.setItem('gb_u',e),pe);await page.reload();await page.waitForSelector('.nav, .tabs');
  await page.click('.tab:has-text("Báo cáo")');await page.waitForTimeout(150);
  const ov=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));console.log('parent report',JSON.stringify(ov),'details open',await page.$$eval('details[open]',e=>e.length));
  await page.screenshot({path:'q2-parent-report.png',fullPage:true});
  console.log('ERRS',errs.length);errs.slice(0,5).forEach(e=>console.log(e));await b.close()}
 // 3) tiến bộ ở giao diện tối (máy tính)
 {const {b,page,errs}=await open({w:1100,h:1000,dpr:1,dark:true});
  await login(page,'ql');await page.click('.nav button[data-v="hs"]');await page.click('tr.k >> nth=2');await page.waitForSelector('.mdc');
  await page.click('.mdc .tab:has-text("Tiến bộ")');await page.waitForTimeout(100);
  await page.screenshot({path:'q3-dark-a.png'});
  await page.$eval('.mdl',e=>{e.scrollTop=900});await page.waitForTimeout(60);await page.screenshot({path:'q3-dark-b.png'});
  console.log('ERRS',errs.length);errs.slice(0,5).forEach(e=>console.log(e));await b.close()}
})();
