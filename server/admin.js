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

// Reinstate a breached account at its balance from the start of the breach day, whenever the reinstate happens.
// The breach day's loss comes from its trades, so a dispute decided days later still gets the loss back and keeps its floor.
const reinstate = async (id) => {
  const a = await db.one("SELECT id, phase, balance, floor, breach_reason, today_pnl, today_date::text td, ((breached_at AT TIME ZONE 'America/New_York')::date)::text bdt, (SELECT max(day)::text FROM trades WHERE account_id=accounts.id) bd FROM accounts WHERE id=$1", [id]);
  if (!a || a.phase !== 'breached') bad('Only a closed (breached) account can be reinstated');
  // Loss rules break on the last trading day: its trades say what was lost. Closures for other reasons (inactivity, staff) lost nothing.
  const lossRule = /^(Max loss|Daily loss limit)/i.test(a.breach_reason || '');
  const tr = lossRule && a.bd ? await db.one('SELECT count(*)::int n, COALESCE(sum(pnl),0)::float s FROM trades WHERE account_id=$1 AND day=$2', [id, a.bd]) : { n: 0, s: 0 };
  const lost = !lossRule ? 0 : tr.n ? Number(tr.s) : a.td && a.td === a.bdt ? Number(a.today_pnl) : 0;
  const bal = round2(Number(a.balance) - Math.min(0, lost));
  // The floor stays where it was before the breach; only if the restored balance would still sit on or under it is it moved below
  await db.q(`UPDATE accounts SET phase='active', breach_reason=NULL, balance=$2, floor=LEAST(floor, $2::numeric - 1),
    today_pnl = CASE WHEN today_date::text IN ($3, $4) THEN 0 ELSE today_pnl END, halted_today=false, breached_at=NULL WHERE id=$1`, [id, bal, a.bd || '', a.bdt || '']);
};

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
// Who may be the second person for each kind of request (admins can be for all of them). Matches who may do the action itself.
const APPROVERS = { ban: ['support', 'risk'], unban: ['support', 'risk'], kyc: ['risk', 'support'], kycok: ['risk', 'support'], close: ['risk'], reinstate: ['risk'], email: ['support'], adjust: ['risk'] };
const canApprove = (u, p) => !!(u && p && p.by !== u.id && can(u, ...(APPROVERS[p.kind] || [])));
// Returns null when the action should go ahead now; otherwise the waiting request. A request is only completed by a different
// person whose role may approve it, and it leaves the queue the moment it is completed.
async function secondPerson(req, kind, target, payload, desc) {
  if (!(await ruleOn(kind))) return null; const key = kind + ':' + target; const all = await pendingAll(); const p = all[key];
  if (!p) { all[key] = { key, kind, target, payload, desc, by: req.user.id, byName: `${req.user.first} ${req.user.last || ''}`.trim(), at: new Date().toISOString() }; await pendingSave(all); await core.audit(req.user.id, 'approval.request', key, { desc }); return { second: true, msg: 'Sent for a second approval. Another person can approve it in Team > Approvals.' }; }
  if (p.by === req.user.id) bad('A different person must approve this');
  if (!canApprove(req.user, p)) bad('Your role cannot approve this', 403);
  delete all[key]; await pendingSave(all); await core.audit(req.user.id, 'approval.approve', key, { desc: p.desc, first: p.byName, firstId: p.by }); req.approvedFrom = p; return null;
}

// ---- Catalog price and rule approvals. Publishing a catalog whose prices or rules differ from the live one needs approval
// from an active staff member whose role has "Approve Price Changes" (catalog Permissions; admins always can) and who did not
// edit the draft. The approval is bound to a signature of the exact prices and rules being published.
const stable = (v) => (Array.isArray(v) ? '[' + v.map(stable).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}' : JSON.stringify(v === undefined ? null : v));
function catSig(c) {
  c = c || {}; const body = { plans: (c.plans || []).map((p) => ({ id: p.id, kind: p.kind || null, active: !!p.active, addons: p.addons || [], bundleOff: p.bundleOff || {},
    sizes: (p.sizes || []).map((z) => ({ size: Number(z.size), price: Number(z.price), activation: Number(z.activation || 0), reset: z.reset == null ? null : Number(z.reset), floor: Number(z.floor || 0), sched: z.sched && z.sched.price ? { price: Number(z.sched.price), at: z.sched.at || null } : null })) })),
    addons: c.addons || {}, planRules: c.planRules || {}, evalRules: c.evalRules || {}, instantRules: c.instantRules || {}, evalCommon: c.evalCommon || {}, fundedCommon: c.fundedCommon || {}, fundedCaps: c.fundedCaps || {},
    instantCommon: c.instantCommon || {}, instantCaps: c.instantCaps || {}, promos: c.promos || [], autos: c.autos || [], bundles: c.bundles || [], bundleRules: c.bundleRules || [], bundleSamePlan: !!c.bundleSamePlan,
    resetPct: c.resetPct == null ? null : Number(c.resetPct), maxPromoPct: Number(c.maxPromoPct || 30), roles: ((c.x || {}).roles || {}).grid || null };
  return require('crypto').createHash('sha256').update(stable(body)).digest('hex').slice(0, 40);
}
const CAT_ROLE = { finance: 'Finance', risk: 'Risk', support: 'Support', marketing: 'Marketing' };
function canApprovePrice(u, cat) {
  if (!u || !u.id || u.role === 'trader' || (u.status && u.status !== 'active')) return false; if (u.role === 'admin') return true;
  const name = CAT_ROLE[u.role]; if (!name) return false; const R = ((cat && cat.x) || {}).roles;
  if (!R || !R.grid || !Array.isArray(R.caps)) return name === 'Finance' || name === 'Risk'; // the grid's defaults
  const i = R.caps.findIndex((c) => /^approve price/i.test(String(c))); return i >= 0 && !!(R.grid[name] || [])[i];
}
async function priceApprovers(cat) { return (await db.all("SELECT id, role, status, first, last FROM users WHERE role<>'trader' AND status='active'")).filter((u) => canApprovePrice(u, cat)); }
// On when the Team rule is on and at least two people could approve (with fewer nobody else could ever approve)
async function priceRuleOn(cat) { if (!(await ruleOn('price'))) return false; return (await priceApprovers(cat)).length > 1; }
const kvGet = async (k) => ((await db.one('SELECT v FROM kv WHERE k=$1', [k])) || {}).v || null;
async function priceApproval(user, cat) {
  const live = await core.catalog(true); const liveSig = catSig(live); const d = await kvGet('store.catalog.draft'); const cur = !!d && d.base === (live.version || 1);
  const sig = cat ? catSig(cat) : cur ? d.sig || null : liveSig; const on = await priceRuleOn(live); const ap = await kvGet('catalog.approvals');
  const authors = (cur && d.authors) || []; const appr = await priceApprovers(live);
  const ok = ap && ap.sig && ap.sig === sig && !authors.includes(ap.by) && appr.some((u) => u.id === ap.by) ? ap : null;
  return { needs: !!(on && sig !== liveSig), on, matches: cur && !!d.sig && d.sig === sig, approved: ok ? { by: ok.by, name: ok.name, at: ok.at } : null, authors,
    canApprove: canApprovePrice(user, live) && !authors.includes(user.id), approvers: (() => { const names = [...new Set(appr.filter((u) => !authors.includes(u.id)).map((u) => `${u.first} ${u.last || ''}`.trim()))]; return names; })() };
}
// Saving the Back Office draft: the server records who made each change and whose saves changed prices or rules (authors)
async function stampDraft(user, v) {
  if (!v || typeof v !== 'object') return v;
  const live = await core.catalog(true); const prev = await kvGet('store.catalog.draft'); const same = !!prev && prev.base === v.base;
  const prevSig = same ? prev.sig : catSig(live); const sig = v.cat ? catSig(v.cat) : same ? prev.sig || null : null; delete v.cat;
  const pc = new Map((((prev && prev.s) || {}).changes || []).map((c) => [c.id, c])); const name = `${user.first || ''} ${user.last || ''}`.trim() || 'Staff';
  const authors = new Set(same && Array.isArray(prev.authors) ? prev.authors : []); let mine = false;
  ((v.s && v.s.changes) || []).forEach((c) => { const o = pc.get(c.id); if (o && o.whoId) { c.whoId = o.whoId; c.who = o.who; if (!same && c.approve) authors.add(o.whoId); } else { c.whoId = user.id; c.who = name; if (c.approve) mine = true; } });
  if (mine || (prevSig && sig && sig !== prevSig) || (!same && sig && sig !== catSig(live))) authors.add(user.id);
  Object.assign(v, { sig, authors: [...authors] });
  const ap = await kvGet('catalog.approvals'); const ok = ap && ap.sig === sig && !authors.has(ap.by);
  ((v.s && v.s.changes) || []).forEach((c) => { if (c.approve) { c.approved = !!ok; c.by2 = ok ? ap.name : undefined; } });
  return v;
}

