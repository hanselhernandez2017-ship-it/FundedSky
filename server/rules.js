// Rule engine: account rules, trade application, end-of-day close, pass/breach, payout eligibility.
const { round2 } = require('./util');

// Rules as they were when the account was bought (accounts.rs), so later catalog edits only apply to new purchases.
function snapshot(cat, plan, size) {
  return { o: ((cat.planRules || {})[plan] || {})[size] || null, e: (cat.evalRules || {})[size] || null, ec: cat.evalCommon, fc: cat.fundedCommon,
    fcap: (cat.fundedCaps || {})[size] || null, ir: (cat.instantRules || {})[size] || null, ic: cat.instantCommon, icap: (cat.instantCaps || {})[size] || null, at: new Date().toISOString() };
}
function catFor(cat, a) {
  const s = a && a.rs; if (!s || typeof s !== 'object') return cat;
  const z = a.size; const pick = (v, base) => (v == null ? base : v);
  return Object.assign({}, cat, {
    planRules: Object.assign({}, cat.planRules, { [a.plan]: Object.assign({}, (cat.planRules || {})[a.plan], { [z]: s.o }) }),
    evalRules: Object.assign({}, cat.evalRules, { [z]: pick(s.e, (cat.evalRules || {})[z]) }), evalCommon: pick(s.ec, cat.evalCommon), fundedCommon: pick(s.fc, cat.fundedCommon),
    fundedCaps: Object.assign({}, cat.fundedCaps, { [z]: pick(s.fcap, (cat.fundedCaps || {})[z]) }),
    instantRules: Object.assign({}, cat.instantRules, { [z]: pick(s.ir, (cat.instantRules || {})[z]) }), instantCommon: pick(s.ic, cat.instantCommon),
    instantCaps: Object.assign({}, cat.instantCaps, { [z]: pick(s.icap, (cat.instantCaps || {})[z]) })
  });
}
// Card perks on an account (accounts.perks, from Packs): fewer days, rule removals, split boosts
function perked(R, a) {
  const P = a && a.perks; if (!P || typeof P !== 'object') return R;
  R = Object.assign({}, R);
  if (R.kind === 'evaluation') { if (P.minDaysOff && R.minDays != null) R.minDays = Math.max(0, R.minDays - P.minDaysOff); if (P.evalCons) { R.consOff = true; R.consistency = 100; } }
  if (R.kind === 'funded') {
    if (P.payCons) { R.consOff = true; R.consistency = 100; }
    if (P.splitTo) R.split = Math.max(R.split || 0, P.splitTo); else if (P.splitAdd) R.split = Math.min(100, (R.split || 0) + P.splitAdd);
    if (P.splitOnce) R.split = Math.max(R.split || 0, Number(P.splitOnce)); // a split-boost reward: this split on the next payout only
  }
  if (P.newsUntil && Date.parse(P.newsUntil) > Date.now()) R.news = null;
  if (P.idleDays && R.inactivity) R.inactivity += P.idleDays;
  R.perks = P; return R;
}
function rulesFor(cat0, a) { return perked(rulesFor0(cat0, a), a); }
function rulesFor0(cat0, a) {
  const cat = catFor(cat0, a);
  const R0 = rulesBase(cat, a); const o = (((cat.planRules || {})[a.plan]) || {})[a.size];
  if (!o) return phaseRules(R0, null, a);
  const R = Object.assign({}, R0);
  // Which overrides apply: an evaluation plan's rule set sets the pass rules on the evaluation, and the loss limits, split and minimum on its funded account
  const keys = R0.instant ? ['goal', 'dll', 'maxLoss', 'consistency', 'split', 'payoutMin'] : R0.kind === 'evaluation' ? ['target', 'dll', 'maxLoss', 'minDays', 'consistency'] : ['dll', 'maxLoss', 'split', 'payoutMin'];
  keys.forEach((k) => { if (o[k] != null && R0[k] != null) R[k] = Number(o[k]); });
  if (o.contracts != null) { R.fullContracts = Number(o.contracts); R.contracts = R0.fullContracts && R0.contracts < R0.fullContracts ? Math.max(1, Math.floor(o.contracts / 2)) : Number(o.contracts); }
  return phaseRules(R, o[R.kind === 'evaluation' ? 'eval' : 'funded'], a);
}

