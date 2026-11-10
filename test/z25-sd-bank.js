/* Bộ "Rối loạn cảm giác – Tích hợp giác quan": 267 mục tiêu + 133 bài tập vào Ngân hàng mục tiêu.
   Kiểm tra: có trong bộ công cụ và lĩnh vực, tìm được bằng từ khóa không dấu, lọc theo mốc tuổi, không hiện trạng thái duyệt. */
const { open, login } = require('./h.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 400)); } };
(async () => {
  const { b, page, errs } = await open(); await login(page, 'gv');
  const r = await page.evaluate(() => {
    const sd = LIBI.filter(i => i.s === 'sd');
    const mt = sd.filter(i => !i.id.startsWith('sd:BT-')).length, bt = sd.filter(i => i.id.startsWith('sd:BT-')).length;
    const none = f => libFind(Object.assign({ dom: '', src: '', head: '', age: '', q: '' }, f)).length;
    return {
      total: sd.length, mt, bt,
      srcOk: LSRC.sd && LSRC.sd.n === 'Rối loạn cảm giác – Tích hợp giác quan',
      cuLast: Object.keys(LSRC).slice(-1)[0],
      bySrc: none({ src: 'sd' }),
      byDom: none({ dom: 'cgq' }),
      kwGiacQuan: none({ src: 'sd', q: 'giac quan' }),
      kwCamGiac: none({ src: 'sd', q: 'cam giac' }),
      kwBaiTap: none({ src: 'sd', q: 'bai tap' }),
      kwMoro: none({ src: 'sd', q: 'moro' }),
      age3: none({ src: 'sd', age: '3' }),
      duyetVisible: sd.some(i => /Chưa duyệt|Trạng thái duyệt/i.test(JSON.stringify(i))),
      sample: { c: LIBI.find(i => i.id === 'sd:BT-PX-01').a, m: LIBI.find(i => i.id === 'sd:BT-PX-01').m, g: LIBI.find(i => i.id === 'sd:PX-01').m },
    };
  });
  console.log(JSON.stringify(r));
  ok('thêm đủ 267 mục tiêu và 133 bài tập', r.mt === 267 && r.bt === 133, r);
  ok('bộ công cụ "Rối loạn cảm giác – Tích hợp giác quan" có trong danh sách (Cu vẫn cuối)', r.srcOk && r.cuLast === 'cu', r);
  ok('lọc theo bộ công cụ và lĩnh vực đều ra 400 mục', r.bySrc === 400 && r.byDom === 400, r);
  ok('tìm bằng từ khóa: "giác quan", "cảm giác", "bài tập", "Moro"', r.kwGiacQuan > 0 && r.kwCamGiac > 0 && r.kwBaiTap >= 133 && r.kwMoro > 0, r);
  ok('lọc theo mốc tuổi 36–48 tháng có kết quả', r.age3 > 0, r);
  ok('không hiện trạng thái duyệt cho người dùng', r.duyetVisible === false, r);
  ok('không có lỗi trình duyệt', errs.length === 0, errs);
  await b.close();
  console.log(`\n${pass} đạt, ${fail} lỗi`); if (fail) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
