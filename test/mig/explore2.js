const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:900}});const page=await ctx.newPage();
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|claude\.ai|anthropic/,r=>r.abort());
 await page.goto('file://'+__dirname+'/v7.html');await page.waitForSelector('.lg');
 const o=await page.evaluate(()=>{
  const gr={};DB.kids.forEach(k=>{gr[k.gr||'-']=(gr[k.gr||'-']||0)+1});
  const av={};Object.values(DB.att).forEach(v=>{av[v]=(av[v]||0)+1});
  const gk=DB.att&&Object.keys(DB.att).filter(k=>/\|G\d/.test(k)).slice(0,4);
  return{gr,av,gk,lg:DB.lg.slice(0,2),setv:DB.set['hs001|2026-10'],nt:DB.nt.map(n=>({id:n.id,t:n.t,tg:n.tg,by:n.by,pin:n.pin,at:n.at})),btNt:DB.nt.find(n=>/Chồi/.test(n.t)),cfg:DB.cfg,TODAY:TODAY,rp0:DB.rp[0]&&{id:DB.rp[0].id,hs:DB.rp[0].hs,per:DB.rp[0].per},ts0:DB.ts[0],lr0:DB.lr[0],sess0:DB.sess[0],plans0:DB.plans[0],cg0:DB.cg[0],tpl0:DB.tpl[0]&&Object.keys(DB.tpl[0]),btStaff:DB.staff.filter(s=>/bán trú/i.test(s.pos)).map(s=>s.id+':'+s.pos+':'+JSON.stringify(s.pay))}});
 console.log(JSON.stringify(o,null,1).slice(0,7000));
 await b.close()})();
