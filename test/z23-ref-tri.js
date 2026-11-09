/* Z2 và Z3: Góc tri ân và Tài liệu tham khảo. Đầu-cuối ở chế độ máy chủ: trình duyệt thật + api/parent.js thật + Supabase giả lập có kho tệp (test/emu.js).
   Kiểm tra: chỉ Trưởng Trung tâm và Quản lý đăng; Văn phòng, Giáo viên chỉ đọc (cả ở máy chủ); phụ huynh nhận bản đã lọc (không đường dẫn, không mã bé),
   xem PDF vẽ trong trang (không nút tải), ẩn thì biến mất, khóa cổng chặn cả hai, bắt buộc đồng ý khi đăng ảnh tri ân. Cuối cùng thử bản ?demo và điện thoại. */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const { makeEmu } = require('./emu.js');
const BASE = 'file://' + path.resolve(__dirname, '../src/build/page-test.html');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 700)); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const SP = process.env.SP || '/tmp';
function pdfBuf(title, pages) {
  const pe = s => s.replace(/[()\\]/g, '\\$&'), objs = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'], kids = [];
  pages.forEach(lines => {
    let t = 'BT /F1 44 Tf 56 760 Td (' + pe(title) + ') Tj /F1 30 Tf 0 -70 Td '; lines.forEach(l => { t += '(' + pe(l) + ') Tj 0 -46 Td '; }); t += 'ET';
    const c = objs.length + 1; objs.push('<< /Length ' + t.length + ' >>\nstream\n' + t + '\nendstream');
    objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ' + c + ' 0 R /Resources << /Font << /F1 3 0 R >> >> >>'); kids.push((c + 1) + ' 0 R');
  });
  objs[1] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + pages.length + ' >>';
  let out = '%PDF-1.4\n'; const off = []; objs.forEach((o, i) => { off.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  const xr = out.length; out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF';
  return Buffer.from(out, 'latin1');
}
const PDF = pdfBuf('Huong dan A', [['Trang mot: xep khoi', 'Buoc 1 va buoc 2'], ['Trang hai: khen be', 'Buoc 3 den buoc 5', 'Tong ket']]);
(async () => {
  const E = makeEmu(); await E.listen(); E.addUser('tt@gb.vn', 'ttpass123', { role: 'tt', full_name: 'Trưởng TT' });
  const b = await chromium.launch(), errs = [];
  const vendorRoute = async page => page.route('https://gb.test/vendor/pdfjs/*', route => {
    const f = path.resolve(__dirname, '../vendor/pdfjs', new URL(route.request().url()).pathname.split('/').pop());
    route.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(f) });
  });
  async function newPage(q, w, h) {
    const ctx = await b.newContext({ viewport: { width: w || 1366, height: h || 900 } }); const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::|status of 4/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
    page.sb = []; page.on('request', r => { if (/supabase\.co/.test(r.url())) page.sb.push(r.method() + ' ' + new globalThis.URL(r.url()).pathname); });
    await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
    await ctx.addInitScript(() => { window.GB_API = 'https://gb.test'; window.GB_PDFJS = 'https://gb.test/vendor/pdfjs/'; });
    await E.attach(page); await E.attachApi(page, 'https://gb.test'); await vendorRoute(page); await page.goto(BASE + (q === undefined ? '?cloud' : q)); return page;
  }
  const login = async (page, e, p) => { await page.waitForSelector('#login'); await page.fill('#lg-e', e); await page.fill('#lg-p', p); await page.click('#login button[type=submit]'); };
  const main = page => page.evaluate(() => (document.querySelector('#main') || document.querySelector('#app')).innerText);
  const goTd = async (page, tab) => { await page.evaluate(t => { S.v = 'td'; S.td = Object.assign({}, S.td, { tab: t || 'gal', sel: [] }); S.modal = null; render(); }, tab); await sleep(300); };
  const goCp = async (page, tab) => { await page.evaluate(t => { S.v = 'cp'; S.cp = Object.assign({}, S.cp, { tab: t }); S.modal = null; render(); }, tab); await sleep(400); };
  const pullAll = async page => { for (let i = 0; i < 14; i++) { const x = await page.evaluate(async () => { const a = CLD.since.records; await cloudPull(); return a === CLD.since.records; }); await sleep(150); if (x) break; } await sleep(200); };
  const flush = async page => { await page.evaluate(() => cloudFlush()); await sleep(500); };
  const until = async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 9000)) { try { if (await fn()) return true; } catch (e) { } await sleep(150); } return false; };
  const rows = c => [...E.recs.values()].filter(r => r.collection === c).map(r => r.data);
  const keys = () => [...E.objs.keys()];

  /* ---- Trưởng Trung tâm dựng dữ liệu: 3 bé, hai phụ huynh, ql, vp, gv ---- */
  const tt = await newPage();
  await login(tt, 'tt@gb.vn', 'ttpass123'); await tt.waitForSelector('[data-a="csetup"]'); await tt.click('[data-v="demo"]'); await tt.waitForSelector('.nav'); await sleep(1500);
  const info = await tt.evaluate(() => {
    const g = DB.groups[0], gk = DB.kids.filter(k => k.gr === g.id && k.st === 'dang'); const [a, b2, c] = gk;
    a.pe = 'pa@x.vn'; a.pp = ''; b2.pe = 'pa@x.vn'; b2.pp = ''; c.pe = 'pc@x.vn'; c.pp = '';
    const gv1 = DB.staff.find(s => s.id === g.gv); gv1.em = 'gv1@gb.vn';
    const ql = DB.staff.find(s => s.role === 'ql' && s.st === 'dang'), vp = DB.staff.find(s => s.role === 'vp' && s.st === 'dang'); ql.em = 'ql@gb.vn'; vp.em = 'vp@gb.vn';
    const demoRef = DB.ref.length, demoTri = DB.tri.length; DB.ref = []; DB.tri = []; DB.media = []; DB.lg = DB.lg.filter(e => ![a.id, b2.id, c.id].includes(e.hs));
    render(); return { a: a.id, an: a.n, c: c.id, cn: c.n, gv1: gv1.id, ql: ql.id, vp: vp.id, demoRef, demoTri };
  });
  await sleep(1800);
  ok('bản dùng thử có sẵn mục mẫu tài liệu tham khảo và tri ân (đã dọn khỏi dữ liệu thử)', info.demoRef === 3 && info.demoTri === 4, info);
  E.addUser('gv1@gb.vn', 'gv1pass123', { role: 'gv', staff_id: info.gv1, full_name: 'GV1' });
  E.addUser('ql@gb.vn', 'qlpass123', { role: 'ql', staff_id: info.ql, full_name: 'QL' });
  E.addUser('vp@gb.vn', 'vppass123', { role: 'vp', staff_id: info.vp, full_name: 'VP' });
  E.addUser('pa@x.vn', 'papass123', { role: 'ph', staff_id: 'ph|pa@x.vn', full_name: 'Phụ huynh A' });
  E.addUser('pc@x.vn', 'pcpass123', { role: 'ph', staff_id: 'ph|pc@x.vn', full_name: 'Phụ huynh C' });

  /* ---- A. Trưởng Trung tâm đăng Tài liệu tham khảo ---- */
  await goTd(tt, 'ref'); let t = await main(tt);
  ok('mục Tài liệu tham khảo có trong trang, có nút Thêm tài liệu tham khảo', /Tài liệu tham khảo/.test(t) && !!(await tt.$('[data-a="rfm"]')) && /mọi phụ huynh/.test(t), t.slice(0, 300));
  const tabs = await tt.$$eval('.tabs .tab', xs => xs.map(x => x.textContent.trim()));
  ok('các tab: Ảnh và video, Hoạt động chung, Tài liệu tham khảo, Góc tri ân, Hồ sơ giáo án (không còn tab "Tài liệu" cũ)', tabs.length === 5 && tabs.includes('Tài liệu tham khảo') && tabs.includes('Góc tri ân') && tabs.includes('Hồ sơ, giáo án') && !tabs.includes('Tài liệu'), tabs);
  await tt.click('[data-a="rfm"]'); await tt.waitForSelector('#rfmf');
  ok('cửa sổ đăng: chọn tệp nhiều, nhóm, hướng dẫn ngắn, mặc định đăng cho mọi phụ huynh', (await tt.getAttribute('#rf-f', 'multiple')) !== null && !!(await tt.$('#rf-c')) && !!(await tt.$('#rf-n')) && await tt.isChecked('#rfmf input[name=sh]') && /PDF/.test(await tt.textContent('#rfmf')));
  await tt.setInputFiles('#rf-f', [{ name: 'huong-dan.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('PK') }]); await tt.click('#rfmf button[type=submit]'); await sleep(250);
  ok('Word bị từ chối, nhắc lưu thành PDF, không tải gì lên', /không phải PDF/.test(await tt.textContent('#rfmf .err')) && E.objs.size === 0, await tt.textContent('#rfmf .err'));
  await tt.setInputFiles('#rf-f', [{ name: 'a.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') }]); await tt.click('#rfmf button[type=submit]'); await sleep(250);
  ok('tệp .exe bị từ chối', /định dạng chưa hỗ trợ/.test(await tt.textContent('#rfmf .err')) && E.objs.size === 0);
  await tt.setInputFiles('#rf-f', [{ name: 'huong-dan-xep-khoi.pdf', mimeType: 'application/pdf', buffer: PDF }, { name: 'bang-tro-choi.png', mimeType: 'image/png', buffer: PNG }, { name: 'video-mau.mp4', mimeType: 'video/mp4', buffer: Buffer.from('fakevideobytes0123456789') }]);
  await tt.selectOption('#rf-c', 'Hướng dẫn tại nhà'); await tt.fill('#rf-n', 'Chơi 10 phút mỗi ngày.\nChờ bé nhìn rồi mới đưa khối.'); await tt.click('#rfmf button[type=submit]');
  await tt.waitForSelector('#rfmf', { state: 'detached' }); await sleep(500); await flush(tt);
  let rf = rows('ref');
  ok('3 tệp nằm trong kho gb-media, đường dẫn r/<mã>.<đuôi>, không lẫn tiền tố m/', E.objs.size === 3 && keys().every(k => /^r\/[A-Za-z0-9_.\-]+\.(pdf|png|jpg|mp4)$/.test(k)), keys());
  ok('3 bản ghi ref lên máy chủ: đã đăng, có nhóm, ghi chú nhiều dòng, người đăng là tt', rf.length === 3 && rf.every(r => r.sh === 1 && r.cat === 'Hướng dẫn tại nhà' && /^r\//.test(r.p) && r.n.includes('\n')) && rf.filter(r => r.kind === 'doc').length === 1 && rf.filter(r => r.kind === 'vid').length === 1 && rf.filter(r => r.kind === 'img').length === 1, rf);
  ok('bản ghi không chứa dữ liệu tệp (chỉ đường dẫn)', JSON.stringify(rf).length < 2500 && rf.every(r => !r.u));
  t = await main(tt);
  ok('danh sách quản lý: 3 thẻ, có nút Ẩn, Sửa, Xóa, nhãn "Phụ huynh đang xem được"', (await tt.$$('.mc')).length === 3 && (await tt.$$('.mc [data-a="rfdel"]')).length === 3 && /Phụ huynh đang xem được/.test(t));

  /* ---- B. Quyền theo vai trò: Quản lý đăng được; Văn phòng, Giáo viên chỉ đọc ---- */
  const ql = await newPage(); await login(ql, 'ql@gb.vn', 'qlpass123'); await ql.waitForSelector('.nav'); await sleep(1400);
  const vp = await newPage(); await login(vp, 'vp@gb.vn', 'vppass123'); await vp.waitForSelector('.nav'); await sleep(1400);
  const gv1 = await newPage(); await login(gv1, 'gv1@gb.vn', 'gv1pass123'); await gv1.waitForSelector('.nav'); await sleep(1400);
  await goTd(ql, 'ref'); await goTd(vp, 'ref'); await goTd(gv1, 'ref');
  ok('Quản lý: thấy 3 tài liệu và có nút thêm, sửa, xóa', (await ql.$$('.mc')).length === 3 && !!(await ql.$('[data-a="rfm"]')) && !!(await ql.$('.mc [data-a="rfed"]')));
  ok('Văn phòng: thấy 3 tài liệu nhưng không có nút thêm, ẩn, sửa, xóa', (await vp.$$('.mc')).length === 3 && !(await vp.$('[data-a="rfm"]')) && !(await vp.$('.mc [data-a="rfdel"]')) && !(await vp.$('.mc [data-a="rfsh"]')));
  ok('Giáo viên: thấy 3 tài liệu nhưng không có nút thêm, ẩn, sửa, xóa', (await gv1.$$('.mc')).length === 3 && !(await gv1.$('[data-a="rfm"]')) && !(await gv1.$('.mc [data-a="rfdel"]')));
  const wr = async (page, coll) => page.evaluate(async c => { const r = await sbReq('/rest/v1/records?on_conflict=collection,id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: [{ collection: c, id: 'hack-' + c, data: { t: 'x', sh: 1, cs: 1 } }] }); return r.status; }, coll);
  ok('máy chủ từ chối Văn phòng ghi ref và tri (403)', (await wr(vp, 'ref')) === 403 && (await wr(vp, 'tri')) === 403);
  ok('máy chủ từ chối Giáo viên ghi ref và tri (403)', (await wr(gv1, 'ref')) === 403 && (await wr(gv1, 'tri')) === 403);
  ok('máy chủ cho Quản lý ghi ref (201)', (await wr(ql, 'ref')) === 201);
  await ql.evaluate(async () => { await sbReq('/rest/v1/records?collection=eq.ref&id=eq.hack-ref', { method: 'DELETE' }); });
  const up = (page, p) => page.evaluate(async p2 => { try { await medStore(p2, new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'application/pdf'); return 'ok'; } catch (e) { return e.message; } }, p);
  ok('Văn phòng, Giáo viên không tải được tệp vào r/ và t/ (kho từ chối)', /chưa có quyền/.test(await up(vp, 'r/vp-x.pdf')) && /chưa có quyền/.test(await up(gv1, 'r/gv-x.pdf')) && /chưa có quyền/.test(await up(gv1, 't/gv-x.pdf')) && !keys().some(k => /gv-x|vp-x/.test(k)), keys());
  ok('Giáo viên vẫn tải được vào m/ như trước (không đổi quyền cũ)', (await up(gv1, 'm/gv-ok.pdf')) === 'ok');
  await gv1.evaluate(async () => { await medRemove('m/gv-ok.pdf'); });
  /* Văn phòng không xóa được tệp r/ */
  const delv = await vp.evaluate(async () => { const r = await sbReq('/storage/v1/object/gb-media/' + DB.ref[0].p, { method: 'DELETE' }); return r.status; });
  ok('Văn phòng không xóa được tệp r/ trong kho', delv === 404 && E.objs.size === 3, delv);

  /* ---- C. Phụ huynh xem Tài liệu tham khảo ---- */
  const pa = await newPage(); await login(pa, 'pa@x.vn', 'papass123'); await pa.waitForSelector('.nav'); await sleep(1500);
  const pc = await newPage(); await login(pc, 'pc@x.vn', 'pcpass123'); await pc.waitForSelector('.nav'); await sleep(1500);
  const tabP = await pa.$$eval('.tabs .tab', xs => xs.map(x => x.textContent.trim()));
  ok('cổng phụ huynh có tab Tài liệu tham khảo và Góc tri ân, tab ảnh đổi tên "Ảnh và video của bé"', tabP.includes('Tài liệu tham khảo') && tabP.includes('Góc tri ân') && tabP.includes('Ảnh và video của bé') && !tabP.includes('Ảnh, video và tài liệu'), tabP);
  await goCp(pa, 'ref'); t = await main(pa);
  ok('phụ huynh A thấy 3 tài liệu chung, chữ hướng dẫn, nhóm "Hướng dẫn tại nhà"', (await pa.$$('.mc')).length === 3 && /Hướng dẫn tại nhà/.test(t) && /Chơi 10 phút mỗi ngày/.test(t), t.slice(0, 300));
  await goCp(pc, 'ref');
  ok('phụ huynh C (bé khác, không liên quan) cũng thấy đúng 3 tài liệu chung', (await pc.$$('.mc')).length === 3);
  ok('phụ huynh không có nút Ẩn, Sửa, Xóa, Thêm và không có liên kết tải về', !(await pa.$('[data-a="rfdel"],[data-a="rfsh"],[data-a="rfed"],[data-a="rfm"]')) && !(await pa.$('a[download]')) && (await pa.$$eval('a[href]', xs => xs.filter(x => /storage|\.pdf|\.mp4/.test(x.getAttribute('href') || '')).length)) === 0);
  const prDB = await pa.evaluate(() => JSON.stringify(DB.ref));
  ok('dữ liệu phụ huynh nhận: không có đường dẫn kho (p), người đăng, mã nhân viên', !/"p":/.test(prDB) && !/"by":/.test(prDB) && !/"bn":/.test(prDB) && !/"at":/.test(prDB) && /"kind":"doc"/.test(prDB), prDB.slice(0, 400));
  await pa.waitForSelector('.mth img.mi'); await sleep(700);
  const thumbs = await pa.evaluate(() => [...document.querySelectorAll('.mth img.mi')].map(i => i.naturalWidth > 0 && /\/storage\/v1\/object\/sign\/gb-media\/r\/.+token=/.test(i.src)));
  ok('ảnh xem bằng đường xem tạm có token, không phải đường công khai', thumbs.length === 1 && thumbs[0] && !pa.sb.some(r => /\/object\/public\//.test(r)), thumbs);
  ok('phụ huynh không gọi thẳng kho hay bảng (mọi thứ qua /api/parent)', !pa.sb.some(r => /\/rest\/v1\/records|object\/sign\/gb-media$/.test(r) && !/GET/.test(r)) && !pa.sb.some(r => /^POST \/storage\/v1\/object\/sign/.test(r)), pa.sb.filter(r => !/^GET \/storage\/v1\/object\/sign\/gb-media\/r\//.test(r)));
  /* mở PDF: vẽ lên canvas, hai trang, không nút tải */
  const docId = await pa.evaluate(() => DB.ref.find(x => x.kind === 'doc').id);
  await pa.click('.mth[data-v="r:' + docId + '"]'); await pa.waitForSelector('#pdfc');
  const pix = () => pa.evaluate(() => { const c = document.querySelector('#pdfc'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let dark = 0, sum = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 200 && d[i] < 128) dark++; sum = (sum * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7 + (i >> 2)) % 1000003; } return { w: c.width, h: c.height, dark, sum }; });
  ok('PDF vẽ lên canvas trong trang (có nét chữ, không trắng trơn)', await until(async () => (await pix()).dark > 300), await pix().catch(e => String(e)));
  const p1 = await pix();
  if (process.env.DBG) console.log('DBG', JSON.stringify(await pa.evaluate(() => ({ P: RF.pdf && { total: RF.pdf.total, page: RF.pdf.page, err: RF.pdf.err, why: RF.pdf.why, shown: RF.pdf.shown, key: RF.pdf.key }, modal: S.modal && S.modal.keys, html: document.querySelector('.mdc').innerHTML.slice(-700) }))));
  ok('hiện "Trang 1/2" và nút trang sau', /Trang 1\/2/.test(await pa.textContent('#pdfpg')) && !!(await pa.$('[data-a="pdfn"][data-v="1"]:not([disabled])')) && !!(await pa.$('[data-a="pdfn"][data-v="-1"][disabled]')));
  await pa.click('[data-a="pdfn"][data-v="1"]');
  ok('sang trang 2: nội dung khác trang 1', await until(async () => { const q = await pix(); return q.dark > 300 && q.sum !== p1.sum && /Trang 2\/2/.test(await pa.textContent('#pdfpg')); }), await pix());
  ok('trong cửa sổ xem không có nút tải, in, liên kết tệp, iframe/embed của trình duyệt', await pa.evaluate(() => { const m = document.querySelector('.mdl'); return !m.querySelector('a[href],a[download],iframe,embed,object') && !/Tải xuống|Tải về|In /.test(m.innerText); }));
  ok('đường xem PDF do /api/parent cấp (có token) và được tải bằng fetch, không điều hướng', E.log.some(r => /^GET \/storage\/v1\/object\/sign\/gb-media\/r\/.+\.pdf$/.test(r)));
  await pa.keyboard.press('ArrowLeft'); ok('phím mũi tên trái về trang 1', await until(async () => /Trang 1\/2/.test(await pa.textContent('#pdfpg'))));
  await pa.click('[data-a="mx"]'); await sleep(200);
  ok('đóng cửa sổ: PDF được giải phóng', await pa.evaluate(() => RF.pdf === null));
  /* video */
  const vidId = await pa.evaluate(() => DB.ref.find(x => x.kind === 'vid').id);
  await pa.click('.mth[data-v="r:' + vidId + '"]'); await pa.waitForSelector('video.mbig'); await sleep(500);
  const vv = await pa.evaluate(() => { const v = document.querySelector('video.mbig'); return { cl: v.getAttribute('controlslist'), pip: v.hasAttribute('disablepictureinpicture'), src: v.getAttribute('src') }; });
  ok('video: tắt nút tải, tắt hình trong hình, nguồn là đường xem tạm', /nodownload/.test(vv.cl) && vv.pip && /sign\/gb-media\/r\/.+token=/.test(vv.src), vv);
  await pa.click('[data-a="mx"]');
  /* chặn cổng chuột phải, sao chép */
  const gd = await pa.evaluate(() => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); document.body.dispatchEvent(e); return { blocked: e.defaultPrevented, gph: document.body.classList.contains('gph'), mark: !!document.getElementById('gmark') }; });
  ok('lớp bảo vệ cổng phụ huynh đang bật: chặn chuột phải, có lớp phủ tên', gd.blocked && gd.gph && gd.mark, gd);

  /* ---- D. Ẩn, hiện, sửa, xóa tài liệu; máy chủ không cấp đường xem cho mục đã ẩn ---- */
  const imgId = await pa.evaluate(() => DB.ref.find(x => x.kind === 'img').id);
  await goTd(ql, 'ref'); await ql.click('.mc:has([data-a="rfsh"][data-v="' + imgId + '"]) [data-a="rfsh"]'); await sleep(200); await flush(ql);
  ok('Quản lý bấm Ẩn: bản ghi sh=0, thẻ hiện "Đang ẩn"', rows('ref').find(r => r.id === imgId).sh === 0 && /Đang ẩn/.test(await main(ql)));
  await pullAll(pa); await goCp(pa, 'ref');
  ok('phụ huynh: mục đã ẩn biến mất sau đồng bộ (còn 2)', (await pa.$$('.mc')).length === 2 && (await pa.evaluate(id => !DB.ref.some(x => x.id === id && !x.gone), imgId)));
  const sg = await pa.evaluate(async id => { const r = await phCall({ action: 'sign', refs: [id], ids: [], tris: [] }); return { st: r.status, j: await r.json() }; }, imgId);
  ok('máy chủ không cấp đường xem cho mục đã ẩn, báo "gone"', sg.st === 200 && !sg.j.urls['r:' + imgId] && sg.j.gone.includes('r:' + imgId), sg);
  const sg2 = await pa.evaluate(async () => { const r = await phCall({ action: 'sign', refs: ['khong-co-id', '../../x'], ids: [], tris: ['ab:9', 'x:0'] }); return { st: r.status, j: await r.json() }; });
  ok('mã không tồn tại hoặc sai dạng: không có đường xem nào', sg2.st === 200 && Object.keys(sg2.j.urls).length === 0, sg2);
  const pw = await pa.evaluate(async () => { const r = await phCall({ action: 'put', rows: [{ collection: 'ref', id: 'ph-hack', data: { t: 'x', sh: 1, p: 'r/x.pdf' } }, { collection: 'tri', id: 'ph-hack2', data: { t: 'x', sh: 1, cs: 1 } }] }); return r.status; });
  ok('phụ huynh không ghi được ref, tri qua /api/parent (403) và không có dòng nào được tạo', pw === 403 && !rows('ref').some(r => r.t === 'x') && !rows('tri').some(r => r.t === 'x'), pw);
  const pd = await pa.evaluate(async () => { const r = await phCall({ action: 'put', dels: [{ collection: 'ref', id: DB.ref.find(x => x.kind === 'doc').id }] }); return r.status; });
  ok('phụ huynh không xóa được ref qua /api/parent', pd === 403 && rows('ref').length === 3, pd);
  const pdirect = await pa.evaluate(async () => { const r = await sbReq('/rest/v1/records?collection=eq.ref&select=id,data'); const w = await sbReq('/rest/v1/records?on_conflict=collection,id', { method: 'POST', body: [{ collection: 'ref', id: 'z', data: {} }] }); const s = await sbReq('/storage/v1/object/sign/gb-media', { method: 'POST', body: { expiresIn: 60, paths: ['r/x'] } }); return { r: r.status, rb: await r.text().catch(() => ''), w: w.status, s: s.status }; });
  ok('phụ huynh gọi thẳng bảng hoặc kho đều bị từ chối hoặc không thấy dữ liệu', (pdirect.r === 200 ? pdirect.rb === '[]' : pdirect.r >= 400) && pdirect.w >= 400 && pdirect.s >= 400, pdirect);
  await goTd(ql, 'ref'); await ql.click('.mc:has([data-a="rfsh"][data-v="' + imgId + '"]) [data-a="rfsh"]'); await ql.waitForSelector('[data-a="askyes"]'); await ql.click('[data-a="askyes"]'); await sleep(250); await flush(ql);
  ok('đăng lại có hỏi xác nhận, sau đó sh=1', rows('ref').find(r => r.id === imgId).sh === 1);
  await ql.click('.mc:has([data-a="rfed"][data-v="' + imgId + '"]) [data-a="rfed"]'); await ql.waitForSelector('#rfef');
  await ql.fill('#re-t', 'Bảng trò chơi tuần này'); await ql.selectOption('#re-c', 'Trò chơi, bài tập'); await ql.click('#rfef button[type=submit]'); await sleep(250); await flush(ql);
  ok('sửa tên, nhóm: lưu lên máy chủ', rows('ref').find(r => r.id === imgId).t === 'Bảng trò chơi tuần này' && rows('ref').find(r => r.id === imgId).cat === 'Trò chơi, bài tập');
  await pullAll(pa); await goCp(pa, 'ref'); t = await main(pa);
  ok('phụ huynh thấy lại mục, đúng tên mới và nhóm mới', (await pa.$$('.mc')).length === 3 && /Bảng trò chơi tuần này/.test(t) && /Trò chơi, bài tập/.test(t));
  /* xóa video */
  await ql.click('.mc:has([data-a="rfdel"][data-v="' + vidId + '"]) [data-a="rfdel"]'); await ql.waitForSelector('[data-a="askyes"]'); await ql.click('[data-a="askyes"]'); await sleep(500); await flush(ql);
  ok('xóa: bản ghi mất và tệp mp4 bị xóa khỏi kho', !rows('ref').some(r => r.id === vidId) && !keys().some(k => /\.mp4$/.test(k)) && E.objs.size === 2, keys());
  await pullAll(pa); await goCp(pa, 'ref');
  ok('phụ huynh: còn 2 tài liệu sau khi xóa', (await pa.$$('.mc')).length === 2);

  /* ---- E. Góc tri ân: Quản lý đăng, bắt buộc có sự đồng ý của gia đình ---- */
  await goTd(ql, 'tri'); t = await main(ql);
  ok('tab Góc tri ân: có hướng dẫn bắt buộc gia đình đồng ý và nút Thêm mục tri ân', /chỉ đăng khi gia đình đã đồng ý/.test(t) && !!(await ql.$('[data-a="trm"]')), t.slice(0, 300));
  await ql.click('[data-a="trm"]'); await ql.waitForSelector('#trmf');
  ok('biểu mẫu: loại, ngày, tiêu đề, lời nhắn, bé liên quan (chỉ nhân viên), tên hiển thị, ảnh, ô đồng ý, cách đồng ý', (await Promise.all(['#tr-c', '#tr-d', '#tr-t', '#tr-n', '#tr-k', '#tr-w', '#tr-f', '#trmf input[name=cs]', '#tr-o'].map(sel => ql.$(sel)))).every(Boolean));
  await ql.selectOption('#tr-k', info.a); ok('chọn bé liên quan tự gợi ý tên hiển thị rút gọn "Phụ huynh bé X."', /^Phụ huynh bé [A-ZÀ-Ỵ]\.$/.test(await ql.inputValue('#tr-w')), await ql.inputValue('#tr-w'));
  await ql.selectOption('#tr-c', 'tb'); await ql.fill('#tr-t', 'Bé đã biết chờ đến lượt'); await ql.fill('#tr-n', 'Sau sáu tháng con biết chơi luân phiên.\nCảm ơn các cô.');
  await ql.setInputFiles('#tr-f', [{ name: 'a1.png', mimeType: 'image/png', buffer: PNG }, { name: 'a2.png', mimeType: 'image/png', buffer: PNG }]);
  await ql.fill('#tr-o', 'Tin nhắn Zalo 05/11/2026'); await ql.click('#trmf button[type=submit]'); await sleep(300);
  ok('chưa tích "gia đình đã đồng ý": không lưu, báo lỗi rõ', /gia đình đã đồng ý/.test(await ql.textContent('#trmf .err')) && rows('tri').length === 0 && E.objs.size === 2, await ql.textContent('#trmf .err'));
  await ql.check('#trmf input[name=cs]');
  await ql.setInputFiles('#tr-f', [1, 2, 3, 4, 5].map(i => ({ name: 'p' + i + '.png', mimeType: 'image/png', buffer: PNG }))); await ql.click('#trmf button[type=submit]'); await sleep(300);
  ok('quá 4 ảnh: báo lỗi, không tải gì', /tối đa 4 ảnh/.test(await ql.textContent('#trmf .err')) && E.objs.size === 2);
  await ql.setInputFiles('#tr-f', [{ name: 'v.mp4', mimeType: 'video/mp4', buffer: Buffer.from('x') }]); await ql.click('#trmf button[type=submit]'); await sleep(300);
  ok('video không được đăng ở Góc tri ân', /không phải ảnh/.test(await ql.textContent('#trmf .err')) && E.objs.size === 2);
  await ql.setInputFiles('#tr-f', [{ name: 'a1.png', mimeType: 'image/png', buffer: PNG }, { name: 'a2.png', mimeType: 'image/png', buffer: PNG }]); await ql.click('#trmf button[type=submit]');
  await ql.waitForSelector('#trmf', { state: 'detached' }); await sleep(500); await flush(ql);
  let tr = rows('tri');
  ok('mục tri ân lưu lên máy chủ: loại tiến bộ, 2 ảnh dưới t/, đồng ý, bé liên quan, đã đăng', tr.length === 1 && tr[0].cat === 'tb' && tr[0].ph.length === 2 && tr[0].ph.every(f => /^t\/[A-Za-z0-9_.\-]+\.jpg$/.test(f.p)) && tr[0].cs === 1 && tr[0].k === info.a && tr[0].sh === 1 && tr[0].cn === 'Tin nhắn Zalo 05/11/2026' && /^Phụ huynh bé/.test(tr[0].who), tr);
  ok('2 ảnh nằm trong kho gb-media/t/', keys().filter(k => /^t\//.test(k)).length === 2, keys());
  /* mục chỉ có lời nhắn + mục nháp (ẩn) */
  await ql.click('[data-a="trm"]'); await ql.waitForSelector('#trmf'); await ql.selectOption('#tr-c', 'cm'); await ql.fill('#tr-w', 'Phụ huynh bé K.'); await ql.fill('#tr-n', 'Cảm ơn Trung tâm rất nhiều.'); await ql.check('#trmf input[name=cs]'); await ql.fill('#tr-o', 'Giấy đồng ý ký tay'); await ql.click('#trmf button[type=submit]'); await ql.waitForSelector('#trmf', { state: 'detached' }); await sleep(300);
  await ql.click('[data-a="trm"]'); await ql.waitForSelector('#trmf'); await ql.selectOption('#tr-c', 'tn'); await ql.fill('#tr-w', 'Phụ huynh bé H.'); await ql.fill('#tr-n', 'Bản nháp chưa đăng.'); await ql.check('#trmf input[name=cs]'); await ql.uncheck('#trmf input[name=sh]'); await ql.click('#trmf button[type=submit]'); await ql.waitForSelector('#trmf', { state: 'detached' }); await sleep(300); await flush(ql);
  tr = rows('tri');
  ok('có 3 mục: 2 đăng, 1 nháp ẩn', tr.length === 3 && tr.filter(x => x.sh === 1).length === 2 && tr.filter(x => x.sh === 0).length === 1);
  /* Văn phòng, Giáo viên chỉ đọc */
  await pullAll(vp); await pullAll(gv1); await goTd(vp, 'tri'); await goTd(gv1, 'tri');
  ok('Văn phòng, Giáo viên xem được Góc tri ân nhưng không có nút thêm, sửa, xóa', (await vp.$$('.tri')).length === 3 && !(await vp.$('[data-a="trm"],[data-a="trdel"]')) && (await gv1.$$('.tri')).length === 3 && !(await gv1.$('[data-a="trm"],[data-a="trdel"]')));
  ok('nhân viên thấy ghi chú cách đồng ý và bé liên quan; thẻ nháp ghi "Đang ẩn"', /Gia đình đồng ý: Tin nhắn Zalo/.test(await main(vp)) && /Bé liên quan/.test(await main(vp)) && /Đang ẩn/.test(await main(vp)));

  /* ---- F. Phụ huynh xem Góc tri ân: chỉ mục đã đăng và có đồng ý ---- */
  await pullAll(pa); await pullAll(pc);
  // chèn thẳng vào máy chủ (khóa secret) các dòng "xấu" như thể ai đó ghi sai: có sh nhưng thiếu cs; ảnh có đường dẫn lạ; tài liệu có đường dẫn ngoài r/
  const svc = (method, qs, body) => fetch(E.url + '/rest/v1/records' + qs, { method, headers: { apikey: 'sb_secret_EMU_KEY', 'content-type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: body ? JSON.stringify(body) : undefined });
  await svc('POST', '?on_conflict=collection,id', [
    { collection: 'tri', id: 'bad1', data: { id: 'bad1', cat: 'cm', n: 'Thiếu đồng ý', who: 'X', d: '2026-11-01', ph: [], sh: 1 } },
    { collection: 'tri', id: 'bad2', data: { id: 'bad2', cat: 'cm', n: 'Ảnh đường dẫn lạ', who: 'Y', d: '2026-11-01', ph: [{ p: 'm/ho-so-be-khac.jpg', ct: 'image/jpeg' }, { p: '../x', ct: 'image/jpeg' }], cs: 1, sh: 1 } },
    { collection: 'ref', id: 'bad3', data: { id: 'bad3', kind: 'doc', t: 'Đường dẫn lạ', p: 'm/ho-so-be-khac.pdf', sh: 1, d: '2026-11-01' } }]);
  await pullAll(pa); await goCp(pa, 'tri'); t = await main(pa);
  const cards = await pa.$$eval('.tri', xs => xs.map(x => x.innerText));
  ok('phụ huynh thấy đúng 3 thẻ tri ân (2 mục đã đăng + mục "đường dẫn lạ" chỉ còn lời nhắn); không thấy nháp, không thấy mục thiếu đồng ý', cards.length === 3 && !/Bản nháp chưa đăng/.test(t) && !/Thiếu đồng ý/.test(t) && /Cảm ơn Trung tâm rất nhiều/.test(t) && /Bé đã biết chờ đến lượt/.test(t), cards.map(c => c.slice(0, 40)));
  const priv = await pa.evaluate(() => JSON.stringify(DB.tri.filter(x => !x.gone)));
  ok('dữ liệu tri ân phụ huynh nhận: không có đường dẫn, mã bé, cách đồng ý, người đăng', !/"p":/.test(priv) && !/"k":/.test(priv) && !/"cn":/.test(priv) && !/"by":/.test(priv) && !/"bn":/.test(priv) && !/Tin nhắn Zalo/.test(priv) && !/Giấy đồng ý ký tay/.test(priv), priv.slice(0, 500));
  ok('thẻ phụ huynh không có nút Ẩn, Sửa, Xóa và không hiện ghi chú nội bộ', !(await pa.$('[data-a="trsh"],[data-a="trdel"],[data-a="trm"]')) && !/Bé liên quan|Gia đình đồng ý/.test(t));
  ok('mục "đường dẫn lạ": mọi ảnh bị loại bỏ, chỉ còn lời nhắn', await pa.evaluate(() => DB.tri.find(x => x.id === 'bad2').ph.length === 0));
  await sleep(600);
  const photos = await pa.evaluate(() => [...document.querySelectorAll('.tri .mth img.mi')].map(i => i.naturalWidth > 0 && /sign\/gb-media\/t\/.+token=/.test(i.src)));
  ok('ảnh tri ân hiện bằng đường xem tạm (2 ảnh)', photos.length === 2 && photos.every(Boolean), photos);
  await pa.click('.tri .mth'); await pa.waitForSelector('img.mbig'); await sleep(300);
  ok('bấm ảnh: xem lớn, có trước/sau giữa 2 ảnh, không có nút tải', /1\/2/.test(await pa.textContent('.mdl')) && !(await pa.$('.mdl a[href],.mdl a[download]')));
  await pa.click('[data-a="rfnav"][data-v="1"]'); ok('nút Sau sang ảnh 2', /2\/2/.test(await pa.textContent('.mdl'))); await pa.click('[data-a="mx"]');
  const sgt = await pa.evaluate(async () => { const r = await phCall({ action: 'sign', ids: [], refs: [], tris: ['bad1:0', 'bad2:0', 'bad2:1'] }); return { st: r.status, j: await r.json() }; });
  ok('máy chủ không cấp đường xem cho mục thiếu đồng ý hoặc đường dẫn lạ', sgt.st === 200 && Object.keys(sgt.j.urls).length === 0, sgt);
  const sgr = await pa.evaluate(async () => { const r = await phCall({ action: 'sign', ids: [], refs: ['bad3'], tris: [] }); return { st: r.status, j: await r.json() }; });
  ok('tài liệu có đường dẫn ngoài r/ không được ký', sgr.st === 200 && Object.keys(sgr.j.urls).length === 0 && sgr.j.gone.includes('r:bad3'), sgr);
  await goCp(pa, 'ref');
  ok('tài liệu đường dẫn lạ không hiện cho phụ huynh', (await pa.$$('.mc')).length === 2 && !/Đường dẫn lạ/.test(await main(pa)));
  await svc('DELETE', '?collection=in.(tri,ref)&id=in.(bad1,bad2,bad3)');

  /* ---- G. Ẩn, sửa (gỡ ảnh), xóa tri ân ---- */
  await goTd(ql, 'tri'); const triId = tr.find(x => x.cat === 'tb').id;
  await ql.click('.tri:has([data-a="trsh"][data-v="' + triId + '"]) [data-a="trsh"]'); await sleep(250); await flush(ql);
  ok('Ẩn mục tri ân: sh=0 (gia đình rút đồng ý thì gỡ ngay)', rows('tri').find(x => x.id === triId).sh === 0);
  await pullAll(pa); await goCp(pa, 'tri');
  ok('phụ huynh không còn thấy mục đã ẩn (còn 1 thẻ)', (await pa.$$('.tri')).length === 1 && !/Bé đã biết chờ/.test(await main(pa)));
  const sgh = await pa.evaluate(async id => { const r = await phCall({ action: 'sign', ids: [], refs: [], tris: [id + ':0', id + ':1'] }); return await r.json(); }, triId);
  ok('máy chủ không ký ảnh của mục đã ẩn', Object.keys(sgh.urls).length === 0, sgh);
  await ql.click('.tri:has([data-a="trm"][data-v="' + triId + '"]) [data-a="trm"]'); await ql.waitForSelector('#trmf');
  ok('sửa: hiện sẵn dữ liệu cũ và 2 ảnh hiện có để gỡ', (await ql.inputValue('#tr-t')) === 'Bé đã biết chờ đến lượt' && (await ql.$$('#trmf input[name=rm]')).length === 2 && await ql.isChecked('#trmf input[name=cs]'));
  await ql.check('#trmf input[name=rm][value="0"]'); await ql.setInputFiles('#tr-f', [{ name: 'moi.png', mimeType: 'image/png', buffer: PNG }]); await ql.check('#trmf input[name=sh]'); await ql.click('#trmf button[type=submit]');
  await ql.waitForSelector('#trmf', { state: 'detached' }); await sleep(700); await flush(ql);
  tr = rows('tri'); const e1 = tr.find(x => x.id === triId);
  ok('sau sửa: vẫn 2 ảnh (gỡ 1, thêm 1), ảnh cũ bị xóa khỏi kho, đã đăng lại', e1.ph.length === 2 && keys().filter(k => /^t\//.test(k)).length === 2 && e1.ph.every(f => keys().includes(f.p)) && e1.sh === 1, { ph: e1.ph, keys: keys() });
  await ql.click('.tri:has([data-a="trm"][data-v="' + triId + '"]) [data-a="trm"]'); await ql.waitForSelector('#trmf'); await ql.uncheck('#trmf input[name=cs]'); await ql.click('#trmf button[type=submit]'); await sleep(300);
  ok('bỏ tích "gia đình đã đồng ý" khi sửa: không cho lưu', /gia đình đã đồng ý/.test(await ql.textContent('#trmf .err')) && rows('tri').find(x => x.id === triId).cs === 1);
  await ql.click('[data-a="mx"]');
  await ql.click('.tri:has([data-a="trdel"][data-v="' + triId + '"]) [data-a="trdel"]'); await ql.waitForSelector('[data-a="askyes"]'); await ql.click('[data-a="askyes"]'); await sleep(600); await flush(ql);
  ok('xóa mục tri ân: bản ghi mất, toàn bộ ảnh t/ của mục bị xóa khỏi kho', !rows('tri').some(x => x.id === triId) && keys().filter(k => /^t\//.test(k)).length === 0, keys());

  /* ---- H. Khóa cổng phụ huynh (quá hạn học phí) chặn cả hai ---- */
  const docId2 = rows('ref').find(r => r.kind === 'doc').id;
  await tt.evaluate(a => { const due = lkDue(TODAY); DB.lg = DB.lg.filter(e => e.id !== 'eLK1'); DB.lg.push({ id: 'eLK1', hs: a, date: due + '-01', kind: 'hp', amt: 380000, m: due, note: 'thử khóa' }); render(); }, info.a);
  await sleep(1800);
  const lk = await pa.evaluate(async id => { const r = await phCall({ action: 'sign', ids: [], refs: [id], tris: [] }); return { st: r.status, j: await r.json().catch(() => ({})) }; }, docId2);
  ok('phụ huynh quá hạn học phí: sign tài liệu tham khảo trả 423, không đường xem', lk.st === 423 && !lk.j.urls, lk);
  await sleep(600);
  ok('màn hình chuyển sang màn hình khóa, không còn thẻ tài liệu', !!(await pa.$('.plg')) && !(await pa.$('.mc')));
  await tt.evaluate(a => { DB.lg.push({ id: 'eLK2', hs: a, date: TODAY, kind: 'thu', amt: 380000, m: lkDue(TODAY), note: 'đã đóng' }); render(); }, info.a); await sleep(1800);
  await pa.click('[data-a="lockchk"]'); await sleep(900);
  ok('đóng đủ học phí: cổng mở lại', !(await pa.$('.plg')) && !!(await pa.$('.nav')));

  /* ---- I. Tab Hồ sơ, giáo án (tài liệu theo từng bé) vẫn hoạt động ---- */
  await goTd(tt, 'doc'); t = await main(tt);
  ok('tab Hồ sơ, giáo án còn nguyên: nút tải hồ sơ, giáo án lên', !!(await tt.$('[data-a="upm"]')) && /Tải hồ sơ, giáo án lên/.test(t));
  ok('không có lỗi JS trong các trang cloud', errs.length === 0, errs);

  /* ---- J. Bản ?demo và điện thoại ---- */
  const d = await newPage('', 1366, 900);
  await d.waitForSelector('.lg'); await d.click('.roles [data-v="ql"]'); await d.waitForSelector('.nav'); await goTd(d, 'ref');
  ok('demo (quản lý): thấy 3 mục mẫu, có nút thêm', (await d.$$('.mc')).length === 3 && !!(await d.$('[data-a="rfm"]')));
  await d.click('.mth[data-v="r:rf1"]'); await d.waitForSelector('#pdfc');
  ok('demo: PDF mẫu hiện được trong trang, 2 trang', await until(async () => (await d.evaluate(() => { const c = document.querySelector('#pdfc'), x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 0; i < x.length; i += 4) if (x[i + 3] > 200 && x[i] < 128) k++; return k; })) > 200 && /Trang 1\/2/.test(await d.textContent('#pdfpg'))));
  await d.click('[data-a="mx"]');
  await goTd(d, 'tri'); ok('demo: 4 mục tri ân mẫu (1 nháp ẩn) cho nhân viên', (await d.$$('.tri')).length === 4 && /Đang ẩn/.test(await main(d)));
  await d.click('[data-a="trm"]'); await d.waitForSelector('#trmf'); await d.fill('#tr-w', 'Phụ huynh bé T.'); await d.fill('#tr-n', 'Thử trong bản dùng thử.'); await d.setInputFiles('#tr-f', [{ name: 'x.png', mimeType: 'image/png', buffer: PNG }]); await d.check('#trmf input[name=cs]'); await d.click('#trmf button[type=submit]'); await d.waitForSelector('#trmf', { state: 'detached' }); await sleep(300);
  ok('demo: thêm được mục tri ân có ảnh', (await d.$$('.tri')).length === 5);
  const demoAs = async role => { await d.evaluate(() => { try { localStorage.removeItem('gb_u'); } catch (e) { } }); await d.reload(); await d.waitForSelector('.lg'); await d.click('.roles [data-v="' + role + '"]'); };
  await demoAs('gv'); await d.waitForSelector('.nav'); await goTd(d, 'ref');
  ok('demo (giáo viên): thấy mục nhưng không có nút thêm, sửa, xóa', (await d.$$('.mc')).length === 3 && !(await d.$('[data-a="rfm"],[data-a="rfdel"]')));
  await demoAs('ph'); await d.waitForSelector('.nav'); await goCp(d, 'ref');
  ok('demo (phụ huynh): chỉ thấy 2 mục đã đăng, không thấy mục ẩn', (await d.$$('.mc')).length === 2 && !/Bản nháp chưa đăng/.test(await main(d)), await main(d));
  await goCp(d, 'tri'); ok('demo (phụ huynh): chỉ thấy các mục tri ân đã đăng', (await d.$$('.tri')).length === 4 && !/Bản nháp chưa đăng/.test(await main(d)));
  await d.screenshot({ path: SP + '/z23-demo-ph-tri.png', fullPage: false });
  const m = await newPage('', 390, 800);
  await m.waitForSelector('.lg'); await m.click('.roles [data-v="ph"]'); await m.waitForSelector('.nav'); await goCp(m, 'tri');
  const ov = await m.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok('điện thoại 390px: Góc tri ân không tràn ngang', ov.sw <= ov.cw + 1, ov);
  await m.screenshot({ path: SP + '/z23-m-tri.png' });
  await goCp(m, 'ref'); const ov2 = await m.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok('điện thoại 390px: Tài liệu tham khảo không tràn ngang', ov2.sw <= ov2.cw + 1, ov2);
  await m.click('.mth[data-v="r:rf1"]'); await m.waitForSelector('#pdfc'); await until(async () => m.evaluate(() => document.querySelector('#pdfc').width > 100)); await sleep(500);
  const ov3 = await m.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, w: document.querySelector('#pdfc').getBoundingClientRect().width }));
  ok('điện thoại: trang PDF vừa khung, không tràn ngang', ov3.sw <= ov3.cw + 1 && ov3.w <= 390, ov3);
  await m.screenshot({ path: SP + '/z23-m-pdf.png' });
  ok('không có lỗi JS (kể cả bản dùng thử và điện thoại)', errs.length === 0, errs);
  await b.close(); await E.close();
  console.log(pass + ' PASS, ' + fail + ' FAIL'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
