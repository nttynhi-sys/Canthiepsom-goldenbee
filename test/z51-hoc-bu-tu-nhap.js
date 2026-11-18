/* Học bù: giáo viên, Trung tâm tự nhập ngày và giờ (đề xuất hoặc xếp luôn) */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,500))}};
(async()=>{const {b,page,errs}=await open();await login(page,'tt');
 const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||80);
 const setup=()=>ev(()=>{const l=DB.lich.find(x=>x.type==='11'),r={id:'mkT'+uid(),hs:l.hs,from:{d:addD(TODAY,-2),sid:l.id,kind:'11',slot:l.slot},by:'tt',why:'t',s:'dk',props:[],pick:null,log:[]};
  DB.mk.push(r);const gv=mkGV(r);S.modal={t:'mkp',id:r.id,gv};render();
  /* chọn ngày không trùng lịch ở cả hai giờ thử (phụ thuộc ngày chạy: giáo viên có thể đang phụ trách lớp bán trú vào thứ đó) */
  let d=addD(TODAY,9);for(let i=3;i<40;i++){const c=addD(TODAY,i);if(isW(c)&&!conflict({date:c,slot:'19:00',gv,hs:l.hs})&&!conflict({date:c,slot:'18:30',gv,hs:l.hs})){d=c;break}}
  return{id:r.id,d,today:TODAY}});
 const fill=async(i,d,t)=>{await page.fill('#mk-md'+i,d);await page.fill('#mk-mt'+i,t)};
 let S1=await setup();await page.waitForSelector('#mkpf');
 ok('form có 3 dòng tự nhập ngày và giờ, nút gửi không bị khóa',(await page.$$('.mk-man')).length===3&&!(await page.$eval('#mkpf button[type=submit]',e=>e.disabled)));
 await fill(0,S1.d,'19:00');await page.click('#mkpf button[type=submit]');await W();
 let R=await ev(id=>{const r=DB.mk.find(x=>x.id===id);return{s:r.s,props:r.props.map(p=>p.d+'|'+p.slot)}},S1.id);
 ok('tự nhập một khung giờ: gửi đề xuất, đúng ngày và giờ đã nhập',R.s==='tt'&&R.props.length===1&&R.props[0]===S1.d+'|19:00',R);
 S1=await setup();await page.waitForSelector('#mkpf');
 ok('ô ngày không giới hạn quá khứ (không có thuộc tính min)',!(await page.getAttribute('#mk-md0','min')));
 const PD=await ev(id=>{const r=DB.mk.find(x=>x.id===id),gv=S.modal.gv;for(let i=3;i<70;i++){const c=addD(TODAY,-i);if(isW(c)&&!conflict({date:c,slot:'19:00',gv,hs:r.hs}))return c}return null},S1.id);
 await fill(0,PD,'19:00');await page.click('#mkpf button[type=submit]');await W();
 const RP=await ev(id=>{const r=DB.mk.find(x=>x.id===id);return{s:r.s,props:r.props.map(p=>p.d+'|'+p.slot)}},S1.id);
 ok('nhập lại dữ liệu bù cũ: ngày trong quá khứ được nhận',RP.s==='tt'&&RP.props[0]===PD+'|19:00',{PD,RP});
 S1=await setup();await page.waitForSelector('#mkpf');
 await fill(0,S1.d,'06:00');await page.click('#mkpf button[type=submit]');await W();
 ok('giờ ngoài khung 07:15 đến 19:10 bị từ chối',/Giờ bắt đầu phải từ/.test(await page.textContent('#mkpf .err')));
 await page.fill('#mk-md0','');await page.fill('#mk-mt0','10:00');await page.click('#mkpf button[type=submit]');await W();
 ok('thiếu ngày hoặc giờ ở một dòng thì báo lỗi',/đủ cả ngày và giờ/.test(await page.textContent('#mkpf .err')));
 const T=await ev(()=>{const l=DB.lich.find(x=>x.type==='11'&&x.gv===S.modal.gv&&x.day>=1&&x.day<=5);let d=addD(TODAY,1);for(let i=0;i<14&&dow(d)!==l.day;i++)d=addD(d,1);return{d,slot:l.slot}});
 await fill(0,T.d,T.slot);await page.click('#mkpf button[type=submit]');await W();
 const er=await page.textContent('#mkpf .err');
 ok('trùng giờ giáo viên đã có ca: báo lỗi, không gửi',er.length>0&&await ev(id=>DB.mk.find(x=>x.id===id).s,S1.id)==='dk',er);
 await fill(0,S1.d,'18:30');await page.click('[data-a="mkdirect"]');await W();
 const D=await ev(id=>{const r=DB.mk.find(x=>x.id===id),l=DB.lich.find(x=>x.mk===id);return{s:r.s,pick:r.pick,l:l&&l.date+'|'+l.slot+'|'+l.type}},S1.id);
 ok('Xếp lịch luôn: tạo buổi học bù đúng ngày giờ, trạng thái Đã xác nhận',D.s==='xn'&&D.l===S1.d+'|18:30|bu'&&!!D.pick,D);
 ok('không lỗi trình duyệt',errs.length===0,errs);
 await b.close();console.log(`\n${passes} PASS, ${fails} FAIL`);process.exit(fails?1:0)})();
