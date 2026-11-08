const {chromium}=require('playwright');
const URL='file://'+require('path').resolve(__dirname,'../src/build/page-test.html');
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
 const W=ms=>page.waitForTimeout(ms);
 const login=async r=>{await ev(()=>{try{localStorage.removeItem('gb_u')}catch(e){}});await page.goto(URL);await page.waitForSelector('.lg');await page.click(`.roles [data-v="${r}"]`);await page.waitForSelector('.nav')};
 const nav=async v=>{await page.click(`.nav button[data-v="${v}"]`);await W(60)};
 const as=async em=>{await ev(e=>{setUser(findAccount(e));render()},em);await W(60)};
 await page.goto(URL);await ev(()=>localStorage.clear());
 // ===== GV =====
 await login('gv');
 const gv=await ev(()=>U.id);
 ok('gv nav limited',JSON.stringify(await page.$$eval('.nav button',e=>e.map(x=>x.dataset.v)))===JSON.stringify(['dash','hs','lh','tn','cc','dd','hb','tl','mt','bc','td','tb']));
 await ev(()=>{S.v='ns';render()});ok('gv cannot open Nhân sự (falls back)',(await ev(()=>S.v))==='dash');
 const sess=await page.$$('[data-a="ddgo"]');
 if(sess.length){await sess[0].click();await W(80)}else await nav('dd');
 await page.click('.tab[data-v="roll"]');await W(60);
 const gcol=await page.$$eval('.card tbody tr td:nth-child(3)',els=>[...new Set(els.map(e=>e.innerText))]);
 const me=await ev(()=>given(sn(U.id)));
 ok('roll-call only own sessions',gcol.length<=1&&(gcol.length===0||gcol[0]===me),JSON.stringify(gcol)+' me='+me);
 const cmb=await page.$$('.stb .st-cm');if(cmb.length){await cmb[0].click();await W(50)}
 ok('gv marks attendance',(await ev(()=>Object.keys(DB.att).filter(k=>k.startsWith(WD)).length))>=1);
 await page.fill('#dd-d','2026-10-20');await page.dispatchEvent('#dd-d','change');await W(80);
 const dis=await page.$$eval('.st',e=>e.every(x=>x.disabled));ok('gv cannot edit attendance older than 7 days',dis&&(await page.$$('.st')).length>0);
 await page.click('.tab[data-v="sheet"]');await W(60);
 const hdr=await page.$eval('.sheet thead',e=>e.innerText);ok('gv sheet hides money columns',!/Học phí|Hoàn|Phí mất/.test(hdr)&&/Có mặt/.test(hdr));
 const kt=await page.$$eval('.kpi',e=>e.map(x=>x.innerText.replace(/\n/g,' ')).join(' | '));ok('gv sheet KPIs have no money',!/₫/.test(kt),kt);
 ok('gv has no fee rule tab',(await page.$('.tab[data-v="rule"]'))===null);
 // check-in
 await nav('dash');const cib=await page.$('[data-a="ci"]');await cib.click();await W(60);
 ok('check-in recorded',!!(await ev(g=>DB.ts[g+'|'+WD]&&DB.ts[g+'|'+WD].i,gv)));
 await page.click('[data-a="ci"]');await W(60);ok('check-out recorded',!!(await ev(g=>DB.ts[g+'|'+WD].o,gv)));
 // Học bù: propose for own kid
 await ev(g=>{const k=DB.kids.find(x=>x.gv===g&&x.st==='dang');const l=DB.lich.find(x=>x.hs===k.id&&x.type==='11');const d=addD(WD,-2);const dd=isW(d)?d:addD(d,-1);DB.att[dd+'|'+l.id+'|'+k.id]='p';mkMake(k.id,dd,l.id,'Test');render()},gv);
 await nav('hb');
 const mkid=await ev(g=>DB.mk.filter(r=>r.s==='dk'&&canKid(r.hs)).pop().id,gv);
 await page.click(`[data-a="mkprop"][data-v="${mkid}"]`);await page.waitForSelector('#mkpf');
 const cbs=await page.$$('#mkpf input[type=checkbox]');ok('free slots suggested',cbs.length>0,cbs.length);
 await cbs[0].check();await cbs[1].check();await page.click('#mkpf button[type=submit]');await W(80);
 ok('makeup proposal sent',(await ev(i=>DB.mk.find(r=>r.id===i).s,mkid))==='tt'&&(await ev(i=>DB.mk.find(r=>r.id===i).props.length,mkid))===2);
 // Báo cáo
 await nav('bc');await page.click('[data-a="bcnew"]');await page.waitForSelector('#bcnf');
 const pick=await ev(()=>{const ks=bcKids(),pers=[sm(CM,-2),sm(CM,-1),CM];for(const p of pers)for(const k of ks)if(!DB.rp.some(r=>r.hs===k.id&&r.per===p))return{k:k.id,p};return null});
 ok('có bé/kỳ chưa có báo cáo để soạn mới',!!pick,JSON.stringify(pick));
 await page.selectOption('#bn-k',pick.k);await page.selectOption('#bn-p',pick.p);
 await page.click('#bcnf button[type=submit]');await page.waitForSelector('#bcef');
 await page.fill('#bcef textarea >> nth=0','Tổng quan kiểm thử');await page.click('#bcef button[value="sub"]');await W(80);
 ok('report drafted and submitted',(await ev(()=>DB.rp.some(r=>r.s==='cho'&&r.au===U.id&&/kiểm thử/.test(r.sec.tq)))));
 // Lương
 await nav('tl');ok('payslip shows',/Thực nhận/.test(await page.$eval('#main',e=>e.innerText)));
 // Notice
 await nav('tb');await page.click('[data-a="tbnew"]');await page.waitForSelector('#tbf');
 const tgopts=await page.$$eval('#tb-g option',o=>o.map(x=>x.textContent));ok('gv notice targets only own groups/kids',tgopts.every(t=>!/Mọi phụ huynh/.test(t))&&tgopts.length>0,tgopts.slice(0,3).join(' | '));
 await page.click('.mdl [data-a="mx"]');
 // ===== PH =====
 await login('ph');
 const info=await ev(()=>({pe:U.pe,k:myKids().map(k=>k.id)}));
 ok('parent has kids',info.k.length>=1,info.k.join(','));
 for(const t of ['tq','ch','bc','vd']){await page.click(`.tab[data-v="${t}"]`);await W(50)}
 await page.click('.tab[data-v="ch"]');await W(50);
 ok('parent month view has calendar and refund explanation',!!(await page.$('.cal'))&&/Hoàn trừ tháng sau/.test(await page.$eval('#main',e=>e.innerText)));
 ok('parent cannot see other kids',await ev(()=>DB.kids.filter(k=>canKid(k.id)).every(k=>k.pe===U.pe)));
 // makeup cross-role
 const kid=info.k[0];
 await ev(k=>{if(!mkCands(k).length){const l=DB.lich.find(x=>x.hs===k&&x.type==='11');const d=addD(WD,-3);const dd=isW(d)?d:addD(d,-1);const dd2=dow(dd)===l.day?dd:(()=>{let x=dd;while(dow(x)!==l.day)x=addD(x,-1);return x})();DB.att[dd2+'|'+l.id+'|'+k]='kp'}render()},kid);
 await nav('hb');await page.click('[data-a="mknew"]');await page.waitForSelector('#mknf');
 const mk0=await ev(()=>DB.mk.length);await page.click('#mknf button[type=submit]');await W(80);
 ok('parent registers makeup',(await ev(()=>DB.mk.length))===mk0+1&&(await ev(()=>DB.mk[DB.mk.length-1].by))==='ph');
 const rid=await ev(()=>DB.mk[DB.mk.length-1].id);
 const tch=await ev(k=>kidBy(k).gv,kid);
 await as(await ev(t=>stBy(t).em,tch));
 await nav('hb');await page.click(`[data-a="mkprop"][data-v="${rid}"]`);await page.waitForSelector('#mkpf');
 const cb2=await page.$$('#mkpf input[type=checkbox]');await cb2[0].check();await page.click('#mkpf button[type=submit]');await W(80);
 ok('teacher proposes',(await ev(i=>DB.mk.find(r=>r.id===i).s,rid))==='tt');
 await as(info.pe);await nav('hb');
 await page.click(`tr[data-v="${rid}"]`);await page.waitForSelector('[data-a="mkpick"]');await page.click('[data-a="mkpick"]');await W(80);
 const st=await ev(i=>DB.mk.find(r=>r.id===i).s,rid);ok('parent picks slot -> confirmed',st==='xn');
 const lb=await ev(i=>DB.lich.find(l=>l.mk===i),rid);ok('makeup session created in timetable',!!lb&&lb.type==='bu',JSON.stringify(lb));
 // original absence now exempt
 const ex=await ev(i=>{const r=DB.mk.find(x=>x.id===i),k=kidBy(r.hs),s=settle(k,r.from.d.slice(0,7));return s.rows.find(x=>x.d===r.from.d)},rid);
 ok('absence with confirmed makeup has no penalty',ex&&ex.ls===0&&ex.rf===0&&/học bù/i.test(ex.note),JSON.stringify(ex));
 // hp view
 await page.click('.mdl [data-a="mx"]');await nav('hp');ok('parent fee view',/Học phí/.test(await page.$eval('#main',e=>e.innerText)));
 await nav('tb');await page.click('[data-a="rdall"]');await W(50);ok('mark all read',(await ev(()=>unread()))===0);
 console.log(res.join('\n'));console.log('ERRS',errs.length);errs.slice(0,10).forEach(e=>console.log(e));
 await b.close();
})().catch(e=>{console.log(res.join('\n'));console.log('SCRIPT ERROR',e.message.split('\n').slice(0,6).join('\n'));process.exit(1)});
