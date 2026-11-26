// Back office API. All routes require a staff role (admin, support, risk, finance).
const express = require('express');
const db = require('./db');
const core = require('./core');
const R = require('./rules');
const sim = require('./sim');
const pay = require('./payments');
const content = require('./content');
const I = require('./integrations');
const { bad, clean, shortDate, ago, round2, tradeDate } = require('./util');

const can = (u, ...roles) => u.role === 'admin' || roles.includes(u.role);
const need = (u, ...roles) => { if (!can(u, ...roles)) bad('Your role cannot do this', 403); };

// Reinstate a breached account at its balance from the start of the breach day
const reinstate = (id) => db.q(`UPDATE accounts SET phase='active', breach_reason=NULL,
  balance = balance - CASE WHEN today_date = (breached_at AT TIME ZONE 'America/New_York')::date THEN LEAST(today_pnl, 0) ELSE 0 END,
  floor = LEAST(floor, balance - CASE WHEN today_date = (breached_at AT TIME ZONE 'America/New_York')::date THEN LEAST(today_pnl, 0) ELSE 0 END - 1),
  today_pnl = CASE WHEN today_date = (breached_at AT TIME ZONE 'America/New_York')::date THEN 0 ELSE today_pnl END, halted_today=false, breached_at=NULL WHERE id=$1`, [id]);

// Which staff roles may save each back-office setting (admins can save all of them)
const STORE_ROLES = [
  [/^catalog\.draft$/, ['risk']], [/^support\.(agents|reviews)$/, []], [/^support\./, ['support']], [/^finance\.refunds$/, ['finance', 'support']], [/^finance\./, ['finance']],
  [/^affiliate\.payments$/, ['finance']], [/^(risk|fraud|compliance)\./, ['risk']], [/^disputes\./, ['finance', 'support']], [/^users\./, ['support', 'risk']],
  [/^(emails|rewards|competitions)\./, ['support']], [/^analytics\./, ['support', 'risk', 'finance']], [/^health\./, ['support', 'risk', 'finance']]
];
const storeRoles = (k) => { const m = STORE_ROLES.find(([re]) => re.test(k)); return m ? m[1] : []; };
const LIST_ROLES = { announcements: ['support'], macros: ['support'], blocklist: ['risk', 'support'], countries: ['risk'], incidents: ['support', 'risk', 'finance'], affiliates: [], docs: ['support'], complaints: ['support', 'risk'] };
// Spreadsheet apps run cells that start with = + - @ as formulas
const cellSafe = (v) => (/^[=+\-@\t\r]/.test(v) ? "'" + v : v);

// ---- Two-person approvals (Team > Approval Rules). The first person's request waits; a different person completes it
// from Team > Approvals or by doing the same action. Each rule can be switched off in Team.
const APK = 'approvals.pending';
const soloStaff = async () => (await db.one("SELECT count(*)::int n FROM users WHERE role<>'trader' AND status='active'")).n < 2;
async function ruleOn(kind) { if (await soloStaff()) return false; const r = ((await db.one("SELECT v FROM kv WHERE k='store.team.rules'")) || {}).v || {}; if (r[kind] === false) return false;
  if (kind === 'close' || kind === 'reinstate') { const rs = ((await db.one("SELECT v FROM kv WHERE k='store.risk.settings'")) || {}).v || {}; if ((kind === 'close' ? rs.twoClose : rs.twoReinstate) === false) return false; if (r.close === false) return false; }
  return true; }
