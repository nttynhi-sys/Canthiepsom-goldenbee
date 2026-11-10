'use strict';
/* ===== Tiện ích chung ===== */
const $q=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>new Date(s+'T00:00:00');
const addD=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return iso(d)};
const dow=s=>pd(s).getDay();
const isW=s=>dow(s)!==0;
const vd=s=>s?s.split('-').reverse().join('/'):'';
const vdm=s=>vd(s).slice(0,5);
const NOW=new Date(),TODAY=iso(NOW);
const lastWork=s=>{while(!isW(s))s=addD(s,-1);return s};
const WD=lastWork(TODAY),CM=TODAY.slice(0,7);
const sm=(m,n)=>iso(new Date(+m.slice(0,4),+m.slice(5,7)-1+n,1)).slice(0,7);
const mDates=m=>Array.from({length:new Date(+m.slice(0,4),+m.slice(5,7),0).getDate()},(_,i)=>m+'-'+pad(i+1));
const mLabel=m=>'Tháng '+(+m.slice(5,7))+'/'+m.slice(0,4);
const mLow=m=>'tháng '+(+m.slice(5,7))+'/'+m.slice(0,4);
const DAYN=['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
const DAYS=['CN','T2','T3','T4','T5','T6','T7'];
const fmt=n=>Math.round(+n||0).toLocaleString('vi-VN')+'\u00a0₫';
const fnum=n=>Math.round(+n||0).toLocaleString('vi-VN');
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const mo=dob=>{const d=pd(dob);return (NOW.getFullYear()-d.getFullYear())*12+NOW.getMonth()-d.getMonth()-(NOW.getDate()<d.getDate()?1:0)};
const age=dob=>{const m=mo(dob);return m>=24?Math.floor(m/12)+' tuổi'+(m%12?' '+(m%12)+' tháng':''):m+' tháng'};
const ascii=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]/g,'');
const given=n=>n.split(' ').slice(-2).join(' ');

/* ===== Trạng thái ===== */
let DB=null,U=null;
const S={v:'dash',menu:false,modal:null,pg:{}};
const ACT={},FORM={},CHG={},INP={},VIEWS={},MODALS={};
const KEY='gb_v2';
/* Chế độ máy chủ (mặc định trên web). Thêm ?demo vào địa chỉ để xem bản trình diễn chạy trong trình duyệt, không lưu lên máy chủ. */
const CLOUDMODE=!(/[?&]demo\b/.test(location.search)||(location.protocol==='file:'&&!/[?&]cloud\b/.test(location.search)));
const save=()=>{if(CLOUDMODE){cloudSave();return}try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){}};
function go(v,p){S.v=v;S.modal=null;S.menu=false;S.top=1;if(p)Object.assign(S,p)}
ACT.nav=v=>go(v);
ACT.menu=()=>{S.menu=!S.menu};
ACT.pg=v=>{const [k,p]=v.split(':');S.pg[k]=+p};

