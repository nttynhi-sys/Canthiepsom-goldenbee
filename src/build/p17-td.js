/* ===== 12. Ảnh, video và tài liệu =====
   Tệp nằm trong Supabase Storage, bucket riêng tư gb-media (không công khai), đường dẫn m/<mã>.<đuôi>.
   Danh mục nằm ở bảng records, collection 'media': {id,kind:'img'|'vid'|'doc',t,p,ct,sz,d,by,bn,at,ks:[mã bé],gr,sh,n,cat}.
   - Nhân viên (Trưởng Trung tâm, Quản lý, Văn phòng, Giáo viên) tải lên thẳng từ trình duyệt; xem bằng đường xem tạm (1 giờ).
   - Ảnh, video hoạt động chung của lớp bán trú: tải lên với lớp, chưa gắn bé (ks rỗng). Giáo viên chọn bé nào có trong ảnh, rồi mới chia sẻ.
   - Phụ huynh KHÔNG đọc kho trực tiếp: chỉ nhận danh sách tệp đã chia sẻ có gắn bé của mình và đường xem tạm 15 phút qua /api/parent (hành động sign).
   - Chế độ ?demo: ảnh thu nhỏ lưu trong trình duyệt; video và tài liệu chỉ giữ trong phiên (không có kho thật). */
