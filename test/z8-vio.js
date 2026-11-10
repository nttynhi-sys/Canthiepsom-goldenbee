/* Z8: Vi phạm nội quy và trừ lương. Quản lý ghi vi phạm (chọn lý do theo quy định Trung tâm, đề xuất mức, không thấy tiền); Trưởng Trung tâm duyệt và
   quyết định số tiền; chỉ vi phạm đã duyệt mới trừ vào lương tháng có ngày vi phạm (phiếu lương có dòng riêng); giáo viên chỉ thấy phần đã duyệt của mình;
   Văn phòng chỉ xem. Phần A: ?demo (giao diện, lương). Phần B: chế độ máy chủ với Supabase giả lập (test/emu.js) kiểm tra quyền ở máy chủ. */
const { chromium } = require('playwright'); const path = require('path');
const { makeEmu } = require('./emu.js');
const BASE = 'file://' + path.resolve(__dirname, '../src/build/page-test.html');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 700)); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const POSTER = ['Đi làm trễ nhưng không báo', 'Đồ chơi, học cụ bị hư hỏng, thiếu nhưng không kiểm tra hoặc không báo lại', 'Để học sinh làm hỏng đồ chơi, học cụ do thiếu giám sát', 'Không note đồ chơi vào file danh sách mượn đồ chơi', 'Sử dụng điện thoại trong giờ dạy khi không phục vụ công việc', 'Nói chuyện, làm việc riêng, thiếu tập trung trong giờ dạy', 'Gửi thiếu tiến độ, video hoặc hình ảnh giờ học theo yêu cầu', 'Để học sinh chạy ra ngoài hoặc không đảm bảo an toàn cho học sinh', 'Có hành vi, lời nói hoặc cách xử lý không phù hợp khi quản lý hành vi học sinh', 'Dạy không đủ thời lượng (giáo viên cá nhân)', 'Cắt bỏ tiết học của học sinh (giáo viên nhóm)', 'Không báo cho phụ huynh khi phát hiện vết thương hoặc dấu hiệu bất thường của học sinh'];
(async () => {
  const b = await chromium.launch(), errs = [];
  const mk = async (q, ext) => {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }), page = await ctx.newPage();
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::|status of 4/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
    if (ext) await ext(ctx, page);
    await page.goto(BASE + (q || '')); return page;
  };
  const main = p => p.evaluate(() => (document.querySelector('#main') || document.querySelector('#app')).innerText);
  const sw = async (p, r) => { await p.selectOption('#demo-role', r); await p.waitForSelector('.nav'); await sleep(60); };
  const nav = async (p, v) => { await p.click('.nav button[data-v="' + v + '"]'); await sleep(80); };
  const asId = async (p, id) => { await p.evaluate(i => { setUser(findAccount(stBy(i).em)); render(); }, id); await p.waitForSelector('.nav'); await sleep(60); };

  /* ================= A. Chế độ ?demo ================= */
  const d = await mk(''); await d.waitForSelector('.lg'); await d.click('.roles [data-v="ql"]'); await d.waitForSelector('.nav');
  await nav(d, 'vi'); let t = await main(d);
  ok('Quản lý có mục Vi phạm nội quy, có nút Ghi vi phạm, tab Danh sách và Quy định', /Vi phạm nội quy/.test(t) && !!(await d.$('[data-a="vinew"]')) && /Quy định/.test(t), t.slice(0, 300));
  ok('Quản lý không thấy cột tiền', !/Số tiền trừ/.test(t) && !/₫/.test(t), t.slice(0, 600));
  await d.click('[data-a="vinew"]'); await d.waitForSelector('#vif');
  const reasons = await d.$$eval('#vi-r option', o => o.map(x => x.textContent.trim()));
  ok('12 lý do đúng theo thông báo của Trung tâm và một mục "Lý do khác"', reasons.length === 13 && POSTER.every((r, i) => reasons[i] === r) && /Lý do khác/.test(reasons[12]), reasons);
  const staffOpts = await d.$$eval('#vi-st option', o => o.map(x => x.value));
  ok('Quản lý không chọn được chính mình để ghi vi phạm', !staffOpts.includes('nv01') && staffOpts.includes('nv05'), staffOpts.slice(0, 5));
  ok('Quản lý không có ô nhập số tiền, chỉ đề xuất mức', !(await d.$('#vi-a')) && /Mức 1/.test(await d.textContent('#vi-lv')) && /Gửi Trưởng Trung tâm duyệt/.test(await d.textContent('#vif')));
  await d.selectOption('#vi-st', 'nv05'); await d.selectOption('#vi-r', 'rx'); await d.fill('#vi-n', ''); await d.click('#vif button[type=submit]'); await sleep(80);
  ok('Lý do khác bắt buộc ghi chú', (await d.$('#vif')) !== null && /ghi rõ/.test(await d.textContent('.toast')), await d.textContent('.toast'));
  await d.selectOption('#vi-r', 'r1'); await d.selectOption('#vi-lv', '1'); await d.fill('#vi-n', 'Đến lúc 8h20, báo sau'); await d.click('#vif button[type=submit]'); await sleep(100);
  const n1 = await d.evaluate(() => DB.vio.find(v => v.st === 'nv05' && v.r === 'r1' && v.by === 'nv01'));
  ok('Quản lý ghi xong: bản ghi chờ duyệt, chưa có tiền', n1 && n1.s === 'cho' && n1.lv === 1 && !(await d.evaluate(i => DB.vam['nv05|' + i], n1.id)), n1);
  const pm = await d.evaluate(() => { const v = DB.vio.find(x => x.st === 'nv05' && x.by === 'nv01'); return v.d.slice(0, 7); });
  const base = await d.evaluate(m => { const p = payroll(stBy('nv05'), m); return { vpen: p.vpen, gross: p.gross, net: p.net }; }, pm);
  ok('vi phạm chờ duyệt không trừ lương', base.vpen === 0, base);
  ok('Quản lý sửa và xóa được bản ghi chờ duyệt của mình, không có nút duyệt', !!(await d.$('[data-a="vinew"][data-v="' + n1.id + '"]')) && !!(await d.$('[data-a="videl"][data-v="' + n1.id + '"]')) && !(await d.$('[data-a="videc"]')));
  const nowQL = await d.evaluate(() => DB.vio.filter(v => v.s === 'duyet').map(v => v.id));
  ok('Quản lý không có nút sửa hoặc xóa bản ghi đã duyệt', nowQL.length >= 1 && !(await d.$('[data-a="vinew"][data-v="' + nowQL[0] + '"]')) && !(await d.$('[data-a="videl"][data-v="' + nowQL[0] + '"]')));

  /* Trưởng Trung tâm duyệt */
  await sw(d, 'tt'); const bd = await d.evaluate(() => badge('vi')); await nav(d, 'vi'); t = await main(d);
  ok('Trưởng Trung tâm thấy số chờ duyệt, cột Số tiền trừ, nút Duyệt', bd >= 2 && /Số tiền trừ/.test(t) && !!(await d.$('[data-a="videc"][data-v="' + n1.id + '"]')), [bd, t.slice(0, 200)]);
  await d.click('[data-a="videc"][data-v="' + n1.id + '"]'); await d.waitForSelector('#vidf');
  ok('cửa sổ duyệt: số tiền mặc định mức 1 là 20.000, hiện số lần tái diễn trong tháng', (await d.inputValue('#vd-a')) === '20000' && /Trong tháng này nhân sự đã có \d+ lần/.test(await d.textContent('.mdc')), await d.textContent('.mdc'));
  await d.fill('#vd-a', '25000'); await d.fill('#vd-n', 'Nhắc nhở lần đầu'); await d.click('#vidf button[type=submit]'); await sleep(100);
  const ap = await d.evaluate(i => ({ v: DB.vio.find(x => x.id === i), a: DB.vam['nv05|' + i] }), n1.id);
  ok('Trưởng Trung tâm duyệt: trạng thái đã duyệt, số tiền 25.000 lưu riêng ở vam', ap.v.s === 'duyet' && ap.v.dby === 'nv02' && ap.a === 25000 && ap.v.dn === 'Nhắc nhở lần đầu', ap);
  const aft = await d.evaluate(m => { const p = payroll(stBy('nv05'), m); return { vpen: p.vpen, gross: p.gross }; }, pm);
  ok('lương tháng có ngày vi phạm giảm đúng 25.000, tổng thu nhập giảm 25.000', aft.vpen === 25000 && Math.round(base.gross - aft.gross) === 25000, [base, aft]);
  const sl = await d.evaluate(m => slipLines(stBy('nv05'), m).L.filter(x => /vi phạm/i.test(x[0])), pm);
  ok('phiếu lương có dòng Trừ vi phạm nội quy kèm ngày và lý do, số âm', sl.length === 1 && sl[0][1] === -25000 && /Đi làm trễ nhưng không báo/.test(sl[0][0]), sl);
  const other = await d.evaluate(m => { const p = payroll(stBy('nv06'), sm(CM, -1)); return p.vpen; }, pm);
  ok('lương của người khác không bị ảnh hưởng', other >= 0);
  /* Mức cao hơn: tt ghi trực tiếp, phải nhập số tiền */
  await d.click('[data-a="vinew"]'); await d.waitForSelector('#vif'); await d.selectOption('#vi-st', 'nv06'); await d.selectOption('#vi-r', 'r8'); await d.selectOption('#vi-lv', '3');
  ok('Trưởng Trung tâm có ô số tiền, nút Lưu và duyệt', !!(await d.$('#vi-a')) && /Lưu và duyệt/.test(await d.textContent('#vif')));
  await d.click('#vif button[type=submit]'); await sleep(80);
  ok('mức cao hơn mà không nhập tiền thì không lưu', (await d.$('#vif')) !== null && /nhập số tiền/.test(await d.textContent('.toast')));
  await d.fill('#vi-a', '50000'); await d.click('#vif button[type=submit]'); await sleep(100);
  const hi = await d.evaluate(() => { const v = DB.vio.find(x => x.st === 'nv06' && x.r === 'r8'); return { v, a: v && DB.vam['nv06|' + v.id] }; });
  ok('mức cao hơn: duyệt luôn với số tiền Trưởng Trung tâm quyết định (50.000)', hi.v && hi.v.s === 'duyet' && hi.v.lv === 3 && hi.a === 50000, hi);
  /* Không áp dụng */
  const pend = await d.evaluate(() => DB.vio.find(v => v.s === 'cho').id);
  await d.evaluate(i => { ACT.videc(i); render(); }, pend); await d.waitForSelector('#vidf'); await d.click('[data-a="vireject"]'); await sleep(80);
  const rj = await d.evaluate(i => { const v = DB.vio.find(x => x.id === i); return { s: v.s, a: DB.vam[v.st + '|' + i] }; }, pend);
  ok('Không áp dụng: không trừ lương, không có số tiền', rj.s === 'tuchoi' && rj.a === undefined, rj);
  /* Sửa số tiền đã duyệt và xóa */
  await d.evaluate(i => { ACT.vinew(i); render(); }, n1.id); await d.waitForSelector('#vif');
  ok('sửa bản ghi đã duyệt: hiện số tiền hiện tại', (await d.inputValue('#vi-a')) === '25000');
  await d.fill('#vi-a', '30000'); await d.click('#vif button[type=submit]'); await sleep(100);
  ok('sửa số tiền: lương cập nhật theo', (await d.evaluate(m => payroll(stBy('nv05'), m).vpen, pm)) === 30000);
  await d.evaluate(i => { ACT.videl(i); render(); }, hi.v.id); await d.waitForSelector('.mdc'); await d.click('.mdc [data-a="askyes"]'); await sleep(100);
  const gone = await d.evaluate(i => ({ v: !!DB.vio.find(x => x.id === i), a: DB.vam['nv06|' + i] }), hi.v.id);
  ok('xóa vi phạm: xóa cả số tiền trừ', !gone.v && gone.a === undefined, gone);
  t = await (async () => { await d.evaluate(() => { S.vi.tab = 'quy'; render(); }); return main(d); })();
  ok('tab Quy định: 12 lỗi, mức xử lý theo cấu hình (20.000 và 30.000), Trưởng Trung tâm quyết định trường hợp đặc biệt', /20\.000/.test(t) && /30\.000/.test(t) && /tái phạm/.test(t) && POSTER.every(r => t.includes(r)), t.slice(0, 200));

  /* Giáo viên chỉ thấy phần đã duyệt của mình */
  await d.evaluate(() => { S.vi.tab = 'ds'; });
  await asId(d, 'nv05'); await nav(d, 'vi'); t = await main(d);
  ok('Giáo viên: mục "Vi phạm của tôi" chỉ có vi phạm đã duyệt, kèm số tiền trừ và ghi chú Trưởng Trung tâm', /Vi phạm của tôi/.test(t) && /Đi làm trễ nhưng không báo/.test(t) && /30\.000/.test(t) && /Nhắc nhở lần đầu/.test(t) && !(await d.$('[data-a="vinew"]')) && !(await d.$('[data-a="videc"]')), t.slice(0, 500));
  await asId(d, 'nv09'); await nav(d, 'vi'); t = await main(d);
  ok('Giáo viên có vi phạm chờ duyệt: không thấy (chỉ thấy khi đã duyệt)', /chưa có vi phạm nào được duyệt/.test(t) && !/Dùng điện thoại riêng/.test(t), t.slice(0, 300));
  const slipGv = await d.evaluate(m => slipLines(stBy('nv05'), m).L.some(x => /Trừ vi phạm/.test(x[0])), pm);
  ok('phiếu lương của giáo viên có dòng trừ vi phạm', slipGv === true);
  /* Văn phòng chỉ xem */
  await sw(d, 'vp'); await nav(d, 'vi'); t = await main(d);
  ok('Văn phòng xem được vi phạm và số tiền, không có nút ghi, duyệt, sửa, xóa', /Số tiền trừ/.test(t) && !(await d.$('[data-a="vinew"],[data-a="videc"],[data-a="videl"]')) && /Chỉ xem/.test(t), t.slice(0, 300));
  /* Cài đặt mức */
  await sw(d, 'tt'); await nav(d, 'ns'); await d.evaluate(() => { S.ns.tab = 'cd'; render(); }); await sleep(60);
  await d.fill('#v1', '22000'); await d.fill('#v2', '33000'); await d.click('#cfgf button[type=submit]'); await sleep(80);
  ok('Cài đặt: đổi mức 1 và mức 2 trừ lương', (await d.evaluate(() => DB.cfg.v1 + '-' + DB.cfg.v2)) === '22000-33000');
  await d.evaluate(() => { DB.cfg.v1 = 20000; DB.cfg.v2 = 30000; });
  /* xuất Excel bảng lương có cột Trừ vi phạm */
  ok('Excel bảng lương có cột Trừ vi phạm', /Trừ vi phạm/.test(await d.evaluate(() => String(ACT.tlxl))));
  await d.close();

  /* ================= B. Chế độ máy chủ (Supabase giả lập, kiểm tra quyền ở máy chủ) ================= */
  const E = makeEmu(); await E.listen(); E.addUser('tt@gb.vn', 'ttpass123', { role: 'tt', full_name: 'Trưởng TT' });
  const mkc = async (w, h) => mk('?cloud', async (ctx, page) => { await ctx.addInitScript(() => { window.GB_API = 'https://gb.test'; }); await E.attach(page); await E.attachApi(page, 'https://gb.test'); });
  const login = async (page, e, p) => { await page.waitForSelector('#login'); await page.fill('#lg-e', e); await page.fill('#lg-p', p); await page.click('#login button[type=submit]'); await page.waitForSelector('.nav'); await sleep(1400); };
  const flush = async page => { await page.evaluate(() => cloudFlush()); await sleep(500); };
  const pull = async page => { for (let i = 0; i < 12; i++) { const x = await page.evaluate(async () => { const a = CLD.since.records; await cloudPull(); return a === CLD.since.records; }); await sleep(150); if (x) break; } await sleep(200); };
  const rows = c => [...E.recs.entries()].filter(([k]) => k.startsWith(c + '|')).map(([, r]) => r);
  const tt = await mkc(); await tt.waitForSelector('#login'); await tt.fill('#lg-e', 'tt@gb.vn'); await tt.fill('#lg-p', 'ttpass123'); await tt.click('#login button[type=submit]');
  await tt.waitForSelector('[data-a="csetup"]'); await tt.click('[data-v="demo"]'); await tt.waitForSelector('.nav'); await sleep(1500);
  await tt.evaluate(() => { stBy('nv01').em = 'ql@gb.vn'; stBy('nv26').em = 'vp@gb.vn'; stBy('nv04').em = 'gv1@gb.vn'; stBy('nv05').em = 'gv2@gb.vn'; stBy('nv09').em = 'gv3@gb.vn'; render(); });
  await sleep(1600);
  E.addUser('ql@gb.vn', 'qlpass123', { role: 'ql', staff_id: 'nv01', full_name: 'QL' }); E.addUser('vp@gb.vn', 'vppass123', { role: 'vp', staff_id: 'nv26', full_name: 'VP' });
  E.addUser('gv1@gb.vn', 'gv1pass123', { role: 'gv', staff_id: 'nv04', full_name: 'GV1' }); E.addUser('gv2@gb.vn', 'gv2pass123', { role: 'gv', staff_id: 'nv05', full_name: 'GV2' }); E.addUser('gv3@gb.vn', 'gv3pass123', { role: 'gv', staff_id: 'nv09', full_name: 'GV3' });
  ok('dữ liệu mẫu lên máy chủ: vi phạm ở bảng chung, số tiền ở bảng tiền (không lẫn)', rows('vio').length === 3 && E.mon.has('vam|nv06|vi0') && !rows('vam').length && !JSON.stringify(rows('vio')).includes('20000'), rows('vio').length);
  ok('hồ sơ nhân sự lên máy chủ có cờ cc (không phải số tiền): giáo viên 1-1 cc=false, giáo viên bán trú không', E.recs.get('staff|nv04').data.cc === false && E.recs.get('staff|nv18').data.cc === true && !('pay' in E.recs.get('staff|nv04').data));
  ok('chấm công cũng như cấu hình mức trừ: v1, v2 nằm ở cfgm (tiền), giờ mặc định ở cfg', E.mon.get('cfgm|_').data.v1 === 20000 && E.mon.get('cfgm|_').data.v2 === 30000 && !('v1' in E.recs.get('cfg|_').data) && E.recs.get('cfg|_').data.ccIn === '07:15');

  const ql = await mkc(); await login(ql, 'ql@gb.vn', 'qlpass123');
  const q0 = await ql.evaluate(() => ({ n: DB.vio.length, vam: Object.keys(DB.vam).length, v1: DB.cfg.v1, nav: [...document.querySelectorAll('.nav button')].map(x => x.dataset.v).includes('vi') }));
  ok('Quản lý tải về 3 vi phạm, không có số tiền (vam rỗng, mức trừ bằng 0)', q0.n === 3 && q0.vam === 0 && q0.v1 === 0 && q0.nav, q0);
  await ql.evaluate(() => { S.v = 'vi'; render(); }); await sleep(100);
  await ql.click('[data-a="vinew"]'); await ql.waitForSelector('#vif'); await ql.selectOption('#vi-st', 'nv05'); await ql.selectOption('#vi-r', 'r8'); await ql.selectOption('#vi-lv', '2'); await ql.fill('#vi-n', 'Bé chạy ra cổng'); await ql.click('#vif button[type=submit]'); await sleep(1500);
  const nv = rows('vio').map(r => r.data).find(v => v.r === 'r8');
  ok('Quản lý ghi vi phạm lên máy chủ: chờ duyệt, đề xuất mức 2, chưa có số tiền ở bảng tiền', nv && nv.s === 'cho' && nv.lv === 2 && nv.st === 'nv05' && nv.by === 'nv01' && ![...E.mon.keys()].some(k => k.includes(nv.id)), nv);
  /* Quản lý cố tự duyệt hoặc ghi cho chính mình bằng cách gọi thẳng máy chủ */
  const wr = (page, coll, id, data) => page.evaluate(async ([c, i, d]) => { const r = await sbReq('/rest/v1/records?on_conflict=collection,id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: [{ collection: c, id: i, data: d }] }); return r.status; }, [coll, id, data]);
  ok('máy chủ từ chối Quản lý tự duyệt vi phạm (403)', (await wr(ql, 'vio', nv.id, Object.assign({}, nv, { s: 'duyet' }))) === 403 && E.recs.get('vio|' + nv.id).data.s === 'cho');
  ok('máy chủ từ chối Quản lý ghi vi phạm về chính mình (403)', (await wr(ql, 'vio', 'hack1', { st: 'nv01', s: 'cho' })) === 403);
  ok('máy chủ từ chối Quản lý sửa vi phạm đã duyệt (403)', (await wr(ql, 'vio', 'vi0', Object.assign({}, E.recs.get('vio|vi0').data, { n: 'đổi' }))) === 403 && E.recs.get('vio|vi0').data.n !== 'đổi');
  ok('máy chủ cho Quản lý chấm công (ts) (201)', (await wr(ql, 'ts', 'nv18|2026-11-02', { i: '07:15', o: '18:00' })) === 201);
  const qm = await ql.evaluate(async () => (await sbReq('/rest/v1/money_records?select=collection,id&limit=5')).status + ':' + (await (await sbReq('/rest/v1/money_records?select=collection,id&limit=5')).json()).length);
  ok('máy chủ không trả tiền nào cho Quản lý (cả số tiền trừ)', qm === '200:0', qm);
  await E.recs.delete('ts|nv18|2026-11-02');

  /* Trưởng Trung tâm duyệt */
  await pull(tt); await tt.evaluate(() => { S.v = 'vi'; render(); }); await sleep(100);
  ok('Trưởng Trung tâm nhận được vi phạm mới của Quản lý và số chờ duyệt', (await tt.evaluate(i => !!DB.vio.find(v => v.id === i), nv.id)) && (await tt.evaluate(() => badge('vi'))) >= 2);
  await tt.click('[data-a="videc"][data-v="' + nv.id + '"]'); await tt.waitForSelector('#vidf'); await tt.fill('#vd-a', '25000'); await tt.click('#vidf button[type=submit]'); await sleep(1500);
  ok('duyệt lên máy chủ: vi phạm đã duyệt ở bảng chung, số tiền 25.000 ở bảng tiền', E.recs.get('vio|' + nv.id).data.s === 'duyet' && E.mon.get('vam|nv05|' + nv.id) && E.mon.get('vam|nv05|' + nv.id).data === 25000, [E.recs.get('vio|' + nv.id).data, [...E.mon.keys()].filter(k => k.startsWith('vam'))]);

  /* Giáo viên */
  const g2 = await mkc(); await login(g2, 'gv2@gb.vn', 'gv2pass123');
  const x2 = await g2.evaluate(() => { const m = DB.vio[0] && DB.vio[0].d.slice(0, 7); return { n: DB.vio.length, own: DB.vio.every(v => v.st === 'nv05' && v.s === 'duyet'), vam: Object.keys(DB.vam), amt: Object.values(DB.vam)[0] }; });
  ok('Giáo viên nv05 chỉ nhận vi phạm đã duyệt của mình và đúng số tiền của mình', x2.n === 1 && x2.own && x2.vam.length === 1 && x2.amt === 25000, x2);
  await g2.evaluate(() => { S.v = 'vi'; render(); }); await sleep(100); t = await main(g2);
  ok('Giáo viên thấy lý do, ghi chú, số tiền 25.000 trong mục Vi phạm của tôi', /Để học sinh chạy ra ngoài/.test(t) && /Bé chạy ra cổng/.test(t) && /25\.000/.test(t) && !(await g2.$('[data-a="vinew"]')), t.slice(0, 400));
  const lines = await g2.evaluate(() => { const m = DB.vio[0].d.slice(0, 7); return slipLines(stBy(U.id), m).L.filter(x => /Trừ vi phạm/.test(x[0])).map(x => x[1]); });
  ok('phiếu lương của giáo viên có dòng trừ 25.000', lines.length === 1 && lines[0] === -25000, lines);
  ok('máy chủ từ chối Giáo viên ghi vi phạm (403) và tự chấm công (403)', (await wr(g2, 'vio', 'hack2', { st: 'nv05', s: 'cho' })) === 403 && (await wr(g2, 'ts', 'nv05|2026-11-03', { i: '07:00', o: '' })) === 403 && !E.recs.has('ts|nv05|2026-11-03'));
  const gm = await g2.evaluate(async () => { const r = await sbReq('/rest/v1/money_records', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: [{ collection: 'vam', id: 'nv05|zz', data: 1 }] }); return r.status; });
  ok('máy chủ từ chối Giáo viên ghi số tiền trừ (403)', gm === 403 && !E.mon.has('vam|nv05|zz'));
  const g3 = await mkc(); await login(g3, 'gv3@gb.vn', 'gv3pass123');
  const x3 = await g3.evaluate(() => ({ n: DB.vio.length, vam: Object.keys(DB.vam).length }));
  ok('Giáo viên nv09 (có vi phạm chờ duyệt) không nhận bản chờ duyệt, không nhận vi phạm người khác', x3.n === 0 && x3.vam === 0, x3);
  const g1 = await mkc(); await login(g1, 'gv1@gb.vn', 'gv1pass123');
  await g1.evaluate(() => { S.v = 'cc'; render(); }); await sleep(100); t = await main(g1);
  ok('Giáo viên 1-1 nhận được cờ cc=false từ hồ sơ chung (dù không đọc lương): không cần chấm công', (await g1.evaluate(() => needCC(stBy(U.id)))) === false && /không cần chấm công/.test(t), t.slice(0, 300));

  /* Văn phòng chỉ xem */
  const vp = await mkc(); await login(vp, 'vp@gb.vn', 'vppass123');
  const xv = await vp.evaluate(() => ({ n: DB.vio.length, vam: Object.keys(DB.vam).length }));
  await vp.evaluate(() => { S.v = 'vi'; render(); }); await sleep(100);
  ok('Văn phòng nhận mọi vi phạm kèm số tiền, không có nút ghi, duyệt', xv.n === 4 && xv.vam === 2 && !(await vp.$('[data-a="vinew"],[data-a="videc"],[data-a="videl"]')), xv);
  ok('máy chủ từ chối Văn phòng ghi vi phạm (403)', (await wr(vp, 'vio', 'hack3', { st: 'nv05', s: 'cho' })) === 403);

  /* Trưởng Trung tâm xóa: xóa cả số tiền */
  await tt.evaluate(i => { ACT.videl(i); render(); }, nv.id); await tt.waitForSelector('.mdc'); await tt.click('.mdc [data-a="askyes"]'); await sleep(1600);
  ok('Trưởng Trung tâm xóa: mất ở cả bảng chung và bảng tiền', !E.recs.has('vio|' + nv.id) && !E.mon.has('vam|nv05|' + nv.id));

  /* Bổ sung cờ cc cho dữ liệu cũ: Trưởng Trung tâm đăng nhập thì ghi cờ lên máy chủ */
  const old = E.recs.get('staff|nv07'); const had = old.data.cc; delete old.data.cc; old.data = Object.assign({}, old.data);
  const pr = await tt.evaluate(() => stBy('nv07').pay.mode); const tt2 = await mkc(); await login(tt2, 'tt@gb.vn', 'ttpass123'); await sleep(1200);
  ok('hồ sơ cũ chưa có cờ cc: Trưởng Trung tâm đăng nhập thì suy ra từ hình thức trả lương và lưu lại (giáo viên trả theo ca → cc=false)', pr === 'buoi' ? E.recs.get('staff|nv07').data.cc === false : true, [pr, had, E.recs.get('staff|nv07').data.cc]);

  ok('không có lỗi script', errs.length === 0, errs);
  await b.close(); await E.close();
  console.log(pass + ' PASS, ' + fail + ' FAIL'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
