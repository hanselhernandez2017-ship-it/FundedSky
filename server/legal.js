// Legal documents and re-acceptance. Compliance > Legal Documents records new versions (list.docs). When a new version
// is marked "ask again" and the re-accept switch is on, traders must accept it before they can buy or request payouts.
const db = require('./db');
const DOCS = [
  ['terms', 'Terms of Service', '/terms', 'all'], ['privacy', 'Privacy Policy', '/privacy', 'all'], ['risk', 'Risk Disclosure', '/terms', 'all'],
  ['refund', 'Refund Policy', '/refund-policy', 'all'], ['funded', 'Funded Trader Agreement', '/rules', 'funded'], ['affiliate', 'Affiliate Terms', '/terms', 'affiliate']
];
const kv = async (k) => ((await db.one('SELECT v FROM kv WHERE k=$1', [k])) || {}).v;
async function versions() { const L = (await kv('list.docs')) || []; return DOCS.map(([key, name, url, who]) => { const d = L.find((x) => x.n === name) || {}; return { key, name, url: d.url || url, who, v: d.v || '1.0', at: d.at || null, ask: d.ask !== undefined ? !!d.ask : !['refund', 'risk'].includes(key) }; }); }
// Documents this trader still has to accept
async function pending(user) {
  const set = (await kv('store.compliance.settings')) || {}; if (set.reaccept === false) return [];
  const ag = user.agreements || {}; const out = [];
  const funded = (await db.one("SELECT 1 FROM accounts WHERE user_id=$1 AND kind='funded' LIMIT 1", [user.id])); const aff = ((await kv('list.affiliates')) || []).some((x) => x.user === user.id && x.status === 'active');
  for (const d of await versions()) {
    if (!d.ask || !d.at || d.v === '1.0') continue; if (d.who === 'funded' && !funded) continue; if (d.who === 'affiliate' && !aff) continue;
    if (!ag[d.key] || new Date(ag[d.key]) < new Date(d.at)) out.push({ key: d.key, name: d.name, v: d.v, url: d.url });
  }
  return out;
}
async function accept(user, keys) { const p = await pending(user); const now = new Date().toISOString(); const set = {}; for (const d of p) if (!keys || keys.includes(d.key)) set[d.key] = now;
  if (Object.keys(set).length) await db.q('UPDATE users SET agreements = COALESCE(agreements, \'{}\'::jsonb) || $2 WHERE id=$1', [user.id, JSON.stringify(set)]); return { accepted: Object.keys(set) }; }
// Express guard for buying and payouts
const guard = async (req, res, next) => { try { if (!req.user) return next(); const p = await pending(req.user); if (!p.length) return next(); res.status(403).json({ error: `Accept the updated ${p.map((d) => d.name).join(' and ')} first. It's on your dashboard.`, reaccept: p }); } catch (e) { next(e); } };
module.exports = { versions, pending, accept, guard, DOCS };
