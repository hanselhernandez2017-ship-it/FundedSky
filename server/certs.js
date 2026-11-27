// Certificates: which ones exist, who holds them, what each one says, and the public page at /cert/:id.
// Nothing is stored per certificate. Each one follows from a record that already exists (a paid payout, an account that was
// passed or funded, a lifetime payout total, a recorded competition prize place), so it appears and disappears with that record.
// The drawing itself is web/runtime/cert.js, the one design module the server, the trader app and the Back Office all use.
const db = require('./db');
const CERT = require('../web/runtime/cert.js');
const { clean, ET } = require('./util');

// Certificate IDs are built from what the certificate is for, which is already unique: a payout code (oPO-3544 -> CF-O3544), an
// account ID (fFS-50K-2105 -> CF-F50K2105, pFS-50K-2105 -> CF-P50K2105) or a trader and total (l142:10000 -> CF-L142-10000).
// Two certificates can never share an ID. The back office builds the same IDs.
const certId = (s) => { s = String(s); return 'CF-' + s.charAt(0).toUpperCase() + s.slice(1).replace(/^(PO|FS)-/, '').replace(/:/g, '-').replace(/[^A-Za-z0-9-]/g, '').replace(/^(\d+K)-/, '$1'); };
// The short hash used before (CF-12345). Two certificates could land on the same number, so it is only used to keep old links working.
const certIdOld = (s) => 'CF-' + (Array.from(String(s)).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 90000 + 10000);
// Competition certificates: competition C-15, prize place 1 -> CF-C15P1. A competition whose id is not the usual C-<number>
// keeps its id whole (bf_2026, place 2 -> CF-C-bf_2026-P2), so two competitions can never produce the same certificate ID.
const compCertId = (comp, pos) => { const m = /^C-(\d+)$/.exec(String(comp)); return m ? `CF-C${m[1]}P${+pos}` : `CF-C-${comp}-P${+pos}`; };
const compCertParse = (id) => { let m = /^CF-C(\d+)P(\d+)$/.exec(id); if (m) return { comp: 'C-' + m[1], pos: +m[2] }; m = /^CF-C-([A-Za-z0-9][A-Za-z0-9_-]{0,19})-P(\d+)$/.exec(id); return m ? { comp: m[1], pos: +m[2] } : null; };

// Types switched off in Back Office › Rewards › Templates are not issued or shown
const certOff = async () => { const v = ((await db.one("SELECT v FROM kv WHERE k='store.rewards.templates'")) || {}).v || {}; return Object.fromEntries(Object.entries(v).filter(([, on]) => on === false).map(([k]) => [k, true])); };
// Lifetime Payouts certificates: one each time a trader's paid payouts pass these totals, dated the day the payout that crossed it was paid
const LIFE = [10000, 25000, 50000, 100000];
function lifeCerts(uid, paid) {
  const out = []; let sum = 0; let i = 0;
  paid.slice().sort((a, b) => new Date(a.paid_at) - new Date(b.paid_at)).forEach((p) => { sum += Number(p.amount); while (i < LIFE.length && sum >= LIFE[i]) { out.push({ id: certId('l' + uid + ':' + LIFE[i]), v: '$' + LIFE[i].toLocaleString('en-US') + ' Paid Out', when: p.paid_at, amount: LIFE[i] }); i++; } });
  return out;
}

