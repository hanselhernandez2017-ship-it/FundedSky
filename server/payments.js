// Orders and payments. Stripe is the main card processor (card fields on our own page through Stripe.js,
// hosted Stripe Checkout for Apple Pay and Google Pay). TailoredPay is an optional backup. Confirmo takes crypto.
// With nothing connected, a built-in test mode accepts the 4242 4242 4242 4242 test card.
const db = require('./db');
const core = require('./core');
const R = require('./rules');
const { bad, clean, money2, longDate, round2, HttpError } = require('./util');
const { BASE } = require('./auth');

const I = require('./integrations');
let MODE = { card: 'test', stripe: false, crypto: false, live: false };
const stripeCache = {};
async function stripeClient() { const c = await I.cfg('stripe'); const key = (c && c.secretKey) || process.env.STRIPE_SECRET_KEY; if (!key) return null; return stripeCache[key] || (stripeCache[key] = require('stripe')(key)); }
async function refreshMode() {
  const tp = await I.cfg('tailoredpay'); const st = await stripeClient(); const sc = (await I.cfg('stripe')) || {}; const cf = await I.cfg('confirmo');
  const tpOn = !!(tp && tp.securityKey && tp.tokenizationKey); const pk = sc.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '';
  // Stripe first. Without a publishable key Stripe still works through its hosted page.
  const card = st ? (pk ? 'stripe' : 'stripe-hosted') : tpOn ? 'tailoredpay' : 'test';
  MODE = { card, stripe: !!st, stripePk: st ? pk : '', backup: card.startsWith('stripe') && tpOn ? 'tailoredpay' : card === 'tailoredpay' && st ? 'stripe' : '', crypto: !!(cf && cf.apiKey), live: !!(tpOn || st || cf), tokenizationKey: tpOn ? tp.tokenizationKey : '', gatewayUrl: tpOn ? tp.gatewayUrl : '' };
  return MODE;
}
setInterval(() => refreshMode().catch(() => {}), 15000).unref();
const enabled = () => MODE.live;
const mode = () => (MODE.live ? 'live' : 'test');
const methods = () => MODE;

