/* Cổng phụ huynh: thấy phí cọc của bé mình ở mục Học phí (đang giữ hoặc đã hoàn); bé không có cọc thì không hiện thẻ */
const {open}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,500))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 await ev(()=>{setUser(demoAcc('ph'));render()});await page.waitForSelector('.nav');
 const K=await ev(()=>{const k=myKids()[0];DB.dep=DB.dep||{};delete DB.dep[k.id];go('hp');render();return{id:k.id,n:k.n}});
 await page.waitForSelector('#main .card');
 ok('bé chưa có cọc: không hiện thẻ Phí cọc',!/Phí cọc/.test(await page.textContent('#main')));
 await ev(id=>{DB.dep[id]={a:2000000,r:''};render()},K.id);
 let t=await page.textContent('#main');
 ok('bé có cọc đang giữ: hiện số tiền, "Trung tâm đang giữ" và điều kiện hoàn',/Phí cọc/.test(t)&&/2\.000\.000/.test(t)&&/Trung tâm đang giữ/.test(t)&&/ngưng học và đã đóng đủ học phí/.test(t),t.slice(0,300));
 await ev(id=>{DB.dep[id]={a:2000000,r:TODAY};render()},K.id);
 t=await page.textContent('#main');
 ok('cọc đã hoàn: hiện "Đã hoàn tiền cọc ngày …", không còn điều kiện hoàn',/Đã hoàn tiền cọc ngày/.test(t)&&!/Trung tâm đang giữ/.test(t));
 ok('phụ huynh không có ô nhập hay nút sửa cọc',!(await page.$('#main [data-c="depamt"], #main [data-a="deprf"], #main [data-a="depview"]')));
 await page.setViewportSize({width:390,height:844});
 ok('điện thoại 390px: không tràn ngang',await ev(()=>document.documentElement.scrollWidth<=innerWidth+1),await ev(()=>[document.documentElement.scrollWidth,innerWidth]));
 /* phụ huynh không sửa được cọc bằng lệnh */
 ok('phụ huynh gọi lệnh sửa cọc: bị từ chối',await ev(id=>{const inp=document.createElement('input');inp.dataset.v=id;CHG.depamt('5',inp);ACT.deprf(id);ACT.depview(id);return DB.dep[id].a===2000000&&DB.dep[id].r===TODAY},K.id));
 ok('không lỗi trình duyệt',errs.length===0,errs);
 await b.close();console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
