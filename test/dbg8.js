const {open,login}=require('./h.js');
(async()=>{const {b,page,errs}=await open();
 const keys=await page.evaluate(()=>Object.keys(ACT).filter(k=>/xl|pdf|export/i.test(k)));
 console.log(keys.join(','));
 for(const role of ['ql','gv','vp','tt']){
  await login(page,role).catch(async()=>{await page.selectOption('#demo-role',role)});
  if(role!=='ql')await page.selectOption('#demo-role',role);
  const res=await page.evaluate(()=>{
   const out={};window.__cap=[];window.exportXLSX=async(n,s)=>{__cap.push(['xlsx',n,s.map(x=>x.n+': '+(x.rows[0]||[]).join(' | '))])};window.exportPDF=async(n,h)=>{__cap.push(['pdf',n,h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,400)])};
   const kid=DB.kids.find(k=>k.st==='dang'&&k.m11>0&&k.bt);
   const args={ccxl:[],ddxl:[],ddpdf:[],tkxl:[],tkpdf:[],hpxl:[],tlxl:[],bcpdf:[DB.rp.find(r=>r.s==='gui').id],slippdf:['nv04|2026-10']};
   S.dd=Object.assign({tab:'sheet',date:WD,m:CM,q:'',pr:'',fl:'',gv:'',kid:'',un:false},S.dd||{});S.cc=Object.assign({tab:'hn',m:CM},S.cc||{});S.tl=Object.assign({m:'2026-10'},S.tl||{});S.hp=Object.assign({tab:'tq',m:CM,st:'',q:''},S.hp||{});
   Object.keys(ACT).filter(k=>/xl|pdf/i.test(k)).forEach(k=>{try{const r=ACT[k].apply(null,args[k]||[]);out[k]=r===false?'refused':'ran'}catch(e){out[k]='ERR '+e.message}});
   return out});
  await page.waitForTimeout(300);
  const cap=await page.evaluate(()=>__cap);
  console.log('==',role,JSON.stringify(res));
  cap.forEach(c=>console.log('   ',c[0],c[1],JSON.stringify(c[2]).slice(0,330)));
 }
 console.log(errs);await b.close()})();
