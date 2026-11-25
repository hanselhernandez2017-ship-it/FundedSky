// One-time catalog update (Nov 2026): every plan gets the full rule set, and the Instant plan gets a $150K size.
// Numbers already in the catalog are kept; the new rules follow the owner's choices. Accounts already sold keep their
// rule snapshot (accounts.rs), so this only changes new purchases.
const db = require('./db');
const core = require('./core');
const R = require('./rules');
const KEY = 'migr.fullrules.v1';
const NEW = { scalp: { hold: 11, pct: 50 }, overnight: false, weekend: false, closeAt: '16:55', inactivity: 29 };
function phasesFor(cat, p, size) {
  const inst = p.id === 'instant' || p.kind === 'funded';
  const fr = R.rulesFor(cat, { plan: p.id, size, kind: 'funded', payout_count: 0 }); const fr4 = R.rulesFor(cat, { plan: p.id, size, kind: 'funded', payout_count: 3 });
  const funded = Object.assign({ maxLoss: fr.maxLoss, ddType: 'eod', lockAt: fr.lockAt != null ? fr.lockAt : 100, dll: fr.dll || null, dllMode: 'pause', contracts: fr.fullContracts || fr.contracts, half: !!(fr.fullContracts && fr.contracts < fr.fullContracts),
    minDays: fr.winDays, winDayMin: fr.winDayMin, consistency: fr.consistency || null, split: fr4.split, cap: { first: fr.capFirst, later: fr.capLater, lifetime: fr.lifetime }, payoutMin: fr.payoutMin,
    daysBetween: 0, buffer: fr.cushion != null ? fr.cushion : 100, reviewAfter: fr.reviewAfter || null, news: { win: 2 } }, NEW);
  if (fr.split !== fr4.split) Object.assign(funded, { splitFirst: fr.split, splitFirstCount: 3 });
  if (inst) funded.goal = fr.goal;
  if (inst) return { funded };
  const er = R.rulesFor(cat, { plan: p.id, size, kind: 'evaluation' });
  return { eval: Object.assign({ target: er.target, maxLoss: er.maxLoss, ddType: 'eod', dll: er.dll || null, dllMode: 'pause', contracts: er.fullContracts || er.contracts, minDays: er.minDays, consistency: er.consistency || null, news: null }, NEW), funded };
}
async function run() {
  if (await db.one('SELECT 1 FROM kv WHERE k=$1', [KEY])) return false;
  const cat = JSON.parse(JSON.stringify(await core.catalog(true)));
  cat.planRules = cat.planRules || {};
  // Instant $150K, as approved: $999, $6,000 goal, $3,250 max loss, $1,625 daily, 12 contracts, payouts $2,000 x3 then $2,500, $13,500 lifetime
  const ip = cat.plans.find((p) => p.id === 'instant');
  if (ip && !ip.sizes.some((z) => z.size === 150000)) {
    ip.sizes.push({ size: 150000, price: 999, reset: Math.round(999 * (cat.resetPct || 55) / 100), activation: 0 }); ip.sizes.sort((a, b) => a.size - b.size);
    cat.instantRules = Object.assign({}, cat.instantRules, { 150000: { goal: 6000, maxLoss: 3250, dll: 1625, contracts: 12 } });
    cat.instantCaps = Object.assign({}, cat.instantCaps, { 150000: { first: 2000, later: 2500, lifetime: 13500 } });
    const ref = (cat.planRules.instant || {})[100000] || {};
    cat.planRules.instant = Object.assign({}, cat.planRules.instant, { 150000: Object.assign({}, ref, { goal: 6000, maxLoss: 3250, dll: 1625, contracts: 12, version: 1 }) });
  }
  for (const p of cat.plans) for (const z of p.sizes) {
    const cur = (cat.planRules[p.id] || {})[z.size] || {};
    if (cur.funded) continue;
    (cat.planRules[p.id] = cat.planRules[p.id] || {})[z.size] = Object.assign({}, cur, phasesFor(cat, p, z.size));
  }
  cat.version = (cat.version || 1) + 1;
  await core.saveCatalog(cat, null);
  const vk = await db.one("SELECT v FROM kv WHERE k='store.catalog.versions'"); const vers = (vk && vk.v) || [];
  const entry = { v: cat.version, text: 'Full rule sets on every plan; Instant $150K added', who: 'System update', when: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }), count: 2, cat };
  await db.q("INSERT INTO kv(k,v) VALUES('store.catalog.versions',$1) ON CONFLICT (k) DO UPDATE SET v=$1", [JSON.stringify([entry].concat(vers).slice(0, 30))]);
  await db.q("INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO NOTHING", [KEY, JSON.stringify({ at: new Date().toISOString(), version: cat.version })]);
  await core.audit(null, 'catalog.fullrules', 'catalog', { version: cat.version });
  return true;
}
module.exports = { run, phasesFor };

