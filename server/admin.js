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

function router(h) {
  const r = express.Router();

  // Everything the back office boards read, in one call. Cheap enough at early-stage volumes.
  r.get('/boot', h(async (req) => {
    const cat = await core.catalog();
    const [users, accounts, orders, payouts, tickets, msgs, outbox, auditRows, methods, daily, notes] = await Promise.all([
      db.all('SELECT id,tid,email,first,last,country,phone,role,verified,status,kyc_status,kyc,tax_status,rise_status,points,ref_code,referred_by,settings,created_at,last_login FROM users ORDER BY created_at DESC LIMIT 2000'),
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
      return { id: a.id, user: a.user_id, tid: a.tid, name: `${a.first} ${a.last}`, email: a.email, plan: a.plan, size: a.size, platform: a.platform, kind: a.kind, phase: a.phase, start: Number(a.start_bal), bal: Number(a.balance), floor: Number(a.floor), peak: Number(a.peak_eod), today: a.today_date === tradeDate() ? Number(a.today_pnl) : 0, halted: a.halted_today, days: a.days_traded, best: Number(a.best_day), payouts: a.payout_count, paid: Number(a.paid_total), resets: a.reset_count, freeResets: a.free_resets, addons: a.addons, breach: a.breach_reason, created: a.created_at, passed: a.passed_at, funded: a.funded_at, breached: a.breached_at, closed: a.closed_at, parent: a.parent_id, maxLoss: rr.maxLoss, dll: rr.dll, target: rr.target || rr.goal || 0, avail: q ? q.max : 0, ready: q ? q.ok : false, winDays: a.cycle_win_days, sim: a.sim, demo: /@demo\.fundedsky\.test$/.test(a.email) };
    });
    const kvs = await db.all("SELECT k, v FROM kv WHERE k LIKE 'settings.%' OR k LIKE 'dispute.%'");
    const settings = {}; const disputes = [];
    kvs.forEach((r) => { if (r.k.startsWith('settings.')) settings[r.k.slice(9)] = r.v; else disputes.push(r.v); });
    const integrations = (await I.list()).map((x) => ({ id: x.id, name: x.name, cat: x.cat, enabled: x.enabled, status: x.status, lastError: x.lastError, lastCheck: x.lastCheck }));
    const hooks = await db.all('SELECT provider, event, ok, created_at FROM webhook_log ORDER BY id DESC LIMIT 200');
    return {
      settings, disputes, integrations, hooks, taxOn: await I.on('track1099'), contentDefault: require('./content-seed.json'),
      me: { id: req.user.id, first: req.user.first, last: req.user.last, email: req.user.email, role: req.user.role },
      now: new Date().toISOString(), today: tradeDate(), payments: pay.mode(), catalog: cat,
      users: users.map((u) => ({ ...u, demo: /@demo\.fundedsky\.test$/.test(u.email), kyc: u.kyc && u.kyc.name ? { name: u.kyc.name, dob: u.kyc.dob, country: u.kyc.country, idType: u.kyc.idType, idLast4: u.kyc.idLast4, at: u.kyc.at } : null })),
      accounts: acctOut,
      orders: orders.map((o) => ({ id: o.id, code: o.code, user: o.user_id, tid: o.tid, name: `${o.first} ${o.last}`, email: o.email, kind: o.kind, lines: o.lines, items: o.items, subtotal: Number(o.subtotal), discount: Number(o.discount), total: Number(o.total), promo: o.promo, status: o.status, method: o.pay_method, provider: o.provider, created: o.created_at, paid: o.paid_at, refunded: o.refunded_at, accounts: (o.meta && o.meta.accounts) || [], account: o.meta && o.meta.account })),
      payouts: payouts.map((p) => ({ code: p.code, account: p.account_id, user: p.user_id, tid: p.tid, name: `${p.first} ${p.last}`, email: p.email, country: p.country, kyc: p.kyc_status, tax: p.tax_status, rise: p.rise_status, tx: p.tx_hash, ref: p.provider_ref, number: p.number, gross: Number(p.gross), split: p.split, amount: Number(p.amount), method: p.method, rail: p.rail, status: p.status, batch: p.batch, note: p.note, requested: p.requested_at, approved: p.approved_at, paid: p.paid_at, denied: p.denied_at })),
      tickets: tickets.map((t) => ({ id: t.id, user: t.user_id, tid: t.tid, name: `${t.first} ${t.last}`, email: t.email, subject: t.subject, category: t.category, channel: t.channel, status: t.status, priority: t.priority, created: t.created_at, updated: t.updated_at, msgs: msgs.filter((m) => m.ticket_id === t.id).map((m) => ({ staff: m.staff, by: m.afirst, body: m.body, at: m.created_at })) })),
      outbox, audit: auditRows.map((a) => ({ at: a.created_at, by: a.first ? `${a.first} ${a.last}` : 'System', action: a.action, target: a.target, meta: a.meta })),
      methods: methods.map((m) => ({ user: m.user_id, rail: m.rail, label: m.label, def: m.is_default, unlock: m.unlock_at, created: m.created_at })),
      daily, content: Object.fromEntries(notes.map((n) => [n.k.slice(8), n.v]))
    };
  }));

  r.post('/users/:id', h(async (req) => {
    const u = await db.one('SELECT * FROM users WHERE id=$1', [+req.params.id]); if (!u) bad('User not found', 404);
    const b = req.body; const sets = []; const vals = [u.id];
    if (b.role !== undefined) { need(req.user); if (!['trader', 'admin', 'support', 'risk', 'finance'].includes(b.role)) bad('Unknown role'); if (u.id === req.user.id) bad('You cannot change your own role'); vals.push(b.role); sets.push('role=$' + vals.length); }
    if (b.status !== undefined) { need(req.user, 'support', 'risk'); if (!['active', 'suspended', 'banned'].includes(b.status)) bad('Unknown status'); vals.push(b.status); sets.push('status=$' + vals.length); if (b.status === 'banned') await db.q('DELETE FROM sessions WHERE user_id=$1', [u.id]); }
    if (b.kyc_status !== undefined) { need(req.user, 'risk', 'support'); if (!['none', 'submitted', 'verified', 'rejected'].includes(b.kyc_status)) bad('Unknown status'); vals.push(b.kyc_status); sets.push('kyc_status=$' + vals.length); }
    if (b.points !== undefined) { need(req.user, 'support'); const d = parseInt(b.points, 10) || 0; await core.points(null, u.id, d, clean(b.reason, 80) || 'Adjusted by support'); }
    if (sets.length) await db.q(`UPDATE users SET ${sets.join(',')} WHERE id=$1`, vals);
    if (b.kyc_status === 'verified') await core.notify(null, u.id, 'Identity verified', 'You can now receive payouts.', 'settings?tab=identity');
    if (b.kyc_status === 'rejected') await core.notify(null, u.id, 'We could not verify your identity', clean(b.reason, 200) || 'Check your details and submit again, or contact support.', 'settings?tab=identity');
    await core.audit(req.user.id, 'user.update', u.tid, b);
  }));

  r.post('/accounts/:id/:action', h(async (req) => {
    const id = clean(req.params.id, 40); const a = await db.one('SELECT * FROM accounts WHERE id=$1', [id]); if (!a) bad('Account not found', 404);
    const act = req.params.action;
    if (act === 'breach') { need(req.user, 'risk'); await db.q("UPDATE accounts SET phase='breached', breached_at=now(), breach_reason=$2 WHERE id=$1", [id, clean(req.body.reason, 200) || 'Closed by risk review']); await core.notify(null, a.user_id, `${id} was closed`, clean(req.body.reason, 200) || 'Closed by risk review. Contact support with questions.', 'account?acct=' + id); }
    else if (act === 'reinstate') { need(req.user, 'risk'); await db.q("UPDATE accounts SET phase='active', breached_at=NULL, breach_reason=NULL, floor=LEAST(floor, balance - 1) WHERE id=$1", [id]); await core.notify(null, a.user_id, `${id} was reinstated`, 'Your account is active again.', 'account?acct=' + id); }
    else if (act === 'pause') { need(req.user, 'risk'); await db.q("UPDATE accounts SET sim = sim || '{\"paused\":true}' WHERE id=$1", [id]); }
    else if (act === 'resume') { need(req.user, 'risk'); await db.q("UPDATE accounts SET sim = sim - 'paused' WHERE id=$1", [id]); }
    else if (act === 'fastforward') { need(req.user); return sim.fastForward(id, parseInt(req.body.days, 10) || 5); }
    else if (act === 'reset') { need(req.user, 'support'); await db.tx((c) => core.resetAccount(c, id, a.user_id)); }
    else if (act === 'fund') { need(req.user, 'risk'); if (a.phase !== 'passed') bad('Account has not passed'); await db.tx((c) => core.activateFunded(c, id, a.user_id, null)); }
    else bad('Unknown action');
    await core.audit(req.user.id, 'account.' + act, id, req.body);
  }));

  r.post('/payouts/:code/rise', h(async (req) => { need(req.user, 'finance'); return require('./flows').riseSend(req.user.id, req.params.code); }));
  r.post('/payouts/:code/:action', h(async (req) => {
    need(req.user, 'finance', 'risk'); const code = clean(req.params.code, 30);
    if (req.params.action === 'approve' && (await I.on('track1099'))) { const u = await db.one('SELECT u.tax_status FROM payouts p JOIN users u ON u.id=p.user_id WHERE p.code=$1', [code]); if (u && u.tax_status !== 'on_file' && !req.body.skipTax) bad('No tax form on file for this trader yet'); }
    if (req.params.action === 'pay' && req.body.tx) await db.q('UPDATE payouts SET tx_hash=$2 WHERE code=$1', [code, clean(req.body.tx, 120)]);
    return core.reviewPayout(req.user.id, code, req.params.action, clean(req.body.note, 300));
  }));
  // Integrations (admin only)
  r.get('/integrations', h(async (req) => { need(req.user); const hooks = await db.all('SELECT * FROM webhook_log ORDER BY id DESC LIMIT 100'); const alerts = await db.one("SELECT v FROM kv WHERE k='settings.alerts'"); return { list: await I.list(), hooks, alerts: alerts ? alerts.v : {}, base: require('./auth').BASE() }; }));
  r.put('/integrations/:id', h(async (req) => { need(req.user); await I.save(req.params.id, req.body, req.user.id); await require('./payments').refreshMode(); await core.audit(req.user.id, 'integration.update', req.params.id, { enabled: req.body.enabled }); return { list: await I.list() }; }));
  r.post('/integrations/:id/test', h(async (req) => { need(req.user); try { const msg = await I.test(req.params.id); return { ok: true, msg }; } catch (e) { bad(e.message || 'Connection failed', 400); } }));
  r.put('/settings/:key', h(async (req, res, next) => {
    const key = req.params.key; if (!['company', 'flags', 'maint', 'alerts'].includes(key)) bad('Unknown setting');
    need(req.user); await db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', ['settings.' + key, JSON.stringify(req.body || {})]);
    await core.audit(req.user.id, 'settings.' + key, key, {});
  }));
  r.put('/settings-alerts-legacy', h(async (req) => { need(req.user); await db.q("INSERT INTO kv(k,v) VALUES('settings.alerts',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(req.body || {})]); }));
  r.post('/users/:id/tax', h(async (req) => { need(req.user, 'finance', 'support'); const st = ['none', 'requested', 'on_file'].includes(req.body.status) ? req.body.status : 'none'; await db.q('UPDATE users SET tax_status=$2 WHERE id=$1', [+req.params.id, st]); await core.audit(req.user.id, 'user.tax', String(req.params.id), { st }); }));
  r.post('/orders/:code/refund', h(async (req) => { need(req.user, 'finance', 'support'); return pay.refund(req.user.id, req.params.code, clean(req.body.note, 300)); }));
  r.post('/tickets/:id/reply', h(async (req) => {
    need(req.user, 'support', 'risk', 'finance');
    const t = await db.one('SELECT * FROM tickets WHERE id=$1', [+req.params.id]); if (!t) bad('Ticket not found', 404);
    const body = clean(req.body.body, 5000); if (!body) bad('Write a reply first');
    await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,body) VALUES($1,$2,true,$3)', [t.id, req.user.id, body]);
    await db.q('UPDATE tickets SET status=$2, updated_at=now(), assignee=COALESCE(assignee,$3) WHERE id=$1', [t.id, req.body.solve ? 'solved' : 'pending', req.user.id]);
    await core.notify(null, t.user_id, 'Support replied: ' + t.subject, body.slice(0, 140), 'support?tkt=' + t.id);
    const u = await db.one('SELECT email, first FROM users WHERE id=$1', [t.user_id]);
    await require('./mail').send(u.email, `Re: ${t.subject} [#${t.id}]`, `Hi ${u.first},\n\n${body}\n\nReply from your dashboard: ${require('./auth').BASE()}/app/support?tkt=${t.id}`, 'ticket');
  }));
  r.post('/tickets/:id/status', h(async (req) => { const st = ['open', 'pending', 'solved'].includes(req.body.status) ? req.body.status : 'open'; await db.q('UPDATE tickets SET status=$2, updated_at=now() WHERE id=$1', [+req.params.id, st]); }));

  r.put('/catalog', h(async (req) => {
    need(req.user);
    const c = req.body; if (!c || !Array.isArray(c.plans) || !c.evalRules) bad('Catalog is missing plans or rules');
    for (const p of c.plans) for (const s of p.sizes) if (!(s.price > 0)) bad(`Every size needs a price (${p.name})`);
    for (const pr of c.promos || []) if (pr.pct > (c.maxPromoPct || 30)) bad(`Promos are capped at ${c.maxPromoPct || 30}% off`);
    await core.saveCatalog(c, req.user.id); await core.audit(req.user.id, 'catalog.update', 'catalog', {});
  }));
  r.put('/content/:key', h(async (req) => { need(req.user, 'support'); await content.set(req.params.key, req.body.value); await core.audit(req.user.id, 'content.update', req.params.key, {}); }));
  r.post('/sim/tick', h(async (req) => { need(req.user); return { trades: await sim.tick() }; }));
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
  return r;
}
module.exports = { router };
