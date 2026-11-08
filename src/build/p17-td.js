/* ===== 12. Quản lý tài liệu và video ===== */
const MAXUP=20*1024*1024,DCAT=['Giáo án','Biểu mẫu','Hồ sơ trẻ','Hướng dẫn phụ huynh','Khác'];
const mb=n=>(n/1048576).toFixed(1)+' MB';
const canUpload=()=>!!(CAP.as&&CAP.db)&&(isLead()||isGV());
const me=()=>CAP.uid||(U&&U.id);
const atD=at=>at?iso(new Date(at)):'';
const vidsOf=k=>SH.videos.filter(v=>(!k||v.k===k)&&canKid(v.k)&&(!isPH()||v.sh));
const docsOf=k=>SH.docs.filter(d=>{if(k&&d.k!==k)return false;if(isLead())return true;if(isPH())return(d.aud==='ph'||d.aud==='all')&&(!d.k||canKid(d.k));return d.by===me()||d.aud!=='ph'||canKid(d.k)});
const upNote=()=>`<p class="note sm" style="margin-bottom:12px">${!CAP.db||!CAP.as?'Tải lên chưa khả dụng ở chế độ xem này. Cần mở trang bằng tài khoản có quyền chỉnh sửa hoặc đóng góp để tải video và tài liệu.':!SH.ready?'Đang tải danh sách...':'Video và tài liệu được lưu trong kho riêng của trang này. Mỗi tệp tối đa 20 MB; video nên quay ngắn, định dạng MP4 hoặc WebM.'}</p>`;
VIEWS.td=()=>{const t=S.td=Object.assign({tab:'vid',k:'',q:''},S.td);
 return head(isGV()?'Tài liệu và video':'Quản lý tài liệu','Video buổi can thiệp, giáo án, biểu mẫu và hồ sơ',canUpload()?(t.tab==='vid'?'<button class="btn p" data-a="upvid" data-v="">Tải video lên</button>':'<button class="btn p" data-a="updoc" data-v="">Tải tài liệu lên</button>'):'')
 +tabsH([['vid','Video buổi can thiệp'],['doc','Tài liệu']],t.tab,'tdtab')+upNote()
 +`<div class="card"><div class="f2" style="margin-bottom:12px"><div><label for="tdk">Lọc theo bé</label><select id="tdk" data-c="tdk"><option value="">Tất cả</option>${opts(myKids().filter(k=>k.st==='dang').map(k=>[k.id,k.n]),t.k)}</select></div><div><label for="tdq">Tìm theo tiêu đề</label><input id="tdq" data-i="tdq" value="${esc(t.q)}"></div></div>${t.tab==='vid'?vidGrid(t.k,t.q):docTable(t.k,t.q)}</div>`};
ACT.tdtab=v=>{S.td.tab=v};CHG.tdk=v=>{S.td.k=v};INP.tdq=v=>{S.td.q=v};
const vidCard=v=>`<div class="card" style="margin:0"><video controls preload="metadata" src="${esc(v.u)}" style="width:100%;max-height:300px;background:#000;border-radius:10px"></video><div style="margin-top:8px"><b>${esc(v.t)}</b><div class="sm mu">${esc(kn(v.k))} · ${vd(v.d)} · ${esc(v.bn||'')}</div>${v.n?`<p class="sm" style="margin-top:4px">${esc(v.n)}</p>`:''}<div class="acts" style="margin-top:6px">${isPH()?'':tg(v.sh?'Đã chia sẻ phụ huynh':'Chỉ nội bộ',v.sh?'ok':'gy')}${isPH()||!(isLead()||v.by===me())?'':`<button class="btn s no" data-a="tddel" data-v="videos|${v.id}">Xóa</button>`}</div></div></div>`;
function vidGrid(k,q){const vs=vidsOf(k).filter(v=>!q||v.t.toLowerCase().includes(q.toLowerCase()));
 return vs.length?`<div class="two">${vs.map(vidCard).join('')}</div>`:`<p class="empty">${SH.ready?'Chưa có video nào.':'Đang tải...'}</p>`}
function docTable(k,q){const ds=docsOf(k).filter(d=>!q||d.t.toLowerCase().includes(q.toLowerCase()));
 return tbl(['Tiêu đề','Loại','Bé','Đối tượng','Người tải','Ngày',''],ds.map(d=>`<tr><td><a href="${esc(d.u)}" target="_blank" rel="noopener"><b>${esc(d.t)}</b></a><div class="sm mu">${mb(d.sz||0)}</div></td><td>${esc(d.cat)}</td><td>${d.k?esc(kn(d.k)):'–'}</td><td>${d.aud==='nb'?'Nội bộ':d.aud==='ph'?'Phụ huynh':'Mọi người'}</td><td>${esc(d.bn||'')}</td><td class="nw">${vd(atD(d.at))}</td><td class="nw">${isPH()||!(isLead()||d.by===me())?'':`<button class="btn s no" data-a="tddel" data-v="docs|${d.id}">Xóa</button>`}</td></tr>`).join(''),SH.ready?'Chưa có tài liệu nào.':'Đang tải...')}
