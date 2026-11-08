/* Vercel serverless function: Trưởng Trung tâm cấp, đặt lại mật khẩu và thu hồi tài khoản đăng nhập.
   Cần biến môi trường SUPABASE_SECRET_KEY (khóa secret của Supabase). Khóa này CHỈ nằm ở đây, không bao giờ gửi về trình duyệt. */
const SB_URL = (process.env.SUPABASE_URL || 'https://bqvwibipmzyrkrwlfoqf.supabase.co').replace(/\/$/, '');
const PUB_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_SHk0kLdrNieeOY9Ilfw27g_vHe7Jd8A';
const ROLES = ['vp', 'ql', 'gv'];            /* vai trò được cấp trong ứng dụng; Trưởng Trung tâm tạo trực tiếp trong Supabase */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }

function secretHeaders(extra) {
  const k = process.env.SUPABASE_SECRET_KEY || '';
  const h = Object.assign({ apikey: k, 'Content-Type': 'application/json' }, extra || {});
  if (k.startsWith('eyJ')) h.Authorization = 'Bearer ' + k;   /* khóa service_role dạng JWT cũ */
  return h;
}
async function sbSecret(path, opt) {
  opt = opt || {};
  const r = await fetch(SB_URL + path, { method: opt.method || 'GET', headers: secretHeaders(opt.headers), body: opt.body === undefined ? undefined : JSON.stringify(opt.body) });
  let j = null; const t = await r.text(); try { j = t ? JSON.parse(t) : null; } catch (e) { j = { message: t }; }
  return { ok: r.ok, status: r.status, json: j };
}
const clean = s => String(s == null ? '' : s).trim();

/* Xác định người gọi từ mã đăng nhập, rồi kiểm tra vai trò thật trong bảng profiles */
async function caller(req) {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers['authorization'] || req.headers['Authorization'] || '');
  if (!m) throw new HttpError(401, 'Chưa đăng nhập.');
  const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: PUB_KEY, Authorization: 'Bearer ' + m[1] } });
  if (!r.ok) throw new HttpError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  const u = await r.json();
  const p = await sbSecret('/rest/v1/profiles?select=role&user_id=eq.' + encodeURIComponent(u.id));
  if (!p.ok) throw new HttpError(500, 'Không đọc được vai trò người dùng.');
  if (!p.json[0] || p.json[0].role !== 'tt') throw new HttpError(403, 'Chỉ Trưởng Trung tâm được quản lý tài khoản.');
  return { id: u.id, email: clean(u.email).toLowerCase() };
}

async function allUsers() {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const r = await sbSecret('/auth/v1/admin/users?page=' + page + '&per_page=1000');
    if (!r.ok) throw new HttpError(500, 'Không đọc được danh sách tài khoản.');
    const us = (r.json && r.json.users) || [];
    out.push(...us);
    if (us.length < 1000) break;
  }
  return out;
}
const findUser = async email => (await allUsers()).find(u => clean(u.email).toLowerCase() === email) || null;
async function profileOf(uid) {
  const r = await sbSecret('/rest/v1/profiles?select=user_id,role,staff_id,full_name&user_id=eq.' + encodeURIComponent(uid));
  return r.ok && r.json[0] ? r.json[0] : null;
}
function checkPw(pw) { if (typeof pw !== 'string' || pw.length < 8) throw new HttpError(400, 'Mật khẩu cần ít nhất 8 ký tự.'); if (pw.length > 72) throw new HttpError(400, 'Mật khẩu quá dài (tối đa 72 ký tự).'); }

