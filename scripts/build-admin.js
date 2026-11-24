// Back office: the designed boards running on live data (web/admin), plus the operations console.
const fs = require('fs'); const path = require('path');
module.exports = ({ SRC, DIST, HEAD, out, rd }) => {
  const AD = path.join(__dirname, '..', 'web', 'admin');
  const ra = (f) => fs.readFileSync(path.join(AD, f), 'utf8');
  const extraCss = ['us.css', 'sp.css', 'em.css', 'in.css', 'in_pi.css'].map((f) => (fs.existsSync(path.join(AD, 'css', f)) ? ra('css/' + f) : '')).join('\n');
  const css = rd('admin.css') + extraCss + `
.fsbo .card.mt{margin-top:20px}.fsbo .note{border:1px solid var(--ln);border-radius:8px;padding:12px 14px;background:var(--p3)}.fsbo .note.bad{border-color:var(--no);background:var(--not)}
.fsbo .catin{background:var(--p1);border:1px solid var(--ln);border-radius:6px;color:var(--tx);font:inherit;font-size:13px;height:32px;padding:0 8px}
.fsbo .catin[type=checkbox]{height:auto}.fsbo textarea{background:var(--p1);border:1px solid var(--ln);border-radius:8px;color:var(--tx);padding:10px 12px}
.fsbo .fl input,.fsbo .fl select{width:100%}.fsbo .pill[disabled]{opacity:.45;cursor:not-allowed}
.fsbo .tbn{padding:7px 16px;text-align:center;font-size:12.5px;color:var(--wa);background:var(--wat);border-bottom:1px solid var(--ln)}.fsbo .main [style*="display:grid"]>.card{margin:0!important}
.fsbo .dots i.off,.fsbo .dots i:not([class]),.fsbo .dots i[class=""]{background:var(--fa)!important}
.fsload{position:fixed;inset:0;display:grid;place-items:center;font:500 14px 'Mona Sans',system-ui;color:#9C9693}`;
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
  const kit = (board) => rd('viz.js') + ra('kit_a.js') + ra('live.js') + ra('boards/' + board) + ra('kit_b.js') + (fs.existsSync(path.join(AD, 'shell.js')) ? ra('shell.js') : '');
  const boards = fs.readdirSync(path.join(AD, 'boards')).filter((f) => f.endsWith('_live.js'));
  for (const f of boards) { const key = f.replace('_live.js', ''); out('admin/' + key + '.html', page('Funded Sky Back Office', kit(f))); }
  // operations console (everything not yet on a designed board)
  out('admin/ops.html', page('Funded Sky Operations', rd('viz.js') + rd('kit_a.js') + rd('ops.js') + rd('kit_b.js')).replace('window.__BO = await r.json();', 'window.__BO = await r.json(); window.__BO_DEF = window.__BO_DEF;').replace('startBoard(root);', 'startBoard(root);'));
};
