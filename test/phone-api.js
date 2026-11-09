/* Kiểm thử các hàm máy chủ api/login.js, api/accounts.js, api/parent.js với máy chủ Supabase giả lập (HTTP thật) */
const { makeEmu, SECRET } = require('./emu');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : x); } };
(async () => {
  const E = makeEmu(); await E.listen();
  const L = require('../api/_lib.js'), H = { accounts: require('../api/accounts.js'), login: require('../api/login.js'), parent: require('../api/parent.js') };
  const call = async (name, body, tok, method) => { const out = { code: 0, body: '' }; const rs = { statusCode: 200, setHeader() { }, end(b) { out.body = b; } }; await H[name]({ method: method || 'POST', headers: tok ? { authorization: 'Bearer ' + tok } : {}, body }, rs); out.code = rs.statusCode; try { out.json = JSON.parse(out.body); } catch (e) { out.json = {}; } return out; };
  const signin = async (email, pw) => { const r = await fetch(E.url + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: pw }) }); const j = await r.json(); return r.ok ? j.access_token : null; };
  const ts = () => new Date(Date.UTC(2026, 10, 1) + (++E.clock) * 1000).toISOString().replace('Z', '000+00:00');
  const put = (T, c, id, data) => T.set(c + '|' + id, { collection: c, id, data, updated_at: ts() });
  const R = (c, id, data) => put(E.recs, c, id, data), M = (c, id, data) => put(E.mon, c, id, data);

  /* ---- chuẩn hóa số điện thoại ---- */
  const T = L.telNorm;
  ok('telNorm: 0901234567', T('0901234567') === '84901234567');
  ok('telNorm: có khoảng trắng, chấm, gạch', T('0901 234.567') === '84901234567' && T('090-123-4567') === '84901234567');
  ok('telNorm: +84', T('+84 901 234 567') === '84901234567' && T('84901234567') === '84901234567' && T('0084901234567') === '84901234567');
  ok('telNorm: thiếu số 0 đầu', T('901234567') === '84901234567');
  ok('telNorm: số cố định Đà Nẵng', T('02363123456') === '842363123456');
  ok('telNorm: số nước ngoài có dấu cộng', T('+1 415 555 2671') === '14155552671');
  ok('telNorm: sai', T('') === '' && T('abc') === '' && T('123') === '' && T('0901') === '' && T(null) === '');

  /* ---- dữ liệu mẫu ---- */
  const tt = E.addUser('tt@gb.vn', 'ttpass123', { role: 'tt', full_name: 'TT' });
  const gv = E.addUser('gv@gb.vn', 'gvpass123', { role: 'gv', staff_id: 'nv04', full_name: 'GV' });
  const TT = await signin('tt@gb.vn', 'ttpass123'), GV = await signin('gv@gb.vn', 'gvpass123');
  R('staff', 'nv04', { id: 'nv04', n: 'Cô Lan', role: 'gv', em: 'gv@gb.vn', ph: '0988111222', pos: 'Giáo viên', st: 'dang', sd: '2024-01-01', sup: 'nv02' });
  R('staff', 'nv05', { id: 'nv05', n: 'Cô Hoa', role: 'gv', em: '', ph: '0901 234 567', pos: 'Giáo viên', st: 'dang' });
  R('staff', 'nv06', { id: 'nv06', n: 'Anh Vũ', role: 'vp', em: 'vu@gb.vn', ph: '0901234567', pos: 'Văn phòng', st: 'dang' });   /* trùng số với nv05 */
  R('staff', 'nv07', { id: 'nv07', n: 'Cô Nghỉ', role: 'gv', em: 'nghi@gb.vn', ph: '', st: 'nghi' });
  R('staff', 'nv08', { id: 'nv08', n: 'Cô Số Lỗi', role: 'gv', em: '', ph: 'abc', st: 'dang' });
  R('staff', 'nv09', { id: 'nv09', n: 'Cô Trống', role: 'gv', em: '', ph: '', st: 'dang' });
  R('staff', 'nv10', { id: 'nv10', n: 'Cô Một', role: 'gv', em: 'm@gb.vn', ph: '', pos: 'Giáo viên 1-1', st: 'dang', pay: { base: 99 } });
  R('staff', 'nv11', { id: 'nv11', n: 'Cô Hai', role: 'gv', em: 'h@gb.vn', ph: '', pos: 'Giáo viên 1-1', st: 'dang' });
  const kid = (id, n, pe, pp, gr) => ({ id, n, pe, pp, pn: 'PH ' + n, gr: gr || '', st: 'dang', gv: 'nv04' });
  R('kids', 'hs001', kid('hs001', 'An', 'A@x.vn', '0912345678', 'G1')); R('kids', 'hs002', kid('hs002', 'Bình', 'a@x.vn', '0912345678', 'G1'));
  R('kids', 'hs003', kid('hs003', 'Chi', '', '0933 111 222', 'G2')); R('kids', 'hs004', kid('hs004', 'Dũng', 'b@x.vn', '0912345678', 'G2')); R('kids', 'hs005', kid('hs005', 'Em', '', '', ''));
  R('groups', 'G1', { id: 'G1', n: 'Ong non', gv: 'nv04', tg: 'nv05' }); R('groups', 'G2', { id: 'G2', n: 'Ong mật', gv: 'nv05', tg: '' });
  R('cfg', '_', { name: 'Golden Bee', cc: 26 }); R('menu', '2026-11-09', { a: 'Cháo' }); R('tpl', 'x', { k: 'x' }); R('cg', '1', { id: '1', t: 'mục tiêu' });
  R('lich', 'l1', { id: 'l1', type: '11', hs: 'hs001', day: 3, slot: '08:00', gv: 'nv10', room: 'P1' });
  R('lich', 'l2', { id: 'l2', type: '11', hs: 'hs004', day: 3, slot: '08:00', gv: 'nv11', room: 'P2' });
  R('lich', 'l3', { id: 'l3', type: '11', hs: 'hs001', day: 5, slot: '09:00', gv: 'nv10', room: 'P1' });
  R('lich', 'lb9', { id: 'lb9', type: 'bu', hs: 'hs004', date: '2026-11-13', slot: '10:00', gv: 'nv11', room: 'P3', mk: 'mk9' });
  R('sess', 's1', { id: 's1', k: 'hs001', note: 'Tốt' }); R('sess', 's2', { id: 's2', k: 'hs004', note: 'Khá' });
  R('rp', 'r1', { id: 'r1', hs: 'hs001', s: 'gui' }); R('rp', 'r2', { id: 'r2', hs: 'hs001', s: 'nhap' }); R('rp', 'r3', { id: 'r3', hs: 'hs004', s: 'gui' });
  R('mk', 'mk1', { id: 'mk1', hs: 'hs001', s: 'dk' }); R('mk', 'mk9', { id: 'mk9', hs: 'hs004', s: 'xn' });
  R('att', '2026-11-02|l1|hs001', 'p'); R('att', '2026-11-02|l2|hs004', 'cm'); R('att', '2026-11-03|G1|hs002', 'cm');
  R('nt', 'n1', { id: 'n1', aud: 'ph', tg: 'all', t: 'Chung' }); R('nt', 'n2', { id: 'n2', aud: 'ph', tg: 'hs001', t: 'Riêng An' }); R('nt', 'n3', { id: 'n3', aud: 'ph', tg: 'hs004', t: 'Riêng Dũng' });
  R('nt', 'n4', { id: 'n4', aud: 'nb', tg: 'all', t: 'Nội bộ' }); R('nt', 'n5', { id: 'n5', aud: 'ph', tg: 'G1', t: 'Lớp Ong non' }); R('nt', 'n6', { id: 'n6', aud: 'ph', tg: 'G2', t: 'Lớp Ong mật' });
  R('plans', 'p1', { id: 'p1', k: 'hs001' }); R('plans', 'p2', { id: 'p2', k: 'hs004' }); R('ts', 'nv04|2026-11-02', { i: '08:00' });
  R('rd', 'n1|ph|a@x.vn', '2026-11-02'); R('rd', 'n1|ph|b@x.vn', '2026-11-03');
  M('cfgm', '_', { p11: 300000, pbtCN: 1 }); M('lg', 'e1', { id: 'e1', hs: 'hs001', amt: 5 }); M('lg', 'e2', { id: 'e2', hs: 'hs004', amt: 7 }); M('pay', 'nv04', { base: 9 }); M('set', 'hs001|2026-10', { ref: 'e1' }); M('set', 'hs004|2026-10', { ref: 'e2' });

  /* ---- tra email theo số điện thoại ---- */
  ok('login: số không hợp lệ: 400', (await call('login', { phone: 'abc' })).code === 400);
  ok('login: số lạ trả địa chỉ nội bộ, không lộ gì', (await call('login', { phone: '0999000111' })).json.email === L.aliasEmail('84999000111'));
  ok('login: GET bị từ chối', (await call('login', { phone: '0901234567' }, null, 'GET')).code === 405);
  E.noPhoneCol = true; const nv3 = await call('login', { phone: '0901234567' }); E.noPhoneCol = false;
  ok('login: chưa chạy SQL v3 thì báo rõ (503)', nv3.code === 503 && /policies-v3/.test(nv3.json.error), nv3.body);

  /* ---- cấp tài khoản nhân viên ---- */
  const cr = (o, tok) => call('accounts', Object.assign({ action: 'create', password: 'matkhau123' }, o), tok || TT);
  ok('create: giáo viên không được cấp (403)', (await cr({ staff_id: 'nv05', role: 'gv' }, GV)).code === 403);
  ok('create: hồ sơ không có email lẫn số điện thoại: 400', (await cr({ staff_id: 'nv09', role: 'gv' })).code === 400);
  ok('create: số điện thoại trong hồ sơ sai định dạng: 400', (await cr({ staff_id: 'nv08', role: 'gv' })).code === 400);
  ok('create: nhân viên nghỉ: 409', (await cr({ staff_id: 'nv07', role: 'gv' })).code === 409);
  ok('create: email khác hồ sơ: 409', (await cr({ staff_id: 'nv04', role: 'gv', email: 'khac@gb.vn' })).code === 409);
  ok('create: số khác hồ sơ: 409', (await cr({ staff_id: 'nv04', role: 'gv', phone: '0999999999' })).code === 409);
  const c5 = await cr({ staff_id: 'nv05', role: 'gv', email: '', phone: '0901 234 567' });
  const u5 = [...E.users.values()].find(u => u.email === L.aliasEmail('84901234567')), p5 = u5 && E.profiles.find(p => p.user_id === u5.id);
  ok('create: nhân viên chỉ có SĐT được cấp, dùng địa chỉ nội bộ', c5.code === 200 && u5 && u5.confirmed, c5.body);
  ok('create: hồ sơ vai trò có mã nhân viên và SĐT chuẩn hóa', p5 && p5.role === 'gv' && p5.staff_id === 'nv05' && p5.phone === '84901234567' && p5.full_name === 'Cô Hoa');
  ok('create: số điện thoại đã dùng cho tài khoản khác: 409', (await cr({ staff_id: 'nv06', role: 'vp' })).code === 409);
  ok('create: chưa cấp tài khoản nào cho nv06 khi bị từ chối', ![...E.users.values()].some(u => u.email === 'vu@gb.vn'));
  const c4 = await cr({ staff_id: 'nv04', role: 'gv', email: 'gv@gb.vn', phone: '0988111222' });
  ok('create: trùng tài khoản đã có: 409', c4.code === 409, c4.body);
  const r1 = await call('login', { phone: '+84 901-234-567' });
  ok('login: tra ra đúng tài khoản chỉ có SĐT', r1.json.email === L.aliasEmail('84901234567'));
  ok('login: đăng nhập được bằng email tra được và mật khẩu', !!(await signin(r1.json.email, 'matkhau123')));
  /* nhân viên có cả email lẫn số điện thoại */
  E.users.delete(gv.id); E.profiles = E.profiles.filter(p => p.user_id !== gv.id);
  const c4b = await cr({ staff_id: 'nv04', role: 'gv', email: 'gv@gb.vn', phone: '0988111222' });
  const GV2 = await signin('gv@gb.vn', 'matkhau123');
  ok('create: nhân viên có email và SĐT', c4b.code === 200 && E.profiles.some(p => p.staff_id === 'nv04' && p.phone === '84988111222'), c4b.body);
  ok('login: số của nhân viên có email trả về email thật', (await call('login', { phone: '0988 111 222' })).json.email === 'gv@gb.vn');
  ok('login: số khác định dạng, cùng người', (await call('login', { phone: '+84988111222' })).json.email === 'gv@gb.vn');
  E.noPhoneCol = true; const nv3b = await cr({ staff_id: 'nv06', role: 'vp' }); E.noPhoneCol = false;
  ok('create: chưa chạy SQL v3 thì báo 503', nv3b.code === 503, nv3b.body);

  /* ---- danh sách, đặt mật khẩu, thu hồi theo uid ---- */
  const ls = await call('accounts', { action: 'list' }, TT);
  const a5 = ls.json.accounts.find(a => a.staff_id === 'nv05');
  ok('list: có uid, SĐT, và không lộ địa chỉ nội bộ', a5 && a5.uid === u5.id && a5.phone === '84901234567' && a5.email === '' && ls.json.accounts.find(a => a.staff_id === 'nv04').email === 'gv@gb.vn');
  ok('setpw: theo uid', (await call('accounts', { action: 'setpw', uid: u5.id, password: 'moimoi2026' }, TT)).code === 200 && u5.pw === 'moimoi2026');
  ok('setpw: uid lạ: 404', (await call('accounts', { action: 'setpw', uid: 'khong-co', password: 'moimoi2026' }, TT)).code === 404);
  const rm = await call('accounts', { action: 'remove', uid: u5.id }, TT);
  ok('remove: thu hồi theo uid, SĐT được giải phóng', rm.code === 200 && u5.banned && !E.profiles.some(p => p.user_id === u5.id));
  ok('login: sau thu hồi, số không còn tra ra tài khoản', (await call('login', { phone: '0901234567' })).json.email === L.aliasEmail('84901234567') && !(await signin(L.aliasEmail('84901234567'), 'moimoi2026')));
  const re = await cr({ staff_id: 'nv05', role: 'gv', password: 'laidat12345' });
  ok('create: cấp lại sau thu hồi mở khóa tài khoản cũ', re.code === 200 && !u5.banned && u5.pw === 'laidat12345' && [...E.users.values()].filter(u => u.email === u5.email).length === 1, re.body);
  /* địa chỉ nội bộ bị Supabase từ chối */
  E.rejectDomain = 'example.com';
  const rj = await call('accounts', { action: 'create_ph', pkey: 'tel:84933111222', password: 'phuhuynh123' }, TT);
  ok('create_ph: địa chỉ nội bộ bị từ chối thì gợi ý đổi PHONE_ALIAS_DOMAIN', rj.code === 400 && /PHONE_ALIAS_DOMAIN/.test(rj.json.error), rj.body);
  E.rejectDomain = '';

  /* ---- cấp tài khoản phụ huynh ---- */
  const ph = (key, pw, tok) => call('accounts', { action: 'create_ph', pkey: key, password: pw || 'phuhuynh123' }, tok || TT);
  ok('create_ph: giáo viên không được cấp (403)', (await ph('a@x.vn', null, GV2)).code === 403);
  ok('create_ph: phụ huynh không có trong hồ sơ: 409', (await ph('khong@co.vn')).code === 409);
  ok('create_ph: mật khẩu ngắn: 400', (await ph('a@x.vn', 'abc')).code === 400);
  const pa = await ph('a@x.vn');
  ok('create_ph: phụ huynh có email (nhiều bé): dùng email thật, gom các bé', pa.code === 200 && pa.json.kids.sort().join() === 'hs001,hs002' && [...E.users.values()].some(u => u.email === 'a@x.vn'), pa.body);
  const prA = E.profiles.find(p => p.staff_id === 'ph|a@x.vn');
  ok('create_ph: hồ sơ vai trò ph, khóa phụ huynh, SĐT', prA && prA.role === 'ph' && prA.phone === '84912345678' && prA.full_name === 'PH An');
  ok('create_ph: trùng: 409', (await ph('A@x.vn')).code === 409);
  const pb = await ph('b@x.vn');
  ok('create_ph: SĐT đã dùng ở tài khoản khác thì chỉ đăng nhập bằng email', pb.code === 200 && pb.json.phoneSkipped === true && !E.profiles.find(p => p.staff_id === 'ph|b@x.vn').phone, pb.body);
  const pc = await ph('tel:84933111222');
  ok('create_ph: phụ huynh chỉ có SĐT dùng địa chỉ nội bộ', pc.code === 200 && E.profiles.some(p => p.staff_id === 'ph|tel:84933111222' && p.phone === '84933111222') && [...E.users.values()].some(u => u.email === L.aliasEmail('84933111222')), pc.body);
  ok('login: SĐT phụ huynh tra ra tài khoản', (await call('login', { phone: '0933111222' })).json.email === L.aliasEmail('84933111222'));
  ok('login: SĐT chung của gia đình A (đã giữ bởi A)', (await call('login', { phone: '0912345678' })).json.email === 'a@x.vn');

  /* ---- cổng phụ huynh: đọc ---- */
  const TA = await signin('a@x.vn', 'phuhuynh123'), TC = await signin(L.aliasEmail('84933111222'), 'phuhuynh123'), TB = await signin('b@x.vn', 'phuhuynh123');
  ok('parent: nhân viên (giáo viên) không dùng được: 403', (await call('parent', { action: 'load' }, GV2)).code === 403);
  ok('parent: không đăng nhập: 401', (await call('parent', { action: 'load' })).code === 401);
  ok('parent: thao tác lạ: 400', (await call('parent', { action: 'xoa' }, TA)).code === 400);
  const la = await call('parent', { action: 'load' }, TA); const J = la.json;
  const ids = c => (J.records || []).filter(r => r.collection === c).map(r => r.id).sort().join(',');
  const mids = c => (J.money || []).filter(r => r.collection === c).map(r => r.id).sort().join(',');
  ok('parent A: chỉ thấy 2 bé của mình', la.code === 200 && ids('kids') === 'hs001,hs002' && J.kids.join() === 'hs001,hs002', la.body.slice(0, 200));
  ok('parent A: lịch, buổi học, kế hoạch chỉ của bé mình', ids('lich') === 'l1,l3' && ids('sess') === 's1' && ids('plans') === 'p1' && ids('mk') === 'mk1');
  ok('parent A: chỉ báo cáo đã gửi, không có bản nháp hay của bé khác', ids('rp') === 'r1');
  ok('parent A: điểm danh của các bé mình', ids('att') === '2026-11-02|l1|hs001,2026-11-03|G1|hs002');
  ok('parent A: thông báo cho phụ huynh đúng đối tượng (chung, bé mình, lớp mình)', ids('nt') === 'n1,n2,n5');
  ok('parent A: dấu đã đọc chỉ của mình', ids('rd') === 'n1|ph|a@x.vn');
  ok('parent A: có cấu hình, nhóm lớp, thực đơn, mẫu', ids('cfg') === '_' && ids('groups') === 'G1,G2' && ids('menu') === '2026-11-09' && ids('tpl') === 'x' && ids('cg') === '1');
  const stf = (J.records || []).filter(r => r.collection === 'staff');
  ok('parent A: nhân viên chỉ lộ tên và chức vụ (không email, điện thoại, ngày vào làm, lương)', stf.length === 8 && stf.every(s => s.data.em === '' && s.data.ph === '' && !s.data.sd && !s.data.pay) && stf.find(s => s.id === 'nv04').data.n === 'Cô Lan');
  ok('parent A: học phí và công nợ chỉ của bé mình, không có lương', mids('lg') === 'e1' && mids('set') === 'hs001|2026-10' && mids('cfgm') === '_' && !mids('pay') && !(J.records || []).some(r => r.collection === 'ts' || r.collection === 'lr'));
  ok('parent A: không có dữ liệu của bé khác ở bất cứ đâu', !JSON.stringify(J).includes('hs004') && !JSON.stringify(J).includes('b@x.vn'));
  const lc = (await call('parent', { action: 'load' }, TC)).json;
  ok('parent C (chỉ SĐT): thấy bé Chi, không thấy ai khác', lc.kids.join() === 'hs003' && !JSON.stringify(lc).includes('hs001'));
  const lb = (await call('parent', { action: 'load' }, TB)).json;
  ok('parent B: bé Dũng cùng SĐT với gia đình A vẫn tách biệt', lb.kids.join() === 'hs004' && lb.records.filter(r => r.collection === 'lich').map(r => r.id).sort().join() === 'l2,lb9' && !JSON.stringify(lb).includes('hs001'));
  ok('parent B: thông báo lớp Ong mật', lb.records.filter(r => r.collection === 'nt').map(r => r.id).sort().join() === 'n1,n3,n6');
  /* RLS: phụ huynh không đọc/ghi trực tiếp được */
  const direct = async (path, tok, init) => (await fetch(E.url + path, Object.assign({ headers: { apikey: 'pub', authorization: 'Bearer ' + tok, 'content-type': 'application/json' } }, init || {})));
  ok('RLS: phụ huynh đọc thẳng bảng records chỉ thấy 0 dòng', (await (await direct('/rest/v1/records?select=*', TA)).json()).length === 0);
  ok('RLS: phụ huynh đọc thẳng bảng tiền chỉ thấy 0 dòng', (await (await direct('/rest/v1/money_records?select=*', TA)).json()).length === 0);
  ok('RLS: phụ huynh ghi thẳng bị từ chối', (await direct('/rest/v1/records', TA, { method: 'POST', body: JSON.stringify([{ collection: 'kids', id: 'x', data: {} }]) })).status === 403);

  /* ---- kéo thay đổi ---- */
  const since = { records: J.records.reduce((m, r) => r.updated_at > m ? r.updated_at : m, ''), money: J.money.reduce((m, r) => r.updated_at > m ? r.updated_at : m, '') };
  const p0 = (await call('parent', { action: 'pull', since, known: J.kids }, TA)).json;
  ok('pull: không đổi thì không có dòng nào', p0.records.length === 0 && p0.money.length === 0);
  R('sess', 's3', { id: 's3', k: 'hs002', note: 'Mới' }); R('sess', 's4', { id: 's4', k: 'hs004', note: 'Của bé khác' }); M('lg', 'e3', { id: 'e3', hs: 'hs002', amt: 3 });
  const p1 = (await call('parent', { action: 'pull', since, known: J.kids }, TA)).json;
  ok('pull: chỉ dòng mới của bé mình', p1.records.map(r => r.id).join() === 's3' && p1.money.map(r => r.id).join() === 'e3');
  R('kids', 'hs006', kid('hs006', 'Giang', 'a@x.vn', '', 'G1'));
  const p2 = (await call('parent', { action: 'pull', since, known: J.kids }, TA)).json;
  ok('pull: có bé mới gắn vào tài khoản thì yêu cầu tải lại toàn bộ', p2.reload === true);

  /* ---- cổng phụ huynh: ghi ---- */
  const pw = (rows, dels, tok) => call('parent', { action: 'put', rows, dels }, tok || TA);
  const mkRow = (id, hs) => ({ collection: 'mk', id, data: { id, hs, s: 'dk', by: 'ph', props: [], log: [] } });
  ok('put: tạo yêu cầu học bù cho bé của mình', (await pw([mkRow('mk20', 'hs001')])).code === 200 && E.recs.get('mk|mk20').data.hs === 'hs001');
  ok('put: không tạo yêu cầu cho bé của người khác (403)', (await pw([mkRow('mk21', 'hs004')])).code === 403 && !E.recs.has('mk|mk21'));
  ok('put: không ghi đè yêu cầu của bé khác (403)', (await pw([mkRow('mk9', 'hs001')])).code === 403 && E.recs.get('mk|mk9').data.hs === 'hs004');
  ok('put: cả lô bị từ chối nếu một dòng sai, không ghi dòng nào', (await pw([mkRow('mk22', 'hs001'), mkRow('mk23', 'hs004')])).code === 403 && !E.recs.has('mk|mk22'));
  const lb1 = (id, o) => ({ collection: 'lich', id, data: Object.assign({ id, type: 'bu', hs: 'hs001', date: '2026-11-16', slot: '10:00', gv: 'nv10', room: 'P1', mk: 'mk20' }, o || {}) });
  ok('put: lịch học bù của bé mình', (await pw([lb1('lb20')])).code === 200 && E.recs.has('lich|lb20'));
  ok('put: không tạo buổi 1-1 cố định (403)', (await pw([lb1('l50', { type: '11', day: 2 })])).code === 403);
  ok('put: không đặt lịch cho bé khác (403)', (await pw([lb1('lb21', { hs: 'hs004' })])).code === 403);
  const cf = await pw([lb1('lb22', { gv: 'nv11', slot: '10:00', date: '2026-11-13', room: 'P9' })]);
  ok('put: trùng giáo viên cùng khung giờ bị chặn (403)', cf.code === 403 && /đã có buổi khác/.test(cf.json.error) && !E.recs.has('lich|lb22'), cf.body);
  const cf2 = await pw([lb1('lb23', { room: 'P3', date: '2026-11-13', slot: '10:00', gv: 'nv10' })]);
  ok('put: trùng phòng cùng khung giờ bị chặn (403)', cf2.code === 403, cf2.body);
  const cf3 = await pw([lb1('lb24', { gv: 'nv10', date: '2026-11-11', slot: '08:00', room: 'P7' })]);
  ok('put: trùng buổi 1-1 cố định cùng thứ trong tuần bị chặn (403)', cf3.code === 403 && /đã có buổi khác/.test(cf3.json.error), cf3.body);
  const cf4 = await pw([lb1('lb25', { gv: 'nv05', date: '2026-11-16', slot: '10:00', room: 'P8' })]);   /* nv05 phụ trách lớp bán trú, thứ Hai */
  ok('put: giáo viên đang phụ trách lớp bán trú bị chặn (403)', cf4.code === 403 && /bán trú/.test(cf4.json.error), cf4.body);
  ok('put: dời giờ buổi bù của mình', (await pw([lb1('lb20', { date: '2026-11-17' })])).code === 200 && E.recs.get('lich|lb20').data.date === '2026-11-17');
  ok('put: xóa buổi bù của mình', (await pw([], [{ collection: 'lich', id: 'lb20' }])).code === 200 && !E.recs.has('lich|lb20'));
  ok('put: không xóa buổi bù của bé khác (403)', (await pw([], [{ collection: 'lich', id: 'lb9' }])).code === 403 && E.recs.has('lich|lb9'));
  ok('put: không xóa buổi 1-1 cố định (403)', (await pw([], [{ collection: 'lich', id: 'l1' }])).code === 403 && E.recs.has('lich|l1'));
  ok('put: không xóa yêu cầu học bù (403)', (await pw([], [{ collection: 'mk', id: 'mk1' }])).code === 403);
  ok('put: đánh dấu đã đọc thông báo', (await pw([{ collection: 'rd', id: 'n2|ph|a@x.vn', data: '2026-11-09' }])).code === 200 && E.recs.get('rd|n2|ph|a@x.vn').data === '2026-11-09');
  ok('put: không đánh dấu thay phụ huynh khác (403)', (await pw([{ collection: 'rd', id: 'n2|ph|b@x.vn', data: '2026-11-09' }])).code === 403);
  for (const c of ['kids', 'sess', 'rp', 'att', 'nt', 'cfg', 'staff', 'plans', 'menu', 'groups', 'ts'])
    ok('put: không ghi vào nhóm ' + c + ' (403)', (await pw([{ collection: c, id: 'hs001', data: { hs: 'hs001', k: 'hs001', x: 1 } }])).code === 403);
  ok('put: không ghi vào bảng tiền (403)', (await pw([{ collection: 'lg', id: 'e1', data: { hs: 'hs001', amt: 0 } }])).code === 403 && E.mon.get('lg|e1').data.amt === 5);
  ok('put: dữ liệu quá lớn bị chặn', (await pw([{ collection: 'mk', id: 'mk30', data: { hs: 'hs001', pad: 'x'.repeat(30000) } }])).code === 403);
  ok('put: quá nhiều dòng: 400', (await pw(Array.from({ length: 401 }, (_, i) => mkRow('m' + i, 'hs001')))).code === 400);
  ok('put: id có ký tự lạ bị chặn (403)', (await pw([{ collection: 'mk', id: 'a",b', data: { hs: 'hs001' } }])).code === 403);
  ok('put: nhân viên không dùng được cổng ghi: 403', (await pw([mkRow('mk40', 'hs001')], [], GV2)).code === 403);

  /* ---- nhiều hơn 1000 hồ sơ trẻ: tra cứu phải đọc hết các trang ---- */
  for (let i = 1; i <= 1300; i++) R('kids', 'k' + String(i).padStart(4, '0'), kid('k' + String(i).padStart(4, '0'), 'Phụ ' + i, 'f' + i + '@x.vn', '', ''));
  R('kids', 'zz1', kid('zz1', 'Cuối', 'late@x.vn', '', 'G1'));
  const late = await ph('late@x.vn');
  ok('hơn 1000 hồ sơ trẻ: cấp tài khoản cho phụ huynh ở trang cuối', late.code === 200 && late.json.kids.join() === 'zz1', late.body);
  const TL = await signin('late@x.vn', 'phuhuynh123');
  ok('hơn 1000 hồ sơ trẻ: cổng phụ huynh tìm đúng bé ở trang cuối', (await call('parent', { action: 'load' }, TL)).json.kids.join() === 'zz1');

  /* ---- khóa secret không lộ ---- */
  const all = [la.body, p0 && JSON.stringify(p0), rj.body, c5.body].join('');
  ok('khóa secret không xuất hiện trong phản hồi', !all.includes(SECRET) && !all.includes('EMU_KEY'));
  const noKey = process.env.SUPABASE_SECRET_KEY; delete process.env.SUPABASE_SECRET_KEY;
  ok('thiếu khóa secret: 500 có hướng dẫn', (await call('login', { phone: '0901234567' })).code === 500 && (await call('parent', { action: 'load' }, TA)).code === 500);
  process.env.SUPABASE_SECRET_KEY = noKey;

  E.close(); console.log('\n' + pass + ' PASS, ' + fail + ' FAIL'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
