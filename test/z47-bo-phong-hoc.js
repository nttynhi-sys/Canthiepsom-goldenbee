/* Z47: bỏ khái niệm phòng học. Nhiều giáo viên dạy không cố định phòng nên:
   - không còn danh sách phòng, ô chọn phòng, cột phòng, chế độ xem theo phòng ở bất kỳ màn nào;
   - kiểm tra trùng lịch chỉ còn theo giáo viên và bé (không còn giới hạn 8 ca cùng lúc);
   - bản ghi mới không có trường room; trường room cũ trong dữ liệu được giữ nguyên nhưng không hiển thị, không dùng;
   - máy chủ api/parent.js cũng không chặn theo phòng. */
const {open,login}=require('./h.js');
const fs=require('fs'),path=require('path');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,900))}};
(async()=>{
 /* 0. mã nguồn: không còn ROOMS hay .room ở giao diện và máy chủ (chặn tái xuất hiện) */
 const root=path.resolve(__dirname,'..');
 const srcFiles=fs.readdirSync(path.join(root,'src/build')).filter(f=>/^p.*\.js$/.test(f)).map(f=>path.join(root,'src/build',f)).concat(fs.readdirSync(path.join(root,'api')).filter(f=>/\.js$/.test(f)).map(f=>path.join(root,'api',f)));
 const hits=[];srcFiles.forEach(f=>{fs.readFileSync(f,'utf8').split('\n').forEach((ln,i)=>{if(/\bROOMS\b|\.room\b|\broom:|name="room"/.test(ln))hits.push(path.basename(f)+':'+(i+1))})});
 ok('mã nguồn giao diện và máy chủ không còn ROOMS, .room, room:',hits.length===0,hits);

 const {b,page,errs}=await open();
 const ev=(f,a)=>page.evaluate(f,a);
 const W=ms=>page.waitForTimeout(ms||80);
 const toastTx=()=>ev(()=>{const t=document.querySelector('.toast,#toast');return t?t.textContent:''});

 /* 1. dữ liệu mẫu không có phòng */
 await login(page,'ql');
 const seed=await ev(()=>({noRooms:typeof ROOMS==='undefined',withRoom:DB.lich.filter(l=>'room' in l).length,total:DB.lich.length,
  mkRoom:DB.mk.reduce((n,r)=>n+(r.props||[]).filter(p=>'room' in p).length,0)}));
 ok('không còn hằng số ROOMS',seed.noRooms);
 ok('dữ liệu mẫu: không buổi 1-1 hay học bù nào có phòng',seed.total>0&&seed.withRoom===0&&seed.mkRoom===0,seed);

 /* 2. Lịch học: không có chế độ xem theo phòng; ô thêm buổi không có ô chọn phòng */
 const T=await ev(()=>pool11().find(s=>DB.lich.filter(l=>l.type==='11'&&l.gv===s.id).length>=3).id);
 await ev(T=>{go('lh');render();S.lh.tab='wk';S.lh.mode='gv';S.lh.gv=T;S.lh.wk=monOf(WD);render()},T);await W(120);
 ok('"Xem theo" chỉ còn Giáo viên, Từng bé, Tổng hợp số buổi',await ev(()=>[...document.querySelectorAll('#lhm option')].map(o=>o.value).join())==='gv,kid,all');
 const cells=await ev(()=>[...document.querySelectorAll('#main button.ls:not(.add)')].map(b=>b.querySelector('small')?b.querySelector('small').textContent:''));
 ok('lưới tuần theo giáo viên: ô buổi học không hiện phòng',cells.length>=1&&cells.every(t=>!/Phòng|phòng|P\d/.test(t)),cells.slice(0,5));
 await page.click('#main [data-a="lsadd"][data-v="1|"]');await page.waitForSelector('#lsf');
 const f1=await ev(()=>({room:!!document.querySelector('#lsf [name=room]'),lab:/Phòng/.test(document.querySelector('#lsf').innerText),ctl:[...document.querySelectorAll('#lsf select, #lsf input')].map(e=>e.name).filter(Boolean)}));
 ok('form thêm buổi 1-1: không còn ô chọn phòng',!f1.room&&!f1.lab,f1);
 await ev(()=>{S.modal=null;render()});

 /* 3. kiểm tra trùng: chỉ còn giáo viên và bé, không giới hạn số ca cùng lúc */
 const c=await ev(()=>{
  const ks=DB.kids.filter(k=>k.st==='dang'),gs=DB.staff.filter(s=>isTeacher(s)&&s.st==='dang'&&!DB.groups.some(g=>grHas(g,s.id)));
  const probe=(i)=>conflict({id:'zp'+i,type:'11',day:6,slot:'18:55',gv:'zg'+i,hs:'zk'+i});
  /* 12 ca cùng một khung giờ, mỗi ca một giáo viên và một bé khác nhau: không ca nào bị chặn */
  for(let i=0;i<12;i++)DB.lich.push({id:'zp'+i,type:'11',day:6,slot:'18:55',gv:'zg'+i,hs:'zk'+i});
  const many=Array.from({length:12},(_,i)=>probe(i));
  const sameT=conflict({id:'zq',type:'11',day:6,slot:'18:55',gv:'zg3',hs:'zkNew'}),sameK=conflict({id:'zr',type:'11',day:6,slot:'18:55',gv:'zgNew',hs:'zk4'});
  /* mã phòng cũ trùng nhau (dữ liệu cũ) không còn gây xung đột */
  DB.lich.push({id:'zleg1',type:'11',day:6,slot:'09:00',gv:'zgA',hs:'zkA',room:'Phòng 3'});
  const legacy=conflict({id:'zleg2',type:'11',day:6,slot:'09:00',gv:'zgB',hs:'zkB',room:'Phòng 3'});
  return{many,sameT,sameK,legacy}});
 ok('12 ca cùng khung giờ (giáo viên và bé khác nhau): không bị chặn, không còn giới hạn 8',c.many.every(x=>x===''),c.many);
 ok('trùng giáo viên vẫn bị báo',/Giáo viên đã có buổi khác/.test(c.sameT),c.sameT);
 ok('trùng bé vẫn bị báo',/Trẻ đã có buổi khác/.test(c.sameK),c.sameK);
 ok('mã phòng cũ trùng nhau trong dữ liệu cũ không còn gây xung đột',c.legacy==='',c.legacy);

 /* 4. thêm ca bằng form khi đã có hơn 8 ca cùng lúc: lưu được, bản ghi không có trường room */
 const ad=await ev(([T])=>{const kid=DB.kids.find(k=>k.st==='dang'&&!k.gr&&!DB.lich.some(l=>l.hs===k.id&&l.day===6&&l.slot==='18:55'));
  S.lh.mode='gv';S.lh.gv=T;S.modal={t:'ls',id:'',day:6,slot:'18:55',err:''};render();
  const f=document.querySelector('#lsf');f.elements.hs.value=kid.id;f.elements.day.value='6';f.elements.slot.value='18:55';
  return{kid:kid.id}},[T]);
 await page.click('#lsf button[type=submit]');await W(120);
 const nl=await ev(([T,kid])=>{const l=DB.lich.find(x=>x.hs===kid&&x.gv===T&&x.day===6&&x.slot==='18:55');return{has:!!l,room:l?('room' in l):null,modal:!!S.modal,err:S.modal&&S.modal.err}},[T,ad.kid]);
 ok('form thêm buổi 1-1: lưu được khi đã có hơn 8 ca cùng giờ',nl.has&&!nl.modal,nl);
 ok('buổi mới tạo không có trường room',nl.has&&nl.room===false,nl);

 /* 5. dữ liệu phòng cũ được giữ nguyên nhưng không hiển thị */
 const lg=await ev(([T])=>{const kid=DB.kids.find(k=>k.st==='dang'&&!k.gr&&!DB.lich.some(l=>l.hs===k.id&&l.day===2));
  /* hai giờ đều trống cho giáo viên và bé này, cách nhau xa để không chồng ca */
  const free=[];for(let m=7*60+15;m<=19*60+10&&free.length<2;m+=5){const t=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
   if(!conflict({id:'zleg3',type:'11',day:2,slot:t,gv:T,hs:kid.id})&&(!free.length||m-(+free[0].slice(0,2)*60+ +free[0].slice(3))>=120))free.push(t)}
  DB.lich.push({id:'zleg3',type:'11',day:2,slot:free[0],gv:T,hs:kid.id,room:'Phòng 7 CŨ'});
  go('lh');render();S.lh.tab='wk';S.lh.mode='gv';S.lh.gv=T;S.lh.wk=monOf(WD);render();
  return{kid:kid.id,s1:free[0],s2:free[1]}},[T]);
 await W(120);
 const txt=await ev(()=>document.querySelector('#main').innerText);
 ok('lưới tuần không hiện phòng cũ của buổi',!/Phòng 7 CŨ/.test(txt)&&txt.includes(lg.s1),txt.slice(0,200));
 await ev(()=>{const b=document.querySelector('#main button.ls[data-v^="zleg3|"]');b.click()});await W(120);
 const mt=await ev(()=>document.querySelector('.modal, #modal, [role=dialog]')?document.querySelector('.modal, #modal, [role=dialog]').innerText:'');
 ok('mở buổi có phòng cũ: hộp thoại không hiện phòng',/Sửa buổi 1-1 cố định/.test(mt)&&!/Phòng 7 CŨ/.test(mt),mt.slice(0,200));
 await ev(s2=>{const f=document.querySelector('#lsf');f.elements.slot.value=s2},lg.s2);
 await page.click('#lsf button[type=submit]');await W(120);
 const kept=await ev(()=>{const l=DB.lich.find(x=>x.id==='zleg3');return l?{slot:l.slot,room:l.room}:null});
 ok('sửa buổi cũ: đổi giờ được và trường room cũ vẫn nằm nguyên trong dữ liệu (không xóa dữ liệu cũ)',kept&&kept.slot===lg.s2&&kept.room==='Phòng 7 CŨ',kept);
 const dl=await ev(()=>JSON.stringify(dayList(WD).concat(dayList(addD(WD,1)))));
 ok('danh sách buổi trong ngày (điểm danh, Dashboard) không có trường room',!/"room"/.test(dl));

 /* 6. Điểm danh và Dashboard: không có cột phòng */
 await ev(()=>{go('dd');S.dd=Object.assign(S.dd||{},{tab:'roll',date:WD});render()});await W(150);
 const dd=await ev(()=>[...document.querySelectorAll('#main table th')].map(t=>t.textContent.trim()));
 ok('Điểm danh: bảng Can thiệp 1-1 không còn cột Phòng',dd.includes('Giáo viên')&&!dd.includes('Phòng'),dd);
 await ev(()=>{go('dash');render()});await W(150);
 const ds=await ev(()=>document.querySelector('#main').innerText);
 ok('Dashboard không nhắc phòng',!/\bphòng\b/i.test(ds.replace(/Văn phòng/gi,'')),ds.match(/.{20}phòng.{20}/i));

 /* 7. Hồ sơ bé: form thêm/sửa không có ô phòng; tab lịch của bé không có cột phòng; thêm nhiều ngày không có phòng */
 await ev(id=>{S.modal={t:'hsf',id};render()},lg.kid);await page.waitForSelector('#hsff');await W(80);
 const hf=await ev(()=>({room:!!document.querySelector('#hsff [name=room]'),rm:!!document.querySelector('#hf-rm'),txt:/Phòng/.test(document.querySelector('#hsff').innerText.replace(/Văn phòng/gi,'')),notes:document.querySelector('#hsff').innerText.match(/.{30}phòng.{30}/gi)}));
 ok('form hồ sơ bé: không còn ô chọn phòng và không nhắc phòng',!hf.room&&!hf.rm&&!hf.txt,hf);
 await ev(()=>{S.modal=null;render()});
 await ev(id=>{S.modal={t:'hs',id,tab:'lh'};render()},lg.kid);await W(150);
 const hh=await ev(()=>({th:[...document.querySelectorAll('.modal table th, #modal table th, [role=dialog] table th')].map(t=>t.textContent.trim()),lm:!!document.querySelector('#lm-r, #lsmf [name=room]'),txt:(document.querySelector('#lsmf')||{innerText:''}).innerText}));
 ok('hồ sơ bé, tab lịch: bảng không có cột Phòng, form thêm nhiều ngày không có ô phòng',hh.th.includes('Giáo viên')&&!hh.th.includes('Phòng')&&!hh.lm&&!/Phòng|phòng/.test(hh.txt),hh);
 await ev(()=>{S.modal=null;render()});

 /* 8. Học bù: khung giờ trống không kèm phòng; đề xuất không ghi phòng */
 const hb=await ev(()=>{const r=DB.mk.find(x=>x.s==='dk');if(!r)return null;const gv=mkGV(r),fs=freeSlots(gv,r.hs,addD(TODAY,1),4);
  S.modal={t:'mkp',id:r.id,gv};render();
  return{id:r.id,n:fs.length,keys:fs.length?Object.keys(fs[0]).join():'',vals:[...document.querySelectorAll('#mkpf input[name=s]')].map(i=>i.value),lab:[...document.querySelectorAll('#mkpf .chk')].map(l=>l.textContent.trim())}});
 ok('Học bù: có yêu cầu để thử',!!hb&&hb.n>=1,hb);
 ok('freeSlots chỉ trả ngày và giờ (không có phòng)',hb&&hb.keys==='date,slot',hb);
 ok('khung giờ đề xuất học bù không kèm phòng',hb&&hb.vals.every(v=>v.split('|').length===2)&&hb.lab.every(t=>!/Phòng|phòng/.test(t)),hb);
 await ev(()=>{const f=document.querySelector('#mkpf');f.querySelector('input[name=s]').checked=true});
 await page.click('#mkpf button[type=submit]');await W(120);
 const pr=await ev(id=>{const r=DB.mk.find(x=>x.id===id);return{s:r.s,props:r.props.map(p=>Object.keys(p).sort().join())}},hb.id);
 ok('gửi đề xuất học bù: bản ghi đề xuất không có trường room',pr.s==='tt'&&pr.props.length>=1&&pr.props.every(k=>!/room/.test(k)),pr);

 ok('không có lỗi JS',errs.length===0,errs);
 console.log(`\n${passes} PASS, ${fails} FAIL`);await b.close();process.exit(fails?1:0)})();
