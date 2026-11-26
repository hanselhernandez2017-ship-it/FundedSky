// Rule tables for traders (dashboard Resources > Rules and the public /rules page), from the same effective rules the engine uses.
// Rows are [label, value per size]; a row with only a label is a section heading.
const R = require('./rules');
const fmt = (v) => '$' + Math.round(Number(v) || 0).toLocaleString('en-US');
const DD = { eod: 'End of Day (Trailing)', intraday: 'Intraday (Trailing)', static: 'Static' };
const dll = (r) => (r.dllOff || !r.dll ? 'No Limit' : fmt(r.dll) + (r.dllMode === 'breach' ? ', fails the account' : ', pauses for the day'));
const cons = (r) => (r.consOff ? 'None' : r.consistency + '%');
const scal = (r) => (r.scaling ? r.scaling.map(([at, c]) => `${c} at ${fmt(at)}`).join(', ') : 'No');
const scalp = (r) => (r.scalp ? `Limited: under ${r.scalp.hold}s, max ${r.scalp.pct}% of profit` : 'Allowed');
const news = (r) => (r.news ? `Restricted: ${r.news.win} min around high-impact news` : 'Allowed');
const hold = (r) => (r.overnight !== false && r.weekend !== false ? 'Allowed' : r.overnight === false ? `Flat by ${r.closeAt} ET daily` : `Flat by ${r.closeAt} ET Friday`);
function planTable(cat, planId) {
  const pl = cat.plans.find((x) => x.id === planId); if (!pl) return null;
  const inst = pl.id === 'instant' || pl.kind === 'funded';
  const sizes = pl.sizes.filter((z) => z.active !== false).map((z) => z.size).sort((a, b) => a - b);
  const ok = (z) => (inst ? (cat.instantRules || {})[z] && (cat.instantCaps || {})[z] : (cat.evalRules || {})[z] && (cat.fundedCaps || {})[z]);
  const er = (z) => R.rulesFor(cat, { plan: planId, size: z, kind: inst ? 'funded' : 'evaluation', payout_count: 0 });
  const fr = (z) => R.rulesFor(cat, { plan: planId, size: z, kind: 'funded', payout_count: 0 });
  const fr4 = (z) => R.rulesFor(cat, { plan: planId, size: z, kind: 'funded', payout_count: 3 });
  const row = (label, f, get) => [label, ...sizes.map((z) => { if (!ok(z)) return '—'; try { return f(get(z), z); } catch (e) { return '—'; } })];
  const phase = (get, isEval) => [
    isEval ? row('Profit Target', (r) => fmt(r.target), get) : inst ? row('Profit Goal Before First Payout', (r) => (r.goal ? fmt(r.goal) : 'None'), get) : null,
    row('Maximum Loss Limit', (r) => fmt(r.maxLoss), get), row('Drawdown Type', (r) => DD[r.ddType] || DD.eod, get),
    !isEval ? row('Drawdown Stops Trailing', (r) => (r.ddType === 'static' || r.lockAt == null ? '—' : `At ${fmt(r.lockAt)} profit`), get) : null,
    row('Daily Loss Limit', dll, get), row('Maximum Position Size', (r) => `${r.fullContracts || r.contracts} contracts${!isEval && (r.half != null ? r.half : r.fullContracts && r.contracts < r.fullContracts) ? ' (half until the first payout)' : ''}`, get),
    row('Contract Scaling', scal, get), isEval ? row('Minimum Trading Days', (r) => String(r.minDays), get) : null,
    row('Consistency Rule', cons, get), row('Scalping', scalp, get), row('News Trading', news, get), row('Holding Overnight and Weekends', hold, get),
    row('Inactivity', (r) => (r.inactivity ? `Closes after ${r.inactivity} days without a trade` : 'No limit'), get)].filter(Boolean);
  const pay = [
    row('Profit Split', (r, z) => { const l = fr4(z); return r.splitFirstCount && r.split !== l.split ? `${r.split}% for the first ${r.splitFirstCount}, then ${l.split}%` : r.split + '%'; }, fr),
    row('Payout Cap, Payouts 1 to 3', (r) => fmt(r.capFirst), fr), row('Payout Cap After That', (r) => fmt(r.capLater), fr),
    row('Lifetime Payouts per Account', (r) => (r.lifetime && isFinite(r.lifetime) ? fmt(r.lifetime) : 'No Limit'), fr), row('Minimum Payout', (r) => fmt(r.payoutMin), fr),
    row('Winning Days per Payout', (r) => `${r.winDays} of ${fmt(r.winDayMin)}+`, fr), row('Days Between Payouts', (r) => (r.daysBetween ? String(r.daysBetween) : 'Any time'), fr),
    row('Buffer', (r) => { const b = r.buffer != null ? r.buffer : r.cushion; return b ? fmt(b) : 'No Buffer'; }, fr)];
  const rows = inst ? [['Funded Account'], ...phase(er, false), ['Payouts'], ...pay] : [['Evaluation'], ...phase(er, true), ['Funded Account'], ...phase(fr, false), ['Payouts'], ...pay];
  return { plan: pl, inst, sizes, rows };
}
// Sentences that sit around the tables (news rule, consistency, where the floor stops, profit split), built from the same rules so the
// hand-written copy can never disagree with the engine. byPlan groups plans that share a value: "40% on Essential and Prime, and 20% on Instant".
const andList = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '');
function summary(cat) {
  const ev = [], fu = [];
  cat.plans.filter((p) => p.active !== false).forEach((p) => { const inst = p.id === 'instant' || p.kind === 'funded'; const n = p.short || p.name || p.id;
    p.sizes.filter((z) => z.active !== false).forEach((z) => { try {
      if (!inst) ev.push({ n, r: R.rulesFor(cat, { plan: p.id, size: z.size, kind: 'evaluation', payout_count: 0 }) });
      const r = R.rulesFor(cat, { plan: p.id, size: z.size, kind: 'funded', payout_count: 0 }); const l = R.rulesFor(cat, { plan: p.id, size: z.size, kind: 'funded', payout_count: Math.max(3, r.splitFirstCount || 0) });
      fu.push({ id: p.id, n, inst, r, split: r.splitFirstCount && r.split !== l.split ? `${r.split}%, then ${l.split}%` : r.split + '%' }); } catch (e) { /* a size with no rules yet is left out, as in the tables */ } }); });
  const uniq = (a) => [...new Set(a)];
  const byPlan = (list, f) => { const g = []; list.forEach((x) => { const v = f(x); let e = g.find((y) => y.v === v); if (!e) g.push(e = { v, n: [] }); if (!e.n.includes(x.n)) e.n.push(x.n); }); return g; };
  const join = (g, show, of = '') => (g.length === 1 ? show(g[0].v) + of : g.map((x, i) => `${i === g.length - 1 ? 'and ' : ''}${show(x.v)}${i ? '' : of} on ${andList(x.n)}`).join(', '));
  // news
  const eW = uniq(ev.map((x) => (x.r.news ? x.r.news.win : 0))), fW = uniq(fu.map((x) => (x.r.news ? x.r.news.win : 0))); const all = uniq(eW.concat(fW));
  const who = fu.some((x) => x.inst) && fu.some((x) => !x.inst) ? 'Funded and Instant accounts' : fu.some((x) => x.inst) ? 'Instant accounts' : 'Funded accounts';
  const win = Math.max(0, ...all); const mins = (w) => `${w} minute${w === 1 ? '' : 's'}`;
  const news = !win ? { who: '', text: 'News trading is allowed on every account.' }
    : all.length === 1 ? { who: 'Every account', text: `No new orders ${mins(win)} before and after high-impact news, on every account.` }
      : fW.length === 1 && fW[0] && eW.every((w) => !w) ? { who, text: `${who}: no new orders ${mins(win)} before and after high-impact news.${ev.length ? ' Evaluations may trade news.' : ''}` }
        : { who: 'Restricted accounts', text: 'Some accounts cannot open new orders around high-impact news. Each account shows its own news rule on its Rules tab.' };
  // consistency
  const cv = (x) => (x.r.consOff ? 0 : x.r.consistency); const eC = byPlan(ev, cv), fC = byPlan(fu, cv); const pc = (v) => (v ? v + '%' : 'no limit');
  const cons = [!ev.length ? '' : eC.length === 1 ? (eC[0].v ? `To pass, your best day can be at most ${eC[0].v}% of your profit.` : 'There is no consistency rule to pass.') : `To pass, your best day can be at most ${join(eC, pc, ' of your profit')}.`,
    !fu.length ? '' : fC.length === 1 ? (fC[0].v ? `For a payout, at most ${fC[0].v}% of the cycle's profit.` : 'Payouts have no consistency rule.') : `For a payout, at most ${join(fC, pc, " of the cycle's profit")}.`].filter(Boolean).join(' ');
  // where the floor stops on funded accounts
  const trail = fu.filter((x) => x.r.ddType !== 'static' && x.r.lockAt != null); const lk = byPlan(trail, (x) => x.r.lockAt);
  const lock = !trail.length ? '' : lk.length === 1 ? `On funded accounts it stops ${fmt(lk[0].v)} above your starting balance.` : uniq(trail.map((x) => x.n)).every((n) => uniq(trail.filter((x) => x.n === n).map((x) => x.r.lockAt)).length === 1) ? `On funded accounts it stops above your starting balance: ${join(lk, fmt)}.` : 'On funded accounts it stops a set amount above your starting balance. The table shows the amount for each size.';
  const split = {}; fu.forEach((x) => { (split[x.id] = split[x.id] || []).includes(x.split) || split[x.id].push(x.split); });
  return { news: news.text, newsWho: news.who, newsWin: win, cons, lock, split: Object.fromEntries(Object.entries(split).map(([k, v]) => [k, v.length === 1 ? v[0] : 'By size, see Rules'])) };
}
module.exports = { planTable, summary };
