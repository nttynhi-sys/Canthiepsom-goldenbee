/* Yêu cầu mới: (1) phiếu học phí xuất PDF có dòng Hotline; (2) giáo viên có nút "Tải video lên" và nhận nhiều định dạng video;
   (3) Trưởng Trung tâm và Quản lý xóa được hồ sơ bé, nhân sự, báo cáo. Chạy ở chế độ ?demo (trình duyệt, không máy chủ). */
const { open, login } = require('./h.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 400)); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  /* ---- giáo viên ---- */
  const g = await open(); await login(g.page, 'gv'); const page = g.page;
  await page.evaluate(() => { S.v = 'td'; S.td = Object.assign({}, S.td, { tab: 'gal', sel: [] }); render(); }); await sleep(250);
  const btns = await page.evaluate(() => [...document.querySelectorAll('[data-a="upm"]')].map(x => x.textContent.trim() + '|' + x.dataset.v));
  ok('giáo viên thấy nút "Tải video lên" riêng', btns.includes('Tải video lên|vid'), btns);
  await page.click('[data-a="upm"][data-v="vid"]'); await sleep(250);
  const acc = await page.evaluate(() => { const i = document.querySelector('#um-f'); return i && i.getAttribute('accept'); });
  ok('cửa sổ video nhận .mkv, .3gp, .m4v, .avi', !!acc && ['.mkv', '.3gp', '.m4v', '.avi'].every(e => acc.includes(e)), acc);
  ok('cửa sổ video không nhận ảnh', !!acc && !acc.includes('image/*'), acc);
  const kinds = await page.evaluate(() => ['a.mkv', 'b.3GP', 'c.m4v', 'd.avi', 'e.mov', 'f.mp4'].map(n => medKindOf({ name: n, type: '' })));
  ok('nhận diện đúng loại video cho các định dạng điện thoại', kinds.every(k => k && k.kind === 'vid'), kinds);
  ok('không có lỗi trình duyệt (giáo viên)', g.errs.length === 0, g.errs);
  await g.b.close();

  /* ---- Trưởng Trung tâm: phiếu học phí có hotline; xóa hồ sơ bé, nhân sự, báo cáo ---- */
  const t = await open(); await login(t.page, 'tt'); const tp = t.page;
  const hot = await tp.evaluate(() => {
    let cap = null; const orig = window.exportPDF; window.exportPDF = (n, h) => { cap = h; };
    try { S.v = 'dd'; S.dd = Object.assign({ tab: 'sheet', date: WD, m: CM, q: '', pr: '', fl: '', gv: '', kid: '', un: false }, S.dd, { m: CM, q: '', fl: '' }); ACT.ddpdf(); } finally { window.exportPDF = orig; }
    return cap ? cap.includes('Hotline: 0979796361') : 'no-capture';
  });
  ok('phiếu học phí PDF có dòng Hotline: 0979796361', hot === true, hot);
  const r1 = await tp.evaluate(() => {
    const k = DB.kids[0], before = DB.kids.length, nSess = DB.sess.filter(s => s.k === k.id).length;
    hsDelKid(k.id);
    return { before, after: DB.kids.length, gone: !DB.kids.some(x => x.id === k.id), sessLeft: DB.sess.filter(s => s.k === k.id).length, nSess };
  });
  ok('tt xóa hồ sơ bé và các buổi liên quan', r1.after === r1.before - 1 && r1.gone && r1.sessLeft === 0, r1);
  const r2 = await tp.evaluate(() => {
    const s = DB.staff.find(x => x.role === 'gv' && x.id !== U.id && !accOf(x) && !DB.kids.some(k => k.gv === x.id) && !DB.lich.some(l => l.gv === x.id) && !DB.groups.some(g => g.gv === x.id));
    if (!s) return { none: true };
    return { can: canDelStaff(s), self: canDelStaff(stBy(U.id)), id: s.id };
  });
  ok('tt xóa được nhân sự không phụ trách; không xóa được chính mình', r2.none || (r2.can === true && r2.self === false), r2);
  const r3 = await tp.evaluate(() => { const r = DB.rp[0]; if (!r) return { none: true }; ACT.bcdel(r.id); return { asked: !!S.modal && S.modal.t === 'ask' }; });
  ok('tt được hỏi xác nhận khi xóa báo cáo', r3.none || r3.asked === true, r3);
  ok('không có lỗi trình duyệt (tt)', t.errs.length === 0, t.errs);
  await t.b.close();

  /* ---- Quản lý: không xóa được Trưởng Trung tâm, xóa được nhân sự thường ---- */
  const q = await open(); await login(q.page, 'ql');
  const r4 = await q.page.evaluate(() => {
    const tt = DB.staff.find(x => x.role === 'tt'), gv = DB.staff.find(x => x.role === 'gv' && !accOf(x) && !DB.kids.some(k => k.gv === x.id));
    return { ttBlocked: tt ? !canDelStaff(tt) : true, gvAllowed: gv ? canDelStaff(gv) : true };
  });
  ok('quản lý không xóa được Trưởng Trung tâm, xóa được nhân sự thường', r4.ttBlocked && r4.gvAllowed, r4);
  ok('không có lỗi trình duyệt (ql)', q.errs.length === 0, q.errs);
  await q.b.close();
  console.log(`\n${pass} đạt, ${fail} lỗi`); if (fail) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
