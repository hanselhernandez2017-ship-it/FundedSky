// Automated emails and housekeeping. Each email goes once per account or trader (auto_sent), whether or not an email
// provider is connected: without one they are logged in the outbox and go out once Resend is set up.
const db = require('./db');
const core = require('./core');
const R = require('./rules');
const mail = require('./mail');
const { money } = require('./util');
const BASE = () => require('./auth').BASE();
async function once(key) { const r = await db.one('INSERT INTO auto_sent(key) VALUES($1) ON CONFLICT DO NOTHING RETURNING key', [key]); return !!r; }
const K = (s) => '$' + Number(s) / 1000 + 'K';
async function run() {
  const cat = await core.catalog(); const out = {};
  const hit = (k) => { out[k] = (out[k] || 0) + 1; };
  try { const n = await require('./support').autoClose(); if (n) out.ticketsClosed = n; } catch (e) { console.error('autoClose', e.message); }
  const acc = await db.all("SELECT a.*, u.email, u.first, u.status FROM accounts a JOIN users u ON u.id=a.user_id WHERE u.email NOT LIKE '%@demo.fundedsky.test' AND a.phase IN ('active','passed','breached','review')");
  for (const a of acc) {
    if (a.status === 'banned') continue;
    const url = BASE() + '/app#account?acct=' + a.id; const r = R.rulesFor(cat, a); const profit = Number(a.balance) - Number(a.start_bal);
    if (a.kind === 'evaluation' && a.phase === 'active') {
      if (profit >= r.target / 2 && profit < r.target && await once('halfway:' + a.id)) { mail.t('halfway', a.user_id, { account: a.id, size: K(a.size), profit: money(profit), target: money(r.target), profit_n: String(Math.round(profit)), target_n: String(r.target), url }); hit('halfway'); }
      if (profit >= r.target && a.days_traded < r.minDays && await once('target:' + a.id)) { mail.t('target', a.user_id, { account: a.id, size: K(a.size), days: String(r.minDays - a.days_traded), days_n: String(a.days_traded), min_days: String(r.minDays), url }); hit('target'); }
      if (profit >= r.target && Number(a.best_day) > (r.consistency / 100) * profit && await once('consistency:' + a.id)) { mail.t('consistency', a.user_id, { account: a.id, size: K(a.size), what: 'pass', share_n: String(Math.round(Number(a.best_day) / profit * 100)), limit: r.consistency + '%', url }); hit('consistency'); }
      const traded = await db.one('SELECT 1 FROM trades WHERE account_id=$1 LIMIT 1', [a.id]);
      if (!traded && new Date(a.created_at) < new Date(Date.now() - 24 * 3600e3) && new Date(a.created_at) > new Date(Date.now() - 7 * 86400e3) && await once('firstday:' + a.id)) { mail.t('firstday', a.user_id, { account: a.id, size: K(a.size), platform: a.platform, url }); hit('firstday'); }
    }
    if (a.kind === 'funded' && a.phase === 'active') {
      if (a.funded_at && new Date(a.funded_at) > new Date(Date.now() - 7 * 86400e3) && await once('certificate:' + a.id)) { mail.t('certificate', a.user_id, { account: a.id, size: K(a.size), url: BASE() + '/app#rewards?tab=certs' }); hit('certificate'); }
      { const cp = Number(a.balance) - Number(a.cycle_profit_start || a.start_bal); if (cp > 0 && (a.cycle_win_days || 0) >= (r.winDays || 5) && Number(a.cycle_best) > (r.consistency / 100) * cp && await once('fconsistency:' + a.id + ':' + (a.payout_count || 0))) { mail.t('consistency', a.user_id, { account: a.id, size: K(a.size), what: 'request a payout', share_n: String(Math.round(Number(a.cycle_best) / cp * 100)), limit: r.consistency + '%', url }); hit('consistency'); } }
      if (!(a.payout_count > 0)) { const pend = await db.one("SELECT 1 FROM payouts WHERE account_id=$1 AND status IN ('requested','approved')", [a.id]); const q = R.payoutQuote(cat, a, { pending: !!pend }); if (q.ok && await once('eligible:' + a.id)) { mail.t('eligible', a.user_id, { account: a.id, amount: money(q.max), split: q.split + '%', url: BASE() + '/app#payouts' }); hit('eligible'); } }
    }
    if (a.kind === 'evaluation' && a.phase === 'breached' && a.breached_at) {
      const since = Date.now() - new Date(a.breached_at);
      if (since < 3 * 86400e3 && await once('resetoffer:' + a.id)) { const s = core.sizeDef(cat, a.plan, a.size); const price = s ? (s.reset ? Number(s.reset) : Math.round(core.priceOf(s) * cat.resetPct / 100)) : 0; mail.t('resetoffer', a.user_id, { account: a.id, size: K(a.size), price: money(price), url: BASE() + '/reset?acct=' + a.id }); hit('resetoffer'); }
      if (since > 7 * 86400e3) { const after = await db.one("SELECT 1 FROM orders WHERE user_id=$1 AND status='paid' AND paid_at > $2", [a.user_id, a.breached_at]); const active = await db.one("SELECT 1 FROM accounts WHERE user_id=$1 AND phase='active'", [a.user_id]);
        if (!after && !active && await once('winback:' + a.user_id)) { mail.t('winback', a.user_id, { url: BASE() + '/checkout' }); hit('winback'); } }
    }
  }
  // payouts: certificate when paid, review ask two days after the first one
  for (const p of await db.all("SELECT p.*, a.size FROM payouts p JOIN accounts a ON a.id=p.account_id WHERE p.status='paid' AND p.paid_at > now() - interval '30 days'")) {
    if (await once('paycert:' + p.code)) { mail.t('paycert', p.user_id, { amount: money(p.amount), code: p.code, url: BASE() + '/app#rewards?tab=certs' }); hit('paycert'); }
    const first = await db.one("SELECT code FROM payouts WHERE user_id=$1 AND status='paid' ORDER BY paid_at LIMIT 1", [p.user_id]);
    if (first && first.code === p.code && new Date(p.paid_at) < new Date(Date.now() - 2 * 86400e3) && await once('reviewask:' + p.user_id)) { mail.t('reviewask', p.user_id, { amount: money(p.amount), url: BASE() + '/app#rewards' }); hit('reviewask'); }
  }
  // first purchase
  for (const o of await db.all("SELECT DISTINCT ON (user_id) user_id, code, total FROM orders WHERE status='paid' AND paid_at > now() - interval '7 days' ORDER BY user_id, paid_at")) {
    const n = (await db.one("SELECT count(*)::int n FROM orders WHERE user_id=$1 AND status='paid'", [o.user_id])).n;
    if (n >= 1 && await once('firstbuy:' + o.user_id)) { mail.t('firstbuy', o.user_id, { order: o.code, url: BASE() + '/app' }); hit('firstbuy'); }
  }
  // abandoned checkout: a reminder with a one-time code, then a last call before it ends
  const rec = Object.assign({ on: true, delay: 2, pct: 10, expiry: 48, oneTime: true, firstOnly: true }, (cat.x || {}).recovery || {});
  if (rec.on) {
    const left = await db.all(`SELECT o.*, u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.status='pending' AND o.kind IN ('evaluation','instant','mixed')
      AND o.created_at < now() - ($1 || ' hours')::interval AND o.created_at > now() - interval '7 days' AND u.email NOT LIKE '%@demo.fundedsky.test'
      AND NOT EXISTS (SELECT 1 FROM orders p WHERE p.user_id=o.user_id AND p.status='paid' AND p.created_at > o.created_at)`, [String(+rec.delay || 2)]);
    for (const o of left) {
      if (rec.firstOnly && (await db.one("SELECT 1 FROM orders WHERE user_id=$1 AND status='paid'", [o.user_id]))) continue;
      const it = (o.items || [])[0] || {};
      if (await once('abandon1:' + o.user_id + ':' + (rec.oneTime ? 'x' : o.code))) {
        const code = 'BACK-' + Math.random().toString(36).slice(2, 7).toUpperCase();
        await db.q("INSERT INTO coupons(code,user_id,pct,label,kind,expires_at) VALUES($1,$2,$3,$4,'discount', now() + ($5 || ' hours')::interval)", [code, o.user_id, +rec.pct || 10, `Checkout reminder: ${+rec.pct || 10}% off`, String(+rec.expiry || 48)]);
        mail.t('abandon1', o.user_id, { size: it.size ? K(it.size) : 'evaluation', plan: ((core.planDef(cat, it.plan) || {}).short) || '', platform: it.platform || '', price: money(Number(o.total) * (1 - (+rec.pct || 10) / 100)), code, pct: (+rec.pct || 10) + '%', hours: String(+rec.expiry || 48), url: BASE() + '/checkout/payment?order=' + o.code }); hit('abandon1');
      } else {
        const c = await db.one("SELECT * FROM coupons WHERE user_id=$1 AND used=false AND label LIKE 'Checkout reminder%' AND expires_at > now() ORDER BY created_at DESC LIMIT 1", [o.user_id]);
        if (c && new Date(c.expires_at) - Date.now() < 12 * 3600e3 && await once('abandon2:' + c.code)) { mail.t('abandon2', o.user_id, { code: c.code, pct: Number(c.pct) + '%', full: money(o.total), url: BASE() + '/checkout/payment?order=' + o.code }); hit('abandon2'); }
      }
    }
  }
  // points expire after 12 months without a purchase, payout or other activity
  const stale = await db.all(`SELECT u.id, u.points FROM users u WHERE u.points > 0 AND u.created_at < now() - interval '12 months'
    AND NOT EXISTS (SELECT 1 FROM points_log l WHERE l.user_id=u.id AND l.created_at > now() - interval '12 months' AND l.delta > 0)
    AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id=u.id AND o.status='paid' AND o.paid_at > now() - interval '12 months')`);
  for (const u of stale) { await core.points(null, u.id, -u.points, 'Points expired after 12 months without activity'); await core.notify(null, u.id, 'Your points expired', `${u.points.toLocaleString('en-US')} points expired after 12 months without activity.`, 'rewards'); hit('pointsExpired'); }
  return out;
}
function start() { setTimeout(() => run().catch((e) => console.error('automations', e.message)), 20000); setInterval(() => run().catch((e) => console.error('automations', e.message)), 15 * 60 * 1000).unref(); }
module.exports = { run, start };
