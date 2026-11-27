const fs = require('fs'); const path = require('path');
const db = require('./db');
const { DEFAULT_CATALOG } = require('./catalog');
async function migrate() {
  await db.q(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  const c = await db.one('SELECT id FROM catalog WHERE id=1');
  if (!c) await db.q('INSERT INTO catalog(id,data) VALUES(1,$1)', [DEFAULT_CATALOG]);
  const seed = require('./seed');
  await seed.run();
  await require('./mig_e').run(); // stored copy that still has old wording (Nov 27 decisions: test card label, news casing, refund days, paired approval switches)
  // Tickets saved without a first message (possible before the ticket and message were saved together) get a placeholder
  { const n = await require('./support').fixEmptyTickets(); if (n) console.log(`Support: added a placeholder message to ${n} ticket${n === 1 ? '' : 's'} that had none`); }
  // One-time: every plan counts toward free packs at checkout (Instant was left out at first)
  if (!(await db.one("SELECT 1 FROM kv WHERE k='mig.packs.instant'"))) {
    await db.q("UPDATE kv SET v = jsonb_set(v, '{ladder,plans,instant}', 'true'::jsonb, true) WHERE k='packs.config' AND v ? 'ladder'");
    await db.q("INSERT INTO kv(k,v) VALUES('mig.packs.instant','true'::jsonb) ON CONFLICT (k) DO NOTHING");
  }
  // One-time: free-account card names read "Free $25K Essential" (was "Free 25K Essential"), in the settings and in what traders hold
  await require('./packs').migrateDollarNames();
  // One-time: order names read size, plan, then what was bought ("$25K Essential · Reset"), on orders saved before too
  await require('./trader').migrateOrderNames();
  // Lesson text for the built-in courses, for sites that saved their own copy of the lessons before it existed
  await require('./content').migrateLessons();
  // One-time: remember which courses each trader was already paid for, so the 100 credits can never be paid twice.
  // Paid before = finished every lesson of the course as it is now, or has a "Finished <course>" row in the credits history.
  if (!(await db.one("SELECT 1 FROM kv WHERE k='mig.courses.paid'"))) {
    const C = await require('./content').all(); const seen = new Map();
    [...(C.courses || []), ...require('./content').seed.courses].forEach((c) => { if (c && c.id && !seen.has(c.id + '|' + c.n)) seen.set(c.id + '|' + c.n, c); });
    for (const c of seen.values()) {
      await db.q(`UPDATE users u SET settings = jsonb_set(COALESCE(u.settings,'{}'::jsonb), '{coursesPaid}', COALESCE(u.settings->'coursesPaid','{}'::jsonb) || jsonb_build_object($1::text, true))
        WHERE ($2::int > 0 AND (u.settings->'courses'->>$1) ~ '^[0-9]+$' AND (u.settings->'courses'->>$1)::int >= $2::int) OR EXISTS (SELECT 1 FROM points_log p WHERE p.user_id=u.id AND p.delta > 0 AND p.label = $3)`, [c.id, parseInt(c.l, 10) || 0, 'Finished ' + c.n]);
    }
    await db.q("INSERT INTO kv(k,v) VALUES('mig.courses.paid','true'::jsonb) ON CONFLICT (k) DO NOTHING");
  }
  // One-time: help articles that quoted old numbers (Instant split 80/90, reset 55%, evaluation-only limits, news rule for everyone).
  // A stored copy is replaced only where it still has the old built-in text, so anything staff rewrote is left alone.
  if (!(await db.one("SELECT 1 FROM kv WHERE k='mig.articles.rules2'"))) {
    const row = await db.one("SELECT v FROM kv WHERE k='content.articles'"); const NEW = require('./content-seed.json').articles;
    const OLD = {"How the Max Drawdown Works": "Every account has a max loss floor. On evaluations it trails your highest end-of-day balance by the max loss for your size ($1,000 on 25K, $2,000 on 50K, $3,000 on 100K, $4,500 on 150K). It only moves at the end of the trading day, never down. On funded accounts it stops $100 above your starting balance. If your balance touches the floor at any time, the account is breached.", "The Daily Loss Limit": "If you lose more than your daily loss limit in one trading day ($500 on 25K, $1,000 on 50K, $2,000 on 100K, $3,000 on 150K), trading pauses until the next session opens at 6:00 PM ET. The account is not closed. The trading day runs from 6:00 PM to 5:00 PM ET.", "Trading Around High-Impact News": "You cannot open new orders from 2 minutes before to 2 minutes after a high-impact event on the news calendar. Positions you already hold can stay open. The calendar is on the Resources page.", "How and When You Get Paid": "Funded accounts can request a payout after 5 winning days of $100 or more in the cycle, with at least $250 available. You keep 90% (Instant: 80% for the first 3 payouts, then 90%). Each payout has a cap by size, and there is a lifetime cap per account. Requests are reviewed in 1 to 2 business days, then sent by Rise or USDC.", "Resets: What Happens to Your Account": "A reset puts your evaluation back to its starting balance with the same rules. Your trading days, best day and history start over. A reset costs 55% of the plan price. If you bought the Free Reset add-on, your first reset is free."};
    if (row && Array.isArray(row.v)) { const list = row.v.map((a) => { const n = Array.isArray(a) && OLD[a[1]] === a[2] && NEW.find((x) => x[1] === a[1]); return n ? [a[0], a[1], n[2]].concat(a.slice(3)) : a; });
      const add = NEW.find((x) => x[1] === 'Scalping, Holding Positions and Inactivity'); if (add && !list.some((a) => Array.isArray(a) && a[1] === add[1])) { const at = list.reduce((m, a, i) => (Array.isArray(a) && a[0] === 'Rules' ? i : m), -1); list.splice(at + 1, 0, add); }
      await db.q("UPDATE kv SET v=$1, updated_at=now() WHERE k='content.articles'", [JSON.stringify(list)]); }
    // The same for the built-in lesson texts that said Instant starts at a lower split, or that the news rule applies to every account
    const lrow = await db.one("SELECT v FROM kv WHERE k='content.lessons'"); const SL = require('./content-seed.json').lessons; const sha = (x) => require('crypto').createHash('sha1').update(String(x)).digest('hex');
    const OLDL = {'c3.1': '8fde05fe217862b3ecbf86f553c8c9f529d6cfe6', 'c5.2': 'a823f655d3184284df792d250ebe43854709fb31', 'c6.0': 'ef68fd30f06abd9361e255d021099747a5f3d205', 'c6.1': 'bde5aa0f67bdfdc2119d9578735b41573bd006f9', 'c6.2': '3b8866a7942ec2504194f07ac7d1f7f9cdae9f51'}; // sha1 of each old built-in text, by course and lesson number
    if (lrow && lrow.v && typeof lrow.v === 'object') { let n = 0; for (const [k, h] of Object.entries(OLDL)) { const [c, i] = k.split('.'); const cur = (lrow.v[c] || [])[+i]; const nw = (SL[c] || [])[+i]; if (cur && nw && typeof cur === 'object' && sha(cur.x) === h) { cur.x = nw.x; n++; } }
      if (n) await db.q("UPDATE kv SET v=$1, updated_at=now() WHERE k='content.lessons'", [JSON.stringify(lrow.v)]); }
    await db.q("INSERT INTO kv(k,v) VALUES('mig.articles.rules2','true'::jsonb) ON CONFLICT (k) DO NOTHING");
  }
  // One-time: certificate IDs became unique. Revoked certificates and view counts move from the old short numbers to the new IDs
  // (an old number shared by two certificates keeps both revoked, as it did before).
  if (!(await db.one("SELECT 1 FROM kv WHERE k='mig.certs.ids'"))) {
    const tr = require('./trader'); const map = {}; const put = (seed) => { (map[tr.certIdOld(seed)] = map[tr.certIdOld(seed)] || []).push(tr.certId(seed)); };
    (await db.all("SELECT code FROM payouts WHERE status='paid'")).forEach((p) => put('o' + p.code));
    (await db.all('SELECT id, kind, funded_at, passed_at FROM accounts WHERE funded_at IS NOT NULL OR passed_at IS NOT NULL')).forEach((a) => { if (a.kind === 'funded' && a.funded_at) put('f' + a.id); if (a.passed_at) put('p' + a.id); });
    const rev = ((await db.one("SELECT v FROM kv WHERE k='store.rewards.revoked'")) || {}).v;
    if (Array.isArray(rev) && rev.length) await db.q("UPDATE kv SET v=$1 WHERE k='store.rewards.revoked'", [JSON.stringify([...new Set(rev.flatMap((x) => map[x] || [x]))])]);
    const views = ((await db.one("SELECT v FROM kv WHERE k='certviews'")) || {}).v;
    if (views && typeof views === 'object') { const nv = {}; Object.entries(views).forEach(([k, n]) => { const to = map[k] && map[k].length === 1 ? map[k][0] : k; nv[to] = (nv[to] || 0) + Number(n || 0); }); await db.q("UPDATE kv SET v=$1 WHERE k='certviews'", [JSON.stringify(nv)]); }
    await db.q("INSERT INTO kv(k,v) VALUES('mig.certs.ids','true'::jsonb) ON CONFLICT (k) DO NOTHING");
  }
}
module.exports = { migrate };
if (require.main === module) migrate().then(() => { console.log('migrated'); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
