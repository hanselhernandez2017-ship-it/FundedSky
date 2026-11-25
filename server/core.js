// Core services: catalog, pricing, orders, accounts, payouts, notifications, points.
const db = require('./db');
const R = require('./rules');
const { round2, bad, money, tradeDate } = require('./util');

let CAT = null, CAT_AT = 0;
async function catalog(force) {
  if (!force && CAT && Date.now() - CAT_AT < 15000) return CAT;
  const row = await db.one('SELECT data FROM catalog WHERE id=1');
  CAT = row.data; CAT_AT = Date.now(); return CAT;
}
async function saveCatalog(data, by) {
  await db.q('UPDATE catalog SET data=$1, updated_by=$2, updated_at=now() WHERE id=1', [data, by || null]);
  CAT = data; CAT_AT = Date.now();
}
const planDef = (cat, id) => cat.plans.find((p) => p.id === id);
const sizeDef = (cat, pid, size) => { const p = planDef(cat, pid); return p && p.sizes.find((s) => s.size === Number(size)); };
const kLabel = (s) => '$' + s / 1000 + 'K';
const M = (...a) => require('./mail').t(...a);
const etTime = (d) => new Date(d || Date.now()).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET';
const pName = async (id) => ((planDef(await catalog(), id) || {}).name || id);

function promoFor(cat, code, planId, now = new Date()) {
  if (!code) return null;
  const p = (cat.promos || []).find((x) => x.code.toUpperCase() === String(code).toUpperCase() && x.active);
  if (!p) return null;
  const d = now.toISOString().slice(0, 10);
  if ((p.starts && d < p.starts) || (p.ends && d > p.ends)) return null;
  if (planId && p.plans && p.plans.length && !p.plans.includes(planId)) return { ...p, applies: false };
  return { ...p, applies: true };
}

