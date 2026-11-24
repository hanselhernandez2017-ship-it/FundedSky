// Rule engine: account rules, trade application, end-of-day close, pass/breach, payout eligibility.
const { round2 } = require('./util');

function rulesFor(cat, a) {
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
function initialState(cat, { plan, size, kind }) {
  const r = rulesFor(cat, { plan, size, kind, payout_count: 0 });
  return { start_bal: size, balance: size, peak_eod: size, floor: size - r.maxLoss, cycle_profit_start: size };
}

// Trailing floor from the end-of-day high-water mark
function trailFloor(cat, a, peak) {
  const r = rulesFor(cat, a);
  let fl = peak - r.maxLoss;
  if (r.kind === 'funded') {
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
  if (t.qty > r.contracts) ev.push({ type: 'warn', msg: `Position of ${t.qty} contracts is above the ${r.contracts} contract limit` });
  if (a.balance <= Number(a.floor)) {
    a.phase = 'breached'; a.breached_at = new Date(); a.breach_reason = `Max loss: balance reached the floor of $${Math.round(a.floor).toLocaleString('en-US')}`;
    ev.push({ type: 'breach', msg: a.breach_reason });
  } else if (a.today_pnl <= -r.dll && !a.halted_today) {
    a.halted_today = true; ev.push({ type: 'dll', msg: `Daily loss limit of $${r.dll.toLocaleString('en-US')} reached. Trading paused until the next session.` });
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
    const peak = Math.max(Number(a.peak_eod), Number(a.balance));
    a.peak_eod = round2(peak); a.floor = trailFloor(cat, a, peak);
    const r = rulesFor(cat, a);
    if (r.kind === 'funded' && traded) {
      if (pnl >= r.winDayMin) a.cycle_win_days = (a.cycle_win_days || 0) + 1;
      if (pnl > Number(a.cycle_best)) a.cycle_best = pnl;
    }
    if (a.kind === 'evaluation') {
      const profit = Number(a.balance) - Number(a.start_bal);
      const consOk = profit > 0 && Number(a.best_day) <= (r.consistency / 100) * profit;
      if (profit >= r.target && a.days_traded >= r.minDays && consOk) {
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
    consistency: { ok: profit > 0 && consPct <= r.consistency, have: consPct, need: r.consistency }
  };
}

// Payout quote for a funded / instant account
function payoutQuote(cat, a, opts = {}) {
  const r = rulesFor(cat, a); const reasons = []; const checks = [];
  if (r.kind !== 'funded') return { ok: false, reasons: ['Only funded accounts can request payouts'], checks, max: 0 };
  const daily = (a.addons || []).includes('daily');
  const bal = Number(a.balance), start = Number(a.start_bal);
  const cycleProfit = round2(bal - Number(a.cycle_profit_start || start));
  const needDays = daily ? 1 : r.winDays;
  const winOk = (a.cycle_win_days || 0) >= needDays;
  checks.push({ k: 'win', label: `${needDays} winning day${needDays > 1 ? 's' : ''} of $${r.winDayMin}+ this cycle`, ok: winOk, have: a.cycle_win_days || 0, need: needDays });
  const consPct = cycleProfit > 0 ? Math.round((Number(a.cycle_best) / cycleProfit) * 100) : 0;
  const consOk = cycleProfit > 0 && consPct <= r.consistency;
  checks.push({ k: 'cons', label: `Best day at or under ${r.consistency}% of cycle profit`, ok: consOk, have: consPct, need: r.consistency });
  if (r.instant && !(a.payout_count > 0)) {
    const goalOk = bal - start >= r.goal;
    checks.push({ k: 'goal', label: `Profit goal of $${r.goal.toLocaleString('en-US')} before the first payout`, ok: goalOk, have: round2(bal - start), need: r.goal });
  }
  const withdrawable = Math.max(0, round2(bal - start - r.cushion));
  const lifetimeLeft = Math.max(0, r.lifetime - Number(a.paid_total || 0));
  const maxNet = Math.max(0, Math.floor(Math.min(withdrawable * r.split / 100, r.cap, lifetimeLeft)));
  const minOk = maxNet >= r.payoutMin;
  checks.push({ k: 'min', label: `At least $${r.payoutMin} available`, ok: minOk, have: maxNet, need: r.payoutMin });
  if (a.phase !== 'active') reasons.push(a.phase === 'review' ? 'This account is under review after 6 payouts' : 'Account is not active');
  if (opts.pending) reasons.push('A payout request is already in review');
  checks.filter((c) => !c.ok).forEach((c) => reasons.push(c.label));
  return {
    ok: reasons.length === 0, reasons, checks, max: maxNet, split: r.split, cap: r.cap, lifetime: r.lifetime, lifetimeLeft,
    number: (a.payout_count || 0) + 1, cycleProfit, withdrawable, payoutMin: r.payoutMin
  };
}

module.exports = { rulesFor, initialState, trailFloor, applyTrade, closeDay, evalChecks, payoutQuote };
