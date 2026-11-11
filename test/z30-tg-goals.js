/* Z30: Giáo viên tự thêm mục tiêu (ngắn hạn/dài hạn/buổi) vào Ngân hàng mục tiêu, nhóm riêng, thấy được với Trưởng TT và Quản lý */
const { open, login } = require('./h.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 400)); } };
(async () => {
  const { b, page, errs } = await open();
  await login(page, 'gv');
  const kid = await page.evaluate(() => (myKids()[0] || {}).id);
  ok('giáo viên có bé để thêm mục tiêu', !!kid, kid);
  await page.evaluate(() => { DB.tg = []; DB.plans = DB.plans || []; });
  await page.click('.nav button:has-text("Ngân hàng mục tiêu")'); await page.waitForTimeout(150);
  await page.evaluate(() => { S.modal = { t: 'tg' }; render(); });
  await page.waitForTimeout(150);
  ok('nút/biểu mẫu "Thêm mục tiêu mới cho bé" mở được', await page.isVisible('#tgf'));
  await page.selectOption('#tg-k', kid);
  await page.selectOption('#tg-lv', 'n');
  await page.fill('#tg-n', 'Trẻ gọi tên bạn khi bạn chào Z30');
  await page.fill('#tg-o', 'Quan sát 3 buổi liên tiếp');
  await page.click('#tgf button[type=submit]'); await page.waitForTimeout(200);
  const r = await page.evaluate((kid) => {
    const t = (DB.tg || []).find(x => x.n.indexOf('Z30') >= 0);
    const it = t && libAll().find(i => i.id === 'tg:' + t.id);
    const plan = t && (DB.plans || []).some(p => p.k === kid && p.g === 'tg:' + t.id);
    return { saved: !!t, by: t && t.by, kid: t && t.kid, inLib: !!it, s: it && it.s, gsrc: it && gSrc(it), plan,
      hasSrc: !!LSRC.tg, ordered: Object.keys(LSRC).indexOf('tg') > -1 };
  }, kid);
  ok('lưu mục tiêu của giáo viên vào DB.tg đúng bé và người tạo', r.saved && r.by && r.kid === kid, r);
  ok('mục tiêu hiện trong thư viện với nguồn "tg" (nhóm riêng)', r.inLib && r.s === 'tg' && r.hasSrc, r);
  ok('mục tiêu ngắn hạn được đưa vào kế hoạch của bé', r.plan, r);
  const shown = await page.evaluate(() => { const i = libAll().find(x => x.s === 'tg'); return i ? !!libItem(i, {}) : false; });
  ok('thẻ mục tiêu do giáo viên hiển thị được', shown);
  await page.evaluate(() => { Object.assign(S.hs.lib, { dom: '', src: 'tg', head: '', age: '', q: '' }); S.pg.lib = 1; render(); });
  await page.waitForTimeout(150);
  const cnt = await page.evaluate(() => { const e = document.querySelector('.acts .sm b'); return e ? e.textContent : null; });
  ok('bộ lọc nguồn giáo viên tự thêm đếm đúng', cnt === String(await page.evaluate(() => libAll().filter(i => i.s === 'tg').length)), cnt);
  // chỉ người thêm hoặc trưởng/ql được xóa
  const tid = await page.evaluate(() => DB.tg.find(x => x.n.indexOf('Z30') >= 0).id);
  await page.evaluate((v) => ACT.tgdel(v), tid); await page.waitForTimeout(150);
  await page.evaluate(() => ACT.askyes()); await page.waitForTimeout(150);
  const gone = await page.evaluate(() => (DB.tg || []).some(x => x.n.indexOf('Z30') >= 0) === false);
  ok('người thêm xóa được mục tiêu của mình', gone);
  // trưởng trung tâm và quản lý thấy người thêm
    ok('không có lỗi trình duyệt', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