async function referralSettings() { const v = ((await db.one("SELECT v FROM kv WHERE k='store.rewards.settings'")) || {}).v || {}; const pctOf = (x) => { const m = String(x || '').match(/(\d+(?:\.\d+)?)\s*%/); return m ? Number(m[1]) : 10; }; return { on: v.refOn !== false, pct: v.refFriend != null ? pctOf(v.refFriend) : 10, pts: v.refPts != null ? Number(v.refPts) : 1000 }; }
// Effective price of a size right now: a scheduled price switches on by itself at its date
function priceOf(s, now = new Date()) { const sc = s && s.sched; if (sc && sc.price && sc.at && new Date(sc.at) <= now) return Number(sc.price); return Number(s.price); }
// A promotion in one shape (catalog codes may be the simple { code, pct } kind or the full kind from the back office)
function normPromo(p) {
  const vtype = p.vtype || 'percent'; const value = p.value != null ? Number(p.value) : Number(p.pct || 0);
  return { code: p.code ? String(p.code).toUpperCase() : '', name: p.name || p.code || 'Offer', vtype, value, freeAddon: p.freeAddon || '', plans: p.plans || [], sizes: (p.sizes || []).map(Number),
    lines: Object.assign({ base: true, addon: false, reset: false }, p.lines || {}), withBundles: !!p.withBundles, first: !!p.first, minCart: Number(p.minCart || 0),
    countries: String(p.countries || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean), total: Number(p.total || 0), maxOff: Number(p.maxOff || 0),
    perTrader: p.perTrader != null ? Number(p.perTrader) : (p.once ? 1 : 0), exclusive: !!p.exclusive, priority: Number(p.priority || 10), active: p.active !== false, starts: p.starts || p.start || '', ends: p.ends || p.end || '' };
}
const liveOn = (p, d) => p.active && !(p.starts && d < p.starts) && !(p.ends && d > p.ends);
// Price a cart. items: [{plan,size,platform,addons:[...],qty}]. Same rules as the back office Live Preview.
async function priceCart(items, { promo, coupon, userId, country, kind } = {}) {
  const cat = await catalog(); const today = new Date().toISOString().slice(0, 10);
  if (!Array.isArray(items) || !items.length) bad('Your cart is empty');
  if (items.length > 10) bad('Too many accounts in one order');
  const comps = []; const accts = []; const norm = []; let count = 0;
  items.forEach((it, li) => {
    const p = planDef(cat, it.plan); if (!p || !p.active) bad('Unknown plan');
    const s = sizeDef(cat, it.plan, it.size); if (!s) bad('That size is not offered on the ' + p.name);
    const qty = Math.max(1, Math.min(5, parseInt(it.qty, 10) || 1));
    if (it.platform && !p.platforms.includes(it.platform)) bad(`${it.platform} is not offered on the ${p.name}`);
    const platform = it.platform || p.defPlatform || p.platforms[0];
    const addons = (it.addons || []).filter((x) => p.addons.includes(x) && cat.addons[x]);
    const unit = priceOf(s); count += qty;
    comps.push({ li, type: 'base', plan: p.id, size: s.size, label: `${p.short} ${kLabel(s.size)}${qty > 1 ? ' × ' + qty : ''}`, amt: unit * qty, rem: unit * qty, floor: Number(s.floor || 0) * qty });
    for (let i = 0; i < qty; i++) accts.push({ li, plan: p.id, size: s.size, price: unit });
    for (const ad of addons) { const a = cat.addons[ad]; const amt = round2((a.flat != null && Number(a.flat) > 0 ? Number(a.flat) : Math.round(unit * a.pct / 100)) * qty);
      comps.push({ li, type: 'addon', aid: ad, plan: p.id, size: s.size, label: `${a.name}${qty > 1 ? ' × ' + qty : ''}`, amt, rem: amt, floor: 0, discountable: a.discountable !== false }); }
    norm.push({ plan: p.id, size: s.size, platform, addons, qty, unit });
  });
  const sub = round2(comps.reduce((n, c) => n + c.amt, 0));
  const u = userId ? await db.one("SELECT referred_by, country, (SELECT count(*)::int FROM orders WHERE user_id=$1 AND status='paid') n FROM users WHERE id=$1", [userId]) : null;
  const firstBuy = !u || u.n === 0; const ctry = String(country || (u && u.country) || '').toLowerCase();
  // ---- bundles: the single best one wins
  const elig = (pid, bid) => { const pl = planDef(cat, pid); return !(pl && pl.bundleOff && pl.bundleOff[bid]); };
  const bundleDefs = (cat.bundles || []).length ? [{ id: 'tier', type: 'tier', name: (cat.bundleName || 'Multi-Account Savings'), samePlan: !!cat.bundleSamePlan, tiers: cat.bundles.map((b) => ({ min: b.min, pct: b.pct, buy: b.buy })) }] : [];
  (cat.bundleRules || []).forEach((b) => bundleDefs.push(b));
  const bestBundle = () => { let best = null;
    bundleDefs.forEach((b) => { let off = 0; let hit = [];
      if (b.type === 'tier') { const by = {}; accts.forEach((a) => { if (elig(a.plan, b.id)) (by[b.samePlan ? a.plan : 'all'] = by[b.samePlan ? a.plan : 'all'] || []).push(a); });
        Object.values(by).forEach((arr) => { const t = b.tiers.filter((x) => arr.length >= x.min).sort((x, y) => y.min - x.min)[0]; if (t) { off += arr.reduce((n, a) => n + a.price, 0) * t.pct / 100; hit.push(...new Set(arr.map((a) => a.li))); b._label = t.buy ? `${t.buy}: ${t.pct}% off` : `${b.name}: ${t.pct}% off`; } }); }
      else if (b.type === 'mix') { const arr = accts.filter((a) => (b.mixPlans || []).includes(a.plan) && elig(a.plan, b.id)); if (arr.length >= b.min) { off = arr.reduce((n, a) => n + a.price, 0) * b.pct / 100; hit = [...new Set(arr.map((a) => a.li))]; b._label = `${b.name}: ${b.pct}% off`; } }
      else if (b.type === 'fixed') { let ok = true; let val = 0; const used = []; (b.items || []).forEach((it) => { const arr = accts.filter((a) => a.plan === it.plan && a.size === Number(it.size) && elig(a.plan, b.id)); if (arr.length < it.qty) ok = false; else { val += it.qty * arr[0].price; used.push(...arr.slice(0, it.qty).map((a) => a.li)); } }); if (ok && (b.items || []).length) { off = Math.max(0, val - Number(b.price)); hit = [...new Set(used)]; b._label = `${b.name}: ${money(b.price)}`; } }
      off = round2(off); if (off > 0 && (!best || off > best.off)) best = { b, off, hit }; });
    return best; };
  // ---- promotions
  const applyPromo = (C, pr) => { let tot = 0;
    C.forEach((c) => { if (pr.plans.length && !pr.plans.includes(c.plan)) return; if (pr.sizes.length && !pr.sizes.includes(c.size)) return; if (c.bundled && !pr.withBundles) return;
      let take = 0;
      if (pr.vtype === 'free') { if (c.type === 'addon' && c.aid === pr.freeAddon) take = c.rem; }
      else { if (c.type === 'base' && !pr.lines.base) return; if (c.type === 'addon' && (!pr.lines.addon || !c.discountable)) return;
        const pctV = pr.vtype === 'percent' ? Math.min(pr.value, pr.code && !pr.auto ? (cat.maxPromoPct || 100) : 100) : 0;
        take = pr.vtype === 'percent' ? c.rem * pctV / 100 : pr.vtype === 'fixed' ? Math.min(c.rem, pr.value) : 0; }
      take = Math.min(take, Math.max(0, c.rem - c.floor)); if (pr.maxOff) take = Math.min(take, pr.maxOff - tot);
      take = Math.max(0, round2(take)); c.rem = round2(c.rem - take); tot += take; });
    return round2(tot); };
  const autos = (cat.autos || []).map((p) => Object.assign(normPromo(p), { auto: true })).filter((p) => liveOn(p, today) && (!p.first || firstBuy) && (!p.minCart || sub >= p.minCart) && (!p.countries.length || p.countries.includes(ctry))).sort((a, b) => a.priority - b.priority);
  // the code a trader typed: a catalog promotion, or an affiliate's code
  const AFF = require('./affiliates'); let codeP = null; let affRow = null; let promoRow = null;
  if (promo) {
    promoRow = (cat.promos || []).find((x) => String(x.code).toUpperCase() === String(promo).toUpperCase());
    if (promoRow) { const pr = normPromo(promoRow);
      if (!pr.active) bad('That promo code is not valid');
      if (pr.starts && today < pr.starts) bad('That code is not active yet');
      if (pr.ends && today > pr.ends) bad('That code has expired');
      if (pr.first && !firstBuy) bad('That code is for your first purchase only');
      if (pr.minCart && sub < pr.minCart) bad(`That code needs a cart of at least ${money(pr.minCart)}`);
      if (pr.countries.length && ctry && !pr.countries.includes(ctry)) bad('That code is not available in your country');
      if (pr.total) { const used = (await db.one("SELECT count(*)::int n FROM orders WHERE upper(promo)=$1 AND status='paid'", [pr.code])).n; if (used >= pr.total) bad('That code has been fully used'); }
      if (pr.perTrader && userId) { const mine = (await db.one("SELECT count(*)::int n FROM orders WHERE user_id=$1 AND upper(promo)=$2 AND status='paid'", [userId, pr.code])).n; if (mine >= pr.perTrader) bad(pr.perTrader === 1 ? 'You have already used this code' : 'You have used this code the maximum number of times'); }
      codeP = pr;
    } else { affRow = await AFF.byCode(promo); if (!affRow) bad('That promo code is not valid'); if (userId && affRow.user === userId) bad('You cannot use your own affiliate code');
      const t = await AFF.tierOf(affRow); if (!t.disc) bad('That code has no discount right now'); codeP = Object.assign(normPromo({ code: affRow.code, pct: t.disc, name: 'Code ' + affRow.code }), { aff: affRow.user }); }
  }
  // no code: a referred trader's first order gets the referral discount
  let refP = null; const RS = await referralSettings();
  if (!codeP && u && u.referred_by && u.n === 0) { const af = await AFF.byUser(u.referred_by);
    if (af) { const t = await AFF.tierOf(af); if (t.disc) refP = Object.assign(normPromo({ code: af.code, pct: t.disc }), { label: `Code ${af.code}: ${t.disc}% off`, ref: true }); }
    else if (RS.on && RS.pct) refP = Object.assign(normPromo({ code: '', pct: RS.pct }), { label: `Friend referral: ${RS.pct}% off your first order`, ref: true }); }
  const one = codeP || refP;
  // run the cart with or without the bundle and keep the cheaper result for the trader
  const run = (useBundle) => { const C = comps.map((c) => Object.assign({}, c)); const sav = []; let bun = null;
    if (useBundle) { bun = bestBundle(); if (bun) { let left = bun.off; C.filter((c) => c.type === 'base' && bun.hit.includes(c.li)).forEach((c) => { const take = Math.min(left, Math.max(0, c.rem - c.floor)); c.rem = round2(c.rem - take); left = round2(left - take); c.bundled = true; }); sav.push({ label: bun.b._label, amount: round2(bun.off - left), type: 'bundle' }); } }
    let excl = false; autos.forEach((pr) => { const got = applyPromo(C, pr); if (got) { sav.push({ label: `${pr.name}`, amount: got, type: 'auto' }); if (pr.exclusive) excl = true; } });
    let codeGot = 0; let why = '';
    if (one) { if (excl && codeP) why = 'That code can\'t be combined with the current sale'; else { codeGot = applyPromo(C, one); if (codeGot) sav.push({ label: one.label || (one.aff ? `Code ${one.code}: ${one.value}% off` : `${one.name}${one.vtype === 'percent' ? `: ${Math.min(one.value, cat.maxPromoPct || 100)}% off` : one.vtype === 'fixed' ? `: ${money(one.value)} off` : ''}`), amount: codeGot, type: one.ref ? 'referral' : one.aff ? 'affiliate' : 'promo' }); } }
    return { C, sav, bun, codeGot, why, total: round2(C.reduce((n, c) => n + c.rem, 0)) }; };
  let R = run(true);
  if (one && !R.codeGot) { const R2 = run(false); if (R2.codeGot && R2.total < R.total) R = R2; }
  if (codeP && !R.codeGot) bad(R.why || 'That code does not apply to the plans in your cart');
  const lines = comps.map((c) => ({ label: c.label, amount: c.amt, kind: c.type === 'base' ? 'plan' : 'addon' })).concat(R.sav.map((x) => ({ label: x.label, amount: -x.amount, kind: 'discount' })));
  let discount = round2(R.sav.reduce((n, x) => n + x.amount, 0)); let applied = R.sav.length ? { type: R.sav[R.sav.length - 1].type, label: R.sav.map((x) => x.label).join(' + ') } : null;
  if (codeP && codeP.aff) applied = Object.assign(applied || {}, { type: 'affiliate', code: affRow.code, affiliate: affRow.user });
  // reward coupon from points
  if (coupon) {
    const c = await db.one("SELECT * FROM coupons WHERE code=$1 AND user_id=$2 AND used=false", [coupon, userId || 0]);
    if (!c) bad('That reward code is not valid');
    if (c.expires_at ? new Date(c.expires_at) < new Date() : new Date(c.created_at) < new Date(Date.now() - 90 * 86400000)) bad(c.expires_at ? 'That code has expired' : 'That reward code has expired (codes last 90 days)');
    const left = round2(sub - discount);
    if (c.kind === 'discount') { const d = round2(left * Number(c.pct) / 100); discount += d; lines.push({ label: c.label, amount: -d, kind: 'coupon' }); }
    else if (c.kind === 'free_eval') { const first = norm[0]; if (first.size !== 25000) bad('This reward is for a $25K account'); const d = Math.min(left, first.unit); discount += d; lines.push({ label: c.label, amount: -d, kind: 'coupon' }); }
    else bad('This reward can\'t be used at checkout');
    applied = { ...(applied || {}), coupon: c.code };
  }
  const total = Math.max(0, round2(sub - discount));
  return { items: norm, lines, subtotal: sub, discount: round2(discount), total, applied, promo: codeP && !codeP.aff ? codeP.code : affRow ? String(affRow.code).toUpperCase() : null, affiliate: affRow ? affRow.user : null, coupon: coupon || null };
}

