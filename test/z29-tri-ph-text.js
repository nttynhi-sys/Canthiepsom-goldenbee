/* Cổng phụ huynh, Góc tri ân: bỏ câu "Những nội dung này chỉ được đăng khi gia đình đồng ý"; giữ phần còn lại. */
const { open, login } = require('./h.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 300)); } };
(async () => {
  const { b, page, errs } = await open();
  await login(page, 'ph');
  await page.click('.nav button[data-v="cp"]').catch(() => {});
  await page.waitForTimeout(600);
  await page.click('button[data-a="cptab"][data-v="tri"]').catch(() => {});
  await page.waitForTimeout(800);
  const txt = await page.evaluate(() => document.querySelector('#main') ? document.querySelector('#main').innerText : document.body.innerText);
  ok('Góc tri ân của phụ huynh đã mở', /Góc tri ân/.test(txt));
  ok('không còn câu "Những nội dung này chỉ được đăng khi gia đình đồng ý"', !/Những nội dung này chỉ được đăng khi gia đình đồng ý/.test(txt));
  ok('vẫn còn đoạn mở đầu về hình ảnh và lời nhắn của các gia đình', /Hình ảnh và lời nhắn của các gia đình/.test(txt));
  ok('vẫn còn lời nhắc không chụp màn hình', /Xin vui lòng không chụp màn hình/.test(txt));
  ok('không có lỗi trình duyệt', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e.message.slice(0, 300)); process.exit(1); });
