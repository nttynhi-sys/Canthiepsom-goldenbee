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

-- Kho tệp riêng tư gb-media (ảnh, video, tài liệu)
reset role;
insert into storage.objects(bucket_id,name,owner_id) values ('gb-media','m/seed-tt.jpg','00000000-0000-0000-0000-000000000001'),('other','x/o.jpg','00000000-0000-0000-0000-000000000001');
select t.chk('bucket gb-media riêng tư, giới hạn 50 MB, có danh sách loại tệp', (select count(*) from storage.buckets where id='gb-media' and public=false and file_size_limit=52428800 and 'video/mp4'=any(allowed_mime_types) and not ('text/html'=any(allowed_mime_types)) and not ('image/svg+xml'=any(allowed_mime_types))), 1);
set role authenticated;
select t.as_user('00000000-0000-0000-0000-000000000001','tt@gb.vn');
select t.chk('tt đọc tệp gb-media, không đọc bucket khác', (select count(*) from storage.objects), 1);
select t.as_user('00000000-0000-0000-0000-000000000002','gv@gb.vn');
select t.chk('gv đọc tệp gb-media', (select count(*) from storage.objects where bucket_id='gb-media'), 1);
do $$ begin
  insert into storage.objects(bucket_id,name,owner_id) values ('gb-media','m/gv1.jpg','00000000-0000-0000-0000-000000000002');
  raise notice 'PASS gv tải được tệp lên gb-media';
  begin insert into storage.objects(bucket_id,name,owner_id) values ('gb-media','khac/gv2.jpg','00000000-0000-0000-0000-000000000002'); raise exception 'FAIL gv tải ngoài tiền tố m/'; exception when insufficient_privilege then raise notice 'PASS gv không tải được ngoài tiền tố m/'; end;
  begin insert into storage.objects(bucket_id,name,owner_id) values ('other','m/gv3.jpg','00000000-0000-0000-0000-000000000002'); raise exception 'FAIL gv tải lên bucket khác'; exception when insufficient_privilege then raise notice 'PASS gv không tải được lên bucket khác'; end;
end $$;
delete from storage.objects where name='m/seed-tt.jpg';
select t.chk('gv không xóa được tệp của người khác', (select count(*) from storage.objects where name='m/seed-tt.jpg'), 1);
delete from storage.objects where name='m/gv1.jpg';
select t.chk('gv xóa được tệp của chính mình', (select count(*) from storage.objects where name='m/gv1.jpg'), 0);
select t.as_user('00000000-0000-0000-0000-000000000004','ph@gb.vn');
select t.chk('ph không đọc được tệp nào trong kho', (select count(*) from storage.objects), 0);
do $$ begin
  begin insert into storage.objects(bucket_id,name,owner_id) values ('gb-media','m/ph.jpg','00000000-0000-0000-0000-000000000004'); raise exception 'FAIL ph tải được tệp lên'; exception when insufficient_privilege then raise notice 'PASS ph không tải được tệp lên'; end;
end $$;
select t.as_user('00000000-0000-0000-0000-000000000001','tt@gb.vn');
delete from storage.objects where name='m/seed-tt.jpg';
select t.chk('tt xóa được tệp trong kho', (select count(*) from storage.objects where name='m/seed-tt.jpg'), 0);
reset role;
set role anon;
do $$ begin
  begin perform count(*) from storage.objects; raise exception 'FAIL anon đọc được kho tệp'; exception when insufficient_privilege then raise notice 'PASS anon không đọc được kho tệp'; end;
end $$;
reset role;
-- Tài liệu tham khảo (ref) và Góc tri ân (tri): chỉ tt, ql ghi; vp, gv chỉ đọc; ph không đọc bảng; tiền tố kho r/ và t/ chỉ tt, ql tải lên, xóa
reset role;
insert into auth.users values ('00000000-0000-0000-0000-000000000006','ql@gb.vn'),('00000000-0000-0000-0000-000000000007','vp@gb.vn');
insert into public.profiles(user_id,role,staff_id,full_name,phone) values
 ('00000000-0000-0000-0000-000000000006','ql','nv07','QL',null),
 ('00000000-0000-0000-0000-000000000007','vp','nv08','VP',null);