const ordCode = async (c) => 'FS-ORD-' + (await (c || db).one("SELECT nextval('seq_order') AS n")).n;
async function newAccountId(c, size) {
  for (;;) { const id = `FS-${size / 1000}K-${String(1000 + Math.floor(Math.random() * 9000))}`; if (!(await c.one('SELECT 1 FROM accounts WHERE id=$1', [id]))) return id; }
}
function simTraits(kind) {
  // Trader "skill" for the simulated feed. Tuned so roughly 15% of evaluations pass.
  const g = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  // Evaluations: about 15% pass. Funded: a fresh draw, about 30% reach a payout (published industry rates).
  const sk = kind === 'funded' ? -0.06 + g() * 0.2 : -0.14 + g() * 0.18;
  return { skill: round2(sk), vol: round2(0.75 + Math.random() * 0.5), activity: round2(0.6 + Math.random() * 0.35), seed: Math.floor(Math.random() * 1e9) };
}
async function createAccount(c, { userId, orderId, plan, size, platform, addons, kind, parentId, rs }) {
  const cat = await catalog();
  const snap = rs || R.snapshot(cat, plan, size);
  const k = kind || (plan === 'instant' ? 'funded' : 'evaluation');
  const id = await newAccountId(c, size);
  const st = R.initialState(cat, { plan, size, kind: k, rs: snap });
  const freeResets = (addons || []).includes('reset') ? 1 : 0;
  await c.q(`INSERT INTO accounts(id,user_id,order_id,parent_id,plan,size,platform,kind,phase,start_bal,balance,peak_eod,floor,cycle_profit_start,addons,free_resets,today_date,sim,funded_at,rs)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,'active',$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
  [id, userId, orderId || null, parentId || null, plan, size, platform || 'Tradovate', k, st.start_bal, st.balance, st.peak_eod, st.floor, st.cycle_profit_start, JSON.stringify(addons || []), freeResets, tradeDate(), simTraits(k), k === 'funded' ? new Date() : null, snap]);
  return id;
}

async function notify(c, userId, title, body, go = 'accounts') {
  await (c || db).q('INSERT INTO notifications(user_id,title,body,go) VALUES($1,$2,$3,$4)', [userId, title, body, go]);
}
async function points(c, userId, delta, label) {
  if (!delta) return;
  await (c || db).q('INSERT INTO points_log(user_id,label,delta) VALUES($1,$2,$3)', [userId, label, delta]);
  await (c || db).q('UPDATE users SET points=points+$1 WHERE id=$2', [delta, userId]);
}
async function audit(actorId, action, target, meta) {
  await db.q('INSERT INTO audit(actor_id,action,target,meta) VALUES($1,$2,$3,$4)', [actorId || null, action, target || '', meta || {}]);
}

// Fulfil a paid order (idempotent)
async function fulfilOrder(orderId) {
  return db.tx(async (c) => {
    const o = await c.one('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [orderId]);
    if (!o || o.meta.fulfilled) return o;
    const cat = await catalog(); const made = [];
    if (o.kind === 'evaluation' || o.kind === 'instant' || o.kind === 'mixed') {
      for (const it of o.items) for (let i = 0; i < it.qty; i++) {
        made.push(await createAccount(c, { userId: o.user_id, orderId: o.id, plan: it.plan, size: it.size, platform: it.platform, addons: it.addons }));
      }
      for (const id of made) await notify(c, o.user_id, `Your account ${id} is ready`, 'Log in to your platform and place your first trade. Your rules are on the account page.', 'account?acct=' + id);
      for (const id of made) { const ac = await c.one('SELECT plan, size, platform FROM accounts WHERE id=$1', [id]); M('ready', o.user_id, { account: id, plan: await pName(ac.plan), size: kLabel(ac.size), platform: ac.platform, login: id, server: 'Funded Sky Simulated Feed', url: require('./auth').BASE() + '/app#account?acct=' + id }); }
    } else if (o.kind === 'reset') {
      await resetAccount(c, o.meta.account, o.user_id, o.total);
      made.push(o.meta.account);
    } else if (o.kind === 'activation') {
      made.push(await activateFunded(c, o.meta.account, o.user_id, o.id));
    }
    if (o.coupon || (o.meta && o.meta.coupon)) await c.q('UPDATE coupons SET used=true WHERE code=$1', [o.meta.coupon || o.coupon]);
    const pts = Math.floor(Number(o.total));
    await points(c, o.user_id, pts, o.kind === 'reset' ? 'Reset ' + o.meta.account : o.kind === 'activation' ? 'Activation fee' : 'Bought ' + o.items.map((x) => kLabel(x.size)).join(', ') + ' account' + (made.length > 1 ? 's' : ''));
    // referral reward on first purchase
    const u = await c.one('SELECT referred_by FROM users WHERE id=$1', [o.user_id]);
    if (u.referred_by) {
      const af = await require('./affiliates').byUser(u.referred_by);
      if (af) { // affiliates earn cash commission on every paid order from people they referred
        const t = await require('./affiliates').tierOf(af); const amt = round2(Number(o.total) * t.rate / 100);
        if (amt > 0) { await notify(c, u.referred_by, `You earned ${money(amt)} commission`, `${t.rate}% of order ${o.code}. It's paid after the 30-day refund window.`, 'affiliates'); M('commission', u.referred_by, { amount: money(amt), order: o.code, order_total: money(o.total), code: af.code, rate: t.rate + '%', url: require('./auth').BASE() + '/app#affiliates' }); }
      } else if (o.kind !== 'reset') {
        const RS = await referralSettings();
        const prev = await c.one("SELECT count(*)::int n FROM orders WHERE user_id=$1 AND status='paid' AND id<>$2", [o.user_id, o.id]);
        if (prev.n === 0 && RS.on && RS.pts > 0) { await points(c, u.referred_by, RS.pts, 'Friend bought an account'); await notify(c, u.referred_by, 'A friend you referred bought an account', `You earned ${RS.pts.toLocaleString('en-US')} points.`, 'affiliates'); }
      }
    }
    await c.q("UPDATE orders SET meta = meta || $2 WHERE id=$1", [o.id, JSON.stringify({ fulfilled: true, accounts: made })]);
    return { ...o, accounts: made };
  });
}

