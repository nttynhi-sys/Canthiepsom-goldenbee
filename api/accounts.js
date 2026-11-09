/* Vercel serverless function: Trưởng Trung tâm cấp, đặt lại mật khẩu và thu hồi tài khoản đăng nhập
   (nhân viên và phụ huynh). Cần biến môi trường SUPABASE_SECRET_KEY. */
const L = require('./_lib');
const { HttpError, clean, sbSecret, telNorm, aliasEmail, aliasDomain, pkeyOf, EMAIL, findUser, profileOf, checkPw } = L;
const ROLES = ['vp', 'ql', 'gv'];            /* vai trò nhân viên được cấp trong ứng dụng; Trưởng Trung tâm tạo trực tiếp trong Supabase */

/* Chỉ Trưởng Trung tâm */
async function caller(req) {
  const me = await L.whoami(req);
  if (me.role !== 'tt') throw new HttpError(403, 'Chỉ Trưởng Trung tâm được quản lý tài khoản.');
  return me;
}

const NEED_V3 = 'Máy chủ dữ liệu chưa có cột số điện thoại. Hãy chạy tệp supabase/policies-v3.sql trong SQL Editor rồi thử lại.';
const noPhoneCol = r => !r.ok && r.json && (r.json.code === '42703' || r.json.code === 'PGRST204' || /phone/i.test(String(r.json.message || '')));

/* Danh sách hồ sơ vai trò (có cột phone nếu đã chạy SQL v3) */
async function profilesAll() {
  let r = await L.pageAll('/rest/v1/profiles?select=user_id,role,staff_id,full_name,phone&order=user_id');
  if (!r.ok && noPhoneCol(r)) r = await L.pageAll('/rest/v1/profiles?select=user_id,role,staff_id,full_name&order=user_id');
  if (!r.ok) throw new HttpError(500, 'Không đọc được vai trò.');
  return r.json || [];
}

/* Tạo (hoặc mở lại) một tài khoản Auth và gắn hồ sơ vai trò. Dùng chung cho nhân viên và phụ huynh. */
async function provision(o) {
  const { authEmail, role, staffId, full, tel, pw } = o;
  let u = null, created = false;
  const r = await L.sbSecret('/auth/v1/admin/users', { method: 'POST', body: { email: authEmail, password: pw, email_confirm: true } });
  if (r.ok) { u = r.json; created = true; }
  else if (r.status === 422 && /exist|registered|duplicate/i.test(JSON.stringify(r.json || {}))) {
    u = await findUser(authEmail);
    if (!u) throw new HttpError(500, 'Không đọc được tài khoản đã có.');
    if (await profileOf(u.id)) throw new HttpError(409, 'Email hoặc số điện thoại này đã có tài khoản.');
    /* tài khoản cũ đã bị thu hồi: mở lại và đặt mật khẩu mới */
    const m = await sbSecret('/auth/v1/admin/users/' + u.id, { method: 'PUT', body: { password: pw, ban_duration: 'none', email_confirm: true } });
    if (!m.ok) throw new HttpError(500, 'Không mở lại được tài khoản: ' + ((m.json && (m.json.msg || m.json.message)) || m.status));
  } else {
    const msg = (r.json && (r.json.msg || r.json.message || r.json.error_description)) || r.status;
    throw new HttpError(r.status === 422 ? 400 : 500, 'Không tạo được tài khoản: ' + msg + (/valid|invalid/i.test(String(msg)) && authEmail.endsWith('@' + aliasDomain()) ? ' (nếu máy chủ không nhận địa chỉ nội bộ @' + aliasDomain() + ', hãy đặt biến PHONE_ALIAS_DOMAIN trong Vercel bằng một tên miền có thật)' : ''));
  }
  const row = { user_id: u.id, role, staff_id: staffId, full_name: full };
  if (tel) row.phone = tel;
  let p = await sbSecret('/rest/v1/profiles', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: row });
  let err = null;
  if (!p.ok) err = noPhoneCol(p) ? new HttpError(503, NEED_V3) : (p.json && p.json.code === '23505') ? new HttpError(409, 'Số điện thoại này đã dùng cho tài khoản khác.') : new HttpError(500, 'Không gắn được vai trò cho tài khoản.');
  if (err) {
    if (created) await sbSecret('/auth/v1/admin/users/' + u.id, { method: 'DELETE' });   /* hoàn tác để không để lại tài khoản không vai trò */
    else await sbSecret('/auth/v1/admin/users/' + u.id, { method: 'PUT', body: { ban_duration: '876000h' } });   /* giữ nguyên trạng thái bị thu hồi */
    throw err;
  }
  return u;
}

