/* ===== 12b. Tài liệu tham khảo và Góc tri ân =====
   Hai nội dung CHUNG cho mọi phụ huynh, do Trưởng Trung tâm và Quản lý đăng (RLS: chỉ tt, ql ghi; vp, gv chỉ đọc; ph không đọc bảng trực tiếp).
   - ref = Tài liệu tham khảo (hướng dẫn, video mẫu để dạy bé tại nhà): {id,kind:'img'|'vid'|'doc',t,p:'r/<mã>.<đuôi>',ct,sz,d,by,bn,at,sh,n,cat}.
     Tài liệu chỉ nhận PDF (Word, Excel, PowerPoint cần lưu thành PDF trước) vì PDF xem được ngay trong trang mà không cần tải về.
   - tri = Góc tri ân (ảnh bé tốt nghiệp, tiến bộ, lời cảm ơn): {id,cat:'tn'|'tb'|'cm',t,n,who,d,ph:[{p:'t/<mã>-<số>.jpg',ct,sz}],cs:1,cn,k,sh,by,bn,at}.
     Bắt buộc ghi nhận gia đình đồng ý (cs) mới đăng; who là tên hiển thị đã rút gọn; k (bé liên quan) và cn (cách đồng ý) chỉ nhân viên thấy.
   - Tệp ở kho riêng tư gb-media, tiền tố r/ và t/. Phụ huynh nhận bản đã lọc qua /api/parent (không lộ đường dẫn, mã bé, người đăng)
     và đường xem tạm 15 phút qua hành động sign.
   - Phụ huynh chỉ XEM trong trang: không có nút tải, video tắt nút tải, PDF vẽ lên canvas bằng pdf.js (vendor/pdfjs), cổng phụ huynh có lớp phủ tên và chặn chuột phải, sao chép, in.
     Trình duyệt web KHÔNG chặn hẳn được chụp màn hình hay người rành kỹ thuật lấy địa chỉ tệp (xem p24-guard.js): đây là hạn chế và răn đe, không phải khóa tuyệt đối. */
const RCAT=['Hướng dẫn tại nhà','Video mẫu','Trò chơi, bài tập','Sinh hoạt, dinh dưỡng','Khác'];
const TCAT={tn:'Bé tốt nghiệp',tb:'Bé tiến bộ',cm:'Lời cảm ơn'},TCOL={tn:'ok',tb:'wa',cm:'gy'},TMAXPH=4;
const RF={u:{},q:new Set(),gone:new Set(),fail:{},retry:{},mem:{},t:0,up:null,pdf:null,lib:null};
const canRef=()=>isLead();
function refList(){if(!Array.isArray(DB.ref)){if(CLOUDMODE)DB.ref=[];else seedRef(DB)}return DB.ref}
function triList(){if(!Array.isArray(DB.tri)){if(CLOUDMODE)DB.tri=[];else seedRef(DB)}return DB.tri}
/* ai xem được: phụ huynh chỉ mục đã đăng (tri ân: cần cả sự đồng ý); nhân viên xem hết, trừ mục đã bị máy chủ báo gỡ */
const refSee=x=>!!U&&!!x&&!x.gone&&!RF.gone.has('r:'+x.id)&&(isPH()?!!x.sh:true);
const triSee=x=>!!U&&!!x&&!x.gone&&(isPH()?!!x.sh&&!!x.cs:true);
const rfSort=(a,b)=>a.d<b.d?1:a.d>b.d?-1:(a.at||'')<(b.at||'')?1:-1;
const triWho=k=>'Phụ huynh bé '+String(given(k.n)||'').trim().split(' ').pop().charAt(0).toUpperCase()+'.';

/* ---- đường xem tạm: khóa 'r:<mã>' (tài liệu) và 't:<mã>:<số ảnh>' (ảnh tri ân) ---- */
function rfRec(key){const a=String(key||'').split(':');
 if(a[0]==='r'){const x=refList().find(y=>y.id===a[1]);return x?{rec:x,p:x.p,u:x.u}:null}
 if(a[0]==='t'){const x=triList().find(y=>y.id===a[1]),f=x&&(x.ph||[])[+a[2]];return f?{rec:x,f,p:f.p,u:f.u}:null}
 return null}
function rfUrl(key,quiet){const r=rfRec(key);if(!r)return'';
 if(!CLOUDMODE||r.rec.demo)return RF.mem[key]||r.u||'';
 const c=RF.u[key];if(c&&c.exp>Date.now())return c.u;
 if(!quiet)rfWant(key);return''}
function rfWant(key){if(RF.q.has(key)||(RF.fail[key]||0)>Date.now()||!CLD.ss)return;RF.q.add(key);if(!RF.t)RF.t=setTimeout(rfFlush,40)}
async function rfFlush(){RF.t=0;const keys=[...RF.q];RF.q.clear();if(!keys.length)return;
 let goneNew=false;
 try{
  if(isPH()){for(let i=0;i<keys.length;i+=30){const part=keys.slice(i,i+30),
    j=await phApi({action:'sign',refs:part.filter(k=>k[0]==='r').map(k=>k.slice(2)),tris:part.filter(k=>k[0]==='t').map(k=>k.slice(2))}),ttl=(j.ttl||900)-60;
    Object.keys(j.urls||{}).forEach(k=>{RF.u[k]={u:j.urls[k],exp:Date.now()+ttl*1000}});
    (j.gone||[]).forEach(k=>{if(!RF.gone.has(k)){RF.gone.add(k);goneNew=true}})}}
  else{const it=keys.map(k=>({k,r:rfRec(k)})).filter(x=>x.r&&x.r.p);
   for(let i=0;i<it.length;i+=50){const part=it.slice(i,i+50),r=await sbReq('/storage/v1/object/sign/'+MEDIA_BUCKET,{method:'POST',body:{expiresIn:3600,paths:part.map(x=>x.r.p)}});
    if(!r.ok)throw new Error('sign');
    const out=await r.json(),by=new Map((Array.isArray(out)?out:[]).map(x=>[x.path,x]));
    part.forEach(x=>{const y=by.get(x.r.p);if(y&&y.signedURL&&!y.error)RF.u[x.k]={u:SB.url+'/storage/v1'+y.signedURL,exp:Date.now()+3540000};else RF.fail[x.k]=Date.now()+300000})}}
 }catch(e){keys.forEach(k=>{RF.fail[k]=Date.now()+30000})}
 if(goneNew)softRender();else rfPatch()}