async function resetAccount(c, accountId, userId, paid = 0) {
  const a = await c.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE', [accountId, userId]);
  if (!a) bad('Account not found', 404);
  if (a.kind !== 'evaluation') bad('Only evaluations can be reset');
  const cat = await catalog(); const st = R.initialState(cat, a);
  await c.q(`UPDATE accounts SET phase='active', balance=$2, peak_eod=$3, floor=$4, today_pnl=0, halted_today=false, days_traded=0, best_day=0, breach_reason=NULL, breached_at=NULL, reset_count=reset_count+1, today_date=$5, steps='{}' WHERE id=$1`,
    [a.id, st.balance, st.peak_eod, st.floor, tradeDate()]);
  await c.q('DELETE FROM days WHERE account_id=$1', [a.id]);
  await c.q("UPDATE trades SET note='before reset' WHERE account_id=$1 AND note=''", [a.id]);
  await c.q('DELETE FROM trades WHERE account_id=$1', [a.id]);
  await notify(c, userId, `${a.id} has been reset`, 'Fresh balance, same rules. Good luck.', 'account?acct=' + a.id);
  M('resetdone', userId, { account: a.id, plan: await pName(a.plan), size: kLabel(a.size), platform: a.platform, balance: money(st.balance), paid: Number(paid) > 0 ? money(paid) : 'Free', url: require('./auth').BASE() + '/app#account?acct=' + a.id });
}

