/* Cổng dữ liệu cho phụ huynh. Phụ huynh KHÔNG đọc hay ghi trực tiếp bảng dữ liệu: mọi thứ đi qua hàm này.
   Hàm xác nhận phụ huynh là ai, chỉ trả về dữ liệu của các bé gắn với tài khoản đó, và chỉ cho ghi vài loại dữ liệu hẹp
   (yêu cầu học bù, lịch học bù của chính bé, đánh dấu đã đọc thông báo). Dùng khóa secret ở máy chủ. */
const L = require('./_lib');
const { HttpError, clean, sbSecret, pkeyOf } = L;
const U = encodeURIComponent;

const SAFE_ID = /^[A-Za-z0-9_.\-]{1,64}$/;
const q = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const inList = a => U('in.(' + a.map(q).join(',') + ')');
const orList = (ids, f) => 'or=' + U('(' + ids.map(f).join(',') + ')');

async function parentOf(req) {
  const me = await L.whoami(req);
  if (me.role !== 'ph' || !me.staff_id.startsWith('ph|')) throw new HttpError(403, 'Chỉ tài khoản phụ huynh dùng được cổng này.');
  return { uid: me.id, pid: me.staff_id, key: me.staff_id.slice(3), name: me.full_name };
}

async function fetchRows(table, qs) {
  const out = [];
  for (let off = 0; off < 20000; off += 1000) {
    const r = await sbSecret('/rest/v1/' + table + '?select=collection,id,data,updated_at&order=collection,id&limit=1000&offset=' + off + '&' + qs);
    if (!r.ok) throw new HttpError(500, 'Không đọc được dữ liệu.');
    const a = r.json || []; out.push(...a);
    if (a.length < 1000) break;
  }
  return out;
}

/* Các bé gắn với tài khoản: so khớp theo email hoặc số điện thoại phụ huynh ghi trong hồ sơ trẻ */
async function myKids(key) {
  const filt = key.includes('@') ? '&data->>pe=ilike.' + U(key) : '';
  const r = await L.pageAll('/rest/v1/records?select=id,pe:data->>pe,pp:data->>pp,gr:data->>gr&collection=eq.kids&order=id' + filt);
  if (!r.ok) throw new HttpError(500, 'Không đọc được hồ sơ trẻ.');
  const ks = (r.json || []).filter(k => pkeyOf(k) === key && SAFE_ID.test(String(k.id)));
  return { ids: ks.map(k => k.id).sort(), groups: [...new Set(ks.map(k => k.gr).filter(Boolean))] };
}

/* Nhân viên chỉ lộ tên, chức vụ, vai trò (không email, điện thoại, lương) */
const safeStaff = d => ({ id: d.id, n: d.n, role: d.role, pos: d.pos || '', st: d.st, em: '', ph: '', sd: '', sup: '' });

async function snapshot(me, since, known) {
  const k = await myKids(me.key);
  if (known !== undefined && String(known) !== k.ids.join(',')) return { reload: true };
  const ids = k.ids, sf = since ? '&updated_at=gt.' + U(since.records || '1970-01-01T00:00:00Z') : '', sm = since ? '&updated_at=gt.' + U(since.money || '1970-01-01T00:00:00Z') : '';
  const job = [
    ['records', 'collection=in.(cfg,groups,menu,tpl,cg,tkb)' + sf],
    ['records', 'collection=eq.staff' + sf],
    ['records', 'collection=eq.nt&data->>aud=eq.ph' + sf],
    ['records', 'collection=eq.rd&id=like.' + U('*|' + me.pid) + sf]
  ];
  if (ids.length) {
    job.push(['records', 'collection=eq.kids&id=' + inList(ids) + sf]);
    ['plans:k', 'sess:k', 'mk:hs', 'lich:hs'].forEach(s => { const [c, f] = s.split(':'); job.push(['records', 'collection=eq.' + c + '&data->>' + f + '=' + inList(ids) + sf]); });
    job.push(['records', 'collection=eq.rp&data->>hs=' + inList(ids) + '&data->>s=eq.gui' + sf]);
    job.push(['records', 'collection=eq.att&' + orList(ids, i => 'id.like.*|' + i) + sf]);
    job.push(['money', 'collection=eq.set&' + orList(ids, i => 'id.like.' + i + '|*') + sm]);
    job.push(['money', 'collection=eq.lg&data->>hs=' + inList(ids) + sm]);
  }
  job.push(['money', 'collection=eq.cfgm' + sm]);
  const res = await Promise.all(job.map(j => fetchRows(j[0] === 'money' ? 'money_records' : 'records', j[1])));
  const records = [], money = [];
  res.forEach((rows, i) => {
    const t = job[i][0];
    rows.forEach(r => {
      const c = r.collection;
      if (t === 'money') { money.push(r); return; }
      if (c === 'staff') { records.push({ collection: c, id: r.id, data: safeStaff(r.data || {}), updated_at: r.updated_at }); return; }
      if (c === 'nt') { const n = r.data || {}; if (!(n.tg === 'all' || ids.includes(n.tg) || k.groups.includes(n.tg))) return; }
      if (c === 'att' && !ids.includes(String(r.id).split('|')[2])) return;
      if (c === 'rd' && !String(r.id).endsWith('|' + me.pid)) return;
      records.push(r);
    });
  });
  return { records, money, kids: ids };
}

