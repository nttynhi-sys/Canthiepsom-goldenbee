#!/bin/bash
# Thử chính sách SQL trên Postgres cục bộ. Dùng: PGHOST=... PGPORT=... bash test/sql-test.sh
set -e
P="psql -U postgres -v ON_ERROR_STOP=1 -q -t -A"
cd "$(dirname "$0")/.."
$P -c "drop database if exists gbtest" -c "create database gbtest"
P="$P -d gbtest"
$P -f test/sql-boot.sql
$P -f supabase/schema.sql
$P -c "grant select,insert,update,delete on all tables in schema public to authenticated" -c "grant execute on all functions in schema public to authenticated, anon"
$P -f supabase/policies-v2.sql          # trạng thái hiện tại của người dùng
$P -f supabase/policies-v3.sql          # nâng cấp
$P -f supabase/policies-v3.sql          # chạy lại phải an toàn
echo "== v2 -> v3 -> v3: SQL chạy được =="
$P -f test/sql-cases.sql