const K = (s) => '$' + Number(s) / 1000 + 'K';
const usd = (v) => '$' + Math.round(Number(v) || 0).toLocaleString('en-US');
const dateLong = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: ET }) : '');
const dayLong = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso || '')) ? new Date(String(iso).slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '');
const host = () => { try { return new URL(require('./auth').BASE()).host; } catch (e) { return 'fundedsky.com'; } };
// The name on a certificate: first name and last initial ("Alex R."), or the full name when the trader switched that on in
// Settings › Privacy. Read from the trader's record every time, so the switch changes every certificate and public page at once.
function nameOf(u) {
  u = u || {}; const first = clean(u.first, 80) || 'Trader'; const last = clean(u.last, 80); const full = !!(u.settings && u.settings.certFull === true);
  return { first, name: full ? `${first} ${last}`.trim() : last ? `${first} ${last.slice(0, 1)}.` : first };
}
// "Black Friday Sprint" -> "the Black Friday Sprint", for the sentence on the certificate
const compWhat = (n) => { n = clean(n, 80) || 'a Funded Sky competition'; return /^(the|a|an)\s/i.test(n) ? n : 'the ' + n; };
const planWord = (cat, a) => { const p = cat && (cat.plans || []).find((x) => x.id === a.plan); return p && p.kind !== 'funded' && p.short && !a.comp ? p.short + ' ' : ''; };

// One certificate from its record. k: the kind name used in lists and by the on/off switches, v: the short line, d: what the design draws.
const one = {
  payout: (p) => ({ id: certId('o' + p.code), user: p.user_id, k: 'Payout', title: 'Payout Certificate', v: usd(p.amount), n: 'Paid', when: p.paid_at, d: { kind: 'payout', amount: usd(p.amount), what: p.size ? `${K(p.size)} Funded Account` : 'Funded Account' } }),
  funded: (a) => ({ id: certId('f' + a.id), user: a.user_id, k: 'Funded', title: 'Funded Trader', v: `${K(a.size)} Funded Account`, n: 'Funded', when: a.funded_at, d: { kind: 'funded', what: `${K(a.size)} Funded Account`, size: K(a.size) } }),
  passed: (a, cat) => ({ id: certId('p' + a.id), user: a.user_id, k: 'Passed', title: 'Evaluation Passed', v: `${K(a.size)} Evaluation`, n: 'Passed', when: a.passed_at, d: { kind: 'passed', what: `${K(a.size)} ${planWord(cat, a)}Evaluation`, size: K(a.size) } }),
  life: (x, uid) => ({ id: x.id, user: uid, k: 'Lifetime', title: 'Lifetime Payouts', v: x.v, n: 'Reached', when: x.when, d: { kind: 'lifetime', tone: CERT.lifeTone(x.amount), amount: usd(x.amount) } }),
  // w: one stored winner (place, pos, uid, of), c: the competition (may be gone from the list), of: ranked traders when it ended.
  // The figure is the prize place the trader holds: in a tie the tie-break decided the place, and that is what the certificate states.
  comp: (w, compId, c, of) => { const end = c && (c.endAt || ''); const n = Number(of) || 0;
    return { id: compCertId(compId, w.pos), user: w.uid, k: 'Competition', title: `${CERT.ordinal(w.pos)} Place`, v: `${CERT.ordinal(w.pos)} Place · ${(c && c.n) || 'Competition'}`, n: 'Ended', when: end ? new Date(end + 'T17:00:00Z') : null, day: end, ts: end ? new Date(end + 'T17:00:00Z').getTime() + 16 * 3600e3 : 0, // a competition runs to the end of its last day (Eastern Time)
      d: { kind: 'comp', tone: CERT.placeTone(w.pos), place: CERT.ordinal(w.pos), rank: String(w.pos), of: Math.max(n, Number(w.pos) || 1).toLocaleString('en-US'), what: compWhat(c && c.n) } }; }
};
// Fill in what every certificate carries: name, date, ID and where to verify it
function finish(c, u) { const nm = nameOf(u); c.date = c.day ? dayLong(c.day) : dateLong(c.when); c.d = Object.assign(c.d, { name: nm.name, first: nm.first, date: c.date, id: c.id, host: host() }); return c; }

// Competition certificates come from the winners recorded when a competition ends (store.competitions.winners): every trader in
// a prize place has one. Undoing the end or disqualifying a winner rewrites that record, so the certificate goes with it.
async function compWinners() { return ((await db.one("SELECT v FROM kv WHERE k='store.competitions.winners'")) || {}).v || {}; }
async function compInfo() {
  const comps = require('./comps'); let L = []; try { L = await comps.list(); } catch (e) { L = []; } const by = new Map(L.map((c) => [c.id, c])); const ofs = new Map();
  // "of N traders" is saved with the winners when the competition ends; results recorded before that was saved count the final ranking
  const ofFor = async (id, w) => { if (w && Number(w.of) > 0) return Number(w.of); if (!ofs.has(id)) ofs.set(id, await comps.board(id).then((B) => B.total.ranked).catch(() => 0)); return ofs.get(id); };
  return { by, ofFor };
}