async function insertOrder(user, kind, priced, meta) {
  const code = await core.ordCode();
  const o = await db.one(`INSERT INTO orders(code,user_id,kind,lines,items,subtotal,discount,total,promo,meta) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [code, user.id, kind, JSON.stringify(priced.lines), JSON.stringify(priced.items || []), priced.subtotal, priced.discount, priced.total, priced.promo || null, JSON.stringify(meta || {})]);
  return o;
}

// Limits and Restrictions from the catalog (back office): per trader, per plan, monthly caps and blocked countries
async function checkLimits(user, items) {
  const cat = await core.catalog(); const L = (cat.x || {}).limits; if (!L) return;
  const list = (v) => String(v || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
  const ctry = String(user.country || '').toLowerCase();
  if (ctry && list(L.blocked).includes(ctry)) bad(`Funded Sky accounts are not available in ${user.country}.`, 403);
  const mine = await db.all("SELECT plan, size, kind FROM accounts WHERE user_id=$1 AND phase IN ('active','passed','review') AND comp IS NULL", [user.id]);
  const isF = (pid) => { const p = core.planDef(cat, pid); return pid === 'instant' || (p && p.kind === 'funded'); };
  const newEval = items.filter((i) => !isF(i.plan)).reduce((n, i) => n + i.qty, 0); const newF = items.filter((i) => isF(i.plan));
  const nEval = mine.filter((a) => a.kind === 'evaluation').length; const fund = mine.filter((a) => a.kind === 'funded');
  if (L.maxActive && newEval && nEval + newEval > +L.maxActive) bad(`You can have up to ${L.maxActive} active evaluations at a time. You have ${nEval}.`);
  if (L.maxFunded && newF.length && fund.length + newF.reduce((n, i) => n + i.qty, 0) > +L.maxFunded) bad(`You can have up to ${L.maxFunded} funded accounts at a time.`);
  if (L.maxFundedBalance && newF.length && fund.reduce((n, a) => n + Number(a.size), 0) + newF.reduce((n, i) => n + i.size * i.qty, 0) > +L.maxFundedBalance) bad(`Your funded accounts can total up to $${Number(L.maxFundedBalance).toLocaleString('en-US')}.`);
  for (const pid of [...new Set(items.map((i) => i.plan))]) {
    const l = (L.plans || {})[pid]; if (!l) continue; const qty = items.filter((i) => i.plan === pid).reduce((n, i) => n + i.qty, 0); const pn = (core.planDef(cat, pid) || {}).short || pid;
    if (ctry && list(l.countries).includes(ctry)) bad(`The ${pn} plan is not available in ${user.country}.`, 403);
    if (+l.perTrader && mine.filter((a) => a.plan === pid).length + qty > +l.perTrader) bad(`You can have up to ${l.perTrader} active ${pn} account${+l.perTrader === 1 ? '' : 's'}.`);
    if (+l.cap) { const sold = (await db.one("SELECT COALESCE(sum((it->>'qty')::int),0)::int n FROM orders o, jsonb_array_elements(o.items) it WHERE o.status='paid' AND o.kind IN ('evaluation','instant','mixed') AND it->>'plan'=$1 AND o.paid_at >= date_trunc('month', now())", [pid])).n; if (sold + qty > +l.cap) bad(`The ${pn} plan is sold out for this month.`); }
  }
}
// Maintenance mode (Settings): every purchase and payment is refused with the maintenance message
async function maintGuard() { const r = await db.one("SELECT v FROM kv WHERE k='settings.maint'"); if (r && r.v && r.v.on) bad(String(r.v.msg || '').trim() || 'Purchases are paused for maintenance. Try again soon.', 503); }
// A one-use code (reward or card) belongs to one unpaid order at a time: coupons.order_id is set when an order is made with the
// code (or the code is added to it) and the code is used up when that order is paid. A newer order takes the code over: it comes
// off the older unpaid order, which is priced again without it, so the code can never discount two orders. That covers orders
// that were abandoned, expired or declined. An older order whose payment is already on its way is cancelled at the processor
// first; if that cannot be done it keeps the code and the new order is refused.
const holds = (o, code) => o && o.status === 'pending' && (o.meta || {}).coupon === code;
async function dropPending(o) {
  if (o.provider === 'stripe' && o.provider_ref) { const stripe = await stripeClient(); if (!stripe) return false;
    try { if (String(o.provider_ref).startsWith('pi_')) await stripe.paymentIntents.cancel(o.provider_ref); else await stripe.checkout.sessions.expire(o.provider_ref); }
    catch (e) { const x = String(o.provider_ref).startsWith('pi_') ? await stripe.paymentIntents.retrieve(o.provider_ref).catch(() => null) : await stripe.checkout.sessions.retrieve(o.provider_ref).catch(() => null); if (!x || !['canceled', 'expired'].includes(x.status)) return false; } }
  else if (o.provider === 'confirmo' && o.provider_ref && !['expired', 'error', 'blocked'].includes((o.meta || {}).cryptoStatus)) return false;
  return !!(await db.one("UPDATE orders SET status='canceled', meta = meta || $2 WHERE id=$1 AND status='pending' RETURNING id", [o.id, JSON.stringify({ canceledWhy: 'Its code was moved to a newer order' })]));
}
async function holdCoupon(user, o, code) {
  for (let i = 0; i < 4; i++) {
    if (await db.one('UPDATE coupons SET order_id=$3 WHERE code=$1 AND user_id=$2 AND used=false AND (order_id IS NULL OR order_id=$3) RETURNING code', [code, user.id, o.id])) return;
    const c = await db.one('SELECT used, order_id FROM coupons WHERE code=$1 AND user_id=$2', [code, user.id]); if (!c || c.used) break;
    const prev = await db.one('SELECT * FROM orders WHERE id=$1', [c.order_id]);
    if (prev && prev.status === 'paid' && (prev.meta || {}).coupon === code) break;
    if (holds(prev, code)) {
      if (prev.provider_ref && ['stripe', 'confirmo'].includes(prev.provider)) { // a payment was started on the older order
        if (!(await dropPending(prev))) { if ((await db.one('SELECT status FROM orders WHERE id=$1', [prev.id])).status === 'paid') break; bad(`This code is already on your order ${prev.code}, which is being paid. Finish that order first.`); } }
      else { // not being paid: the code comes off it and it is priced again without the code
        const x = await db.one("UPDATE orders SET meta = meta || '{\"coupon\":null}'::jsonb WHERE id=$1 AND status='pending' RETURNING *", [prev.id]); if (!x) continue; await freshen(user, x, false).catch(() => {}); }
    }
    await db.q('UPDATE coupons SET order_id=NULL WHERE code=$1 AND order_id=$2 AND used=false', [code, c.order_id]);
  }
  bad('That code has already been used');
}
// Hold the order's code; if that fails the new order is cancelled. A card that was added automatically is left out instead (returns false).
async function holdOrCancel(user, o, code, auto) {
  try { await holdCoupon(user, o, code); return true; } catch (e) { await db.q("UPDATE orders SET status='canceled' WHERE id=$1 AND status='pending'", [o.id]); if (auto) return false; throw e; }
}
async function createOrder(user, body, noCard) {
  await maintGuard();
  body = body || {};
  const priced = await core.priceCart(body.items, { promo: body.promo, coupon: body.coupon, userId: user.id, noCard });
  // one use per trader for promo codes marked "once"
  if (priced.promo) {
    const cat = await core.catalog(); const p = cat.promos.find((x) => x.code === priced.promo);
    if (p && p.once && (await db.one("SELECT 1 FROM orders WHERE user_id=$1 AND promo=$2 AND status='paid'", [user.id, p.code]))) bad('You have already used this code');
  }
  await checkLimits(user, priced.items);
  const kind = priced.items.every((i) => i.plan === 'instant') ? 'instant' : priced.items.some((i) => i.plan === 'instant') ? 'mixed' : 'evaluation';
  const o = await insertOrder(user, kind, priced, { coupon: priced.coupon || undefined, affiliate: priced.affiliate || undefined });
  if (priced.coupon && !(await holdOrCancel(user, o, priced.coupon, priced.autoCard))) return createOrder(user, body, true);
  // The affiliate whose code was used is kept on the order; the buyer is tied to them only when the order is paid (core.fulfilOrder)
  if (Number(o.total) === 0) return finishFree(o);
  return { code: o.code, total: Number(o.total), mode: mode() };
}

// The account a reset is for, checked: the trader's own evaluation, active or breached
async function resetTarget(user, id) {
  const a = await db.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2', [clean(id, 40), user.id]);
  if (!a) bad('Account not found', 404);
  if (a.kind !== 'evaluation' || !['active', 'breached'].includes(a.phase)) bad('This account cannot be reset');
  if (a.comp) bad('Competition accounts cannot be reset');
  return a;
}
// Price a reset on the server: the fee the account was sold with, the Free Reset add-on, reset promotions, add-ons and a reward code.
// The /reset summary, the order and the check at payment all use this, so the page always shows what is charged.
async function priceReset(user, a, body) {
  body = body || {};
  const cat = await core.catalog(); const ord = a.order_id ? await db.one('SELECT items FROM orders WHERE id=$1', [a.order_id]) : null; const fz = core.feesOf(cat, a, ord);
  const addons = [...new Set(Array.isArray(body.addons) ? body.addons : [])].filter((x) => ['reset', 'daily'].includes(x) && cat.addons && cat.addons[x] && !(x === 'daily' && (a.addons || []).includes('daily')));
  const lines = []; let subtotal = 0; let discount = 0;
  // Reset price: the one the account was sold with (Back Office › Resets and Fees at the time of sale)
  const base = fz.reset; const pn = (core.planDef(cat, a.plan) || {}).short || a.plan;
  lines.push({ label: `Reset · ${core.kLabel(a.size)} ${pn}`, amount: base, kind: 'plan' }); subtotal += base;
  if (a.free_resets > 0) { lines.push({ label: 'Free Reset (your add-on)', amount: -base, kind: 'discount' }); discount += base; }
  // automatic promotions set to apply to resets (Back Office › Promotions › Applies To: Resets), unless resets of this size can't be discounted
  else if ((((((cat.x || {}).fees || {})[a.plan] || {})[a.size] || {}).resetDiscountable) !== false) { const today = new Date().toISOString().slice(0, 10); const cap = Number(cat.maxPromoPct || 30);
    const best = (cat.autos || []).map(core.normPromo).filter((p) => p.lines.reset && p.active && !(p.starts && today < p.starts) && !(p.ends && today > p.ends) && (!p.plans.length || p.plans.includes(a.plan)) && (!p.sizes.length || p.sizes.includes(Number(a.size))) && ['percent', 'fixed'].includes(p.vtype))
      .map((p) => ({ p, off: round2(Math.min(base, p.vtype === 'percent' ? base * Math.min(p.value, cap) / 100 : p.value, p.maxOff || Infinity)) })).sort((x, y) => y.off - x.off)[0];
    if (best && best.off > 0) { lines.push({ label: best.p.name, amount: -best.off, kind: 'discount' }); discount += best.off; } }
  for (const ad of addons) { const def = cat.addons[ad]; const amt = def.flat != null && Number(def.flat) > 0 ? Number(def.flat) : Math.round(fz.price * def.pct / 100); lines.push({ label: def.name, amount: amt, kind: 'addon' }); subtotal += amt; }
  let code = clean(body.coupon, 40); let auto = false;
  // a "% off a reset" card saved by the trader comes off automatically. Checkout discount cards are kept for a checkout: they come off a reset only when the trader enters the code.
  if (!code && !body.noAuto && (await require('./packs').enabled())) { const cc = await db.one("SELECT code FROM coupons WHERE user_id=$1 AND used=false AND source='card' AND kind='reset_discount' AND (expires_at IS NULL OR expires_at > now()) ORDER BY pct DESC LIMIT 1", [user.id]); if (cc && subtotal - discount > 0) { code = cc.code; auto = true; } }
  if (code) {
    const c = await db.one('SELECT * FROM coupons WHERE upper(code)=upper($1) AND user_id=$2 AND used=false', [code, user.id]);
    if (!c) bad('That reward code is not valid');
    if (c.expires_at ? new Date(c.expires_at) < new Date() : new Date(c.created_at) < new Date(Date.now() - 90 * 86400000)) bad('That code has expired');
    // a discount code is for evaluations: it works on a reset only when it is a card, or its reward says it also covers resets
    const onResets = c.kind === 'reset_discount' || (c.kind === 'discount' && (c.source === 'card' || (c.meta || {}).resets));
    const d = c.kind === 'free_reset' ? Math.max(0, base - (a.free_resets > 0 ? base : 0)) : onResets ? round2((subtotal - discount) * Number(c.pct) / 100) : 0;
    if (!d) bad(c.kind === 'free_reset' ? 'Your Free Reset add-on already covers this reset. Keep the code for next time.' : c.kind === 'discount' || c.kind === 'free_eval' ? 'That code is for a new evaluation, not a reset' : 'That code does not apply to resets');
    lines.push({ label: c.label, amount: -d, kind: 'coupon' }); discount += d; code = c.code;
  }
  const priced = { lines, subtotal: round2(subtotal), discount: round2(discount), total: Math.max(0, round2(subtotal - discount)), items: [{ plan: a.plan, size: a.size, addons, qty: 1 }] };
  return { priced, meta: { account: a.id, addons, coupon: code || null, autoCoupon: auto, useFree: a.free_resets > 0, resetCount: a.reset_count || 0 } };
}
// What a reset would cost right now (the /reset page summary)
async function quoteReset(user, body) {
  body = body || {}; const a = await resetTarget(user, body.account); const { priced, meta } = await priceReset(user, a, body);
  return { account: a.id, lines: priced.lines, subtotal: priced.subtotal, discount: priced.discount, total: priced.total, addons: meta.addons, coupon: meta.coupon, autoCoupon: meta.autoCoupon, mode: mode() };
}
async function saveRepriced(o, priced, meta) {
  return db.one("UPDATE orders SET lines=$2, items=$3, subtotal=$4, discount=$5, total=$6, promo=$7, meta = meta || $8 WHERE id=$1 AND status='pending' RETURNING *",
    [o.id, JSON.stringify(priced.lines), JSON.stringify(priced.items || []), priced.subtotal, priced.discount, priced.total, priced.promo || null, JSON.stringify(Object.assign({ pricedAt: new Date().toISOString() }, meta || {}))]);
}
async function createResetOrder(user, body) {
  await maintGuard();
  body = body || {};
  const a = await resetTarget(user, body.account);
  const { priced, meta } = await priceReset(user, a, body);
  // one pending reset order per account: pressing Pay again (after a decline, or with other add-ons) updates it instead of leaving extras behind
  const open = await db.all("SELECT * FROM orders WHERE user_id=$1 AND kind='reset' AND status='pending' AND meta->>'account'=$2 ORDER BY id DESC", [user.id, a.id]);
  let o = open[0] ? await saveRepriced(open[0], priced, meta) : null;
  if (open.length > 1) await db.q("UPDATE orders SET status='canceled' WHERE id = ANY($1) AND status='pending'", [open.slice(1).map((x) => x.id)]);
  if (!o) o = await insertOrder(user, 'reset', priced, meta);
  if (meta.coupon && !(await holdOrCancel(user, o, meta.coupon, meta.autoCoupon))) return createResetOrder(user, Object.assign({}, body, { noAuto: true }));
  if (Number(o.total) === 0) return finishFree(o);
  return { code: o.code, total: Number(o.total), mode: mode() };
}

async function createActivationOrder(user, body) {
  await maintGuard();
  const id = clean(body.account, 40);
  const a = await db.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2', [id, user.id]);
  if (!a || a.phase !== 'passed') bad('This account is not waiting for activation');
  if (!(a.steps || {}).agreement) bad('Sign the funded agreement first');
  const cat = await core.catalog(); const ord = a.order_id ? await db.one('SELECT items FROM orders WHERE id=$1', [a.order_id]) : null; const fee = core.feesOf(cat, a, ord).activation;
  if (!fee) bad('This account has no activation fee. Sign the agreement to get your funded account.');
  // reuse a pending activation order only while it still charges the account's fee
  const existing = await db.one("SELECT * FROM orders WHERE user_id=$1 AND kind='activation' AND status='pending' AND meta->>'account'=$2 ORDER BY id DESC LIMIT 1", [user.id, a.id]);
  if (existing && Number(existing.total) === fee) return { code: existing.code, total: Number(existing.total), mode: mode() };
  if (existing) await db.q("UPDATE orders SET status='canceled' WHERE user_id=$1 AND kind='activation' AND status='pending' AND meta->>'account'=$2", [user.id, a.id]);
  const priced = { lines: [{ label: `Activation fee · ${core.kLabel(a.size)} ${(core.planDef(cat, a.plan) || {}).short || a.plan}`, amount: fee, kind: 'plan' }], subtotal: fee, discount: 0, total: fee, items: [] };
  const o = await insertOrder(user, 'activation', priced, { account: a.id });
  return { code: o.code, total: Number(o.total), mode: mode() };
}

// The account is reset: any other unpaid reset order for it is closed so it can never be charged later
const closeOtherResets = (o) => db.q("UPDATE orders SET status='canceled', meta = meta || '{\"canceledWhy\":\"Account already reset\"}'::jsonb WHERE kind='reset' AND status='pending' AND user_id=$1 AND meta->>'account'=$2 AND id<>$3", [o.user_id, o.meta.account, o.id]);
async function finishFree(o) {
  await db.q("UPDATE orders SET status='paid', paid_at=now(), provider='none', pay_method='No charge' WHERE id=$1", [o.id]);
  const r = await core.fulfilOrder(o.id);
  if (o.kind === 'reset' && o.meta.useFree) await db.q('UPDATE accounts SET free_resets=GREATEST(0,free_resets-1) WHERE id=$1', [o.meta.account]);
  if (o.kind === 'reset') await closeOtherResets(o);
  return { code: o.code, total: 0, paid: true, accounts: r.accounts };
}

// The card's fingerprint from the processor, hashed: the same card on a referrer's and a buyer's order means a self-referral
const cardFp = (v) => (v ? require('crypto').createHash('sha256').update('card|' + v).digest('hex') : null);
const stripeFp = (pi) => { const ch = pi && pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null; const c = ch && ch.payment_method_details && ch.payment_method_details.card; return c && c.fingerprint ? cardFp('stripe|' + c.fingerprint) : null; };
async function markPaid(o, provider, ref, method, fp) {
  const r = await db.one("UPDATE orders SET status='paid', paid_at=now(), provider=$2, provider_ref=$3, pay_method=$4, meta = meta || $5 WHERE id=$1 AND status='pending' RETURNING *", [o.id, provider, ref || null, method || '', JSON.stringify(fp ? { cardFp: fp } : {})]);
  if (!r) return; // already paid
  await core.fulfilOrder(o.id);
  { const wu = await db.one('SELECT tid, email FROM users WHERE id=$1', [o.user_id]); const fo = await db.one('SELECT meta FROM orders WHERE id=$1', [o.id]);
    I.alert('order', `:moneybag: New order ${o.code}: $${Number(o.total).toFixed(2)} (${o.lines.filter((l) => l.kind === 'plan').map((l) => l.label).join(', ')}) via ${provider}`, { order: o.code, kind: o.kind, status: 'paid', currency: 'USD', subtotal: Number(o.subtotal), discount: Number(o.discount), total: Number(o.total), promo: o.promo || null, provider, method: method || null, lines: (o.lines || []).map((l) => ({ label: l.label, kind: l.kind || 'plan', amount: Number(l.amount) })), accounts: ((fo && fo.meta && fo.meta.accounts) || (o.meta && o.meta.account ? [o.meta.account] : [])), user: wu ? { id: wu.tid, email: wu.email } : null, paidAt: r.paid_at }); }
  if (o.kind === 'reset' && o.meta.useFree) await db.q('UPDATE accounts SET free_resets=GREATEST(0,free_resets-1) WHERE id=$1', [o.meta.account]);
  if (o.kind === 'reset') await closeOtherResets(o);
  const u = await db.one('SELECT email, first FROM users WHERE id=$1', [o.user_id]);
  { const cat = await core.catalog(); const it = (o.items || [])[0] || {}; const pl = it.plan ? ((core.planDef(cat, it.plan) || {}).name || it.plan) : (o.kind === 'reset' ? 'Reset' : o.kind === 'credits' ? (o.lines[0] || {}).label || 'Credits' : o.kind); const adds = o.lines.filter((l) => l.kind === 'addon').map((l) => l.label);
    // Finance > Invoices and Receipts: the receipt email can be switched off
    const rcp = ((await db.one("SELECT v FROM kv WHERE k='store.finance.settings'")) || {}).v || {};
    if (rcp.receipts !== false) await require('./mail').sendT('order', u.email, { first_name: u.first, order: o.code, plan: pl, size: it.size ? core.kLabel(it.size) : '', platform: it.platform || '', addons: adds.join(', '), discount: Number(o.discount) > 0 ? `${o.promo ? o.promo + ' · ' : ''}−${money2(o.discount)}` : '', total: money2(o.total), paid_with: method || provider, url: `${BASE()}/app#billing` }, { uid: o.user_id }); }
}

function stripeMethod(pi) {
  const ch = pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null; const c = ch && ch.payment_method_details && ch.payment_method_details.card;
  if (!c) return 'Card via Stripe';
  const brand = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover' }[c.brand] || 'Card';
  return `${c.wallet ? ({ apple_pay: 'Apple Pay', google_pay: 'Google Pay' }[c.wallet.type] || brand) + ' · ' : ''}${brand} •••• ${c.last4}`;
}
// A card was declined: remember why, tell staff, and email the trader once per order
async function declined(o, reason) {
  await db.q("UPDATE orders SET meta = meta || $2 WHERE id=$1", [o.id, JSON.stringify({ lastDecline: reason || 'Declined', declinedAt: new Date().toISOString() })]);
  const u = await db.one('SELECT email, tid FROM users WHERE id=$1', [o.user_id]); I.alert('decline', `:warning: Card declined on ${o.code} (${u ? u.email : ''}): ${reason || 'declined'}`, { order: o.code, kind: o.kind, total: Number(o.total), currency: 'USD', reason: reason || 'Declined', provider: o.provider || null, user: u ? { id: u.tid, email: u.email } : null });
  if (!(o.meta && o.meta.payfailSent)) { await db.q("UPDATE orders SET meta = meta || '{\"payfailSent\":true}'::jsonb WHERE id=$1", [o.id]); const it = (o.items || [])[0] || {}; const cat = await core.catalog();
    require('./mail').t('payfail', o.user_id, { reason: reason || 'Declined by the bank', plan: ((core.planDef(cat, it.plan) || {}).short) || (o.lines && o.lines[0] && o.lines[0].label) || 'Your', size: it.size ? core.kLabel(it.size) : '', amount: '$' + Number(o.total).toFixed(2), url: require('./auth').BASE() + '/checkout/payment?order=' + o.code }); }
}

// ---------- Checks again when an order is opened or paid ----------
// An unpaid order can sit for hours or days. Before any charge the order is priced again with today's rules:
// one-use and first-order codes, reward codes, account limits, the credits daily cap, an account that was already reset,
// and prices or promotions that changed. If anything is different the order is updated (or cancelled) and the trader is told; nothing is charged at an old price.
const queue = new Map(); // one payment step at a time per trader, so two pending orders cannot both pass the checks
function serial(key, fn) { const run = (queue.get(key) || Promise.resolve()).then(fn); const tail = run.catch(() => {}); queue.set(key, tail); tail.then(() => { if (queue.get(key) === tail) queue.delete(key); }); return run; }
const EXPIRE_MS = 24 * 3600e3; // an unpaid order keeps its price for 24 hours; after that it is expired and priced again when reopened
const isStale = (o) => Date.now() - new Date((o.meta && o.meta.pricedAt) || o.created_at).getTime() > EXPIRE_MS;
const gone = (msg) => bad(msg, 409);
async function cancelOrder(o, why) { await db.q("UPDATE orders SET status='canceled', meta = meta || $2 WHERE id=$1 AND status='pending'", [o.id, JSON.stringify({ canceledWhy: why })]); }
const changedErr = (o, why, stale) => { const e = new HttpError(409, `${why ? why.replace(/[.\s]+$/, '') + '. ' : (stale ? 'This order was more than a day old, so it was priced again. ' : 'Prices changed after this order was made. ')}Your order is now ${money2(o.total)}. Check the total and pay again.`); e.repriced = true; e.total = Number(o.total); return e; };
// Account orders: price the same cart again. A code that no longer applies is taken off (the reason is kept for the message).
async function repriceCart(user, o) {
  const meta = o.meta || {}; const items = (o.items || []).map((i) => ({ plan: i.plan, size: i.size, platform: i.platform, addons: i.addons, qty: i.qty }));
  let p; let why = '';
  try { p = await core.priceCart(items, { promo: o.promo || undefined, userId: user.id }); }
  catch (e) { if (!(e instanceof HttpError) || e.status !== 400 || !o.promo) throw e; why = e.message; p = await core.priceCart(items, { userId: user.id }); }
  // only the reward code this order was made with counts (a card that would be picked automatically today is left for the next order)
  const auto = p.lines.filter((l) => l.kind === 'coupon'); if (auto.length) { p.lines = p.lines.filter((l) => l.kind !== 'coupon'); p.discount = round2(p.discount + auto.reduce((n, l) => n + Number(l.amount), 0)); }
  let coupon = meta.coupon || null;
  if (coupon) {
    const c = await db.one('SELECT * FROM coupons WHERE code=$1 AND user_id=$2', [coupon, user.id]);
    const taken = c && c.used && (await db.one("SELECT 1 FROM orders WHERE user_id=$1 AND status='paid' AND id<>$2 AND meta->>'coupon'=$3", [user.id, o.id, coupon]));
    const expired = c && (c.expires_at ? new Date(c.expires_at) < new Date() : new Date(c.created_at) < new Date(Date.now() - 90 * 86400000));
    const left = round2(p.subtotal - p.discount);
    // a code held by another unpaid order (it was moved there) no longer counts on this one
    const moved = c && !c.used && c.order_id && c.order_id !== o.id && (await db.one("SELECT 1 FROM orders WHERE id=$1 AND status='pending' AND meta->>'coupon'=$2", [c.order_id, coupon]));
    if (!c || taken || expired || moved) { why = why || (taken ? 'Your reward code was already used on another order' : expired ? 'Your reward code has expired' : moved ? 'Your reward code is now on another order' : 'Your reward code is no longer valid'); coupon = null; }
    // priced by the same code as checkout (core.priceCart), so the order and the first quote always agree
    else { try { p = await core.priceCart(items, { promo: why ? undefined : (o.promo || undefined), coupon, userId: user.id, anyUse: true }); } catch (e) { if (!(e instanceof HttpError) || e.status !== 400) throw e; why = why || e.message; coupon = null; } }
  }
  p.total = Math.max(0, round2(p.subtotal - p.discount));
  return { p, meta: { coupon, affiliate: p.affiliate || null }, why };
}
// Returns the order as it should be charged now. Throws 409 when it had to be cancelled, or (strict) when its total changed.
async function freshen(user, o, strict) {
  if (o.status !== 'pending') return o;
  const same = (p) => Math.abs(Number(p.total) - Number(o.total)) < 0.005;
  if (['evaluation', 'instant', 'mixed'].includes(o.kind)) {
    let r;
    try { r = await repriceCart(user, o); }
    catch (e) { if (!(e instanceof HttpError) || e.status !== 400) throw e; if (!strict) return o; await cancelOrder(o, e.message); gone(`This order can no longer be paid (${e.message}). You have not been charged. Start a new checkout.`); }
    if (strict) { try { await checkLimits(user, r.p.items); } catch (e) { if (e instanceof HttpError) e.message += ' You have not been charged.'; throw e; } }
    if (same(r.p) && !r.why) return o;
    const n = await saveRepriced(o, r.p, r.meta); if (!n) return o;
    if (strict) throw changedErr(n, r.why, isStale(o));
    n.note = `${r.why ? r.why.replace(/[.\s]+$/, '') + ', so the total was updated.' : isStale(o) ? 'This order was more than a day old, so the total was updated to today\'s price.' : 'Prices changed after this order was made, so the total was updated.'}`; return n;
  }
  if (o.kind === 'reset') {
    const a = await db.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2', [o.meta.account, user.id]);
    const again = a && o.meta.resetCount != null && Number(a.reset_count || 0) !== Number(o.meta.resetCount);
    if (!a || a.kind !== 'evaluation' || !['active', 'breached'].includes(a.phase) || again) {
      if (!strict) return o;
      await cancelOrder(o, again ? 'Account already reset' : 'Account can no longer be reset');
      gone(again ? `${o.meta.account} was already reset after this order was made, so the order was cancelled. You have not been charged.` : 'This account can no longer be reset, so the order was cancelled. You have not been charged.');
    }
    let r; let why = '';
    try { r = await priceReset(user, a, { addons: o.meta.addons, coupon: o.meta.coupon, noAuto: true }); }
    catch (e) { if (!(e instanceof HttpError) || e.status !== 400 || !o.meta.coupon) throw e; why = e.message === 'That reward code is not valid' ? 'Your reward code was already used' : e.message; r = await priceReset(user, a, { addons: o.meta.addons, noAuto: true }); }
    if (same(r.priced) && !why) return o;
    const n = await saveRepriced(o, r.priced, r.meta); if (!n) return o;
    if (strict) throw changedErr(n, why, isStale(o));
    n.note = why ? why.replace(/[.\s]+$/, '') + ', so the total was updated.' : 'The total was updated to today\'s price.'; return n;
  }
  if (!strict) return o;
  if (o.kind === 'activation') {
    const a = await db.one('SELECT phase FROM accounts WHERE id=$1 AND user_id=$2', [o.meta.account, user.id]);
    if (!a || a.phase !== 'passed') { await cancelOrder(o, 'Account not waiting for activation'); gone('This account is no longer waiting for activation, so the order was cancelled. You have not been charged.'); }
  }
  if (o.kind === 'credits') {
    const PK = require('./packs'); const cap = Number(((await PK.config()).rules || {}).dailyCap || 0); const fmt = (n) => Number(n).toLocaleString('en-US');
    if (cap) { const today = (await db.one("SELECT COALESCE(sum(delta),0)::int n FROM points_log WHERE user_id=$1 AND kind='bought' AND created_at >= date_trunc('day', now())", [user.id])).n;
      if (today + Number(o.meta.credits || 0) > cap) bad(`You can buy up to ${fmt(cap)} credits a day, and you have bought ${fmt(today)} today. You have not been charged. Try again tomorrow or pick a smaller amount.`); }
  }
  return o;
}
// A reward code from an email or the Rewards page, put on an unpaid account order (the checkout reminder link does this)
async function applyCode(user, code, body) {
  await maintGuard();
  return serial(user.id, async () => {
    const o = await db.one('SELECT * FROM orders WHERE code=$1 AND user_id=$2', [clean(code, 30), user.id]);
    if (!o) bad('Order not found', 404);
    if (o.status !== 'pending' || !['evaluation', 'instant', 'mixed'].includes(o.kind)) bad('A code can only be added to an unpaid account order');
    const cp = await db.one('SELECT code FROM coupons WHERE upper(code)=upper($1) AND user_id=$2', [clean((body || {}).code, 40), user.id]);
    if (!cp) bad('That reward code is not valid');
    if (o.meta && o.meta.coupon === cp.code) return { code: o.code, total: Number(o.total), applied: true };
    const items = (o.items || []).map((i) => ({ plan: i.plan, size: i.size, platform: i.platform, addons: i.addons, qty: i.qty }));
    let p; try { p = await core.priceCart(items, { promo: o.promo || undefined, coupon: cp.code, userId: user.id }); } catch (e) { if (!(e instanceof HttpError) || !o.promo || /reward|expired/i.test(e.message)) throw e; p = await core.priceCart(items, { coupon: cp.code, userId: user.id }); }
    // one order per code: it comes off any other unpaid order that carried it
    for (const x of await db.all("SELECT * FROM orders WHERE user_id=$1 AND status='pending' AND id<>$2 AND meta->>'coupon'=$3", [user.id, o.id, cp.code])) { await db.q("UPDATE orders SET meta = meta || '{\"coupon\":null}'::jsonb WHERE id=$1", [x.id]); x.meta.coupon = null; await freshen(user, x, false).catch(() => {}); }
    const n = await saveRepriced(o, p, { coupon: p.coupon || cp.code, affiliate: p.affiliate || null });
    if (n) await db.q('UPDATE coupons SET order_id=$2 WHERE code=$1 AND user_id=$3 AND used=false', [p.coupon || cp.code, o.id, user.id]); // this order holds the code now
    if (n && Number(n.total) === 0) return finishFree(n);
    return { code: o.code, total: Number((n || o).total), applied: true };
  });
}

function payOrder(user, code, body) { return serial(user.id, () => payOrderNow(user, code, body || {})); }
async function payOrderNow(user, code, body) {
  await maintGuard();
  await refreshMode();
  let o = await db.one('SELECT * FROM orders WHERE code=$1 AND user_id=$2', [clean(code, 30), user.id]);
  if (!o) bad('Order not found', 404);
  if (o.status === 'paid') return { paid: true, code: o.code };
  if (o.status !== 'pending') bad(o.status === 'canceled' ? `This order was cancelled${o.meta && o.meta.canceledWhy ? ' (' + String(o.meta.canceledWhy).toLowerCase() + ')' : ''}. You have not been charged.` : 'This order can no longer be paid', 409);
  await require('./packs').payGuard(o); // Packs switched off: a credits order is cancelled instead of charged
  const method = body.method || 'card';
  // Stripe step 2 (the bank already approved the payment) only records it; every other step is checked before anything is charged
  if (!body.paymentIntent) { o = await freshen(user, o, true); if (Number(o.total) === 0) { const r = await finishFree(o); return { paid: true, code: r.code }; } }
  const total = Number(o.total);
  // Crypto through Confirmo
  if (method === 'crypto') {
    const c = await I.cfg('confirmo'); if (!c) bad('Crypto checkout is not available right now. Use a card.');
    const r = await fetch('https://confirmo.net/api/v3/invoices', { method: 'POST', headers: { Authorization: 'Bearer ' + c.apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice: { amount: total, currencyFrom: 'USD' }, settlement: { currency: c.settlement || null }, product: { name: `Funded Sky ${o.code}`, description: o.lines.map((l) => l.label).join(', ').slice(0, 200) }, reference: o.code, customerEmail: user.email, notifyUrl: `${BASE()}/api/hooks/confirmo`, returnUrl: `${BASE()}/checkout/confirmed?order=${o.code}` }) });
    const j = await r.json().catch(() => ({})); if (!r.ok || !j.url) bad('Crypto checkout failed to start: ' + (j.message || r.status));
    await db.q("UPDATE orders SET provider='confirmo', provider_ref=$2 WHERE id=$1", [o.id, j.id]);
    return { redirect: j.url };
  }
  // Cards through TailoredPay (NMI gateway) with a Collect.js token
  if ((MODE.card === 'tailoredpay' && method === 'card') || (method === 'tailoredpay' && MODE.tokenizationKey)) {
    if (!body.token) bad('Card details are missing. Enter your card again.');
    const c = await I.cfg('tailoredpay');
    const u = await db.one('SELECT * FROM users WHERE id=$1', [user.id]);
    const r = await I.nmi(c, { type: 'sale', amount: total.toFixed(2), currency: 'USD', payment_token: body.token, orderid: o.code, order_description: o.lines.map((l) => l.label).join(', ').slice(0, 250), email: u.email, first_name: u.first, last_name: u.last, country: u.country, ipaddress: body.ip || '', descriptor: c.descriptor || '' });
    if (r.response === '1') { await markPaid(o, 'tailoredpay', r.transactionid, `Card ${r.cc_number ? '•••• ' + String(r.cc_number).slice(-4) : ''}`.trim(), r.cc_number ? cardFp('nmi|' + r.cc_number + '|' + (r.cc_exp || '')) : null); return { paid: true, code: o.code }; }
    await declined(o, r.responsetext || 'Declined');
    const e = new Error((r.response === '2' ? 'Your card was declined: ' : 'The payment could not be processed: ') + (r.responsetext || 'try another card') + (MODE.card === 'tailoredpay' && MODE.stripe ? '. You can also pay with our backup processor.' : '')); e.status = 402; e.fallback = MODE.card === 'tailoredpay' && MODE.stripe; throw e;
  }
  const stripe = await stripeClient();
  // Stripe card fields on our page: step 1 makes a PaymentIntent, the browser confirms it (with 3-D Secure when the bank asks),
  // step 2 checks it here. The webhook marks it paid too, so a closed tab still completes the order.
  if (stripe && MODE.card === 'stripe' && method === 'card') {
    if (body.paymentIntent) {
      const pi = await stripe.paymentIntents.retrieve(clean(body.paymentIntent, 80), { expand: ['latest_charge'] });
      if (!pi.metadata || pi.metadata.order !== o.code) bad('This payment does not match the order');
      if (pi.status === 'succeeded') { await markPaid(o, 'stripe', pi.id, stripeMethod(pi), stripeFp(pi)); return { paid: true, code: o.code }; }
      if (pi.status === 'processing') return { pending: true, code: o.code };
      bad('The payment was not completed. Try again or use another card.', 402);
    }
    const sc = (await I.cfg('stripe')) || {}; const u = await db.one('SELECT * FROM users WHERE id=$1', [user.id]);
    const amount = Math.round(total * 100);
    let pi = o.provider === 'stripe' && String(o.provider_ref || '').startsWith('pi_') ? await stripe.paymentIntents.retrieve(o.provider_ref).catch(() => null) : null;
    if (pi && pi.status === 'succeeded') { await markPaid(o, 'stripe', pi.id, 'Card via Stripe'); return { paid: true, code: o.code }; }
    if (!pi || !['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(pi.status) || pi.amount !== amount) {
      pi = await stripe.paymentIntents.create({ amount, currency: 'usd', payment_method_types: ['card'], receipt_email: u.email, description: `Funded Sky ${o.code}: ` + o.lines.map((l) => l.label).join(', ').slice(0, 300),
        metadata: { order: o.code, user: String(user.id) }, statement_descriptor_suffix: sc.descriptor ? String(sc.descriptor).slice(0, 22) : undefined }, { idempotencyKey: `${o.code}-${amount}-${Date.now() >> 16}` });
      await db.q('UPDATE orders SET provider_ref=$2, provider=$3 WHERE id=$1', [o.id, pi.id, 'stripe']);
    }
    return { clientSecret: pi.client_secret, name: `${u.first || ''} ${u.last || ''}`.trim(), email: u.email };
  }
  // Stripe's hosted page: Apple Pay and Google Pay, the backup choice, or the main card flow when no publishable key is set
  if (stripe && (MODE.card === 'stripe-hosted' || method === 'stripe' || method === 'apple')) {
    const sess = await stripe.checkout.sessions.create({
      mode: 'payment', customer_email: user.email, client_reference_id: o.code,
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: Math.round(total * 100), product_data: { name: `Funded Sky ${o.code}`, description: o.lines.map((l) => l.label).join(', ').slice(0, 300) } } }],
      payment_intent_data: { metadata: { order: o.code } },
      metadata: { order: o.code }, success_url: `${BASE()}/checkout/confirmed?order=${o.code}&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${BASE()}/checkout/payment?order=${o.code}&canceled=1`
    });
    await db.q('UPDATE orders SET provider_ref=$2, provider=$3 WHERE id=$1', [o.id, sess.id, 'stripe']);
    return { redirect: sess.url };
  }
  if (method === 'apple') bad(MODE.live ? 'Apple Pay is not available right now. Use a card.' : 'Apple Pay is not available in test mode. Use the test card.');
  if (MODE.live) bad('Card payments are not available right now. Try crypto, or contact support.');
  // Built-in test mode: only while no payment provider is connected
  const num = String(body.card || '').replace(/\D/g, '');
  if (num === '4000000000000002') { await declined(o, 'Declined by the bank (test card)'); const e = new Error('Your card was declined: try another card'); e.status = 402; throw e; }
  if (num !== '4242424242424242') bad('Test mode: use the test card 4242 4242 4242 4242 with any future date and any CVC, or 4000 0000 0000 0002 to see a decline');
  const ex = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(body.exp || '').trim()); if (!ex || +ex[1] < 1 || +ex[1] > 12) bad('Enter the expiry as MM / YY');
  { const now = new Date(); if (2000 + +ex[2] < now.getFullYear() || (2000 + +ex[2] === now.getFullYear() && +ex[1] < now.getMonth() + 1)) bad('That card has expired. Use a future expiry date.'); }
  await markPaid(o, 'test', 'test_' + Date.now(), 'Test card •••• 4242');
  return { paid: true, code: o.code };
}

