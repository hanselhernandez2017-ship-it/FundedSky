// Back office: one page per section, all served from the same live app (web/src/ops.js on the admin kit).
const fs = require('fs'); const path = require('path');
module.exports = ({ SRC, DIST, HEAD, out, rd }) => {
  const css = rd('admin.css') + `
.fsbo .card.mt{margin-top:20px}.fsbo .note{border:1px solid var(--ln);border-radius:8px;padding:12px 14px;background:var(--p3)}.fsbo .note.bad{border-color:var(--no);background:var(--not)}
.fsbo .catin{background:var(--p1);border:1px solid var(--ln);border-radius:6px;color:var(--tx);font:inherit;font-size:13px;height:32px;padding:0 8px}
.fsbo .catin[type=checkbox]{height:auto}.fsbo textarea{background:var(--p1);border:1px solid var(--ln);border-radius:8px;color:var(--tx);padding:10px 12px}
.fsbo .fl input{width:100%}.fsbo .pill[disabled]{opacity:.45;cursor:not-allowed}
.fsbo .tbn{padding:7px 16px;text-align:center;font-size:12.5px;color:var(--wa);background:var(--wat);border-bottom:1px solid var(--ln)}.fsbo .main [style*="display:grid"]>.card{margin:0!important}
.fsload{position:fixed;inset:0;display:grid;place-items:center;font:500 14px 'Mona Sans',system-ui;color:#9C9693}`;
  const def = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'content-seed.json'), 'utf8'));
  const js = rd('viz.js') + rd('kit_a.js') + rd('ops.js') + rd('kit_b.js');
  const html = `${HEAD('Funded Sky Back Office', `<style>html,body{margin:0;background:#0B0B0E;height:100%}${css}</style>`)}<body><div class="fsbo" id="fsbo"></div><div class="fsload" id="fsload">Loading the back office…</div>
<script>window.__BO_DEF = ${JSON.stringify(def)};
function startOps(root) {
${js}
}
(async function () {
  const r = await fetch('/api/admin/boot', { credentials: 'same-origin' });
  if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
  if (r.status === 403) { location.href = '/app'; return; }
  window.__BO = await r.json(); document.getElementById('fsload').remove(); startOps(document.getElementById('fsbo'));
})().catch((e) => { console.error(e); document.getElementById('fsload').textContent = 'Could not load the back office. Refresh to try again.'; });
</script></body></html>`;
  out('admin/home.html', html);
};