function rfPatch(){document.querySelectorAll('[data-rk]').forEach(el=>{const u=rfUrl(el.dataset.rk,1);if(!u)return;
  const w=el.tagName==='VIDEO'&&!el.controls?u+'#t=0.1':u;if(el.getAttribute('src')!==w)el.setAttribute('src',w)});
 pdfSync()}
document.addEventListener('error',e=>{const el=e.target,k=el&&el.dataset&&el.dataset.rk;if(!k||!CLOUDMODE||/^data:/.test(el.getAttribute('src')||''))return;
 RF.retry[k]=(RF.retry[k]||0)+1;if(RF.retry[k]>2){RF.fail[k]=Date.now()+60000;return}delete RF.u[k];RF.fail[k]=0;rfWant(k)},true);

/* ---- thẻ ---- */
function rfThumb(key,kind,label){const u=rfUrl(key);
 if(kind==='img')return`<img data-rk="${esc(key)}" class="mi" alt="${esc(label)}" draggable="false" loading="lazy" src="${esc(u||PIX)}">`;
 if(kind==='vid')return`<video data-rk="${esc(key)}" class="mi" muted playsinline preload="metadata" disablepictureinpicture ${u?`src="${esc(u+'#t=0.1')}"`:''}></video><span class="mplay" aria-hidden="true">▶</span>`;
 return`<span class="mdoc" aria-hidden="true">PDF</span>`}
const rfKindLb=x=>x.kind==='vid'?'Video':x.kind==='img'?'Hình ảnh':'Tài liệu PDF';
function rfCard(x){const key='r:'+x.id,ph=isPH(),lead=canRef();
 return`<div class="mc"><div class="mth" data-a="rfview" data-v="${esc(key)}" role="button" tabindex="0" aria-label="Xem ${esc(x.t||'tài liệu')}">${rfThumb(key,x.kind,x.t)}</div>
 <div class="mb"><b class="mt">${esc(x.t||'(không tên)')}</b><div class="sm mu">${rfKindLb(x)} · ${vd(x.d)}${ph?'':' · '+mb(x.sz||0)}${!ph&&x.bn?' · '+esc(x.bn):''}</div>
 ${x.n?`<p class="sm pre rf-n">${esc(x.n)}</p>`:''}
 ${ph?'':`<div class="mtags">${tg(x.cat||'Khác','gy')}${x.sh?tg('Phụ huynh đang xem được','ok'):tg('Đang ẩn','wa')}</div>`}
 <div class="acts mact"><button class="btn s ${ph?'p':''}" data-a="rfview" data-v="${esc(key)}">Xem</button>${lead?`<button class="btn s" data-a="rfsh" data-v="${esc(x.id)}">${x.sh?'Ẩn':'Đăng cho phụ huynh'}</button><button class="btn s" data-a="rfed" data-v="${esc(x.id)}">Sửa</button><button class="btn s no" data-a="rfdel" data-v="${esc(x.id)}">Xóa</button>`:''}</div></div></div>`}
const rfNote=()=>`<p class="note sm" style="margin-bottom:12px">Tài liệu tham khảo là nội dung chung: <b>mọi phụ huynh</b> đều xem được khi mục được đăng. Phụ huynh chỉ xem trong ứng dụng, không có nút tải về; PDF hiển thị từng trang, video tắt nút tải. Trình duyệt không chặn hẳn được chụp màn hình, nên mỗi màn hình phụ huynh đều có lớp phủ tên và số liên hệ. ${canRef()?'Chỉ Trưởng Trung tâm và Quản lý đăng, sửa, xóa. Word, Excel, PowerPoint hãy lưu thành PDF trước khi tải lên.':'Chỉ Trưởng Trung tâm và Quản lý được đăng, sửa, xóa.'}${CLOUDMODE?'':' Bản dùng thử: tệp tải lên chỉ giữ trong phiên này.'}</p>`;
function refStaffBody(){const L=refList().filter(refSee).sort(rfSort),p=pg('rf',L,12);
 return`<div class="card">${rfNote()}${L.length?`<div class="mg big">${p.rows.map(rfCard).join('')}</div>${p.html}`:`<p class="empty">Chưa có tài liệu tham khảo nào.${canRef()?' Bấm “Thêm tài liệu tham khảo” để tải lên hướng dẫn hoặc video mẫu.':''}</p>`}</div>`}
/* cổng phụ huynh */
function refParent(){const L=refList().filter(refSee).sort(rfSort);
 const sec=RCAT.concat([...new Set(L.map(x=>x.cat).filter(c=>c&&!RCAT.includes(c)))]).map(c=>{const a=L.filter(x=>(RCAT.includes(x.cat)?x.cat:'Khác')===c||x.cat===c);return a.length?`<h3 class="mmo">${esc(c)}</h3><div class="mg big">${a.map(rfCard).join('')}</div>`:''}).join('');
 return`<div class="card"><h2>Tài liệu tham khảo</h2><p class="sm mu" style="margin-bottom:10px">Hướng dẫn và video mẫu do Trung tâm chuẩn bị để cha mẹ hỗ trợ bé luyện tập tại nhà. Nội dung chỉ để xem trong ứng dụng; xin vui lòng không chụp màn hình hay chia sẻ ra ngoài.</p>${sec||'<p class="empty big">Chưa có tài liệu tham khảo nào. Khi Trung tâm đăng hướng dẫn, tài liệu sẽ hiện ở đây.</p>'}</div>`}

