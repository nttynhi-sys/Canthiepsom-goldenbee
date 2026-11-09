/* ===== Hằng số nghiệp vụ ===== */
const ROLE={ql:'Quản lý',tt:'Trưởng Trung tâm',vp:'Văn phòng',gv:'Giáo viên',ph:'Phụ huynh',hc:'Hành chính'};
/* Giờ học 1-1: từ 07:15 đến 20:00, mỗi ca 50 phút, xếp liên tiếp (15 ca/ngày, ca cuối 18:55–19:45).
   Bán trú: hai lớp Ong non và Ong mật, 07:30–17:00, thứ Hai đến thứ Sáu. */
const SLOT_MIN=50,DAY_OPEN='07:15',DAY_CLOSE='20:00';
const SLOTS=(()=>{const a=[],o=DAY_OPEN.split(':').map(Number),c=DAY_CLOSE.split(':').map(Number);let t=o[0]*60+o[1];while(t+SLOT_MIN<=c[0]*60+c[1]){a.push(pad(Math.floor(t/60))+':'+pad(t%60));t+=SLOT_MIN}return a})();
const BT={s:'07:30',e:'17:00'},BTLB=BT.s+'–'+BT.e,BTN=['Ong non','Ong mật'];
/* Ngày học bán trú theo từng bé: mặc định thứ Hai đến thứ Sáu; bé học cả thứ Bảy có k.btd gồm 6. Mỗi ngày bán trú gồm 1 ca 1-1 (50 phút) nằm trong phí bán trú. */
const DAY_BT=[1,2,3,4,5],DAY_ALL=[1,2,3,4,5,6];
const btOf=k=>k&&k.bt&&k.gr?(Array.isArray(k.btd)&&k.btd.length?k.btd.filter(w=>w>=1&&w<=6):DAY_BT):[];
const btHas=(k,w)=>btOf(k).includes(w);
const dayTx=a=>{const s=a.slice().sort((x,y)=>x-y);if(s.join()==='1,2,3,4,5')return'T2–T6';if(s.join()==='1,2,3,4,5,6')return'T2–T7';return s.map(w=>DAYS[w]).join(', ')};
const LOAD_MAX=30; /* số buổi 1-1 mỗi tuần được coi là đủ tải của một giáo viên */
const slotEnd=s=>{const [h,m]=s.split(':').map(Number),t=h*60+m+SLOT_MIN;return pad(Math.floor(t/60))+':'+pad(t%60)};
const slotLb=s=>s+'–'+slotEnd(s);
const ROOMS=['Phòng 1','Phòng 2','Phòng 3','Phòng 4','Phòng 5','Phòng 6','Phòng 7','Phòng 8'];
const AC={cm:'Có mặt',p:'Nghỉ P',kp:'Nghỉ KP',tt:'TT/GV nghỉ',bv:'Nhập viện'};
const NEEDS=['Chậm nói','Khó khăn giao tiếp xã hội','Rối loạn phát âm','Chậm phát triển ngôn ngữ','Cần hỗ trợ đa lĩnh vực'];
const KST={dang:'Đang học',nghi:'Đã nghỉ',bl:'Bảo lưu'};
const LGK={hp:['Học phí','gy',1],thu:['Đã thu','ok',-1],gg:['Giảm giá','in',-1],hoan:['Hoàn phí nghỉ','in',-1],cfo:['Chuyển phí đi','wa',1],cfi:['Nhận chuyển phí','in',-1]};
const POLICY={
 m11:{t:'Điều 9. Học bù và hoàn phí (can thiệp 1-1)',p:[
  '(1) Có phép (P): Phụ huynh báo trong nhóm chung trước 7g sáng hôm đó với ca sáng. Và trước 12g hôm đó đối với ca chiều, tối: Học phí sẽ mất 30% học phí/buổi và hoàn phí 70% học phí và trừ vào học phí tháng sau. Trong trường hợp bé ngưng can thiệp, sẽ không hoàn lại chi phí nào.',
  '(2) Không phép (KP): Báo sau khung giờ trên và phụ huynh mất 100% phí can thiệp buổi. Trong trường hợp bé ngưng can thiệp, sẽ không hoàn lại chi phí nào.',
  '(3) Trong trường hợp Trung tâm cho nghỉ, Giáo viên nghỉ nếu gia đình không chấp nhận chính sách học bù, thì Trung tâm sẽ hoàn phí 100% buổi học.',
  'Học bù: Trong trường hợp Phụ huynh bận, Trung tâm có thể hỗ trợ cho trẻ đi học bù. Và ngược lại, nếu Giáo viên bận, Trung tâm sẽ sắp xếp đi học bù và phụ huynh có trách nhiệm đưa con đi học bù, chỉ khi đạt được sự thỏa thuận của 2 bên như vậy, Trung tâm mới giải quyết việc học bù. Nếu không, Trung tâm sẽ tính phí theo quy định trên (1), (2), (3).',
  'Học phí sẽ đóng từ đầu tháng và nguyên tháng, chứ KHÔNG phải học buổi nào đóng buổi đó. Nếu Phụ huynh chậm trễ đóng học phí hoặc ngưng đột ngột can thiệp thì tất cả phí cọc và can thiệp đều không được hoàn lại. Các trẻ đều học liên tục vì Trung tâm cố định Giáo viên và khung giờ. Nếu Gia đình ngưng can thiệp, Trung tâm sẽ sắp xếp Giáo viên dạy trẻ khác.']},
 bt:{t:'Quy định học bù và hoàn phí (bán trú)',p:[
  '(1) Khi nghỉ Phụ huynh vui lòng báo trong nhóm chung trước 1 ngày hoặc sáng trước 7g của ngày hôm đó. Khi nghỉ Trung tâm sẽ hoàn phí can thiệp cá nhân và không hoàn lại các chi phí khác.',
  '(2) Trong trường hợp bé ốm nặng, nhập viện có giấy nhập viện và xuất viện, trên tinh thần hỗ trợ các gia đình, Trung tâm hoàn phí 50% phí trong tổng số ngày nhập viện.',
  '(3) Học bù: Trong trường hợp một số tình huống như thiên tai, dịch bệnh, bão lũ… xảy ra, Trung tâm sắp xếp học bù, Phụ huynh có trách nhiệm đưa trẻ đi học bù theo lịch điều chỉnh của Trung tâm.',
  '(4) Học phí sẽ đóng từ đầu tháng và nguyên tháng, chứ KHÔNG phải học buổi nào đóng buổi đó. Nếu Phụ huynh chậm trễ đóng học phí hoặc ngưng đột ngột can thiệp thì tất cả phí cọc và can thiệp đều không được hoàn lại. Các trẻ đều học liên tục vì Trung tâm cố định Giáo viên và học theo phác đồ can thiệp. Nếu Gia đình ngưng can thiệp, Trung tâm sẽ sắp xếp Giáo viên dạy trẻ khác.']}};
