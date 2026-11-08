/* Kiểm thử hàm api/accounts.js với máy chủ Supabase giả lập (HTTP thật trên máy này) */
const http=require('http');
const SECRET='sb_secret_TESTSECRET123',PUB='sb_publishable_SHk0kLdrNieeOY9Ilfw27g_vHe7Jd8A';
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('PASS',n)}else{fail++;console.log('FAIL',n,x===undefined?'':x)}};
const st={users:[],profiles:[],records:[],tokens:{},failProfile:false,n:0};
const mkUser=(email,pw)=>{const u={id:'id'+(++st.n),email,pw,banned:false,confirmed:true};st.users.push(u);return u};
const tt=mkUser('tt@gb.vn','x'),gv=mkUser('gv@gb.vn','x');
st.profiles.push({user_id:tt.id,role:'tt',staff_id:null,full_name:'TT'},{user_id:gv.id,role:'gv',staff_id:'nv04',full_name:'GV'});
st.tokens.TTTOK=tt.id;st.tokens.GVTOK=gv.id;
const orphan=mkUser('orphan@gb.vn','x');            /* có tài khoản đăng nhập nhưng chưa có vai trò */
st.records.push({collection:'staff',id:'nv30',data:{id:'nv30',n:'Văn Phòng Mới',role:'vp',em:'vpmoi@gb.vn',st:'dang'}},
 {collection:'staff',id:'nv31',data:{id:'nv31',n:'Giáo Viên Mới',role:'gv',em:'gvmoi@gb.vn',st:'dang'}},
 {collection:'staff',id:'nv32',data:{id:'nv32',n:'Đã Nghỉ',role:'gv',em:'nghi@gb.vn',st:'nghi'}},
 {collection:'staff',id:'nv33',data:{id:'nv33',n:'Lỗi Profile',role:'ql',em:'loi@gb.vn',st:'dang'}});
const send=(res,code,o)=>{res.writeHead(code,{'content-type':'application/json'});res.end(code===204?'':JSON.stringify(o))};
const srv=http.createServer((req,res)=>{let body='';req.on('data',c=>body+=c);req.on('end',()=>{
 const u=new URL(req.url,'http://x'),p=u.pathname,key=req.headers['apikey'],j=body?JSON.parse(body):null,secret=key===SECRET;
 if(p==='/auth/v1/user'){const t=(req.headers.authorization||'').replace('Bearer ','');const id=st.tokens[t];const us=st.users.find(x=>x.id===id);return us?send(res,200,{id:us.id,email:us.email}):send(res,401,{msg:'bad jwt'})}
 if(!secret)return send(res,401,{message:'secret key required'});
 if(p==='/auth/v1/admin/users'&&req.method==='GET')return send(res,200,{users:st.users.map(x=>({id:x.id,email:x.email}))});
 if(p==='/auth/v1/admin/users'&&req.method==='POST'){if(st.users.some(x=>x.email===j.email))return send(res,422,{msg:'email_exists'});const nu=mkUser(j.email,j.password);nu.confirmed=!!j.email_confirm;return send(res,200,{id:nu.id,email:nu.email})}
 let m=/^\/auth\/v1\/admin\/users\/(.+)$/.exec(p);
 if(m&&req.method==='PUT'){const x=st.users.find(y=>y.id===m[1]);if(!x)return send(res,404,{});if(j.password)x.pw=j.password;if(j.ban_duration)x.banned=j.ban_duration!=='none';if(j.email_confirm)x.confirmed=true;return send(res,200,{id:x.id})}
 if(m&&req.method==='DELETE'){st.users=st.users.filter(y=>y.id!==m[1]);return send(res,200,{})}
 if(p==='/rest/v1/profiles'){
  if(req.method==='GET'){const f=u.searchParams.get('user_id');return send(res,200,st.profiles.filter(x=>!f||x.user_id===f.replace('eq.','')))}
  if(req.method==='POST'){if(st.failProfile||j.user_id==='fail')return send(res,500,{message:'boom'});if(st.profiles.some(x=>x.user_id===j.user_id))return send(res,409,{});st.profiles.push(j);return send(res,201,{})}
  if(req.method==='DELETE'){const f=u.searchParams.get('user_id').replace('eq.','');st.profiles=st.profiles.filter(x=>x.user_id!==f);return send(res,204,{})}}
 if(p==='/rest/v1/records'&&req.method==='GET'){const c=u.searchParams.get('collection').replace('eq.',''),id=u.searchParams.get('id').replace('eq.','');return send(res,200,st.records.filter(r=>r.collection===c&&r.id===id).map(r=>({data:r.data})))}
 send(res,404,{})})});
