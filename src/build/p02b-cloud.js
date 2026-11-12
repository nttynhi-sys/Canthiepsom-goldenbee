/* ===== Kết nối Supabase: đăng nhập thật, lưu dữ liệu dùng chung, tách riêng dữ liệu tiền ===== */
/* Khóa dưới đây là khóa "publishable", an toàn khi đặt trong trình duyệt. Quyền xem và sửa dữ liệu do máy chủ kiểm tra (RLS). */
const SB={url:'https://bqvwibipmzyrkrwlfoqf.supabase.co',key:'sb_publishable_SHk0kLdrNieeOY9Ilfw27g_vHe7Jd8A'};
const CLD={stage:'login',ss:null,role:null,pname:'',err:'',email:'',st:'ok',msg:'',snap:new Map(),ord:{},maxo:0,since:{records:'1970-01-01T00:00:00Z',money:'1970-01-01T00:00:00Z'},flushing:false,again:false,pulling:false,tm:0};
const MONEY_ROLES=['tt','vp'],CLOUD_ROLES=['tt','vp','ql','gv'];
/* Số điện thoại về dạng quốc tế không dấu cộng (vd 84901234567); rỗng nếu chưa hợp lệ. Phải giống api/_lib.js */
function telNorm(s){let t=String(s==null?'':s).trim();if(!t)return'';
 const plus=t[0]==='+';t=t.replace(/\D/g,'');if(!t)return'';
 if(t.startsWith('00')){t=t.slice(2);return t.length>=8&&t.length<=15?t:''}
 if(plus)return t.length>=8&&t.length<=15?t:'';
 if(t[0]==='0')t='84'+t.slice(1);else if(!(t.startsWith('84')&&t.length>=11)&&t.length===9)t='84'+t;
 return /^84\d{9,10}$/.test(t)?t:''}
/* Khóa phụ huynh: email (nếu có), nếu không thì số điện thoại. Mọi bé cùng khóa thuộc cùng một tài khoản phụ huynh. */
const pkeyOf=k=>{const e=String(k&&k.pe||'').trim().toLowerCase();if(e&&e.includes('@'))return e;const t=telNorm(k&&k.pp);return t?'tel:'+t:''};
/* Hình dạng từng nhóm dữ liệu: danh sách có mã (id hoặc k), bảng khóa, mục đơn */
const CSH={arr:['staff','kids','cg','tg','plans','sess','groups','lich','lr','mk','lg','rp','nt','tkb','hol','media','ref','tri','vio'],arrk:{tpl:'k'},map:['att','ts','set','rd','menu','bon','vam','kpr'],one:['cfg']};
/* Nhóm dữ liệu tiền: chỉ Trưởng Trung tâm và Văn phòng đọc và ghi được (giáo viên chỉ đọc lương của mình) */
const MONEYC=['lg','set','bon','vam','kpr'],CFG_MONEY=['p11','pbtDay','pbtDay11','giamTru','thue','v1','v2','lt_ng','lt_nh','lt_gq','lt_ms','lt_vd','lt_tc','lt_nc'],CFG_DEF={pbtDay:380000,pbtDay11:180000,v1:20000,v2:30000,lt_ng:180000,lt_nh:180000,lt_gq:200000,lt_ms:200000,lt_vd:200000,lt_tc:180000,lt_nc:190000};   /* dữ liệu cũ chưa có giá bán trú theo ngày thì lấy giá mặc định */
const PAY_STUB=()=>({mode:'thang',base:0,rate:0,rateBt:0,allow:0,bh:0,latePen:0});
const canM=()=>MONEY_ROLES.includes(CLD.role);
const KEYF=c=>CSH.arrk[c]||'id';
const tblOf=(c)=>(MONEYC.includes(c)||c==='pay'||c==='cfgm')?'money':'records';
const tblName=t=>t==='money'?'money_records':'records';

/* ---- phiên đăng nhập ---- */
function sbLoad(){try{return JSON.parse(localStorage.getItem('gb_sb')||'null')}catch(e){return null}}
function sbStore(s){try{if(s)localStorage.setItem('gb_sb',JSON.stringify(s));else localStorage.removeItem('gb_sb')}catch(e){}}
async function sbReq(path,o){o=o||{};
 const go=()=>{const h=Object.assign({apikey:SB.key,'Content-Type':'application/json'},o.headers||{});
  if(CLD.ss&&o.auth!==false)h.Authorization='Bearer '+CLD.ss.at;
  return fetch(SB.url+path,{method:o.method||'GET',headers:h,body:o.body===undefined?undefined:JSON.stringify(o.body)})};
 let r=await go();
 if(r.status===401&&CLD.ss&&o.auth!==false&&await sbRefresh())r=await go();
 return r}