async function getOrder(user, code, sessionId) {
  let o = await db.one('SELECT * FROM orders WHERE code=$1 AND user_id=$2', [clean(code, 30), user.id]);
  if (!o) bad('Order not found', 404);
  const stripe = o.provider === 'stripe' ? await stripeClient() : null;
  if (o.status === 'pending' && stripe && (sessionId || o.provider_ref)) {
    const ref = sessionId || o.provider_ref;
    if (String(ref).startsWith('pi_')) { const pi = await stripe.paymentIntents.retrieve(ref, { expand: ['latest_charge'] }).catch(() => null); if (pi && pi.status === 'succeeded' && pi.metadata && pi.metadata.order === o.code) { await markPaid(o, 'stripe', pi.id, stripeMethod(pi), stripeFp(pi)); o = await db.one('SELECT * FROM orders WHERE id=$1', [o.id]); } }
    else { const s = await stripe.checkout.sessions.retrieve(ref).catch(() => null);
      if (s && s.payment_status === 'paid' && s.metadata && s.metadata.order === o.code) { await markPaid(o, 'stripe', s.payment_intent || s.id, 'Card via Stripe'); o = await db.one('SELECT * FROM orders WHERE id=$1', [o.id]); } }
  }
  // opened again before any payment was started: show today's total (a stale code, a price change, or an order more than a day old)
  let note = ''; if (o.status === 'pending' && !sessionId && !o.provider_ref) { const n = await serial(user.id, async () => freshen(user, await db.one('SELECT * FROM orders WHERE id=$1', [o.id]), false)).catch(() => null); if (n) { note = n.note || ''; o = n; } }
  // an account order that is still waiting for payment shows the free packs it will earn, like the cart summary did (shown only, never stored)
  const freeLine = !['paid', 'refunded', 'canceled'].includes(o.status) && !['reset', 'activation', 'credits'].includes(o.kind) ? await require('./packs').ladderLine(o.items).catch(() => null) : null;
  return { note: note || undefined, canceledWhy: o.status === 'canceled' ? (o.meta && o.meta.canceledWhy) || '' : undefined, code: o.code, kind: o.kind, status: o.status, provider: o.provider, lines: freeLine ? o.lines.concat([freeLine]) : o.lines, items: o.items, subtotal: Number(o.subtotal), discount: Number(o.discount), total: Number(o.total), accounts: (o.meta && o.meta.accounts) || [], account: o.meta && o.meta.account, credits: (o.meta && (o.meta.creditsAdded || o.meta.credits)) || 0, packs: (o.meta && o.meta.packsGranted && o.meta.packsGranted.label) || '', balance: (await db.one('SELECT points FROM users WHERE id=$1', [user.id])).points, mode: mode(), email: user.email };
}

