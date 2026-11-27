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
const I = require('./integrations');
const flows = require('./flows');
const { migrate } = require('./migrate');
const { HttpError, bad, clean, round2, emailOk } = require('./util');

const app = express();
// Client address (req.ip) for the staff network allowlist, the blocklist and rate limits. On Railway exactly one proxy (its edge)
// sits in front of the app and it overwrites X-Forwarded-For, so trust one hop there. Anywhere else nothing is trusted by default,
// or anyone could choose their own address with that header. TRUST_PROXY (a hop count, or false) overrides this.
const TP = String(process.env.TRUST_PROXY || '').trim();
app.set('trust proxy', /^\d+$/.test(TP) ? +TP : TP === 'true' ? 1 : TP === 'false' ? false : TP ? TP : (process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID ? 1 : false));
app.disable('x-powered-by');
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); res.setHeader('X-Frame-Options', 'SAMEORIGIN'); next(); });
const raw = express.raw({ type: '*/*', limit: '1mb' });
app.post(['/api/stripe/webhook', '/api/hooks/stripe'], raw, (req, res) => pay.webhook(req, res));
app.post('/api/hooks/confirmo', raw, (req, res) => pay.confirmoHook(req, res).catch((e) => { console.error(e); res.status(500).end(); }));
app.post('/api/hooks/sumsub', raw, (req, res) => flows.sumsubHook(req, res).catch((e) => { console.error(e); res.status(500).end(); }));
app.post('/api/hooks/resend', raw, (req, res) => require('./mail').hook(req, res).catch((e) => { console.error(e); res.status(500).end(); }));
app.post('/api/hooks/rise', raw, (req, res) => flows.riseHook(req, res).catch((e) => { console.error(e); res.status(500).end(); }));
// Request timings for System Health: last 24 hours in hourly buckets, kept in memory
const REQSTAT = global.FS_REQSTAT = { hours: {}, routes: {} };
app.use((req, res, next) => { if (!req.path.startsWith('/api')) return next(); const t0 = process.hrtime.bigint(); res.on('finish', () => { const ms = Number(process.hrtime.bigint() - t0) / 1e6; const hk = new Date().toISOString().slice(0, 13); const hb = REQSTAT.hours[hk] = REQSTAT.hours[hk] || { n: 0, fail: 0, ms: [] }; hb.n++; if (res.statusCode >= 500) hb.fail++; if (hb.ms.length < 2000) hb.ms.push(ms);
  const rk = req.path.replace(/\/[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/g, '/:id').split('/').slice(0, 4).join('/'); if (res.statusCode >= 400) { const r2 = REQSTAT.routes[rk] = REQSTAT.routes[rk] || {}; r2[hk] = (r2[hk] || 0) + 1; }
  const keys = Object.keys(REQSTAT.hours).sort(); while (keys.length > 25) delete REQSTAT.hours[keys.shift()]; }); next(); });
// Back office settings such as the catalog version history can be larger than other requests
app.use('/api/admin/store', express.json({ limit: '2mb' }));
app.use(express.json({ limit: '200kb' }));
app.use((err, req, res, next) => (err && (err.type === 'entity.too.large' || err.status === 413) ? res.status(413).json({ error: 'This is too large to save. Remove some entries and try again.' }) : err && err.type === 'entity.parse.failed' ? res.status(400).json({ error: 'The request was not valid JSON.' }) : next(err)));
app.use((req, res, next) => auth.loadUser(req, res, next).catch(next));
// Device id: a long-lived cookie, remembered for each trader who signs in on this browser. Used to spot self-referrals (server/affiliates.js).
const DID_SEEN = new Set();
app.use((req, res, next) => {
  try { if (req.user && req.user.id && req.user.role === 'trader') { let did = auth.parseCookies(req.headers.cookie).fs_did; if (!/^[a-f0-9]{32}$/.test(did || '')) { did = require('crypto').randomBytes(16).toString('hex'); res.append('Set-Cookie', `fs_did=${did}; Path=/; Max-Age=${730 * 86400}; SameSite=Lax; HttpOnly`); }
    const k = req.user.id + ':' + did; if (!DID_SEEN.has(k)) { if (DID_SEEN.size > 50000) DID_SEEN.clear(); DID_SEEN.add(k); return require('./affiliates').seenDevice(req.user.id, did).catch(() => {}).then(() => next()); } } } catch (e) { /* never block a request for this */ }
  next();
});

// Basic rate limit for auth endpoints
const hits = new Map();
const limit = (n, ms) => (req, res, next) => { if (process.env.QA_NO_LIMIT === '1' && process.env.NODE_ENV !== 'production') return next(); const k = req.ip + req.path; const now = Date.now(); const h = (hits.get(k) || []).filter((t) => now - t < ms); h.push(now); hits.set(k, h); if (h.length > n) return res.status(429).json({ error: 'Too many tries. Wait a minute and try again.' }); next(); };
setInterval(() => hits.clear(), 10 * 60 * 1000).unref();

const h = (fn) => async (req, res) => {
  try { const out = await fn(req, res); if (!res.headersSent) res.json(out || { ok: true }); }
  catch (e) { if (e && (e.code === '22021' || e.code === '22P05')) return res.status(400).json({ error: 'That text has characters we cannot save. Remove them and try again.' });
    // an id or number the database cannot read (not a number, or too large for the column): the request is wrong, not the server
    if (e && ['22003', '22P02', '22007', '22008'].includes(e.code)) { console.error(req.method, req.path, e.message); return res.status(400).json({ error: 'That value is not valid. Check it and try again.' }); } const st = e instanceof HttpError ? e.status : e.status === 402 ? 402 : 500; if (st === 500) { console.error(req.method, req.path, e); db.q('INSERT INTO error_log(path,msg) VALUES($1,$2)', [req.method + ' ' + req.path, String(e.message || e).slice(0, 500)]).catch(() => {}); } res.status(st).json({ error: st === 500 ? 'Something went wrong on our side. Try again.' : e.message, fallback: e.fallback || undefined, repriced: e.repriced || undefined }); }
};

// ---------- public ----------
app.get('/api/health', h(async () => ({ ok: true, db: !!(await db.one('SELECT 1 AS x')), stripe: pay.enabled(), market: sim.marketOpen() })));
app.get('/api/catalog', h(async () => { const c = await core.catalog(); const RR = require('./rules');
  // Effective rules per plan and size, the same numbers the rule engine uses for a new account
  const rules = {}; c.plans.filter((p) => p.active).forEach((p) => { rules[p.id] = {}; p.sizes.forEach((z) => { const inst = p.id === 'instant' || p.kind === 'funded'; const ev = RR.rulesFor(c, { plan: p.id, size: z.size, kind: inst ? 'funded' : 'evaluation', payout_count: 0 }); const fu = inst ? ev : RR.rulesFor(c, { plan: p.id, size: z.size, kind: 'funded', payout_count: 0 }); const ov = ((c.planRules || {})[p.id] || {})[z.size] || {};
    const sf = fu.splitFirst != null && fu.splitFirstCount ? [fu.splitFirst, fu.splitFirstCount, fu.splitLater] : inst && !ov.funded && ov.split == null ? [c.instantCommon.splitFirst, c.instantCommon.splitFirstCount, c.instantCommon.splitLater] : null;
    rules[p.id][z.size] = { target: inst ? ev.goal : ev.target, dll: ev.dllOff ? 0 : ev.dll, dllOff: !!ev.dllOff || !ev.dll, dllMode: ev.dllMode, ddType: ev.ddType || 'eod', maxLoss: ev.maxLoss, contracts: ev.fullContracts || ev.contracts, minDays: ev.minDays || 0, consistency: ev.consOff ? null : ev.consistency, consOff: !!ev.consOff, split: fu.split, splitText: sf && sf[0] !== sf[2] ? `${sf[0]}% for the first ${sf[1]}, then ${sf[2]}%` : fu.split + '%', payoutMin: fu.payoutMin, winDayMin: fu.winDayMin }; }); });
  const pubPlans = c.plans.filter((p) => p.active).map((p) => Object.assign({}, p, { sizes: p.sizes.map((z) => ({ size: z.size, price: core.priceOf(z), activation: z.activation, compare: z.compare && z.compare > core.priceOf(z) ? z.compare : undefined })), bundleOff: undefined }));
  return { rules, plans: pubPlans, evalRules: c.evalRules, evalCommon: c.evalCommon, fundedCommon: c.fundedCommon, fundedCaps: c.fundedCaps, instantRules: c.instantRules, instantCommon: c.instantCommon, instantCaps: c.instantCaps, addons: c.addons, resetPct: c.resetPct, bundles: c.bundles, promos: (c.promos || []).filter((p) => p.active && !(Number(p.total) === 1) && !p.once && !p.first && !String(p.countries || '').trim() && (!p.ends || p.ends >= new Date().toISOString().slice(0, 10))).map(({ code, name, pct, plans, starts, ends, desc }) => ({ code, name, pct, plans, starts, ends, desc })), payments: pay.mode(), packLadder: await require('./packs').publicLadder(), credits: await require('./packs').publicCredits() }; }));
app.get('/api/public-config', h(async (req) => { const m = await pay.refreshMode(); const crisp = await I.cfg('crisp'); const ph = await I.cfg('posthog'); const ss = await I.cfg('sumsub');
  const kv2 = await db.all("SELECT k, v FROM kv WHERE k IN ('settings.flags','settings.maint')"); const g = (k) => (kv2.find((r) => r.k === k) || {}).v || {};
  return { announcements: await require('./announce').banners(req.user || null), flags: g('settings.flags'), maint: g('settings.maint').on ? g('settings.maint').msg : '', card: m.card, stripePk: m.stripePk || '', backup: m.backup || '', stripeBackup: m.backup === 'stripe', crypto: m.crypto, live: m.live, tokenizationKey: m.tokenizationKey || '', gatewayUrl: m.gatewayUrl || '', crisp: crisp ? crisp.websiteId : '', support: await require('./support').publicInfo(), posthog: ph ? { key: ph.projectKey, host: ph.host } : null, sumsub: !!ss }; }));
app.get('/api/me', h(async (req) => (req.user ? { user: { email: req.user.email, first: req.user.first, last: req.user.last, role: req.user.role, verified: req.user.verified, country: req.user.country } } : { user: null })));
app.post('/api/auth/signup', limit(8, 60000), h((req, res) => auth.signup(req, res)));
app.post('/api/auth/login', limit(10, 60000), h((req, res) => auth.login(req, res)));
app.post('/api/auth/mfa', limit(10, 60000), h((req, res) => auth.mfaLogin(req, res)));
const needStaffUser = (req, res, next) => (req.user && auth.STAFF.includes(req.user.role) ? next() : res.status(403).json({ error: 'Staff only' }));
app.get('/api/auth/mfa/setup', needStaffUser, h((req) => require('./mfa').setup(req.user)));
app.post('/api/auth/mfa/enable', needStaffUser, limit(10, 60000), h((req) => require('./mfa').enable(req.user, req.sess, req.body.code)));
app.post('/api/auth/logout', h((req, res) => auth.logout(req, res)));
app.post('/api/auth/forgot', limit(5, 60000), h((req) => auth.forgot(req)));
app.post('/api/auth/reset', limit(10, 60000), h((req, res) => auth.resetPassword(req, res)));
app.post('/api/auth/reset/check', limit(20, 60000), h((req) => auth.resetCheck(req)));
app.post('/api/auth/verify', limit(10, 60000), h((req) => auth.verifyEmail(req)));
app.post('/api/auth/resend', auth.needUser, limit(4, 60000), h((req) => auth.resendVerify(req)));
app.post('/api/auth/email', auth.needUser, limit(4, 60000), h((req) => auth.changeEmail(req)));
// The trader's own unused codes that work at checkout, for the one-tap chips under the code field (nothing when logged out or rewards are off)
app.get('/api/checkout/codes', h(async (req) => ({ codes: req.user ? (await trader.myCodes(req.user.id, await flagOn('rewards'))).filter((c) => c.co && !c.used).map((c) => ({ code: c.code, label: c.label, kind: c.kind, pct: c.pct, size: c.kind === 'free_eval' ? c.size || 25000 : undefined })) : [] })));
app.post('/api/cart/price', h(async (req) => { const out = await core.priceCart(req.body.items, { promo: req.body.promo, coupon: req.body.coupon, userId: req.user && req.user.id, ref: req.user ? null : await auth.refOf(auth.parseCookies(req.headers.cookie).fs_ref) });
  // the same limits the order is checked against (blocked countries, caps), so checkout can say why before payment
  if (req.user) { try { await pay.checkLimits(req.user, out.items); } catch (e) { if (!e.status || e.status >= 500) throw e; out.blocked = e.message; } }
  // free packs earned by this cart: one summary line for every checkout step (display only; orders keep their own lines)
  { const fl = await require('./packs').ladderLine(out.items).catch(() => null); if (fl) out.lines = out.lines.concat([fl]); }
  return out; }));

// ---------- trader ----------
const T = express.Router(); T.use((req, res, next) => (req.path.startsWith('/admin/') ? next('router') : auth.needUser(req, res, next)));
// A suspended trader can sign in, read their dashboard and talk to support, but cannot buy, get paid or redeem
T.use((req, res, next) => { if (req.method !== 'POST' || !req.user || req.user.status !== 'suspended') return next(); if (/^\/(tickets|privacy-request|articles|notifications|settings|password|profile|kyc|tax|sessions|journal|courses)/.test(req.path)) return next(); return res.status(403).json({ error: 'Your account is suspended. Contact support for details.' }); });
T.get('/trader/boot', h(async (req) => { const host = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/^https?:\/\//, ''); return trader.boot(req.user, req.sess, host); }));
const maintOn = async () => { const r = await db.one("SELECT v FROM kv WHERE k='settings.maint'"); return r && r.v.on ? r.v.msg : ''; };
// Feature switches from Settings: off means hidden in the dashboard and refused here
const flagOn = async (k) => ((((await db.one("SELECT v FROM kv WHERE k='settings.flags'")) || {}).v || {})[k]) !== false;
const needFlag = (k, msg) => async (req, res, next) => { try { if (await flagOn(k)) return next(); res.status(403).json({ error: msg }); } catch (e) { next(e); } };
T.post('/agreements/accept', h(async (req) => require('./legal').accept(req.user, Array.isArray(req.body.keys) ? req.body.keys : null)));
T.post(['/orders', '/orders/reset', '/orders/activation', '/orders/credits', '/payouts', '/accounts/:id/agreement'], (req, res, next) => require('./legal').guard(req, res, next));
// Packs and credits (switched by settings.flags.packs)
const PK = require('./packs');
T.get('/packs', h(async (req) => { const d = await PK.traderData(req.user.id); if (!d) bad('Packs are switched off right now.', 403); return d; }));
T.get('/packs/history', h((req) => PK.history(req.user.id, req.query.before)));
T.post('/packs/buy', limit(30, 60000), h((req) => PK.buy(req.user, clean(req.body.pack, 30))));
T.post('/packs/open', limit(30, 60000), h((req) => PK.openOwned(req.user, req.body.id)));
T.post('/packs/:id/reveal', limit(60, 60000), h((req) => PK.reveal(req.user, { pack: req.params.id })));
T.post('/cards/:id/reveal', limit(120, 60000), h((req) => PK.reveal(req.user, { card: req.params.id })));
T.post('/cards/:id/use', limit(20, 60000), h((req) => PK.useCard(req.user, req.params.id, req.body || {})));
T.post('/orders/credits', h(async (req) => { const m = await maintOn(); if (m) bad(m, 503); if (await auth.blockedReq(req, req.user.email)) bad('This purchase could not be completed. Contact support.', 403); return PK.createCreditsOrder(req.user, req.body || {}); }));
T.post('/orders', h(async (req) => { const m = await maintOn(); if (m) bad(m, 503); if (await auth.blockedReq(req, req.user.email)) bad('This purchase could not be completed. Contact support.', 403); { const sw = ((await db.one("SELECT v FROM kv WHERE k='store.risk.switches'")) || {}).v || {}; if (sw.sales) bad('New purchases are paused for a short time. Try again soon.', 503); } return pay.createOrder(req.user, req.body); }));
T.post('/orders/reset', h((req) => pay.createResetOrder(req.user, req.body)));
T.post('/orders/reset/price', h((req) => pay.quoteReset(req.user, req.body)));
T.post('/orders/:code/code', limit(20, 60000), h((req) => pay.applyCode(req.user, req.params.code, req.body)));
T.post('/orders/activation', h((req) => pay.createActivationOrder(req.user, req.body)));
T.get('/orders/:code', h((req) => pay.getOrder(req.user, req.params.code, req.query.session_id)));
T.post('/orders/:code/pay', h((req) => pay.payOrder(req.user, req.params.code, req.body)));
T.get('/orders/:code/receipt', async (req, res) => { try { res.type('html').send(await pay.receipt(req.user, req.params.code)); } catch (e) { res.status(404).send('Not found'); } });
T.post('/accounts/:id/agreement', h(async (req) => { const r = await core.signAgreement(req.user.id, req.params.id); if (r.activation) { const o = await pay.createActivationOrder(req.user, { account: req.params.id }); return { checkout: '/checkout/payment?order=' + o.code }; } return r; }));
T.post('/payouts', h(async (req) => { const sw = ((await db.one("SELECT v FROM kv WHERE k='store.risk.switches'")) || {}).v || {}; if (sw.payouts) bad('Payout requests are paused for a short time. Try again later.', 503); return core.requestPayout(req.user.id, clean(req.body.account, 40), req.body.amount, parseInt(req.body.method, 10)); }));
T.post('/payout-methods', h(async (req) => {
  const rail = req.body.rail; if (!['Rise', 'USDC'].includes(rail)) bad('Choose Rise or a USDC wallet as the payout method type.'); if (rail === 'USDC' && !(await flagOn('cryptoPayouts'))) bad('USDC payouts are switched off right now. Pick another method.'); const railsOff = ((await db.one("SELECT v FROM kv WHERE k='store.finance.rails'")) || {}).v || {}; if (railsOff[rail.toLowerCase()] === false) bad(rail + ' payouts are not offered right now. Pick another method.'); const raw = clean(req.body.label, 120); if (!raw) bad(rail === 'USDC' ? 'Enter your wallet address.' : 'Enter the email of your Rise account.');
  // Each type takes one kind of detail: Rise pays to the email of the trader's Rise account, USDC to a wallet address
  if (rail === 'USDC' && !/^0x[a-fA-F0-9]{40}$/.test(raw)) bad(emailOk(raw) ? 'That is an email. Choose Rise to be paid through your Rise account.' : 'Enter a full wallet address that starts with 0x.');
  if (rail === 'Rise' && !emailOk(raw)) bad(/^0x[a-fA-F0-9]+$/.test(raw) ? 'That is a wallet address. Choose USDC Wallet for a wallet address.' : 'Enter the email of your Rise account.');
  const label = rail === 'USDC' ? `USDC · Wallet ${raw.slice(0, 6)}…${raw.slice(-4)}` : `Rise · ${raw.toLowerCase().replace(/^(.{1,2})[^@]*@/, '$1•••@')}`;
  const norm = raw.toLowerCase();
  if (await db.one('SELECT 1 FROM payout_methods WHERE user_id=$1 AND dest_hash=$2', [req.user.id, I.mac(rail + ':' + norm)])) bad('You already added this payout method.');
  const n = (await db.one('SELECT count(*)::int n FROM payout_methods WHERE user_id=$1', [req.user.id])).n; if (n >= 5) bad('You can keep up to 5 payout methods. Remove one you no longer use first.');
  // The full wallet address or Rise email is stored encrypted for Finance; traders and other staff only see the masked label. The keyed hash finds one destination saved by several traders.
  await db.q("INSERT INTO payout_methods(user_id,rail,label,is_default,unlock_at,dest,dest_hash) VALUES($1,$2,$3,$4, now() + interval '48 hours',$5,$6)", [req.user.id, rail, label, n === 0, I.enc(rail === 'USDC' ? raw : norm), I.mac(rail + ':' + norm)]);
  await core.notify(null, req.user.id, 'New payout method added', `${label}. It can be used in 48 hours. If this wasn't you, contact support now.`, 'settings?tab=pay');
  if (rail === 'Rise') { const r = await flows.riseInvite(req.user, norm); if (r === 'invited') await core.notify(null, req.user.id, 'Check your email for a Rise invite', 'Finish Rise onboarding so we can send your payouts.', 'settings?tab=pay'); }
}));
// Only the trader's own methods: an id that is not a number is refused, an id that is not theirs is not found (and changes nothing)
const ownMethod = async (req) => { if (!/^\d{1,9}$/.test(String(req.params.id))) bad('Unknown payout method'); const m = await db.one('SELECT * FROM payout_methods WHERE id=$1 AND user_id=$2', [+req.params.id, req.user.id]); if (!m) bad('Payout method not found', 404); return m; };
T.post('/payout-methods/:id/default', h(async (req) => { const m = await ownMethod(req); await db.q('UPDATE payout_methods SET is_default=(id=$2) WHERE user_id=$1', [req.user.id, m.id]); }));
// Remove a method. Not while a payout is on its way to it. If it was the default, the oldest one left becomes the default.
// Adding the same details again later starts a new 48-hour hold, so removing never shortens the safety check.
T.post('/payout-methods/:id/remove', h(async (req) => { const m = await ownMethod(req);
  if (await db.one('SELECT 1 FROM payouts WHERE user_id=$1 AND method=$2 AND status = ANY($3) LIMIT 1', [req.user.id, m.label, core.OPEN_PAY])) bad('A payout is on its way to this method. You can remove it once that payout is finished.');
  await db.q('DELETE FROM payout_methods WHERE id=$1 AND user_id=$2', [m.id, req.user.id]);
  if (m.is_default) await db.q('UPDATE payout_methods SET is_default=true WHERE id=(SELECT id FROM payout_methods WHERE user_id=$1 ORDER BY created_at, id LIMIT 1)', [req.user.id]);
  await core.notify(null, req.user.id, 'Payout method removed', `${m.label}. If this wasn't you, change your password and contact support now.`, 'settings?tab=pay');
  await core.audit(req.user.id, 'payout.method.remove', req.user.tid, { label: m.label });
}));
T.post('/notifications/read', h(async (req) => { if (req.body.all) await db.q('UPDATE notifications SET read=true WHERE user_id=$1', [req.user.id]); else await db.q('UPDATE notifications SET read=true WHERE user_id=$1 AND id=$2', [req.user.id, +req.body.id]); }));
// Ticket ids are whole numbers; anything else is not a ticket
T.use('/tickets/:id', (req, res, next) => (/^\d{1,9}$/.test(req.params.id) ? next() : res.status(404).json({ error: 'Ticket not found' })));
T.post('/tickets', h(async (req) => {
  const SUP = require('./support');
  if (req.body.subject != null && typeof req.body.subject !== 'string') bad('Add a subject.'); const s = clean(req.body.subject, 160); if (!s) bad('Add a subject.');
  if (req.body.body != null && typeof req.body.body !== 'string') bad('Add a few details so we can help.'); const body = clean(req.body.body, 5000); if (!body) bad('Add a few details so we can help.');
  const cat = await SUP.topic(req.body.category); if (!cat) bad('Pick a topic from the list.');
  // The ticket and its first message are saved together, so a ticket can never exist without a message
  const t = await db.tx(async (c) => { const x = await c.one('INSERT INTO tickets(user_id,subject,category,channel) VALUES($1,$2,$3,$4) RETURNING id', [req.user.id, s, cat, 'Web']); await c.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [x.id, req.user.id, body]); return x; });
  const r = await SUP.onTraderMessage(t.id, body, { isNew: true }); const ss = await SUP.settings();
  require('./mail').t('ticket', req.user.id, { ticket: t.id, subject: s, reply_time: r.afterHours ? (ss.ahText || SUP.replyText(ss)) : SUP.replyText(ss), url: require('./auth').BASE() + '/app#support?tkt=' + t.id });
  I.alert('ticket', `:speech_balloon: New ticket #${t.id}${r.urgent ? ' (urgent)' : ''}: ${s}`);
  return { id: t.id };
}));
T.post('/tickets/:id/reply', h(async (req) => {
  const t = await db.one('SELECT * FROM tickets WHERE id=$1 AND user_id=$2', [+req.params.id, req.user.id]); if (!t) bad('Ticket not found', 404);
  const body = typeof req.body.body === 'string' ? clean(req.body.body, 5000) : ''; if (!body) bad('Write a reply first.');
  await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, req.user.id, body]);
  await db.q("UPDATE tickets SET status='open', updated_at=now() WHERE id=$1", [t.id]);
  await require('./support').onTraderMessage(t.id, body);
}));
T.post('/tickets/:id/rate', h(async (req) => {
  const t = await db.one('SELECT * FROM tickets WHERE id=$1 AND user_id=$2', [+req.params.id, req.user.id]); if (!t) bad('Ticket not found', 404);
  if (t.status !== 'solved') bad('You can rate a ticket once it is solved.');
  const good = !!req.body.good; await db.q('UPDATE tickets SET rating=$2, rated_at=now() WHERE id=$1', [t.id, good ? 'good' : 'bad']);
  if (!good) { await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, req.user.id, clean(req.body.body, 2000) || 'This is not solved yet.']); await db.q("UPDATE tickets SET status='open', updated_at=now() WHERE id=$1", [t.id]); }
  return { reopened: !good };
}));
// Privacy requests: a support ticket plus an entry in the Users board's Privacy Requests queue (answer within 30 days)
T.post('/privacy-request', h(async (req) => {
  const type = req.body.type === 'delete' ? 'Delete My Account' : req.body.type === 'marketing' ? 'Stop Marketing' : 'Copy of My Data';
  const all = ((await db.one("SELECT v FROM kv WHERE k='store.users.datareq'")) || {}).v || [];
  if (all.some((x) => x.uid === req.user.id && x.type === type && x.st !== 'done')) bad('You already asked for this. We will email you within 30 days of your request.');
  const subj = type === 'Delete My Account' ? 'Close My Account' : type === 'Stop Marketing' ? 'Stop Marketing Emails' : 'Data Export Request';
  const t = await db.one("INSERT INTO tickets(user_id,subject,category,channel) VALUES($1,$2,'Account Changes','Web') RETURNING id", [req.user.id, subj]);
  await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, req.user.id, type === 'Delete My Account' ? 'Please close my Funded Sky account and delete my personal data.' : type === 'Stop Marketing' ? 'Please stop all marketing emails.' : 'Please send me a copy of my data.']);
  const id = 'DR-' + String(1000 + all.length + 1); all.unshift({ id, uid: req.user.id, type, at: new Date().toISOString(), st: 'open', note: '', ticket: t.id });
  await db.q("INSERT INTO kv(k,v) VALUES('store.users.datareq',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(all)]);
  if (type === 'Delete My Account') require('./mail').t('delreq', req.user.id, { url: require('./auth').BASE() + '/app#support?tkt=' + t.id });
  if (type === 'Stop Marketing') await db.q("UPDATE users SET settings = settings || $2::jsonb WHERE id=$1", [req.user.id, JSON.stringify({ nMkt: false, nNews: false })]);
  return { id, ticket: t.id };
}));
T.post('/articles/stat', h(async (req) => { await require('./support').articleStat(req.body.t, req.body.kind, req.user.id); }));
const SETTING_KEYS = ['nEmail', 'nSms', 'nPush', 'nNews', 'nMkt', 'nComp', 'mfaPay', 'certFull']; // certFull: full name on certificates (Settings › Privacy)
T.post('/settings', h(async (req) => { const o = {}; for (const k of SETTING_KEYS) if (k in req.body) o[k] = !!req.body[k]; await db.q('UPDATE users SET settings = settings || $2 WHERE id=$1', [req.user.id, JSON.stringify(o)]); }));
T.post('/profile', h(async (req) => { const ph = require('./phone').parse(req.body.phoneIso, req.body.phone); if (ph.err) bad(ph.err); await db.q("UPDATE users SET phone=$2, settings=COALESCE(settings,'{}'::jsonb)||jsonb_build_object('phoneIso',$3::text) WHERE id=$1", [req.user.id, ph.phone, ph.iso]); return { ok: true, phone: ph.phone }; }));
T.post('/password', h((req) => auth.changePassword(req)));
// The id is the hash shown in the sessions list (util.sessId), never part of the token itself
T.post('/sessions/:id/revoke', h(async (req) => { const p = String(req.params.id || ''); if (!/^[a-f0-9]{16}$/.test(p)) bad('Unknown session'); const { sessId } = require('./util');
  const hit = (await db.all('SELECT token FROM sessions WHERE user_id=$1 AND token<>$2', [req.user.id, req.sess])).filter((s) => sessId(s.token) === p);
  for (const s of hit) await db.q('DELETE FROM sessions WHERE user_id=$1 AND token=$2', [req.user.id, s.token]); }));