const MEDIA_MAX=50*1024*1024,MEDIA_BUCKET='gb-media',DCAT=['Giáo án','Biểu mẫu','Hồ sơ trẻ','Hướng dẫn phụ huynh','Khác'];
const MEDIA_CT={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',csv:'text/csv',txt:'text/plain',md:'text/markdown'};
const MEDIA_ACC={av:'image/*,video/*,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov',doc:'.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,image/*'};
const MEDM=['upm','mview','mtag'],PIX='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const mb=n=>(n/1048576).toFixed(1)+' MB';
const MED={u:{},q:new Set(),gone:new Set(),fail:{},retry:{},mem:{},t:0};
const medList=()=>Array.isArray(DB.media)?DB.media:(DB.media=[]);
const canUpload=()=>!!U&&(isLead()||isVP()||isGV());
const medKs=m=>Array.isArray(m.ks)?m.ks:[];
const medGrOk=g=>isLead()||isVP()||myGroups().some(x=>x.id===g);
/* ai xem được: phụ huynh chỉ tệp đã chia sẻ có bé của mình; giáo viên: tệp mình tải, tệp của bé mình dạy, ảnh chung lớp mình phụ trách */
function medSee(m){
 if(!U||!m||m.gone||MED.gone.has(m.id))return false;
 if(isPH())return!!m.sh&&medKs(m).some(canKid);
 if(isLead()||isVP())return true;
 if(!isGV())return false;
 if(m.by===U.id)return true;
 const ks=medKs(m);
 if(ks.length)return ks.some(canKid);
 if(m.gr)return medGrOk(m.gr)||myKids().some(k=>k.gr===m.gr);
 return m.kind==='doc'};
const medEdit=m=>isLead()||isVP()||(isGV()&&medSee(m));
const medDel=m=>isLead()||isVP()||(isGV()&&m.by===U.id);
const medSort=(a,b)=>a.d<b.d?1:a.d>b.d?-1:(a.at||'')<(b.at||'')?1:-1;
const medLabel=m=>m.t||'(không tên)';
const medShared=m=>!!m.sh&&medKs(m).length>0;   /* phụ huynh thật sự xem được: đã chia sẻ và đã gắn bé */
function medKindOf(file){const ext=(String(file.name||'').split('.').pop()||'').toLowerCase();let ct=MEDIA_CT[ext]||'',e=ext;
 if(!ct&&file.type){const h=Object.entries(MEDIA_CT).find(([x,c])=>c===file.type&&x!=='jpeg');if(h){e=h[0];ct=h[1]}}
 if(!ct)return null;
 return{ext:e==='jpeg'?'jpg':e,ct,kind:ct.startsWith('image/')?'img':ct.startsWith('video/')?'vid':'doc'}}

/* ---- đường xem tạm: xin theo lô, chỉ cho phần đang hiện ---- */
function medUrl(m,quiet){
 if(!CLOUDMODE||m.demo)return MED.mem[m.id]||m.u||'';      /* bản dùng thử và ảnh mẫu: không có kho thật */
 const c=MED.u[m.id];if(c&&c.exp>Date.now())return c.u;
 if(!quiet)medWant(m.id);return''}
function medWant(id){if(MED.q.has(id)||(MED.fail[id]||0)>Date.now()||!CLD.ss)return;MED.q.add(id);if(!MED.t)MED.t=setTimeout(medFlush,40)}
async function medFlush(){MED.t=0;const ids=[...MED.q];MED.q.clear();if(!ids.length)return;
 let goneNew=false;
 try{
  if(isPH()){for(let i=0;i<ids.length;i+=30){const part=ids.slice(i,i+30),j=await phApi({action:'sign',ids:part}),ttl=(j.ttl||900)-60;
    Object.keys(j.urls||{}).forEach(id=>{MED.u[id]={u:j.urls[id],exp:Date.now()+ttl*1000}});
    (j.gone||[]).forEach(id=>{if(!MED.gone.has(id)){MED.gone.add(id);goneNew=true}})}}
  else{const ms=ids.map(i=>medList().find(x=>x.id===i)).filter(m=>m&&m.p);
   for(let i=0;i<ms.length;i+=50){const part=ms.slice(i,i+50),r=await sbReq('/storage/v1/object/sign/'+MEDIA_BUCKET,{method:'POST',body:{expiresIn:3600,paths:part.map(m=>m.p)}});
    if(!r.ok)throw new Error('sign');
    const out=await r.json(),by=new Map((Array.isArray(out)?out:[]).map(x=>[x.path,x]));
    part.forEach(m=>{const x=by.get(m.p);if(x&&x.signedURL&&!x.error)MED.u[m.id]={u:SB.url+'/storage/v1'+x.signedURL,exp:Date.now()+3540000};else MED.fail[m.id]=Date.now()+300000})}}
 }catch(e){ids.forEach(id=>{MED.fail[id]=Date.now()+30000})}
 if(goneNew)softRender();else medPatch()}
function medPatch(){document.querySelectorAll('[data-mid]').forEach(el=>{const m=medList().find(x=>x.id===el.dataset.mid);if(!m)return;const u=medUrl(m,1);if(!u)return;
 if(el.tagName==='A'){if(el.getAttribute('href')!==u){el.setAttribute('href',u);el.classList.remove('off')}return}
 const w=el.tagName==='VIDEO'?u+'#t=0.1':u;if(el.getAttribute('src')!==w)el.setAttribute('src',w)})}
/* địa chỉ hết hạn hoặc lỗi: xin lại tối đa 2 lần */
document.addEventListener('error',e=>{const el=e.target,id=el&&el.dataset&&el.dataset.mid;if(!id||!CLOUDMODE||/^data:/.test(el.getAttribute('src')||''))return;
 MED.retry[id]=(MED.retry[id]||0)+1;if(MED.retry[id]>2){MED.fail[id]=Date.now()+60000;return}delete MED.u[id];MED.fail[id]=0;medWant(id)},true);

/* ---- thẻ ảnh, video, tài liệu ---- */
function medThumb(m){const u=medUrl(m);
 if(!CLOUDMODE&&!u&&m.kind!=='doc')return`<span class="mdoc" aria-hidden="true">Hết phiên dùng thử</span>`;
 if(m.kind==='img')return`<img data-mid="${esc(m.id)}" class="mi" alt="${esc(medLabel(m))}" draggable="false" loading="lazy" src="${esc(u||PIX)}">`;
 if(m.kind==='vid')return`<video data-mid="${esc(m.id)}" class="mi" muted playsinline preload="metadata" disablepictureinpicture ${u?`src="${esc(u+'#t=0.1')}"`:''}></video><span class="mplay" aria-hidden="true">▶</span>`;
 return`<span class="mdoc" aria-hidden="true">${esc((m.t||'').split('.').pop().slice(0,4).toUpperCase()||'TÀI LIỆU')}</span>`}
function medKidTags(m){const names=medKs(m).filter(i=>kidBy(i)&&(!isPH()||canKid(i))).map(i=>given(kn(i)));
 if(!names.length)return tg('Chưa gắn bé','wa');
 return names.slice(0,3).map(n=>`<span class="mkid">${esc(n)}</span>`).join('')+(names.length>3?`<span class="mkid">+${names.length-3}</span>`:'')}
function medCard(m,o){o=o||{};const sel=o.sel,on=sel&&(S.td.sel||[]).includes(m.id);
 return`<div class="mc ${on?'on':''}"><div class="mth" data-a="mview" data-v="${esc(m.id)}" data-l="${esc(o.list||'')}" role="button" tabindex="0" aria-label="Xem ${esc(medLabel(m))}">${medThumb(m)}</div>
 ${sel?`<label class="msel"><input type="checkbox" data-c="msel" value="${esc(m.id)}" ${on?'checked':''} aria-label="Chọn ${esc(medLabel(m))}"><span>Chọn</span></label>`:''}
 <div class="mb"><b class="mt">${esc(medLabel(m))}</b><div class="sm mu">${vd(m.d)}${m.bn&&!isPH()?' · '+esc(m.bn):''}${m.gr&&grBy(m.gr)&&!isPH()?' · '+esc(grBy(m.gr).n):''}</div>
 ${isPH()?'':`<div class="mtags">${medKidTags(m)}${medShared(m)?tg('Đã chia sẻ','ok'):tg('Chỉ nội bộ','gy')}</div>`}
 ${isPH()||!(medEdit(m)||medDel(m))?'':`<div class="acts mact">${medEdit(m)?`<button class="btn s" data-a="mtag" data-v="${esc(m.id)}">Gắn bé</button><button class="btn s" data-a="mshare" data-v="${esc(m.id)}">${medShared(m)?'Ngừng chia sẻ':'Chia sẻ'}</button>`:''}${medDel(m)?`<button class="btn s no" data-a="mdel" data-v="${esc(m.id)}">Xóa</button>`:''}</div>`}</div></div>`}
function medGrid(ms,o){o=o||{};return ms.length?`<div class="mg ${o.big?'big':''}">${ms.map(m=>medCard(m,o)).join('')}</div>`:`<p class="empty">${o.empty||'Chưa có ảnh hoặc video nào.'}</p>`}
function medDocRow(m){const u=medUrl(m);
 return`<tr><td>${m.p||m.u||isPH()?`<a data-mid="${esc(m.id)}" class="${u?'':'off'}" ${u?`href="${esc(u)}"`:''} target="_blank" rel="noopener"><b>${esc(medLabel(m))}</b></a>`:`<b>${esc(medLabel(m))}</b>`}<div class="sm mu">${mb(m.sz||0)}${m.n?' · '+esc(m.n):''}</div></td><td>${esc(m.cat||'Khác')}</td><td>${medKs(m).length?medKidTags(m):'–'}</td>${isPH()?'':`<td>${medShared(m)?tg('Phụ huynh xem được','ok'):tg('Chỉ nhân viên','gy')}</td>`}<td>${esc(m.bn||'')}</td><td class="nw">${vd(m.d)}</td>${isPH()?'':`<td class="nw">${medEdit(m)?`<button class="btn s" data-a="mtag" data-v="${esc(m.id)}">Gắn bé</button> <button class="btn s" data-a="mshare" data-v="${esc(m.id)}">${medShared(m)?'Ngừng chia sẻ':'Chia sẻ'}</button> `:''}${medDel(m)?`<button class="btn s no" data-a="mdel" data-v="${esc(m.id)}">Xóa</button>`:''}</td>`}</tr>`}
const medDocTable=(ms,empty)=>tbl(isPH()?['Tài liệu','Loại','Bé','Người tải','Ngày']:['Tài liệu','Loại','Bé','Ai xem được','Người tải','Ngày',''],ms.map(medDocRow).join(''),empty||'Chưa có tài liệu nào.');

/* ---- trang chính của nhân viên ---- */
const medAV=()=>medList().filter(m=>m.kind!=='doc'&&medSee(m)).sort(medSort);
const medDocs=()=>medList().filter(m=>m.kind==='doc'&&medSee(m)).sort(medSort);
const medWait=()=>medAV().filter(m=>!medKs(m).length);
const upNote=()=>`<p class="note sm" style="margin-bottom:12px">Ảnh và video lưu trong kho riêng tư của Trung tâm, không công khai. Mỗi tệp tối đa 50 MB; ảnh tự thu nhỏ để tải nhanh. Chỉ chia sẻ cho phụ huynh khi đã gắn đúng bé; phụ huynh chỉ xem được ảnh và video của bé nhà mình.${CLOUDMODE?'':' Bản dùng thử: video và tài liệu chỉ giữ trong phiên này.'}</p>`;
VIEWS.td=()=>{const t=S.td=Object.assign({tab:'gal',k:'',q:'',kind:'',m:'',gr:'',st:'wait',sel:[]},S.td);const nw=medWait().length;
 const q=t.q.trim().toLowerCase(),has=m=>!q||medLabel(m).toLowerCase().includes(q)||medKs(m).some(i=>kn(i).toLowerCase().includes(q));
 const kidSel=`<div><label for="tdk">Lọc theo bé</label><select id="tdk" data-c="tdk"><option value="">Tất cả</option>${opts(myKids().filter(k=>k.st==='dang').map(k=>[k.id,k.n]),t.k)}</select></div>`;
 const qBox=`<div><label for="tdq">Tìm theo tên tệp hoặc tên bé</label><input id="tdq" data-i="tdq" value="${esc(t.q)}"></div>`;
 let body;
 if(t.tab==='ref')body=refStaffBody();
 else if(t.tab==='tri')body=triStaffBody();
 else if(t.tab==='doc'){const ds=medDocs().filter(m=>has(m)&&(!t.k||medKs(m).includes(t.k)));
  body=`<div class="card"><div class="f2" style="margin-bottom:12px">${kidSel}${qBox}</div>${medDocTable(ds)}</div>`}
 else if(t.tab==='grp'){
  const gs=(isLead()||isVP()?DB.groups:myGroups().length?myGroups():DB.groups.filter(g=>medAV().some(m=>m.gr===g.id)));
  let ls=medAV().filter(m=>(m.gr||!medKs(m).length)&&has(m)&&(!t.gr||m.gr===t.gr)&&(t.st==='all'||(t.st==='wait'?!medKs(m).length:medKs(m).length>0)));
  const p=pg('mg',ls,12),sel=(t.sel||[]).filter(id=>ls.some(m=>m.id===id));
  body=`<div class="card"><p class="sm mu" style="margin-bottom:10px">Cô bán trú tải ảnh, video hoạt động chung của lớp lên đây. Giáo viên chọn mỗi ảnh có những bé nào; phụ huynh chỉ thấy ảnh có bé nhà mình. Với ảnh có nhiều bé, chỉ gắn những bé đã được gia đình đồng ý cho chia sẻ hình ảnh.</p>
  <div class="f2" style="margin-bottom:12px"><div><label for="tdg">Lớp bán trú</label><select id="tdg" data-c="tdg"><option value="">Tất cả các lớp</option>${opts(gs.map(g=>[g.id,g.n]),t.gr)}</select></div><div><label for="tds">Trạng thái</label><select id="tds" data-c="tds">${opts([['wait','Chưa gắn bé ('+nw+')'],['done','Đã gắn bé'],['all','Tất cả']],t.st)}</select></div></div>${qBox}
  <div class="acts" style="margin:10px 0"><button class="btn p" data-a="mtagsel" ${sel.length?'':'disabled'}>Gắn bé cho ${sel.length} tệp đã chọn</button><button class="btn s" data-a="mselall" data-v="${p.rows.map(m=>m.id).join(',')}">Chọn cả trang này</button><button class="btn s" data-a="mselno" ${sel.length?'':'disabled'}>Bỏ chọn</button></div>
  ${medGrid(p.rows,{sel:1,list:'grp',empty:t.st==='wait'?'Không có ảnh, video nào đang chờ gắn bé.':'Chưa có ảnh hoặc video hoạt động chung.'})}${p.html}</div>`}
 else{let ls=medAV().filter(m=>medKs(m).length&&has(m)&&(!t.k||medKs(m).includes(t.k))&&(!t.kind||m.kind===t.kind)&&(!t.m||String(m.d).slice(0,7)===t.m));
  const p=pg('mg',ls,12);
  body=`<div class="card"><div class="f2" style="margin-bottom:12px">${kidSel}${qBox}<div><label for="tdkind">Loại</label><select id="tdkind" data-c="tdkind">${opts([['','Ảnh và video'],['img','Chỉ ảnh'],['vid','Chỉ video']],t.kind)}</select></div><div><label for="tdm">Tháng</label><input id="tdm" type="month" data-c="tdm" value="${esc(t.m)}"></div></div>${medGrid(p.rows,{list:'gal'})}${p.html}</div>`}
 const btn=t.tab==='ref'?(canRef()?`<button class="btn p" data-a="rfm">Thêm tài liệu tham khảo</button>`:''):t.tab==='tri'?(canRef()?`<button class="btn p" data-a="trm">Thêm mục tri ân</button>`:''):canUpload()?`<button class="btn p" data-a="upm" data-v="${t.tab==='doc'?'doc':'av'}">${t.tab==='doc'?'Tải hồ sơ, giáo án lên':'Tải ảnh, video lên'}</button>`:'';
 return head('Ảnh, video và tài liệu','Ảnh hoạt động, tài liệu tham khảo cho phụ huynh, góc tri ân, giáo án và hồ sơ',btn)
  +tabsH([['gal','Ảnh và video'],['grp','Hoạt động chung'+(nw?' · '+nw+' chờ gắn bé':'')],['ref','Tài liệu tham khảo'],['tri','Góc tri ân'],['doc','Hồ sơ, giáo án']],t.tab,'tdtab')+(t.tab==='ref'||t.tab==='tri'?'':upNote())+body};
ACT.tdtab=v=>{S.td.tab=v;S.td.sel=[];S.pg.mg=1;S.pg.rf=1;S.pg.tri=1};CHG.tdk=v=>{S.td.k=v;S.pg.mg=1};CHG.tdg=v=>{S.td.gr=v;S.pg.mg=1;S.td.sel=[]};CHG.tds=v=>{S.td.st=v;S.pg.mg=1;S.td.sel=[]};CHG.tdkind=v=>{S.td.kind=v;S.pg.mg=1};CHG.tdm=v=>{S.td.m=v;S.pg.mg=1};
INP.tdq=v=>{S.td.q=v;S.pg.mg=1};
CHG.msel=(v,t)=>{const a=S.td.sel=S.td.sel||[],i=a.indexOf(v);if(t.checked&&i<0)a.push(v);if(!t.checked&&i>=0)a.splice(i,1)};
ACT.mselall=v=>{const a=S.td.sel=S.td.sel||[];v.split(',').filter(Boolean).forEach(id=>{if(!a.includes(id))a.push(id)})};
ACT.mselno=()=>{S.td.sel=[]};

/* ---- ảnh, video và tài liệu của từng bé (hồ sơ bé, cổng phụ huynh) ---- */
function mediaKid(k,mode){const kind=mode==='doc'?'doc':'av',all=medList().filter(m=>medSee(m)&&medKs(m).includes(k)&&(kind==='doc'?m.kind==='doc':m.kind!=='doc')).sort(medSort);
 const up=canUpload()&&!isPH()?`<div class="acts" style="margin-bottom:10px"><button class="btn p" data-a="upm" data-v="${kind}|${esc(k)}">${kind==='doc'?'Tải tài liệu lên':'Tải ảnh, video lên'}</button></div>`:'';
 if(kind==='doc')return up+medDocTable(all,'Chưa có tài liệu nào của bé.');
 const p=pg('mk'+k,all,12);return up+medGrid(p.rows,{list:'kid:'+k,empty:'Chưa có ảnh hoặc video nào của bé.'})+p.html}
/* cổng phụ huynh: chữ lớn, ảnh lớn, gom theo tháng */
function mediaParent(k){const all=medList().filter(m=>medSee(m)&&medKs(m).includes(k)).sort(medSort),av=all.filter(m=>m.kind!=='doc'),ds=all.filter(m=>m.kind==='doc');
 const p=pg('pm'+k,av,12),mo={};p.rows.forEach(m=>{(mo[String(m.d).slice(0,7)]=mo[String(m.d).slice(0,7)]||[]).push(m)});
 return`<div class="card"><h2>Ảnh và video của bé</h2><p class="sm mu" style="margin-bottom:10px">Chỉ dành cho gia đình bé. Xin vui lòng không đăng hoặc gửi cho người khác để bảo vệ hình ảnh các bé.</p>`
 +(av.length?Object.keys(mo).sort().reverse().map(m=>`<h3 class="mmo">Tháng ${+m.slice(5,7)}/${m.slice(0,4)}</h3>${medGrid(mo[m],{big:1,list:'ph:'+k})}`).join('')+p.html:'<p class="empty big">Chưa có ảnh hoặc video nào của bé. Khi giáo viên chia sẻ, ảnh và video sẽ hiện ở đây.</p>')+`</div>`
 +`<div class="card"><h2>Tài liệu riêng của bé</h2>${medDocTable(ds,'Chưa có tài liệu riêng nào cho bé.')}</div>`}
const vidList=k=>mediaKid(k,'av'),docList=k=>mediaKid(k,'doc');

/* bàn phím: Enter hoặc Space trên ảnh, video để mở xem */
document.addEventListener('keydown',e=>{const t=e.target;if((e.key==='Enter'||e.key===' ')&&t&&t.classList&&t.classList.contains('mth')&&t.dataset.a){e.preventDefault();t.click()}});
/* ---- xem lớn ---- */
function medListIds(tag){const kid=/^(?:kid|ph):(.+)$/.exec(tag||'');
 if(kid)return medList().filter(m=>m.kind!=='doc'&&medSee(m)&&medKs(m).includes(kid[1])).sort(medSort).map(m=>m.id);
 if(tag==='grp'){const t=S.td;return medAV().filter(m=>(m.gr||!medKs(m).length)&&(!t.gr||m.gr===t.gr)&&(t.st==='all'||(t.st==='wait'?!medKs(m).length:medKs(m).length>0))).map(m=>m.id)}
 const t=S.td||{};return medAV().filter(m=>medKs(m).length&&(!t.k||medKs(m).includes(t.k))&&(!t.kind||m.kind===t.kind)&&(!t.m||String(m.d).slice(0,7)===t.m)).map(m=>m.id)}
ACT.mview=(v,b)=>{const m=medList().find(x=>x.id===v);if(!m||!medSee(m))return false;
 if(m.kind==='doc'){const u=medUrl(m);if(u)window.open(u,'_blank','noopener');return false}
 const ids=medListIds(b&&b.dataset.l);if(!ids.includes(v))ids.unshift(v);
 S.modal={t:'mview',ids,i:ids.indexOf(v),back:S.modal&&!MEDM.includes(S.modal.t)?S.modal:S.modal&&S.modal.back||null}};
ACT.mnav=v=>{const m=S.modal,n=m.ids.length;m.i=(m.i+(+v)+n)%n};
MODALS.mview=()=>{const m0=S.modal,list=m0.ids.map(i=>medList().find(x=>x.id===i)).filter(m=>m&&medSee(m));
 if(!list.length){S.modal=m0.back||null;return''}
 m0.i=Math.min(m0.i,list.length-1);const m=list[m0.i],u=medUrl(m),ph=isPH();
 const media=m.kind==='vid'?`<video data-mid="${esc(m.id)}" class="mbig" controls playsinline preload="metadata" controlsList="nodownload noremoteplayback" disablepictureinpicture ${u?`src="${esc(u)}"`:''}></video>`:`<img data-mid="${esc(m.id)}" class="mbig" alt="${esc(medLabel(m))}" draggable="false" src="${esc(u||PIX)}">`;
 return mdl(medLabel(m),`<div class="mv">${media}</div>
 <div class="mvi"><span class="sm mu">${vd(m.d)}${m.bn?' · '+esc(m.bn):''}</span>${m.n?`<p>${esc(m.n)}</p>`:''}${ph?'':`<div class="mtags">${medKidTags(m)}${medShared(m)?tg('Đã chia sẻ','ok'):tg('Chỉ nội bộ','gy')}</div>`}</div>
 <div class="acts" style="justify-content:space-between;margin-top:12px"><span>${list.length>1?`<button class="btn" data-a="mnav" data-v="-1">‹ Trước</button> <span class="sm mu">${m0.i+1}/${list.length}</span> <button class="btn" data-a="mnav" data-v="1">Sau ›</button>`:''}</span><span>${ph||!medEdit(m)?'':`<button class="btn" data-a="mtag" data-v="${esc(m.id)}">Gắn bé</button> `}${ph||!medDel(m)?'':`<button class="btn no" data-a="mdel" data-v="${esc(m.id)}">Xóa</button>`}</span></div>`,1)};
/* đóng cửa sổ con thì quay về cửa sổ trước (hồ sơ bé) */
ACT.mx=()=>{const m=S.modal;S.modal=m&&m.back&&MEDM.includes(m.t)?m.back:null};
ACT.mbg=(v,b,e)=>{if(e.target!==b)return false;ACT.mx()};

/* ---- gắn bé và chia sẻ ---- */
function medCand(ms){const gs=[...new Set(ms.map(m=>m.gr).filter(Boolean))];let ks=myKids().filter(k=>k.st==='dang');
 if(gs.length===1){const inG=ks.filter(k=>k.gr===gs[0]);if(inG.length)ks=inG}
 ms.forEach(m=>medKs(m).forEach(i=>{if(kidBy(i)&&canKid(i)&&!ks.some(k=>k.id===i))ks=ks.concat(kidBy(i))}));
 return ks.slice().sort((a,b)=>a.n<b.n?-1:1)}
const modalBack=()=>S.modal&&!MEDM.includes(S.modal.t)?S.modal:S.modal&&S.modal.back||null;
function medOpenTag(ids){const ms=ids.map(i=>medList().find(x=>x.id===i)).filter(m=>m&&medSee(m)&&medEdit(m));
 if(!ms.length){toast('Chưa chọn tệp nào');return false}
 S.modal={t:'mtag',ids:ms.map(m=>m.id),back:modalBack()}}
ACT.mtag=v=>medOpenTag([v]);
ACT.mtagsel=()=>medOpenTag(S.td.sel||[]);
MODALS.mtag=()=>{const ms=S.modal.ids.map(i=>medList().find(x=>x.id===i)).filter(m=>m&&medSee(m)&&medEdit(m));
 if(!ms.length){S.modal=S.modal.back||null;return''}
 const cand=medCand(ms),all=ms.every(m=>medKs(m).length||true),inAll=cand.filter(k=>ms.every(m=>medKs(m).includes(k.id))).map(k=>k.id),shAll=ms.every(m=>m.sh)||ms.some(m=>!medKs(m).length);
 return mdl(ms.length>1?'Gắn bé cho '+ms.length+' tệp':'Gắn bé cho “'+medLabel(ms[0])+'”',`<form id="mtagf" class="f"><div class="mtl">${ms.slice(0,6).map(m=>`<span class="mtx">${medThumb(m)}</span>`).join('')}${ms.length>6?`<span class="sm mu">+${ms.length-6}</span>`:''}</div>
 <p class="sm mu">Chọn những bé có trong ${ms.length>1?'các tệp':'tệp'} này. Phụ huynh chỉ xem được khi tệp được chia sẻ và có bé nhà mình. Với ảnh có nhiều bé, chỉ gắn những bé đã được gia đình đồng ý cho chia sẻ hình ảnh.</p>
 <div class="acts"><button class="btn s" type="button" data-a="mall" data-v="1">Chọn tất cả</button><button class="btn s" type="button" data-a="mall" data-v="0">Bỏ chọn tất cả</button></div>
 <div class="mkl" role="group" aria-label="Danh sách bé">${cand.length?cand.map(k=>`<label class="chk"><input type="checkbox" name="kid" value="${esc(k.id)}" ${inAll.includes(k.id)?'checked':''}> ${esc(k.n)}</label>`).join(''):'<p class="empty">Bạn chưa có bé nào để gắn.</p>'}</div>
 <label class="chk"><input type="checkbox" name="sh" ${shAll?'checked':''}> Chia sẻ cho phụ huynh của các bé được chọn</label>
 <div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu</button></div></form>`)};
ACT.mall=(v,b)=>{const f=b.closest('form');if(f)f.querySelectorAll('input[name=kid]').forEach(c=>{c.checked=v==='1'});return false};
FORM.mtagf=f=>{const ms=S.modal.ids.map(i=>medList().find(x=>x.id===i)).filter(m=>m&&medSee(m)&&medEdit(m)),cand=medCand(ms).map(k=>k.id),
  on=[...f.querySelectorAll('input[name=kid]:checked')].map(c=>c.value).filter(i=>cand.includes(i)),sh=f.elements.sh.checked?1:0;
 ms.forEach(m=>{m.ks=medKs(m).filter(i=>!cand.includes(i)).concat(on);m.sh=sh});
 S.td.sel=[];const n=ms.length;S.modal=S.modal.back||null;toast(on.length?'Đã gắn '+on.length+' bé cho '+n+' tệp':'Đã bỏ gắn bé')};
ACT.mshare=v=>{const m=medList().find(x=>x.id===v);if(!m||!medEdit(m))return false;
 if(medShared(m)){m.sh=0;toast('Phụ huynh không còn xem được tệp này');return}
 if(!medKs(m).length){toast('Hãy gắn bé trước khi chia sẻ');S.modal={t:'mtag',ids:[m.id],back:modalBack()};return}
 ask('Chia sẻ “'+medLabel(m)+'” cho phụ huynh của: '+medKs(m).map(i=>kn(i)).join(', ')+'?',()=>{m.sh=1;toast('Đã chia sẻ cho phụ huynh');render()},'Chia sẻ')};

/* ---- tải lên ---- */
ACT.upm=v=>{if(!canUpload())return false;const [kind,k]=String(v||'av').split('|');
 S.up={busy:false,err:'',msg:'',form:null};S.modal={t:'upm',kind:kind==='doc'?'doc':'av',k:k||'',back:modalBack()}};
const upBtn=l=>`<button class="btn p" type="submit" ${S.up&&S.up.busy?'disabled':''}>${S.up&&S.up.busy?esc(S.up.msg||'Đang tải lên...'):l}</button>`;
MODALS.upm=()=>{const m=S.modal,doc=m.kind==='doc',F=Object.assign({d:WD,t:'',n:'',cat:'Giáo án',gr:'',sh:1,ks:m.k?[m.k]:[]},S.up&&S.up.form||{});
 const ks=myKids().filter(k=>k.st==='dang').sort((a,b)=>a.n<b.n?-1:1),gs=(isLead()||isVP()?DB.groups:myGroups());
 return mdl(doc?'Tải tài liệu lên':'Tải ảnh, video lên',`<form id="upmf" class="f"><div><label for="um-f">${doc?'Tệp tài liệu (PDF, Word, Excel, PowerPoint, CSV, văn bản; tối đa 50 MB mỗi tệp)':'Ảnh hoặc video (JPG, PNG, WebP, GIF, MP4, WebM, MOV; tối đa 50 MB mỗi tệp)'}</label><input id="um-f" name="f" type="file" multiple accept="${MEDIA_ACC[doc?'doc':'av']}" required></div>
 <div class="f2"><div><label for="um-d">${doc?'Ngày':'Ngày chụp, quay'}</label><input id="um-d" name="d" type="date" value="${esc(F.d)}" max="${TODAY}" required></div>
 ${doc?`<div><label for="um-c">Loại tài liệu</label><select id="um-c" name="cat">${opts(DCAT.map(x=>[x,x]),F.cat)}</select></div>`:`<div><label for="um-g">Hoạt động chung của lớp bán trú</label><select id="um-g" name="gr"><option value="">Không (ảnh riêng của bé)</option>${opts(gs.map(g=>[g.id,g.n]),F.gr)}</select></div>`}</div>
 <div class="f2"><div><label for="um-t">Tên hiển thị (không bắt buộc)</label><input id="um-t" name="t" maxlength="120" value="${esc(F.t)}" placeholder="Nếu để trống sẽ dùng tên tệp"></div><div><label for="um-n">Ghi chú cho phụ huynh</label><input id="um-n" name="n" maxlength="300" value="${esc(F.n)}"></div></div>
 <p class="sm mu" style="margin:0">${doc?'Gắn bé nếu tài liệu của riêng bé đó (bắt buộc với “Hồ sơ trẻ”). Không gắn bé thì chỉ nhân viên xem được.':'Ảnh chụp từng bé: chọn bé bên dưới. Ảnh sinh hoạt chung của lớp: chọn lớp bán trú và để trống phần chọn bé; giáo viên sẽ chọn bé có trong ảnh sau.'}</p>
 <div><div class="acts" style="justify-content:space-between;align-items:center"><label style="margin:0">Gắn với bé ${doc?'(không bắt buộc)':''}</label><span><button class="btn s" type="button" data-a="mall" data-v="1">Chọn tất cả</button> <button class="btn s" type="button" data-a="mall" data-v="0">Bỏ chọn</button></span></div>
 <div class="mkl" role="group" aria-label="Danh sách bé">${ks.map(k=>`<label class="chk"><input type="checkbox" name="kid" value="${esc(k.id)}" ${F.ks.includes(k.id)?'checked':''}> ${esc(k.n)}</label>`).join('')||'<p class="empty">Chưa có bé nào.</p>'}</div></div>
 <label class="chk"><input type="checkbox" name="sh" ${F.sh?'checked':''}> Chia sẻ cho phụ huynh của bé được chọn</label>
 <div class="err" role="alert">${esc(S.up.err)}</div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button>${upBtn('Tải lên')}</div></form>`)};

/* thu nhỏ ảnh trước khi tải (nhanh hơn, tiết kiệm dung lượng); lỗi thì dùng ảnh gốc */
async function medScale(file,max,q,force){
 if(typeof createImageBitmap!=='function')return null;
 try{const bm=await createImageBitmap(file,{imageOrientation:'from-image'}),sc=Math.min(1,max/Math.max(bm.width,bm.height));
  if(!force&&sc===1&&file.size<=1.5*1048576){if(bm.close)bm.close();return null}
  const cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(bm.width*sc));cv.height=Math.max(1,Math.round(bm.height*sc));
  const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(bm,0,0,cv.width,cv.height);if(bm.close)bm.close();
  return await new Promise(r=>cv.toBlob(r,'image/jpeg',q))}catch(e){return null}}