async function hookLog(provider, event, ok, detail) { await db.q('INSERT INTO webhook_log(provider,event,ok,detail) VALUES($1,$2,$3,$4)', [provider, event || '', ok, String(detail || '').slice(0, 500)]).catch(() => {}); }
async function webhook(req, res) {
  const c = await I.cfg('stripe'); const secret = (c && c.webhookSecret) || process.env.STRIPE_WEBHOOK_SECRET; const stripe = await stripeClient();
  if (!stripe || !secret) return res.status(400).send('webhook not configured');
  let ev;
  try { ev = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret); } catch (e) { await hookLog('stripe', 'bad signature', false, e.message); return res.status(400).send('bad signature'); }
  try {
    if (ev.type === 'checkout.session.completed' && ev.data.object.payment_status === 'paid') {
      const s = ev.data.object; const o = await db.one('SELECT * FROM orders WHERE code=$1', [s.metadata && s.metadata.order]);
      if (o) await markPaid(o, 'stripe', s.payment_intent || s.id, 'Card via Stripe');
    }
    if (ev.type === 'payment_intent.succeeded') {
      const pi = ev.data.object; const o = pi.metadata && pi.metadata.order ? await db.one('SELECT * FROM orders WHERE code=$1', [pi.metadata.order]) : null;
      if (o && o.status === 'pending') { const full = await stripe.paymentIntents.retrieve(pi.id, { expand: ['latest_charge'] }).catch(() => pi); await markPaid(o, 'stripe', pi.id, stripeMethod(full), stripeFp(full)); }
    }
    if (ev.type === 'payment_intent.payment_failed') {
      const pi = ev.data.object; const err = (pi.last_payment_error && pi.last_payment_error.message) || 'Declined';
      const o = pi.metadata && pi.metadata.order ? await db.one('SELECT o.*, u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.code=$1', [pi.metadata.order]) : null;
      if (o) await declined(o, err);
    }
    if (ev.type === 'charge.refunded' && ev.data.object.refunded) {
      const ch = ev.data.object; const o = await db.one("SELECT * FROM orders WHERE provider='stripe' AND status='paid' AND provider_ref=$1", [ch.payment_intent]);
      if (o) await refund(null, o.code, 'Refunded in Stripe', { external: true });
    }
    if (ev.type === 'charge.dispute.created') { const d = ev.data.object; await recordDispute('stripe', d.payment_intent || d.charge, Number(d.amount) / 100, d.reason, d.id); }
    await hookLog('stripe', ev.type, true, ''); res.json({ received: true });
  } catch (e) { console.error('webhook', e); await hookLog('stripe', ev.type, false, e.message); res.status(500).send('error'); }
}
async function confirmoHook(req, res) {
  const c = await I.cfg('confirmo'); if (!c) return res.status(400).send('not configured');
  const raw = req.body.toString('utf8'); const sig = String(req.headers['bp-signature'] || '').toLowerCase();
  const exp = require('crypto').createHash('sha256').update(raw + (c.callbackPassword || ''), 'utf8').digest('hex');
  if (!c.callbackPassword || exp !== sig) { await hookLog('confirmo', 'bad signature', false, ''); return res.status(400).send('bad signature'); }
  const inv = JSON.parse(raw);
  const o = await db.one('SELECT * FROM orders WHERE code=$1 OR provider_ref=$2', [inv.reference || '', inv.id || '']);
  if (o && inv.status === 'paid') await markPaid(o, 'confirmo', inv.id, 'Crypto via Confirmo');
  if (o && ['expired', 'error', 'blocked'].includes(inv.status) && o.status === 'pending') await db.q("UPDATE orders SET meta = meta || $2 WHERE id=$1", [o.id, JSON.stringify({ cryptoStatus: inv.status })]);
  await hookLog('confirmo', inv.status, true, inv.reference || inv.id); res.json({ ok: true });
}
async function recordDispute(provider, ref, amount, reason, id) {
  const o = await db.one('SELECT * FROM orders WHERE provider_ref=$1 OR provider_ref LIKE $2', [ref, '%' + ref]);
  await db.q("INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2", ['dispute.' + id, JSON.stringify({ id, provider, order: o ? o.code : null, user: o ? o.user_id : null, amount, reason, status: 'open', opened: new Date().toISOString() })]);
  const du = o ? await db.one('SELECT tid, email FROM users WHERE id=$1', [o.user_id]) : null;
  I.alert('dispute', `:rotating_light: Chargeback opened: ${o ? o.code : ref} for $${amount} (${reason})`, { dispute: id, provider, providerRef: ref, order: o ? o.code : null, amount: Number(amount), currency: 'USD', reason: reason || null, status: 'open', user: du ? { id: du.tid, email: du.email } : null });
}

