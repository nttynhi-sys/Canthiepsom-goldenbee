/* Phần dùng chung của các hàm máy chủ (Vercel không coi tệp bắt đầu bằng dấu gạch dưới là một điểm truy cập).
   Khóa secret của Supabase CHỈ nằm ở máy chủ, không bao giờ gửi về trình duyệt. */
const SB_URL = (process.env.SUPABASE_URL || 'https://bqvwibipmzyrkrwlfoqf.supabase.co').replace(/\/$/, '');
const PUB_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_SHk0kLdrNieeOY9Ilfw27g_vHe7Jd8A';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const clean = s => String(s == null ? '' : s).trim();

/* Đọc cấu hình lúc gọi (không lúc nạp tệp) để thử nghiệm đổi được biến môi trường */
const sbUrl = () => (process.env.SUPABASE_URL || SB_URL).replace(/\/$/, '');
function secretHeaders(extra) {
  const k = process.env.SUPABASE_SECRET_KEY || '';
  const h = Object.assign({ apikey: k, 'Content-Type': 'application/json' }, extra || {});
  if (k.startsWith('eyJ')) h.Authorization = 'Bearer ' + k;   /* khóa service_role dạng JWT cũ */
  return h;
}
async function sbSecret(path, opt) {
  opt = opt || {};
  const r = await fetch(sbUrl() + path, { method: opt.method || 'GET', headers: secretHeaders(opt.headers), body: opt.body === undefined ? undefined : JSON.stringify(opt.body) });
  let j = null; const t = await r.text(); try { j = t ? JSON.parse(t) : null; } catch (e) { j = { message: t }; }
  return { ok: r.ok, status: r.status, json: j };
}
const needKey = () => { if (!process.env.SUPABASE_SECRET_KEY) throw new HttpError(500, 'Máy chủ chưa được cấu hình khóa secret (SUPABASE_SECRET_KEY).'); };

/* Người gọi: kiểm tra mã đăng nhập với Supabase rồi đọc vai trò thật trong bảng profiles */
async function whoami(req) {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers['authorization'] || req.headers['Authorization'] || '');
  if (!m) throw new HttpError(401, 'Chưa đăng nhập.');
  const r = await fetch(sbUrl() + '/auth/v1/user', { headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY || PUB_KEY, Authorization: 'Bearer ' + m[1] } });
  if (!r.ok) throw new HttpError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  const u = await r.json();
  const p = await sbSecret('/rest/v1/profiles?select=role,staff_id,full_name&user_id=eq.' + encodeURIComponent(u.id));
  if (!p.ok) throw new HttpError(500, 'Không đọc được vai trò người dùng.');
  const pr = p.json && p.json[0];
  if (!pr) throw new HttpError(403, 'Tài khoản chưa được cấp vai trò.');
  return { id: u.id, email: clean(u.email).toLowerCase(), role: pr.role, staff_id: pr.staff_id || '', full_name: pr.full_name || '' };
}

/* ---- Số điện thoại: chuẩn hóa về dạng quốc tế không có dấu cộng (vd 84901234567). Rỗng nếu không hợp lệ. ---- */
function telNorm(s) {
  let t = clean(s); if (!t) return '';
  const plus = t[0] === '+'; t = t.replace(/\D/g, ''); if (!t) return '';
  if (t.startsWith('00')) { t = t.slice(2); return t.length >= 8 && t.length <= 15 ? t : ''; }
  if (plus) return t.length >= 8 && t.length <= 15 ? t : '';
  if (t[0] === '0') t = '84' + t.slice(1);
  else if (!(t.startsWith('84') && t.length >= 11) && t.length === 9) t = '84' + t;
  return /^84\d{9,10}$/.test(t) ? t : '';
}
/* Tài khoản chỉ có số điện thoại cần một địa chỉ email "nội bộ" để Supabase nhận. Mặc định dùng tên miền dành riêng example.com,
   không nhận được thư thật. Có thể đổi bằng biến môi trường PHONE_ALIAS_DOMAIN. */
const aliasDomain = () => clean(process.env.PHONE_ALIAS_DOMAIN) || 'example.com';
const aliasEmail = tel => 'sdt' + tel + '@' + aliasDomain();

/* ---- Khóa phụ huynh: email của phụ huynh (nếu có), nếu không thì số điện thoại. Phải khớp với pkeyOf trong ứng dụng. ---- */
const pkeyOf = k => { const e = clean(k && k.pe).toLowerCase(); if (e && e.includes('@')) return e; const t = telNorm(k && k.pp); return t ? 'tel:' + t : ''; };

/* Đọc hết một truy vấn PostgREST theo từng trang 1000 dòng (Supabase giới hạn 1000 dòng mỗi lần). Truy vấn cần có order ổn định. */
async function pageAll(path) {
  const out = [];
  for (let off = 0; off < 50000; off += 1000) {
    const r = await sbSecret(path + (path.includes('?') ? '&' : '?') + 'limit=1000&offset=' + off);
    if (!r.ok) return { ok: false, status: r.status, json: r.json };
    const a = r.json || []; out.push(...a);
    if (a.length < 1000) break;
  }
  return { ok: true, status: 200, json: out };
}

/* Danh sách người dùng Supabase Auth (quản trị) */
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

/* Gói xử lý chung: bắt lỗi, trả JSON, không lưu bộ nhớ đệm */
function wrap(fn, methods) {
  const handler = async function (req, res) {
    const send = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); };
    try {
      needKey();
      if (req.method !== (methods || 'POST')) throw new HttpError(405, 'Phương thức không hợp lệ.');
      let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
      if (!b || typeof b !== 'object') throw new HttpError(400, 'Yêu cầu không hợp lệ.');
      send(200, await fn(b, req));
    } catch (e) {
      if (e instanceof HttpError) return send(e.code, { error: e.message });
      send(500, { error: 'Lỗi máy chủ.' });
    }
  };
  handler.default = handler;
  return handler;
}

module.exports = { pageAll, SB_URL, PUB_KEY, EMAIL, HttpError, clean, sbUrl, sbSecret, needKey, whoami, telNorm, aliasDomain, aliasEmail, pkeyOf, allUsers, findUser, profileOf, checkPw, wrap };