const blobUrl=b=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=()=>r('');fr.readAsDataURL(b)});
async function medStore(path,blob,ct){
 const go=()=>fetch(SB.url+'/storage/v1/object/'+MEDIA_BUCKET+'/'+path,{method:'POST',headers:{apikey:SB.key,Authorization:'Bearer '+CLD.ss.at,'Content-Type':ct,'x-upsert':'false'},body:blob});
 let r=await go();if(r.status===401&&await sbRefresh())r=await go();
 if(r.ok)return;
 let j={};try{j=await r.json()}catch(e){}
 const t=String(j.message||'')+' '+String(j.error||'');
 throw new Error(/bucket not found/i.test(t)?'Kho lưu tệp chưa được bật trên máy chủ. Hãy báo người quản trị hệ thống.':r.status===413||/exceeded|too large|payload/i.test(t)?'Tệp lớn hơn 50 MB.':r.status===415||/mime/i.test(t)?'Định dạng tệp chưa được hỗ trợ.':r.status===401||r.status===403||/row-level|unauthorized/i.test(t)?'Tài khoản này chưa có quyền tải lên.':'Máy chủ báo lỗi '+r.status+'.')}
async function medRemove(path){const r=await sbReq('/storage/v1/object/'+MEDIA_BUCKET+'/'+path,{method:'DELETE'});
 if(!r.ok&&r.status!==404)throw new Error('del')}