// What a refund of this order would do, for the Finance drawer and for the checks in refund()
async function refundPreview(code) {
  const o = await db.one('SELECT * FROM orders WHERE code=$1', [clean(code, 30)]);
  if (!o) bad('Order not found', 404);
  const out = { code: o.code, total: Number(o.total), kind: o.kind, blocked: '', accounts: [], payouts: [], warn: [], needConfirm: false };
  const cbk = o.meta && o.meta.chargeback; const dsp = (o.meta && o.meta.dispute) || '';
  if (o.status !== 'paid') out.blocked = 'Only paid orders can be refunded';
  else if (!(Number(o.total) > 0)) out.blocked = 'This order was free, so there is nothing to refund';
  else if (cbk && cbk !== 'won') out.blocked = ['lost', 'accepted'].includes(cbk) ? `Order ${o.code} was charged back${dsp ? ' (' + dsp + ')' : ''}, so the bank already returned this money. It cannot be refunded as well.` : `Order ${o.code} has an open chargeback${dsp ? ' (' + dsp + ')' : ''}. Settle it in Disputes first: a refund now would pay the money back twice.`;
  if (o.status !== 'paid') return out;
  const n = async (id) => (await db.one('SELECT count(*)::int n FROM trades WHERE account_id=$1', [id])).n;
  if (o.kind === 'reset') {
    // A reset refund gives back the fee only. The account was bought with another order and stays open.
    const a = o.meta && o.meta.account ? await db.one('SELECT id, phase FROM accounts WHERE id=$1 AND user_id=$2', [o.meta.account, o.user_id]) : null;
    out.reset = a ? { id: a.id, phase: a.phase, trades: await n(a.id) } : null;
    if (out.reset && out.reset.trades > 0) { out.needConfirm = true; out.warn.push(`The reset was already used: ${a.id} has ${out.reset.trades} ${out.reset.trades === 1 ? 'trade' : 'trades'} since it. The account stays open and keeps its fresh balance.`); }
  } else {
    // Accounts this order opened, and the funded accounts that grew out of them
    const bought = [].concat((o.meta && o.meta.accounts) || [], o.meta && o.meta.account ? [o.meta.account] : []);
    const rows = bought.length ? await db.all("SELECT id, kind, phase FROM accounts WHERE user_id=$2 AND (id = ANY($1) OR parent_id = ANY($1)) AND phase IN ('active','passed','review') ORDER BY created_at", [bought, o.user_id]) : [];
    for (const a of rows) out.accounts.push({ id: a.id, funded: a.kind === 'funded', phase: a.phase, trades: await n(a.id) });
    out.payouts = out.accounts.length ? (await db.all('SELECT code, account_id, amount::float amount FROM payouts WHERE account_id = ANY($1) AND status = ANY($2)', [out.accounts.map((x) => x.id), core.OPEN_PAY])).map((x) => ({ code: x.code, account: x.account_id, amount: x.amount })) : [];
    const traded = out.accounts.filter((x) => x.trades > 0);
    if (traded.length) { out.needConfirm = true; out.warn.push(`${traded.length === 1 ? 'An account from this order has' : traded.length + ' accounts from this order have'} already traded.`); }
    if (out.accounts.some((x) => x.funded)) { out.needConfirm = true; out.warn.push('A funded account will be closed.'); }
    if (out.payouts.length) { out.needConfirm = true; out.warn.push(`${out.payouts.length === 1 ? 'An open payout request' : out.payouts.length + ' open payout requests'} will be denied.`); }
  }
  // Credits orders: what was spent, what can go back as money, and whether what the spent credits bought can be taken back (packs.js)
  if (o.kind === 'credits' && Number(o.total) > 0) { const ri = await require('./packs').refundInfo(o); out.credits = ri;
    if (ri && ri.spent) { out.needConfirm = true; out.warn.push(`${ri.msg}. ${ri.refundable > 0 ? 'Only the unspent share goes back' : 'Nothing can go back'} unless you take back what the credits bought.`); if (ri.block) out.warn.push(ri.block); } }
  const days = Math.floor((Date.now() - new Date(o.paid_at || o.created_at)) / 86400000);
  if (days > 14) out.warn.push(`This order was paid ${days} days ago, outside the 14 days in the refund policy.`);
  return out;
}