// Full rule settings for one phase (catalog planRules[plan][size].eval / .funded). Missing settings keep today's behaviour.
// ddType: eod | intraday | static. dll: null = no daily limit. dllMode: pause | breach. scaling: [[profit, contracts], ...].
// consistency: null = no rule. scalp: { hold: seconds, pct: % } or null. news: { win: minutes } or null (allowed).
// overnight / weekend: false = must be flat by closeAt (ET). inactivity: days without a trade before the account closes.
// Funded payouts: split, splitFirst, splitFirstCount, cap { first, later, lifetime }, payoutMin, daysBetween, buffer, winDays, winDayMin, reviewAfter, half.
const num = (v) => (v === '' || v == null ? null : Number(v));
function phaseRules(R, P, a) {
  R = Object.assign({ ddType: 'eod', dllMode: 'pause', scaling: null, scalp: null, news: { win: 2 }, overnight: true, weekend: true, closeAt: '16:55', inactivity: null, daysBetween: 0, buffer: null, consOff: false, dllOff: false }, R);
  if (!P || typeof P !== 'object') return R;
  const set = (k, v) => { if (v !== undefined) R[k] = v; };
  if (P.target != null) R.target = Number(P.target);
  if (P.goal != null && R.instant) R.goal = Number(P.goal);
  if (P.maxLoss != null) R.maxLoss = Number(P.maxLoss);
  if (['eod', 'intraday', 'static'].includes(P.ddType)) R.ddType = P.ddType;
  if (P.lockAt !== undefined && P.lockAt !== '') R.lockAt = num(P.lockAt);
  if ('dll' in P) { const d = num(P.dll); R.dllOff = d == null || d <= 0; R.dll = R.dllOff ? 0 : d; }
  if (P.dllMode === 'breach' || P.dllMode === 'pause') R.dllMode = P.dllMode;
  if (P.contracts != null || P.half != null) { const c = P.contracts != null ? Number(P.contracts) : (R.fullContracts || R.contracts); const wasHalf = !!(R.fullContracts && R.contracts < R.fullContracts); const half = P.half != null ? !!P.half && R.kind === 'funded' : wasHalf; R.fullContracts = c; R.half = half; R.contracts = half && !(a && a.payout_count > 0) ? Math.max(1, Math.floor(c / 2)) : c; }
  if (Array.isArray(P.scaling) && P.scaling.length) R.scaling = P.scaling.map(([at, c]) => [Number(at), Number(c)]).filter(([at, c]) => c > 0).sort((x, y) => x[0] - y[0]);
  if (P.minDays != null) { if (R.kind === 'evaluation') R.minDays = Number(P.minDays); else R.winDays = Number(P.minDays); }
  if (P.winDays != null) R.winDays = Number(P.winDays);
  if (P.winDayMin != null) R.winDayMin = Number(P.winDayMin);
  if ('consistency' in P) { const c = num(P.consistency); R.consOff = c == null || c <= 0 || c >= 100; R.consistency = R.consOff ? 100 : c; }
  if ('scalp' in P) R.scalp = P.scalp && Number(P.scalp.hold) > 0 ? { hold: Number(P.scalp.hold), pct: Number(P.scalp.pct) || 0 } : null;
  if ('news' in P) R.news = P.news && Number(P.news.win) > 0 ? { win: Number(P.news.win) } : null;
  set('overnight', P.overnight == null ? undefined : !!P.overnight); set('weekend', P.weekend == null ? undefined : !!P.weekend);
  if (P.closeAt && /^\d{1,2}:\d{2}$/.test(P.closeAt)) R.closeAt = P.closeAt;
  if ('inactivity' in P) R.inactivity = num(P.inactivity) || null;
  if (R.kind === 'funded') {
    if (P.split != null) R.split = Number(P.split);
    if (P.splitFirst != null && P.splitFirstCount != null) { const n = (a && a.payout_count || 0) + 1; R.splitFirst = Number(P.splitFirst); R.splitFirstCount = Number(P.splitFirstCount); R.splitLater = R.split; if (n <= R.splitFirstCount) R.split = R.splitFirst; }
    if (P.cap) { const n = (a && a.payout_count || 0) + 1; const f = num(P.cap.first), l = num(P.cap.later), lt = num(P.cap.lifetime); if (f) R.capFirst = f; if (l || f) R.capLater = l || f; if (lt != null) R.lifetime = lt || Infinity; R.cap = n <= 3 ? R.capFirst : R.capLater; }
    if (P.payoutMin != null) R.payoutMin = Number(P.payoutMin);
    if (P.daysBetween != null) R.daysBetween = Number(P.daysBetween) || 0;
    if ('buffer' in P) R.buffer = num(P.buffer);
    if (P.reviewAfter != null) R.reviewAfter = Number(P.reviewAfter) || null;
  }
  return R;
}

