const {open,login}=require('./h.js');
(async()=>{const {b,page,errs}=await open();
 await login(page,'ql');
 for(const role of ['ql','vp','tt']){
  await page.selectOption('#demo-role',role);
  const r=await page.evaluate(async()=>{
   window.__cap=[];window.exportXLSX=async(n,s)=>{__cap.push(['xlsx',n,s.map(x=>x.n+': '+(x.rows[0]||[]).join(' | ')+' // '+JSON.stringify(x.rows.slice(1,3)))])};window.exportPDF=async(n,h)=>{__cap.push(['pdf',n,h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')])};
   go('tk');render();
   const res={};['tkxl','tkpdf'].forEach(k=>{try{const r=ACT[k]();res[k]=r===false?'refused':'ran'}catch(e){res[k]='ERR '+e.message}});
   await new Promise(r=>setTimeout(r,200));
   return{res,cap:__cap,txt:document.querySelector('#main').innerText}});
  const money=/₫|học phí|công nợ|lương|thu chi|hoàn phí|thuế|bảo hiểm|doanh thu/i;
  console.log('==',role,JSON.stringify(r.res),'| trang tk có chữ tiền:',money.test(r.txt));
  r.cap.forEach(c=>console.log('   ',c[0],c[1],'| money?',money.test(JSON.stringify(c[2])),'|',JSON.stringify(c[2]).slice(0,260)));
 }
 console.log(errs);await b.close()})();
