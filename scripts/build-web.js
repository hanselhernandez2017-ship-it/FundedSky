// Builds web/dist from the design sources in web/src (trader app, reset checkout, back office)
// and web/pages (checkout and sign-in templates).
const fs = require('fs'); const path = require('path');
const SRC = path.join(__dirname, '..', 'web', 'src'); const PAGES = path.join(__dirname, '..', 'web', 'pages');
const DIST = path.join(__dirname, '..', 'web', 'dist'); const RT = path.join(__dirname, '..', 'web', 'runtime');
const rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
fs.mkdirSync(path.join(DIST, 'static'), { recursive: true }); fs.mkdirSync(path.join(DIST, 'admin'), { recursive: true });
fs.copyFileSync(require.resolve('morphdom/dist/morphdom-umd.min.js'), path.join(DIST, 'static', 'morphdom.js'));
fs.copyFileSync(path.join(RT, 'dc.js'), path.join(DIST, 'static', 'dc.js'));
for (const f of fs.readdirSync(RT)) if (/\.(js|css|svg|png|ico)$/.test(f) && f !== 'dc.js') fs.copyFileSync(path.join(RT, f), path.join(DIST, 'static', f));
const FONT = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@100..125,400..700&family=Geist+Mono:wght@400;500&display=swap">';
const HEAD = (title, extra = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>${title}</title><link rel="icon" href="/static/favicon.svg" type="image/svg+xml"><meta name="theme-color" content="#08080A">${FONT}${extra}</head>`;
const out = (f, s) => { fs.writeFileSync(path.join(DIST, f), s); console.log('built', f, Math.round(s.length / 1024) + 'KB'); };

// ---------- trader app (one page, routes by path) ----------
{
  const css = ['tr.css', 'viz.css', 'tr_panel.css', 'tr_shell.css', 'tr_fix.css', 'tr_light.css'].map(rd).join('\n') + (fs.existsSync(path.join(SRC, 'tr_live.css')) ? rd('tr_live.css') : '');
  const js = ['viz.js', 'tr_data.js', 'tr_app.js', 'tr_viz.js', 'tr_pages1.js', 'tr_pages2.js', 'tr_pages4.js', 'tr_pages5.js', 'tr_pages3.js'].map(rd).join('\n');
  const html = `${HEAD('Funded Sky', `<style>html,body{margin:0;background:#08080A}html[data-theme=light],html[data-theme=light] body{background:#F6F5F3}${css}
.fsload{position:fixed;inset:0;display:grid;place-items:center;font:500 14px 'Mona Sans',system-ui;color:#9C9693}</style>`)}
<body><div class="fsbo" id="fsbo"></div><div class="fsload" id="fsload">Loading your dashboard…</div>
<script src="/static/pay.js"></script>
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
  window.__FSrefresh = async function (keep) { var d = await load(); if (!d) return; window.__FS = d; mount(keep); };
  load().then(function (d) { if (!d) return; window.__FS = d; mount({}); FSPAY.boot({ email: d.ME.email, first: d.ME.first, last: d.ME.lastFull }); }).catch(function (e) { console.error(e); var l = document.getElementById('fsload'); if (l) l.innerHTML = 'Could not load your dashboard. <a href="" style="color:#7CC4FF">Try again</a>'; });
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (window.__FS && (innerWidth <= MOB) !== mobileNow) mount({}); }, 200); });
  // live data: refresh balances every 60 seconds while the tab is visible
  setInterval(function () { if (document.visibilityState === 'visible' && !document.querySelector('.drw, .pal, input:focus, textarea:focus')) window.__FSrefresh(window.__FS_LAST_KEEP && window.__FS_LAST_KEEP()); }, 60000);
})();
</script></body></html>`;
  out('app.html', html);
}

// ---------- reset checkout ----------
{
  const css = rd('rs.css'); const js = rd('tr_data.js') + rd('rs_app.js');
  out('reset.html', `${HEAD('Funded Sky: reset your account', `<style>html,body{margin:0;background:#08080A}${css}</style>`)}<body><div class="rs" id="rsroot" data-mobile="0"></div><div id="fsload" style="position:fixed;inset:0;display:grid;place-items:center;font:500 14px system-ui;color:#9C9693">Loading…</div>
