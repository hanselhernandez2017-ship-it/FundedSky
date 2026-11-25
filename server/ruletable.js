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
module.exports = { planTable };
