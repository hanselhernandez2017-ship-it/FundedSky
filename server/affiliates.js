// Affiliate program: approved affiliates (list.affiliates) get a code that gives buyers the tier's discount and
// attributes them, and they earn cash commission on referred buyers' paid orders instead of referral points.
const db = require('./db');
const TIERS0 = [['Bronze', 'Starting tier', '10%', '5%', '$0'], ['Silver', '100+ sales in 90 days', '12%', '8%', '$0'], ['Gold', '250+ sales in 90 days', '15%', '10%', '$250 a month']];
const kv = async (k) => ((await db.one('SELECT v FROM kv WHERE k=$1', [k])) || {}).v;
const pct = (s) => parseFloat(String(s || '0').replace(/[^0-9.]/g, '')) || 0;
async function settings() { return Object.assign({ hold30: true, selfRef: true, minPayout: 100 }, (await kv('store.affiliates.settings')) || {}); }
async function tiers() { const t = (await kv('store.affiliates.tiers')) || TIERS0; return t.map((r) => ({ name: r[0], how: r[1], rate: pct(r[2]), disc: pct(r[3]), min: pct((String(r[1]).match(/(\d+)\+/) || [])[1]) })); }
async function list() { return ((await kv('list.affiliates')) || []).filter((x) => x && x.user && x.status !== 'declined'); }
// Effective tier: the assigned tier or a higher one earned by sales in the last 90 days
async function tierOf(x, T) {
  T = T || await tiers(); const assigned = T.findIndex((t) => t.name === (x.tier || 'Bronze'));
  const n = (await db.one("SELECT count(*)::int n FROM orders o JOIN users u ON u.id=o.user_id WHERE u.referred_by=$1 AND o.status='paid' AND o.paid_at > now() - interval '90 days'", [x.user])).n;
  let best = Math.max(0, assigned); T.forEach((t, i) => { if (t.min && n >= t.min && i > best) best = i; });
  const t = T[best] || T[0]; return Object.assign({}, t, { rate: x.rate ? Number(x.rate) : t.rate, sales90: n });
}
async function byUser(uid) { return (await list()).find((x) => x.user === uid && x.status === 'active') || null; }
async function byCode(code) { if (!code) return null; const c = String(code).toUpperCase(); return (await list()).find((x) => x.status === 'active' && String(x.code || '').toUpperCase() === c) || null; }
// Commission summary for an affiliate (same math as the back office)
async function summary(uid) {
  const x = (await list()).find((y) => y.user === uid); if (!x) return null;
  const st = await settings(); const t = await tierOf(x);
  const os = await db.all("SELECT o.total::float total, o.status, o.paid_at FROM orders o JOIN users u ON u.id=o.user_id WHERE u.referred_by=$1 AND o.status IN ('paid','refunded')", [uid]);
  const paid = os.filter((o) => o.status === 'paid'); const old = (o) => !st.hold30 || (Date.now() - new Date(o.paid_at)) > 30 * 86400000;
  const earned = paid.filter(old).reduce((s, o) => s + o.total * t.rate / 100, 0); const held = paid.filter((o) => !old(o)).reduce((s, o) => s + o.total * t.rate / 100, 0);
  const paidOut = ((await kv('store.affiliate.payments')) || []).filter((p) => p.user === uid).reduce((s, p) => s + Number(p.amount || 0), 0);
  const r2 = (v) => Math.round(v * 100) / 100;
  return { code: x.code, status: x.status, tier: t.name, rate: t.rate, disc: t.disc, sales: paid.length, sales90: t.sales90, revenue: r2(paid.reduce((s, o) => s + o.total, 0)), earned: r2(earned), held: r2(held), paid: r2(paidOut), owed: r2(Math.max(0, earned - paidOut)), minPayout: st.minPayout, tiers: await tiers() };
}
module.exports = { tiers, settings, list, byUser, byCode, tierOf, summary };
