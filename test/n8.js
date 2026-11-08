const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:900,h:1000,dpr:1,dark:true});
 await login(page,'ql');
 const res=await page.evaluate(()=>{
  const mk=(html)=>{const box=document.createElement('div');box.className='pdfbox';box.style.cssText='position:fixed;left:-12000px;top:0;width:794px;padding:34px 38px;background:#fff;color:#1d1a16;font:13.5px/1.55 system-ui,sans-serif';box.innerHTML=html;document.body.appendChild(box);return box};
  const out=[];
  // 1) báo cáo tháng
  const rs=DB.rp.filter(r=>r.s==='gui').slice(0,6);
  rs.forEach(r=>{const box=mk('<div style="height:90px">header</div><h2>BÁO CÁO</h2>'+rpDoc(r,true));const {cuts,bw}=pdfCuts(box);
   // kiểm tra: không có điểm cắt nằm giữa một khối .nb/.gc/tr/li nhỏ hơn 90% trang
   const bt=box.getBoundingClientRect(),pageH=Math.floor(bw*841.89/595.28);
   const blk=[...box.querySelectorAll('.nb,tr,li,.rw,.gc')].map(e=>{const q=e.getBoundingClientRect();return[q.top-bt.top,q.bottom-bt.top]}).filter(x=>x[1]-x[0]>2&&x[1]-x[0]<pageH*.9);
   const bad=cuts.slice(1,-1).filter(c=>blk.some(x=>x[0]<c-1&&x[1]>c+1));
   const sizes=cuts.slice(1).map((c,i)=>c-cuts[i]);
   out.push({id:r.id,total:box.scrollHeight,pageH,pages:cuts.length-1,cuts,bad,maxPage:Math.max(...sizes),minPage:Math.min(...sizes.slice(0,-1)||[0])});box.remove()});
  return out});
 console.log(JSON.stringify(res));
 console.log('ERRS',errs.length);errs.slice(0,5).forEach(e=>console.log(e));
 await b.close();
})();