/* ---- xem tài liệu, hình, video ---- */
ACT.rfview=v=>{const r=rfRec(v);if(!r||(v[0]==='r'?!refSee(r.rec):!triSee(r.rec)))return false;
 const keys=v[0]==='t'?(r.rec.ph||[]).map((f,i)=>'t:'+r.rec.id+':'+i).filter(k=>!RF.gone.has(k)):[v];
 S.modal={t:'rfv',keys,i:Math.max(0,keys.indexOf(v))}};
ACT.rfnav=v=>{const m=S.modal,n=m.keys.length;m.i=(m.i+(+v)+n)%n};
MODALS.rfv=()=>{const m=S.modal,k=m.keys[m.i],r=rfRec(k);
 if(!r||(k[0]==='r'?!refSee(r.rec):!triSee(r.rec))){S.modal=null;return''}
 const x=r.rec,isRef=k[0]==='r',kind=isRef?x.kind:'img',u=rfUrl(k),title=isRef?(x.t||'Tài liệu'):(x.t||TCAT[x.cat]||'Ảnh'),P=RF.pdf&&RF.pdf.key===k?RF.pdf:null;
 let media;
 if(kind==='vid')media=`<div class="mv"><video data-rk="${esc(k)}" class="mbig" controls playsinline preload="metadata" controlsList="nodownload noremoteplayback" disablepictureinpicture ${u?`src="${esc(u)}"`:''}></video></div>`;
 else if(kind==='doc')media=`<div class="pdfv"><p class="sm mu" id="pdfst" role="status">${P&&P.err?esc(P.err):'Đang mở tài liệu...'}</p><canvas id="pdfc" aria-label="Trang tài liệu"></canvas></div>
  <div class="acts" style="justify-content:center;margin-top:10px" ${P&&P.total>1?'':'hidden'}><button class="btn" data-a="pdfn" data-v="-1" ${P&&P.page>1?'':'disabled'}>‹ Trang trước</button><span class="sm mu" id="pdfpg">Trang ${P?P.page:1}/${P&&P.total||1}</span><button class="btn" data-a="pdfn" data-v="1" ${P&&P.page<P.total?'':'disabled'}>Trang sau ›</button></div>`;
 else media=`<div class="mv"><img data-rk="${esc(k)}" class="mbig" alt="${esc(title)}" draggable="false" src="${esc(u||PIX)}"></div>`;
 return mdl(title,`${media}<div class="mvi"><span class="sm mu">${isRef?vd(x.d):(x.who?esc(x.who)+' · ':'')+vd(x.d)}</span>${isRef&&x.n?`<p class="pre">${esc(x.n)}</p>`:''}</div>
  ${m.keys.length>1?`<div class="acts" style="justify-content:center;margin-top:12px"><button class="btn" data-a="rfnav" data-v="-1">‹ Trước</button> <span class="sm mu">${m.i+1}/${m.keys.length}</span> <button class="btn" data-a="rfnav" data-v="1">Sau ›</button></div>`:''}`,1)};

/* PDF: pdf.js tự lưu trong vendor/pdfjs (cùng máy chủ, không dùng CDN); vẽ từng trang lên canvas, không dùng trình xem PDF của trình duyệt nên không có nút tải, in */
async function pdfLib(){if(RF.lib)return RF.lib;
 const base=typeof window.GB_PDFJS==='string'?window.GB_PDFJS:'vendor/pdfjs/',lib=await import(new URL(base+'pdf.min.mjs',document.baseURI).href);
 lib.GlobalWorkerOptions.workerSrc=new URL(base+'pdf.worker.min.mjs',document.baseURI).href;return RF.lib=lib}
function pdfDrop(){const P=RF.pdf;RF.pdf=null;if(P){P.tok++;try{if(P.doc)P.doc.destroy()}catch(e){}}}
function pdfSync(){const m=S.modal;
 if(!m||m.t!=='rfv'){if(RF.pdf)pdfDrop();return}
 const k=m.keys[m.i],r=rfRec(k);
 if(!r||k[0]!=='r'||r.rec.kind!=='doc'){if(RF.pdf)pdfDrop();return}
 if(!RF.pdf||RF.pdf.key!==k){pdfDrop();RF.pdf={key:k,doc:null,page:1,total:0,cv:null,shown:0,tok:0,loading:false,err:''}}
 const Q=RF.pdf;if(Q.err)return;
 if(!Q.doc){if(!Q.loading)pdfLoad(Q);return}
 if(Q.cv&&Q.shown===Q.page){pdfBlit();return}
 pdfDraw(Q)}
async function pdfLoad(Q){const u=rfUrl(Q.key);if(!u)return;   /* chưa có đường xem tạm: rfPatch sẽ gọi lại khi có */
 Q.loading=true;
 try{const lib=await pdfLib(),res=await fetch(u);if(!res.ok)throw new Error('http '+res.status);
  const doc=await lib.getDocument({data:new Uint8Array(await res.arrayBuffer()),isEvalSupported:false}).promise;
  if(RF.pdf!==Q){try{doc.destroy()}catch(e){}return}
  Q.doc=doc;Q.total=doc.numPages;Q.loading=false;render()}
 catch(e){if(RF.pdf!==Q)return;Q.loading=false;Q.why=String(e&&e.message||e).slice(0,200);Q.err='Chưa mở được tài liệu này. Hãy đóng rồi mở lại, hoặc báo Trung tâm nếu vẫn lỗi.';render()}}
