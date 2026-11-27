// One-time, idempotent fixes to stored data for the Nov 27 copy decisions. Each step only changes values that still hold
// the old built-in wording, so anything staff rewrote is left alone, and running it again changes nothing.
const db = require('./db');
const kv = async (k) => ((await db.one('SELECT v FROM kv WHERE k=$1', [k])) || {}).v;
const put = (k, v) => db.q('UPDATE kv SET v=$2, updated_at=now() WHERE k=$1', [k, JSON.stringify(v)]);
async function run() {
  // Saved test card label: "Test Card •••• 4242" on receipts, billing and emails
  await db.q("UPDATE orders SET pay_method='Test Card •••• 4242' WHERE pay_method='Test card •••• 4242'");
  // News calendar casing, as in the seed ("All Day", "CME Early Close")
  { const n = await kv('content.news'); const seed = require('./content-seed.json').news; const ev = new Map(seed.map((r) => [String(r[2]).toLowerCase(), r[2]]));
    if (Array.isArray(n)) { let ch = false; const out = n.map((r) => { if (!Array.isArray(r)) return r; const x = r.slice(); if (/^all day$/i.test(String(x[1] || '').trim()) && x[1] !== 'All Day') { x[1] = 'All Day'; ch = true; } const s = ev.get(String(x[2] || '').toLowerCase()); if (s && s !== x[2]) { x[2] = s; ch = true; } return x; }); if (ch) await put('content.news', out); } }
  // Refund timing is 5 to 10 business days everywhere (stored help articles and a stored Refund Policy page)
  { const fix = (s) => String(s).replace(/\b3 to 5 business days\b/g, '5 to 10 business days');
    const a = await kv('content.articles'); if (Array.isArray(a)) { let ch = false; const out = a.map((x) => { if (Array.isArray(x) && /refund/i.test(String(x[1]) + String(x[0])) && /\b3 to 5 business days\b/.test(String(x[2]))) { ch = true; return [x[0], x[1], fix(x[2])].concat(x.slice(3)); } return x; }); if (ch) await put('content.articles', out); }
    const p = await kv('content.pages'); if (p && p['refund-policy'] && /\b3 to 5 business days\b/.test(String(p['refund-policy'].txt || ''))) { p['refund-policy'].txt = fix(p['refund-policy'].txt); await put('content.pages', p); } }
  // Two-person rules: Close and Reinstate are separate switches now. A site that had turned "close" off keeps reinstating without a second person.
  { const r = await kv('store.team.rules'); if (r && r.close === false && !('reinstate' in r)) { r.reinstate = false; await put('store.team.rules', r); } }
}
module.exports = { run };
