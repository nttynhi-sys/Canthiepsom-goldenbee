/* Tải ảnh, video: chọn nhiều tệp một lần, hiện danh sách đã chọn, "Chọn thêm tệp" cộng dồn */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,500))}};
(async()=>{const {b,page,errs}=await open();await login(page,'gv');
 const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
 const n0=await page.evaluate(()=>medList().length);
 await page.evaluate(()=>{S.v='td';S.td=Object.assign({},S.td,{tab:'gal',sel:[]});S.modal=null;render()});await page.waitForSelector('[data-a="upm"]');
 await page.click('[data-a="upm"]');await page.waitForSelector('#upmf');
 ok('ô chọn tệp cho phép chọn nhiều tệp',await page.getAttribute('#um-f','multiple')!==null);
 await page.setInputFiles('#um-f',[{name:'a.png',mimeType:'image/png',buffer:PNG},{name:'b.png',mimeType:'image/png',buffer:PNG}]);
 ok('hiện danh sách 2 tệp đã chọn',/2 tệp đã chọn/.test(await page.textContent('#um-list')));
 await page.setInputFiles('#um-f2',[{name:'c.mp4',mimeType:'video/mp4',buffer:Buffer.from('0000')}]);
 ok('"Chọn thêm tệp" cộng dồn: 3 tệp, ô chính giữ đủ',/3 tệp đã chọn/.test(await page.textContent('#um-list'))&&await page.evaluate(()=>document.querySelector('#um-f').files.length)===3);
 /* kéo thả thêm 2 tệp vào cửa sổ */
 await page.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File(['x'],'k1.png',{type:'image/png',lastModified:1}));dt.items.add(new File(['yy'],'k2.png',{type:'image/png',lastModified:2}));
  document.querySelector('#upmf').dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}))});
 ok('kéo thả 2 tệp: cộng dồn thành 5 tệp',/5 tệp đã chọn/.test(await page.textContent('#um-list'))&&await page.evaluate(()=>document.querySelector('#um-f').files.length)===5,await page.textContent('#um-list'));
 ok('ô chọn ảnh, video chỉ dùng image/*,video/* (điện thoại mở thư viện ảnh, chọn nhiều)',await page.getAttribute('#um-f','accept')==='image/*,video/*');
 await page.evaluate(()=>{document.querySelector('input[name=kid]').checked=true});
 await page.click('#upmf button[type=submit]');await page.waitForTimeout(1500);
 ok('tải lên đủ 5 tệp một lần',await page.evaluate(()=>medList().length)-n0===5);
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{S.modal=null;ACT.upm('av|');render()});await page.waitForSelector('#upmf');
 ok('điện thoại 390px: cửa sổ tải lên không tràn ngang',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 ok('không lỗi trình duyệt',errs.length===0,errs);
 await b.close();console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