<script src="/static/pay.js"></script>
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
</script></body></html>`);
}

// ---------- design-template pages (checkout and sign-in) ----------
const DCP = { 'Main.dc.html': 'checkout.html', 'Payment.dc.html': 'payment.html', 'PaymentLoggedIn.dc.html': 'payment-member.html', 'Confirmed.dc.html': 'confirmed.html', 'Login.dc.html': 'login.html', 'SignUp.dc.html': 'signup.html', 'ForgotPassword.dc.html': 'forgot.html', 'ResetPassword.dc.html': 'reset-password.html', 'VerifyEmail.dc.html': 'verify.html' };
// Checkout pages also get a light version that matches the trader's dashboard theme (chosen by the fs_theme cookie on the server).
const LIGHTP = { 'Main.dc.html': 1, 'Payment.dc.html': 1, 'PaymentLoggedIn.dc.html': 1, 'Confirmed.dc.html': 1 };
const { lighten } = require('./lighten');
const THEME_JS = (want) => `<script>(function(){var t='dark';try{t=localStorage.getItem('fs_theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}catch(e){}document.documentElement.dataset.theme='${want}';var c=(document.cookie.match(/(?:^|; )fs_theme=([^;]*)/)||[])[1];if(c!==t){document.cookie='fs_theme='+t+'; Path=/; Max-Age=31536000; SameSite=Lax';if(t!=='${want}'&&!sessionStorage.getItem('fs_th_r')){sessionStorage.setItem('fs_th_r','1');location.reload();}}else{try{sessionStorage.removeItem('fs_th_r')}catch(e){}}})();</script>`;
for (const [src0, dst0] of Object.entries(DCP).concat(Object.keys(LIGHTP).map((k) => [k + ':light', DCP[k].replace('.html', '-light.html')]))) {
  const lightV = src0.endsWith(':light'); const src = src0.replace(':light', ''); const dst = dst0;
  const s0 = fs.readFileSync(path.join(PAGES, src), 'utf8'); const s = lightV ? lighten(s0) : s0;
  const title = (s.match(/<title>([^<]*)<\/title>/) || [])[1] || 'Funded Sky';
  const body = s.slice(s.indexOf('<x-dc>') + 6, s.indexOf('</x-dc>'));
  const helm = (body.match(/<helmet>([\s\S]*?)<\/helmet>/) || [])[1] || '';
  const tpl = body.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const jsStart = s.indexOf('class Component'); const js = s.slice(jsStart, s.indexOf('</script>', jsStart));
  const helmNoFont = helm.replace(/<link[^>]+fonts\.googleapis[^>]+>/g, '');
  out(dst, `${HEAD(title.replace(/^Funded Sky( mobile)?( checkout)?:\s*/i, 'Funded Sky: '), (LIGHTP[src] ? THEME_JS(lightV ? 'light' : 'dark') : '') + helmNoFont)}<body><div id="dc-root"></div><template id="dc-tpl">${tpl}</template>
<script src="/static/morphdom.js"></script><script src="/static/dc.js"></script><script src="/static/site.js"></script><script src="/static/pay.js"></script>
<script>
${js}
DC.mount(Component, { mobileLinks: false });
</script></body></html>`);
}

// ---------- policy pages ----------
const POL = {
  'terms.html': ['Terms of Service', [['What you buy', 'Evaluations and funded accounts are simulated trading accounts. Fees pay for access to the evaluation and our tools. They are not deposits and are never traded.'], ['Eligibility', 'You must be 18 or older and live in a country where we offer accounts. One person, one set of accounts. Shared, copied or automated trading across traders is not allowed.'], ['Rules', 'Every account follows the rules shown at checkout and in Resources: profit target, daily loss limit, end-of-day trailing max loss, minimum days, consistency and the news rule. Breaking the max loss rule closes the account.'], ['Payouts', 'Funded accounts can request payouts under the payout rules, caps and split shown in Resources. We verify your identity before your first payout and may review any payout for rule abuse.'], ['Changes', 'We may change plans, prices and rules for new accounts. Accounts you already hold keep the rules they started with.']]],
  'privacy.html': ['Privacy Policy', [['What we collect', 'Your name, email, country, phone if you add it, identity details you send for verification, payout method details, orders and the trades on your accounts.'], ['Why', 'To run your accounts, check the rules, pay you, prevent fraud and meet legal duties such as tax reporting.'], ['Who we share with', 'Our payment processor, email provider and payout providers, only as needed to provide the service. We do not sell your data.'], ['Your choices', 'You can ask for a copy of your data or ask us to close your account from Settings, Privacy.']]],
  'refund-policy.html': ['Refund Policy', [['Evaluations', 'An evaluation with no trades can be refunded within 14 days of purchase. Ask from Support.'], ['Not refundable', 'Resets, activation fees and any account that has traded.'], ['How refunds are paid', 'To your original payment method, usually within 3 to 5 business days.']]]
};
for (const [f, [title, secs]] of Object.entries(POL)) out(f, `${HEAD('Funded Sky: ' + title, '<style>body{margin:0;background:#08080A;color:#D4CFCD;font-family:"Mona Sans",system-ui;line-height:1.6}main{max-width:720px;margin:0 auto;padding:56px 24px}h1{color:#F4F2F1;font-size:32px;margin:0 0 6px}h2{color:#F4F2F1;font-size:18px;margin:28px 0 6px}a{color:#7CC4FF}.n{color:#9C9693;font-size:14px}</style>')}<body><main><p class="n"><a href="/">fundedsky</a></p><h1>${title}</h1><p class="n">Plain-language summary. Questions: support@fundedsky.com</p>${secs.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join('')}</main></body></html>`);

// ---------- 404 ----------
out('404.html', `${HEAD('Funded Sky: page not found', '<style>body{margin:0;background:#08080A;color:#F4F2F1;font-family:"Mona Sans",system-ui;display:grid;place-items:center;min-height:100vh;text-align:center}a{color:#7CC4FF}</style>')}<body><div><p style="color:#9C9693;margin:0 0 8px">404</p><h1 style="margin:0 0 12px;font-size:28px">This page doesn't exist.</h1><p><a href="/app">Go to your dashboard</a> · <a href="/checkout">Buy an account</a></p></div></body></html>`);

// ---------- back office ----------
if (fs.existsSync(path.join(__dirname, 'build-admin.js'))) require('./build-admin.js')({ SRC, DIST, HEAD, out, rd });
