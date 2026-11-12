/* Khóa cổng phụ huynh ở chế độ máy chủ (đầu-cuối): phụ huynh quá hạn thấy màn hình khóa, nhân viên mở khóa, khóa lại giữa phiên.
   Chạy api/parent.js, api/plock.js thật và máy chủ Supabase giả lập. */
const { chromium } = require('playwright'); const path = require('path');
const { makeEmu } = require('./emu.js');
const URL = 'file://' + path.resolve(__dirname, '../src/build/page-test.html') + '?cloud';
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 500)); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const E = makeEmu(); await E.listen(); E.addUser('tt@gb.vn', 'ttpass123', { role: 'tt', full_name: 'Trưởng TT' });
  const b = await chromium.launch(), errs = [];
  async function newPage() {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }); const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::|status of 4/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
    page.sb = []; page.on('request', r => { if (/supabase\.co/.test(r.url())) page.sb.push(r.method() + ' ' + new globalThis.URL(r.url()).pathname); });
    await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
    await ctx.addInitScript(() => { window.GB_API = 'https://gb.test'; });
    await E.attach(page); await E.attachApi(page, 'https://gb.test'); await page.goto(URL); return page;
  }
  const login = async (page, e, p) => { await page.waitForSelector('#login'); await page.fill('#lg-e', e); await page.fill('#lg-p', p); await page.click('#login button[type=submit]'); };
  const main = page => page.evaluate(() => (document.querySelector('#main') || document.querySelector('#app')).innerText);
  /* Từ ngày 11 mọi phụ huynh mẫu chưa đóng đủ đều bị khóa nên danh sách khóa có nhiều trang (8 dòng mỗi trang);
     bài thử không được phụ thuộc ngày chạy, nên chuyển tới đúng trang có phụ huynh thử trước khi đọc hay bấm. */
  const showLT = async page => { await page.evaluate(() => { const i = (plRows() || []).findIndex(r => r.key === 'locktest@x.vn'); S.pg.plk = Math.floor(Math.max(i, 0) / 8) + 1; S.v = 'dash'; render(); }); await sleep(150); };

  /* ---- Trưởng Trung tâm khởi tạo dữ liệu mẫu và dựng tình huống ---- */
  const tt = await newPage();
  await login(tt, 'tt@gb.vn', 'ttpass123'); await tt.waitForSelector('[data-a="csetup"]'); await tt.click('[data-v="demo"]'); await tt.waitForSelector('.nav'); await sleep(1500);
  const info = await tt.evaluate(() => {
    const k = DB.kids.find(x => x.st === 'dang' && x.m11 > 0 && x.bt); k.pe = 'locktest@x.vn'; k.pp = '';
    const ids = DB.kids.filter(x => pkeyOf(x) === 'locktest@x.vn').map(x => x.id), due = lkDue(TODAY);
    DB.lg = DB.lg.filter(e => !ids.includes(e.hs));
    DB.lg.push({ id: 'eLT1', hs: k.id, date: due + '-01', kind: 'hp', amt: 380000, m: due, note: 'Học phí thử' });
    const ql = DB.staff.find(s => s.role === 'ql' && s.st === 'dang'), vp = DB.staff.find(s => s.role === 'vp' && s.st === 'dang');
    ql.em = 'ql@gb.vn'; vp.em = 'vp@gb.vn';
    render(); return { kid: k.id, kn: k.n, pn: k.pn, due, ql: ql.id, vp: vp.id };
  });
  await sleep(1800);
  ok('dữ liệu thử đã lên máy chủ (bé đổi email, học phí tháng đến hạn chưa đóng)', E.recs.get('kids|' + info.kid).data.pe === 'locktest@x.vn' && E.mon.has('lg|eLT1'), info);
  E.addUser('locktest@x.vn', 'phpass123', { role: 'ph', staff_id: 'ph|locktest@x.vn', full_name: info.pn });
  E.addUser('ql@gb.vn', 'qlpass123', { role: 'ql', staff_id: info.ql, full_name: 'QL' });
  E.addUser('vp@gb.vn', 'vppass123', { role: 'vp', staff_id: info.vp, full_name: 'VP' });

  /* ---- phụ huynh quá hạn ---- */
  const ph = await newPage();
  await login(ph, 'locktest@x.vn', 'phpass123'); await ph.waitForSelector('.plg');
  let t = await main(ph);
  ok('phụ huynh quá hạn: thấy màn hình khóa với số tiền và hạn', /Cổng phụ huynh đang tạm khóa/.test(t) && /380\.000/.test(t) && /sau hạn ngày 10/.test(t), t);
  ok('màn hình khóa có số điện thoại Trung tâm lấy từ máy chủ', /Liên hệ Trung tâm: 0/.test(t), t);
  ok('không có menu, không có dữ liệu của bé', !(await ph.$('.nav')) && !t.includes(info.kn));
  ok('phụ huynh không đọc bảng trực tiếp (chỉ gọi hàm máy chủ)', !ph.sb.some(r => /\/rest\/v1\/(records|money_records)/.test(r)), ph.sb);
  await ph.click('[data-a="lockchk"]'); await sleep(400);
  ok('"Kiểm tra lại" khi chưa đóng: vẫn khóa', !!(await ph.$('.plg')));

  /* ---- nhân viên thấy trong danh sách và mở khóa ---- */
  await tt.evaluate(() => plLoad()); await sleep(400);
  await showLT(tt);
  t = await main(tt);
  ok('Trưởng Trung tâm: danh sách khóa có phụ huynh thử, "Đang khóa", số tiền', /Cổng phụ huynh quá hạn học phí/.test(t) && t.includes(info.pn) && /380\.000/.test(t), t.slice(0, 300));
  const row = await tt.evaluate(() => CLD.plock.rows.find(r => r.key === 'locktest@x.vn'));
  ok('máy chủ trả đúng dòng: khóa, 380.000, tháng đến hạn', row && row.locked && row.amt === 380000 && row.months.join() === info.due, row);
  await tt.click('#plock [data-a="plopen"][data-v="locktest@x.vn"]'); await tt.waitForSelector('#plf');
  await tt.fill('#pl-n', 'Hẹn đóng sau');
  await tt.click('#plf button[type=submit]'); await sleep(600);
  const pul = E.recs.get('pul|locktest@x.vn');
  ok('mở khóa: bản ghi pul do máy chủ ghi, có người mở và vai trò', pul && pul.data.by === 'Trưởng TT' && pul.data.role === 'tt' && pul.data.note === 'Hẹn đóng sau' && /^\d{4}-\d{2}-10$/.test(pul.data.until), pul);
  await showLT(tt); t = await main(tt);
  ok('danh sách hiện "Đã mở khóa"', /Đã mở khóa/.test(t) && !!(await tt.$('#plock [data-a="plrelock"]')), t.slice(0, 300));
  await ph.click('[data-a="lockchk"]'); await ph.waitForSelector('.nav', { timeout: 5000 });
  ok('phụ huynh bấm "Kiểm tra lại" sau khi được mở khóa: vào được cổng, thấy bé của mình', (await main(ph)).includes(info.kn));

  /* ---- khóa lại giữa phiên: phiên đang mở bị khóa ở lần đồng bộ kế tiếp ---- */
  await tt.click('#plock [data-a="plrelock"]'); await tt.click('[data-a="askyes"]'); await sleep(600);
  ok('khóa lại: xóa bản ghi pul', !E.recs.has('pul|locktest@x.vn'));
  await ph.evaluate(() => cloudPull()); await ph.waitForSelector('.plg', { timeout: 5000 });
  ok('phiên phụ huynh đang mở: lần đồng bộ kế tiếp hiện màn hình khóa, không giữ dữ liệu', (await ph.evaluate(() => DB === null && U === null)) && !(await main(ph)).includes(info.kn));
  /* ghi khi đã bị khóa: nhận 423 và chuyển sang màn hình khóa */
  await tt.evaluate(() => plApi({ action: 'unlock', key: 'locktest@x.vn' })); await ph.click('[data-a="lockchk"]'); await ph.waitForSelector('.nav', { timeout: 5000 });
  await tt.evaluate(() => plApi({ action: 'relock', key: 'locktest@x.vn' }));
  await ph.evaluate(() => { DB.rd['zz|ph|locktest@x.vn'] = '2026-11-09'; render(); }); await sleep(900);
  ok('phụ huynh ghi khi vừa bị khóa: tự chuyển sang màn hình khóa', !!(await ph.$('.plg')) && !E.recs.has('rd|zz|ph|locktest@x.vn'));

  /* ---- Quản lý: thấy ai bị khóa, không thấy tiền ---- */
  const ql = await newPage(); await login(ql, 'ql@gb.vn', 'qlpass123'); await ql.waitForSelector('.nav'); await sleep(900);
  await showLT(ql); t = await main(ql);
  ok('Quản lý: thấy danh sách khóa nhưng không thấy số tiền', /Cổng phụ huynh quá hạn học phí/.test(t) && t.includes(info.pn) && !/380\.000/.test(t) && !!(await ql.$('#plock [data-a="plopen"]')), t.slice(0, 400));
  ok('Quản lý không nhận dữ liệu tiền từ máy chủ', !(await ql.evaluate(() => JSON.stringify(CLD.plock)).then(s => /"amt"/.test(s))));
  await ql.click('#plock [data-a="plopen"][data-v="locktest@x.vn"]'); await ql.waitForSelector('#plf'); await ql.click('#plf button[type=submit]'); await sleep(600);
  ok('Quản lý mở khóa được', E.recs.has('pul|locktest@x.vn') && E.recs.get('pul|locktest@x.vn').data.role === 'ql');

  /* ---- Văn phòng ---- */
  const vp = await newPage(); await login(vp, 'vp@gb.vn', 'vppass123'); await vp.waitForSelector('.nav'); await sleep(900);
  await showLT(vp); t = await main(vp);
  ok('Văn phòng: dashboard có danh sách khóa kèm số tiền', /Cổng phụ huynh quá hạn học phí/.test(t) && /Đã mở khóa/.test(t), t.slice(0, 400));

  /* ---- trình duyệt không ghi trực tiếp bản ghi mở khóa ---- */
  const st = await tt.evaluate(async () => (await sbReq('/rest/v1/records?on_conflict=collection,id', { method: 'POST', body: [{ collection: 'pul', id: 'khac@x.vn', data: { until: '2099-01-01' } }] })).status);
  ok('Trưởng Trung tâm ghi trực tiếp bản ghi mở khóa qua bảng: bị từ chối (403)', st === 403 && !E.recs.has('pul|khac@x.vn'), st);

  ok('không có lỗi script', errs.length === 0, errs);
  console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); E.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
