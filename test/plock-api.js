/* Khóa cổng phụ huynh quá hạn học phí: api/_lock.js, api/parent.js (chặn), api/plock.js (danh sách, mở khóa, khóa lại)
   với máy chủ Supabase giả lập. Đồng hồ cố định để kết quả không phụ thuộc ngày chạy. */
const { makeEmu } = require('./emu');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : x); } };
const realNow = Date.now;
const setVN = (iso) => { const t = Date.parse(iso + 'T10:00:00+07:00'); Date.now = () => t; };   /* 10 giờ sáng giờ Việt Nam */
(async () => {
  const E = makeEmu(); await E.listen();
  const L = require('../api/_lib.js'), K = require('../api/_lock.js'), H = { parent: require('../api/parent.js'), plock: require('../api/plock.js') };
  const call = async (name, body, tok) => { const out = { code: 0, body: '' }; const rs = { statusCode: 200, setHeader() { }, end(b) { out.body = b; } }; await H[name]({ method: 'POST', headers: tok ? { authorization: 'Bearer ' + tok } : {}, body: JSON.stringify(body) }, rs); out.code = rs.statusCode; try { out.json = JSON.parse(out.body); } catch (e) { out.json = null; } return out; };
  const signin = async (email, pw) => { const r = await fetch(E.url + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: pw }) }); return (await r.json()).access_token; };
  let n = 0; const put = (T, c, id, data) => T.set(c + '|' + id, { collection: c, id, data, updated_at: new Date(Date.UTC(2026, 10, 1) + (++n) * 1000).toISOString().replace('Z', '000+00:00') });
  const R = (c, id, data) => put(E.recs, c, id, data), M = (c, id, data) => put(E.mon, c, id, data);

  /* ---- tính quá hạn (hàm thuần) ---- */
  const e = (kind, amt, m) => ({ kind, amt, m, date: m + '-01' });
  ok('dueMonth: ngày 1 đến 10 tính đến tháng trước', K.dueMonth('2026-11-01') === '2026-10' && K.dueMonth('2026-11-10') === '2026-10' && K.dueMonth('2027-01-05') === '2026-12');
  ok('dueMonth: từ ngày 11 tính cả tháng này', K.dueMonth('2026-11-11') === '2026-11' && K.dueMonth('2026-11-30') === '2026-11');
  ok('nextTen: trước và đúng ngày 10 → ngày 10 tháng này; sau ngày 10 → tháng sau', K.nextTen('2026-11-03') === '2026-11-10' && K.nextTen('2026-11-10') === '2026-11-10' && K.nextTen('2026-11-11') === '2026-12-10' && K.nextTen('2026-12-20') === '2027-01-10');
  ok('vnToday: 17:30 UTC đã sang ngày sau theo giờ Việt Nam', K.vnToday(Date.parse('2026-11-10T17:30:00Z')) === '2026-11-11' && K.vnToday(Date.parse('2026-11-10T16:59:00Z')) === '2026-11-10');
  ok('quá hạn: học phí tháng 10 chưa đóng, ngày 9/11 → khóa', K.lockOf([e('hp', 380000, '2026-10')], '2026-11-09', null).locked);
  ok('chưa quá hạn: học phí tháng 11 đến hết ngày 10/11', !K.lockOf([e('hp', 380000, '2026-11')], '2026-11-10', null).overdue && K.lockOf([e('hp', 380000, '2026-11')], '2026-11-11', null).locked);
  ok('đã đóng đủ: không khóa', !K.lockOf([e('hp', 380000, '2026-10'), e('thu', 380000, '2026-10')], '2026-11-20', null).overdue);
  ok('đóng một phần vẫn khóa, số tiền là phần còn thiếu', K.lockOf([e('hp', 380000, '2026-10'), e('thu', 200000, '2026-10')], '2026-11-20', null).amt === 180000);
  ok('thiếu dưới 1.000 ₫ (làm tròn) không khóa', !K.lockOf([e('hp', 380000, '2026-10'), e('thu', 379500, '2026-10')], '2026-11-20', null).overdue);
  ok('hoàn phí và giảm giá được trừ vào học phí', !K.lockOf([e('hp', 400000, '2026-11'), e('hoan', 100000, '2026-12'), e('gg', 100000, '2026-11'), e('thu', 200000, '2026-11')], '2026-11-15', null).overdue);
  ok('tiền thu dư tháng trước trừ vào tháng sau (FIFO)', !K.lockOf([e('hp', 380000, '2026-10'), e('thu', 800000, '2026-10'), e('hp', 380000, '2026-11')], '2026-11-15', null).overdue);
  ok('học phí tháng sau chưa đến hạn không làm khóa', !K.lockOf([e('hp', 380000, '2026-10'), e('thu', 380000, '2026-10'), e('hp', 380000, '2026-12')], '2026-11-15', null).overdue);
  const lo = K.lockOf([e('hp', 380000, '2026-09'), e('hp', 380000, '2026-10'), e('thu', 380000, '2026-09')], '2026-11-20', null);
  ok('liệt kê đúng tháng còn nợ', lo.months.join() === '2026-10' && lo.amt === 380000);
  ok('mở khóa tạm: còn hiệu lực đến hết ngày đã chọn, sau đó khóa lại', K.lockOf([e('hp', 1e5, '2026-10')], '2026-11-12', { until: '2026-11-12' }).unlocked && K.lockOf([e('hp', 1e5, '2026-10')], '2026-11-13', { until: '2026-11-12' }).locked);
  ok('mở khóa tạm với ngày hỏng không có tác dụng', K.lockOf([e('hp', 1e5, '2026-10')], '2026-11-12', { until: 'abc' }).locked && K.lockOf([e('hp', 1e5, '2026-10')], '2026-11-12', { until: '' }).locked);
  ok('dòng sổ lạ hoặc số tiền âm bị bỏ qua', !K.lockOf([{ kind: 'x', amt: 5000000, m: '2026-10' }, e('hp', -5, '2026-10'), {}, null], '2026-11-20', null).overdue);

  /* ---- dữ liệu mẫu ---- */
  const tt = E.addUser('tt@gb.vn', 'ttpass123', { role: 'tt', full_name: 'Cô Trưởng' });
  E.addUser('ql@gb.vn', 'qlpass123', { role: 'ql', staff_id: 'nv02', full_name: 'Cô Quản Lý' });
  E.addUser('vp@gb.vn', 'vppass123', { role: 'vp', staff_id: 'nv26', full_name: 'Anh Văn Phòng' });
  E.addUser('gv@gb.vn', 'gvpass123', { role: 'gv', staff_id: 'nv04', full_name: 'Cô Lan' });
  E.addUser('a@x.vn', 'phpass123', { role: 'ph', staff_id: 'ph|a@x.vn', full_name: 'PH An' });
  E.addUser('b@x.vn', 'phpass123', { role: 'ph', staff_id: 'ph|b@x.vn', full_name: 'PH Dũng' });
  E.addUser('c@x.vn', 'phpass123', { role: 'ph', staff_id: 'ph|c@x.vn', full_name: 'PH Chi' });
  const TT = await signin('tt@gb.vn', 'ttpass123'), QL = await signin('ql@gb.vn', 'qlpass123'), VP = await signin('vp@gb.vn', 'vppass123'), GV = await signin('gv@gb.vn', 'gvpass123');
  const TA = await signin('a@x.vn', 'phpass123'), TB = await signin('b@x.vn', 'phpass123'), TC = await signin('c@x.vn', 'phpass123');
  const kid = (id, n, pe, pn) => ({ id, n, pe, pp: '', pn, gr: '', st: 'dang', gv: 'nv04' });
  R('kids', 'hs001', kid('hs001', 'An', 'a@x.vn', 'PH An')); R('kids', 'hs002', kid('hs002', 'Bình', 'a@x.vn', 'PH An'));
  R('kids', 'hs004', kid('hs004', 'Dũng', 'b@x.vn', 'PH Dũng')); R('kids', 'hs003', kid('hs003', 'Chi', 'c@x.vn', 'PH Chi'));
  R('cfg', '_', { name: 'Golden Bee', tel: '0793502567' }); R('hol', 'hl1', { id: 'hl1', d: '2026-12-25', n: 'Noel', k: 'tt' });
  const lg = (id, hs, kind, amt, m) => M('lg', id, { id, hs, kind, amt, m, date: m + '-01', note: '' });
  /* A: hai bé, tháng 10 mới đóng nửa tổng → còn thiếu. B: đã đóng đủ. C: chỉ có học phí tháng 11 */
  lg('e1', 'hs001', 'hp', 380000, '2026-10'); lg('e2', 'hs002', 'hp', 380000, '2026-10'); lg('e3', 'hs001', 'thu', 380000, '2026-10');
  lg('e4', 'hs004', 'hp', 380000, '2026-10'); lg('e5', 'hs004', 'thu', 380000, '2026-10');
  lg('e6', 'hs003', 'hp', 380000, '2026-11');

  /* ---- ngày 9/11: hạn tháng 10 đã qua ---- */
  setVN('2026-11-09');
  let la = await call('parent', { action: 'load' }, TA);
  ok('A (thiếu học phí tháng 10 của bé Bình): bị khóa, không nhận dữ liệu nào', la.code === 200 && la.json.locked === true && !la.json.records && !la.json.money && !la.json.kids, la.body.slice(0, 200));
  ok('màn khóa chỉ có số tiền, tháng, hạn và số điện thoại Trung tâm của chính họ', la.json.lock.amt === 380000 && la.json.lock.months.join() === '2026-10' && la.json.lock.tel === '0793502567' && !JSON.stringify(la.json).includes('hs00'));
  ok('B (đã đóng đủ): vào bình thường', (await call('parent', { action: 'load' }, TB)).json.kids.join() === 'hs004');
  ok('C (học phí tháng 11 chưa đến hạn): vào bình thường', (await call('parent', { action: 'load' }, TC)).json.kids.join() === 'hs003');
  ok('A bị khóa: pull cũng bị chặn', (await call('parent', { action: 'pull', since: { records: '1970-01-01T00:00:00Z', money: '1970-01-01T00:00:00Z' }, known: ['hs001', 'hs002'] }, TA)).json.locked === true);
  const pa = await call('parent', { action: 'put', rows: [{ collection: 'rd', id: 'n1|ph|a@x.vn', data: '2026-11-09' }] }, TA);
  ok('A bị khóa: không ghi được (423) và không có dòng nào được ghi', pa.code === 423 && !E.recs.has('rd|n1|ph|a@x.vn'), pa.body);

  /* ---- ngày 11/11: hạn tháng 11 ---- */
  setVN('2026-11-11');
  ok('C: từ ngày 11 học phí tháng 11 chưa đóng → khóa', (await call('parent', { action: 'load' }, TC)).json.locked === true);
  ok('B: vẫn không bị khóa (chưa có học phí tháng 11)', (await call('parent', { action: 'load' }, TB)).json.locked === undefined);

  /* ---- danh sách cho nhân viên ---- */
  setVN('2026-11-09');
  ok('plock: giáo viên không dùng được (403)', (await call('plock', { action: 'list' }, GV)).code === 403);
  ok('plock: phụ huynh không dùng được (403)', (await call('plock', { action: 'list' }, TA)).code === 403);
  ok('plock: không đăng nhập (401)', (await call('plock', { action: 'list' })).code === 401);
  const lt = await call('plock', { action: 'list' }, TT);
  ok('plock list (Trưởng Trung tâm): chỉ A đang khóa, có số tiền', lt.code === 200 && lt.json.rows.length === 1 && lt.json.rows[0].key === 'a@x.vn' && lt.json.rows[0].locked && lt.json.rows[0].amt === 380000 && lt.json.rows[0].kids.join() === 'An,Bình', lt.body);
  const lv = await call('plock', { action: 'list' }, VP), lq = await call('plock', { action: 'list' }, QL);
  ok('plock list (Văn phòng): có số tiền', lv.json.rows[0].amt === 380000);
  ok('plock list (Quản lý): thấy ai bị khóa nhưng không nhận số tiền', lq.code === 200 && lq.json.rows.length === 1 && lq.json.rows[0].key === 'a@x.vn' && !('amt' in lq.json.rows[0]) && !/380000/.test(lq.body), lq.body);

  /* ---- mở khóa ---- */
  ok('unlock: phụ huynh lạ: 404', (await call('plock', { action: 'unlock', key: 'khong@co.vn' }, TT)).code === 404);
  ok('unlock: giáo viên: 403 và không ghi gì', (await call('plock', { action: 'unlock', key: 'a@x.vn' }, GV)).code === 403 && !E.recs.has('pul|a@x.vn'));
  ok('unlock: ngày quá khứ: 400', (await call('plock', { action: 'unlock', key: 'a@x.vn', until: '2026-11-08' }, TT)).code === 400);
  ok('unlock: ngày quá xa: 400', (await call('plock', { action: 'unlock', key: 'a@x.vn', until: '2027-06-01' }, TT)).code === 400);
  ok('unlock: ngày sai định dạng: 400', (await call('plock', { action: 'unlock', key: 'a@x.vn', until: 'mai' }, TT)).code === 400);
  const un = await call('plock', { action: 'unlock', key: 'a@x.vn', note: 'Hẹn đóng ngày 12' }, QL);
  ok('unlock (Quản lý): mặc định đến hết ngày 10 sắp tới', un.code === 200 && un.json.until === '2026-11-10', un.body);
  const pul = E.recs.get('pul|a@x.vn');
  ok('unlock: ghi bản ghi pul có người mở, ngày, ghi chú', pul && pul.data.until === '2026-11-10' && pul.data.by === 'Cô Quản Lý' && pul.data.role === 'ql' && pul.data.note === 'Hẹn đóng ngày 12', JSON.stringify(pul));
  la = await call('parent', { action: 'load' }, TA);
  ok('A sau khi được mở khóa: vào được, thấy đúng 2 bé', la.json.locked === undefined && la.json.kids.join() === 'hs001,hs002');
  ok('A được mở khóa: ghi được lại', (await call('parent', { action: 'put', rows: [{ collection: 'rd', id: 'n1|ph|a@x.vn', data: '2026-11-09' }] }, TA)).code === 200);
  const l2 = await call('plock', { action: 'list' }, TT);
  ok('plock list: A hiện "đã mở khóa đến 10/11", ghi rõ người mở', l2.json.rows[0].unlocked && !l2.json.rows[0].locked && l2.json.rows[0].until === '2026-11-10' && l2.json.rows[0].by === 'Cô Quản Lý');
  setVN('2026-11-10'); ok('đến hết ngày 10/11 vẫn được vào', (await call('parent', { action: 'load' }, TA)).json.locked === undefined);
  setVN('2026-11-11'); ok('sang ngày 11/11 hết hạn mở khóa → khóa lại', (await call('parent', { action: 'load' }, TA)).json.locked === true);
  setVN('2026-11-09');
  const rl = await call('plock', { action: 'relock', key: 'a@x.vn' }, VP);
  ok('relock (Văn phòng): khóa lại ngay, xóa bản ghi mở khóa', rl.code === 200 && !E.recs.has('pul|a@x.vn') && (await call('parent', { action: 'load' }, TA)).json.locked === true);
  ok('relock: giáo viên: 403', (await call('plock', { action: 'relock', key: 'a@x.vn' }, GV)).code === 403);
  const un2 = await call('plock', { action: 'unlock', key: 'a@x.vn', until: '2026-11-20' }, TT);
  ok('unlock: chọn ngày tùy ý trong giới hạn', un2.code === 200 && E.recs.get('pul|a@x.vn').data.until === '2026-11-20');
  setVN('2026-11-15'); ok('mở khóa đến 20/11: ngày 15/11 vào được', (await call('parent', { action: 'load' }, TA)).json.locked === undefined);

  /* ---- tự mở khi nhân viên ghi nhận thu đủ ---- */
  setVN('2026-11-25');
  ok('mở khóa hết hạn: 25/11 khóa lại', (await call('parent', { action: 'load' }, TA)).json.locked === true);
  lg('e7', 'hs002', 'thu', 380000, '2026-10');
  la = await call('parent', { action: 'load' }, TA);
  ok('ghi nhận thu đủ tháng 10 → cổng tự mở (không cần mở khóa)', la.json.locked === undefined && la.json.kids.join() === 'hs001,hs002');
  ok('danh sách của nhân viên không còn A', (await call('plock', { action: 'list' }, TT)).json.rows.every(r => r.key !== 'a@x.vn'));
  lg('e8', 'hs001', 'hp', 380000, '2026-11');
  ok('phát sinh học phí tháng 11 chưa đóng, ngày 25/11 → khóa lại', (await call('parent', { action: 'load' }, TA)).json.locked === true);
  lg('e9', 'hs001', 'gg', 380000, '2026-11');
  ok('giảm giá bù đủ → mở lại', (await call('parent', { action: 'load' }, TA)).json.locked === undefined);

  /* ---- bản ghi pul không bị phụ huynh đọc qua cổng, nhân viên không ghi trực tiếp ---- */
  la = await call('parent', { action: 'load' }, TA);
  ok('phụ huynh không nhận bản ghi pul', !JSON.stringify(la.json).includes('"pul"'));
  const direct = await fetch(E.url + '/rest/v1/records?on_conflict=collection,id', { method: 'POST', headers: { 'content-type': 'application/json', Authorization: 'Bearer ' + TT, apikey: 'x' }, body: JSON.stringify([{ collection: 'pul', id: 'b@x.vn', data: { until: '2099-01-01' } }]) });
  ok('Trưởng Trung tâm ghi pul trực tiếp qua bảng bị từ chối (403)', direct.status === 403 && !E.recs.has('pul|b@x.vn'));

  Date.now = realNow;
  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await E.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