function sbSess(j){return{at:j.access_token,rt:j.refresh_token,uid:j.user.id,email:String(j.user.email||'').toLowerCase()}}
async function sbRefresh(){if(!CLD.ss||!CLD.ss.rt)return false;
 try{const r=await sbReq('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:CLD.ss.rt},auth:false});
  if(!r.ok)return false;CLD.ss=sbSess(await r.json());sbStore(CLD.ss);return true}catch(e){return false}}
async function errText(r){let t='';try{const j=await r.json();t=j.message||j.error||j.error_description||j.hint||''}catch(e){}return (r.status===401||r.status===403?'Không có quyền ghi dữ liệu. ':'')+(t||('Lỗi máy chủ '+r.status))}
async function sbAll(table,extra){const out=[];
 for(let off=0;;off+=1000){
  const r=await sbReq('/rest/v1/'+table+'?select=collection,id,data,updated_at&order=collection,id&limit=1000&offset='+off+(extra||''));
  if(!r.ok)throw new Error(await errText(r));
  const a=await r.json();out.push(...a);if(a.length<1000)break}
 return out}

/* ---- chuyển DB trong bộ nhớ thành các dòng để lưu ---- */
function ordOf(c,id){const k=c+'|'+id;if(CLD.ord[k]==null)CLD.ord[k]=++CLD.maxo;return CLD.ord[k]}
function cflat(db,withMoney){const M=new Map();
 const add=(t,c,id,v)=>M.set(t+'|'+c+'|'+id,{t,c,id,s:JSON.stringify(v)});
 CSH.arr.concat(Object.keys(CSH.arrk)).forEach(c=>{
  const money=MONEYC.includes(c);if(money&&!withMoney)return;
  (db[c]||[]).forEach(x=>{const id=String(x[KEYF(c)]);let d=x;
   if(c==='staff'){d=Object.assign({},x);const pay=d.pay;delete d.pay;if(withMoney&&pay)add('money','pay',id,pay)}
   add(money?'money':'records',c,id,Object.assign({_o:ordOf(c,id)},d))})});
 CSH.map.forEach(c=>{const money=MONEYC.includes(c);if(money&&!withMoney)return;const o=db[c]||{};Object.keys(o).forEach(k=>add(money?'money':'records',c,k,o[k]))});
 const cfg=Object.assign({},db.cfg),cm={};CFG_MONEY.forEach(k=>{cm[k]=cfg[k];delete cfg[k]});
 add('records','cfg','_',cfg);if(withMoney)add('money','cfgm','_',cm);
 return M}

/* ---- dựng DB từ các dòng đã tải ---- */
function cEmpty(){return{v:7,vio:[],vam:{},kpr:{},media:[],ref:[],tri:[],hol:[],tkb:[],cfg:{},staff:[],kids:[],cg:[],tg:[],plans:[],sess:[],groups:[],lich:[],att:{},ts:{},lr:[],mk:[],lg:[],set:{},rp:[],tpl:[],nt:[],bon:{},rd:{},menu:{}}}
function cApply(D,t,r,pay,cfgm){const c=r.collection;
 if(t==='money'&&c==='pay'){pay[r.id]=r.data;return}
 if(t==='money'&&c==='cfgm'){Object.assign(cfgm,r.data);cfgm._has=1;return}
 if(c==='cfg'){Object.assign(D.cfg,r.data);return}
 if(CSH.map.includes(c)){D[c][r.id]=r.data;return}
 if(CSH.arr.includes(c)||CSH.arrk[c]){const x=Object.assign({},r.data);
  if(x._o!=null){CLD.ord[c+'|'+r.id]=x._o;CLD.maxo=Math.max(CLD.maxo,x._o);delete x._o}
  const kf=KEYF(c),i=D[c].findIndex(y=>String(y[kf])===String(r.id));if(i>=0)D[c][i]=x;else D[c].push(x)}}
function cFinish(D,pay,cfgm){
 CSH.arr.concat(Object.keys(CSH.arrk)).forEach(c=>{const kf=KEYF(c);D[c].sort((a,b)=>{const x=CLD.ord[c+'|'+a[kf]],y=CLD.ord[c+'|'+b[kf]];return (x==null?1e12:x)-(y==null?1e12:y)||(String(a[kf])<String(b[kf])?-1:1)})});
 D.staff.forEach(s=>{s.pay=pay[s.id]||PAY_STUB()});
 CFG_MONEY.forEach(k=>{D.cfg[k]=cfgm[k]!=null?cfgm[k]:(cfgm._has&&CFG_DEF[k]!=null?CFG_DEF[k]:0)});
 if(!D.tpl.length)D.tpl=TPL0.map(x=>({...x}));
 return D}
function cbuild(rr,mr){const D=cEmpty(),pay={},cfgm={};CLD.ord={};CLD.maxo=0;
 rr.forEach(r=>cApply(D,'records',r,pay,cfgm));mr.forEach(r=>cApply(D,'money',r,pay,cfgm));
 return cFinish(D,pay,cfgm)}
const maxAt=(a,cur)=>a.reduce((m,r)=>r.updated_at&&r.updated_at>m?r.updated_at:m,cur);

/* ---- trạng thái hiển thị ---- */
function setSt(s,msg){CLD.st=s;CLD.msg=msg||'';const el=$q('#cl-st');if(el){el.textContent=stText();el.title=CLD.msg;el.className='sm '+(s==='err'?'er':'mu')}}
const stText=()=>CLD.st==='saving'?'Đang lưu...':CLD.st==='err'?'Chưa lưu được':'Đã lưu';

/* ---- đăng nhập và tải dữ liệu ---- */
function viLoginErr(m){m=String(m||'');if(/invalid login|invalid_grant|credentials/i.test(m))return 'Email, số điện thoại hoặc mật khẩu chưa đúng.';if(/email not confirmed/i.test(m))return 'Tài khoản chưa được xác nhận. Hãy nhờ Trưởng Trung tâm kiểm tra.';if(/failed to fetch|network/i.test(m))return 'Không kết nối được máy chủ. Hãy kiểm tra mạng.';return m||'Đăng nhập không thành công.'}
/* Số điện thoại → email dùng để đăng nhập (tra ở máy chủ, vì Supabase đăng nhập bằng email) */
async function cloudResolve(tel){
 const r=await fetch((typeof window.GB_API==='string'?window.GB_API:'')+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:tel})});
 if(r.status===404)throw new Error('Máy chủ chưa có chức năng đăng nhập bằng số điện thoại. Hãy đăng nhập bằng email.');
 const j=await r.json().catch(()=>({}));
 if(!r.ok||!j.email)throw new Error(j.error||'Không tra cứu được số điện thoại. Hãy thử lại hoặc đăng nhập bằng email.');
 return j.email}
