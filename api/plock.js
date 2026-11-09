/* Khóa cổng phụ huynh quá hạn học phí: nhân viên xem danh sách, mở khóa tạm hoặc khóa lại.
   Chỉ Trưởng Trung tâm (tt), Quản lý (ql) và Văn phòng (vp). Quản lý không nhận số tiền (dữ liệu tiền chỉ tt và vp thấy).
   Bản ghi mở khóa nằm ở bảng records, collection 'pul', id là khóa phụ huynh; RLS không cho trình duyệt ghi, chỉ hàm này (khóa secret) ghi. */
const L = require('./_lib');
const K = require('./_lock');
const { HttpError, clean, sbSecret } = L;
const U = encodeURIComponent;

const ROLES = ['tt', 'ql', 'vp'], MONEY = ['tt', 'vp'];
const MAX_DAYS = 93;   /* mở khóa tạm tối đa khoảng 3 tháng */

async function caller(req) {
  const me = await L.whoami(req);
  if (!ROLES.includes(me.role)) throw new HttpError(403, 'Chỉ Trưởng Trung tâm, Quản lý và Văn phòng được mở khóa cổng phụ huynh.');
  return me;
}
const view = (me, r) => { const o = Object.assign({}, r); if (!MONEY.includes(me.role)) delete o.amt; return o; };

module.exports = L.wrap(async (b, req) => {
  const me = await caller(req);
  if (b.action === 'list') {
    const x = await K.allLocks();
    return { today: x.today, due: x.due, rows: x.rows.map(r => view(me, r)) };
  }
  const key = clean(b.key);
  if (!key || key.length > 200) throw new HttpError(400, 'Thiếu phụ huynh cần thao tác.');
  if (!(await K.hasParent(key))) throw new HttpError(404, 'Không tìm thấy phụ huynh này.');
  if (b.action === 'unlock') {
    const today = K.vnToday();
    const until = clean(b.until) || K.nextTen(today);
    if (!K.DAY.test(until) || until < today || until > K.addDays(today, MAX_DAYS)) throw new HttpError(400, 'Ngày mở khóa phải từ hôm nay đến tối đa ' + MAX_DAYS + ' ngày tới.');
    const note = clean(b.note).slice(0, 200);
    const data = { k: key, until, by: me.full_name || me.email || me.id, role: me.role, at: today, note };
    const w = await sbSecret('/rest/v1/records?on_conflict=collection,id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: [{ collection: 'pul', id: key, data }] });
    if (!w.ok) throw new HttpError(500, 'Không lưu được việc mở khóa.');
    return { ok: true, until };
  }
  if (b.action === 'relock') {
    const d = await sbSecret('/rest/v1/records?collection=eq.pul&id=eq.' + U(key), { method: 'DELETE' });
    if (!d.ok) throw new HttpError(500, 'Không khóa lại được.');
    return { ok: true };
  }
  throw new HttpError(400, 'Thao tác không hợp lệ.');
});
