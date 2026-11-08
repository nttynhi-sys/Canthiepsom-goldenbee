/* Quét toàn bộ giao diện từng vai trò: mọi trang, mọi tab, mở vài cửa sổ chi tiết; kiểm tra chữ về tiền. */
const {open,login}=require('./h.js');
const MONEY=/₫|vnd|học phí|công nợ|thu chi|hoàn phí|hóa đơn|phiếu lương|bảng lương|tiền lương|mức lương|lương|phụ cấp|bảo hiểm|bhxh|thuế|thanh toán|chuyển khoản|tiền mặt|phí buổi|phí nghỉ|phí mất|phí bán trú|(^|[^\p{L}])phí([^\p{L}]|$)|(^|[^\p{L}])tiền([^\p{L}]|$)/iu;
const strip=t=>t.replace(/Thông tin lương do[^.]*\./g,'').replace(/Phần tiền \([^)]*\)[^.]*\./g,'').replace(/Giao diện phụ huynh có phần học phí[^.]*\./g,'').replace(/không lương/gi,'').replace(/tiền học đường|tiền đình|tiền đề|tiền sử/gi,'');
const roles=(process.argv[2]||'ql,gv,vp,tt,ph').split(',');
(async()=>{
 let fails=0;const report={};
 for(const role of roles){
  const {b,page,errs}=await open({w:1366,h:900});
  await login(page,role);
  const navs=await page.$$eval('.nav button',e=>e.map(x=>x.dataset.v));
  const texts=[];
  const grab=async(tag)=>{const t=await page.evaluate(()=>{const m=document.querySelector('.mdc');return (document.querySelector('#main')?document.querySelector('#main').innerText:'')+'\n'+(m?m.innerText:'')});texts.push([tag,t])};
  for(const v of navs){
   await page.click(`.nav button[data-v="${v}"]`);await page.waitForTimeout(70);
   await grab(v);
   const tabs=await page.$$eval('#main > .tabs .tab, main > .tabs .tab',e=>e.map(x=>x.dataset.v));
   for(const t of [...new Set(tabs)]){
    const el=await page.$(`#main .tabs .tab[data-v="${t}"]`);if(!el)continue;
    await el.click();await page.waitForTimeout(70);await grab(v+'/'+t);
    // mở tối đa 2 hàng có thể bấm để xem cửa sổ chi tiết
    const rows=await page.$$('#main tr.k, #main [data-a$="open"]');
    for(let i=0;i<Math.min(2,rows.length);i++){
     const rs=await page.$$('#main tr.k, #main [data-a$="open"]');if(!rs[i])break;
     try{await rs[i].click({timeout:2000});await page.waitForTimeout(80)}catch(e){continue}
     if(await page.$('.mdc')){
      await grab(v+'/'+t+'/modal'+i);
      const mt=await page.$$eval('.mdc .tabs .tab',e=>e.map(x=>x.dataset.v));
      for(const x of mt){const me=await page.$(`.mdc .tabs .tab[data-v="${x}"]`);if(me){await me.click();await page.waitForTimeout(70);await grab(v+'/'+t+'/modal'+i+'/'+x)}}
      await page.evaluate(()=>{S.modal=null;render()});await page.waitForTimeout(40);
     }}
   }
  }
  const hits=[];
  texts.forEach(([tag,t])=>{if(role==='ql'&&tag.startsWith('ns/pq'))return;if(role==='gv'&&tag==='tl')return;const s=strip(t);const m=s.match(MONEY);if(m){const i=s.search(MONEY);hits.push(tag+' :: '+s.slice(Math.max(0,i-40),i+60).replace(/\s+/g,' '))}});
  const bad=texts.filter(([tag,t])=>/NaN|undefined|\[object|Chưa hiển thị được trang này/.test(t)).map(x=>x[0]);
  report[role]={views:navs.length,pages:texts.length,moneyHits:hits.length,bad};
  console.log('==',role,'nav',navs.join(','),'| pages crawled',texts.length);
  if(role==='ql'||role==='gv'){hits.slice(0,25).forEach(h=>console.log('  MONEY?',h));if(hits.length)fails++}
  else console.log('  (vai trò được xem tiền) trang có chữ tiền:',hits.length);
  if(bad.length){fails++;console.log('  BAD TEXT in',bad)}
  if(errs.length){fails++;console.log('  ERRS',errs.slice(0,5))}
  await b.close();
 }
 console.log(JSON.stringify(report));
 console.log(fails?('FAILED '+fails):'ALL PASS');
})();