async function cloudLogin(idf,pw){
 idf=String(idf||'').trim();CLD.err='';CLD.email=idf;CLD.stage='loading';render();
 try{let email=idf.toLowerCase();
  if(!idf.includes('@')){const t=telNorm(idf);if(!t)throw new Error('Hãy nhập email hoặc số điện thoại hợp lệ.');email=await cloudResolve(t)}
  const r=await sbReq('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password:pw},auth:false});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error_description||j.msg||j.message||('Lỗi '+r.status));
  CLD.ss=sbSess(j);sbStore(CLD.ss)}
 catch(e){CLD.stage='login';CLD.err=viLoginErr(e.message);render();return}
 await cloudLoad()}
function cMsg(m){CLD.stage='msg';CLD.msg=m;render()}
async function cloudLoad(){
 CLD.stage='loading';render();
 try{
  const pr=await sbReq('/rest/v1/profiles?select=role,full_name,staff_id&user_id=eq.'+encodeURIComponent(CLD.ss.uid));
  if(pr.status===401){cloudDrop('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.');return}
  if(!pr.ok)throw new Error(await errText(pr));
  const p=(await pr.json())[0];
  if(!p){cMsg('Tài khoản này chưa được cấp vai trò. Hãy nhờ Trưởng Trung tâm cấp quyền cho tài khoản này.');return}
  CLD.role=p.role;CLD.pname=p.full_name||'';CLD.sid=p.staff_id||'';
  if(p.role==='ph'){await phLoad();return}
  if(!CLOUD_ROLES.includes(p.role)){cMsg('Vai trò của tài khoản chưa được hỗ trợ.');return}
  const rr=await sbAll('records'),mr=p.role==='ql'?[]:await sbAll('money_records');
  if(!rr.some(r=>r.collection==='cfg')){
   if(p.role==='tt'){CLD.stage='setup';render();return}
   cMsg('Trung tâm chưa có dữ liệu. Hãy nhờ Trưởng Trung tâm đăng nhập và khởi tạo trước.');return}
  DB=cbuild(rr,mr);CLD.since={records:maxAt(rr,'1970-01-01T00:00:00Z'),money:maxAt(mr,'1970-01-01T00:00:00Z')};
  CLD.snap=new Map();cflat(DB,canM()).forEach((v,k)=>CLD.snap.set(k,v.s));
  /* máy chủ chưa có thời khóa biểu bán trú: dùng bản mẫu (mã dòng cố định nên nhiều người mở cùng lúc không bị trùng) và lưu lên */
  const needTkb=!DB.tkb.length&&DB.groups.length>0;if(needTkb)DB.tkb=tkbDefault(DB.groups);
  /* nhân sự chỉ trả theo ca 1-1 chưa có cờ không-chấm-công (s.cc): Trưởng Trung tâm hoặc Văn phòng đăng nhập (đọc được hình thức trả lương) thì ghi cờ một lần; các vai trò khác không thấy lương nên không tự suy ra */
  const nCC=canM()?ccBackfill():0;
  cloudEnter();if((needTkb||nCC)&&CLD.stage==='app')cloudSave()}
 catch(e){CLD.stage='login';CLD.err=viLoginErr(e.message);render()}}
function ccBackfill(){let n=0;DB.staff.forEach(s=>{if(s.cc==null&&s.pay&&!ccOf(s.pay)){s.cc=false;n++}});return n}
/* Tài khoản nhân viên: ghép theo mã nhân viên trong hồ sơ vai trò; chưa có mã (tài khoản Trưởng Trung tâm tạo tay) thì ghép theo email */
function staffAccount(){
 const s=CLD.sid?DB.staff.find(x=>x.id===CLD.sid&&x.st==='dang'&&x.role!=='hc'):null;
 if(s)return{role:s.role,id:s.id,name:s.n,em:s.em||CLD.ss.email};
 return findAccount(CLD.ss.email)}
function phAccount(){const key=String(CLD.sid||'').slice(3),k=DB.kids.find(x=>pkeyOf(x)===key);
 return{role:'ph',id:'ph|'+key,name:k?k.pn:(CLD.pname||'Phụ huynh'),pe:k?k.pe:'',em:CLD.ss.email,pkey:key}}
function cloudEnter(){
 const a=CLD.role==='ph'?phAccount():staffAccount();
 if(!a){cMsg('Tài khoản này chưa có trong danh sách nhân sự đang làm việc. Trưởng Trung tâm cần thêm hồ sơ nhân sự có đúng email hoặc số điện thoại của tài khoản.');return}
 if(a.role!==CLD.role){cMsg('Vai trò của tài khoản ('+ROLE[CLD.role]+') không khớp với hồ sơ nhân sự ('+ROLE[a.role]+'). Hãy nhờ Trưởng Trung tâm kiểm tra.');return}
 U=a;CLD.stage='app';S.v=ACCESS[a.role][0];S.modal=null;S.menu=false;S.top=1;setSt('ok');render();cloudTimers();accLoad();plLoad()}
function cloudDrop(msg){CLD.ss=null;sbStore(null);U=null;DB=null;CLD.stage='login';CLD.err=msg||'';CLD.snap=new Map();render()}
async function cloudLogout(){
 try{await cloudFlush()}catch(e){}
 try{if(CLD.ss)sbReq('/auth/v1/logout',{method:'POST'})}catch(e){}
 CLD.role=null;cloudDrop('')}

/* ---- cổng phụ huynh: phụ huynh không đọc ghi bảng trực tiếp, mọi thứ đi qua /api/parent ---- */
async function phCall(body,again){
 const r=await fetch((typeof window.GB_API==='string'?window.GB_API:'')+'/api/parent',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+CLD.ss.at},body:JSON.stringify(body)});
 if(r.status===401&&!again&&await sbRefresh())return phCall(body,true);
 if(r.status===423&&CLD.stage==='app')setTimeout(phLoad,0);      /* cổng vừa bị khóa vì quá hạn học phí: tải lại để hiện màn hình khóa */
 return r}
