// Builds the trader app's data (same shapes the front end was designed around) from the database.
const db = require('./db');
const core = require('./core');
const R = require('./rules');
const content = require('./content');
const I = require('./integrations');
const flows = require('./flows');
const { shortDate, longDate, ago, tradeDate, round2 } = require('./util');

const K = (s) => s / 1000 + 'K';
const uaLabel = (ua) => {
  const b = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'Browser';
  const o = /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Unknown';
  return `${b} on ${o}`;
};
const tLabel = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

async function boot(user, sessToken, host) {
  const cat = await core.catalog();
  const uid = user.id;
  const [accts, days, trades, pays, orders, notes, tickets, msgs, sess, plog, coupons, methods, refs] = await Promise.all([
    db.all("SELECT * FROM accounts WHERE user_id=$1 ORDER BY (phase='breached'), (phase='closed'), created_at DESC", [uid]),
    db.all('SELECT d.* FROM days d JOIN accounts a ON a.id=d.account_id WHERE a.user_id=$1 ORDER BY day', [uid]),
    db.all("SELECT t.* FROM trades t JOIN accounts a ON a.id=t.account_id WHERE a.user_id=$1 AND t.day > (now() - interval '120 days')::date ORDER BY ts", [uid]),
    db.all('SELECT * FROM payouts WHERE user_id=$1 ORDER BY requested_at DESC', [uid]),
    db.all('SELECT * FROM orders WHERE user_id=$1 AND status<>$2 ORDER BY created_at DESC', [uid, 'canceled']),
    db.all('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30', [uid]),
    db.all('SELECT * FROM tickets WHERE user_id=$1 ORDER BY updated_at DESC', [uid]),
    db.all('SELECT m.*, u.first AS afirst FROM ticket_msgs m JOIN tickets t ON t.id=m.ticket_id LEFT JOIN users u ON u.id=m.author_id WHERE t.user_id=$1 AND m.internal=false ORDER BY m.created_at', [uid]),
    db.all('SELECT * FROM sessions WHERE user_id=$1 AND expires_at > now() ORDER BY seen_at DESC LIMIT 8', [uid]),
    db.all('SELECT * FROM points_log WHERE user_id=$1 ORDER BY created_at DESC LIMIT 40', [uid]),
    db.all('SELECT * FROM coupons WHERE user_id=$1 ORDER BY created_at DESC', [uid]),
    db.all('SELECT * FROM payout_methods WHERE user_id=$1 ORDER BY is_default DESC, created_at', [uid]),
    db.all("SELECT u.first, u.last, u.created_at, (SELECT min(paid_at) FROM orders o WHERE o.user_id=u.id AND o.status='paid') bought FROM users u WHERE referred_by=$1 ORDER BY u.created_at DESC LIMIT 50", [uid])
  ]);
  const clicksRow = await db.one('SELECT v FROM kv WHERE k=$1', ['refclicks.' + user.ref_code]);
  const clicksMap = (clicksRow && clicksRow.v) || {};
  const refPts = await db.one("SELECT COALESCE(sum(delta),0)::int n FROM points_log WHERE user_id=$1 AND label LIKE 'Friend%'", [uid]);
  const ordById = Object.fromEntries(orders.map((o) => [o.id, o]));
  const pending = new Set(pays.filter((p) => ['requested', 'approved'].includes(p.status)).map((p) => p.account_id));

  const PLANS = cat.plans.filter((p) => p.active).map((p) => ({ id: p.id, n: p.name, short: p.short, kind: p.kind, desc: p.desc, billing: 'one-time', badge: p.badge, sizes: p.sizes.map((s) => [s.size, s.price]), act: Object.fromEntries(p.sizes.map((s) => [s.size, s.activation])), plats: p.platforms, addons: p.addons, rv: 1 }));
  const RULESET = Object.fromEntries(Object.entries(cat.evalRules).map(([z, r]) => [z, { target: r.target, dll: r.dll, dd: r.maxLoss, ct: r.contracts }]));
  const RULE_ALL = { minDays: cat.evalCommon.minDays, evalCons: cat.evalCommon.consistency, cons: cat.fundedCommon.consistency, split: cat.fundedCommon.split, payoutMin: cat.fundedCommon.payoutMin, winDays: cat.fundedCommon.winDays, winDayMin: cat.fundedCommon.winDayMin, ddType: 'Trailing, end of day', news: '2 minutes before and after high-impact news', resetPct: cat.resetPct };

  const daysBy = {}; days.forEach((d) => { (daysBy[d.account_id] = daysBy[d.account_id] || []).push(d); });
  const tradesBy = {}; trades.forEach((t) => { (tradesBy[t.account_id] = tradesBy[t.account_id] || []).push(t); });
  const today = tradeDate();

  const ACC = []; const HIST = [];
  for (const a of accts) {
    const r = R.rulesFor(cat, a); const p = cat.plans.find((x) => x.id === a.plan) || { name: a.plan, short: a.plan };
    const s = core.sizeDef(cat, a.plan, a.size) || { price: 0, activation: 0 };
    const o = ordById[a.order_id];
    const bal = Number(a.balance), start = Number(a.start_bal);
    const breached = a.phase === 'breached';
    const kind = breached ? 'breached' : a.kind;
    const q = a.kind === 'funded' ? R.payoutQuote(cat, a, { pending: pending.has(a.id) }) : null;
    const pend = pays.find((x) => x.account_id === a.id && ['requested', 'approved'].includes(x.status));
    const pendGross = pend ? Number(pend.gross) : 0;
    const today_pnl = a.today_date === today ? Number(a.today_pnl) : 0;
    const floorGap = bal - Number(a.floor);
    let status = 'On Track', st = 'ok';
    if (breached) { status = 'Breached'; st = 'no'; }
    else if (a.phase === 'passed') { status = 'Passed'; st = 'ok'; }
    else if (a.phase === 'review') { status = 'In Review'; st = 'sk'; }
    else if (a.halted_today) { status = 'Paused Today'; st = 'no'; }
    else if (a.kind === 'funded' && q && q.ok) status = 'Payout Ready';
    else if (a.kind === 'funded' && pend) status = 'Payout in Review';
    else if (a.kind === 'funded') status = 'Funded';
    if (!breached && a.phase === 'active' && (floorGap < r.maxLoss * 0.3 || today_pnl < -r.dll * 0.5)) { status = 'Careful'; st = 'no'; }
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
      id: a.id, kind, phase: a.phase, pid: a.plan, instant: a.plan === 'instant', size: K(a.size), sz: a.size, platform: a.platform,
      bal: round2(bal), held: pendGross, start, today: round2(today_pnl), dllUsed: Math.max(0, -today_pnl), days: a.days_traded, best: Number(a.best_day),
      status, st, bought: shortDate(a.created_at), order: o ? o.code : '', peak: Number(a.peak_eod), addons: a.addons || [],
      cycle: (a.payout_count || 0) + 1, paid: Number(a.paid_total), payouts: a.payout_count || 0, funded: a.funded_at ? shortDate(a.funded_at) : '', steps,
      closed: a.breached_at ? shortDate(a.breached_at) : a.closed_at ? shortDate(a.closed_at) : '', breach: a.breach_reason || '',
      plan: p.name, planShort: p.short, rv: 1, dll: r.dll, ddAmt: r.maxLoss, ct: r.contracts, minDays: r.minDays || 0,
      cons: a.kind === 'evaluation' ? cat.evalCommon.consistency : r.consistency, split: r.split || cat.fundedCommon.split,
      floor: Number(a.floor), price: s.price, activation: s.activation || 0, freeResets: a.free_resets, resets: a.reset_count,
      halted: a.halted_today, curve, created: a.created_at, parent: a.parent_id,
      dl: dd.map((d) => ({ iso: d.day, pnl: Number(d.pnl) })).concat(a.today_date === today && today_pnl ? [{ iso: today, pnl: round2(today_pnl) }] : []),
      maxQty: (tradesBy[a.id] || []).reduce((m, t) => Math.max(m, t.qty), 0)
    };
    if (a.kind === 'evaluation') {
      x.target = start + r.target; x.goal = r.target;
      const profit = bal - start; x.consNow = profit > 0 ? Math.round((x.best / profit) * 100) : 0;
      x.checks = R.evalChecks(cat, a);
      x.resetPrice = Math.round(s.price * cat.resetPct / 100);
    } else {
      x.target = start + (r.instant && !(a.payout_count > 0) ? r.goal : Math.ceil(r.payoutMin / (r.split / 100)) + r.cushion);
      x.goal = r.goal || 0;
      x.avail = q && q.ok ? q.max : 0; x.maxAvail = q ? q.max : 0; x.quote = q; x.cap = r.cap; x.lifetime = r.lifetime; x.winDays = a.cycle_win_days; x.needWin = (a.addons || []).includes('daily') ? 1 : r.winDays;
      const cp = q ? q.cycleProfit : 0; x.consNow = cp > 0 ? Math.round((Number(a.cycle_best) / cp) * 100) : 0;
      x.pending = pend ? { code: pend.code, amt: Number(pend.amount), st: pend.status } : null;
    }
    (a.phase === 'closed' ? HIST : ACC).push(x);
  }

  // Daily P&L across the trader's accounts (weekdays only)
  const byDay = {}; days.forEach((d) => { const k = d.day; byDay[k] = byDay[k] || { pnl: 0, n: 0 }; byDay[k].pnl += Number(d.pnl); byDay[k].n += d.n_trades; });
  accts.forEach((a) => { if (a.today_date === today && Number(a.today_pnl)) { byDay[today] = byDay[today] || { pnl: 0, n: 0 }; byDay[today].pnl += Number(a.today_pnl); } });
  trades.filter((t) => t.day === today).forEach(() => { byDay[today] = byDay[today] || { pnl: 0, n: 0 }; byDay[today].n += 1; });
  const first = accts.length ? accts.reduce((m, a) => (a.created_at < m ? a.created_at : m), accts[0].created_at) : new Date();
  const DAYS = []; let d0 = new Date(new Date(first).toISOString().slice(0, 10) + 'T12:00:00Z');
  const lim = new Date(Date.now() - 92 * 86400000); if (d0 < lim) d0 = lim;
  for (let d = new Date(d0); d.toISOString().slice(0, 10) <= today; d = new Date(d.getTime() + 86400000)) {
    if ([0, 6].includes(d.getUTCDay())) continue; const k = d.toISOString().slice(0, 10);
    DAYS.push({ iso: k, pnl: round2((byDay[k] || {}).pnl || 0), n: (byDay[k] || {}).n || 0 });
  }
  const TRADES = trades.map((t) => ({ day: t.day, t: tLabel(t.ts), ts: t.ts, ins: t.instrument, side: t.side, qty: t.qty, acct: t.account_id, pnl: Number(t.pnl), hold: t.hold_min + 'm', tag: t.tag }));

  const PAYOUTS = pays.map((p) => ({ id: p.code, acct: p.account_id, amt: Number(p.amount), gross: Number(p.gross), method: p.method, rail: p.rail, req: shortDate(p.requested_at), appr: p.approved_at ? shortDate(p.approved_at) : '', paid: p.paid_at ? shortDate(p.paid_at) : '', paidIso: p.paid_at, batch: p.batch || '', st: p.status === 'paid' ? 'paid' : p.status === 'denied' ? 'denied' : 'pending', stage: p.status, cycle: p.number, note: p.note }));
  const kindName = { evaluation: 'Evaluation', instant: 'Instant', reset: 'Reset', activation: 'Activation', mixed: 'Evaluation' };
  const ORDERS = orders.map((o) => ({ id: o.code, d: shortDate(o.created_at), what: o.lines.filter((l) => l.kind === 'plan' || !l.kind).map((l) => l.label).join(', ') || kindName[o.kind], kind: kindName[o.kind] || o.kind, lines: o.lines.map((l) => [l.label, Number(l.amount)]), amt: Number(o.total), pay: o.pay_method || (o.provider === 'test' ? 'Test card' : ''), st: o.status === 'paid' ? 'Paid' : o.status === 'refunded' ? 'Refunded' : o.status === 'pending' ? 'Pending' : 'Failed', note: o.refunded_at ? 'Refunded ' + shortDate(o.refunded_at) : '', accounts: (o.meta && o.meta.accounts) || [] }));
  const NOTES = notes.map((n) => ({ id: 'n' + n.id, nid: n.id, t: n.title, s: n.body, ago: ago(n.created_at), go: n.go, read: n.read }));
  const TICKETS = tickets.map((t) => ({ id: t.id, s: t.subject, cat: t.category, ch: t.channel, st: t.status, upd: ago(t.updated_at), msgs: msgs.filter((m) => m.ticket_id === t.id).map((m) => [m.staff ? 'them' : 'me', m.body, new Date(m.created_at).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + (m.staff ? ' · ' + (m.afirst || 'Support') : '')]) }));
  const SESS = sess.map((s) => [uaLabel(s.ua), s.ip ? 'IP ' + s.ip.replace(/^::ffff:/, '') : '', s.token === sessToken ? 'This device' : 'Active ' + ago(s.seen_at).toLowerCase(), s.token === sessToken, s.token.slice(0, 10)]);
  const ag = user.agreements || {};
  const AGREE = [['Terms of Service', 'v1.0', ag.terms], ['Privacy Policy', 'v1.0', ag.privacy], ['Risk Disclosure', 'v1.0', ag.risk], ['Refund Policy', 'v1.0', ag.refund], ['Funded Trader Agreement', 'v1.0', ag.funded]].filter((x) => x[2]).map(([n, v, d]) => [n, v, 'Accepted ' + longDate(d), '']);
  const PTS_LOG = plog.map((p) => [p.label, (p.delta > 0 ? '+' : '−') + Math.abs(p.delta).toLocaleString('en-US'), shortDate(p.created_at)]);
  const CERTS = [];
  pays.filter((p) => p.status === 'paid').forEach((p) => CERTS.push({ id: 'CF-' + p.code.slice(3), k: 'Payout', v: '$' + Math.round(p.amount).toLocaleString('en-US'), n: 'Paid ' + longDate(p.paid_at), views: 0 }));
  accts.filter((a) => a.kind === 'funded' && a.funded_at).forEach((a) => CERTS.push({ id: 'CF-F' + a.id.slice(-4), k: 'Funded', v: '$' + K(a.size) + ' Funded Account', n: 'Funded ' + longDate(a.funded_at), views: 0 }));
  accts.filter((a) => a.passed_at).forEach((a) => CERTS.push({ id: 'CF-P' + a.id.slice(-4), k: 'Passed', v: '$' + K(a.size) + ' Evaluation', n: 'Passed ' + longDate(a.passed_at), views: 0 }));

  const C = await content.all();
  const prog = (user.settings && user.settings.courses) || {};
  const COURSES = C.courses.map((c) => ({ ...c, done: Math.min(c.l, prog[c.id] || 0) }));
  const fmt = (v) => '$' + Number(v).toLocaleString('en-US');
  const sizes = [25000, 50000, 100000, 150000];
  const PLANRULES = [['Profit Target', ...sizes.map((z) => fmt(cat.evalRules[z].target))], ['Daily Loss Limit', ...sizes.map((z) => fmt(cat.evalRules[z].dll))], ['Max Loss (trailing, end of day)', ...sizes.map((z) => fmt(cat.evalRules[z].maxLoss))], ['Max Position Size', ...sizes.map((z) => cat.evalRules[z].contracts + ' contracts')], ['Minimum Trading Days', ...sizes.map(() => String(cat.evalCommon.minDays))], ['Consistency to Pass', ...sizes.map(() => cat.evalCommon.consistency + '%')], ['Consistency for Payouts', ...sizes.map(() => cat.fundedCommon.consistency + '%')], ['Payout Split', ...sizes.map(() => cat.fundedCommon.split + '%')], ['Payout Cap, payouts 1 to 3', ...sizes.map((z) => fmt(cat.fundedCaps[z].first))], ['Payout Cap, payouts 4 to 6', ...sizes.map((z) => fmt(cat.fundedCaps[z].later))], ['Lifetime Payouts per Account', ...sizes.map((z) => fmt(cat.fundedCaps[z].lifetime))], ['Minimum Payout', ...sizes.map(() => fmt(cat.fundedCommon.payoutMin))]];
  const nowIso = new Date().toISOString().slice(0, 10);
  const PROMOS = (cat.promos || []).filter((p) => p.active && (!p.ends || p.ends >= nowIso)).map((p) => ({ code: p.code, n: p.name, d: p.desc, pct: p.pct, plans: p.plans, when: (p.starts ? shortDate(p.starts + 'T12:00:00Z') : '') + (p.ends ? ' to ' + shortDate(p.ends + 'T12:00:00Z') : ''), ends: p.ends ? shortDate(p.ends + 'T12:00:00Z') : '', live: !p.starts || p.starts <= nowIso, note: p.once ? 'One use per trader. Not combined with bundles.' : '' }));

  return {
    now: new Date().toISOString(), today, payMode: require('./payments').mode(), flags: Object.assign({ competitions: true, rewards: true, affiliates: true, education: true, cryptoPayouts: true }, ((await db.one("SELECT v FROM kv WHERE k='settings.flags'")) || {}).v || {}), integ: { sumsub: await I.on('sumsub'), track1099: await I.on('track1099'), rise: await I.on('rise'), crisp: await I.on('crisp') },
    ME: { first: user.first, last: (user.last || '').slice(0, 1) + '.', lastFull: user.last, full: `${user.first} ${user.last}`, ini: ((user.first || '')[0] || '') + ((user.last || '')[0] || ''), email: user.email, country: user.country, phone: user.phone || '', since: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), tid: user.tid, ref: `${host}/?ref=${user.ref_code}`, refCode: user.ref_code, verified: user.verified, kyc: user.kyc_status, tax: await flows.taxSync(user), rise: user.rise_status, role: user.role, pts: user.points, settings: user.settings || {}, refs: { list: refs.map((r) => ({ n: (r.first || '?')[0] + '•••• ' + (r.last || '?')[0] + '.', joined: shortDate(r.created_at), bought: r.bought ? shortDate(r.bought) : '' })), clicks: Array.from({ length: 30 }, (_, i) => { const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10); return clicksMap[d] || 0; }), pts: refPts.n } },
    PLANS, RULESET, RULE_ALL, ADDONS: Object.fromEntries(Object.entries(cat.addons).map(([k, a]) => [k, [a.name, '+' + a.pct + '%', a.desc]])), PROMOS, BUNDLES: (cat.bundles || []).map((b) => [b.buy, b.get]),
    ACC, HIST, DAYS, TRADES, PAYOUTS, ORDERS, NOTES, COURSES, LESSONS: C.lessons, REWARDS: C.rewards, EARN: C.earn, PTS_LOG, CERTS,
    LB: C.leaderboard, COMPS: C.competitions, CPRIZES: C.cprizes, ARTICLES: C.articles, TOPICS: C.topics, TICKETS, SESS, AGREE, NEWS: C.news, PLANRULES,
    METHODS: methods.map((m) => ({ id: m.id, rail: m.rail, label: m.label, def: m.is_default, locked: new Date(m.unlock_at) > new Date(), unlock: new Date(m.unlock_at).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET' })),
    COUPONS: coupons.map((c) => ({ code: c.code, label: c.label, used: c.used, kind: c.kind })),
    caps: { funded: cat.fundedCaps, instant: cat.instantCaps, instantRules: cat.instantRules, instantCommon: cat.instantCommon, fundedCommon: cat.fundedCommon }
  };
}
module.exports = { boot };