/* ===== Thành phần giao diện ===== */
const head=(t,s,x)=>`<div class="top"><div><h1>${t}</h1>${s?`<p class="mu">${s}</p>`:''}</div><div class="acts">${x||''}</div></div>`;
const tabsH=(items,cur,act)=>`<div class="tabs" role="tablist">${items.map(([k,t])=>`<button class="tab ${cur===k?'on':''}" role="tab" data-a="${act}" data-v="${k}">${t}</button>`).join('')}</div>`;
const tg=(t,c)=>`<span class="tag ${c||''}">${esc(t)}</span>`;
const kpi=(l,v,s,c)=>`<div class="card kpi"><div class="mu sm">${l}</div><div class="big ${c||''}">${v}</div><div class="sm mu">${s||''}</div></div>`;
const tbl=(th,rows,empty)=>`<div class="tw"><table><thead><tr>${th.map(h=>`<th class="${h[0]==='>'?'r':''}">${esc(h.replace(/^>/,''))}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${th.length}" class="empty">${empty||'Chưa có dữ liệu.'}</td></tr>`}</tbody></table></div>`;
const opts=(list,cur)=>list.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(cur)?'selected':''}>${esc(l)}</option>`).join('');
const bar=(p,c)=>`<div class="bar" role="img" aria-label="${Math.round(p)}%"><i style="width:${Math.max(0,Math.min(100,p))}%${c?';background:'+c:''}"></i></div>`;
function pg(key,list,per){const n=Math.max(1,Math.ceil(list.length/per)),p=Math.min(S.pg[key]||1,n);S.pg[key]=p;
 const html=n>1?`<div class="acts" style="justify-content:center;margin-top:10px"><button class="btn s" data-a="pg" data-v="${key}:${p-1}" ${p<=1?'disabled':''}>Trước</button><span class="sm mu">Trang ${p}/${n} · ${list.length} mục</span><button class="btn s" data-a="pg" data-v="${key}:${p+1}" ${p>=n?'disabled':''}>Sau</button></div>`:'';
 return{rows:list.slice((p-1)*per,p*per),html}}
const mdl=(t,b,w)=>`<div class="mdl" data-a="mbg"><div class="mdc ${w?'w':''}" role="dialog" aria-modal="true" aria-label="${esc(t)}"><div class="top" style="margin-bottom:10px;align-items:center"><h2 style="margin:0">${esc(t)}</h2><button class="btn s" data-a="mx">Đóng</button></div>${b}</div></div>`;
ACT.mx=()=>{S.modal=null};
ACT.mbg=(v,b,e)=>{if(e.target!==b)return false;S.modal=null};
let TT=0;
function toast(m){let t=$q('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}t.textContent=m;clearTimeout(TT);TT=setTimeout(()=>t.remove(),3000)}
let ASKF=null;
function ask(msg,fn,yes){ASKF=fn;S.modal={t:'ask',msg,yes:yes||'Xác nhận',back:S.modal&&S.modal.t!=='ask'?S.modal:null}}
MODALS.ask=()=>mdl('Xác nhận',`<p>${esc(S.modal.msg)}</p><div class="acts" style="margin-top:14px;justify-content:flex-end"><button class="btn" data-a="askno">Hủy</button><button class="btn p" data-a="askyes">${esc(S.modal.yes)}</button></div>`);
ACT.askyes=()=>{const f=ASKF;ASKF=null;S.modal=null;if(f)f()};
ACT.askno=()=>{ASKF=null;S.modal=S.modal.back||null};

/* ===== Quyền lưu trữ và tải tệp (runtime capabilities) ===== */
const CAP={as:null,db:null,us:null,dl:null,uid:null};
let BUSY=0;
function softRender(){const a=document.activeElement;if(BUSY||(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)&&a.closest&&a.closest('form')))return;render()}
async function initCaps(){
 const use=n=>{try{return window.claude&&claude.use?claude.use(n):Promise.resolve(null)}catch(e){return Promise.resolve(null)}};
 try{[CAP.as,CAP.db,CAP.us,CAP.dl]=await Promise.all([use('assets'),use('db'),use('user'),use('downloads')])}catch(e){}
 try{CAP.uid=CAP.us&&CAP.us.id?await CAP.us.id():null}catch(e){}
 render()}
const libs={};
function loadLib(u){return libs[u]||(libs[u]=new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=()=>{delete libs[u];no(new Error('lib'))};document.head.appendChild(s)}))}
async function saveFile(name,data){
 if(!CAP.dl){try{const bl=data instanceof Blob?data:new Blob([data]),a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);toast('Đã tải '+name);return true}catch(e){toast('Chưa tải được tệp');return false}}
 try{await CAP.dl.save({filename:name,data});toast('Đã lưu '+name);return true}catch(e){toast('Chưa lưu được tệp');return false}}
async function exportXLSX(name,sheets){
 toast('Đang tạo tệp Excel...');
 try{await loadLib('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  const wb=XLSX.utils.book_new();
  sheets.forEach(s=>{const ws=XLSX.utils.aoa_to_sheet(s.rows);ws['!cols']=(s.rows[0]||[]).map((_,i)=>({wch:Math.min(40,Math.max(8,...s.rows.slice(0,60).map(r=>String(r[i]==null?'':r[i]).length+2)))}));XLSX.utils.book_append_sheet(wb,ws,s.n.slice(0,31))});
  await saveFile(name,XLSX.write(wb,{type:'array',bookType:'xlsx'}))}catch(e){toast('Không tạo được tệp Excel, hãy kiểm tra kết nối mạng')}}
/* điểm ngắt trang PDF: không cắt ngang một khối (.nb, hàng bảng, mục danh sách) nhỏ hơn 90% chiều cao trang */
function pdfCuts(box){const bw=box.offsetWidth,pageH=Math.floor(bw*841.89/595.28),bt=box.getBoundingClientRect(),total=box.scrollHeight,
 blk=[...box.querySelectorAll('.nb,tr,li,.rw,.gc')].map(e=>{const r=e.getBoundingClientRect();return[r.top-bt.top,r.bottom-bt.top]}).filter(x=>x[1]-x[0]>2&&x[1]-x[0]<pageH*.9),cuts=[0];
 let start=0;
 while(total-start>pageH+34){let end=start+pageH,again=true,g=0;
  while(again&&g++<40){again=false;for(const x of blk)if(x[0]<end-1&&x[1]>end+1&&x[0]>start+pageH*.3){end=x[0];again=true}}
  end=Math.floor(end);cuts.push(end);start=end}
 cuts.push(total);return{cuts,bw}}
async function exportPDF(name,html){
 toast('Đang tạo PDF...');
 try{await loadLib('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');await loadLib('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  const box=document.createElement('div');box.className='pdfbox';box.style.cssText='position:fixed;left:-12000px;top:0;width:794px;padding:34px 38px;background:#fff;color:#1d1a16;font:13.5px/1.55 "Be Vietnam Pro",system-ui,sans-serif';
  box.innerHTML=`<div style="display:flex;gap:12px;align-items:center;border-bottom:3px solid #f4d133;padding-bottom:10px;margin-bottom:14px"><img src="${LOGO}" style="width:58px;height:58px"><div><div style="font:700 15px 'Baloo 2','Be Vietnam Pro',sans-serif;color:#c8372b;text-transform:uppercase">${esc(DB.cfg.name)}</div><div style="font-size:12px;color:#6b5f50">${esc(DB.cfg.addr||'')}${DB.cfg.tel?' · ĐT '+esc(DB.cfg.tel):''} · Hotline: 0979796361</div><div style="font-size:12px;color:#6b5f50">Hồ sơ in từ hệ thống quản lý · ngày ${vd(TODAY)}</div></div></div>`+html;
  document.body.appendChild(box);
  let cv,pc;try{pc=pdfCuts(box);cv=await html2canvas(box,{scale:2,backgroundColor:'#ffffff',logging:false})}finally{box.remove()}
  const {jsPDF}=window.jspdf,pdf=new jsPDF({unit:'pt',format:'a4'}),W=pdf.internal.pageSize.getWidth(),sc=cv.width/pc.bw,n=pc.cuts.length-1;
  for(let i=0;i<n;i++){const y0=Math.round(pc.cuts[i]*sc),y1=i===n-1?cv.height:Math.round(pc.cuts[i+1]*sc),h=y1-y0;if(h<=0)continue;
   const c=document.createElement('canvas');c.width=cv.width;c.height=h;c.getContext('2d').drawImage(cv,0,y0,cv.width,h,0,0,cv.width,h);if(i)pdf.addPage();pdf.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,W,h*W/cv.width)}
  await saveFile(name,pdf.output('blob'))}catch(e){toast('Không tạo được PDF, hãy kiểm tra kết nối mạng')}}

/* ===== Sự kiện chung ===== */
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const f=ACT[b.dataset.a];if(!f)return;if(f(b.dataset.v,b,e)!==false)render()});
document.addEventListener('change',e=>{const t=e.target,c=t.dataset&&t.dataset.c;if(c&&CHG[c]&&CHG[c](t.value,t,e)!==false)render()});
document.addEventListener('input',e=>{const t=e.target,i=t.dataset&&t.dataset.i;if(i&&INP[i]){INP[i](t.value,t);const id=t.id;render();const n=id&&$q('#'+id);if(n){n.focus();try{n.setSelectionRange(n.value.length,n.value.length)}catch(x){}}}});
document.addEventListener('submit',e=>{e.preventDefault();const f=FORM[e.target.id];if(f&&f(e.target,e)!==false)render()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.modal){S.modal=null;render()}});