async function phApi(body){const r=await phCall(body);if(r.status===404)throw new Error('Máy chủ chưa có cổng phụ huynh.');const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('Lỗi '+r.status));return j}
function phLocked(lock){CLD.lock=lock||{};CLD.stage='locked';DB=null;U=null;CLD.snap=new Map();render()}
async function phLoad(){
 try{const j=await phApi({action:'load'});
  if(j.locked){phLocked(j.lock);return}
  if(!j.records.some(r=>r.collection==='cfg')){cMsg('Trung tâm chưa có dữ liệu. Hãy liên hệ Trung tâm.');return}
  DB=cbuild(j.records,j.money);CLD.kids=j.kids;
  CLD.since={records:maxAt(j.records,'1970-01-01T00:00:00Z'),money:maxAt(j.money,'1970-01-01T00:00:00Z')};
  CLD.snap=new Map();cflat(DB,false).forEach((v,k)=>CLD.snap.set(k,v.s));
  cloudEnter()}
 catch(e){CLD.stage='login';CLD.err=viLoginErr(e.message);render()}}

/* ---- khởi tạo dữ liệu lần đầu (Trưởng Trung tâm) ---- */
async function cloudSetup(kind){
 CLD.stage='loading';render();
 const email=CLD.ss.email,name=CLD.pname||email.split('@')[0];
 seed();
 if(kind==='demo'){const s=DB.staff.find(x=>x.role==='tt')||DB.staff[1];s.em=email;s.n=name}
 else{
  const me={id:'nv01',n:name,role:'tt',pos:'Trưởng Trung tâm',ph:'',em:email,st:'dang',sd:TODAY,sup:'',pay:PAY_STUB()};
  DB.staff=[me];['kids','cg','tg','plans','sess','lich','lr','mk','lg','rp','nt','vio'].forEach(k=>{DB[k]=[]});['att','ts','set','rd','menu','bon','vam','kpr'].forEach(k=>{DB[k]={}});
  DB.groups=[{id:'G1',n:BTN[0],ts:[],gv:'',tg:''},{id:'G2',n:BTN[1],ts:[],gv:'',tg:''}];DB.tkb=tkbDefault(DB.groups)}
 CLD.snap=new Map();CLD.ord={};CLD.maxo=0;
 cloudEnter();if(CLD.stage==='app')cloudFlush()}
ACT.csetup=v=>{cloudSetup(v);return false};