async function pdfDraw(Q){const tok=++Q.tok,cv=$q('#pdfc');if(!cv)return;
 try{const page=await Q.doc.getPage(Q.page);if(tok!==Q.tok||RF.pdf!==Q)return;
  const w=Math.max(280,Math.min(cv.parentElement.clientWidth||800,1000)),v0=page.getViewport({scale:1}),dpr=Math.min(window.devicePixelRatio||1,2),vp=page.getViewport({scale:w/v0.width*dpr}),
   off=document.createElement('canvas');off.width=Math.floor(vp.width);off.height=Math.floor(vp.height);
  await page.render({canvasContext:off.getContext('2d'),viewport:vp}).promise;
  if(tok!==Q.tok||RF.pdf!==Q)return;Q.cv=off;Q.shown=Q.page;pdfBlit()}
 catch(e){if(RF.pdf===Q&&!Q.err){Q.err='Chưa hiển thị được trang này.';render()}}}
function pdfBlit(){const Q=RF.pdf,cv=$q('#pdfc');if(!Q||!Q.cv||!cv)return;
 cv.width=Q.cv.width;cv.height=Q.cv.height;cv.getContext('2d').drawImage(Q.cv,0,0);
 const st=$q('#pdfst');if(st)st.textContent='';const pgl=$q('#pdfpg');if(pgl)pgl.textContent='Trang '+Q.page+'/'+Q.total;
 const nav=pgl&&pgl.parentElement;if(nav)nav.hidden=Q.total<2}
ACT.pdfn=v=>{const Q=RF.pdf;if(!Q||!Q.doc)return false;const p=Math.max(1,Math.min(Q.total,Q.page+(+v)));if(p===Q.page)return false;Q.page=p;Q.cv=null};
{const _renderRF=render;render=function(){_renderRF.apply(this,arguments);pdfSync()}}
document.addEventListener('keydown',e=>{if(!S.modal||S.modal.t!=='rfv'||!RF.pdf||!RF.pdf.doc)return;
 if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();ACT.pdfn('1')!==false&&render()}
 if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();ACT.pdfn('-1')!==false&&render()}});

/* ---- Tài liệu tham khảo: đăng, ẩn, sửa, xóa (tt, ql) ---- */
ACT.rfm=()=>{if(!canRef())return false;RF.up={busy:false,err:'',msg:''};S.modal={t:'rfm'}};
const rfBtn=l=>`<button class="btn p" type="submit" ${RF.up&&RF.up.busy?'disabled':''}>${RF.up&&RF.up.busy?esc(RF.up.msg||'Đang tải lên...'):l}</button>`;
MODALS.rfm=()=>mdl('Thêm tài liệu tham khảo',`<form id="rfmf" class="f"><div><label for="rf-f">Tệp (PDF, ảnh, video MP4, WebM, MOV; tối đa ${MEDIA_MB} MB mỗi tệp)</label><input id="rf-f" name="f" type="file" multiple accept=".pdf,application/pdf,image/*,video/*,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov" required></div>
 <div class="f2"><div><label for="rf-c">Nhóm</label><select id="rf-c" name="cat">${opts(RCAT.map(x=>[x,x]),'Hướng dẫn tại nhà')}</select></div><div><label for="rf-t">Tên hiển thị (không bắt buộc)</label><input id="rf-t" name="t" maxlength="120" placeholder="Nếu để trống sẽ dùng tên tệp"></div></div>
 <div><label for="rf-n">Hướng dẫn ngắn cho phụ huynh (không bắt buộc)</label><textarea id="rf-n" name="n" rows="3" maxlength="1500" placeholder="Ví dụ: Chơi 10 phút mỗi ngày, ngồi đối diện bé, chờ bé nhìn rồi mới đưa đồ chơi."></textarea></div>
 <label class="chk"><input type="checkbox" name="sh" checked> Đăng cho tất cả phụ huynh xem ngay</label>
 <p class="sm mu" style="margin:0">Nội dung này hiện cho <b>mọi phụ huynh</b>. Không đưa họ tên, hình ảnh, thông tin riêng của bé nào vào tài liệu chung.</p>
 <div class="err" role="alert">${esc(RF.up&&RF.up.err||'')}</div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button>${rfBtn('Tải lên')}</div></form>`);
FORM.rfmf=f=>{if(!canRef()||(RF.up&&RF.up.busy))return false;
 const e=f.elements,files=[...e.f.files],form={cat:e.cat.value,t:e.t.value.trim(),n:e.n.value.trim(),sh:e.sh.checked?1:0};
 RF.up=Object.assign(RF.up||{},{err:''});
 const fail=m=>{RF.up.err=m;const er=f.querySelector('.err');if(er)er.textContent=m;return false};
 if(!files.length)return fail('Hãy chọn ít nhất một tệp.');
 if(CLOUDMODE&&!(CLD.ss&&CLD.ss.at))return fail('Phiên đăng nhập đã hết, hãy tải lại trang.');
 const jobs=[];
 for(const file of files){const k=medKindOf(file);
  if(!k)return fail('“'+file.name+'” có định dạng chưa hỗ trợ.');
  if(k.kind==='doc'&&k.ct!=='application/pdf')return fail('“'+file.name+'” không phải PDF. Hãy lưu Word, Excel, PowerPoint thành PDF rồi tải lại (PDF xem được ngay trong ứng dụng, không cần tải về).');
  if(file.size>MEDIA_MAX)return fail('“'+file.name+'” lớn hơn '+MEDIA_MB+' MB. Hãy cắt ngắn hoặc nén rồi tải lại.');
  jobs.push({file,k})}
 RF.up.busy=true;BUSY++;RF.up.msg='Đang tải 1/'+jobs.length+'...';
 (async()=>{let ok=0;
  try{for(let i=0;i<jobs.length;i++){const {file,k}=jobs[i];RF.up.msg='Đang tải '+(i+1)+'/'+jobs.length+'...';render();
    const id=uid(),rec={id,kind:k.kind,t:(jobs.length===1&&form.t)||file.name.replace(/\.[^.]+$/,'').slice(0,120),ct:k.ct,sz:file.size,d:TODAY,by:U.id,bn:U.name,at:new Date().toISOString(),sh:form.sh,n:form.n,cat:form.cat};
    if(CLOUDMODE){let blob=file,ct=k.ct,ext=k.ext;
     if(k.kind==='img'&&k.ct!=='image/gif'){const sm=await medScale(file,1800,.85);if(sm&&sm.size<file.size){blob=sm;ct='image/jpeg';ext='jpg'}}
     const path='r/'+id+'.'+ext;await medStore(path,blob,ct);rec.p=path;rec.ct=ct;rec.sz=blob.size}
    else{RF.mem['r:'+id]=URL.createObjectURL(file);
     if(k.kind==='img'&&k.ct!=='image/gif'){const th=await medScale(file,900,.7,1);if(th&&th.size<600000){rec.u=await blobUrl(th);delete RF.mem['r:'+id]}}}
    refList().push(rec);ok++}
   S.modal=null;toast('Đã tải lên '+ok+' tệp'+(form.sh?' và đăng cho phụ huynh':''))}
  catch(x){RF.up.err=(ok?'Đã tải lên '+ok+' tệp đầu. ':'')+'Tệp “'+jobs[ok].file.name+'” chưa tải được: '+(x&&x.message||'lỗi không rõ')+(ok?' Hãy chọn lại các tệp còn lại.':'')}
  finally{RF.up.busy=false;BUSY--;render()}})();
 return false};
