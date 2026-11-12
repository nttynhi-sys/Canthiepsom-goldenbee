/* Z33: Thực đơn và thời khóa biểu bán trú chỉ hiện với giáo viên đứng lớp bán trú, Quản lý, Trưởng Trung tâm (và Văn phòng, phụ huynh như cũ); giáo viên chỉ dạy 1-1 không thấy */
const { open, login } = require('./h.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 400)); } };
const navTxt = page => page.evaluate(() => [...document.querySelectorAll('.nav button')].map(b => b.dataset.v));
(async () => {
  const { b, page, errs } = await open();
  const ev = (f, a) => page.evaluate(f, a); const W = ms => page.waitForTimeout(ms || 120);
  // 1. giáo viên đứng lớp bán trú
  await login(page, 'gv');
  await ev(() => { const g = DB.groups[0]; grSet(g, grTs(g).concat(U.id)); render(); }); await W();
  ok('giáo viên đứng lớp bán trú thấy mục Thực đơn bán trú', (await navTxt(page)).includes('tn'), await navTxt(page));
  await ev(() => { go('lh'); S.lh = Object.assign(S.lh || {}, { tab: 'wk' }); render(); }); await W();
  let tabs = await ev(() => [...document.querySelectorAll('[data-a="lhtab"]')].map(e => e.textContent.trim()));
  ok('giáo viên bán trú thấy tab Thời khóa biểu bán trú', tabs.some(t => /Thời khóa biểu bán trú/.test(t)), tabs);
  // 2. giáo viên chỉ dạy 1-1 (không đứng lớp nào)
  await ev(() => { DB.groups.forEach(g => { if (grHas(g, U.id)) grSet(g, grTs(g).filter(i => i !== U.id)); }); go('tn'); render(); }); await W();
  ok('giáo viên chỉ dạy 1-1: không có mục Thực đơn trong menu', !(await navTxt(page)).includes('tn'), await navTxt(page));
  const view = await ev(() => ({ v: S.v, h: document.querySelector('main').textContent.slice(0, 200) }));
  ok('vào thẳng Thực đơn bị đưa về trang đầu, không hiện thực đơn', view.v !== 'tn' && !/Thực đơn bán trú/.test(view.h.slice(0, 60)), view);
  await ev(() => { go('lh'); S.lh = Object.assign(S.lh || {}, { tab: 'bt' }); render(); }); await W();
  tabs = await ev(() => [...document.querySelectorAll('[data-a="lhtab"]')].map(e => e.textContent.trim()));
  const mainTxt = await ev(() => document.querySelector('main').textContent);
  ok('giáo viên 1-1 không thấy tab Thời khóa biểu bán trú, tab cũ được đưa về Lịch 1-1', !tabs.some(t => /bán trú/.test(t)) && !/Thời khóa biểu lớp/.test(mainTxt), tabs);
  ok('lịch dạy của giáo viên 1-1 vẫn dùng được (tab Lịch 1-1 theo tuần)', tabs.some(t => /Lịch 1-1 theo tuần/.test(t)), tabs);
  ok('phần giới thiệu trang không nhắc thời khóa biểu bán trú với giáo viên 1-1', !/thời khóa biểu bán trú/i.test(await ev(() => document.querySelector('main .sub, main p').textContent)), '');
  // 3. các vai trò khác (mở trang mới cho từng vai trò)
  for (const role of ['ql', 'tt', 'vp', 'ph']) {
    const o = await open(); await login(o.page, role);
    ok(role + ' vẫn thấy Thực đơn bán trú', (await navTxt(o.page)).includes('tn'), await navTxt(o.page));
    if (role === 'ql') {
      await o.page.evaluate(() => { go('lh'); render(); }); await o.page.waitForTimeout(120);
      const t = await o.page.evaluate(() => [...document.querySelectorAll('[data-a="lhtab"]')].map(e => e.textContent.trim()));
      ok('Quản lý vẫn thấy tab Thời khóa biểu bán trú', t.some(x => /Thời khóa biểu bán trú/.test(x)), t);
    }
    errs.push(...o.errs); await o.b.close();
  }
  ok('không có lỗi script', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
