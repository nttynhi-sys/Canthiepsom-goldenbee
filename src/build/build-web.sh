#!/bin/bash
# Ghép mã nguồn thành index.html (bản máy chủ) tại thư mục gốc của repo. Chạy từ bất kỳ đâu.
cd "$(dirname "$0")"
cat p01-logo.js p02-core.js p02b-cloud.js p03-seed.js p03b-lib.js p03c-seedprog.js p03d-dx.js p04-domain.js p04b-prog.js p05-shell.js p06-dash.js p07-hr.js p08-hs.js p08b-ci.js p09-pc.js p10-lh.js p11-cc.js p12-dd1.js p12-dd2.js p12-dd3.js p13-hb.js p14-hp.js p15-tl.js p16-bc.js p17-td.js p18-cp.js p19-tb.js p20-charts.js p21-menu.js p22-hol.js p23-lock.js p24-guard.js p99-boot.js > all.js
node --check all.js || exit 1
{ printf '<!doctype html>\n<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow">\n'; cat h1.html c1.css c2.css c3.css; printf '</style></head><body>\n<div id="app"></div>\n<script>\n'; cat all.js; printf '\n</script></body></html>\n'; } > ../../index.html
# bản thử cục bộ cho kiểm thử: cùng nội dung, đặt cạnh mã nguồn
cp ../../index.html page-test.html
ls -l ../../index.html | awk '{print $5" bytes"}'
