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
const { HttpError, bad, clean, round2 } = require('./util');

const app = express();
app.set('trust proxy', 1);
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
app.use(express.json({ limit: '200kb' }));
app.use((req, res, next) => auth.loadUser(req, res, next).catch(next));

// Basic rate limit for auth endpoints
const hits = new Map();
const limit = (n, ms) => (req, res, next) => { if (process.env.QA_NO_LIMIT === '1' && process.env.NODE_ENV !== 'production') return next(); const k = req.ip + req.path; const now = Date.now(); const h = (hits.get(k) || []).filter((t) => now - t < ms); h.push(now); hits.set(k, h); if (h.length > n) return res.status(429).json({ error: 'Too many tries. Wait a minute and try again.' }); next(); };
setInterval(() => hits.clear(), 10 * 60 * 1000).unref();

const h = (fn) => async (req, res) => {
  try { const out = await fn(req, res); if (!res.headersSent) res.json(out || { ok: true }); }
  catch (e) { const st = e instanceof HttpError ? e.status : e.status === 402 ? 402 : 500; if (st === 500) { console.error(req.method, req.path, e); db.q('INSERT INTO error_log(path,msg) VALUES($1,$2)', [req.method + ' ' + req.path, String(e.message || e).slice(0, 500)]).catch(() => {}); } res.status(st).json({ error: st === 500 ? 'Something went wrong on our side. Try again.' : e.message, fallback: e.fallback || undefined }); }
};

// ---------- public ----------
app.get('/api/health', h(async () => ({ ok: true, db: !!(await db.one('SELECT 1 AS x')), stripe: pay.enabled(), market: sim.marketOpen() })));
app.get('/api/catalog', h(async () => { const c = await core.catalog(); const RR = require('./rules');
  // Effective rules per plan and size, the same numbers the rule engine uses for a new account
  const rules = {}; c.plans.filter((p) => p.active).forEach((p) => { rules[p.id] = {}; p.sizes.forEach((z) => { const inst = p.id === 'instant' || p.kind === 'funded'; const ev = RR.rulesFor(c, { plan: p.id, size: z.size, kind: inst ? 'funded' : 'evaluation', payout_count: 0 }); const fu = inst ? ev : RR.rulesFor(c, { plan: p.id, size: z.size, kind: 'funded', payout_count: 0 }); const ov = ((c.planRules || {})[p.id] || {})[z.size] || {};
    rules[p.id][z.size] = { target: inst ? ev.goal : ev.target, dll: ev.dll, maxLoss: ev.maxLoss, contracts: ev.fullContracts || ev.contracts, minDays: ev.minDays || 0, consistency: ev.consistency, split: fu.split, splitText: inst && ov.split == null ? `${c.instantCommon.splitFirst}%, then ${c.instantCommon.splitLater}%` : fu.split + '%', payoutMin: fu.payoutMin }; }); });
  const pubPlans = c.plans.filter((p) => p.active).map((p) => Object.assign({}, p, { sizes: p.sizes.map((z) => ({ size: z.size, price: core.priceOf(z), activation: z.activation, compare: z.compare && z.compare > core.priceOf(z) ? z.compare : undefined })), bundleOff: undefined }));
  return { rules, plans: pubPlans, evalRules: c.evalRules, evalCommon: c.evalCommon, fundedCommon: c.fundedCommon, fundedCaps: c.fundedCaps, instantRules: c.instantRules, instantCommon: c.instantCommon, instantCaps: c.instantCaps, addons: c.addons, resetPct: c.resetPct, bundles: c.bundles, promos: (c.promos || []).filter((p) => p.active && !(Number(p.total) === 1) && (!p.ends || p.ends >= new Date().toISOString().slice(0, 10))).map(({ code, name, pct, plans, starts, ends, desc }) => ({ code, name, pct, plans, starts, ends, desc })), payments: pay.mode(), packLadder: await require('./packs').publicLadder(), credits: await require('./packs').publicCredits() }; }));