function router(h) {
  const r = express.Router();
  // Run one of this router's own routes for a stored approval, as the approving staff member
  const fetchSelf = (path, base) => new Promise((resolve, reject) => {
    const req2 = { method: base.method || 'POST', url: path, originalUrl: '/api/admin' + path, path, headers: {}, body: base.body, user: base.user, query: {}, params: {}, get: () => '', ip: '' };
    const res2 = { statusCode: 200, headersSent: false, status(c) { this.statusCode = c; return this; }, json(o) { this.headersSent = true; if (this.statusCode >= 400) reject(Object.assign(new Error((o && o.error) || 'Failed'), { status: this.statusCode })); else resolve(o); }, setHeader() {}, end() { resolve({ ok: true }); }, send() { resolve({ ok: true }); } };
    r.handle(req2, res2, (e) => reject(e || new Error('Not found')));
  }).catch((e) => { const { HttpError } = require('./util'); if (HttpError && e.status && e.status < 500) throw new HttpError(e.status, e.message); throw e; });

  // Everything the back office boards read, in one call. Cheap enough at early-stage volumes.
  r.get('/boot', h(async (req) => {
    const cat = await core.catalog();
    await require('./comps').sync().catch((e) => console.error('comps sync', e.message));
    // The lists hold the newest rows of each kind, plus every row that still needs a person and anything asked for by id
    // (a deep link or a search result: wu = users, wa = accounts, wp = payouts, wo = orders). Load More raises a size (lu, la, lo, lp).
    const capN = (k, env, def, max) => Math.max(1, Math.min(max, parseInt(req.query[k], 10) || parseInt(process.env[env], 10) || def));
    const CAP = { users: capN('lu', 'BO_CAP_USERS', 2000, 20000), accounts: capN('la', 'BO_CAP_ACCOUNTS', 5000, 50000), orders: capN('lo', 'BO_CAP_ORDERS', 3000, 30000), payouts: capN('lp', 'BO_CAP_PAYOUTS', 2000, 20000) };
    const wl = (k) => String(req.query[k] || '').split(',').map((x) => clean(x, 40)).filter(Boolean).slice(0, 25);
    const wuRaw = wl('wu'); const wantA = wl('wa'); const wantP = wl('wp'); const wantO = wl('wo');
    const wantU = wuRaw.length ? (await db.all('SELECT id FROM users WHERE id = ANY($1::int[]) OR upper(tid) = ANY($2::text[])', [wuRaw.filter((x) => /^\d{1,9}$/.test(x)).map(Number), wuRaw.map((x) => x.toUpperCase())])).map((x) => x.id) : [];
    const [accounts, orders, payouts, tickets, msgs, outbox, auditRows, daily, notes] = await Promise.all([
      db.all(`SELECT a.*, u.email, u.first, u.last, u.tid FROM accounts a JOIN users u ON u.id=a.user_id WHERE a.id IN (SELECT id FROM accounts ORDER BY created_at DESC LIMIT $1) OR a.phase IN ('passed','review') OR a.id = ANY($2::text[]) OR a.user_id = ANY($3::int[])
        OR a.id IN (SELECT account_id FROM payouts WHERE status = ANY($4::text[]) OR code = ANY($5::text[])) ORDER BY a.created_at DESC`, [CAP.accounts, wantA, wantU, core.OPEN_PAY, wantP]),
      db.all(`SELECT o.*, u.email, u.first, u.last, u.tid FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id IN (SELECT id FROM orders ORDER BY created_at DESC LIMIT $1) OR o.code = ANY($2::text[]) OR o.user_id = ANY($3::int[]) OR o.meta ? 'chargeback' ORDER BY o.created_at DESC`, [CAP.orders, wantO, wantU]),
      db.all(`SELECT p.*, u.email, u.first, u.last, u.tid, u.kyc_status, u.tax_status, u.rise_status, u.country FROM payouts p JOIN users u ON u.id=p.user_id WHERE p.id IN (SELECT id FROM payouts ORDER BY requested_at DESC LIMIT $1) OR p.status = ANY($2::text[]) OR p.code = ANY($3::text[]) OR p.user_id = ANY($4::int[]) ORDER BY p.requested_at DESC`, [CAP.payouts, core.OPEN_PAY, wantP, wantU]),
      db.all('SELECT t.*, u.email, u.first, u.last, u.tid FROM tickets t JOIN users u ON u.id=t.user_id ORDER BY t.updated_at DESC LIMIT 1000'),
      db.all('SELECT m.*, u.first AS afirst FROM ticket_msgs m LEFT JOIN users u ON u.id=m.author_id WHERE m.ticket_id IN (SELECT id FROM tickets ORDER BY updated_at DESC LIMIT 1000) ORDER BY m.created_at'),
      db.all('SELECT id,to_email,subject,template,status,created_at FROM outbox ORDER BY created_at DESC LIMIT 300'),
      db.all('SELECT a.*, u.first, u.last, u.email FROM audit a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 300'),
      db.all("SELECT day, sum(pnl)::float pnl, sum(n_trades)::int n, count(*)::int accts FROM days WHERE day > (now() - interval '90 days')::date GROUP BY day ORDER BY day"),
      db.all("SELECT k, v FROM kv WHERE k LIKE 'content.%'")
    ]);
    // Open payouts hold money out of the balance; chargebacks and pauses stop payouts
    const openBy = {}; payouts.filter((p) => core.OPEN_PAY.includes(p.status)).forEach((p) => { const o = openBy[p.account_id] = openBy[p.account_id] || { held: 0, pending: false, failed: false }; o.held += Number(p.gross); if (p.status === 'failed') o.failed = true; else o.pending = true; });
    const cbBy = {}; orders.filter((o) => o.meta && o.meta.chargeback).forEach((o) => { (cbBy[o.user_id] = cbBy[o.user_id] || []).push(o); });
    const acctOut = accounts.map((a) => {
      const stop = R.payoutStop(a, R.cbFor(a, cbBy[a.user_id])); const q = a.kind === 'funded' ? R.payoutQuote(cat, a, Object.assign({ stop }, openBy[a.id] || {})) : null; const rr = R.rulesFor(cat, a); const daily = (a.addons || []).includes('daily');
      const cyc = q ? { profit: q.cycleProfit, best: Number(a.cycle_best), win: a.cycle_win_days, needWin: daily ? 1 : rr.winDays, cons: rr.consOff || daily ? null : rr.consistency, checks: q.checks, owed: q.max, owedAll: Math.max(0, Math.floor(Math.min(q.withdrawable * q.split / 100, q.lifetimeLeft))), withdrawable: q.withdrawable } : null;
      return { id: a.id, comp: a.comp || null, user: a.user_id, tid: a.tid, name: `${a.first} ${a.last}`, email: a.email, plan: a.plan, size: a.size, platform: a.platform, kind: a.kind, phase: a.phase, start: Number(a.start_bal), bal: Number(a.balance), floor: Number(a.floor), peak: Number(a.peak_eod), today: a.today_date === tradeDate() ? Number(a.today_pnl) : 0, halted: a.halted_today, days: a.days_traded, best: Number(a.best_day), payouts: a.payout_count, paid: Number(a.paid_total), resets: a.reset_count, freeResets: a.free_resets, addons: a.addons, breach: a.breach_reason, created: a.created_at, passed: a.passed_at, funded: a.funded_at, breached: a.breached_at, closed: a.closed_at, parent: a.parent_id, maxLoss: rr.maxLoss, dll: rr.dll, newsWin: rr.news ? rr.news.win : 0, target: rr.target || rr.goal || 0, avail: q ? q.max : 0, ready: q ? q.ok : false, winDays: a.cycle_win_days, stop, cycle: cyc, sim: a.sim, steps: a.steps || {}, demo: /@demo\.fundedsky\.test$/.test(a.email) };
    });
    const affB = await require('./affiliates').board().catch((e) => { console.error('affiliate board', e.message); return { sum: {}, ord: {}, self: [], owed: [] }; });
    const kvs = await db.all("SELECT k, v FROM kv WHERE k LIKE 'settings.%' OR k LIKE 'dispute.%' OR k LIKE 'list.%' OR k LIKE 'store.%' OR k LIKE 'refclicks.%'");
    const settings = {}; const disputes = [];
    const lists = {}; const storeV = {}; const clicks = {}; kvs.forEach((r) => { if (r.k.startsWith('settings.')) settings[r.k.slice(9)] = r.v; else if (r.k.startsWith('list.')) lists[r.k.slice(5)] = r.v; else if (r.k.startsWith('store.')) storeV[r.k.slice(6)] = r.k === 'store.apikeys' ? (r.v || []).map((x) => ({ ...x, hash: undefined })) : r.v; else if (r.k.startsWith('refclicks.')) clicks[r.k.slice(10)] = r.v; else disputes.push(r.v); });
    // People: the newest users, all staff, everyone waiting for an identity review, and the owner of every row loaded above, so no board shows a row without its person
    const own = new Set(wantU); [accounts, orders, payouts, tickets].forEach((l) => l.forEach((x) => own.add(x.user_id))); (lists.affiliates || []).forEach((x) => { if (Number.isInteger(+x.user)) own.add(+x.user); }); disputes.forEach((d) => { if (d && Number.isInteger(+d.user)) own.add(+d.user); });
    const users = await db.all(`SELECT id,tid,email,first,last,country,phone,role,verified,status,kyc_status,kyc,tax_status,rise_status,points,ref_code,referred_by,settings,agreements,created_at,last_login FROM users
      WHERE id IN (SELECT id FROM users ORDER BY created_at DESC LIMIT $1) OR role<>'trader' OR kyc_status='submitted' OR id = ANY($2::int[]) ORDER BY created_at DESC`, [CAP.users, [...own]]);
    const methods = await db.all('SELECT * FROM payout_methods WHERE id IN (SELECT id FROM payout_methods ORDER BY created_at DESC LIMIT 2000) OR user_id = ANY($1::int[]) ORDER BY created_at DESC', [[...new Set(wantU.concat(payouts.filter((p) => core.OPEN_PAY.includes(p.status)).map((p) => p.user_id)))]]);
    const integrations = (await I.list()).map((x) => ({ id: x.id, name: x.name, cat: x.cat, enabled: x.enabled, status: x.status, lastError: x.lastError, lastCheck: x.lastCheck }));
    const hooks = await db.all("SELECT provider, event, ok, created_at, CASE WHEN provider LIKE 'out:%' THEN detail ELSE '' END detail FROM webhook_log ORDER BY id DESC LIMIT 200");
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
    // Totals from SQL: the lists above are capped, so boards show these counts instead of counting rows
    const counts = await db.one(`SELECT (SELECT count(*) FROM users WHERE role='trader')::int traders, (SELECT count(*) FROM users)::int users, (SELECT count(*) FROM users WHERE role<>'trader')::int staff, (SELECT count(*) FROM outbox)::int emails,
      (SELECT count(DISTINCT referred_by) FROM users WHERE referred_by IS NOT NULL)::int referrers, (SELECT count(*) FROM users WHERE role='trader' AND points > 0)::int "withCredits",
      (SELECT count(*) FROM orders)::int orders, (SELECT count(*) FROM accounts)::int accounts, (SELECT count(*) FROM payouts)::int payouts, (SELECT count(*) FROM tickets)::int tickets,
      (SELECT count(*) FROM orders WHERE status='paid' AND paid_at >= ${T0})::int "paidToday", (SELECT COALESCE(sum(total),0)::float FROM orders WHERE status='paid' AND paid_at >= ${T0}) "revToday",
      (SELECT COALESCE(sum(total),0)::float FROM orders WHERE status='paid' AND paid_at >= ${T0} - interval '29 days') "rev30", (SELECT count(*) FROM orders WHERE status='paid' AND paid_at >= ${T0} - interval '29 days')::int "paid30", (SELECT COALESCE(sum(total),0)::float FROM orders WHERE status='paid' AND paid_at >= ${T0} - interval '59 days' AND paid_at < ${T0} - interval '29 days') "revPrev30",
      (SELECT count(*) FROM accounts WHERE kind='funded' AND phase IN ('active','review'))::int "fundedLive", (SELECT count(*) FROM accounts WHERE kind='funded' AND phase IN ('active','review') AND balance > start_bal)::int "fundedProfit",
      (SELECT count(*) FROM accounts WHERE kind='evaluation' AND phase='active')::int "evalLive", (SELECT count(*) FROM accounts WHERE phase='passed')::int "passedWaiting",
      (SELECT count(*) FROM users WHERE kyc_status='submitted')::int "kycQueue", (SELECT count(*) FROM tickets WHERE status='open')::int "openTickets",
      (SELECT count(*) FROM payouts WHERE status='requested')::int "toReview", (SELECT count(*) FROM payouts WHERE status='approved')::int "toSend"`);
    counts.loaded = { users: users.length, orders: orders.length, accounts: accounts.length, payouts: payouts.length }; counts.cap = CAP;
    counts.capped = { users: counts.users > users.length, orders: counts.orders > orders.length, accounts: counts.accounts > accounts.length, payouts: counts.payouts > payouts.length, emails: counts.emails > outbox.length };
    return {
      settings, disputes, lists, store: storeV, clicks, integrations, hooks, live, counts, approvals: Object.values(((await db.one("SELECT v FROM kv WHERE k='approvals.pending'")) || { v: {} }).v).map((p) => ({ ...p, canApprove: canApprove(req.user, p) })), payFirst: ((await db.one("SELECT v FROM kv WHERE k='payout.firstok'")) || { v: {} }).v, staffMfa: await db.all("SELECT id, mfa_on FROM users WHERE role<>'trader'"), staffSessions: await db.all("SELECT s.user_id, s.ua, s.ip, s.created_at, s.seen_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE u.role<>'trader' ORDER BY s.seen_at DESC LIMIT 100"), taxOn: await I.on('track1099'), contentDefault: require('./content-seed.json'), newsWeek: content.newsWeek((await content.all()).news), newsRule: require('./ruletable').summary(cat).news,
      me: { id: req.user.id, first: req.user.first, last: req.user.last, email: req.user.email, role: req.user.role },
      now: new Date().toISOString(), today: tradeDate(), payments: pay.mode(), catalog: cat,
      users: users.map((u) => ({ ...u, demo: /@demo\.fundedsky\.test$/.test(u.email), kyc: u.kyc && u.kyc.name ? { name: u.kyc.name, dob: u.kyc.dob, country: u.kyc.country, idType: u.kyc.idType, idLast4: u.kyc.idLast4, at: u.kyc.at } : null })),
      accounts: acctOut,
      orders: orders.map((o) => ({ id: o.id, code: o.code, user: o.user_id, tid: o.tid, name: `${o.first} ${o.last}`, email: o.email, kind: o.kind, lines: o.lines, items: o.items, subtotal: Number(o.subtotal), discount: Number(o.discount), total: Number(o.total), refundAmt: o.status === 'refunded' && o.meta && o.meta.refundAmount != null ? Number(o.meta.refundAmount) : undefined, refundPart: (o.meta && o.meta.refundCredits && o.meta.refundCredits.note) || undefined, promo: o.promo, status: o.status, method: o.pay_method, provider: o.provider, created: o.created_at, paid: o.paid_at, refunded: o.refunded_at, accounts: (o.meta && o.meta.accounts) || [], account: o.meta && o.meta.account, chargeback: (o.meta && o.meta.chargeback) || null, dispute: (o.meta && o.meta.dispute) || null, refundNote: (o.meta && o.meta.refundNote) || '', refundReason: (o.meta && o.meta.refundReason) || '', refundTook: (o.meta && o.meta.refundTook) || '', aff: (affB.ord[o.code] || {}).aff || null, com: (affB.ord[o.code] || {}).com || 0 })),
      aff: { sum: affB.sum, self: affB.self, owed: affB.owed },
      payouts: payouts.map((p) => ({ code: p.code, account: p.account_id, user: p.user_id, tid: p.tid, name: `${p.first} ${p.last}`, email: p.email, country: p.country, kyc: p.kyc_status, tax: p.tax_status, rise: p.rise_status, tx: p.tx_hash, ref: p.provider_ref, hasDest: !!p.dest, tries: p.tries || 0, failedAt: p.failed_at, approvers: (p.approvers || []).map((x) => ({ id: x.id, name: x.name, note: x.note })), number: p.number, gross: Number(p.gross), split: p.split, amount: Number(p.amount), method: p.method, rail: p.rail, status: p.status, batch: p.batch, note: p.note, reviewer: p.reviewed_by, requested: p.requested_at, approved: p.approved_at, paid: p.paid_at, denied: p.denied_at })),
      tickets: tickets.map((t) => ({ id: t.id, user: t.user_id, tid: t.tid, name: `${t.first} ${t.last}`, email: t.email, subject: t.subject, category: t.category, channel: t.channel, status: t.status, priority: t.priority, created: t.created_at, updated: t.updated_at, assignee: t.assignee, review: t.review, rating: t.rating, rated: t.rated_at, msgs: msgs.filter((m) => m.ticket_id === t.id).map((m) => ({ staff: m.staff, internal: m.internal, auto: !!(m.staff && !m.internal && m.author_id == null) || undefined, by: m.afirst, body: m.body, at: m.created_at })) })),
      outbox, audit: auditRows.map((a) => ({ at: a.created_at, by: a.first ? `${a.first} ${a.last}` : 'System', action: a.action, target: a.target, meta: a.meta })),
      methods: methods.map((m) => ({ user: m.user_id, rail: m.rail, label: m.label, def: m.is_default, unlock: m.unlock_at, created: m.created_at })),
      daily, content: Object.fromEntries(notes.map((n) => [n.k.slice(8), n.v]))
    };
  }));

  r.post('/users/:id', h(async (req) => {
    const u = await db.one('SELECT * FROM users WHERE id=$1', [+req.params.id]); if (!u) bad('User not found', 404);
    const b = req.body; const sets = []; const vals = [u.id];
    if (u.role !== 'trader' && (b.status !== undefined || b.kyc_status !== undefined || b.points !== undefined)) { need(req.user); if (u.id === req.user.id && b.status !== undefined) bad('You cannot change your own status'); }
    // Staff credit adjustments: a whole number, a reason, and never below a zero balance
    if (b.points !== undefined) { need(req.user, 'support'); const d = Number(b.points); if (typeof b.points === 'boolean' || String(b.points).trim() === '' || !Number.isInteger(d) || d === 0) bad('Enter a whole number of credits, like 500 or -200'); if (!clean(b.reason, 80)) bad('Add a reason for the adjustment'); if (Number(u.points) + d < 0) bad(`That takes the balance below zero. This trader has ${Number(u.points).toLocaleString('en-US')} credits.`); }
    if (b.role !== undefined) { need(req.user); if (!['trader', 'admin', 'support', 'risk', 'finance'].includes(b.role)) bad('Unknown role'); if (u.id === req.user.id) bad('You cannot change your own role'); vals.push(b.role); sets.push('role=$' + vals.length); }
    if (b.status === 'banned' && u.status !== 'banned') { need(req.user, 'support', 'risk'); const w = await secondPerson(req, 'ban', String(u.id), { status: 'banned', reason: clean(b.reason, 200) }, `Ban ${u.first} ${u.last} (${u.tid})`); if (w) return w; if (req.approvedFrom && !b.reason) b.reason = req.approvedFrom.payload.reason; }
    if (b.status === 'active' && u.status === 'banned') { need(req.user, 'support', 'risk'); const w = await secondPerson(req, 'unban', String(u.id), { status: 'active' }, `Lift the ban on ${u.first} ${u.last} (${u.tid})`); if (w) return w; }
    if (b.kyc_status === 'verified' && u.kyc_status !== 'verified') { need(req.user, 'risk', 'support'); const w = await secondPerson(req, 'kycok', String(u.id), { kyc_status: 'verified' }, `Approve the identity check for ${u.first} ${u.last} (${u.tid}) by hand`); if (w) return w; }
    if (b.kyc_status === 'rejected' && u.kyc_status !== 'rejected') { need(req.user, 'risk', 'support'); const w = await secondPerson(req, 'kyc', String(u.id), { kyc_status: 'rejected', reason: clean(b.reason, 200) }, `Reject identity check for ${u.first} ${u.last} (${u.tid})`); if (w) return w; if (req.approvedFrom && !b.reason) b.reason = req.approvedFrom.payload.reason; }
    if (b.status !== undefined) { need(req.user, 'support', 'risk'); if (!['active', 'suspended', 'banned'].includes(b.status)) bad('Unknown status'); vals.push(b.status); sets.push('status=$' + vals.length); if (b.status === 'banned' || b.status === 'suspended') await db.q('DELETE FROM sessions WHERE user_id=$1', [u.id]); }
    if (b.kyc_status !== undefined) { need(req.user, 'risk', 'support'); if (!['none', 'submitted', 'verified', 'rejected'].includes(b.kyc_status)) bad('Unknown status'); vals.push(b.kyc_status); sets.push('kyc_status=$' + vals.length); }
    if (b.points !== undefined) { need(req.user, 'support'); const d = Number(b.points); const why = clean(b.reason, 80); if (Math.abs(d) > 100000 && req.user.role !== 'admin') bad('Changes over 100,000 credits need an admin', 403);
      await db.tx(async (c) => { const cur = await c.one('SELECT points FROM users WHERE id=$1 FOR UPDATE', [u.id]); if (Number(cur.points) + d < 0) bad('That takes the balance below zero'); await core.points(c, u.id, d, 'Adjusted by staff: ' + why, 'staff'); });
      await core.notify(null, u.id, d > 0 ? `${d.toLocaleString('en-US')} credits added` : `${Math.abs(d).toLocaleString('en-US')} credits removed`, `Our team adjusted your credits: ${why}`, 'rewards'); }
    if (sets.length) await db.q(`UPDATE users SET ${sets.join(',')} WHERE id=$1`, vals);
    const kycNew = b.kyc_status !== undefined && b.kyc_status !== u.kyc_status; const why = clean(b.reason, 200);
    if (b.kyc_status === 'rejected' && kycNew) await db.q("UPDATE users SET kyc = COALESCE(kyc,'{}'::jsonb) || jsonb_build_object('rejectReason', $2::text, 'rejectedAt', now()::text) WHERE id=$1", [u.id, why]);
    if (b.kyc_status === 'verified' && kycNew) require('./mail').t('kycok', u.id, { url: require('./auth').BASE() + '/app#settings?tab=identity' });
    if (b.kyc_status === 'rejected' && kycNew) require('./mail').t('kycno', u.id, { reason: why || 'We could not match your details to a valid identity document.', url: require('./auth').BASE() + '/app#settings?tab=identity' });
    if (b.kyc_status === 'verified' && kycNew) await core.notify(null, u.id, 'Identity verified', 'You can now receive payouts.', 'settings?tab=identity');
    if (b.kyc_status === 'verified' && u.kyc_status !== 'verified') for (const pa of await db.all("SELECT * FROM accounts WHERE user_id=$1 AND phase='passed'", [u.id])) await core.agreementReady(db, pa);
    if (b.status === 'suspended' && u.status !== 'suspended') require('./mail').t('suspended', u.id, { account: 'Your Funded Sky account' });
    // A ban closes every open trading account and tells the trader, as the Ban drawer says
    if (b.status === 'banned' && u.status !== 'banned') { const shut = await db.all("UPDATE accounts SET phase='closed', closed_at=now(), breach_reason='Account closed by Funded Sky' WHERE user_id=$1 AND phase IN ('active','passed','review') RETURNING id", [u.id]); require('./mail').t('banned', u.id, { accounts: shut.length ? shut.map((x) => x.id).join(', ') : 'None open' }); }
    // The staff note for a lock or ban is written when it actually happens (after any second approval), never while it waits
    const staffNote = async (body) => db.q("INSERT INTO kv(k,v) VALUES($1, jsonb_build_array($2::jsonb)) ON CONFLICT (k) DO UPDATE SET v = kv.v || $2::jsonb", ['note.user.' + u.id, JSON.stringify({ by: req.user.first + ' ' + req.user.last, at: new Date().toISOString(), body })]);
    if (b.status === 'banned' && u.status !== 'banned') await staffNote('Banned: ' + (clean(b.reason, 200) || 'No reason given') + (req.approvedFrom ? ` (asked by ${req.approvedFrom.byName}, approved by ${req.user.first} ${req.user.last})` : ''));
    if (b.status === 'active' && u.status === 'banned') await staffNote('Ban lifted' + (clean(b.reason, 200) ? ': ' + clean(b.reason, 200) : '') + (req.approvedFrom ? ` (asked by ${req.approvedFrom.byName}, approved by ${req.user.first} ${req.user.last})` : ''));
    if (b.status === 'active' && u.status === 'suspended') await staffNote('Unlocked' + (clean(b.reason, 200) ? ': ' + clean(b.reason, 200) : ''));
    if (b.status === 'suspended' && u.status !== 'suspended') await staffNote('Locked: ' + (clean(b.reason, 200) || 'No reason given'));
    if (b.kyc_status === 'rejected' && kycNew) await core.notify(null, u.id, 'We could not verify your identity', clean(b.reason, 200) || 'Check your details and submit again, or contact support.', 'settings?tab=identity');
    await core.audit(req.user.id, 'user.update', u.tid, Object.assign({}, b, { was: { status: u.status, kyc_status: u.kyc_status } }));
  }));

  // Balance Adjustments (Risk): one person asks, a different risk reviewer or admin applies it. Registered before /accounts/:id/:action.
  r.post('/accounts/:id/adjust', h(async (req) => { need(req.user, 'risk'); const id = clean(req.params.id, 40); if (!(await db.one('SELECT 1 FROM accounts WHERE id=$1', [id]))) bad('Account not found', 404);
    const amt = round2(Number(req.body.amount)); if (!amt || !Number.isFinite(amt) || Math.abs(amt) > 100000) bad('Enter an amount up to $100,000'); const why = clean(req.body.reason, 200); if (!why) bad('Add a reason');
    const p = (await pendingAll())['adjust:' + id]; if (p && p.by !== req.user.id && Number(p.payload.amount) !== amt) bad(`Another adjustment of $${p.payload.amount} is waiting for this account. Approve or decline it first.`);
    const w = await secondPerson(req, 'adjust', id, { amount: amt, reason: why }, `Adjust ${id} by ${amt < 0 ? '-' : ''}$${Math.abs(amt).toLocaleString('en-US')}: ${why}`); if (w) return w;
    const by = req.approvedFrom ? req.approvedFrom.payload : { reason: why };
    await db.q('UPDATE accounts SET balance=balance+$2 WHERE id=$1', [id, amt]); await core.audit(req.user.id, 'account.adjust', id, { amount: amt, reason: by.reason || why, asked: req.approvedFrom ? req.approvedFrom.byName : undefined }); return { ok: true, applied: true }; }));
  r.post('/accounts/:id/:action', h(async (req) => {
    const id = clean(req.params.id, 40); const a = await db.one('SELECT * FROM accounts WHERE id=$1', [id]); if (!a) bad('Account not found', 404);
    const act = req.params.action;
    if (act === 'breach') { need(req.user, 'risk'); { const w = await secondPerson(req, 'close', id, { reason: clean(req.body.reason, 200) }, `Close ${id}`); if (w) return w; if (req.approvedFrom && req.approvedFrom.payload && req.approvedFrom.payload.reason && !req.body.reason) req.body.reason = req.approvedFrom.payload.reason; } await db.q("UPDATE accounts SET phase='breached', breached_at=now(), breach_reason=$2 WHERE id=$1", [id, clean(req.body.reason, 200) || 'Closed by risk review']); await core.notify(null, a.user_id, `${id} was closed`, clean(req.body.reason, 200) || 'Closed by risk review. Contact support with questions.', 'account?acct=' + id); }
    else if (act === 'reinstate') { need(req.user, 'risk'); if (a.phase !== 'breached') bad('Only a closed (breached) account can be reinstated'); { const w = await secondPerson(req, 'reinstate', id, {}, `Reinstate ${id}`); if (w) return w; } await reinstate(id); await core.notify(null, a.user_id, `${id} was reinstated`, 'Your account is active again at its balance from the start of the day it closed.', 'account?acct=' + id); require('./mail').t('reinstated', a.user_id, { account: id, url: require('./auth').BASE() + '/app#account?acct=' + id }); }
    else if (act === 'pause') { need(req.user, 'risk'); await db.q("UPDATE accounts SET sim = sim || '{\"paused\":true}' WHERE id=$1", [id]); }
    else if (act === 'resume') { need(req.user, 'risk'); await db.q("UPDATE accounts SET sim = sim - 'paused' WHERE id=$1", [id]); }
    else if (act === 'fastforward') { need(req.user); return sim.fastForward(id, parseInt(req.body.days, 10) || 5); }
    else if (act === 'reset') { need(req.user, 'support'); await db.tx((c) => core.resetAccount(c, id, a.user_id)); }
    else if (act === 'fund') { need(req.user, 'risk'); if (a.phase !== 'passed') bad('Account has not passed'); await db.tx((c) => core.activateFunded(c, id, a.user_id, null)); }
    else bad('Unknown action');
    await core.audit(req.user.id, 'account.' + act, id, req.body);
  }));

  r.post('/payouts/:code/rise', h(async (req) => { need(req.user, 'finance'); return require('./flows').riseSend(req.user.id, req.params.code); }));
  r.post('/payouts/:code/back', h(async (req) => { need(req.user, 'finance', 'risk'); const r0 = await db.one("SELECT v FROM kv WHERE k='payout.firstok'"); const v = (r0 && r0.v) || {}; const code = clean(req.params.code, 30); const was = v[code]; delete v[code]; await db.q("INSERT INTO kv(k,v) VALUES('payout.firstok',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(v)]); await core.audit(req.user.id, 'payout.back', code, was ? { cleared: 'first approval', by: was.name, byId: was.id } : {}); }));
  // Finance only: the full destination for a wallet payout, to send it by hand. Every look is logged.
  r.get('/payouts/:code/address', h(async (req) => { need(req.user, 'finance'); const code = clean(req.params.code, 30); const p = await db.one('SELECT p.code, p.dest, p.rail, p.method, p.user_id FROM payouts p WHERE p.code=$1', [code]); if (!p) bad('Payout not found', 404);
    const dest = p.dest ? I.dec(p.dest) : ''; if (!dest) bad('The full address was not saved for this payout. Ask the trader to add the wallet again.');
    await core.audit(req.user.id, 'payout.address', code, {}); return { code, address: dest }; }));
  r.post('/payouts/:code/:action', h(async (req) => {
    const action = req.params.action; const code = clean(req.params.code, 30);
    const kvv = async (k) => ((await db.one('SELECT v FROM kv WHERE k=$1', [k])) || {}).v;
    const po = await db.one('SELECT * FROM payouts WHERE code=$1', [code]); if (!po) bad('Payout not found', 404);
    // Approval decisions are made in Risk; Finance sends, marks failed, retries, and can stop a payout (deny returns the money)
    if (action === 'approve') need(req.user, 'risk'); else if (action === 'deny') need(req.user, 'risk', 'finance'); else need(req.user, 'finance');
    if (['approve', 'pay'].includes(action) && ((await kvv('store.compliance.holds')) || []).includes(po.user_id)) bad('Payouts for this trader are held by Compliance');
    let first = null;
    if (action === 'approve') {
      if (po.status !== 'requested') bad('Only requested payouts can be approved');
      const hold = ((await kvv('store.risk.payhold')) || {})[code];
      if (hold && !req.body.release) bad(`This payout is on hold in Risk${hold.note ? ' (' + hold.note + ')' : ''}. Release the hold to approve it.`);
      const rs = (await kvv('store.risk.settings')) || {};
      const cap = Number(rs.dailyCap == null ? 50000 : rs.dailyCap);
      if (cap > 0) { const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); const done = (await db.one("SELECT COALESCE(sum(amount),0)::float n FROM payouts WHERE approved_at IS NOT NULL AND status IN ('approved','paid','failed') AND (approved_at AT TIME ZONE 'America/New_York')::date = $1::date", [day])).n;
        if (done + Number(po.amount) > cap) bad(`Approving this goes over the daily payout cap of $${cap.toLocaleString('en-US')} ($${done.toLocaleString('en-US')} approved today). Approve it tomorrow or raise the cap in Risk Settings.`); }
      const two = Number(rs.payoutTwo || 5000); const firsts = (await kvv('payout.firstok')) || {}; const f = firsts[code];
      // A second approval keeps the first person's tax decision; it cannot add its own
      const skipTax = f ? !!f.skipTax : !!req.body.skipTax;
      if ((await I.on('track1099')) && ((await kvv('store.compliance.settings')) || {}).holdNoForm !== false) { const u = await db.one('SELECT tax_status FROM users WHERE id=$1', [po.user_id]); if (u && u.tax_status !== 'on_file' && !skipTax) bad('No tax form on file for this trader yet'); }
      if (Number(po.amount) > two && (await ruleOn('payout'))) {
        if (!f) { firsts[code] = { id: req.user.id, name: req.user.first, note: clean(req.body.note, 300), skipTax, at: new Date().toISOString() }; await db.q("INSERT INTO kv(k,v) VALUES('payout.firstok',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(firsts)]); await core.audit(req.user.id, 'payout.approve1', code, { skipTax }); return { second: true, by: req.user.first, msg: 'First approval saved. A different person in Risk must give the second approval.' }; }
        if (f.id === req.user.id) bad('A different person must give the second approval');
        first = { id: f.id, name: f.name, note: f.note || '', at: f.at || null };
      }
      const out = await core.reviewPayout(req.user.id, code, 'approve', clean(req.body.note, 300), null, { first });
      if (f) { delete firsts[code]; await db.q("UPDATE kv SET v=$1 WHERE k='payout.firstok'", [JSON.stringify(firsts)]); }
      if (hold) { const ph = (await kvv('store.risk.payhold')) || {}; delete ph[code]; await db.q("UPDATE kv SET v=$1, updated_at=now() WHERE k='store.risk.payhold'", [JSON.stringify(ph)]); await core.audit(req.user.id, 'payout.release', code, { note: hold.note }); }
      return out;
    }
    let tx = null;
    if (action === 'pay') { tx = clean(req.body.tx, 120); if (po.status !== 'approved') bad(po.status === 'paid' ? 'This payout was already sent' : 'Approve the payout first');
      if (/usdc/i.test(po.rail) && !/^0x[a-fA-F0-9]{64}$/.test(tx)) bad('Paste the transaction hash from the wallet (0x and 64 characters)');
      if (/rise/i.test(po.rail) && tx.length < 4) bad('Add the Rise payment reference'); }
    // A denied payout always carries a reason: it is kept on record and shown to the trader
    if (action === 'deny' && !clean(req.body.note, 300).trim()) bad('Add a note that says why this payout is denied');
    return core.reviewPayout(req.user.id, code, action, clean(req.body.note, 300), null, { tx: tx || null });
  }));
  // ---- Payout batches: approved payouts sent together. Over the limit, a second person must approve. ----
  const store = async (k) => { const r2 = await db.one('SELECT v FROM kv WHERE k=$1', ['store.' + k]); return r2 ? r2.v : null; };
  const putStore = (k, v) => db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', ['store.' + k, JSON.stringify(v)]);
  async function sendBatch(actorId, bt) {
    const rise = await I.on('rise'); const res = { sent: [], failed: [], held: [] };
    for (const code of bt.codes) {
      const p = await db.one('SELECT * FROM payouts WHERE code=$1', [code]); if (!p || p.status !== 'approved') continue;
      // Nothing is marked sent unless money actually moved: wallet payouts are sent by hand, and Rise needs its connection
      try { await core.canSend(code); } catch (e) { res.held.push({ code, why: e.message }); continue; }
      if (!/rise/i.test(p.rail)) { res.held.push({ code, why: 'Send by hand, then use Mark Sent with the transaction hash' }); continue; }
      if (!rise) { res.held.push({ code, why: 'Rise is not connected' }); continue; }
      try {
        await require('./flows').riseSend(actorId, code, bt.id); res.sent.push(code);
      } catch (e) { await core.reviewPayout(actorId, code, 'fail', String(e.message || e).slice(0, 200)).catch(() => {}); res.failed.push(code); }
    }
    return res;
  }
  r.post('/batches', h(async (req) => { need(req.user, 'finance'); const codes = (req.body.codes || []).map((c2) => clean(c2, 30));
    if (((await store('risk.switches')) || {}).payouts) bad('Payouts are paused in Risk, Platform Health. Turn Pause Payouts off to send.');
    const ps0 = await db.all("SELECT p.code, p.amount, u.tax_status FROM payouts p JOIN users u ON u.id=p.user_id WHERE p.code = ANY($1) AND p.status='approved'", [codes]); if (!ps0.length) bad('Pick payouts that are ready to send');
    // A payout belongs to one open batch at a time
    const inOpen = new Set(((await store('batches')) || []).filter((x) => x.status !== 'sent').flatMap((x) => x.codes || [])); const ps = ps0.filter((p) => !inOpen.has(p.code));
    if (!ps.length) bad(ps0.length === 1 ? `${ps0[0].code} is already in an open batch` : 'Every selected payout is already in an open batch');
    const taxOn = await I.on('track1099'); const ok = ps.filter((p) => !taxOn || p.tax_status === 'on_file');
    if (!ok.length) bad('Every selected payout is missing a tax form');
    const fs2 = (await store('finance.settings')) || {}; const limit = Number(fs2.twoAbove || 5000); const amount = ok.reduce((s2, p) => s2 + Number(p.amount), 0);
    const list = (await store('batches')) || []; const id = 'PB-' + String(100 + list.length + 1);
    // The limit counts every batch sent today without a second person (Eastern days), so splitting a batch does not get around it
    const etDay = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); const today = etDay(Date.now());
    const soloToday = list.filter((x) => x.at && etDay(x.at) === today && x.status !== 'waiting' && !x.approver).reduce((s2, x) => s2 + Number(x.amount || 0), 0);
    const bt = { id, codes: ok.map((p) => p.code), n: ok.length, amount, by: req.user.id, byName: req.user.first + ' ' + req.user.last, at: new Date().toISOString(), status: amount + soloToday > limit && (await ruleOn('batch')) ? 'waiting' : 'sending', held: ps.length - ok.length, dayTotal: amount + soloToday, skipped: ps0.length - ps.length };
    if (bt.status === 'sending') { const r3 = await sendBatch(req.user.id, bt); bt.status = !r3.sent.length && !r3.failed.length ? 'manual' : r3.failed.length || r3.held.length ? 'partial' : 'sent'; bt.sentAt = new Date().toISOString(); bt.fail = r3.failed.length; bt.sentN = r3.sent.length; bt.manual = r3.held; }
    list.unshift(bt); await putStore('batches', list); await core.audit(req.user.id, 'payout.batch', id, { amount, n: bt.n }); return bt; }));
  r.post('/batches/:id/approve', h(async (req) => { need(req.user, 'finance'); const list = (await store('batches')) || []; const bt = list.find((x) => x.id === req.params.id); if (!bt) bad('Batch not found', 404); if (bt.status !== 'waiting') bad('This batch is not waiting for approval');
    if (bt.by === req.user.id && !(await soloStaff())) bad('A second person must approve this batch'); if (((await store('risk.switches')) || {}).payouts) bad('Payouts are paused in Risk, Platform Health. Turn Pause Payouts off to send.'); bt.approver = req.user.first + ' ' + req.user.last;
    const r3 = await sendBatch(req.user.id, bt); bt.status = !r3.sent.length && !r3.failed.length ? 'manual' : r3.failed.length || r3.held.length ? 'partial' : 'sent'; bt.sentAt = new Date().toISOString(); bt.fail = r3.failed.length; bt.sentN = r3.sent.length; bt.manual = r3.held; await putStore('batches', list); await core.audit(req.user.id, 'payout.batch.approve', bt.id, {}); return bt; }));
  r.post('/apikeys', h(async (req) => { need(req.user); const raw = 'fsk_' + require('crypto').randomBytes(24).toString('hex'); const row = await db.one("SELECT v FROM kv WHERE k='store.apikeys'"); const keys = (row && row.v) || [];
    keys.push({ id: 'key_' + require('crypto').randomBytes(6).toString('hex'), name: clean(req.body.name, 60) || 'API key', hash: require('crypto').createHash('sha256').update(raw).digest('hex'), tail: raw.slice(-4), access: 'Read exports', by: req.user.first + ' ' + req.user.last, at: new Date().toISOString(), last: null }); await putStore('apikeys', keys); await core.audit(req.user.id, 'apikey.create', clean(req.body.name, 60), {}); return { key: raw }; }));
  // Keys are found by id. Older keys have none: then the list position must still match the key's last 4 and creation time.
  const keyFind = (keys, ref, body) => { const i = /^key_/.test(ref) ? keys.findIndex((x) => x.id === ref) : /^\d+$/.test(ref) && keys[+ref] && !keys[+ref].id && keys[+ref].tail === String((body || {}).tail || '') && keys[+ref].at === String((body || {}).at || '') ? +ref : -1; if (i < 0) bad('Key not found. Reload the page and try again.', 404); return i; };
  r.post('/apikeys/:i/revoke', h(async (req) => { need(req.user); const row = await db.one("SELECT v FROM kv WHERE k='store.apikeys'"); const keys = (row && row.v) || []; const k = keys[keyFind(keys, req.params.i, req.body)]; if (k.revoked) bad('This key is already revoked'); k.revoked = new Date().toISOString(); await putStore('apikeys', keys); await core.audit(req.user.id, 'apikey.revoke', k.name, {}); }));
  r.post('/apikeys/:i/delete', h(async (req) => { need(req.user); const row = await db.one("SELECT v FROM kv WHERE k='store.apikeys'"); const keys = (row && row.v) || []; const i = keyFind(keys, req.params.i, req.body); if (!keys[i].revoked) bad('Revoke the key before you delete it'); const [k] = keys.splice(i, 1); await putStore('apikeys', keys); await core.audit(req.user.id, 'apikey.delete', k.name, {}); }));
  // ---- Outgoing webhooks: the list lives in store.webhooks.out, the signing secrets in secret.webhooks (never sent to the browser) ----
  const HOOK_EVTS = Object.values(I.EVN);
  const hookList = async () => (((await db.one("SELECT v FROM kv WHERE k='store.webhooks.out'")) || {}).v || []).map((x) => Object.assign({}, x, { id: I.hookId(x) }));
  const hookSave = async (list) => { await db.q("INSERT INTO kv(k,v) VALUES('store.webhooks.out',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(list)]); };
  const hookSecret = async (id) => { const raw = 'whsec_' + require('crypto').randomBytes(24).toString('hex'); const all = await I.hookSecrets(); all[id] = I.enc(raw); await db.q("INSERT INTO kv(k,v) VALUES('secret.webhooks',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(all)]); return raw; };
  const hookFind = async (id) => { const list = await hookList(); const i = list.findIndex((x) => x.id === id); if (i < 0) bad('Endpoint not found', 404); return { list, i }; };
  // Endpoints with ids, and how each one has done (by endpoint, not by host): last 7 days of deliveries
  r.get('/webhooks', h(async (req) => { need(req.user); const list = await hookList(); const raw = (((await db.one("SELECT v FROM kv WHERE k='store.webhooks.out'")) || {}).v || []); if (raw.some((x) => !x.id)) await hookSave(list);
    const rows = await db.all("SELECT ok, detail, created_at FROM webhook_log WHERE provider LIKE 'out:%' AND created_at > now() - interval '7 days' ORDER BY id DESC LIMIT 3000"); const secrets = await I.hookSecrets();
    return { events: HOOK_EVTS, list: list.map((x) => { const mine = rows.filter((r2) => { let d = {}; try { d = JSON.parse(r2.detail || '{}'); } catch (e) { d = {}; } return d.hook ? d.hook === x.id : d.url === x.url; }); const ok = mine.filter((r2) => r2.ok).length;
      return { id: x.id, url: x.url, events: x.events || [], on: x.on !== false, at: x.at, by: x.by || '', signed: !!secrets[x.id], n: mine.length, ok, rate: mine.length ? ok / mine.length * 100 : null, last: mine[0] ? { ok: mine[0].ok, at: mine[0].created_at } : null }; }) }; }));
  r.put('/store/webhooks.out', (req, res) => res.status(400).json({ error: 'Change endpoints from Settings > Webhooks.' }));
  r.post('/webhooks', h(async (req) => { need(req.user); const url = clean(req.body.url, 300); let pu = null; try { pu = new URL(url); } catch (e) { pu = null; } if (!pu || pu.protocol !== 'https:' || !pu.hostname || /\s/.test(url) || pu.username || pu.password) bad('Use a full https address');
    const events = [].concat(req.body.events || []).map((x) => clean(x, 40)).filter((x) => HOOK_EVTS.includes(x)); if (!events.length) bad('Pick at least one event');
    const list = await hookList(); if (list.some((x) => x.url === url)) bad('This address is already on the list'); const hk = { id: 'wh_' + require('crypto').randomBytes(6).toString('hex'), url, events: [...new Set(events)], on: true, at: new Date().toISOString(), by: req.user.first + ' ' + req.user.last };
    const secret = await hookSecret(hk.id); hk.signed = true; list.push(hk); await hookSave(list); await core.audit(req.user.id, 'webhook.create', url, { events: hk.events }); return { id: hk.id, secret }; }));
  r.post('/webhooks/:id/toggle', h(async (req) => { need(req.user); const { list, i } = await hookFind(req.params.id); list[i].on = list[i].on === false; await hookSave(list); await core.audit(req.user.id, 'webhook.' + (list[i].on ? 'on' : 'off'), list[i].url, {}); return { on: list[i].on }; }));
  r.post('/webhooks/:id/remove', h(async (req) => { need(req.user); const { list, i } = await hookFind(req.params.id); const [gone] = list.splice(i, 1); await hookSave(list); const all = await I.hookSecrets(); delete all[gone.id]; await db.q("INSERT INTO kv(k,v) VALUES('secret.webhooks',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(all)]); await core.audit(req.user.id, 'webhook.remove', gone.url, {}); }));
  r.post('/webhooks/:id/secret', h(async (req) => { need(req.user); const { list, i } = await hookFind(req.params.id); const secret = await hookSecret(list[i].id); list[i].signed = true; await hookSave(list); await core.audit(req.user.id, 'webhook.secret', list[i].url, {}); return { secret }; }));
  // Test: one endpoint (id) or every endpoint that takes the event (kind). Says plainly when nothing was sent.
  r.post('/webhooks/test', h(async (req) => { need(req.user); const id = clean(req.body.id, 40); const list = await hookList(); const h0 = id ? list.find((x) => x.id === id) : null; if (id && !h0) bad('Endpoint not found', 404);
    const kind = clean(req.body.kind, 30) || 'order'; const ev = h0 ? (h0.events || [])[0] : I.EVN[kind] || kind; const k2 = Object.keys(I.EVN).find((k) => I.EVN[k] === ev) || kind;
    const out = await I.outHooks(k2, 'Test event from the Funded Sky back office', { test: true, note: 'This is a test event. No order, payout or account changed.' }, h0 ? h0.id : null);
    if (!out.length) bad(h0 ? 'This endpoint is turned off or takes no events' : 'No endpoint is turned on for this event, so nothing was sent');
    return { sent: out.length, ok: out.filter((x) => x.ok).length, code: out[0].code, ms: out[0].ms, err: out[0].err || '' }; }));
  r.post('/risk/scan', h(async (req) => { need(req.user, 'risk'); const out = await require('./riskscan').scan(); await core.audit(req.user.id, 'risk.scan', '', {}); return out; }));
  r.get('/risk/trades', h(async (req) => { const since = req.query.days ? +req.query.days : 1; return db.all(`SELECT t.account_id, t.ts, t.instrument, t.side, t.qty, t.pnl::float pnl, t.hold_min, a.user_id FROM trades t JOIN accounts a ON a.id=t.account_id WHERE t.ts > now() - ($1 || ' days')::interval ORDER BY t.ts DESC LIMIT 3000`, [String(Math.min(30, since))]); }));
  r.use('/tickets/:id', (req, res, next) => (req.params.id === 'sig' || /^\d{1,9}$/.test(req.params.id) ? next() : res.status(404).json({ error: 'Ticket not found' })));
  // Trader search for the Support board's New Ticket drawer: every trader, by name, email or ID
  r.get('/ticket-traders', h(async (req) => { need(req.user, 'support', 'risk', 'finance'); const q = clean(req.query.q, 80).replace(/^#/, '').toLowerCase(); if (q.length < 2) return { rows: [] }; const like = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
    const rows = await db.all("SELECT id, tid, first, last, email FROM users WHERE role='trader' AND (lower(first || ' ' || last) LIKE $1 OR lower(email) LIKE $1 OR lower(COALESCE(tid::text,'')) LIKE $1 OR id::text = $2) ORDER BY (id::text = $2) DESC, first, last LIMIT 20", [like, q]);
    return { rows: rows.map((u) => ({ id: u.id, tid: u.tid || String(u.id), name: `${u.first} ${u.last || ''}`.trim(), email: u.email })) }; }));
  r.post('/tickets', h(async (req) => { need(req.user, 'support', 'risk', 'finance'); const b = req.body; const uid = /^\d{1,9}$/.test(String(b.user)) ? +b.user : 0; const u = uid ? await db.one('SELECT id, email, first FROM users WHERE id=$1', [uid]) : null; if (!u) bad('Pick a trader');
    const subj = typeof b.subject === 'string' ? clean(b.subject, 160) : ''; if (!subj) bad('Add a subject'); const body = typeof b.body === 'string' ? clean(b.body, 5000) : ''; if (!body || new RegExp('^(hi|hello|hey|dear)(\\s+' + String(u.first || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')?\\s*[,!.:]?$', 'i').test(body)) bad('Write a message for the trader');
    const cat = await require('./support').topic(b.category); if (!cat) bad('Pick a topic from the list');
    const t = await db.tx(async (c) => { const x = await c.one("INSERT INTO tickets(user_id,subject,category,channel,status,priority,assignee) VALUES($1,$2,$3,'Email','pending',$4,$5) RETURNING id", [u.id, subj, cat, ['low', 'normal', 'high', 'urgent'].includes(b.priority) ? b.priority : 'normal', req.user.id]); await c.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,body) VALUES($1,$2,true,$3)', [x.id, req.user.id, body]); return x; });
    await core.notify(null, u.id, 'Support: ' + subj, body.slice(0, 140), 'support?tkt=' + t.id); await require('./mail').send(u.email, `${subj} [#${t.id}]`, `${/^(hi|hello|hey|dear)\b/i.test(body) ? '' : `Hi ${u.first},\n\n`}${body}\n\nReply from your dashboard: ${require('./auth').BASE()}/app#support?tkt=${t.id}`, 'ticket');
    await core.audit(req.user.id, 'ticket.create', String(t.id), {}); return { id: t.id }; }));
  // ---- Store: board settings and lists kept for each board ----
  r.put('/store/:key', h(async (req) => { const k = clean(req.params.key, 60); if (!/^[a-z0-9_.-]+$/i.test(k)) bad('Bad key'); if (k === 'competitions.winners' || k === 'competitions.dq') bad('Winners and disqualifications are changed from the Competitions board'); need(req.user, ...storeRoles(k)); const A = require('./auth');
    if (k === 'team.security' && req.body.value && req.body.value.ipOnly) { const nets = ((await db.one("SELECT v FROM kv WHERE k='store.team.networks'")) || {}).v || []; if (!nets.some((x) => A.netRule(x))) bad('Add at least one network first'); if (!nets.some((x) => A.ipIn(req.ip, x))) bad('Your current network is not on the list. Add it first so you are not locked out.'); }
    // Allowed networks: only real addresses or ranges, and while the allowlist is on the list must keep the network you are on now
    if (k === 'team.networks') { if (!Array.isArray(req.body.value)) bad('Send a list of networks'); const list = [...new Set(req.body.value.map((x) => String(x == null ? '' : x).trim()).filter(Boolean))].slice(0, 100);
      const wrong = list.find((x) => !A.netRule(x)); if (wrong) bad(`${clean(wrong, 60)} is not an IP address or range. Use one like 203.0.113.7, 203.0.113.0/24 or 2001:db8::/48.`);
      const sec = ((await db.one("SELECT v FROM kv WHERE k='store.team.security'")) || {}).v || {};
      if (sec.ipOnly) { if (!list.length) bad('Turn off Only Allow Sign-In From These Networks before you remove the last network.'); if (!list.some((x) => A.ipIn(req.ip, x))) bad(`This would lock you out: your current network (${A.normIp(req.ip)}) would not be on the list. Keep it, or turn off the allowlist first.`); }
      req.body.value = list; }
    // Support can add refund requests for Finance, but cannot change or remove the ones already in the queue
    if (k === 'finance.refunds' && !can(req.user, 'finance')) { const cur = ((await db.one("SELECT v FROM kv WHERE k='store.finance.refunds'")) || {}).v || []; const seen = new Set(cur.map((x) => JSON.stringify(x)));
      const nv = Array.isArray(req.body.value) ? req.body.value : []; const add = nv.filter((x) => x && typeof x === 'object' && !seen.has(JSON.stringify(x)) && !cur.some((y) => y && y.order === x.order)).slice(0, 5);
      if (!add.length) { if (JSON.stringify(nv) === JSON.stringify(cur)) return { ok: true }; bad('You can add refund requests here. Finance handles the rest of the list.', 403); }
      req.body.value = cur.concat(add.map((x) => ({ order: clean(x.order, 30), reason: clean(x.reason, 300), ticket: x.ticket ? +x.ticket || undefined : undefined, by: `${req.user.first} ${req.user.last || ''}`.trim(), byId: req.user.id, at: new Date().toISOString() }))); }
    if (k === 'catalog.versions' && Array.isArray(req.body.value)) req.body.value = req.body.value.slice(0, 15); if (k === 'affiliate.payments') bad('Affiliate payouts are recorded with Pay All Due in Affiliates, Payouts. The list cannot be edited by hand.', 403); const holdsBefore = k === 'risk.payhold' ? ((await db.one('SELECT v FROM kv WHERE k=$1', ['store.' + k])) || {}).v || {} : null; if (k === 'catalog.draft') req.body.value = await stampDraft(req.user, req.body.value); await putStore(k, req.body.value);
    // A payout newly put on hold in Risk: the trader gets the Payout On Hold email
    if (holdsBefore) { const added = Object.keys(req.body.value || {}).filter((c2) => !holdsBefore[c2]); if (added.length) for (const p of await db.all("SELECT code, user_id FROM payouts WHERE code = ANY($1) AND status='requested'", [added])) require('./mail').t('payhold', p.user_id, { url: require('./auth').BASE() + '/app#payouts' }); }
    await core.audit(req.user.id, 'store.' + k, k, {}); if (k === 'catalog.draft') return { ok: true, draft: req.body.value && { changes: ((req.body.value.s || {}).changes || []).map((c) => ({ id: c.id, who: c.who, whoId: c.whoId, approved: c.approved, by2: c.by2 })) }, approval: await priceApproval(req.user) }; }));
  // ---- Packs and credits ----
  const PK = require('./packs');
  r.get('/packs', h(async (req) => { need(req.user, 'support', 'finance', 'risk'); return PK.adminData(); }));
  r.put('/packs/config', h(async (req) => { need(req.user); return { cfg: await PK.saveConfig(req.body || {}, req.user.id) }; }));
  r.put('/packs/enabled', h(async (req) => { need(req.user); await PK.setEnabled(!!(req.body || {}).on, req.user.id); return { on: await PK.enabled() }; }));
  r.get('/packs/traders', h(async (req) => { need(req.user, 'support', 'finance', 'risk'); return { list: await PK.findTrader(req.query.q) }; }));
  r.get('/packs/traders/:id', h(async (req) => { need(req.user, 'support', 'finance', 'risk'); return PK.traderAdmin(req.params.id); }));
  r.post('/packs/traders/:id/grant', h(async (req) => { need(req.user, 'support'); return PK.grant(req.user, req.params.id, req.body || {}); }));
  r.post('/packs/cards/:id/revoke', h(async (req) => { need(req.user, 'support'); return PK.revokeCard(req.user, req.params.id, (req.body || {}).reason); }));
  r.post('/packs/owned/:id/revoke', h(async (req) => { need(req.user, 'support'); return PK.revokePack(req.user, req.params.id, (req.body || {}).reason); }));
  // Refunding a credits order: what was spent and what can go back, and the refund with the choice to take back what the credits bought
  r.get('/packs/orders/:code/refund-info', h(async (req) => { need(req.user, 'finance', 'support'); const o = await db.one('SELECT * FROM orders WHERE code=$1', [clean(req.params.code, 30)]); if (!o) bad('Order not found', 404); if (o.kind !== 'credits') bad('This is not a credits order'); if (o.status !== 'paid') bad('Only paid orders can be refunded'); return PK.refundInfo(o); }));
  r.post('/packs/orders/:code/refund', h(async (req) => { need(req.user, 'finance', 'support'); const b = req.body || {}; const o = await db.one('SELECT kind, total FROM orders WHERE code=$1', [clean(req.params.code, 30)]); if (!o) bad('Order not found', 404); if (o.kind !== 'credits') bad('This is not a credits order');
    if (['support', 'risk'].includes(req.user.role)) { const lim = await require('./support').refundLimit(req.user); if (Number(o.total) > lim) bad(`This refund is over your limit of $${lim}. Send it for approval instead.`, 403); }
    return pay.refund(req.user.id, req.params.code, clean(b.note, 300), { takeBack: b.takeBack === true, confirm: true }); }));
  // Integrations (admin only)
  r.get('/integrations', h(async (req) => { need(req.user); const hooks = await db.all('SELECT * FROM webhook_log ORDER BY id DESC LIMIT 100'); const alerts = await db.one("SELECT v FROM kv WHERE k='settings.alerts'"); return { list: await I.list(), hooks, alerts: alerts ? alerts.v : {}, base: require('./auth').BASE() }; }));
  r.put('/integrations/:id', h(async (req) => { need(req.user); await I.save(req.params.id, req.body, req.user.id); await require('./payments').refreshMode(); await core.audit(req.user.id, 'integration.update', req.params.id, { enabled: req.body.enabled }); return { list: await I.list() }; }));
  r.post('/integrations/:id/test', h(async (req) => { need(req.user); try { const msg = await I.test(req.params.id); return { ok: true, msg }; } catch (e) { bad(e.message || 'Connection failed', 400); } }));
  // Company Details: keep the known fields, one support email key (older saves used supportEmail / legalName)
  r.put('/settings/company', (req, res, next) => { const b = req.body || {}; const v = { legal: clean(b.legal || b.legalName, 160), brand: clean(b.brand, 60) || 'Funded Sky', address: clean(b.address, 240), taxId: clean(b.taxId, 60), support: clean(b.support || b.supportEmail, 160).toLowerCase() }; if (v.support && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.support)) return res.status(400).json({ error: 'Enter a valid support email' }); req.body = v; next(); });
  r.put('/settings/:key', h(async (req, res, next) => {
    const key = req.params.key; if (!['company', 'flags', 'maint', 'alerts', 'affiliate'].includes(key)) bad('Unknown setting');
    need(req.user); await db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', ['settings.' + key, JSON.stringify(req.body || {})]);
    await core.audit(req.user.id, 'settings.' + key, key, {});
  }));
  r.put('/settings-alerts-legacy', h(async (req) => { need(req.user); await db.q("INSERT INTO kv(k,v) VALUES('settings.alerts',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(req.body || {})]); }));
  r.post('/users/:id/tax', h(async (req) => { need(req.user, 'finance', 'support', 'risk'); const st = req.body.status === undefined ? 'requested' : req.body.status; if (!['none', 'requested', 'on_file'].includes(st)) bad('Unknown tax form status'); if (!(await db.one("SELECT 1 FROM users WHERE id=$1 AND role='trader'", [+req.params.id || 0]))) bad('Trader not found', 404); await db.q('UPDATE users SET tax_status=$2 WHERE id=$1', [+req.params.id, st]); await core.audit(req.user.id, 'user.tax', String(req.params.id), { st });
    if (st === 'requested') { const on = await I.on('track1099'); await core.notify(null, +req.params.id, 'Please send your tax form', 'We need a tax form on file before we can send payouts. Open Settings, Tax Form to fill it in.', 'settings?tab=tax'); require('./mail').t('taxform', +req.params.id, { url: require('./auth').BASE() + '/app#settings?tab=tax' }); return { sent: on, emailed: true }; } }));
  r.post('/orders/:code/refund', h(async (req) => { need(req.user, 'finance', 'support');
    if (['support', 'risk'].includes(req.user.role)) { const o = await db.one('SELECT total FROM orders WHERE code=$1', [clean(req.params.code, 30)]); const lim = await require('./support').refundLimit(req.user); if (o && Number(o.total) > lim) bad(`This refund is over your limit of $${lim}. Send it for approval instead.`, 403); }
    return pay.refund(req.user.id, req.params.code, clean(req.body.note, 300), { confirm: req.body.confirm === true }); }));
  r.get('/orders/:code/refund-preview', h(async (req) => { need(req.user, 'finance', 'support'); return pay.refundPreview(req.params.code); }));
  r.get('/tickets/sig', h(async () => { const r = await db.one('SELECT (SELECT count(*)::int FROM tickets) n, (SELECT COALESCE(max(id),0) FROM ticket_msgs) m, (SELECT max(updated_at) FROM tickets) u'); return { sig: `${r.n}.${r.m}.${r.u ? new Date(r.u).getTime() : 0}` }; }));
  r.post('/tickets/:id/reply', h(async (req) => {
    need(req.user, 'support', 'risk', 'finance');
    const t = await db.one('SELECT * FROM tickets WHERE id=$1', [+req.params.id]); if (!t) bad('Ticket not found', 404);
    const body = clean(req.body.body, 5000); if (!body) bad('Write a reply first');
    await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,body) VALUES($1,$2,true,$3)', [t.id, req.user.id, body]);
    await db.q('UPDATE tickets SET status=$2, updated_at=now(), assignee=COALESCE(assignee,$3) WHERE id=$1', [t.id, req.body.solve ? 'solved' : 'pending', req.user.id]);
    await core.notify(null, t.user_id, 'Support replied: ' + t.subject, body.length > 140 ? body.slice(0, 139).replace(/\s+\S*$/, '') + '…' : body, 'support?tkt=' + t.id);
    const u = await db.one('SELECT email, first FROM users WHERE id=$1', [t.user_id]);
    await require('./mail').sendT('reply', u.email, { first_name: u.first, ticket: t.id, subject: t.subject, agent: req.user.first, snippet: body.slice(0, 90), message: body, url: `${require('./auth').BASE()}/app#support?tkt=${t.id}` }, { uid: t.user_id });
    if (req.body.solve && t.status !== 'solved') await require('./support').onSolved(t);
    await core.audit(req.user.id, 'ticket.reply', String(t.id), { solve: !!req.body.solve });
  }));
  r.post('/tickets/:id/status', h(async (req) => { need(req.user, 'support', 'risk', 'finance'); const st = ['open', 'pending', 'solved', 'hold'].includes(req.body.status) ? req.body.status : 'open'; const t = await db.one('SELECT * FROM tickets WHERE id=$1', [+req.params.id]); if (!t) bad('Ticket not found', 404); await db.q('UPDATE tickets SET status=$2, updated_at=now() WHERE id=$1', [t.id, st]); if (st === 'solved' && t.status !== 'solved') await require('./support').onSolved(t); await core.audit(req.user.id, 'ticket.status', String(t.id), { status: st }); }));

  r.put('/catalog', h(async (req) => {
    need(req.user);
    const c = req.body; if (!c || !Array.isArray(c.plans) || !c.evalRules) bad('Catalog is missing plans or rules');
    const cur = await core.catalog(true);
    if (Number(c.version) !== (cur.version || 1) + 1) bad(`The catalog was published as v${cur.version} after this page was opened, so this would overwrite those changes. Reload the page to get v${cur.version}; your draft is kept.`, 409);
    for (const p of c.plans) for (const s of p.sizes) if (!(s.price > 0)) bad(`Every size needs a price (${p.name})`);
    // Every size on sale needs its trading rules and payout limits, or accounts of that size can't be priced or paid
    const kK = (n) => '$' + Math.round(n / 1000) + 'K';
    for (const p of c.plans) for (const s of p.sizes) { const inst = p.id === 'instant' || p.kind === 'funded';
      const R = (inst ? c.instantRules : c.evalRules) || {}, CAP = (inst ? c.instantCaps : c.fundedCaps) || {};
      if (!R[s.size]) bad(`${p.short || p.name} ${kK(s.size)} has no rule set. Create one in Rule Sets first.`);
      if (!CAP[s.size] || !(CAP[s.size].first > 0)) bad(`${p.short || p.name} ${kK(s.size)} has no payout limits. Add them in Rule Sets first.`); }
    // The promotion cap covers codes and automatic promotions
    const cap = Number(c.maxPromoPct || 30); const pctOf = (pr) => ((pr.vtype || 'percent') === 'percent' ? Number(pr.value != null ? pr.value : pr.pct) || 0 : 0);
    for (const pr of (c.promos || []).concat(c.autos || [])) if (pctOf(pr) > cap || Number(pr.pct || 0) > cap) bad(`Promotions are capped at ${cap}% off (${pr.name || pr.code || 'promotion'})`);
    // Price and rule changes need approval from someone else (Team > Approval Rules), bound to exactly what is published
    if (catSig(c) !== catSig(cur) && (await priceRuleOn(cur))) { const st = await priceApproval(req.user, c);
      if (!st.matches) bad('This catalog does not match the saved draft. Wait a moment for the draft to save, then publish again.');
      if (!st.approved) bad('Price and rule changes need approval from someone with Approve Price Changes who did not edit this draft'); }
    await core.saveCatalog(c, req.user.id); await db.q("DELETE FROM kv WHERE k='catalog.approvals'"); await core.audit(req.user.id, 'catalog.update', 'catalog', { version: c.version });
  }));
  // Approval state of the draft (the page sends the catalog it would publish)
  r.post('/catalog/approval', h(async (req) => priceApproval(req.user, req.body && req.body.cat && Array.isArray(req.body.cat.plans) ? req.body.cat : null)));
  // Approve the draft's price and rule changes. Older pages call it per change; it always approves the whole draft as it is now.
  const approveDraft = h(async (req) => {
    const cat = req.body && req.body.cat; if (!cat || !Array.isArray(cat.plans)) bad('Reload the page and approve again');
    const live = await core.catalog(true); if (!canApprovePrice(req.user, live)) bad('Your role cannot approve price changes. Ask someone with Approve Price Changes in Catalog > Permissions.', 403);
    const st = await priceApproval(req.user, cat);
    if (!st.matches) bad('The draft changed since you opened it. Reload the page to see the latest changes, then approve.');
    if (st.authors.includes(req.user.id)) bad('You edited this draft, so someone else must approve it');
    const d = await kvGet('store.catalog.draft'); const name = `${req.user.first || ''} ${req.user.last || ''}`.trim();
    await db.q("INSERT INTO kv(k,v) VALUES('catalog.approvals',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify({ sig: d.sig, by: req.user.id, name, at: new Date().toISOString() })]);
    ((d.s && d.s.changes) || []).forEach((c) => { if (c.approve) { c.approved = true; c.by2 = name; } }); await db.q("UPDATE kv SET v=$1 WHERE k='store.catalog.draft'", [JSON.stringify(d)]);
    await core.audit(req.user.id, 'catalog.approve', 'catalog', { sig: d.sig, changes: ((d.s && d.s.changes) || []).filter((c) => c.approve).map((c) => c.text).slice(0, 30) });
    return { ok: true, approval: await priceApproval(req.user, cat) };
  });
  r.post('/catalog/approve', approveDraft); r.post('/catalog/changes/:id/approve', approveDraft);
  r.put('/content/:key', h(async (req) => { need(req.user, 'support'); if (!content.keys.includes(req.params.key)) bad('Unknown content section', 400); if (req.params.key === 'competitions') await require('./comps').save(req.body.value, req.user.id); else await content.set(req.params.key, req.body.value); await core.audit(req.user.id, 'content.update', req.params.key, {}); }));
  // Competitions: the ranking, winners and every status change are worked out here on the server (server/comps.js)
  { const CP = require('./comps'); const cid = (req) => clean(req.params.id, 30);
    r.get('/competitions', h(async (req) => { need(req.user, 'support', 'risk'); await CP.sync().catch(() => {}); return CP.forAdmin(); }));
    r.post('/competitions', h(async (req) => { need(req.user, 'support'); return CP.create(req.body, req.user.id); }));
    r.post('/competitions/:id/start', h(async (req) => { need(req.user, 'support'); return CP.start(cid(req), req.user.id); }));
    r.post('/competitions/:id/end', h(async (req) => { need(req.user, 'support'); return CP.end(cid(req), req.user.id); }));
    r.post('/competitions/:id/disqualify', h(async (req) => { need(req.user, 'support', 'risk'); return CP.disqualify(cid(req), req.body.user, req.body.undo !== true, req.user.id); }));
    r.post('/competitions/:id/prizes/:pos/send', h(async (req) => { need(req.user, 'support'); return CP.sendPrize(cid(req), req.params.pos, req.user.id); })); }

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
    // Names go into emails and documents as typed, so markup characters are refused here
    if (/[<>]/.test(String(b.first || '') + String(b.last || ''))) bad('Names cannot contain < or >');
    const email = clean(b.email || u.email, 200).toLowerCase(); if (!require('./util').emailOk(email)) bad('Enter a valid email address'); if (email !== u.email && (await db.one('SELECT 1 FROM users WHERE email=$1', [email]))) bad('Another user has that email');
    // Checked before any second-approval request is queued, so a request that could never be applied is refused now
    // Country from the same list as sign-up; phone checked and stored the way Settings stores it
    const PH = require('./phone'); const country = clean(b.country || u.country, 60); const crow = PH.DIAL.find((x) => x[0].toLowerCase() === country.toLowerCase()); if (country !== u.country && !crow) bad('Pick a country from the list');
    let phone = clean(b.phone ?? u.phone, 40); if (phone && phone !== u.phone) { const ph = PH.parse(crow ? crow[1] : 'US', phone); if (ph.err) bad(ph.err); phone = ph.phone; }
    // A new sign-in email lets someone take over the account with a password reset, so a second person approves it
    if (email !== u.email && u.role === 'trader') { const p = (await pendingAll())['email:' + u.id]; if (p && p.by !== req.user.id && p.payload.email !== email) bad(`A change to ${p.payload.email} is already waiting for this user. Approve or decline it first.`);
      const w = await secondPerson(req, 'email', String(u.id), { first: b.first, last: b.last, email, phone: b.phone, country: b.country }, `Change the email for ${u.first} ${u.last} (${u.tid}) to ${email}`); if (w) return w; }
    if (email !== u.email) { const mask = (e) => e.replace(/^(.)[^@]*(@.*)$/, '$1***$2'); require('./mail').sendT('emailchg', u.email, { first_name: u.first, old_email: mask(u.email), new_email: mask(email), url: require('./auth').BASE() + '/app#support' }, { uid: u.id, force: true }).catch(() => {}); await db.q('DELETE FROM sessions WHERE user_id=$1', [u.id]); }
    await db.q('UPDATE users SET first=$2,last=$3,email=$4,phone=$5,country=$6 WHERE id=$1', [u.id, clean(b.first || u.first, 60), clean(b.last || u.last, 60), email, phone, crow ? crow[0] : country]);
    await core.audit(req.user.id, 'user.details', u.tid, { from: { first: u.first, last: u.last, email: u.email }, to: { first: clean(b.first || u.first, 60), last: clean(b.last || u.last, 60), email } }); }));
  r.post('/users/:id/signout', h(async (req) => { need(req.user, 'support', 'risk'); { const tu = await db.one('SELECT role FROM users WHERE id=$1', [+req.params.id]); if (tu && tu.role !== 'trader' && tu && +req.params.id !== req.user.id) need(req.user); } await db.q('DELETE FROM sessions WHERE user_id=$1', [+req.params.id]); await core.audit(req.user.id, 'user.signout', String(req.params.id), {}); }));
  // End one session (Sign-Ins table); the same people who can sign a user out everywhere can do this
  r.post('/users/:id/sessions/:sid/end', h(async (req) => { need(req.user, 'support', 'risk'); { const tu = await db.one('SELECT role FROM users WHERE id=$1', [+req.params.id]); if (tu && tu.role !== 'trader' && +req.params.id !== req.user.id) need(req.user); } const r0 = await db.one('DELETE FROM sessions WHERE user_id=$1 AND substr(md5(token),1,16)=$2 RETURNING user_id', [+req.params.id, clean(req.params.sid, 20)]); if (!r0) bad('That session already ended', 404); await core.audit(req.user.id, 'user.signout.one', String(req.params.id), {}); }));
  r.post('/users/:id/reset-password', h(async (req) => { need(req.user, 'support'); { const tu = await db.one('SELECT role FROM users WHERE id=$1', [+req.params.id]); if (tu && tu.role !== 'trader') need(req.user); } const u = await db.one('SELECT email FROM users WHERE id=$1', [+req.params.id]); await require('./auth').forgot({ body: { email: u.email } }); await core.audit(req.user.id, 'user.reset_password', String(req.params.id), {}); }));
  r.post('/users/:id/note', h(async (req) => { need(req.user, 'support', 'risk', 'finance'); const body = clean(req.body.body, 2000); if (!body) bad('Write a note first');
    await db.q("INSERT INTO kv(k,v) VALUES($1, jsonb_build_array($2::jsonb)) ON CONFLICT (k) DO UPDATE SET v = kv.v || $2::jsonb", ['note.user.' + (+req.params.id), JSON.stringify({ by: req.user.first + ' ' + req.user.last, at: new Date().toISOString(), body })]); await core.audit(req.user.id, 'user.note', String(+req.params.id), { len: body.length }); }));
  r.post('/users/:id/notify', h(async (req) => { need(req.user, 'support', 'risk', 'finance'); const t = clean(req.body.title, 120); const body = clean(req.body.body, 1000); if (!t) bad('Add a title'); await core.notify(null, +req.params.id, t, body, clean(req.body.link, 60) || 'dashboard'); const uu = await db.one('SELECT email, first FROM users WHERE id=$1', [+req.params.id]); if (uu) await require('./mail').send(uu.email, t, `Hi ${uu.first},\n\n${body}\n\nFunded Sky`, 'notice').catch(() => {}); await core.audit(req.user.id, 'user.notify', String(req.params.id), { t }); }));
  // ---- Lists that work at any size: search, filter, sort and paging run in SQL over every trader, not over the rows the boards have loaded
  const likeQ = (q) => '%' + String(q).toLowerCase().replace(/[\\%_]/g, (c) => '\\' + c) + '%';
  const U_RISK = `LEAST(100, 8 + 4 * (SELECT count(*) FROM accounts a WHERE a.user_id=u.id AND a.phase='breached') + 8 * (SELECT count(*) FROM orders o WHERE o.user_id=u.id AND o.status='refunded')
    + 25 * (SELECT count(*) FROM kv WHERE k LIKE 'dispute.%' AND v->>'user' = u.id::text) + CASE WHEN u.status <> 'active' THEN 20 ELSE 0 END + CASE WHEN u.kyc_status='submitted' AND COALESCE(u.kyc->>'country','') NOT IN ('', u.country) THEN 20 ELSE 0 END)`;
  r.get('/users/search', h(async (req) => {
    const q = clean(req.query.q, 80).trim(); const f = String(req.query.f || 'all'); const lim = Math.max(1, Math.min(200, parseInt(req.query.limit, 10) || 50)); const off = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const w = ["u.role='trader'"]; const v = [];
    if (q) { v.push(likeQ(q)); w.push(`(lower(u.first || ' ' || u.last) LIKE $${v.length} OR lower(u.email) LIKE $${v.length} OR lower(u.tid) LIKE $${v.length} OR u.id::text = ${'$' + (v.length + 1)} OR lower(u.country) LIKE $${v.length} OR u.phone LIKE $${v.length} OR EXISTS (SELECT 1 FROM accounts a WHERE a.user_id=u.id AND lower(a.id) LIKE $${v.length}))`); v.push(q.replace(/^#/, '')); }
    const DEL = "u.email LIKE '%@deleted.fundedsky.invalid'";
    if (f === 'Active') w.push(`u.status='active' AND NOT ${DEL}`); else if (f === 'Locked') w.push(`u.status='suspended' AND NOT ${DEL}`); else if (f === 'Banned') w.push(`u.status='banned' AND NOT ${DEL}`); else if (f === 'funded') w.push("EXISTS (SELECT 1 FROM accounts a WHERE a.user_id=u.id AND a.kind='funded')"); else if (f === 'kyc') w.push("u.kyc_status IN ('none','submitted')");
    else if (f === 'kycpending') w.push("u.kyc_status='submitted'");
    const SORT = { recent: 'COALESCE(u.last_login, u.created_at) DESC', joined: 'u.created_at DESC', spent: "(SELECT COALESCE(sum(total),0) FROM orders o WHERE o.user_id=u.id AND o.status='paid') DESC", paid: "(SELECT COALESCE(sum(amount),0) FROM payouts p WHERE p.user_id=u.id AND p.status='paid') DESC", risk: U_RISK + ' DESC', kycwait: "(u.kyc->>'at') ASC NULLS LAST" };
    const total = (await db.one(`SELECT count(*)::int n FROM users u WHERE ${w.join(' AND ')}`, v)).n;
    // An exact ID, trader ID or email match comes first, whatever the sort
    const exact = q ? `(u.id::text = $2 OR lower(u.tid) = $${v.length + 1}::text OR lower(u.email) = $${v.length + 1}::text) DESC, ` : '';
    const ids = (await db.all(`SELECT u.id FROM users u WHERE ${w.join(' AND ')} ORDER BY ${exact}${SORT[req.query.sort] || SORT.recent}, u.id DESC LIMIT ${lim} OFFSET ${off}`, q ? v.concat([q.toLowerCase()]) : v)).map((x) => x.id);
    const rows = ids.length ? await db.all(`SELECT u.id, u.tid, u.email, u.first, u.last, u.country, u.phone, u.status, u.kyc_status, u.kyc, u.created_at, u.last_login,
      (SELECT count(*) FROM accounts a WHERE a.user_id=u.id)::int n_acc, (SELECT count(*) FROM accounts a WHERE a.user_id=u.id AND a.kind='funded')::int funded,
      (SELECT COALESCE(sum(total),0) FROM orders o WHERE o.user_id=u.id AND o.status='paid')::float spent, (SELECT COALESCE(sum(amount),0) FROM payouts p WHERE p.user_id=u.id AND p.status='paid')::float paid, (${U_RISK})::int risk
      FROM users u WHERE u.id = ANY($1::int[])`, [ids]) : [];
    const by = new Map(rows.map((x) => [x.id, x]));
    return { total, offset: off, rows: ids.map((id) => by.get(id)).filter(Boolean).map((x) => ({ ...x, kyc: x.kyc && x.kyc.name ? { country: x.kyc.country, dob: x.kyc.dob, at: x.kyc.at } : null })) };
  }));
  // Users > Overview numbers, all counted in SQL
  r.get('/users/stats', h(async () => {
    const T0 = "(date_trunc('day', now() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York')"; const TR = "role='trader'";
    const one = await db.one(`SELECT (SELECT count(*) FROM users WHERE ${TR})::int total, (SELECT count(*) FROM users WHERE ${TR} AND kyc_status='verified')::int verified, (SELECT count(*) FROM users WHERE ${TR} AND kyc_status<>'none')::int "kycStarted",
      (SELECT count(*) FROM users WHERE ${TR} AND kyc_status='submitted')::int "kycQueue", (SELECT min(kyc->>'at') FROM users WHERE ${TR} AND kyc_status='submitted') "kycOldest", (SELECT count(*) FROM users WHERE ${TR} AND status IN ('suspended','banned'))::int locked,
      (SELECT count(*) FROM users WHERE ${TR} AND created_at >= ${T0})::int today, (SELECT count(DISTINCT user_id) FROM orders WHERE status='paid')::int buyers, (SELECT count(DISTINCT user_id) FROM accounts WHERE passed_at IS NOT NULL)::int passers,
      (SELECT count(DISTINCT user_id) FROM payouts WHERE status='paid')::int "paidOut",
      (SELECT count(*) FROM users WHERE kyc->>'at' > (now() - interval '30 days')::text)::int k30, (SELECT count(*) FROM users WHERE kyc->>'at' > (now() - interval '30 days')::text AND kyc_status='verified')::int "k30ok",
      (SELECT count(*) FROM users WHERE kyc->>'at' > (now() - interval '30 days')::text AND kyc_status='rejected')::int "k30no", (SELECT count(*) FROM users WHERE kyc->>'at' > (now() - interval '30 days')::text AND kyc_status='submitted')::int "k30wait"`);
    one.signups = await db.all(`SELECT ((created_at AT TIME ZONE 'America/New_York')::date)::text d, count(*)::int n FROM users WHERE ${TR} AND created_at > now() - interval '15 days' GROUP BY 1 ORDER BY 1`);
    one.countries = await db.all(`SELECT CASE WHEN country='' THEN '—' ELSE country END c, count(*)::int n FROM users WHERE ${TR} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 6`);
    return one;
  }));
  // Search Everything: people, accounts, payouts, orders and tickets found in SQL, whatever their age
  r.get('/find', h(async (req) => {
    const q = clean(req.query.q, 80).trim(); if (q.length < 2) return { users: [], accounts: [], payouts: [], orders: [], tickets: [] }; const l = likeQ(q); const idq = q.replace(/^#/, '');
    const [users, accounts, payouts, orders, tickets] = await Promise.all([
      db.all(`SELECT id, tid, first, last, email, country, role FROM users u WHERE lower(first || ' ' || last) LIKE $1 OR lower(email) LIKE $1 OR lower(tid) LIKE $1 OR id::text = $2 ORDER BY (lower(email) = $3 OR lower(tid) = $3) DESC, COALESCE(last_login, created_at) DESC LIMIT 8`, [l, idq, q.toLowerCase()]),
      db.all('SELECT a.id, a.user_id "user", u.first, u.last FROM accounts a JOIN users u ON u.id=a.user_id WHERE lower(a.id) LIKE $1 ORDER BY a.created_at DESC LIMIT 6', [l]),
      db.all('SELECT p.code, p.status, p.user_id "user", u.first, u.last FROM payouts p JOIN users u ON u.id=p.user_id WHERE lower(p.code) LIKE $1 ORDER BY p.requested_at DESC LIMIT 6', [l]),
      db.all('SELECT o.code, o.status, o.total::float total, o.user_id "user", u.first, u.last FROM orders o JOIN users u ON u.id=o.user_id WHERE lower(o.code) LIKE $1 ORDER BY o.created_at DESC LIMIT 6', [l]),
      db.all('SELECT t.id, t.subject FROM tickets t WHERE t.id::text = $2 OR lower(t.subject) LIKE $1 ORDER BY t.updated_at DESC LIMIT 6', [l, idq])
    ]);
    return { users, accounts, payouts, orders, tickets };
  }));
  r.get('/users/:id/extra', h(async (req) => { const id = +req.params.id; const u = await db.one('SELECT email FROM users WHERE id=$1', [id]); if (!u) bad('User not found', 404);
    const [notes, sess, trades, mails, pts] = await Promise.all([db.one('SELECT v FROM kv WHERE k=$1', ['note.user.' + id]), db.all('SELECT substr(md5(token),1,16) sid, ua, ip, created_at, seen_at, expires_at FROM sessions WHERE user_id=$1 ORDER BY seen_at DESC LIMIT 40', [id]),
      db.all('SELECT t.account_id, t.ts, t.instrument, t.side, t.qty, t.pnl::float pnl, t.hold_min FROM trades t JOIN accounts a ON a.id=t.account_id WHERE a.user_id=$1 ORDER BY t.ts DESC LIMIT 3000', [id]),
      db.all('SELECT subject, template, status, created_at FROM outbox WHERE to_email=$1 ORDER BY id DESC LIMIT 60', [u.email]), db.all('SELECT label, delta, created_at FROM points_log WHERE user_id=$1 ORDER BY id DESC LIMIT 60', [id])]);
    // One view entry per person and profile every 30 minutes, so real actions are not pushed out of the log
    if (!(await db.one("SELECT 1 FROM audit WHERE actor_id=$1 AND action='user.view' AND target=$2 AND created_at > now() - interval '30 minutes' LIMIT 1", [req.user.id, String(id)]))) await core.audit(req.user.id, 'user.view', String(id), {});
    // What staff did on this user, with what changed (profile Staff Views; also real events for the Journey tab)
    const tid = (await db.one('SELECT tid, verified FROM users WHERE id=$1', [id])) || {};
    const acts = await db.all(`SELECT a.created_at at, a.action, a.target, a.meta, s.first, s.last FROM audit a LEFT JOIN users s ON s.id=a.actor_id
      WHERE a.target=$1 OR (a.target=$2 AND (a.action LIKE 'user.%' OR a.action LIKE 'ui.user.%' OR a.action LIKE 'staff.%')) OR (a.target LIKE '%:' || $2 AND a.action LIKE 'approval.%') ORDER BY a.id DESC LIMIT 200`, [tid.tid || '', String(id)]);
    return { notes: notes ? notes.v : [], sessions: sess, trades, emails: mails, points: pts, verified: !!tid.verified, audit: acts.map((a) => ({ at: a.at, by: a.first ? `${a.first} ${a.last || ''}`.trim() : 'System', action: a.action, target: a.target, meta: a.meta || {} })) }; }));
  // Events only the browser knows about (revealing hidden details, notes on the Risk board). They are stored as ui.<event>, always under the
  // signed-in person, so they can never look like an action the server did.
  const UI_EVENTS = /^(user\.(documents|details)\.view|risk\.[a-z_]{1,54})$/;
  r.post('/audit', h(async (req) => { const a = String(req.body.action || ''); if (!UI_EVENTS.test(a)) bad('Unknown event'); await core.audit(req.user.id, 'ui.' + a, clean(req.body.target, 200), { ui: true }); }));
  r.post('/users/:id/anonymize', h(async (req) => { need(req.user); const id = +req.params.id; const u = await db.one('SELECT * FROM users WHERE id=$1', [id]); if (!u) bad('User not found', 404); if (u.role !== 'trader') bad('Staff accounts cannot be deleted here');
    await db.q("UPDATE users SET email=$2, first='Deleted', last='User', phone='', kyc='{}'::jsonb, status='banned', kyc_ref=NULL, tax_ref=NULL, mfa_secret=NULL, mfa_backup=NULL, settings=settings - 'affWhere' - 'affAudience' - 'notes' - 'src' - 'lsrc' WHERE id=$1", [id, 'deleted-' + id + '@deleted.fundedsky.invalid']);
    await db.q("UPDATE ticket_msgs SET body='[Deleted at the trader''s request]' WHERE author_id=$1", [id]); await db.q("UPDATE outbox SET to_email=$2 WHERE user_id=$1 OR lower(to_email)=lower($3)", [id, 'deleted-' + id + '@deleted.fundedsky.invalid', u.email]); await db.q('DELETE FROM sessions WHERE user_id=$1', [id]); await db.q('DELETE FROM payout_methods WHERE user_id=$1', [id]); await db.q('DELETE FROM kv WHERE k=$1', ['note.user.' + id]); await db.q('DELETE FROM kv WHERE k=$1', ['taxform.' + id]);
    await core.audit(req.user.id, 'user.anonymize', u.tid, {}); }));
  // ---- Accounts and trades ----
  r.get('/trades', h(async (req) => { const q = []; const v = []; if (req.query.account) { v.push(clean(req.query.account, 40)); q.push('t.account_id=$' + v.length); } if (req.query.user) { v.push(+req.query.user); q.push('a.user_id=$' + v.length); } if (req.query.instrument) { v.push(clean(req.query.instrument, 10)); q.push('t.instrument=$' + v.length); }
    return db.all(`SELECT t.*, a.user_id, a.plan, a.size FROM trades t JOIN accounts a ON a.id=t.account_id ${q.length ? 'WHERE ' + q.join(' AND ') : ''} ORDER BY t.ts DESC LIMIT 500`, v); }));
  // ---- Support ----
  const ticketOf = async (req) => { need(req.user, 'support', 'risk', 'finance'); const t = await db.one('SELECT * FROM tickets WHERE id=$1', [+req.params.id]); if (!t) bad('Ticket not found', 404); return t; };
  r.post('/tickets/:id/assign', h(async (req) => { const t = await ticketOf(req); const to = req.body.to === 'me' ? req.user.id : req.body.to ? +req.body.to : null; if (to && !(await db.one("SELECT 1 FROM users WHERE id=$1 AND role<>'trader'", [to]))) bad('Pick a staff member'); await db.q('UPDATE tickets SET assignee=$2, updated_at=now() WHERE id=$1', [t.id, to]); await core.audit(req.user.id, 'ticket.assign', String(t.id), { to }); }));
  // Analytics: compact daily facts for the last 2 years (days counted in Eastern Time from 'start')
  let anCache = null;
  r.get('/analytics', h(async () => {
    if (anCache && Date.now() - anCache.t < 60e3) return anCache.v;
    const start = (await db.one("SELECT ((now() AT TIME ZONE 'America/New_York')::date - 729)::text d")).d;
    const D = (col) => `((${col} AT TIME ZONE 'America/New_York')::date - '${start}'::date)`;
    const [visits, users, orders, accts, pays, disp, styles, pages, tickets] = await Promise.all([
      db.all(`SELECT (day - '${start}'::date) d, src, camp, country, dev, n FROM visits WHERE day >= '${start}'::date`),
      db.all(`SELECT id, ${D('created_at')} d, country, settings->'src' src, settings->'lsrc' lsrc, email LIKE '%@demo.fundedsky.test' demo, referred_by FROM users WHERE role='trader'`),
      db.all(`SELECT o.code, o.user_id u, ${D('o.created_at')} c, CASE WHEN o.paid_at IS NULL THEN NULL ELSE ${D('o.paid_at')} END p, CASE WHEN o.refunded_at IS NULL THEN NULL ELSE ${D('o.refunded_at')} END rf, o.kind, o.status, o.items, o.lines, o.discount::float disc, o.total::float tot, o.promo, o.pay_method m, o.provider pv, EXTRACT(HOUR FROM o.paid_at AT TIME ZONE 'America/New_York')::int hr, EXTRACT(ISODOW FROM o.paid_at AT TIME ZONE 'America/New_York')::int dw, o.meta->>'refundNote' rn FROM orders o WHERE o.created_at > now() - interval '731 days'`),
      db.all(`SELECT a.id, a.user_id u, a.plan, a.size, a.platform, a.kind, a.phase, ${D('a.created_at')} c, CASE WHEN a.passed_at IS NULL THEN NULL ELSE ${D('a.passed_at')} END pa, CASE WHEN a.breached_at IS NULL THEN NULL ELSE ${D('a.breached_at')} END br, a.breach_reason why, a.payout_count pc, a.parent_id par FROM accounts a WHERE a.created_at > now() - interval '731 days'`),
      db.all(`SELECT user_id u, ${D('paid_at')} d, amount::float a, account_id ac FROM payouts WHERE status='paid' AND paid_at > now() - interval '731 days'`),
      db.all("SELECT v FROM kv WHERE k LIKE 'dispute.%'"),
      db.all("SELECT account_id ac, count(*)::int n, avg(hold_min)::float hold, avg(CASE WHEN tag ILIKE '%news%' THEN 1 ELSE 0 END)::float news FROM trades WHERE ts > now() - interval '180 days' GROUP BY account_id"),
      db.all(`SELECT (day - '${start}'::date) d, path, n FROM pageviews WHERE day >= '${start}'::date`),
      db.all("SELECT u.id, a.platform FROM tickets t JOIN users u ON u.id=t.user_id LEFT JOIN LATERAL (SELECT platform FROM accounts WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1) a ON true WHERE t.created_at > now() - interval '90 days'")]);
    { const ab = await require('./affiliates').board().catch(() => ({ ord: {} })); orders.forEach((o) => { const x = ab.ord[o.code]; if (x) { o.af = x.aff; o.com = x.com; } delete o.code; }); }
    const v = { at: new Date().toISOString(), start, visits, users, orders, accts, pays, disputes: disp.map((x) => x.v).filter((x) => x && x.opened).map((x) => ({ d: Math.floor((new Date(x.opened) - new Date(start + 'T05:00:00Z')) / 864e5), a: Number(x.amount) || 0, st: x.status })), styles, pages, tickets };
    anCache = { t: Date.now(), v }; return v; }));
  // Reports go to staff addresses only; admins can also send them outside the team. Every send is in the audit log.
  r.post('/analytics/send', h(async (req) => { const to = [...new Set(String(req.body.to || req.user.email).split(/[,;\s]+/).map((x) => x.trim().toLowerCase()).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)))].slice(0, 10); if (!to.length) bad('Add at least one email address');
    if (req.user.role !== 'admin') { const st = new Set((await db.all("SELECT lower(email) e FROM users WHERE role<>'trader' AND status='active'")).map((x) => x.e)); const out = to.filter((x) => !st.has(x)); if (out.length) bad(`Reports can only go to back office staff. Ask an admin to send to ${out.join(', ')}.`, 403); }
    const cc = (v) => { let t = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(t) && !/^-?\d+(\.\d+)?$/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; }; const csv = Array.isArray(req.body.csv) ? '\n\n' + req.body.csv.slice(0, 5000).map((r2) => (Array.isArray(r2) ? r2 : [r2]).map(cc).join(',')).join('\n') : ''; for (const t of to) await require('./mail').send(t, clean(req.body.subject, 140) || 'Funded Sky report', clean(req.body.body, 20000) + csv, 'report');
    if (req.body.slack) require('./integrations').alert('report', `*${clean(req.body.subject, 140)}*\n${clean(req.body.body, 3000)}`); await core.audit(req.user.id, 'analytics.send', to.join(', '), { subject: clean(req.body.subject, 140), slack: !!req.body.slack }); return { to: to.join(', ') }; }));
  // Emails board: designs, sending numbers and logs
  r.get('/emails', h(async (req) => { const M = require('./mail');
    const [byDay, logs, users] = await Promise.all([
      db.all("SELECT template, (created_at AT TIME ZONE 'America/New_York')::date::text d, status, count(*)::int n FROM outbox WHERE created_at > now() - interval '91 days' GROUP BY 1,2,3"),
      db.all("SELECT o.id, o.to_email, o.subject, o.template, o.status, o.created_at, o.ext_id, o.events, o.user_id, u.tid, u.first, u.last FROM outbox o LEFT JOIN users u ON u.id=o.user_id OR (o.user_id IS NULL AND u.email=o.to_email) WHERE o.created_at > now() - interval '30 days' ORDER BY o.id DESC LIMIT 1500"),
      Promise.resolve(null)]);
    return { defs: M.DEFS, byDay, logs, sample: await M.sample(null, req.user) }; }));
  r.post('/emails/test', h(async (req) => { const M = require('./mail'); const key = String(req.body.key || ''); const C = await M.cfg(); const base = M.tplOf(C, key); if (!base) bad('Unknown email');
    const d = req.body.draft && typeof req.body.draft === 'object' ? req.body.draft : {}; const e = Object.assign({}, base, d, { flow: base.flow });
    const vars = Object.assign(await M.sample(key, req.user), { url: require('./auth').BASE() + '/app' }); const f = (t) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : ''));
    await M.deliverRaw({ to: req.user.email, subject: '[Test] ' + f(e.s), body: M.text(e, vars), html: M.render(e, vars, C.brand), template: 'test:' + key, from: M.DEFS.SENDERS[e.fr], uid: req.user.id }); await core.audit(req.user.id, 'email.test', key, {}); return { to: req.user.email }; }));
  r.post('/emails/resend/:id', h(async (req) => { need(req.user, 'support'); const o = await db.one('SELECT * FROM outbox WHERE id=$1', [+req.params.id]); if (!o) bad('Message not found', 404);
    const sup = ((await db.one("SELECT v FROM kv WHERE k='store.emails.supp'")) || {}).v || []; if (sup.some((x) => String(x.a).toLowerCase() === o.to_email.toLowerCase() && x.k === 'Bounced')) bad('This address is on the suppression list. Remove it first.');
    await require('./mail').send(o.to_email, o.subject, o.body, o.template); await core.audit(req.user.id, 'email.resend', String(o.id), {}); }));
  r.get('/emails/domain', h(async () => { const c = await require('./integrations').cfg('resend').catch(() => null); const key = (c && c.apiKey) || process.env.RESEND_API_KEY; if (!key) return { connected: false, from: (c && c.from) || '' };
    const H = { Authorization: 'Bearer ' + key }; const l = await fetch('https://api.resend.com/domains', { headers: H }).then((r2) => r2.json()).catch(() => ({}));
    const doms = l.data || []; const want = (((c && c.from) || '').match(/@([^>\s]+)/) || [])[1]; const d0 = doms.find((d) => d.name === want) || doms[0];
    const det = d0 ? await fetch('https://api.resend.com/domains/' + d0.id, { headers: H }).then((r2) => r2.json()).catch(() => null) : null;
    return { connected: true, from: (c && c.from) || '', domains: doms.map((d) => ({ name: d.name, status: d.status, created: d.created_at, region: d.region })), domain: det && { name: det.name, status: det.status, created: det.created_at, region: det.region, records: (det.records || []).map((x) => ({ rec: x.record, type: x.type, name: x.name, value: x.value, status: x.status })) } }; }));
  r.post('/tickets/:id/category', h(async (req) => { const t = await ticketOf(req); const cat = await require('./support').topic(req.body.category); if (!cat) bad('Pick a topic from the list'); await db.q('UPDATE tickets SET category=$2, updated_at=now() WHERE id=$1', [t.id, cat]); await core.audit(req.user.id, 'ticket.category', String(t.id), { category: cat }); }));
  r.post('/tickets/:id/note', h(async (req) => { const t = await ticketOf(req); const body = clean(req.body.body, 5000); if (!body) bad('Write a note first'); await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,internal,body) VALUES($1,$2,true,true,$3)', [t.id, req.user.id, body]); await core.audit(req.user.id, 'ticket.note', String(t.id), {}); }));
  r.post('/tickets/:id/priority', h(async (req) => { const t = await ticketOf(req); const pr = ['low', 'normal', 'high', 'urgent'].includes(req.body.priority) ? req.body.priority : 'normal'; await db.q('UPDATE tickets SET priority=$2 WHERE id=$1', [t.id, pr]); await core.audit(req.user.id, 'ticket.priority', String(t.id), { priority: pr }); }));
  // Breach reviews: one person proposes, a different person confirms; the trader hears the outcome
  const REVK = 'store.support.reviews'; const revs = async () => ((await db.one('SELECT v FROM kv WHERE k=$1', [REVK])) || { v: {} }).v || {};
  const saveRevs = (v) => db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', [REVK, JSON.stringify(v)]);
  const revTicket = async (tid) => { const t = await db.one('SELECT * FROM tickets WHERE id=$1', [+tid]); if (!t) bad('Ticket not found', 404); const a = await db.one("SELECT * FROM accounts WHERE user_id=$1 AND phase='breached' ORDER BY breached_at DESC NULLS LAST LIMIT 1", [t.user_id]); return { t, a }; };
  r.post('/tickets/:id/review', h(async (req) => { need(req.user, 'support', 'risk'); const { t, a } = await revTicket(req.params.id); if (!a) bad('This trader has no closed account to review'); if (!t.review) require('./mail').t('appeal', t.user_id, { url: require('./auth').BASE() + '/app#support?tkt=' + t.id }); await db.q("UPDATE tickets SET review=true, category='Breach Dispute', updated_at=now() WHERE id=$1", [t.id]); await core.audit(req.user.id, 'ticket.review', String(t.id), { acct: a.id }); }));
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
    await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,internal,body) VALUES($1,$2,true,true,$3)', [+req.params.tid, req.user.id, `${req.user.first} sent the review back for another look.`]); await core.audit(req.user.id, 'review.back', k, {}); }));
  // ---- Generic lists stored in kv: announcements, macros, blocklist, countries, incidents ----
  const KV = ['announcements', 'macros', 'blocklist', 'countries', 'incidents', 'affiliates', 'docs', 'complaints'];
  // Announcements: check dates, link, audience and type before the list is saved
  r.put('/list/announcements', async (req, res, next) => { try { req.body.value = require('./announce').validate((req.body || {}).value || [], ((await db.one("SELECT v FROM kv WHERE k='list.announcements'")) || {}).v || []); next(); } catch (e) { res.status(e.status || 500).json({ error: e.status ? e.message : 'Something went wrong on our side. Try again.' }); } });
  r.put('/list/:key', h(async (req) => { if (!KV.includes(req.params.key)) bad('Unknown list'); need(req.user, ...(LIST_ROLES[req.params.key] || [])); if (req.params.key === 'affiliates') { await require('./affiliates').saveList(req.body.value, core); await core.audit(req.user.id, 'list.affiliates', '', {}); return; } await db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', ['list.' + req.params.key, JSON.stringify(req.body.value || [])]); await core.audit(req.user.id, 'list.' + req.params.key, '', {});
  }));
  // Affiliates board actions. Each one changes a single affiliate on the list as it is now, so a page left open cannot undo someone else's change.
  r.post('/affiliates/act', h(async (req) => { need(req.user, ...(LIST_ROLES.affiliates || [])); const A = require('./affiliates'); const b = req.body || {}; const uid = +b.user; const op = String(b.op || '');
    const cur = ((await db.one("SELECT v FROM kv WHERE k='list.affiliates'")) || {}).v || []; const mine = cur.find((x) => x && x.user === uid); const rest = cur.filter((x) => x && x.user !== uid);
    if (!uid) bad('Pick a trader'); let next;
    if (op === 'add') { if (mine && mine.status !== 'declined') bad('This trader is already an affiliate'); next = rest.concat([{ user: uid, code: A.up(b.code), status: 'active', tier: clean(b.tier, 40) || 'Bronze', since: new Date().toISOString(), where: clean(b.where, 200) }]); }
    else if (op === 'decline') { if (mine && mine.status !== 'declined') bad('This trader is already an affiliate. Pause them instead.'); if (mine) bad('This application was already declined'); next = rest.concat([{ user: uid, status: 'declined', reason: clean(b.reason, 300) }]); }
    else if (op === 'patch') { if (!mine || mine.status === 'declined') bad('Affiliate not found', 404); const p = {}; if (b.status) p.status = b.status === 'paused' ? 'paused' : 'active'; if (b.tier) p.tier = clean(b.tier, 40); if (b.code != null) p.code = A.up(b.code); next = cur.map((x) => (x && x.user === uid ? Object.assign({}, x, p) : x)); }
    else bad('Unknown action');
    await A.saveList(next, core); await core.audit(req.user.id, 'affiliate.' + op, String(uid), { code: b.code ? A.up(b.code) : undefined, status: b.status, tier: b.tier, reason: op === 'decline' ? clean(b.reason, 300) : undefined }); return { ok: true }; }));
  // A code nobody else uses, for the approve and invite forms
  r.get('/affiliates/code', h(async (req) => { const A = require('./affiliates'); const uid = +req.query.user || 0; const code = A.up(req.query.code); const who = await A.codeTaken(code, uid); return { code, taken: who || '', free: who ? await A.freeCode(code, uid) : code }; }));
  // Pay All Due: the amounts are worked out and checked on the server. Affiliates with no payout method, a missing tax form or less than the minimum are skipped and listed.
  let PAYING = false;
  r.post('/affiliates/pay-all', h(async (req) => { need(req.user, 'finance'); if (PAYING) bad('A payout run is already going. Try again in a moment.'); PAYING = true; try { return await require('./affiliates').payAll(req.user, core, !!(req.body && req.body.dry)); } finally { PAYING = false; } }));
  // ---- Disputes ----
  r.post('/disputes', h(async (req) => { need(req.user, 'finance', 'support'); const o = await db.one('SELECT * FROM orders WHERE code=$1', [clean(req.body.order, 30)]); if (!o) bad('Order not found'); const id = 'CB-' + Date.now().toString(36).toUpperCase();
    if (o.meta && o.meta.dispute) { const prev = await db.one('SELECT v FROM kv WHERE k=$1', ['dispute.' + o.meta.dispute]); if (prev && prev.v.status !== 'won') bad(`Order ${o.code} already has dispute ${o.meta.dispute}${['lost', 'accepted'].includes(prev.v.status) ? ', which was lost' : ''}. Update that one instead.`); }
    const amtIn = req.body.amount; const amt = amtIn == null || amtIn === '' ? Number(o.total) : Number(amtIn); if (!Number.isFinite(amt) || amt <= 0) bad('Enter the disputed amount as a number above zero'); if (amt > Number(o.total) + 0.005) bad(`The disputed amount cannot be more than the order total of $${Number(o.total).toFixed(2)}`);
    if (req.body.due && !/^\d{4}-\d{2}-\d{2}$/.test(String(req.body.due))) bad('Enter the due date as YYYY-MM-DD');
    await db.q('INSERT INTO kv(k,v) VALUES($1,$2)', ['dispute.' + id, JSON.stringify({ id, provider: o.provider, order: o.code, user: o.user_id, amount: Math.round(amt * 100) / 100, reason: clean(req.body.reason, 120) || 'Not specified', status: 'open', opened: new Date().toISOString(), due: req.body.due || null, evidence: [] })]);
    await db.q("UPDATE orders SET meta = meta || jsonb_build_object('chargeback','open','dispute',$2::text) WHERE id=$1", [o.id, id]);
    // Disputes > Settings: pause the trader's accounts until the dispute ends
    const ds = ((await db.one("SELECT v FROM kv WHERE k='store.disputes.settings'")) || {}).v || {};
    if (ds.cbPause !== false) { const ids = (await db.all("UPDATE accounts SET sim = sim || jsonb_build_object('paused', true, 'pausedFor', $2::text) WHERE user_id=$1 AND phase IN ('active','passed','review') AND (sim->>'paused') IS NULL RETURNING id", [o.user_id, id])).map((x) => x.id);
      await db.q("UPDATE kv SET v = v || jsonb_build_object('paused', $2::jsonb) WHERE k=$1", ['dispute.' + id, JSON.stringify(ids)]);
      if (ids.length) await core.notify(null, o.user_id, 'Your accounts are paused', `Your bank told us the payment for order ${o.code} was disputed. Trading and payouts on ${ids.join(', ')} are paused while it is reviewed. Contact support if this was a mistake.`, 'accounts'); }
    if (ds.cbEmail) { const u = await db.one('SELECT email, first FROM users WHERE id=$1', [o.user_id]); if (u) require('./mail').send(u.email, 'About a payment dispute on your Funded Sky order', `Hi ${u.first},\n\nYour bank told us you disputed the payment for order ${o.code}. While the dispute is reviewed, your accounts are paused.\n\nIf this was a mistake, ask your bank to cancel the dispute and reply to this email so we can help.\n\nFunded Sky`, 'notice').catch(() => {}); }
    await core.audit(req.user.id, 'dispute.open', id, { order: o.code }); return { id }; }));
  r.put('/disputes/:id', h(async (req) => { need(req.user, 'finance', 'support'); const k = 'dispute.' + clean(req.params.id, 40); const row = await db.one('SELECT v FROM kv WHERE k=$1', [k]); if (!row) bad('Dispute not found', 404);
    const v = { ...row.v }; if (req.body.status) { if (!['open', 'evidence', 'submitted', 'won', 'lost', 'accepted'].includes(req.body.status)) bad('Unknown status');
      // A decided dispute stays decided: its accounts and credits were already settled
      if (['won', 'lost', 'accepted'].includes(row.v.status) && req.body.status !== row.v.status) bad(`This dispute was already closed as ${row.v.status}. It cannot be changed.`); v.status = req.body.status; } if (req.body.ev && typeof req.body.ev === 'object') v.ev = req.body.ev; if (req.body.evidence) v.evidence = (v.evidence || []).concat([{ at: new Date().toISOString(), by: req.user.first, text: clean(req.body.evidence, 1000) }]); if (['won', 'lost', 'accepted'].includes(req.body.status)) v.closed = new Date().toISOString(); if (req.body.status === 'submitted') v.submitted = new Date().toISOString();
    const ended = ['won', 'lost', 'accepted'].includes(req.body.status) && !['won', 'lost', 'accepted'].includes(row.v.status);
    if (ended && v.order) { const o = await db.one('SELECT * FROM orders WHERE code=$1', [v.order]);
      // Paused accounts open again; a lost or accepted chargeback closes what the order bought and takes back what it earned
      for (const id of v.paused || []) await db.q("UPDATE accounts SET sim = sim - 'paused' - 'pausedFor' WHERE id=$1 AND sim->>'pausedFor'=$2", [id, v.id]);
      if (o) { await db.q("UPDATE orders SET meta = meta || jsonb_build_object('chargeback', $2::text) WHERE id=$1", [o.id, req.body.status]);
        if (req.body.status !== 'won') {
          // Close what the order bought and the funded accounts that came from it, and settle their open payouts
          const bought = [].concat((o.meta && o.meta.accounts) || [], o.meta && o.meta.account ? [o.meta.account] : []);
          const all = bought.length ? (await db.all('SELECT id FROM accounts WHERE (id = ANY($1) OR parent_id = ANY($1) OR order_id=$2) AND user_id=$3', [bought, o.id, o.user_id])).map((x) => x.id) : (await db.all('SELECT id FROM accounts WHERE order_id=$1', [o.id])).map((x) => x.id);
          const closed = (await db.all("UPDATE accounts SET phase='closed', closed_at=now(), breach_reason='Chargeback' WHERE id = ANY($1) AND phase IN ('active','passed','review') RETURNING id", [all])).map((x) => x.id);
          for (const p of await db.all('SELECT code FROM payouts WHERE account_id = ANY($1) AND status = ANY($2)', [all, core.OPEN_PAY])) await core.reviewPayout(req.user.id, p.code, 'deny', `Not paid: the payment for order ${o.code} was charged back`).catch(() => {});
          if (closed.length) await core.notify(null, o.user_id, closed.length > 1 ? 'Accounts closed after a chargeback' : 'Account closed after a chargeback', `The payment for order ${o.code} was charged back, so ${closed.join(', ')} ${closed.length > 1 ? 'are' : 'is'} closed. Contact support if you think this is a mistake.`, 'accounts');
          // a charged-back credits order: the credits come out, and packs opened with them are undone where every card is still unused
          if (o.kind === 'credits' && o.status === 'paid') await PK.onRefund(o, { external: true, chargeback: true }).catch((e) => console.error('packs chargeback', e));
          const earned = o.kind === 'credits' ? 0 : Math.floor(Number(o.total)); if (earned > 0 && o.status === 'paid') { const u0 = await db.one('SELECT points FROM users WHERE id=$1', [o.user_id]); const take = Math.min(earned, Math.max(0, u0 ? u0.points : 0)); if (take > 0) await core.points(null, o.user_id, -take, 'Chargeback ' + o.code, 'chargeback'); }
        } else if ((v.paused || []).length) await core.notify(null, o.user_id, 'Your accounts are open again', `The dispute on order ${o.code} is closed. Trading and payouts are back on.`, 'accounts'); } }
    await db.q('UPDATE kv SET v=$2, updated_at=now() WHERE k=$1', [k, JSON.stringify(v)]); await core.audit(req.user.id, 'dispute.update', v.id, { status: v.status }); }));
  // ---- Health and fraud data ----
  r.get('/health', h(async () => { const [errors, jobs, hooks, db1] = await Promise.all([db.all('SELECT * FROM error_log ORDER BY id DESC LIMIT 200'), db.all('SELECT * FROM jobs_log ORDER BY id DESC LIMIT 200'), db.all('SELECT * FROM webhook_log ORDER BY id DESC LIMIT 200'), db.one("SELECT pg_database_size(current_database())::bigint size, (SELECT count(*) FROM trades)::int trades")]);
    const RS = global.FS_REQSTAT || { hours: {}, routes: {} }; const all = [].concat(...Object.values(RS.hours).map((x) => x.ms)).sort((a, c) => a - c); const tot = Object.values(RS.hours).reduce((s2, x) => s2 + x.n, 0); const fail = Object.values(RS.hours).reduce((s2, x) => s2 + x.fail, 0);
    const hd = ((await db.one("SELECT v FROM kv WHERE k='store.health.days'")) || {}).v || {};
    return { errors, jobs, hooks, db: db1, uptime: process.uptime(), memory: process.memoryUsage().rss, node: process.version, market: require('./sim').marketOpen(), p95: all.length ? all[Math.floor(all.length * 0.95)] : 0, failPct: tot ? fail / tot * 100 : 0, reqs: tot, hours: Object.fromEntries(Object.entries(RS.hours).map(([k, v]) => [k, { n: v.n, fail: v.fail, p50: v.ms.slice().sort((a, c) => a - c)[Math.floor(v.ms.length / 2)] || 0 }])), routes: RS.routes, days: hd }; }));
  // Rewards board numbers come from the whole ledger. A redemption is a ledger line of kind 'redeem' (ref: reward id | code, ticket or account).
  r.get('/rewards', h(async () => {
    const [red, byRw, month, refs, cv] = await Promise.all([
      db.all("SELECT p.id, p.user_id, p.label, p.delta, p.ref, p.created_at, u.first, u.last, c.used, c.order_id, o.code AS order_code, o.status AS order_status FROM points_log p JOIN users u ON u.id=p.user_id LEFT JOIN coupons c ON c.code = split_part(p.ref, '|', 2) LEFT JOIN orders o ON o.id=c.order_id WHERE p.kind='redeem' ORDER BY p.id DESC LIMIT 500"),
      db.all("SELECT split_part(ref, '|', 1) AS rid, label, count(*)::int n FROM points_log WHERE kind='redeem' GROUP BY 1, 2"),
      db.one("SELECT count(*)::int n FROM points_log WHERE kind='redeem' AND (created_at AT TIME ZONE 'America/New_York') >= date_trunc('month', now() AT TIME ZONE 'America/New_York')"),
      db.all("SELECT user_id, COALESCE(sum(delta),0)::int n FROM points_log WHERE label LIKE 'Friend%' GROUP BY user_id"),
      db.one("SELECT v FROM kv WHERE k='certviews'")]);
    return { redemptions: red.map((x) => { const what = String(x.ref || '').split('|')[1] || ''; return { when: x.created_at, user: x.user_id, name: `${x.first} ${(x.last || '').charAt(0)}.`, reward: x.label.replace(/^Redeemed:?\s*/i, ''), cost: -x.delta, what,
      status: what.startsWith('ticket:') ? 'Support Ticket #' + what.slice(7) : what.startsWith('acct:') ? 'On ' + what.slice(5) : x.used ? 'Used' + (x.order_code ? ' on ' + x.order_code : '') : x.used === false ? (x.order_code && x.order_status === 'pending' ? 'Held for ' + x.order_code : 'Code Not Used Yet') : 'Done' }; }),
      counts: byRw, month: month.n, refEarned: Object.fromEntries(refs.map((x) => [x.user_id, x.n])), views: (cv && cv.v) || {}, refSet: await core.referralSettings(), types: require('./content').RW_TYPES, life: require('./trader').LIFE,
      // competition certificates (one per recorded prize place), in the row shape the board lists: id, trader, type, for, issued, user id, what the design draws
      compCerts: (await require('./certs').compAll()).map((c) => ({ row: [c.id, c.staffName, 'Competition', c.v, c.when, c.user], d: c.d })),
      certFull: (await db.all("SELECT id FROM users WHERE (settings->>'certFull')='true'")).map((x) => x.id), certHost: require('./certs').host() };
  }));
  // A code issued by staff always belongs to one trader (only its owner can use it) and must be new
  r.post('/coupons', h(async (req) => { need(req.user, 'support'); const b = req.body; const kind = ['discount', 'free_reset', 'free_eval'].includes(b.kind) ? b.kind : 'discount'; const pctv = Math.min(100, Math.max(0, Number(b.pct) || 0)); const code = (clean(b.code, 24) || ('FS-' + require('crypto').randomBytes(4).toString('hex'))).toUpperCase(); const uid = b.user ? +b.user : null;
    if (!uid || !(await db.one('SELECT 1 FROM users WHERE id=$1', [uid]))) bad('Pick the trader this code is for'); if (!/^[A-Z0-9-]{4,24}$/.test(code)) bad('Use 4 to 24 letters, numbers and dashes for the code'); if (kind === 'discount' && !(pctv >= 1)) bad('Set the discount from 1 to 100 percent');
    if (await db.one('SELECT 1 FROM coupons WHERE code=$1', [code])) bad('That code already exists. Pick another one.');
    const lab = clean(b.label, 80) || 'Issued by staff'; const size = kind === 'free_eval' ? ((Number.isInteger(+b.size) && +b.size >= 5000 && +b.size <= 1000000 ? +b.size : 0) || (Number((lab.match(/\$(\d+)K/i) || [])[1]) * 1000) || 25000) : null;
    await db.q("INSERT INTO coupons(code,user_id,pct,label,kind,source,size) VALUES($1,$2,$3,$4,$5,'staff',$6)", [code, uid, kind === 'discount' ? pctv : 0, lab, kind, size]); await core.notify(null, uid, 'You have a new reward', lab === 'Issued by staff' ? 'A code was added to your account.' : lab, 'rewards'); await core.audit(req.user.id, 'coupon.issue', code, b); return { code }; }));
  r.post('/staff/:id/role', h(async (req) => { need(req.user); const role = req.body.role; if (!['trader', 'admin', 'support', 'risk', 'finance'].includes(role)) bad('Unknown role'); if (+req.params.id === req.user.id) bad('You cannot change your own role'); await db.q('UPDATE users SET role=$2 WHERE id=$1', [+req.params.id, role]); if (role === 'trader') await db.q('DELETE FROM sessions WHERE user_id=$1', [+req.params.id]); await core.audit(req.user.id, 'staff.role', String(req.params.id), { role }); }));
  r.post('/approvals/:key/:act', h(async (req) => { const all = await pendingAll(); const key = decodeURIComponent(req.params.key); const p = all[key]; if (!p) bad('This request was already handled', 404);
    if (req.params.act === 'reject') { if (p.by !== req.user.id) need(req.user); delete all[key]; await pendingSave(all); await core.audit(req.user.id, 'approval.reject', key, { desc: p.desc, first: p.byName }); return { ok: true }; }
    if (req.params.act !== 'approve') bad('Unknown request');
    // Nothing is saved here: the action itself checks the role, completes the request and takes it out of the queue
    if (p.by === req.user.id) bad('A different person must approve this'); if (!canApprove(req.user, p)) bad('Your role cannot approve this', 403);
    // If the action no longer needed the request (already done, or the rule was switched off), it still leaves the queue
    const run = async (path, method) => { const out = await fetchSelf(path, { method, body: Object.assign({}, p.payload), user: req.user }); const a2 = await pendingAll(); if (a2[key]) { delete a2[key]; await pendingSave(a2); await core.audit(req.user.id, 'approval.approve', key, { desc: p.desc, first: p.byName, firstId: p.by }); } return out; };
    if (p.kind === 'close' || p.kind === 'reinstate') return run(`/accounts/${encodeURIComponent(p.target)}/${p.kind === 'close' ? 'breach' : 'reinstate'}`);
    if (['ban', 'unban', 'kyc', 'kycok'].includes(p.kind)) return run(`/users/${+p.target}`);
    if (p.kind === 'email') return run(`/users/${+p.target}/details`, 'PUT');
    if (p.kind === 'adjust') return run(`/accounts/${encodeURIComponent(p.target)}/adjust`);
    bad('Unknown request'); }));
  r.post('/staff/:id/mfa-reset', h(async (req) => { need(req.user); const id = +req.params.id; if (id === req.user.id) bad('Ask another admin to reset your own two-step login'); const u = await db.one('SELECT id, role FROM users WHERE id=$1', [id]); if (!u || u.role === 'trader') bad('Staff member not found', 404); await require('./mfa').reset(id); await core.audit(req.user.id, 'staff.mfa_reset', String(id), {}); }));
  r.post('/staff/invite', h(async (req) => { need(req.user); const email = clean(req.body.email, 120).toLowerCase(); const role = req.body.role; if (!['admin', 'support', 'risk', 'finance'].includes(role)) bad('Unknown role'); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) bad('Enter an email address');
    // The role is only given to an account whose email is confirmed. Anyone else (no account yet, or signed up but not confirmed) gets a
    // waiting invitation, and the role is given when that email is confirmed, the same as a new sign-up.
    const u = await db.one('SELECT id, first, last, verified, role FROM users WHERE lower(email)=$1', [email]);
    if (u && u.id === req.user.id) bad('You cannot change your own role');
    if (u && u.verified) { await db.q('UPDATE users SET role=$2 WHERE id=$1', [u.id, role]); if (u.role !== role) await db.q('DELETE FROM sessions WHERE user_id=$1', [u.id]); await core.audit(req.user.id, 'staff.role', email, { role }); return { ok: true, granted: true, name: `${u.first} ${u.last || ''}`.trim() }; }
    const invs = (((await db.one("SELECT v FROM kv WHERE k='store.team.invites'")) || {}).v || []).filter((x) => String(x.email).toLowerCase() !== email);
    invs.push({ email, role, by: req.user.id, byName: `${req.user.first} ${req.user.last || ''}`.trim(), at: new Date().toISOString(), waiting: u ? 'verify' : 'signup' });
    await db.q("INSERT INTO kv(k,v) VALUES('store.team.invites',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(invs)]); await core.audit(req.user.id, 'staff.invite', email, { role, waiting: u ? 'verify' : 'signup' });
    return { ok: true, granted: false, waiting: u ? 'verify' : 'signup' }; }));
  // Fraud signals: each shared thing is keyed by a full SHA-256 of its value, so two different values never land on the same key
  r.get('/fraud', h(async (req) => { need(req.user, 'risk'); const [sess, methods, kyc] = await Promise.all([db.all('SELECT user_id, ip, ua, created_at FROM sessions'), db.all('SELECT user_id, label FROM payout_methods'), db.all("SELECT id, kyc FROM users WHERE kyc ? 'name'")]);
    const sha = (v) => require('crypto').createHash('sha256').update(String(v)).digest('hex');
    return { sess: sess.map((x) => ({ ...x, ki: x.ip ? sha('ip|' + x.ip) : null, kd: x.ip && x.ua ? sha('dev|' + x.ip + '|' + x.ua) : null })), methods: methods.map((m) => ({ ...m, k: sha('pm|' + String(m.label || '').trim().toLowerCase()) })),
      kyc: kyc.map((u) => ({ id: u.id, name: u.kyc.name, dob: u.kyc.dob, idLast4: u.kyc.idLast4, kn: u.kyc.name && u.kyc.dob ? sha('doc|' + String(u.kyc.name).trim().toLowerCase() + '|' + u.kyc.dob) : null, kl: u.kyc.idLast4 ? sha('id|' + u.kyc.idLast4) : null })) }; }));
  // ---- Exports ----
  // Accountant files. Dates are Eastern Time ("2026-11-25 20:32:53"), the month filter uses the date that matters for each file,
  // and the sales file only has orders that were paid (refunded ones stay, with their status and refund date).
  r.get('/export/:what.csv', async (req, res) => { try { if (!can(req.user, 'finance')) return res.status(403).json({ error: 'Your role cannot do this' }); const w = req.params.what;
    const cell = (v) => { if (v == null) return ''; let t = typeof v === 'object' ? JSON.stringify(v) : String(v); if (/^[=+\-@\t\r]/.test(t) && !/^-?\d+(\.\d+)?$/.test(t)) t = "'" + t; return /[",\r\n]/.test(t) || /^\s|\s$/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
    const csv = (cols, rows) => cols.join(',') + '\r\n' + rows.map((x) => cols.map((k) => cell(x[k])).join(',')).join('\r\n') + (rows.length ? '\r\n' : '');
    const ET = (col, as) => `to_char(${col} AT TIME ZONE 'America/New_York', 'YYYY-MM-DD HH24:MI:SS') AS ${as || col.replace(/^\w+\./, '')}`;
    const inMonth = (col) => `to_char(${col} AT TIME ZONE 'America/New_York', 'YYYY-MM') = $1`;
    const mo = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : '';
    const Q = {
      orders: { cols: ['code', 'paid_at', 'refunded_at', 'created_at', 'email', 'kind', 'subtotal', 'discount', 'total', 'promo', 'status', 'provider', 'pay_method'], sql: `SELECT o.code, ${ET('o.paid_at')}, ${ET('o.refunded_at')}, ${ET('o.created_at')}, u.email, o.kind, o.subtotal, o.discount, o.total, o.promo, o.status, o.provider, o.pay_method FROM orders o JOIN users u ON u.id=o.user_id WHERE o.status IN ('paid','refunded') AND o.paid_at IS NOT NULL${mo ? ` AND (${inMonth('o.paid_at')} OR (o.refunded_at IS NOT NULL AND ${inMonth('o.refunded_at')}))` : ''} ORDER BY o.paid_at, o.id` },
      payouts: { cols: ['code', 'paid_at', 'requested_at', 'approved_at', 'email', 'country', 'account_id', 'number', 'gross', 'split', 'amount', 'method', 'rail', 'status', 'batch', 'tx_hash'], sql: `SELECT p.code, ${ET('p.paid_at')}, ${ET('p.requested_at')}, ${ET('p.approved_at')}, u.email, u.country, p.account_id, p.number, p.gross, p.split, p.amount, p.method, p.rail, p.status, p.batch, p.tx_hash FROM payouts p JOIN users u ON u.id=p.user_id${mo ? ` WHERE p.status='paid' AND ${inMonth('p.paid_at')}` : ''} ORDER BY COALESCE(p.paid_at, p.requested_at), p.id` },
      commission: { cols: ['id', 'paid_at', 'email', 'code', 'amount', 'method', 'ref', 'paid_by'], rows: async () => { const ps = ((await db.one("SELECT v FROM kv WHERE k='store.affiliate.payments'")) || {}).v || []; const em = new Map((await db.all('SELECT id, email FROM users WHERE id = ANY($1)', [ps.map((p) => +p.user || 0)])).map((u) => [u.id, u.email])); const et = (d) => new Date(d).toLocaleString('sv-SE', { timeZone: 'America/New_York' }); return ps.filter((p) => !mo || et(p.at).slice(0, 7) === mo).map((p, i) => ({ id: p.id || 'AC-' + (i + 1), paid_at: et(p.at), email: em.get(+p.user) || '', code: p.code || '', amount: Number(p.amount).toFixed(2), method: p.method || '', ref: p.ref || '', paid_by: p.by || '' })); } },
      users: { cols: ['tid', 'created_at', 'email', 'first', 'last', 'country', 'role', 'status', 'kyc_status', 'tax_status', 'points'], sql: `SELECT tid, ${ET('created_at')}, email, first, last, country, role, status, kyc_status, tax_status, points FROM users${mo ? ` WHERE ${inMonth('created_at')}` : ''} ORDER BY id` },
      accounts: { cols: ['id', 'created_at', 'user_id', 'plan', 'size', 'kind', 'phase', 'start_bal', 'balance', 'floor', 'days_traded', 'payout_count', 'paid_total', 'passed_at', 'breached_at', 'breach_reason'], sql: `SELECT id, ${ET('created_at')}, user_id, plan, size, kind, phase, start_bal, balance, floor, days_traded, payout_count, paid_total, ${ET('passed_at')}, ${ET('breached_at')}, breach_reason FROM accounts${mo ? ` WHERE ${inMonth('created_at')}` : ''} ORDER BY created_at` } };
    if (!Q[w]) return res.status(404).end(); const rows = Q[w].rows ? await Q[w].rows() : await db.all(Q[w].sql, mo ? [mo] : []);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="fundedsky-${w}-${mo || today}.csv"`); res.send(csv(Q[w].cols, rows)); } catch (e) { console.error('export', e.message); res.status(500).send('error'); } });
  return r;
}
module.exports = { router };
