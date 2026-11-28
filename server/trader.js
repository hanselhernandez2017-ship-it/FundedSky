// Builds the trader app's data (same shapes the front end was designed around) from the database.
const db = require('./db');
const core = require('./core');
const R = require('./rules');
// Certificates (IDs, on/off switches, who holds which) live in server/certs.js; the names below are kept here for older callers
const { certId, certIdOld, certOff, LIFE, lifeCerts } = require('./certs');
const content = require('./content');
const I = require('./integrations');
const flows = require('./flows');
const { shortDate, longDate, ago, tradeDate, round2, sessId } = require('./util');

const K = (s) => s / 1000 + 'K';
const uaLabel = require('./util').uaLabel;
const tLabel = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

// A trader's reward and card codes. co: works at checkout, rs: works on a reset. Expired codes are left out.
async function myCodes(uid, rewardsOn = true) {
  const rows = await db.all("SELECT * FROM coupons WHERE user_id=$1 AND COALESCE(expires_at, created_at + interval '90 days') > now() ORDER BY created_at DESC", [uid]);
  return rows.filter((c) => rewardsOn || c.source === 'card').map((c) => ({ code: c.code, label: c.label, used: c.used, kind: c.kind, pct: Number(c.pct), exp: longDate(c.expires_at || new Date(new Date(c.created_at).getTime() + 90 * 86400000)), co: ['discount', 'free_eval'].includes(c.kind), rs: c.kind === 'free_reset' || c.kind === 'reset_discount' || (c.kind === 'discount' && (c.source === 'card' || !!(c.meta || {}).resets)), size: Number(c.size || (c.meta || {}).size) || 0 }));
}
// Credits History: 25 lines a page, newest first, with the number of lines in all
const PTS_PAGE = 25;
const ptsRow = (p) => [p.label, (p.delta > 0 ? '+' : '−') + Math.abs(p.delta).toLocaleString('en-US'), shortDate(p.created_at), p.kind || ''];
async function pointsPage(uid, page) {
  const pg = Math.max(0, parseInt(page, 10) || 0); const n = (await db.one('SELECT count(*)::int n FROM points_log WHERE user_id=$1 AND delta<>0', [uid])).n;
  const rows = await db.all('SELECT * FROM points_log WHERE user_id=$1 AND delta<>0 ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3', [uid, PTS_PAGE, pg * PTS_PAGE]);
  return { rows: rows.map(ptsRow), page: pg, total: n, per: PTS_PAGE };
}
// All-time totals from the whole ledger. They always add up: Earned − Spent − Taken Back ± Adjusted = Balance.
async function pointsTotals(uid, balance) {
  const t = await db.one(`SELECT COALESCE(sum(delta) FILTER (WHERE delta>0 AND kind NOT IN ('staff','grant')),0)::int earned,
    COALESCE(-sum(delta) FILTER (WHERE delta<0 AND kind NOT IN ('staff','grant','refund','chargeback')),0)::int spent,
    COALESCE(-sum(delta) FILTER (WHERE delta<0 AND kind IN ('refund','chargeback')),0)::int taken,
    COALESCE(sum(delta) FILTER (WHERE kind IN ('staff','grant')),0)::int adjusted, count(*) FILTER (WHERE delta<>0)::int n FROM points_log WHERE user_id=$1`, [uid]);
  t.adjusted += Number(balance) - (t.earned - t.spent - t.taken + t.adjusted); // a balance set outside the ledger shows as an adjustment
  return t;
}