T.post('/sessions/revoke-all', h(async (req) => { await db.q('DELETE FROM sessions WHERE user_id=$1 AND token<>$2', [req.user.id, req.sess]); }));
T.post('/journal/note', h(async (req) => {
  const day = typeof req.body.day === 'string' ? req.body.day.trim() : ''; if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) bad('Pick a day first.');
  // a real calendar day (no Feb 30), not in the future and not older than two years
  const dt = new Date(day + 'T12:00:00Z'); if (isNaN(dt) || dt.toISOString().slice(0, 10) !== day) bad('That is not a real date.');
  if (day > require('./util').tradeDate()) bad('You can only add notes for days up to today.');
  if (dt.getTime() < Date.now() - 731 * 86400000) bad('Notes can be added for the last two years.');
  // everything is checked before anything is saved, so a refused request changes nothing
  if (req.body.text != null && typeof req.body.text !== 'string') bad('The note must be text.'); const text = clean(req.body.text, 2000);
  // day review: an optional mood and tags saved next to the note
  const rev = req.body.mood !== undefined || req.body.tags !== undefined; let mood = ''; let tags = [];
  if (rev) {
    const MOODS = ['rough', 'okay', 'great']; const TAGS = ['plan', 'over', 'revenge', 'patient', 'tired'];
    mood = MOODS.includes(req.body.mood) ? req.body.mood : ''; if (req.body.mood && !mood) bad('Pick Rough, Okay or Great.');
    if (req.body.tags != null && !Array.isArray(req.body.tags)) bad('Tags must be a list.'); tags = Array.isArray(req.body.tags) ? TAGS.filter((t) => req.body.tags.includes(t)) : [];
  }
  // one statement for the note and the review; an empty note or an empty review is removed instead of kept as a blank entry
  await db.q(`UPDATE users SET settings = jsonb_set(jsonb_set(COALESCE(settings,'{}'::jsonb), '{notes}', (COALESCE(settings->'notes','{}'::jsonb) - $2::text) || CASE WHEN $3::text = '' THEN '{}'::jsonb ELSE jsonb_build_object($2::text, $3::text) END),
    '{reviews}', CASE WHEN NOT $6::boolean THEN COALESCE(settings->'reviews','{}'::jsonb) ELSE (COALESCE(settings->'reviews','{}'::jsonb) - $2::text) || CASE WHEN $4::text = '' AND $5::jsonb = '[]'::jsonb THEN '{}'::jsonb ELSE jsonb_build_object($2::text, jsonb_build_object('m', $4::text, 't', $5::jsonb)) END END) WHERE id=$1`, [req.user.id, day, text, mood, JSON.stringify(tags), rev]);
}));
T.post('/courses/:id/lesson', needFlag('education', 'Courses are switched off right now'), h(async (req) => {
  // Only courses traders can see (published, with lessons). Progress and the 100 credits are settled under a lock on the
  // trader's row, so two requests at once cannot both count. The credits are paid once per trader per course, ever:
  // settings.coursesPaid remembers it, and the ledger has one row per course (unique ref 'course:<id>').
  const c = content.liveCourses(await content.all()).find((x) => x.id === req.params.id); if (!c) bad('Course not found', 404);
  const want = req.body && req.body.lesson != null ? parseInt(req.body.lesson, 10) : null;
  return db.tx(async (t) => {
    const u = await t.one('SELECT settings FROM users WHERE id=$1 FOR UPDATE', [req.user.id]); const st = (u && u.settings) || {};
    const prev = Math.max(0, Math.min(c.l, parseInt((st.courses || {})[c.id], 10) || 0));
    // The page says which lesson it is marking, so a repeated click or a retry does not skip ahead
    if (want != null && want !== prev + 1) return { done: prev, paid: false };
    const done = Math.min(c.l, prev + 1); const pay = done >= c.l && prev < c.l && !(st.coursesPaid || {})[c.id];
    await t.q("UPDATE users SET settings = jsonb_set(COALESCE(settings,'{}'::jsonb), '{courses}', COALESCE(settings->'courses','{}'::jsonb) || jsonb_build_object($2::text, $3::int)) WHERE id=$1", [req.user.id, c.id, done]);
    let paid = false;
    if (pay) {
      await t.q("UPDATE users SET settings = jsonb_set(settings, '{coursesPaid}', COALESCE(settings->'coursesPaid','{}'::jsonb) || jsonb_build_object($2::text, true)) WHERE id=$1", [req.user.id, c.id]);
      const row = await t.one("INSERT INTO points_log(user_id,label,delta,kind,ref) VALUES($1,$2,100,'earned',$3) ON CONFLICT (user_id, ref) WHERE ref LIKE 'course:%' DO NOTHING RETURNING id", [req.user.id, clean('Finished ' + c.n, 160), 'course:' + c.id]);
      if (row) { await t.q('UPDATE users SET points=points+100 WHERE id=$1', [req.user.id]); paid = true; }
    }
    return { done, paid };
  });
}));
T.post('/rewards/:id/redeem', needFlag('rewards', 'Rewards are switched off right now'), h(async (req) => {
  // what a reward gives comes from the reward itself (type and value in the catalog); one with no usable effect is not in this list
  const r = (await content.rewards()).find((x) => x.id === req.params.id); if (!r) bad('Reward not found', 404);
  const b = req.body || {}; const uid = req.user.id; let ship = null;
  if (r.type === 'merch') { const need = (k, n, lab) => { const v = clean(b[k], n); if (!v) bad('Add ' + lab); return v; }; if (!['S', 'M', 'L', 'XL', 'XXL'].includes(b.size)) bad('Pick a size.');
    ship = { size: b.size, name: need('name', 80, 'the name for the parcel'), line1: need('line1', 120, 'your street address'), line2: clean(b.line2, 120), city: need('city', 80, 'your city'), region: clean(b.region, 80), postal: need('postal', 20, 'your postal code'), country: need('country', 60, 'your country') }; }
  return db.tx(async (c) => {
    const u = await c.one('SELECT points FROM users WHERE id=$1 FOR UPDATE', [uid]); if (u.points < r.pts) bad('You need more credits for this reward.');
    let ref = ''; let out = {};
    if (r.type === 'split') { // a split boost goes on a funded account the trader picks, for its next payout
      const a = await c.one("SELECT * FROM accounts WHERE id=$1 AND user_id=$2 AND kind='funded' AND phase='active' FOR UPDATE", [clean(b.account, 40), uid]); if (!a) bad('Pick one of your funded accounts.');
      const now = require('./rules').rulesFor(await core.catalog(), a).split; if (now >= r.value) bad(`${a.id} already pays you ${now}% on its next payout.`);
      await c.q('UPDATE accounts SET perks=$2 WHERE id=$1', [a.id, JSON.stringify(Object.assign({}, a.perks || {}, { splitOnce: r.value }))]);
      await core.notify(c, uid, `${r.value}% split on your next payout`, `Your next payout from ${a.id} is paid at a ${r.value}% split.`, 'account?acct=' + a.id); ref = 'acct:' + a.id; out = { account: a.id, split: r.value };
    } else if (r.type === 'merch') { // merchandise: a support ticket the trader can see, with the size and where to ship
      const t = await c.one('INSERT INTO tickets(user_id,subject,category,channel) VALUES($1,$2,$3,$4) RETURNING id', [uid, `Reward: ${r.n} (size ${ship.size})`, 'Account Changes', 'Web']);
      await c.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, uid, `I redeemed ${r.n} for ${r.pts.toLocaleString('en-US')} credits.\nSize: ${ship.size}\nShip to: ${[ship.name, ship.line1, ship.line2, [ship.city, ship.region, ship.postal].filter(Boolean).join(', '), ship.country].filter(Boolean).join('\n')}`]);
      await core.notify(c, uid, `We are getting your ${r.n} ready`, `Follow it in support ticket #${t.id}. We reply there with tracking.`, 'support'); ref = 'ticket:' + t.id; out = { ticket: t.id };
    } else {
      let code; do { code = 'FS-' + r.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + '-' + require('crypto').randomBytes(3).toString('hex').toUpperCase(); } while (await c.one('SELECT 1 FROM coupons WHERE code=$1', [code]));
      const meta = Object.assign({ reward: r.id }, r.type === 'free_eval' ? { size: r.value } : {}, r.resets ? { resets: true } : {});
      await c.q("INSERT INTO coupons(code,user_id,pct,label,kind,source,meta,size) VALUES($1,$2,$3,$4,$5,'reward',$6,$7)", [code, uid, r.type === 'discount' ? r.value : 0, 'Reward: ' + r.n, r.type, JSON.stringify(meta), r.type === 'free_eval' ? r.value : null]); ref = code; out = { code };
    }
    await c.q("INSERT INTO points_log(user_id,label,delta,kind,ref) VALUES($1,$2,$3,'redeem',$4)", [uid, 'Redeemed ' + r.n, -r.pts, r.id + '|' + ref]);
    await c.q('UPDATE users SET points=points-$2 WHERE id=$1', [uid, r.pts]);
    return Object.assign({ type: r.type, name: r.n }, out);
  });
}));
// Credits History, a page at a time (the first page and the all-time totals come with the dashboard data)
T.get('/points', h(async (req) => trader.pointsPage(req.user.id, req.query.page)));
T.post('/competitions/:id/join', h(async (req) => { const fl = ((await db.one("SELECT v FROM kv WHERE k='settings.flags'")) || {}).v || {}; if (fl.competitions === false) bad('Competitions are not open right now.', 403); const acct = await require('./comps').join(clean(req.params.id, 30), req.user.id); return { account: acct }; }));
// Certificates: found by their public ID in server/certs.js
const findCert = (id) => require('./certs').find(id);
// Sharing a certificate earns 50 credits, at most once a week
T.post('/certs/:id/share', h(async (req) => {
  const c = await findCert(req.params.id); if (!c || c.user !== req.user.id) bad('Certificate not found', 404);
  const rev = ((await db.one("SELECT v FROM kv WHERE k='store.rewards.revoked'")) || {}).v || []; if (rev.includes(c.id)) bad('This certificate is no longer valid.');
  // the weekly check and the credits happen under a lock on the trader's row, so two taps at once pay once
  const paid = await db.tx(async (t) => { await t.one('SELECT id FROM users WHERE id=$1 FOR UPDATE', [req.user.id]);
    if (await t.one("SELECT 1 FROM points_log WHERE user_id=$1 AND label LIKE 'Shared certificate%' AND created_at > now() - interval '7 days'", [req.user.id])) return false;
    await core.points(t, req.user.id, 50, 'Shared certificate ' + c.id); return true; });
  return { url: require('./auth').BASE() + '/cert/' + c.id, points: paid ? 50 : 0 };
}));
T.post('/kyc/sumsub', h((req) => flows.sumsubToken(req.user)));
T.post('/tax/form', h((req) => flows.taxForm(req.user, req.body || {})));
// Identity details typed in by the trader (used when Sumsub is not connected). Staff review them by hand.
const ID_TYPES = ['Passport', "Driver's License", 'National ID Card'];
T.post('/kyc', h(async (req) => {
  const b = req.body || {}; if (req.user.kyc_status === 'verified') bad('Your identity is already verified. Nothing more to send.');
  if (req.user.kyc_status === 'submitted') bad('Your details are in review. Contact support if something needs to change.');
  const name = clean(b.name, 120); if (name.length < 3 || !/\s/.test(name)) bad('Enter your full legal name, first and last, as it is on your ID.');
  const dob = clean(b.dob, 12); const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob); const dd = dm && new Date(Date.UTC(+dm[1], +dm[2] - 1, +dm[3]));
  if (!dd || dd.getUTCMonth() !== +dm[2] - 1 || dd.getUTCDate() !== +dm[3]) bad('Enter your date of birth.');
  const now = new Date(); const age = now.getUTCFullYear() - +dm[1] - ((now.getUTCMonth() + 1) * 100 + now.getUTCDate() < +dm[2] * 100 + +dm[3] ? 1 : 0);
  if (dd > now) bad('Your date of birth cannot be in the future.'); if (age < 18) bad('You must be 18 or older to trade with Funded Sky.'); if (age > 120) bad('Check the year of your date of birth.');
  const crow = require('./phone').DIAL.find((x) => x[0].toLowerCase() === clean(b.country, 60).toLowerCase()); if (!crow) bad('Choose your country of residence from the list.');
  const idType = ID_TYPES.find((x) => x === clean(b.idType, 40)); if (!idType) bad('Choose your ID type.');
  const idn = clean(b.idNumber, 40).replace(/[\s-]/g, ''); if (!/^[A-Za-z0-9]{5,20}$/.test(idn) || !/\d/.test(idn)) bad('Enter the ID number exactly as it is on the document (5 to 20 letters and numbers).');
  const k = { name, dob, country: crow[0], idType, idLast4: idn.slice(-4), at: new Date().toISOString() };
  await db.q("UPDATE users SET kyc=$2, kyc_status='submitted' WHERE id=$1 AND kyc_status NOT IN ('verified','submitted')", [req.user.id, k]);
}));
T.post('/affiliate/apply', needFlag('affiliates', 'The affiliate program is not taking applications right now'), h((req) => require('./affiliates').apply(req.user, req.body || {}, core)));
app.use('/api', T);