async function pendingAll() { return ((await db.one('SELECT v FROM kv WHERE k=$1', [APK])) || {}).v || {}; }
async function pendingSave(v) { await db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', [APK, JSON.stringify(v)]); }
// Returns null when the action should go ahead now; otherwise the waiting request
async function secondPerson(req, kind, target, payload, desc) {
  if (!(await ruleOn(kind))) return null; const key = kind + ':' + target; const all = await pendingAll(); const p = all[key];
  if (p && p.approvedBy) return null;
  if (!p) { all[key] = { key, kind, target, payload, desc, by: req.user.id, byName: `${req.user.first} ${req.user.last || ''}`.trim(), at: new Date().toISOString() }; await pendingSave(all); await core.audit(req.user.id, 'approval.request', key, { desc }); return { second: true, msg: 'Sent for a second approval. Another person can approve it in Team > Approvals.' }; }
  if (p.by === req.user.id) bad('A different person must approve this');
  delete all[key]; await pendingSave(all); await core.audit(req.user.id, 'approval.approve', key, { desc: p.desc, first: p.byName }); req.approvedFrom = p; return null;
}

function router(h) {
  const r = express.Router();
  // Run one of this router's own routes for a stored approval, as the approving staff member
  const fetchSelf = (path, base) => new Promise((resolve, reject) => {
    const req2 = { method: 'POST', url: path, originalUrl: '/api/admin' + path, path, headers: {}, body: base.body, user: base.user, query: {}, params: {}, get: () => '', ip: '' };
    const res2 = { statusCode: 200, headersSent: false, status(c) { this.statusCode = c; return this; }, json(o) { this.headersSent = true; if (this.statusCode >= 400) reject(Object.assign(new Error((o && o.error) || 'Failed'), { status: this.statusCode })); else resolve(o); }, setHeader() {}, end() { resolve({ ok: true }); }, send() { resolve({ ok: true }); } };
    r.handle(req2, res2, (e) => reject(e || new Error('Not found')));
  }).catch((e) => { const { HttpError } = require('./util'); if (HttpError && e.status && e.status < 500) throw new HttpError(e.status, e.message); throw e; });

  // Everything the back office boards read, in one call. Cheap enough at early-stage volumes.
  r.get('/boot', h(async (req) => {
    const cat = await core.catalog();
    await require('./comps').sync().catch((e) => console.error('comps sync', e.message));
    const [users, accounts, orders, payouts, tickets, msgs, outbox, auditRows, methods, daily, notes] = await Promise.all([
      db.all('SELECT id,tid,email,first,last,country,phone,role,verified,status,kyc_status,kyc,tax_status,rise_status,points,ref_code,referred_by,settings,agreements,created_at,last_login FROM users ORDER BY created_at DESC LIMIT 2000'),
      db.all('SELECT a.*, u.email, u.first, u.last, u.tid FROM accounts a JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 5000'),
      db.all('SELECT o.*, u.email, u.first, u.last, u.tid FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 3000'),
      db.all('SELECT p.*, u.email, u.first, u.last, u.tid, u.kyc_status, u.tax_status, u.rise_status, u.country FROM payouts p JOIN users u ON u.id=p.user_id ORDER BY p.requested_at DESC LIMIT 2000'),
      db.all('SELECT t.*, u.email, u.first, u.last, u.tid FROM tickets t JOIN users u ON u.id=t.user_id ORDER BY t.updated_at DESC LIMIT 1000'),
      db.all('SELECT m.*, u.first AS afirst FROM ticket_msgs m LEFT JOIN users u ON u.id=m.author_id WHERE m.ticket_id IN (SELECT id FROM tickets ORDER BY updated_at DESC LIMIT 1000) ORDER BY m.created_at'),
      db.all('SELECT id,to_email,subject,template,status,created_at FROM outbox ORDER BY created_at DESC LIMIT 300'),
      db.all('SELECT a.*, u.first, u.last, u.email FROM audit a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 300'),
      db.all('SELECT * FROM payout_methods ORDER BY created_at DESC LIMIT 2000'),
      db.all("SELECT day, sum(pnl)::float pnl, sum(n_trades)::int n, count(*)::int accts FROM days WHERE day > (now() - interval '90 days')::date GROUP BY day ORDER BY day"),
      db.all("SELECT k, v FROM kv WHERE k LIKE 'content.%'")
    ]);
    const acctOut = accounts.map((a) => {
      const q = a.kind === 'funded' ? R.payoutQuote(cat, a) : null; const rr = R.rulesFor(cat, a);
      return { id: a.id, comp: a.comp || null, user: a.user_id, tid: a.tid, name: `${a.first} ${a.last}`, email: a.email, plan: a.plan, size: a.size, platform: a.platform, kind: a.kind, phase: a.phase, start: Number(a.start_bal), bal: Number(a.balance), floor: Number(a.floor), peak: Number(a.peak_eod), today: a.today_date === tradeDate() ? Number(a.today_pnl) : 0, halted: a.halted_today, days: a.days_traded, best: Number(a.best_day), payouts: a.payout_count, paid: Number(a.paid_total), resets: a.reset_count, freeResets: a.free_resets, addons: a.addons, breach: a.breach_reason, created: a.created_at, passed: a.passed_at, funded: a.funded_at, breached: a.breached_at, closed: a.closed_at, parent: a.parent_id, maxLoss: rr.maxLoss, dll: rr.dll, target: rr.target || rr.goal || 0, avail: q ? q.max : 0, ready: q ? q.ok : false, winDays: a.cycle_win_days, sim: a.sim, steps: a.steps || {}, demo: /@demo\.fundedsky\.test$/.test(a.email) };
    });
    const kvs = await db.all("SELECT k, v FROM kv WHERE k LIKE 'settings.%' OR k LIKE 'dispute.%' OR k LIKE 'list.%' OR k LIKE 'store.%' OR k LIKE 'refclicks.%'");
    const settings = {}; const disputes = [];
    const lists = {}; const storeV = {}; const clicks = {}; kvs.forEach((r) => { if (r.k.startsWith('settings.')) settings[r.k.slice(9)] = r.v; else if (r.k.startsWith('list.')) lists[r.k.slice(5)] = r.v; else if (r.k.startsWith('store.')) storeV[r.k.slice(6)] = r.k === 'store.apikeys' ? (r.v || []).map((x) => ({ ...x, hash: undefined })) : r.v; else if (r.k.startsWith('refclicks.')) clicks[r.k.slice(10)] = r.v; else disputes.push(r.v); });
    const integrations = (await I.list()).map((x) => ({ id: x.id, name: x.name, cat: x.cat, enabled: x.enabled, status: x.status, lastError: x.lastError, lastCheck: x.lastCheck }));
    const hooks = await db.all('SELECT provider, event, ok, created_at FROM webhook_log ORDER BY id DESC LIMIT 200');
    const live = await db.one(`SELECT
      (SELECT count(DISTINCT s.user_id) FROM sessions s JOIN users u ON u.id=s.user_id WHERE u.role='trader' AND s.seen_at > now() - interval '5 minutes')::int online,
      (SELECT count(*) FROM orders WHERE status='pending' AND created_at > now() - interval '30 minutes')::int checkout,
      (SELECT count(*) FROM trades WHERE ts > now() - interval '24 hours')::int trades24,
      (SELECT count(*) FROM trades WHERE ts > now() - interval '60 minutes')::int trades60`);
    const pulseRows = await db.all(`SELECT floor(extract(epoch FROM now() - t)/60)::int m, count(*)::int n FROM (
      SELECT ts t FROM trades WHERE ts > now() - interval '60 minutes' UNION ALL SELECT created_at FROM orders WHERE created_at > now() - interval '60 minutes'
      UNION ALL SELECT created_at FROM users WHERE created_at > now() - interval '60 minutes' UNION ALL SELECT created_at FROM audit WHERE created_at > now() - interval '60 minutes') x GROUP BY 1`);
    const T0 = "(date_trunc('day', now() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York')";
    live.geo = await db.all(`SELECT c country, sum(o)::int orders, sum(su)::int signups, sum(po)::int payouts, sum(li)::int logins, sum(tr)::int trades FROM (
      SELECT u.country c, 1 o, 0 su, 0 po, 0 li, 0 tr FROM orders x JOIN users u ON u.id=x.user_id WHERE x.status='paid' AND x.paid_at >= ${T0}
      UNION ALL SELECT country, 0, 1, 0, 0, 0 FROM users WHERE role='trader' AND created_at >= ${T0}
      UNION ALL SELECT u.country, 0, 0, 1, 0, 0 FROM payouts x JOIN users u ON u.id=x.user_id WHERE x.requested_at >= ${T0}
      UNION ALL SELECT u.country, 0, 0, 0, 1, 0 FROM (SELECT DISTINCT user_id FROM sessions WHERE seen_at >= ${T0}) s JOIN users u ON u.id=s.user_id WHERE u.role='trader'
      UNION ALL SELECT u.country, 0, 0, 0, 0, count(*) FROM trades t JOIN accounts a ON a.id=t.account_id JOIN users u ON u.id=a.user_id WHERE t.ts >= ${T0} GROUP BY u.country
    ) z WHERE c IS NOT NULL AND c <> '' GROUP BY c ORDER BY 1`);
    live.pulse = Array.from({ length: 60 }, (_, i) => { const r = pulseRows.find((x) => x.m === 59 - i); return r ? r.n : 0; });
    return {
      settings, disputes, lists, store: storeV, clicks, integrations, hooks, live, approvals: Object.values(((await db.one("SELECT v FROM kv WHERE k='approvals.pending'")) || { v: {} }).v), payFirst: ((await db.one("SELECT v FROM kv WHERE k='payout.firstok'")) || { v: {} }).v, staffMfa: await db.all("SELECT id, mfa_on FROM users WHERE role<>'trader'"), staffSessions: await db.all("SELECT s.user_id, s.ua, s.ip, s.created_at, s.seen_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE u.role<>'trader' ORDER BY s.seen_at DESC LIMIT 100"), taxOn: await I.on('track1099'), contentDefault: require('./content-seed.json'),
      me: { id: req.user.id, first: req.user.first, last: req.user.last, email: req.user.email, role: req.user.role },
      now: new Date().toISOString(), today: tradeDate(), payments: pay.mode(), catalog: cat,
      users: users.map((u) => ({ ...u, demo: /@demo\.fundedsky\.test$/.test(u.email), kyc: u.kyc && u.kyc.name ? { name: u.kyc.name, dob: u.kyc.dob, country: u.kyc.country, idType: u.kyc.idType, idLast4: u.kyc.idLast4, at: u.kyc.at } : null })),
      accounts: acctOut,
      orders: orders.map((o) => ({ id: o.id, code: o.code, user: o.user_id, tid: o.tid, name: `${o.first} ${o.last}`, email: o.email, kind: o.kind, lines: o.lines, items: o.items, subtotal: Number(o.subtotal), discount: Number(o.discount), total: Number(o.total), promo: o.promo, status: o.status, method: o.pay_method, provider: o.provider, created: o.created_at, paid: o.paid_at, refunded: o.refunded_at, accounts: (o.meta && o.meta.accounts) || [], account: o.meta && o.meta.account })),
      payouts: payouts.map((p) => ({ code: p.code, account: p.account_id, user: p.user_id, tid: p.tid, name: `${p.first} ${p.last}`, email: p.email, country: p.country, kyc: p.kyc_status, tax: p.tax_status, rise: p.rise_status, tx: p.tx_hash, ref: p.provider_ref, number: p.number, gross: Number(p.gross), split: p.split, amount: Number(p.amount), method: p.method, rail: p.rail, status: p.status, batch: p.batch, note: p.note, reviewer: p.reviewed_by, requested: p.requested_at, approved: p.approved_at, paid: p.paid_at, denied: p.denied_at })),
      tickets: tickets.map((t) => ({ id: t.id, user: t.user_id, tid: t.tid, name: `${t.first} ${t.last}`, email: t.email, subject: t.subject, category: t.category, channel: t.channel, status: t.status, priority: t.priority, created: t.created_at, updated: t.updated_at, assignee: t.assignee, review: t.review, rating: t.rating, rated: t.rated_at, msgs: msgs.filter((m) => m.ticket_id === t.id).map((m) => ({ staff: m.staff, internal: m.internal, by: m.afirst, body: m.body, at: m.created_at })) })),
      outbox, audit: auditRows.map((a) => ({ at: a.created_at, by: a.first ? `${a.first} ${a.last}` : 'System', action: a.action, target: a.target, meta: a.meta })),
      methods: methods.map((m) => ({ user: m.user_id, rail: m.rail, label: m.label, def: m.is_default, unlock: m.unlock_at, created: m.created_at })),
      daily, content: Object.fromEntries(notes.map((n) => [n.k.slice(8), n.v]))
    };
  }));

  r.post('/users/:id', h(async (req) => {
    const u = await db.one('SELECT * FROM users WHERE id=$1', [+req.params.id]); if (!u) bad('User not found', 404);
    const b = req.body; const sets = []; const vals = [u.id];
    if (u.role !== 'trader' && (b.status !== undefined || b.kyc_status !== undefined || b.points !== undefined)) { need(req.user); if (u.id === req.user.id && b.status !== undefined) bad('You cannot change your own status'); }
    if (b.role !== undefined) { need(req.user); if (!['trader', 'admin', 'support', 'risk', 'finance'].includes(b.role)) bad('Unknown role'); if (u.id === req.user.id) bad('You cannot change your own role'); vals.push(b.role); sets.push('role=$' + vals.length); }
    if (b.status === 'banned' && u.status !== 'banned') { need(req.user, 'support', 'risk'); const w = await secondPerson(req, 'ban', String(u.id), { status: 'banned' }, `Ban ${u.first} ${u.last} (${u.tid})`); if (w) return w; }
    if (b.kyc_status === 'rejected' && u.kyc_status !== 'rejected') { need(req.user, 'risk', 'support'); const w = await secondPerson(req, 'kyc', String(u.id), { kyc_status: 'rejected', reason: clean(b.reason, 200) }, `Reject identity check for ${u.first} ${u.last} (${u.tid})`); if (w) return w; if (req.approvedFrom && !b.reason) b.reason = req.approvedFrom.payload.reason; }
    if (b.status !== undefined) { need(req.user, 'support', 'risk'); if (!['active', 'suspended', 'banned'].includes(b.status)) bad('Unknown status'); vals.push(b.status); sets.push('status=$' + vals.length); if (b.status === 'banned') await db.q('DELETE FROM sessions WHERE user_id=$1', [u.id]); }
    if (b.kyc_status !== undefined) { need(req.user, 'risk', 'support'); if (!['none', 'submitted', 'verified', 'rejected'].includes(b.kyc_status)) bad('Unknown status'); vals.push(b.kyc_status); sets.push('kyc_status=$' + vals.length); }
    if (b.points !== undefined) { need(req.user, 'support'); const d = parseInt(b.points, 10) || 0; await core.points(null, u.id, d, clean(b.reason, 80) || 'Adjusted by support'); }
    if (sets.length) await db.q(`UPDATE users SET ${sets.join(',')} WHERE id=$1`, vals);
    if (b.kyc_status === 'verified') require('./mail').t('kycok', u.id, { url: require('./auth').BASE() + '/app#settings?tab=identity' });
    if (b.kyc_status === 'rejected') require('./mail').t('kycno', u.id, { url: require('./auth').BASE() + '/app#support' });
    if (b.kyc_status === 'verified') await core.notify(null, u.id, 'Identity verified', 'You can now receive payouts.', 'settings?tab=identity');
    if (b.kyc_status === 'verified' && u.kyc_status !== 'verified') for (const pa of await db.all("SELECT * FROM accounts WHERE user_id=$1 AND phase='passed'", [u.id])) await core.agreementReady(db, pa);
    if (b.status === 'suspended' && u.status !== 'suspended') require('./mail').t('suspended', u.id, { account: 'Your Funded Sky account', url: require('./auth').BASE() + '/app#support' });
    if (b.kyc_status === 'rejected') await core.notify(null, u.id, 'We could not verify your identity', clean(b.reason, 200) || 'Check your details and submit again, or contact support.', 'settings?tab=identity');
    await core.audit(req.user.id, 'user.update', u.tid, b);
  }));

  r.post('/accounts/:id/:action', h(async (req) => {
    const id = clean(req.params.id, 40); const a = await db.one('SELECT * FROM accounts WHERE id=$1', [id]); if (!a) bad('Account not found', 404);
    const act = req.params.action;
    if (act === 'breach') { need(req.user, 'risk'); { const w = await secondPerson(req, 'close', id, { reason: clean(req.body.reason, 200) }, `Close ${id}`); if (w) return w; if (req.approvedFrom && req.approvedFrom.payload && req.approvedFrom.payload.reason && !req.body.reason) req.body.reason = req.approvedFrom.payload.reason; } await db.q("UPDATE accounts SET phase='breached', breached_at=now(), breach_reason=$2 WHERE id=$1", [id, clean(req.body.reason, 200) || 'Closed by risk review']); await core.notify(null, a.user_id, `${id} was closed`, clean(req.body.reason, 200) || 'Closed by risk review. Contact support with questions.', 'account?acct=' + id); }
    else if (act === 'reinstate') { need(req.user, 'risk'); { const w = await secondPerson(req, 'reinstate', id, {}, `Reinstate ${id}`); if (w) return w; } await reinstate(id); await core.notify(null, a.user_id, `${id} was reinstated`, 'Your account is active again.', 'account?acct=' + id); }
    else if (act === 'pause') { need(req.user, 'risk'); await db.q("UPDATE accounts SET sim = sim || '{\"paused\":true}' WHERE id=$1", [id]); }
    else if (act === 'resume') { need(req.user, 'risk'); await db.q("UPDATE accounts SET sim = sim - 'paused' WHERE id=$1", [id]); }
    else if (act === 'fastforward') { need(req.user); return sim.fastForward(id, parseInt(req.body.days, 10) || 5); }
    else if (act === 'reset') { need(req.user, 'support'); await db.tx((c) => core.resetAccount(c, id, a.user_id)); }
    else if (act === 'fund') { need(req.user, 'risk'); if (a.phase !== 'passed') bad('Account has not passed'); await db.tx((c) => core.activateFunded(c, id, a.user_id, null)); }
    else bad('Unknown action');
    await core.audit(req.user.id, 'account.' + act, id, req.body);
  }));

  r.post('/payouts/:code/rise', h(async (req) => { need(req.user, 'finance'); return require('./flows').riseSend(req.user.id, req.params.code); }));
  r.post('/payouts/:code/back', h(async (req) => { need(req.user, 'finance', 'risk'); const r0 = await db.one("SELECT v FROM kv WHERE k='payout.firstok'"); const v = (r0 && r0.v) || {}; delete v[clean(req.params.code, 30)]; await db.q("INSERT INTO kv(k,v) VALUES('payout.firstok',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(v)]); }));
  r.post('/payouts/:code/:action', h(async (req) => {
    need(req.user, 'finance', 'risk'); const code = clean(req.params.code, 30);
    const kvv = async (k) => ((await db.one('SELECT v FROM kv WHERE k=$1', [k])) || {}).v;
    if (['approve', 'pay'].includes(req.params.action)) { const pu = await db.one('SELECT user_id FROM payouts WHERE code=$1', [code]); if (pu && ((await kvv('store.compliance.holds')) || []).includes(pu.user_id)) bad('Payouts for this trader are held by Compliance'); }
    if (req.params.action === 'approve' && (await I.on('track1099')) && ((await kvv('store.compliance.settings')) || {}).holdNoForm !== false) { const u = await db.one('SELECT u.tax_status FROM payouts p JOIN users u ON u.id=p.user_id WHERE p.code=$1', [code]); if (u && u.tax_status !== 'on_file' && !req.body.skipTax) bad('No tax form on file for this trader yet'); }
    const po = await db.one('SELECT * FROM payouts WHERE code=$1', [code]); if (!po) bad('Payout not found', 404);
    if (req.params.action === 'pay') { need(req.user, 'finance'); const tx = clean(req.body.tx, 120);
      if (/usdc/i.test(po.rail) && !/^0x[a-fA-F0-9]{64}$/.test(tx)) bad('Paste the transaction hash from the wallet (0x and 64 characters)');
      if (/rise/i.test(po.rail) && tx.length < 4) bad('Add the Rise payment reference');
      await db.q('UPDATE payouts SET tx_hash=$2, provider_ref=COALESCE(provider_ref,$2) WHERE code=$1', [code, tx]); }
    if (req.params.action === 'approve' && po.status === 'requested') { const two = Number((((await kvv('store.risk.settings')) || {}).payoutTwo) || 5000);
      if (Number(po.amount) > two && (await ruleOn('payout'))) { const firsts = (await kvv('payout.firstok')) || {}; const f = firsts[code];
        if (!f) { firsts[code] = { id: req.user.id, name: req.user.first }; await db.q("INSERT INTO kv(k,v) VALUES('payout.firstok',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(firsts)]); await core.audit(req.user.id, 'payout.approve1', code, {}); return { second: true, by: req.user.first }; }
        if (f.id === req.user.id) bad('A different person must give the second approval');
        delete firsts[code]; await db.q("UPDATE kv SET v=$1 WHERE k='payout.firstok'", [JSON.stringify(firsts)]); } }
    return core.reviewPayout(req.user.id, code, req.params.action, clean(req.body.note, 300));
  }));
  // ---- Payout batches: approved payouts sent together. Over the limit, a second person must approve. ----
  const store = async (k) => { const r2 = await db.one('SELECT v FROM kv WHERE k=$1', ['store.' + k]); return r2 ? r2.v : null; };
  const putStore = (k, v) => db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', ['store.' + k, JSON.stringify(v)]);
  async function sendBatch(actorId, bt) {
    const rise = await I.on('rise'); const res = { sent: [], failed: [], held: [] };
    for (const code of bt.codes) {
      const p = await db.one('SELECT * FROM payouts WHERE code=$1', [code]); if (!p || p.status !== 'approved') continue;
      // Nothing is marked sent unless money actually moved: wallet payouts are sent by hand, and Rise needs its connection
      if (!/rise/i.test(p.rail)) { res.held.push({ code, why: 'Send by hand, then use Mark Sent with the transaction hash' }); continue; }
      if (!rise) { res.held.push({ code, why: 'Rise is not connected' }); continue; }
      try {
        await require('./flows').riseSend(actorId, code);
        await db.q('UPDATE payouts SET batch=$2 WHERE code=$1', [code, bt.id]); res.sent.push(code);
      } catch (e) { await core.reviewPayout(actorId, code, 'fail', String(e.message || e).slice(0, 200)).catch(() => {}); res.failed.push(code); }
    }
    return res;
  }
  r.post('/batches', h(async (req) => { need(req.user, 'finance'); const codes = (req.body.codes || []).map((c2) => clean(c2, 30));
    const ps = await db.all("SELECT p.code, p.amount, u.tax_status FROM payouts p JOIN users u ON u.id=p.user_id WHERE p.code = ANY($1) AND p.status='approved'", [codes]); if (!ps.length) bad('Pick payouts that are ready to send');
    const taxOn = await I.on('track1099'); const ok = ps.filter((p) => !taxOn || p.tax_status === 'on_file');
    if (!ok.length) bad('Every selected payout is missing a tax form');
    const fs2 = (await store('finance.settings')) || {}; const limit = Number(fs2.twoAbove || 5000); const amount = ok.reduce((s2, p) => s2 + Number(p.amount), 0);
    const list = (await store('batches')) || []; const id = 'PB-' + String(100 + list.length + 1);
    const bt = { id, codes: ok.map((p) => p.code), n: ok.length, amount, by: req.user.id, byName: req.user.first + ' ' + req.user.last, at: new Date().toISOString(), status: amount > limit && (await ruleOn('batch')) ? 'waiting' : 'sending', held: ps.length - ok.length };
    if (bt.status === 'sending') { const r3 = await sendBatch(req.user.id, bt); bt.status = !r3.sent.length && !r3.failed.length ? 'manual' : r3.failed.length || r3.held.length ? 'partial' : 'sent'; bt.sentAt = new Date().toISOString(); bt.fail = r3.failed.length; bt.sentN = r3.sent.length; bt.manual = r3.held; }
    list.unshift(bt); await putStore('batches', list); await core.audit(req.user.id, 'payout.batch', id, { amount, n: bt.n }); return bt; }));
  r.post('/batches/:id/approve', h(async (req) => { need(req.user, 'finance'); const list = (await store('batches')) || []; const bt = list.find((x) => x.id === req.params.id); if (!bt) bad('Batch not found', 404); if (bt.status !== 'waiting') bad('This batch is not waiting for approval');
    if (bt.by === req.user.id && !(await soloStaff())) bad('A second person must approve this batch'); bt.approver = req.user.first + ' ' + req.user.last;
    const r3 = await sendBatch(req.user.id, bt); bt.status = !r3.sent.length && !r3.failed.length ? 'manual' : r3.failed.length || r3.held.length ? 'partial' : 'sent'; bt.sentAt = new Date().toISOString(); bt.fail = r3.failed.length; bt.sentN = r3.sent.length; bt.manual = r3.held; await putStore('batches', list); await core.audit(req.user.id, 'payout.batch.approve', bt.id, {}); return bt; }));
  r.post('/apikeys', h(async (req) => { need(req.user); const raw = 'fsk_' + require('crypto').randomBytes(24).toString('hex'); const row = await db.one("SELECT v FROM kv WHERE k='store.apikeys'"); const keys = (row && row.v) || [];
    keys.push({ name: clean(req.body.name, 60) || 'API key', hash: require('crypto').createHash('sha256').update(raw).digest('hex'), tail: raw.slice(-4), access: 'Read exports', by: req.user.first + ' ' + req.user.last, at: new Date().toISOString(), last: null }); await putStore('apikeys', keys); await core.audit(req.user.id, 'apikey.create', clean(req.body.name, 60), {}); return { key: raw }; }));
  r.post('/apikeys/:i/revoke', h(async (req) => { need(req.user); const row = await db.one("SELECT v FROM kv WHERE k='store.apikeys'"); const keys = (row && row.v) || []; const k = keys[+req.params.i]; if (!k) bad('Key not found', 404); k.revoked = new Date().toISOString(); await putStore('apikeys', keys); await core.audit(req.user.id, 'apikey.revoke', k.name, {}); }));
  r.post('/webhooks/test', h(async (req) => { need(req.user); await I.outHooks(clean(req.body.kind, 30) || 'order', 'Test event from the Funded Sky back office', { test: true }); }));
  r.post('/risk/scan', h(async (req) => { need(req.user, 'risk'); return require('./riskscan').scan(); }));
  r.get('/risk/trades', h(async (req) => { const since = req.query.days ? +req.query.days : 1; return db.all(`SELECT t.account_id, t.ts, t.instrument, t.side, t.qty, t.pnl::float pnl, t.hold_min, a.user_id FROM trades t JOIN accounts a ON a.id=t.account_id WHERE t.ts > now() - ($1 || ' days')::interval ORDER BY t.ts DESC LIMIT 3000`, [String(Math.min(30, since))]); }));
  r.post('/tickets', h(async (req) => { need(req.user, 'support', 'risk', 'finance'); const b = req.body; const u = await db.one('SELECT id, email, first FROM users WHERE id=$1', [+b.user]); if (!u) bad('Pick a trader');
    const subj = clean(b.subject, 200); if (!subj) bad('Add a subject'); const t = await db.one("INSERT INTO tickets(user_id,subject,category,channel,status,priority,assignee) VALUES($1,$2,$3,'Email',$4,$5,$6) RETURNING id", [u.id, subj, clean(b.category, 60) || 'General', b.body ? 'pending' : 'open', ['low', 'normal', 'high', 'urgent'].includes(b.priority) ? b.priority : 'normal', req.user.id]);
    if (b.body) { await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,body) VALUES($1,$2,true,$3)', [t.id, req.user.id, clean(b.body, 5000)]); await core.notify(null, u.id, 'Support: ' + subj, clean(b.body, 140), 'support?tkt=' + t.id); await require('./mail').send(u.email, `${subj} [#${t.id}]`, `Hi ${u.first},\n\n${clean(b.body, 5000)}\n\nReply from your dashboard: ${require('./auth').BASE()}/app#support?tkt=${t.id}`, 'ticket'); }
    await core.audit(req.user.id, 'ticket.create', String(t.id), {}); return { id: t.id }; }));
  // ---- Store: board settings and lists kept for each board ----
  r.put('/store/:key', h(async (req) => { const k = clean(req.params.key, 60); if (!/^[a-z0-9_.-]+$/i.test(k)) bad('Bad key'); need(req.user, ...storeRoles(k)); if (k === 'team.security' && req.body.value && req.body.value.ipOnly) { const nets = ((await db.one("SELECT v FROM kv WHERE k='store.team.networks'")) || {}).v || []; if (!nets.length) bad('Add at least one network first'); if (!nets.some((x) => require('./auth').ipIn(req.ip, x))) bad('Your current network is not on the list. Add it first so you are not locked out.'); } const before = k === 'affiliate.payments' ? ((await db.one('SELECT v FROM kv WHERE k=$1', ['store.' + k])) || {}).v || [] : null; await putStore(k, req.body.value);
    if (before) { const seen = new Set(before.map((x) => JSON.stringify(x))); for (const x of (req.body.value || []).filter((y) => !seen.has(JSON.stringify(y)))) if (x && x.user && Number(x.amount) > 0) require('./mail').t('affpaid', +x.user, { amount: '$' + Number(x.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), method: x.method || 'Bank or wallet transfer', url: require('./auth').BASE() + '/app#affiliates' }); } await core.audit(req.user.id, 'store.' + k, k, {}); }));
  // ---- Packs and credits ----
  const PK = require('./packs');
  r.get('/packs', h(async (req) => { need(req.user, 'support', 'finance', 'risk'); return PK.adminData(); }));
  r.put('/packs/config', h(async (req) => { need(req.user); return { cfg: await PK.saveConfig(req.body || {}, req.user.id) }; }));
  r.put('/packs/enabled', h(async (req) => { need(req.user); await PK.setEnabled(!!(req.body || {}).on, req.user.id); return { on: await PK.enabled() }; }));
  r.get('/packs/traders', h(async (req) => { need(req.user, 'support', 'finance', 'risk'); return { list: await PK.findTrader(req.query.q) }; }));
  r.get('/packs/traders/:id', h(async (req) => { need(req.user, 'support', 'finance', 'risk'); return PK.traderAdmin(req.params.id); }));
  r.post('/packs/traders/:id/grant', h(async (req) => { need(req.user, 'support'); return PK.grant(req.user, req.params.id, req.body || {}); }));
  r.post('/packs/cards/:id/revoke', h(async (req) => { need(req.user, 'support'); return PK.revokeCard(req.user, req.params.id, (req.body || {}).reason); }));
  // Integrations (admin only)
  r.get('/integrations', h(async (req) => { need(req.user); const hooks = await db.all('SELECT * FROM webhook_log ORDER BY id DESC LIMIT 100'); const alerts = await db.one("SELECT v FROM kv WHERE k='settings.alerts'"); return { list: await I.list(), hooks, alerts: alerts ? alerts.v : {}, base: require('./auth').BASE() }; }));
  r.put('/integrations/:id', h(async (req) => { need(req.user); await I.save(req.params.id, req.body, req.user.id); await require('./payments').refreshMode(); await core.audit(req.user.id, 'integration.update', req.params.id, { enabled: req.body.enabled }); return { list: await I.list() }; }));
  r.post('/integrations/:id/test', h(async (req) => { need(req.user); try { const msg = await I.test(req.params.id); return { ok: true, msg }; } catch (e) { bad(e.message || 'Connection failed', 400); } }));
  r.put('/settings/:key', h(async (req, res, next) => {
    const key = req.params.key; if (!['company', 'flags', 'maint', 'alerts', 'affiliate'].includes(key)) bad('Unknown setting');
    need(req.user); await db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', ['settings.' + key, JSON.stringify(req.body || {})]);
    await core.audit(req.user.id, 'settings.' + key, key, {});
  }));
  r.put('/settings-alerts-legacy', h(async (req) => { need(req.user); await db.q("INSERT INTO kv(k,v) VALUES('settings.alerts',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(req.body || {})]); }));
  r.post('/users/:id/tax', h(async (req) => { need(req.user, 'finance', 'support', 'risk'); const st = ['none', 'requested', 'on_file'].includes(req.body.status) ? req.body.status : 'requested'; await db.q('UPDATE users SET tax_status=$2 WHERE id=$1', [+req.params.id, st]); await core.audit(req.user.id, 'user.tax', String(req.params.id), { st });
    if (st === 'requested') { const on = await I.on('track1099'); await core.notify(null, +req.params.id, 'Please send your tax form', 'We need a tax form on file before we can send payouts. Open Settings to fill it in.', 'settings?tab=tax'); if (on) require('./mail').t('taxform', +req.params.id, { url: require('./auth').BASE() + '/app#settings?tab=tax' }); return { sent: on }; } }));
  r.post('/orders/:code/refund', h(async (req) => { need(req.user, 'finance', 'support');
    if (['support', 'risk'].includes(req.user.role)) { const o = await db.one('SELECT total FROM orders WHERE code=$1', [clean(req.params.code, 30)]); const lim = await require('./support').refundLimit(req.user); if (o && Number(o.total) > lim) bad(`This refund is over your limit of $${lim}. Send it for approval instead.`, 403); }
    return pay.refund(req.user.id, req.params.code, clean(req.body.note, 300)); }));
  r.get('/tickets/sig', h(async () => { const r = await db.one('SELECT (SELECT count(*)::int FROM tickets) n, (SELECT COALESCE(max(id),0) FROM ticket_msgs) m, (SELECT max(updated_at) FROM tickets) u'); return { sig: `${r.n}.${r.m}.${r.u ? new Date(r.u).getTime() : 0}` }; }));
  r.post('/tickets/:id/reply', h(async (req) => {
    need(req.user, 'support', 'risk', 'finance');
    const t = await db.one('SELECT * FROM tickets WHERE id=$1', [+req.params.id]); if (!t) bad('Ticket not found', 404);
    const body = clean(req.body.body, 5000); if (!body) bad('Write a reply first');
    await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,body) VALUES($1,$2,true,$3)', [t.id, req.user.id, body]);
    await db.q('UPDATE tickets SET status=$2, updated_at=now(), assignee=COALESCE(assignee,$3) WHERE id=$1', [t.id, req.body.solve ? 'solved' : 'pending', req.user.id]);
    await core.notify(null, t.user_id, 'Support replied: ' + t.subject, body.slice(0, 140), 'support?tkt=' + t.id);
    const u = await db.one('SELECT email, first FROM users WHERE id=$1', [t.user_id]);
    await require('./mail').sendT('reply', u.email, { first_name: u.first, ticket: t.id, subject: t.subject, agent: req.user.first, snippet: body.slice(0, 90), message: body, url: `${require('./auth').BASE()}/app#support?tkt=${t.id}` }, { uid: t.user_id });
    if (req.body.solve && t.status !== 'solved') await require('./support').onSolved(t);
  }));
  r.post('/tickets/:id/status', h(async (req) => { const st = ['open', 'pending', 'solved', 'hold'].includes(req.body.status) ? req.body.status : 'open'; const t = await db.one('SELECT * FROM tickets WHERE id=$1', [+req.params.id]); if (!t) bad('Ticket not found', 404); await db.q('UPDATE tickets SET status=$2, updated_at=now() WHERE id=$1', [t.id, st]); if (st === 'solved' && t.status !== 'solved') await require('./support').onSolved(t); await core.audit(req.user.id, 'ticket.status', String(t.id), { status: st }); }));

  r.put('/catalog', h(async (req) => {
    need(req.user);
    const c = req.body; if (!c || !Array.isArray(c.plans) || !c.evalRules) bad('Catalog is missing plans or rules');
    for (const p of c.plans) for (const s of p.sizes) if (!(s.price > 0)) bad(`Every size needs a price (${p.name})`);
    // Every size on sale needs its trading rules and payout limits, or accounts of that size can't be priced or paid
    const kK = (n) => '$' + Math.round(n / 1000) + 'K';
    for (const p of c.plans) for (const s of p.sizes) { const inst = p.id === 'instant' || p.kind === 'funded';
      const R = (inst ? c.instantRules : c.evalRules) || {}, CAP = (inst ? c.instantCaps : c.fundedCaps) || {};
      if (!R[s.size]) bad(`${p.short || p.name} ${kK(s.size)} has no rule set. Create one in Rule Sets first.`);
      if (!CAP[s.size] || !(CAP[s.size].first > 0)) bad(`${p.short || p.name} ${kK(s.size)} has no payout limits. Add them in Rule Sets first.`); }
    for (const pr of c.promos || []) if (pr.pct > (c.maxPromoPct || 30)) bad(`Promos are capped at ${c.maxPromoPct || 30}% off`);
    // Price and rule changes need a different person's approval (Team > Approval Rules), unless there is only one staff member
    if (await ruleOn('price')) { const cur = await core.catalog(); const sig = (x) => JSON.stringify({ p: (x.plans || []).map((p) => [p.id, (p.sizes || []).map((z) => [z.size, z.price, z.activation, z.reset])]), r: x.evalRules, f: x.fundedRules, i: x.instantCommon });
      const staffN = (await db.one("SELECT count(*)::int n FROM users WHERE role<>'trader' AND status='active'")).n;
      if (sig(cur) !== sig(c) && staffN > 1) { const d = ((await db.one("SELECT v FROM kv WHERE k='store.catalog.draft'")) || {}).v; const ch = ((d && d.s && d.s.changes) || []).filter((x) => x.approve);
        const ok = ((await db.one("SELECT v FROM kv WHERE k='catalog.approvals'")) || {}).v || {};
        if (!ch.length || ch.some((x) => !ok[x.id] || ok[x.id].by === x.whoId)) bad('Price and rule changes need a second person to approve them before publishing'); } }
    await core.saveCatalog(c, req.user.id); await db.q("DELETE FROM kv WHERE k='catalog.approvals'"); await core.audit(req.user.id, 'catalog.update', 'catalog', {});
  }));
  r.post('/catalog/changes/:id/approve', h(async (req) => { need(req.user); const d = ((await db.one("SELECT v FROM kv WHERE k='store.catalog.draft'")) || {}).v; const c = ((d && d.s && d.s.changes) || []).find((x) => x.id === req.params.id); if (!c) bad('Change not found', 404);
    const staffN = (await db.one("SELECT count(*)::int n FROM users WHERE role<>'trader' AND status='active'")).n; if (c.whoId === req.user.id && staffN > 1) bad('Someone else must approve your own change');
    const ok = ((await db.one("SELECT v FROM kv WHERE k='catalog.approvals'")) || {}).v || {}; ok[c.id] = { by: req.user.id, name: req.user.first, at: new Date().toISOString() }; await db.q("INSERT INTO kv(k,v) VALUES('catalog.approvals',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(ok)]); await core.audit(req.user.id, 'catalog.approve', c.id, { text: c.text }); return { ok: true }; }));
  r.put('/content/:key', h(async (req) => { need(req.user, 'support'); await content.set(req.params.key, req.body.value); await core.audit(req.user.id, 'content.update', req.params.key, {}); if (req.params.key === 'competitions') await require('./comps').sync(); }));
  r.post('/sim/tick', h(async (req) => { need(req.user); return { trades: await sim.tick() }; }));
  r.post('/automations/run', h(async (req) => { need(req.user); return require('./automations').run(); }));
  r.post('/demo/purge', h(async (req) => {
    need(req.user);
    const ids = (await db.all("SELECT id FROM users WHERE email LIKE '%@demo.fundedsky.test'")).map((x) => x.id);
    if (!ids.length) return { removed: 0 };
    await db.tx(async (c) => {
      await c.q('DELETE FROM payouts WHERE user_id = ANY($1)', [ids]);
      await c.q('DELETE FROM accounts WHERE user_id = ANY($1)', [ids]);
      await c.q('DELETE FROM orders WHERE user_id = ANY($1)', [ids]);
      await c.q('DELETE FROM tickets WHERE user_id = ANY($1)', [ids]);
      await c.q('UPDATE users SET referred_by=NULL WHERE referred_by = ANY($1)', [ids]);
      await c.q('DELETE FROM users WHERE id = ANY($1)', [ids]);
    });
    await core.audit(req.user.id, 'demo.purge', '', { users: ids.length });
    return { removed: ids.length };
  }));
  // ---- Users ----
  r.put('/users/:id/details', h(async (req) => { need(req.user, 'support'); const b = req.body; const u = await db.one('SELECT * FROM users WHERE id=$1', [+req.params.id]); if (!u) bad('User not found', 404);
    if (u.role !== 'trader') need(req.user);
    const email = clean(b.email || u.email, 200).toLowerCase(); if (!require('./util').emailOk(email)) bad('Enter a valid email address'); if (email !== u.email && (await db.one('SELECT 1 FROM users WHERE email=$1', [email]))) bad('Another user has that email');
    if (email !== u.email) { const mask = (e) => e.replace(/^(.)[^@]*(@.*)$/, '$1***$2'); require('./mail').sendT('emailchg', u.email, { first_name: u.first, old_email: mask(u.email), new_email: mask(email), url: require('./auth').BASE() + '/app#support' }, { uid: u.id, force: true }).catch(() => {}); await db.q('DELETE FROM sessions WHERE user_id=$1', [u.id]); }
    await db.q('UPDATE users SET first=$2,last=$3,email=$4,phone=$5,country=$6 WHERE id=$1', [u.id, clean(b.first || u.first, 60), clean(b.last || u.last, 60), email, clean(b.phone ?? u.phone, 40), clean(b.country || u.country, 60)]);
    await core.audit(req.user.id, 'user.details', u.tid, { from: { first: u.first, last: u.last, email: u.email } }); }));
  r.post('/users/:id/signout', h(async (req) => { need(req.user, 'support', 'risk'); { const tu = await db.one('SELECT role FROM users WHERE id=$1', [+req.params.id]); if (tu && tu.role !== 'trader' && tu && +req.params.id !== req.user.id) need(req.user); } await db.q('DELETE FROM sessions WHERE user_id=$1', [+req.params.id]); await core.audit(req.user.id, 'user.signout', String(req.params.id), {}); }));
  r.post('/users/:id/reset-password', h(async (req) => { need(req.user, 'support'); { const tu = await db.one('SELECT role FROM users WHERE id=$1', [+req.params.id]); if (tu && tu.role !== 'trader') need(req.user); } const u = await db.one('SELECT email FROM users WHERE id=$1', [+req.params.id]); await require('./auth').forgot({ body: { email: u.email } }); await core.audit(req.user.id, 'user.reset_password', String(req.params.id), {}); }));
  r.post('/users/:id/note', h(async (req) => { need(req.user, 'support', 'risk', 'finance'); const body = clean(req.body.body, 2000); if (!body) bad('Write a note first');
    await db.q("INSERT INTO kv(k,v) VALUES($1, jsonb_build_array($2::jsonb)) ON CONFLICT (k) DO UPDATE SET v = kv.v || $2::jsonb", ['note.user.' + (+req.params.id), JSON.stringify({ by: req.user.first + ' ' + req.user.last, at: new Date().toISOString(), body })]); }));
  r.post('/users/:id/notify', h(async (req) => { need(req.user, 'support', 'risk', 'finance'); const t = clean(req.body.title, 120); const body = clean(req.body.body, 1000); if (!t) bad('Add a title'); await core.notify(null, +req.params.id, t, body, clean(req.body.link, 60) || 'dashboard'); const uu = await db.one('SELECT email, first FROM users WHERE id=$1', [+req.params.id]); if (uu) await require('./mail').send(uu.email, t, `Hi ${uu.first},\n\n${body}\n\nFunded Sky`, 'notice').catch(() => {}); await core.audit(req.user.id, 'user.notify', String(req.params.id), { t }); }));
  r.get('/users/:id/extra', h(async (req) => { const id = +req.params.id; const u = await db.one('SELECT email FROM users WHERE id=$1', [id]); if (!u) bad('User not found', 404);
    const [notes, sess, trades, mails, pts] = await Promise.all([db.one('SELECT v FROM kv WHERE k=$1', ['note.user.' + id]), db.all('SELECT ua, ip, created_at, seen_at, expires_at FROM sessions WHERE user_id=$1 ORDER BY seen_at DESC LIMIT 40', [id]),
      db.all('SELECT t.account_id, t.ts, t.instrument, t.side, t.qty, t.pnl::float pnl, t.hold_min FROM trades t JOIN accounts a ON a.id=t.account_id WHERE a.user_id=$1 ORDER BY t.ts DESC LIMIT 3000', [id]),
      db.all('SELECT subject, template, status, created_at FROM outbox WHERE to_email=$1 ORDER BY id DESC LIMIT 60', [u.email]), db.all('SELECT label, delta, created_at FROM points_log WHERE user_id=$1 ORDER BY id DESC LIMIT 60', [id])]);
    await core.audit(req.user.id, 'user.view', String(id), {});
    return { notes: notes ? notes.v : [], sessions: sess, trades, emails: mails, points: pts }; }));
  r.post('/audit', h(async (req) => { await core.audit(req.user.id, clean(req.body.action, 60) || 'note', clean(req.body.target, 200), {}); }));
  r.post('/users/:id/anonymize', h(async (req) => { need(req.user); const id = +req.params.id; const u = await db.one('SELECT * FROM users WHERE id=$1', [id]); if (!u) bad('User not found', 404); if (u.role !== 'trader') bad('Staff accounts cannot be deleted here');
    await db.q("UPDATE users SET email=$2, first='Deleted', last='User', phone='', kyc='{}'::jsonb, status='banned', kyc_ref=NULL, tax_ref=NULL, mfa_secret=NULL, mfa_backup=NULL, settings=settings - 'affWhere' - 'affAudience' - 'notes' - 'src' - 'lsrc' WHERE id=$1", [id, 'deleted-' + id + '@deleted.fundedsky.invalid']);
    await db.q("UPDATE ticket_msgs SET body='[Deleted at the trader''s request]' WHERE author_id=$1", [id]); await db.q("UPDATE outbox SET to_email=$2 WHERE user_id=$1 OR lower(to_email)=lower($3)", [id, 'deleted-' + id + '@deleted.fundedsky.invalid', u.email]); await db.q('DELETE FROM sessions WHERE user_id=$1', [id]); await db.q('DELETE FROM payout_methods WHERE user_id=$1', [id]); await db.q('DELETE FROM kv WHERE k=$1', ['note.user.' + id]);
    await core.audit(req.user.id, 'user.anonymize', u.tid, {}); }));
  // ---- Accounts and trades ----
  r.post('/accounts/:id/adjust', h(async (req) => { need(req.user, 'risk'); const amt = Number(req.body.amount); if (!amt || Math.abs(amt) > 100000) bad('Enter an amount'); const why = clean(req.body.reason, 200); if (!why) bad('Add a reason');
    await db.q('UPDATE accounts SET balance=balance+$2 WHERE id=$1', [clean(req.params.id, 40), amt]); await core.audit(req.user.id, 'account.adjust', req.params.id, { amount: amt, reason: why }); }));
  r.get('/trades', h(async (req) => { const q = []; const v = []; if (req.query.account) { v.push(clean(req.query.account, 40)); q.push('t.account_id=$' + v.length); } if (req.query.user) { v.push(+req.query.user); q.push('a.user_id=$' + v.length); } if (req.query.instrument) { v.push(clean(req.query.instrument, 10)); q.push('t.instrument=$' + v.length); }
    return db.all(`SELECT t.*, a.user_id, a.plan, a.size FROM trades t JOIN accounts a ON a.id=t.account_id ${q.length ? 'WHERE ' + q.join(' AND ') : ''} ORDER BY t.ts DESC LIMIT 500`, v); }));
  // ---- Support ----
  r.post('/tickets/:id/assign', h(async (req) => { const to = req.body.to === 'me' ? req.user.id : req.body.to ? +req.body.to : null; await db.q('UPDATE tickets SET assignee=$2, updated_at=now() WHERE id=$1', [+req.params.id, to]); }));
  // Analytics: compact daily facts for the last 2 years (days counted in Eastern Time from 'start')
  let anCache = null;
  r.get('/analytics', h(async () => {
    if (anCache && Date.now() - anCache.t < 60e3) return anCache.v;
    const start = (await db.one("SELECT ((now() AT TIME ZONE 'America/New_York')::date - 729)::text d")).d;
    const D = (col) => `((${col} AT TIME ZONE 'America/New_York')::date - '${start}'::date)`;
    const [visits, users, orders, accts, pays, disp, styles, pages, tickets] = await Promise.all([
      db.all(`SELECT (day - '${start}'::date) d, src, camp, country, dev, n FROM visits WHERE day >= '${start}'::date`),
      db.all(`SELECT id, ${D('created_at')} d, country, settings->'src' src, settings->'lsrc' lsrc, email LIKE '%@demo.fundedsky.test' demo, referred_by FROM users WHERE role='trader'`),
      db.all(`SELECT o.user_id u, ${D('o.created_at')} c, CASE WHEN o.paid_at IS NULL THEN NULL ELSE ${D('o.paid_at')} END p, CASE WHEN o.refunded_at IS NULL THEN NULL ELSE ${D('o.refunded_at')} END rf, o.kind, o.status, o.items, o.lines, o.discount::float disc, o.total::float tot, o.promo, o.pay_method m, o.provider pv, EXTRACT(HOUR FROM o.paid_at AT TIME ZONE 'America/New_York')::int hr, EXTRACT(ISODOW FROM o.paid_at AT TIME ZONE 'America/New_York')::int dw, o.meta->>'refundNote' rn FROM orders o WHERE o.created_at > now() - interval '731 days'`),
      db.all(`SELECT a.id, a.user_id u, a.plan, a.size, a.platform, a.kind, a.phase, ${D('a.created_at')} c, CASE WHEN a.passed_at IS NULL THEN NULL ELSE ${D('a.passed_at')} END pa, CASE WHEN a.breached_at IS NULL THEN NULL ELSE ${D('a.breached_at')} END br, a.breach_reason why, a.payout_count pc, a.parent_id par FROM accounts a WHERE a.created_at > now() - interval '731 days'`),
      db.all(`SELECT user_id u, ${D('paid_at')} d, amount::float a, account_id ac FROM payouts WHERE status='paid' AND paid_at > now() - interval '731 days'`),
      db.all("SELECT v FROM kv WHERE k LIKE 'dispute.%'"),
      db.all("SELECT account_id ac, count(*)::int n, avg(hold_min)::float hold, avg(CASE WHEN tag ILIKE '%news%' THEN 1 ELSE 0 END)::float news FROM trades WHERE ts > now() - interval '180 days' GROUP BY account_id"),
      db.all(`SELECT (day - '${start}'::date) d, path, n FROM pageviews WHERE day >= '${start}'::date`),
      db.all("SELECT u.id, a.platform FROM tickets t JOIN users u ON u.id=t.user_id LEFT JOIN LATERAL (SELECT platform FROM accounts WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1) a ON true WHERE t.created_at > now() - interval '90 days'")]);
    const v = { start, visits, users, orders, accts, pays, disputes: disp.map((x) => x.v).filter((x) => x && x.opened).map((x) => ({ d: Math.floor((new Date(x.opened) - new Date(start + 'T05:00:00Z')) / 864e5), a: Number(x.amount) || 0, st: x.status })), styles, pages, tickets };
    anCache = { t: Date.now(), v }; return v; }));
  r.post('/analytics/send', h(async (req) => { const to = String(req.body.to || req.user.email).split(/[,;\s]+/).filter((x) => /^\S+@\S+\.\S+$/.test(x)).slice(0, 10); if (!to.length) bad('Add at least one email address');
    const csv = Array.isArray(req.body.csv) ? '\n\n' + req.body.csv.map((r2) => r2.join(',')).join('\n') : ''; for (const t of to) await require('./mail').send(t, clean(req.body.subject, 140) || 'Funded Sky report', clean(req.body.body, 20000) + csv, 'report');
    if (req.body.slack) require('./integrations').alert('report', `*${clean(req.body.subject, 140)}*\n${clean(req.body.body, 3000)}`); return { to: to.join(', ') }; }));
  // Emails board: designs, sending numbers and logs
  r.get('/emails', h(async (req) => { const M = require('./mail');
    const [byDay, logs, users] = await Promise.all([
      db.all("SELECT template, (created_at AT TIME ZONE 'America/New_York')::date::text d, status, count(*)::int n FROM outbox WHERE created_at > now() - interval '91 days' GROUP BY 1,2,3"),
      db.all("SELECT o.id, o.to_email, o.subject, o.template, o.status, o.created_at, o.ext_id, o.events, o.user_id, u.tid, u.first, u.last FROM outbox o LEFT JOIN users u ON u.id=o.user_id OR (o.user_id IS NULL AND u.email=o.to_email) WHERE o.created_at > now() - interval '30 days' ORDER BY o.id DESC LIMIT 1500"),
      Promise.resolve(null)]);
    return { defs: M.DEFS, byDay, logs }; }));
  r.post('/emails/test', h(async (req) => { const M = require('./mail'); const key = String(req.body.key || ''); const C = await M.cfg(); const base = M.tplOf(C, key); if (!base) bad('Unknown email');
    const d = req.body.draft && typeof req.body.draft === 'object' ? req.body.draft : {}; const e = Object.assign({}, base, d, { flow: base.flow });
    const vars = Object.assign({}, M.DEFS.SAMPLE, { first_name: req.user.first, url: require('./auth').BASE() + '/app' }); const f = (t) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : ''));
    await M.deliverRaw({ to: req.user.email, subject: '[Test] ' + f(e.s), body: f(e.h) + ' ' + f(e.a), html: M.render(e, vars, C.brand), template: 'test:' + key, from: M.DEFS.SENDERS[e.fr], uid: req.user.id }); return { to: req.user.email }; }));
  r.post('/emails/resend/:id', h(async (req) => { need(req.user, 'support'); const o = await db.one('SELECT * FROM outbox WHERE id=$1', [+req.params.id]); if (!o) bad('Message not found', 404);
    const sup = ((await db.one("SELECT v FROM kv WHERE k='store.emails.supp'")) || {}).v || []; if (sup.some((x) => String(x.a).toLowerCase() === o.to_email.toLowerCase() && x.k === 'Bounced')) bad('This address is on the suppression list. Remove it first.');
    await require('./mail').send(o.to_email, o.subject, o.body, o.template); await core.audit(req.user.id, 'email.resend', String(o.id), {}); }));
  r.get('/emails/domain', h(async () => { const c = await require('./integrations').cfg('resend').catch(() => null); const key = (c && c.apiKey) || process.env.RESEND_API_KEY; if (!key) return { connected: false, from: (c && c.from) || '' };
    const H = { Authorization: 'Bearer ' + key }; const l = await fetch('https://api.resend.com/domains', { headers: H }).then((r2) => r2.json()).catch(() => ({}));
    const doms = l.data || []; const want = (((c && c.from) || '').match(/@([^>\s]+)/) || [])[1]; const d0 = doms.find((d) => d.name === want) || doms[0];
    const det = d0 ? await fetch('https://api.resend.com/domains/' + d0.id, { headers: H }).then((r2) => r2.json()).catch(() => null) : null;
    return { connected: true, from: (c && c.from) || '', domains: doms.map((d) => ({ name: d.name, status: d.status, created: d.created_at, region: d.region })), domain: det && { name: det.name, status: det.status, created: det.created_at, region: det.region, records: (det.records || []).map((x) => ({ rec: x.record, type: x.type, name: x.name, value: x.value, status: x.status })) } }; }));
  r.post('/tickets/:id/category', h(async (req) => { await db.q('UPDATE tickets SET category=$2, updated_at=now() WHERE id=$1', [+req.params.id, clean(req.body.category, 60) || 'General']); }));
  r.post('/tickets/:id/note', h(async (req) => { const body = clean(req.body.body, 5000); if (!body) bad('Write a note first'); await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,internal,body) VALUES($1,$2,true,true,$3)', [+req.params.id, req.user.id, body]); }));
  r.post('/tickets/:id/priority', h(async (req) => { await db.q('UPDATE tickets SET priority=$2 WHERE id=$1', [+req.params.id, ['low', 'normal', 'high', 'urgent'].includes(req.body.priority) ? req.body.priority : 'normal']); }));
  // Breach reviews: one person proposes, a different person confirms; the trader hears the outcome
  const REVK = 'store.support.reviews'; const revs = async () => ((await db.one('SELECT v FROM kv WHERE k=$1', [REVK])) || { v: {} }).v || {};
  const saveRevs = (v) => db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', [REVK, JSON.stringify(v)]);
  const revTicket = async (tid) => { const t = await db.one('SELECT * FROM tickets WHERE id=$1', [+tid]); if (!t) bad('Ticket not found', 404); const a = await db.one("SELECT * FROM accounts WHERE user_id=$1 AND phase='breached' ORDER BY breached_at DESC NULLS LAST LIMIT 1", [t.user_id]); return { t, a }; };
  r.post('/tickets/:id/review', h(async (req) => { need(req.user, 'support', 'risk'); const { t, a } = await revTicket(req.params.id); if (!a) bad('This trader has no closed account to review'); if (!t.review) require('./mail').t('appeal', t.user_id, { url: require('./auth').BASE() + '/app#support?tkt=' + t.id }); await db.q("UPDATE tickets SET review=true, category='Breach Dispute', updated_at=now() WHERE id=$1", [t.id]); }));
  r.post('/reviews/:tid/propose', h(async (req) => { need(req.user, 'support', 'risk'); const { t, a } = await revTicket(req.params.tid); if (!a) bad('The account is no longer closed');
    const k = 'BR-' + t.id; const v = await revs(); if (v[k] && v[k].st !== 'open') bad('This review already has a decision');
    const decision = req.body.decision === 'reinstated' ? 'reinstated' : 'upheld'; const note = clean(req.body.note, 2000);
    v[k] = { st: 'second', decision, first: req.user.first, firstId: req.user.id, note, acct: a.id, at: new Date().toISOString() }; await saveRevs(v);
    await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,internal,body) VALUES($1,$2,true,true,$3)', [t.id, req.user.id, `${req.user.first} proposed: ${decision === 'reinstated' ? 'reinstate' : 'uphold the closure'}. ${note}`.trim()]);
    await core.audit(req.user.id, 'review.propose', k, { decision }); }));
  r.post('/reviews/:tid/confirm', h(async (req) => { need(req.user, 'risk'); const { t } = await revTicket(req.params.tid); const k = 'BR-' + t.id; const v = await revs(); const rv = v[k];
    if (!rv || rv.st !== 'second') bad('Nothing is waiting for a second reviewer'); if (rv.firstId === req.user.id) bad('A different person must confirm this decision', 403);
    if (rv.decision === 'reinstated') { const a = await db.one('SELECT * FROM accounts WHERE id=$1', [rv.acct]); if (!a || a.phase !== 'breached') bad('The account is no longer closed'); await reinstate(a.id); }
    v[k] = Object.assign({}, rv, { st: rv.decision, second: req.user.first, secondId: req.user.id, decidedAt: new Date().toISOString() }); await saveRevs(v);
    const u = await db.one('SELECT id, email, first FROM users WHERE id=$1', [t.user_id]);
    const msg = rv.decision === 'reinstated' ? `Hi ${u.first}, we reviewed the closure of ${rv.acct} and reinstated it. It's active again at its balance from the start of that day.${rv.note ? '\n\n' + rv.note : ''}` : `Hi ${u.first}, we reviewed the closure of ${rv.acct}. The trades show the rule was broken, so the closure stands.${rv.note ? '\n\n' + rv.note : ''}\n\nYou can reset the account from its page.`;
    await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,body) VALUES($1,$2,true,$3)', [t.id, req.user.id, msg]);
    await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,internal,body) VALUES($1,$2,true,true,$3)', [t.id, req.user.id, `${k} decided: ${rv.decision === 'reinstated' ? 'account reinstated' : 'closure upheld'} by ${rv.first} and ${req.user.first}.`]);
    await db.q("UPDATE tickets SET status='solved', updated_at=now() WHERE id=$1", [t.id]);
    await core.notify(null, u.id, rv.decision === 'reinstated' ? `${rv.acct} was reinstated` : `Review of ${rv.acct} finished`, msg.slice(0, 140), 'support?tkt=' + t.id);
    await require('./mail').sendT('appealdec', u.email, { first_name: u.first, decision_short: rv.decision === 'reinstated' ? `${rv.acct} is open again.` : 'The closure stands.', decision: msg, url: `${require('./auth').BASE()}/app#support?tkt=${t.id}` }, { uid: u.id });
    await require('./support').onSolved(t);
    await core.audit(req.user.id, 'review.confirm', k, { decision: rv.decision }); return v[k]; }));
  r.post('/reviews/:tid/back', h(async (req) => { need(req.user, 'risk'); const k = 'BR-' + (+req.params.tid); const v = await revs(); if (v[k] && ['upheld', 'reinstated'].includes(v[k].st)) bad('This review is already decided'); delete v[k]; await saveRevs(v);
    await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,internal,body) VALUES($1,$2,true,true,$3)', [+req.params.tid, req.user.id, `${req.user.first} sent the review back for another look.`]); }));
  // ---- Generic lists stored in kv: announcements, macros, blocklist, countries, incidents ----
  const KV = ['announcements', 'macros', 'blocklist', 'countries', 'incidents', 'affiliates', 'docs', 'complaints'];
  r.put('/list/:key', h(async (req) => { if (!KV.includes(req.params.key)) bad('Unknown list'); need(req.user, ...(LIST_ROLES[req.params.key] || [])); const prevList = req.params.key === 'affiliates' ? ((await db.one("SELECT v FROM kv WHERE k='list.affiliates'")) || {}).v || [] : null; await db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', ['list.' + req.params.key, JSON.stringify(req.body.value || [])]); await core.audit(req.user.id, 'list.' + req.params.key, '', {});
    if (prevList) for (const x of req.body.value || []) { if (!x || !x.user || x.status !== 'active' || prevList.some((y) => y.user === x.user && y.status === 'active')) continue; const sm = await require('./affiliates').summary(+x.user).catch(() => null);
      require('./mail').t('affok', +x.user, { aff_code: String(x.code || (sm && sm.code) || '').toUpperCase(), discount: sm ? sm.disc + '%' : '', commission: sm ? sm.rate + '%' : '', url: require('./auth').BASE() + '/app#affiliates' }); } }));
  // ---- Disputes ----
  r.post('/disputes', h(async (req) => { need(req.user, 'finance', 'support'); const o = await db.one('SELECT * FROM orders WHERE code=$1', [clean(req.body.order, 30)]); if (!o) bad('Order not found'); const id = 'CB-' + Date.now().toString(36).toUpperCase();
    await db.q('INSERT INTO kv(k,v) VALUES($1,$2)', ['dispute.' + id, JSON.stringify({ id, provider: o.provider, order: o.code, user: o.user_id, amount: Number(req.body.amount) || Number(o.total), reason: clean(req.body.reason, 120) || 'Not specified', status: 'open', opened: new Date().toISOString(), due: req.body.due || null, evidence: [] })]);
    await db.q("UPDATE orders SET meta = meta || jsonb_build_object('chargeback','open','dispute',$2::text) WHERE id=$1", [o.id, id]);
    // Disputes > Settings: pause the trader's accounts until the dispute ends
    const ds = ((await db.one("SELECT v FROM kv WHERE k='store.disputes.settings'")) || {}).v || {};
    if (ds.cbPause !== false) { const ids = (await db.all("UPDATE accounts SET sim = sim || jsonb_build_object('paused', true, 'pausedFor', $2::text) WHERE user_id=$1 AND phase IN ('active','passed','review') AND (sim->>'paused') IS NULL RETURNING id", [o.user_id, id])).map((x) => x.id);
      await db.q("UPDATE kv SET v = v || jsonb_build_object('paused', $2::jsonb) WHERE k=$1", ['dispute.' + id, JSON.stringify(ids)]); }
    if (ds.cbEmail) { const u = await db.one('SELECT email, first FROM users WHERE id=$1', [o.user_id]); if (u) require('./mail').send(u.email, 'About a payment dispute on your Funded Sky order', `Hi ${u.first},\n\nYour bank told us you disputed the payment for order ${o.code}. While the dispute is reviewed, your accounts are paused.\n\nIf this was a mistake, ask your bank to cancel the dispute and reply to this email so we can help.\n\nFunded Sky`, 'notice').catch(() => {}); }
    await core.audit(req.user.id, 'dispute.open', id, { order: o.code }); return { id }; }));
  r.put('/disputes/:id', h(async (req) => { need(req.user, 'finance', 'support'); const k = 'dispute.' + clean(req.params.id, 40); const row = await db.one('SELECT v FROM kv WHERE k=$1', [k]); if (!row) bad('Dispute not found', 404);
    const v = { ...row.v }; if (req.body.status) { if (!['open', 'evidence', 'submitted', 'won', 'lost', 'accepted'].includes(req.body.status)) bad('Unknown status'); v.status = req.body.status; } if (req.body.ev && typeof req.body.ev === 'object') v.ev = req.body.ev; if (req.body.evidence) v.evidence = (v.evidence || []).concat([{ at: new Date().toISOString(), by: req.user.first, text: clean(req.body.evidence, 1000) }]); if (['won', 'lost', 'accepted'].includes(req.body.status)) v.closed = new Date().toISOString(); if (req.body.status === 'submitted') v.submitted = new Date().toISOString();
    const ended = ['won', 'lost', 'accepted'].includes(req.body.status) && !['won', 'lost', 'accepted'].includes(row.v.status);
    if (ended && v.order) { const o = await db.one('SELECT * FROM orders WHERE code=$1', [v.order]);
      // Paused accounts open again; a lost or accepted chargeback closes what the order bought and takes back what it earned
      for (const id of v.paused || []) await db.q("UPDATE accounts SET sim = sim - 'paused' - 'pausedFor' WHERE id=$1 AND sim->>'pausedFor'=$2", [id, v.id]);
      if (o) { await db.q("UPDATE orders SET meta = meta || jsonb_build_object('chargeback', $2::text) WHERE id=$1", [o.id, req.body.status]);
        if (req.body.status !== 'won') {
          for (const id of (o.meta && o.meta.accounts) || []) await db.q("UPDATE accounts SET phase='closed', closed_at=now(), breach_reason='Chargeback' WHERE id=$1 AND phase IN ('active','passed','review')", [id]);
          const earned = Math.floor(Number(o.total)); if (earned > 0 && o.status === 'paid') await core.points(null, o.user_id, -earned, 'Chargeback ' + o.code);
        } } }
    await db.q('UPDATE kv SET v=$2, updated_at=now() WHERE k=$1', [k, JSON.stringify(v)]); await core.audit(req.user.id, 'dispute.update', v.id, { status: v.status }); }));
  // ---- Health and fraud data ----
  r.get('/health', h(async () => { const [errors, jobs, hooks, db1] = await Promise.all([db.all('SELECT * FROM error_log ORDER BY id DESC LIMIT 200'), db.all('SELECT * FROM jobs_log ORDER BY id DESC LIMIT 200'), db.all('SELECT * FROM webhook_log ORDER BY id DESC LIMIT 200'), db.one("SELECT pg_database_size(current_database())::bigint size, (SELECT count(*) FROM trades)::int trades")]);
    const RS = global.FS_REQSTAT || { hours: {}, routes: {} }; const all = [].concat(...Object.values(RS.hours).map((x) => x.ms)).sort((a, c) => a - c); const tot = Object.values(RS.hours).reduce((s2, x) => s2 + x.n, 0); const fail = Object.values(RS.hours).reduce((s2, x) => s2 + x.fail, 0);
    const hd = ((await db.one("SELECT v FROM kv WHERE k='store.health.days'")) || {}).v || {};
    return { errors, jobs, hooks, db: db1, uptime: process.uptime(), memory: process.memoryUsage().rss, node: process.version, market: require('./sim').marketOpen(), p95: all.length ? all[Math.floor(all.length * 0.95)] : 0, failPct: tot ? fail / tot * 100 : 0, reqs: tot, hours: Object.fromEntries(Object.entries(RS.hours).map(([k, v]) => [k, { n: v.n, fail: v.fail, p50: v.ms.slice().sort((a, c) => a - c)[Math.floor(v.ms.length / 2)] || 0 }])), routes: RS.routes, days: hd }; }));
  r.get('/rewards', h(async () => { const [points, coupons] = await Promise.all([db.all('SELECT p.*, u.first, u.last FROM points_log p JOIN users u ON u.id=p.user_id ORDER BY p.id DESC LIMIT 500'), db.all('SELECT c.*, u.first, u.last FROM coupons c LEFT JOIN users u ON u.id=c.user_id ORDER BY c.created_at DESC LIMIT 500')]); return { points, coupons }; }));
  r.post('/coupons', h(async (req) => { need(req.user, 'support'); const b = req.body; const kind = ['discount', 'free_reset', 'free_eval'].includes(b.kind) ? b.kind : 'discount'; const pctv = Math.min(100, Math.max(0, Number(b.pct) || 0)); const code = (clean(b.code, 24) || ('FS-' + Math.random().toString(36).slice(2, 8))).toUpperCase(); const uid = b.user ? +b.user : null;
    await db.q('INSERT INTO coupons(code,user_id,pct,label,kind) VALUES($1,$2,$3,$4,$5)', [code, uid, pctv, clean(b.label, 80) || 'Issued by staff', kind]); if (uid) await core.notify(null, uid, 'You have a new reward', clean(b.label, 80) || 'A coupon was added to your account.', 'rewards'); await core.audit(req.user.id, 'coupon.issue', code, b); return { code }; }));
  r.post('/staff/:id/role', h(async (req) => { need(req.user); const role = req.body.role; if (!['trader', 'admin', 'support', 'risk', 'finance'].includes(role)) bad('Unknown role'); if (+req.params.id === req.user.id) bad('You cannot change your own role'); await db.q('UPDATE users SET role=$2 WHERE id=$1', [+req.params.id, role]); if (role === 'trader') await db.q('DELETE FROM sessions WHERE user_id=$1', [+req.params.id]); await core.audit(req.user.id, 'staff.role', String(req.params.id), { role }); }));
  r.post('/approvals/:key/:act', h(async (req) => { const all = await pendingAll(); const key = decodeURIComponent(req.params.key); const p = all[key]; if (!p) bad('This request was already handled', 404);
    if (req.params.act === 'reject') { if (p.by !== req.user.id) need(req.user); delete all[key]; await pendingSave(all); await core.audit(req.user.id, 'approval.reject', key, {}); return { ok: true }; }
    if (p.by === req.user.id) bad('A different person must approve this'); p.approvedBy = req.user.id; all[key] = p; await pendingSave(all);
    const fake = { method: 'POST', body: Object.assign({}, p.payload), user: req.user, params: {} }; const run = async (path) => { const rr = await fetchSelf(path, fake); return rr; };
    if (p.kind === 'close' || p.kind === 'reinstate') return run(`/accounts/${encodeURIComponent(p.target)}/${p.kind === 'close' ? 'breach' : 'reinstate'}`);
    if (p.kind === 'ban' || p.kind === 'kyc') return run(`/users/${p.target}`);
    bad('Unknown request'); }));
  r.post('/staff/:id/mfa-reset', h(async (req) => { need(req.user); const id = +req.params.id; if (id === req.user.id) bad('Ask another admin to reset your own two-step login'); const u = await db.one('SELECT id, role FROM users WHERE id=$1', [id]); if (!u || u.role === 'trader') bad('Staff member not found', 404); await require('./mfa').reset(id); await core.audit(req.user.id, 'staff.mfa_reset', String(id), {}); }));
  r.post('/staff/invite', h(async (req) => { need(req.user); const email = clean(req.body.email, 120).toLowerCase(); const role = req.body.role; if (!['admin', 'support', 'risk', 'finance'].includes(role)) bad('Unknown role'); const u = await db.one('SELECT id FROM users WHERE lower(email)=$1', [email]); if (!u) bad('That person needs to sign up first, then you can give them a role'); await db.q('UPDATE users SET role=$2 WHERE id=$1', [u.id, role]); await core.audit(req.user.id, 'staff.role', email, { role }); }));
  r.get('/fraud', h(async () => { const [sess, methods, kyc] = await Promise.all([db.all('SELECT user_id, ip, ua, created_at FROM sessions'), db.all('SELECT user_id, label FROM payout_methods'), db.all("SELECT id, kyc FROM users WHERE kyc ? 'name'")]); return { sess, methods, kyc: kyc.map((u) => ({ id: u.id, name: u.kyc.name, dob: u.kyc.dob, idLast4: u.kyc.idLast4 })) }; }));
  // ---- Exports ----
  r.get('/export/:what.csv', async (req, res) => { try { const w = req.params.what; const csv = (rows) => { if (!rows.length) return ''; const ks = Object.keys(rows[0]); return ks.join(',') + '\n' + rows.map((x) => ks.map((k) => { const v = x[k] == null ? '' : typeof x[k] === 'object' ? JSON.stringify(x[k]) : cellSafe(String(x[k])); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\n'); };
    const Q = { orders: "SELECT o.code, o.created_at, o.paid_at, u.email, o.kind, o.subtotal, o.discount, o.total, o.promo, o.status, o.provider, o.pay_method, o.refunded_at FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id", payouts: 'SELECT p.code, p.requested_at, p.approved_at, p.paid_at, u.email, u.country, p.account_id, p.number, p.gross, p.split, p.amount, p.method, p.rail, p.status, p.batch, p.tx_hash FROM payouts p JOIN users u ON u.id=p.user_id ORDER BY p.id', users: 'SELECT tid, email, first, last, country, role, status, kyc_status, tax_status, points, created_at FROM users ORDER BY id', accounts: 'SELECT id, user_id, plan, size, kind, phase, start_bal, balance, floor, days_traded, payout_count, paid_total, created_at, passed_at, breached_at, breach_reason FROM accounts ORDER BY created_at' };
    if (!Q[w]) return res.status(404).end(); const mo = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : ''; const rows = (await db.all(Q[w])).filter((x) => { if (!mo) return true; const k = Object.keys(x).find((y) => /_at$/.test(y)); return x[k] && new Date(x[k]).toISOString().startsWith(mo); }); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="fundedsky-${w}-${new Date().toISOString().slice(0, 10)}.csv"`); res.send(csv(rows)); } catch (e) { res.status(500).send('error'); } });
  return r;
}
module.exports = { router };