ACT.rfsh=v=>{const x=refList().find(y=>y.id===v);if(!x||!canRef())return false;
 if(x.sh){x.sh=0;toast('Phụ huynh không còn xem được tài liệu này');return}
 ask('Đăng “'+(x.t||'tài liệu')+'” cho TẤT CẢ phụ huynh xem?',()=>{x.sh=1;toast('Đã đăng cho phụ huynh');render()},'Đăng')};
ACT.rfed=v=>{if(!canRef()||!refList().some(y=>y.id===v))return false;S.modal={t:'rfe',id:v}};
MODALS.rfe=()=>{const x=refList().find(y=>y.id===S.modal.id);if(!x){S.modal=null;return''}
 return mdl('Sửa tài liệu tham khảo',`<form id="rfef" class="f"><div class="f2"><div><label for="re-c">Nhóm</label><select id="re-c" name="cat">${opts(RCAT.concat(RCAT.includes(x.cat)?[]:[x.cat].filter(Boolean)).map(c=>[c,c]),x.cat||'Khác')}</select></div><div><label for="re-t">Tên hiển thị</label><input id="re-t" name="t" maxlength="120" value="${esc(x.t)}" required></div></div>
 <div><label for="re-n">Hướng dẫn ngắn cho phụ huynh</label><textarea id="re-n" name="n" rows="4" maxlength="1500">${esc(x.n)}</textarea></div>
 <label class="chk"><input type="checkbox" name="sh" ${x.sh?'checked':''}> Đang đăng cho tất cả phụ huynh</label>
 <div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button><button class="btn p" type="submit">Lưu</button></div></form>`)};
FORM.rfef=f=>{const x=refList().find(y=>y.id===S.modal.id);if(!x||!canRef())return false;const e=f.elements;
 x.cat=e.cat.value;x.t=e.t.value.trim()||x.t;x.n=e.n.value.trim();x.sh=e.sh.checked?1:0;S.modal=null;toast('Đã lưu')};
ACT.rfdel=v=>{const x=refList().find(y=>y.id===v);if(!x||!canRef())return false;
 ask('Xóa “'+(x.t||'tài liệu')+'”? Tệp bị xóa khỏi kho và phụ huynh không xem được nữa.',async()=>{
  try{if(CLOUDMODE&&x.p)await medRemove(x.p);
   if(RF.mem['r:'+x.id]){try{URL.revokeObjectURL(RF.mem['r:'+x.id])}catch(e){}delete RF.mem['r:'+x.id]}
   DB.ref=refList().filter(y=>y.id!==x.id);delete RF.u['r:'+x.id];toast('Đã xóa')}
  catch(e){toast('Chưa xóa được tệp, hãy thử lại')}render()},'Xóa')};

/* ---- Góc tri ân ---- */
function triCard(x){const keys=(x.ph||[]).map((f,i)=>'t:'+x.id+':'+i).filter(k=>!RF.gone.has(k)),ph=isPH(),lead=canRef(),kid=!ph&&x.k?kidBy(x.k):null;
 const pics=keys.length?`<div class="tph n${Math.min(keys.length,4)}">${keys.map(k=>`<div class="mth" data-a="rfview" data-v="${esc(k)}" role="button" tabindex="0" aria-label="Xem ảnh lớn">${rfThumb(k,'img',x.t||TCAT[x.cat])}</div>`).join('')}</div>`:'';
 return`<article class="tri"><div class="tr-h">${tg(TCAT[x.cat]||'Lời cảm ơn',TCOL[x.cat]||'gy')}${ph?'':(x.sh?tg('Phụ huynh đang xem được','ok'):tg('Đang ẩn','wa'))}</div>${pics}
 <div class="tr-b">${x.t?`<h3>${esc(x.t)}</h3>`:''}${x.n?`<p class="pre tr-n">${esc(x.n)}</p>`:''}<p class="sm mu tr-f">${x.who?'— '+esc(x.who)+' · ':''}${vd(x.d)}</p>
 ${ph?'':`<p class="sm mu">Gia đình đồng ý: ${esc(x.cn||'(đã tích xác nhận)')}${kid?' · Bé liên quan (chỉ nhân viên thấy): '+esc(kid.n):''}</p>`}
 ${lead?`<div class="acts mact"><button class="btn s" data-a="trsh" data-v="${esc(x.id)}">${x.sh?'Ẩn':'Đăng cho phụ huynh'}</button><button class="btn s" data-a="trm" data-v="${esc(x.id)}">Sửa</button><button class="btn s no" data-a="trdel" data-v="${esc(x.id)}">Xóa</button></div>`:''}</div></article>`}