// ---------- back office ----------
// Read-only API keys made in Settings: they can download the CSV exports
app.use('/api/admin/export', async (req, res, next) => { const m = /^Bearer (fsk_[A-Za-z0-9]+)$/.exec(req.headers.authorization || ''); if (!m || req.method !== 'GET') return next();
  try { const hsh = require('crypto').createHash('sha256').update(m[1]).digest('hex'); const row = await db.one("SELECT v FROM kv WHERE k='store.apikeys'"); const keys = (row && row.v) || []; const k = keys.find((x) => x.hash === hsh && !x.revoked); if (!k) return res.status(401).json({ error: 'Unknown API key' });
    k.last = new Date().toISOString(); await db.q("UPDATE kv SET v=$1 WHERE k='store.apikeys'", [JSON.stringify(keys)]); req.user = { id: 0, role: 'finance', first: 'API key', last: k.name, email: '' }; next(); } catch (e) { next(e); } });
app.use('/api/admin', (req, res, next) => (req.user && req.user.id === 0 ? next() : auth.needStaff(req, res, next)), admin.router(h));

// ---------- pages ----------
const DIST = path.join(__dirname, '..', 'web', 'dist');
const page = (f) => (req, res) => res.sendFile(path.join(DIST, f));
// Page handlers that wait on the database: a failure goes to the error page at the end of this file instead of stopping the server
const safe = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req, res, next)).catch(next);
const needPage = (staff) => (req, res, next) => { if (!req.user) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl)); if (staff && !auth.STAFF.includes(req.user.role)) return res.redirect('/app'); if (staff && req.user.netBlocked) return res.status(403).send(blockedPage(req)); if (staff && !auth.staffOk(req.user)) return res.redirect('/admin-2fa?next=' + encodeURIComponent(req.originalUrl)); next(); };
app.get('/admin-2fa', (req, res) => { if (!req.user) return res.redirect('/login?next=/admin'); if (!auth.STAFF.includes(req.user.role)) return res.redirect('/app'); if (auth.staffOk(req.user)) return res.redirect('/admin'); if (req.user.netBlocked && req.user.mfa_on && req.user.sess_mfa) return res.status(403).send(blockedPage(req)); res.setHeader('Vary', 'Cookie'); if (!/(?:^|;\s*)fs_theme=light/.test(req.headers.cookie || '')) return res.sendFile(path.join(__dirname, 'mfa-setup.html')); res.type('html').send(MFA_LIGHT || (MFA_LIGHT = require('../scripts/lighten').lighten(require('fs').readFileSync(path.join(__dirname, 'mfa-setup.html'), 'utf8')))); });
let MFA_LIGHT = null; // light-theme copy of the two-step setup page, made once
// Staff outside Team > Security > Allowed Networks: say why instead of showing the two-step login page
function blockedPage(req) { const hd = fs.readFileSync(path.join(__dirname, 'mfa-setup.html'), 'utf8'); const ip = String(req.ip || '').replace(/^::ffff:/, '').replace(/[^0-9a-fA-F:.]/g, '');
  return hd.slice(0, hd.indexOf('<body>')).replace(/<title>[^<]*<\/title>/, '<title>Network Not Allowed · Funded Sky</title>') + `<body><main class="card"><h1>This Network Is Not Allowed</h1><p>The back office only opens from your company network or VPN. You are connecting from <b>${ip || 'an unknown address'}</b>.</p><p>Connect to the office network or VPN and refresh, or ask an admin to add this address in Team, Security, Allowed Networks.</p><p class="foot"><a href="/logout?next=/login">Log Out</a></p></main></body></html>`; }
