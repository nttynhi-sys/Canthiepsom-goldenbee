/* Tra địa chỉ đăng nhập từ số điện thoại. Không cần đăng nhập trước.
   Trình duyệt gửi số điện thoại, nhận lại email mà Supabase dùng để đăng nhập, rồi tự đăng nhập bằng email đó và mật khẩu.
   Số điện thoại lạ trả về cùng dạng kết quả (đăng nhập sẽ báo sai thông tin như khi sai mật khẩu), nên không dò được số nào có tài khoản. */
const { HttpError, clean, sbSecret, telNorm, aliasEmail, wrap } = require('./_lib');

module.exports = wrap(async b => {
  const tel = telNorm(clean(b.phone));
  if (!tel) throw new HttpError(400, 'Số điện thoại chưa hợp lệ.');
  const p = await sbSecret('/rest/v1/profiles?select=user_id&phone=eq.' + encodeURIComponent(tel) + '&limit=1');
  if (!p.ok) {
    if (p.json && (p.json.code === '42703' || /phone/.test(String(p.json.message || '')))) throw new HttpError(503, 'Đăng nhập bằng số điện thoại chưa được bật trên máy chủ dữ liệu. Hãy chạy tệp supabase/policies-v3.sql.');
    throw new HttpError(500, 'Không tra cứu được số điện thoại.');
  }
  const row = p.json && p.json[0];
  if (row) {
    const u = await sbSecret('/auth/v1/admin/users/' + encodeURIComponent(row.user_id));
    if (u.ok && u.json && u.json.email) return { email: clean(u.json.email).toLowerCase() };
  }
  return { email: aliasEmail(tel) };
});
