// Core services: catalog, pricing, orders, accounts, payouts, notifications, points.
const db = require('./db');
const R = require('./rules');
const { round2, bad, money, tradeDate } = require('./util');

let CAT = null, CAT_AT = 0;
async function catalog(force) {
  if (!force && CAT && Date.now() - CAT_AT < 15000) return CAT;
  const row = await db.one('SELECT data FROM catalog WHERE id=1');
  CAT = row.data; CAT_AT = Date.now(); return CAT;
}
async function saveCatalog(data, by) {
  await db.q('UPDATE catalog SET data=$1, updated_by=$2, updated_at=now() WHERE id=1', [data, by || null]);
  CAT = data; CAT_AT = Date.now();
}
const planDef = (cat, id) => cat.plans.find((p) => p.id === id);
const sizeDef = (cat, pid, size) => { const p = planDef(cat, pid); return p && p.sizes.find((s) => s.size === Number(size)); };
const kLabel = (s) => '$' + s / 1000 + 'K';

function promoFor(cat, code, planId, now = new Date()) {
  if (!code) return null;
  const p = (cat.promos || []).find((x) => x.code.toUpperCase() === String(code).toUpperCase() && x.active);
  if (!p) return null;
  const d = now.toISOString().slice(0, 10);
  if ((p.starts && d < p.starts) || (p.ends && d > p.ends)) return null;
  if (planId && p.plans && p.plans.length && !p.plans.includes(planId)) return { ...p, applies: false };
  return { ...p, applies: true };
}

// Price a cart. items: [{plan,size,platform,addons:[...],qty}]
async function priceCart(items, { promo, coupon, userId } = {}) {
  const cat = await catalog();
  if (!Array.isArray(items) || !items.length) bad('Your cart is empty');
  if (items.length > 10) bad('Too many accounts in one order');
  const lines = []; let subtotal = 0; let promoDisc = 0; const norm = [];
  const promoRow = promo ? (cat.promos || []).find((x) => x.code.toUpperCase() === String(promo).toUpperCase() && x.active) : null;
  if (promo && !promoRow) bad('That promo code is not valid');
  let count = 0;
  for (const it of items) {
    const p = planDef(cat, it.plan); if (!p || !p.active) bad('Unknown plan');
    const s = sizeDef(cat, it.plan, it.size); if (!s) bad('That size is not offered on the ' + p.name);
    const qty = Math.max(1, Math.min(5, parseInt(it.qty, 10) || 1));
    const platform = p.platforms.includes(it.platform) ? it.platform : p.platforms[0];
    const addons = (it.addons || []).filter((x) => p.addons.includes(x));
    const base = s.price * qty; subtotal += base; count += qty;
    lines.push({ label: `${p.short} ${kLabel(s.size)}${qty > 1 ? ' × ' + qty : ''}`, amount: base, kind: 'plan' });
    for (const ad of addons) {
      const a = cat.addons[ad]; const amt = round2(Math.round(s.price * a.pct / 100) * qty);
      subtotal += amt; lines.push({ label: `${a.name}${qty > 1 ? ' × ' + qty : ''}`, amount: amt, kind: 'addon' });
    }
    const pr = promoRow && promoFor(cat, promoRow.code, p.id);
    if (pr && pr.applies) promoDisc += round2(base * Math.min(pr.pct, cat.maxPromoPct || 100) / 100);
    norm.push({ plan: p.id, size: s.size, platform, addons, qty, unit: s.price });
  }
  if (promoRow && promoDisc === 0) bad('That code does not apply to the plans in your cart');
  // Bundle discount (not combined with a promo code: the larger one wins)
  let bundle = null; let bundleDisc = 0;
  for (const b of (cat.bundles || [])) if (count >= b.min && (!bundle || b.pct > bundle.pct)) bundle = b;
  if (bundle) bundleDisc = round2(lines.filter((l) => l.kind === 'plan').reduce((s, l) => s + l.amount, 0) * bundle.pct / 100);
  // Referral: 10% off a referred trader's first order
  let refDisc = 0;
  if (userId) { const u = await db.one("SELECT referred_by, (SELECT count(*)::int FROM orders WHERE user_id=$1 AND status='paid') n FROM users WHERE id=$1", [userId]); if (u && u.referred_by && u.n === 0) refDisc = round2(lines.filter((l) => l.kind === 'plan').reduce((s, l) => s + l.amount, 0) * 0.10); }
  let discount = 0; let applied = null;
  if (refDisc > promoDisc && refDisc > bundleDisc) { discount = refDisc; applied = { type: 'referral', label: 'Friend referral: 10% off your first order' }; }
  else if (promoDisc >= bundleDisc && promoDisc > 0) { discount = promoDisc; applied = { type: 'promo', code: promoRow.code, label: `${promoRow.name}: ${promoRow.pct}% off` }; }
  else if (bundleDisc > 0) { discount = bundleDisc; applied = { type: 'bundle', label: `${bundle.buy}: ${bundle.pct}% off` }; }
  if (applied) lines.push({ label: applied.label, amount: -discount, kind: 'discount' });
  // Reward coupon
  if (coupon) {
    const c = await db.one('SELECT * FROM coupons WHERE code=$1 AND user_id=$2 AND used=false', [coupon, userId || 0]);
    if (!c) bad('That reward code is not valid');
    if (c.kind === 'discount') { const d = round2((subtotal - discount) * Number(c.pct) / 100); discount += d; lines.push({ label: c.label, amount: -d, kind: 'coupon' }); }
    if (c.kind === 'free_eval') { const first = norm[0]; if (first.size !== 25000) bad('This reward is for a $25K account'); discount += first.unit; lines.push({ label: c.label, amount: -first.unit, kind: 'coupon' }); }
    applied = { ...(applied || {}), coupon: c.code };
  }
  const total = Math.max(0, round2(subtotal - discount));
  return { items: norm, lines, subtotal: round2(subtotal), discount: round2(discount), total, applied, promo: promoRow ? promoRow.code : null, coupon: coupon || null };
}

