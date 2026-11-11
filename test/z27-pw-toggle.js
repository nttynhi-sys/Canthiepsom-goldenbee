/* Nút "Hiển thị / Ẩn" mật khẩu: có ở form đăng nhập, bấm đổi kiểu ô, và không đổi giá trị đã nhập. */
const { open, login } = require('./h.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 300)); } };
(async () => {
  const { b, page, errs } = await open();
  await page.waitForSelector('#lg-p', { timeout: 15000 }).catch(() => {});
  const has = await page.$('#lg-p');
  ok('form đăng nhập có ô mật khẩu', !!has);
  if (has) {
    await page.fill('#lg-p', 'Abc12345');
    const btn = await page.$('#lg-p ~ .pw-eye, .pw-wrap .pw-eye');
    ok('có nút "Hiển thị" cạnh ô mật khẩu', !!btn);
    const t0 = await page.$eval('#lg-p', e => e.type);
    ok('mặc định ẩn mật khẩu (type=password)', t0 === 'password', t0);
    await page.click('.pw-wrap .pw-eye');
    const t1 = await page.$eval('#lg-p', e => e.type);
    const label = await page.$eval('.pw-wrap .pw-eye', e => e.textContent);
    ok('bấm nút: hiện mật khẩu (type=text) và đổi nhãn thành "Ẩn"', t1 === 'text' && label === 'Ẩn', { t1, label });
    ok('giá trị đã nhập không đổi khi hiện', (await page.$eval('#lg-p', e => e.value)) === 'Abc12345');
    await page.click('.pw-wrap .pw-eye');
    const t2 = await page.$eval('#lg-p', e => e.type);
    ok('bấm lại: ẩn mật khẩu', t2 === 'password', t2);
  }
  const all = await page.$$eval('input[type=password]', els => els.map(e => !!(e.parentNode && e.parentNode.classList.contains('pw-wrap') && e.parentNode.querySelector('.pw-eye'))));
  ok('mọi ô mật khẩu đang hiển thị đều có nút hiện/ẩn', all.every(Boolean), all);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/pw-login.png' });
  ok('không có lỗi trình duyệt', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e.message.slice(0, 300)); process.exit(1); });