async function refund(actorId, code, note, opt = {}) {
  let o = await db.one('SELECT * FROM orders WHERE code=$1', [clean(code, 30)]);
  if (!o) bad('Order not found', 404);
  const pv = await refundPreview(o.code);
  // Money the processor already sent back is recorded whatever the state; staff refunds follow the checks
  if (pv.blocked && !(opt.external && o.status === 'paid')) bad(pv.blocked);
  if (pv.needConfirm && !opt.confirm && !opt.external) bad(pv.warn.join(' ') + ' Open the order in Finance, check what the refund will do and confirm it there.');
  // Credits orders (packs.js): only the unspent share of the credits goes back as money, unless staff take back what the spent credits bought.
  // From here on o.total is the amount being refunded; o.fullTotal is set when that is less than the order total.
  if (o.status === 'paid' && o.kind === 'credits' && Number(o.total) > 0) { const cr = await require('./packs').refundPlan(o, opt); o = Object.assign({}, o, { refundPlan: cr }, cr.amount < Number(o.total) ? { total: cr.amount, fullTotal: Number(o.total) } : {}); }
  if (opt.external) { /* already refunded at the processor */ } else if (o.provider === 'stripe' && o.provider_ref) {
    const stripe = await stripeClient(); if (!stripe) bad('Stripe is not connected, so this refund cannot be sent');
    const pi = o.provider_ref.startsWith('cs_') ? (await stripe.checkout.sessions.retrieve(o.provider_ref)).payment_intent : o.provider_ref;
    await stripe.refunds.create(Object.assign({ payment_intent: pi }, o.fullTotal ? { amount: Math.round(Number(o.total) * 100) } : {}));
  } else if (o.provider === 'tailoredpay' && o.provider_ref) {
    const c = await I.cfg('tailoredpay'); if (!c) bad('TailoredPay is not connected, so this refund cannot be sent');
    const r = await I.nmi(c, { type: 'refund', transactionid: o.provider_ref, amount: Number(o.total).toFixed(2) });
    if (r.response !== '1' && o.fullTotal) bad('The gateway refused the part refund: ' + (r.responsetext || 'try again after the payment settles'));
    if (r.response !== '1') { const v = await I.nmi(c, { type: 'void', transactionid: o.provider_ref }); if (v.response !== '1') bad('The gateway refused the refund: ' + (r.responsetext || v.responsetext)); }
  }
  const reason = note || ''; const staffOnly = o.provider === 'confirmo' && !opt.external ? 'Crypto refund: send it manually from Confirmo' : '';
  const done = await db.one("UPDATE orders SET status='refunded', refunded_at=now(), meta = meta || $2 WHERE id=$1 AND status='paid' RETURNING id", [o.id, JSON.stringify({ refundReason: reason, refundNote: [reason, staffOnly].filter(Boolean).join(' · ') })]);
  if (!done) bad('Only paid orders can be refunded');
  // Take back the credits this order earned, and the referrer's bonus if this was a referred trader's first purchase
  let took = 0;
  const earned = o.kind === 'credits' ? 0 : Math.floor(Number(o.total)); if (earned > 0) { const u0 = await db.one('SELECT points FROM users WHERE id=$1', [o.user_id]); const take = Math.min(earned, Math.max(0, u0 ? u0.points : 0)); if (take > 0) { await core.points(null, o.user_id, -take, 'Refund ' + o.code, 'refund'); took += take; } }
  // Packs: bought credits come back out, free packs from this order that are still unopened are removed with unused cards from them
  const pk = (await require('./packs').onRefund(o).catch((e) => { console.error('packs refund', e); return {}; })) || {};
  took += Number(pk.credits) || 0;
  // the referrer's reward or the affiliate's commission for this order is taken back (server/affiliates.js)
  await require('./affiliates').onRefund(o, core).catch((e) => console.error('affiliate refund', e));
  // Open payouts on the accounts being closed are denied first (the trader is told), then the accounts close.
  // A reset order closes nothing: its account was bought with another order.
  const denied = [];
  for (const p of pv.payouts) { try { await core.reviewPayout(actorId, p.code, 'deny', `Not paid: order ${o.code} was refunded and ${p.account} is closed`); denied.push(p.code); } catch (e) { console.error('refund payout', p.code, e.message); } }
  const closed = pv.accounts.length ? (await db.all("UPDATE accounts SET phase='closed', closed_at=now(), breach_reason='Order refunded' WHERE id = ANY($1) AND phase IN ('active','passed','review') RETURNING id", [pv.accounts.map((x) => x.id)])).map((x) => x.id) : [];
  // What the trader lost with the refund, in plain words: shown on their Billing row and receipt, and to staff in the order drawer
  const nn = (v, one, many) => `${Number(v).toLocaleString('en-US')} ${v === 1 ? one : many}`;
  const tookTxt = [closed.length ? `${closed.join(', ')} closed` : '', denied.length ? `${nn(denied.length, 'payout request', 'payout requests')} not paid (${denied.join(', ')})` : '', took ? `${nn(took, 'credit', 'credits')} taken back` : '', pk.packs ? `${nn(pk.packs, 'unopened pack', 'unopened packs')} removed` : '', pk.cards ? `${nn(pk.cards, 'unused card', 'unused cards')} removed` : '', pk.note || '', pk.cardBack ? `${String(pk.cardBack).replace(/^Card: /, '')} card saved for your next ${/reset/i.test(pk.cardBack) ? 'reset' : 'checkout'} again` : ''].filter(Boolean).join(' · ');
  await db.q("UPDATE orders SET meta = meta || $2 WHERE id=$1", [o.id, JSON.stringify({ refundTook: tookTxt, refundClosed: closed, refundNote: [reason, staffOnly, tookTxt].filter(Boolean).join(' · ') })]);
  require('./mail').t('refund', o.user_id, { amount: money2(o.total), order: o.code, paid_with: o.pay_method || o.provider || 'Original payment method', url: `${BASE()}/app#billing` });
  await core.notify(null, o.user_id, `Refund for ${o.code}`, `${money2(o.total)} is on its way back to your original payment method.${o.kind === 'reset' && pv.reset ? ` Your account ${pv.reset.id} stays open.` : ''}${tookTxt ? ' With this refund: ' + tookTxt + '.' : ''}`, 'billing');
  await core.audit(actorId, 'order.refund', o.code, { note: reason, closed, denied, credits: took, confirmed: !!opt.confirm });
  return { ok: true, closed, denied, credits: took };
}

