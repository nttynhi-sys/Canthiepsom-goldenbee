const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:900}});const page=await ctx.newPage();const errs=[];
 page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|claude\.ai|anthropic/,r=>r.abort());
 await page.goto('file://'+__dirname+'/v7.html');await page.waitForSelector('.lg',{timeout:15000});
 const info=await page.evaluate(()=>{
  const o={v:DB.v,keys:Object.keys(DB)};
  o.counts={};Object.keys(DB).forEach(k=>{const x=DB[k];o.counts[k]=Array.isArray(x)?x.length:(x&&typeof x==='object'?Object.keys(x).length:typeof x)});
  o.kid=DB.kids[0];o.staff=DB.staff.find(s=>s.id==='nv26');o.staff4=DB.staff.find(s=>s.id==='nv04');o.lich=DB.lich.slice(0,2);o.groups=DB.groups;o.nt=DB.nt.slice(0,3).map(n=>({id:n.id,t:n.t,aud:n.aud,tg:n.tg,by:n.by}));
  o.attKeys=Object.keys(DB.att).slice(0,6);o.lichSlots=[...new Set(DB.lich.map(l=>l.slot))].sort();
  o.mk=DB.mk.slice(0,1);o.setKeys=Object.keys(DB.set);o.rdKeys=Object.keys(DB.rd).slice(0,3);
  o.hasMenu=!!DB.menu;o.rolesStaff=DB.staff.map(s=>s.id+':'+s.role).join(' ');
  o.fee=Object.keys(DB).filter(k=>/fee|pay|hp|thu|inv|hd/i.test(k));
  o.ntFin=DB.nt.map(n=>n.fin);
  return o});
 console.log(JSON.stringify(info,null,1).slice(0,6000));console.log('errs',errs);
 await b.close()})();