const actions = {
  /* Danh sách tài khoản đang có vai trò: để hiển thị trạng thái ở danh sách nhân sự */
  async list() {
    const [us, pr] = await Promise.all([allUsers(), sbSecret('/rest/v1/profiles?select=user_id,role,staff_id,full_name')]);
    if (!pr.ok) throw new HttpError(500, 'Không đọc được vai trò.');
    const byId = {}; pr.json.forEach(p => { byId[p.user_id] = p; });
    return { accounts: us.filter(u => byId[u.id]).map(u => ({ email: clean(u.email).toLowerCase(), role: byId[u.id].role, staff_id: byId[u.id].staff_id || null, full_name: byId[u.id].full_name || '' })) };
  },
  async create(b) {
    const email = clean(b.email).toLowerCase(), role = clean(b.role), sid = clean(b.staff_id), pw = b.password;
    if (!EMAIL.test(email)) throw new HttpError(400, 'Email không hợp lệ.');
    if (!ROLES.includes(role)) throw new HttpError(400, 'Vai trò cấp tài khoản phải là Quản lý, Văn phòng hoặc Giáo viên.');
    if (!sid) throw new HttpError(400, 'Thiếu mã nhân viên.');
    checkPw(pw);
    /* hồ sơ nhân sự phải đã lưu trên máy chủ và khớp email, vai trò */
    const st = await sbSecret('/rest/v1/records?select=data&collection=eq.staff&id=eq.' + encodeURIComponent(sid));
    const d = st.ok && st.json[0] ? st.json[0].data : null;
    if (!d) throw new HttpError(409, 'Hồ sơ nhân viên chưa được lưu lên máy chủ. Hãy bấm Lưu hồ sơ rồi thử lại.');
    if (clean(d.em).toLowerCase() !== email || d.role !== role) throw new HttpError(409, 'Email hoặc vai trò khác với hồ sơ đã lưu. Hãy lưu hồ sơ trước.');
    if (d.st !== 'dang') throw new HttpError(409, 'Nhân viên này đã nghỉ việc.');
    const full = clean(d.n);
    let u = await findUser(email), created = false;
    if (u) {
      if (await profileOf(u.id)) throw new HttpError(409, 'Email này đã có tài khoản.');
      /* tài khoản cũ đã bị thu hồi: mở lại và đặt mật khẩu mới */
      const r = await sbSecret('/auth/v1/admin/users/' + u.id, { method: 'PUT', body: { password: pw, ban_duration: 'none', email_confirm: true } });
      if (!r.ok) throw new HttpError(500, 'Không mở lại được tài khoản: ' + ((r.json && (r.json.msg || r.json.message)) || r.status));
    } else {
      const r = await sbSecret('/auth/v1/admin/users', { method: 'POST', body: { email, password: pw, email_confirm: true } });
      if (!r.ok) throw new HttpError(r.status === 422 ? 400 : 500, 'Không tạo được tài khoản: ' + ((r.json && (r.json.msg || r.json.message || r.json.error_description)) || r.status));
      u = r.json; created = true;
    }
    const p = await sbSecret('/rest/v1/profiles', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { user_id: u.id, role, staff_id: sid, full_name: full } });
    if (!p.ok) {
      if (created) await sbSecret('/auth/v1/admin/users/' + u.id, { method: 'DELETE' });   /* hoàn tác để không để lại tài khoản không vai trò */
      throw new HttpError(500, 'Không gắn được vai trò cho tài khoản.');
    }
    return { ok: true, email, role };
  },
  async setpw(b) {
    const email = clean(b.email).toLowerCase();
    checkPw(b.password);
    const u = await findUser(email);
    if (!u || !(await profileOf(u.id))) throw new HttpError(404, 'Không tìm thấy tài khoản này.');
    const r = await sbSecret('/auth/v1/admin/users/' + u.id, { method: 'PUT', body: { password: b.password } });
    if (!r.ok) throw new HttpError(500, 'Không đổi được mật khẩu.');
    return { ok: true };
  },
  async remove(b, me) {
    const email = clean(b.email).toLowerCase();
    if (email === me.email) throw new HttpError(400, 'Không thể thu hồi tài khoản của chính bạn.');
    const u = await findUser(email), p = u && await profileOf(u.id);
    if (!u || !p) throw new HttpError(404, 'Không tìm thấy tài khoản này.');
    if (p.role === 'tt') throw new HttpError(403, 'Không thu hồi tài khoản Trưởng Trung tâm tại đây.');
    /* xóa vai trò là chặn ngay mọi quyền đọc và ghi dữ liệu; khóa thêm tài khoản để không đăng nhập lại được */
    const d = await sbSecret('/rest/v1/profiles?user_id=eq.' + encodeURIComponent(u.id), { method: 'DELETE' });
    if (!d.ok) throw new HttpError(500, 'Không thu hồi được vai trò.');
    await sbSecret('/auth/v1/admin/users/' + u.id, { method: 'PUT', body: { ban_duration: '876000h' } });
    return { ok: true };
  }
};

async function handler(req, res) {
  const send = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); };
  try {
    if (!process.env.SUPABASE_SECRET_KEY) throw new HttpError(500, 'Máy chủ chưa được cấu hình khóa secret (SUPABASE_SECRET_KEY).');
    if (req.method !== 'POST') throw new HttpError(405, 'Phương thức không hợp lệ.');
    let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
    if (!b || typeof b !== 'object') throw new HttpError(400, 'Yêu cầu không hợp lệ.');
    const me = await caller(req);
    const f = actions[b.action];
    if (!f) throw new HttpError(400, 'Thao tác không hợp lệ.');
    send(200, await f(b, me));
  } catch (e) {
    if (e instanceof HttpError) return send(e.code, { error: e.message });
    send(500, { error: 'Lỗi máy chủ.' });
  }
}
module.exports = handler;
module.exports.default = handler;
