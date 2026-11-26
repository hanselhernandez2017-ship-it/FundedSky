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
    { id: 'esplit', r: 'Epic', kind: 'Funded', big: '+5%', name: 'Split Boost', desc: 'Five points more profit split on one funded account, for good.', uses: 'Permanent', on: 'funded', fx: { t: 'split', add: 5 }, active: true, cost: 15 },
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
  ladder: { on: true, plans: { essential: true, prime: true, instant: false }, tiers: [
    { n: 2, packs: ['takeoff'], credits: 0 }, { n: 3, packs: ['takeoff', 'takeoff'], credits: 0 },
    { n: 4, packs: ['climb', 'takeoff'], credits: 0 }, { n: 5, packs: ['takeoff', 'climb', 'jet', 'strato', 'orbit'], credits: 0, full: true }] },
  rules: { perDollar: 100, cryptoBonus: 5, dailyCap: 50000, custom: { on: true, min: 10, max: 2000 } }
};

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const fmt = (n) => Number(n).toLocaleString('en-US');

// ---------- config ----------
let cache = null; let cacheAt = 0;
function normalize(v) {
  const c = Object.assign({}, DEF, v || {});
  const ids = new Set();
  c.packs = (Array.isArray(c.packs) ? c.packs : DEF.packs).filter((p) => p && p.id && !ids.has(p.id) && ids.add(p.id)).map((p) => {
    const d = DEF.packs.find((x) => x.id === p.id) || {};
    const odds = (Array.isArray(p.odds) && p.odds.length === 6 ? p.odds : d.odds || [100, 0, 0, 0, 0, 0]).map((x) => Math.max(0, num(x)));
    return { id: clean(p.id, 30), name: clean(p.name || d.name || p.id, 60), short: clean(p.short || d.short || p.name || p.id, 30), price: Math.max(1, Math.round(num(p.price, d.price || 1000))), tag: clean(p.tag || d.tag || '', 200), odds, g: clean(p.g || d.g || 'Any rarity', 80), on: p.on !== false, limit: Math.max(0, Math.round(num(p.limit))), ver: Math.max(1, Math.round(num(p.ver, 1))) };
  });
  const cids = new Set();
  c.cards = (Array.isArray(c.cards) ? c.cards : DEF.cards).filter((x) => x && x.id && !cids.has(x.id) && cids.add(x.id)).map((x) => {
    const d = DEF.cards.find((y) => y.id === x.id) || {};
    return { id: clean(x.id, 30), r: RN.includes(x.r) ? x.r : d.r || 'Common', kind: clean(x.kind || d.kind || '', 30), big: clean(x.big || d.big || '', 20), name: clean(x.name || d.name || x.id, 60), desc: clean(x.desc || d.desc || '', 200), uses: clean(x.uses || d.uses || '1 use', 20), on: ['checkout', 'eval', 'funded', 'failed', 'any', 'new'].includes(x.on) ? x.on : d.on || 'checkout', fx: x.fx && x.fx.t ? x.fx : d.fx || { t: 'coupon', pct: 5 }, active: x.active !== false, cost: num(x.cost, d.cost || 0) };
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
async function saveConfig(v, actorId) {
  const before = await config(true); const next = normalize(v);
  // a pack whose odds or price changed gets a new version; packs already bought keep the odds they were sold with
  next.packs.forEach((p) => { const b = before.packs.find((x) => x.id === p.id); if (b) p.ver = b.ver + (JSON.stringify(b.odds) !== JSON.stringify(p.odds) || b.price !== p.price ? 1 : 0); });
  next.packs.forEach((p) => { const s = p.odds.reduce((a, b) => a + b, 0); if (Math.abs(s - 100) > 0.01) bad(`${p.name}: the odds add up to ${round2(s)}%, not 100%`); });
  if (!next.packs.length) bad('Keep at least one pack');
  for (const p of next.packs) for (let i = 0; i < 6; i++) if (p.odds[i] > 0 && !next.cards.some((c) => c.active && c.r === RN[i])) bad(`${p.name} can draw ${RN[i]} cards, but no ${RN[i]} card is active`);
  await db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', [KEY, JSON.stringify(next)]);
  cache = null; await core.audit(actorId, 'packs.config', 'packs', {});
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
  if (delta < 0) { const u = await c.one('SELECT points FROM users WHERE id=$1 FOR UPDATE', [userId]); if (!u || u.points + delta < 0) bad(`You need ${fmt(-delta)} credits for this. You have ${fmt(u ? u.points : 0)}.`, 402); }
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
    const row = id ? await c.one("SELECT * FROM user_packs WHERE id=$1 AND user_id=$2 FOR UPDATE", [+id, user.id]) : await c.one("SELECT * FROM user_packs WHERE user_id=$1 AND status='unopened' ORDER BY id LIMIT 1 FOR UPDATE", [user.id]);
    if (!row) bad('Pack not found', 404); if (row.status !== 'unopened') bad('This pack has already been opened');
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
  await need();
  return db.tx(async (c) => {
    const uc = await c.one('SELECT * FROM user_cards WHERE id=$1 AND user_id=$2 FOR UPDATE', [+cardUid, user.id]);
    if (!uc) bad('Card not found', 404); if (uc.status !== 'ready') bad('This card has already been used');
    const cd = uc.data || {}; const fx = cd.fx || {}; const cat = await core.catalog();
    let usedOn = ''; let done = ''; let extra = {};
    if (cd.on === 'checkout') {
      const code = couponCode('CARD');
      const kind = fx.t === 'resetCoupon' ? 'reset_discount' : 'discount';
      await c.q("INSERT INTO coupons(code,user_id,pct,label,kind,source,expires_at) VALUES($1,$2,$3,$4,$5,'card', now() + interval '365 days')", [code, user.id, num(fx.pct, 5), 'Card: ' + cd.name, kind]);
      usedOn = kind === 'reset_discount' ? 'your next reset' : 'your next checkout'; done = kind === 'reset_discount' ? `${cd.name} comes off your next reset automatically.` : `${cd.name} comes off your next checkout automatically.`; extra = { code };
    } else if (cd.on === 'new') {
      const p = core.planDef(cat, fx.plan); const s = p && core.sizeDef(cat, fx.plan, fx.size);
      if (!p || !s || p.active === false) bad('That account is not on sale right now. Contact support and we will set it up for you.');
      const id = await core.createAccount(c, { userId: user.id, plan: fx.plan, size: Number(fx.size), platform: (body && body.platform && p.platforms.includes(body.platform)) ? body.platform : (p.defPlatform && p.platforms.includes(p.defPlatform) ? p.defPlatform : p.platforms[0]), addons: [] });
      await c.q("UPDATE accounts SET perks = perks || $2 WHERE id=$1", [id, JSON.stringify({ fromCard: cd.name })]);
      await core.notify(c, user.id, `Your account ${id} is ready`, `Opened free with your ${cd.name} card.`, 'account?acct=' + id);
      usedOn = id; done = `${id} is open on your dashboard.`; extra = { account: id };
    } else {
      const id = clean(body && body.account, 40); const a = await c.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE', [id, user.id]);
      if (!a) bad('Pick one of your accounts'); if (!eligible(cd.on, a)) bad('This card does not work on that account');
      const perks = Object.assign({}, a.perks || {}); const used = perks.cards || [];
      if (fx.t === 'minDays') perks.minDaysOff = (perks.minDaysOff || 0) + num(fx.n, 1);
      else if (fx.t === 'evalCons') { if (perks.evalCons) bad('Consistency is already off on this account'); perks.evalCons = true; }
      else if (fx.t === 'news') perks.newsUntil = new Date(Math.max(Date.now(), perks.newsUntil ? Date.parse(perks.newsUntil) : 0) + num(fx.days, 1) * 864e5).toISOString();
      else if (fx.t === 'idle') perks.idleDays = (perks.idleDays || 0) + num(fx.days, 30);
      else if (fx.t === 'payCons') { if (perks.payCons) bad('Your next payout already skips consistency'); perks.payCons = true; }
      else if (fx.t === 'split') { if (fx.to) { if (perks.splitTo >= fx.to) bad('This account already has that split'); perks.splitTo = num(fx.to, 100); } else perks.splitAdd = (perks.splitAdd || 0) + num(fx.add, 5); }
      else if (fx.t === 'balance') { await c.q('UPDATE accounts SET balance=balance+$2 WHERE id=$1', [a.id, num(fx.amt)]); }
      else if (fx.t === 'reset') { await core.resetAccount(c, a.id, user.id, 0); }
      else bad('This card cannot be used yet');
      used.push({ card: cd.id, name: cd.name, at: new Date().toISOString() }); perks.cards = used;
      await c.q('UPDATE accounts SET perks=$2 WHERE id=$1', [a.id, JSON.stringify(perks)]);
      usedOn = a.id; done = `${cd.name} is on ${a.id}.`;
    }
    await c.q("UPDATE user_cards SET status='used', used_on=$2, used_at=now() WHERE id=$1", [uc.id, usedOn]);
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
async function createCreditsOrder(user, body) {
  await need(); const cfg = await config(); const R = cfg.rules;
  let usd, cr, bonus = 0, label;
  if (body.custom != null && body.bundle == null) {
    if (!R.custom.on) bad('Pick one of the bundles');
    usd = round2(num(body.custom)); if (!(usd >= R.custom.min && usd <= R.custom.max)) bad(`Enter an amount from $${R.custom.min} to $${fmt(R.custom.max)}`);
    // a custom amount gets the bonus of the biggest bundle it reaches
    const tb = cfg.bundles.filter((x) => x.on && x.usd <= usd).sort((a, b) => b.usd - a.usd)[0]; bonus = tb ? tb.bonus : 0;
    cr = Math.round(usd * R.perDollar * (1 + bonus / 100)); label = `${fmt(cr)} Credits${bonus ? ` (includes ${bonus}% bonus)` : ''}`;
  } else {
    const b = cfg.bundles.filter((x) => x.on)[+body.bundle]; if (!b) bad('Pick a bundle');
    usd = b.usd; cr = b.cr; bonus = b.bonus; label = `${fmt(cr)} Credits${b.bonus ? ` (includes ${b.bonus}% bonus)` : ''}`;
  }
  if (R.dailyCap) { const today = (await db.one("SELECT COALESCE(sum(delta),0)::int n FROM points_log WHERE user_id=$1 AND kind='bought' AND created_at >= date_trunc('day', now())", [user.id])).n; if (today + cr > R.dailyCap) bad(`You can buy up to ${fmt(R.dailyCap)} credits a day.`); }
  const code = await core.ordCode();
  const o = await db.one(`INSERT INTO orders(code,user_id,kind,lines,items,subtotal,discount,total,meta) VALUES($1,$2,'credits',$3,'[]',$4,0,$4,$5) RETURNING *`,
    [code, user.id, JSON.stringify([{ label, amount: usd, kind: 'plan' }]), usd, JSON.stringify({ credits: cr, bonus })]);
  return { code: o.code, total: Number(o.total) };
}
// Called by fulfilOrder for kind 'credits'
async function fulfilCredits(c, o) {
  const cfg = await config(); let cr = Number(o.meta.credits) || 0;
  if (o.provider === 'confirmo' && cfg.rules.cryptoBonus) cr += Math.round(cr * cfg.rules.cryptoBonus / 100);
  await credit(c, o.user_id, cr, `Bought ${fmt(cr)} credits · ${o.code}`, 'bought', o.code);
  await c.q("UPDATE orders SET meta = meta || $2 WHERE id=$1", [o.id, JSON.stringify({ creditsAdded: cr })]);
  await core.notify(c, o.user_id, `${fmt(cr)} credits added`, 'Spend them on packs from the Packs page.', 'packs');
}
// Refunds: take back bought credits, remove unopened checkout packs and unused cards from them
async function onRefund(o) {
  return db.tx(async (c) => {
    const out = {};
    if (o.kind === 'credits') out.credits = await clawback(c, o.user_id, (o.meta && (o.meta.creditsAdded || o.meta.credits)) || 0, `Refund ${o.code}: credits taken back`, o.code);
    const g = o.meta && o.meta.packsGranted;
    if (g) {
      const ids = g.packs || [];
      if (ids.length) {
        const r1 = await c.all("UPDATE user_packs SET status='revoked', note='Order refunded' WHERE id = ANY($1) AND status='unopened' RETURNING id", [ids]); out.packs = r1.length;
        const r2 = await c.all("UPDATE user_cards SET status='revoked', used_on='Order refunded' WHERE pack_id = ANY($1) AND status='ready' RETURNING id", [ids]); out.cards = r2.length;
      }
      if (g.credits) out.rewardCredits = await clawback(c, o.user_id, g.credits, `Refund ${o.code}: reward credits taken back`, o.code);
    }
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
    db.all("SELECT id, card, rarity, data, status, used_on, used_at, created_at FROM user_cards WHERE user_id=$1 AND status<>'revoked' ORDER BY id DESC", [userId]),
    db.all("SELECT label, delta, kind, created_at FROM points_log WHERE user_id=$1 ORDER BY id DESC LIMIT 60", [userId]),
    db.all("SELECT id, plan, size, kind, phase, balance, perks FROM accounts WHERE user_id=$1 AND phase NOT IN ('closed') ORDER BY created_at DESC", [userId])
  ]);
  return {
    bal: u ? u.points : 0, perDollar: cfg.rules.perDollar, cryptoBonus: cfg.rules.cryptoBonus,
    packs: cfg.packs.filter((p) => p.on).map((p) => ({ id: p.id, name: p.name, short: p.short, price: p.price, tag: p.tag, odds: p.odds, g: p.g })),
    cards: cfg.cards.filter((c) => c.active).map((c) => ({ id: c.id, r: c.r, kind: c.kind, big: c.big, name: c.name, desc: c.desc, uses: c.uses, on: c.on })),
    bundles: cfg.bundles.filter((b) => b.on).map((b) => ({ usd: b.usd, cr: b.cr, bonus: b.bonus, badge: b.badge })),
    waiting: packs.map((p) => ({ uid: p.id, id: p.pack, name: p.name })),
    own: cards.map((c) => Object.assign(pub(Object.assign({ uid: c.id }, c.data || {}, { id: c.card, r: c.rarity })), { st: c.status, usedOn: c.used_on || '', usedAt: c.used_at })),
    hist: log.map((l) => ({ d: new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }), what: l.label, delta: l.delta, kind: l.kind })),
    accts: accts.map((a) => ({ id: a.id, det: `${ACC_LABEL(a)} · ${a.phase === 'breached' ? 'failed' : a.phase === 'active' ? '$' + fmt(Math.round(a.balance)) : a.phase}`, t: ['eval', 'failed', 'funded', 'any'].filter((on) => eligible(on, a)) }))
  };
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
  const [opened, perPack, drawn, used, bought, outstanding, act, daily, ladderOrders] = await Promise.all([
    db.one("SELECT count(*)::int n FROM user_packs WHERE status='opened' AND opened_at > now() - interval '30 days'"),
    db.all("SELECT pack, count(*) FILTER (WHERE source='bought')::int sold, count(*) FILTER (WHERE source='checkout')::int free, count(*) FILTER (WHERE status='opened')::int opened, COALESCE(sum(price),0)::int credits FROM user_packs WHERE created_at > now() - interval '30 days' GROUP BY pack"),
    db.all("SELECT card, rarity, count(*)::int n FROM user_cards WHERE created_at > now() - interval '30 days' GROUP BY card, rarity"),
    db.all("SELECT card, count(*)::int n FROM user_cards WHERE status='used' AND used_at > now() - interval '30 days' GROUP BY card"),
    db.one("SELECT COALESCE(sum(total),0)::numeric usd, count(*)::int n FROM orders WHERE kind='credits' AND status='paid' AND paid_at > now() - interval '30 days'"),
    db.one("SELECT COALESCE(sum(points),0)::bigint n FROM users WHERE points > 0"),
    db.all("SELECT l.id, l.created_at, l.label, l.delta, l.kind, u.first, u.last, u.tid, a.first AS by FROM points_log l JOIN users u ON u.id=l.user_id LEFT JOIN users a ON a.id=l.actor_id WHERE l.kind IN ('bought','spent','grant','reward','refund','card') ORDER BY l.id DESC LIMIT 200"),
    db.all("SELECT to_char(date_trunc('day', opened_at AT TIME ZONE 'America/New_York'), 'YYYY-MM-DD') d, count(*) FILTER (WHERE source='bought')::int paid, count(*) FILTER (WHERE source<>'bought')::int free FROM user_packs WHERE status='opened' AND opened_at > now() - interval '30 days' GROUP BY 1 ORDER BY 1"),
    db.all("SELECT (meta->'packsGranted'->>'label') label, count(*)::int n FROM orders WHERE meta ? 'packsGranted' AND paid_at > now() - interval '30 days' GROUP BY 1")
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
    stats: { opened30: opened.n, creditsSold30: Number(bought.usd), creditsOrders30: bought.n, outstanding: Number(outstanding.n), drawn30: totalDrawn },
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
  const u = await db.one('SELECT id, tid, first, last, email, points FROM users WHERE id=$1', [+uid]); if (!u) bad('Trader not found', 404);
  const [packs, cards, spent] = await Promise.all([
    db.all('SELECT id, pack, name, source, status, created_at, opened_at FROM user_packs WHERE user_id=$1 ORDER BY id DESC LIMIT 100', [u.id]),
    db.all('SELECT id, card, rarity, data, status, used_on, created_at FROM user_cards WHERE user_id=$1 ORDER BY id DESC LIMIT 200', [u.id]),
    db.one("SELECT COALESCE(-sum(delta),0)::int n FROM points_log WHERE user_id=$1 AND kind='spent'", [u.id])
  ]);
  return { u, packs, cards: cards.map((c) => ({ id: c.id, card: c.card, name: (c.data || {}).name || c.card, r: c.rarity, status: c.status, usedOn: c.used_on, at: c.created_at })), spent: spent.n };
}
async function grant(actor, uid, body) {
  const cfg = await config(); const reason = clean(body.reason, 160); if (!reason) bad('Add a reason');
  const u = await db.one('SELECT id FROM users WHERE id=$1', [+uid]); if (!u) bad('Trader not found', 404);
  return db.tx(async (c) => {
    if (body.type === 'credits') {
      const n = Math.round(num(body.credits)); if (!n) bad('Enter the credits');
      if (Math.abs(n) > 100000 && actor.role !== 'admin') bad('Grants over 100,000 credits need an admin', 403);
      if (n > 0) await credit(c, u.id, n, `Granted by support: ${reason}`, 'grant', '', actor.id); else await credit(c, u.id, n, `Removed by support: ${reason}`, 'grant', '', actor.id);
      await core.notify(c, u.id, n > 0 ? `${fmt(n)} credits added` : `${fmt(-n)} credits removed`, reason, 'packs');
    } else if (body.type === 'pack') {
      const p = cfg.packs.find((x) => x.id === body.pack); if (!p) bad('Pick a pack'); const qty = Math.max(1, Math.min(10, Math.round(num(body.qty, 1))));
      for (let i = 0; i < qty; i++) await c.q("INSERT INTO user_packs(user_id,pack,name,odds,source,note) VALUES($1,$2,$3,$4,'grant',$5)", [u.id, p.id, p.name, JSON.stringify(p.odds), reason]);
      await c.q('INSERT INTO points_log(user_id,label,delta,kind,actor_id) VALUES($1,$2,0,$3,$4)', [u.id, `Granted ${qty} ${p.short} Pack${qty > 1 ? 's' : ''}: ${reason}`, 'grant', actor.id]);
      await core.notify(c, u.id, `${qty === 1 ? 'A' : qty} free ${p.short} Pack${qty > 1 ? 's' : ''} for you`, reason + ' Open it on the Packs page.', 'packs');
    } else if (body.type === 'card') {
      const cd = cfg.cards.find((x) => x.id === body.card); if (!cd) bad('Pick a card');
      await c.q('INSERT INTO user_cards(user_id,card,rarity,data) VALUES($1,$2,$3,$4)', [u.id, cd.id, cd.r, JSON.stringify(cd)]);
      await c.q('INSERT INTO points_log(user_id,label,delta,kind,actor_id) VALUES($1,$2,0,$3,$4)', [u.id, `Granted card ${cd.name}: ${reason}`, 'grant', actor.id]);
      await core.notify(c, u.id, `You got a ${cd.name} card`, reason + ' It is in your collection.', 'packs');
    } else bad('Pick what to grant');
    await core.audit(actor.id, 'packs.grant', String(u.id), { type: body.type, reason });
    return { ok: true };
  });
}
async function revokeCard(actor, cardId, reason) {
  const r = await db.one("UPDATE user_cards SET status='revoked', used_on=$2 WHERE id=$1 AND status='ready' RETURNING user_id, data", [+cardId, 'Removed: ' + (clean(reason, 120) || 'by support')]);
  if (!r) bad('Only unused cards can be removed');
  await db.q('INSERT INTO points_log(user_id,label,delta,kind,actor_id) VALUES($1,$2,0,$3,$4)', [r.user_id, `Card removed: ${(r.data || {}).name || ''}`, 'grant', actor.id]);
  await core.audit(actor.id, 'packs.revoke', String(cardId), {}); return { ok: true };
}

module.exports = { RN, DEF, config, saveConfig, normalize, enabled, setEnabled, credit, buy, openOwned, useCard, ladderFor, grantForOrder, createCreditsOrder, fulfilCredits, onRefund, traderData, publicLadder, publicCredits, adminData, findTrader, traderAdmin, grant, revokeCard, eligible, drawOne };
