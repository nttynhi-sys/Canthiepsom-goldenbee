const {chromium}=require('playwright');
const URL='file:///tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/build/page-test.html';
async function open(o){o=o||{};
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:o.w||1366,height:o.h||900},deviceScaleFactor:o.dpr||1,colorScheme:o.dark?'dark':'light'});
 const ls=o.ls||process.env.LS;
 if(ls){const snap=require('fs').readFileSync(ls,'utf8');await ctx.addInitScript(([k,v])=>{try{if(!localStorage.getItem(k))localStorage.setItem(k,v)}catch(e){}},['gb_v2',snap])}
 const page=await ctx.newPage();const errs=[];
 page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_/.test(m.text()))errs.push('CONSOLE '+m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/,r=>r.abort());
 await page.goto(URL);await page.waitForSelector('.lg');
 return{b,page,errs}}
async function login(page,role){await page.click(`.roles [data-v="${role}"]`);await page.waitForSelector('.nav')}
module.exports={open,login,URL};