// Keeps the full rule sets (planRules[plan][size].eval / .funded) in step with the older fields some screens and the API still
// edit (planRules flat fields, evalRules, instantRules, fundedCaps, instantCaps, *Common). A value changed in an older field
// in this save is copied to the matching phase setting, unless that phase setting was itself changed in the same save.
function syncPhases(next, prev) {
  if (!next || !prev || !next.planRules) return next;
  const g = (o, path) => path.reduce((x, k) => (x == null ? undefined : x[k]), o);
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for (const p of next.plans || []) {
    const inst = p.id === 'instant' || p.kind === 'funded';
    for (const z of p.sizes || []) {
      const cur = (next.planRules[p.id] || {})[z.size]; if (!cur || !cur.funded) continue;
      const old = ((prev.planRules || {})[p.id] || {})[z.size] || {};
      const map = []; const L = (src, phase, key) => map.push([src, phase, key]);
      if (inst) { L(['planRules', p.id, z.size, 'goal'], 'funded', 'goal'); L(['instantRules', z.size, 'goal'], 'funded', 'goal'); ['dll', 'maxLoss', 'contracts'].forEach((k) => { L(['planRules', p.id, z.size, k], 'funded', k); L(['instantRules', z.size, k], 'funded', k); });
        ['consistency', 'split', 'payoutMin'].forEach((k) => L(['planRules', p.id, z.size, k], 'funded', k)); L(['instantCommon', 'consistency'], 'funded', 'consistency'); L(['instantCommon', 'payoutMin'], 'funded', 'payoutMin'); L(['instantCommon', 'winDays'], 'funded', 'minDays'); L(['instantCommon', 'winDayMin'], 'funded', 'winDayMin');
        ['first', 'later', 'lifetime'].forEach((k) => L(['instantCaps', z.size, k], 'funded', 'cap.' + k));
      } else {
        L(['planRules', p.id, z.size, 'target'], 'eval', 'target'); L(['evalRules', z.size, 'target'], 'eval', 'target');
        ['dll', 'maxLoss', 'contracts'].forEach((k) => { ['eval', 'funded'].forEach((ph) => { L(['planRules', p.id, z.size, k], ph, k); L(['evalRules', z.size, k], ph, k); }); });
        ['minDays', 'consistency'].forEach((k) => { L(['planRules', p.id, z.size, k], 'eval', k); L(['evalCommon', k], 'eval', k); });
        ['split', 'payoutMin'].forEach((k) => { L(['planRules', p.id, z.size, k], 'funded', k); L(['fundedCommon', k], 'funded', k); });
        L(['fundedCommon', 'consistency'], 'funded', 'consistency'); L(['fundedCommon', 'winDays'], 'funded', 'minDays'); L(['fundedCommon', 'winDayMin'], 'funded', 'winDayMin');
        ['first', 'later', 'lifetime'].forEach((k) => L(['fundedCaps', z.size, k], 'funded', 'cap.' + k));
      }
      for (const [src, ph, key] of map) {
        const nv = g(next, src.map(String)), ov = g(prev, src.map(String)); if (nv === undefined || eq(nv, ov)) continue;
        const kp = key.split('.'); const tgt = cur[ph]; if (!tgt) continue;
        const curV = g(tgt, kp), oldV = g(old[ph] || {}, kp); if (!old[ph] || !eq(curV, oldV)) continue; // a new rule set, or the phase edited in this save: the phase wins
        if (kp.length === 2) { tgt[kp[0]] = Object.assign({}, tgt[kp[0]], { [kp[1]]: nv }); } else tgt[key] = nv;
      }
    }
  }
  return next;
}
module.exports.syncPhases = syncPhases;