const ordCode = async (c) => 'FS-ORD-' + (await (c || db).one("SELECT nextval('seq_order') AS n")).n;
async function newAccountId(c, size) {
  for (;;) { const id = `FS-${size / 1000}K-${String(1000 + Math.floor(Math.random() * 9000))}`; if (!(await c.one('SELECT 1 FROM accounts WHERE id=$1', [id]))) return id; }
}
function simTraits(kind) {
  // Trader "skill" for the simulated feed. Tuned so roughly 15% of evaluations pass.
  const g = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  // Evaluations: about 15% pass. Funded: a fresh draw, about 30% reach a payout (published industry rates).
  const sk = kind === 'funded' ? -0.06 + g() * 0.2 : -0.14 + g() * 0.18;
  return { skill: round2(sk), vol: round2(0.75 + Math.random() * 0.5), activity: round2(0.6 + Math.random() * 0.35), seed: Math.floor(Math.random() * 1e9) };
}
async function createAccount(c, { userId, orderId, plan, size, platform, addons, kind, parentId }) {
  const cat = await catalog();
  const k = kind || (plan === 'instant' ? 'funded' : 'evaluation');
  const id = await newAccountId(c, size);
  const st = R.initialState(cat, { plan, size, kind: k });
  const freeResets = (addons || []).includes('reset') ? 1 : 0;
  await c.q(`INSERT INTO accounts(id,user_id,order_id,parent_id,plan,size,platform,kind,phase,start_bal,balance,peak_eod,floor,cycle_profit_start,addons,free_resets,today_date,sim,funded_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,'active',$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
  [id, userId, orderId || null, parentId || null, plan, size, platform || 'Tradovate', k, st.start_bal, st.balance, st.peak_eod, st.floor, st.cycle_profit_start, JSON.stringify(addons || []), freeResets, tradeDate(), simTraits(k), k === 'funded' ? new Date() : null]);
  return id;
}

async function notify(c, userId, title, body, go = 'accounts') {
  await (c || db).q('INSERT INTO notifications(user_id,title,body,go) VALUES($1,$2,$3,$4)', [userId, title, body, go]);
}
async function points(c, userId, delta, label) {
  if (!delta) return;
  await (c || db).q('INSERT INTO points_log(user_id,label,delta) VALUES($1,$2,$3)', [userId, label, delta]);
  await (c || db).q('UPDATE users SET points=points+$1 WHERE id=$2', [delta, userId]);
}
async function audit(actorId, action, target, meta) {
  await db.q('INSERT INTO audit(actor_id,action,target,meta) VALUES($1,$2,$3,$4)', [actorId || null, action, target || '', meta || {}]);
}

// Fulfil a paid order (idempotent)
async function fulfilOrder(orderId) {
  return db.tx(async (c) => {
    const o = await c.one('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [orderId]);
    if (!o || o.meta.fulfilled) return o;
    const cat = await catalog(); const made = [];
    if (o.kind === 'evaluation' || o.kind === 'instant' || o.kind === 'mixed') {
      for (const it of o.items) for (let i = 0; i < it.qty; i++) {
        made.push(await createAccount(c, { userId: o.user_id, orderId: o.id, plan: it.plan, size: it.size, platform: it.platform, addons: it.addons }));
      }
      for (const id of made) await notify(c, o.user_id, `Your account ${id} is ready`, 'Log in to your platform and place your first trade. Your rules are on the account page.', 'account?acct=' + id);
    } else if (o.kind === 'reset') {
      await resetAccount(c, o.meta.account, o.user_id);
      made.push(o.meta.account);
    } else if (o.kind === 'activation') {
      made.push(await activateFunded(c, o.meta.account, o.user_id, o.id));
    }
    if (o.coupon || (o.meta && o.meta.coupon)) await c.q('UPDATE coupons SET used=true WHERE code=$1', [o.meta.coupon || o.coupon]);
    const pts = Math.floor(Number(o.total));
    await points(c, o.user_id, pts, o.kind === 'reset' ? 'Reset ' + o.meta.account : o.kind === 'activation' ? 'Activation fee' : 'Bought ' + o.items.map((x) => kLabel(x.size)).join(', ') + ' account' + (made.length > 1 ? 's' : ''));
    // referral reward on first purchase
    const u = await c.one('SELECT referred_by FROM users WHERE id=$1', [o.user_id]);
    if (u.referred_by && o.kind !== 'reset') {
      const prev = await c.one("SELECT count(*)::int n FROM orders WHERE user_id=$1 AND status='paid' AND id<>$2", [o.user_id, o.id]);
      if (prev.n === 0) { await points(c, u.referred_by, 1000, 'Friend bought an account'); await notify(c, u.referred_by, 'A friend you referred bought an account', 'You earned 1,000 points.', 'affiliates'); }
    }
    await c.q("UPDATE orders SET meta = meta || $2 WHERE id=$1", [o.id, JSON.stringify({ fulfilled: true, accounts: made })]);
    return { ...o, accounts: made };
  });
}

async function resetAccount(c, accountId, userId) {
  const a = await c.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE', [accountId, userId]);
  if (!a) bad('Account not found', 404);
  if (a.kind !== 'evaluation') bad('Only evaluations can be reset');
  const cat = await catalog(); const st = R.initialState(cat, a);
  await c.q(`UPDATE accounts SET phase='active', balance=$2, peak_eod=$3, floor=$4, today_pnl=0, halted_today=false, days_traded=0, best_day=0, breach_reason=NULL, breached_at=NULL, reset_count=reset_count+1, today_date=$5, steps='{}' WHERE id=$1`,
    [a.id, st.balance, st.peak_eod, st.floor, tradeDate()]);
  await c.q('DELETE FROM days WHERE account_id=$1', [a.id]);
  await c.q("UPDATE trades SET note='before reset' WHERE account_id=$1 AND note=''", [a.id]);
  await c.q('DELETE FROM trades WHERE account_id=$1', [a.id]);
  await notify(c, userId, `${a.id} has been reset`, 'Fresh balance, same rules. Good luck.', 'account?acct=' + a.id);
}

// Passed evaluation -> funded account (Prime after agreement; Essential after activation fee)
async function activateFunded(c, accountId, userId, orderId) {
  const a = await c.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE', [accountId, userId]);
  if (!a) bad('Account not found', 404);
  if (a.phase !== 'passed') bad('This account has not passed yet');
  const existing = await c.one('SELECT id FROM accounts WHERE parent_id=$1', [a.id]);
  if (existing) return existing.id;
  const id = await createAccount(c, { userId, orderId, plan: a.plan, size: a.size, platform: a.platform, addons: (a.addons || []).filter((x) => x === 'daily'), kind: 'funded', parentId: a.id });
  const steps = { ...(a.steps || {}), funded: new Date().toISOString(), ...(orderId ? { activation: new Date().toISOString() } : {}) };
  await c.q("UPDATE accounts SET phase='closed', closed_at=now(), steps=$2 WHERE id=$1", [a.id, steps]);
  await c.q('UPDATE accounts SET steps=$2 WHERE id=$1', [id, steps]);
  await notify(c, userId, `You're funded: ${id}`, `Your ${kLabel(a.size)} funded account is live. Payouts start after ${(await catalog()).fundedCommon.winDays} winning days.`, 'account?acct=' + id);
  return id;
}

async function signAgreement(userId, accountId) {
  return db.tx(async (c) => {
    const a = await c.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE', [accountId, userId]);
    if (!a || a.phase !== 'passed') bad('This account is not waiting for an agreement');
    const steps = { ...(a.steps || {}), agreement: new Date().toISOString() };
    await c.q('UPDATE accounts SET steps=$2 WHERE id=$1', [a.id, steps]);
    await c.q("UPDATE users SET agreements = agreements || $2 WHERE id=$1", [userId, JSON.stringify({ funded: new Date().toISOString() })]);
    const cat = await catalog(); const s = sizeDef(cat, a.plan, a.size);
    if (!s.activation) { const id = await activateFunded(c, a.id, userId, null); return { funded: id }; }
    return { activation: s.activation };
  });
}

async function requestPayout(userId, accountId, amount, methodId) {
  return db.tx(async (c) => {
    const cat = await catalog();
    const a = await c.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE', [accountId, userId]);
    if (!a) bad('Account not found', 404);
    const pending = await c.one("SELECT 1 FROM payouts WHERE account_id=$1 AND status IN ('requested','approved')", [a.id]);
    const qd = R.payoutQuote(cat, a, { pending: !!pending });
    if (!qd.ok) bad(qd.reasons[0]);
    const net = Math.floor(Number(amount) || qd.max);
    if (net < qd.payoutMin) bad(`The minimum payout is $${qd.payoutMin}`);
    if (net > qd.max) bad(`The most you can request right now is ${money(qd.max)}`);
    const m = await c.one('SELECT * FROM payout_methods WHERE id=$1 AND user_id=$2', [methodId, userId]);
    if (!m) bad('Add a payout method first');
    if (new Date(m.unlock_at) > new Date()) bad('This payout method is still in its 48-hour safety hold');
    const gross = round2(net / (qd.split / 100));
    const code = 'PO-' + (await c.one("SELECT nextval('seq_payout') n")).n;
    await c.q(`INSERT INTO payouts(code,account_id,user_id,number,gross,split,amount,method,rail) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [code, a.id, userId, qd.number, gross, qd.split, net, m.label, m.rail]);
    // Hold the gross amount out of the account while in review
    await c.q('UPDATE accounts SET balance=balance-$2 WHERE id=$1', [a.id, gross]);
    await notify(c, userId, `Payout ${code} requested`, `${money(net)} to ${m.label}. Reviewed in 1 to 2 business days.`, 'payouts');
    require('./integrations').alert('payout', `:hourglass: Payout ${code} requested: ${money(net)} from ${a.id} (${m.rail})`);
    return { code, net, gross };
  });
}

async function reviewPayout(actorId, code, action, note) {
  return db.tx(async (c) => {
    const p = await c.one('SELECT * FROM payouts WHERE code=$1 FOR UPDATE', [code]);
    if (!p) bad('Payout not found', 404);
    const a = await c.one('SELECT * FROM accounts WHERE id=$1 FOR UPDATE', [p.account_id]);
    const cat = await catalog();
    if (action === 'approve') {
      if (p.status !== 'requested') bad('Only requested payouts can be approved');
      const u = await c.one('SELECT kyc_status FROM users WHERE id=$1', [p.user_id]);
      if (u.kyc_status !== 'verified') bad('Verify this trader\'s identity before approving');
      await c.q("UPDATE payouts SET status='approved', approved_at=now(), reviewed_by=$2, note=$3 WHERE id=$1", [p.id, actorId, note || '']);
      await notify(c, p.user_id, `Payout ${p.code} approved`, `${money(p.amount)} is being sent to ${p.method}.`, 'payouts');
    } else if (action === 'pay') {
      if (p.status !== 'approved') bad('Approve the payout first');
      const batch = 'PB-' + new Date().toISOString().slice(2, 10).replace(/-/g, '');
      await c.q("UPDATE payouts SET status='paid', paid_at=now(), batch=$2 WHERE id=$1", [p.id, batch]);
      const r = R.rulesFor(cat, a);
      const count = a.payout_count + 1;
      const phase = count >= r.reviewAfter ? 'review' : a.phase;
      await c.q(`UPDATE accounts SET payout_count=$2, paid_total=paid_total+$3, floor=LEAST(floor, start_bal), cycle_profit_start=balance, cycle_win_days=0, cycle_best=0, phase=$4 WHERE id=$1`, [a.id, count, p.amount, phase]);
      await points(c, p.user_id, 250, 'Payout ' + p.code);
      await notify(c, p.user_id, `Payout ${p.code} sent`, `${money(p.amount)} sent to ${p.method}.`, 'payouts');
      const I2 = require('./integrations'); I2.alert('payout', `:white_check_mark: Payout ${p.code} sent: ${money(p.amount)}`); I2.announce(`Another payout sent: ${money(p.amount)} to a ${a.size / 1000}K ${a.plan === 'instant' ? 'Instant' : 'funded'} trader. Congrats!`);
    } else if (action === 'deny') {
      if (!['requested', 'approved'].includes(p.status)) bad('This payout can no longer be denied');
      await c.q("UPDATE payouts SET status='denied', denied_at=now(), reviewed_by=$2, note=$3 WHERE id=$1", [p.id, actorId, note || '']);
      await c.q('UPDATE accounts SET balance=balance+$2 WHERE id=$1', [a.id, p.gross]);
      await notify(c, p.user_id, `Payout ${p.code} was not approved`, note || 'Support will contact you with details.', 'payouts');
    } else bad('Unknown action');
    await c.q('INSERT INTO audit(actor_id,action,target,meta) VALUES($1,$2,$3,$4)', [actorId, 'payout.' + action, p.code, { note }]);
    return { ok: true };
  });
}

module.exports = { catalog, saveCatalog, planDef, sizeDef, kLabel, priceCart, promoFor, ordCode, createAccount, fulfilOrder, resetAccount, activateFunded, signAgreement, requestPayout, reviewPayout, notify, points, audit };
