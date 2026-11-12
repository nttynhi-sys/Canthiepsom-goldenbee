/* Z32: loại 1-1 và giá theo loại (7 loại), số giờ đăng ký mỗi ngày, mỗi ca 1-1 có loại và giờ riêng, học phí tính theo giá từng ca */
const { open, login } = require('./h.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 500)); } };
(async () => {
  const { b, page, errs } = await open(); await login(page, 'ql');
  const ev = (f, a) => page.evaluate(f, a); const W = ms => page.waitForTimeout(ms || 80);
  const toastTx = () => ev(() => { const t = document.querySelector('.toast,#toast'); return t ? t.textContent : ''; });
  const cfg = await ev(() => ({ n: LT.length, p: Object.fromEntries(LT.map(x => [x.c, x.f])), names: LT.map(x => x.n) }));
  ok('7 loại 1-1 với đúng giá: ngôn ngữ cá nhân và học nhóm 180.000; vận động–giác quan, massage, vận động thô–tinh 200.000; tự chăm sóc 180.000; vận động dưới nước 190.000',
    cfg.n === 7 && cfg.p.ng === 180000 && cfg.p.nh === 180000 && cfg.p.gq === 200000 && cfg.p.ms === 200000 && cfg.p.vd === 200000 && cfg.p.tc === 180000 && cfg.p.nc === 190000, cfg);
  await page.click('.nav button:has-text("Học sinh")'); await W(120);
  await page.click('[data-a="hsnew"]'); await page.waitForSelector('#hsff');
  const rows = await ev(() => document.querySelectorAll('#hth-11 .lt-row').length);
  const priceTx = await ev(() => [...document.querySelectorAll('#hth-11 .lt-row > .sm')].map(e => e.textContent.trim()));
  /* Quản lý không nhận dữ liệu tiền: thấy 7 loại và ô số giờ nhưng không thấy giá; Trưởng Trung tâm thấy giá hiện hành */
  const priceTT = await ev(() => LT.map(x => fmt(ltFee(x))).join(' '));
  ok('form có 7 ô tích loại, mỗi loại có ô số giờ/ngày; Quản lý không thấy giá, Trưởng Trung tâm thấy giá',
    rows === 7 && priceTx.every(t => !/\d\.\d{3}|₫/.test(t)) && priceTT.indexOf('180.000') >= 0 && priceTT.indexOf('190.000') >= 0 && priceTT.indexOf('200.000') >= 0, [priceTx, priceTT.slice(0, 300)]);
  await page.fill('#hf-n', 'Bé Loại Một'); await page.fill('#hf-pn', 'Mẹ Loại'); await page.fill('#hf-pp', '0905000777');
  await page.check('#hf-h11');
  await page.selectOption('#hf-gv', 'nv01');
  await ev(() => { const f = document.querySelector('#hsff'); f.elements.lt_ng.checked = true; f.elements.lq_ng.value = 2; f.elements.lt_nc.checked = true; f.elements.lq_nc.value = 1; });
  const T = await ev(() => {
    const fr = (w, s) => ROOMS.some(r => !conflict({ day: w, slot: s, gv: 'nv01', hs: 'hsX', room: r }));
    const ok2 = SLOTS.filter(s => [1, 3].every(w => fr(w, s)));
    return { a: ok2[0], b: ok2.find(s => Math.abs(tmin(s) - tmin(ok2[0])) >= SLOT_MIN) };
  });
  ok('tìm được giờ trống cho thử nghiệm', !!(T.a && T.b), T);
  // 2 ca ngôn ngữ trong T2 (đăng ký 2 giờ/ngày) + 1 ca nước T4
  await ev(() => { const f = document.querySelector('#hsff'); const rs = [...f.querySelectorAll('#s11 .s11r')]; rs.forEach(r => r.remove()); });
  const addCa = (w, lt, tm) => ev(([w, lt, tm]) => { const f = document.querySelector('#hsff'); ACT.s11add(null, f.querySelector('#hth-11 [data-a="s11add"]')); const all = f.querySelectorAll('#s11 .s11r'), r = all[all.length - 1]; r.querySelector('[name=s11day]').value = w; r.querySelector('[name=s11lt]').value = lt; r.querySelector('[name=s11tm]').value = tm; }, [w, lt, tm]);
  await addCa(1, 'ng', T.a); await addCa(1, 'ng', T.b); await addCa(3, 'nc', T.a);
  await page.click('#hsff button[type=submit]'); await W(150);
  const r1 = await ev(() => { const k = DB.kids.find(x => x.n === 'Bé Loại Một'); const ls = k ? DB.lich.filter(l => l.type === '11' && l.hs === k.id) : []; return k ? { lt: k.lt, ls: ls.map(l => [l.day, l.lt, l.slot]), fees: ls.map(l => feeSlot(k, l.id)) } : null; });
  ok('lưu: 2 ca ngôn ngữ (T2) và 1 ca vận động dưới nước (T4) đều có loại; số giờ đăng ký được lưu', r1 && r1.ls.length === 3 && r1.ls.filter(x => x[1] === 'ng').length === 2 && r1.ls.some(x => x[1] === 'nc') && r1.lt.ng === 2 && r1.lt.nc === 1, r1);
  ok('học phí của từng ca đúng giá loại: 180.000, 180.000, 190.000', r1 && JSON.stringify(r1.fees.slice().sort((a, b) => a - b)) === JSON.stringify([180000, 180000, 190000]), r1);
  const inv = await ev(() => { const k = DB.kids.find(x => x.n === 'Bé Loại Một'); const m = TODAY.slice(0, 7); const xs = sched(k, m).filter(x => x.kind === '11' && !x.inc); return { n: xs.length, sum: xs.reduce((a, x) => a + feeSlot(k, x.sid), 0), inv: invoice(k, m) }; });
  ok('học phí tháng = tổng giá từng ca 1-1 đã xếp trong tháng (không dùng một giá chung)', inv.inv === inv.sum, inv);
  const info = await ev(() => { const k = DB.kids.find(x => x.n === 'Bé Loại Một'); return ltSummary(k).replace(/<[^>]+>/g, ' '); });
  ok('hồ sơ ghi số giờ đăng ký theo loại', /Học cá nhân ngôn ngữ: 2 giờ\/ngày/.test(info) && /Học vận động dưới nước: 1 giờ\/ngày/.test(info), info);
  // vượt số giờ đăng ký trong 1 ngày bị chặn
  await ev(() => { S.modal = null; render(); });
  await page.click('[data-a="hsnew"]'); await page.waitForSelector('#hsff');
  await page.fill('#hf-n', 'Bé Vượt Giờ'); await page.fill('#hf-pn', 'Mẹ V'); await page.fill('#hf-pp', '0905000888');
  await page.check('#hf-h11'); await page.selectOption('#hf-gv', 'nv01');
  await ev(() => { const f = document.querySelector('#hsff'); f.elements.lt_gq.checked = true; f.elements.lq_gq.value = 1; });
  await addCa(2, 'gq', T.a); await addCa(2, 'gq', T.b);
  await page.click('#hsff button[type=submit]'); await W(100);
  ok('2 ca vận động–giác quan trong một ngày nhưng đăng ký 1 giờ/ngày: báo lỗi, không lưu', /vượt số giờ đăng ký/.test(await toastTx()) && !(await ev(() => DB.kids.some(k => k.n === 'Bé Vượt Giờ'))), await toastTx());
  // ca cũ chưa có loại vẫn tính theo giá chung
  const legacy = await ev(() => { const k = DB.kids.find(x => x.n === 'Bé Loại Một'); const id = 'lgc' + Date.now(); DB.lich.push({ id, type: '11', day: 5, slot: '09:00', gv: 'nv01', hs: k.id, room: 'Phòng 1' }); return { fee: feeSlot(k, id), gen: DB.cfg.p11 }; });
  ok('ca cũ chưa có loại vẫn tính theo giá chung của cài đặt', legacy.fee === legacy.gen, legacy);
  await page.setViewportSize({ width: 390, height: 800 }); await W(120);
  const ov = await ev(() => { const m = document.querySelector('.mdc'); return m ? m.scrollWidth - m.clientWidth : 0; });
  ok('390px: form hồ sơ không tràn ngang khi có 7 loại 1-1', ov <= 1, ov);
  await page.setViewportSize({ width: 1280, height: 900 });
  ok('không có lỗi JS', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
