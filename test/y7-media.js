/* Yêu cầu 7 và 8: ảnh, video, tài liệu. Đầu-cuối ở chế độ máy chủ: trình duyệt thật + api/parent.js thật + Supabase giả lập có kho tệp (test/emu.js).
   Kiểm tra: nhân viên tải lên thẳng kho riêng tư, cô bán trú tải ảnh hoạt động chung, giáo viên gắn bé, phụ huynh chỉ xem của bé mình,
   không đọc kho trực tiếp, thu hồi chia sẻ, xóa, khóa cổng chặn cả đường xem tệp. Cuối cùng thử bản ?demo và kích thước điện thoại. */
const { chromium } = require('playwright'); const path = require('path');
const { makeEmu } = require('./emu.js');
const BASE = 'file://' + path.resolve(__dirname, '../src/build/page-test.html');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 600)); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const SP = process.env.SP || '/tmp';
(async () => {
  const E = makeEmu(); await E.listen(); E.addUser('tt@gb.vn', 'ttpass123', { role: 'tt', full_name: 'Trưởng TT' });
  const b = await chromium.launch(), errs = [];
  async function newPage(q, w) {
    const ctx = await b.newContext({ viewport: { width: w || 1366, height: 900 } }); const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::|status of 4/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
    page.sb = []; page.on('request', r => { if (/supabase\.co/.test(r.url())) page.sb.push(r.method() + ' ' + new globalThis.URL(r.url()).pathname); });
    await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
    await ctx.addInitScript(() => { window.GB_API = 'https://gb.test'; });
    await E.attach(page); await E.attachApi(page, 'https://gb.test'); await page.goto(BASE + (q || '?cloud')); return page;
  }
  const login = async (page, e, p) => { await page.waitForSelector('#login'); await page.fill('#lg-e', e); await page.fill('#lg-p', p); await page.click('#login button[type=submit]'); };
  const main = page => page.evaluate(() => (document.querySelector('#main') || document.querySelector('#app')).innerText);
  const goTd = async (page, tab) => { await page.evaluate(t => { S.v = 'td'; S.td = Object.assign({}, S.td, { tab: t || 'gal', sel: [] }); S.modal = null; render(); }, tab); await sleep(250); };
  const pullAll = async page => { for (let i = 0; i < 14; i++) { const x = await page.evaluate(async () => { const a = CLD.since.records; await cloudPull(); return a === CLD.since.records; }); await sleep(150); if (x) break; } };
  const flush = async page => { await page.evaluate(() => cloudFlush()); await sleep(500); };

  /* ---- Trưởng Trung tâm dựng dữ liệu: lớp Ong non, 3 bé, hai phụ huynh ---- */
  const tt = await newPage();
  await login(tt, 'tt@gb.vn', 'ttpass123'); await tt.waitForSelector('[data-a="csetup"]'); await tt.click('[data-v="demo"]'); await tt.waitForSelector('.nav'); await sleep(1500);
  const info = await tt.evaluate(() => {
    const g = DB.groups[0], gk = DB.kids.filter(k => k.gr === g.id && k.st === 'dang');
    const [a, b2, c] = gk; a.pe = 'pa@x.vn'; a.pp = ''; b2.pe = 'pa@x.vn'; b2.pp = ''; c.pe = 'pc@x.vn'; c.pp = '';
    const other = DB.kids.find(k => k.st === 'dang' && k.gr !== g.id && !gk.includes(k)); if (other) { other.pe = 'po@x.vn'; other.pp = ''; }
    const gv1 = DB.staff.find(s => s.id === g.gv), gv2 = DB.staff.find(s => s.role === 'gv' && s.st === 'dang' && s.id !== g.gv && s.id !== g.tg && !DB.kids.some(k => k.gv === s.id && gk.some(x => x.id === k.id)) && !DB.lich.some(l => l.gv === s.id && gk.some(x => x.id === l.hs)));
    gv1.em = 'gv1@gb.vn'; gv2.em = 'gv2@gb.vn';
    const ql = DB.staff.find(s => s.role === 'ql' && s.st === 'dang'), vp = DB.staff.find(s => s.role === 'vp' && s.st === 'dang'); ql.em = 'ql@gb.vn'; vp.em = 'vp@gb.vn';
    DB.media = []; DB.lg = DB.lg.filter(e => ![a.id, b2.id, c.id].includes(e.hs));
    render(); return { g: g.id, gn: g.n, a: a.id, an: a.n, b: b2.id, bn: b2.n, c: c.id, cn: c.n, o: other && other.id, gv1: gv1.id, gv2: gv2 && gv2.id, ql: ql.id, vp: vp.id, pn: a.pn };
  });
  await sleep(1800);
  ok('dữ liệu dựng xong, gv2 là giáo viên không liên quan lớp', info.gv2 && info.a && info.c, info);
  E.addUser('gv1@gb.vn', 'gv1pass123', { role: 'gv', staff_id: info.gv1, full_name: 'GV1' });
  E.addUser('gv2@gb.vn', 'gv2pass123', { role: 'gv', staff_id: info.gv2, full_name: 'GV2' });
  E.addUser('ql@gb.vn', 'qlpass123', { role: 'ql', staff_id: info.ql, full_name: 'QL' });
  E.addUser('vp@gb.vn', 'vppass123', { role: 'vp', staff_id: info.vp, full_name: 'VP' });
  E.addUser('pa@x.vn', 'papass123', { role: 'ph', staff_id: 'ph|pa@x.vn', full_name: 'Phụ huynh A' });
  E.addUser('pc@x.vn', 'pcpass123', { role: 'ph', staff_id: 'ph|pc@x.vn', full_name: 'Phụ huynh C' });

  /* ---- A. Cô bán trú (gv1) tải ảnh và video hoạt động chung của lớp ---- */
  const gv1 = await newPage();
  await login(gv1, 'gv1@gb.vn', 'gv1pass123'); await gv1.waitForSelector('.nav'); await sleep(1200);
  await goTd(gv1);
  let t = await main(gv1);
  ok('giáo viên thấy mục "Ảnh, video và tài liệu" và nút tải lên', /Ảnh, video và tài liệu/.test(t) && !!(await gv1.$('[data-a="upm"]')), t.slice(0, 200));
  await gv1.click('[data-a="upm"]'); await gv1.waitForSelector('#upmf');
  ok('cửa sổ tải lên có ô chọn lớp bán trú và danh sách bé', !!(await gv1.$('#um-g')) && (await gv1.$$('#upmf input[name=kid]')).length >= 3 && /500 MB/.test(await gv1.textContent('#upmf')));
  ok('ô chọn tệp cho nhiều tệp, chỉ ảnh và video', (await gv1.getAttribute('#um-f', 'multiple')) !== null && /image/.test(await gv1.getAttribute('#um-f', 'accept')));
  /* kiểm tra lỗi trước khi tải */
  await gv1.click('#upmf button[type=submit]', { force: true }).catch(() => { });
  await gv1.setInputFiles('#um-f', [{ name: 'a.png', mimeType: 'image/png', buffer: PNG }]); await gv1.click('#upmf button[type=submit]'); await sleep(200);
  ok('không chọn bé và không chọn lớp: báo lỗi, không tải gì', /chọn bé, hoặc chọn lớp bán trú/.test(await gv1.textContent('#upmf .err')) && E.objs.size === 0, await gv1.textContent('#upmf .err'));
  await gv1.setInputFiles('#um-f', [{ name: 'virus.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') }]); await gv1.selectOption('#um-g', info.g); await gv1.click('#upmf button[type=submit]'); await sleep(200);
  ok('tệp .exe bị từ chối trước khi tải', /định dạng chưa hỗ trợ/.test(await gv1.textContent('#upmf .err')) && E.objs.size === 0, await gv1.textContent('#upmf .err'));
  await gv1.setInputFiles('#um-f', [{ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') }]); await gv1.click('#upmf button[type=submit]'); await sleep(200);
  ok('tài liệu ở nút tải ảnh: hướng sang mục Hồ sơ, giáo án', /mục Hồ sơ, giáo án/.test(await gv1.textContent('#upmf .err')) && E.objs.size === 0);
  { const fs = require('fs'); fs.writeFileSync(SP + '/big501.mp4', ''); fs.truncateSync(SP + '/big501.mp4', 501 * 1024 * 1024); }   /* tệp thưa: không tốn đĩa */
  await gv1.setInputFiles('#um-f', SP + '/big501.mp4'); await gv1.click('#upmf button[type=submit]'); await sleep(400);
  ok('video lớn hơn 500 MB bị chặn ở trình duyệt, không gửi lên máy chủ', /lớn hơn 500 MB/.test(await gv1.textContent('#upmf .err')) && E.objs.size === 0 && !gv1.sb.some(r => /POST \/storage\/v1\/object\/gb-media\/m\//.test(r)), gv1.sb.slice(-4));
  /* tải hợp lệ: một ảnh và một video, hoạt động chung của lớp, chưa gắn bé */
  await gv1.setInputFiles('#um-f', [{ name: 'to-mau.png', mimeType: 'image/png', buffer: PNG }, { name: 'hat-mua.mp4', mimeType: 'video/mp4', buffer: Buffer.from('fakevideobytes0123456789') }]);
  await gv1.fill('#um-n', 'Buổi sáng vui vẻ'); await gv1.click('#upmf button[type=submit]');
  await gv1.waitForSelector('#upmf', { state: 'detached' }); await sleep(500);
  const mediaRows = () => [...E.recs.values()].filter(r => r.collection === 'media').map(r => r.data);
  await flush(gv1); let rows = mediaRows();
  ok('hai tệp nằm trong kho gb-media, đường dẫn m/<mã>.<đuôi>', E.objs.size === 2 && [...E.objs.keys()].every(k => /^m\/[A-Za-z0-9_.\-]+\.(png|jpg|mp4)$/.test(k)), [...E.objs.keys()]);
  ok('chủ tệp trong kho là tài khoản giáo viên đã tải', [...E.objs.values()].every(o => typeof o.owner === 'string' && o.owner !== 'svc'));
  ok('hai bản ghi media lên máy chủ: lớp Ong non, chưa gắn bé, người tải là gv1', rows.length === 2 && rows.every(r => r.gr === info.g && r.ks.length === 0 && r.by === info.gv1 && r.sh === 1 && r.n === 'Buổi sáng vui vẻ' && /^m\//.test(r.p)), rows);
  ok('một ảnh, một video', rows.filter(r => r.kind === 'img').length === 1 && rows.filter(r => r.kind === 'vid').length === 1 && rows.find(r => r.kind === 'vid').ct === 'video/mp4');
  ok('bản ghi không chứa dữ liệu ảnh trong cơ sở dữ liệu (chỉ đường dẫn)', rows.every(r => !r.u) && JSON.stringify(rows).length < 2000, JSON.stringify(rows).length);
  ok('ảnh chờ gắn bé: thẻ "Chưa gắn bé" và nhãn tab đếm 2', /2 chờ gắn bé/.test(await main(gv1)));

  /* ---- B. Gắn bé cho ảnh hoạt động chung ---- */
  await goTd(gv1, 'grp');
  ok('tab Hoạt động chung mặc định hiện ảnh chờ gắn bé', (await gv1.$$('.mc')).length === 2);
  await sleep(600);
  const imgOk = await gv1.evaluate(() => [...document.querySelectorAll('.mth img.mi')].map(i => i.naturalWidth > 0 && /\/storage\/v1\/object\/sign\/gb-media\/m\/.+token=/.test(i.src)));
  ok('thumbnail ảnh tải được bằng đường xem tạm có token (không phải đường công khai)', imgOk.length === 1 && imgOk[0], imgOk);
  ok('không có đường công khai /object/public/', !gv1.sb.some(r => /\/object\/public\//.test(r)));
  await gv1.click('[data-a="mselall"]'); t = await main(gv1);
  ok('bấm "Chọn cả trang này": nút gắn hiện "2 tệp đã chọn"', /Gắn bé cho 2 tệp đã chọn/.test(t), t.slice(300, 700));
  await gv1.click('[data-a="mtagsel"]'); await gv1.waitForSelector('#mtagf');
  const names = await gv1.$$eval('#mtagf input[name=kid]', xs => xs.map(x => x.value));
  ok('danh sách bé gắn: chỉ bé của lớp, có đủ 3 bé thử', names.includes(info.a) && names.includes(info.b) && names.includes(info.c) && !names.includes(info.o), names);
  await gv1.check('#mtagf input[value="' + info.a + '"]'); await gv1.check('#mtagf input[value="' + info.b + '"]');
  await gv1.click('#mtagf button[type=submit]'); await sleep(300); await flush(gv1); rows = mediaRows();
  ok('lưu: cả hai tệp gắn bé A và B, đã chia sẻ', rows.length === 2 && rows.every(r => r.ks.slice().sort().join() === [info.a, info.b].sort().join() && r.sh === 1), rows.map(r => r.ks));
  /* ảnh thứ ba, tải riêng cho bé C, không chia sẻ */
  await gv1.click('[data-a="upm"]'); await gv1.waitForSelector('#upmf');
  await gv1.setInputFiles('#um-f', [{ name: 'rieng-c.png', mimeType: 'image/png', buffer: PNG }]); await gv1.check('#upmf input[value="' + info.c + '"]'); await gv1.fill('#um-t', 'Bé C tập viết');
  await gv1.uncheck('#upmf input[name=sh]'); await gv1.click('#upmf button[type=submit]'); await gv1.waitForSelector('#upmf', { state: 'detached' }); await sleep(400); await flush(gv1);
  const cRec = mediaRows().find(r => r.t === 'Bé C tập viết');
  ok('ảnh riêng của bé C: gắn C, tên hiển thị tự đặt, chưa chia sẻ', cRec && cRec.ks.join() === info.c && cRec.sh === 0 && cRec.gr === '', cRec);
  /* thêm một tài liệu giáo án chỉ nhân viên */
  const vpPage = await newPage();
  await login(vpPage, 'vp@gb.vn', 'vppass123'); await vpPage.waitForSelector('.nav'); await sleep(1200);
  ok('Văn phòng có mục Ảnh, video và tài liệu', (await vpPage.$$eval('.nav a, .nav button, nav [data-a="nav"]', xs => xs.map(x => x.textContent)).catch(() => [])).some(x => /Ảnh, video và tài liệu/.test(x)) || (await vpPage.evaluate(() => ACCESS.vp.includes('td'))));
  await goTd(vpPage, 'doc'); await vpPage.click('[data-a="upm"]'); await vpPage.waitForSelector('#upmf');
  await vpPage.setInputFiles('#um-f', [{ name: 'ho-so-a.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 hồ sơ') }]); await vpPage.selectOption('#um-c', 'Hồ sơ trẻ'); await vpPage.click('#upmf button[type=submit]'); await sleep(250);
  ok('tài liệu "Hồ sơ trẻ" không gắn bé: báo lỗi', /cần gắn với bé/.test(await vpPage.textContent('#upmf .err')), await vpPage.textContent('#upmf .err'));
  await vpPage.check('#upmf input[value="' + info.a + '"]'); await vpPage.click('#upmf button[type=submit]'); await vpPage.waitForSelector('#upmf', { state: 'detached' }); await sleep(400); await flush(vpPage);
  await goTd(vpPage, 'doc'); await vpPage.click('[data-a="upm"]'); await vpPage.waitForSelector('#upmf');
  await vpPage.setInputFiles('#um-f', [{ name: 'giao-an-tuan-45.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('PK\x03\x04docx') }]); await vpPage.selectOption('#um-c', 'Giáo án'); await vpPage.uncheck('#upmf input[name=sh]');
  await vpPage.click('#upmf button[type=submit]'); await vpPage.waitForSelector('#upmf', { state: 'detached' }); await sleep(400); await flush(vpPage);
  const docs = mediaRows().filter(r => r.kind === 'doc');
  ok('Văn phòng tải được 2 tài liệu: hồ sơ gắn bé A và giáo án nội bộ', docs.length === 2 && docs.some(d => d.cat === 'Hồ sơ trẻ' && d.ks.join() === info.a && d.sh === 1) && docs.some(d => d.cat === 'Giáo án' && d.ks.length === 0 && d.sh === 0), docs);
  ok('tài liệu docx được nhận (loại Word)', [...E.objs.values()].some(o => o.ct === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));

  /* ---- C. Phụ huynh A xem: chỉ ảnh có bé A, B; thấy tài liệu của bé A ---- */
  const pa = await newPage();
  await login(pa, 'pa@x.vn', 'papass123'); await pa.waitForSelector('.nav'); await sleep(800);
  await pa.evaluate(() => { S.cp = Object.assign(S.cp || {}, { tab: 'vd' }); S.v = 'cp'; render(); }); await sleep(900);
  t = await main(pa);
  ok('phụ huynh A: tab "Ảnh, video và tài liệu" có tiêu đề và lời nhắc bảo vệ hình ảnh', /Ảnh và video của bé/.test(t) && /không đăng hoặc gửi cho người khác/.test(t), t.slice(0, 400));
  const pam = await pa.evaluate(() => medList().map(m => ({ id: m.id, kind: m.kind, ks: m.ks, hasP: 'p' in m, gone: !!m.gone })));
  ok('phụ huynh A nhận 2 ảnh/video + 1 tài liệu, không nhận ảnh riêng bé C và giáo án nội bộ', pam.length === 3 && pam.filter(m => m.kind !== 'doc').length === 2 && pam.filter(m => m.kind === 'doc').length === 1, pam);
  ok('phụ huynh không nhận đường dẫn kho (p) trong dữ liệu', pam.every(m => !m.hasP), pam);
  ok('mã bé trong dữ liệu của phụ huynh A chỉ gồm bé của chính họ', pam.every(m => m.ks.every(i => [info.a, info.b].includes(i))), pam);
  ok('phụ huynh không đọc bảng trực tiếp', !pa.sb.some(r => /\/rest\/v1\/(records|money_records)/.test(r)), pa.sb);
  const pImgs = await pa.evaluate(() => [...document.querySelectorAll('.mth img.mi')].map(i => ({ w: i.naturalWidth, s: i.src.slice(0, 80) })));
  ok('ảnh của bé hiện ra thật (tải bằng đường xem tạm do máy chủ cấp)', pImgs.length === 1 && pImgs[0].w > 0 && /object\/sign\/gb-media/.test(pImgs[0].s), pImgs);
  ok('chữ trong cổng phụ huynh đủ lớn (tiêu đề thẻ ≥ 15px)', (await pa.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.mg.big .mt')).fontSize))) >= 15);
  ok('phụ huynh không thấy nút xóa, gắn bé, chia sẻ', !(await pa.$('[data-a="mdel"],[data-a="mtag"],[data-a="mshare"]')));
  ok('tài liệu của bé có liên kết xem (đã có token)', !!(await pa.$('table a[data-mid][href*="token="]')), await pa.$$eval('table a', xs => xs.map(x => x.outerHTML.slice(0, 120))));
  ok('máy chủ cấp đường xem qua hành động sign', (E.apiLog || []).filter(x => /^parent 200/.test(x)).length >= 2);
  /* mở xem lớn */
  await pa.click('.mth[data-a="mview"]'); await pa.waitForSelector('.mv'); await sleep(500);
  ok('xem lớn: có ảnh hoặc video, có nút Sau, không có nút xóa', !!(await pa.$('.mv .mbig')) && !(await pa.$('.mdc [data-a="mdel"]')), await pa.textContent('.mdc'));
  await pa.click('[data-a="mx"]'); await sleep(200);
  ok('đóng xem lớn quay về trang', !(await pa.$('.mdl')));
  /* lạm dụng trực tiếp */
  const abuse = await pa.evaluate(async ({ cid, key }) => {
    const out = {};
    const mine = medList().map(m => m.id);
    const all = [...new Set(mine)];
    const rows = [...(window.__x || [])];
    let r = await phCall({ action: 'sign', ids: ['khong-ton-tai', '../etc/passwd', cid] }); out.s1 = { st: r.status, j: await r.json() };
    r = await fetch(SB.url + '/storage/v1/object/sign/gb-media', { method: 'POST', headers: { apikey: SB.key, Authorization: 'Bearer ' + CLD.ss.at, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 60, paths: ['m/x'] }) }); out.direct = r.status;
    r = await fetch(SB.url + '/storage/v1/object/gb-media/m/hack.png', { method: 'POST', headers: { apikey: SB.key, Authorization: 'Bearer ' + CLD.ss.at, 'Content-Type': 'image/png' }, body: new Blob(['x']) }); out.up = r.status;
    r = await phCall({ action: 'put', rows: [{ collection: 'media', id: 'hack1', data: { id: 'hack1', kind: 'img', ks: [], sh: 1, p: 'm/x.png' } }] }); out.put = r.status;
    return out;
  }, { cid: cRec.id });
  ok('sign cho tệp bé khác, mã lạ, mã dò đường: không cấp đường xem, báo "gone"', abuse.s1.st === 200 && Object.keys(abuse.s1.j.urls).length === 0 && abuse.s1.j.gone.includes(cRec.id) && !abuse.s1.j.gone.includes('../etc/passwd') || (abuse.s1.j.gone.length >= 2 && Object.keys(abuse.s1.j.urls).length === 0), abuse.s1);
  ok('phụ huynh gọi thẳng kho để ký đường xem: bị từ chối', abuse.direct >= 400, abuse);
  ok('phụ huynh tải tệp lên kho: bị từ chối', abuse.up >= 400 && ![...E.objs.keys()].some(k => /hack/.test(k)), abuse);
  ok('phụ huynh ghi media qua hàm máy chủ: bị từ chối', abuse.put === 403 && !E.recs.has('media|hack1'), abuse);

  /* ---- D. Phụ huynh C: chỉ thấy đúng phần của bé C (bé C chưa được chia sẻ ảnh riêng) ---- */
  const pc = await newPage();
  await login(pc, 'pc@x.vn', 'pcpass123'); await pc.waitForSelector('.nav'); await sleep(800);
  await pc.evaluate(() => { S.cp = Object.assign(S.cp || {}, { tab: 'vd' }); S.v = 'cp'; render(); }); await sleep(600);
  t = await main(pc);
  ok('phụ huynh C chưa thấy gì (ảnh riêng bé C chưa chia sẻ, ảnh lớp chỉ gắn bé A, B)', (await pc.evaluate(() => medList().filter(m => medSee(m)).length)) === 0 && /Chưa có ảnh hoặc video nào của bé/.test(t), t.slice(0, 300));
  /* gv1 gắn thêm bé C vào ảnh của lớp rồi chia sẻ ảnh riêng của bé C */
  await goTd(gv1, 'grp'); await gv1.selectOption('#tds', 'all'); await sleep(200);
  const imgId = mediaRows().find(r => r.kind === 'img' && r.gr === info.g).id;
  await gv1.click('.mc [data-a="mtag"][data-v="' + imgId + '"]'); await gv1.waitForSelector('#mtagf');
  ok('gắn một tệp: bé A và B đã được chọn sẵn', (await gv1.$$eval('#mtagf input[name=kid]:checked', xs => xs.map(x => x.value))).sort().join() === [info.a, info.b].sort().join());
  await gv1.check('#mtagf input[value="' + info.c + '"]'); await gv1.click('#mtagf button[type=submit]'); await sleep(300);
  await goTd(gv1, 'gal'); await gv1.fill('#tdq', 'viết'); await sleep(200);
  await gv1.click('.mc [data-a="mshare"]'); await gv1.waitForSelector('.mdc [data-a="askyes"]');
  ok('bật chia sẻ có hỏi lại, nêu tên bé nhận', new RegExp(info.cn.split(' ').pop()).test(await gv1.textContent('.mdc')), await gv1.textContent('.mdc'));
  await gv1.click('[data-a="askyes"]'); await sleep(300); await flush(gv1);
  ok('ảnh riêng của bé C đã chia sẻ', mediaRows().find(r => r.t === 'Bé C tập viết').sh === 1);
  await pc.evaluate(() => cloudPull()); await sleep(900);
  const pcm = await pc.evaluate(() => medList().filter(m => medSee(m)).map(m => ({ t: m.t, ks: m.ks })));
  ok('phụ huynh C sau đồng bộ: thấy ảnh riêng và ảnh lớp đã gắn bé C, mỗi ảnh chỉ mang mã bé C', pcm.length === 2 && pcm.every(m => m.ks.join() === info.c), pcm);
  await pc.evaluate(() => { S.cp.tab = 'vd'; render() }); await sleep(700);
  ok('ảnh phụ huynh C hiện được', (await pc.evaluate(() => [...document.querySelectorAll('.mth img.mi')].filter(i => i.naturalWidth > 0).length)) === 2);

  /* ---- E. Thu hồi chia sẻ và xóa ---- */
  await goTd(gv1, 'gal'); await gv1.fill('#tdq', 'viết'); await sleep(200);
  await gv1.click('.mc [data-a="mshare"]'); await sleep(300); await flush(gv1);
  ok('ngừng chia sẻ: sh = 0', mediaRows().find(r => r.t === 'Bé C tập viết').sh === 0);
  await pc.evaluate(() => cloudPull()); await sleep(900);
  ok('phụ huynh C sau đồng bộ: ảnh riêng biến mất (nhận thông báo gone, không nhận nội dung)', (await pc.evaluate(() => medList().filter(m => medSee(m)).length)) === 1 && await pc.evaluate(() => medList().some(m => m.gone && !m.t)));
  const sg = await pc.evaluate(async id => { const r = await phApi({ action: 'sign', ids: [id] }); return r }, cRec.id);
  ok('ký lại tệp đã ngừng chia sẻ: không cấp đường xem', Object.keys(sg.urls).length === 0 && sg.gone.includes(cRec.id), sg);
  /* gv2 (không liên quan) không thấy ảnh lớp; không xóa được tệp của người khác */
  const gv2 = await newPage();
  await login(gv2, 'gv2@gb.vn', 'gv2pass123'); await gv2.waitForSelector('.nav'); await sleep(1200); await goTd(gv2, 'grp');
  const g2see = await gv2.evaluate(() => medList().filter(m => m.kind !== 'doc' && medSee(m)).length);
  ok('giáo viên không liên quan lớp: không thấy ảnh, video của lớp và của bé khác', g2see === 0 && (await gv2.$$('.mc')).length === 0, g2see);
  const delOther = await gv2.evaluate(async p => { const r = await sbReq('/storage/v1/object/gb-media/' + p, { method: 'DELETE' }); return r.status }, [...E.objs.keys()][0]);
  ok('giáo viên không phải chủ tệp: xóa khỏi kho bị từ chối (RLS)', delOther === 404 && E.objs.size >= 4, delOther);
  /* gv1 xóa tệp của mình: kho và bản ghi đều mất */
  const before = E.objs.size; await goTd(gv1, 'gal'); await gv1.fill('#tdq', 'viết'); await sleep(200);
  await gv1.click('.mc [data-a="mdel"]'); await gv1.waitForSelector('[data-a="askyes"]'); await gv1.click('[data-a="askyes"]'); await sleep(700); await flush(gv1);
  ok('xóa: tệp mất khỏi kho và bản ghi mất khỏi máy chủ', E.objs.size === before - 1 && !mediaRows().some(r => r.t === 'Bé C tập viết'), [E.objs.size, before]);
  const dpath = [...E.objs.keys()][0];
  /* ql, tt thấy tất cả và xóa được của người khác */
  const ql = await newPage();
  await login(ql, 'ql@gb.vn', 'qlpass123'); await ql.waitForSelector('.nav'); await sleep(1200); await goTd(ql, 'gal');
  ok('Quản lý thấy ảnh đã gắn bé và nút tải lên', (await ql.$$('.mc')).length >= 1 && !!(await ql.$('[data-a="upm"]')));
  ok('Quản lý có nút xóa cho tệp của giáo viên', !!(await ql.$('.mc [data-a="mdel"]')));
  ok('Quản lý vẫn không nhận dữ liệu tiền (không đổi quy tắc)', await ql.evaluate(() => !canM()));

  /* ---- F. Khóa cổng phụ huynh chặn cả đường xem tệp ---- */
  const lockInfo = await tt.evaluate(a => { const due = lkDue(TODAY); DB.lg = DB.lg.filter(e => e.id !== 'eLK1'); DB.lg.push({ id: 'eLK1', hs: a, date: due + '-01', kind: 'hp', amt: 380000, m: due, note: 'thử khóa' }); render(); return due; }, info.a);
  await sleep(1800);
  const lk = await pa.evaluate(async () => { MED.u = {}; const ids = medList().filter(m => !m.gone).map(m => m.id); const r = await phCall({ action: 'sign', ids }); return { st: r.status, j: await r.json().catch(() => ({})) }; });
  ok('phụ huynh quá hạn học phí: sign trả 423 và không cấp đường xem tệp', lk.st === 423 && !lk.j.urls, lk);
  await sleep(600);
  ok('màn hình phụ huynh chuyển sang màn hình khóa', !!(await pa.$('.plg')) && !(await pa.$('.mth')));
  await tt.evaluate(a => { DB.lg.push({ id: 'eLK2', hs: a, date: TODAY, kind: 'thu', amt: 380000, m: lkDue(TODAY), note: 'đã đóng' }); render(); }, info.a); await sleep(1800);
  await pa.click('[data-a="lockchk"]'); await sleep(900);
  ok('đóng đủ học phí: cổng mở lại, thấy ảnh', !(await pa.$('.plg')) && !!(await pa.$('.nav')));

  /* ---- G. Thu nhỏ ảnh lớn, tải lại khi hết hạn đường xem ---- */
  const big = await tt.evaluate(async () => {
    const cv = document.createElement('canvas'); cv.width = 3600; cv.height = 2400; const cx = cv.getContext('2d');
    for (let i = 0; i < 400; i++) { cx.fillStyle = `hsl(${i * 7 % 360},70%,${30 + i % 40}%)`; cx.fillRect((i * 97) % 3600, (i * 53) % 2400, 300, 200); }
    const bl = await new Promise(r => cv.toBlob(r, 'image/png')); const f = new File([bl], 'lon.png', { type: 'image/png' });
    const sm = await medScale(f, 1600, .82); const bm = await createImageBitmap(sm);
    return { orig: f.size, w: bm.width, h: bm.height, n: sm.size, type: sm.type };
  });
  ok('ảnh 3600×2400 thu về tối đa 1600 cạnh dài, JPEG, nhẹ hơn nhiều', big.w === 1600 && big.h === 1067 && big.type === 'image/jpeg' && big.n < big.orig, big);
  await pullAll(tt); await goTd(tt, 'gal'); await sleep(900);
  const rl = await tt.evaluate(async () => {
    const img = document.querySelector('.mth img.mi'); const old = img.getAttribute('src'); return old;
  });
  E.signs.clear();
  await tt.evaluate(() => { const img = document.querySelector('.mth img.mi'); img.setAttribute('src', img.getAttribute('src') + '&r=1'); }); await sleep(1500);
  const after = await tt.evaluate(() => { const i = document.querySelector('.mth img.mi'); return { w: i.naturalWidth, s: i.getAttribute('src') }; });
  ok('đường xem hết hạn: tự xin lại và ảnh hiện lại', after.w > 0 && !/&r=1/.test(after.s), after);
  const sc0 = E.signCount; await tt.evaluate(() => { for (let i = 0; i < 5; i++) render(); }); await sleep(600);
  ok('vẽ lại nhiều lần không xin lại đường xem (đã nhớ tạm, xin theo lô)', E.signCount === sc0 && E.signCount <= 20, [sc0, E.signCount]);

  /* ---- H. Điện thoại: không tràn ngang ---- */
  const ph = await newPage('?cloud', 390);
  await login(ph, 'gv1@gb.vn', 'gv1pass123'); await ph.waitForSelector('.nav, .top'); await sleep(1500);
  const ovf = async (page, n) => { const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth, bad: [...document.querySelectorAll('.mdc *, #main *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.tw,.tabs,table')).slice(0, 3).map(e => e.className + ':' + e.tagName)})); ok(n + ': không tràn ngang ở 390px', w.s <= w.c + 1 && w.bad.length === 0, w); };
  await goTd(ph, 'gal'); await ovf(ph, 'thư viện ảnh');
  await goTd(ph, 'grp'); await ph.selectOption('#tds', 'all'); await sleep(200); await ovf(ph, 'Hoạt động chung');
  await ph.click('[data-a="upm"]'); await ph.waitForSelector('#upmf'); await ovf(ph, 'cửa sổ tải lên');
  await ph.screenshot({ path: SP + '/y7-phone-up.png' });
  await ph.click('[data-a="mx"]'); await sleep(200);
  await ph.evaluate(() => { const m = medList().find(x => x.kind === 'img'); S.modal = { t: 'mtag', ids: [m.id], back: null }; render(); }); await sleep(300); await ovf(ph, 'cửa sổ gắn bé');
  await ph.evaluate(() => { S.modal = null; render(); });
  const pph = await newPage('?cloud', 390);
  await login(pph, 'pa@x.vn', 'papass123'); await pph.waitForSelector('.nav, .top'); await sleep(900);
  await pph.evaluate(() => { S.cp = Object.assign(S.cp || {}, { tab: 'vd' }); S.v = 'cp'; render(); }); await sleep(900); await ovf(pph, 'cổng phụ huynh');
  await pph.screenshot({ path: SP + '/y7-phone-parent.png' });
  await pa.screenshot({ path: SP + '/y7-parent-desktop.png' });
  await gv1.evaluate(() => { S.td.tab = 'grp'; S.td.st = 'all'; render(); }); await sleep(500); await gv1.screenshot({ path: SP + '/y7-staff-grp.png' });

  /* ---- I. Chế độ ?demo: ảnh mẫu, tải lên trong phiên ---- */
  const demo = await newPage('?demo');
  await demo.waitForSelector('.lg'); await demo.click('.roles [data-v="gv"]'); await demo.waitForSelector('.nav');
  const dm = await demo.evaluate(() => ({ n: DB.media.length, gv: myGroups().map(g => g.id), see: DB.media.filter(medSee).length }));
  ok('?demo có ảnh mẫu trong dữ liệu', dm.n >= 4, dm);
  await goTd(demo, 'gal'); await demo.click('[data-a="upm"]'); await demo.waitForSelector('#upmf');
  await demo.setInputFiles('#um-f', [{ name: 'demo.png', mimeType: 'image/png', buffer: PNG }]); await demo.check('#upmf input[name=kid]'); await demo.click('#upmf button[type=submit]'); await demo.waitForSelector('#upmf', { state: 'detached' }); await sleep(500);
  ok('?demo: tải ảnh lên chạy trong trình duyệt, không gọi máy chủ', (await demo.evaluate(() => DB.media.some(m => m.t === 'demo'))) && !demo.sb.length, demo.sb);
  const demoPh = await newPage('?demo');
  await demoPh.waitForSelector('.lg'); await demoPh.click('.roles [data-v="ph"]'); await demoPh.waitForSelector('.nav');
  const dp = await demoPh.evaluate(() => { const k = myKids(); return { kids: k.map(x => x.id), see: DB.media.filter(medSee).every(m => m.ks.some(canKid) && m.sh), n: DB.media.filter(medSee).length }; });
  ok('?demo phụ huynh: chỉ thấy tệp đã chia sẻ có bé của mình', dp.see, dp);
  const noUp = await demoPh.evaluate(() => canUpload());
  ok('phụ huynh không có quyền tải lên', noUp === false);

  ok('không có lỗi trình duyệt', errs.length === 0, errs.slice(0, 5));
  console.log('\n' + pass + ' đạt, ' + fail + ' lỗi'); E.close(); await b.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