// Passed evaluation -> funded account (Prime after agreement; Essential after activation fee)
async function activateFunded(c, accountId, userId, orderId) {
  const a = await c.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE', [accountId, userId]);
  if (!a) bad('Account not found', 404);
  if (a.phase !== 'passed') bad('This account has not passed yet');
  const existing = await c.one('SELECT id FROM accounts WHERE parent_id=$1', [a.id]);
  if (existing) return existing.id;
  const id = await createAccount(c, { userId, orderId, plan: a.plan, size: a.size, platform: a.platform, addons: (a.addons || []).filter((x) => x === 'daily'), kind: 'funded', parentId: a.id, rs: a.rs || undefined });
  const steps = { ...(a.steps || {}), funded: new Date().toISOString(), ...(orderId ? { activation: new Date().toISOString() } : {}) };
  await c.q("UPDATE accounts SET phase='closed', closed_at=now(), steps=$2 WHERE id=$1", [a.id, steps]);
  await c.q('UPDATE accounts SET steps=$2 WHERE id=$1', [id, steps]);
  M('funded', userId, { account: id, plan: await pName(a.plan), size: kLabel(a.size), platform: a.platform, login: id, split: (R.rulesFor(await catalog(), a).split || 90) + '%', url: require('./auth').BASE() + '/app#account?acct=' + id });
  await notify(c, userId, `You're funded: ${id}`, `Your ${kLabel(a.size)} funded account is live. Payouts start after ${(await catalog()).fundedCommon.winDays} winning days.`, 'account?acct=' + id);
  return id;
}

