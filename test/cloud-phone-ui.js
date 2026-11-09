/* Kiểm thử giao diện đầu-cuối: đăng nhập bằng email hoặc số điện thoại, cấp tài khoản nhân viên và phụ huynh, cổng phụ huynh.
   Chạy các hàm api/*.js thật và máy chủ Supabase giả lập (test/emu.js). */
const { chromium } = require('playwright'); const path = require('path');
const { makeEmu } = require('./emu.js'); const L = require('../api/_lib.js');
const URL = 'file://' + path.resolve(__dirname, '../src/build/page-test.html') + '?cloud';
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : x); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const E = makeEmu(); await E.listen(); E.addUser('tt@gb.vn', 'ttpass123', { role: 'tt', full_name: 'Trưởng TT' });
  const b = await chromium.launch(), errs = [];
  async function newPage(rest) {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true }); const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
    page.sb = []; page.on('request', r => { if (/supabase\.co/.test(r.url())) page.sb.push(r.method() + ' ' + new globalThis.URL(r.url()).pathname); });
    await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
    await ctx.addInitScript(() => { window.GB_API = 'https://gb.test'; });
    await E.attach(page); await E.attachApi(page, 'https://gb.test'); await page.goto(URL); return { ctx, page };
  }
  const login = async (page, e, p) => { await page.waitForSelector('#login'); await page.fill('#lg-e', e); await page.fill('#lg-p', p); await page.click('#login button[type=submit]'); };
  const errOf = async page => { await page.waitForSelector('.err:not(:empty)'); return page.textContent('.err'); };

  /* ---- A. Màn hình đăng nhập ---- */
  let { ctx, page } = await newPage();
  ok('Ô đăng nhập nhận email hoặc số điện thoại', (await page.textContent('label[for=lg-e]')) === 'Email hoặc số điện thoại' && (await page.getAttribute('#lg-e', 'type')) === 'text');
  const inputs = ['0901234567', '0901 234 567', '+84 901 234 567', '84901234567', '901234567', '090-123-4567', '02363123456', '+1 415 555 2671', 'abc', '0901', '', '0084901234567'];
  const same = await page.evaluate(i => i.map(x => telNorm(x)), inputs);
  ok('Chuẩn hóa số điện thoại ở trình duyệt giống hệt ở máy chủ', same.every((v, i) => v === L.telNorm(inputs[i])), JSON.stringify(same));
  await login(page, 'abc', 'x'); ok('Nhập sai định dạng: báo hãy nhập email hoặc số điện thoại hợp lệ', /hợp lệ/.test(await errOf(page)));
  await login(page, '0999000111', 'sai12345'); ok('Số điện thoại chưa có tài khoản: báo sai thông tin như khi sai mật khẩu', /Email, số điện thoại hoặc mật khẩu chưa đúng/.test(await errOf(page)));
  await login(page, 'tt@gb.vn', 'sai12345'); ok('Sai mật khẩu: báo lỗi tiếng Việt', /chưa đúng/.test(await errOf(page)));
  await login(page, ' TT@GB.VN ', 'ttpass123'); await page.waitForSelector('[data-a="csetup"]'); await page.click('[data-v="demo"]'); await page.waitForSelector('.nav'); await sleep(1500);
  ok('Trưởng Trung tâm đăng nhập bằng email (viết hoa, có khoảng trắng)', (await page.evaluate(() => U.role)) === 'tt');

  /* ---- B. Chuẩn bị dữ liệu: giáo viên chỉ có SĐT, phụ huynh chỉ có SĐT, phụ huynh nhiều bé ---- */
  const prep = await page.evaluate(() => {
    const gv = DB.staff.find(s => s.role === 'gv' && s.st === 'dang'); gv.em = ''; gv.ph = '0901 234 567';
    const g2 = DB.staff.filter(s => s.role === 'gv' && s.st === 'dang')[1]; g2.ph = '0902 222 333';   /* giáo viên có cả email và SĐT */
    const ks = DB.kids.filter(k => k.st === 'dang'); const tel = ks[0]; tel.pe = ''; tel.pp = '0933 111 222';
    const sib = ks[1]; sib.pe = ks[2].pe; sib.pn = ks[2].pn; sib.pp = '0944 555 666';   /* hai bé cùng email */
    const one = ks.find(k => k.id !== tel.id && k.id !== sib.id && k.id !== ks[2].id && mkCands(k.id).length > 0);
    return { gv: gv.id, gvName: gv.n, g2: g2.id, g2em: g2.em, tel: tel.id, telName: tel.n, sib: [sib.id, ks[2].id], sibEm: ks[2].pe, one: one && one.id, oneEm: one && one.pe, n: DB.kids.length };
  });
  await page.evaluate(() => { render(); }); await sleep(1500);
  ok('Hồ sơ nhân sự (không email) đã lưu lên máy chủ', E.recs.get('staff|' + prep.gv).data.em === '' && E.recs.get('staff|' + prep.gv).data.ph === '0901 234 567');

  /* ---- C. Cấp tài khoản nhân viên từ hồ sơ ---- */
  await page.evaluate(id => { S.modal = { t: 'nv', id }; render(); }, prep.gv); await sleep(300);
  const mt = await page.textContent('.mdc');
  ok('Hồ sơ nhân sự chỉ có SĐT: hiện hướng dẫn cấp tài khoản theo số điện thoại', /Chưa có tài khoản cho số điện thoại/.test(mt) && /email hoặc số điện thoại/.test(mt), mt.slice(-300));
  await page.fill('#acc-pw', 'giaovien123'); await page.click('#accnew button[type=submit]'); await sleep(1500);
  const pg = E.profiles.find(p => p.staff_id === prep.gv);
  ok('Cấp tài khoản giáo viên chỉ có SĐT thành công', pg && pg.role === 'gv' && pg.phone === '84901234567', JSON.stringify(E.profiles.map(p => p.staff_id)));
  ok('Hiện mật khẩu vừa đặt một lần', /giaovien123/.test(await page.textContent('.mdc')));
  ok('Sau khi cấp: hồ sơ hiện đã có tài khoản, đăng nhập bằng số điện thoại', /Đã có tài khoản · đăng nhập bằng số điện thoại/.test(await page.textContent('.mdc')));
  /* giáo viên có cả email và SĐT */
  await page.evaluate(id => { S.modal = { t: 'nv', id }; render(); }, prep.g2); await sleep(300);
  await page.fill('#acc-pw', 'giaovien456'); await page.click('#accnew button[type=submit]'); await sleep(1500);
  ok('Cấp tài khoản giáo viên có cả email và SĐT', E.profiles.some(p => p.staff_id === prep.g2 && p.phone === '84902222333'));
  await page.evaluate(() => { S.modal = null; go('ns'); render(); }); await sleep(300);
  ok('Danh sách nhân sự có cột Tài khoản với trạng thái Đã cấp', /Đã cấp/.test(await page.textContent('#main')));

  /* ---- D. Cổng phụ huynh trong giao diện Trưởng Trung tâm: cấp một tài khoản, rồi hàng loạt ---- */
  await page.evaluate(() => { go('cp'); render(); }); await sleep(500);
  const cpHtml = await page.textContent('#main');
  ok('Danh sách phụ huynh có cột Tài khoản và nút cấp hàng loạt', /Cấp tài khoản cho phụ huynh chưa có/.test(cpHtml) && /Chưa cấp/.test(cpHtml));
  ok('Phụ huynh chỉ có SĐT hiện được (đăng nhập bằng SĐT)', cpHtml.includes('0933 111 222'));
  await page.evaluate(k => { S.modal = { t: 'phacc', key: 'tel:84933111222' }; render(); }, 0); await sleep(300);
  ok('Hộp thoại tài khoản phụ huynh hiện tên bé và cách đăng nhập', /số điện thoại 0933 111 222/.test(await page.textContent('.mdc')) && (await page.textContent('.mdc')).includes(prep.telName));
  await page.fill('#acc-pw', 'phuhuynh111'); await page.click('#phnew button[type=submit]'); await sleep(1500);
  ok('Cấp riêng cho phụ huynh chỉ có SĐT', E.profiles.some(p => p.staff_id === 'ph|tel:84933111222' && p.role === 'ph'));
  await page.evaluate(() => { S.modal = null; render(); });
  const total = await page.evaluate(() => phGroups().filter(p => p.key && !phAcc(p.key) && p.ks.some(k => k.st === 'dang')).length);
  await page.click('[data-a="phbulk"]'); await page.waitForSelector('[data-a="askyes"]'); await page.click('[data-a="askyes"]');
  await page.waitForFunction(() => S.phBulk && !S.phBulk.run && S.phBulk.rows.length > 0, null, { timeout: 120000 });
  const B = await page.evaluate(() => S.phBulk.rows);
  ok('Cấp hàng loạt: tất cả thành công', B.length === total && B.every(r => r.ok), JSON.stringify(B.filter(r => !r.ok).slice(0, 3)) + ' ' + B.length + '/' + total);
  ok('Cấp hàng loạt: mỗi phụ huynh một mật khẩu riêng, đủ mạnh', new Set(B.map(r => r.pw)).size === B.length && B.every(r => r.pw.length === 10));
  ok('Hai bé cùng email dùng chung một tài khoản', E.profiles.filter(p => p.staff_id === 'ph|' + prep.sibEm).length === 1 && B.filter(r => r.login === prep.sibEm).length === 1);
  ok('Hộp kết quả có nút tải danh sách mật khẩu', !!(await page.$('[data-a="phbulkxl"]')) && /Mật khẩu chỉ có trong danh sách tải về/.test(await page.textContent('#main')));
  await page.evaluate(() => { window.__x = null; exportXLSX = async (n, sh) => { window.__x = { n, sh }; }; });   /* thư viện Excel tải từ mạng, không có trong môi trường thử */
  await page.click('[data-a="phbulkxl"]'); const X = await page.evaluate(() => window.__x);
  ok('Tải danh sách mật khẩu: tên tệp và đủ dòng, có mật khẩu và cách đăng nhập', X && /^tai-khoan-phu-huynh-.*\.xlsx$/.test(X.n) && X.sh[0].rows.length === B.length + 1 && X.sh[0].rows[0].join() === 'Phụ huynh,Các bé,Đăng nhập bằng,Mật khẩu ban đầu,Kết quả' && X.sh[0].rows.slice(1).every((r, i) => r[3] === B[i].pw && r[2] === B[i].login), X && X.n);
  ok('Cấp lại hàng loạt khi đã đủ: báo không còn ai', await page.evaluate(() => { ACT.phbulk(); return !S.modal || S.modal.t !== 'ask'; }));
  await page.waitForFunction(() => true); await sleep(1500);
  ok('Máy chủ không để mật khẩu trong dữ liệu ứng dụng', !JSON.stringify([...E.recs.values()]).includes(B[0].pw));
  await page.click('[data-a="logout"]').catch(() => page.evaluate(() => ACT.logout())); await page.waitForSelector('#login'); await ctx.close();

  /* ---- E. Giáo viên đăng nhập bằng số điện thoại (không có email) ---- */
  ({ ctx, page } = await newPage()); await login(page, '0901234567', 'giaovien123'); await page.waitForSelector('.nav', { timeout: 30000 });
  const g = await page.evaluate(() => ({ role: U.role, id: U.id, pay: DB.staff.find(s => s.id === U.id).pay.base + DB.staff.find(s => s.id === U.id).pay.rate, others: DB.staff.filter(s => s.id !== U.id).every(s => !s.pay.base && !s.pay.rate), lg: DB.lg.length, cfgm: DB.cfg.p11 }));
  ok('Giáo viên chỉ có SĐT đăng nhập vào đúng hồ sơ nhân sự của mình', g.role === 'gv' && g.id === prep.gv, JSON.stringify(g));
  ok('Giáo viên đăng nhập bằng SĐT đọc được lương của mình (theo mã nhân viên), không thấy lương người khác hay học phí', g.pay > 0 && g.others && g.lg === 0 && g.cfgm > 0, JSON.stringify(g));
  await page.evaluate(() => ACT.logout()); await page.waitForSelector('#login');
  await login(page, '+84 902 222 333', 'giaovien456'); await page.waitForSelector('.nav', { timeout: 30000 });
  ok('Giáo viên có email và SĐT: đăng nhập bằng SĐT dạng +84', (await page.evaluate(() => U.id)) === prep.g2);
  await page.evaluate(() => ACT.logout()); await page.waitForSelector('#login');
  await login(page, prep.g2em, 'giaovien456'); await page.waitForSelector('.nav', { timeout: 30000 });
  ok('Cùng giáo viên đó đăng nhập bằng email cũng được', (await page.evaluate(() => U.id)) === prep.g2);
  await ctx.close();

  /* ---- F. Phụ huynh đăng nhập bằng email, bằng SĐT ---- */
  const pwOf = k => (B.find(r => r.login === k) || {}).pw;
  ({ ctx, page } = await newPage()); await login(page, prep.sibEm, pwOf(prep.sibEm)); await page.waitForSelector('.nav', { timeout: 30000 });
  const pa = await page.evaluate(sib => ({ role: U.role, kids: DB.kids.map(k => k.id).sort(), n: DB.kids.length, lg: DB.lg.map(e => e.hs).filter((v, i, a) => a.indexOf(v) === i).sort(), staffEm: DB.staff.some(s => s.em || s.ph), v: S.v, nav: [...document.querySelectorAll('.nav [data-a=nav]')].map(x => x.dataset.v), sess: DB.sess.every(s => sib.includes(s.k)), name: U.name }), prep.sib);
  ok('Phụ huynh đăng nhập bằng email vào cổng phụ huynh', pa.role === 'ph' && pa.v === 'cp', JSON.stringify(pa));
  ok('Phụ huynh chỉ có dữ liệu của các bé của mình (2 bé cùng email)', pa.n === 2 && pa.kids.join() === prep.sib.slice().sort().join() && pa.sess);
  ok('Phụ huynh không có email, điện thoại của nhân viên; sổ học phí chỉ của bé mình', !pa.staffEm && pa.lg.every(h => prep.sib.includes(h)));
  ok('Phụ huynh chỉ có các mục của phụ huynh', pa.nav.every(v => ['cp', 'lh', 'tn', 'hb', 'hp', 'tb'].includes(v)) && pa.nav.length >= 4, pa.nav.join());
  const views = []; for (const v of ['cp', 'lh', 'tn', 'hb', 'hp', 'tb']) { await page.evaluate(v => { go(v); render(); }, v); await sleep(120); views.push((await page.textContent('#main')).length); }
  ok('Phụ huynh mở được mọi mục không lỗi', views.every(n => n > 80), views.join());
  for (const t of ['tq', 'tb', 'ch', 'bc']) { await page.evaluate(t => { go('cp'); S.cp = Object.assign(S.cp || {}, { tab: t }); render(); }, t); await sleep(100); }
  ok('Các thẻ Tổng quan, Tiến bộ, Chuyên cần và học phí, Báo cáo mở không lỗi', errs.length === 0, errs.join(' | '));
  ok('Phụ huynh không bao giờ đọc thẳng bảng dữ liệu', !page.sb.some(l => /\/rest\/v1\/(records|money_records)/.test(l)), page.sb.join(','));
  await page.evaluate(() => ACT.logout()); await page.waitForSelector('#login'); await ctx.close();

  ({ ctx, page } = await newPage()); await login(page, '0933 111 222', 'phuhuynh111'); await page.waitForSelector('.nav', { timeout: 30000 });
  const pt = await page.evaluate(() => ({ role: U.role, kids: DB.kids.map(k => k.n), pkey: U.pkey, em: U.em }));
  ok('Phụ huynh chỉ có SĐT đăng nhập bằng số điện thoại', pt.role === 'ph' && pt.kids.length === 1 && pt.kids[0] === prep.telName && pt.pkey === 'tel:84933111222', JSON.stringify(pt));
  ok('Hộp chào dùng tên phụ huynh', /Xin chào/.test(await page.textContent('#main')));
  await ctx.close();

  /* ---- G. Học bù do phụ huynh tạo: lưu qua cổng, nhân viên thấy ---- */
  if (prep.one) {
    ({ ctx, page } = await newPage()); await login(page, prep.oneEm, pwOf(prep.oneEm)); await page.waitForSelector('.nav', { timeout: 30000 });
    const mkc = await page.evaluate(k => { const c = mkCands(k); return c.length ? { d: c[0].d, sid: c[0].sid } : null; }, prep.one);
    ok('Phụ huynh thấy buổi nghỉ có thể học bù', !!mkc);
    const before = E.recs.size;
    if (mkc) {
      await page.evaluate(([k, d, sid]) => { mkMake(k, d, sid, 'Xin học bù'); save(); render(); }, [prep.one, mkc.d, mkc.sid]); await sleep(1800);
      const row = [...E.recs.values()].find(r => r.collection === 'mk' && r.data.hs === prep.one && r.data.by === 'ph');
      ok('Yêu cầu học bù của phụ huynh được lưu lên máy chủ qua cổng', !!row && row.data.why === 'Xin học bù', E.apiLog && E.apiLog.slice(-4).join(','));
      ok('Chỉ ghi đúng một dòng yêu cầu học bù', E.recs.size === before + 1, before + ' → ' + E.recs.size);
      ok('Trạng thái lưu của phụ huynh là Đã lưu', (await page.evaluate(() => CLD.st)) === 'ok');
      /* phụ huynh thử sửa dữ liệu không được phép (giả lập mã độc trong trình duyệt) */
      const evil = await page.evaluate(async () => { const r = await phCall({ action: 'put', rows: [{ collection: 'kids', id: DB.kids[0].id, data: { n: 'bị sửa' } }] }); return r.status; });
      ok('Ghi vào hồ sơ trẻ bằng cổng phụ huynh bị từ chối (403)', evil === 403 && E.recs.get('kids|' + prep.one).data.n !== 'bị sửa');
      const evil2 = await page.evaluate(async () => { const r = await fetch('https://bqvwibipmzyrkrwlfoqf.supabase.co/rest/v1/records?select=*', { headers: { apikey: SB.key, Authorization: 'Bearer ' + CLD.ss.at } }); return (await r.json()).length; });
      ok('Đọc thẳng bảng dữ liệu bằng mã của phụ huynh: 0 dòng (RLS)', evil2 === 0);
      /* đánh dấu đã đọc thông báo */
      await page.evaluate(() => { const n = noticesFor()[0]; if (n) { DB.rd[rdKey(n)] = TODAY; save(); } }); await sleep(1500);
      ok('Đánh dấu đã đọc thông báo được lưu theo tài khoản phụ huynh', [...E.recs.keys()].some(k => k.startsWith('rd|') && k.endsWith('|ph|' + prep.oneEm)));
    }
    await ctx.close();
    /* nhân viên thấy yêu cầu */
    ({ ctx, page } = await newPage()); await login(page, 'tt@gb.vn', 'ttpass123'); await page.waitForSelector('.nav', { timeout: 30000 });
    ok('Trưởng Trung tâm thấy yêu cầu học bù do phụ huynh gửi', await page.evaluate(k => DB.mk.some(r => r.hs === k && r.by === 'ph'), prep.one));
    /* thu hồi và đổi mật khẩu phụ huynh */
    await page.evaluate(key => { go('cp'); S.modal = { t: 'phacc', key }; render(); }, prep.oneEm); await sleep(300);
    ok('Hộp thoại phụ huynh đã có tài khoản: có đặt lại mật khẩu và thu hồi', !!(await page.$('#phpw')) && !!(await page.$('[data-a="phdel"]')));
    await page.fill('#acc-pw', 'matkhaumoi99'); await page.click('#phpw button[type=submit]'); await sleep(1500);
    ok('Đặt lại mật khẩu phụ huynh', [...E.users.values()].find(u => u.email === prep.oneEm).pw === 'matkhaumoi99');
    await page.click('[data-a="phdel"]'); await page.click('[data-a="askyes"]'); await sleep(1500);
    ok('Thu hồi tài khoản phụ huynh', !E.profiles.some(p => p.staff_id === 'ph|' + prep.oneEm) && [...E.users.values()].find(u => u.email === prep.oneEm).banned);
    await ctx.close();
    ({ ctx, page } = await newPage()); await login(page, prep.oneEm, 'matkhaumoi99');
    ok('Phụ huynh đã bị thu hồi không đăng nhập được', /chưa đúng|bị khóa|banned/i.test(await errOf(page)), await page.textContent('.err'));
    await ctx.close();
  }

  ok('Không có lỗi trang trong suốt quá trình', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close(); E.close(); console.log('\nKẾT QUẢ: ' + pass + ' đạt, ' + fail + ' lỗi'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
