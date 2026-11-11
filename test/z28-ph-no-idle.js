/* Cổng phụ huynh: không liệt kê lĩnh vực chưa luyện; lịch học không ghi giờ 1-1 chung. */
const { open, login } = require('./h.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 300)); } };
(async () => {
  const { b, page, errs } = await open();
  await login(page, 'ph');
  await page.click('.nav button[data-v="cp"]').catch(() => {});
  await page.waitForTimeout(800);
  const txt = await page.evaluate(() => document.body.innerText);
  ok('không còn dòng "Chưa luyện trong kỳ"', !/Chưa luyện trong kỳ/.test(txt));
  ok('không còn danh sách lĩnh vực chưa luyện trong biểu đồ', !/Chưa luyện trong kỳ:/.test(txt));
  const bars = await page.$$eval('.db-r', e => e.length);
  ok('biểu đồ lĩnh vực vẫn hiển thị các dòng có số liệu', bars >= 1, bars);
  await page.click('.nav button[data-v="lh"]').catch(() => {});
  await page.waitForTimeout(800);
  const lh = await page.evaluate(() => document.body.innerText);
  ok('lịch học của bé không còn câu giờ 1-1 07:15–20:00 và 50 phút', !/Can thiệp 1-1 nhận bé từ/.test(lh) && !/mỗi ca 50 phút/.test(lh));
  ok('lịch học của bé vẫn có hướng dẫn báo nghỉ hoặc đổi giờ', /Khi cần nghỉ hoặc đổi giờ/.test(lh) || !/Thời khóa biểu của/.test(lh), lh.slice(0, 200));
  ok('không có lỗi trình duyệt', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e.message.slice(0, 300)); process.exit(1); });