async function receipt(user, code) {
  // Staff can open any receipt only from a finished back-office sign-in (two-step login, allowed network, not suspended)
  const staff = ['admin', 'finance', 'support'].includes(user.role) && require('./auth').staffOk(user);
  const o = await db.one('SELECT * FROM orders WHERE code=$1 AND (user_id=$2 OR $3)', [clean(code, 30), user.id, staff]);
  if (!o) throw new Error('nf');
  const u = await db.one('SELECT * FROM users WHERE id=$1', [o.user_id]);
  const e = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const co = await require('./mail').company();
  // Money with the minus sign in front of the dollar sign; unpaid orders are invoices, not receipts
  const m = (v) => (Number(v) < 0 ? '−' : '') + money2(Math.abs(Number(v) || 0));
  const paid = o.status === 'paid' || o.status === 'refunded'; const doc = paid ? 'Receipt' : 'Invoice — Unpaid';
  const pos = o.lines.filter((l) => !(Number(l.amount) < 0)), neg = o.lines.filter((l) => Number(l.amount) < 0); const row = (l) => `<tr><td>${e(l.label)}</td><td>${m(l.amount)}</td></tr>`;
  const stat = o.status === 'paid' ? 'Paid' : o.status === 'refunded' ? `Refunded on ${longDate(o.refunded_at)}` : 'Not paid';
  const took = o.status === 'refunded' && o.meta && o.meta.refundTook ? `<p>With this refund: ${e(o.meta.refundTook)}.</p>` : '';
  return `<!doctype html><meta charset="utf-8"><title>${doc} ${e(o.code)}</title><style>body{font:15px/1.5 system-ui;max-width:560px;margin:48px auto;color:#111;padding:0 20px}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin:20px 0}td{padding:8px 0;border-bottom:1px solid #eee}td:last-child{text-align:right}.t td{font-weight:700;border:0}.co{color:#555;font-size:13px;margin:0 0 18px}</style>
  <h1>${e(co.brand)} ${doc}</h1><p class="co">${[co.legal, co.address, co.taxId ? 'Tax number ' + co.taxId : '', co.support].filter(Boolean).map(e).join('<br>')}</p><p>${e(o.code)} · ${paid ? 'Paid ' + longDate(o.paid_at || o.created_at) : 'Created ' + longDate(o.created_at)}<br>${e(u.first)} ${e(u.last)} · ${e(u.email)}</p>
  <table>${pos.map(row).join('')}${neg.length ? `<tr><td>Subtotal</td><td>${m(pos.reduce((s2, l) => s2 + Number(l.amount), 0))}</td></tr>` : ''}${neg.map(row).join('')}<tr class="t"><td>${paid ? 'Total Paid' : 'Total Due'}</td><td>${m(o.total)}</td></tr>${o.status === 'refunded' ? `<tr><td>Refunded ${longDate(o.refunded_at)}</td><td>${m(-Number(o.total))}</td></tr>` : ''}</table>
  <p>Status: ${e(stat)}${o.pay_method ? ' · ' + e(o.pay_method) : ''}</p>${took}${paid ? '' : '<p>This order has not been paid. No money was taken.</p>'}<p style="color:#666;font-size:13px">Evaluations and funded accounts are simulated trading accounts. Fees are not deposits and are not traded.</p><script>window.print&&setTimeout(()=>window.print(),300)</script>`;
}

module.exports = { checkLimits, maintGuard, enabled, mode, methods, refreshMode, confirmoHook, hookLog, recordDispute, createOrder, createResetOrder, quoteReset, applyCode, createActivationOrder, payOrder, getOrder, webhook, refund, refundPreview, receipt, markPaid };