const triNote=()=>`<p class="note sm" style="margin-bottom:12px">Góc tri ân giúp phụ huynh mới thấy những bé đã tiến bộ, tốt nghiệp và lời cảm ơn của các gia đình. Đây là nội dung <b>chung cho mọi phụ huynh</b>, nên <b>chỉ đăng khi gia đình đã đồng ý</b> (tin nhắn Zalo, giấy đồng ý…) và ghi rõ cách đồng ý. Tên hiển thị nên rút gọn (ví dụ: “Phụ huynh bé M.”). Chỉ đăng ảnh, không đăng video; mỗi mục tối đa ${TMAXPH} ảnh. Gia đình rút lại đồng ý thì bấm Ẩn hoặc Xóa ngay. ${canRef()?'Chỉ Trưởng Trung tâm và Quản lý đăng, sửa, xóa.':'Chỉ Trưởng Trung tâm và Quản lý được đăng, sửa, xóa.'}${CLOUDMODE?'':' Bản dùng thử: ảnh tải lên chỉ giữ trong phiên này.'}</p>`;
function triStaffBody(){const L=triList().filter(triSee).sort(rfSort),p=pg('tri',L,9);
 return`<div class="card">${triNote()}${L.length?`<div class="trg">${p.rows.map(triCard).join('')}</div>${p.html}`:`<p class="empty">Chưa có mục tri ân nào.${canRef()?' Bấm “Thêm mục tri ân” để đăng ảnh bé tiến bộ, tốt nghiệp hoặc lời cảm ơn.':''}</p>`}</div>`}
function triParent(){const L=triList().filter(triSee).sort(rfSort),p=pg('trp',L,9);
 return`<div class="card"><h2>Góc tri ân</h2><p class="sm mu" style="margin-bottom:10px">Hình ảnh và lời nhắn của các gia đình có bé đã tiến bộ, tốt nghiệp tại ${esc(DB.cfg.name||'Trung tâm')}. Những nội dung này chỉ được đăng khi gia đình đồng ý. Xin vui lòng không chụp màn hình hay chia sẻ ra ngoài.</p>
 ${L.length?`<div class="trg big">${p.rows.map(triCard).join('')}</div>${p.html}`:'<p class="empty big">Chưa có nội dung nào. Khi có bé tiến bộ hoặc tốt nghiệp, Trung tâm sẽ chia sẻ ở đây.</p>'}</div>`}

ACT.trm=v=>{if(!canRef())return false;RF.up={busy:false,err:'',msg:''};S.modal={t:'trm',id:v||''}};
CHG.trk=(v,t)=>{const f=t.closest('form'),k=v&&kidBy(v);if(k&&f&&f.elements.who&&!f.elements.who.value.trim())f.elements.who.value=triWho(k);return false};
MODALS.trm=()=>{const m=S.modal,x=m.id?triList().find(y=>y.id===m.id):null;if(m.id&&!x){S.modal=null;return''}
 const F=Object.assign({cat:'tn',t:'',n:'',who:'',d:TODAY,k:'',cn:'',sh:1},x||{}),old=x?(x.ph||[]):[];
 return mdl(x?'Sửa mục tri ân':'Thêm mục tri ân',`<form id="trmf" class="f">
 <div class="f2"><div><label for="tr-c">Loại</label><select id="tr-c" name="cat">${opts(Object.entries(TCAT),F.cat)}</select></div><div><label for="tr-d">Ngày</label><input id="tr-d" name="d" type="date" value="${esc(F.d)}" max="${TODAY}" required></div></div>
 <div><label for="tr-t">Tiêu đề (không bắt buộc)</label><input id="tr-t" name="t" maxlength="120" value="${esc(F.t)}" placeholder="Ví dụ: Bé M. đã sẵn sàng vào lớp 1"></div>
 <div><label for="tr-n">Lời nhắn, lời cảm ơn</label><textarea id="tr-n" name="n" rows="5" maxlength="1500">${esc(F.n)}</textarea></div>
 <div class="f2"><div><label for="tr-k">Bé liên quan (chỉ nhân viên thấy, không hiện cho phụ huynh)</label><select id="tr-k" name="k" data-c="trk"><option value="">Không chọn</option>${opts(DB.kids.slice().sort((a,b)=>a.n<b.n?-1:1).map(k=>[k.id,k.n]),F.k)}</select></div>
  <div><label for="tr-w">Tên hiển thị cho phụ huynh khác</label><input id="tr-w" name="who" maxlength="60" value="${esc(F.who)}" placeholder="Ví dụ: Phụ huynh bé M." required></div></div>
 <div><label for="tr-f">Ảnh (JPG, PNG, WebP; tối đa ${TMAXPH} ảnh mỗi mục; không đăng video)</label><input id="tr-f" name="f" type="file" multiple accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"></div>
 ${old.length?`<div><label>Ảnh hiện có (tích để gỡ)</label><div class="mkl" role="group">${old.map((f,i)=>`<label class="chk"><input type="checkbox" name="rm" value="${i}"> <span class="mtx">${rfThumb('t:'+x.id+':'+i,'img','Ảnh '+(i+1))}</span> Ảnh ${i+1}</label>`).join('')}</div></div>`:''}
 <fieldset class="trc"><legend>Gia đình đã đồng ý</legend>
  <label class="chk"><input type="checkbox" name="cs" ${x&&x.cs?'checked':''}> Gia đình đã đồng ý cho đăng hình ảnh và lời nhắn này cho các phụ huynh khác trong ứng dụng xem</label>
  <div><label for="tr-o">Gia đình đồng ý bằng cách nào? (ví dụ: tin nhắn Zalo 05/11/2026)</label><input id="tr-o" name="cn" maxlength="120" value="${esc(F.cn)}"></div></fieldset>
 <label class="chk"><input type="checkbox" name="sh" ${F.sh?'checked':''}> Đăng cho tất cả phụ huynh xem ngay</label>
 <div class="err" role="alert">${esc(RF.up&&RF.up.err||'')}</div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button>${rfBtn('Lưu')}</div></form>`,1)};
