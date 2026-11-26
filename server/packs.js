// Packs and credits.
// Credits are the one currency: 100 credits = $1. users.points holds the balance and points_log is the ledger.
// Traders buy credits (or earn them), spend them on packs, and each pack holds three cards drawn with crypto randomness.
// Cards are real perks: checkout discounts, fewer trading days, rule removals, free resets, free accounts, split boosts.
// The whole feature is switched by settings.flags.packs (Back Office › Packs, or Settings › Features).
const crypto = require('crypto');
const db = require('./db');
const core = require('./core');
const { bad, clean, round2 } = require('./util');

const RN = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const KEY = 'packs.config';

// Defaults: what the back office starts with. Everything here is editable in Back Office › Packs.
const DEF = {
  packs: [
    { id: 'takeoff', name: 'Scalper Pack', short: 'Scalper', price: 2500, tag: 'The everyday pack. Discounts and day skips, with a shot at a free reset.', odds: [60, 30, 7.5, 2, 0.45, 0.05], g: 'Any rarity', on: true, limit: 0 },
    { id: 'climb', name: 'Day Trader Pack', short: 'Day Trader', price: 5000, tag: 'One card in seven is Rare or better. Rule removals start to show up.', odds: [50, 35, 11, 3, 0.85, 0.15], g: 'Any rarity', on: true, limit: 0 },
    { id: 'jet', name: 'Swing Pack', short: 'Swing', price: 9000, tag: 'Free 25K evaluations and split boosts live here.', odds: [42, 36, 15, 5, 1.6, 0.4], g: 'Any rarity', on: true, limit: 0 },
    { id: 'strato', name: 'Sniper Pack', short: 'Sniper', price: 12500, tag: 'No Common cards. Free 50K evaluations show up.', odds: [0, 62, 28, 7, 2.2, 0.8], g: 'Uncommon or better on all three', on: true, limit: 0 },
    { id: 'orbit', name: 'Mastermind Pack', short: 'Mastermind', price: 15000, tag: 'Rare or better on every card, and the best Mythic odds.', odds: [0, 0, 80, 14, 4.5, 1.5], g: 'Rare or better on all three', on: true, limit: 0 }
  ],
  // fx: what the card does. on: which accounts it can go on.
  cards: [
    { id: 'c5', r: 'Common', kind: 'Checkout', big: '5%', name: 'Extra 5% Off', desc: 'Five percent off your next evaluation, on top of any live offer.', uses: '1 use', on: 'checkout', fx: { t: 'coupon', pct: 5 }, active: true, cost: 0.5 },
    { id: 'cday', r: 'Common', kind: 'Evaluation', big: '−1 Day', name: 'One Less Trading Day', desc: 'Cuts one day off the minimum trading days on an evaluation.', uses: '1 use', on: 'eval', fx: { t: 'minDays', n: 1 }, active: true, cost: 0.3 },
    { id: 'crs', r: 'Common', kind: 'Checkout', big: '10%', name: '10% Off a Reset', desc: 'Ten percent off your next reset.', uses: '1 use', on: 'checkout', fx: { t: 'resetCoupon', pct: 10 }, active: true, cost: 0.6 },
    { id: 'cnews', r: 'Common', kind: 'Funded', big: 'News', name: 'News Pass', desc: 'Trade through high-impact news windows for one day without a flag.', uses: '1 day', on: 'funded', fx: { t: 'news', days: 1 }, active: true, cost: 0.2 },
    { id: 'u10', r: 'Uncommon', kind: 'Checkout', big: '10%', name: 'Extra 10% Off', desc: 'Ten percent off your next purchase, on top of any live offer.', uses: '1 use', on: 'checkout', fx: { t: 'coupon', pct: 10 }, active: true, cost: 1 },
    { id: 'ucons', r: 'Uncommon', kind: 'Evaluation', big: 'No Rule', name: 'Remove Consistency', desc: 'Drops the consistency rule on one evaluation.', uses: '1 use', on: 'eval', fx: { t: 'evalCons' }, active: true, cost: 1.5 },
    { id: 'uidle', r: 'Uncommon', kind: 'Any Account', big: '+30 Days', name: 'Inactivity Shield', desc: 'Adds 30 days before an idle account closes.', uses: '1 use', on: 'any', fx: { t: 'idle', days: 30 }, active: true, cost: 0.2 },
    { id: 'rreset', r: 'Rare', kind: 'Evaluation', big: 'Reset', name: 'Free Reset', desc: 'One free reset on a failed evaluation.', uses: '1 use', on: 'failed', fx: { t: 'reset' }, active: true, cost: 8 },
    { id: 'r15', r: 'Rare', kind: 'Checkout', big: '15%', name: 'Extra 15% Off', desc: 'Fifteen percent off your next purchase.', uses: '1 use', on: 'checkout', fx: { t: 'coupon', pct: 15 }, active: true, cost: 2 },
    { id: 'rcons', r: 'Rare', kind: 'Funded', big: 'No Rule', name: 'Skip Consistency Once', desc: 'No consistency check on your next payout.', uses: '1 payout', on: 'funded', fx: { t: 'payCons' }, active: true, cost: 6 },
    { id: 'e25', r: 'Epic', kind: 'New Account', big: 'Free 25K', name: 'Free 25K Essential', desc: 'A $25K Essential evaluation, opened at no cost.', uses: '1 use', on: 'new', fx: { t: 'account', plan: 'essential', size: 25000 }, active: true, cost: 12 },
    { id: 'esplit', r: 'Epic', kind: 'Funded', big: '+5%', name: 'Split Boost', desc: '5% more profit split on one funded account, for good.', uses: 'Permanent', on: 'funded', fx: { t: 'split', add: 5 }, active: true, cost: 15 },
    { id: 'l50', r: 'Legendary', kind: 'New Account', big: 'Free 50K', name: 'Free 50K Prime', desc: 'A $50K Prime evaluation, opened at no cost.', uses: '1 use', on: 'new', fx: { t: 'account', plan: 'prime', size: 50000 }, active: true, cost: 20 },
    { id: 'l100', r: 'Legendary', kind: 'Funded', big: '100%', name: 'Full Split', desc: 'You keep 100% of profits on one funded account, for good.', uses: 'Permanent', on: 'funded', fx: { t: 'split', to: 100 }, active: true, cost: 40 },
    { id: 'm150', r: 'Mythic', kind: 'New Account', big: 'Free 150K', name: 'Free 150K Prime', desc: 'A $150K Prime evaluation, opened at no cost.', uses: '1 use', on: 'new', fx: { t: 'account', plan: 'prime', size: 150000 }, active: true, cost: 45 },
    { id: 'mcash', r: 'Mythic', kind: 'Funded', big: '+$1,000', name: '$1,000 Balance Card', desc: 'Adds $1,000 to a funded account balance.', uses: '1 use', on: 'funded', fx: { t: 'balance', amt: 1000 }, active: true, cost: 900 }
  ],
  bundles: [
    { usd: 25, cr: 2500, bonus: 0, badge: '', on: true },
    { usd: 50, cr: 5250, bonus: 5, badge: '', on: true },
    { usd: 100, cr: 11000, bonus: 10, badge: 'Most Popular', on: true },
    { usd: 250, cr: 28750, bonus: 15, badge: 'Best Value', on: true }
  ],
  // Free packs with a checkout order: counts every account in the order
  ladder: { on: true, plans: { essential: true, prime: true, instant: true }, tiers: [
    { n: 2, packs: ['takeoff'], credits: 0 }, { n: 3, packs: ['takeoff', 'takeoff'], credits: 0 },
    { n: 4, packs: ['climb', 'takeoff'], credits: 0 }, { n: 5, packs: ['takeoff', 'climb', 'jet', 'strato', 'orbit'], credits: 0, full: true }] },
  rules: { perDollar: 100, cryptoBonus: 5, dailyCap: 50000, custom: { on: true, min: 10, max: 2000 } }
};

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const fmt = (n) => Number(n).toLocaleString('en-US');
// A real number from the request: a number, or a string that is only a number. Anything else (lists, true, '') is NaN.
const strictNum = (v) => (typeof v === 'number' ? (Number.isFinite(v) ? v : NaN) : typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim()) ? Number(v) : NaN);
// A row id from the request, or null when it is not a whole number above zero
const rowId = (v) => { const n = strictNum(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
// The guarantee line traders see is written from the odds, so the two can never disagree
const lowest = (odds) => { const i = (odds || []).findIndex((x) => Number(x) > 0); return i < 0 ? 0 : i; };
const gText = (i) => (i > 0 ? `${RN[i]} or better on all three` : 'Any rarity');
const OLD_DESC = { esplit: 'Five points more profit split on one funded account, for good.' };

// ---------- config ----------
let cache = null; let cacheAt = 0;
function normalize(v) {
  const c = Object.assign({}, DEF, v || {});
  const ids = new Set();
  c.packs = (Array.isArray(c.packs) ? c.packs : DEF.packs).filter((p) => p && p.id && !ids.has(p.id) && ids.add(p.id)).map((p) => {
    const d = DEF.packs.find((x) => x.id === p.id) || {};
    const odds = (Array.isArray(p.odds) && p.odds.length === 6 ? p.odds : d.odds || [100, 0, 0, 0, 0, 0]).map((x) => Math.max(0, num(x)));
    return { id: clean(p.id, 30), name: clean(p.name || d.name || p.id, 60), short: clean(p.short || d.short || p.name || p.id, 30), price: Math.max(1, Math.round(num(p.price, d.price || 1000))), tag: clean(p.tag || d.tag || '', 200), odds, g: gText(lowest(odds)), gmin: Number.isInteger(p.gmin) && p.gmin >= 0 && p.gmin <= 5 ? Math.min(p.gmin, lowest(odds)) : lowest(odds), on: p.on !== false, limit: Math.max(0, Math.round(num(p.limit))), ver: Math.max(1, Math.round(num(p.ver, 1))) };
  });
  const cids = new Set();
  c.cards = (Array.isArray(c.cards) ? c.cards : DEF.cards).filter((x) => x && x.id && !cids.has(x.id) && cids.add(x.id)).map((x) => {
    const d = DEF.cards.find((y) => y.id === x.id) || {};
    return { id: clean(x.id, 30), r: RN.includes(x.r) ? x.r : d.r || 'Common', kind: clean(x.kind || d.kind || '', 30), big: clean(x.big || d.big || '', 20), name: clean(x.name || d.name || x.id, 60), desc: clean((x.desc && x.desc !== OLD_DESC[x.id] ? x.desc : d.desc) || '', 200), uses: clean(x.uses || d.uses || '1 use', 20), on: ['checkout', 'eval', 'funded', 'failed', 'any', 'new'].includes(x.on) ? x.on : d.on || 'checkout', fx: x.fx && x.fx.t ? x.fx : d.fx || { t: 'coupon', pct: 5 }, active: x.active !== false, cost: num(x.cost, d.cost || 0) };
  });
  c.bundles = (Array.isArray(c.bundles) ? c.bundles : DEF.bundles).map((b) => ({ usd: Math.max(1, round2(num(b.usd, 10))), cr: Math.max(1, Math.round(num(b.cr, num(b.usd) * 100))), bonus: Math.max(0, num(b.bonus)), badge: clean(b.badge || '', 30), on: b.on !== false }));
  const L = Object.assign({}, DEF.ladder, c.ladder || {});
  c.ladder = { on: L.on !== false, plans: Object.assign({}, DEF.ladder.plans, L.plans || {}), tiers: (Array.isArray(L.tiers) ? L.tiers : DEF.ladder.tiers).map((t) => ({ n: Math.max(1, Math.round(num(t.n, 2))), packs: (t.packs || []).filter((k) => c.packs.some((p) => p.id === k)), credits: Math.max(0, Math.round(num(t.credits))), full: !!t.full })).filter((t) => t.packs.length || t.credits).sort((a, b) => a.n - b.n) };
  c.rules = Object.assign({}, DEF.rules, c.rules || {}); c.rules.custom = Object.assign({}, DEF.rules.custom, (c.rules || {}).custom || {});
  c.rules.perDollar = Math.max(1, Math.round(num(c.rules.perDollar, 100))); c.rules.cryptoBonus = Math.max(0, num(c.rules.cryptoBonus)); c.rules.dailyCap = Math.max(0, Math.round(num(c.rules.dailyCap)));
  return c;
}
async function config(force) {
  if (!force && cache && Date.now() - cacheAt < 5000) return cache;
  const r = await db.one('SELECT v FROM kv WHERE k=$1', [KEY]);
  cache = normalize(r && r.v); cacheAt = Date.now(); return cache;
}
// Settings are checked as they were sent: a bad value is refused with its reason, never quietly changed to something else
function checkInput(v, before) {
  const N = strictNum; const whole = (x) => Number.isInteger(N(x));
  if (!v || typeof v !== 'object' || Array.isArray(v)) bad('Send the pack settings');
  if (v.packs !== undefined) {
    if (!Array.isArray(v.packs)) bad('Packs must be a list');
    v.packs.forEach((p) => { const nm = clean((p && (p.name || p.id)) || 'A pack', 60); if (!p || typeof p !== 'object' || !p.id) bad('Every pack needs an id');
      if (p.price !== undefined && !(whole(p.price) && N(p.price) >= 1 && N(p.price) <= 10000000)) bad(`${nm}: the price must be a whole number of credits, 1 or more`);
      if (p.limit !== undefined && !(whole(p.limit) && N(p.limit) >= 0)) bad(`${nm}: the daily limit must be a whole number, 0 for no limit`);
      if (p.odds !== undefined) { if (!Array.isArray(p.odds) || p.odds.length !== 6) bad(`${nm}: send six odds, one for each rarity from Common to Mythic`); p.odds.forEach((x, i) => { if (!(N(x) >= 0 && N(x) <= 100)) bad(`${nm}: the ${RN[i]} odds must be a number from 0 to 100`); }); }
      if (p.gmin !== undefined && p.gmin !== null && !(whole(p.gmin) && N(p.gmin) >= 0 && N(p.gmin) <= 5)) bad(`${nm}: pick the guarantee from the list`);
      // odds may not break the guarantee the pack states (the one sent, or the one it already has)
      const b = before.packs.find((x) => x.id === p.id); const odds = Array.isArray(p.odds) ? p.odds.map(Number) : b ? b.odds : null; const stated = p.gmin != null ? N(p.gmin) : b ? b.gmin : null;
      if (odds && stated != null) for (let i = 0; i < stated; i++) if (odds[i] > 0) bad(`${nm} promises "${gText(stated)}", but ${RN[i]} is at ${odds[i]}%. Set it to 0% or change the guarantee first.`);
    });
  }
  if (v.cards !== undefined) {
    if (!Array.isArray(v.cards)) bad('Cards must be a list');
    v.cards.forEach((c) => { if (!c || typeof c !== 'object' || !c.id) bad('Every card needs an id'); const nm = clean(c.name || c.id, 60); const fx = c.fx;
      if (c.cost !== undefined && !(N(c.cost) >= 0)) bad(`${nm}: the cost must be 0 or more`);
      if (fx === undefined) return; if (!fx || typeof fx !== 'object' || !fx.t) bad(`${nm}: pick what the card does`);
      const rng = (x, lo, hi) => N(x) >= lo && N(x) <= hi;
      if (['coupon', 'resetCoupon'].includes(fx.t) && !rng(fx.pct, 1, 100)) bad(`${nm}: the discount must be from 1% to 100%`);
      if (fx.t === 'minDays' && !(whole(fx.n) && rng(fx.n, 1, 30))) bad(`${nm}: days cut must be a whole number from 1 to 30`);
      if (['news', 'idle'].includes(fx.t) && !(whole(fx.days) && rng(fx.days, 1, 365))) bad(`${nm}: days must be a whole number from 1 to 365`);
      if (fx.t === 'split' && !(fx.to != null ? rng(fx.to, 1, 100) : rng(fx.add, 1, 100))) bad(`${nm}: the split must be from 1% to 100%`);
      if (fx.t === 'balance' && !rng(fx.amt, 1, 1000000)) bad(`${nm}: the amount must be $1 or more`);
      if (fx.t === 'account' && !(fx.plan && N(fx.size) > 0)) bad(`${nm}: pick the plan and size of the free account`);
    });
  }
  if (v.bundles !== undefined) {
    if (!Array.isArray(v.bundles)) bad('Bundles must be a list');
    v.bundles.forEach((b, i) => { const nm = `Bundle ${i + 1}`; if (!b || typeof b !== 'object') bad(`${nm} is not valid`);
      if (!(N(b.usd) >= 1 && N(b.usd) <= 100000)) bad(`${nm}: the price must be $1 or more`);
      if (!(whole(b.cr) && N(b.cr) >= 1)) bad(`${nm}: credits must be a whole number, 1 or more`);
      if (b.bonus !== undefined && !(N(b.bonus) >= 0 && N(b.bonus) <= 500)) bad(`${nm}: the bonus must be from 0% to 500%`); });
  }
  if (v.ladder !== undefined && v.ladder !== null) {
    if (typeof v.ladder !== 'object') bad('Checkout rewards are not valid');
    if (v.ladder.tiers !== undefined) { if (!Array.isArray(v.ladder.tiers)) bad('Checkout reward steps must be a list');
      v.ladder.tiers.forEach((t) => { if (!t || !(whole(t.n) && N(t.n) >= 1)) bad('Checkout rewards: the number of accounts must be a whole number, 1 or more'); if (t.credits !== undefined && !(whole(t.credits) && N(t.credits) >= 0)) bad('Checkout rewards: credits must be a whole number, 0 or more'); if (t.packs !== undefined && !Array.isArray(t.packs)) bad('Checkout rewards: packs must be a list'); }); }
  }
  if (v.rules !== undefined && v.rules !== null) {
    const R = v.rules; if (typeof R !== 'object') bad('Credit rules are not valid');
    if (R.perDollar !== undefined && !(whole(R.perDollar) && N(R.perDollar) >= 1)) bad('Credits per dollar must be a whole number, 1 or more');
    if (R.cryptoBonus !== undefined && !(N(R.cryptoBonus) >= 0 && N(R.cryptoBonus) <= 100)) bad('The crypto bonus must be from 0% to 100%');
    if (R.dailyCap !== undefined && !(whole(R.dailyCap) && N(R.dailyCap) >= 0)) bad('The daily limit must be a whole number of credits, 0 for no limit');
    if (R.custom !== undefined && R.custom !== null) { const cu = Object.assign({}, before.rules.custom, R.custom);
      if (!(N(cu.min) >= 1)) bad('The smallest custom amount must be $1 or more'); if (!(N(cu.max) >= N(cu.min))) bad(`The largest custom amount ($${cu.max}) must not be below the smallest ($${cu.min})`); }
  }
}
// What changed, for the audit trail: one line per setting with the old and the new value
function changes(a, b) {
  const flat = (o, pre, out) => { Object.entries(o || {}).forEach(([k, v]) => { const key = pre ? pre + '.' + k : k; if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out); else out[key] = JSON.stringify(v); }); return out; };
  const byId = (c) => ({ packs: Object.fromEntries(c.packs.map((p) => [p.id, Object.assign({}, p, { ver: undefined })])), cards: Object.fromEntries(c.cards.map((x) => [x.id, x])), bundles: Object.fromEntries(c.bundles.map((x, i) => [i + 1, x])), ladder: { on: c.ladder.on, plans: c.ladder.plans, tiers: c.ladder.tiers.map((t) => `${t.n}: ${t.packs.join('+')}${t.credits ? ' +' + t.credits + ' credits' : ''}`) }, rules: c.rules });
  const A = flat(byId(a), '', {}), B = flat(byId(b), '', {}); const out = [];
  [...new Set(Object.keys(A).concat(Object.keys(B)))].forEach((k) => { if (A[k] !== B[k]) out.push({ what: k, from: A[k] === undefined ? null : JSON.parse(A[k]), to: B[k] === undefined ? null : JSON.parse(B[k]) }); });
  return out;
}
async function saveConfig(v, actorId) {
  const before = await config(true); checkInput(v, before);
  // a pack sent without a guarantee keeps the one it has
  if (v && Array.isArray(v.packs)) v = Object.assign({}, v, { packs: v.packs.map((p) => { const b = before.packs.find((x) => x.id === p.id); return p.gmin == null && b ? Object.assign({}, p, { gmin: b.gmin }) : p.gmin != null ? Object.assign({}, p, { gmin: Number(p.gmin) }) : p; }) });
  const next = normalize(v);
  // a pack whose odds or price changed gets a new version; packs already bought keep the odds they were sold with
  next.packs.forEach((p) => { const b = before.packs.find((x) => x.id === p.id); if (b) p.ver = b.ver + (JSON.stringify(b.odds) !== JSON.stringify(p.odds) || b.price !== p.price ? 1 : 0); });
  next.packs.forEach((p) => { const s = p.odds.reduce((a, b) => a + b, 0); if (Math.abs(s - 100) > 0.01) bad(`${p.name}: the odds add up to ${round2(s)}%, not 100%`); });
  if (!next.packs.length) bad('Keep at least one pack');
  for (const p of next.packs) for (let i = 0; i < 6; i++) if (p.odds[i] > 0 && !next.cards.some((c) => c.active && c.r === RN[i])) bad(`${p.name} can draw ${RN[i]} cards, but no ${RN[i]} card is active`);
  await db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', [KEY, JSON.stringify(next)]);
  const ch = changes(before, next);
  cache = null; await core.audit(actorId, 'packs.config', 'packs', { changed: ch.length, changes: ch.slice(0, 60) });
  return config(true);
}
async function enabled() { const f = ((await db.one("SELECT v FROM kv WHERE k='settings.flags'")) || {}).v || {}; return f.packs !== false; }
async function setEnabled(on, actorId) {
  await db.q("INSERT INTO kv(k,v) VALUES('settings.flags', $1) ON CONFLICT (k) DO UPDATE SET v = kv.v || $1, updated_at=now()", [JSON.stringify({ packs: !!on })]);
  await core.audit(actorId, on ? 'packs.on' : 'packs.off', 'packs', {});
}
async function need() { if (!(await enabled())) bad('Packs are switched off right now', 403); }

// ---------- ledger ----------
// Every credit movement goes through here so the balance and the ledger never drift apart.
async function credit(c, userId, delta, label, kind, ref, actorId) {
  delta = Math.round(delta); if (!delta) return;
  if (delta < 0) { const u = await c.one('SELECT points FROM users WHERE id=$1 FOR UPDATE', [userId]); const has = u ? u.points : 0;
    if (!u || has + delta < 0) { if (actorId) bad(has > 0 ? `This trader has ${fmt(has)} credits, so you can take back up to ${fmt(has)}.` : 'This trader has no credits to take back.'); bad(`You need ${fmt(-delta)} credits for this. You have ${fmt(has)}.`, 402); } }
  await c.q('INSERT INTO points_log(user_id,label,delta,kind,ref,actor_id) VALUES($1,$2,$3,$4,$5,$6)', [userId, clean(label, 160), delta, kind || '', ref || '', actorId || null]);
  await c.q('UPDATE users SET points=points+$1 WHERE id=$2', [delta, userId]);
}
// Take back up to `delta` credits without going below zero (refunds of packs already spent)
async function clawback(c, userId, amount, label, ref) {
  const u = await c.one('SELECT points FROM users WHERE id=$1 FOR UPDATE', [userId]); const take = Math.min(Math.max(0, u ? u.points : 0), Math.round(amount));
  if (take > 0) await credit(c, userId, -take, label, 'refund', ref); return take;
}

// ---------- drawing ----------
// Secure random float in [0, 100)
const roll = () => crypto.randomInt(0, 1e9) / 1e7;
function drawOne(cfg, odds) {
  let x = roll(); let k = 0; for (; k < 6; k++) { x -= odds[k]; if (x < 0) break; } k = Math.min(k, 5);
  // a rarity with odds must have a card; walk down, then up, to the nearest rarity that has one
  const pool = (r) => cfg.cards.filter((c) => c.active && c.r === RN[r]);
  let r = k; while (r >= 0 && !pool(r).length) r--; if (r < 0) { r = k; while (r < 6 && !pool(r).length) r++; }
  const L = pool(r); if (!L.length) bad('No cards are active. Add cards in the back office.', 500);
  return L[crypto.randomInt(0, L.length)];
}
async function openPack(c, userId, packRow, cfg) {
  const cards = [];
  for (let i = 0; i < 3; i++) {
    const cd = drawOne(cfg, packRow.odds && packRow.odds.length === 6 ? packRow.odds : (cfg.packs.find((p) => p.id === packRow.pack) || {}).odds);
    const row = await c.one('INSERT INTO user_cards(user_id,card,rarity,data,pack_id) VALUES($1,$2,$3,$4,$5) RETURNING id', [userId, cd.id, cd.r, JSON.stringify(cd), packRow.id]);
    cards.push(Object.assign({ uid: row.id }, cd));
  }
  await c.q("UPDATE user_packs SET status='opened', opened_at=now() WHERE id=$1", [packRow.id]);
  return cards;
}
const pub = (cd) => ({ uid: cd.uid, id: cd.id, r: cd.r, kind: cd.kind, big: cd.big, name: cd.name, desc: cd.desc, uses: cd.uses, on: cd.on });

// Buy a pack with credits and open it
async function buy(user, packId) {
  await require('./payments').maintGuard();
  await need(); const cfg = await config(); const p = cfg.packs.find((x) => x.id === packId && x.on);
  if (!p) bad('That pack is not on sale');
  return db.tx(async (c) => {
    if (p.limit) { const n = (await c.one("SELECT count(*)::int n FROM user_packs WHERE user_id=$1 AND pack=$2 AND source='bought' AND created_at >= date_trunc('day', now())", [user.id, p.id])).n; if (n >= p.limit) bad(`You can open up to ${p.limit} ${p.name}${p.limit === 1 ? '' : 's'} a day. Come back tomorrow.`); }
    await credit(c, user.id, -p.price, 'Opened ' + p.name, 'spent', p.id);
    const row = await c.one("INSERT INTO user_packs(user_id,pack,name,odds,source,price) VALUES($1,$2,$3,$4,'bought',$5) RETURNING *", [user.id, p.id, p.name, JSON.stringify(p.odds), p.price]);
    const cards = await openPack(c, user.id, row, cfg);
    const bal = (await c.one('SELECT points FROM users WHERE id=$1', [user.id])).points;
    await c.q("UPDATE points_log SET label=$3 WHERE id=(SELECT max(id) FROM points_log WHERE user_id=$1 AND ref=$2)", [user.id, p.id, 'Opened ' + p.name + ': ' + cards.map((x) => x.name).join(' · ')]);
    return { pack: row.id, cards: cards.map(pub), balance: bal };
  });
}
// Open a pack the trader already owns (from checkout or a grant)
async function openOwned(user, id) {
  await need(); const cfg = await config();
  return db.tx(async (c) => {
    if (id != null && rowId(id) == null) bad('Pack not found', 404);
    const row = id != null ? await c.one("SELECT * FROM user_packs WHERE id=$1 AND user_id=$2 FOR UPDATE", [rowId(id), user.id]) : await c.one("SELECT * FROM user_packs WHERE user_id=$1 AND status='unopened' ORDER BY id LIMIT 1 FOR UPDATE", [user.id]);
    if (!row) bad('Pack not found', 404); if (row.status === 'revoked') bad('This pack was removed' + (row.note ? ': ' + row.note.charAt(0).toLowerCase() + row.note.slice(1) : '')); if (row.status !== 'unopened') bad('This pack has already been opened');
    const cards = await openPack(c, user.id, row, cfg);
    await c.q('INSERT INTO points_log(user_id,label,delta,kind,ref) VALUES($1,$2,0,$3,$4)', [user.id, 'Opened ' + row.name + ': ' + cards.map((x) => x.name).join(' · '), 'spent', row.pack]);
    return { pack: row.id, cards: cards.map(pub) };
  });
}

// ---------- using a card ----------
const ACC_LABEL = (a) => `${a.kind === 'funded' ? (a.plan === 'instant' ? 'Instant' : 'Funded') : 'Evaluation'} · $${a.size / 1000}K`;
function eligible(on, a) {
  if (!a) return false;
  if (on === 'eval') return a.kind === 'evaluation' && a.phase === 'active';
  if (on === 'failed') return a.kind === 'evaluation' && a.phase === 'breached';
  if (on === 'funded') return a.kind === 'funded' && ['active', 'review'].includes(a.phase);
  if (on === 'any') return ['active', 'passed', 'review'].includes(a.phase);
  return false;
}
const couponCode = (pfx) => 'FS-' + pfx + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
async function useCard(user, cardUid, body) {
  await need(); if (rowId(cardUid) == null) bad('Card not found', 404);
  return db.tx(async (c) => {
    const uc = await c.one('SELECT * FROM user_cards WHERE id=$1 AND user_id=$2 FOR UPDATE', [rowId(cardUid), user.id]);
    if (!uc) bad('Card not found', 404); if (uc.status === 'revoked') bad('This card was removed from your collection'); if (uc.status !== 'ready') bad('This card has already been used');
    const cd = uc.data || {}; const fx = cd.fx || {}; const cat = await core.catalog();
    let usedOn = ''; let done = ''; let extra = {}; let coupon = null;
    if (cd.on === 'checkout') {
      const code = couponCode('CARD');
      const kind = fx.t === 'resetCoupon' ? 'reset_discount' : 'discount';
      await c.q("INSERT INTO coupons(code,user_id,pct,label,kind,source,expires_at) VALUES($1,$2,$3,$4,$5,'card', now() + interval '365 days')", [code, user.id, num(fx.pct, 5), 'Card: ' + cd.name, kind]);
      coupon = code; usedOn = kind === 'reset_discount' ? 'your next reset' : 'your next checkout'; done = kind === 'reset_discount' ? `${cd.name} comes off your next reset automatically.` : `${cd.name} comes off your next checkout automatically.`; extra = { code };
    } else if (cd.on === 'new') {
      const p = core.planDef(cat, fx.plan); const s = p && core.sizeDef(cat, fx.plan, fx.size);
      if (!p || !s || p.active === false) bad('That account is not on sale right now. Contact support and we will set it up for you.');
      // a free account counts toward the same account limits as a bought one; the card stays unused when a limit is reached
      try { await require('./payments').checkLimits(user, [{ plan: fx.plan, size: Number(fx.size), qty: 1 }]); } catch (e) { if (e.status && e.status < 500) bad(`${String(e.message).replace(/\.$/, '')}. Your card stays in your collection until there is room.`, e.status); throw e; }
      const id = await core.createAccount(c, { userId: user.id, plan: fx.plan, size: Number(fx.size), platform: (body && body.platform && p.platforms.includes(body.platform)) ? body.platform : (p.defPlatform && p.platforms.includes(p.defPlatform) ? p.defPlatform : p.platforms[0]), addons: [] });
      await c.q("UPDATE accounts SET perks = perks || $2 WHERE id=$1", [id, JSON.stringify({ fromCard: cd.name })]);
      await core.notify(c, user.id, `Your account ${id} is ready`, `Opened free with your ${cd.name} card.`, 'account?acct=' + id);
      usedOn = id; done = `${id} is open on your dashboard.`; extra = { account: id };
    } else {
      const id = clean(body && body.account, 40); const a = await c.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE', [id, user.id]);
      if (!a) bad('Pick one of your accounts'); if (!eligible(cd.on, a)) bad('This card does not work on that account');
      const perks = Object.assign({}, a.perks || {}); const used = perks.cards || [];
      // a card that would change nothing is refused, so it is not burned
      const RU = require('./rules'); const now = RU.rulesFor(cat, a); const plain = RU.rulesFor(cat, Object.assign({}, a, { perks: {} }));
      if (fx.t === 'minDays') { if (!(now.minDays > 0)) bad('This evaluation has no minimum trading days left to cut. Keep the card for another one.'); perks.minDaysOff = (perks.minDaysOff || 0) + num(fx.n, 1); }
      else if (fx.t === 'evalCons') { if (perks.evalCons) bad('Consistency is already off on this account'); perks.evalCons = true; }
      else if (fx.t === 'news') { if (!plain.news) bad('This account has no news rule, so the card would change nothing'); perks.newsUntil = new Date(Math.max(Date.now(), perks.newsUntil ? Date.parse(perks.newsUntil) : 0) + num(fx.days, 1) * 864e5).toISOString(); }
      else if (fx.t === 'idle') { if (!plain.inactivity) bad('This account has no inactivity rule, so the card would change nothing'); perks.idleDays = (perks.idleDays || 0) + num(fx.days, 30); }
      else if (fx.t === 'payCons') { if (perks.payCons) bad('Your next payout already skips consistency'); perks.payCons = true; }
      else if (fx.t === 'split') { if (fx.to) { if (perks.splitTo >= fx.to) bad('This account already has that split'); perks.splitTo = num(fx.to, 100); } else { if ((now.split || 0) >= 100) bad('This account already keeps 100% of profits'); perks.splitAdd = (perks.splitAdd || 0) + num(fx.add, 5); } }
      else if (fx.t === 'balance') { await c.q('UPDATE accounts SET balance=balance+$2 WHERE id=$1', [a.id, num(fx.amt)]); }
      else if (fx.t === 'reset') { await core.resetAccount(c, a.id, user.id, 0); }
      else bad('This card cannot be used yet');
      used.push({ card: cd.id, name: cd.name, at: new Date().toISOString() }); perks.cards = used;
      await c.q('UPDATE accounts SET perks=$2 WHERE id=$1', [a.id, JSON.stringify(perks)]);
      usedOn = a.id; done = `${cd.name} is on ${a.id}.`;
    }
    await c.q("UPDATE user_cards SET status='used', used_on=$2, used_at=now(), coupon=$3 WHERE id=$1", [uc.id, usedOn, coupon]);
    await c.q('INSERT INTO points_log(user_id,label,delta,kind,ref) VALUES($1,$2,0,$3,$4)', [user.id, `Used ${cd.name}`, 'card', usedOn]);
    await core.audit(user.id, 'card.use', String(uc.id), { card: cd.id, on: usedOn });
    return Object.assign({ ok: true, usedOn, msg: done }, extra);
  });
}

// ---------- checkout free packs ----------
function ladderFor(cfg, items) {
  if (!cfg.ladder.on) return null;
  const n = (items || []).filter((i) => cfg.ladder.plans[i.plan] !== false).reduce((s, i) => s + (Number(i.qty) || 1), 0);
  return cfg.ladder.tiers.filter((t) => n >= t.n).pop() || null;
}
// The summary line for the free packs an order earns, in the same words as checkout step 1 (null when nothing is earned). Shown only: never stored on the order.
async function ladderLine(items) {
  if (!(await enabled())) return null; const cfg = await config(); const t = ladderFor(cfg, items); if (!t || !(t.packs.length || t.credits)) return null;
  const full = t.packs.length >= 3 && new Set(t.packs).size === t.packs.length;
  const what = full ? 'The Full Pack Stack' : [summarize(cfg, t.packs)].concat(t.credits ? [t.credits.toLocaleString('en-US') + ' Credits'] : []).filter(Boolean).join(' + ');
  return { label: 'Free Packs: ' + what, amount: 0, kind: 'packs', free: true };
}
// Called inside fulfilOrder's transaction for paid account orders
async function grantForOrder(c, o) {
  if (!(await enabled())) return null; const cfg = await config(); const t = ladderFor(cfg, o.items);
  if (!t || (o.meta && o.meta.packsGranted)) return null;
  const ids = [];
  for (const k of t.packs) { const p = cfg.packs.find((x) => x.id === k); if (!p) continue; const r = await c.one("INSERT INTO user_packs(user_id,pack,name,odds,source,order_id) VALUES($1,$2,$3,$4,'checkout',$5) RETURNING id", [o.user_id, p.id, p.name, JSON.stringify(p.odds), o.id]); ids.push(r.id); }
  if (t.credits) await credit(c, o.user_id, t.credits, `Checkout reward: ${o.code}`, 'reward', o.code);
  const names = summarize(cfg, t.packs);
  await c.q('INSERT INTO points_log(user_id,label,delta,kind,ref) VALUES($1,$2,0,$3,$4)', [o.user_id, `Checkout reward ${o.code}: ${names}`, 'reward', o.code]);
  await core.notify(c, o.user_id, 'Free packs are waiting', `${names} from order ${o.code}. Open them on the Packs page.`, 'packs');
  await c.q("UPDATE orders SET meta = meta || $2 WHERE id=$1", [o.id, JSON.stringify({ packsGranted: { packs: ids, credits: t.credits || 0, label: names } })]);
  return { packs: ids, label: names };
}
function summarize(cfg, list) { const m = {}; list.forEach((k) => { m[k] = (m[k] || 0) + 1; }); return Object.entries(m).map(([k, n]) => { const p = cfg.packs.find((x) => x.id === k) || { short: k }; return (n > 1 ? n + ' ' : '') + p.short + (n > 1 ? ' Packs' : ' Pack'); }).join(' + '); }

// ---------- buying credits ----------
// Credits a custom amount buys: the bonus of the biggest bundle it reaches
function customCredits(cfg, usd) { const tb = cfg.bundles.filter((x) => x.on && x.usd <= usd).sort((a, b) => b.usd - a.usd)[0]; const bonus = tb ? tb.bonus : 0; return { bonus, cr: Math.round(usd * cfg.rules.perDollar * (1 + bonus / 100)) }; }
// Credits the trader can still buy today under the daily limit (null when there is no limit)
async function capLeft(cfg, userId) {
  if (!cfg.rules.dailyCap) return null;
  const today = (await db.one("SELECT COALESCE(sum(delta),0)::int n FROM points_log WHERE user_id=$1 AND kind='bought' AND created_at >= date_trunc('day', now())", [userId])).n;
  return Math.max(0, cfg.rules.dailyCap - today);
}
// The largest custom amount (whole dollars) that fits what is left of the daily limit: this is the maximum the page shows
function customMax(cfg, left) {
  const R = cfg.rules; let hi = Math.floor(Number(R.custom.max) || 0); const lo = Math.ceil(Number(R.custom.min) || 1);
  if (left == null) return hi; if (customCredits(cfg, lo).cr > left) return 0;
  let a = lo; while (a < hi) { const m = Math.ceil((a + hi) / 2); if (customCredits(cfg, m).cr <= left) a = m; else hi = m - 1; }
  while (a > lo && customCredits(cfg, a).cr > left) a--; // a bonus step can push an amount over the limit
  return a;
}
async function createCreditsOrder(user, body) {
  await require('./payments').maintGuard();
  await need(); const cfg = await config(); const R = cfg.rules;
  if (!body || typeof body !== 'object' || Array.isArray(body)) bad('Pick a bundle or enter an amount');
  const hasB = body.bundle !== undefined && body.bundle !== null, hasC = body.custom !== undefined && body.custom !== null;
  if (hasB && hasC) bad('Pick a bundle or enter an amount, not both'); if (!hasB && !hasC) bad('Pick a bundle or enter an amount');
  const left = await capLeft(cfg, user.id); const cmax = customMax(cfg, left);
  const capMsg = () => (left <= 0 ? `You can buy up to ${fmt(R.dailyCap)} credits a day, and you have reached that today. Come back tomorrow.` : `You can buy up to ${fmt(R.dailyCap)} credits a day. You can still buy ${fmt(left)} today${R.custom.on && cmax >= R.custom.min ? `, so the largest custom amount right now is $${fmt(cmax)}` : ''}.`);
  let usd, cr, bonus = 0, label;
  if (hasC) {
    if (!R.custom.on) bad('Pick one of the bundles');
    if (typeof body.custom !== 'number' || !Number.isFinite(body.custom)) bad('Enter the amount as a number, like 75');
    usd = body.custom; if (Math.round(usd * 100) !== usd * 100 && Math.abs(Math.round(usd * 100) - usd * 100) > 1e-6) bad('Enter the amount in dollars and cents, like 75 or 75.50'); usd = round2(usd);
    if (usd < R.custom.min) bad(`The smallest custom amount is $${fmt(R.custom.min)}`);
    if (usd > R.custom.max) bad(`The largest custom amount is $${fmt(R.custom.max)}`);
    ({ bonus, cr } = customCredits(cfg, usd)); label = `${fmt(cr)} Credits${bonus ? ` (includes ${bonus}% bonus)` : ''}`;
  } else {
    if (typeof body.bundle !== 'number' || !Number.isInteger(body.bundle)) bad('Pick a bundle');
    const b = cfg.bundles.filter((x) => x.on)[body.bundle]; if (!b || body.bundle < 0) bad('Pick a bundle');
    usd = b.usd; cr = b.cr; bonus = b.bonus; label = `${fmt(cr)} Credits${b.bonus ? ` (includes ${b.bonus}% bonus)` : ''}`;
  }
  if (left != null && cr > left) bad(capMsg());
  const code = await core.ordCode();
  const o = await db.one(`INSERT INTO orders(code,user_id,kind,lines,items,subtotal,discount,total,meta) VALUES($1,$2,'credits',$3,'[]',$4,0,$4,$5) RETURNING *`,
    [code, user.id, JSON.stringify([{ label, amount: usd, kind: 'plan' }]), usd, JSON.stringify({ credits: cr, bonus })]);
  return { code: o.code, total: Number(o.total) };
}
// Called before a pending order is charged: with Packs switched off a credits order cannot be paid. It is cancelled and the trader is told.
async function payGuard(o) {
  if (!o || o.kind !== 'credits' || o.status !== 'pending' || (await enabled())) return;
  await db.q("UPDATE orders SET status='canceled', meta = meta || $2 WHERE id=$1 AND status='pending'", [o.id, JSON.stringify({ canceledWhy: 'Packs are switched off' })]);
  bad('Packs are switched off right now, so credits cannot be bought. This order was cancelled and you were not charged.', 403);
}
// Called by fulfilOrder for kind 'credits'
async function fulfilCredits(c, o) {
  const cfg = await config(); let cr = Number(o.meta.credits) || 0;
  if (o.provider === 'confirmo' && cfg.rules.cryptoBonus) cr += Math.round(cr * cfg.rules.cryptoBonus / 100);
  await credit(c, o.user_id, cr, `Bought ${fmt(cr)} credits · ${o.code}`, 'bought', o.code);
  await c.q("UPDATE orders SET meta = meta || $2 WHERE id=$1", [o.id, JSON.stringify({ creditsAdded: cr })]);
  const on = await enabled(); await core.notify(c, o.user_id, `${fmt(cr)} credits added`, on ? 'Spend them on packs from the Packs page.' : 'They are in your balance.', on ? 'packs' : 'rewards');
}
// ---------- refunds ----------
const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;
// A card can be taken back while it is unused, or saved for checkout with its discount still unused
const takeable = (x) => x.status === 'ready' || x.status === 'revoked' || (x.status === 'used' && x.coupon && x.coupon_used === false);
async function removeCards(c, cards, why) {
  let n = 0;
  for (const x of cards) { if (x.status === 'revoked') continue;
    if (x.status === 'used') { if (!(x.coupon && x.coupon_used === false)) continue; await c.q("UPDATE coupons SET used=true WHERE code=$1 AND used=false", [x.coupon]); }
    await c.q("UPDATE user_cards SET status='revoked', used_on=$2 WHERE id=$1", [x.id, why]); n++; }
  return n;
}
const cardsOf = (c, packIds) => (packIds.length ? c.all('SELECT x.*, k.used AS coupon_used FROM user_cards x LEFT JOIN coupons k ON k.code=x.coupon WHERE x.pack_id = ANY($1) ORDER BY x.id', [packIds]) : []);
// What refunding a credits order would do. Only the unspent share of the credits can be refunded as money, unless
// staff take back what the spent credits bought: packs opened with them are undone while every card from them is still unused.
async function refundInfo(o, c) {
  if (!o || o.kind !== 'credits') return null; const q = c || db;
  const credits = Number((o.meta && (o.meta.creditsAdded || o.meta.credits)) || 0); const total = Number(o.total);
  const u = await q.one('SELECT points FROM users WHERE id=$1' + (c ? ' FOR UPDATE' : ''), [o.user_id]); const bal = Math.max(0, u ? u.points : 0);
  const unspent = Math.min(bal, credits); const spent = credits - unspent; const refundable = credits ? round2(total * unspent / credits) : total;
  // packs opened with credits since this order was paid, newest first, until they cover what was spent
  const rows = spent ? await q.all("SELECT * FROM user_packs WHERE user_id=$1 AND source='bought' AND status='opened' AND price > 0 AND created_at >= $2 ORDER BY id DESC", [o.user_id, o.paid_at || o.created_at]) : [];
  const packs = []; let cover = 0; for (const p of rows) { if (cover >= spent) break; packs.push(p); cover += p.price; }
  const cards = await cardsOf(q, packs.map((p) => p.id)); const usedCards = cards.filter((x) => !takeable(x));
  let block = '';
  if (spent && cover < spent) block = `${plural(spent - cover, 'credit', 'credits')} from this order went on something other than packs, so a full refund is not possible. Refund the unspent share instead.`;
  else if (usedCards.length) block = `${plural(usedCards.length, 'card', 'cards')} bought with these credits ${usedCards.length === 1 ? 'was' : 'were'} already used (${[...new Set(usedCards.map((x) => (x.data || {}).name || x.card))].join(', ')}), so a full refund is not possible. Refund the unspent share instead.`;
  return { order: o.code, total, credits, spent, unspent, refundable, balance: bal, packs: packs.map((p) => ({ id: p.id, name: p.name, price: p.price })), cards: cards.filter((x) => x.status !== 'revoked').map((x) => ({ id: x.id, name: (x.data || {}).name || x.card, status: x.status === 'ready' ? 'unused' : takeable(x) ? 'saved for checkout' : 'used' })), cover,
    canTakeBack: !!spent && !block, block,
    msg: spent ? `${fmt(spent)} of ${fmt(credits)} credits already spent; refundable $${refundable.toFixed(2)}` : '' };
}
// Checked before any money is sent back. Returns the amount to refund; refuses a full refund that cannot be done.
async function refundPlan(o, opt = {}) {
  const info = await refundInfo(o); if (!info) return null;
  if (opt.external || !info.spent) return Object.assign(info, { amount: info.total, takeBack: !!opt.external && !!info.spent });
  if (opt.takeBack) { if (info.block) bad(info.block); return Object.assign(info, { amount: info.total, takeBack: true }); }
  if (!(info.refundable > 0)) bad(`All ${fmt(info.credits)} credits from this order were spent, so there is nothing to refund. A full refund is possible only by taking back what was bought with them.`);
  return Object.assign(info, { amount: info.refundable, takeBack: false });
}
// Refunds: take back bought credits (and, when chosen, what they bought), remove unopened checkout packs and unused cards from them,
// and give back a discount card the refunded order used
async function onRefund(o, opt = {}) {
  const plan = o.refundPlan || null; const full = Number(o.fullTotal || o.total);
  return db.tx(async (c) => {
    const out = {}; const why = 'Order refunded';
    if (o.kind === 'credits') {
      const info = await refundInfo(Object.assign({}, o, { total: full }), c); const takeBack = plan ? plan.takeBack : !!opt.external;
      let undone = [];
      if (takeBack && info.spent) {
        // undo the packs: their cards go and their price comes back, then the order's credits are taken out in full.
        // After a refund the processor already made (or a chargeback) a pack with a used card stays as it is.
        const cards = await cardsOf(c, info.packs.map((p) => p.id));
        for (const p of info.packs) { const mine = cards.filter((x) => x.pack_id === p.id); if (!mine.every(takeable)) continue;
          out.cards = (out.cards || 0) + await removeCards(c, mine, why); await c.q("UPDATE user_packs SET status='revoked', note=$2 WHERE id=$1", [p.id, why]);
          await credit(c, o.user_id, p.price, `Refund ${o.code}: ${p.name} returned`, 'refund', o.code); undone.push(p); }
        out.undone = undone.length;
      }
      out.credits = await clawback(c, o.user_id, takeBack ? info.credits : Math.min(info.unspent, plan ? plan.unspent : info.unspent), `Refund ${o.code}: credits taken back`, o.code);
      const amount = plan ? plan.amount : full;
      const note = info.spent ? (takeBack ? `Taken back what the credits bought: ${plural(undone.length, 'pack', 'packs')} undone, ${plural(out.cards || 0, 'card', 'cards')} removed` : `${fmt(info.spent)} of ${fmt(info.credits)} credits already spent; refunded $${amount.toFixed(2)} of $${full.toFixed(2)}`) : '';
      await c.q("UPDATE orders SET meta = meta || $2 WHERE id=$1", [o.id, JSON.stringify({ refundAmount: amount, refundCredits: { credits: info.credits, spent: info.spent, takenBack: out.credits, tookBack: takeBack && !!info.spent, note } })]);
      out.amount = amount; out.note = info.spent && takeBack ? (undone.length ? `${plural(undone.length, 'pack', 'packs')} opened with these credits undone` : '') : note; // the trader's wording; the staff note is kept on the order
    }
    const g = o.meta && o.meta.packsGranted;
    if (g) {
      const ids = g.packs || [];
      if (ids.length) {
        const r1 = await c.all("UPDATE user_packs SET status='revoked', note='Order refunded' WHERE id = ANY($1) AND status='unopened' RETURNING id", [ids]); out.packs = (out.packs || 0) + r1.length;
        // unused cards from these packs, and cards saved for checkout whose discount was not used yet
        out.cards = (out.cards || 0) + await removeCards(c, await cardsOf(c, ids), why);
      }
      if (g.credits) out.rewardCredits = await clawback(c, o.user_id, g.credits, `Refund ${o.code}: reward credits taken back`, o.code);
    }
    // the order used a discount card: the trader got nothing for it, so it is saved for the next checkout again
    const code = o.meta && o.meta.coupon;
    if (code && !opt.chargeback) { const k = await c.one("UPDATE coupons SET used=false, order_id=NULL WHERE code=$1 AND user_id=$2 AND source='card' AND used=true RETURNING label", [code, o.user_id]);
      if (k) { out.cardBack = k.label; await c.q('INSERT INTO points_log(user_id,label,delta,kind,ref) VALUES($1,$2,0,$3,$4)', [o.user_id, `Refund ${o.code}: ${String(k.label).replace(/^Card: /, '')} is saved for your next ${/reset/i.test(k.label) ? 'reset' : 'checkout'} again`, 'refund', o.code]); } }
    return out;
  });
}

// ---------- reads ----------
async function traderData(userId) {
  if (!(await enabled())) return null;
  const cfg = await config();
  const [u, packs, cards, log, accts] = await Promise.all([
    db.one('SELECT points FROM users WHERE id=$1', [userId]),
    db.all("SELECT id, pack, name, source, order_id, created_at FROM user_packs WHERE user_id=$1 AND status='unopened' ORDER BY id", [userId]),
    // the collection: every card ready to use (newest 600) and the 200 used most recently; the counts cover all of them
    db.all("(SELECT id, card, rarity, data, status, used_on, used_at, created_at FROM user_cards WHERE user_id=$1 AND status='ready' ORDER BY id DESC LIMIT 600) UNION ALL (SELECT id, card, rarity, data, status, used_on, used_at, created_at FROM user_cards WHERE user_id=$1 AND status='used' ORDER BY used_at DESC NULLS LAST, id DESC LIMIT 200) ORDER BY id DESC", [userId]),
    db.all("SELECT id, label, delta, kind, created_at FROM points_log WHERE user_id=$1 ORDER BY id DESC LIMIT $2", [userId, HIST_PAGE + 1]),
    db.all("SELECT id, plan, size, kind, phase, balance, perks FROM accounts WHERE user_id=$1 AND phase NOT IN ('closed') ORDER BY created_at DESC", [userId])
  ]);
  const cnt = await db.one("SELECT count(*) FILTER (WHERE status='ready')::int ready, count(*) FILTER (WHERE status='used')::int used FROM user_cards WHERE user_id=$1", [userId]);
  const left = await capLeft(cfg, userId);
  return {
    bal: u ? u.points : 0, perDollar: cfg.rules.perDollar, cryptoBonus: cfg.rules.cryptoBonus,
    // what the daily limit still allows today, so the pages can show the real maximum
    dailyCap: cfg.rules.dailyCap, capLeft: left, customMax: customMax(cfg, left), ownN: cnt,
    packs: cfg.packs.filter((p) => p.on).map((p) => ({ id: p.id, name: p.name, short: p.short, price: p.price, tag: p.tag, odds: p.odds, g: p.g })),
    cards: cfg.cards.filter((c) => c.active).map((c) => ({ id: c.id, r: c.r, kind: c.kind, big: c.big, name: c.name, desc: c.desc, uses: c.uses, on: c.on })),
    bundles: cfg.bundles.filter((b) => b.on).map((b) => ({ usd: b.usd, cr: b.cr, bonus: b.bonus, badge: b.badge })),
    waiting: packs.map((p) => ({ uid: p.id, id: p.pack, name: p.name })),
    own: cards.map((c) => Object.assign(pub(Object.assign({ uid: c.id }, c.data || {}, { id: c.card, r: c.rarity })), { st: c.status, usedOn: c.used_on || '', usedAt: c.used_at })),
    hist: log.slice(0, HIST_PAGE).map(histRow), histMore: log.length > HIST_PAGE,
    accts: accts.map((a) => ({ id: a.id, det: `${ACC_LABEL(a)} · ${a.phase === 'breached' ? 'failed' : a.phase === 'active' ? '$' + fmt(Math.round(a.balance)) : a.phase}`, t: ['eval', 'failed', 'funded', 'any'].filter((on) => eligible(on, a)) }))
  };
}
const HIST_PAGE = 60;
const histRow = (l) => ({ id: l.id, d: new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }), what: l.label, delta: l.delta, kind: l.kind });
// Older history, a page at a time: rows before the given row id
async function history(userId, before) {
  await need(); const b = before == null || before === '' ? null : rowId(before); if (before != null && before !== '' && b == null) bad('That page of history was not found', 404);
  const log = await db.all('SELECT id, label, delta, kind, created_at FROM points_log WHERE user_id=$1 AND ($2::int IS NULL OR id < $2) ORDER BY id DESC LIMIT $3', [userId, b, HIST_PAGE + 1]);
  return { rows: log.slice(0, HIST_PAGE).map(histRow), more: log.length > HIST_PAGE };
}
// What the checkout needs: the ladder with pack names and art ids (null when packs are off)
async function publicLadder() {
  if (!(await enabled())) return null; const cfg = await config(); if (!cfg.ladder.on || !cfg.ladder.tiers.length) return null;
  return { plans: cfg.ladder.plans, tiers: cfg.ladder.tiers, packs: cfg.packs.map((p) => ({ id: p.id, short: p.short, usd: round2(p.price / cfg.rules.perDollar) })) };
}
async function publicCredits() {
  if (!(await enabled())) return null; const cfg = await config();
  return { perDollar: cfg.rules.perDollar, cryptoBonus: cfg.rules.cryptoBonus, custom: cfg.rules.custom, bundles: cfg.bundles.filter((b) => b.on).map((b) => ({ usd: b.usd, cr: b.cr, bonus: b.bonus, badge: b.badge })) };
}

