/* Máy chủ Supabase giả lập đầy đủ hơn cho kiểm thử: Auth (đăng nhập, quản trị), PostgREST (bộ lọc, upsert), RLS theo policies-v3.
   Dùng chung một trạng thái cho: (1) trình duyệt qua page.route, (2) các hàm api/*.js qua HTTP thật trên máy này. */
const http = require('http');
const SBURL = 'https://bqvwibipmzyrkrwlfoqf.supabase.co';
const SECRET = 'sb_secret_EMU_KEY';
const jnorm = v => Array.isArray(v) ? v.map(jnorm) : (v && typeof v === 'object') ? Object.keys(v).sort((a, b) => a.length - b.length || (a < b ? -1 : 1)).reduce((o, k) => (o[k] = jnorm(v[k]), o), {}) : v;

function makeEmu() {
  const S = { objs: new Map(), signs: new Map(), users: new Map(), tokens: {}, profiles: [], recs: new Map(), mon: new Map(), clock: 0, log: [], n: 0, noPhoneCol: false, rejectDomain: '', failProfile: false };
  const now = () => new Date(Date.UTC(2026, 10, 9, 0, 0, 0) + (++S.clock) * 1000).toISOString().replace('Z', '000+00:00');
  S.addUser = (email, pw, prof) => {
    const u = { id: '00000000-0000-4000-8000-' + String(++S.n).padStart(12, '0'), email: email.toLowerCase(), pw, banned: false, confirmed: true };
    S.users.set(u.id, u);
    if (prof) S.profiles.push(Object.assign({ user_id: u.id, staff_id: null, full_name: '', phone: null }, prof));
    return u;
  };
  const byEmail = e => [...S.users.values()].find(u => u.email === String(e).toLowerCase());
  const profOf = uid => S.profiles.find(p => p.user_id === uid);
  const tab = n => n === 'records' ? S.recs : n === 'money_records' ? S.mon : null;

  /* ---- bộ lọc PostgREST ---- */
  const splitTop = (s, sep) => { const out = []; let cur = '', q = false, d = 0; for (let i = 0; i < s.length; i++) { const c = s[i]; if (c === '\\' && q) { cur += s[++i]; continue; } if (c === '"') { q = !q; continue; } if (!q && c === '(') d++; if (!q && c === ')') d--; if (!q && d === 0 && c === sep) { out.push(cur); cur = ''; continue; } cur += c; } out.push(cur); return out; };
  const likeRe = (p, ci) => new RegExp('^' + p.replace(/[.+^${}()|[\]\\?]/g, '\\$&').replace(/\*|%/g, '.*').replace(/_/g, '.') + '$', ci ? 'i' : '');
  const colVal = (row, col) => { if (col.startsWith('data->>')) { const v = (row.data || {})[col.slice(7)]; return v == null ? null : String(v); } return row[col] == null ? null : String(row[col]); };
  function cond(row, col, op, val) {
    const v = colVal(row, col);
    if (op === 'eq') return v === val;
    if (op === 'neq') return v !== val;
    if (op === 'gt') return v != null && v > val;
    if (op === 'in') { const m = /^\((.*)\)$/s.exec(val); const xs = m ? splitTop(m[1], ',') : []; return v != null && xs.includes(v); }
    if (op === 'like') return v != null && likeRe(val, false).test(v);
    if (op === 'ilike') return v != null && likeRe(val, true).test(v);
    if (op === 'is') return val === 'null' ? v === null : false;
    throw new Error('Toán tử chưa hỗ trợ: ' + op);
  }
  function parseCond(c) { const m = /^(.+?)\.(eq|neq|gt|in|like|ilike|is)\.(.*)$/s.exec(c); if (!m) throw new Error('Điều kiện lạ: ' + c); return [m[1], m[2], m[3]]; }
  function matches(row, params) {
    for (const [k, v] of params) {
      if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(k)) continue;
      if (k === 'or') { const inner = /^\((.*)\)$/s.exec(v)[1]; if (!splitTop(inner, ',').some(c => { const [a, b, d] = parseCond(c); return cond(row, a, b, d); })) return false; continue; }
      const m = /^(eq|neq|gt|in|like|ilike|is)\.(.*)$/s.exec(v); if (!m) throw new Error('Bộ lọc lạ: ' + k + '=' + v);
      if (!cond(row, k, m[1], m[2])) return false;
    }
    return true;
  }
  function project(row, sel) {
    if (!sel) return row;
    const o = {};
    for (const t of splitTop(sel, ',')) {
      const m = /^(?:([A-Za-z_]+):)?(.+)$/.exec(t.trim()), alias = m[1], col = m[2];
      if (col.startsWith('data->>')) o[alias || col.slice(7)] = colVal(row, col);
      else { if (!(col in row) && (col === 'phone') && S.noPhoneCol) throw Object.assign(new Error('column'), { pg: '42703' }); o[alias || col] = row[col]; }
    }
    return o;
  }

  /* ---- quyền (policies-v3) ---- */
  function actor(h) {
    const key = h['apikey'], auth = (h['authorization'] || '').replace(/^Bearer\s+/i, '');
    if (key === SECRET && !auth) return { svc: true };
    const uid = S.tokens[auth]; if (!uid) return null;
    const u = S.users.get(uid); if (!u || u.banned) return null;
    const p = profOf(uid);
    return { uid, u, role: p ? p.role : null, sid: p ? p.staff_id : null };
  }
  const canRead = (a, t, r) => { if (a.svc) return true; if (!a.role) return false; if (t === 'records') { if (['tt', 'vp', 'ql'].includes(a.role)) return true; if (a.role !== 'gv') return false; return r.collection !== 'vio' || (!!r.data && r.data.st === a.sid && r.data.s === 'duyet'); }   /* gv: vi phạm nội quy chỉ phần ĐÃ DUYỆT của chính mình */
    if (['tt', 'vp'].includes(a.role)) return true; if (a.role === 'gv') return r.collection === 'cfgm' || (r.collection === 'pay' && r.id === a.sid) || (r.collection === 'bon' && r.id.split('|')[0] === a.sid) || (r.collection === 'vam' && r.id.split('|')[0] === a.sid); return false; };
  /* vio: tt mọi thao tác; ql chỉ bản ghi chờ duyệt và không về chính mình (private.vio_ok) */
  const vioOk = (a, c, d) => c !== 'vio' || a.role === 'tt' || (a.role === 'ql' && !!d && d.s === 'cho' && (d.st || '') !== (a.sid || ''));
  const canWrite = (a, t, c, d) => { if (a.svc) return true; if (!a.role) return false; if (t === 'records' && (c === 'ref' || c === 'tri')) return ['tt', 'ql'].includes(a.role);
    if (t === 'records' && c === 'vio') return ['tt', 'ql'].includes(a.role) && vioOk(a, c, d);
    if (t === 'records' && c === 'ts') return ['tt', 'vp', 'ql'].includes(a.role);   /* chấm công: giáo viên không tự chấm */   /* tài liệu tham khảo, góc tri ân: chỉ tt, ql */
    if (t === 'records' && c === 'pul') return false;   /* chỉ khóa secret (máy chủ) ghi bản ghi mở khóa */
    if (t === 'records') return a.role === 'gv' ? !['staff', 'cfg', 'hol'].includes(c) : ['tt', 'vp', 'ql'].includes(a.role); return ['tt', 'vp'].includes(a.role); };

  /* ---- Supabase Storage (bucket riêng tư gb-media, theo supabase/migrations/20261109150000_media_bucket.sql) ---- */
  const MED_CT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/csv', 'text/plain', 'text/markdown'];
  S.mediaMax = 500 * 1024 * 1024;   /* khớp file_size_limit của bucket gb-media (migration 20261110120000) */
  function storage(method, path, params, h, buf) {
    const ok = (status, body, extra) => Object.assign({ status, body }, extra || {});
    S.log.push(method + ' ' + path);
    const m = /^\/storage\/v1\/object\/(sign\/)?gb-media(?:\/(.*))?$/.exec(path);
    if (!m) return ok(404, { message: 'Bucket not found' });
    const isSign = !!m[1], obj = m[2] ? decodeURIComponent(m[2]) : '';
    /* tải về bằng đường xem tạm: kiểm tra mã trong địa chỉ, không cần đăng nhập */
    if (isSign && method === 'GET') {
      const t = S.signs.get(params.get('token') || '');
      if (!t || t.exp < Date.now() || t.path !== obj) return ok(400, { statusCode: '400', error: 'InvalidJWT', message: 'invalid or expired token' });
      const o = S.objs.get(obj); if (!o) return ok(404, { message: 'Object not found' });
      return ok(200, null, { buf: o.buf, ct: o.ct });
    }
    const a = actor(h);
    if (!a) return ok(401, { statusCode: '401', error: 'Unauthorized', message: 'Invalid JWT' });
    const staff = a.svc || ['tt', 'vp', 'ql', 'gv'].includes(a.role);
    if (isSign && method === 'POST' && !obj) {   /* ký nhiều đường dẫn cùng lúc */
      if (!staff) return ok(400, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' });
      let b = null; try { b = JSON.parse(buf ? buf.toString() : 'null'); } catch (e) { }
      if (!b || !Array.isArray(b.paths)) return ok(400, { message: 'paths required' });
      S.signCount = (S.signCount || 0) + 1;
      const ttl = Math.max(1, +b.expiresIn || 60) * 1000;
      return ok(200, b.paths.map(p => {
        if (!S.objs.has(p)) return { error: 'Either the object does not exist or you do not have access to it', path: p, signedURL: null };
        const tok = 'sg' + (++S.n) + Math.random().toString(36).slice(2, 8); S.signs.set(tok, { path: p, exp: Date.now() + (S.signTtl || ttl) });
        return { error: null, path: p, signedURL: '/object/sign/gb-media/' + p + '?token=' + tok };
      }));
    }
    if (!isSign && method === 'POST' && obj) {   /* tải lên */
      const ct = String(h['content-type'] || '').split(';')[0].trim();
      const pre = (/^([mrt])\/[A-Za-z0-9_.\-]{1,80}$/.exec(obj) || [])[1];
      if (!staff || !pre || (pre !== 'm' && !a.svc && !['tt', 'ql'].includes(a.role))) return ok(400, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' });
      if (!MED_CT.includes(ct)) return ok(415, { statusCode: '415', error: 'invalid_mime_type', message: 'mime type ' + ct + ' is not supported' });
      if ((buf ? buf.length : 0) > S.mediaMax) return ok(413, { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' });
      if (S.objs.has(obj)) return ok(400, { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' });
      if (S.failUpload) return ok(500, { message: 'boom' });
      S.objs.set(obj, { buf: buf || Buffer.alloc(0), ct, owner: a.svc ? 'svc' : a.uid });
      return ok(200, { Key: 'gb-media/' + obj, Id: 'o' + S.objs.size });
    }
    if (!isSign && method === 'DELETE' && obj) {
      const o = S.objs.get(obj);
      const can = o && (a.svc || (/^[rt]\//.test(obj) ? ['tt', 'ql'].includes(a.role) : (['tt', 'vp', 'ql'].includes(a.role) || (a.role === 'gv' && o.owner === a.uid))));
      if (!can) return ok(404, { statusCode: '404', error: 'not_found', message: 'Object not found' });   /* như Supabase thật: tệp ẩn do RLS cũng báo không thấy */
      S.objs.delete(obj); return ok(200, { message: 'Successfully deleted' });
    }
    return ok(405, {});
  }

  /* ---- lõi xử lý một yêu cầu ---- */
  function core(method, path, params, h, bodyText, bodyBuf) {
    if (path.startsWith('/storage/v1/')) return storage(method, path, params, h, bodyBuf !== undefined ? bodyBuf : (bodyText ? Buffer.from(bodyText) : null));
    const ok = (status, body) => ({ status, body });
    S.log.push(method + ' ' + path + (params.toString() ? '?' + params.toString().slice(0, 120) : ''));
    let b = null; try { b = bodyText ? JSON.parse(bodyText) : null; } catch (e) { b = null; }
    const a = actor(h);
    /* Auth */
    if (path === '/auth/v1/token') {
      const gt = params.get('grant_type');
      if (gt === 'password') {
        const u = byEmail(b && b.email || '');
        if (!u || u.pw !== b.password) return ok(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
        if (u.banned) return ok(400, { error: 'user_banned', error_description: 'User is banned' });
        if (!u.confirmed) return ok(400, { error: 'invalid_grant', error_description: 'Email not confirmed' });
        const tok = 't' + Math.random().toString(36).slice(2); S.tokens[tok] = u.id;
        return ok(200, { access_token: tok, refresh_token: 'r' + tok, expires_in: 3600, user: { id: u.id, email: u.email } });
      }
      if (gt === 'refresh_token') {
        const uid = S.tokens[String(b.refresh_token || '').slice(1)]; if (!uid) return ok(400, { error: 'invalid_grant' });
        const u = S.users.get(uid), tok = 't' + Math.random().toString(36).slice(2); S.tokens[tok] = uid;
        return ok(200, { access_token: tok, refresh_token: 'r' + tok, expires_in: 3600, user: { id: u.id, email: u.email } });
      }
    }
    if (path === '/auth/v1/logout') return ok(204, null);
    if (path === '/auth/v1/user') {
      if (!a || a.svc) return ok(401, { msg: 'invalid jwt' });
      if (method === 'GET') return ok(200, { id: a.u.id, email: a.u.email });
      if (method === 'PUT') { if (b.password && b.password === a.u.pw) return ok(422, { msg: 'New password should be different from the old password.' }); if (b.password) a.u.pw = b.password; return ok(200, { id: a.u.id }); }
    }
    if (path.startsWith('/auth/v1/admin/')) {
      if (!a || !a.svc) return ok(401, { msg: 'not admin' });
      if (path === '/auth/v1/admin/users' && method === 'GET') { const pg = +params.get('page') || 1, per = +params.get('per_page') || 50; return ok(200, { users: [...S.users.values()].slice((pg - 1) * per, pg * per).map(u => ({ id: u.id, email: u.email })) }); }
      if (path === '/auth/v1/admin/users' && method === 'POST') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email || '')) return ok(422, { msg: 'Unable to validate email address: invalid format' });
        if (S.rejectDomain && b.email.endsWith('@' + S.rejectDomain)) return ok(422, { msg: 'Unable to validate email address: domain has no MX record' });
        if (byEmail(b.email)) return ok(422, { msg: 'A user with this email address has already been registered', error_code: 'email_exists' });
        const u = S.addUser(b.email, b.password); u.confirmed = !!b.email_confirm; return ok(200, { id: u.id, email: u.email });
      }
      const m = /^\/auth\/v1\/admin\/users\/(.+)$/.exec(path); const u = m && S.users.get(m[1]);
      if (m && !u) return ok(404, { msg: 'User not found' });
      if (m && method === 'GET') return ok(200, { id: u.id, email: u.email });
      if (m && method === 'PUT') { if (b.password) u.pw = b.password; if (b.ban_duration) u.banned = b.ban_duration !== 'none'; if (b.email_confirm) u.confirmed = true; return ok(200, { id: u.id }); }
      if (m && method === 'DELETE') { S.users.delete(u.id); S.profiles = S.profiles.filter(p => p.user_id !== u.id); return ok(200, {}); }
    }
    /* PostgREST */
    const tn = path.replace('/rest/v1/', '');
    if (!path.startsWith('/rest/v1/')) return ok(404, {});
    if (!a) return ok(401, { message: 'JWT expired', code: 'PGRST301' });
    try {
      if (tn === 'profiles') {
        const sel = params.get('select');
        if (S.noPhoneCol && ((sel && /phone/.test(sel)) || params.get('phone'))) return ok(400, { code: '42703', message: 'column profiles.phone does not exist' });
        if (method === 'GET') {
          let rows = S.profiles.filter(p => matches(p, params) && (a.svc || p.user_id === a.uid || a.role === 'tt'));
          return ok(200, rows.map(r => project(r, sel)));
        }
        if (!a.svc && a.role !== 'tt') return ok(403, { code: '42501', message: 'new row violates row-level security policy for table "profiles"' });
        if (method === 'POST') {
          if (S.failProfile) return ok(500, { message: 'boom' });
          if (S.noPhoneCol && 'phone' in b) return ok(400, { code: 'PGRST204', message: "Could not find the 'phone' column of 'profiles' in the schema cache" });
          if (S.profiles.some(p => p.user_id === b.user_id)) return ok(409, { code: '23505', message: 'duplicate key value violates unique constraint "profiles_pkey"' });
          if (b.phone && S.profiles.some(p => p.phone === b.phone)) return ok(409, { code: '23505', message: 'duplicate key value violates unique constraint "profiles_phone_uniq"' });
          S.profiles.push(Object.assign({ staff_id: null, full_name: '', phone: null }, b)); return ok(201, null);
        }
        if (method === 'DELETE') { S.profiles = S.profiles.filter(p => !matches(p, params)); return ok(204, null); }
      }
      const T = tab(tn); if (!T) return ok(404, { message: 'no table' });
      if (method === 'GET') {
        let rows = [...T.values()].filter(r => canRead(a, tn, r) && matches(r, params));
        const ord = params.get('order') || '';
        if (ord === 'updated_at') rows.sort((x, y) => x.updated_at < y.updated_at ? -1 : 1); else rows.sort((x, y) => x.collection === y.collection ? (x.id < y.id ? -1 : 1) : (x.collection < y.collection ? -1 : 1));
        const off = +(params.get('offset') || 0), lim = Math.min(1000, +(params.get('limit') || 1000));
        return ok(200, rows.slice(off, off + lim).map(r => project(r, params.get('select') || 'collection,id,data,updated_at')));
      }
      if (method === 'POST') {
        const arr = Array.isArray(b) ? b : [b];
        if (!arr.every(r => { const old = T.get(r.collection + '|' + r.id); return canWrite(a, tn, r.collection, jnorm(r.data)) && (!old || canWrite(a, tn, r.collection, old.data)); })) return ok(403, { code: '42501', message: 'new row violates row-level security policy for table "' + tn + '"' });
        arr.forEach(r => { T.set(r.collection + '|' + r.id, { collection: r.collection, id: r.id, data: jnorm(r.data), updated_at: now() }); });
        S.log.push('  rows=' + arr.length); return ok(201, null);
      }
      if (method === 'DELETE') {
        const rows = [...T.values()].filter(r => matches(r, params) && canWrite(a, tn, r.collection, r.data));
        rows.forEach(r => T.delete(r.collection + '|' + r.id)); return ok(204, null);
      }
    } catch (e) { if (e.pg) return ok(400, { code: e.pg, message: 'column does not exist' }); return ok(500, { message: String(e.message) }); }
    return ok(405, {});
  }

  /* trình duyệt */
  S.attach = async page => page.route(SBURL + '/**', async route => {
    const req = route.request(), url = new URL(req.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const st = url.pathname.startsWith('/storage/v1/');
    const r = core(req.method(), url.pathname, url.searchParams, req.headers(), st ? null : req.postData(), st ? req.postDataBuffer() : undefined);
    if (r.buf) return route.fulfill({ status: r.status, contentType: r.ct || 'application/octet-stream', headers: cors, body: r.buf });
    route.fulfill({ status: r.status, contentType: 'application/json', headers: cors, body: r.body == null || r.status === 204 ? '' : JSON.stringify(r.body) });
  });
  /* HTTP thật cho các hàm api/*.js */
  S.listen = () => new Promise(res => {
    const srv = http.createServer((req, rs) => { let body = ''; req.on('data', c => body += c); req.on('end', () => { const u = new URL(req.url, 'http://x'); const r = core(req.method, u.pathname, u.searchParams, req.headers, body); if (r.buf) { rs.writeHead(r.status, { 'content-type': r.ct || 'application/octet-stream', 'access-control-allow-origin': '*' }); rs.end(r.buf); return; }   /* Supabase Storage trả CORS * cho đường xem tạm; trình duyệt cần để fetch PDF */ rs.writeHead(r.status, { 'content-type': 'application/json' }); rs.end(r.body == null || r.status === 204 ? '' : JSON.stringify(r.body)); }); });
    srv.listen(0, () => { S.srv = srv; S.url = 'http://127.0.0.1:' + srv.address().port; process.env.SUPABASE_URL = S.url; process.env.SUPABASE_SECRET_KEY = SECRET; res(S); });
  });
  /* chuyển /api/* của trình duyệt sang các hàm xử lý thật */
  S.attachApi = async (page, base) => {
    const H = { accounts: require('../api/accounts.js'), login: require('../api/login.js'), parent: require('../api/parent.js'), plock: require('../api/plock.js') };
    await page.route(base + '/api/*', async route => {
      const req = route.request(), name = new URL(req.url()).pathname.replace('/api/', '');
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      if (!H[name]) return route.fulfill({ status: 404, headers: cors, body: '' });
      const out = { code: 200, body: '' };
      const rs = { statusCode: 200, setHeader() { }, end(b) { out.body = b; } };
      await H[name]({ method: req.method(), headers: req.headers(), body: req.postData() }, rs);
      S.apiLog = S.apiLog || []; S.apiLog.push(name + ' ' + rs.statusCode);
      route.fulfill({ status: rs.statusCode, contentType: 'application/json', headers: cors, body: out.body });
    });
  };
  S.close = () => S.srv && S.srv.close();
  S.core = core;
  return S;
}
module.exports = { makeEmu, SBURL, SECRET };