// Every certificate of one trader, newest first. accts and pays are the trader's own rows.
async function forUser(user, accts, pays, cat) {
  const off = await certOff(); const out = []; const uid = user.id; const sizes = new Map(accts.map((a) => [a.id, a.size])); const paid = pays.filter((p) => p.status === 'paid');
  if (!off.Payout) paid.forEach((p) => out.push(one.payout(Object.assign({}, p, { size: sizes.get(p.account_id) }))));
  if (!off.Funded) accts.filter((a) => a.kind === 'funded' && a.funded_at).forEach((a) => out.push(one.funded(a)));
  if (!off.Passed) accts.filter((a) => a.passed_at).forEach((a) => out.push(one.passed(a, cat)));
  if (!off['Lifetime Payouts']) lifeCerts(uid, paid).forEach((x) => out.push(one.life(x, uid)));
  if (!off.Competition) { const W = await compWinners(); let info = null;
    for (const [cid, ws] of Object.entries(W)) for (const w of (Array.isArray(ws) ? ws : [])) if (w && w.uid === uid && w.pos) { info = info || await compInfo(); out.push(one.comp(w, cid, info.by.get(cid), await info.ofFor(cid, w))); } }
  return out.map((c) => finish(c, user)).sort((a, b) => (b.ts || new Date(b.when || 0).getTime()) - (a.ts || new Date(a.when || 0).getTime()));
}
// Every competition certificate there is (Back Office list)
async function compAll() {
  const W = await compWinners(); const out = []; const info = await compInfo(); const ids = [...new Set([].concat(...Object.values(W).map((ws) => (Array.isArray(ws) ? ws : []).map((w) => w && w.uid))).filter(Boolean))];
  const users = new Map((ids.length ? await db.all('SELECT id, first, last, settings FROM users WHERE id = ANY($1)', [ids]) : []).map((u) => [u.id, u]));
  for (const [cid, ws] of Object.entries(W)) for (const w of (Array.isArray(ws) ? ws : [])) if (w && w.pos && users.has(w.uid)) { const u = users.get(w.uid); out.push(Object.assign(finish(one.comp(w, cid, info.by.get(cid), await info.ofFor(cid, w)), u), { staffName: `${u.first} ${u.last || ''}`.trim() })); }
  return out;
}

