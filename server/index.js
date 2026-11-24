const path = require('path');
const fs = require('fs');
const express = require('express');
const db = require('./db');
const core = require('./core');
const auth = require('./auth');
const sim = require('./sim');
const trader = require('./trader');
const admin = require('./admin');
const pay = require('./payments');
const content = require('./content');
const { migrate } = require('./migrate');
const { HttpError, bad, clean, round2 } = require('./util');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); res.setHeader('X-Frame-Options', 'SAMEORIGIN'); next(); });
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => pay.webhook(req, res));
app.use(express.json({ limit: '200kb' }));
app.use((req, res, next) => auth.loadUser(req, res, next).catch(next));

// Basic rate limit for auth endpoints
const hits = new Map();
const limit = (n, ms) => (req, res, next) => { const k = req.ip + req.path; const now = Date.now(); const h = (hits.get(k) || []).filter((t) => now - t < ms); h.push(now); hits.set(k, h); if (h.length > n) return res.status(429).json({ error: 'Too many tries. Wait a minute and try again.' }); next(); };
setInterval(() => hits.clear(), 10 * 60 * 1000).unref();

const h = (fn) => async (req, res) => {
  try { const out = await fn(req, res); if (!res.headersSent) res.json(out || { ok: true }); }
  catch (e) { const st = e instanceof HttpError ? e.status : 500; if (st === 500) console.error(req.method, req.path, e); res.status(st).json({ error: st === 500 ? 'Something went wrong on our side. Try again.' : e.message }); }
};

// ---------- public ----------
app.get('/api/health', h(async () => ({ ok: true, db: !!(await db.one('SELECT 1 AS x')), stripe: pay.enabled(), market: sim.marketOpen() })));
app.get('/api/catalog', h(async () => { const c = await core.catalog(); return { plans: c.plans.filter((p) => p.active), evalRules: c.evalRules, evalCommon: c.evalCommon, fundedCommon: c.fundedCommon, fundedCaps: c.fundedCaps, instantRules: c.instantRules, instantCommon: c.instantCommon, instantCaps: c.instantCaps, addons: c.addons, resetPct: c.resetPct, bundles: c.bundles, promos: (c.promos || []).filter((p) => p.active && (!p.ends || p.ends >= new Date().toISOString().slice(0, 10))).map(({ code, name, pct, plans, starts, ends, desc }) => ({ code, name, pct, plans, starts, ends, desc })), payments: pay.mode() }; }));
app.get('/api/me', h(async (req) => (req.user ? { user: { email: req.user.email, first: req.user.first, last: req.user.last, role: req.user.role, verified: req.user.verified, country: req.user.country } } : { user: null })));
app.post('/api/auth/signup', limit(8, 60000), h((req, res) => auth.signup(req, res)));
app.post('/api/auth/login', limit(10, 60000), h((req, res) => auth.login(req, res)));
app.post('/api/auth/logout', h((req, res) => auth.logout(req, res)));
app.post('/api/auth/forgot', limit(5, 60000), h((req) => auth.forgot(req)));
app.post('/api/auth/reset', limit(10, 60000), h((req, res) => auth.resetPassword(req, res)));
app.post('/api/auth/verify', limit(10, 60000), h((req) => auth.verifyEmail(req)));
app.post('/api/auth/resend', auth.needUser, limit(4, 60000), h((req) => auth.resendVerify(req)));
app.post('/api/cart/price', h(async (req) => core.priceCart(req.body.items, { promo: req.body.promo, coupon: req.body.coupon, userId: req.user && req.user.id })));

