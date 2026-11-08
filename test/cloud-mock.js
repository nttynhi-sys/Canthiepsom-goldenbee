/* Máy chủ Supabase giả lập cho kiểm thử: đăng nhập, bảng records và money_records, quyền đọc/ghi theo vai trò (giống lược đồ thật) */
const SBURL='https://bqvwibipmzyrkrwlfoqf.supabase.co';
/* jsonb của Postgres sắp lại khóa: ngắn trước, rồi theo chữ cái. Giả lập để kiểm tra việc so sánh dữ liệu không bị lệch. */
function jnorm(v){if(Array.isArray(v))return v.map(jnorm);if(v&&typeof v==='object'){const o={};Object.keys(v).sort((a,b)=>a.length-b.length||(a<b?-1:1)).forEach(k=>{o[k]=jnorm(v[k])});return o}return v}
function makeServer(users){
 const S={users,recs:new Map(),mon:new Map(),clock:0,log:[],profiles:{},tokens:{}};
 Object.keys(users).forEach(e=>{S.profiles[users[e].uid]={role:users[e].role,full_name:users[e].name}});
 const now=()=>new Date(Date.UTC(2026,10,9,0,0,0)+(++S.clock)*1000).toISOString().replace('Z','000+00:00');
 const tabOf=n=>n==='records'?S.recs:n==='money_records'?S.mon:null;
 function who(req){const a=req.headers()['authorization']||'';const t=a.replace('Bearer ','');const e=S.tokens[t];return e?S.users[e]:null}
 function canRead(u,tab,row){if(!u)return false;
  if(tab==='records')return ['tt','vp','ql','gv'].includes(u.role);
  if(u.role==='tt'||u.role==='vp')return true;
  if(u.role==='gv'){if(row.collection==='cfgm')return true;if(row.collection==='bon'){const st=S.recs.get('staff|'+row.id.split('|')[0]);return !!st&&String(st.data.em).toLowerCase()===u.email}if(row.collection==='pay'){const st=S.recs.get('staff|'+row.id);return !!st&&String(st.data.em).toLowerCase()===u.email}return false}
  return false}
 function canWrite(u,tab,coll){if(!u)return false;if(tab==='records'){if(u.role==='gv')return !['staff','cfg'].includes(coll);return ['tt','vp','ql'].includes(u.role)}return u.role==='tt'||u.role==='vp'}
 async function handle(route){
  const req=route.request(),url=new URL(req.url()),p=url.pathname,m=req.method();
  const json=(code,body,h)=>route.fulfill({status:code,contentType:'application/json',headers:Object.assign({'access-control-allow-origin':'*'},h||{}),body:code===204?'':JSON.stringify(body)});
  if(m==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
  S.log.push(m+' '+p+url.search.slice(0,90));
  if(p==='/auth/v1/token'){const gt=url.searchParams.get('grant_type'),b=JSON.parse(req.postData()||'{}');
   if(gt==='password'){const u=S.users[String(b.email).toLowerCase()];if(!u||u.pw!==b.password)return json(400,{error:'invalid_grant',error_description:'Invalid login credentials'});
    const tok='t'+Math.random().toString(36).slice(2);S.tokens[tok]=u.email;return json(200,{access_token:tok,refresh_token:'r'+tok,expires_in:3600,user:{id:u.uid,email:u.email}})}
   if(gt==='refresh_token'){const old=String(b.refresh_token).slice(1),e=S.tokens[old];if(!e)return json(400,{error:'invalid_grant'});const u=S.users[e];const tok='t'+Math.random().toString(36).slice(2);S.tokens[tok]=e;return json(200,{access_token:tok,refresh_token:'r'+tok,expires_in:3600,user:{id:u.uid,email:u.email}})}}
  if(p==='/auth/v1/logout')return json(204,{});
  const u=who(req);
  if(p==='/rest/v1/profiles'){if(!u)return json(401,{message:'JWT'});const uid=url.searchParams.get('user_id').replace('eq.','');const pr=S.profiles[uid];return json(200,pr&&uid===u.uid?[pr]:[])}
  const tn=p.replace('/rest/v1/','');const tab=tabOf(tn);
  if(!tab)return json(404,{message:'no table'});
  if(!u)return json(401,{message:'JWT expired'});
  if(m==='GET'){
   let rows=[...tab.values()].filter(r=>canRead(u,tn,r));
   const gt=url.searchParams.get('updated_at');if(gt)rows=rows.filter(r=>r.updated_at>gt.replace('gt.',''));
   const ord=url.searchParams.get('order')||'';
   if(ord==='updated_at')rows.sort((a,b)=>a.updated_at<b.updated_at?-1:1);else rows.sort((a,b)=>a.collection===b.collection?(a.id<b.id?-1:1):(a.collection<b.collection?-1:1));
   const off=+(url.searchParams.get('offset')||0),lim=Math.min(1000,+(url.searchParams.get('limit')||1000));
   return json(200,rows.slice(off,off+lim).map(r=>({collection:r.collection,id:r.id,data:r.data,updated_at:r.updated_at})))}
  if(m==='POST'){const arr=JSON.parse(req.postData()||'[]');if(!arr.every(r=>canWrite(u,tn,r.collection)))return json(403,{message:'new row violates row-level security policy'});S.log.push('  rows='+arr.length);
   arr.forEach(r=>{tab.set(r.collection+'|'+r.id,{collection:r.collection,id:r.id,data:jnorm(r.data),updated_at:now()})});
   return json(201,{})}
  if(m==='DELETE'){const c=url.searchParams.get('collection').replace('eq.','');if(!canWrite(u,tn,c))return json(403,{message:'rls'});
   const id=url.searchParams.get('id').replace('eq.','');tab.delete(c+'|'+id);return json(204,{})}
  return json(405,{})}
 S.attach=async page=>{await page.route(SBURL+'/**',handle)};
 return S}
module.exports={makeServer,SBURL};