async function phoneTaken(tel) {
  if (!tel) return false;
  const r = await sbSecret('/rest/v1/profiles?select=user_id&phone=eq.' + encodeURIComponent(tel) + '&limit=1');
  if (!r.ok) { if (noPhoneCol(r)) throw new HttpError(503, NEED_V3); throw new HttpError(500, 'Không kiểm tra được số điện thoại.'); }
  return !!(r.json && r.json[0]);
}

/* Tìm tài khoản theo uid hoặc email đăng nhập; chỉ nhận tài khoản đã có vai trò */
async function target(b) {
  let u = null;
  if (clean(b.uid)) { const r = await sbSecret('/auth/v1/admin/users/' + encodeURIComponent(clean(b.uid))); u = r.ok ? r.json : null; }
  else { const email = clean(b.email).toLowerCase(); if (email) u = await findUser(email); }
  const p = u && await profileOf(u.id);
  if (!u || !p) throw new HttpError(404, 'Không tìm thấy tài khoản này.');
  return { u, p };
}

const actions = {
  /* Danh sách tài khoản đang có vai trò: để hiển thị trạng thái ở danh sách nhân sự và phụ huynh */
  async list() {
    const [us, pr] = await Promise.all([L.allUsers(), profilesAll()]);
    const byId = {}; pr.forEach(p => { byId[p.user_id] = p; });
    const dom = '@' + aliasDomain();
    return { accounts: us.filter(u => byId[u.id]).map(u => { const p = byId[u.id], em = clean(u.email).toLowerCase(); return { uid: u.id, email: em.endsWith(dom) ? '' : em, phone: p.phone || '', role: p.role, staff_id: p.staff_id || null, full_name: p.full_name || '' }; }) };
  },

  /* Cấp tài khoản cho nhân viên: lấy email và số điện thoại từ hồ sơ nhân sự đã lưu */
  async create(b) {
    const role = clean(b.role), sid = clean(b.staff_id), pw = b.password;
    if (!ROLES.includes(role)) throw new HttpError(400, 'Vai trò cấp tài khoản phải là Quản lý, Văn phòng hoặc Giáo viên.');
    if (!sid) throw new HttpError(400, 'Thiếu mã nhân viên.');
    checkPw(pw);
    /* hồ sơ nhân sự phải đã lưu trên máy chủ và khớp, vai trò */
    const st = await sbSecret('/rest/v1/records?select=data&collection=eq.staff&id=eq.' + encodeURIComponent(sid));
    const d = st.ok && st.json[0] ? st.json[0].data : null;
    if (!d) throw new HttpError(409, 'Hồ sơ nhân viên chưa được lưu lên máy chủ. Hãy bấm Lưu hồ sơ rồi thử lại.');
    const email = clean(d.em).toLowerCase(), tel = telNorm(d.ph);
    if (email && !EMAIL.test(email)) throw new HttpError(400, 'Email trong hồ sơ không hợp lệ.');
    if (clean(d.ph) && !tel) throw new HttpError(400, 'Số điện thoại trong hồ sơ chưa hợp lệ.');
    if (!email && !tel) throw new HttpError(400, 'Hồ sơ cần có email hoặc số điện thoại để đăng nhập.');
    if (b.email !== undefined && clean(b.email).toLowerCase() !== email) throw new HttpError(409, 'Email khác với hồ sơ đã lưu. Hãy lưu hồ sơ trước.');
    if (b.phone !== undefined && telNorm(b.phone) !== tel) throw new HttpError(409, 'Số điện thoại khác với hồ sơ đã lưu. Hãy lưu hồ sơ trước.');
    if (d.role !== role) throw new HttpError(409, 'Vai trò khác với hồ sơ đã lưu. Hãy lưu hồ sơ trước.');
    if (d.st !== 'dang') throw new HttpError(409, 'Nhân viên này đã nghỉ việc.');
    if (await phoneTaken(tel)) throw new HttpError(409, 'Số điện thoại này đã dùng cho tài khoản khác.');
    await provision({ authEmail: email || aliasEmail(tel), role, staffId: sid, full: clean(d.n), tel, pw });
    return { ok: true, email, phone: tel, role };
  },

  /* Cấp tài khoản cho phụ huynh theo khóa phụ huynh (email hoặc 'tel:số'), lấy thông tin từ hồ sơ trẻ đã lưu */
  async create_ph(b) {
    const key = clean(b.pkey).toLowerCase(), pw = b.password;
    if (!key) throw new HttpError(400, 'Thiếu khóa phụ huynh.');
    checkPw(pw);
    const kr = await L.pageAll('/rest/v1/records?select=data&collection=eq.kids&order=id');
    if (!kr.ok) throw new HttpError(500, 'Không đọc được hồ sơ trẻ.');
    const ks = (kr.json || []).map(r => r.data).filter(k => pkeyOf(k) === key);
    if (!ks.length) throw new HttpError(409, 'Không thấy phụ huynh này trong hồ sơ trẻ đã lưu. Hãy lưu hồ sơ rồi thử lại.');
    const email = key.includes('@') ? key : '';
    const tel = key.startsWith('tel:') ? key.slice(4) : (ks.map(k => telNorm(k.pp)).find(Boolean) || '');
    if (email && !EMAIL.test(email)) throw new HttpError(400, 'Email phụ huynh không hợp lệ.');
    const sid = 'ph|' + key;
    const prs = await profilesAll();
    if (prs.some(p => p.staff_id === sid)) throw new HttpError(409, 'Phụ huynh này đã có tài khoản.');
    /* số điện thoại đã dùng ở tài khoản khác thì chỉ đăng nhập bằng email, không đặt số cho tài khoản này */
    let phone = tel, skipped = false;
    if (phone && await phoneTaken(phone)) { phone = ''; skipped = true; if (!email) throw new HttpError(409, 'Số điện thoại này đã dùng cho tài khoản khác.'); }
    await provision({ authEmail: email || aliasEmail(tel), role: 'ph', staffId: sid, full: clean(ks[0].pn), tel: phone, pw });
    return { ok: true, email, phone, phoneSkipped: skipped, kids: ks.map(k => k.id) };
  },

  async setpw(b) {
    checkPw(b.password);
    const t = await target(b);
    const r = await sbSecret('/auth/v1/admin/users/' + t.u.id, { method: 'PUT', body: { password: b.password } });
    if (!r.ok) throw new HttpError(500, 'Không đổi được mật khẩu.');
    return { ok: true };
  },

  async remove(b, me) {
    const t = await target(b);
    if (t.u.id === me.id || clean(t.u.email).toLowerCase() === me.email) throw new HttpError(400, 'Không thể thu hồi tài khoản của chính bạn.');
    if (t.p.role === 'tt') throw new HttpError(403, 'Không thu hồi tài khoản Trưởng Trung tâm tại đây.');
    /* xóa vai trò là chặn ngay mọi quyền đọc và ghi dữ liệu; khóa thêm tài khoản để không đăng nhập lại được */
    const d = await sbSecret('/rest/v1/profiles?user_id=eq.' + encodeURIComponent(t.u.id), { method: 'DELETE' });
    if (!d.ok) throw new HttpError(500, 'Không thu hồi được vai trò.');
    await sbSecret('/auth/v1/admin/users/' + t.u.id, { method: 'PUT', body: { ban_duration: '876000h' } });
    return { ok: true };
  }
};

module.exports = L.wrap(async (b, req) => {
  const me = await caller(req);
  const f = actions[b.action];
  if (!f) throw new HttpError(400, 'Thao tác không hợp lệ.');
  return f(b, me);
});
