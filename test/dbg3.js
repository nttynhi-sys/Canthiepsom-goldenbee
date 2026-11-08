const {open,login}=require('./h.js');
(async()=>{
 const {b,page,errs}=await open({w:1366,h:900});
 await login(page,'gv');
 const r=await page.evaluate(()=>{const id=U.id;return{id,WD,TODAY,dowWD:dow(WD),
  myLich:DB.lich.filter(l=>l.gv===id&&l.type==='11').map(l=>l.day+'@'+l.slot).sort(),
  dl:dayList(WD).filter(s=>s.gv===id).map(s=>s.label),
  g:DB.groups.map(g=>g.n+':'+g.gv+'/'+g.tg),
  allDays:[1,2,3,4,5,6].map(d=>DB.lich.filter(l=>l.type==='11'&&l.day===d).length)}});
 console.log(JSON.stringify(r));
 await b.close();
})();