// Find one by its public ID. The letter after CF- says where to look.
async function find(id) {
  id = clean(id, 40); if (!/^CF-[OFPLC][A-Za-z0-9_-]{1,34}$/.test(id)) return null; const off = await certOff(); const t = id.charAt(3); let c = null; let uid = null;
  if (t === 'O' && !off.Payout) { for (const p of await db.all("SELECT p.code, p.amount, p.paid_at, p.user_id, a.size FROM payouts p LEFT JOIN accounts a ON a.id=p.account_id WHERE p.status='paid'")) if (certId('o' + p.code) === id) { c = one.payout(p); break; } }
  else if (t === 'F' && !off.Funded) { for (const a of await db.all("SELECT id, user_id, size, kind, plan, comp, funded_at FROM accounts WHERE kind='funded' AND funded_at IS NOT NULL")) if (certId('f' + a.id) === id) { c = one.funded(a); break; } }
  else if (t === 'P' && !off.Passed) { for (const a of await db.all('SELECT id, user_id, size, kind, plan, comp, passed_at FROM accounts WHERE passed_at IS NOT NULL')) if (certId('p' + a.id) === id) { c = one.passed(a, await require('./core').catalog().catch(() => null)); break; } }
  else if (t === 'L' && !off['Lifetime Payouts']) { const m = /^CF-L(\d+)-(\d+)$/.exec(id); uid = m ? +m[1] : null;
    if (uid) { const hit = lifeCerts(uid, await db.all("SELECT amount, paid_at FROM payouts WHERE status='paid' AND user_id=$1", [uid])).find((x) => x.id === id); if (hit) c = one.life(hit, uid); } }
  else if (t === 'C' && !off.Competition) { const p = compCertParse(id); const w = p && ((await compWinners())[p.comp] || []).find((x) => x && x.pos === p.pos);
    if (w && compCertId(p.comp, w.pos) === id) { const info = await compInfo(); c = one.comp(w, p.comp, info.by.get(p.comp), await info.ofFor(p.comp, w)); } }
  if (!c) return null; const u = await db.one('SELECT id, first, last, settings FROM users WHERE id=$1', [c.user]); if (!u) return null;
  return finish(c, u);
}
// A link made before certificate IDs were unique (CF- and five digits): it still opens when only one certificate ever had that number
async function findOld(id) {
  id = clean(id, 20); if (!/^CF-\d{5}$/.test(id)) return null; const hits = [];
  for (const p of await db.all("SELECT code FROM payouts WHERE status='paid'")) if (certIdOld('o' + p.code) === id) hits.push(certId('o' + p.code));
  for (const a of await db.all('SELECT id, kind, funded_at, passed_at FROM accounts WHERE funded_at IS NOT NULL OR passed_at IS NOT NULL')) {
    if (a.kind === 'funded' && a.funded_at && certIdOld('f' + a.id) === id) hits.push(certId('f' + a.id));
    if (a.passed_at && certIdOld('p' + a.id) === id) hits.push(certId('p' + a.id));
  }
  return hits.length === 1 ? find(hits[0]) : null;
}
const revoked = async () => { const v = ((await db.one("SELECT v FROM kv WHERE k='store.rewards.revoked'").catch(() => null)) || {}).v; return Array.isArray(v) ? v : []; };