// ---------- trader ----------
const T = express.Router(); T.use(auth.needUser);
T.get('/trader/boot', h(async (req) => { const host = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/^https?:\/\//, ''); return trader.boot(req.user, req.sess, host); }));
T.post('/orders', h((req) => pay.createOrder(req.user, req.body)));
T.post('/orders/reset', h((req) => pay.createResetOrder(req.user, req.body)));
T.post('/orders/activation', h((req) => pay.createActivationOrder(req.user, req.body)));
T.get('/orders/:code', h((req) => pay.getOrder(req.user, req.params.code, req.query.session_id)));
T.post('/orders/:code/pay', h((req) => pay.payOrder(req.user, req.params.code, req.body)));
T.get('/orders/:code/receipt', async (req, res) => { try { res.type('html').send(await pay.receipt(req.user, req.params.code)); } catch (e) { res.status(404).send('Not found'); } });
T.post('/accounts/:id/agreement', h(async (req) => { const r = await core.signAgreement(req.user.id, req.params.id); if (r.activation) { const o = await pay.createActivationOrder(req.user, { account: req.params.id }); return { checkout: '/checkout/payment?order=' + o.code }; } return r; }));
T.post('/payouts', h((req) => core.requestPayout(req.user.id, clean(req.body.account, 40), req.body.amount, parseInt(req.body.method, 10))));
T.post('/payout-methods', h(async (req) => {
  const rail = ['Rise', 'USDC'].includes(req.body.rail) ? req.body.rail : 'Rise'; const raw = clean(req.body.label, 120); if (raw.length < 4) bad('Enter your account or wallet details');
  if (rail === 'USDC' && !/^0x[a-fA-F0-9]{40}$/.test(raw)) bad('Enter a full wallet address that starts with 0x');
  const label = rail === 'USDC' ? `USDC · Wallet ${raw.slice(0, 6)}…${raw.slice(-4)}` : `Rise · Bank •••• ${raw.replace(/\D/g, '').slice(-4) || raw.slice(-4)}`;
  const n = (await db.one('SELECT count(*)::int n FROM payout_methods WHERE user_id=$1', [req.user.id])).n; if (n >= 5) bad('You can keep up to 5 payout methods');
  await db.q("INSERT INTO payout_methods(user_id,rail,label,is_default,unlock_at) VALUES($1,$2,$3,$4, now() + interval '48 hours')", [req.user.id, rail, label, n === 0]);
  await core.notify(null, req.user.id, 'New payout method added', `${label}. It can be used in 48 hours. If this wasn't you, contact support now.`, 'settings?tab=pay');
}));
T.post('/payout-methods/:id/default', h(async (req) => { await db.q('UPDATE payout_methods SET is_default=(id=$2) WHERE user_id=$1', [req.user.id, +req.params.id]); }));
T.post('/notifications/read', h(async (req) => { if (req.body.all) await db.q('UPDATE notifications SET read=true WHERE user_id=$1', [req.user.id]); else await db.q('UPDATE notifications SET read=true WHERE user_id=$1 AND id=$2', [req.user.id, +req.body.id]); }));
T.post('/tickets', h(async (req) => {
  const s = clean(req.body.subject, 160); if (!s) bad('Add a subject');
  const t = await db.one('INSERT INTO tickets(user_id,subject,category,channel) VALUES($1,$2,$3,$4) RETURNING id', [req.user.id, s, clean(req.body.category, 60) || 'General', 'Web']);
  await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, req.user.id, clean(req.body.body, 5000) || s]);
  return { id: t.id };
}));
T.post('/tickets/:id/reply', h(async (req) => {
  const t = await db.one('SELECT * FROM tickets WHERE id=$1 AND user_id=$2', [+req.params.id, req.user.id]); if (!t) bad('Ticket not found', 404);
  await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, req.user.id, clean(req.body.body, 5000)]);
  await db.q("UPDATE tickets SET status='open', updated_at=now() WHERE id=$1", [t.id]);
}));
const SETTING_KEYS = ['nEmail', 'nSms', 'nPush', 'nNews', 'nMkt', 'nComp', 'mfaPay'];
T.post('/settings', h(async (req) => { const o = {}; for (const k of SETTING_KEYS) if (k in req.body) o[k] = !!req.body[k]; await db.q('UPDATE users SET settings = settings || $2 WHERE id=$1', [req.user.id, JSON.stringify(o)]); }));
T.post('/profile', h(async (req) => { await db.q('UPDATE users SET phone=$2 WHERE id=$1', [req.user.id, clean(req.body.phone, 40)]); }));
T.post('/password', h((req) => auth.changePassword(req)));
T.post('/sessions/:prefix/revoke', h(async (req) => { await db.q("DELETE FROM sessions WHERE user_id=$1 AND token LIKE $2 || '%' AND token<>$3", [req.user.id, clean(req.params.prefix, 20), req.sess]); }));
T.post('/journal/note', h(async (req) => {
  const day = clean(req.body.day, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) bad('Pick a day first');
  await db.q("UPDATE users SET settings = jsonb_set(settings, '{notes}', COALESCE(settings->'notes','{}'::jsonb) || jsonb_build_object($2::text, $3::text)) WHERE id=$1", [req.user.id, day, clean(req.body.text, 2000)]);
}));
T.post('/courses/:id/lesson', h(async (req) => {
  const C = await content.all(); const c = C.courses.find((x) => x.id === req.params.id); if (!c) bad('Course not found', 404);
  const prog = (req.user.settings && req.user.settings.courses) || {}; const done = Math.min(c.l, (prog[c.id] || 0) + 1);
  await db.q("UPDATE users SET settings = jsonb_set(settings, '{courses}', COALESCE(settings->'courses','{}'::jsonb) || jsonb_build_object($2::text, $3::int)) WHERE id=$1", [req.user.id, c.id, done]);
  if (done === c.l && (prog[c.id] || 0) < c.l) await core.points(null, req.user.id, 100, 'Finished ' + c.n);
  return { done };
}));
T.post('/rewards/:id/redeem', h(async (req) => {
  const C = await content.all(); const r = C.rewards.find((x) => x.id === req.params.id); if (!r) bad('Reward not found', 404);
  return db.tx(async (c) => {
    const u = await c.one('SELECT points FROM users WHERE id=$1 FOR UPDATE', [req.user.id]); if (u.points < r.pts) bad('You need more points for this reward');
    const map = { r1: ['discount', 10], r2: ['free_reset', 0], r3: ['discount', 25], r4: ['free_eval', 0], r5: ['split', 0], r6: ['merch', 0] };
    const [kind, pct] = map[r.id] || ['discount', 0];
    const code = 'FS-' + r.id.toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    await c.q('INSERT INTO coupons(code,user_id,pct,label,kind) VALUES($1,$2,$3,$4,$5)', [code, req.user.id, pct, 'Reward: ' + r.n, kind]);
    await c.q('INSERT INTO points_log(user_id,label,delta) VALUES($1,$2,$3)', [req.user.id, 'Redeemed ' + r.n, -r.pts]);
    await c.q('UPDATE users SET points=points-$2 WHERE id=$1', [req.user.id, r.pts]);
    if (kind === 'merch' || kind === 'split') { const t = await c.one('INSERT INTO tickets(user_id,subject,category,channel) VALUES($1,$2,$3,$4) RETURNING id', [req.user.id, 'Reward redeemed: ' + r.n, 'Account Changes', 'Web']); await c.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, req.user.id, `I redeemed ${r.n} (code ${code}). Please help me use it.`]); }
    return { code };
  });
}));
T.post('/competitions/:id/join', h(async (req) => { await db.q("UPDATE users SET settings = jsonb_set(settings, '{comps}', COALESCE(settings->'comps','{}'::jsonb) || jsonb_build_object($2::text, true)) WHERE id=$1", [req.user.id, clean(req.params.id, 20)]); }));
T.post('/kyc', h(async (req) => {
  const b = req.body; const k = { name: clean(b.name, 120), dob: clean(b.dob, 12), country: clean(b.country, 60), idType: clean(b.idType, 40), idLast4: clean(b.idNumber, 40).slice(-4), at: new Date().toISOString() };
  if (!k.name || !k.dob) bad('Fill in every field');
  await db.q("UPDATE users SET kyc=$2, kyc_status='submitted' WHERE id=$1 AND kyc_status<>'verified'", [req.user.id, k]);
}));
T.post('/affiliate/apply', h(async (req) => { await db.q("UPDATE users SET settings = settings || '{\"affApplied\":true}' WHERE id=$1", [req.user.id]); }));
app.use('/api', T);