FORM.upmf=f=>{if(!canUpload()||(S.up&&S.up.busy))return false;
 const doc=S.modal.kind==='doc',e=f.elements,files=[...e.f.files],kids=[...f.querySelectorAll('input[name=kid]:checked')].map(c=>c.value).filter(canKid),
  form={d:e.d.value,t:e.t.value.trim(),n:e.n.value.trim(),cat:doc?e.cat.value:'Giáo án',gr:doc?'':e.gr.value,sh:e.sh.checked?1:0,ks:kids};
 S.up=Object.assign(S.up||{},{err:'',form});
 const fail=m=>{S.up.err=m;const er=f.querySelector('.err');if(er)er.textContent=m;return false};   /* không vẽ lại cửa sổ: giữ nguyên các tệp đã chọn */
 if(!files.length)return fail('Hãy chọn ít nhất một tệp.')
 if(CLOUDMODE&&!(CLD.ss&&CLD.ss.at))return fail('Phiên đăng nhập đã hết, hãy tải lại trang.')
 if(!/^\d{4}-\d{2}-\d{2}$/.test(form.d)||form.d>TODAY)return fail('Ngày không hợp lệ.')
 if(form.gr&&!medGrOk(form.gr))return fail('Bạn không phụ trách lớp bán trú này.')
 if(!doc&&!kids.length&&!form.gr)return fail('Hãy chọn bé, hoặc chọn lớp bán trú nếu là ảnh sinh hoạt chung.')
 if(doc&&form.cat==='Hồ sơ trẻ'&&!kids.length)return fail('Tài liệu “Hồ sơ trẻ” cần gắn với bé.')
 const jobs=[];
 for(const file of files){const k=medKindOf(file);
  if(!k)return fail('“'+file.name+'” có định dạng chưa hỗ trợ. '+(/\.(heic|heif)$/i.test(file.name)?'Ảnh HEIC của iPhone: hãy chọn ảnh JPEG (Cài đặt máy ảnh → Định dạng → Tương thích nhất).':''))
  if(file.size>MEDIA_MAX)return fail('“'+file.name+'” lớn hơn 50 MB. Hãy cắt ngắn hoặc nén rồi tải lại.')
  if(doc&&k.kind==='vid')return fail('“'+file.name+'” là video; hãy dùng nút “Tải ảnh, video lên”.')
  if(!doc&&k.kind==='doc')return fail('“'+file.name+'” là tài liệu; hãy dùng mục Hồ sơ, giáo án.')
  jobs.push({file,k})}
 S.up.busy=true;BUSY++;S.up.msg='Đang tải 1/'+jobs.length+'...';
 (async()=>{let ok=0;
  try{for(let i=0;i<jobs.length;i++){const {file,k}=jobs[i];S.up.msg='Đang tải '+(i+1)+'/'+jobs.length+'...';render();
    const id=uid(),rec={id,kind:k.kind,t:(jobs.length===1&&form.t)||file.name.replace(/\.[^.]+$/,'').slice(0,120),ct:k.ct,sz:file.size,d:form.d,by:U.id,bn:U.name,at:new Date().toISOString(),ks:kids.slice(),gr:form.gr,sh:form.sh,n:form.n};
    if(doc)rec.cat=form.cat;
    if(CLOUDMODE){let blob=file,ct=k.ct,ext=k.ext;
     if(k.kind==='img'&&k.ct!=='image/gif'){const sm=await medScale(file,1600,.82);if(sm&&sm.size<file.size){blob=sm;ct='image/jpeg';ext='jpg'}}
     const path='m/'+id+'.'+ext;await medStore(path,blob,ct);rec.p=path;rec.ct=ct;rec.sz=blob.size}
    else{MED.mem[id]=URL.createObjectURL(file);rec.mem=1;
     if(k.kind==='img'&&k.ct!=='image/gif'){const th=await medScale(file,480,.6,1);if(th&&th.size<400000){rec.u=await blobUrl(th);rec.mem=0}}}
    medList().push(rec);ok++}
   S.modal=S.modal.back||null;toast('Đã tải lên '+ok+' tệp'+(!doc&&!kids.length?'. Giáo viên vào tab “Hoạt động chung” để chọn bé.':''))}
  catch(x){S.up.err=(ok?'Đã tải lên '+ok+' tệp đầu. ':'')+'Tệp “'+jobs[ok].file.name+'” chưa tải được: '+(x&&x.message||'lỗi không rõ')+(ok?' Hãy chọn lại các tệp còn lại.':'')}
  finally{S.up.busy=false;BUSY--;render()}})();
 return false};