// ---------- the public page ----------
const e = CERT.esc;
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@100..125,400..800&family=Instrument+Serif:ital@1&family=Geist+Mono:wght@400;500&display=swap">';
const PAGE_CSS = `html,body{margin:0;background:#050608;color:#F4F2F1}body{min-height:100vh;font-family:"Mona Sans",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}*{box-sizing:border-box}
a{color:#7CC4FF}.cp{max-width:1120px;margin:0 auto;padding:22px 24px 56px}.cp-top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:26px}
.cp-lg{font-weight:700;font-size:20px;letter-spacing:-.04em;color:#F4F2F1;text-decoration:none}.cp-lg i{font-style:normal;font-size:13px;font-weight:600;letter-spacing:0;background:#7CC4FF;color:#08080A;border-radius:4px;padding:1px 6px;margin-left:6px}
.cp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:10px;border:1px solid #2E2E34;background:#141417;color:#F4F2F1;font:600 14.5px "Mona Sans",system-ui,sans-serif;text-decoration:none;cursor:pointer;white-space:nowrap}
.cp-btn:hover{border-color:#4A4A52}.cp-btn.pri{background:#7CC4FF;border-color:#7CC4FF;color:#08080A}.cp-btn.pri:hover{background:#9BD3FF}.cp-btn:focus-visible,.cp a:focus-visible{outline:2px solid #7CC4FF;outline-offset:2px}
.cp-cert{width:100%;max-width:min(1072px,calc((100vh - 150px) * 1.4144));min-width:min(100%,560px);margin:0 auto}
.cp-ver{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px 10px;margin:34px 0 0;font-size:16px;font-weight:600;text-align:center}.cp-ver svg{width:20px;height:20px;flex:none}
.cp-ver span{font-weight:500;color:#B9B4B1}.cp-ver .m{font-family:"Geist Mono",ui-monospace,Menlo,monospace;font-size:14.5px;overflow-wrap:anywhere}
.cp-what{max-width:640px;margin:12px auto 0;text-align:center;color:#B9B4B1;font-size:15px;line-height:1.6}
.cp-act{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin:26px 0 0}
.cp-sh{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:2px 6px;margin:18px 0 0;font-size:14.5px;color:#9C9693}.cp-sh a{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0 10px;font-weight:600}
.cp-no{max-width:520px;margin:12vh auto 0;text-align:center}.cp-no h1{font-size:28px;letter-spacing:-.02em;margin:0 0 12px}.cp-no p{color:#B9B4B1;font-size:15.5px;line-height:1.6;margin:0 0 24px}.cp-no .m{font-family:"Geist Mono",ui-monospace,Menlo,monospace;font-size:13.5px;color:#9C9693;overflow-wrap:anywhere}
.cp-foot{margin:44px auto 0;max-width:640px;text-align:center;color:#8F8985;font-size:12.5px;line-height:1.6}
@media (max-width:600px){.cp{padding:16px 14px 40px}.cp-top{margin-bottom:18px}.cp-cert{min-width:0}.cp-ver{margin-top:24px;font-size:15px}.cp-act .cp-btn{flex:1 1 100%}.cp-top .cp-btn{min-height:40px;padding:0 14px;font-size:13.5px}}
@media (max-width:380px){.cp-top{gap:8px}.cp-lg{font-size:16px}.cp-top .cp-btn{padding:0 8px;font-size:12px}}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@page{size:landscape;margin:8mm}
@media print{html,body{background:#fff!important}body{min-height:0}.cp{max-width:none;padding:0;margin:0}.cp>*:not(.cp-cert){display:none!important}
.cp-cert{max-width:min(100%,calc(100vh * 1.4144));min-width:0;margin:0 auto;break-inside:avoid}.fsc,.fsc *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.fsc .fsc-pg{box-shadow:none!important}.fsc .fsc-glint,.fsc .fsc-holo{animation:none!important}
/* PDF writers draw gradient-filled text with a hairline box around it, so the printed name is plain white */
.fsc .fsc-nm{background:none!important;-webkit-background-clip:border-box!important;background-clip:border-box!important;color:#fff!important;-webkit-text-fill-color:#fff}}`;
const OK_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#5FD39B"/><path d="M5.6 10.4l2.9 2.9 5.9-6.4" fill="none" stroke="#08080A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// One sentence for search results and link previews, the same words the certificate carries
const sentence = (c) => { const K2 = CERT.KIND[c.d.kind] || CERT.KIND.passed; return `${c.d.first} ${K2.line(c.d)}`; };
const headline = (c) => { const K2 = CERT.KIND[c.d.kind] || CERT.KIND.passed; return typeof K2.title === 'function' ? K2.title(c.d) : K2.title; };

