-- dữ liệu mẫu (chạy bằng quyền quản trị)
insert into auth.users values ('00000000-0000-0000-0000-000000000001','tt@gb.vn'),('00000000-0000-0000-0000-000000000002','gv@gb.vn'),('00000000-0000-0000-0000-000000000003','sdt@example.com'),('00000000-0000-0000-0000-000000000004','ph@gb.vn'),('00000000-0000-0000-0000-000000000005','gv2@gb.vn');
insert into public.profiles(user_id,role,staff_id,full_name,phone) values
 ('00000000-0000-0000-0000-000000000001','tt',null,'TT',null),
 ('00000000-0000-0000-0000-000000000002','gv','nv04','GV Co Email',null),
 ('00000000-0000-0000-0000-000000000003','gv','nv05','GV Chi So Dien Thoai','84901234567'),
 ('00000000-0000-0000-0000-000000000004','ph','ph|ph@gb.vn','PH',null),
 ('00000000-0000-0000-0000-000000000005','gv','nv06','GV Khac',null);
insert into public.records(collection,id,data) values ('staff','nv04','{"em":"gv@gb.vn"}'),('staff','nv05','{"em":""}'),('kids','hs1','{"n":"Be"}');
insert into public.money_records(collection,id,data) values ('cfgm','_','{"p11":1}'),('pay','nv04','{"base":1}'),('pay','nv05','{"base":2}'),('pay','nv06','{"base":3}'),('bon','nv05|2026-11','{"x":1}'),('bon','nv06|2026-11','{"x":9}'),('lg','e1','{"amt":5}');

create schema t;
grant usage on schema t to authenticated;
create function t.as_user(uid text, em text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid, false);
  perform set_config('request.jwt.claims', json_build_object('sub',uid,'email',em)::text, false);
end $$;
create function t.chk(name text, got bigint, want bigint) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAIL % (got %, want %)', name, got, want; end if;
  raise notice 'PASS %', name;
end $$;
grant execute on all functions in schema t to authenticated;

-- Trưởng Trung tâm
set role authenticated;
select t.as_user('00000000-0000-0000-0000-000000000001','tt@gb.vn');
select t.chk('tt đọc records', (select count(*) from public.records), 3);
select t.chk('tt đọc toàn bộ money', (select count(*) from public.money_records), 7);

-- Giáo viên có email
select t.as_user('00000000-0000-0000-0000-000000000002','gv@gb.vn');
select t.chk('gv đọc records', (select count(*) from public.records), 3);
select t.chk('gv có email: chỉ thấy cfgm + lương nv04 (không có thưởng)', (select count(*) from public.money_records), 2);
select t.chk('gv có email: thấy lương của mình', (select count(*) from public.money_records where collection='pay' and id='nv04'), 1);

-- Giáo viên chỉ có số điện thoại (email nội bộ khác hồ sơ)
select t.as_user('00000000-0000-0000-0000-000000000003','sdt@example.com');
select t.chk('gv chỉ SĐT: thấy cfgm + pay nv05 + bon nv05', (select count(*) from public.money_records), 3);
select t.chk('gv chỉ SĐT: không thấy lương người khác', (select count(*) from public.money_records where id in ('nv04','nv06','nv06|2026-11')), 0);
select t.chk('gv không thấy học phí', (select count(*) from public.money_records where collection='lg'), 0);

-- Phụ huynh: không đọc được gì
select t.as_user('00000000-0000-0000-0000-000000000004','ph@gb.vn');
select t.chk('ph không đọc records', (select count(*) from public.records), 0);
select t.chk('ph không đọc money', (select count(*) from public.money_records), 0);
select t.chk('ph đọc được hồ sơ của mình', (select count(*) from public.profiles), 1);

-- Quyền ghi
do $$ begin
  begin insert into public.records(collection,id,data) values ('kids','hs9','{}'); raise exception 'FAIL ph ghi được records'; exception when insufficient_privilege then raise notice 'PASS ph không ghi được records'; end;