FORM.trmf=f=>{if(!canRef()||(RF.up&&RF.up.busy))return false;
 const x=S.modal.id?triList().find(y=>y.id===S.modal.id):null,e=f.elements,files=[...(e.f.files||[])],rm=[...f.querySelectorAll('input[name=rm]:checked')].map(c=>+c.value),
  form={cat:e.cat.value,d:e.d.value,t:e.t.value.trim(),n:e.n.value.trim(),k:e.k.value,who:e.who.value.trim(),cn:e.cn.value.trim(),cs:e.cs.checked?1:0,sh:e.sh.checked?1:0};
 RF.up=Object.assign(RF.up||{},{err:''});
 const fail=m=>{RF.up.err=m;const er=f.querySelector('.err');if(er)er.textContent=m;return false};
 if(CLOUDMODE&&!(CLD.ss&&CLD.ss.at))return fail('Phiên đăng nhập đã hết, hãy tải lại trang.');
 if(!TCAT[form.cat])return fail('Hãy chọn loại.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(form.d)||form.d>TODAY)return fail('Ngày không hợp lệ.');
 if(!form.who)return fail('Hãy nhập tên hiển thị, nên rút gọn (ví dụ: Phụ huynh bé M.).');
 if(!form.cs)return fail('Chỉ đăng khi gia đình đã đồng ý. Hãy tích ô xác nhận sau khi đã có sự đồng ý của gia đình.');
 const keep=(x?x.ph||[]:[]).filter((_,i)=>!rm.includes(i));
 if(!form.t&&!form.n&&!keep.length&&!files.length)return fail('Hãy nhập lời nhắn hoặc chọn ít nhất một ảnh.');
 if(keep.length+files.length>TMAXPH)return fail('Mỗi mục tối đa '+TMAXPH+' ảnh.');
 const jobs=[];
 for(const file of files){const k=medKindOf(file);
  if(!k||k.kind!=='img'||k.ct==='image/gif')return fail('“'+file.name+'” không phải ảnh JPG, PNG hoặc WebP.'+(/\.(heic|heif)$/i.test(file.name)?' Ảnh HEIC của iPhone: hãy chọn ảnh JPEG.':''));
  if(file.size>MEDIA_MAX)return fail('“'+file.name+'” lớn hơn '+MEDIA_MB+' MB.');
  jobs.push({file,k})}
 const oldPaths=x?(x.ph||[]).map(f=>f.p):[],dead=rm.map(i=>oldPaths[i]).filter(Boolean);
 RF.up.busy=true;BUSY++;RF.up.msg=jobs.length?'Đang tải ảnh 1/'+jobs.length+'...':'Đang lưu...';
 (async()=>{const id=x?x.id:uid(),made=[];let done=false;
  try{for(let i=0;i<jobs.length;i++){const {file,k}=jobs[i];RF.up.msg='Đang tải ảnh '+(i+1)+'/'+jobs.length+'...';render();
    const f={ct:'image/jpeg',sz:file.size};
    if(CLOUDMODE){const sm=await medScale(file,1600,.82,1)||file,ct=sm===file?k.ct:'image/jpeg',ext=sm===file?k.ext:'jpg',path='t/'+id+'-'+uid()+'.'+ext;
     await medStore(path,sm,ct);f.p=path;f.ct=ct;f.sz=sm.size}
    else{const th=await medScale(file,900,.7,1);if(!th)throw new Error('Không đọc được ảnh.');f.u=await blobUrl(th);f.sz=th.size}
    made.push(f)}
   const rec=Object.assign(x||{id,at:new Date().toISOString(),by:U.id,bn:U.name},form,{ph:keep.concat(made)});
   if(!x)triList().push(rec);
   done=true;Object.keys(RF.u).filter(k=>k.startsWith('t:'+id+':')).forEach(k=>delete RF.u[k]);
   S.modal=null;toast(x?'Đã lưu':'Đã thêm mục tri ân'+(form.sh?' và đăng cho phụ huynh':''))}
  catch(er){RF.up.err='Chưa lưu được: '+(er&&er.message||'lỗi không rõ')+(made.length?' Ảnh đã tải lên một phần; hãy chọn lại ảnh và lưu lại.':'')}
  finally{RF.up.busy=false;BUSY--;render()}
  /* ảnh bị gỡ: xóa khỏi kho sau khi mục đã được ghi nhận */
  if(done&&CLOUDMODE)for(const pth of dead){try{await medRemove(pth)}catch(e){}}})();
 return false};
ACT.trsh=v=>{const x=triList().find(y=>y.id===v);if(!x||!canRef())return false;
 if(x.sh){x.sh=0;toast('Phụ huynh không còn xem được mục này');return}
 if(!x.cs){toast('Cần xác nhận gia đình đã đồng ý trước khi đăng');S.modal={t:'trm',id:x.id};RF.up={busy:false,err:'',msg:''};return}
 ask('Đăng mục này cho TẤT CẢ phụ huynh xem? Gia đình đã đồng ý: '+(x.cn||'có')+'.',()=>{x.sh=1;toast('Đã đăng cho phụ huynh');render()},'Đăng')};
ACT.trdel=v=>{const x=triList().find(y=>y.id===v);if(!x||!canRef())return false;
 ask('Xóa mục tri ân'+(x.t?' “'+x.t+'”':'')+'? Ảnh bị xóa khỏi kho và phụ huynh không xem được nữa.',async()=>{
  try{if(CLOUDMODE)for(const f of (x.ph||[]))if(f.p)await medRemove(f.p);
   DB.tri=triList().filter(y=>y.id!==x.id);Object.keys(RF.u).filter(k=>k.startsWith('t:'+x.id+':')).forEach(k=>delete RF.u[k]);toast('Đã xóa')}
  catch(e){toast('Chưa xóa được ảnh, hãy thử lại')}render()},'Xóa')};

/* ---- mẫu cho chế độ ?demo ---- */
function miniPdf(title,pages){
 const pe=s=>s.replace(/[()\\]/g,'\\$&'),objs=['<< /Type /Catalog /Pages 2 0 R >>','','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'],kids=[];
 pages.forEach(lines=>{let t='BT /F1 22 Tf 56 780 Td ('+pe(title)+') Tj /F1 15 Tf 0 -44 Td ';
  lines.forEach(l=>{t+='('+pe(l)+') Tj 0 -26 Td '});t+='ET';
  const c=objs.length+1;objs.push('<< /Length '+t.length+' >>\nstream\n'+t+'\nendstream');
  objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents '+c+' 0 R /Resources << /Font << /F1 3 0 R >> >> >>');kids.push((c+1)+' 0 R')});
 objs[1]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+pages.length+' >>';
 let out='%PDF-1.4\n';const off=[];
 objs.forEach((o,i)=>{off.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});
 const xr=out.length;out+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n'+off.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF';
 return'data:application/pdf;base64,'+btoa(out)}
function seedRef(D){
 const art=(t,a,b)=>'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="640" height="480" fill="url(#g)"/><circle cx="470" cy="140" r="60" fill="#fff" fill-opacity=".55"/><rect x="90" y="250" width="300" height="120" rx="22" fill="#fff" fill-opacity=".5"/><text x="320" y="436" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700" fill="#4a3b00">${t}</text></svg>`);
 const d0=lastWork(TODAY),d1=lastWork(addD(d0,-3)),d2=lastWork(addD(d0,-9)),by='',bn='Trung tâm';
 if(!Array.isArray(D.ref))D.ref=[
  {id:'rf1',kind:'doc',t:'Hướng dẫn chơi xếp khối tại nhà (mẫu)',ct:'application/pdf',sz:2400,d:d1,by,bn,at:d1+'T08:00:00.000Z',sh:1,cat:'Hướng dẫn tại nhà',n:'Chơi 10 phút mỗi ngày, ngồi đối diện bé, chờ bé nhìn rồi mới đưa khối tiếp theo. Đây là tài liệu mẫu cho bản dùng thử.',
   u:miniPdf('Huong dan choi xep khoi tai nha',[['1. Ngoi doi dien be, de khoi o giua.','2. Cho be nhin vao ban, roi moi dua khoi.','3. Khen ngay khi be xep duoc 1 khoi.'],['4. Tang dan len 2, 3 khoi.','5. Choi 10 phut moi ngay, dung lai khi be con thich.','6. Ghi lai nhung dieu be lam duoc de trao doi voi co.']]),demo:1},
  {id:'rf2',kind:'img',t:'Gợi ý trò chơi trong tuần',ct:'image/svg+xml',sz:0,d:d2,by,bn,at:d2+'T08:00:00.000Z',sh:1,cat:'Trò chơi, bài tập',n:'Mỗi ngày một trò chơi ngắn, cùng bé tại nhà.',u:art('Trò chơi mỗi ngày','#ffe08a','#ffb36b'),demo:1},
  {id:'rf3',kind:'doc',t:'Bản nháp chưa đăng (mẫu)',ct:'application/pdf',sz:1800,d:d0,by,bn,at:d0+'T08:00:00.000Z',sh:0,cat:'Khác',n:'Mục đang ẩn: phụ huynh chưa thấy.',u:miniPdf('Ban nhap chua dang',[['Noi dung dang soan.']]),demo:1}];
 if(!Array.isArray(D.tri))D.tri=[
  {id:'tr1',cat:'tn',t:'Bé M. đã sẵn sàng vào lớp 1',n:'Hơn hai năm trước, con chưa nhìn vào mắt cô giáo. Hôm nay con tự đọc tên mình và chào cô. Cảm ơn các cô đã kiên nhẫn đi cùng gia đình.',who:'Phụ huynh bé M.',d:d1,ph:[{ct:'image/svg+xml',sz:0,u:art('Bé M. tốt nghiệp','#bfe3ff','#8ec5a6')}],cs:1,cn:'Tin nhắn Zalo (mẫu)',k:'',sh:1,by,bn,at:d1+'T09:00:00.000Z',demo:1},
  {id:'tr2',cat:'tb',t:'Sau 6 tháng, bé A. đã biết chờ đến lượt',n:'Con biết chơi luân phiên và gọi tên bạn trong lớp.',who:'Phụ huynh bé A.',d:d2,ph:[{ct:'image/svg+xml',sz:0,u:art('Bé A. tiến bộ','#ffd1dc','#d9b8ff')},{ct:'image/svg+xml',sz:0,u:art('Chơi cùng bạn','#d4f1c5','#9fd4e6')}],cs:1,cn:'Đồng ý trực tiếp, có chữ ký (mẫu)',k:'',sh:1,by,bn,at:d2+'T09:00:00.000Z',demo:1},
  {id:'tr3',cat:'cm',t:'',n:'Cảm ơn Trung tâm đã cho con một nơi để lớn lên từng ngày. Gia đình chúng tôi luôn biết ơn.',who:'Phụ huynh bé K.',d:d0,ph:[],cs:1,cn:'Tin nhắn Zalo (mẫu)',k:'',sh:1,by,bn,at:d0+'T09:00:00.000Z',demo:1},
  {id:'tr4',cat:'cm',t:'Bản nháp chưa đăng',n:'Mục đang ẩn: phụ huynh chưa thấy.',who:'Phụ huynh bé H.',d:d0,ph:[],cs:1,cn:'(mẫu)',k:'',sh:0,by,bn,at:d0+'T10:00:00.000Z',demo:1}]}
