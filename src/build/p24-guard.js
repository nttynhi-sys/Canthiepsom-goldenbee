/* ===== Cổng phụ huynh: hạn chế chụp màn hình, in, sao chép và truy vết khi hình bị gửi ra ngoài =====
   GIỚI HẠN: trình duyệt web KHÔNG thể chặn hẳn chụp màn hình của hệ điều hành hay chụp bằng điện thoại khác.
   Các biện pháp dưới đây làm khó và răn đe, và nhất là gắn tên + liên hệ + giờ xem lên mọi khung hình để truy được nguồn
   nếu hình bị chia sẻ. Chặn thật sự cần ứng dụng riêng (Android FLAG_SECURE, iOS phát hiện chụp/quay màn hình).
   Chỉ áp dụng cho tài khoản phụ huynh; nhân viên không bị ảnh hưởng. */
const guardOn=()=>!!(U&&U.role==='ph'&&DB&&!$q('.plg'));
const gEsc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function gStamp(){
 const pad=n=>String(n).padStart(2,'0'),d=new Date(),when=pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes());
 const k=String(U.pkey||'').replace(/^tel:/,''),who=k.includes('@')?k:(k?'SĐT '+k.replace(/^84/,'0'):'');
 return{a:U.name||'Phụ huynh',b:who,c:when}}
function gTile(){
 const s=gStamp(),t=(y,x)=>`<text x="${x}" y="${y}" transform="rotate(-24 ${x} ${y})">`,
  svg=`<svg xmlns="http://www.w3.org/2000/svg" width="340" height="220"><g fill="#808080" fill-opacity=".2" font-family="Arial,sans-serif" font-size="15" font-weight="700">${t(120,20)}${gEsc(s.a)}</text>${t(142,20)}${gEsc(s.b)}</text>${t(164,20)}${gEsc(s.c)}</text></g></svg>`;
 return'url("data:image/svg+xml;utf8,'+encodeURIComponent(svg)+'")'}
let GM=null,GMO=null,GT=0;
function guardMark(){
 if(!GM||!document.body.contains(GM)){
  GM=document.createElement('div');GM.id='gmark';GM.setAttribute('aria-hidden','true');document.body.appendChild(GM)}
 const t=gTile();if(GM.dataset.t!==t){GM.dataset.t=t;GM.style.backgroundImage=t}
 /* gỡ lớp phủ bằng cách xóa phần tử thì dựng lại ngay (răn đe; người rành kỹ thuật vẫn gỡ được) */
 if(!GMO)GMO=new MutationObserver(()=>{if(guardOn())guardMark()});
 GMO.disconnect();GMO.observe(document.body,{childList:true});GMO.observe(GM,{attributes:true});
 if(GM.style.display)GM.style.display='';if(GM.hidden)GM.hidden=false}
function guardSync(){
 const on=guardOn();document.body.classList.toggle('gph',on);
 if(on)guardMark();else if(GM){GM.remove();GM=null}
 if(!on)document.body.classList.remove('gaway','gcover')}
/* vẽ lại thì đồng bộ lớp phủ */
const _renderG=render;render=function(){_renderG.apply(this,arguments);guardSync()};

/* che nội dung một lúc (PrintScreen, in, phím chụp) */
function guardCover(ms){if(!guardOn())return;document.body.classList.add('gcover');clearTimeout(GT);GT=setTimeout(()=>document.body.classList.remove('gcover'),ms||1500)}
const gEditable=t=>!!(t&&t.closest&&t.closest('input,textarea,select,[contenteditable="true"]'));
const gBlock=e=>{if(guardOn()&&!gEditable(e.target)){e.preventDefault();return true}return false};
['contextmenu','copy','cut','dragstart','selectstart'].forEach(ev=>document.addEventListener(ev,gBlock,true));
document.addEventListener('keydown',e=>{
 if(!guardOn())return;
 const k=String(e.key||'').toLowerCase(),mod=e.ctrlKey||e.metaKey;
 if(mod&&['p','s'].includes(k)){e.preventDefault();guardCover(1800);return}                   /* in, lưu trang */
 if(mod&&['c','x','a','u'].includes(k)&&!gEditable(e.target)){e.preventDefault();return}       /* sao chép, chọn hết, xem nguồn */
 if(e.metaKey&&e.shiftKey&&['3','4','5','#','$','%'].includes(e.key)){guardCover(2500)}        /* chụp màn hình trên Mac */
 if(e.key==='PrintScreen'||e.key==='Snapshot'){e.preventDefault();guardCover(2500)}},true);
document.addEventListener('keyup',e=>{
 if(!guardOn())return;
 if(e.key==='PrintScreen'||e.key==='Snapshot'){guardCover(2500);try{navigator.clipboard.writeText('Nội dung chỉ dành cho gia đình bé.').catch(()=>{})}catch(x){}}},true);
window.addEventListener('beforeprint',()=>guardCover(3000));
/* cửa sổ mất tiêu điểm hoặc bị ẩn (chuyển ứng dụng, công cụ chụp): làm mờ, để ảnh chụp màn hình chuyển tác vụ cũng mờ */
const gAway=on=>{if(on&&guardOn())document.body.classList.add('gaway');else document.body.classList.remove('gaway')};
window.addEventListener('blur',()=>gAway(true));
window.addEventListener('focus',()=>gAway(false));
document.addEventListener('visibilitychange',()=>gAway(document.visibilityState==='hidden'));