async function page(req, res) {
  const asked = clean(req.params.id, 60); const c = await find(asked).then((x) => x || findOld(asked)).catch(() => null); const rev = await revoked();
  if (c) db.q("INSERT INTO kv(k,v) VALUES('certviews', jsonb_build_object($1::text, 1)) ON CONFLICT (k) DO UPDATE SET v = kv.v || jsonb_build_object($1::text, COALESCE((kv.v->>$1)::int,0)+1)", [c.id]).catch(() => {});
  const gone = !!c && rev.includes(c.id); const ok = !!c && !gone; const base = require('./auth').BASE(); const url = base + '/cert/' + encodeURIComponent(c ? c.id : asked);
  const top = `<div class="cp-top"><a class="cp-lg" href="/" aria-label="Funded Sky home">fundedsky<i>futures</i></a><a class="cp-btn" href="/checkout" aria-label="Start Your Evaluation">Start <span>Your </span>Evaluation</a></div>`;
  const head = (title, desc, extra) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>${e(title)}</title><meta name="description" content="${e(desc)}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Funded Sky"><meta name="twitter:card" content="summary">${extra || ''}<link rel="icon" href="/static/favicon.svg" type="image/svg+xml"><meta name="theme-color" content="#050608">${FONTS}`;
  res.setHeader('Cache-Control', 'no-store');
  if (!ok) {
    // Not found: 404. Revoked: 410 (it existed and was taken back). Nothing about the trader is shown either way.
    const PO = require('./policy');
    return res.status(gone ? 410 : 404).send(PO.page({ req, title: gone ? 'Certificate No Longer Valid' : 'Certificate Not Found', css: '.m{font-family:"Geist Mono",ui-monospace,Menlo,monospace;font-size:.92em;color:var(--hd);overflow-wrap:anywhere}', body: gone ? '<p>This certificate is no longer valid. Funded Sky took it back, so it no longer confirms a result.</p>' : `<p>No certificate has the ID <span class="m">${e(asked)}</span>. Check the ID and try again.</p>` }).replace('<head>', '<head><meta name="robots" content="noindex">'));
  }
  const ttl = headline(c); const title = `${c.d.name} · ${ttl} · Funded Sky Certificate`; const desc = `${sentence(c)} Verified by Funded Sky, certificate ${c.id}, issued ${c.date}.`;
  const say = `${ttl} at Funded Sky: ${sentence(c)}`; const U = encodeURIComponent(url); const T = encodeURIComponent(say);
  const links = [['X', `https://x.com/intent/post?text=${T}&url=${U}`], ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${U}`], ['WhatsApp', `https://wa.me/?text=${encodeURIComponent(say + ' ' + url)}`], ['Telegram', `https://t.me/share/url?url=${U}&text=${T}`]];
  res.status(200).send(`${head(title, desc, `<meta property="og:url" content="${e(url)}"><link rel="canonical" href="${e(url)}">`)}<style>${PAGE_CSS}${CERT.CSS}</style></head>
<body><main class="cp">${top}<div class="cp-cert">${CERT.render(c.d, 'pub')}</div>
<h1 class="cp-ver">${OK_ICON}Verified by Funded Sky<span class="m">${e(c.id)}</span><span>Issued ${e(c.date)}</span></h1>
<p class="cp-what">Funded Sky issued this certificate to ${e(c.d.name)} for a result on a simulated trading account. This page is the proof: if the certificate you were shown matches what you see here, it is real.</p>
<div class="cp-act"><button class="cp-btn" type="button" id="cp-copy" data-url="${e(url)}">Copy Link</button><button class="cp-btn" type="button" id="cp-print">Save as PDF / Print</button><a class="cp-btn pri" href="/checkout">Start Your Evaluation</a></div>
<div class="cp-sh"><span>Share:</span>${links.map(([n, h2]) => `<a href="${e(h2)}" target="_blank" rel="noopener noreferrer">${n}</a>`).join('')}</div>
<p class="cp-foot">Results are from simulated trading accounts. Funded Sky pays performance rewards based on simulated results. Past results do not guarantee future results.</p></main>
<script>(function(){var b=document.getElementById('cp-copy'),t;function done(ok){b.textContent=ok?'Link Copied':'Press Ctrl+C to Copy';clearTimeout(t);t=setTimeout(function(){b.textContent='Copy Link'},2400)}
function old(u){var i=document.createElement('input');i.value=u;i.setAttribute('readonly','');i.style.cssText='position:fixed;opacity:0;left:0;top:0';document.body.appendChild(i);i.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}i.remove();return ok}
b.addEventListener('click',function(){var u=b.getAttribute('data-url');var p;try{p=navigator.clipboard.writeText(u)}catch(e){p=null}if(p&&p.then)p.then(function(){done(true)},function(){done(old(u))});else done(old(u))});
document.getElementById('cp-print').addEventListener('click',function(){window.print()});
if(/[?&]print=1(&|$)/.test(location.search)){var go=function(){setTimeout(function(){window.print()},350)};if(document.fonts&&document.fonts.ready)document.fonts.ready.then(go,go);else addEventListener('load',go)}})();</script></body></html>`);
}

module.exports = { host, certId, certIdOld, compCertId, certOff, LIFE, lifeCerts, nameOf, forUser, compAll, find, findOld, revoked, page, CERT };
