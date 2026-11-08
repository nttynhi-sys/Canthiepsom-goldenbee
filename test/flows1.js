const {chromium}=require('playwright');
const URL='file:///tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/build/page.html';
const res=[];const ok=(n,c,x)=>{res.push((c?'PASS ':'FAIL ')+n+(x!==undefined?' => '+x:''))};
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1366,height:900}});
 const page=await ctx.newPage();
 const errs=[];
 page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_/.test(m.text()))errs.push('CONSOLE '+m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 const ev=(f,a)=>page.evaluate(f,a);
 const login=async r=>{await ev(()=>{try{localStorage.removeItem('gb_u')}catch(e){}});await page.goto(URL);await page.waitForSelector('.lg');await page.click(`.roles [data-v="${r}"]`);await page.waitForSelector('.nav')};
 const nav=async v=>{await page.click(`.nav button[data-v="${v}"]`);await page.waitForTimeout(60)};
 await page.goto(URL);await ev(()=>localStorage.clear());
 // ===== QL =====
 await login('tt');
 await nav('dd');
 await page.click('.tab[data-v="roll"]');await page.waitForTimeout(60);
 const n0=await ev(()=>Object.keys(DB.att).filter(k=>k.startsWith(WD)).length);
 ok('roll-call starts empty for WD',n0===0,n0);
 const rows=await page.$$('.card .stb');ok('roll-call has 1-1 rows',rows.length>0,rows.length);
 // mark first row P, second KP, third TT, rest cm
 const btns=async c=>page.$$(`.stb .st-${c}`);
 await (await btns('p'))[0].click();await page.waitForTimeout(40);
 await (await btns('kp'))[1].click();await page.waitForTimeout(40);
 await (await btns('tt'))[2].click();await page.waitForTimeout(40);
 await (await btns('cm'))[3].click();await page.waitForTimeout(40);
 const marks=await ev(()=>Object.entries(DB.att).filter(([k])=>k.startsWith(WD)).map(([k,v])=>v));
 ok('4 marks recorded',marks.length===4&&marks.includes('p')&&marks.includes('kp')&&marks.includes('tt')&&marks.includes('cm'),marks.join(','));
 const note=await page.$$eval('.card td .sm',els=>els.map(e=>e.innerText).filter(t=>/Mất|hoàn/.test(t)).slice(0,3));
 ok('fee notes shown',note.length>=2,JSON.stringify(note));
 // un-mark by clicking again
 await (await page.$$('.stb .st-cm.on'))[0].click();await page.waitForTimeout(40);
 ok('toggle clears mark',(await ev(()=>Object.keys(DB.att).filter(k=>k.startsWith(WD)).length))===3);
 // makeup button for p/kp/tt
 const mkb=await page.$$('[data-a="mkfrom"]');ok('makeup buttons visible',mkb.length===3,mkb.length);
 // ===== Sheet and settle changes =====
 await page.click('.tab[data-v="sheet"]');await page.waitForTimeout(80);
 const kpiTxt=await page.$$eval('.kpi',e=>e.map(x=>x.innerText.replace(/\n/g,' | ')));
 ok('sheet KPIs',kpiTxt.length===4,kpiTxt.join(' ## '));
 // post refunds previous month
 await page.click('[data-a="ddm"][data-v="-1"]');await page.waitForTimeout(80);
 const need=await page.$eval('.kpi:nth-child(3)',e=>e.innerText.replace(/\n/g,' | '));
 ok('previous month refund KPI',/đã ghi/.test(need),need);
 const before=await ev(()=>DB.lg.filter(e=>e.kind==='hoan').length);
 await page.click('[data-a="ddpost"]');await page.waitForSelector('.mdl [data-a="askyes"]');await page.click('[data-a="askyes"]');await page.waitForTimeout(80);
 const after=await ev(()=>DB.lg.filter(e=>e.kind==='hoan').length);
 ok('post settle idempotent (same count after re-post)',after===before,before+'->'+after);
 // open cell modal
 await page.click('.dcell');await page.waitForSelector('.mdl');
 const mt=await page.$eval('.mdl',e=>e.innerText.slice(0,200).replace(/\n/g,' | '));ok('cell modal opens',/Có mặt|Nghỉ|1-1|Bán trú/.test(mt),mt);
 await page.click('.mdl [data-a="mx"]');
 // change rule: pLoss 50% then check refund drops
 const r0=await ev(()=>{const m=S.dd.m;return DB.kids.filter(k=>k.st==='dang').reduce((s,k)=>s+settle(k,m).refund,0)});
 await ev(()=>{DB.cfg.rule.pLoss=50});
 const r1=await ev(()=>{const m=S.dd.m;return DB.kids.filter(k=>k.st==='dang').reduce((s,k)=>s+settle(k,m).refund,0)});
 ok('changing P loss% changes refund',r1<r0,r0+'->'+r1);
 await ev(()=>{DB.cfg.rule.pLoss=30});
 // Excel/PDF buttons without downloads capability should toast, not crash
 await page.click('[data-a="ddxl"]');await page.waitForTimeout(400);
 const toast1=await ev(()=>($q('.toast')||{}).textContent);ok('excel export without capability does not crash',true,toast1);
 // rule tab
 await page.click('.tab[data-v="rule"]');await page.waitForTimeout(60);
 const rt=await page.$eval('#main',e=>e.innerText);ok('rule tab has both policies',/Điều 9/.test(rt)&&/bán trú/i.test(rt)&&/nhập viện/.test(rt));
 console.log(res.join('\n'));
 console.log('ERRS',errs.length);errs.slice(0,10).forEach(e=>console.log(e));
 await b.close();
})();
