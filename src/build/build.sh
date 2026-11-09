#!/bin/bash
cd /tmp/claude-0/-home-claude/efd1cc77-c428-5628-a76e-f62e732d0ec8/scratchpad/build
cat p01-logo.js p02-core.js p03-seed.js p03b-lib.js p03c-seedprog.js p03d-dx.js p04-domain.js p04b-prog.js p05-shell.js p06-dash.js p07-hr.js p08-hs.js p08b-ci.js p09-pc.js p10-lh.js p11-cc.js p12-dd1.js p12-dd2.js p12-dd3.js p13-hb.js p14-hp.js p15-tl.js p16-bc.js p17-td.js p18-cp.js p19-tb.js p20-charts.js p21-menu.js p99-boot.js > all.js
node --check all.js || exit 1
{ cat h1.html c1.css c2.css c3.css; printf '</style>\n<div id="app"></div>\n<script>\n'; cat all.js; printf '\n</script>\n'; } > page.html
cp page.html /mnt/user-data/outputs/trung-tam-tri-lieu.html
ls -l page.html | awk '{print $5" bytes"}'
cat > skel-head.html <<'EOS'
<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>
EOS
{ cat skel-head.html page.html; echo '</body></html>'; } > page-test.html
