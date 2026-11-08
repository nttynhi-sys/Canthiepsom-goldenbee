const {chromium}=require('playwright');const path=require('path');const {makeServer}=require('./cloud-mock.js');
const URL='file://'+path.resolve(__dirname,'../src/build/page-test.html')+'?cloud';
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('PASS',n)}else{fail++;console.log('FAIL',n,x===undefined?'':x)}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch(),errs=[];
 const srv=makeServer({'tt@gb.vn':{pw:'pw1',uid:'u-tt',role:'tt',name:'TT',email:'tt@gb.vn'}});
 const api={accounts:[{email:'tt@gb.vn',role:'tt',staff_id:null,full_name:'TT'}],calls:[]};
 async function mk(){const ctx=await b.newContext({viewport:{width:1366,height:900}}),page=await ctx.newPage();
  page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|net::/.test(m.text()))errs.push('CONSOLE '+m.text())});
  await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());await srv.attach(page);
  await ctx.addInitScript(()=>{window.GB_API='https://gb.test'});await page.route('https://gb.test/api/accounts',async route=>{const rq=route.request(),b=JSON.parse(rq.postData()||'{}'),auth=rq.headers()['authorization']||'';api.calls.push(b.action+(auth.startsWith('Bearer ')?'':' (không có mã)'));
   const j=(c,o)=>route.fulfill({status:c,contentType:'application/json',body:JSON.stringify(o)});
   if(b.action==='list')return j(200,{accounts:api.accounts});
   if(b.action==='create'){if(api.accounts.some(a=>a.email===b.email))return j(409,{error:'Email này đã có tài khoản.'});api.accounts.push({email:b.email,role:b.role,staff_id:b.staff_id,full_name:''});api.lastCreate=b;return j(200,{ok:true})}
   if(b.action==='setpw'){api.lastPw=b;return j(200,{ok:true})}
   if(b.action==='remove'){api.accounts=api.accounts.filter(a=>a.email!==b.email);return j(200,{ok:true})}
   return j(400,{error:'?'})});
  await page.goto(URL);return{ctx,page}}
 let {ctx,page}=await mk();
 await page.waitForSelector('#login');await page.fill('#lg-e','tt@gb.vn');await page.fill('#lg-p','pw1');await page.click('#login button[type=submit]');
 await page.waitForSelector('[data-a="csetup"]');await page.click('[data-v="demo"]');await page.waitForSelector('.nav');
 for(let i=0;i<30&&srv.recs.size<3000;i++)await sleep(400);await sleep(1500);
 ok('Trưởng TT vào được, app tải danh sách tài khoản',api.calls.includes('list'));
 await page.evaluate(()=>{go('ns');render()});await sleep(200);
 const t0=await page.textContent('#main');
 ok('Danh sách nhân sự có cột Tài khoản và trạng thái',/Tài khoản/.test(t0)&&/Chưa cấp/.test(t0));
 ok('Không còn nhắc mật khẩu chung 123456 của bản trình diễn',!/123456/.test(t0));
 ok('Không có nút "Đặt lại dữ liệu mẫu" trong Cài đặt (tránh xóa dữ liệu thật)',await page.evaluate(()=>{S.ns.tab='cd';render();return !document.querySelector('[data-a="reset"]')}));
 ok('ACT.reset bị chặn ở chế độ máy chủ',(await page.evaluate(()=>ACT.reset()))===false);
 await page.evaluate(()=>{S.ns.tab='ds';render()});
 /* mở hồ sơ giáo viên nv04 */
 await page.evaluate(()=>{ACT.nvopen('nv04');render()});await sleep(150);
 const em=await page.evaluate(()=>stBy('nv04').em);
 ok('Hồ sơ giáo viên có mục Tài khoản đăng nhập, chưa có tài khoản',/Tài khoản đăng nhập/.test(await page.textContent('.mdc'))&&!!(await page.$('#accnew')));
 await page.click('[data-a="accgen"]');const pw=await page.inputValue('#acc-pw');
 ok('Tạo mật khẩu ngẫu nhiên 10 ký tự',/^[A-Za-z0-9]{10}$/.test(pw)&&!/[0O1lI]/.test(pw),pw);
 await page.fill('#acc-pw','ngan');await page.click('#accnew button[type=submit]');await sleep(300);
 ok('Mật khẩu ngắn bị chặn ngay ở form (không gọi máy chủ)',!api.calls.includes('create'));
 await page.fill('#acc-pw',pw);await page.click('#accnew button[type=submit]');await sleep(1500);
 ok('Cấp tài khoản: gửi đúng email, vai trò, mã nhân viên',api.lastCreate&&api.lastCreate.email===em&&api.lastCreate.role==='gv'&&api.lastCreate.staff_id==='nv04'&&api.lastCreate.password===pw,JSON.stringify(api.lastCreate));
 const mt=await page.textContent('.mdc');
 ok('Sau khi cấp: hiện Đã có tài khoản và mật khẩu vừa đặt',/Đã có tài khoản/.test(mt)&&mt.includes(pw));
 await page.fill('#acc-pw','matkhaumoi99');await page.click('#accpw button[type=submit]');await sleep(800);
 ok('Đặt lại mật khẩu gửi lên máy chủ',api.lastPw&&api.lastPw.email===em&&api.lastPw.password==='matkhaumoi99');
 await page.click('[data-a="accdel"]');await sleep(200);
 ok('Thu hồi có hộp xác nhận',/Thu hồi quyền đăng nhập của/.test(await page.textContent('.mdc')));
 await page.click('[data-a="askyes"]');await sleep(1000);
 ok('Thu hồi xong: tài khoản biến mất khỏi danh sách',!api.accounts.some(a=>a.email===em));
 /* tài khoản chính mình (Trưởng TT) và nhân viên hành chính */
 await page.evaluate(()=>{S.modal=null;ACT.nvopen('nv02');render()});await sleep(150);
 ok('Hồ sơ Trưởng TT: chỉ ghi chú, không có nút cấp tài khoản',/tạo trực tiếp trong Supabase/.test(await page.textContent('.mdc'))&&!(await page.$('#accnew')));
 /* đổi mật khẩu chính mình */
 await page.evaluate(()=>{S.modal=null;render()});await page.click('[data-a="pwopen"]');await sleep(150);
 await page.fill('#pw-1','abcdefgh1');await page.fill('#pw-2','khacnhau22');await page.click('#pwf button[type=submit]');await sleep(300);
 ok('Đổi mật khẩu: hai lần nhập khác nhau bị từ chối',(await page.textContent('.toast'))===('Hai lần nhập mật khẩu chưa giống nhau')&&!!(await page.$('#pwf')));
 await page.fill('#pw-1','abcdefgh1');await page.fill('#pw-2','abcdefgh1');await page.click('#pwf button[type=submit]');await sleep(800);
 ok('Đổi mật khẩu thành công và đóng hộp thoại',!(await page.$('#pwf'))&&srv.users['tt@gb.vn'].pw==='abcdefgh1');
 /* Văn phòng không thấy cột Tài khoản và không có phần cấp tài khoản */
 const vpEm=srv.recs.get('staff|nv26').data.em;srv.users[vpEm]={pw:'pw1',uid:'u-vp',role:'vp',name:'VP',email:vpEm};srv.profiles['u-vp']={role:'vp',full_name:'VP'};
 await ctx.close();
 ({ctx,page}=await mk());api.calls.length=0;
 await page.waitForSelector('#login');await page.fill('#lg-e','tt@gb.vn');await page.fill('#lg-p','abcdefgh1');await page.click('#login button[type=submit]');await page.waitForSelector('.nav',{timeout:30000});
 ok('Đăng nhập lại bằng mật khẩu mới thành công',true);
 await ctx.close();
 ({ctx,page}=await mk());api.calls.length=0;
 await page.waitForSelector('#login');await page.fill('#lg-e','');await page.fill('#lg-e',vpEm);await page.fill('#lg-p','pw1');await page.click('#login button[type=submit]');await page.waitForSelector('.nav',{timeout:30000});
 await page.evaluate(()=>{go('ns');render()});await sleep(200);
 const tv=await page.textContent('#main');
 ok('Văn phòng: danh sách nhân sự không có cột Tài khoản và không gọi API tài khoản',!/Chưa cấp|Đã cấp/.test(tv)&&api.calls.length===0,api.calls.join(','));
 await ctx.close();
 console.log('Lỗi trang:',errs.length?errs.join('\n'):'không');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);await b.close();process.exit(fail||errs.length?1:0)})();