const vidList=k=>`<div class="acts" style="margin-bottom:10px">${canUpload()&&!isPH()?`<button class="btn p" data-a="upvid" data-v="${k}">Tải video lên</button>`:''}</div>`+(vidsOf(k).length?`<div class="two">${vidsOf(k).map(vidCard).join('')}</div>`:'<p class="empty">Chưa có video nào của bé.</p>');
const docList=k=>`<div class="acts" style="margin-bottom:10px">${canUpload()&&!isPH()?`<button class="btn p" data-a="updoc" data-v="${k}">Tải tài liệu lên</button>`:''}</div>`+docTable(k,'');
/* --- tải lên --- */
ACT.upvid=v=>{if(!canUpload())return false;S.up={busy:false,err:''};S.modal={t:'upv',k:v||''}};
ACT.updoc=v=>{if(!canUpload())return false;S.up={busy:false,err:''};S.modal={t:'upd',k:v||''}};
const upBtn=l=>`<button class="btn p" type="submit" ${S.up&&S.up.busy?'disabled':''}>${S.up&&S.up.busy?'Đang tải lên...':l}</button>`;
MODALS.upv=()=>{const ks=myKids().filter(k=>k.st==='dang');
 return mdl('Tải video buổi can thiệp',`<form id="upvf" class="f"><div class="f2"><div><label for="uv-k">Bé</label><select id="uv-k" name="k" required>${opts(ks.map(k=>[k.id,k.n]),S.modal.k)}</select></div><div><label for="uv-d">Ngày quay</label><input id="uv-d" name="d" type="date" value="${WD}" max="${TODAY}" required></div></div><div><label for="uv-t">Tiêu đề</label><input id="uv-t" name="t" required placeholder="Ví dụ: Luyện gọi tên đồ vật"></div><div><label for="uv-n">Ghi chú cho phụ huynh</label><input id="uv-n" name="n"></div><div><label for="uv-f">Tệp video (MP4 hoặc WebM, tối đa 20 MB)</label><input id="uv-f" name="f" type="file" accept="video/mp4,video/webm" required></div>
 <label class="chk"><input type="checkbox" name="sh" checked> Chia sẻ cho phụ huynh của bé</label><div class="err" role="alert">${esc(S.up.err)}</div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button>${upBtn('Tải lên')}</div></form>`)};
MODALS.upd=()=>{const ks=myKids().filter(k=>k.st==='dang');
 return mdl('Tải tài liệu lên',`<form id="updf" class="f"><div><label for="ud-t">Tiêu đề</label><input id="ud-t" name="t" required></div><div class="f2"><div><label for="ud-c">Loại</label><select id="ud-c" name="cat">${opts(DCAT.map(x=>[x,x]),'')}</select></div><div><label for="ud-k">Gắn với bé (không bắt buộc)</label><select id="ud-k" name="k"><option value="">Không gắn</option>${opts(ks.map(k=>[k.id,k.n]),S.modal.k)}</select></div><div><label for="ud-a">Ai xem được</label><select id="ud-a" name="aud">${opts([['nb','Chỉ nhân viên'],['ph','Phụ huynh của bé'],['all','Mọi người']],'nb')}</select></div></div><div><label for="ud-f">Tệp (PDF, ảnh, CSV, văn bản; tối đa 20 MB)</label><input id="ud-f" name="f" type="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.csv,.txt,.md,.json,application/pdf,image/*,text/*" required></div><p class="sm mu">Tệp Word và Excel chưa tải lên được; hãy lưu thành PDF hoặc CSV trước.</p><div class="err" role="alert">${esc(S.up.err)}</div><div class="acts" style="justify-content:flex-end"><button class="btn" type="button" data-a="mx">Hủy</button>${upBtn('Tải lên')}</div></form>`)};
function doUpload(f,col,pick){const e=f.elements,file=e.f.files[0];
 if(!file){S.up.err='Hãy chọn một tệp';return}
 if(file.size>MAXUP){S.up.err='Tệp lớn hơn 20 MB. Hãy cắt ngắn hoặc nén video rồi tải lại.';return}
 S.up={busy:true,err:''};BUSY++;
 (async()=>{try{const a=await CAP.as.upload(file);
   await CAP.db.collection(col).doc(uid()).set(Object.assign(pick(e),{by:me(),bn:U.name,a:a.id,u:a.url,ct:a.contentType||file.type,sz:a.sizeBytes||file.size,at:Date.now()}));
   S.modal=null;toast('Đã tải lên')}
  catch(x){S.up.err='Chưa tải lên được'+(x&&x.message?': '+x.message:'')+'. Có thể tài khoản này chưa có quyền tải.'}
  finally{S.up.busy=false;BUSY--;render()}})()}
FORM.upvf=f=>{doUpload(f,'videos',e=>({k:e.k.value,t:e.t.value.trim(),n:e.n.value.trim(),d:e.d.value,sh:e.sh.checked?1:0}))};
FORM.updf=f=>{doUpload(f,'docs',e=>({k:e.k.value,t:e.t.value.trim(),cat:e.cat.value,aud:e.aud.value}))};
ACT.tddel=v=>{const [col,id]=v.split('|'),item=(col==='videos'?SH.videos:SH.docs).find(x=>x.id===id);if(!item||!CAP.db)return false;
 ask('Xóa “'+item.t+'”? Tệp sẽ không xem được nữa.',async()=>{try{await CAP.db.collection(col).doc(id).delete();try{if(CAP.as&&item.a)await CAP.as.delete(item.a)}catch(x){}toast('Đã xóa')}catch(x){toast('Chưa xóa được, bạn có thể không có quyền')}render()},'Xóa')};
