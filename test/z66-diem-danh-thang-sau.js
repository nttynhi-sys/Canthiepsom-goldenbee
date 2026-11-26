/* Điểm danh đến hết tháng và tháng sắp đến: bảng chấm công cho sang tháng sau, ô ngày chưa ghi (kể cả ngày sắp tới) bấm được; giáo viên chỉ với trẻ của mình */
const {open,login}=require('./h.js');
let fails=0,passes=0;
const ok=(n,c,x)=>{if(c){passes++;console.log('PASS',n)}else{fails++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,600))}};
(async()=>{
 for(const role of ['gv','ql','tt']){
  const {b,page,errs}=await open();await login(page,role);
  const ev=(f,a)=>page.evaluate(f,a),W=ms=>page.waitForTimeout(ms||150);
  await ev(()=>{S.dd=Object.assign(S.dd||{},{tab:'sheet',m:CM,q:'',pr:'',fl:'',kid:''});go('dd');render()});await page.waitForSelector('table.sheet');
  /* trong tháng hiện tại: ô các ngày còn lại đến hết tháng bấm được */
  const fut=await ev(()=>[...document.querySelectorAll('table.sheet .dcell.dnew')].map(x=>x.dataset.v.split('|')[1]).filter(d=>d>TODAY).length);
  const hasFut=await ev(()=>addD(TODAY,1).slice(0,7)===CM);
  ok(role+': trong tháng hiện tại, các ngày còn lại đến hết tháng bấm được',!hasFut||fut>0,{fut,hasFut});
  const nb=await page.$('[data-a="ddm"][data-v="1"]');
  ok(role+': nút "Tháng sau" ở Bảng chấm công bấm được khi đang ở tháng hiện tại',!!nb&&(await nb.getAttribute('disabled'))===null);
  await page.click('[data-a="ddm"][data-v="1"]');await W();
  const nm=await ev(()=>({m:S.dd.m,exp:sm(CM,1)}));
  ok(role+': sang được tháng sau',nm.m===nm.exp,nm);
  await page.waitForSelector('table.sheet');
  const nn=await page.$$('table.sheet .dcell.dnew');
  ok(role+': tháng sau có ô ngày chưa ghi bấm được (dấu +)',nn.length>0,nn.length);
  const P=await ev(()=>{const x=document.querySelector('table.sheet .dcell.dnew');return x?x.dataset.v:null});
  if(P){const [h,d]=P.split('|');await page.click('table.sheet .dcell.dnew >> nth=0');await page.waitForSelector('.stb');
   const sb=await page.$('.stb .st-cm');ok(role+': mở hộp điểm danh của ngày sắp tới, nút Có mặt bấm được',!!sb&&(await sb.getAttribute('disabled'))===null);
   await sb.click();await W();
   const v=await ev(a=>Object.entries(DB.att).filter(([k])=>k.startsWith(a.d+'|')&&k.endsWith('|'+a.h)).map(x=>x[1]),{h,d});
   ok(role+': ghi được điểm danh cho ngày '+d+' của tháng sau',v.includes('cm'),v)}
  ok(role+': không lỗi trang',errs.length===0,errs);await b.close()}
 {const {b,page}=await open();await login(page,'gv');
  const r=await page.evaluate(()=>{const o=DB.kids.find(k=>!canKid(k.id));if(!o)return{skip:1};const d=addD(TODAY,40);const before=Object.keys(DB.att).length;ACT.att(d+'|x|'+o.id+'|cm');return{same:Object.keys(DB.att).length===before}});
  ok('giáo viên không ghi được điểm danh cho trẻ của giáo viên khác',r.skip||r.same,r);await b.close()}
 console.log(`\nKẾT QUẢ: ${passes} đạt, ${fails} lỗi`);process.exit(fails?1:0)})();
