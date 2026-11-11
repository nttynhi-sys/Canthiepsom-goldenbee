/* Nút "Hiển thị / Ẩn" mật khẩu: gắn cho mọi ô type=password, kể cả ô được vẽ lại sau mỗi lần render. Chỉ đổi kiểu hiển thị của ô, không lưu gì. */
(function(){
 const enh=root=>{
  if(!root||!root.querySelectorAll)return;
  root.querySelectorAll('input[type=password]').forEach(inp=>{
   if(inp.dataset.pwOn||!inp.parentNode)return;
   inp.dataset.pwOn='1';
   const wrap=document.createElement('span');wrap.className='pw-wrap';
   inp.parentNode.insertBefore(wrap,inp);wrap.appendChild(inp);
   const b=document.createElement('button');b.type='button';b.className='pw-eye';
   b.textContent='Hiển thị';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Hiển thị mật khẩu');
   b.addEventListener('click',()=>{
    const show=inp.type==='password';
    inp.type=show?'text':'password';
    b.textContent=show?'Ẩn':'Hiển thị';
    b.setAttribute('aria-pressed',String(show));
    b.setAttribute('aria-label',show?'Ẩn mật khẩu':'Hiển thị mật khẩu');
   });
   wrap.appendChild(b);
  });
 };
 if(typeof document!=='undefined'){
  const start=()=>{enh(document.body);new MutationObserver(ms=>{for(const m of ms)m.addedNodes.forEach(n=>{if(n.nodeType===1)enh(n)})}).observe(document.body,{childList:true,subtree:true})};
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
 }
})();