set role authenticated;
select t.as_user('00000000-0000-0000-0000-000000000001','tt@gb.vn');
insert into public.records(collection,id,data) values ('ref','r1','{"t":"Hướng dẫn chơi xếp khối","sh":1,"p":"r/r1.pdf"}'),('tri','t1','{"t":"Cảm ơn Trung tâm","sh":1,"cs":1}');
select t.chk('tt ghi được ref và tri', (select count(*) from public.records where collection in ('ref','tri')), 2);
select t.as_user('00000000-0000-0000-0000-000000000006','ql@gb.vn');
insert into public.records(collection,id,data) values ('ref','r2','{"t":"Video mẫu","sh":1}'),('tri','t2','{"t":"Bé tiến bộ","sh":1,"cs":1}');
update public.records set data='{"t":"Video mẫu (sửa)","sh":1}' where collection='ref' and id='r2';
select t.chk('ql ghi, sửa được ref và tri', (select count(*) from public.records where collection in ('ref','tri') and id in ('r2','t2')), 2);
delete from public.records where collection='tri' and id='t2';
select t.chk('ql xóa được mục tri', (select count(*) from public.records where collection='tri'), 1);
select t.as_user('00000000-0000-0000-0000-000000000007','vp@gb.vn');
select t.chk('vp đọc được ref và tri', (select count(*) from public.records where collection in ('ref','tri')), 3);
do $$ begin
  begin insert into public.records(collection,id,data) values ('ref','rv','{"t":"x"}'); raise exception 'FAIL vp ghi được ref'; exception when insufficient_privilege then raise notice 'PASS vp không ghi được ref'; end;
  begin insert into public.records(collection,id,data) values ('tri','tv','{"t":"x"}'); raise exception 'FAIL vp ghi được tri'; exception when insufficient_privilege then raise notice 'PASS vp không ghi được tri'; end;
  begin update public.records set data='{"t":"hack"}' where collection='ref' and id='r1'; if found then raise exception 'FAIL vp sửa được ref'; end if; raise notice 'PASS vp không sửa được ref (0 dòng)'; exception when insufficient_privilege then raise notice 'PASS vp không sửa được ref'; end;
  begin delete from public.records where collection='tri' and id='t1'; if found then raise exception 'FAIL vp xóa được tri'; end if; raise notice 'PASS vp không xóa được tri (0 dòng)'; exception when insufficient_privilege then raise notice 'PASS vp không xóa được tri'; end;
end $$;
select t.as_user('00000000-0000-0000-0000-000000000002','gv@gb.vn');
select t.chk('gv đọc được ref và tri', (select count(*) from public.records where collection in ('ref','tri')), 3);
do $$ begin
  begin insert into public.records(collection,id,data) values ('ref','rg','{"t":"x"}'); raise exception 'FAIL gv ghi được ref'; exception when insufficient_privilege then raise notice 'PASS gv không ghi được ref'; end;
  begin insert into public.records(collection,id,data) values ('tri','tg','{"t":"x"}'); raise exception 'FAIL gv ghi được tri'; exception when insufficient_privilege then raise notice 'PASS gv không ghi được tri'; end;
  begin delete from public.records where collection='ref' and id='r1'; if found then raise exception 'FAIL gv xóa được ref'; end if; raise notice 'PASS gv không xóa được ref (0 dòng)'; exception when insufficient_privilege then raise notice 'PASS gv không xóa được ref'; end;
