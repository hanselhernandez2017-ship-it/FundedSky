// Competitions: every trader registered for a live competition gets a free practice account
// (accounts.comp = competition id) traded on the simulated feed. The leaderboard ranks those
// accounts by profit. Accounts close when the competition ends.
const db = require('./db');
const core = require('./core');
const content = require('./content');

const isLive = (c) => c && (c.st === 'live' || c.st === 'running');
const isOver = (c) => c && (c.st === 'ended' || c.st === 'done');
// "$100K practice account" -> 100000
const sizeOf = (c) => { const m = /\$?\s*(\d+(?:\.\d+)?)\s*K/i.exec(String(c.size || '')); return m ? Math.round(Number(m[1]) * 1000) : 50000; };

// A plan and size the rule engine knows, as close as possible to the competition's size
function planFor(cat, size) {
  const evals = cat.plans.filter((p) => p.kind !== 'funded' && p.id !== 'instant');
  const pref = evals.find((p) => p.id === 'prime') || evals[0];
  for (const p of [pref, ...evals]) { if (p && p.sizes.some((z) => z.size === size)) return { plan: p.id, size, platform: p.defPlatform && p.platforms.includes(p.defPlatform) ? p.defPlatform : p.platforms[0] }; }
  const all = pref.sizes.map((z) => z.size).sort((a, b) => Math.abs(a - size) - Math.abs(b - size));
  return { plan: pref.id, size: all[0], platform: pref.platforms[0] };
}

let syncing = null;
// Make sure every registered trader in a live competition has an account, and close accounts of ended ones
async function sync() {
  if (syncing) return syncing;
  syncing = (async () => {
    const C = (await content.all()).competitions || []; const cat = await core.catalog(); const made = [];
    for (const c of C.filter(isLive)) {
      const regs = await db.all("SELECT u.id FROM users u WHERE (u.settings->'comps'->>$1)='true' AND u.status='active' AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.user_id=u.id AND a.comp=$1)", [c.id]);
      for (const r of regs) made.push(await openFor(c, r.id, cat));
    }
    for (const c of C.filter(isOver)) await db.q("UPDATE accounts SET phase='closed', closed_at=now(), breach_reason='Competition ended' WHERE comp=$1 AND phase IN ('active','review')", [c.id]);
    return made;
  })().finally(() => { syncing = null; });
  return syncing;
}
async function openFor(c, userId, cat) {
  cat = cat || await core.catalog(); const p = planFor(cat, sizeOf(c));
  return db.tx(async (t) => {
    const lock = await t.one('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]); if (!lock) return null;
    const have = await t.one('SELECT id FROM accounts WHERE user_id=$1 AND comp=$2', [userId, c.id]); if (have) return have.id;
    const id = await core.createAccount(t, { userId, plan: p.plan, size: p.size, platform: p.platform, addons: [] });
    await t.q('UPDATE accounts SET comp=$2 WHERE id=$1', [id, c.id]);
    await core.notify(t, userId, `${c.n} has started`, `Your free $${p.size / 1000}K competition account ${id} is ready. Trade it to climb the leaderboard.`, 'competitions');
    return id;
  });
}
// Called when a trader registers: if the competition is already running, open their account right away
async function joined(compId, userId) { const c = ((await content.all()).competitions || []).find((x) => x.id === compId); if (isLive(c)) return openFor(c, userId); return null; }

// Ranked rows: still trading first by profit, then accounts out of the competition
async function leaderboard(compId, opts = {}) {
  const rows = await db.all(`SELECT a.id, a.user_id, a.balance, a.start_bal, a.peak_eod, a.phase, a.days_traded, a.breach_reason, u.first, u.last, u.country
    FROM accounts a JOIN users u ON u.id=a.user_id WHERE a.comp=$1`, [compId]);
  const dq = new Set((((await db.one("SELECT v FROM kv WHERE k='store.competitions.dq'")) || {}).v || {})[compId] || []);
  const L = rows.map((r) => { const start = Number(r.start_bal), bal = Number(r.balance), peak = Math.max(Number(r.peak_eod), start);
    return { uid: r.user_id, acct: r.id, name: `${r.first} ${(r.last || '').slice(0, 1)}.`, country: r.country || '', pnl: Math.round((bal - start) * 100) / 100, pct: Math.round((bal - start) / start * 10000) / 100,
      dd: Math.round(Math.max(0, peak - bal) / start * 1000) / 10, days: r.days_traded, out: r.phase === 'breached' || dq.has(r.user_id), why: dq.has(r.user_id) ? 'Disqualified' : r.phase === 'breached' ? 'Broke a rule' : '' }; });
  L.sort((a, b) => (a.out - b.out) || (b.pnl - a.pnl));
  L.forEach((x, i) => { x.rank = x.out ? null : i + 1; });
  return L;
}
module.exports = { sync, joined, leaderboard, isLive, sizeOf, planFor };
