/* Z42: mã học sinh sau khi xóa hồ sơ bé: số thứ tự hiển thị (k.no) được dồn cho liên tục, khóa nội bộ k.id không đổi,
   nút "Sắp xếp lại mã" sửa chỗ đứt quãng đã có, bé mới lấy số kế tiếp, giáo viên không thấy nút */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
(async()=>{
 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 const toastTx=()=>ev(()=>(document.querySelector('.toast,#toast')||{}).textContent||'');
 /* ảnh chụp: mỗi bé -> [khóa, số hiển thị, mã hiển thị], theo thứ tự số hiển thị */
 const snap=()=>ev(()=>DB.kids.map(k=>({id:k.id,no:kNo(k),code:kcode(k)})).sort((a,b)=>a.no-b.no));
 const contiguous=a=>a.every((x,i)=>x.no===i+1);
 await login(page,'ql');
 await page.click('.nav button:has-text("Học sinh")');await W(120);

 /* 1. dữ liệu mẫu đang liên tục: không có nút */
 const s0=await snap();
 ok('ban đầu 100 bé, mã liên tục HS01..HS100, chưa có số hiển thị riêng (dữ liệu cũ vẫn đọc từ mã nội bộ)',s0.length===100&&contiguous(s0)&&s0[0].code==='HS01-CN'&&await ev(()=>DB.kids.every(k=>k.no===undefined)));
 ok('mã đang liên tục: không có nút "Sắp xếp lại mã"',await ev(()=>!document.querySelector('#main [data-a="krenopen"]')&&kidRenumPlan().length===0));

 /* 2. xóa một bé ở giữa qua hộp xác nhận: các bé sau dồn lên, khóa không đổi */
 const ref=await ev(()=>({lich:DB.lich.filter(l=>l.hs==='hs011').length,sess:DB.sess.filter(x=>x.k==='hs011').length,ids:DB.kids.map(k=>k.id)}));
 await ev(()=>{ACT.hsdelk('hs010');render()});await W(60);
 const msg=await ev(()=>S.modal.msg);
 ok('hộp xác nhận xóa nói rõ mã của 90 bé phía sau sẽ dồn lên',/Mã của 90 bé phía sau sẽ được dồn lên/.test(msg),msg);
 await ev(()=>{ACT.askyes();render()});await W(80);
 const s1=await snap();
 ok('sau khi xóa: còn 99 bé, số hiển thị liên tục 1..99',s1.length===99&&contiguous(s1),s1.slice(8,12));
 ok('bé phía trước giữ mã (hs009 -> HS09-CN), bé phía sau dồn lên (hs011 -> HS10-BT, hs100 -> HS99-BT)',
   s1.find(x=>x.id==='hs009').code==='HS09-CN'&&s1.find(x=>x.id==='hs011').code==='HS10-BT'&&s1.find(x=>x.id==='hs100').code==='HS99-BT',[s1.find(x=>x.id==='hs009'),s1.find(x=>x.id==='hs011'),s1.find(x=>x.id==='hs100')]);
 const aft=await ev(()=>({lich:DB.lich.filter(l=>l.hs==='hs011').length,sess:DB.sess.filter(x=>x.k==='hs011').length,ids:DB.kids.map(k=>k.id),noKey:DB.kids.every(k=>/^hs\d+$/i.test(k.id))}));
 ok('khóa nội bộ không đổi: các bé còn lại giữ nguyên mã nội bộ, buổi học và buổi can thiệp của bé dồn mã vẫn gắn đúng bé',
   JSON.stringify(aft.ids)===JSON.stringify(ref.ids.filter(i=>i!=='hs010'))&&aft.lich===ref.lich&&aft.sess===ref.sess&&aft.noKey,{ref,aft:{lich:aft.lich,sess:aft.sess}});
 ok('chỉ bé phía sau mới được ghi số hiển thị; bé phía trước không bị đụng đến',await ev(()=>DB.kids.filter(k=>kidNo(k.id)<10).every(k=>k.no===undefined)&&DB.kids.filter(k=>kidNo(k.id)>10).every(k=>k.no===kidNo(k.id)-1)));
 ok('danh sách học sinh hiện mã mới (HS10-BT)',await ev(()=>{S.hs.q='';S.hs.st='';render();const t=document.querySelector('#main').innerText;return/HS10-BT/.test(t)}));

 /* 3. xóa bé cuối: không ai phải dồn, hộp xác nhận không nhắc dồn mã */
 await ev(()=>{ACT.hsdelk('hs100')});const msg2=await ev(()=>S.modal.msg);
 ok('xóa bé cuối: hộp xác nhận không nhắc dồn mã',!/dồn lên/.test(msg2),msg2);
 await ev(()=>{ACT.askyes();render()});await W(60);
 const s2=await snap();
 ok('xóa bé cuối: còn 98 bé, vẫn liên tục',s2.length===98&&contiguous(s2));

 /* 4. chỗ đứt quãng đã có sẵn (như dữ liệu thật HS03, HS04 sau khi HS01, HS02 bị xóa): nút hiện, xem trước, hủy không đổi, đồng ý thì dồn */
 await ev(()=>{DB.kids=DB.kids.filter(k=>!['hs001','hs002','hs020'].includes(k.id));S.hs.q='';S.hs.st='';render()});await W(80);
 const g0=await snap();
 ok('đứt quãng (mất 3 bé): có nút "Sắp xếp lại mã" trên đầu trang',await ev(()=>!!document.querySelector('#main [data-a="krenopen"]'))&&!contiguous(g0)&&g0[0].code==='HS03-BT',g0.slice(0,3));
 await page.click('#main [data-a="krenopen"]');await page.waitForSelector('.mdc');await W(60);
 const pv=await ev(()=>{const rows=[...document.querySelectorAll('.mdc tbody tr')].map(r=>[...r.cells].map(c=>c.textContent.trim()));return{n:rows.length,first:rows[0],plan:kidRenumPlan().length,title:document.querySelector('.mdc h2').textContent}});
 ok('hộp xem trước: tiêu đề đúng, mỗi bé phải đổi một dòng, dòng đầu HS03-BT -> HS01-BT',pv.title==='Sắp xếp lại mã học sinh'&&pv.n===pv.plan&&pv.plan>=1&&pv.first[1]==='HS03-BT'&&pv.first[2]==='HS01-BT',pv);
 await page.click('.mdc [data-a="mx"]');await W(60);
 ok('bấm Hủy: chưa đổi gì',JSON.stringify(await snap())===JSON.stringify(g0)&&await ev(()=>!S.modal));
 await page.click('#main [data-a="krenopen"]');await page.waitForSelector('.mdc');await W(40);
 const order0=g0.map(x=>x.id);
 await page.click('.mdc [data-a="krenyes"]');await W(100);
 const g1=await snap();
 ok('đồng ý: số hiển thị liên tục 1..N, thứ tự cũ được giữ nguyên',contiguous(g1)&&JSON.stringify(g1.map(x=>x.id))===JSON.stringify(order0),g1.slice(0,3));
 ok('bé đầu tiên (hs003) thành HS01-BT, khóa vẫn là hs003',g1[0].id==='hs003'&&g1[0].code==='HS01-BT',g1[0]);
 ok('xong thì nút biến mất, có thông báo',await ev(()=>!document.querySelector('#main [data-a="krenopen"]'))&&/Đã sắp xếp lại mã của \d+ bé/.test(await toastTx()),await toastTx());
 ok('bấm lại hành động khi đã liên tục: chỉ báo, không mở hộp thoại',await ev(()=>{ACT.krenopen();return!S.modal}));

 /* 5. thêm bé mới qua form: lấy số kế tiếp, khóa là mã mới duy nhất */
 const N=g1.length,idsBefore=await ev(()=>DB.kids.map(k=>k.id));
 await page.click('[data-a="hsnew"]');await page.waitForSelector('#hsff');
 await page.fill('#hf-n','Bé Mã Mới');await page.fill('#hf-pn','Mẹ Thử');await page.fill('#hf-pp','0905111222');
 await page.check('#hf-hbt');await W(40);
 await page.click('#hsff button[type=submit]');await W(120);
 const nk=await ev(()=>{const k=DB.kids.find(x=>x.n==='Bé Mã Mới');return k?{id:k.id,no:k.no,code:kcode(k)}:null});
 ok('bé mới: số hiển thị là N+1 và mã hiển thị liên tục',nk&&nk.no===N+1&&nk.code==='HS'+String(N+1).padStart(2,'0')+'-BT',nk);
 ok('bé mới: khóa nội bộ là mã chưa từng có trong danh sách',nk&&!idsBefore.includes(nk.id),nk);
 const s3=await snap();
 ok('thêm bé xong, mã vẫn liên tục',contiguous(s3)&&s3.length===N+1);
 ok('thêm bé không làm hiện nút sắp xếp lại',await ev(()=>{S.modal=null;render();return!document.querySelector('#main [data-a="krenopen"]')}));

 /* 6. giáo viên: không có nút, không dồn được */
 await page.evaluate(()=>{localStorage.removeItem('gb_v2')});
 const o2=await open();const pg=o2.page;await login(pg,'gv');
 await pg.evaluate(()=>{DB.kids=DB.kids.filter(k=>k.id!=='hs001');go('hs');render()});await pg.waitForTimeout(150);
 const gvx=await pg.evaluate(()=>({btn:!!document.querySelector('#main [data-a="krenopen"]'),r1:ACT.krenopen(),r2:ACT.krenyes(),no:DB.kids.some(k=>k.no!==undefined)}));
 ok('giáo viên: không có nút, hai hành động bị từ chối và không đổi số nào',!gvx.btn&&gvx.r1===false&&gvx.r2===false&&!gvx.no,gvx);
 await o2.b.close();

 ok('không có lỗi JS',errs.length===0&&o2.errs.length===0,errs.concat(o2.errs));
 await b.close();
 console.log(passes+' PASS, '+fails+' FAIL');process.exit(fails?1:0)})();