// Contracts allowed right now: the scaling tier reached by closed profit (balance at the start of the day), else the max position size
function allowedContracts(r, a) {
  if (!r.scaling) return r.contracts;
  const profit = Number(a.balance) - Number(a.today_pnl || 0) - Number(a.start_bal);
  let c = r.scaling[0][1]; r.scaling.forEach(([at, n]) => { if (profit >= at) c = n; });
  return Math.min(c, r.fullContracts || r.contracts);
}
function rulesBase(cat, a) {
  const size = a.size;
  if (a.plan === 'instant') {
    const r = cat.instantRules[size]; const c = cat.instantCommon; const cap = cat.instantCaps[size];
    const n = (a.payout_count || 0) + 1;
    return {
      kind: 'funded', instant: true, maxLoss: r.maxLoss, dll: r.dll, contracts: r.contracts, goal: r.goal,
      lockAt: c.cushion, consistency: c.consistency, split: n <= c.splitFirstCount ? c.splitFirst : c.splitLater,
      winDays: c.winDays, winDayMin: c.winDayMin, payoutMin: c.payoutMin, reviewAfter: c.reviewAfter, cushion: c.cushion,
      cap: n <= 3 ? cap.first : cap.later, capFirst: cap.first, capLater: cap.later, lifetime: cap.lifetime
    };
  }
  const e = cat.evalRules[size];
  if (a.kind === 'evaluation') {
    return { kind: 'evaluation', target: e.target, maxLoss: e.maxLoss, dll: e.dll, contracts: e.contracts, minDays: cat.evalCommon.minDays, consistency: cat.evalCommon.consistency };
  }
  const f = cat.fundedCommon; const cap = cat.fundedCaps[size]; const n = (a.payout_count || 0) + 1;
  const half = f.halfContractsUntilFirstPayout && !(a.payout_count > 0);
  return {
    kind: 'funded', maxLoss: e.maxLoss, dll: e.dll, contracts: half ? Math.max(1, Math.floor(e.contracts / 2)) : e.contracts, fullContracts: e.contracts,
    lockAt: f.lockAbove, consistency: f.consistency, split: f.split, winDays: f.winDays, winDayMin: f.winDayMin, payoutMin: f.payoutMin,
    reviewAfter: f.reviewAfter, cushion: f.cushion, cap: n <= 3 ? cap.first : cap.later, capFirst: cap.first, capLater: cap.later, lifetime: cap.lifetime
  };
}

// Fresh account values for a new evaluation / funded / instant account
function initialState(cat, { plan, size, kind, rs }) {
  const r = rulesFor(cat, { plan, size, kind, payout_count: 0, rs });
  return { start_bal: size, balance: size, peak_eod: size, floor: size - r.maxLoss, cycle_profit_start: size };
}

