// Affiliate program: approved affiliates (list.affiliates) get a code that gives buyers the tier's discount and
// attributes them, and they earn cash commission on referred buyers' paid orders instead of referral points.
// Each paid order records who earned its commission (orders.meta.comm), so every screen counts the same sales.
const db = require('./db');
const { clean, bad, money2 } = require('./util');
const TIERS0 = [['Bronze', 'Starting tier', '10%', '5%', '$0'], ['Silver', '100+ sales in 90 days', '12%', '8%', '$0'], ['Gold', '250+ sales in 90 days', '15%', '10%', '$250 a month']];
const kv = async (k) => ((await db.one('SELECT v FROM kv WHERE k=$1', [k])) || {}).v;
const putKv = (k, v, c) => (c || db).q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', [k, JSON.stringify(v)]);
const pct = (s) => parseFloat(String(s || '0').replace(/[^0-9.]/g, '')) || 0;
const r2 = (v) => Math.round(v * 100) / 100;
const dateOf = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
// Codes are compared and stored in capital letters
const up = (c) => String(c == null ? '' : c).toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40);
async function settings() { return Object.assign({ hold30: true, selfRef: true, autoApprove: false, minPayout: 100, maxRefund: 8 }, (await kv('store.affiliates.settings')) || {}); }
async function tiers() { const t = (await kv('store.affiliates.tiers')) || TIERS0; return t.map((r) => ({ name: r[0], how: r[1], rate: pct(r[2]), disc: pct(r[3]), min: pct((String(r[1]).match(/(\d+)\+/) || [])[1]) })); }
async function list() { return ((await kv('list.affiliates')) || []).filter((x) => x && x.user && x.status !== 'declined'); }
// Paused affiliates earn nothing on orders paid while they were paused (each pause is kept as { from, to })
const pausedAt = (x, at) => { const t = new Date(at).getTime(); return (x.pauses || []).some((p) => t >= new Date(p.from).getTime() && (!p.to || t < new Date(p.to).getTime())); };
// Orders that count for affiliates: the affiliate recorded on the order when it was paid, or, for orders from before that was
// recorded, the buyer's referrer. Chargebacks that were lost never count.
async function orders(uids, L) {
  L = L || await list(); const ids = (uids || L.map((x) => x.user)).map(Number); if (!ids.length) return [];
  const rows = await db.all("SELECT o.id, o.code, o.user_id buyer, o.total::float total, o.status, o.paid_at, o.refunded_at, o.meta->'comm' comm, u.referred_by FROM orders o JOIN users u ON u.id=o.user_id WHERE o.status IN ('paid','refunded') AND o.paid_at IS NOT NULL AND COALESCE(o.meta->>'chargeback','') NOT IN ('lost','accepted') AND ((o.meta ? 'comm' AND (o.meta->'comm'->>'aff')::int = ANY($1)) OR (NOT o.meta ? 'comm' AND u.referred_by = ANY($1))) ORDER BY o.paid_at, o.id", [ids]);
  const by = new Map(L.map((x) => [x.user, x]));
  return rows.map((o) => { const aff = o.comm ? Number(o.comm.aff) : o.referred_by; const x = by.get(aff); if (!x || (!o.comm && pausedAt(x, o.paid_at))) return null; return { id: o.id, code: o.code, buyer: o.buyer, aff, total: o.total, status: o.status, paid_at: o.paid_at, refunded_at: o.refunded_at, amt: o.comm && o.comm.amt != null ? Number(o.comm.amt) : null }; }).filter(Boolean);
}
// Effective tier: the assigned tier or a higher one earned by sales in the last 90 days
async function tierOf(x, T, os) {
  T = T || await tiers(); const assigned = T.findIndex((t) => t.name === (x.tier || 'Bronze')); os = os || await orders([x.user]);
  const n = os.filter((o) => o.aff === x.user && o.status === 'paid' && Date.now() - new Date(o.paid_at) < 90 * 86400000).length;
  let best = Math.max(0, assigned); T.forEach((t, i) => { if (t.min && n >= t.min && i > best) best = i; });
  const t = T[best] || T[0]; return Object.assign({}, t, { rate: x.rate ? Number(x.rate) : t.rate, sales90: n });
}
async function byUser(uid) { return (await list()).find((x) => x.user === uid && x.status === 'active') || null; }
// An affiliate whether active or paused (a paused affiliate is still not an ordinary referrer)
async function any(uid) { return (await list()).find((x) => x.user === uid) || null; }
async function byCode(code) { const c = up(code); if (!c) return null; return (await list()).find((x) => x.status === 'active' && up(x.code) === c) || null; }
// Who else uses a code: another affiliate, a promotion, or a trader's personal link. Empty when the code is free.
async function codeTaken(code, uid, L) {
  const c = up(code); if (!c) return 'nobody yet, but it is empty';
  if ((L || await list()).some((x) => x.user !== uid && up(x.code) === c)) return 'another affiliate';
  const cat = await require('./core').catalog(); if ((cat.promos || []).concat(cat.autos || []).some((p) => p && up(p.code) === c)) return 'a promotion';
  if (await db.one('SELECT 1 FROM users WHERE upper(ref_code)=$1 AND id<>$2', [c, uid || 0])) return 'another trader\'s referral link';
  return '';
}
async function freeCode(base, uid, L) { base = up(base) || 'PARTNER'; if (base.length < 3) base += 'FS'; L = L || await list(); for (let i = 1; i < 1000; i++) { const c = i === 1 ? base : base.slice(0, 36) + i; if (!(await codeTaken(c, uid, L))) return c; } return base.slice(0, 30) + Date.now().toString(36).toUpperCase(); }
// Money figures for one affiliate from their orders. Commission is the amount recorded on each order (rounded per order).
function figures(x, t, os, st, pays) {
  const mine = os.filter((o) => o.aff === x.user); const paid = mine.filter((o) => o.status === 'paid'); const refunded = mine.filter((o) => o.status === 'refunded');
  const amt = (o) => (o.amt != null ? o.amt : r2(o.total * t.rate / 100)); const old = (o) => !st.hold30 || (Date.now() - new Date(o.paid_at)) > 30 * 86400000;
  const earned = r2(paid.filter(old).reduce((s, o) => s + amt(o), 0)); const held = r2(paid.filter((o) => !old(o)).reduce((s, o) => s + amt(o), 0));
  const paidOut = r2(pays.filter((p) => p.user === x.user).reduce((s, p) => s + Number(p.amount || 0), 0)); const net = r2(earned - paidOut);
  return { sales: paid.length, refunds: refunded.length, refundRate: mine.length ? r2(refunded.length / mine.length * 100) : 0, revenue: r2(paid.reduce((s, o) => s + o.total, 0)), earned, held, paid: paidOut, owed: Math.max(0, net), over: Math.max(0, r2(-net)), amt };
}
// Commission summary for an affiliate (the same numbers the back office shows)
async function summary(uid) {
  const L = await list(); const x = L.find((y) => y.user === uid); if (!x) return null;
  const st = await settings(); const os = await orders([uid], L); const t = await tierOf(x, null, os); const f = figures(x, t, os, st, (await kv('store.affiliate.payments')) || []); delete f.amt;
  return Object.assign({ code: up(x.code), status: x.status, tier: t.name, rate: t.rate, disc: t.disc, sales90: t.sales90, minPayout: st.minPayout, hold30: st.hold30 !== false, tiers: await tiers() }, f);
}
// Everything the back office needs in one pass: per-affiliate figures, the affiliate and commission of each order, and the cases staff should see
async function board() {
  const L = await list(); const st = await settings(); const T = await tiers(); const os = await orders(null, L); const pays = (await kv('store.affiliate.payments')) || [];
  const sum = {}; const ord = {};
  for (const x of L) { const t = await tierOf(x, T, os); const f = figures(x, t, os, st, pays); os.filter((o) => o.aff === x.user).forEach((o) => { ord[o.code] = { aff: x.user, com: f.amt(o) }; }); delete f.amt; sum[x.user] = Object.assign({ tier: t.name, rate: t.rate, disc: t.disc, sales90: t.sales90 }, f); }
  const self = await db.all("SELECT o.code, o.user_id buyer, o.paid_at at, o.meta->'selfRef' s FROM orders o WHERE o.meta ? 'selfRef' ORDER BY o.id DESC LIMIT 200");
  const owed = await db.all("SELECT substr(k, 9)::int uid, v FROM kv WHERE k LIKE 'refowed.%'");
  return { sum, ord, self: self.map((r) => ({ order: r.code, buyer: r.buyer, of: r.s.of, why: r.s.why || [], aff: !!r.s.aff, at: r.at })), owed: owed.filter((r) => r.v && r.v.owed > 0).map((r) => ({ uid: r.uid, owed: r.v.owed, log: (r.v.log || []).slice(-5) })) };
}
// ---- Self-referral: the same person behind the buyer and the one who would be rewarded ----
// Signals: a browser both accounts were signed in on (fs_did cookie), the same phone number, or the same card (processor fingerprint).
const didsOf = async (uid) => (await kv('did.' + uid)) || [];
async function seenDevice(uid, did) { if (!uid || !/^[a-f0-9]{16,64}$/.test(String(did || ''))) return; const cur = await didsOf(uid); if (cur.includes(did)) return; await putKv('did.' + uid, cur.concat([did]).slice(-20)); }
async function selfSignals(buyerId, otherId, cardFp) {
  if (!buyerId || !otherId) return []; if (buyerId === otherId) return ['Same account'];
  const why = []; const [a, b] = await Promise.all([db.one('SELECT phone FROM users WHERE id=$1', [buyerId]), db.one('SELECT phone FROM users WHERE id=$1', [otherId])]);
  const [da, dbb] = await Promise.all([didsOf(buyerId), didsOf(otherId)]); if (da.some((d) => dbb.includes(d))) why.push('Same device');
  const ph = (p) => String(p || '').replace(/\D/g, ''); if (a && b && ph(a.phone).length >= 6 && ph(a.phone) === ph(b.phone)) why.push('Same phone number');
  const fps = cardFp ? [cardFp] : (await db.all("SELECT DISTINCT meta->>'cardFp' fp FROM orders WHERE user_id=$1 AND meta ? 'cardFp'", [buyerId])).map((r) => r.fp);
  if (fps.length && (await db.one("SELECT 1 FROM orders WHERE user_id=$1 AND meta->>'cardFp' = ANY($2) LIMIT 1", [otherId, fps]))) why.push('Same card');
  return why;
}
// ---- Paid order: who earns from it. Called once per order from core.fulfilOrder, inside its transaction. ----
// An affiliate code typed at checkout earns that affiliate the commission on this order. Otherwise the buyer's referrer earns:
// commission when they are an affiliate, or the one-time credit reward when they are a trader. Never both for one order.
async function onPaid(c, o, core) {
  const buyer = await c.one('SELECT id, referred_by FROM users WHERE id=$1', [o.user_id]); const L = await list(); const st = await settings(); const meta = {};
  const typed = o.meta && o.meta.affiliate ? L.find((x) => x.user === Number(o.meta.affiliate) && x.user !== buyer.id) : null;
  // attribution starts when an order is paid: a buyer nobody referred belongs to the affiliate whose code they paid with
  if (typed && !buyer.referred_by) { await c.q('UPDATE users SET referred_by=$2 WHERE id=$1 AND referred_by IS NULL', [buyer.id, typed.user]); buyer.referred_by = typed.user; }
  const af = typed || (buyer.referred_by ? L.find((x) => x.user === buyer.referred_by) : null); const fp = (o.meta && o.meta.cardFp) || null;
  if (af) {
    const self = st.selfRef !== false ? await selfSignals(buyer.id, af.user, fp) : [];
    if (af.status !== 'active') meta.comm = { aff: null, skip: 'paused', of: af.user };
    else if (self.length) { meta.comm = { aff: null, skip: 'self', of: af.user }; meta.selfRef = { of: af.user, why: self, aff: true }; }
    else { const t = await tierOf(af); const amt = r2(Number(o.total) * t.rate / 100); meta.comm = { aff: af.user, rate: t.rate, amt, code: up(af.code) };
      if (amt > 0) { await core.notify(c, af.user, `You earned ${money2(amt)} commission`, `${t.rate}% of order ${o.code}.${st.hold30 !== false ? ' It\'s paid after the 30-day refund window.' : ''}`, 'affiliates'); require('./mail').t('commission', af.user, { amount: money2(amt), order: o.code, order_total: money2(o.total), code: up(af.code), rate: t.rate + '%', url: require('./auth').BASE() + '/app#affiliates' }); } }
  } else { meta.comm = { aff: null };
    if (buyer.referred_by && o.kind !== 'reset' && o.kind !== 'credits') {
      const RS = await core.referralSettings();
      // once per friend: their first paid order that no affiliate earned commission on
      const prev = await c.one("SELECT count(*)::int n FROM orders WHERE user_id=$1 AND status='paid' AND id<>$2 AND kind NOT IN ('reset','credits') AND (meta->'comm'->>'aff') IS NULL", [o.user_id, o.id]);
      if (prev.n === 0 && RS.on && RS.pts > 0) { const self = await selfSignals(buyer.id, buyer.referred_by, fp);
        if (self.length) meta.selfRef = { of: buyer.referred_by, why: self };
        else { await core.points(c, buyer.referred_by, RS.pts, 'Friend bought an account'); await core.notify(c, buyer.referred_by, 'A friend you referred bought an account', `You earned ${RS.pts.toLocaleString('en-US')} credits.`, 'affiliates'); meta.refReward = { to: buyer.referred_by, pts: RS.pts }; } }
    }
  }
  await c.q('UPDATE orders SET meta = meta || $2 WHERE id=$1', [o.id, JSON.stringify(meta)]);
}
// ---- Refunded order: take back what it earned others ----
async function onRefund(o, core) {
  const m = (await db.one('SELECT meta FROM orders WHERE id=$1', [o.id])).meta || {}; const buyer = await db.one('SELECT referred_by FROM users WHERE id=$1', [o.user_id]);
  // the referrer's credit reward: the amount that was given (the configured reward for orders from before it was recorded), never below a zero balance
  let rw = m.refReward && m.refReward.back == null ? m.refReward : null;
  if (!rw && !m.comm && buyer && buyer.referred_by && o.kind !== 'reset' && o.kind !== 'credits' && !(await any(buyer.referred_by))) {
    const first = await db.one("SELECT id FROM orders WHERE user_id=$1 AND (status='paid' OR id=$2) AND kind NOT IN ('reset','credits') ORDER BY paid_at NULLS LAST, id LIMIT 1", [o.user_id, o.id]);
    const got = await db.one("SELECT COALESCE(sum(CASE WHEN label='Friend bought an account' THEN 1 ELSE 0 END),0)::int g, COALESCE(sum(CASE WHEN label='Friend''s order refunded' THEN 1 ELSE 0 END),0)::int b FROM points_log WHERE user_id=$1", [buyer.referred_by]);
    if (first && first.id === o.id && got.g > got.b) rw = { to: buyer.referred_by, pts: (await core.referralSettings()).pts };
  }
  if (rw && rw.pts > 0) await db.tx(async (c) => {
    const u = await c.one('SELECT points FROM users WHERE id=$1 FOR UPDATE', [rw.to]); if (!u) return; const take = Math.min(rw.pts, Math.max(0, u.points)); const rest = rw.pts - take; const n = (v) => Number(v).toLocaleString('en-US');
    if (take > 0) await core.points(c, rw.to, -take, 'Friend\'s order refunded');
    if (rest > 0) { const k = 'refowed.' + rw.to; const cur = ((await c.one('SELECT v FROM kv WHERE k=$1', [k])) || {}).v || { owed: 0, log: [] }; cur.owed = (cur.owed || 0) + rest; cur.log = (cur.log || []).concat([{ order: o.code, pts: rest, at: new Date().toISOString() }]).slice(-50); await putKv(k, cur, c); }
    await c.q('UPDATE orders SET meta = meta || $2 WHERE id=$1', [o.id, JSON.stringify({ refReward: { to: rw.to, pts: rw.pts, back: take, owed: rest } })]);
    await core.notify(c, rw.to, 'A referred order was refunded', rest > 0 ? `The ${n(rw.pts)} credits for that referral were taken back. You had ${n(take)} left, so your balance is now zero.` : `The ${n(rw.pts)} credits for that referral were taken back.`, 'affiliates');
  });
  // the affiliate's commission: tell them, show any amount already paid out as a carry-over, and apply the refund-rate rule
  const aff = m.comm ? m.comm.aff : (buyer && buyer.referred_by && (await any(buyer.referred_by)) ? buyer.referred_by : null);
  if (aff) { const sm = await summary(aff); const amt = m.comm && m.comm.amt != null ? Number(m.comm.amt) : sm ? r2(Number(o.total) * sm.rate / 100) : 0;
    if (sm && amt > 0) await core.notify(null, aff, `${money2(amt)} commission taken back`, `Order ${o.code} was refunded.${sm.over > 0 ? ` You were already paid for it, so ${money2(sm.over)} comes off your next payouts.` : ''}`, 'affiliates');
    await checkRefundRate(aff, core); }
}
// Rules and Fraud: pause an affiliate whose refund rate is above the limit (needs 5 or more orders, so one early refund does not pause anyone)
async function checkRefundRate(uid, core) {
  const st = await settings(); const lim = Number(st.maxRefund); if (!(lim > 0)) return false;
  const all = (await kv('list.affiliates')) || []; const x = all.find((y) => y && y.user === uid && y.status === 'active'); if (!x) return false;
  const os = (await orders([uid])).filter((o) => o.aff === uid); const ref = os.filter((o) => o.status === 'refunded').length; if (os.length < 5 || ref / os.length * 100 <= lim) return false;
  const now = new Date().toISOString(); const rate = Math.round(ref / os.length * 1000) / 10;
  await putKv('list.affiliates', all.map((y) => (y === x ? Object.assign({}, y, { status: 'paused', pausedWhy: `Refund rate ${rate}% is above ${lim}%`, pauses: (y.pauses || []).concat([{ from: now }]) }) : y)));
  await core.audit(null, 'affiliate.autopause', String(uid), { rate, limit: lim });
  await core.notify(null, uid, 'Your affiliate account is paused', 'Too many of your buyers\' orders were refunded. Orders earn no commission while it is paused. Contact support to talk about it.', 'affiliates');
  return true;
}
// ---- Staff save the affiliates list: the server checks codes and keeps the fields it owns ----
async function saveList(next, core) {
  if (!Array.isArray(next)) bad('Bad list'); const prev = ((await kv('list.affiliates')) || []).filter((x) => x && x.user); const now = new Date().toISOString(); const out = []; const fresh = []; const declined = [];
  for (const raw of next) { if (!raw || !raw.user) continue; const uid = Number(raw.user); if (out.some((y) => y.user === uid)) bad('The same trader is on the list twice.'); const old = prev.find((y) => y.user === uid);
    if (raw.status === 'declined') { const d = { user: uid, status: 'declined', at: (old && old.status === 'declined' && old.at) || now, reason: clean(raw.reason, 300) }; if (old && old.status !== 'declined') bad('This trader is already an affiliate. Pause them instead.'); if (!old && raw.at && Date.now() - new Date(raw.at) > 600000) continue; if (!old) declined.push(d); out.push(d); continue; }
    const was = old && old.status !== 'declined' ? old : null;
    if (!was && !(await db.one("SELECT 1 FROM users WHERE id=$1 AND role='trader'", [uid]))) bad('That trader account was not found');
    const x = Object.assign({}, raw, { user: uid, code: up(raw.code), status: raw.status === 'paused' ? 'paused' : 'active' }); if (x.code.length < 3) bad('Give the affiliate a code of at least 3 letters or numbers.');
    // the pause history belongs to the server
    x.pauses = was ? (was.pauses || []).slice() : []; delete x.pausedWhy; if (was && was.pausedWhy && x.status === 'paused') x.pausedWhy = was.pausedWhy;
    if (x.status === 'paused' && !(was && was.status === 'paused')) x.pauses.push({ from: now });
    if (x.status === 'active' && was && was.status === 'paused') { const p = x.pauses[x.pauses.length - 1]; if (p && !p.to) p.to = now; }
    if (!was) { x.since = x.since || now; fresh.push(x); }
    out.push(x); }
  // codes: no two affiliates, no promotion and no trader link may share one (an entry whose code was not touched is left alone)
  const live = out.filter((y) => y.status !== 'declined');
  for (const x of live) { const was = prev.find((y) => y.user === x.user && y.status !== 'declined'); if (was && up(was.code) === x.code) continue;
    const others = live.filter((y) => y !== x); const who = await codeTaken(x.code, x.user, others);
    if (who) bad(`Code ${x.code} is already used by ${who}. Try ${await freeCode(x.code, x.user, others)}.`); }
  await putKv('list.affiliates', out);
  for (const x of fresh) await welcome(x, core); // a new affiliate only: resuming a paused one sends nothing
  for (const d of declined) await tellDeclined(d, core);
  return out;
}
// Welcome a new affiliate once: one email (affok) and one in-app notice
async function welcome(x, core) {
  const sm = await summary(x.user).catch(() => null); const base = require('./auth').BASE();
  await core.notify(null, x.user, 'You are now a Funded Sky affiliate', `Your code is ${x.code} and your link is ${base.replace(/^https?:\/\//, '')}/?ref=${x.code}. You earn ${sm ? sm.rate + '% ' : ''}commission on orders paid with your code or by people who sign up through your link.`, 'affiliates');
  require('./mail').t('affok', x.user, { aff_code: x.code, discount: sm ? sm.disc + '%' : '', commission: sm ? sm.rate + '%' : '', url: base + '/app#affiliates' });
}
const REAPPLY_DAYS = 30;
async function tellDeclined(d, core) {
  const u = await db.one('SELECT id, email, first FROM users WHERE id=$1', [d.user]); if (!u) return; const on = dateOf(new Date(d.at).getTime() + REAPPLY_DAYS * 86400000);
  await db.q('UPDATE users SET settings = settings || $2 WHERE id=$1', [u.id, JSON.stringify({ affApplied: false, affDeclined: d.at })]);
  const body = `We reviewed your affiliate application and can't approve it right now.${d.reason ? ' ' + d.reason.replace(/[.\s]*$/, '.') : ''} You can apply again from ${on}. Your personal referral link keeps working in the meantime.`;
  await core.notify(null, u.id, 'Your affiliate application was not approved', body, 'affiliates');
  if (!/@demo\.fundedsky\.test$/.test(u.email)) await require('./mail').send(u.email, 'Your Funded Sky affiliate application', `Hi ${u.first},\n\n${body}\n\nFunded Sky Partners`, 'affdeclined').catch(() => {});
}
// ---- Trader applies: a channel link and a short description are required; a declined trader waits 30 days ----
async function apply(user, b, core) {
  const s = user.settings || {}; const all = ((await kv('list.affiliates')) || []).filter((x) => x && x.user); const mine = all.find((x) => x.user === user.id);
  if (mine && mine.status !== 'declined') bad('You are already an affiliate.');
  if (s.affApplied) bad('Your application is already with our team. We reply within 3 business days.');
  const decl = (mine && mine.at) || s.affDeclined; if (decl) { const again = new Date(decl).getTime() + REAPPLY_DAYS * 86400000; if (again > Date.now()) bad(`You can apply again from ${dateOf(again)}.`); }
  const where = clean(b.where, 200); const aud = clean(b.audience, 500);
  if (where.length < 4) bad('Add a link to your channel, page or community.'); if (aud.length < 20) bad('Tell us about your audience in a sentence or two (at least 20 characters).');
  await db.q('UPDATE users SET settings = (settings - \'affDeclined\') || $2 WHERE id=$1', [user.id, JSON.stringify({ affApplied: true, affAt: new Date().toISOString(), affWhere: where, affAudience: aud })]);
  let next = all.filter((x) => x.user !== user.id);
  if (mine) await putKv('list.affiliates', next); // an earlier decline leaves the list so the new application reaches staff
  // Rules and Fraud > Approve Applications Automatically
  if ((await settings()).autoApprove === true) { const code = await freeCode(`${user.first || ''}${user.last || ''}`, user.id); next = next.concat([{ user: user.id, code, status: 'active', tier: 'Bronze', since: new Date().toISOString(), where, auto: true }]); await saveList(next, core); await core.audit(null, 'affiliate.autoapprove', String(user.id), { code }); return { ok: true, approved: true, code }; }
  return { ok: true };
}
// ---- Pay All Due: worked out and checked here, never in the browser ----
async function payAll(actor, core, dry) {
  const L = await list(); const st = await settings(); const T = await tiers(); const os = await orders(null, L); const pays = ((await kv('store.affiliate.payments')) || []).slice();
  const taxOn = await require('./integrations').on('track1099'); const paid = []; const skipped = []; const now = new Date().toISOString(); const min = Number(st.minPayout) || 0;
  for (const x of L) { const f = figures(x, await tierOf(x, T, os), os, st, pays); if (!(f.owed > 0)) continue; const code = up(x.code);
    if (f.owed < min) { skipped.push({ user: x.user, code, amount: f.owed, why: 'Below the minimum payout' }); continue; }
    const u = await db.one('SELECT tax_status FROM users WHERE id=$1', [x.user]); if (taxOn && (!u || u.tax_status !== 'on_file')) { skipped.push({ user: x.user, code, amount: f.owed, why: 'Tax form missing' }); continue; }
    const m = await db.one('SELECT rail, label FROM payout_methods WHERE user_id=$1 ORDER BY is_default DESC, id LIMIT 1', [x.user]); if (!m) { skipped.push({ user: x.user, code, amount: f.owed, why: 'No payout method on file' }); continue; }
    const p = { id: 'AC-' + Date.now().toString(36).toUpperCase() + '-' + x.user, user: x.user, code, amount: f.owed, at: now, ref: 'Monthly commission', method: m.label, rail: m.rail, by: actor ? `${actor.first || ''} ${actor.last || ''}`.trim() : '', byId: actor ? actor.id : null }; pays.push(p); paid.push(p); }
  if (paid.length && !dry) { await putKv('store.affiliate.payments', pays);
    for (const p of paid) { await core.notify(null, p.user, `${money2(p.amount)} commission sent`, `Paid to ${p.method}. It can take a few business days to arrive.`, 'affiliates'); require('./mail').t('affpaid', p.user, { amount: money2(p.amount), method: p.method, url: require('./auth').BASE() + '/app#affiliates' }); await core.audit(actor && actor.id, 'affiliate.payout', p.id, { user: p.user, code: p.code, amount: p.amount, method: p.method }); } }
  return { paid, skipped, total: r2(paid.reduce((s, p) => s + p.amount, 0)) };
}
module.exports = { tiers, settings, list, byUser, any, byCode, tierOf, summary, board, orders, up, codeTaken, freeCode, seenDevice, selfSignals, onPaid, onRefund, checkRefundRate, saveList, apply, payAll, REAPPLY_DAYS };