// "Your funded agreement is ready": once the evaluation is passed and identity is verified
async function agreementReady(c, a) {
  const cat = await catalog(); const r = R.rulesFor(cat, Object.assign({}, a, { kind: 'funded', rs: null, payout_count: 0 }));
  M('agreement', a.user_id, { account: a.id, split: (r.split || 90) + '%', payout_rule: `${r.winDays || 5} winning days of $${r.winDayMin || 100}+ for each payout`, url: require('./auth').BASE() + '/app#account?acct=' + a.id });
}
async function signAgreement(userId, accountId) {
  return db.tx(async (c) => {
    const a = await c.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE', [accountId, userId]);
    if (!a || a.phase !== 'passed') bad('This account is not waiting for an agreement');
    const steps = { ...(a.steps || {}), agreement: new Date().toISOString() };
    await c.q('UPDATE accounts SET steps=$2 WHERE id=$1', [a.id, steps]);
    await c.q("UPDATE users SET agreements = agreements || $2 WHERE id=$1", [userId, JSON.stringify({ funded: new Date().toISOString() })]);
    const cat = await catalog(); const s = sizeDef(cat, a.plan, a.size);
    if (!s.activation) { const id = await activateFunded(c, a.id, userId, null); return { funded: id }; }
    if (!(a.steps && a.steps.agreement)) M('actfee', userId, { account: a.id, plan: await pName(a.plan), size: kLabel(a.size), fee: money(s.activation), url: require('./auth').BASE() + '/app#account?acct=' + a.id });
    return { activation: s.activation };
  });
}