const TPL0=[{k:'tq',t:'1. Tổng quan giai đoạn',h:'Tình trạng chung, mức độ hợp tác, sự thay đổi đáng chú ý'},{k:'mt',t:'2. Mục tiêu đã thực hiện',h:'Liệt kê mục tiêu và mức độ đạt được'},{k:'kq',t:'3. Kết quả đạt được',h:'Tiến bộ cụ thể, ví dụ quan sát được'},{k:'kk',t:'4. Khó khăn còn tồn tại',h:'Những điểm trẻ cần được hỗ trợ thêm'},{k:'gd',t:'5. Gợi ý luyện tập tại nhà',h:'Hoạt động đơn giản phụ huynh có thể làm cùng con'},{k:'kh',t:'6. Kế hoạch giai đoạn tới',h:'Mục tiêu ưu tiên của tháng tiếp theo'}];


/* ===== Thời khóa biểu bán trú mẫu (kiểu mầm non, mỗi lớp một bộ; Trung tâm sửa được) =====
   Mỗi dòng: s giờ bắt đầu, e giờ kết thúc, n tên hoạt động, k loại (don, hoc, choi, ngoai, an, ngu, tra), x mô tả chung,
   d nội dung riêng từng thứ (1 = thứ Hai … 6 = thứ Bảy). Giờ can thiệp 1-1 của từng bé được ghép lên thời khóa biểu theo lịch cá nhân. */