// Trailing floor from the end-of-day high-water mark
function trailFloor(cat, a, peak) {
  const r = rulesFor(cat, a);
  if (r.ddType === 'static') return round2(Number(a.start_bal) - r.maxLoss);
  let fl = peak - r.maxLoss;
  if (r.kind === 'funded' && r.lockAt != null) {
    const lock = Number(a.start_bal) + (r.lockAt || 0);
    if (a.payout_count > 0) fl = Math.min(fl, Number(a.start_bal));
    else fl = Math.min(fl, lock);
  }
  return round2(Math.max(Number(a.floor), fl));
}

// Apply a closed trade. Returns { a, events } with a mutated copy.
function applyTrade(cat, a, t) {
  const r = rulesFor(cat, a); const ev = [];
  a = { ...a };
  a.balance = round2(Number(a.balance) + Number(t.pnl));
  a.today_pnl = round2(Number(a.today_pnl) + Number(t.pnl));
  a.last_trade_at = t.ts || new Date();
  const lim = allowedContracts(r, { ...a, today_pnl: Number(a.today_pnl) - Number(t.pnl), balance: Number(a.balance) - Number(t.pnl) });
  // A trade above the max position size breaks the rule: it is recorded on the trade and the trader is told (the account stays open)
  if (t.qty > lim) ev.push({ type: 'position', qty: t.qty, limit: lim, msg: `Position of ${t.qty} contracts is above the ${lim} contract limit${r.scaling ? ' for your scaling level' : ''}` });
  // Trades held under the scalping minimum: their profit is tracked against the scalping cap
  if (r.scalp && Number(t.pnl) > 0 && Number(t.hold_sec != null ? t.hold_sec : Number(t.hold_min || 0) * 60) < r.scalp.hold) { a.scalp_profit = round2(Number(a.scalp_profit || 0) + Number(t.pnl)); a.cycle_scalp = round2(Number(a.cycle_scalp || 0) + Number(t.pnl)); }
  // Intraday trailing: the floor follows the highest balance after every trade, not just at the close
  // Money set aside for a payout that is not paid yet (a.held) still counts as in the account, so a hold can never cause a breach
  const equity = round2(Number(a.balance) + Number(a.held || 0)); const usd = (v) => '$' + (Number.isInteger(round2(v)) ? round2(v).toLocaleString('en-US') : round2(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  if (r.ddType === 'intraday' && a.phase === 'active') { const peak = Math.max(Number(a.peak_eod), equity); a.peak_eod = round2(peak); a.floor = trailFloor(cat, a, peak); }
  if (equity <= Number(a.floor)) {
    a.phase = 'breached'; a.breached_at = new Date(); a.breach_reason = `Max loss: balance fell to ${usd(equity)}, ${equity < Number(a.floor) ? 'below' : 'reaching'} the floor of ${usd(a.floor)} (${usd(r.maxLoss)} max loss)`;
    ev.push({ type: 'breach', msg: a.breach_reason });
  } else if (!r.dllOff && r.dll > 0 && a.today_pnl <= -r.dll && !a.halted_today) {
    if (r.dllMode === 'breach') { a.phase = 'breached'; a.breached_at = new Date(); a.breach_reason = `Daily loss limit: lost ${usd(-a.today_pnl)} in one day, the limit is ${usd(r.dll)}`; ev.push({ type: 'breach', msg: a.breach_reason }); }
    else { a.halted_today = true; ev.push({ type: 'dll', msg: `Daily loss limit of $${r.dll.toLocaleString('en-US')} reached. Trading is paused until the day resets at 6:00 PM ET.` }); }
  }
  return { a, events: ev };
}

// End-of-day close for a trade date. Returns { a, day, events }
function closeDay(cat, a, dayIso, nTrades) {
  const ev = []; a = { ...a };
  const pnl = round2(Number(a.today_pnl));
  const traded = nTrades > 0;
  if (traded) {
    a.days_traded = (a.days_traded || 0) + 1;
    if (pnl > Number(a.best_day)) a.best_day = pnl;
  }
  if (a.phase === 'active') {
    const peak = Math.max(Number(a.peak_eod), Number(a.balance) + Number(a.held || 0)); // money held for an unpaid payout is still in the account
    a.peak_eod = round2(peak); a.floor = trailFloor(cat, a, peak);
    const r = rulesFor(cat, a);
    if (r.kind === 'funded' && traded) {
      if (pnl >= r.winDayMin) a.cycle_win_days = (a.cycle_win_days || 0) + 1;
      if (pnl > Number(a.cycle_best)) a.cycle_best = pnl;
    }
    if (a.kind === 'evaluation' && !a.comp) { // competition accounts never pass: they are ranked on a leaderboard
      const profit = Number(a.balance) - Number(a.start_bal);
      const consOk = r.consOff || (profit > 0 && Number(a.best_day) <= (r.consistency / 100) * profit);
      const scalpOk = !r.scalp || Number(a.scalp_profit || 0) <= (r.scalp.pct / 100) * r.target;
      if (profit >= r.target && a.days_traded >= r.minDays && consOk && scalpOk) {
        a.phase = 'passed'; a.passed_at = new Date();
        a.steps = { ...(a.steps || {}), passed: new Date().toISOString() };
        ev.push({ type: 'pass', msg: 'Evaluation passed' });
      }
    }
  }
  const day = { account_id: a.id, day: dayIso, pnl, n_trades: nTrades, eod_balance: a.balance, floor: a.floor };
  a.today_pnl = 0; a.halted_today = false;
  return { a, day, events: ev };
}

// Evaluation progress checks for display
function evalChecks(cat, a) {
  const r = rulesFor(cat, a); const profit = Number(a.balance) - Number(a.start_bal);
  const consPct = profit > 0 ? Math.round((Number(a.best_day) / profit) * 100) : 0;
  return {
    target: { ok: profit >= r.target, have: profit, need: r.target },
    days: { ok: a.days_traded >= r.minDays, have: a.days_traded, need: r.minDays },
    consistency: { ok: r.consOff || (profit > 0 && consPct <= r.consistency), have: consPct, need: r.consOff ? null : r.consistency, off: r.consOff },
    scalp: r.scalp ? { ok: Number(a.scalp_profit || 0) <= (r.scalp.pct / 100) * r.target, have: Number(a.scalp_profit || 0), need: round2((r.scalp.pct / 100) * r.target), hold: r.scalp.hold } : null
  };
}

// Payout quote for a funded / instant account
function payoutQuote(cat, a, opts = {}) {
  const r = rulesFor(cat, a); const reasons = []; const checks = [];
  if (r.kind !== 'funded') return { ok: false, reasons: ['Only funded accounts can request payouts'], checks, max: 0 };
  const daily = (a.addons || []).includes('daily');
  const bal = Number(a.balance), start = Number(a.start_bal);
  // Money held by a payout that is still open (in review, ready to send, or sent back) is still this cycle's profit
  const cycleProfit = round2(bal + Number(opts.held || 0) - Number(a.cycle_profit_start || start));
  const needDays = daily ? 1 : r.winDays;
  const winOk = (a.cycle_win_days || 0) >= needDays;
  checks.push({ k: 'win', label: `${needDays} winning day${needDays > 1 ? 's' : ''} of $${r.winDayMin}+ this cycle`, ok: winOk, have: Math.min(a.cycle_win_days || 0, needDays), need: needDays });
  const consPct = cycleProfit > 0 ? Math.round((Number(a.cycle_best) / cycleProfit) * 100) : 0;
  // Daily Payouts: each cycle is one winning day, so the best day is always the whole cycle. The consistency rule does not apply.
  if (!r.consOff && !daily) { const consOk = cycleProfit > 0 && consPct <= r.consistency; checks.push({ k: 'cons', label: `Best day at or under ${r.consistency}% of cycle profit`, ok: consOk, have: consPct, need: r.consistency }); }
  if (r.buffer > 0) checks.push({ k: 'buffer', label: `Profit above the $${r.buffer.toLocaleString('en-US')} buffer`, ok: bal - start > r.buffer, have: round2(bal - start), need: r.buffer });
  const lastPay = opts.lastPayoutAt || a.last_payout_at; if (r.daysBetween > 0 && lastPay) { const d = (Date.now() - new Date(lastPay)) / 864e5; checks.push({ k: 'gap', label: `${r.daysBetween} day${r.daysBetween > 1 ? 's' : ''} since the last payout`, ok: d >= r.daysBetween, have: Math.floor(d), need: r.daysBetween }); }
  if (r.scalp && cycleProfit > 0) { const sp = Math.round(Number(a.cycle_scalp || 0) / cycleProfit * 100); checks.push({ k: 'scalp', label: `Profit from trades held under ${r.scalp.hold} seconds at or under ${r.scalp.pct}%`, ok: sp <= r.scalp.pct, have: sp, need: r.scalp.pct }); }
  if (r.instant && !(a.payout_count > 0)) {
    const goalOk = bal - start >= r.goal;
    checks.push({ k: 'goal', label: `Profit goal of $${r.goal.toLocaleString('en-US')} before the first payout`, ok: goalOk, have: round2(bal - start), need: r.goal });
  }
  const withdrawable = Math.max(0, round2(bal - start - (r.buffer != null ? r.buffer : r.cushion)));
  const lifetimeLeft = Math.max(0, r.lifetime - Number(a.paid_total || 0));
  const maxNet = Math.max(0, Math.floor(Math.min(withdrawable * r.split / 100, r.cap, lifetimeLeft)));
  const minOk = maxNet >= r.payoutMin;
  checks.push({ k: 'min', label: `At least $${r.payoutMin} available`, ok: minOk, have: maxNet, need: r.payoutMin });
  if (a.phase !== 'active') reasons.push(a.phase === 'review' ? `This account is under review after ${r.reviewAfter || 6} payouts` : 'Account is not active');
  if (opts.stop) reasons.unshift(opts.stop);
  if (opts.pending) reasons.push('A payout request is already in review');
  if (opts.failed) reasons.push('Your last payout could not be sent. Support will send it again or return it to your balance first');
  checks.filter((c) => !c.ok).forEach((c) => reasons.push(c.label));
  return {
    ok: reasons.length === 0, reasons, checks, max: maxNet, split: r.split, cap: r.cap, lifetime: r.lifetime, lifetimeLeft,
    number: (a.payout_count || 0) + 1, cycleProfit, withdrawable, payoutMin: r.payoutMin
  };
}

// The chargeback state of the orders that bought this account or the evaluation it came from: '', 'open' or 'lost'
function cbFor(a, orders) { const ids = [a.id, a.parent_id].filter(Boolean); let st = '';
  (orders || []).forEach((o) => { const m = o.meta || {}; if (!m.chargeback) return; if (!(ids.includes(m.account) || (m.accounts || []).some((x) => ids.includes(x)) || (a.order_id && o.id === a.order_id))) return;
    if (['lost', 'accepted'].includes(m.chargeback)) st = 'lost'; else if (m.chargeback === 'open' && st !== 'lost') st = 'open'; });
  return st; }
// Why payouts on this account are stopped right now, or '' (a payment dispute, a lost chargeback, or a paused account)
function payoutStop(a, cb) {
  if (cb === 'lost') return 'This account was closed after a chargeback on its order';
  if (cb === 'open' || (a.sim && a.sim.pausedFor)) return 'Payouts are paused while a payment dispute on your order is reviewed';
  if (a.sim && a.sim.paused) return 'Payouts on this account are paused. Contact support';
  return ''; }

module.exports = { cbFor, payoutStop, snapshot, catFor, rulesFor, phaseRules, allowedContracts, initialState, trailFloor, applyTrade, closeDay, evalChecks, payoutQuote };
