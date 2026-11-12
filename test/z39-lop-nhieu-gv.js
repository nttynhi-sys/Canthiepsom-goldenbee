/* Z39: lớp bán trú (Ong non, Ong mật) chọn được nhiều giáo viên, ngang nhau, không có giáo viên chính hay trợ giảng */
const { open, login } = require('./h.js');
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : String(JSON.stringify(x)).slice(0, 500)); } };
const SP = '/tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/';

(async () => {
  const { b, page, errs } = await open();
  const ev = (f, a) => page.evaluate(f, a); const W = ms => page.waitForTimeout(ms || 120);
  await login(page, 'tt');

  /* chuẩn bị: bốn giáo viên mới, chưa có buổi 1-1 nào, có chấm công đủ ngày tháng trước (để thử lương) */
  await ev(() => {
    const base = DB.staff.find(s => s.role === 'gv' && s.st === 'dang');
    ['nvt1', 'nvt2', 'nvt3', 'nvt4'].forEach((id, i) => DB.staff.push(Object.assign(JSON.parse(JSON.stringify(base)), { id, n: 'Cô Bán Trú ' + (i + 1), pos: 'Giáo viên bán trú', em: 'bt' + i + '@x.vn', cc: true, pay: Object.assign({}, base.pay, { mode: 'thang', base: 9e6, rate: 0, rateBt: 0, allow: 0, bh: 0, latePen: 0 }) })));
    const m = sm(CM, -1);
    mDates(m).filter(isW).forEach(d => ['nvt1', 'nvt2', 'nvt3', 'nvt4'].forEach(id => { DB.ts[id + '|' + d] = { i: '07:20', o: '17:00' }; }));
    go('pc'); S.pc = Object.assign(S.pc || {}, { tab: 'bt' }); render();
  });
  await W();

  /* ---------- A. màn Phân công → Nhóm bán trú ---------- */
  const A = await ev(() => {
    const t = document.querySelector('main').textContent;
    return { chinh: /Giáo viên chính|Trợ giảng|trợ giảng/.test(t), selects: document.querySelectorAll('select[id^="g-G"]').length, groups: document.querySelectorAll('[role="group"][aria-label^="Giáo viên bán trú của"]').length,
      g1: [...document.querySelectorAll('[data-c="pcts"][data-k^="G1|"]')].filter(x => x.checked).length, g1seed: grTs(DB.groups[0]).length };
  });
  ok('Phân công → Nhóm bán trú: không còn chữ giáo viên chính, trợ giảng và không còn ô chọn một người', !A.chinh && A.selects === 0 && A.groups === 2, A);
  ok('mỗi lớp là danh sách ô tích, số ô đã tích khớp với danh sách giáo viên của lớp', A.g1 === A.g1seed && A.g1 >= 1, A);

  /* ---------- B. chọn đúng 3 giáo viên cho Ong non bằng cách bấm ô tích ---------- */
  for (const id of await ev(() => grTs(DB.groups[0]))) { await page.uncheck('[data-c="pcts"][data-k="G1|' + id + '"]'); await W(80); }
  const B0 = await ev(() => ({ ts: grTs(DB.groups[0]), gv: DB.groups[0].gv, tg: DB.groups[0].tg, empty: /chưa chọn ai/.test(document.querySelector('main').textContent) }));
  ok('bỏ hết giáo viên: lớp không còn ai, màn hình báo chưa chọn ai', B0.ts.length === 0 && B0.empty && B0.gv === '' && B0.tg === '', B0);
  for (const id of ['nvt1', 'nvt2', 'nvt3']) { await page.check('[data-c="pcts"][data-k="G1|' + id + '"]'); await W(80); }
  const B = await ev(() => { const g = DB.groups[0]; return { ts: grTs(g), raw: g.ts, gv: g.gv, tg: g.tg, txt: document.querySelector('[role="group"][aria-label$="Ong non"]').textContent }; });
  ok('chọn 3 giáo viên cho Ong non: danh sách có đủ 3 người theo thứ tự chọn', JSON.stringify(B.raw) === '["nvt1","nvt2","nvt3"]', B);
  ok('màn hình ghi "3 người, ngang nhau"', /3 người, ngang nhau/.test(B.txt), B.txt.slice(0, 200));
  ok('g.gv, g.tg chỉ còn là bản sao hai người đầu cho bản cũ đọc được', B.gv === 'nvt1' && B.tg === 'nvt2', B);
  await page.screenshot({ path: SP + 'z39-phan-cong.png', fullPage: false });

  /* ---------- C. một người chỉ ở một lớp ---------- */
  const C = await ev(() => { const t = document.querySelector('[data-c="pcts"][data-k="G2|nvt1"]'); return { dis: !!(t && t.disabled), lb: t ? t.closest('label').textContent : '' }; });
  ok('giáo viên đã ở Ong non: ô tích ở Ong mật bị khóa và ghi rõ đang phụ trách Ong non', C.dis && /đang phụ trách Ong non/.test(C.lb), C);
  const C2 = await ev(() => { const t = document.querySelector('[data-c="pcts"][data-k="G2|nvt1"]'); t.disabled = false; t.checked = true; CHG.pcts('', t); render(); return { g2: grTs(DB.groups[1]), toast: (document.querySelector('.toast, #toast') || {}).textContent || '' }; });
  ok('ép thêm người đã ở lớp khác thì không được, Ong mật giữ nguyên', !C2.g2.includes('nvt1'), C2);

  /* ---------- D. giáo viên có ca 1-1 cố định thứ Hai đến thứ Sáu không được chọn ---------- */
  const D = await ev(() => {
    const l = DB.lich.find(x => x.type === '11' && x.day <= 5 && !grOf(x.gv)), id = l.gv;
    const box = document.querySelector('[data-c="pcts"][data-k="G2|' + id + '"]');
    const t = document.createElement('input'); t.type = 'checkbox'; t.dataset.k = 'G2|' + id; t.checked = true;
    const before = grTs(DB.groups[1]).length; CHG.pcts('', t); render();
    return { id, hasBox: !!box, before, after: grTs(DB.groups[1]).length };
  });
  ok('giáo viên đang có ca 1-1 cố định T2–T6 không có ô tích và không thêm được vào lớp', !D.hasBox && D.after === D.before, D);

  /* ---------- E. ba giáo viên cùng bị chặn xếp 1-1 ngày bán trú; không còn xếp 1-1 trong danh sách ---------- */
  const E = await ev(() => {
    const c = id => conflict({ day: 1, slot: '10:00', gv: id, hs: 'zzz', room: 'P1' });
    return { c1: c('nvt1'), c2: c('nvt2'), c3: c('nvt3'), c4: c('nvt4'), pool: pool11().map(s => s.id).filter(i => i.startsWith('nvt')), isg: ['nvt1', 'nvt2', 'nvt3'].every(isGrStaff) };
  });
  ok('cả 3 giáo viên bán trú đều bị chặn xếp ca 1-1 các ngày bán trú', [E.c1, E.c2, E.c3].every(x => /bán trú/.test(x)) && E.c4 === '' && E.isg, E);
  ok('danh sách giáo viên 1-1 chỉ còn người không phụ trách lớp bán trú', JSON.stringify(E.pool) === '["nvt4"]', E);

  /* ---------- F. bỏ một người: người đó quay lại được danh sách 1-1 ---------- */
  await page.uncheck('[data-c="pcts"][data-k="G1|nvt2"]'); await W(80);
  const F = await ev(() => ({ ts: grTs(DB.groups[0]), gv: DB.groups[0].gv, tg: DB.groups[0].tg, in11: pool11().some(s => s.id === 'nvt2') }));
  ok('bỏ nvt2 khỏi lớp: còn 2 người, bản sao gv/tg cập nhật, nvt2 lại xếp được 1-1', JSON.stringify(F.ts) === '["nvt1","nvt3"]' && F.gv === 'nvt1' && F.tg === 'nvt3' && F.in11, F);
  await page.check('[data-c="pcts"][data-k="G1|nvt2"]'); await W(80);

  /* ---------- G. dữ liệu cũ chỉ có gv, tg (không có ts) vẫn hiện đúng, sửa xong thì ghi danh sách mới ---------- */
  await ev(() => { const g = DB.groups[1]; delete g.ts; g.gv = 'nv19'; g.tg = 'nv21'; render(); });
  const G0 = await ev(() => ({ ts: grTs(DB.groups[1]), on: [...document.querySelectorAll('[data-c="pcts"][data-k^="G2|"]')].filter(x => x.checked).map(x => x.dataset.k.split('|')[1]) }));
  ok('lớp chỉ có gv, tg (dữ liệu cũ): hiện đúng hai giáo viên đã tích', JSON.stringify(G0.ts) === '["nv19","nv21"]' && JSON.stringify(G0.on.sort()) === '["nv19","nv21"]', G0);
  await ev(() => { const t = document.querySelector('[data-c="pcts"][data-k="G2|nvt4"]'); t.checked = true; CHG.pcts('', t); render(); });
  const G1 = await ev(() => ({ raw: DB.groups[1].ts, gv: DB.groups[1].gv, tg: DB.groups[1].tg }));
  ok('thêm người thứ ba vào lớp dữ liệu cũ: lưu thành danh sách ts đủ 3 người', JSON.stringify(G1.raw) === '["nv19","nv21","nvt4"]' && G1.gv === 'nv19' && G1.tg === 'nv21', G1);
  await ev(() => { const t = document.querySelector('[data-c="pcts"][data-k="G2|nvt4"]'); t.checked = false; CHG.pcts('', t); render(); });

  /* ---------- H. lương bán trú: các giáo viên của lớp được tính ngày bán trú như nhau ---------- */
  const H = await ev(() => { const m = sm(CM, -1), bt = id => payroll(stBy(id), m).btd; return { a: bt('nvt1'), b: bt('nvt2'), c: bt('nvt3'), x: bt('nvt4') }; });
  ok('lương: 3 giáo viên cùng lớp có số ngày bán trú bằng nhau và lớn hơn 0; người không ở lớp nào là 0', H.a > 0 && H.a === H.b && H.b === H.c && H.x === 0, H);

  /* ---------- I. thống kê: mỗi giáo viên được tính đủ buổi của lớp, tổng toàn trung tâm không bị nhân lên ---------- */
  const I = await ev(() => {
    const m = sm(CM, -1); const keys = Object.keys(DB.att).filter(k => k.startsWith(m)); const g = DB.groups[0];
    DB.kids.filter(k => k.gr === g.id && k.st === 'dang').slice(0, 4).forEach(k => mDates(m).filter(isW).slice(0, 3).forEach(d => { DB.att[d + '|' + g.id + '|' + k.id] = 'cm'; }));
    const by = attStats(m), tot = attTot(m), n = attRows(m).length;
    const nG1 = Object.keys(DB.att).filter(k => k.startsWith(m) && k.split('|')[1] === g.id).length;
    return { a: (by.nvt1 || {}).t, b: (by.nvt2 || {}).t, c: (by.nvt3 || {}).t, nG1, totT: tot.t, n, sum: Object.values(by).reduce((s, o) => s + o.t, 0), keys: keys.length };
  });
  ok('thống kê: 3 giáo viên của lớp mỗi người được tính đủ số lượt điểm danh của lớp', I.a === I.nG1 && I.b === I.nG1 && I.c === I.nG1 && I.nG1 > 0, I);
  ok('thống kê: tổng toàn trung tâm tính mỗi lượt một lần (không nhân theo số giáo viên)', I.totT === I.n && I.sum > I.totT, I);

  /* ---------- J. xóa hồ sơ: không xóa được giáo viên đang phụ trách lớp, kể cả người thứ ba ---------- */
  const J = await ev(() => { ACT.nvdel('nvt3'); return { still: !!stBy('nvt3'), toast: (document.querySelector('.toast, #toast, [role="status"]') || {}).textContent || '' }; });
  ok('không xóa được giáo viên (người thứ ba trong danh sách) đang phụ trách lớp', J.still, J);

  /* ---------- K. hồ sơ bé, lịch học, điểm danh hiển thị đủ giáo viên ---------- */
  const K = await ev(() => {
    const g = DB.groups[0], k = DB.kids.find(x => x.gr === g.id && x.st === 'dang' && x.bt); k.gv = '';
    return { name: mainGV(k), want: grTs(g).map(i => stBy(i).n).join(', '), kid: k.id, kn: k.n, three: grTs(g).length === 3 };
  });
  ok('hồ sơ bé bán trú không có giáo viên 1-1: ghi đủ tên 3 giáo viên của lớp', K.name === K.want && K.three && ['Cô Bán Trú 1', 'Cô Bán Trú 2', 'Cô Bán Trú 3'].every(n => K.name.includes(n)), K);
  await ev(() => { go('lh'); S.lh = Object.assign(S.lh || {}, { tab: 'bt', btg: 'G1', btm: 'lop' }); render(); }); await W();
  const K2 = await ev(() => document.querySelector('main').textContent);
  ok('Lịch học → bán trú: ghi "Giáo viên bán trú" kèm đủ tên 3 giáo viên, không có chữ trợ giảng', K2.includes('Giáo viên bán trú ' + K.want) && !/rợ giảng/.test(K2), K2.slice(0, 300));
  await ev(() => { const d = lastWork(TODAY); go('dd', { dd: { tab: 'roll', date: d, m: d.slice(0, 7), q: '', pr: '', fl: '', gv: 'nvt3', kid: '', un: false } }); render(); }); await W();
  const K3 = await ev(() => document.querySelector('main').textContent);
  ok('Điểm danh: lọc theo người thứ ba của lớp vẫn ra lớp; tiêu đề lớp ghi đủ giáo viên, không có chữ trợ giảng', K3.includes('Giáo viên ' + K.want) && !/rợ giảng/.test(K3), K3.slice(0, 400));
  await ev(() => { go('hs'); S.hs = Object.assign(S.hs || {}, { gv: 'nvt3', st: '', pr: '', q: '' }); render(); }); await W();
  const K4 = await ev(id => ({ has: document.body.textContent.includes(kidBy(id).n) }), K.kid);
  ok('Học sinh: lọc theo giáo viên thứ ba của lớp ra các bé của lớp', K4.has, K4);

  ok('không có lỗi trình duyệt (tt)', errs.length === 0, errs.slice(0, 3));

  /* ---------- L. đăng nhập bằng giáo viên: là người thứ ba trong lớp thì thấy lớp, điểm danh, thực đơn ---------- */
  const o = await open(); const p2 = o.page; const ev2 = (f, a) => p2.evaluate(f, a);
  await login(p2, 'gv');
  const L = await ev2(() => {
    const g = DB.groups[0]; grSet(g, ['nvz1', 'nvz2', U.id]); DB.groups[1].ts = ['nvz3']; DB.groups[1].gv = 'nvz3'; DB.groups[1].tg = '';
    render();
    const ks = DB.kids.filter(k => k.gr === g.id && k.st === 'dang' && k.bt); const kid = ks[0]; kid.gv = '';
    const other = DB.kids.find(k => k.gr === 'G2' && k.st === 'dang');
    const rows = dayList(lastWork(TODAY)).filter(s => rowHas(s, U.id));
    return { my: myGroups().map(x => x.id), nav: navList().includes('tn'), rows: rows.map(r => r.kind + ':' + r.sid), canEdit: canEditSess({ k: kid.id, by: 'zzz', date: TODAY }), cantOther: other ? canEditSess({ k: other.id, by: 'zzz', date: TODAY }) : false, kidOk: canKid(kid.id), teach: teachesNow(U.id) };
  });
  ok('giáo viên là người thứ ba của lớp: thấy lớp của mình và mục Thực đơn bán trú', JSON.stringify(L.my) === '["G1"]' && L.nav && L.teach, L);
  ok('giáo viên thứ ba có lớp trong lịch điểm danh của ngày (rowHas)', L.rows.some(x => x.startsWith('bt:G1')), L.rows);
  ok('giáo viên thứ ba sửa được buổi can thiệp của bé lớp mình, không sửa được của lớp khác', L.canEdit && !L.cantOther && L.kidOk, L);
  await ev2(() => { go('dd', { dd: { tab: 'roll', date: lastWork(TODAY), m: lastWork(TODAY).slice(0, 7), q: '', pr: '', fl: '', gv: '', kid: '', un: false } }); render(); }); await W();
  const L2 = await ev2(() => document.querySelector('main').textContent);
  ok('giáo viên thứ ba mở Điểm danh thấy lớp Ong non với đủ tên giáo viên', /Ong non · Bán trú/.test(L2) && !/rợ giảng/.test(L2), L2.slice(0, 300));
  await ev2(() => { go('dash'); render(); }); await W();
  const L3 = await ev2(() => document.querySelector('main').textContent);
  ok('trang đầu của giáo viên thứ ba tính buổi bán trú vào "Buổi hôm nay"', /Buổi hôm nay/.test(L3), L3.slice(0, 200));
  ok('không có lỗi trình duyệt (gv)', o.errs.length === 0, o.errs.slice(0, 3));
  await o.b.close();

  await b.close();
  console.log(`\nKẾT QUẢ: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('LỖI', e.message); process.exit(2); });