/* ---- lưu: chỉ gửi các dòng đã thay đổi ---- */
function cloudSave(){if(CLD.stage!=='app'||!DB)return;clearTimeout(CLD.tm);CLD.tm=setTimeout(cloudFlush,50)}
async function cloudFlush(){
 if(CLD.stage!=='app'||!DB)return;
 if(CLD.flushing){CLD.again=true;return}
 CLD.flushing=true;
 try{do{CLD.again=false;
  const withM=canM(),cur=cflat(DB,withM),up={records:[],money:[]},del=[],denied=[];
  cur.forEach((v,k)=>{if(CLD.snap.get(k)!==v.s)up[v.t].push({k,s:v.s,row:{collection:v.c,id:v.id,data:JSON.parse(v.s)}})});
  CLD.snap.forEach((s,k)=>{if(!cur.has(k)){const p=k.split('|');del.push({k,t:p[0],c:p[1],id:p.slice(2).join('|')})}});
  if(!up.records.length&&!up.money.length&&!del.length)continue;
  setSt('saving');
  for(const t of ['records','money']){const rows=up[t];
   for(let i=0;i<rows.length;i+=400){const part=rows.slice(i,i+400);
    const send=rows=>CLD.role==='ph'?phCall({action:'put',rows:rows.map(x=>x.row)}):sbReq('/rest/v1/'+tblName(t)+'?on_conflict=collection,id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:rows.map(x=>x.row)});
    const r=await send(part);
    if(r.ok){part.forEach(x=>CLD.snap.set(x.k,x.s));continue}
    if(r.status!==403)throw new Error(await errText(r));
    /* Một dòng bị từ chối quyền làm hỏng cả lô: thử từng dòng để các dòng hợp lệ vẫn được lưu */
    for(const x of part){const r1=await send([x]);
     if(r1.ok)CLD.snap.set(x.k,x.s);
     else if(r1.status===403){CLD.snap.set(x.k,x.s);denied.push(x.row.collection+'/'+x.row.id)}
     else throw new Error(await errText(r1))}}}
  for(const d of del){
   const r=CLD.role==='ph'?await phCall({action:'put',dels:[{collection:d.c,id:d.id}]}):await sbReq('/rest/v1/'+tblName(d.t)+'?collection=eq.'+encodeURIComponent(d.c)+'&id=eq.'+encodeURIComponent(d.id),{method:'DELETE'});
   if(r.ok||r.status===403){if(!r.ok)denied.push(d.c+'/'+d.id);CLD.snap.delete(d.k)}else throw new Error(await errText(r))}
  if(denied.length){setSt('err','Bạn không có quyền lưu: '+denied.slice(0,3).join(', '));toast('Một số thay đổi không được phép lưu và đã bị bỏ qua. Hãy tải lại trang để lấy dữ liệu đúng.');CLD.again=false;return}
 }while(CLD.again);setSt('ok')}
 catch(e){setSt('err',e.message);clearTimeout(CLD.rt);CLD.rt=setTimeout(cloudFlush,8000)}
 finally{CLD.flushing=false}}

/* ---- đồng bộ thay đổi của người khác (các dòng được thêm hoặc sửa) ---- */
async function cloudPull(){
 if(CLD.stage!=='app'||CLD.flushing||CLD.pulling)return;CLD.pulling=true;
 try{const withM=canM(),cur=cflat(DB,withM),changed=new Set(),pay={},cfgm={};let any=false;
  const ph=CLD.role==='ph';let got=null;
  if(ph){const r=await phCall({action:'pull',since:CLD.since,known:CLD.kids||[]});if(!r.ok)return;got=await r.json();
   if(got.locked){phLocked(got.lock);return}
   if(got.reload){await cloudFlush();await cloudLoad();return}}
  for(const t of (ph||withM||CLD.role==='gv'?['records','money']:['records'])){
   let rows;
   if(ph)rows=got[t]||[];
   else{const r=await sbReq('/rest/v1/'+tblName(t)+'?select=collection,id,data,updated_at&order=updated_at&limit=1000&updated_at=gt.'+encodeURIComponent(CLD.since[t]));
    if(!r.ok)continue;rows=await r.json()}
   if(!rows.length)continue;
   CLD.since[t]=maxAt(rows,CLD.since[t]);
   rows.forEach(x=>{const k=t+'|'+x.collection+'|'+x.id,mine=cur.get(k);
    if(mine&&mine.s!==CLD.snap.get(k))return;      /* có thay đổi chưa gửi: giữ bản của mình */
    if(t==='money'&&!withM&&!ph&&x.collection!=='pay'&&x.collection!=='cfgm')return;
    cApply(DB,t,x,pay,cfgm);changed.add(k);any=true});
   Object.keys(pay).forEach(id=>{const s=DB.staff.find(y=>y.id===id);if(s)s.pay=pay[id]});
   CFG_MONEY.forEach(k=>{if(cfgm[k]!=null)DB.cfg[k]=cfgm[k]})}
  /* mục chung (tài liệu tham khảo, tri ân) đã bị xóa hoặc gỡ: máy chủ gửi danh sách đang đăng, bỏ những mục không còn */
  if(ph&&got&&got.live)['ref','tri'].forEach(c=>{const keep=new Set(got.live[c]||[]),a=DB[c]||[],n=a.filter(x=>keep.has(x.id));
   if(n.length!==a.length){a.filter(x=>!keep.has(x.id)).forEach(x=>CLD.snap.delete('records|'+c+'|'+x.id));DB[c]=n;any=true}});
  if(any){const nf=cflat(DB,withM);changed.forEach(k=>{if(nf.has(k))CLD.snap.set(k,nf.get(k).s)});softRender()}}
 catch(e){}
 finally{CLD.pulling=false}
 if(CLD.role!=='ph')plLoad(true)}
function cloudTimers(){if(CLD.tmr)return;
 CLD.tmr=setInterval(()=>{if(document.visibilityState==='visible')cloudPull()},45000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')cloudPull();else cloudFlush()})}

/* ---- cấp tài khoản đăng nhập (qua /api/accounts; khóa secret nằm ở máy chủ, không ở trình duyệt) ---- */
async function cloudApi(body,again){
 const r=await fetch((typeof window.GB_API==='string'?window.GB_API:'')+'/api/accounts',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+CLD.ss.at},body:JSON.stringify(body)});
 if(r.status===401&&!again&&await sbRefresh())return cloudApi(body,true);
 if(r.status===404)throw new Error('Máy chủ chưa có chức năng cấp tài khoản.');
 const j=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(j.error||('Lỗi '+r.status));
 return j}
async function accLoad(){if(!CLOUDMODE||CLD.role!=='tt')return;
 try{CLD.acc=(await cloudApi({action:'list'})).accounts;CLD.accErr=''}catch(e){CLD.acc=null;CLD.accErr=e.message}
 if(CLD.stage==='app')softRender()}
/* Tài khoản của nhân viên: ghép theo mã nhân viên, nếu chưa có thì theo email */
const accOf=s=>{const em=String(s.em||'').trim().toLowerCase();return(CLD.acc||[]).find(a=>a.staff_id===s.id)||(em&&(CLD.acc||[]).find(a=>!a.staff_id&&a.email===em))||null};
const accCol=()=>CLOUDMODE&&canCfg();
const accTag=s=>{if(s.role==='hc')return'<span class="mu">–</span>';if(CLD.acc===null)return'<span class="mu">?</span>';return accOf(s)?tg('Đã cấp','ok'):tg('Chưa cấp','wa')};
const genPw=()=>{const c='abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',a=new Uint32Array(10);crypto.getRandomValues(a);return Array.from(a,x=>c[x%c.length]).join('')};
const loginIds=(em,ph)=>[em?`email <b>${esc(em)}</b>`:'',telNorm(ph)?`số điện thoại <b>${esc(ph)}</b>`:''].filter(Boolean).join(' hoặc ');
function accSection(s){
 if(!CLOUDMODE||!canCfg())return'';
 const h='<h3 style="margin-top:18px">Tài khoản đăng nhập</h3>';
 if(s.role==='hc')return'';
 if(s.role==='tt')return h+'<p class="note sm">Tài khoản Trưởng Trung tâm được tạo trực tiếp trong Supabase (Authentication).</p>';
 if(!s.em&&!s.ph)return h+'<p class="note sm">Nhập email hoặc số điện thoại đăng nhập và bấm Lưu hồ sơ trước, rồi mở lại hồ sơ này để cấp tài khoản.</p>';
 if(s.ph&&!telNorm(s.ph)&&!s.em)return h+'<p class="note sm">Số điện thoại trong hồ sơ chưa hợp lệ (ví dụ 0901 234 567). Hãy sửa rồi bấm Lưu hồ sơ.</p>';
 if(CLD.acc===null)return h+`<p class="note sm">Chưa dùng được chức năng cấp tài khoản: ${esc(CLD.accErr||'đang kiểm tra...')}</p>`;
 const a=accOf(s),busy=S.accBusy?'disabled':'',done=S.accDone&&S.accDone.id===s.id?`<div class="note sm" role="status">${esc(S.accDone.msg)}${S.accDone.pw?` Mật khẩu vừa đặt: <b style="user-select:all">${esc(S.accDone.pw)}</b>. Mật khẩu này chỉ hiện ở đây một lần; hãy gửi cho nhân viên và nhắc đổi mật khẩu sau khi đăng nhập.`:''}</div>`:'';
 if(a)return h+done+`<p class="sm">Đã có tài khoản · đăng nhập bằng ${loginIds(a.email,a.phone)||'tài khoản này'} · vai trò ${esc(ROLE[a.role]||a.role)}.${a.role!==s.role?' <span style="color:var(--er)">Vai trò hệ thống đã đổi. Hãy thu hồi rồi cấp lại để khớp.</span>':''}${(s.em&&a.email&&s.em.toLowerCase()!==a.email)||(telNorm(s.ph)&&telNorm(s.ph)!==a.phone)?' <span style="color:var(--er)">Email hoặc số điện thoại trong hồ sơ đã khác tài khoản. Hãy thu hồi rồi cấp lại.</span>':''}</p>
  <form id="accpw" class="f"><div class="f2"><div><label for="acc-pw">Mật khẩu mới (ít nhất 8 ký tự)</label><input id="acc-pw" name="pw" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div></div>
  <div class="acts"><button class="btn p" type="submit" ${busy}>Đặt lại mật khẩu</button><button class="btn" type="button" data-a="accgen">Tạo mật khẩu ngẫu nhiên</button><button class="btn no" type="button" data-a="accdel" ${busy}>Thu hồi quyền đăng nhập</button></div></form>`;
 return h+done+`<p class="sm mu">Chưa có tài khoản cho ${loginIds(s.em,s.ph)} (${esc(ROLE[s.role])}). Cấp tài khoản theo thông tin đã lưu của hồ sơ; nhân viên đăng nhập được bằng email hoặc số điện thoại.</p>
  <form id="accnew" class="f"><div class="f2"><div><label for="acc-pw">Mật khẩu ban đầu (ít nhất 8 ký tự)</label><input id="acc-pw" name="pw" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div></div>
  <div class="acts"><button class="btn p" type="submit" ${busy}>Cấp tài khoản</button><button class="btn" type="button" data-a="accgen">Tạo mật khẩu ngẫu nhiên</button></div></form>`}
ACT.accgen=()=>{const el=$q('#acc-pw');if(el){el.type='text';el.value=genPw()}return false};
async function accRun(action,body,msg,showPw){
 const id=S.modal&&(S.modal.id||S.modal.key);S.accBusy=true;S.accDone=null;render();
 try{await cloudFlush();await cloudApi(Object.assign({action},body));
  await accLoad();S.accDone={id,msg,pw:showPw||''};toast(msg)}
 catch(e){toast(e.message)}
 S.accBusy=false;render()}
FORM.accnew=f=>{const s=stBy(S.modal.id),pw=f.elements.pw.value;if(!s||!canCfg())return false;
 accRun('create',{staff_id:s.id,email:s.em,phone:s.ph,role:s.role,password:pw},'Đã cấp tài khoản cho '+s.n+'.',pw);return false};
FORM.accpw=f=>{const s=stBy(S.modal.id),pw=f.elements.pw.value,a=s&&accOf(s);if(!s||!a||!canCfg())return false;
 accRun('setpw',{uid:a.uid,email:a.email,password:pw},'Đã đặt lại mật khẩu.',pw);return false};
ACT.accdel=()=>{const s=stBy(S.modal.id),a=s&&accOf(s);if(!s||!a||!canCfg())return false;
 ask('Thu hồi quyền đăng nhập của '+s.n+'? Người này sẽ không vào được hệ thống nữa. Hồ sơ nhân sự và dữ liệu cũ vẫn giữ nguyên.',()=>accRun('remove',{uid:a.uid,email:a.email},'Đã thu hồi quyền đăng nhập.'),'Thu hồi')};

/* ---- tài khoản phụ huynh: một tài khoản cho mọi bé cùng email (hoặc cùng số điện thoại) ---- */
function phGroups(){const by={};DB.kids.forEach(k=>{const key=pkeyOf(k),g=key||'k:'+k.id;(by[g]=by[g]||{key,pe:k.pe,pn:k.pn,pp:k.pp,ks:[]}).ks.push(k)});return Object.values(by)}
const phAcc=key=>key&&(CLD.acc||[]).find(a=>a.staff_id==='ph|'+key)||null;
const phTag=p=>{if(!p.key)return tg('Thiếu email/SĐT','er');if(CLD.acc===null)return'<span class="mu">?</span>';return phAcc(p.key)?tg('Đã cấp','ok'):tg('Chưa cấp','wa')};
const phGroup=key=>phGroups().find(p=>p.key===key);
ACT.phopen=v=>{if(!canCfg())return false;S.accDone=null;S.modal={t:'phacc',key:v}};
MODALS.phacc=()=>{const p=phGroup(S.modal.key);if(!p||!canCfg()){S.modal=null;return''}
 const a=phAcc(p.key),busy=S.accBusy?'disabled':'',done=S.accDone&&S.accDone.id===p.key?`<div class="note sm" role="status">${esc(S.accDone.msg)}${S.accDone.pw?` Mật khẩu vừa đặt: <b style="user-select:all">${esc(S.accDone.pw)}</b>. Mật khẩu này chỉ hiện ở đây một lần; hãy gửi cho phụ huynh.`:''}</div>`:'';
 const info=`<p class="sm"><b>${esc(p.pn)}</b> · các bé: ${esc(p.ks.map(k=>k.n).join(', '))}</p><p class="sm mu">Đăng nhập bằng ${loginIds(p.pe&&p.pe.includes('@')?p.pe:'',p.pp)||'(chưa có email hoặc số điện thoại hợp lệ)'}.</p>`;
 if(CLD.acc===null)return mdl('Tài khoản phụ huynh',info+`<p class="note sm">Chưa dùng được chức năng cấp tài khoản: ${esc(CLD.accErr||'đang kiểm tra...')}</p>`);
 return mdl('Tài khoản phụ huynh',info+done+(a?`<form id="phpw" class="f"><div><label for="acc-pw">Mật khẩu mới (ít nhất 8 ký tự)</label><input id="acc-pw" name="pw" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div><div class="acts"><button class="btn p" type="submit" ${busy}>Đặt lại mật khẩu</button><button class="btn" type="button" data-a="accgen">Tạo mật khẩu ngẫu nhiên</button><button class="btn no" type="button" data-a="phdel" ${busy}>Thu hồi</button></div></form>`
  :`<form id="phnew" class="f"><div><label for="acc-pw">Mật khẩu ban đầu (ít nhất 8 ký tự)</label><input id="acc-pw" name="pw" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div><div class="acts"><button class="btn p" type="submit" ${busy}>Cấp tài khoản</button><button class="btn" type="button" data-a="accgen">Tạo mật khẩu ngẫu nhiên</button></div></form>`))};
FORM.phnew=f=>{const p=phGroup(S.modal.key);if(!p||!p.key||!canCfg())return false;const pw=f.elements.pw.value;
 accRun('create_ph',{pkey:p.key,password:pw},'Đã cấp tài khoản cho '+p.pn+'.',pw);return false};
FORM.phpw=f=>{const p=phGroup(S.modal.key),a=p&&phAcc(p.key);if(!a||!canCfg())return false;const pw=f.elements.pw.value;
 accRun('setpw',{uid:a.uid,email:a.email,password:pw},'Đã đặt lại mật khẩu.',pw);return false};
ACT.phdel=()=>{const p=phGroup(S.modal.key),a=p&&phAcc(p.key);if(!a||!canCfg())return false;
 ask('Thu hồi quyền đăng nhập của phụ huynh '+p.pn+'? Phụ huynh sẽ không vào được cổng nữa.',()=>accRun('remove',{uid:a.uid,email:a.email},'Đã thu hồi quyền đăng nhập.'),'Thu hồi')};
/* cấp hàng loạt cho phụ huynh của các bé đang học mà chưa có tài khoản, rồi xuất danh sách mật khẩu */
ACT.phbulk=()=>{if(!canCfg()||CLD.acc===null||(S.phBulk&&S.phBulk.run))return false;
 const todo=phGroups().filter(p=>p.key&&!phAcc(p.key)&&p.ks.some(k=>k.st==='dang'));
 if(!todo.length){toast('Mọi phụ huynh của các bé đang học đều đã có tài khoản');return false}
 ask('Cấp tài khoản cho '+todo.length+' phụ huynh chưa có? Hệ thống tự tạo mật khẩu cho từng người và cho bạn tải danh sách mật khẩu về.',()=>phBulkRun(todo),'Cấp tài khoản')};
async function phBulkRun(todo){
 const B=S.phBulk={run:true,n:0,total:todo.length,rows:[]};S.modal=null;render();
 try{await cloudFlush();
  for(const p of todo){const pw=genPw(),row={name:p.pn,kids:p.ks.map(k=>k.n).join(', '),login:p.key.includes('@')?p.key:p.pp,pw,ok:false,err:''};
   try{const r=await cloudApi({action:'create_ph',pkey:p.key,password:pw});row.ok=true;row.phone=r.phone||'';row.skip=!!r.phoneSkipped}
   catch(e){row.err=e.message}
   B.rows.push(row);B.n++;if(B.n%5===0)softRender()}}
 finally{B.run=false;await accLoad();render()}}
ACT.phbulkxl=()=>{const B=S.phBulk;if(!B||!B.rows.length)return false;
 exportXLSX('tai-khoan-phu-huynh-'+TODAY+'.xlsx',[{n:'Tài khoản',rows:[['Phụ huynh','Các bé','Đăng nhập bằng','Mật khẩu ban đầu','Kết quả']].concat(B.rows.map(r=>[r.name,r.kids,r.login,r.ok?r.pw:'',r.ok?'Đã cấp':r.err]))}]);return false};
ACT.phbulkx=()=>{S.phBulk=null};
const phBulkHtml=()=>{const B=S.phBulk;if(!B)return'';const bad=B.rows.filter(r=>!r.ok);
 return`<div class="card"><h2>Cấp tài khoản hàng loạt</h2>${B.run?`<p role="status">Đang cấp ${B.n}/${B.total}...</p>`:`<p role="status">Đã cấp ${B.rows.length-bad.length}/${B.total} tài khoản.${bad.length?' Chưa cấp được '+bad.length+':':''}</p>${bad.length?'<ul class="sm">'+bad.slice(0,8).map(r=>`<li>${esc(r.name)}: ${esc(r.err)}</li>`).join('')+'</ul>':''}<p class="note sm">Mật khẩu chỉ có trong danh sách tải về. Hãy tải ngay, gửi riêng cho từng phụ huynh và nhắc đổi mật khẩu sau khi đăng nhập.</p><div class="acts"><button class="btn p" data-a="phbulkxl">Tải danh sách mật khẩu (Excel)</button><button class="btn" data-a="phbulkx">Đóng</button></div>`}</div>`};

/* ---- đổi mật khẩu của chính mình ---- */
ACT.pwopen=()=>{S.modal={t:'pw'}};
MODALS.pw=()=>mdl('Đổi mật khẩu',`<form id="pwf" class="f"><div><label for="pw-1">Mật khẩu mới (ít nhất 8 ký tự)</label><input id="pw-1" name="a" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div><div><label for="pw-2">Nhập lại mật khẩu mới</label><input id="pw-2" name="b" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Đổi mật khẩu</button></div></form>`);
FORM.pwf=f=>{const a=f.elements.a.value,b=f.elements.b.value;
 if(a.length<8){toast('Mật khẩu cần ít nhất 8 ký tự');return false}
 if(a!==b){toast('Hai lần nhập mật khẩu chưa giống nhau');return false}
 sbReq('/auth/v1/user',{method:'PUT',body:{password:a}}).then(async r=>{if(r.ok){S.modal=null;toast('Đã đổi mật khẩu')}else{let m='';try{m=(await r.json()).msg||''}catch(e){}toast(/different from the old/i.test(m)?'Mật khẩu mới phải khác mật khẩu cũ':'Chưa đổi được mật khẩu. Hãy đăng xuất, đăng nhập lại rồi thử lại.')}render()});
 return false};

/* ---- màn hình trước khi vào ứng dụng ---- */
const CL_NAME='TRUNG TÂM CAN THIỆP SỚM GOLDEN BEE';
function lgInfo(){return`<div class="lgi"><p>Hệ thống quản lý Trung tâm can thiệp sớm Golden&nbsp;Bee.</p><p>Địa chỉ: 28 Trường Thi 1&nbsp;- Phường&nbsp;Hoà&nbsp;Cường&nbsp;- Thành&nbsp;phố&nbsp;Đà&nbsp;Nẵng.</p><p>Số điện thoại: 0793502567.</p><p>Hotline: 0979796361.</p></div>`}
function lgLeft(){return`<div class="lgl"><img src="${LOGO}" alt="Logo Trung tâm Can thiệp sớm Golden Bee"><h1>${CL_NAME}</h1>${lgInfo()}</div>`}
function cloudScreen(){const st=CLD.stage;
 if(st==='loading')return`<div class="lg">${lgLeft()}<div class="lgr"><div class="lgc"><h2>Đang tải dữ liệu...</h2><p class="mu">Vui lòng chờ trong giây lát.</p></div></div></div>`;
 if(st==='setup')return`<div class="lg">${lgLeft()}<div class="lgr"><div class="lgc"><h2>Khởi tạo dữ liệu trung tâm</h2><p class="mu">Máy chủ chưa có dữ liệu. Bạn là Trưởng Trung tâm đầu tiên, hãy chọn cách bắt đầu:</p>
 <div class="roles"><button class="btn p" data-a="csetup" data-v="empty"><b>Bắt đầu với dữ liệu trống</b><span>Để nhập dữ liệu thật của trung tâm</span></button>
 <button class="btn" data-a="csetup" data-v="demo"><b>Nạp dữ liệu mẫu để xem thử</b><span>Khoảng 100 trẻ giả lập. Dữ liệu mẫu sẽ nằm cùng dữ liệu thật nếu bạn nhập tiếp</span></button></div>
 <p class="sm mu" style="margin-top:14px">Tài khoản đăng nhập: ${esc(CLD.ss?CLD.ss.email:'')}</p></div></div></div>`;
 if(st==='locked')return lockHtml(CLD.lock||{});
 if(st==='msg')return`<div class="lg">${lgLeft()}<div class="lgr"><div class="lgc"><h2>Chưa vào được hệ thống</h2><p role="alert">${esc(CLD.msg)}</p><div class="acts" style="margin-top:14px"><button class="btn p" data-a="logout">Đăng xuất</button></div></div></div></div>`;
 return`<div class="lg">${lgLeft()}<div class="lgr"><div class="lgc"><h2>Đăng nhập</h2>
 <form id="login" class="f" autocomplete="on"><div><label for="lg-e">Email hoặc số điện thoại</label><input id="lg-e" name="e" type="text" required autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" value="${esc(CLD.email||'')}" placeholder="ten@email.com hoặc 0901 234 567"></div><div><label for="lg-p">Mật khẩu</label><input id="lg-p" name="p" type="password" required autocomplete="current-password"></div><div class="err" role="alert">${esc(CLD.err||'')}</div><button class="btn p" type="submit">Đăng nhập</button></form>
 <p class="note sm" style="margin-top:16px">Tài khoản do Trưởng Trung tâm cấp. Nếu quên mật khẩu hoặc chưa có tài khoản, hãy liên hệ Trưởng Trung tâm.</p></div></div></div>`}

/* ---- khởi động ở chế độ máy chủ ---- */
async function cloudBoot(){
 const s=sbLoad();
 if(s&&s.at&&s.rt){CLD.ss=s;await cloudLoad()}else{CLD.stage='login';render()}}
