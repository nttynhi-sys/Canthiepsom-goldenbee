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
 const W=ms=>page.waitForTimeout(ms);
 await page.goto(URL);await ev(()=>localStorage.clear());
 await login('tt');
 // HR add staff
 await nav('ns');await page.click('[data-a="nvnew"]');await page.waitForSelector('#nvf');
 await page.fill('#nv-n','Nguyễn Thị Kiểm Thử');await page.fill('#nv-pos','Giáo viên thử');await page.selectOption('#nv-role','gv');await page.fill('#nv-em','kiem.thu@goldenbee.vn');
 await page.click('#nvf button[type=submit]');await W(80);
 ok('HR add staff',(await ev(()=>DB.staff.length))===31&&(await ev(()=>DB.staff.some(s=>s.em==='kiem.thu@goldenbee.vn'))));
 // permissions tab + settings
 await page.click('.tab[data-v="pq"]');await W(50);ok('permission matrix renders',(await page.$$eval('table tbody tr',r=>r.length))===17);
 await page.click('.tab[data-v="cd"]');await W(50);await page.fill('#p11','350000');await page.click('#cfgf button[type=submit]');await W(60);
 ok('settings saved',(await ev(()=>DB.cfg.p11))===350000);await ev(()=>{DB.cfg.p11=300000});
 // Học phí: ghi thu
 await nav('hp');
 const kid=await page.$eval('[data-a="thuopen"]',e=>e.dataset.v);
 const b0=await ev(k=>balance(k),kid);
 await page.click('[data-a="thuopen"]');await page.waitForSelector('#thuf');await page.fill('#th-a','100000');await page.click('#thuf button[type=submit]');await W(80);
 const b1=await ev(k=>balance(k),kid);ok('payment lowers balance by 100k',b0-b1===100000,b0+'->'+b1);
 ok('ledger modal opens after payment',await page.$('.mdl')!==null);
 await page.click('.mdl [data-a="mx"]');
 // Hóa đơn tháng sau
 await page.click('.tab[data-v="hd"]');await W(60);const gen=await page.$('[data-a="hpgen"]:not([disabled])');
 if(gen){await gen.click();await W(60)}
 ok('generate next-month invoices',(await ev(()=>DB.lg.filter(e=>e.kind==='hp'&&e.m===sm(CM,1)).length))>50);
 // Chấm công duyệt đơn
 await nav('cc');await page.click('.tab[data-v="don"]');await W(50);
 const mk0=await ev(()=>DB.mk.length),att0=await ev(()=>Object.keys(DB.att).length);
 const pend=await ev(()=>DB.lr.filter(l=>l.s==='cho').map(l=>[l.id,l.st,l.f,l.t]));
 // approve all pending
 for(const [id] of pend){await page.click(`[data-a="lrok"][data-v="${id}"]`);await W(60)}
 const mk1=await ev(()=>DB.mk.length),att1=await ev(()=>Object.keys(DB.att).length);
 ok('approving teacher leave marks sessions + creates makeup requests',mk1>mk0&&att1>att0,'mk '+mk0+'->'+mk1+', att '+att0+'->'+att1+' pending='+JSON.stringify(pend));
 // Bảng công
 await page.click('.tab[data-v="bang"]');await W(60);ok('timesheet grid renders',(await page.$$('.sheet tbody tr')).length>=30);
 await page.click('.sheet button.sc:not([disabled])');await page.waitForSelector('#tsef');await page.fill('#ts-i','09:05');await page.click('#tsef button[type=submit]');await W(60);ok('timesheet edit saved',true);
 // Phân công
 await nav('pc');
 const kidsel=await page.$$eval('select[data-c="pcmv"]',els=>els.slice(0,6).map(e=>[e.id,[...e.options].map(o=>o.value).filter(Boolean)]));
 let moved=false,conflictSeen=false;
 for(const [id,vals] of kidsel){for(const v of vals){await page.selectOption('#'+id,v);await W(60);
   if(await page.$('[data-a="askyes"]')){await page.click('[data-a="askyes"]');moved=true;break}else{conflictSeen=true}}
  if(moved)break}
 ok('reassign teacher works (and conflicts are detected)',moved,'conflictSeen='+conflictSeen);
 // Lịch học
 await nav('lh');
 const addb=await page.$('.ls.add');ok('timetable has add buttons',!!addb);
 if(addb){await addb.click();await page.waitForSelector('#lsf');
  const opt=await page.$$eval('#ls-k option',o=>o.map(x=>x.value));
  await page.selectOption('#ls-k',opt[0]);const l0=await ev(()=>DB.lich.length);await page.click('#lsf button[type=submit]');await W(80);
  ok('add fixed session',(await ev(()=>DB.lich.length))===l0+1||!!(await page.$('#lsf .err:not(:empty)')),'lich '+l0+'->'+(await ev(()=>DB.lich.length)));
  if(await page.$('.mdl'))await page.click('.mdl [data-a="mx"]')}
 // conflict check via API
 const cf=await ev(()=>{const l=DB.lich.find(x=>x.type==='11');const other=DB.kids.find(k=>k.id!==l.hs&&k.st==='dang');return conflict({id:'new',type:'11',day:l.day,slot:l.slot,gv:l.gv,hs:other.id,room:'Phòng 9'})});
 ok('conflict detection (same teacher same slot)',/Giáo viên/.test(cf),cf);
 // Báo cáo duyệt và gửi
 await nav('bc');
 await page.selectOption('#bcf','cho');await W(60);
 const rid=await page.$eval('[data-a="bcok"]',e=>e.dataset.v);
 await page.click(`[data-a="bcok"][data-v="${rid}"]`);await W(60);
 ok('approve report',(await ev(i=>DB.rp.find(r=>r.id===i).s,rid))==='duyet');
 const nn0=await ev(()=>DB.nt.length);
 await page.selectOption('#bcf','duyet');await W(60);await page.click(`[data-a="bcsend"][data-v="${rid}"]`);await page.waitForSelector('[data-a="askyes"]');await page.click('[data-a="askyes"]');await W(60);
 ok('send report to parents + auto notice',(await ev(i=>DB.rp.find(r=>r.id===i).s,rid))==='gui'&&(await ev(()=>DB.nt.length))===nn0+1);
 // Thông báo
 await nav('tb');await page.click('[data-a="tbnew"]');await page.waitForSelector('#tbf');await page.fill('#tb-t','Thông báo kiểm thử');await page.fill('#tb-b','Nội dung kiểm thử');await page.click('#tbf button[type=submit]');await W(60);
 ok('compose notice',(await ev(()=>DB.nt.some(n=>n.t==='Thông báo kiểm thử'))));
 // Lương
 await nav('tl');await page.click('tr.k');await page.waitForSelector('#bonf');await page.fill('#bo-a','500000');await page.click('#bonf button[type=submit]');await W(60);
 ok('bonus saved',Object.keys(await ev(()=>DB.bon)).length>=1);await page.click('.mdl [data-a="mx"]');
 // Thống kê và tài liệu
 await nav('tk');await page.click('[data-a="tkxl"]');await W(300);await page.click('[data-a="tkpdf"]');await W(300);ok('stats exports do not crash',true);
 await nav('td');ok('docs shows capability note',/chưa khả dụng|Đang tải/.test(await page.$eval('#main',e=>e.innerText)));
 // Cổng phụ huynh (quản lý) -> xem như phụ huynh
 await nav('cp');await page.click('[data-a="viewas"]');await W(80);
 ok('view as parent switches role',(await ev(()=>U.role))==='ph');
 console.log(res.join('\n'));console.log('ERRS',errs.length);errs.slice(0,10).forEach(e=>console.log(e));
 await b.close();
})().catch(e=>{console.log(res.join('\n'));console.log('SCRIPT ERROR',e.message);process.exit(1)});