// ---------- back office ----------
app.use('/api/admin', auth.needStaff, admin.router(h));

// ---------- pages ----------
const DIST = path.join(__dirname, '..', 'web', 'dist');
const page = (f) => (req, res) => res.sendFile(path.join(DIST, f));
const needPage = (staff) => (req, res, next) => { if (!req.user) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl)); if (staff && !auth.STAFF.includes(req.user.role)) return res.redirect('/app'); next(); };
app.use('/static', express.static(path.join(DIST, 'static'), { maxAge: '1h' }));
app.get('/', async (req, res) => {
  if (req.query.ref) {
    const code = clean(req.query.ref, 40); res.setHeader('Set-Cookie', `fs_ref=${encodeURIComponent(code)}; Path=/; Max-Age=${30 * 86400}; SameSite=Lax`);
    const d = new Date().toISOString().slice(0, 10);
    if (/^t\d+$/.test(code)) await db.q("INSERT INTO kv(k,v) VALUES($1, jsonb_build_object($2::text, 1)) ON CONFLICT (k) DO UPDATE SET v = kv.v || jsonb_build_object($2::text, COALESCE((kv.v->>$2)::int,0)+1), updated_at=now()", ['refclicks.' + code, d]).catch(() => {});
    return res.redirect(req.user ? '/app' : '/signup?ref=' + encodeURIComponent(code));
  }
  res.redirect(req.user ? '/app' : '/checkout');
});
app.get('/checkout', page('checkout.html'));
app.get('/checkout/payment', (req, res) => res.sendFile(path.join(DIST, req.user ? 'payment-member.html' : 'payment.html')));
app.get('/checkout/confirmed', page('confirmed.html'));
app.get('/login', (req, res, next) => (req.user && !req.query.next ? res.redirect(auth.STAFF.includes(req.user.role) && req.query.admin ? '/admin' : '/app') : next()), page('login.html'));
app.get('/signup', page('signup.html'));
app.get('/terms', page('terms.html'));
app.get('/privacy', page('privacy.html'));
app.get('/refund-policy', page('refund-policy.html'));
app.get('/logout', async (req, res) => { await auth.logout(req, res); const n = String(req.query.next || '/login'); res.redirect(n.startsWith('/') && !n.startsWith('//') ? n : '/login'); });
app.get('/forgot-password', page('forgot.html'));
app.get('/reset-password', page('reset-password.html'));
app.get('/verify-email', page('verify.html'));
app.get('/reset', needPage(false), page('reset.html'));
app.get(['/app', '/app/*'], needPage(false), page('app.html'));
app.get(['/admin', '/admin/*'], needPage(true), page('admin/home.html'));
app.use((req, res) => res.status(404).sendFile(path.join(DIST, '404.html'), (e) => e && res.status(404).send('Not found')));

const PORT = process.env.PORT || 3000;
migrate().then(() => {
  app.listen(PORT, () => console.log('Funded Sky listening on ' + PORT + (pay.enabled() ? ' (Stripe on)' : ' (test payments)')));
  sim.start();
}).catch((e) => { console.error('Startup failed', e); process.exit(1); });
module.exports = app;
