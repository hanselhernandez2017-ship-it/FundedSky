// Builds web/dist from the design sources in web/src (trader app, reset checkout, back office)
// and web/pages (checkout and sign-in templates).
const fs = require('fs'); const path = require('path');
const SRC = path.join(__dirname, '..', 'web', 'src'); const PAGES = path.join(__dirname, '..', 'web', 'pages');
const DIST = path.join(__dirname, '..', 'web', 'dist'); const RT = path.join(__dirname, '..', 'web', 'runtime');
const rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
fs.mkdirSync(path.join(DIST, 'static'), { recursive: true }); fs.mkdirSync(path.join(DIST, 'admin'), { recursive: true });
fs.copyFileSync(require.resolve('morphdom/dist/morphdom-umd.min.js'), path.join(DIST, 'static', 'morphdom.js'));
fs.copyFileSync(path.join(RT, 'dc.js'), path.join(DIST, 'static', 'dc.js'));
for (const f of fs.readdirSync(RT)) if (/\.(js|css|svg|png|ico|woff2)$/.test(f) && f !== 'dc.js') fs.copyFileSync(path.join(RT, f), path.join(DIST, 'static', f));
const FONT = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@100..125,400..700&family=Geist+Mono:wght@400;500&display=swap"><style>@font-face{font-family:"Flag Emoji";src:url(/static/flags.woff2) format("woff2");unicode-range:U+1F1E6-1F1FF,U+1F3F4,U+E0062-E007F;font-display:swap}#dial,#pdial,#dial option,#pdial option{font-family:"Flag Emoji","Mona Sans",system-ui,sans-serif!important}</style>';
// Flag Emoji font: Twemoji Country Flags (country-flag-emoji-polyfill, MIT); flag art from Twemoji, CC-BY 4.0. Windows has no flag emoji of its own.
const HEAD = (title, extra = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>${title}</title><link rel="icon" href="/static/favicon.svg" type="image/svg+xml"><meta name="theme-color" content="#08080A">${FONT}${extra}</head>`;
// The certificate design (web/runtime/cert.js, also required by the server for /cert/:id) is copied to /static/cert.js above with the
// other runtime files and loaded by the trader app and the Back Office Rewards board. Its name is set in a serif italic and its
// headline in weights up to 800, so pages that draw certificates load these on top of the site fonts.
const CERT_FONT = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@100..125,400..800&family=Instrument+Serif:ital@1&display=swap">';
// The account-size badges (web/runtime/sizeart.js, /static/sizeart.js) are drawn in the browser as inline SVG: the trader app, the checkout
// pages that use <dc-import name="SizeBadge"> and the back office load it.
// Files under /static are cached by browsers for an hour, so every page asks for them with this build's stamp and a new deploy shows at once
const STAMP = Date.now().toString(36);
const out = (f, s) => { if (/\.html$/.test(f)) s = s.replace(/((?:src|href)="\/static\/[\w./-]+\.(?:js|css))"/g, `$1?v=${STAMP}"`); fs.writeFileSync(path.join(DIST, f), s); console.log('built', f, Math.round(s.length / 1024) + 'KB'); };

// ---------- trader app (one page, routes by path) ----------
{
  const css = ['tr.css', 'viz.css', 'tr_panel.css', 'tr_shell.css', 'tr_fix.css', 'tr_light.css', 'tr_packs.css', 'tr_art.css', 'tr_cert.css'].map(rd).join('\n') + (fs.existsSync(path.join(SRC, 'tr_live.css')) ? rd('tr_live.css') : '');
  const js = ['viz.js', 'tr_data.js', 'tr_app.js', 'tr_art.js', 'tr_viz.js', 'tr_pages1.js', 'tr_pages2.js', 'tr_pages4.js', 'tr_pages5.js', 'tr_pages6.js', 'tr_pages3.js'].map(rd).join('\n');
  const html = `${HEAD('Funded Sky', `<style>html,body{margin:0;background:#08080A}html[data-theme=light],html[data-theme=light] body{background:#F6F5F3}${css}
.fsload{position:fixed;inset:0;display:grid;place-items:center;font:500 14px 'Mona Sans',system-ui;color:#9C9693}</style>${CERT_FONT}`)}
<body><div class="fsbo" id="fsbo"></div><div class="fsload" id="fsload">Loading your dashboard…</div>
<script src="/static/pay.js"></script><script src="/static/morphdom.js"></script><script src="/static/packart.js"></script><script src="/static/cert.js"></script><script src="/static/sizeart.js"></script>
<script>
(function () {
  var t = 'dark'; try { t = localStorage.getItem('fs_theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); } catch (e) {}
  document.documentElement.dataset.theme = t; try { document.cookie = 'fs_theme=' + t + '; Path=/; Max-Age=31536000; SameSite=Lax'; } catch (e) {}
})();
function startTrader(root) {
${js}
}
(function () {
  var MOB = 760;
  function pageOf() { var p = location.pathname.replace(/^\\/app\\/?/, '').split('/')[0]; return p || 'accounts'; }
  async function load() {
    var r = await fetch('/api/trader/boot', { credentials: 'same-origin' });
    if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search); return null; }
    if (!r.ok) throw new Error('boot ' + r.status);
    return r.json();
  }
  var mobileNow = null;
  function mount(keep) {
    var old = document.getElementById('fsbo'); var root = old.cloneNode(false); old.replaceWith(root);
    var p = pageOf(); var hasAcc = window.__FS.ACC.length || window.__FS.HIST.length;
    if (p === 'accounts' && !hasAcc) { root.dataset.page = 'empty'; root.dataset.newt = '1'; } else { root.dataset.page = p; delete root.dataset.newt; }
    mobileNow = innerWidth <= MOB; root.dataset.mobile = mobileNow ? '1' : '0';
    var th = document.documentElement.dataset.theme; root.dataset.theme = th; root.className = 'fsbo' + (th === 'light' ? ' light' : '');
    window.__FS_KEEP = keep || {};
    startTrader(root);
    var l = document.getElementById('fsload'); if (l) l.remove();
  }
  // a refresh after saving keeps the reader where they were on the page
  window.__FSrefresh = async function (keep) { var d = await load(); if (!d) return; var y = window.scrollY, pg = pageOf(); window.__FS = d; mount(keep); if (pageOf() === pg && y > 0) { window.scrollTo(0, y); requestAnimationFrame(function () { window.scrollTo(0, y); }); } };
  load().then(function (d) { if (!d) return; window.__FS = d; mount({}); FSPAY.boot({ email: d.ME.email, first: d.ME.first, last: d.ME.lastFull }); }).catch(function (e) { console.error(e); var l = document.getElementById('fsload'); if (l) l.innerHTML = 'Could not load your dashboard. <a href="" style="color:#7CC4FF">Try again</a>'; });
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (window.__FS && (innerWidth <= MOB) !== mobileNow) mount(window.__FS_LAST_KEEP ? window.__FS_LAST_KEEP() : {}); }, 200); });
  // live data: refresh balances every 60 seconds while the tab is visible
  setInterval(function () { if (document.visibilityState === 'visible' && !document.querySelector('.drw, .pal, input:focus, textarea:focus')) window.__FSrefresh(window.__FS_LAST_KEEP && window.__FS_LAST_KEEP()); }, 60000);
})();
</script></body></html>`;
  out('app.html', html);
}

// ---------- light versions for the checkout flow ----------
const { lighten } = require('./lighten');
const { SELECT_CSS } = require('./select-css');
const THEME_JS = (want) => `<script>(function(){var t='dark';try{t=localStorage.getItem('fs_theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}catch(e){}document.documentElement.dataset.theme='${want}';var c=(document.cookie.match(/(?:^|; )fs_theme=([^;]*)/)||[])[1];if(c!==t){document.cookie='fs_theme='+t+'; Path=/; Max-Age=31536000; SameSite=Lax';if(t!=='${want}'&&!sessionStorage.getItem('fs_th_r')){sessionStorage.setItem('fs_th_r','1');location.reload();}}else{try{sessionStorage.removeItem('fs_th_r')}catch(e){}}})();</script>`;
// ---------- reset checkout ----------
{
  const css = rd('rs.css'); const js = rd('tr_data.js') + rd('rs_app.js');
  const RESET = (th) => `${HEAD('Funded Sky: Reset Your Account', THEME_JS(th) + `<style>html,body{margin:0;background:#08080A}${css}${SELECT_CSS(th === 'light' ? '5E636C' : '9C9693')}</style>`)}<body><div class="rs" id="rsroot" data-mobile="0"></div><div id="fsload" style="position:fixed;inset:0;display:grid;place-items:center;font:500 14px system-ui;color:#9C9693">Loading…</div>
<script src="/static/morphdom.js"></script><script src="/static/pay.js"></script>
<script>
function startReset(root) {
${js}
}
(async function () {
  var r = await fetch('/api/trader/boot', { credentials: 'same-origin' });
  if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search); return; }
  window.__FS = await r.json(); var root = document.getElementById('rsroot'); root.dataset.mobile = innerWidth <= 760 ? '1' : '0';
  document.getElementById('fsload').remove(); startReset(root);
})();
</script></body></html>`;
  out('reset.html', RESET('dark')); out('reset-light.html', lighten(RESET('light')));
}

// ---------- design-template pages (checkout and sign-in) ----------
const DCP = { 'Main.dc.html': 'checkout.html', 'Payment.dc.html': 'payment.html', 'PaymentLoggedIn.dc.html': 'payment-member.html', 'Confirmed.dc.html': 'confirmed.html', 'Credits.dc.html': 'credits.html', 'AdminPacks.dc.html': 'admin/packs.html', 'Login.dc.html': 'login.html', 'SignUp.dc.html': 'signup.html', 'ForgotPassword.dc.html': 'forgot.html', 'ResetPassword.dc.html': 'reset-password.html', 'VerifyEmail.dc.html': 'verify.html' };
// Checkout pages also get a light version that matches the trader's dashboard theme (chosen by the fs_theme cookie on the server).
const LIGHTP = { 'Credits.dc.html': 1, 'Main.dc.html': 1, 'Payment.dc.html': 1, 'PaymentLoggedIn.dc.html': 1, 'Confirmed.dc.html': 1, 'Login.dc.html': 1, 'SignUp.dc.html': 1, 'ForgotPassword.dc.html': 1, 'ResetPassword.dc.html': 1, 'VerifyEmail.dc.html': 1 };
// Back office Packs board (its page source is generated): the description under a name may wrap, so wide tables such as Cards show every column at 1440.
const ADMIN_PACKS_CSS = '.ap .card>table td:first-child .hint{white-space:normal;min-width:220px;max-width:340px}';
for (const [src0, dst0] of Object.entries(DCP).concat(Object.keys(LIGHTP).map((k) => [k + ':light', DCP[k].replace('.html', '-light.html')]))) {
  const lightV = src0.endsWith(':light'); const src = src0.replace(':light', ''); const dst = dst0;
  const s0 = fs.readFileSync(path.join(PAGES, src), 'utf8'); const s = lightV ? lighten(s0) : s0;
  const title = (s.match(/<title>([^<]*)<\/title>/) || [])[1] || 'Funded Sky';
  const body = s.slice(s.indexOf('<x-dc>') + 6, s.indexOf('</x-dc>'));
  const helm = (body.match(/<helmet>([\s\S]*?)<\/helmet>/) || [])[1] || '';
  const tpl = body.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const jsStart = s.indexOf('class Component'); const js = s.slice(jsStart, s.indexOf('</script>', jsStart));
  const helmNoFont = helm.replace(/<link[^>]+fonts\.googleapis[^>]+>/g, '');
  out(dst, `${HEAD(title.replace(/^Funded Sky( mobile)?( checkout)?:\s*/i, 'Funded Sky: '), (LIGHTP[src] ? THEME_JS(lightV ? 'light' : 'dark') : '') + helmNoFont + `<style>${SELECT_CSS(lightV ? '5E636C' : '9C9693')}${src === 'AdminPacks.dc.html' ? ADMIN_PACKS_CSS : ''}</style>`)}<body><div id="dc-root"></div>${src.startsWith('Admin') ? `<script type="text/x-dc-tpl" id="dc-tpl">${tpl}</script>` : `<template id="dc-tpl">${tpl}</template>`}
<script src="/static/morphdom.js"></script><script src="/static/dc.js"></script>${src.startsWith('Admin') ? '' : '<script src="/static/site.js"></script><script src="/static/pay.js"></script>'}${/dc-import/.test(tpl) ? '<script src="/static/packart.js"></script>' : ''}${/name="SizeBadge"/.test(tpl) ? '<script src="/static/sizeart.js"></script>' : ''}
<script>
${js}
DC.mount(Component, { mobileLinks: false });
</script></body></html>`);
}

// ---------- policy pages ---------- (the server renders these with the theme; these files are the dark fallback)
{ const PO = require('../server/policy'); for (const slug of Object.keys(PO.POL)) { const p = PO.builtIn(slug, 'support@fundedsky.com'); out(slug + '.html', PO.page(p)); } }

// ---------- 404 ----------
// one file for both themes: the class is set from the trader's saved theme before the page paints
out('404.html', `${HEAD('Funded Sky: Page Not Found', `<script>(function(){var t='';try{t=localStorage.getItem('fs_theme')||''}catch(e){}if(!t)t=(document.cookie.match(/(?:^|; )fs_theme=([^;]*)/)||[])[1]||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');if(t==='light')document.documentElement.className='lt'})();</script><style>${require('../server/policy').VARS}body{margin:0;background:var(--bg);color:var(--hd);font-family:"Mona Sans",system-ui;line-height:1.6}main{max-width:720px;margin:0 auto;padding:56px 24px}${require('../server/policy').TOP_CSS}a{color:var(--lk)}</style>`)}<body><main>${require('../server/policy').TOP}<p style="color:var(--mu);margin:28px 0 4px">404</p><h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">This Page Doesn't Exist.</h1><p style="margin:0"><a href="/app">Go to Your Dashboard</a> · <a href="/checkout">Buy an Account</a></p></main></body></html>`);

// ---------- back office ----------
if (fs.existsSync(path.join(__dirname, 'build-admin.js'))) require('./build-admin.js')({ SRC, DIST, HEAD, out, rd });
