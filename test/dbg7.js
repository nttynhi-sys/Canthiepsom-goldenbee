const {open}=require('./h.js');
(async()=>{const {b,page}=await open();
 const r=await page.evaluate(()=>{const by={};DB.lich.filter(l=>l.type==='11').forEach(l=>{const k=l.hs+'|'+l.day;(by[k]=by[k]||[]).push(l.slot+'/'+l.gv)});
  const multi=Object.entries(by).filter(([k,v])=>v.length>1);
  return{n:DB.lich.filter(l=>l.type==='11').length,multi:multi.length,sample:multi.slice(0,5),kids:DB.kids.filter(k=>k.m11>0&&k.st==='dang').length}});
 console.log(JSON.stringify(r));await b.close()})();