end $$;
select t.as_user('00000000-0000-0000-0000-000000000002','gv@gb.vn');
do $$ begin
  insert into public.records(collection,id,data) values ('sess','s1','{}');
  raise notice 'PASS gv ghi được sess';
  begin insert into public.records(collection,id,data) values ('staff','nv99','{}'); raise exception 'FAIL gv ghi được staff'; exception when insufficient_privilege then raise notice 'PASS gv không ghi được staff'; end;
  begin insert into public.money_records(collection,id,data) values ('lg','e9','{}'); raise exception 'FAIL gv ghi được money'; exception when insufficient_privilege then raise notice 'PASS gv không ghi được money'; end;
  begin insert into public.records(collection,id,data) values ('hol','h1','{"d":"2027-01-01"}'); raise exception 'FAIL gv ghi được ngày nghỉ lễ'; exception when insufficient_privilege then raise notice 'PASS gv không ghi được ngày nghỉ lễ'; end;
end $$;
select t.as_user('00000000-0000-0000-0000-000000000001','tt@gb.vn');
do $$ begin
  insert into public.records(collection,id,data) values ('hol','h1','{"d":"2027-01-01","n":"Tết Dương lịch","k":"le"}');
  raise notice 'PASS tt ghi được ngày nghỉ lễ';
end $$;
select t.as_user('00000000-0000-0000-0000-000000000002','gv@gb.vn');
select t.chk('gv đọc được ngày nghỉ lễ', (select count(*) from public.records where collection='hol'), 1);
do $$ begin
  begin update public.records set data='{"d":"2027-01-02"}' where collection='hol' and id='h1'; if found then raise exception 'FAIL gv sửa được ngày nghỉ lễ'; end if; raise notice 'PASS gv không sửa được ngày nghỉ lễ (0 dòng)'; exception when insufficient_privilege then raise notice 'PASS gv không sửa được ngày nghỉ lễ'; end;
end $$;

-- Bản ghi mở khóa cổng phụ huynh (pul): trình duyệt không ghi được, kể cả Trưởng Trung tâm; quyền quản trị (máy chủ) ghi được
select t.as_user('00000000-0000-0000-0000-000000000001','tt@gb.vn');
do $$ begin
  begin insert into public.records(collection,id,data) values ('pul','ph@gb.vn','{"until":"2099-01-01"}'); raise exception 'FAIL tt ghi được pul'; exception when insufficient_privilege then raise notice 'PASS tt không ghi được pul'; end;
end $$;
select t.as_user('00000000-0000-0000-0000-000000000002','gv@gb.vn');
do $$ begin
  begin insert into public.records(collection,id,data) values ('pul','ph@gb.vn','{"until":"2099-01-01"}'); raise exception 'FAIL gv ghi được pul'; exception when insufficient_privilege then raise notice 'PASS gv không ghi được pul'; end;
end $$;
reset role;
insert into public.records(collection,id,data) values ('pul','ph@gb.vn','{"until":"2099-01-01","by":"TT"}');
set role authenticated;
select t.as_user('00000000-0000-0000-0000-000000000001','tt@gb.vn');
do $$ begin
  begin update public.records set data='{"until":"2099-12-31"}' where collection='pul' and id='ph@gb.vn'; if found then raise exception 'FAIL tt sửa được pul'; end if; raise notice 'PASS tt không sửa được pul (0 dòng)'; exception when insufficient_privilege then raise notice 'PASS tt không sửa được pul'; end;
  begin delete from public.records where collection='pul' and id='ph@gb.vn'; if found then raise exception 'FAIL tt xóa được pul'; end if; raise notice 'PASS tt không xóa được pul (0 dòng)'; exception when insufficient_privilege then raise notice 'PASS tt không xóa được pul'; end;
end $$;
select t.chk('pul vẫn còn nguyên sau khi thử sửa, xóa', (select count(*) from public.records where collection='pul'), 1);

-- Số điện thoại duy nhất
reset role;
do $$ begin
  begin update public.profiles set phone='84901234567' where user_id='00000000-0000-0000-0000-000000000005'; raise exception 'FAIL trùng SĐT được chấp nhận'; exception when unique_violation then raise notice 'PASS SĐT là duy nhất'; end;
  update public.profiles set phone=null where user_id='00000000-0000-0000-0000-000000000005';
  raise notice 'PASS nhiều tài khoản không có SĐT cùng tồn tại';
end $$;