app.use('/static', express.static(path.join(DIST, 'static'), { maxAge: '1h' }));
// Visitor counting for Analytics: one count per browser per day on public pages, with the traffic source (first touch kept in fs_src).
const VPAGES = new Set(['/', '/checkout', '/checkout/payment', '/signup', '/login', '/terms', '/privacy', '/refund-policy', '/rules', '/faq', '/status']);
function srcOf(req) {
  const q = req.query || {}; const ref = String(req.get('referer') || ''); let host = ''; try { host = ref ? new URL(ref).hostname.replace(/^www\./, '') : ''; } catch (e) { /* bad referer */ }
  const us = String(q.utm_source || '').toLowerCase(), um = String(q.utm_medium || '').toLowerCase();
  if (q.ref) return 'aff'; if (um === 'email' || us === 'email') return 'email'; if (q.gclid || q.msclkid || ['cpc', 'ppc', 'paid', 'paidsearch'].includes(um)) return 'paid';
  const h = us || host; if (!h || (req.get('host') && host === req.get('host').split(':')[0])) return 'direct';
  if (/google|bing|duckduckgo|yahoo|ecosia|brave/.test(h)) return 'organic'; if (/youtube|youtu\.be/.test(h)) return 'youtube'; if (/discord/.test(h)) return 'discord';
  if (/facebook|instagram|t\.co|twitter|x\.com|tiktok|reddit|linkedin|threads|fb/.test(h)) return 'social'; if (/mail|newsletter/.test(h)) return 'email'; return 'direct';
}
app.use((req, res, next) => {
  if (req.method !== 'GET' || !VPAGES.has(req.path)) return next();
  if (!/bot|crawl|spider|preview|headless/i.test(req.get('user-agent') || '')) db.q('INSERT INTO pageviews(day,path,n) VALUES((now() AT TIME ZONE \'America/New_York\')::date,$1,1) ON CONFLICT (day,path) DO UPDATE SET n=pageviews.n+1', [req.path]).catch(() => {});
  try {
    const ck = auth.parseCookies(req.headers.cookie); const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); const src = srcOf(req); const camp = String(req.query.utm_campaign || '').slice(0, 60).replace(/[^\w .-]/g, '');
    const set = []; if (!ck.fs_src) set.push(`fs_src=${encodeURIComponent(JSON.stringify({ s: src, c: camp, at: day }))}; Path=/; Max-Age=${90 * 86400}; SameSite=Lax`);
    if (src !== 'direct') set.push(`fs_lsrc=${encodeURIComponent(JSON.stringify({ s: src, c: camp, at: day }))}; Path=/; Max-Age=${30 * 86400}; SameSite=Lax`);
    if (ck.fs_vd !== day && !/bot|crawl|spider|preview|headless/i.test(req.get('user-agent') || '')) {
      set.push(`fs_vd=${day}; Path=/; Max-Age=${2 * 86400}; SameSite=Lax`);
      const dev = /mobile|iphone|android/i.test(req.get('user-agent') || '') ? 'phone' : 'desktop'; const country = String(req.get('cf-ipcountry') || req.get('x-vercel-ip-country') || req.get('x-country-code') || '').slice(0, 2).toUpperCase();
      db.q('INSERT INTO visits(day,src,camp,country,dev,n) VALUES($1,$2,$3,$4,$5,1) ON CONFLICT (day,src,camp,country,dev) DO UPDATE SET n=visits.n+1', [day, src, camp, country, dev]).catch(() => {});
    }
    if (set.length) res.append('Set-Cookie', set);
  } catch (e) { /* never block a page for counting */ }
  next();
});
app.get('/', safe(async (req, res) => {
  if (req.query.ref) {
    const code = clean(req.query.ref, 40); res.append('Set-Cookie', `fs_ref=${encodeURIComponent(code)}; Path=/; Max-Age=${30 * 86400}; SameSite=Lax`);
    const d = new Date().toISOString().slice(0, 10);
    // Clicks are counted under the code in capital letters, and never for the owner opening their own link
    const own = req.user && (String(req.user.ref_code || '').toUpperCase() === code.toUpperCase() || await require('./affiliates').list().then((L) => L.some((x) => x.user === req.user.id && require('./affiliates').up(x.code) === code.toUpperCase())).catch(() => false));
    if (/^[A-Za-z0-9_-]{2,40}$/.test(code) && !own) await db.q("INSERT INTO kv(k,v) VALUES($1, jsonb_build_object($2::text, 1)) ON CONFLICT (k) DO UPDATE SET v = kv.v || jsonb_build_object($2::text, COALESCE((kv.v->>$2)::int,0)+1), updated_at=now()", ['refclicks.' + code.toUpperCase(), d]).catch(() => {});
    return res.redirect(req.user ? '/app' : '/signup?ref=' + encodeURIComponent(code));
  }
  res.redirect(req.user ? '/app' : '/checkout');
}));
const themed = (f) => (req, res) => { const lt = /(?:^|;\s*)fs_theme=light/.test(req.headers.cookie || ''); const ff = typeof f === 'function' ? f(req) : f; res.setHeader('Vary', 'Cookie'); res.sendFile(path.join(DIST, lt ? ff.replace('.html', '-light.html') : ff)); };
app.get('/checkout', themed('checkout.html'));
app.get('/checkout/payment', themed((req) => (req.user ? 'payment-member.html' : 'payment.html')));
app.get('/checkout/confirmed', themed('confirmed.html'));
app.get('/checkout/credits', needPage(false), safe(async (req, res, next) => { if (!(await require('./packs').enabled())) return res.redirect('/app'); themed('credits.html')(req, res, next); }));
app.get('/login', (req, res, next) => (req.user && !req.query.next ? res.redirect(auth.STAFF.includes(req.user.role) && req.query.admin ? '/admin' : '/app') : next()), themed('login.html'));
app.get('/signup', (req, res) => themed('signup.html')(req, res));
// Policy pages: the text published in Content > Website Pages, otherwise the built-in summary (FAQ has none: it is a 404 until one is published)
const PO = require('./policy');
const editable = (slug) => safe(async (req, res) => {
  const pg = ((await db.one("SELECT v FROM kv WHERE k='content.pages'").catch(() => null)) || {}).v || {}; const p = pg[slug]; res.setHeader('Vary', 'Cookie');
  if (p && p.status === 'Published' && p.txt) { const d = p.at && new Date(p.at); return res.send(PO.page({ req, title: p.title || slug, note: d && !isNaN(d) ? 'Last updated ' + PO.esc(d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })) : '', body: PO.fromText(p.txt) })); }
  const bi = PO.builtIn(slug, (await require('./mail').company()).support);
  if (bi) return res.send(PO.page(Object.assign({ req }, bi)));
  res.status(404).sendFile(path.join(DIST, '404.html'), (e) => e && res.status(404).send('Not found'));
});
// One-click unsubscribe from marketing emails (signed link in every marketing email)
async function unsub(req, res) {
  const uid = /^\d{1,9}$/.test(String(req.query.u || '')) ? parseInt(req.query.u, 10) : 0; const ok = uid && (await require('./mail').unsubCheck(uid, String(req.query.t || '')));
  if (ok) await db.q('UPDATE users SET settings = settings || $2::jsonb WHERE id=$1', [uid, JSON.stringify({ nMkt: false })]);
  if (req.method === 'POST') return res.status(ok ? 200 : 400).end();
  res.setHeader('Vary', 'Cookie'); res.status(ok ? 200 : 400).send(`<!doctype html><html lang="en"${PO.light(req) ? ' class="lt"' : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Funded Sky: Email Preferences</title><style>${PO.VARS}body{margin:0;background:var(--bg);color:var(--hd);font:15px/1.55 "Mona Sans",system-ui,sans-serif}main{max-width:720px;margin:0 auto;padding:56px 24px}${PO.TOP_CSS}.c{max-width:440px;margin:28px 0 0;background:var(--cd);border:1px solid var(--ln);border-radius:12px;padding:32px}h1{margin:0 0 10px;font-size:24px}p{margin:0 0 14px;color:var(--tx)}a{color:var(--lk)}</style></head><body><main>${PO.TOP}<div class="c"><h1>${ok ? 'You Are Unsubscribed.' : 'This Link Is Not Valid.'}</h1><p>${ok ? 'You will not get offers or sales emails any more. Receipts, payout updates and security emails still come, because they are about your account.' : 'Open the latest email from us and use its link, or change your emails in Settings.'}</p><p><a href="/app#settings?tab=notif">Manage All Emails</a></p></div></main></body></html>`);
}
app.get('/unsubscribe', safe(unsub)); app.post('/unsubscribe', express.urlencoded({ extended: false }), safe(unsub));
// Public certificate page: the real certificate, proof it is genuine, and ways to share or print it
app.get('/cert/:id', (req, res, next) => require('./certs').page(req, res).catch(next));
app.get('/status', safe(async (req, res) => {
  const e = (x) => String(x || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inc = (((await db.one("SELECT v FROM kv WHERE k='list.incidents'").catch(() => null)) || {}).v || []).filter((x) => x.pub !== false).slice(0, 10);
  const list = (await require('./integrations').list()).filter((x) => x.enabled);
  const open = inc.filter((x) => x.st !== 'resolved');
  const rows = [['Website and Checkout', 'ok'], ['Trader Dashboard', 'ok']].concat(list.filter((x) => ['tailoredpay', 'stripe', 'confirmo', 'rise', 'sumsub', 'resend'].includes(x.id)).map((x) => [x.name, x.status === 'live' ? 'ok' : 'w']));
  res.setHeader('Vary', 'Cookie');
  res.send(`<!doctype html><html lang="en"${PO.light(req) ? ' class="lt"' : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Funded Sky: System Status</title><meta http-equiv="refresh" content="60"><style>${PO.VARS}body{margin:0;background:var(--bg);color:var(--tx);font-family:"Mona Sans",system-ui;line-height:1.5}main{max-width:720px;margin:0 auto;padding:56px 24px}h1{color:var(--hd);font-size:28px;margin:28px 0 18px}${PO.TOP_CSS}.bar{padding:14px 18px;border-radius:12px;background:${open.length ? 'var(--wnb)' : 'var(--okb)'};color:${open.length ? 'var(--wn)' : 'var(--ok)'};font-weight:600;margin-bottom:22px}.r{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--ln)}.ok{color:var(--ok)}.w{color:var(--wn)}h2{color:var(--hd);font-size:17px;margin:30px 0 8px}.i{padding:12px 0;border-bottom:1px solid var(--ln)}.i b{color:var(--hd)}.n{color:var(--mu);font-size:13px}a{color:var(--lk)}</style></head><body><main>${PO.TOP}<h1>System Status</h1><div class="bar">${open.length ? e(open[0].t) : 'Everything is working'}</div>${rows.map(([n, st]) => `<div class="r"><span>${e(n)}</span><span class="${st}">${st === 'ok' ? 'Normal' : 'Slower than usual'}</span></div>`).join('')}<h2>Recent Incidents</h2>${inc.map((x) => `<div class="i"><b>${e(x.t)}</b> <span class="n">· ${x.st === 'resolved' ? 'Resolved' : 'Ongoing'} · ${e(new Date(x.at).toUTCString().slice(0, 22))} UTC</span>${(x.upd || []).slice(-1).map((u) => `<div class="n">${e(typeof u === 'string' ? u : u.text)}</div>`).join('')}</div>`).join('') || '<p class="n">No incidents reported.</p>'}</main></body></html>`);
}));
app.get('/terms', editable('terms'));
app.get('/privacy', editable('privacy'));
app.get('/refund-policy', editable('refund-policy'));
// Rules page: staff-written text if published in Content, otherwise the live rules for every plan and size from the catalog
app.get('/rules', safe(async (req, res, next) => {
  const pg = ((await db.one("SELECT v FROM kv WHERE k='content.pages'").catch(() => null)) || {}).v || {}; if (pg.rules && pg.rules.status === 'Published' && pg.rules.txt) return editable('rules')(req, res, next);
  try { const c = await core.catalog(); const RR = require('./rules'); const e = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); const m = (v) => '$' + Number(v || 0).toLocaleString('en-US');
    const RT = require('./ruletable');
    const tables = c.plans.filter((p) => p.active).map((p, pi) => { const t = RT.planTable(c, p.id); if (!t || !t.sizes.length) return '';
      // On a phone the table shows one size at a time, picked with the size buttons (radio inputs, so it works without scripts)
      return `<h2>${e(p.name || p.short)}</h2><p>${e(p.desc || '')}</p><div class="rs">${t.sizes.map((z, i) => `<input type="radio" name="rs${pi}" id="rs${pi}_${i}"${i ? '' : ' checked'}><label for="rs${pi}_${i}">$${z / 1000}K</label>`).join('')}<div class="tw"><table><thead><tr><th></th>${t.sizes.map((z) => `<th>$${z / 1000}K</th>`).join('')}</tr></thead><tbody>${t.rows.map((r) => (r.length === 1 ? `<tr class="g"><th colspan="${t.sizes.length + 1}">${e(r[0])}</th></tr>` : `<tr><th>${e(r[0])}</th>${r.slice(1).map((v) => `<td>${e(v)}</td>`).join('')}</tr>`)).join('')}</tbody></table></div></div>`; }).join('');
    const sup = e((await require('./mail').company()).support); res.setHeader('Vary', 'Cookie');
    res.send(PO.page({ req, wide: true, title: 'Trading Rules', note: `The rules every new account starts with, straight from our live catalog. Your own accounts show their rules in the dashboard. Questions: <a href="mailto:${sup}">${sup}</a>`, css: 'h2{font-size:21px;margin:36px 0 4px}.tw{overflow-x:auto;border:1px solid var(--ln);border-radius:10px;margin-top:12px}table{border-collapse:collapse;width:100%;font-size:14px;min-width:560px}th,td{padding:10px 14px;border-bottom:1px solid var(--ln2);text-align:right;white-space:nowrap}tbody th{text-align:left;color:var(--mu);font-weight:500}thead th{color:var(--hd)}tr:last-child th,tr:last-child td{border-bottom:0}tr.g th{color:var(--hd);font-weight:600;padding-top:18px;text-align:left}td{white-space:normal;min-width:120px}.rs>input{position:absolute;opacity:0;pointer-events:none}.rs>label{display:none}@media (max-width:700px){main{padding:40px 16px}.rs{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.rs>label{display:block;flex:1;text-align:center;padding:9px 0;border:1px solid var(--ln);border-radius:8px;font-size:14px;font-weight:500;color:var(--mu);cursor:pointer}.rs>input:checked+label{color:var(--hd);border-color:var(--lk);box-shadow:inset 0 0 0 1px var(--lk)}.rs>input:focus-visible+label{outline:2px solid var(--lk);outline-offset:2px}.rs .tw{flex:1 0 100%;margin-top:6px;overflow:visible}table,tbody{display:block;min-width:0}thead{display:none}tr{display:flex;gap:14px;border-bottom:1px solid var(--ln2)}tr:last-child{border-bottom:0}th,td{border-bottom:0;display:block;flex:1 1 0;white-space:normal;min-width:0;overflow-wrap:break-word}tbody th{flex:1.4 1 0}' + [1, 2, 3, 4, 5, 6].map((i) => `.rs>input:nth-of-type(${i}):checked~.tw td:not(:nth-child(${i + 1}))`).join(',') + '{display:none}}', body: `${tables}<p style="margin-top:32px"><a href="/checkout">Choose an Account</a> · <a href="/terms">Terms of Service</a></p>` })); } catch (err) { next(err); }
}));
app.get('/faq', editable('faq'));
// Public competition leaderboard (Back Office > Competitions > Leaderboard > Settings switches it on and off)
app.get('/leaderboard', async (req, res, next) => {
  try { const fl = ((await db.one("SELECT v FROM kv WHERE k='settings.flags'")) || {}).v || {}; const d = fl.competitions === false ? null : await require('./comps').forPublic();
    if (!d) return res.status(404).sendFile(path.join(DIST, '404.html'), (e) => e && res.status(404).send('Not found'));
    const e = PO.esc; const m = (v) => (v < 0 ? '−' : v > 0 ? '+' : '') + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const tbl = (c) => (c.lb && c.lb.length ? `<div class="tw"><table><thead><tr><th>Rank</th><th>Trader</th><th>Country</th><th>Return</th><th>Profit</th></tr></thead><tbody>${c.lb.map((x) => `<tr><td>#${x.rank}</td><th>${e(x.name)}</th><td>${e(x.country)}</td><td>${x.pct}%</td><td>${m(x.pnl)}</td></tr>`).join('')}</tbody></table></div>${c.total.ranked > c.lb.length ? `<p class="n">Showing the top ${c.lb.length} of ${c.total.ranked} ranked traders.</p>` : ''}` : '<p class="n">Nobody has traded yet.</p>');
    const sec = (c) => `<h2>${e(c.n)}</h2><p class="n">${c.st === 'live' ? 'Live now' : c.st === 'ended' ? 'Finished' : 'Coming up'} · ${e(c.start)} to ${e(c.end)} · ${e(c.size)} · ${e(c.prize)}</p>${c.st === 'ended' && c.winners && c.winners.length ? `<p>${c.winners.map((w) => `<b>${e(w.place)}</b> ${e(w.name)}, ${e(w.prize)}`).join(' · ')}</p>` : ''}${c.st === 'upcoming' ? '' : tbl(c)}`;
    const L = d.comps.filter((c) => c.st === 'live').concat(d.comps.filter((c) => c.st === 'upcoming'), d.comps.filter((c) => c.st === 'ended').slice(0, 5)); res.setHeader('Vary', 'Cookie');
    res.send(PO.page({ req, wide: true, title: 'Competition Leaderboard', note: 'Free trading competitions on practice accounts. Ranked by profit, updated every minute.', css: 'h2{font-size:21px;margin:36px 0 4px}.n{color:var(--mu);font-size:14px;margin:4px 0 0}.tw{overflow-x:auto;border:1px solid var(--ln);border-radius:10px;margin-top:12px}table{border-collapse:collapse;width:100%;font-size:14px;min-width:480px}th,td{padding:10px 14px;border-bottom:1px solid var(--ln2);text-align:right;white-space:nowrap}th:nth-child(-n+3),td:nth-child(-n+3){text-align:left}tbody th{font-weight:500;color:var(--hd)}thead th{color:var(--mu);font-weight:500}tr:last-child th,tr:last-child td{border-bottom:0}', body: `${L.length ? L.map(sec).join('') : '<p>No competitions right now.</p>'}<h2>How Ranking Works</h2><ul>${d.rules.map((x) => `<li>${e(x)}</li>`).join('')}</ul><p style="margin-top:32px"><a href="/app/competitions">Join a Competition</a></p>` })); } catch (err) { next(err); }
});
app.get('/logout', safe(async (req, res) => { await auth.logout(req, res); const n = String(req.query.next || '/login'); res.redirect(/^\/(?![\/\\])/.test(n) && !/[\u0000-\u001f\\]/.test(n) ? n : '/login'); }));
app.get('/forgot-password', (req, res) => themed('forgot.html')(req, res));
app.get('/reset-password', (req, res) => themed('reset-password.html')(req, res));
app.get('/verify-email', (req, res) => themed('verify.html')(req, res));
app.get('/reset', needPage(false), (req, res, next) => themed('reset.html')(req, res, next));
app.get('/app/packs', safe(async (req, res, next) => { if (!(await require('./packs').enabled())) return res.redirect('/app'); next(); }));
app.get(['/app', '/app/*'], needPage(false), page('app.html'));
app.get(['/admin', '/admin/*'], needPage(true), (req, res) => { const dc = /^Admin([A-Za-z]+?)(?:Light)?\.dc\.html$/.exec((req.params[0] || '').split('/')[0]); if (dc) return res.redirect('/admin/' + dc[1].toLowerCase()); const b = ((req.params[0] || 'home').split('/')[0] || 'home').replace(/[^a-z]/g, ''); const f = path.join(DIST, 'admin', b + '.html'); if (fs.existsSync(f)) return res.sendFile(f); res.redirect('/admin/home'); });
app.use((req, res) => res.status(404).sendFile(path.join(DIST, '404.html'), (e) => e && res.status(404).send('Not found')));
// Last stop for anything a page or middleware threw: a short answer with no stack trace, and a line in the log and in System Health for real faults
app.use((err, req, res, next) => { const st = err && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (st === 500) { console.error(req.method, req.path, err); db.q('INSERT INTO error_log(path,msg) VALUES($1,$2)', [req.method + ' ' + String(req.path).slice(0, 200), String((err && err.message) || err).slice(0, 500)]).catch(() => {}); }
  if (res.headersSent) return next(err);
  if (req.path.startsWith('/api/')) return res.status(st).json({ error: st === 500 ? 'Something went wrong on our side. Try again.' : 'That request is not valid.' });
  res.status(st).type('text').send(st === 500 ? 'Something went wrong on our side. Try again.' : st === 404 ? 'Not found' : 'That address is not valid'); });
// A promise nobody waited for must never stop the server: log it and carry on
process.on('unhandledRejection', (e) => { console.error('unhandledRejection', e); db.q('INSERT INTO error_log(path,msg) VALUES($1,$2)', ['unhandledRejection', String((e && e.message) || e).slice(0, 500)]).catch(() => {}); });

const PORT = process.env.PORT || 3000;
migrate().then(async () => {
  // Accounts bought before rule snapshots existed keep the rules in force today from now on
  try { const cat = await core.catalog(true); const RR = require('./rules'); for (const a of await db.all('SELECT id, plan, size FROM accounts WHERE rs IS NULL')) await db.q('UPDATE accounts SET rs=$2 WHERE id=$1', [a.id, RR.snapshot(cat, a.plan, a.size)]); } catch (e) { console.error('rules backfill', e.message); }
  try { if (await require('./planmigr').run()) console.log('Catalog updated: full rule sets'); } catch (e) { console.error('plan update', e.message); }
  try { const n = await flows.taxEncryptOld(); if (n) console.log('Tax forms encrypted: ' + n); } catch (e) { console.error('tax form encryption', e.message); }
  app.listen(PORT, () => console.log('Funded Sky listening on ' + PORT + (pay.enabled() ? ' (Stripe on)' : ' (test payments)')));
  sim.start(); require('./riskscan').start(); require('./automations').start();
}).catch((e) => { console.error('Startup failed', e); process.exit(1); });
module.exports = app;
