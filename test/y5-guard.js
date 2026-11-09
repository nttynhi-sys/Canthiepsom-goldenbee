/* Yêu cầu 5: hạn chế chụp màn hình từ cổng phụ huynh (răn đe và truy vết; web không chặn tuyệt đối được chụp của hệ điều hành) */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
const SP='/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/';
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 const prevented=(type,init)=>ev(([t,i])=>{const e=t==='copy'||t==='cut'?new Event(t,{bubbles:true,cancelable:true}):t==='contextmenu'||t==='selectstart'||t==='dragstart'?new Event(t,{bubbles:true,cancelable:true}):new KeyboardEvent(t,Object.assign({bubbles:true,cancelable:true},i||{}));
  (document.querySelector('#main')||document.body).dispatchEvent(e);return e.defaultPrevented},[type,init]);

 /* ---------- nhân viên: không bị ảnh hưởng ---------- */
 await login(page,'tt');
 ok('Trưởng Trung tâm: không có lớp phủ, không bị chặn sao chép / chuột phải / in',!(await page.$('#gmark'))&&!(await ev(()=>document.body.classList.contains('gph')))&&!(await prevented('contextmenu'))&&!(await prevented('copy'))&&!(await prevented('keydown',{key:'p',ctrlKey:true})));
 await ev(()=>{setUser(demoAcc('gv'));render()});await page.waitForSelector('.nav');
 ok('Giáo viên: không có lớp phủ',!(await page.$('#gmark')));

 /* ---------- phụ huynh ---------- */
 await ev(()=>{setUser(demoAcc('ph'));render()});await page.waitForSelector('.nav');
 const who=await ev(()=>({n:U.name,k:U.pkey}));
 ok('phụ huynh: có lớp phủ truy vết phủ toàn màn hình, không chặn thao tác bấm',!!(await page.$('#gmark'))&&await ev(()=>{const s=getComputedStyle(document.querySelector('#gmark'));const r=document.querySelector('#gmark').getBoundingClientRect();return s.position==='fixed'&&s.pointerEvents==='none'&&r.width>=innerWidth-1&&r.height>=innerHeight-1&&+s.zIndex>1e6}));
 const tile=await ev(()=>decodeURIComponent(document.querySelector('#gmark').style.backgroundImage));
 ok('lớp phủ ghi tên phụ huynh, liên hệ và giờ xem',tile.includes(who.n)&&/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(tile)&&(tile.includes(who.k.replace(/^tel:84/,'SĐT 0'))||tile.includes('SĐT 0')||tile.includes('@')),tile.slice(0,400));
 ok('có ghi chú thông tin chỉ dành cho gia đình, không chụp, không chia sẻ',/không chụp màn hình/.test(await ev(()=>document.querySelector('.side').innerText)));
 ok('phụ huynh: chuột phải bị chặn',await prevented('contextmenu'));
 ok('phụ huynh: sao chép, cắt, kéo thả, chọn văn bản bị chặn',(await prevented('copy'))&&(await prevented('cut'))&&(await prevented('dragstart'))&&(await prevented('selectstart')));
 ok('phụ huynh: Ctrl+P, Ctrl+S bị chặn và che màn hình',(await prevented('keydown',{key:'p',ctrlKey:true}))&&(await prevented('keydown',{key:'s',ctrlKey:true}))&&await ev(()=>document.body.classList.contains('gcover')));
 await ev(()=>{document.body.classList.remove('gcover')});
 ok('phụ huynh: Ctrl+C, Ctrl+A, Ctrl+U ngoài ô nhập bị chặn',(await prevented('keydown',{key:'c',ctrlKey:true}))&&(await prevented('keydown',{key:'a',metaKey:true}))&&(await prevented('keydown',{key:'u',ctrlKey:true})));
 const inp=await ev(()=>{const i=document.createElement('input');i.id='gt';document.body.appendChild(i);const e=new Event('copy',{bubbles:true,cancelable:true});i.dispatchEvent(e);const k=new KeyboardEvent('keydown',{key:'c',ctrlKey:true,bubbles:true,cancelable:true});i.dispatchEvent(k);const r={copy:e.defaultPrevented,key:k.defaultPrevented,sel:getComputedStyle(i).userSelect};i.remove();return r});
 ok('trong ô nhập vẫn sao chép, dán được (phụ huynh cần gõ tin nhắn)',!inp.copy&&!inp.key&&inp.sel==='text',inp);
 ok('chữ không chọn được ngoài ô nhập',(await ev(()=>getComputedStyle(document.querySelector('#main')).userSelect))==='none');
 ok('phím PrintScreen: bị chặn và che nội dung',(await prevented('keydown',{key:'PrintScreen'}))&&await ev(()=>document.body.classList.contains('gcover')));
 const cov=await ev(()=>({f:getComputedStyle(document.querySelector('#app')).filter,msg:getComputedStyle(document.body,'::after').content}));
 ok('khi che: nội dung bị làm mờ mạnh và có dòng thông báo',/blur\((2\d|[3-9]\d)px\)/.test(cov.f)&&/che khi/.test(cov.msg),cov);
 await page.screenshot({path:SP+'guard-cover.png'});
 ok('Cmd+Shift+4 (Mac) che nội dung',await ev(()=>{document.body.classList.remove('gcover');document.dispatchEvent(new KeyboardEvent('keydown',{key:'4',metaKey:true,shiftKey:true,bubbles:true}));return document.body.classList.contains('gcover')}));
 await W(1700);
 ok('che xong tự bỏ sau ít giây',!(await ev(()=>document.body.classList.contains('gcover'))) || (await W(1500),!(await ev(()=>document.body.classList.contains('gcover')))));
 /* chuyển cửa sổ */
 await ev(()=>{window.dispatchEvent(new Event('blur'))});
 ok('cửa sổ mất tiêu điểm: làm mờ',await ev(()=>document.body.classList.contains('gaway')&&/blur/.test(getComputedStyle(document.querySelector('#app')).filter)));
 await ev(()=>{window.dispatchEvent(new Event('focus'))});
 ok('trở lại cửa sổ: hiện lại',!(await ev(()=>document.body.classList.contains('gaway'))));
 /* in */
 await page.emulateMedia({media:'print'});
 const pr=await ev(()=>({app:getComputedStyle(document.querySelector('#app')).display,mark:getComputedStyle(document.querySelector('#gmark')).display,msg:getComputedStyle(document.body,'::after').content}));
 ok('in trang: nội dung không in ra, chỉ có thông báo không cho in',pr.app==='none'&&/không cho in/.test(pr.msg),pr);
 await page.emulateMedia({media:'screen'});
 /* gỡ lớp phủ thì dựng lại */
 await ev(()=>document.querySelector('#gmark').remove());await W(60);
 ok('xóa lớp phủ khỏi trang: dựng lại ngay',!!(await page.$('#gmark')));
 await ev(()=>{document.querySelector('#gmark').style.display='none'});await W(60);
 ok('ẩn lớp phủ bằng CSS: hiện lại',await ev(()=>getComputedStyle(document.querySelector('#gmark')).display!=='none'));
 /* chuyển trang giữ lớp phủ, ghi giờ cập nhật */
 await ev(()=>{go('lh');render()});await W(120);
 ok('chuyển trang vẫn có lớp phủ (đúng một lớp)',(await ev(()=>document.querySelectorAll('#gmark').length))===1);
 await page.screenshot({path:SP+'guard-mark.png'});
 /* tên có ký tự đặc biệt không làm hỏng ảnh nền */
 await ev(()=>{U.name='Nguyễn <b>"A"</b> & \'B\'';render()});await W(60);
 const t2=await ev(()=>({img:document.querySelector('#gmark').style.backgroundImage,raw:decodeURIComponent(document.querySelector('#gmark').style.backgroundImage)}));
 ok('tên có ký tự đặc biệt được mã hóa an toàn (không chèn thẻ)',/Nguyễn &lt;b&gt;/.test(t2.raw)&&!/<b>/.test(t2.raw),t2.raw.slice(0,300));
 /* đăng xuất: lớp phủ biến mất; đăng nhập nhân viên không có */
 await ev(()=>{setUser(demoAcc('vp'));render()});await page.waitForSelector('.nav');
 ok('chuyển sang nhân viên: lớp phủ và chặn tắt hẳn',!(await page.$('#gmark'))&&!(await ev(()=>document.body.classList.contains('gph')))&&!(await prevented('contextmenu')));
 ok('không có lỗi script',errs.length===0,errs);
 console.log(`\n${passes} đạt, ${fails} lỗi`);await b.close();process.exit(fails?1:0)})().catch(e=>{console.error('CRASH',e);process.exit(2)});