/* ---- xóa ---- */
ACT.mdel=v=>{const m=medList().find(x=>x.id===v);if(!m||!medDel(m))return false;
 ask('Xóa “'+medLabel(m)+'”? Tệp sẽ bị xóa khỏi kho và phụ huynh không xem được nữa.',async()=>{
  try{if(CLOUDMODE&&m.p)await medRemove(m.p);
   if(MED.mem[m.id]){try{URL.revokeObjectURL(MED.mem[m.id])}catch(e){}delete MED.mem[m.id]}
   DB.media=medList().filter(x=>x.id!==m.id);delete MED.u[m.id];toast('Đã xóa')}
  catch(x){toast('Chưa xóa được tệp, hãy thử lại')}render()},'Xóa')};

/* ---- ảnh mẫu cho chế độ ?demo ---- */
function seedMedia(D){
 const svg=(t,a,b)=>'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="640" height="480" fill="url(#g)"/><circle cx="470" cy="150" r="64" fill="#fff" fill-opacity=".55"/><rect x="90" y="270" width="300" height="110" rx="22" fill="#fff" fill-opacity=".5"/><text x="320" y="440" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#4a3b00">${t}</text></svg>`);
 const g=D.groups[0]||{id:'G1',gv:''},gk=D.kids.filter(k=>k.gr===g.id&&k.st==='dang'),gv=D.staff.find(s=>s.id===g.gv),by=gv?gv.id:'',bn=gv?gv.n:'Giáo viên',d0=lastWork(TODAY),d1=lastWork(addD(d0,-1));
 const mk=(id,t,a,b,o)=>Object.assign({id,kind:'img',t,ct:'image/svg+xml',sz:0,d:d0,by,bn,at:d0+'T09:00:00.000Z',ks:[],gr:g.id,sh:1,n:'',u:svg(t,a,b),demo:1},o);
 D.media=[
  mk('md1','Tô màu cùng cô','#ffe08a','#ffb36b',{ks:gk.slice(0,2).map(k=>k.id)}),
  mk('md2','Chơi cát ngoài sân','#bfe3ff','#8ec5a6',{d:d1,ks:gk.slice(0,1).map(k=>k.id)}),
  mk('md3','Hát múa buổi sáng','#ffd1dc','#d9b8ff',{}),
  mk('md4','Xếp hình khối','#d4f1c5','#9fd4e6',{d:d1,ks:[]})];
 if(gk[0])D.media.push({id:'md5',kind:'doc',t:'Hướng dẫn luyện tập tại nhà',ct:'text/plain',sz:140,d:d1,by,bn,at:d1+'T10:00:00.000Z',ks:[gk[0].id],gr:'',sh:1,n:'Gợi ý trò chơi 10 phút mỗi ngày',cat:'Hướng dẫn phụ huynh',u:'data:text/plain;charset=utf-8,'+encodeURIComponent('Hướng dẫn luyện tập tại nhà (mẫu)\n1. Gọi tên đồ vật quen thuộc.\n2. Chơi xếp khối cùng bé 10 phút.\n'),demo:1})}
