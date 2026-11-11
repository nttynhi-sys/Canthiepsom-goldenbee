/* Z31: Ngân hàng mục tiêu "Điều hòa cảm giác" (bài tập theo 8 lĩnh vực hệ giác quan), bộ lọc theo hệ giác quan */
const { open, login } = require('./h.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 400)); } };
(async () => {
  const { b, page, errs } = await open(); await login(page, 'ql');
  const r = await page.evaluate(() => {
    const si = LIBI.filter(i => i.s === 'si');
    const per = Object.fromEntries(['gq1','gq2','gq3','gq4','gq5','gq6','gq7','gq8'].map(d => [d, si.filter(i => i.d === d).length]));
    const keys = Object.keys(LSRC);
    const ids = new Set(si.map(i => i.id));
    return {
      n: si.length, uniq: ids.size === si.length, per, keys, name: LSRC.si && LSRC.si.n,
      chips: LCHIPS.filter(c => /^gq\d$/.test(c.id)).map(c => c.s),
      noDup: si.every(i => i.n && i.t && i.k),
      ageFree: si.every(i => i.m === -1),
      duyet: si.some(i => /Chưa duyệt|Trạng thái duyệt/.test(JSON.stringify(i))),
      tiendinh: libFind({ dom: 'gq1', src: 'si', q: '', head: '', age: '' }).length,
      kw: libFind({ src: 'si', q: 'tiền đình', dom: '', head: '', age: '' }).length,
      kw2: libFind({ src: 'si', q: 'dieu hoa', dom: '', head: '', age: '' }).length,
      multiVP: si.filter(i => /Vấn đề của trẻ/.test(JSON.stringify(i.ex))).length,
    };
  });
  console.log(JSON.stringify(r).slice(0, 600));
  ok('có 673 mục bài tập (720 dòng gộp các nội dung giống hệt trong cùng lĩnh vực)', r.n === 673, r.n);
  ok('mã mục không trùng', r.uniq, r);
  ok('bộ Điều hòa cảm giác (si) đứng trước "Trung tâm tự thêm"', r.name === 'Điều hòa cảm giác' && r.keys.indexOf('si') === r.keys.indexOf('cu') - 1, r.keys);
  ok('8 lĩnh vực theo hệ giác quan có trong bộ lọc', r.chips.length === 8, r.chips);
  ok('số mục mỗi hệ giác quan khớp dữ liệu', r.per.gq1 === 29 && r.per.gq2 === 81 && r.per.gq3 === 63 && r.per.gq4 === 58 && r.per.gq5 === 117 && r.per.gq6 === 41 && r.per.gq7 === 170 && r.per.gq8 === 114, r.per);
  ok('mọi mục có nội dung, khóa tìm, không có tuổi', r.noDup && r.ageFree, r);
  ok('không hiện trạng thái duyệt', !r.duyet, r);
  ok('lọc hệ "Tiền đình" và tìm từ khóa có kết quả', r.tiendinh === 29 && r.kw > 0 && r.kw2 === 673, r);

  await page.click('.nav button:has-text("Ngân hàng mục tiêu")'); await page.waitForTimeout(150);
  await page.evaluate(() => { Object.assign(S.hs.lib, { dom: 'gq1', src: 'si', head: '', age: '', q: '' }); S.pg.lib = 1; render(); });
  await page.waitForTimeout(150);
  const cnt = await page.evaluate(() => { const e = document.querySelector('.acts .sm b'); return e ? e.textContent : null; });
  ok('giao diện: lọc Tiền đình hiển thị 29 mục', cnt === '29', cnt);
  await page.evaluate(() => { Object.assign(S.hs.lib, { dom: '', src: 'si', head: '', age: '', q: '' }); S.pg.lib = 1; render(); });
  await page.waitForTimeout(120);
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(120);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  ok('màn hình 390px không tràn ngang', !ov);
  await page.setViewportSize({ width: 1280, height: 900 });
  ok('không có lỗi script', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
