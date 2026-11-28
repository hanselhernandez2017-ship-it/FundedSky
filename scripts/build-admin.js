// Back office. Each board page is the original design (web/admin/pages/<key>.js and .css, taken from the
// Admin*.dc.html design files) running on live data. Boards not yet moved over use web/admin/boards/<key>_live.js.
const fs = require('fs'); const path = require('path');
module.exports = ({ SRC, DIST, HEAD, out, rd }) => {
  const AD = path.join(__dirname, '..', 'web', 'admin');
  const PG = path.join(AD, 'pages');
  const ra = (f) => fs.readFileSync(path.join(AD, f), 'utf8');
  const meta = JSON.parse(ra('pages/meta.json'));
  // Design links point at AdminX.dc.html files; on the live site they are /admin/x
  const links = (s) => s.replace(/Admin(\w+?)(?:Light)?\.dc\.html/g, (m, b) => '/admin/' + b.toLowerCase())
    .replace("const ME = '[Your Name]';", 'const ME = window.FSG.me();').replace("const RV2 = '[Second Reviewer]';", "const RV2 = 'Second Reviewer';")
    .replace(/new Date\(2026, 10, 22 - ago\)/g, 'new Date(Date.now() - ago * 864e5)').replace(/d\.getFullYear\(\) !== 2026/g, 'd.getFullYear() !== new Date().getFullYear()');
  const boot = (call) => `
(async function () {
  // What to load: bigger lists after Load More (kept for this browser tab), and the trader, account, payout or order named in the link
  window.__BOQ = function () { const p = new URLSearchParams();
    try { const m = JSON.parse(sessionStorage.getItem('fs_bo_more') || '{}'); ['lu', 'la', 'lo', 'lp'].forEach((k) => { if (+m[k]) p.set(k, +m[k]); }); } catch (e) { /* storage off */ }
    try { const raw = decodeURIComponent(location.hash || ''); const P = {}; (raw.split('?')[1] || '').split('&').forEach((kv) => { const i = kv.indexOf('='); if (i > 0) P[kv.slice(0, i)] = kv.slice(i + 1); });
      const W = { wu: P.trader || P.uid || (/^#user\\b/.test(raw) ? P.id : ''), wa: P.acct, wp: P.payout, wo: P.order || (/\\/admin\\/finance$/.test(location.pathname) ? P.o : '') }; Object.keys(W).forEach((k) => { if (W[k]) p.set(k, String(W[k]).slice(0, 60)); }); } catch (e) { /* no deep link */ }
    const q = p.toString(); return q ? '?' + q : ''; };
  const r = await fetch('/api/admin/boot' + window.__BOQ(), { credentials: 'same-origin' });
  if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname + location.hash); return; }
  if (r.status === 403) { location.href = '/app'; return; }
  window.__BO = await r.json(); window.__BO_DEF = ${fs.readFileSync(path.join(__dirname, '..', 'server', 'content-seed.json'), 'utf8')};
  ${ra('prelude.js')}
  const ld = document.getElementById('fsload'); if (ld) ld.remove();
  const root = document.getElementById('fsbo');
  ${call}
})().catch((e) => { console.error(e); const ld = document.getElementById('fsload'); if (ld) ld.textContent = 'Could not load the back office. Refresh to try again.'; });`;
  const LOADER = '.fsload{position:fixed;inset:0;display:grid;place-items:center;font:500 14px \'Mona Sans\',system-ui;color:#9C9693;background:#0B0B0E}';
  const glob = links(ra('global_live.js'));
  const built = [];
  for (const key of Object.keys(meta)) {
    const js = ra('pages/' + key + '.js');
    if (!js.includes('/*LIVE*/')) continue;
    const m = meta[key];
    const css = ra('pages/' + key + '.css') + ra('live.css');
    // the Rewards board previews certificates with the shared design module (web/runtime/cert.js, served as /static/cert.js)
    const cert = key === 'rewards';
    const head = `${m.links.join('')}${cert ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@100..125,400..800&family=Instrument+Serif:ital@1&family=Geist+Mono:wght@400;500&display=swap">' : ''}<style>html,body{margin:0;height:100%}${css}${LOADER}${cert ? '.fsbo .certpv{width:100%;max-width:760px;margin:6px auto 10px}.fsbo .certpc{margin-bottom:14px;scroll-margin-top:72px}.fsbo.light .certpv .fsc .fsc-pg{box-shadow:0 1.4cqw 3.2cqw rgba(16,24,40,.22)}' : ''}</style>`;
    const html = `${HEAD(m.title.replace(/^Funded Sky admin: /, 'Funded Sky Admin: ').replace(/: (\w)/, (x, c) => ': ' + c.toUpperCase()), head)}<body><div class="fsbo" id="fsbo"></div><div class="fsload" id="fsload">Loading the back office…</div>${cert ? '<script src="/static/cert.js"></script>' : ''}<script src="/static/sizeart.js"></script>
<script>
${links(js)}
${m.boot.includes('startGlobal') ? glob : ''}
${boot(m.boot)}
</script></body></html>`;
    out('admin/' + key + '.html', html); built.push(key);
  }
  // Boards not yet moved to the design code
  const extraCss = ['us.css', 'sp.css', 'em.css', 'in.css', 'in_pi.css'].map((f) => (fs.existsSync(path.join(AD, 'css', f)) ? ra('css/' + f) : '')).join('\n');
  const css = rd('admin.css') + extraCss + `
.fsbo .card.mt{margin-top:20px}.fsbo textarea{background:var(--p1);border:1px solid var(--ln);border-radius:8px;color:var(--tx);padding:10px 12px}
.fsbo .fl input,.fsbo .fl select{width:100%}.fsbo .pill[disabled]{opacity:.45;cursor:not-allowed}
.fsbo .dots i.off,.fsbo .dots i:not([class]),.fsbo .dots i[class=""]{background:var(--fa)!important}${LOADER}`;
  const def = fs.readFileSync(path.join(__dirname, '..', 'server', 'content-seed.json'), 'utf8');
  const page = (title, js) => `${HEAD(title, `<style>html,body{margin:0;background:#0B0B0E;height:100%}${css}</style>`)}<body><div class="fsbo" id="fsbo"></div><div class="fsload" id="fsload">Loading the back office…</div>
<script>window.__BO_DEF = ${def};
function startBoard(root) {
${js}
}
(async function () {
  const r = await fetch('/api/admin/boot', { credentials: 'same-origin' });
  if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
  if (r.status === 403) { location.href = '/app'; return; }
  window.__BO = await r.json(); document.getElementById('fsload').remove();
  const root = document.getElementById('fsbo'); try { if ((localStorage.getItem('fs_admin_theme') || 'dark') === 'light') root.classList.add('light'); } catch (e) {}
  startBoard(root);
})().catch((e) => { console.error(e); document.getElementById('fsload').textContent = 'Could not load the back office. Refresh to try again.'; });
</script></body></html>`;
  const kit = (board) => rd('viz.js') + ra('kit_a.js') + ra('live.js') + ra('boards/' + board) + ra('kit_b.js');
  for (const f of fs.readdirSync(path.join(AD, 'boards')).filter((x) => x.endsWith('_live.js'))) {
    const key = f.replace('_live.js', ''); if (built.includes(key)) continue;
    out('admin/' + key + '.html', page('Funded Sky Back Office', kit(f)));
  }
};
