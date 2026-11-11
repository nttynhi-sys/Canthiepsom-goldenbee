/* Bộ "ADHD": 273 mục tiêu + 158 bài tập, 14 lĩnh vực ở bộ lọc, mục tiêu hiện tên bài tập cùng nhóm, không hiện trạng thái duyệt. */
const { open, login } = require('./h.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 400)); } };
(async () => {
  const { b, page, errs } = await open(); await login(page, 'gv');
  const r = await page.evaluate(() => {
    const ad = LIBI.filter(i => i.s === 'ad'), mt = ad.filter(i => !i.id.startsWith('ad:BT-')), bt = ad.filter(i => i.id.startsWith('ad:BT-'));
    const none = f => libFind(Object.assign({ dom: '', src: '', head: '', age: '', q: '' }, f)).length;
    const doms = LCHIPS.filter(d => /^ad\d+$/.test(d.id));
    const withBt = mt.filter(i => i.bt && i.bt.length).length;
    const samp = mt.find(i => i.bt && i.bt.length);
    return {
      mt: mt.length, bt: bt.length, doms: doms.length, domNames: doms.map(d => d.s),
      bySrc: none({ src: 'ad' }), byDom: none({ dom: 'ad1' }), kwAdhd: none({ src: 'ad', q: 'adhd' }),
      kwBai: none({ src: 'ad', q: 'bai tap' }) >= 158, withBt, mtNoBt: mt.filter(i => !(i.bt && i.bt.length)).map(i => i.t),
      age: none({ src: 'ad', age: '3' }) > 0,
      duyet: ad.some(i => /Chưa duyệt|Trạng thái duyệt|Ghi chú duyệt/.test(JSON.stringify(i))),
      sample: samp && { c: samp.c, bt: samp.bt.slice(0, 2) },
    };
  });
  console.log(JSON.stringify(r));
  ok('thêm đủ 273 mục tiêu và 158 bài tập', r.mt === 273 && r.bt === 158, r);
  ok('14 lĩnh vực ADHD có trong bộ lọc', r.doms === 14, r.domNames);
  ok('lọc bộ ADHD và một lĩnh vực có kết quả', r.bySrc === 431 && r.byDom > 0, r);
  ok('tìm bằng từ khóa "ADHD" và "bài tập"', r.kwAdhd === 431 && r.kwBai, r);
  ok('mục tiêu nêu tên bài tập cùng nhóm (chỉ nhóm "Tự nhận xét" không có bài tập)', r.withBt === 273 - 6 || r.mtNoBt.every(t => t === 'Tự nhận xét'), r);
  ok('lọc theo mốc tuổi 36–48 tháng có kết quả', r.age, r);
  ok('không hiện cột trạng thái duyệt', r.duyet === false, r);
  ok('không có lỗi trình duyệt', errs.length === 0, errs);
  await b.close();
  console.log(`\n${pass} đạt, ${fail} lỗi`); if (fail) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
