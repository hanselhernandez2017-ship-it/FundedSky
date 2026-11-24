// Orders and payments. Uses Stripe Checkout when STRIPE_SECRET_KEY is set (test or live key),
// otherwise a built-in test mode that accepts the 4242 4242 4242 4242 test card.
const db = require('./db');
const core = require('./core');
const R = require('./rules');
const { bad, clean, money2, longDate, round2 } = require('./util');
const { BASE } = require('./auth');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const enabled = () => !!stripe;
const mode = () => (stripe ? (process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'stripe-live' : 'stripe-test') : 'test');

async function insertOrder(user, kind, priced, meta) {
  const code = await core.ordCode();
  const o = await db.one(`INSERT INTO orders(code,user_id,kind,lines,items,subtotal,discount,total,promo,meta) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [code, user.id, kind, JSON.stringify(priced.lines), JSON.stringify(priced.items || []), priced.subtotal, priced.discount, priced.total, priced.promo || null, JSON.stringify(meta || {})]);
  return o;
}

async function createOrder(user, body) {
  const priced = await core.priceCart(body.items, { promo: body.promo, coupon: body.coupon, userId: user.id });
  // one use per trader for promo codes marked "once"
  if (priced.promo) {
    const cat = await core.catalog(); const p = cat.promos.find((x) => x.code === priced.promo);
    if (p && p.once && (await db.one("SELECT 1 FROM orders WHERE user_id=$1 AND promo=$2 AND status='paid'", [user.id, p.code]))) bad('You have already used this code');
  }
  const kind = priced.items.every((i) => i.plan === 'instant') ? 'instant' : priced.items.some((i) => i.plan === 'instant') ? 'mixed' : 'evaluation';
  const o = await insertOrder(user, kind, priced, { coupon: priced.coupon || undefined });
  if (Number(o.total) === 0) return finishFree(o);
  return { code: o.code, total: Number(o.total), mode: mode() };
}

async function createResetOrder(user, body) {
  const id = clean(body.account, 40);
  const a = await db.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2', [id, user.id]);
  if (!a) bad('Account not found', 404);
  if (a.kind !== 'evaluation' || !['active', 'breached'].includes(a.phase)) bad('This account cannot be reset');
  const cat = await core.catalog(); const s = core.sizeDef(cat, a.plan, a.size);
  const addons = (body.addons || []).filter((x) => ['reset', 'daily'].includes(x));
  const lines = []; let subtotal = 0; let discount = 0;
  const base = Math.round(s.price * cat.resetPct / 100);
  lines.push({ label: `Reset · ${core.kLabel(a.size)} ${core.planDef(cat, a.plan).short}`, amount: base, kind: 'plan' }); subtotal += base;
  if (a.free_resets > 0) { lines.push({ label: 'Free Reset (your add-on)', amount: -base, kind: 'discount' }); discount += base; }
  for (const ad of addons) { const def = cat.addons[ad]; if ((a.addons || []).includes(ad) && ad === 'daily') continue; const amt = Math.round(s.price * def.pct / 100); lines.push({ label: def.name, amount: amt, kind: 'addon' }); subtotal += amt; }
  if (body.coupon) {
    const c = await db.one('SELECT * FROM coupons WHERE code=$1 AND user_id=$2 AND used=false', [clean(body.coupon, 40), user.id]);
    if (!c) bad('That reward code is not valid');
    const d = c.kind === 'free_reset' ? Math.max(0, base - (a.free_resets > 0 ? base : 0)) : c.kind === 'discount' ? round2((subtotal - discount) * Number(c.pct) / 100) : 0;
    if (!d) bad('That code does not apply to resets');
    lines.push({ label: c.label, amount: -d, kind: 'coupon' }); discount += d;
  }
  const priced = { lines, subtotal, discount, total: Math.max(0, round2(subtotal - discount)), items: [{ plan: a.plan, size: a.size, addons, qty: 1 }] };
  const o = await insertOrder(user, 'reset', priced, { account: a.id, addons, coupon: body.coupon || undefined, useFree: a.free_resets > 0 });
  if (Number(o.total) === 0) return finishFree(o);
  return { code: o.code, total: Number(o.total), mode: mode() };
}

async function createActivationOrder(user, body) {
  const id = clean(body.account, 40);
  const a = await db.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2', [id, user.id]);
  if (!a || a.phase !== 'passed') bad('This account is not waiting for activation');
  if (!(a.steps || {}).agreement) bad('Sign the funded agreement first');
  const existing = await db.one("SELECT * FROM orders WHERE user_id=$1 AND kind='activation' AND status='pending' AND meta->>'account'=$2", [user.id, a.id]);
  if (existing) return { code: existing.code, total: Number(existing.total), mode: mode() };
  const cat = await core.catalog(); const s = core.sizeDef(cat, a.plan, a.size);
  const priced = { lines: [{ label: `Activation fee · ${core.kLabel(a.size)} ${core.planDef(cat, a.plan).short}`, amount: s.activation, kind: 'plan' }], subtotal: s.activation, discount: 0, total: s.activation, items: [] };
  const o = await insertOrder(user, 'activation', priced, { account: a.id });
  return { code: o.code, total: Number(o.total), mode: mode() };
}

async function finishFree(o) {
  await db.q("UPDATE orders SET status='paid', paid_at=now(), provider='none', pay_method='No charge' WHERE id=$1", [o.id]);
  const r = await core.fulfilOrder(o.id);
  if (o.kind === 'reset' && o.meta.useFree) await db.q('UPDATE accounts SET free_resets=GREATEST(0,free_resets-1) WHERE id=$1', [o.meta.account]);
  return { code: o.code, total: 0, paid: true, accounts: r.accounts };
}

async function markPaid(o, provider, ref, method) {
  const r = await db.one("UPDATE orders SET status='paid', paid_at=now(), provider=$2, provider_ref=$3, pay_method=$4 WHERE id=$1 AND status='pending' RETURNING *", [o.id, provider, ref || null, method || '']);
  if (!r) return; // already paid
  await core.fulfilOrder(o.id);
  if (o.kind === 'reset' && o.meta.useFree) await db.q('UPDATE accounts SET free_resets=GREATEST(0,free_resets-1) WHERE id=$1', [o.meta.account]);
  const u = await db.one('SELECT email, first FROM users WHERE id=$1', [o.user_id]);
  await require('./mail').send(u.email, `Receipt for ${o.code}`, `Hi ${u.first},\n\nThanks for your order.\n\n${o.lines.map((l) => `${l.label}: ${money2(l.amount)}`).join('\n')}\nTotal: ${money2(o.total)}\n\nYour accounts are on your dashboard: ${BASE()}/app`, 'receipt');
}

async function payOrder(user, code, body) {
  const o = await db.one('SELECT * FROM orders WHERE code=$1 AND user_id=$2', [clean(code, 30), user.id]);
  if (!o) bad('Order not found', 404);
  if (o.status === 'paid') return { paid: true, code: o.code };
  if (o.status !== 'pending') bad('This order can no longer be paid');
  if (stripe) {
    const s = await stripe.checkout.sessions.create({
      mode: 'payment', customer_email: user.email, client_reference_id: o.code,
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: Math.round(Number(o.total) * 100), product_data: { name: `Funded Sky ${o.code}`, description: o.lines.map((l) => l.label).join(', ').slice(0, 300) } } }],
      metadata: { order: o.code }, success_url: `${BASE()}/checkout/confirmed?order=${o.code}&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${BASE()}/checkout/payment?order=${o.code}&canceled=1`
    });
    await db.q('UPDATE orders SET provider_ref=$2, provider=$3 WHERE id=$1', [o.id, s.id, 'stripe']);
    return { redirect: s.url };
  }
  // built-in test mode
  const num = String(body.card || '').replace(/\D/g, '');
  if (num !== '4242424242424242') bad('Test mode: use the test card 4242 4242 4242 4242 with any future date and any CVC');
  if (!/^\d{2}\s*\/\s*\d{2}$/.test(String(body.exp || '').trim())) bad('Enter the expiry as MM / YY');
  await markPaid(o, 'test', 'test_' + Date.now(), 'Test card •••• 4242');
  return { paid: true, code: o.code };
}

async function getOrder(user, code, sessionId) {
  let o = await db.one('SELECT * FROM orders WHERE code=$1 AND user_id=$2', [clean(code, 30), user.id]);
  if (!o) bad('Order not found', 404);
  if (o.status === 'pending' && stripe && (sessionId || o.provider_ref)) {
    const s = await stripe.checkout.sessions.retrieve(sessionId || o.provider_ref).catch(() => null);
    if (s && s.payment_status === 'paid' && s.metadata && s.metadata.order === o.code) { await markPaid(o, 'stripe', s.payment_intent || s.id, 'Card via Stripe'); o = await db.one('SELECT * FROM orders WHERE id=$1', [o.id]); }
  }
  return { code: o.code, kind: o.kind, status: o.status, lines: o.lines, items: o.items, subtotal: Number(o.subtotal), discount: Number(o.discount), total: Number(o.total), accounts: (o.meta && o.meta.accounts) || [], account: o.meta && o.meta.account, mode: mode(), email: user.email };
}

async function webhook(req, res) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(400).send('webhook not configured');
  let ev;
  try { ev = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET); } catch (e) { return res.status(400).send('bad signature'); }
  try {
    if (ev.type === 'checkout.session.completed' && ev.data.object.payment_status === 'paid') {
      const s = ev.data.object; const o = await db.one('SELECT * FROM orders WHERE code=$1', [s.metadata && s.metadata.order]);
      if (o) await markPaid(o, 'stripe', s.payment_intent || s.id, 'Card via Stripe');
    }
    res.json({ received: true });
  } catch (e) { console.error('webhook', e); res.status(500).send('error'); }
}

async function refund(actorId, code, note) {
  const o = await db.one('SELECT * FROM orders WHERE code=$1', [clean(code, 30)]);
  if (!o) bad('Order not found', 404);
  if (o.status !== 'paid') bad('Only paid orders can be refunded');
  if (o.provider === 'stripe' && stripe && o.provider_ref) {
    const pi = o.provider_ref.startsWith('cs_') ? (await stripe.checkout.sessions.retrieve(o.provider_ref)).payment_intent : o.provider_ref;
    await stripe.refunds.create({ payment_intent: pi });
  }
  await db.q("UPDATE orders SET status='refunded', refunded_at=now(), meta = meta || $2 WHERE id=$1", [o.id, JSON.stringify({ refundNote: note || '' })]);
  // close accounts created by this order that have not traded
  for (const id of (o.meta && o.meta.accounts) || []) await db.q("UPDATE accounts SET phase='closed', closed_at=now(), breach_reason='Order refunded' WHERE id=$1 AND phase IN ('active','passed')", [id]);
  await core.notify(null, o.user_id, `Refund for ${o.code}`, `${money2(o.total)} is on its way back to your original payment method.`, 'billing');
  await core.audit(actorId, 'order.refund', o.code, { note });
  return { ok: true };
}

async function receipt(user, code) {
  const o = await db.one('SELECT * FROM orders WHERE code=$1 AND (user_id=$2 OR $3)', [clean(code, 30), user.id, ['admin', 'finance', 'support'].includes(user.role)]);
  if (!o) throw new Error('nf');
  const u = await db.one('SELECT * FROM users WHERE id=$1', [o.user_id]);
  const e = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  return `<!doctype html><meta charset="utf-8"><title>Receipt ${e(o.code)}</title><style>body{font:15px/1.5 system-ui;max-width:560px;margin:48px auto;color:#111;padding:0 20px}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin:20px 0}td{padding:8px 0;border-bottom:1px solid #eee}td:last-child{text-align:right}.t td{font-weight:700;border:0}</style>
  <h1>Funded Sky receipt</h1><p>${e(o.code)} · ${longDate(o.paid_at || o.created_at)}<br>${e(u.first)} ${e(u.last)} · ${e(u.email)}</p>
  <table>${o.lines.map((l) => `<tr><td>${e(l.label)}</td><td>${money2(l.amount)}</td></tr>`).join('')}<tr class="t"><td>Total</td><td>${money2(o.total)}</td></tr></table>
  <p>Status: ${e(o.status)}${o.pay_method ? ' · ' + e(o.pay_method) : ''}</p><p style="color:#666;font-size:13px">Evaluations and funded accounts are simulated trading accounts. Fees are not deposits and are not traded.</p><script>window.print&&setTimeout(()=>window.print(),300)</script>`;
}

module.exports = { enabled, mode, createOrder, createResetOrder, createActivationOrder, payOrder, getOrder, webhook, refund, receipt, markPaid };