end $$;
select t.as_user('00000000-0000-0000-0000-000000000004','ph@gb.vn');
select t.chk('ph không đọc được ref, tri trực tiếp', (select count(*) from public.records where collection in ('ref','tri')), 0);
do $$ begin
  begin insert into public.records(collection,id,data) values ('ref','rp','{"t":"x"}'); raise exception 'FAIL ph ghi được ref'; exception when insufficient_privilege then raise notice 'PASS ph không ghi được ref'; end;
end $$;
-- kho tệp
select t.as_user('00000000-0000-0000-0000-000000000006','ql@gb.vn');
do $$ begin
  insert into storage.objects(bucket_id,name,owner_id) values ('gb-media','r/r1.pdf','00000000-0000-0000-0000-000000000006'),('gb-media','t/t1-0.jpg','00000000-0000-0000-0000-000000000006');
  raise notice 'PASS ql tải được tệp lên r/ và t/';
end $$;
select t.as_user('00000000-0000-0000-0000-000000000007','vp@gb.vn');
do $$ begin
  insert into storage.objects(bucket_id,name,owner_id) values ('gb-media','m/vp1.jpg','00000000-0000-0000-0000-000000000007');
  raise notice 'PASS vp vẫn tải được tệp ở m/';
  begin insert into storage.objects(bucket_id,name,owner_id) values ('gb-media','r/vp.pdf','00000000-0000-0000-0000-000000000007'); raise exception 'FAIL vp tải lên r/'; exception when insufficient_privilege then raise notice 'PASS vp không tải được lên r/'; end;
  begin insert into storage.objects(bucket_id,name,owner_id) values ('gb-media','t/vp.jpg','00000000-0000-0000-0000-000000000007'); raise exception 'FAIL vp tải lên t/'; exception when insufficient_privilege then raise notice 'PASS vp không tải được lên t/'; end;
end $$;
delete from storage.objects where name in ('r/r1.pdf','t/t1-0.jpg');
select t.chk('vp không xóa được tệp r/ và t/', (select count(*) from storage.objects where name in ('r/r1.pdf','t/t1-0.jpg')), 2);
delete from storage.objects where name='m/vp1.jpg';
select t.chk('vp vẫn xóa được tệp m/', (select count(*) from storage.objects where name='m/vp1.jpg'), 0);
select t.as_user('00000000-0000-0000-0000-000000000002','gv@gb.vn');
do $$ begin
  begin insert into storage.objects(bucket_id,name,owner_id) values ('gb-media','r/gv.pdf','00000000-0000-0000-0000-000000000002'); raise exception 'FAIL gv tải lên r/'; exception when insufficient_privilege then raise notice 'PASS gv không tải được lên r/'; end;
  begin insert into storage.objects(bucket_id,name,owner_id) values ('gb-media','t/gv.jpg','00000000-0000-0000-0000-000000000002'); raise exception 'FAIL gv tải lên t/'; exception when insufficient_privilege then raise notice 'PASS gv không tải được lên t/'; end;
end $$;
delete from storage.objects where name='r/r1.pdf';
select t.chk('gv không xóa được tệp r/', (select count(*) from storage.objects where name='r/r1.pdf'), 1);
select t.as_user('00000000-0000-0000-0000-000000000006','ql@gb.vn');
delete from storage.objects where name in ('r/r1.pdf','t/t1-0.jpg');
select t.chk('ql xóa được tệp r/ và t/', (select count(*) from storage.objects where name in ('r/r1.pdf','t/t1-0.jpg')), 0);
select t.as_user('00000000-0000-0000-0000-000000000004','ph@gb.vn');
do $$ begin
  begin insert into storage.objects(bucket_id,name,owner_id) values ('gb-media','r/ph.pdf','00000000-0000-0000-0000-000000000004'); raise exception 'FAIL ph tải lên r/'; exception when insufficient_privilege then raise notice 'PASS ph không tải được lên r/'; end;
end $$;
reset role;
delete from public.records where collection in ('ref','tri');

delete from storage.objects;