app.get('/api/public-config', h(async () => { const m = await pay.refreshMode(); const crisp = await I.cfg('crisp'); const ph = await I.cfg('posthog'); const ss = await I.cfg('sumsub');
  const kv2 = await db.all("SELECT k, v FROM kv WHERE k IN ('settings.flags','settings.maint')"); const g = (k) => (kv2.find((r) => r.k === k) || {}).v || {};
  const ann = await db.one("SELECT v FROM kv WHERE k='list.announcements'"); const now = new Date().toISOString().slice(0, 10);
  return { announcements: ((ann && ann.v) || []).filter((a) => a.live && (!a.ends || a.ends >= now) && (!a.starts || a.starts <= new Date().toISOString())), flags: g('settings.flags'), maint: g('settings.maint').on ? g('settings.maint').msg : '', card: m.card, stripePk: m.stripePk || '', backup: m.backup || '', stripeBackup: m.backup === 'stripe', crypto: m.crypto, live: m.live, tokenizationKey: m.tokenizationKey || '', gatewayUrl: m.gatewayUrl || '', crisp: crisp ? crisp.websiteId : '', support: await require('./support').publicInfo(), posthog: ph ? { key: ph.projectKey, host: ph.host } : null, sumsub: !!ss }; }));
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
app.post('/api/auth/verify', limit(10, 60000), h((req) => auth.verifyEmail(req)));
app.post('/api/auth/resend', auth.needUser, limit(4, 60000), h((req) => auth.resendVerify(req)));
app.post('/api/cart/price', h(async (req) => core.priceCart(req.body.items, { promo: req.body.promo, coupon: req.body.coupon, userId: req.user && req.user.id })));

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
T.get('/packs', h(async (req) => { const d = await PK.traderData(req.user.id); if (!d) bad('Packs are switched off right now', 403); return d; }));
T.post('/packs/buy', limit(30, 60000), h((req) => PK.buy(req.user, clean(req.body.pack, 30))));
T.post('/packs/open', limit(30, 60000), h((req) => PK.openOwned(req.user, req.body.id)));
T.post('/cards/:id/use', limit(20, 60000), h((req) => PK.useCard(req.user, req.params.id, req.body || {})));
T.post('/orders/credits', h(async (req) => { const m = await maintOn(); if (m) bad(m, 503); if (await auth.blockedReq(req, req.user.email)) bad('This purchase could not be completed. Contact support.', 403); return PK.createCreditsOrder(req.user, req.body || {}); }));
T.post('/orders', h(async (req) => { const m = await maintOn(); if (m) bad(m, 503); if (await auth.blockedReq(req, req.user.email)) bad('This purchase could not be completed. Contact support.', 403); { const sw = ((await db.one("SELECT v FROM kv WHERE k='store.risk.switches'")) || {}).v || {}; if (sw.sales) bad('New purchases are paused for a short time. Try again soon.', 503); } return pay.createOrder(req.user, req.body); }));
T.post('/orders/reset', h((req) => pay.createResetOrder(req.user, req.body)));
T.post('/orders/activation', h((req) => pay.createActivationOrder(req.user, req.body)));
T.get('/orders/:code', h((req) => pay.getOrder(req.user, req.params.code, req.query.session_id)));
T.post('/orders/:code/pay', h((req) => pay.payOrder(req.user, req.params.code, req.body)));
T.get('/orders/:code/receipt', async (req, res) => { try { res.type('html').send(await pay.receipt(req.user, req.params.code)); } catch (e) { res.status(404).send('Not found'); } });
T.post('/accounts/:id/agreement', h(async (req) => { const r = await core.signAgreement(req.user.id, req.params.id); if (r.activation) { const o = await pay.createActivationOrder(req.user, { account: req.params.id }); return { checkout: '/checkout/payment?order=' + o.code }; } return r; }));
T.post('/payouts', h(async (req) => { const sw = ((await db.one("SELECT v FROM kv WHERE k='store.risk.switches'")) || {}).v || {}; if (sw.payouts) bad('Payout requests are paused for a short time. Try again later.', 503); return core.requestPayout(req.user.id, clean(req.body.account, 40), req.body.amount, parseInt(req.body.method, 10)); }));
T.post('/payout-methods', h(async (req) => {
  const rail = ['Rise', 'USDC'].includes(req.body.rail) ? req.body.rail : 'Rise'; if (rail === 'USDC' && !(await flagOn('cryptoPayouts'))) bad('USDC payouts are switched off right now. Pick another method.'); const railsOff = ((await db.one("SELECT v FROM kv WHERE k='store.finance.rails'")) || {}).v || {}; if (railsOff[rail.toLowerCase()] === false) bad(rail + ' payouts are not offered right now. Pick another method.'); const raw = clean(req.body.label, 120); if (raw.length < 4) bad('Enter your account or wallet details');
  if (rail === 'USDC' && !/^0x[a-fA-F0-9]{40}$/.test(raw)) bad('Enter a full wallet address that starts with 0x');
  const label = rail === 'USDC' ? `USDC · Wallet ${raw.slice(0, 6)}…${raw.slice(-4)}` : `Rise · Bank •••• ${raw.replace(/\D/g, '').slice(-4) || raw.slice(-4)}`;
  const n = (await db.one('SELECT count(*)::int n FROM payout_methods WHERE user_id=$1', [req.user.id])).n; if (n >= 5) bad('You can keep up to 5 payout methods');
  await db.q("INSERT INTO payout_methods(user_id,rail,label,is_default,unlock_at) VALUES($1,$2,$3,$4, now() + interval '48 hours')", [req.user.id, rail, label, n === 0]);
  await core.notify(null, req.user.id, 'New payout method added', `${label}. It can be used in 48 hours. If this wasn't you, contact support now.`, 'settings?tab=pay');
  if (rail === 'Rise') { const r = await flows.riseInvite(req.user); if (r === 'invited') await core.notify(null, req.user.id, 'Check your email for a Rise invite', 'Finish Rise onboarding so we can send your payouts.', 'settings?tab=pay'); }
}));
T.post('/payout-methods/:id/default', h(async (req) => { await db.q('UPDATE payout_methods SET is_default=(id=$2) WHERE user_id=$1', [req.user.id, +req.params.id]); }));
T.post('/notifications/read', h(async (req) => { if (req.body.all) await db.q('UPDATE notifications SET read=true WHERE user_id=$1', [req.user.id]); else await db.q('UPDATE notifications SET read=true WHERE user_id=$1 AND id=$2', [req.user.id, +req.body.id]); }));
T.post('/tickets', h(async (req) => {
  const s = clean(req.body.subject, 160); if (!s) bad('Add a subject');
  const t = await db.one('INSERT INTO tickets(user_id,subject,category,channel) VALUES($1,$2,$3,$4) RETURNING id', [req.user.id, s, clean(req.body.category, 60) || 'General', 'Web']);
  const body = clean(req.body.body, 5000) || s;
  await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, req.user.id, body]);
  const SUP = require('./support'); const r = await SUP.onTraderMessage(t.id, body, { isNew: true }); const ss = await SUP.settings();
  require('./mail').t('ticket', req.user.id, { ticket: t.id, subject: s, reply_time: r.afterHours ? (ss.ahText || SUP.replyText(ss)) : SUP.replyText(ss), url: require('./auth').BASE() + '/app#support?tkt=' + t.id });
  I.alert('ticket', `:speech_balloon: New ticket #${t.id}${r.urgent ? ' (urgent)' : ''}: ${s}`);
  return { id: t.id };
}));
T.post('/tickets/:id/reply', h(async (req) => {
  const t = await db.one('SELECT * FROM tickets WHERE id=$1 AND user_id=$2', [+req.params.id, req.user.id]); if (!t) bad('Ticket not found', 404);
  await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, req.user.id, clean(req.body.body, 5000)]);
  await db.q("UPDATE tickets SET status='open', updated_at=now() WHERE id=$1", [t.id]);
  await require('./support').onTraderMessage(t.id, clean(req.body.body, 5000));
}));
T.post('/tickets/:id/rate', h(async (req) => {
  const t = await db.one('SELECT * FROM tickets WHERE id=$1 AND user_id=$2', [+req.params.id, req.user.id]); if (!t) bad('Ticket not found', 404);
  if (t.status !== 'solved') bad('You can rate a ticket once it is solved');
  const good = !!req.body.good; await db.q('UPDATE tickets SET rating=$2, rated_at=now() WHERE id=$1', [t.id, good ? 'good' : 'bad']);
  if (!good) { await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, req.user.id, clean(req.body.body, 2000) || 'This is not solved yet.']); await db.q("UPDATE tickets SET status='open', updated_at=now() WHERE id=$1", [t.id]); }
  return { reopened: !good };
}));
// Privacy requests: a support ticket plus an entry in the Users board's Privacy Requests queue (answer within 30 days)
T.post('/privacy-request', h(async (req) => {
  const type = req.body.type === 'delete' ? 'Delete My Account' : req.body.type === 'marketing' ? 'Stop Marketing' : 'Copy of My Data';
  const all = ((await db.one("SELECT v FROM kv WHERE k='store.users.datareq'")) || {}).v || [];
  if (all.some((x) => x.uid === req.user.id && x.type === type && x.st !== 'done')) bad('You already asked for this. We will email you within 30 days.');
  const subj = type === 'Delete My Account' ? 'Close My Account' : type === 'Stop Marketing' ? 'Stop Marketing Emails' : 'Data Export Request';
  const t = await db.one("INSERT INTO tickets(user_id,subject,category,channel) VALUES($1,$2,'Account Changes','Web') RETURNING id", [req.user.id, subj]);
  await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, req.user.id, type === 'Delete My Account' ? 'Please close my Funded Sky account and delete my personal data.' : type === 'Stop Marketing' ? 'Please stop all marketing emails.' : 'Please send me a copy of my data.']);
  const id = 'DR-' + String(1000 + all.length + 1); all.unshift({ id, uid: req.user.id, type, at: new Date().toISOString(), st: 'open', note: '', ticket: t.id });
  await db.q("INSERT INTO kv(k,v) VALUES('store.users.datareq',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(all)]);
  if (type === 'Delete My Account') require('./mail').t('delreq', req.user.id, { url: require('./auth').BASE() + '/app#support?tkt=' + t.id });
  if (type === 'Stop Marketing') await db.q("UPDATE users SET settings = settings || $2::jsonb WHERE id=$1", [req.user.id, JSON.stringify({ nMkt: false, nNews: false })]);
  return { id, ticket: t.id };
}));
T.post('/articles/stat', h(async (req) => { await require('./support').articleStat(req.body.t, req.body.kind); }));
const SETTING_KEYS = ['nEmail', 'nSms', 'nPush', 'nNews', 'nMkt', 'nComp', 'mfaPay'];
T.post('/settings', h(async (req) => { const o = {}; for (const k of SETTING_KEYS) if (k in req.body) o[k] = !!req.body[k]; await db.q('UPDATE users SET settings = settings || $2 WHERE id=$1', [req.user.id, JSON.stringify(o)]); }));
T.post('/profile', h(async (req) => { const ph = require('./phone').parse(req.body.phoneIso, req.body.phone); if (ph.err) bad(ph.err); await db.q("UPDATE users SET phone=$2, settings=COALESCE(settings,'{}'::jsonb)||jsonb_build_object('phoneIso',$3::text) WHERE id=$1", [req.user.id, ph.phone, ph.iso]); return { ok: true, phone: ph.phone }; }));
T.post('/password', h((req) => auth.changePassword(req)));
T.post('/sessions/:prefix/revoke', h(async (req) => { await db.q("DELETE FROM sessions WHERE user_id=$1 AND token LIKE $2 || '%' AND token<>$3", [req.user.id, clean(req.params.prefix, 20), req.sess]); }));
T.post('/journal/note', h(async (req) => {
  const day = clean(req.body.day, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) bad('Pick a day first');
  await db.q("UPDATE users SET settings = jsonb_set(settings, '{notes}', COALESCE(settings->'notes','{}'::jsonb) || jsonb_build_object($2::text, $3::text)) WHERE id=$1", [req.user.id, day, clean(req.body.text, 2000)]);
}));
T.post('/courses/:id/lesson', needFlag('education', 'Courses are switched off right now'), h(async (req) => {
  const C = await content.all(); const c = C.courses.find((x) => x.id === req.params.id); if (!c) bad('Course not found', 404);
  const prog = (req.user.settings && req.user.settings.courses) || {}; const done = Math.min(c.l, (prog[c.id] || 0) + 1);
  await db.q("UPDATE users SET settings = jsonb_set(settings, '{courses}', COALESCE(settings->'courses','{}'::jsonb) || jsonb_build_object($2::text, $3::int)) WHERE id=$1", [req.user.id, c.id, done]);
  if (done === c.l && (prog[c.id] || 0) < c.l) await core.points(null, req.user.id, 100, 'Finished ' + c.n);
  return { done };
}));
T.post('/rewards/:id/redeem', needFlag('rewards', 'Rewards are switched off right now'), h(async (req) => {
  const C = await content.all(); const r = C.rewards.find((x) => x.id === req.params.id); if (!r) bad('Reward not found', 404);
  return db.tx(async (c) => {
    const u = await c.one('SELECT points FROM users WHERE id=$1 FOR UPDATE', [req.user.id]); if (u.points < r.pts) bad('You need more credits for this reward');
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
T.post('/competitions/:id/join', h(async (req) => { const fl = ((await db.one("SELECT v FROM kv WHERE k='settings.flags'")) || {}).v || {}; if (fl.competitions === false) bad('Competitions are not open right now', 403); const comp = ((await content.all()).competitions || []).find((x) => x.id === req.params.id); if (!comp) bad('Competition not found', 404); if (comp.st === 'ended') bad('This competition has ended'); await db.q("UPDATE users SET settings = jsonb_set(settings, '{comps}', COALESCE(settings->'comps','{}'::jsonb) || jsonb_build_object($2::text, true)) WHERE id=$1", [req.user.id, clean(req.params.id, 20)]); const acct = await require('./comps').joined(comp.id, req.user.id); return { account: acct }; }));
// Certificates: find one by its public ID
async function findCert(id) {
  const tr = require('./trader'); id = clean(id, 20);
  for (const p of await db.all("SELECT p.code, p.amount, p.paid_at, p.user_id FROM payouts p WHERE p.status='paid'")) if (tr.certId('o' + p.code) === id) return { id, user: p.user_id, k: 'Payout Certificate', v: '$' + Math.round(p.amount).toLocaleString('en-US'), when: p.paid_at };
  for (const a of await db.all('SELECT id, user_id, size, kind, funded_at, passed_at FROM accounts WHERE funded_at IS NOT NULL OR passed_at IS NOT NULL')) {
    if (a.kind === 'funded' && a.funded_at && tr.certId('f' + a.id) === id) return { id, user: a.user_id, k: 'Funded Trader', v: '$' + a.size / 1000 + 'K Funded Account', when: a.funded_at };
    if (a.passed_at && tr.certId('p' + a.id) === id) return { id, user: a.user_id, k: 'Evaluation Passed', v: '$' + a.size / 1000 + 'K Evaluation', when: a.passed_at };
  }
  return null;
}
// Sharing a certificate earns 50 credits, at most once a week
T.post('/certs/:id/share', h(async (req) => {
  const c = await findCert(req.params.id); if (!c || c.user !== req.user.id) bad('Certificate not found', 404);
  const rev = ((await db.one("SELECT v FROM kv WHERE k='store.rewards.revoked'")) || {}).v || []; if (rev.includes(c.id)) bad('This certificate is no longer valid');
  const recent = await db.one("SELECT 1 FROM points_log WHERE user_id=$1 AND label LIKE 'Shared certificate%' AND created_at > now() - interval '7 days'", [req.user.id]);
  if (!recent) await core.points(null, req.user.id, 50, 'Shared certificate ' + c.id);
  return { url: require('./auth').BASE() + '/cert/' + c.id, points: recent ? 0 : 50 };
}));
T.post('/kyc/sumsub', h((req) => flows.sumsubToken(req.user)));
T.post('/tax/form', h((req) => flows.taxForm(req.user)));
T.post('/kyc', h(async (req) => {
  const b = req.body; const k = { name: clean(b.name, 120), dob: clean(b.dob, 12), country: clean(b.country, 60), idType: clean(b.idType, 40), idLast4: clean(b.idNumber, 40).slice(-4), at: new Date().toISOString() };
  if (!k.name || !k.dob) bad('Fill in every field');
  await db.q("UPDATE users SET kyc=$2, kyc_status='submitted' WHERE id=$1 AND kyc_status<>'verified'", [req.user.id, k]);
}));
T.post('/affiliate/apply', needFlag('affiliates', 'The affiliate program is not taking applications right now'), h(async (req) => { const b = req.body || {}; await db.q("UPDATE users SET settings = settings || $2 WHERE id=$1", [req.user.id, JSON.stringify({ affApplied: true, affAt: new Date().toISOString(), affWhere: clean(b.where, 120), affAudience: clean(b.audience, 200) })]); }));
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
const needPage = (staff) => (req, res, next) => { if (!req.user) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl)); if (staff && !auth.STAFF.includes(req.user.role)) return res.redirect('/app'); if (staff && !auth.staffOk(req.user)) return res.redirect('/admin-2fa?next=' + encodeURIComponent(req.originalUrl)); next(); };
app.get('/admin-2fa', (req, res) => { if (!req.user) return res.redirect('/login?next=/admin'); if (!auth.STAFF.includes(req.user.role)) return res.redirect('/app'); if (auth.staffOk(req.user)) return res.redirect('/admin'); res.sendFile(path.join(__dirname, 'mfa-setup.html')); });
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
app.get('/', async (req, res) => {
  if (req.query.ref) {
    const code = clean(req.query.ref, 40); res.setHeader('Set-Cookie', `fs_ref=${encodeURIComponent(code)}; Path=/; Max-Age=${30 * 86400}; SameSite=Lax`);
    const d = new Date().toISOString().slice(0, 10);
    if (/^[A-Za-z0-9_-]{2,40}$/.test(code)) await db.q("INSERT INTO kv(k,v) VALUES($1, jsonb_build_object($2::text, 1)) ON CONFLICT (k) DO UPDATE SET v = kv.v || jsonb_build_object($2::text, COALESCE((kv.v->>$2)::int,0)+1), updated_at=now()", ['refclicks.' + code, d]).catch(() => {});
    return res.redirect(req.user ? '/app' : '/signup?ref=' + encodeURIComponent(code));
  }
  res.redirect(req.user ? '/app' : '/checkout');
});
const themed = (f) => (req, res) => { const lt = /(?:^|;\s*)fs_theme=light/.test(req.headers.cookie || ''); const ff = typeof f === 'function' ? f(req) : f; res.setHeader('Vary', 'Cookie'); res.sendFile(path.join(DIST, lt ? ff.replace('.html', '-light.html') : ff)); };
app.get('/checkout', themed('checkout.html'));
app.get('/checkout/payment', themed((req) => (req.user ? 'payment-member.html' : 'payment.html')));
app.get('/checkout/confirmed', themed('confirmed.html'));
app.get('/checkout/credits', needPage(false), async (req, res, next) => { if (!(await require('./packs').enabled())) return res.redirect('/app'); themed('credits.html')(req, res, next); });
app.get('/login', (req, res, next) => (req.user && !req.query.next ? res.redirect(auth.STAFF.includes(req.user.role) && req.query.admin ? '/admin' : '/app') : next()), themed('login.html'));
app.get('/signup', (req, res) => themed('signup.html')(req, res));
const editable = (slug, f) => async (req, res) => {
  const pg = ((await db.one("SELECT v FROM kv WHERE k='content.pages'").catch(() => null)) || {}).v || {}; const p = pg[slug];
  if (!p || p.status !== 'Published' || !p.txt) return res.sendFile(path.join(DIST, f));
  const e = (x) => String(x || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const body = String(p.txt).split(/\n\n+/).map((para) => (/^#+\s/.test(para) ? `<h2>${e(para.replace(/^#+\s*/, ''))}</h2>` : `<p>${e(para).replace(/\n/g, '<br>')}</p>`)).join('');
  res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Funded Sky: ${e(p.title)}</title><style>body{margin:0;background:#08080A;color:#D4CFCD;font-family:"Mona Sans",system-ui;line-height:1.6}main{max-width:720px;margin:0 auto;padding:56px 24px}h1{color:#F4F2F1;font-size:32px;margin:0 0 6px}h2{color:#F4F2F1;font-size:18px;margin:28px 0 6px}a{color:#7CC4FF}.n{color:#9C9693;font-size:14px}</style></head><body><main><p><a href="/">← Funded Sky</a></p><h1>${e(p.title)}</h1><p class="n">Last updated ${e(new Date(p.at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))}</p>${body}</main></body></html>`);
};
// One-click unsubscribe from marketing emails (signed link in every marketing email)
async function unsub(req, res) {
  const uid = parseInt(req.query.u, 10); const ok = uid && (await require('./mail').unsubCheck(uid, String(req.query.t || '')));
  if (ok) await db.q('UPDATE users SET settings = settings || $2::jsonb WHERE id=$1', [uid, JSON.stringify({ nMkt: false })]);
  if (req.method === 'POST') return res.status(ok ? 200 : 400).end();
  res.status(ok ? 200 : 400).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email Preferences · Funded Sky</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#08080A;color:#F4F2F1;font:15px/1.55 "Mona Sans",system-ui,sans-serif;padding:24px;box-sizing:border-box}.c{max-width:440px;background:#18181A;border:1px solid #26262A;border-radius:12px;padding:32px}h1{margin:0 0 10px;font-size:24px}p{margin:0 0 14px;color:#D4CFCD}a{color:#7CC4FF}</style></head><body><div class="c"><h1>${ok ? 'You Are Unsubscribed.' : 'This Link Is Not Valid.'}</h1><p>${ok ? 'You will not get offers or sales emails any more. Receipts, payout updates and security emails still come, because they are about your account.' : 'Open the latest email from us and use its link, or change your emails in Settings.'}</p><p><a href="/app#settings?tab=notif">Manage All Emails</a></p></div></body></html>`);
}
app.get('/unsubscribe', unsub); app.post('/unsubscribe', express.urlencoded({ extended: false }), unsub);
app.get('/cert/:id', async (req, res) => {
  const e = (x) => String(x || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const c = await findCert(req.params.id).catch(() => null); const rev = ((await db.one("SELECT v FROM kv WHERE k='store.rewards.revoked'").catch(() => null)) || {}).v || [];
  let u = null; if (c) { u = await db.one('SELECT first, last FROM users WHERE id=$1', [c.user]); db.q("INSERT INTO kv(k,v) VALUES('certviews', jsonb_build_object($1::text, 1)) ON CONFLICT (k) DO UPDATE SET v = kv.v || jsonb_build_object($1::text, COALESCE((kv.v->>$1)::int,0)+1)", [c.id]).catch(() => {}); }
  const bad2 = !c || rev.includes(c.id);
  const when = c ? new Date(c.when).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  res.status(c ? 200 : 404).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Funded Sky Certificate ${e(req.params.id)}</title>
<meta property="og:title" content="${bad2 ? 'Funded Sky certificate' : e(c.k + ': ' + c.v)}"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#08080A;color:#F4F2F1;font-family:"Mona Sans",system-ui,sans-serif;padding:24px;box-sizing:border-box}
.c{width:min(640px,100%);border:1px solid #26262A;border-radius:16px;padding:40px;background:radial-gradient(120% 120% at 100% 0,#13202E,#111113 60%);box-sizing:border-box}.lg{font-weight:700;font-size:20px}.lg i{font-style:normal;background:#7CC4FF;color:#08080A;border-radius:4px;padding:1px 6px;margin-left:6px;font-size:14px}
.k{margin-top:36px;color:#7CC4FF;font-size:14px;letter-spacing:.12em;text-transform:uppercase}.v{font-size:40px;font-weight:700;margin:8px 0}.n{color:#D4CFCD;font-size:16px}.id{margin-top:32px;font-family:"Geist Mono",monospace;color:#9C9693;font-size:13px}.no{color:#F2777F;font-size:18px;margin-top:28px}</style></head>
<body><div class="c"><div class="lg">fundedsky<i>futures</i></div>${bad2 ? `<p class="no">${c ? 'This certificate is no longer valid.' : 'Certificate not found.'}</p>` : `<div class="k">${e(c.k)}</div><div class="v">${e(c.v)}</div><div class="n">${e(u.first)} ${e((u.last || '').slice(0, 1))}. · ${e(when)}</div>`}<div class="id">${e(req.params.id)} · Simulated trading. Funded Sky pays performance rewards from simulated accounts.</div></div></body></html>`);
});
app.get('/status', async (req, res) => {
  const e = (x) => String(x || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inc = (((await db.one("SELECT v FROM kv WHERE k='list.incidents'").catch(() => null)) || {}).v || []).filter((x) => x.pub !== false).slice(0, 10);
  const list = (await require('./integrations').list()).filter((x) => x.enabled);
  const open = inc.filter((x) => x.st !== 'resolved');
  const rows = [['Website and Checkout', 'ok'], ['Trader Dashboard', 'ok']].concat(list.filter((x) => ['tailoredpay', 'stripe', 'confirmo', 'rise', 'sumsub', 'resend'].includes(x.id)).map((x) => [x.name, x.status === 'live' ? 'ok' : 'w']));
  res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Funded Sky Status</title><meta http-equiv="refresh" content="60"><style>body{margin:0;background:#08080A;color:#D4CFCD;font-family:"Mona Sans",system-ui;line-height:1.5}main{max-width:720px;margin:0 auto;padding:56px 24px}h1{color:#F4F2F1;font-size:28px;margin:0 0 18px}.bar{padding:14px 18px;border-radius:12px;background:${open.length ? '#2A2113' : '#10241A'};color:${open.length ? '#F2C46D' : '#5FD39A'};font-weight:600;margin-bottom:22px}.r{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #26262A}.ok{color:#5FD39A}.w{color:#F2C46D}h2{color:#F4F2F1;font-size:17px;margin:30px 0 8px}.i{padding:12px 0;border-bottom:1px solid #26262A}.n{color:#9C9693;font-size:13px}a{color:#7CC4FF}</style></head><body><main><p><a href="/">← Funded Sky</a></p><h1>System Status</h1><div class="bar">${open.length ? e(open[0].t) : 'Everything is working'}</div>${rows.map(([n, st]) => `<div class="r"><span>${e(n)}</span><span class="${st}">${st === 'ok' ? 'Normal' : 'Slower than usual'}</span></div>`).join('')}<h2>Recent Incidents</h2>${inc.map((x) => `<div class="i"><b>${e(x.t)}</b> <span class="n">· ${x.st === 'resolved' ? 'Resolved' : 'Ongoing'} · ${e(new Date(x.at).toUTCString().slice(0, 22))} UTC</span>${(x.upd || []).slice(-1).map((u) => `<div class="n">${e(typeof u === 'string' ? u : u.text)}</div>`).join('')}</div>`).join('') || '<p class="n">No incidents reported.</p>'}</main></body></html>`);
});
app.get('/terms', editable('terms', 'terms.html'));
app.get('/privacy', editable('privacy', 'privacy.html'));
app.get('/refund-policy', editable('refund-policy', 'refund-policy.html'));
// Rules page: staff-written text if published in Content, otherwise the live rules for every plan and size from the catalog
app.get('/rules', async (req, res, next) => {
  const pg = ((await db.one("SELECT v FROM kv WHERE k='content.pages'").catch(() => null)) || {}).v || {}; if (pg.rules && pg.rules.status === 'Published' && pg.rules.txt) return editable('rules', 'terms.html')(req, res, next);
  try { const c = await core.catalog(); const RR = require('./rules'); const e = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); const m = (v) => '$' + Number(v || 0).toLocaleString('en-US');
    const RT = require('./ruletable');
    const tables = c.plans.filter((p) => p.active).map((p) => { const t = RT.planTable(c, p.id); if (!t || !t.sizes.length) return '';
      return `<h2>${e(p.name || p.short)}</h2><p>${e(p.desc || '')}</p><div class="tw"><table><thead><tr><th></th>${t.sizes.map((z) => `<th>$${z / 1000}K</th>`).join('')}</tr></thead><tbody>${t.rows.map((r) => (r.length === 1 ? `<tr class="g"><th colspan="${t.sizes.length + 1}">${e(r[0])}</th></tr>` : `<tr><th>${e(r[0])}</th>${r.slice(1).map((v) => `<td>${e(v)}</td>`).join('')}</tr>`)).join('')}</tbody></table></div>`; }).join('');
    res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Funded Sky: Trading Rules</title><style>body{margin:0;background:#08080A;color:#D4CFCD;font-family:"Mona Sans",system-ui,sans-serif;line-height:1.6}main{max-width:900px;margin:0 auto;padding:56px 24px}h1{color:#F4F2F1;font-size:32px;margin:0 0 8px}h2{color:#F4F2F1;font-size:21px;margin:36px 0 4px}a{color:#7CC4FF}.lg{font-weight:700;color:#F4F2F1;text-decoration:none;font-size:20px}.lg i{font-style:normal;background:#7CC4FF;color:#08080A;border-radius:4px;padding:1px 6px;margin-left:6px;font-size:14px}.tw{overflow-x:auto;border:1px solid #26262A;border-radius:10px;margin-top:12px}table{border-collapse:collapse;width:100%;font-size:14px;min-width:560px}th,td{padding:10px 14px;border-bottom:1px solid #1C1C20;text-align:right;white-space:nowrap}tbody th{text-align:left;color:#9C9693;font-weight:500}thead th{color:#F4F2F1}tr:last-child th,tr:last-child td{border-bottom:0}tr.g th{color:#F4F2F1;font-weight:600;padding-top:18px;text-align:left}td{white-space:normal;min-width:120px}</style></head><body><main><a class="lg" href="/">fundedsky<i>futures</i></a><h1 style="margin-top:28px">Trading Rules</h1><p>The rules every new account starts with, straight from our live catalog. Your own accounts show their rules in the dashboard. Questions: <a href="mailto:support@fundedsky.com">support@fundedsky.com</a></p>${tables}<p style="margin-top:32px"><a href="/checkout">Choose an account</a> · <a href="/terms">Terms of Service</a></p></main></body></html>`); } catch (err) { next(err); }
});
app.get('/faq', editable('faq', 'terms.html'));
app.get('/logout', async (req, res) => { await auth.logout(req, res); const n = String(req.query.next || '/login'); res.redirect(n.startsWith('/') && !n.startsWith('//') ? n : '/login'); });
app.get('/forgot-password', (req, res) => themed('forgot.html')(req, res));
app.get('/reset-password', (req, res) => themed('reset-password.html')(req, res));
app.get('/verify-email', (req, res) => themed('verify.html')(req, res));
app.get('/reset', needPage(false), (req, res, next) => themed('reset.html')(req, res, next));
app.get('/app/packs', async (req, res, next) => { if (!(await require('./packs').enabled())) return res.redirect('/app'); next(); });
app.get(['/app', '/app/*'], needPage(false), page('app.html'));
app.get(['/admin', '/admin/*'], needPage(true), (req, res) => { const b = ((req.params[0] || 'home').split('/')[0] || 'home').replace(/[^a-z]/g, ''); const f = path.join(DIST, 'admin', b + '.html'); if (fs.existsSync(f)) return res.sendFile(f); res.redirect('/admin/home'); });
app.use((req, res) => res.status(404).sendFile(path.join(DIST, '404.html'), (e) => e && res.status(404).send('Not found')));

const PORT = process.env.PORT || 3000;
migrate().then(async () => {
  // Accounts bought before rule snapshots existed keep the rules in force today from now on
  try { const cat = await core.catalog(true); const RR = require('./rules'); for (const a of await db.all('SELECT id, plan, size FROM accounts WHERE rs IS NULL')) await db.q('UPDATE accounts SET rs=$2 WHERE id=$1', [a.id, RR.snapshot(cat, a.plan, a.size)]); } catch (e) { console.error('rules backfill', e.message); }
  try { if (await require('./planmigr').run()) console.log('Catalog updated: full rule sets'); } catch (e) { console.error('plan update', e.message); }
  app.listen(PORT, () => console.log('Funded Sky listening on ' + PORT + (pay.enabled() ? ' (Stripe on)' : ' (test payments)')));
  sim.start(); require('./riskscan').start(); require('./automations').start();
}).catch((e) => { console.error('Startup failed', e); process.exit(1); });
module.exports = app;