const TKB_K={don:['Đón trẻ','y'],hoc:['Hoạt động học','in'],choi:['Chơi, hoạt động góc','ok'],ngoai:['Ngoài trời','ok'],an:['Ăn, vệ sinh','wa'],ngu:['Ngủ trưa','gy'],tra:['Trả trẻ','y']};
function tkbDefault(groups){const out=[];
 (groups||[]).forEach((g,gi)=>{const old=gi===0;
  const hoc=old?{1:'Vận động thô: bò, trèo, ném bóng',2:'Khám phá bằng giác quan: sờ, nghe, nhìn',3:'Ngôn ngữ: nghe kể chuyện, đồng dao',4:'Tạo hình: tô, vẽ, nặn',5:'Âm nhạc: hát, vận động theo nhạc',6:'Kỹ năng tự phục vụ và chơi nhóm'}
   :{1:'Vận động: thể dục theo bài tập',2:'Làm quen toán: đếm, so sánh, phân loại',3:'Ngôn ngữ và làm quen chữ cái',4:'Tạo hình, thủ công',5:'Âm nhạc và nhịp điệu',6:'Kỹ năng xã hội, trò chơi nhóm'};
  const goc={1:'Góc xây dựng',2:'Góc phân vai: bác sĩ, nấu ăn',3:'Góc sách và âm nhạc',4:'Góc tạo hình',5:'Góc khám phá',6:'Chơi tự chọn'};
  const chieu=old?{1:'Luyện giao tiếp: yêu cầu, từ chối',2:'Trò chơi âm thanh, phát âm',3:'Luyện nghe hiểu chỉ dẫn',4:'Trò chơi vận động tinh',5:'Hoạt động trải nghiệm',6:'Ôn lại các hoạt động trong tuần'}
   :{1:'Luyện kể lại, trả lời câu hỏi',2:'Trò chơi luân phiên trong nhóm nhỏ',3:'Luyện nghe hiểu chỉ dẫn nhiều bước',4:'Trò chơi vận động tinh, cắt dán',5:'Hoạt động trải nghiệm, nấu ăn',6:'Ôn lại các hoạt động trong tuần'};
  const R=[
   ['07:30','08:15','Đón trẻ','don','Đón trẻ, trao đổi nhanh với phụ huynh, chơi tự chọn'],
   ['08:15','08:45','Thể dục sáng, trò chuyện đầu ngày','choi','Thể dục sáng theo nhạc, chào hỏi, điểm danh, trò chuyện về chủ đề trong tuần'],
   ['08:45','09:15','Ăn nhẹ buổi sáng, vệ sinh','an','Rửa tay, ăn nhẹ, uống nước'],
   ['09:15','10:00','Hoạt động học theo chủ đề','hoc','',hoc],
   ['10:00','10:45','Hoạt động ngoài trời','ngoai','Chơi ngoài trời, vận động tự do, quan sát thiên nhiên'],
   ['10:45','11:30','Chơi theo góc, giao tiếp nhóm nhỏ','choi','',goc],
   ['11:30','12:15','Vệ sinh, ăn trưa','an','Rửa tay, ăn trưa, vệ sinh răng miệng'],
   ['12:15','14:00','Ngủ trưa','ngu','Trẻ ngủ trưa; trẻ khó ngủ nghe nhạc nhẹ, cô theo dõi'],
   ['14:00','14:30','Thức dậy, vệ sinh, ăn nhẹ chiều','an','Thức dậy, thay quần áo, ăn nhẹ buổi chiều'],
   ['14:30','15:30','Hoạt động buổi chiều','hoc','',chieu],
   ['15:30','16:15','Chơi tự chọn, hoạt động góc','choi','Chơi tự chọn theo nhóm, đọc sách'],
   ['16:15','17:00','Nêu gương, vệ sinh, trả trẻ','tra','Nhận xét cuối ngày, dọn đồ, trả trẻ cho phụ huynh']];
  R.forEach((r,i)=>{const x={id:'tk'+g.id+'-'+pad(i+1),gr:g.id,s:r[0],e:r[1],n:r[2],k:r[3],x:r[4]||''};if(r[5])x.d=Object.assign({},r[5]);out.push(x)})});
 return out}

