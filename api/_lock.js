/* Khóa cổng phụ huynh khi quá hạn học phí. Dùng chung cho parent.js (chặn phụ huynh) và plock.js (danh sách, mở khóa).
   Quy tắc: học phí tháng M trả trước, hạn đến hết ngày 10 của tháng M (giờ Việt Nam).
   - Từ ngày 11 của tháng M: học phí các tháng đến M phải đã đóng đủ.
   - Từ ngày 1 đến ngày 10 của tháng M: chỉ cần đóng đủ các tháng đến M-1.
   Khoản đã thu, giảm giá, hoàn phí và nhận chuyển phí được trừ lần lượt vào tháng cũ nhất (FIFO), gộp mọi bé của cùng phụ huynh.
   Khóa tự gỡ khi nhân viên ghi nhận thu đủ. Nhân viên có thể mở khóa tạm đến một ngày (bản ghi `pul` trong bảng records,
   chỉ máy chủ ghi, xem supabase/migrations). Tệp bắt đầu bằng dấu gạch dưới nên Vercel không coi là điểm truy cập. */
const L = require('./_lib');

const LGS = { hp: 1, cfo: 1, thu: -1, gg: -1, hoan: -1, cfi: -1 };   /* khớp LGK trong ứng dụng */
const MIN_DEBT = 1000;                                                /* dưới 1.000 ₫ coi như đã đủ (làm tròn) */
const DAY = /^\d{4}-\d{2}-\d{2}$/, MON = /^\d{4}-\d{2}$/;

const vnToday = now => new Date((now == null ? Date.now() : now) + 7 * 3600e3).toISOString().slice(0, 10);
const addMonth = (m, n) => { const t = (+m.slice(0, 4)) * 12 + (+m.slice(5, 7) - 1) + n; return Math.floor(t / 12) + '-' + String(t % 12 + 1).padStart(2, '0'); };
const dueMonth = today => (+today.slice(8, 10) > 10 ? today.slice(0, 7) : addMonth(today.slice(0, 7), -1));
/* Mốc "hạn kế tiếp" cho mặc định mở khóa: ngày 10 sắp tới (hôm nay nếu hôm nay đúng ngày 10) */
const nextTen = today => (+today.slice(8, 10) <= 10 ? today.slice(0, 7) : addMonth(today.slice(0, 7), 1)) + '-10';
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400e3).toISOString().slice(0, 10);

/* entries: các dòng sổ học phí (data của collection lg) của mọi bé thuộc một phụ huynh */
function overdueOf(entries, today) {
  const due = dueMonth(today); let credit = 0; const ch = {};
  for (const e of entries || []) {
    const s = LGS[e && e.kind], a = +(e && e.amt);
    if (!s || !(a > 0)) continue;
    if (s < 0) { credit += a; continue; }
    const m = MON.test(e.m || '') ? e.m : String(e.date || '').slice(0, 7);
    if (MON.test(m)) ch[m] = (ch[m] || 0) + a;
  }
  let amt = 0; const months = [];
  for (const m of Object.keys(ch).sort()) {
    const take = Math.min(credit, ch[m]); credit -= take;
    const rem = ch[m] - take;
    if (rem > 0 && m <= due) { amt += rem; months.push(m); }
  }
  return { amt, months, due };
}

/* pul: bản ghi mở khóa tạm {until, by, at, note} hoặc null */
function lockOf(entries, today, pul) {
  const o = overdueOf(entries, today), over = o.amt >= MIN_DEBT;
  const un = !!(pul && DAY.test(String(pul.until || '')) && pul.until >= today);
  return { locked: over && !un, overdue: over, unlocked: over && un, amt: over ? o.amt : 0, months: over ? o.months : [], due: o.due, until: over && un ? pul.until : '', by: pul && pul.by || '', at: pul && pul.at || '', note: pul && pul.note || '' };
}

async function rows(table, qs) {
  const r = await L.pageAll('/rest/v1/' + table + '?select=id,data&order=id&' + qs);
  if (!r.ok) throw new L.HttpError(500, 'Không đọc được dữ liệu.');
  return r.json || [];
}
const q = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

/* Trạng thái khóa của một phụ huynh (key = email hoặc tel:số, ids = mã các bé gắn với tài khoản) */
async function lockForParent(key, ids) {
  const today = vnToday();
  if (!ids.length) return Object.assign(lockOf([], today, null), { today });
  const lg = await rows('money_records', 'collection=eq.lg&data->>hs=' + encodeURIComponent('in.(' + ids.map(q).join(',') + ')'));
  const p = await rows('records', 'collection=eq.pul&id=eq.' + encodeURIComponent(key));
  return Object.assign(lockOf(lg.map(r => r.data || {}), today, p[0] && p[0].data), { today });
}

/* Các phụ huynh theo khóa (email hoặc tel:số) và các bé của họ */
async function parentsMap() {
  const ks = await L.pageAll('/rest/v1/records?select=id,n:data->>n,pn:data->>pn,pe:data->>pe,pp:data->>pp&collection=eq.kids&order=id');
  if (!ks.ok) throw new L.HttpError(500, 'Không đọc được hồ sơ trẻ.');
  const by = new Map();
  for (const k of ks.json || []) {
    const key = L.pkeyOf(k); if (!key) continue;
    if (!by.has(key)) by.set(key, { key, name: k.pn || '', kids: [], ids: [] });
    const g = by.get(key); g.kids.push(k.n || ''); g.ids.push(k.id);
  }
  return by;
}
const hasParent = async key => (await parentsMap()).has(key);

/* Mọi phụ huynh đang quá hạn hoặc đang được mở khóa tạm (cho nhân viên) */
async function allLocks() {
  const today = vnToday(), by = await parentsMap(), kidKey = new Map();
  for (const g of by.values()) g.ids.forEach(i => kidKey.set(i, g.key));
  const ent = new Map();
  for (const r of await rows('money_records', 'collection=eq.lg')) {
    const d = r.data || {}, key = kidKey.get(d.hs);
    if (key) (ent.get(key) || ent.set(key, []).get(key)).push(d);
  }
  const puls = new Map((await rows('records', 'collection=eq.pul')).map(r => [r.id, r.data || {}]));
  const out = [];
  for (const g of by.values()) {
    const l = lockOf(ent.get(g.key) || [], today, puls.get(g.key));
    if (l.overdue) out.push(Object.assign({ key: g.key, name: g.name, kids: g.kids }, l));
  }
  out.sort((a, b) => (b.locked - a.locked) || (b.amt - a.amt));
  return { rows: out, today, due: dueMonth(today) };
}

module.exports = { vnToday, addMonth, dueMonth, nextTen, addDays, overdueOf, lockOf, lockForParent, allLocks, hasParent, MIN_DEBT, DAY };
