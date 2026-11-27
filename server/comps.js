// Competitions: every trader registered for a live competition gets a free practice account
// (accounts.comp = competition id) traded on the simulated feed. Accounts close when the competition ends.
// Everything that ranks traders goes through board() here: the trader page, the Back Office, the public page
// and the winners recorded at the end all use the same order.
const db = require('./db');
const core = require('./core');
const content = require('./content');
const { bad, clean, ET } = require('./util');

const isLive = (c) => c && (c.st === 'live' || c.st === 'running');
const isOver = (c) => c && (c.st === 'ended' || c.st === 'done');
// "$100K practice account" -> 100000
const sizeOf = (c) => { const m = /\$?\s*(\d+(?:\.\d+)?)\s*K/i.exec(String(c.size || '')); return m ? Math.round(Number(m[1]) * 1000) : 50000; };
const K = (n) => '$' + Number(n) / 1000 + 'K';
const ordinal = (n) => n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');
const kvGet = async (k, q) => ((await (q || db).one('SELECT v FROM kv WHERE k=$1', [k])) || {}).v;
const kvPut = (k, v, q) => (q || db).q('INSERT INTO kv(k,v,updated_at) VALUES($1,$2,now()) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', [k, JSON.stringify(v)]);

// ---- Dates: kept as YYYY-MM-DD (Eastern Time); the short text traders see ("Nov 27") is made from them
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const todayET = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: ET });
const realDay = (y, m, d) => { const x = new Date(Date.UTC(y, m - 1, d)); return x.getUTCFullYear() === y && x.getUTCMonth() === m - 1 && x.getUTCDate() === d ? x.toISOString().slice(0, 10) : null; };
// "2026-11-27", "Nov 27" or "Nov 27, 2026" -> "2026-11-27"; null when it is not a real date. Without a year, the nearest one is meant.
function dayOf(v) {
  const s = String(v == null ? '' : v).trim(); let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return realDay(+m[1], +m[2], +m[3]);
  m = /^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?$/.exec(s); if (!m) return null;
  const mo = MON.findIndex((x) => x.toLowerCase() === m[1].toLowerCase()) + 1; if (!mo) return null;
  if (m[3]) return realDay(+m[3], mo, +m[2]);
  const now = new Date(todayET() + 'T00:00:00Z'); const y = now.getUTCFullYear();
  return [y - 1, y, y + 1].map((yy) => realDay(yy, mo, +m[2])).filter(Boolean).sort((a, b) => Math.abs(new Date(a) - now) - Math.abs(new Date(b) - now))[0] || null;
}
const dayText = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MON[m - 1]} ${d}${y !== +todayET().slice(0, 4) ? ', ' + y : ''}`; };

// ---- Prizes: each competition has its own list, one entry per place. The text traders see is made from it.
const prizeLabel = (p) => (p.type === 'funded' ? `${K(p.size)} Funded Account` : p.type === 'eval' ? `Free ${K(p.size)} Evaluation` : p.type === 'credits' ? `${Number(p.amount).toLocaleString('en-US')} Credits` : p.note);
// "You won a $50K Funded Account" / "You won 5,000 Credits": an article only for an account prize
const aPrize = (s) => (/(Funded Account|Evaluation)$/.test(String(s || '')) ? 'a ' : '') + (s || '');
function prizeText(P) {
  if (!P.length) return 'No prizes'; const L = P.map(prizeLabel);
  if (L.length > 1 && L.every((x) => x === L[0])) return `${L.length} × ${L[0]}${P[0].type === 'funded' || P[0].type === 'eval' ? 's' : ''}`;
  return L.length === 1 ? L[0] : `${L[0]} + ${L.length - 1} more`;
}
// One prize from its words ("$50K Funded Account", "Free $25K Evaluation", "5,000 Credits"; anything else is a cash note)
function prizeFromText(t) {
  const s = clean(t, 80); let m = /\$\s*(\d+)\s*K\s+Funded/i.exec(s); if (m) return { type: 'funded', size: +m[1] * 1000 };
  m = /\$\s*(\d+)\s*K\s+Eval/i.exec(s); if (m) return { type: 'eval', size: +m[1] * 1000 };
  m = /^([\d,]+)\s+Credits?$/i.exec(s); if (m) return { type: 'credits', amount: +m[1].replace(/,/g, '') };
  return s ? { type: 'cash', note: s } : null;
}
// Competitions saved before prizes were a list only have the words. "3 × $50K Funded Accounts" and "$150K Funded Account + 9 more"
// are read as written; the "more" places are filled from the standard prize table.
function prizesFromText(text, table) {
  const std = (table || []).map((r) => prizeFromText(Array.isArray(r) ? r[1] : r)).filter(Boolean); const s = String(text || '').trim();
  let m = /^(\d+)\s*[×x]\s*(.+?)$/i.exec(s);
  if (m) { const p = prizeFromText(m[2]); return p ? Array.from({ length: Math.min(50, +m[1]) }, () => ({ ...p })) : std; }
  m = /^(.+?)\s*\+\s*(\d+)\s+more$/i.exec(s);
  if (m) { const first = prizeFromText(m[1]); const rest = std.slice(1); const out = first ? [first] : []; for (let i = 0; i < Math.min(49, +m[2]); i++) { const p = rest[Math.min(i, rest.length - 1)]; if (p) out.push({ ...p }); } return out.length ? out : std; }
  const one = prizeFromText(s); return one && one.type !== 'cash' ? [one] : std;
}
function cleanPrize(p, i) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) bad(`Prize ${i + 1} is not in the right shape.`);
  const type = String(p.type || '');
  if (type === 'funded' || type === 'eval') { const size = Number(p.size); if (!Number.isInteger(size) || size < 5000 || size > 1000000 || size % 1000) bad(`Prize ${i + 1}: pick an account size.`); return { type, size }; }
  if (type === 'credits') { const amount = Math.round(Number(p.amount)); if (!(amount > 0) || amount > 10000000) bad(`Prize ${i + 1}: enter how many credits.`); return { type, amount }; }
  if (type === 'cash') { const note = clean(p.note, 80); if (!note) bad(`Prize ${i + 1}: describe the cash prize, for example $500 Cash.`); return { type, note }; }
  return bad(`Prize ${i + 1}: choose a funded account, a free evaluation, credits or cash.`);
}

// How ranking works, in the words traders read on the Competitions page
const RULES_TEXT = ['Traders are ranked by profit on their competition account, highest first.',
  'Traders with the same profit share the same rank.',
  'When a tie decides who gets a prize, the trader who reached that profit first (the earlier last trade) is placed higher. If that is also equal, the trader who registered first is placed higher.',
  'Prizes go to ranked traders who finish in profit. Traders who have not traded yet are listed without a rank.',
  'A competition starts at the beginning of its start date and ends at the end of its end date, Eastern Time.'];

// One competition in the shape the rest of the app reads. Lenient: older saved rows get their dates and prizes worked out.
function shape(c, table) {
  const st = isLive(c) ? 'live' : isOver(c) ? 'ended' : 'upcoming';
  const startAt = dayOf(c.startAt) || dayOf(c.start); const endAt = dayOf(c.endAt) || dayOf(c.end);
  let prizes; try { prizes = Array.isArray(c.prizes) ? c.prizes.map(cleanPrize) : prizesFromText(c.prize, table); } catch (e) { prizes = prizesFromText(c.prize, table); }
  return { id: String(c.id), n: String(c.n || 'Competition'), st, start: startAt ? dayText(startAt) : String(c.start || ''), end: endAt ? dayText(endAt) : String(c.end || ''), startAt, endAt,
    size: `${K(sizeOf(c))} practice account`, entry: String(c.entry || 'Free'), players: 0, prizes, prize: Array.isArray(c.prizes) || !c.prize ? prizeText(prizes) : String(c.prize), rule: String(c.rule || 'Highest profit with no rule breaks') };
}
const shapeAll = (v, C) => (Array.isArray(v) ? v : []).filter((c) => c && typeof c === 'object' && !Array.isArray(c) && c.id != null && c.id !== '').map((c) => shape(c, C.cprizes));
async function list() { const C = await content.all(); return shapeAll(C.competitions, C); }

// Check a list sent from the Back Office before it is saved: real names, dates, sizes and prizes, no duplicate ids
async function validate(value) {
  if (!Array.isArray(value)) bad('This content is not in the right shape.');
  if (value.length > 200) bad('That is too many competitions.');
  const table = (await content.all()).cprizes; const cat = await core.catalog(); const sizes = new Set(cat.plans.filter((p) => p.kind !== 'funded' && p.id !== 'instant').flatMap((p) => p.sizes.map((z) => z.size))); const seen = new Set();
  return value.map((c, i) => { const at = `Competition ${i + 1}`;
    if (!c || typeof c !== 'object' || Array.isArray(c)) bad(`${at} is not in the right shape.`);
    const id = clean(c.id, 30); if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,19}$/.test(id)) bad(`${at} needs an id (letters, numbers and dashes, up to 20).`);
    if (seen.has(id)) bad(`Two competitions have the id ${id}.`); seen.add(id);
    const n = clean(c.n, 80); if (!n) bad(`${at} needs a name.`);
    if (!['upcoming', 'live', 'running', 'ended', 'done'].includes(c.st)) bad(`${n}: the status must be upcoming, live or ended.`);
    const startAt = dayOf(c.startAt != null && c.startAt !== '' ? c.startAt : c.start); const endAt = dayOf(c.endAt != null && c.endAt !== '' ? c.endAt : c.end);
    if (!startAt) bad(`${n}: the start date is not a real date.`); if (!endAt) bad(`${n}: the end date is not a real date.`);
    if (endAt < startAt) bad(`${n}: the end date is before the start date.`);
    if (!/\d\s*K/i.test(String(c.size || ''))) bad(`${n}: pick a practice account size.`);
    if (!sizes.has(sizeOf(c))) bad(`${n}: there is no ${K(sizeOf(c))} evaluation to base the practice account on.`);
    const prizes = Array.isArray(c.prizes) ? c.prizes.map(cleanPrize) : prizesFromText(c.prize, table);
    if (prizes.length > 50) bad(`${n}: at most 50 prizes.`);
    const st = isLive(c) ? 'live' : isOver(c) ? 'ended' : 'upcoming';
    return { id, n, st, start: dayText(startAt), end: dayText(endAt), startAt, endAt, size: `${K(sizeOf(c))} practice account`, entry: clean(c.entry, 40) || 'Free', players: 0, prizes, prize: prizeText(prizes), rule: clean(c.rule, 160) || 'Highest profit with no rule breaks' }; });
}

// A plan and size the rule engine knows, as close as possible to the competition's size
function planFor(cat, size) {
  const evals = cat.plans.filter((p) => p.kind !== 'funded' && p.id !== 'instant');
  const pref = evals.find((p) => p.id === 'prime') || evals[0];
  for (const p of [pref, ...evals]) { if (p && p.sizes.some((z) => z.size === size)) return { plan: p.id, size, platform: p.defPlatform && p.platforms.includes(p.defPlatform) ? p.defPlatform : p.platforms[0] }; }
  const all = pref.sizes.map((z) => z.size).sort((a, b) => Math.abs(a - size) - Math.abs(b - size));
  return { plan: pref.id, size: all[0], platform: pref.platforms[0] };
}

let syncing = null;
// Make sure every registered trader in a live competition has an account, and close the accounts of competitions that are
// over or no longer in the list
async function sync() {
  if (syncing) return syncing;
  syncing = (async () => {
    const C = await list(); const cat = await core.catalog(); const made = [];
    for (const c of C.filter(isLive)) {
      const regs = await db.all("SELECT u.id FROM users u WHERE (u.settings->'comps'->>$1)='true' AND u.status='active' AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.user_id=u.id AND a.comp=$1)", [c.id]);
      for (const r of regs) made.push(await openFor(c, r.id, cat));
    }
    await db.q("UPDATE accounts SET phase='closed', closed_at=now(), breach_reason='Competition ended' WHERE comp IS NOT NULL AND phase IN ('active','review') AND NOT (comp = ANY($1))", [C.filter(isLive).map((c) => c.id)]);
    await announceNew(C).catch((e) => console.error('comps announce', e.message));
    return made;
  })().finally(() => { syncing = null; });
  return syncing;
}
// A new competition is announced once in the dashboard bell to every active trader who left the Competitions switch on
// (Settings, Notifications: settings.nComp). Competitions that already exist the first time this runs are not announced.
async function announceNew(C) {
  const open = C.filter((c) => c && c.id && (c.st === 'upcoming' || isLive(c)));
  const row = await db.one("SELECT v FROM kv WHERE k='comps.announced'"); const seen = row && Array.isArray(row.v) ? row.v : null;
  const fresh = seen ? open.filter((c) => !seen.includes(c.id)) : [];
  if (seen && !fresh.length) return 0;
  await db.q("INSERT INTO kv(k,v) VALUES('comps.announced',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify((seen || []).concat((seen ? fresh : open).map((c) => c.id)).slice(-500))]);
  if ((((await db.one("SELECT v FROM kv WHERE k='settings.flags'")) || {}).v || {}).competitions === false) return 0;
  for (const c of fresh) {
    await db.q(`INSERT INTO notifications(user_id,title,body,go,read) SELECT u.id,$1,$2,'competitions', COALESCE(u.settings->>'nPush','true')='false' FROM users u
      WHERE u.role='trader' AND u.status='active' AND COALESCE(u.settings->>'nComp','true')<>'false'`,
    [(isLive(c) ? 'New competition is live: ' : 'New competition: ') + String(c.n || 'Competition').slice(0, 120), [c.start && c.end ? `${c.start} to ${c.end}` : '', c.prize ? `Prize: ${c.prize}` : '', isLive(c) ? 'Join now for a free competition account.' : 'Register free in Competitions.'].filter(Boolean).join('. ').slice(0, 600)]);
  }
  return fresh.length;
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
// A trader registers: the time is kept (it breaks ties), and if the competition is already running their account opens right away
async function join(compId, userId) {
  const c = (await list()).find((x) => x.id === compId); if (!c) bad('Competition not found', 404);
  if (isOver(c)) bad('This competition has ended.');
  await db.q("UPDATE users SET settings = jsonb_set(jsonb_set(settings, '{comps}', COALESCE(settings->'comps','{}'::jsonb) || jsonb_build_object($2::text, true)), '{compsAt}', jsonb_build_object($2::text, to_jsonb(now())) || COALESCE(settings->'compsAt','{}'::jsonb)) WHERE id=$1", [userId, c.id]);
  return isLive(c) ? openFor(c, userId) : null;
}

const settings = async (q) => Object.assign({ pubLb: true, showCtry: true, hideName: true, kycWin: true }, (await kvGet('store.competitions.settings', q)) || {});

// THE ranking. Every entrant of a competition, in order:
//   1. ranked: traded and still in. Profit, highest first; the same profit shares a rank (1, 2, 2, 4). Inside a tie the trader
//      who got there first (earlier last trade) comes first, then the earlier registration: that order decides prize places.
//   2. unranked: entered but no trades yet (no rank).
//   3. out: broke a rule, disqualified, or the account was closed by staff.
async function board(compId, q) {
  q = q || db;
  // Two indexed lookups instead of one join over every trader: the competition's accounts (accounts_comp), then traders who
  // registered and have no account yet. The same rows as before, but the time no longer grows with the number of traders.
  const rows = await q.all(`SELECT u.id uid, u.first, u.last, u.country, u.kyc_status, u.settings->'compsAt'->>$1 regat, a.id acct, a.balance, a.start_bal, a.peak_eod, a.phase, a.days_traded, a.breach_reason, a.created_at opened,
      (SELECT count(*)::int FROM trades t WHERE t.account_id=a.id) trades, (SELECT max(t.ts) FROM trades t WHERE t.account_id=a.id) last_trade
    FROM accounts a JOIN users u ON u.id=a.user_id WHERE a.comp=$1
    UNION ALL
    SELECT u.id, u.first, u.last, u.country, u.kyc_status, u.settings->'compsAt'->>$1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    FROM users u WHERE (u.settings->'comps'->>$1)='true' AND u.status='active' AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.user_id=u.id AND a.comp=$1)`, [compId]);
  const dq = new Set(((await kvGet('store.competitions.dq', q)) || {})[compId] || []);
  const L = rows.map((r) => { const has = !!r.acct; const start = Number(r.start_bal) || 0, bal = Number(r.balance) || 0, peak = Math.max(Number(r.peak_eod) || 0, start);
    const isDq = dq.has(r.uid); const shut = has && r.phase === 'closed' && r.breach_reason !== 'Competition ended';
    const out = isDq || (has && r.phase === 'breached') || shut; const traded = has && r.trades > 0;
    return { uid: r.uid, acct: r.acct || '', first: r.first || '', last: r.last || '', country: r.country || '', kyc: r.kyc_status, pnl: has ? Math.round((bal - start) * 100) / 100 : 0, pct: has && start ? Math.round((bal - start) / start * 10000) / 100 : 0,
      dd: has && start ? Math.round(Math.max(0, peak - bal) / start * 1000) / 10 : 0, days: r.days_traded || 0, trades: r.trades || 0, lastTrade: r.last_trade ? new Date(r.last_trade).getTime() : 0,
      reg: new Date(r.regat || r.opened || 0).getTime() || 0, dq: isDq, out, state: out ? 'out' : traded ? 'ranked' : 'unranked', why: isDq ? 'Disqualified' : has && r.phase === 'breached' ? 'Broke a rule' : shut ? 'Account closed' : traded ? '' : 'No trades yet', rank: null, pos: null, tied: false, gap: 0, above: null }; });
  const ranked = L.filter((x) => x.state === 'ranked').sort((a, b) => (b.pnl - a.pnl) || (a.lastTrade - b.lastTrade) || (a.reg - b.reg) || (a.uid - b.uid));
  ranked.forEach((x, i) => { x.pos = i + 1; x.rank = i && ranked[i - 1].pnl === x.pnl ? ranked[i - 1].rank : i + 1; });
  // gap: how far behind the next better rank (not the trader they are tied with)
  ranked.forEach((x, i) => { x.tied = (i > 0 && ranked[i - 1].rank === x.rank) || (i + 1 < ranked.length && ranked[i + 1].rank === x.rank); const k = x.rank - 2; if (k >= 0) { x.gap = Math.round((ranked[k].pnl - x.pnl) * 100) / 100; x.above = ranked[k].rank; } });
  const unranked = L.filter((x) => x.state === 'unranked').sort((a, b) => (a.reg - b.reg) || (a.uid - b.uid));
  const out = L.filter((x) => x.state === 'out').sort((a, b) => (b.pnl - a.pnl) || (a.uid - b.uid));
  return { rows: ranked.concat(unranked, out), total: { entrants: L.length, ranked: ranked.length, unranked: unranked.length, out: out.length } };
}
// Kept for older callers: the ordered rows only
async function leaderboard(compId) { return (await board(compId)).rows; }

// Who gets which prize: place N goes to the trader in position N of the ranking, as long as they finished in profit
function pickWinners(c, B) {
  const ranked = B.rows.filter((x) => x.state === 'ranked' && x.pnl > 0);
  return c.prizes.slice(0, ranked.length).map((p, i) => { const x = ranked[i]; return { place: ordinal(i + 1), pos: i + 1, rank: x.rank, prize: prizeLabel(p), type: p.type, size: p.size, amount: p.amount, note: p.note, uid: x.uid, pnl: x.pnl, status: 'Waiting', of: B.total ? B.total.ranked : ranked.length }; }); // of: ranked traders, printed on the winner's certificate (server/certs.js reads these records)
}
const nameOf = (x, set) => `${x.first} ${set.hideName === false ? x.last : (x.last || '').slice(0, 1) + '.'}`.trim();

// One lock per competition, so two people (or a person and the schedule) cannot start or end it at the same moment
const locked = (id, fn) => db.tx(async (t) => { await t.q('SELECT pg_advisory_xact_lock(hashtext($1))', ['comp:' + id]); return fn(t); });
async function saveList(L, t) { await kvPut('content.competitions', L, t); content.reset(); }
const stored = async (t) => { const v = await kvGet('content.competitions', t); const C = await content.all(); return shapeAll(Array.isArray(v) ? v : C.competitions, C); };

async function start(id, actor) {
  const made = await locked(id, async (t) => { const L = await stored(t); const c = L.find((x) => x.id === id); if (!c) bad('Competition not found', 404);
    if (isLive(c)) return false; if (isOver(c)) bad('This competition has already ended.');
    const today = todayET(); c.st = 'live'; if (!c.startAt || c.startAt > today) { c.startAt = today; c.start = dayText(today); } if (!c.endAt || c.endAt < today) { c.endAt = today; c.end = dayText(today); }
    await saveList(L, t);
    // accounts closed when this competition was set back to upcoming (or reopened after it ended) open again with it
    await t.q("UPDATE accounts SET phase='active', closed_at=NULL, breach_reason=NULL WHERE comp=$1 AND phase='closed' AND breach_reason='Competition ended'", [id]); return true; });
  content.reset();
  if (made) { await core.audit(actor || null, 'competition.start', id, { auto: !actor }); await sync(); }
  return { started: made };
}

// End a competition in one step: accounts close, the ranking is taken once, winners are stored, and everyone is told.
async function end(id, actor) {
  const r = await locked(id, async (t) => { const L = await stored(t); const c = L.find((x) => x.id === id); if (!c) bad('Competition not found', 404);
    const W = (await kvGet('store.competitions.winners', t)) || {};
    if (isOver(c) && W[id]) return null;
    await t.q("UPDATE accounts SET phase='closed', closed_at=now(), breach_reason='Competition ended' WHERE comp=$1 AND phase IN ('active','review')", [id]);
    const B = await board(id, t); const winners = pickWinners(c, B); W[id] = winners; await kvPut('store.competitions.winners', W, t);
    const today = todayET(); c.st = 'ended'; if (!c.endAt || c.endAt > today) { c.endAt = today; c.end = dayText(today); } if (c.startAt && c.startAt > c.endAt) { c.startAt = c.endAt; c.start = c.end; }
    await saveList(L, t);
    return { c, B, winners }; });
  content.reset();
  if (!r) return { ended: false, winners: ((await kvGet('store.competitions.winners')) || {})[id] || [] };
  await core.audit(actor || null, 'competition.end', id, { auto: !actor, winners: r.winners.map((w) => [w.place, w.uid, w.prize]) });
  await tellEnd(r.c, r.B, r.winners).catch((e) => console.error('comps tellEnd', e.message));
  return { ended: true, winners: r.winners };
}
// Notification and email to every entrant when it ends, and to each winner about their prize
async function tellEnd(c, B, winners) {
  const mail = require('./mail'); const base = require('./auth').BASE(); const url = base + '/app#competitions'; const set = await settings(); const won = new Map(winners.map((w) => [w.uid, w]));
  const first = B.rows.find((x) => x.pos === 1 && x.pnl > 0); const top = first ? `${nameOf(first, set)} finished first.` : 'Nobody finished in profit, so no prizes were won.';
  const noMail = new Set((await db.all("SELECT id FROM users WHERE id = ANY($1) AND (settings->>'nComp')='false'", [B.rows.map((x) => x.uid)])).map((x) => x.id));
  for (const x of B.rows) { const w = won.get(x.uid);
    const res = x.state === 'ranked' ? `You finished ${ordinal(x.rank)} of ${B.total.ranked}${x.tied ? ' (tied)' : ''}.` : x.state === 'out' ? `Your entry was out of the ranking (${x.why.toLowerCase()}).` : 'You did not place a trade, so you were not ranked.';
    if (w) { const kyc = set.kycWin !== false && x.kyc !== 'verified';
      const next = kyc ? 'Verify your identity in Settings so we can send it.' : 'We will send it shortly. Nothing else is needed from you right now.';
      await core.notify(null, x.uid, `You won ${aPrize(w.prize)} in ${c.n}`, `${res} Your prize for ${w.place} place is ${aPrize(w.prize)}. ${next}`, kyc ? 'settings?tab=identity' : 'competitions');
      mail.t('compwin', x.uid, { competition: c.n, place: w.place, prize: w.prize, won: aPrize(w.prize), result: res, next, url: kyc ? base + '/app#settings?tab=identity' : url });
    } else {
      await core.notify(null, x.uid, `${c.n} has ended`, `${res} ${top}${x.acct ? ` Your competition account ${x.acct} is now closed.` : ''}`, 'competitions');
      if (!noMail.has(x.uid)) mail.t('compend', x.uid, { competition: c.n, result: res, winner: top, url });
    } }
}
// A finished competition put back to upcoming or live from the list: its accounts reopen and the winners are dropped (not once a prize went out)
async function reopen(c, t) {
  const W = (await kvGet('store.competitions.winners', t)) || {};
  if ((W[c.id] || []).some((w) => w.status === 'Sent')) bad(`${c.n} cannot be reopened: a prize has already been sent.`);
  if (W[c.id]) { delete W[c.id]; await kvPut('store.competitions.winners', W, t); }
  if (isLive(c)) await t.q("UPDATE accounts SET phase='active', closed_at=NULL, breach_reason=NULL WHERE comp=$1 AND phase='closed' AND breach_reason='Competition ended'", [c.id]);
}
// Save the whole list (Back Office content editor). Status changes made this way go through the same steps as the buttons.
async function save(value, actor) {
  const next = await validate(value); const prev = await stored(); const P = Object.fromEntries(prev.map((c) => [c.id, c]));
  const ending = next.filter((c) => isOver(c) && P[c.id] && !isOver(P[c.id])).map((c) => c.id);
  const gone = prev.filter((c) => !next.some((x) => x.id === c.id));
  try { await db.tx(async (t) => { for (const c of next) if (!isOver(c) && P[c.id] && isOver(P[c.id])) await reopen(c, t);
    // competitions that are ending stay as they were for a moment: end() below takes the ranking and flips them
    await saveList(next.map((c) => (ending.includes(c.id) ? Object.assign({}, c, { st: P[c.id].st }) : c)), t); }); } finally { content.reset(); }
  for (const c of gone) { const rows = await db.all("UPDATE accounts SET phase='closed', closed_at=now(), breach_reason='Competition ended' WHERE comp=$1 AND phase IN ('active','review') RETURNING user_id", [c.id]);
    for (const r of rows) await core.notify(null, r.user_id, `${c.n} was cancelled`, 'This competition was removed, so your competition account is closed. Nothing changes on your other accounts.', 'competitions'); }
  for (const id of ending) await end(id, actor);
  await sync();
  return next;
}
// New competition from the Back Office form. Ids keep counting up, so a removed competition's id is never used again.
async function create(b, actor) {
  b = b || {}; const L = await list(); const used = new Set(L.map((c) => c.id)); (await db.all('SELECT DISTINCT comp FROM accounts WHERE comp IS NOT NULL')).forEach((r) => used.add(r.comp));
  Object.keys((await kvGet('store.competitions.winners')) || {}).forEach((k) => used.add(k));
  (await db.all("SELECT DISTINCT jsonb_object_keys(settings->'comps') k FROM users WHERE jsonb_typeof(settings->'comps')='object'")).forEach((r) => used.add(r.k));
  let n = Math.max(9, ...[...used].map((x) => { const m = /^C-(\d+)$/.exec(x); return m ? +m[1] : 0; })) + 1; while (used.has('C-' + String(n).padStart(2, '0'))) n++;
  const id = 'C-' + String(n).padStart(2, '0');
  const startAt = dayOf(b.startAt); const endAt = dayOf(b.endAt);
  if (!clean(b.n, 80)) bad('Give it a name.'); if (!startAt) bad('Pick a start date.'); if (!endAt) bad('Pick an end date.');
  if (endAt < startAt) bad('The end date is before the start date.');
  if (endAt < todayET()) bad('The end date is in the past.');
  if (!Array.isArray(b.prizes) || !b.prizes.length) bad('Add at least one prize.');
  const next = await validate([{ id, n: b.n, st: 'upcoming', startAt, endAt, size: b.size, entry: b.entry, prizes: b.prizes, rule: b.rule }].concat(L));
  await saveList(next); await core.audit(actor || null, 'competition.create', id, { n: next[0].n });
  return next[0];
}
// Started and ended on their dates (Eastern Time) by the automations run
async function schedule() {
  const today = todayET(); const out = { started: 0, ended: 0 };
  for (const c of await list()) {
    if (c.st === 'upcoming' && c.startAt && c.startAt <= today && (!c.endAt || c.endAt >= today)) { if ((await start(c.id)).started) out.started++; }
    else if (c.st === 'live' && c.endAt && c.endAt < today) { if ((await end(c.id)).ended) out.ended++; }
  }
  return out;
}

// Disqualify: out of the ranking and the competition account is closed. Undo puts both back.
async function disqualify(id, uid, on, actor) {
  uid = +uid; const r = await locked(id, async (t) => { const L = await stored(t); const c = L.find((x) => x.id === id); if (!c) bad('Competition not found', 404);
    const D = (await kvGet('store.competitions.dq', t)) || {}; const cur = new Set(D[id] || []); if (cur.has(uid) === !!on) return { c, same: true };
    const W = (await kvGet('store.competitions.winners', t)) || {};
    if (isOver(c) && (W[id] || []).some((w) => w.status === 'Sent')) bad('A prize has already been sent for this competition, so its results are final.');
    if (!(await board(id, t)).rows.some((x) => x.uid === uid)) bad('This trader is not in the competition.', 404);
    if (on) cur.add(uid); else cur.delete(uid); D[id] = [...cur]; await kvPut('store.competitions.dq', D, t);
    if (on) await t.q("UPDATE accounts SET phase='closed', closed_at=now(), breach_reason='Disqualified' WHERE comp=$1 AND user_id=$2 AND phase IN ('active','review')", [id, uid]);
    else if (isLive(c)) await t.q("UPDATE accounts SET phase='active', closed_at=NULL, breach_reason=NULL WHERE comp=$1 AND user_id=$2 AND phase='closed' AND breach_reason='Disqualified'", [id, uid]);
    else await t.q("UPDATE accounts SET breach_reason='Competition ended' WHERE comp=$1 AND user_id=$2 AND phase='closed' AND breach_reason='Disqualified'", [id, uid]);
    let fresh = [];
    if (isOver(c) && W[id]) { const before = new Set(W[id].map((w) => w.uid)); W[id] = pickWinners(c, await board(id, t)); await kvPut('store.competitions.winners', W, t); fresh = W[id].filter((w) => !before.has(w.uid)); }
    return { c, fresh }; });
  if (r.same) return { ok: true };
  await core.audit(actor || null, on ? 'competition.disqualify' : 'competition.reinstate', id, { uid });
  if (on) await core.notify(null, uid, `You were removed from ${r.c.n}`, 'Your entry broke the competition rules, so your competition account is closed. Contact support if you think this is a mistake.', 'competitions');
  else await core.notify(null, uid, `You are back in ${r.c.n}`, isLive(r.c) ? 'Your disqualification was reversed. Your competition account is open again and you are back on the leaderboard.' : 'Your disqualification was reversed and your result counts again.', 'competitions');
  for (const w of r.fresh || []) { await core.notify(null, w.uid, `You won ${aPrize(w.prize)} in ${r.c.n}`, `The results were updated and you now hold ${w.place} place. Your prize is ${aPrize(w.prize)}.`, 'competitions'); require('./mail').t('compwin', w.uid, { competition: r.c.n, place: w.place, prize: w.prize, won: aPrize(w.prize), result: `The results were updated and you now hold ${w.place} place.`, next: 'We will be in touch about your prize.', url: require('./auth').BASE() + '/app#competitions' }); }
  return { ok: true };
}

// Send one prize. Funded account: a passed account is created that only needs the funded agreement signed (no evaluation, no fee).
// Free evaluation: a personal 100% code for that size. Credits: added to the balance. Cash: Finance pays it; this records and tells the trader.
async function sendPrize(id, pos, actor) {
  const cat = await core.catalog(); let agreeFor = null;
  const w = await locked(id, async (t) => { const W = (await kvGet('store.competitions.winners', t)) || {}; const ws = W[id] || []; const k = ws.findIndex((x) => x.pos === +pos); if (k < 0) bad('Prize not found', 404);
    const x = ws[k]; if (x.status === 'Sent') bad('This prize was already sent.');
    const u = await t.one('SELECT id, kyc_status, status FROM users WHERE id=$1 FOR UPDATE', [x.uid]); if (!u || u.status !== 'active') bad('This trader\'s account is not active.');
    if ((await settings(t)).kycWin !== false && u.kyc_status !== 'verified') bad('This winner has not passed the identity check yet.');
    const c = (await stored(t)).find((y) => y.id === id) || { n: 'the competition' }; const sent = { status: 'Sent', sent: new Date().toISOString() };
    if (x.type === 'funded') {
      const p = planFor(cat, x.size); if (p.size !== x.size) bad(`There is no ${K(x.size)} account in the catalog to create.`);
      const acct = await core.createAccount(t, { userId: u.id, plan: p.plan, size: p.size, platform: p.platform, addons: [], fees: { price: 0, activation: 0, reset: 0 } });
      await t.q("UPDATE accounts SET phase='passed', steps=$2 WHERE id=$1", [acct, { passed: new Date().toISOString(), prize: id }]);
      await core.notify(t, u.id, `Your ${x.prize} is ready`, `Your prize from ${c.n} is here. Sign the funded agreement on ${acct} and your funded account opens right away. There is no fee.`, 'account?acct=' + acct);
      sent.account = acct; agreeFor = acct;
    } else if (x.type === 'eval') {
      const code = 'FS-WIN-' + require('crypto').randomBytes(3).toString('hex').toUpperCase();
      await t.q("INSERT INTO coupons(code,user_id,pct,label,kind,size) VALUES($1,$2,100,$3,'free_eval',$4)", [code, u.id, `${x.prize} · ${x.place} place, ${c.n}`.slice(0, 80), x.size]);
      await core.notify(t, u.id, `Your ${x.prize} is ready`, `Use code ${code} at checkout on a ${K(x.size)} evaluation and it is free. The code is also in Rewards.`, 'rewards');
      sent.code = code;
    } else if (x.type === 'credits') {
      await core.points(t, u.id, x.amount, `${c.n}: ${x.place} place`, 'earned');
      await core.notify(t, u.id, `${x.prize} added`, `Your prize from ${c.n} is in your credits balance.`, 'rewards');
    } else {
      await core.notify(t, u.id, `Your prize is on its way: ${x.prize}`, `Your prize from ${c.n} has been approved. Our team will contact you by email to arrange payment.`, 'competitions');
    }
    ws[k] = Object.assign({}, x, sent); W[id] = ws; await kvPut('store.competitions.winners', W, t); return ws[k]; });
  if (agreeFor) { const a = await db.one('SELECT * FROM accounts WHERE id=$1', [agreeFor]); if (a) await core.agreementReady(db, a).catch((e) => console.error('comps agreement', e.message)); }
  await core.audit(actor || null, 'competition.prize', id, { place: w.place, uid: w.uid, prize: w.prize, account: w.account, code: w.code });
  return w;
}

// ---- What each screen reads
const placeRows = (c) => c.prizes.map((p, i) => ({ place: ordinal(i + 1), label: prizeLabel(p), type: p.type }));
const pubRow = (x, set, me) => ({ rank: x.rank, pos: x.pos, tied: !!x.tied, name: nameOf(x, set), country: set.showCtry === false ? '' : x.country, pnl: x.pnl, pct: x.pct, dd: x.dd, out: x.state === 'out', state: x.state, why: x.why, me: !!me });
const TOP = 50;
// Trader page: every competition, with the top 50, the trader's own row and true totals for the live and finished ones
async function forTrader(uid) {
  const rows = await db.all("SELECT key, count(*)::int n FROM users, jsonb_each(COALESCE(settings->'comps','{}'::jsonb)) WHERE value = 'true'::jsonb GROUP BY key"); const n = Object.fromEntries(rows.map((r) => [r.key, r.n]));
  const set = await settings(); const W = (await kvGet('store.competitions.winners')) || {}; const out = [];
  for (const c of await list()) { const o = Object.assign({}, c, { players: n[c.id] || 0, prizes: placeRows(c), rules: RULES_TEXT });
    if (isLive(c) || isOver(c)) { const B = await board(c.id); const mine = B.rows.find((x) => x.uid === uid); const top = B.rows.slice(0, TOP);
      o.lb = top.map((x) => pubRow(x, set, x.uid === uid)); if (mine && !top.includes(mine)) o.lb.push(pubRow(mine, set, true));
      o.total = B.total; o.shown = top.length; o.players = Math.max(o.players, B.total.entrants);
      o.me = mine ? { rank: mine.rank, pos: mine.pos, tied: !!mine.tied, gap: mine.gap || 0, above: mine.above, pnl: mine.pnl, pct: mine.pct, dd: mine.dd, out: mine.state === 'out', state: mine.state, why: mine.why, acct: mine.acct, of: B.total.ranked } : null;
      if (isOver(c)) { const by = new Map(B.rows.map((x) => [x.uid, x])); o.winners = (W[c.id] || []).map((w) => ({ place: w.place, prize: w.prize, name: by.has(w.uid) ? nameOf(by.get(w.uid), set) : 'Trader', me: w.uid === uid, sent: w.status === 'Sent' })); const mw = (W[c.id] || []).find((w) => w.uid === uid); if (mw && o.me) o.me.prize = { place: mw.place, prize: mw.prize, sent: mw.status === 'Sent', account: mw.account || '', code: mw.code || '' }; } }
    out.push(o); }
  return out;
}
// Public website page: live and finished competitions, top 50, names and countries as the Leaderboard Settings say
async function forPublic() {
  const set = await settings(); if (set.pubLb === false) return null; const W = (await kvGet('store.competitions.winners')) || {}; const out = [];
  for (const c of await list()) { const o = { id: c.id, n: c.n, st: c.st, start: c.start, end: c.end, size: c.size, prize: c.prize, prizes: placeRows(c), rule: c.rule };
    if (c.st !== 'upcoming') { const B = await board(c.id); o.lb = B.rows.filter((x) => x.state === 'ranked').slice(0, TOP).map((x) => pubRow(x, set, false)); o.total = B.total; if (isOver(c)) { const by = new Map(B.rows.map((x) => [x.uid, x])); o.winners = (W[c.id] || []).map((w) => ({ place: w.place, prize: w.prize, name: by.has(w.uid) ? nameOf(by.get(w.uid), set) : 'Trader' })); } }
    out.push(o); }
  return { comps: out, rules: RULES_TEXT };
}
// Back Office: every competition with its full ranking (all entrants, no cap), winners and settings
async function forAdmin() {
  const W = (await kvGet('store.competitions.winners')) || {}; const out = [];
  const dup = new Set((await db.all("SELECT u.id FROM users u WHERE u.kyc->>'name' IS NOT NULL AND u.kyc->>'dob' IS NOT NULL AND EXISTS (SELECT 1 FROM users y WHERE y.id<>u.id AND y.kyc->>'name' = u.kyc->>'name' AND y.kyc->>'dob' = u.kyc->>'dob')").catch(() => [])).map((r) => r.id));
  for (const c of await list()) { const B = await board(c.id);
    out.push(Object.assign({}, c, { players: B.total.entrants, total: B.total, prizeRows: placeRows(c), winners: W[c.id] || [],
      rows: B.rows.map((x) => ({ uid: x.uid, acct: x.acct, n: `${x.first} ${(x.last || '').slice(0, 1)}.`, ctry: x.country, kyc: x.kyc, rank: x.rank, pos: x.pos, tied: !!x.tied, pnl: x.pnl, pct: x.pct, dd: x.dd, days: x.days, trades: x.trades, state: x.state, why: x.why, dq: x.dq, flag: dup.has(x.uid) ? 'Same identity as another entrant' : '' })) })); }
  return { comps: out, settings: await settings(), rules: RULES_TEXT, today: todayET() };
}

module.exports = { sync, join, joined: join, leaderboard, board, isLive, isOver, sizeOf, planFor, list, validate, save, create, start, end, schedule, disqualify, sendPrize, forTrader, forPublic, forAdmin, settings, prizeLabel, prizeText, dayOf, RULES_TEXT };