// ---------- back office ----------
async function adminData() {
  const cfg = await config(true); const on = await enabled();
  const [opened, perPack, drawn, used, bought, outstanding, act, daily, ladderOrders, granted, src] = await Promise.all([
    db.one("SELECT count(*)::int n FROM user_packs WHERE status='opened' AND opened_at > now() - interval '30 days'"),
    // sold and free count packs handed out in the last 30 days; opened counts packs opened in the last 30 days, the same window as the cards drawn from them
    db.all("SELECT pack, count(*) FILTER (WHERE source='bought' AND created_at > now() - interval '30 days')::int sold, count(*) FILTER (WHERE source='checkout' AND created_at > now() - interval '30 days')::int free, count(*) FILTER (WHERE status='opened' AND opened_at > now() - interval '30 days')::int opened, COALESCE(sum(price) FILTER (WHERE created_at > now() - interval '30 days'),0)::int credits FROM user_packs WHERE created_at > now() - interval '30 days' OR opened_at > now() - interval '30 days' GROUP BY pack"),
    db.all("SELECT c.card, c.rarity, count(*)::int n FROM user_cards c JOIN user_packs p ON p.id=c.pack_id WHERE p.opened_at > now() - interval '30 days' GROUP BY c.card, c.rarity"),
    db.all("SELECT card, count(*)::int n FROM user_cards WHERE status='used' AND used_at > now() - interval '30 days' GROUP BY card"),
    db.one("SELECT COALESCE(sum(total),0)::numeric usd, count(*)::int n FROM orders WHERE kind='credits' AND status='paid' AND paid_at > now() - interval '30 days'"),
    db.one("SELECT COALESCE(sum(points),0)::bigint n FROM users WHERE points > 0"),
    db.all("SELECT l.id, l.created_at, l.label, l.delta, l.kind, u.first, u.last, u.tid, a.first AS by FROM points_log l JOIN users u ON u.id=l.user_id LEFT JOIN users a ON a.id=l.actor_id WHERE l.kind IN ('bought','spent','grant','reward','refund','card') ORDER BY l.id DESC LIMIT 200"),
    db.all("SELECT to_char(date_trunc('day', opened_at AT TIME ZONE 'America/New_York'), 'YYYY-MM-DD') d, count(*) FILTER (WHERE source='bought')::int paid, count(*) FILTER (WHERE source<>'bought')::int free FROM user_packs WHERE status='opened' AND opened_at > now() - interval '30 days' GROUP BY 1 ORDER BY 1"),
    db.all("SELECT (meta->'packsGranted'->>'label') label, count(*)::int n FROM orders WHERE meta ? 'packsGranted' AND paid_at > now() - interval '30 days' GROUP BY 1"),
    db.one("SELECT count(*)::int n FROM user_cards WHERE pack_id IS NULL AND created_at > now() - interval '30 days'"),
    // how much of all credits ever given out were bought for cash (the rest are grants and rewards)
    db.one("SELECT COALESCE(sum(delta) FILTER (WHERE kind='bought'),0)::float bought, COALESCE(sum(delta) FILTER (WHERE delta > 0),0)::float given FROM points_log")
  ]);
  const byPack = Object.fromEntries(perPack.map((r) => [r.pack, r]));
  const byRar = {}; drawn.forEach((r) => { byRar[r.rarity] = (byRar[r.rarity] || 0) + r.n; });
  const totalDrawn = Object.values(byRar).reduce((a, b) => a + b, 0);
  // expected rarity mix given what was actually opened
  const exp = RN.map(() => 0); let expN = 0;
  cfg.packs.forEach((p) => { const n = ((byPack[p.id] || {}).opened || 0) * 3; expN += n; p.odds.forEach((o, i) => { exp[i] += n * o / 100; }); });
  const cat = await core.catalog();
  return {
    on, cfg, rarities: RN, plans: cat.plans.filter((p) => p.active !== false && p.id !== 'instant' && p.kind !== 'funded').map((p) => ({ id: p.id, name: p.short || p.name, sizes: p.sizes.map((z) => z.size) })),
    stats: { opened30: opened.n, creditsSold30: Number(bought.usd), creditsOrders30: bought.n, outstanding: Number(outstanding.n), boughtShare: src.given ? Math.min(1, src.bought / src.given) : 0, drawn30: totalDrawn, granted30: granted.n },
    perPack: byPack, drawn: Object.fromEntries(drawn.map((r) => [r.card, r.n])), used: Object.fromEntries(used.map((r) => [r.card, r.n])),
    fair: RN.map((r, i) => ({ r, got: totalDrawn ? (byRar[r] || 0) / totalDrawn * 100 : 0, want: expN ? exp[i] / expN * 100 : 0, n: byRar[r] || 0 })),
    daily, ladderOrders,
    act: act.map((a) => ({ id: a.id, at: a.created_at, who: `${a.first} ${(a.last || '').slice(0, 1)}.`, tid: a.tid, what: a.label, delta: a.delta, kind: a.kind, by: a.by || '' }))
  };
}
async function findTrader(q) {
  q = clean(q, 80).trim(); if (!q) return [];
  return db.all("SELECT id, tid, first, last, email, points FROM users WHERE tid ILIKE $1 OR email ILIKE $1 OR (first || ' ' || last) ILIKE $1 ORDER BY id DESC LIMIT 10", ['%' + q + '%']);
}
async function traderAdmin(uid) {
  if (rowId(uid) == null) bad('Trader not found', 404);
  const u = await db.one('SELECT id, tid, first, last, email, points FROM users WHERE id=$1', [rowId(uid)]); if (!u) bad('Trader not found', 404);
  const [packs, cards, spent] = await Promise.all([
    db.all('SELECT id, pack, name, source, status, note, created_at, opened_at FROM user_packs WHERE user_id=$1 ORDER BY id DESC LIMIT 100', [u.id]),
    db.all('SELECT id, card, rarity, data, status, used_on, created_at FROM user_cards WHERE user_id=$1 ORDER BY id DESC LIMIT 200', [u.id]),
    db.one("SELECT COALESCE(-sum(delta),0)::int n FROM points_log WHERE user_id=$1 AND kind='spent'", [u.id])
  ]);
  return { u, packs, cards: cards.map((c) => ({ id: c.id, card: c.card, name: (c.data || {}).name || c.card, r: c.rarity, status: c.status, usedOn: c.used_on, at: c.created_at })), spent: spent.n };
}
// What a grant is worth in credits: a pack at its price, a card at what it gives (the account's price, the cash it adds, or its cost)
const GRANT_CAP = 100000;
function cardValue(cfg, cat, cd) {
  const fx = cd.fx || {}; let usd = num(cd.cost);
  if (fx.t === 'balance') usd = Math.max(usd, num(fx.amt));
  if (fx.t === 'account') { const z = core.sizeDef(cat, fx.plan, fx.size); if (z) usd = Math.max(usd, core.priceOf(z) || 0); }
  return Math.round(usd * cfg.rules.perDollar);
}
async function grant(actor, uid, body) {
  const cfg = await config(); const reason = clean(body.reason, 160); if (!reason) bad('Add a reason');
  if (rowId(uid) == null) bad('Trader not found', 404);
  const u = await db.one('SELECT id FROM users WHERE id=$1', [rowId(uid)]); if (!u) bad('Trader not found', 404);
  const on = await enabled();
  // Staff other than admins can grant up to 100,000 credits of value to one trader in a day, counting credits, packs and cards together
  const capCheck = async (value) => {
    if (actor.role === 'admin') return;
    if (value > GRANT_CAP) bad(`Grants worth over ${fmt(GRANT_CAP)} credits need an admin. This one is worth ${fmt(value)}.`, 403);
    const day = (await db.one("SELECT COALESCE(sum((meta->>'value')::numeric),0)::float n FROM audit WHERE actor_id=$1 AND action='packs.grant' AND target=$2 AND created_at > now() - interval '24 hours' AND (meta->>'value') ~ '^[0-9]+$'", [actor.id, String(u.id)])).n;
    if (day + value > GRANT_CAP) bad(`You have already granted this trader ${fmt(day)} credits of value today. With this grant (${fmt(value)}) it would pass ${fmt(GRANT_CAP)}, which needs an admin.`, 403);
  };
  return db.tx(async (c) => {
    let value = 0;
    if (body.type === 'credits') {
      const n = body.credits; if (typeof n !== 'number' || !Number.isInteger(n) || n === 0) bad('Enter a whole number of credits, like 500 or -200');
      if (Math.abs(n) > 10000000) bad('That is more credits than one grant can hold (10,000,000)');
      if (Math.abs(n) > GRANT_CAP && actor.role !== 'admin') bad(`Grants over ${fmt(GRANT_CAP)} credits need an admin`, 403);
      if (n > 0) { await capCheck(n); value = n; }
      if (n > 0) await credit(c, u.id, n, `Granted by support: ${reason}`, 'grant', '', actor.id); else await credit(c, u.id, n, `Removed by support: ${reason}`, 'grant', '', actor.id);
      await core.notify(c, u.id, n > 0 ? `${fmt(n)} credits added` : `${fmt(-n)} credits removed`, reason, on ? 'packs' : 'rewards');
    } else if (body.type === 'pack') {
      if (!on) bad('Packs are switched off, so traders cannot open them. Switch Packs on before granting one.');
      const p = cfg.packs.find((x) => x.id === body.pack); if (!p) bad('Pick a pack');
      const qty = body.qty === undefined ? 1 : body.qty; if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > 10) bad('Enter how many packs, from 1 to 10');
      value = p.price * qty; await capCheck(value);
      for (let i = 0; i < qty; i++) await c.q("INSERT INTO user_packs(user_id,pack,name,odds,source,note) VALUES($1,$2,$3,$4,'grant',$5)", [u.id, p.id, p.name, JSON.stringify(p.odds), reason]);
      await c.q('INSERT INTO points_log(user_id,label,delta,kind,actor_id) VALUES($1,$2,0,$3,$4)', [u.id, `Granted ${qty} ${p.short} Pack${qty > 1 ? 's' : ''}: ${reason}`, 'grant', actor.id]);
      await core.notify(c, u.id, `${qty === 1 ? 'A' : qty} free ${p.short} Pack${qty > 1 ? 's' : ''} for you`, reason + (qty > 1 ? ' Open them on the Packs page.' : ' Open it on the Packs page.'), 'packs');
    } else if (body.type === 'card') {
      if (!on) bad('Packs are switched off, so traders cannot use cards. Switch Packs on before granting one.');
      const cd = cfg.cards.find((x) => x.id === body.card); if (!cd) bad('Pick a card');
      value = cardValue(cfg, await core.catalog(), cd); await capCheck(value);
      await c.q('INSERT INTO user_cards(user_id,card,rarity,data) VALUES($1,$2,$3,$4)', [u.id, cd.id, cd.r, JSON.stringify(cd)]);
      await c.q('INSERT INTO points_log(user_id,label,delta,kind,actor_id) VALUES($1,$2,0,$3,$4)', [u.id, `Granted card ${cd.name}: ${reason}`, 'grant', actor.id]);
      await core.notify(c, u.id, `You got a ${cd.name} card`, reason + ' It is in your collection.', 'packs');
    } else bad('Pick what to grant');
    await c.q('INSERT INTO audit(actor_id,action,target,meta) VALUES($1,$2,$3,$4)', [actor.id, 'packs.grant', String(u.id), { type: body.type, reason, value, credits: body.type === 'credits' ? body.credits : undefined, pack: body.type === 'pack' ? body.pack : undefined, qty: body.type === 'pack' ? (body.qty === undefined ? 1 : body.qty) : undefined, card: body.type === 'card' ? body.card : undefined }]);
    return { ok: true, value };
  });
}
async function revokeCard(actor, cardId, reason) {
  if (rowId(cardId) == null) bad('Card not found', 404);
  const r = await db.one("UPDATE user_cards SET status='revoked', used_on=$2 WHERE id=$1 AND status='ready' RETURNING user_id, data", [rowId(cardId), 'Removed: ' + (clean(reason, 120) || 'by support')]);
  if (!r) { if (!(await db.one('SELECT 1 FROM user_cards WHERE id=$1', [rowId(cardId)]))) bad('Card not found', 404); bad('Only unused cards can be removed'); }
  await db.q('INSERT INTO points_log(user_id,label,delta,kind,actor_id) VALUES($1,$2,0,$3,$4)', [r.user_id, `Card removed: ${(r.data || {}).name || ''}`, 'grant', actor.id]);
  await core.audit(actor.id, 'packs.revoke', String(cardId), { card: (r.data || {}).id, user: r.user_id, reason: clean(reason, 120) }); return { ok: true };
}
// Take back a pack staff granted, while it is still unopened
async function revokePack(actor, packId, reason) {
  if (rowId(packId) == null) bad('Pack not found', 404);
  const p = await db.one('SELECT id, source, status FROM user_packs WHERE id=$1', [rowId(packId)]); if (!p) bad('Pack not found', 404);
  if (p.source !== 'grant') bad(p.source === 'checkout' ? 'This pack came with an order. Refund the order to take it back.' : 'Only packs granted by staff can be taken back');
  const r = await db.one("UPDATE user_packs SET status='revoked', note=$2 WHERE id=$1 AND status='unopened' RETURNING user_id, name", [p.id, 'Taken back: ' + (clean(reason, 120) || 'by support')]);
  if (!r) bad(p.status === 'opened' ? 'This pack was already opened. Remove its unused cards instead.' : 'This pack was already taken back');
  await db.q('INSERT INTO points_log(user_id,label,delta,kind,actor_id) VALUES($1,$2,0,$3,$4)', [r.user_id, `Pack taken back: ${r.name}`, 'grant', actor.id]);
  await core.audit(actor.id, 'packs.revokePack', String(p.id), { user: r.user_id, pack: r.name, reason: clean(reason, 120) }); return { ok: true };
}

module.exports = { RN, DEF, config, saveConfig, normalize, enabled, setEnabled, credit, buy, openOwned, useCard, ladderFor, ladderLine, grantForOrder, createCreditsOrder, fulfilCredits, onRefund, traderData, publicLadder, publicCredits, adminData, findTrader, traderAdmin, grant, revokeCard, eligible, drawOne };
Object.assign(module.exports, { revokePack, refundInfo, refundPlan, payGuard, history, customMax, capLeft, gText });
