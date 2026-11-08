-- Golden Bee: lược đồ Supabase (chạy một lần trong SQL Editor)

-- 1. Hồ sơ người dùng gắn với vai trò
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('tt','vp','ql','gv','ph')),
  staff_id   text,
  full_name  text,
  created_at timestamptz not null default now()
);

-- 2. Dữ liệu chung (trẻ, lịch, điểm danh, mục tiêu, thực đơn...)
create table if not exists public.records (
  collection text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  primary key (collection, id)
);

-- 3. Dữ liệu tiền: học phí, lương, thưởng, cấu hình thuế (chỉ tt và vp)
create table if not exists public.money_records (
  collection text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  primary key (collection, id)
);

-- Hàm lấy vai trò của người đang đăng nhập
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid()
$$;

-- Bật RLS
alter table public.profiles       enable row level security;
alter table public.records        enable row level security;
alter table public.money_records  enable row level security;

-- profiles: mỗi người đọc hồ sơ của mình; chỉ tt được tạo và sửa vai trò
create policy "profile_read_own" on public.profiles for select
  using (user_id = auth.uid() or public.my_role() = 'tt');
create policy "profile_tt_manage" on public.profiles for all
  using (public.my_role() = 'tt') with check (public.my_role() = 'tt');

-- records: mọi tài khoản có vai trò đều đọc được
create policy "records_read" on public.records for select
  using (public.my_role() is not null);
-- ghi: tt, vp, ql, gv (các quyền chi tiết theo vai trò do ứng dụng kiểm tra)
create policy "records_write" on public.records for all
  using (public.my_role() in ('tt','vp','ql','gv'))
  with check (public.my_role() in ('tt','vp','ql','gv'));

-- money_records: chỉ tt và vp đọc và ghi
create policy "money_tt_vp" on public.money_records for all
  using (public.my_role() in ('tt','vp'))
  with check (public.my_role() in ('tt','vp'));

-- Ghi lại người sửa và thời điểm sửa
create or replace function public.touch_meta() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
create trigger records_touch before insert or update on public.records
  for each row execute function public.touch_meta();
create trigger money_touch before insert or update on public.money_records
  for each row execute function public.touch_meta();