async function boot(user, sessToken, host) {
  await require('./comps').sync().catch((e) => console.error('comps sync', e.message));
  const cat = await core.catalog();
  const uid = user.id;
  await require('./announce').deliver(user).catch((e) => console.error('announce', e.message));
  const [accts, days, trades, pays, orders, notes, tickets, msgs, sess, plog, coupons, methods, refs] = await Promise.all([
    db.all("SELECT * FROM accounts WHERE user_id=$1 ORDER BY (phase='breached'), (phase='closed'), created_at DESC", [uid]),
    db.all('SELECT d.* FROM days d JOIN accounts a ON a.id=d.account_id WHERE a.user_id=$1 ORDER BY day', [uid]),
    db.all("SELECT t.* FROM trades t JOIN accounts a ON a.id=t.account_id WHERE a.user_id=$1 AND t.day > (now() - interval '120 days')::date ORDER BY ts", [uid]),
    db.all('SELECT * FROM payouts WHERE user_id=$1 ORDER BY requested_at DESC', [uid]),
    db.all('SELECT * FROM orders WHERE user_id=$1 AND status<>$2 ORDER BY created_at DESC', [uid, 'canceled']),
    db.all('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30', [uid]),
    db.all('SELECT * FROM tickets WHERE user_id=$1 ORDER BY updated_at DESC', [uid]),
    db.all('SELECT m.*, u.first AS afirst FROM ticket_msgs m JOIN tickets t ON t.id=m.ticket_id LEFT JOIN users u ON u.id=m.author_id WHERE t.user_id=$1 AND m.internal=false ORDER BY m.created_at', [uid]),
    db.all('SELECT * FROM sessions WHERE user_id=$1 AND expires_at > now() ORDER BY seen_at DESC LIMIT 30', [uid]),
    db.all('SELECT * FROM points_log WHERE user_id=$1 AND delta<>0 ORDER BY created_at DESC, id DESC LIMIT $2', [uid, PTS_PAGE]),
    myCodes(uid),
    db.all('SELECT * FROM payout_methods WHERE user_id=$1 ORDER BY is_default DESC, created_at', [uid]),
    db.all("SELECT u.first, u.last, u.created_at, (SELECT min(paid_at) FROM orders o WHERE o.user_id=u.id AND o.status='paid') bought, (SELECT o.meta FROM orders o WHERE o.user_id=u.id AND o.status IN ('paid','refunded') AND o.kind NOT IN ('reset','credits') ORDER BY (o.meta ? 'refReward') DESC, (o.meta ? 'selfRef') DESC, o.paid_at, o.id LIMIT 1) m FROM users u WHERE referred_by=$1 ORDER BY u.created_at DESC LIMIT 50", [uid])
  ]);
  // Link clicks: the personal link plus the affiliate code, whatever letter case the link was typed in
  const AFFM = require('./affiliates'); const affMe = await AFFM.any(uid); const refN = await db.one("SELECT count(*)::int n, count(*) FILTER (WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id=u.id AND o.status='paid'))::int b FROM users u WHERE referred_by=$1", [uid]);
  const clicksMap = {}; (await db.all('SELECT v FROM kv WHERE upper(k) = ANY($1)', [[user.ref_code, affMe && affMe.code].filter(Boolean).map((c) => 'REFCLICKS.' + String(c).toUpperCase())])).forEach((r) => Object.entries(r.v || {}).forEach(([d, n]) => { clicksMap[d] = (clicksMap[d] || 0) + (+n || 0); }));
  const RSET = await core.referralSettings();
  // What each friend earned this trader: the reward recorded on the friend's order (orders from before it was recorded count as the usual reward)
  const refRw = (r) => { const m = r.m || {}; if (affMe) return { st: r.bought ? 'sale' : '' }; if (m.refReward) return m.refReward.back != null ? { st: 'back', pts: m.refReward.pts } : { st: 'ok', pts: m.refReward.pts }; if (m.selfRef) return { st: 'self' }; if (r.bought && !m.comm) return { st: 'ok', pts: RSET.pts }; return { st: r.bought ? 'none' : '' }; };
  const refPts = await db.one("SELECT COALESCE(sum(delta),0)::int n FROM points_log WHERE user_id=$1 AND label LIKE 'Friend%'", [uid]);
  const ordById = Object.fromEntries(orders.map((o) => [o.id, o]));
  const OPEN = core.OPEN_PAY; const cbOrders = orders.filter((o) => o.meta && o.meta.chargeback);
  const paySw = ((await db.one("SELECT v FROM kv WHERE k='store.risk.switches'")) || {}).v || {};

  const SUM = require('./ruletable').summary(cat); // copy around the rule tables, from the engine's own rules
  const PLANS = cat.plans.filter((p) => p.active).map((p) => ({ id: p.id, n: p.name, short: p.short, kind: p.kind, desc: p.desc, billing: 'one-time', badge: p.badge, sizes: p.sizes.map((s) => [s.size, core.priceOf(s)]), act: Object.fromEntries(p.sizes.map((s) => [s.size, s.activation])), rst: Object.fromEntries(p.sizes.map((s) => [s.size, (core.feesNow(cat, p.id, s.size) || {}).reset || 0])), split: SUM.split[p.id] || '', plats: p.platforms, addons: p.addons, rv: 1 }));
  const RULESET = Object.fromEntries(Object.entries(cat.evalRules).map(([z, r]) => [z, { target: r.target, dll: r.dll, dd: r.maxLoss, ct: r.contracts }]));
  const RULE_ALL = { minDays: cat.evalCommon.minDays, evalCons: cat.evalCommon.consistency, cons: cat.fundedCommon.consistency, split: cat.fundedCommon.split, payoutMin: cat.fundedCommon.payoutMin, winDays: cat.fundedCommon.winDays, winDayMin: cat.fundedCommon.winDayMin, ddType: 'Trailing, end of day', news: SUM.news, newsWho: SUM.newsWho, newsWin: SUM.newsWin, consTxt: SUM.cons, lockTxt: SUM.lock, resetPct: cat.resetPct };

  const daysBy = {}; days.forEach((d) => { (daysBy[d.account_id] = daysBy[d.account_id] || []).push(d); });
  const tradesBy = {}; trades.forEach((t) => { (tradesBy[t.account_id] = tradesBy[t.account_id] || []).push(t); });
  const today = tradeDate();

  const compsAll = ((await content.all()).competitions || []);
  const ACC = []; const HIST = [];
  for (const a of accts) {
    const r = R.rulesFor(cat, a); const p0 = cat.plans.find((x) => x.id === a.plan) || { name: a.plan, short: a.plan }; const cmp = a.comp ? (compsAll.find((x) => x.id === a.comp) || { n: 'Competition' }) : null; const p = cmp ? { name: cmp.n, short: 'Competition' } : p0;
    const o = ordById[a.order_id]; const s = core.feesOf(cat, a, o); // the fees this account was sold with
    const bal = Number(a.balance), start = Number(a.start_bal);
    const breached = a.phase === 'breached';
    const kind = breached ? 'breached' : a.kind;
    const opn = pays.filter((x) => x.account_id === a.id && OPEN.includes(x.status)); const stop = a.kind === 'funded' ? R.payoutStop(a, R.cbFor(a, cbOrders)) : '';
    const pendGross = opn.reduce((s2, x) => s2 + Number(x.gross), 0);
    const q = a.kind === 'funded' ? R.payoutQuote(cat, a, { pending: opn.some((x) => x.status !== 'failed'), failed: opn.some((x) => x.status === 'failed'), held: pendGross, stop }) : null;
    const pend = opn[0];
    const today_pnl = a.today_date === today ? Number(a.today_pnl) : 0;
    const floorGap = bal + pendGross - Number(a.floor); // money held for an unpaid payout still counts as in the account
    let status = 'On Track', st = 'ok';
    if (breached) { status = 'Breached'; st = 'no'; }
    else if (a.phase === 'passed') { status = 'Passed'; st = 'ok'; }
    else if (a.phase === 'review') { status = 'In Review'; st = 'sk'; }
    else if (a.phase === 'active' && a.sim && a.sim.paused) { status = 'Paused'; st = 'wa'; }
    else if (a.halted_today) { status = 'Paused Today'; st = 'no'; }
    else if (a.kind === 'funded' && q && q.ok) status = 'Payout Ready';
    else if (a.kind === 'funded' && pend && pend.status === 'failed') { status = 'Payout Not Sent'; st = 'no'; }
    else if (a.kind === 'funded' && pend) status = 'Payout in Review';
    else if (a.kind === 'funded') status = 'Funded';
    if (!breached && a.phase === 'active' && !a.halted_today && !(a.sim && a.sim.paused) && (floorGap < r.maxLoss * 0.3 || (!r.dllOff && r.dll > 0 && today_pnl < -r.dll * 0.5))) { status = 'Careful'; st = 'no'; } // a pause is the stronger state: Paused Today wins
    const dd = daysBy[a.id] || [];
    const curve = [start].concat(dd.map((d) => Number(d.eod_balance)));
    if (a.today_date === today && today_pnl) curve.push(bal);
    const steps = [];
    const sp = a.steps || {};
    if (sp.passed) steps.push(['Passed', shortDate(sp.passed)]);
    if (sp.agreement) steps.push(['Agreement Signed', shortDate(sp.agreement)]);
    if (sp.activation) steps.push(['Activation Fee Paid', shortDate(sp.activation)]);
    if (sp.funded) steps.push(['Funded Account Created', shortDate(sp.funded)]);
    const x = {
      id: a.id, kind, base: a.kind, phase: a.phase, pid: a.plan, instant: a.plan === 'instant', size: K(a.size), sz: a.size, platform: a.platform,
      bal: round2(bal), held: pendGross, start, today: round2(today_pnl), dllUsed: Math.max(0, -today_pnl), days: a.days_traded, best: Number(a.best_day),
      status, st, bought: shortDate(a.created_at), order: o ? o.code : '', peak: Number(a.peak_eod), addons: a.addons || [],
      cycle: (a.payout_count || 0) + 1, paid: Number(a.paid_total), payouts: a.payout_count || 0, funded: a.funded_at ? shortDate(a.funded_at) : '', steps,
      closed: a.breached_at ? shortDate(a.breached_at) : a.closed_at ? shortDate(a.closed_at) : '', breach: a.breach_reason || '',
      plan: p.name, planShort: p.short, rv: 1, dll: r.dllOff ? 0 : r.dll, dllOff: !!r.dllOff || !r.dll, dllMode: r.dllMode, ddAmt: r.maxLoss, ddLabel: { eod: 'Max Loss (Trailing, End of Day)', intraday: 'Max Loss (Trailing, Intraday)', static: 'Max Loss (Static)' }[r.ddType] || 'Max Loss (Trailing, End of Day)', ct: R.allowedContracts(r, a), ctMax: r.fullContracts || r.contracts, scaling: !!r.scaling, minDays: r.minDays || 0, consOff: !!r.consOff, newsTxt: r.news ? `No new orders ${r.news.win} min before and after` : 'Allowed', holdTxt: r.overnight === false ? `Flat by ${require('./ruletable').t12(r.closeAt)} ET each day` : r.weekend === false ? `Flat by ${require('./ruletable').t12(r.closeAt)} ET Friday` : 'Allowed', scalpTxt: r.scalp ? `Trades under ${r.scalp.hold}s: max ${r.scalp.pct}% of profit` : 'Allowed', idleDays: r.inactivity || 0,
      cons: r.consistency, split: r.split || cat.fundedCommon.split, buffer: r.kind === 'funded' ? (r.buffer != null ? r.buffer : r.cushion) || 0 : 0,
      floor: Number(a.floor), price: s.price, activation: s.activation || 0, payoutMin: r.payoutMin, winDayMin: r.winDayMin, freeResets: a.free_resets, resets: a.reset_count,
      halted: a.halted_today, comp: a.comp || null, curve, created: a.created_at, parent: a.parent_id,
      dl: dd.map((d) => ({ iso: d.day, pnl: Number(d.pnl) })).concat(a.today_date === today && today_pnl ? [{ iso: today, pnl: round2(today_pnl) }] : []),
      maxQty: (tradesBy[a.id] || []).reduce((m, t) => Math.max(m, t.qty), 0), posViol: (tradesBy[a.id] || []).filter((t) => t.over_limit != null).length
    };
    if (a.kind === 'evaluation') {
      x.target = start + r.target; x.goal = r.target;
      const profit = bal - start; x.consNow = profit > 0 ? Math.round((x.best / profit) * 100) : 0;
      x.checks = R.evalChecks(cat, a);
      x.resetPrice = s.reset;
      if (a.phase === 'passed') { const fr = R.rulesFor(cat, Object.assign({}, a, { kind: 'funded', payout_count: 0 })); x.fLock = fr.lockAt; x.fReview = fr.reviewAfter || null; } // the funded rules the agreement quotes
    } else {
      x.target = start + (r.instant && !(a.payout_count > 0) ? r.goal : Math.ceil(r.payoutMin / (r.split / 100)) + r.cushion);
      x.goal = r.goal || 0;
      x.avail = q && q.ok ? q.max : 0; x.maxAvail = q ? q.max : 0; x.quote = q; x.cap = r.cap; x.lifetime = r.lifetime; x.winDays = a.cycle_win_days; x.needWin = (a.addons || []).includes('daily') ? 1 : r.winDays;
      if ((a.addons || []).includes('daily')) x.consOff = true; // Daily Payouts: one winning day per cycle, so the best-day rule does not apply (rules.payoutQuote)
      const cp = q ? q.cycleProfit : 0; x.consNow = cp > 0 ? Math.round((Number(a.cycle_best) / cp) * 100) : 0;
      x.pending = pend ? { code: pend.code, amt: Number(pend.amount), st: pend.status } : null; x.stop = stop;
    }
    (a.phase === 'closed' ? HIST : ACC).push(x);
  }

  // Daily P&L across the trader's accounts (weekdays only)
  const byDay = {}; days.forEach((d) => { const k = d.day; byDay[k] = byDay[k] || { pnl: 0, n: 0 }; byDay[k].pnl += Number(d.pnl); byDay[k].n += d.n_trades; });
  accts.forEach((a) => { if (a.today_date === today && Number(a.today_pnl)) { byDay[today] = byDay[today] || { pnl: 0, n: 0 }; byDay[today].pnl += Number(a.today_pnl); } });
  trades.filter((t) => t.day === today).forEach(() => { byDay[today] = byDay[today] || { pnl: 0, n: 0 }; byDay[today].n += 1; });
  const first = accts.length ? accts.reduce((m, a) => (a.created_at < m ? a.created_at : m), accts[0].created_at) : new Date();
  const firstDay = days.length ? new Date(days[0].day + 'T12:00:00Z') : null; const startAt = firstDay && firstDay < new Date(first) ? firstDay : first;
  const DAYS = []; let d0 = new Date(new Date(startAt).toISOString().slice(0, 10) + 'T12:00:00Z');
  const lim = new Date(Date.now() - 92 * 86400000); if (d0 < lim) d0 = lim;
  for (let d = new Date(d0); d.toISOString().slice(0, 10) <= today; d = new Date(d.getTime() + 86400000)) {
    if ([0, 6].includes(d.getUTCDay())) continue; const k = d.toISOString().slice(0, 10);
    DAYS.push({ iso: k, pnl: round2((byDay[k] || {}).pnl || 0), n: (byDay[k] || {}).n || 0 });
  }
  const TRADES = trades.map((t) => ({ day: t.day, t: tLabel(t.ts), ts: t.ts, ins: t.instrument, side: t.side, qty: t.qty, acct: t.account_id, pnl: Number(t.pnl), hold: t.hold_min + 'm', tag: t.tag }));

  const PAYOUTS = pays.map((p) => ({ id: p.code, acct: p.account_id, amt: Number(p.amount), gross: Number(p.gross), method: p.method, rail: p.rail, req: shortDate(p.requested_at), appr: p.approved_at ? shortDate(p.approved_at) : '', paid: p.paid_at ? shortDate(p.paid_at) : '', paidIso: p.paid_at, batch: p.batch || '', st: p.status === 'paid' ? 'paid' : p.status === 'denied' ? 'denied' : p.status === 'failed' ? 'failed' : 'pending', stage: p.status, cycle: p.number, note: p.note, tx: p.tx_hash || '' }));
  const kindName = { evaluation: 'Evaluation', instant: 'Instant', reset: 'Reset', activation: 'Activation', mixed: 'Evaluation and Instant', credits: 'Credits' };
  const ORDERS = orders.map((o) => ({ id: o.code, d: shortDate(o.paid_at || o.created_at), what: o.lines.filter((l) => l.kind === 'plan' || !l.kind).map((l) => l.label).join(', ') || kindName[o.kind], kind: kindName[o.kind] || o.kind, lines: o.lines.map((l) => [l.label, Number(l.amount)]), amt: Number(o.total), pay: o.pay_method || (o.provider === 'test' ? 'Test Card •••• 4242' : ''), st: o.status === 'paid' ? 'Paid' : o.status === 'refunded' ? 'Refunded' : o.status === 'pending' ? 'Pending' : 'Failed', note: o.refunded_at ? 'Refunded ' + shortDate(o.refunded_at) + (o.meta && o.meta.refundTook ? ' · ' + o.meta.refundTook : '') : '', accounts: (o.meta && o.meta.accounts) || [] }));
  const pkOn = await require('./packs').enabled(); // with Packs switched off, notices that only point at the hidden Packs page are left out
  const NOTES = ((user.settings || {}).nPush === false ? [] : notes).filter((n) => pkOn || n.go !== 'packs').map((n) => ({ id: 'n' + n.id, nid: n.id, t: n.title, s: n.body, ago: ago(n.created_at), go: n.go, read: n.read }));
  const TFILES = await require('./files').forTickets(tickets.map((t) => t.id), { trader: true }); // attachments on each message: the 4th value, [{ id, name, mime, size }]
  const TICKETS = tickets.map((t) => ({ id: t.id, s: t.subject, cat: t.category, ch: t.channel, st: t.status, rating: t.rating, upd: ago(t.updated_at), msgs: msgs.filter((m) => m.ticket_id === t.id).map((m) => [m.staff ? 'them' : 'me', m.body, new Date(m.created_at).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + (m.staff ? ' · ' + (m.afirst || 'Support') : ''), TFILES[m.id] || []]) }));
  const SESS = sess.map((s) => [uaLabel(s.ua), s.ip ? 'IP ' + s.ip.replace(/^::ffff:/, '') : '', s.token === sessToken ? 'Active now' : /^just now$/i.test(ago(s.seen_at)) ? 'Active now' : 'Active ' + ago(s.seen_at).toLowerCase(), s.token === sessToken, sessId(s.token)]);
  const ag = user.agreements || {};
  const LEGAL = require('./legal'); const VERS = await LEGAL.versions(); const REACCEPT = await LEGAL.pending(user);
  const AGREE = VERS.filter((d) => ag[d.key]).map((d) => [d.name, 'v' + d.v, (REACCEPT.some((x) => x.key === d.key) ? 'New version to accept · last accepted ' : 'Accepted ') + longDate(ag[d.key]), d.url]);
  const PTS_LOG = plog.map(ptsRow); const PTS_TOT = await pointsTotals(uid, user.points);
  // Certificates, newest first. d is what the shared design (web/runtime/cert.js) draws; revoked ones are left out.
  const COFF = await certOff(); const CV = ((await db.one("SELECT v FROM kv WHERE k='certviews'")) || {}).v || {}; const REVK = await require('./certs').revoked();
  const CERTS = (await require('./certs').forUser(user, accts, pays, cat)).filter((c) => !REVK.includes(c.id)).map((c) => ({ id: c.id, k: c.k, v: c.v, n: c.n + ' ' + (c.day ? require('./util').dayLabel(c.day) + ', ' + c.day.slice(0, 4) : longDate(c.when)), views: CV[c.id] || 0, d: c.d }));

  const C = await content.all();
  const prog = (user.settings && user.settings.courses) || {};
  // Education switched off: no courses or lessons are sent at all. Otherwise only published courses that have lessons.
  const eduOn = (((await db.one("SELECT v FROM kv WHERE k='settings.flags'")) || {}).v || {}).education !== false;
  const LIVEC = eduOn ? content.liveCourses(C) : [];
  const COURSES = LIVEC.map(({ lessons, ...c }) => ({ ...c, done: Math.max(0, Math.min(c.l, parseInt(prog[c.id], 10) || 0)) }));
  const LESSONS = Object.fromEntries(LIVEC.map((c) => [c.id, c.lessons]));
  // Credits really paid for finished courses, from the ledger
  const eduPts = (await db.one("SELECT COALESCE(sum(delta),0)::int n FROM points_log WHERE user_id=$1 AND delta > 0 AND (ref LIKE 'course:%' OR (ref = '' AND label LIKE 'Finished %'))", [uid])).n;
  const fmt = (v) => '$' + Number(v).toLocaleString('en-US');
  const sizes = [25000, 50000, 100000, 150000];
  // Rules tables for Resources, from the same effective rules the engine uses. Plans with identical rules share one table.
  // Rules tables for Resources, from the same effective rules the engine uses (server/ruletable.js). Plans with identical rules share one table.
  // News calendar rows, with the Must Be Flat mark staff set in Risk > News Calendar as a fifth value
  const flatBy = ((await db.one("SELECT v FROM kv WHERE k='store.risk.news'")) || {}).v || {}; const NEWS = (C.news || []).map((n) => ((flatBy[n[0] + '|' + n[2]] || {}).flat ? [n[0], n[1], n[2], n[3], true] : n));
  const RT = require('./ruletable'); const RULESETS = [];
  cat.plans.filter((p) => p.active && p.id !== 'instant' && p.kind !== 'funded').forEach((p) => { const t = RT.planTable(cat, p.id); if (!t) return; const same = RULESETS.find((x) => JSON.stringify(x.rows) === JSON.stringify(t.rows) && JSON.stringify(x.sizes) === JSON.stringify(t.sizes)); if (same) same.plans.push(p.short); else RULESETS.push({ plans: [p.short], rows: t.rows, sizes: t.sizes }); });
  RULESETS.forEach((x) => { x.names = x.plans.length > 1 ? x.plans.slice(0, -1).join(', ') + ' and ' + x.plans[x.plans.length - 1] : x.plans[0]; });
  const PLANRULES = RULESETS.length ? RULESETS[0].rows : [];
  const instP = cat.plans.find((p) => p.id === 'instant' && p.active); const instT = instP ? RT.planTable(cat, 'instant') : null;
  const INSTRULES = instT ? instT.rows : null; const INSTSIZES = instT ? instT.sizes : [];
  const nowIso = new Date().toISOString().slice(0, 10);
  const PROMOS = (cat.promos || []).filter((p) => p.active && !(Number(p.total) === 1) && (!p.ends || p.ends >= nowIso)).map((p) => ({ code: p.code, n: p.name, d: p.desc, pct: p.pct, plans: p.plans, when: (p.starts ? shortDate(p.starts + 'T12:00:00Z') : '') + (p.ends ? ' to ' + shortDate(p.ends + 'T12:00:00Z') : ''), ends: p.ends ? shortDate(p.ends + 'T12:00:00Z') : '', live: !p.starts || p.starts <= nowIso, note: p.once ? 'One use per trader. Not combined with bundles.' : '' }));

  return {
    payPaused: !!paySw.payouts, CAL: require('./calendar').calendar(),
    now: new Date().toISOString(), today, payMode: require('./payments').mode(), payCfg: (() => { const m = require('./payments').methods() || {}; return { card: m.card || 'test', wallets: String(m.card || '').startsWith('stripe') || m.backup === 'stripe', crypto: !!m.crypto }; })(), flags: Object.assign({ competitions: true, rewards: true, affiliates: true, education: true, cryptoPayouts: true, packs: true }, ((await db.one("SELECT v FROM kv WHERE k='settings.flags'")) || {}).v || {}), integ: { sumsub: await I.on('sumsub'), track1099: await I.on('track1099'), rise: await I.on('rise'), crisp: await I.on('crisp') },
    ME: { aff: await require('./affiliates').summary(user.id), first: user.first, last: (user.last || '').slice(0, 1) + '.', lastFull: user.last, full: `${user.first} ${user.last}`, ini: ([user.first, user.last].map((x) => (String(x || '').match(/[\p{L}\p{N}]/u) || [''])[0]).join('').toUpperCase() || '?'), email: user.email, country: user.country, phone: user.phone || '', phoneSplit: require('./phone').split(user.phone, (user.settings || {}).phoneIso, user.country), dials: require('./phone').DIAL, since: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), tid: user.tid, ref: `${host}/?ref=${user.ref_code}`, refCode: user.ref_code, verified: user.verified, mfa: !!user.mfa_on, mfaLeft: user.mfa_on ? (user.mfa_backup || []).length : 0, bkNote: user.mfa_on && sess.some((x) => x.token === sessToken && x.bknote) ? (user.mfa_backup || []).length : null, kyc: user.kyc_status, kycReason: user.kyc_status === 'rejected' ? ((user.kyc || {}).rejectReason || '') : '', status: user.status, tax: await flows.taxSync(user), taxSelf: /^self:/.test(user.tax_ref || '') ? String(user.tax_ref).slice(5) : '', rise: user.rise_status, role: user.role, pts: user.points, settings: user.settings || {}, affAgain: (user.settings || {}).affDeclined ? new Date(new Date(user.settings.affDeclined).getTime() + AFFM.REAPPLY_DAYS * 86400000).toISOString() : null, refs: { n: refN.n, bought: refN.b, clicksAll: Object.values(clicksMap).reduce((a, v) => a + v, 0), list: refs.map((r) => ({ n: (r.first || '?')[0] + '•••• ' + (r.last || '?')[0] + '.', joined: shortDate(r.created_at), bought: r.bought ? shortDate(r.bought) : '', rw: refRw(r) })), clicks: Array.from({ length: 30 }, (_, i) => { const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10); return clicksMap[d] || 0; }), pts: refPts.n } },
    PLANS, RULESET, RULE_ALL, INSTSIZES, ADDONS: Object.fromEntries(Object.entries(cat.addons).map(([k, a]) => [k, [a.name, a.flat != null && Number(a.flat) > 0 ? '+$' + Number(a.flat) : '+' + a.pct + '%', a.desc]])), PROMOS, BUNDLES: (cat.bundles || []).map((b) => [b.buy, b.get]),
    ACC, HIST, DAYS, TRADES, PAYOUTS, ORDERS, NOTES, COURSES, RELNOTES: (C.notes || []).filter((n) => n && n.st === 'published' && n.t).sort((a, b) => String(b.at || '').localeCompare(String(a.at || ''))).slice(0, 5).map((n) => ({ t: String(n.t), items: [].concat(n.items || []).map(String).slice(0, 8), d: n.at ? shortDate(n.at) : '' })), LESSONS, EDUPTS: eduPts, REWARDS: await content.rewards(), EARN: C.earn, PTS_LOG, PTS_TOT, PTS_PER: PTS_PAGE, CERTS, CERT_LIFE: !COFF['Lifetime Payouts'], CERT_COMP: !COFF.Competition, CERT_FULL: (user.settings || {}).certFull === true,
    LB: C.leaderboard, COMPS: await require('./comps').forTrader(uid), CPRIZES: C.cprizes, ARTICLES: (C.articles || []).filter((a) => a[3] !== 'Draft'), REACCEPT, SUPPORT: await require('./support').publicInfo(), PAYRAILS: await (async () => { const off = ((await db.one("SELECT v FROM kv WHERE k='store.finance.rails'")) || {}).v || {}; const fl = ((await db.one("SELECT v FROM kv WHERE k='settings.flags'")) || {}).v || {}; return { Rise: off.rise !== false, USDC: off.usdc !== false && fl.cryptoPayouts !== false }; })(), TOPICS: C.topics, TICKETS, SESS, AGREE, NEWS, NEWSWK: content.newsWeek(C.news), PLANRULES, RULESETS, INSTRULES, AFFTIERS: (await require('./affiliates').tiers()).map((t) => [t.name, t.how, t.rate + '%', t.disc + '%']), AFFSET: await require('./affiliates').settings(), REFSET: RSET,
    METHODS: methods.map((m) => ({ id: m.id, rail: m.rail, label: m.label, def: m.is_default, locked: new Date(m.unlock_at) > new Date(), unlock: new Date(m.unlock_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET' })),
    PACKS: await require('./packs').traderData(uid),
    COUPONS: coupons,
    caps: { funded: cat.fundedCaps, instant: cat.instantCaps, instantRules: cat.instantRules, instantCommon: cat.instantCommon, fundedCommon: cat.fundedCommon }
  };
}
// One-time: orders saved before order names read size, plan, then what was bought ("Prime $50K" -> "$50K Prime · Evaluation",
// "Reset · $25K Essential" -> "$25K Essential · Reset", "Activation Fee · $25K Essential" -> "$25K Essential · Activation Fee")
async function migrateOrderNames() {
  if (await db.one("SELECT 1 FROM kv WHERE k='mig.orders.names'")) return;
  const cat = await core.catalog(); const kindOf = {}; cat.plans.forEach((p) => { kindOf[p.short] = p.kind; });
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const shorts = Object.keys(kindOf).map(esc).join('|');
  const name = (l) => { const s = String(l || ''); let m;
    if (shorts && (m = s.match(new RegExp('^(' + shorts + ') (\\$\\d+(?:\\.\\d+)?K)( × \\d+)?$')))) return `${m[2]} ${m[1]} · ${kindOf[m[1]] === 'funded' ? 'Funded Account' : 'Evaluation'}${m[3] || ''}`;
    if ((m = s.match(/^(Reset|Activation Fee) · (\$\d+(?:\.\d+)?K) (.+)$/))) return `${m[2]} ${m[3]} · ${m[1]}`;
    return s; };
  const rows = await db.all("SELECT id, lines FROM orders WHERE kind IN ('evaluation','instant','mixed','reset','activation')");
  for (const o of rows) { let ch = false; const L = (o.lines || []).map((l) => { if (l && (l.kind === 'plan' || !l.kind)) { const n = name(l.label); if (n !== l.label) { ch = true; return Object.assign({}, l, { label: n }); } } return l; });
    if (ch) await db.q('UPDATE orders SET lines=$2 WHERE id=$1', [o.id, JSON.stringify(L)]); }
  await db.q("INSERT INTO kv(k,v) VALUES('mig.orders.names','true'::jsonb) ON CONFLICT (k) DO NOTHING");
}
module.exports = { migrateOrderNames, certId, certIdOld, boot, certOff, LIFE, lifeCerts, myCodes, pointsPage };