/* ===== Dữ liệu mẫu (giả lập, không phải trẻ thật) ===== */
function seed(){
 let sd=20261108;const R=()=>(sd=(sd*1664525+1013904223)%4294967296)/4294967296,P=a=>a[Math.floor(R()*a.length)],RI=(a,b)=>a+Math.floor(R()*(b-a+1)),SH=a=>a.slice().sort(()=>R()-.5);
 const D={v:5,tkb:[],cfg:{name:'TRUNG TÂM CAN THIỆP SỚM GOLDEN BEE',addr:'28 Trường Thi 1, Quận Hải Châu, TP. Đà Nẵng',tel:'0793502567',p11:300000,pbtDay:380000,pbtDay11:180000,lateAfter:'08:15',cc:26,giamTru:15500000,thue:10,rule:{pLoss:30,ttRefund:100,bvRefund:50,gvKp:50,gvP:0}},staff:[],kids:[],cg:[],plans:[],sess:[],groups:[],lich:[],att:{},ts:{},lr:[],mk:[],lg:[],set:{},rp:[],tpl:TPL0.map(x=>({...x})),nt:[],bon:{},rd:{},menu:{}};
 DB=D;
 const HO=['Nguyễn','Trần','Lê','Phạm','Hoàng','Huỳnh','Phan','Vũ','Võ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương','Lý'];
 const SN=['Minh Anh','Thu Trang','Quang Huy','Lan Phương','Hải Yến','Văn Nam','Thanh Hà','Đức Thịnh','Ngọc Lan','Hồng Nhung','Quốc Bảo','Thùy Linh','Khánh Ly','Tuấn Anh','Bích Phượng','Mai Hương','Thanh Tâm','Kim Ngân','Diệu Linh','Xuân Mai','Phương Thảo','Hoài An','Nhật Lệ','Thu Hiền','Trọng Nghĩa','Yến Nhi','Cẩm Tú','Gia Linh','Bảo Trâm','Anh Thư'];
 const POS11=['Giáo viên ngôn ngữ trị liệu','Giáo viên ngôn ngữ trị liệu','Giáo viên giáo dục đặc biệt','Chuyên viên hoạt động trị liệu'];
 for(let n=1;n<=30;n++){
  const id='nv'+pad(n),nm=HO[(n*5)%16]+' '+SN[n-1];let role='gv',pos='',mode='thang',base=0,rate=0,rateBt=0,allow=0;
  if(n===1){role='ql';pos='Quản lý trung tâm';base=28e6;allow=3e6}
  else if(n<=3){role='tt';pos=n===2?'Trưởng trung tâm':'Trưởng chuyên môn';base=20e6;allow=2e6}
  else if(n<=17||(n>=22&&n<=25)){pos=POS11[n%4];mode='buoi';rate=n%2?60e3:80e3} /* giáo viên 1-1 lương theo ca: 60.000 hoặc 80.000 ₫ mỗi ca */
  else if(n<=19){pos='Giáo viên bán trú';base=9e6;allow=5e5} /* giáo viên bán trú lương cố định */
  else if(n<=21){pos='Trợ giảng bán trú';base=7e6}
  else if(n===26){role='vp';pos='Nhân viên văn phòng';base=11e6;allow=3e5}
  else{role='hc';pos=['Lễ tân','Lễ tân','Bảo mẫu','Tạp vụ'][n-27];base=[8e6,8e6,7e6,6e6][n-27]}
  D.staff.push({id,n:nm,role,pos,ph:'09'+String(RI(10000000,99999999)),em:ascii(nm)+'@goldenbee.vn',st:'dang',sd:iso(new Date(RI(2019,2025),RI(0,11),RI(1,28))),sup:role==='ql'?'':role==='vp'?'nv02':role==='tt'||role==='hc'?'nv01':n<=11?'nv02':'nv03',pay:{mode,base,rate,rateBt,allow,bh:mode==='buoi'?0:10.5,latePen:role==='gv'||role==='hc'||role==='vp'?50000:0}})}
 BTN.forEach((n,i)=>D.groups.push({id:'G'+(i+1),n,gv:'nv'+(18+i),tg:'nv'+(20+i)}));
 D.tkb=tkbDefault(D.groups);
 const T11=[];for(let n=4;n<=17;n++)T11.push('nv'+pad(n));for(let n=22;n<=25;n++)T11.push('nv'+pad(n));
 /* ca mẫu không xếp vào giờ nghỉ trưa (11:25 và 12:15); khi xếp tay vẫn chọn được mọi ca */
 const SEEDSL=SLOTS.filter(s=>s<'11:25'||s>='13:05');
 const load={};T11.forEach(t=>load[t]=0);
 const GM=['Gia Bảo','Minh Khang','Bảo Nam','Đức Anh','Quốc Huy','Anh Khôi','Hoàng Long','Minh Quân','Tuấn Kiệt','Gia Hưng','Nhật Minh','Hải Đăng','Bảo Long','Thiên Ân','Đăng Khoa','Phúc An','Gia Huy','Trung Kiên','Anh Dũng','Khánh Duy','Minh Đạt','Bảo Minh'];
 const GF=['Bảo Châu','Minh Anh','Khánh Linh','Ngọc Mai','Thùy Dương','Gia Hân','Bảo Ngọc','Phương Anh','Diệp Chi','Ngọc Hà','Thu Trang','Bích Ngọc','Khánh Vy','Hà My','An Nhiên','Tú Anh','Bảo Anh','Mai Chi','Cát Tường','Hải Yến'];
 const ME=['Thị Lan','Thu Hà','Ngọc Lan','Thanh Hương','Hồng Nhung','Thùy Dung','Kim Oanh','Mai Phương','Bích Thủy','Thị Hoa'],BO=['Văn Hùng','Minh Tuấn','Quốc Việt','Đức Thành','Văn Long','Hữu Phước','Anh Tuấn','Thanh Sơn','Văn Đạt','Trọng Hiếu'];
 const used=new Set();let last=null;
 for(let i=0;i<100;i++){
  const id='hs'+String(i+1).padStart(3,'0'),sib=i>0&&i%23===0&&last,g=R()<.64?'M':'F',ho=sib?last.n.split(' ')[0]:P(HO);
  let n;do{n=ho+' '+P(g==='M'?GM:GF)}while(used.has(n));used.add(n);
  const months=RI(26,118),r=R();let m11=0,bt=false;
  /* 1-1 thuần: học vài buổi mỗi tuần, một số bé học đủ T2–T7; bán trú: mỗi ngày bán trú có 1 ca 1-1 nằm trong gói, m11 là số ca 1-1 học thêm */
  if(r<.55)m11=R()<.18?RI(5,6):RI(1,4);else if(r<.7){m11=RI(1,2);bt=true}else bt=true;
  const btd=bt?(R()<.35?DAY_ALL.slice():DAY_BT.slice()):null;
  const rs=R(),st=sib?'dang':rs<.93?'dang':rs<.96?'nghi':'bl';
  let gv=null;if(m11>0||bt){const mn=Math.min(...T11.map(t=>load[t]));gv=P(T11.filter(t=>load[t]===mn));if(st==='dang')load[gv]+=m11+(bt?btd.length:0)}
  let pn,pr,pp,pe;
  if(sib){pn=last.pn;pr=last.pr;pp=last.pp;pe=last.pe}else{pr=R()<.62?'Mẹ':'Bố';pn=ho+' '+P(pr==='Mẹ'?ME:BO);pp='09'+String(RI(10000000,99999999));pe=ascii(pn)+(i+1)+'@gmail.com'}
  const k={id,n,g,dob:iso(new Date(NOW.getFullYear(),NOW.getMonth()-months,RI(1,27))),sd:iso(new Date(2024,RI(0,23),RI(1,28))),st,nd:P(NEEDS),m11,bt,gv,gr:'',pn,pr,pp,pe};
  if(bt){k.gr=grByAge(k.dob);k.btd=btd} /* Ong non: dưới 6 tuổi; Ong mật: từ 6 tuổi */
  k.dx=seedDx(R,k);
  D.kids.push(k);last=k}
 /* lịch 1-1: không trùng giáo viên, trẻ, phòng */
 let lid=0;const tk={},ck={},rk={};
 /* ca 1-1 trong gói bán trú: mỗi ngày bán trú một ca, cố định giáo viên và khung giờ, xếp trong giờ học (tránh giờ ăn, ngủ trưa) */
 const BTSL=SLOTS.filter(s=>['08:05','08:55','09:45','10:35','13:55','14:45','15:35'].includes(s));
 const freeAt=(g,h,day,s)=>!tk[g+day+s]&&!ck[h+day+s]&&ROOMS.find(x=>!rk[x+day+s]);
 const putAt=(k,day,s)=>{const room=ROOMS.find(x=>!rk[x+day+s]);tk[k.gv+day+s]=ck[k.id+day+s]=rk[room+day+s]=1;D.lich.push({id:'l'+(++lid),type:'11',day,slot:s,gv:k.gv,hs:k.id,room})};
 SH(D.kids.filter(k=>k.st==='dang'&&k.bt)).forEach(k=>{const days=k.btd,one=SH(BTSL).find(s=>days.every(d=>freeAt(k.gv,k.id,d,s)));
  if(one)days.forEach(d=>putAt(k,d,one));else days.forEach(d=>{const s=SH(BTSL).find(x=>freeAt(k.gv,k.id,d,x));if(s)putAt(k,d,s)})});
 SH(D.kids.filter(k=>k.st==='dang'&&k.m11>0)).forEach(k=>{let placed=0;
  for(const day of SH([1,2,3,4,5,6])){if(placed>=k.m11)break;
   for(const s of SH(SEEDSL)){if(tk[k.gv+day+s]||ck[k.id+day+s])continue;const room=ROOMS.find(x=>!rk[x+day+s]);if(!room)continue;
    tk[k.gv+day+s]=ck[k.id+day+s]=rk[room+day+s]=1;D.lich.push({id:'l'+(++lid),type:'11',day,slot:s,gv:k.gv,hs:k.id,room});placed++;break}}});
 /* giáo viên mẫu (nv04) luôn có buổi vào thứ Bảy để thử điểm danh */
 if(!D.lich.some(l=>l.gv==='nv04'&&l.day===6)){let mv=0;
  for(const l of D.lich.filter(x=>x.type==='11'&&x.gv==='nv04'&&!(D.kids.find(k=>k.id===x.hs)||{}).bt)){if(mv>=2)break;if(D.lich.some(x=>x.type==='11'&&x.hs===l.hs&&x.day===6))continue;
   for(const s of SEEDSL){if(tk['nv04'+6+s]||ck[l.hs+6+s])continue;const room=ROOMS.find(x=>!rk[x+6+s]);if(!room)continue;
    delete tk['nv04'+l.day+l.slot];delete ck[l.hs+l.day+l.slot];delete rk[l.room+l.day+l.slot];
    tk['nv04'+6+s]=ck[l.hs+6+s]=rk[room+6+s]=1;l.day=6;l.slot=s;l.room=room;mv++;break}}
  if(!mv){const k=D.kids.find(x=>x.gv==='nv04'&&x.st==='dang');   /* giáo viên mẫu chưa có ca 1-1 thuần: thêm một ca thứ Bảy */
   if(k)for(const s of SEEDSL){if(tk['nv04'+6+s]||ck[k.id+6+s])continue;const room=ROOMS.find(x=>!rk[x+6+s]);if(!room)continue;
    tk['nv04'+6+s]=ck[k.id+6+s]=rk[room+6+s]=1;D.lich.push({id:'l'+(++lid),type:'11',day:6,slot:s,gv:'nv04',hs:k.id,room});break}}}
 D.kids.forEach(k=>{k.m11=D.lich.filter(l=>l.type==='11'&&l.hs===k.id).length});
 /* điểm danh 2 tháng gần nhất (ngày làm việc gần nhất để trống cho bạn thử) */
 const range=[];for(let d=sm(CM,-1)+'-01';d<WD;d=addD(d,1))if(isW(d))range.push(d);
 range.forEach(d=>{const w=dow(d);
  D.groups.forEach(g=>D.kids.filter(k=>k.gr===g.id&&k.st==='dang'&&btHas(k,w)).forEach(k=>{const r=R();D.att[d+'|'+g.id+'|'+k.id]=r<.9?'cm':r<.96?'p':'kp'}));
  D.lich.forEach(l=>{if(l.type==='11'&&l.day===w){const k=kidBy(l.hs);
   if(k&&k.bt&&incSession(k,d)===l.id){const b=D.att[d+'|'+k.gr+'|'+k.id];D.att[d+'|'+l.id+'|'+l.hs]=b&&b!=='cm'?b:'cm';return}   /* ca 1-1 trong gói bán trú đi theo ngày bán trú */
   const r=R();D.att[d+'|'+l.id+'|'+l.hs]=r<.86?'cm':r<.93?'p':r<.975?'kp':'tt'}})});
 const btk=D.kids.filter(k=>k.gr&&k.st==='dang'),pw=mDates(sm(CM,-1)).filter(d=>dow(d)>=1&&dow(d)<=5);
 [btk[2],btk[9],btk[17]].forEach((k,j)=>{if(k)pw.slice(6+j*3,9+j*3).forEach(d=>{D.att[d+'|'+k.gr+'|'+k.id]='bv';const li=incSession(k,d);if(li)D.att[d+'|'+li+'|'+k.id]='bv'})});
 /* chấm công nhân viên + đơn nghỉ */
 const lv=[['nv05',4],['nv08',9],['nv11',14],['nv14',19],['nv19',6],['nv02',12],['nv27',22],['nv22',16]];
 lv.forEach(([s,i],j)=>{const f=range[Math.min(i,range.length-2)];D.lr.push({id:'lr'+j,st:s,type:j%3===2?'om':'phep',f,t:j%2?addD(f,1):f,why:j%3===2?'Ốm, có giấy khám':'Việc gia đình',s:'duyet'})});
 [['nv06',3],['nv20',4],['nv27',6]].forEach(([s,d],j)=>D.lr.push({id:'lq'+j,st:s,type:'phep',f:addD(TODAY,d),t:addD(TODAY,d+1),why:'Việc riêng',s:'cho'}));
 D.lr.push({id:'lx0',st:'nv09',type:'kl',f:range[3],t:range[3],why:'Việc riêng',s:'tuchoi'});
 D.staff.forEach(s=>range.forEach(d=>{if(D.lr.some(l=>l.st===s.id&&l.s==='duyet'&&l.f<=d&&d<=l.t))return;const r=R();if(r<.025)return;
  D.ts[s.id+'|'+d]={i:r<.1?'08:'+pad(RI(16,40)):'07:'+pad(RI(35,59)),o:R()<.5?'16:'+pad(RI(40,59)):'17:'+pad(RI(0,40))}}));
 /* kế hoạch mục tiêu, buổi can thiệp: sinh theo thư viện và lịch học */
 seedProg(D);
 /* học phí: hóa đơn 3 tháng, đã thu, hoàn phí nghỉ tháng trước */
 let eid=0;
 [sm(CM,-2),sm(CM,-1),CM].forEach(m=>D.kids.forEach(k=>{if(k.st!=='dang')return;const a=invoice(k,m);if(a<=0)return;
  D.lg.push({id:'e'+(++eid),hs:k.id,date:m+'-01',kind:'hp',amt:a,m,note:'Học phí '+mLow(m)});
  const r=R(),dd=m+'-'+pad(RI(2,6)),when=dd>TODAY?TODAY:dd;
  if(m!==CM){if(r<.9)D.lg.push({id:'e'+(++eid),hs:k.id,date:when,kind:'thu',amt:a,m,note:P(['Chuyển khoản','Tiền mặt'])});else if(r<.95)D.lg.push({id:'e'+(++eid),hs:k.id,date:when,kind:'thu',amt:Math.round(a/2/1000)*1000,m,note:'Đóng một phần'})}
  else if(r<.7)D.lg.push({id:'e'+(++eid),hs:k.id,date:when,kind:'thu',amt:a,m,note:P(['Chuyển khoản','Tiền mặt'])})}));
 D.kids.forEach(k=>{if(k.st==='dang')postSettle(k,sm(CM,-1))});
 /* học bù mẫu */
 const cand=SH(Object.keys(D.att).filter(key=>{const [d,s,h]=key.split('|');return d>=addD(WD,-21)&&(D.att[key]==='p'||D.att[key]==='tt')&&D.lich.some(l=>l.id===s)&&incSession(kidBy(h),d)!==s}));
 cand.slice(0,8).forEach((key,i)=>{const [d,s,h]=key.split('|'),l=D.lich.find(x=>x.id===s),k=D.kids.find(x=>x.id===h);
  const r={id:'mk'+i,hs:h,from:{d,sid:s,kind:'11',slot:l.slot},by:i%2?'ph':'gv',why:D.att[key]==='tt'?'Trung tâm/giáo viên nghỉ':'Bé nghỉ có phép',s:'dk',props:[],pick:null,log:[{at:d,by:'ph',tx:'Đăng ký học bù'}]};
  const fs=freeSlots(l.gv,h,addD(d,1),4);
  if(i>=2&&fs.length){r.props=fs.slice(0,2).map((f,x)=>({id:'p'+x,d:f.date,slot:f.slot,gv:l.gv,room:f.room,by:'gv'}));r.s='tt';r.log.push({at:d,by:'gv',tx:'Đề xuất 2 khung giờ học bù'})}
  if(i>=5&&r.props.length){const p=r.props[0];r.pick=p.id;r.s='xn';r.log.push({at:d,by:'ph',tx:'Phụ huynh đồng ý lịch bù'});
   D.lich.push({id:'lb'+i,type:'bu',date:p.d,slot:p.slot,gv:p.gv,hs:h,room:p.room,mk:r.id});
   if(i===7&&p.d<WD){D.att[p.d+'|lb'+i+'|'+h]='cm';r.s='xong'}}
  D.mk.push(r)});
 D.kids.forEach(k=>{if(k.st==='dang')postSettle(k,sm(CM,-1))});
 /* thông báo mẫu */
 const nt=(a,tg,t,b,by,d,pin,fin)=>D.nt.push({id:'n'+D.nt.length,aud:a,tg,t,b,by,at:d,pin:!!pin,fin:!!fin});
 nt('ph','all','Lịch nghỉ lễ cuối năm','Trung tâm nghỉ lễ theo lịch chung. Các buổi trùng ngày nghỉ sẽ được xếp học bù, phụ huynh vui lòng theo dõi nhóm chung.','nv02',addD(TODAY,-2),1);
 nt('ph','all','Nhắc đóng học phí đầu tháng','Học phí đóng từ đầu tháng và nguyên tháng. Phụ huynh chuyển khoản theo nội dung: Tên bé - Tháng.','nv26',addD(TODAY,-5),0,1);
 nt('ph','G1','Hoạt động ngoại khóa lớp Ong non','Lớp Ong non có hoạt động vận động ngoài trời vào thứ Sáu tuần này. Bé mặc quần áo thoải mái, mang theo nước uống.','nv18',addD(TODAY,-1));
 nt('ph','hs001','Báo cáo chuyên môn tháng trước đã sẵn sàng','Phụ huynh xem báo cáo trong mục Cổng phụ huynh. Mọi thắc mắc xin trao đổi trực tiếp với giáo viên phụ trách.',D.kids[0].gv||'nv02',addD(TODAY,-3));
 nt('nb','all','Họp chuyên môn cuối tháng','Họp toàn bộ giáo viên lúc 17:30 thứ Bảy cuối tháng. Mang theo hồ sơ các bé cần rà soát mục tiêu.','nv03',addD(TODAY,-1),1);
 nt('nb','all','Cập nhật quy trình điểm danh','Từ nay giáo viên điểm danh ngay sau mỗi buổi, đánh dấu rõ P hoặc KP theo thời điểm phụ huynh báo nghỉ.','nv01',addD(TODAY,-6));
 nt('ph','all','Giờ học 1-1 và bán trú','Can thiệp 1-1 nhận bé từ '+DAY_OPEN+' đến '+DAY_CLOSE+', mỗi ca '+SLOT_MIN+' phút. Bán trú hai lớp Ong non và Ong mật học từ '+BT.s+' đến '+BT.e+' (thứ Hai đến thứ Sáu). Phụ huynh xem lịch học và giờ 1-1 của bé ở mục Lịch học của bé, thực đơn bán trú ở mục Thực đơn bán trú.','nv02',addD(TODAY,-1));
 /* báo cáo chuyên môn mẫu */
 const per=sm(CM,-1);
 D.kids.filter(k=>k.st==='dang'&&D.sess.some(s=>s.k===k.id)).forEach((k,i)=>{if(R()<.55){const st=P(['gui','gui','gui','duyet','cho','nhap']);D.rp.push({id:'r'+i,hs:k.id,per,au:k.gv||'nv04',s:st,rv:st==='nhap'?'':'nv02',cm:'',sec:autoSec(k,per)})}});
 /* thực đơn bán trú: tuần trước, tuần này, tuần sau */
 seedMenu(D);
 return D}
