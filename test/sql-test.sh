#!/bin/bash
# Thử chính sách SQL trên Postgres cục bộ. Dùng: PGHOST=... PGPORT=... bash test/sql-test.sh
# Hai đường đi:
#  A. Cài mới: schema.sql -> v2 -> v3 -> v3 (chạy lại phải an toàn).
#  B. Giống dự án đang chạy: schema.sql -> v2 -> v3 cũ -> các migration theo thứ tự -> v3 mới (đưa về cùng trạng thái).
# Cả hai phải cho cùng kết quả ở test/sql-cases.sql.
set -e
cd "$(dirname "$0")/.."
run() { # $1 = tên cơ sở dữ liệu
  P="psql -U postgres -v ON_ERROR_STOP=1 -q -t -A"
  $P -c "drop database if exists $1" -c "create database $1"
  P="$P -d $1"
  $P -f test/sql-boot.sql
  $P -f supabase/schema.sql
  $P -c "grant select,insert,update,delete on all tables in schema public to authenticated" -c "grant execute on all functions in schema public to authenticated, anon"
  $P -f supabase/policies-v2.sql          # trạng thái cũ của người dùng
}
echo "== A. cài mới =="
run gbtest
$P -f supabase/policies-v3.sql
$P -f supabase/policies-v3.sql          # chạy lại phải an toàn
$P -f test/sql-cases.sql
$P -f test/sql-structure.sql
echo "== B. lên cấp từ dự án đang chạy (v3 cũ + migration) =="
run gbtest_b
$P -f test/sql-v3-legacy.sql
for m in supabase/migrations/*.sql; do echo "migration: $m"; $P -f "$m"; done
$P -f test/sql-cases.sql                # đúng trạng thái của dự án thật sau migration
$P -f test/sql-structure.sql
$P -f supabase/policies-v3.sql          # rồi chạy v3 mới lên trên vẫn an toàn
$P -f test/sql-structure.sql