async function requestPayout(userId, accountId, amount, methodId) {
  return db.tx(async (c) => {
    const cat = await catalog();
    const a = await c.one('SELECT * FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE', [accountId, userId]);
    if (!a) bad('Account not found', 404);
    const pending = await c.one("SELECT 1 FROM payouts WHERE account_id=$1 AND status IN ('requested','approved')", [a.id]);
    const qd = R.payoutQuote(cat, a, { pending: !!pending });
    if (!qd.ok) bad(qd.reasons[0]);
    const net = Math.floor(Number(amount) || qd.max);
    if (net < qd.payoutMin) bad(`The minimum payout is $${qd.payoutMin}`);
    if (net > qd.max) bad(`The most you can request right now is ${money(qd.max)}`);
    const m = await c.one('SELECT * FROM payout_methods WHERE id=$1 AND user_id=$2', [methodId, userId]);
    if (!m) bad('Add a payout method first');
    if (new Date(m.unlock_at) > new Date()) bad('This payout method is still in its 48-hour safety hold');
    if (/usdc/i.test(m.rail) && (((await c.one("SELECT v FROM kv WHERE k='settings.flags'")) || {}).v || {}).cryptoPayouts === false) bad('USDC payouts are switched off right now. Pick another payout method.');
    const gross = round2(net / (qd.split / 100));
    const code = 'PO-' + (await c.one("SELECT nextval('seq_payout') n")).n;
    await c.q(`INSERT INTO payouts(code,account_id,user_id,number,gross,split,amount,method,rail) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [code, a.id, userId, qd.number, gross, qd.split, net, m.label, m.rail]);
    // Hold the gross amount out of the account while in review
    await c.q('UPDATE accounts SET balance=balance-$2 WHERE id=$1', [a.id, gross]);
    M('payreq', userId, { amount: money(net), account: a.id, time: etTime(), url: require('./auth').BASE() + '/app#payouts' });
    await notify(c, userId, `Payout ${code} requested`, `${money(net)} to ${m.label}. Reviewed in 1 to 2 business days.`, 'payouts');
    require('./integrations').alert('payout', `:hourglass: Payout ${code} requested: ${money(net)} from ${a.id} (${m.rail})`);
    return { code, net, gross };
  });
}

async function reviewPayout(actorId, code, action, note, batchId) {
  return db.tx(async (c) => {
    const p = await c.one('SELECT * FROM payouts WHERE code=$1 FOR UPDATE', [code]);
    if (!p) bad('Payout not found', 404);
    const a = await c.one('SELECT * FROM accounts WHERE id=$1 FOR UPDATE', [p.account_id]);
    const cat = await catalog();
    if (action === 'approve') {
      if (p.status !== 'requested') bad('Only requested payouts can be approved');
      const u = await c.one('SELECT kyc_status FROM users WHERE id=$1', [p.user_id]);
      if (u.kyc_status !== 'verified') bad('Verify this trader\'s identity before approving');
      await c.q("UPDATE payouts SET status='approved', approved_at=now(), reviewed_by=$2, note=$3 WHERE id=$1", [p.id, actorId, note || '']);
      M('payok', p.user_id, { amount: money(p.amount), method: p.method, url: require('./auth').BASE() + '/app#payouts' });
      await notify(c, p.user_id, `Payout ${p.code} approved`, `${money(p.amount)} is being sent to ${p.method}.`, 'payouts');
    } else if (action === 'pay') {
      if (p.status !== 'approved') bad('Approve the payout first');
      const batch = batchId || ('PB-' + new Date().toISOString().slice(2, 10).replace(/-/g, ''));
      await c.q("UPDATE payouts SET status='paid', paid_at=now(), batch=$2 WHERE id=$1", [p.id, batch]);
      const r = R.rulesFor(cat, a);
      const count = a.payout_count + 1;
      const phase = count >= r.reviewAfter ? 'review' : a.phase;
      await c.q(`UPDATE accounts SET payout_count=$2, paid_total=paid_total+$3, floor=LEAST(floor, start_bal), cycle_profit_start=balance, cycle_win_days=0, cycle_best=0, phase=$4 WHERE id=$1`, [a.id, count, p.amount, phase]);
      await points(c, p.user_id, 250, 'Payout ' + p.code);
      M('paysent', p.user_id, { amount: money(p.amount), method: p.method, ref: p.provider_ref || p.code, url: require('./auth').BASE() + '/app#payouts' });
      await notify(c, p.user_id, `Payout ${p.code} sent`, `${money(p.amount)} sent to ${p.method}.`, 'payouts');
      const I2 = require('./integrations'); I2.alert('payout', `:white_check_mark: Payout ${p.code} sent: ${money(p.amount)}`); I2.announce(`Another payout sent: ${money(p.amount)} to a ${a.size / 1000}K ${a.plan === 'instant' ? 'Instant' : 'funded'} trader. Congrats!`);
    } else if (action === 'fail') {
      if (p.status !== 'approved') bad('Only payouts ready to send can be marked failed');
      await c.q("UPDATE payouts SET status='failed', note=$2 WHERE id=$1", [p.id, note || 'Sending failed']);
      await notify(c, p.user_id, `Payout ${p.code} could not be sent`, (note || 'The payment provider sent it back.') + ' Check your payout details, then contact support.', 'payouts');
    } else if (action === 'retry') {
      if (p.status !== 'failed') bad('Only failed payouts can be retried');
      await c.q("UPDATE payouts SET status='approved', note='' WHERE id=$1", [p.id]);
    } else if (action === 'deny') {
      if (!['requested', 'approved', 'failed'].includes(p.status)) bad('This payout can no longer be denied');
      await c.q("UPDATE payouts SET status='denied', denied_at=now(), reviewed_by=$2, note=$3 WHERE id=$1", [p.id, actorId, note || '']);
      await c.q('UPDATE accounts SET balance=balance+$2 WHERE id=$1', [a.id, p.gross]);
      await notify(c, p.user_id, `Payout ${p.code} was not approved`, note || 'Support will contact you with details.', 'payouts');
    } else bad('Unknown action');
    await c.q('INSERT INTO audit(actor_id,action,target,meta) VALUES($1,$2,$3,$4)', [actorId, 'payout.' + action, p.code, { note }]);
    return { ok: true };
  });
}

module.exports = { agreementReady, referralSettings, priceOf, normPromo, catalog, saveCatalog, planDef, sizeDef, kLabel, priceCart, promoFor, ordCode, createAccount, fulfilOrder, resetAccount, activateFunded, signAgreement, requestPayout, reviewPayout, notify, points, audit };
