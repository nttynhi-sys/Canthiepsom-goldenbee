/* Z31: Ngân hàng mục tiêu "Điều hòa cảm giác": mục để chọn là vấn đề của trẻ theo hệ giác quan (in đậm), bài tập nằm bên dưới; bộ lọc theo hệ giác quan */
const { open, login } = require('./h.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 400)); } };
(async () => {
  const { b, page, errs } = await open(); await login(page, 'ql');
  const r = await page.evaluate(() => {
    const si = LIBI.filter(i => i.s === 'si');
    const per = Object.fromEntries(['gq1','gq2','gq3','gq4','gq5','gq6','gq7','gq8'].map(d => [d, si.filter(i => i.d === d).length]));
    const keys = Object.keys(LSRC);
    const ids = new Set(si.map(i => i.id));
    const probs = [...new Set(si.map(i => i.n))];
    const ex = si.find(i => i.d === 'gq5' && i.n === 'Động tác vụng về, phối hợp kém');
    return {
      n: si.length, uniq: ids.size === si.length, per, keys, name: LSRC.si && LSRC.si.n,
      chips: LCHIPS.filter(c => /^gq\d$/.test(c.id)).map(c => c.s),
      noText: si.some(i => !i.n || !i.k || !i.bl || !i.bl.length),
      ageFree: si.every(i => i.m === -1),
      theoSach: si.some(i => /theo sách/i.test(JSON.stringify(i.ex) + i.o + i.n)),
      probs: probs.length, totalEx: si.reduce((a, i) => a + i.bl.length, 0),
      tiendinh: libFind({ dom: 'gq1', src: 'si', q: '', head: '', age: '' }).length,
      kwEx: libFind({ src: 'si', q: 'ghe xoay nguoc', dom: '', head: '', age: '' }).length,
      kwProb: libFind({ src: 'si', q: 'vung ve', dom: '', head: '', age: '' }).length,
      sample: ex ? { id: ex.id, c: ex.c, t: ex.t, hasChair: ex.bl.some(x => /ghế xoay ngược/.test(x)) } : null,
    };
  });
  console.log(JSON.stringify(r).slice(0, 500));
  ok('78 mục để chọn (vấn đề của trẻ trong từng hệ giác quan), mã không trùng', r.n === 78 && r.uniq, r);
  ok('bộ Điều hòa cảm giác (si) đứng trước "Trung tâm tự thêm"', r.name === 'Điều hòa cảm giác' && r.keys.indexOf('si') === r.keys.indexOf('cu') - 1, r.keys);
  ok('8 lĩnh vực theo hệ giác quan có trong bộ lọc', r.chips.length === 8, r.chips);
  ok('số mục mỗi hệ giác quan: 10, 10, 11, 11, 11, 10, 10, 5', JSON.stringify(Object.values(r.per)) === JSON.stringify([10, 10, 11, 11, 11, 10, 10, 5]), r.per);
  ok('đủ 720 bài tập của sách nằm dưới các mục (không mất bài nào), mỗi mục có bài tập', r.totalEx === 720 && !r.noText, { totalEx: r.totalEx, noText: r.noText });
  ok('13 vấn đề của trẻ trong sách đều có mặt', r.probs === 13, r.probs);
  ok('không còn chữ "(theo sách)" và không có độ tuổi', !r.theoSach && r.ageFree, r);
  ok('mục "Động tác vụng về, phối hợp kém" của hệ Tự cảm thụ bản thân chứa bài "ghế xoay ngược"', r.sample && r.sample.hasChair && /bài tập/.test(r.sample.t), r.sample);
  ok('tìm theo tên vấn đề và theo nội dung bài tập đều ra kết quả', r.kwEx > 0 && r.kwProb > 0, { kwEx: r.kwEx, kwProb: r.kwProb });
  ok('lọc hệ "Tiền đình" cho 10 mục', r.tiendinh === 10, r.tiendinh);

  await page.click('.nav button:has-text("Ngân hàng mục tiêu")'); await page.waitForTimeout(150);
  await page.evaluate(() => { Object.assign(S.hs.lib, { dom: 'gq5', src: 'si', head: '', age: '', q: 'vung ve' }); S.pg.lib = 1; render(); });
  await page.waitForTimeout(150);
  const ui = await page.evaluate(() => {
    const g = document.querySelector('.gi'); if (!g) return null;
    const n = g.querySelector('.gi-n'); const ol = g.querySelector('ol.bl'); const lis = g.querySelectorAll('li');
    return { title: n.textContent.trim(), bold: parseInt(getComputedStyle(n).fontWeight, 10) >= 600, hasOl: !!ol, lis: lis.length, head: [...g.querySelectorAll('b')].map(b => b.textContent).filter(t => /Bài tập/.test(t))[0], txt: g.textContent };
  });
  ok('giao diện: tiêu đề in đậm là vấn đề của trẻ, bài tập liệt kê bên dưới (3 bài đầu + xem thêm)', ui && ui.title === 'Động tác vụng về, phối hợp kém' && ui.bold && ui.hasOl && ui.lis > 3 && /Bài tập \(\d+\)/.test(ui.head || ''), ui && { title: ui.title, bold: ui.bold, lis: ui.lis, head: ui.head });
  ok('giao diện: không còn "Áp dụng cho", "Hệ giác quan / nhóm (theo sách)" trong thẻ', ui && !/Áp dụng cho|theo sách/.test(ui.txt), ui && ui.txt.slice(0, 200));
  await page.evaluate(() => { Object.assign(S.hs.lib, { dom: '', src: 'si', head: '', age: '', q: '' }); S.pg.lib = 1; render(); });
  await page.waitForTimeout(120);
  const cnt = await page.evaluate(() => { const e = document.querySelector('.acts .sm b'); return e ? e.textContent : null; });
  ok('lọc bộ Điều hòa cảm giác hiển thị 78 mục', cnt === '78', cnt);
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(120);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  ok('màn hình 390px không tràn ngang', !ov);
  await page.setViewportSize({ width: 1280, height: 900 });
  ok('không có lỗi script', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