/* ---- ghi: chỉ vài loại dữ liệu, chỉ của bé thuộc tài khoản ---- */
const dowOf = d => { const x = new Date(d + 'T00:00:00Z'); return x.getUTCDay(); };
async function existing(coll, ids) {
  if (!ids.length) return new Map();
  const rows = await fetchRows('records', 'collection=eq.' + coll + '&id=' + inList(ids));
  return new Map(rows.map(r => [r.id, r.data || {}]));
}
async function lichConflict(x) {
  const w = dowOf(x.date);
  const gs = await fetchRows('records', 'collection=eq.groups');
  if (w >= 1 && w <= 5 && gs.some(g => g.data && (g.data.gv === x.gv || g.data.tg === x.gv))) return 'Giáo viên đang phụ trách lớp bán trú vào ngày này';
  const ls = await fetchRows('records', 'collection=eq.lich&data->>slot=eq.' + U(x.slot) + '&' + orList([1], () => 'data->>date.eq.' + x.date + ',data->>day.eq.' + w));
  const same = ls.map(r => r.data).filter(l => l.id !== x.id && ((l.type === 'bu' && l.date === x.date) || (l.type === '11' && +l.day === w)));
  if (same.some(l => l.gv === x.gv)) return 'Giáo viên đã có buổi khác ở khung giờ này';
  if (same.some(l => l.hs === x.hs)) return 'Trẻ đã có buổi khác ở khung giờ này';
  if (x.room && same.some(l => l.room === x.room)) return 'Phòng đã được dùng ở khung giờ này';
  return '';
}

async function put(me, b) {
  const rows = Array.isArray(b.rows) ? b.rows : [], dels = Array.isArray(b.dels) ? b.dels : [];
  if (rows.length > 400 || dels.length > 400) throw new HttpError(400, 'Quá nhiều dòng trong một lần lưu.');
  const { ids } = await myKids(me.key);
  const deny = m => new HttpError(403, m || 'Không có quyền lưu dữ liệu này.');
  const isMine = d => d && typeof d.hs === 'string' && ids.includes(d.hs);
  const wantIds = c => [...rows.filter(r => r && r.collection === c).map(r => String(r.id)), ...dels.filter(r => r && r.collection === c).map(r => String(r.id))];
  const old = { mk: await existing('mk', wantIds('mk').filter(i => SAFE_ID.test(i))), lich: await existing('lich', wantIds('lich').filter(i => SAFE_ID.test(i))) };
  const ok = [];
  for (const r of rows) {
    if (!r || typeof r.collection !== 'string' || typeof r.id !== 'string' || !r.id || r.id.length > 200) throw deny();
    const c = r.collection, d = r.data;
    if (JSON.stringify(d === undefined ? null : d).length > 20000) throw deny('Dữ liệu quá lớn.');
    if (c === 'mk') {
      if (!SAFE_ID.test(r.id) || !isMine(d) || (old.mk.has(r.id) && !isMine(old.mk.get(r.id)))) throw deny();
    } else if (c === 'lich') {
      if (!SAFE_ID.test(r.id) || !isMine(d) || d.type !== 'bu' || typeof d.date !== 'string' || typeof d.slot !== 'string') throw deny();
      const o = old.lich.get(r.id);
      if (o && (!isMine(o) || o.type !== 'bu')) throw deny();
      if (!o || o.date !== d.date || o.slot !== d.slot || o.gv !== d.gv || o.room !== d.room) {
        const m = await lichConflict(Object.assign({}, d, { id: r.id }));
        if (m) throw deny('Giờ này không còn trống: ' + m);
      }
    } else if (c === 'rd') {
      if (!r.id.endsWith('|' + me.pid) || !(typeof d === 'boolean' || typeof d === 'number' || (typeof d === 'string' && d.length <= 40))) throw deny();
    } else throw deny();
    ok.push({ collection: c, id: r.id, data: d });
  }
  const gone = [];
  for (const r of dels) {
    if (!r || r.collection !== 'lich' || typeof r.id !== 'string' || !SAFE_ID.test(r.id)) throw deny();
    const o = old.lich.get(r.id);
    if (o && (!isMine(o) || o.type !== 'bu')) throw deny();
    if (o) gone.push(r.id);
  }
  if (ok.length) {
    const w = await sbSecret('/rest/v1/records?on_conflict=collection,id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: ok });
    if (!w.ok) throw new HttpError(500, 'Không lưu được dữ liệu.');
  }
  if (gone.length) {
    const d = await sbSecret('/rest/v1/records?collection=eq.lich&id=' + inList(gone), { method: 'DELETE' });
    if (!d.ok) throw new HttpError(500, 'Không xóa được dữ liệu.');
  }
  return { ok: true };
}

module.exports = L.wrap(async (b, req) => {
  const me = await parentOf(req);
  if (b.action === 'load') return snapshot(me);
  if (b.action === 'pull') return snapshot(me, b.since && typeof b.since === 'object' ? b.since : { records: '1970-01-01T00:00:00Z', money: '1970-01-01T00:00:00Z' }, Array.isArray(b.known) ? b.known.join(',') : '');
  if (b.action === 'put') return put(me, b);
  throw new HttpError(400, 'Thao tác không hợp lệ.');
});