(async()=>{await new Promise(r=>srv.listen(0,r));
 process.env.SUPABASE_URL='http://127.0.0.1:'+srv.address().port;process.env.SUPABASE_SECRET_KEY=SECRET;
 const handler=require('../api/accounts.js');const all=[];
 const call=async(body,tok,method)=>{const req={method:method||'POST',headers:tok?{authorization:'Bearer '+tok}:{},body};const out={code:0,body:''};
  const res={statusCode:200,setHeader(){},end(b){out.body=b}};await handler(req,res);out.code=res.statusCode;try{out.json=JSON.parse(out.body)}catch(e){out.json={}}all.push(out.body);return out};
 /* quyền truy cập */
 ok('GET bị từ chối (405)',(await call(null,'TTTOK','GET')).code===405);
 ok('Thiếu mã đăng nhập: 401',(await call({action:'list'})).code===401);
 ok('Mã đăng nhập sai: 401',(await call({action:'list'},'XXX')).code===401);
 ok('Giáo viên gọi: 403',(await call({action:'list'},'GVTOK')).code===403);
 ok('Giáo viên không tạo được tài khoản: 403',(await call({action:'create',staff_id:'nv30',email:'vpmoi@gb.vn',role:'vp',password:'abcdefgh'},'GVTOK')).code===403);
 ok('Thao tác lạ: 400',(await call({action:'xoa-het'},'TTTOK')).code===400);
 /* danh sách */
 const l=await call({action:'list'},'TTTOK');
 ok('Danh sách chỉ gồm tài khoản đã có vai trò',l.code===200&&l.json.accounts.length===2&&!l.json.accounts.some(a=>a.email==='orphan@gb.vn'));
 /* kiểm tra dữ liệu vào */
 const base={action:'create',staff_id:'nv30',email:'vpmoi@gb.vn',role:'vp',password:'matkhau123'};
 ok('Email sai định dạng: 400',(await call({...base,email:'khong-phai-email'},'TTTOK')).code===400);
 ok('Không cấp vai trò Trưởng Trung tâm: 400',(await call({...base,role:'tt'},'TTTOK')).code===400);
 ok('Không cấp vai trò Phụ huynh: 400',(await call({...base,role:'ph'},'TTTOK')).code===400);
 ok('Mật khẩu ngắn: 400',(await call({...base,password:'abc'},'TTTOK')).code===400);
 ok('Hồ sơ nhân viên chưa lưu: 409',(await call({...base,staff_id:'nv99'},'TTTOK')).code===409);
 ok('Email khác hồ sơ đã lưu: 409',(await call({...base,email:'khac@gb.vn'},'TTTOK')).code===409);
 ok('Vai trò khác hồ sơ đã lưu: 409',(await call({...base,role:'gv'},'TTTOK')).code===409);
 ok('Nhân viên đã nghỉ: 409',(await call({action:'create',staff_id:'nv32',email:'nghi@gb.vn',role:'gv',password:'matkhau123'},'TTTOK')).code===409);
 ok('Chưa tạo gì sau các lần từ chối',!st.users.some(u=>u.email==='vpmoi@gb.vn'));
 /* tạo thành công */
 const c=await call(base,'TTTOK');
 const nu=st.users.find(u=>u.email==='vpmoi@gb.vn'),pr=nu&&st.profiles.find(x=>x.user_id===nu.id);
 ok('Tạo tài khoản Văn phòng thành công',c.code===200&&nu&&nu.pw==='matkhau123'&&nu.confirmed,JSON.stringify(c.json));
 ok('Vai trò, mã nhân viên và tên được gắn đúng',pr&&pr.role==='vp'&&pr.staff_id==='nv30'&&pr.full_name==='Văn Phòng Mới');
 ok('Tạo trùng: 409',(await call(base,'TTTOK')).code===409);
 /* hoàn tác khi gắn vai trò lỗi */
 st.failProfile=true;const f=await call({action:'create',staff_id:'nv33',email:'loi@gb.vn',role:'ql',password:'matkhau123'},'TTTOK');st.failProfile=false;
 ok('Gắn vai trò lỗi: báo lỗi và hoàn tác, không để lại tài khoản mồ côi',f.code===500&&!st.users.some(u=>u.email==='loi@gb.vn'),f.code);
 /* đặt lại mật khẩu */
 ok('Đặt lại mật khẩu thành công',(await call({action:'setpw',email:'vpmoi@gb.vn',password:'moimoi2026'},'TTTOK')).code===200&&nu.pw==='moimoi2026');
 ok('Đặt mật khẩu cho tài khoản không tồn tại: 404',(await call({action:'setpw',email:'nobody@gb.vn',password:'moimoi2026'},'TTTOK')).code===404);
 ok('Không đặt được mật khẩu cho tài khoản chưa có vai trò: 404',(await call({action:'setpw',email:'orphan@gb.vn',password:'moimoi2026'},'TTTOK')).code===404);
 /* thu hồi */
 ok('Không tự thu hồi chính mình: 400',(await call({action:'remove',email:'tt@gb.vn'},'TTTOK')).code===400);
 ok('Không thu hồi tài khoản Trưởng Trung tâm khác',(await call({action:'remove',email:'tt@gb.vn'},'TTTOK')).code!==200);
 const d=await call({action:'remove',email:'vpmoi@gb.vn'},'TTTOK');
 ok('Thu hồi: xóa vai trò và khóa tài khoản',d.code===200&&!st.profiles.some(x=>x.user_id===nu.id)&&nu.banned);
 /* cấp lại sau khi thu hồi: dùng lại tài khoản, mở khóa */
 const again=await call({...base,password:'lancuoi2026'},'TTTOK');
 ok('Cấp lại sau thu hồi: mở khóa, đặt mật khẩu mới, gắn lại vai trò',again.code===200&&!nu.banned&&nu.pw==='lancuoi2026'&&st.profiles.some(x=>x.user_id===nu.id)&&st.users.filter(u=>u.email==='vpmoi@gb.vn').length===1);
 /* bảo mật khóa secret */
 ok('Khóa secret không bao giờ xuất hiện trong phản hồi',!all.join('').includes(SECRET)&&!all.join('').includes('TESTSECRET'));
 delete process.env.SUPABASE_SECRET_KEY;const nk=await call({action:'list'},'TTTOK');
 ok('Thiếu khóa secret: báo cấu hình, không lỗi treo',nk.code===500&&/SUPABASE_SECRET_KEY/.test(nk.json.error));
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);srv.close();process.exit(fail?1:0)})();
