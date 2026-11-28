// Simulated market feed. Generates closed trades for active accounts during market hours,
// runs end-of-day closes, and can fast-forward accounts for testing.
// A real platform connector (Tradovate, Rithmic, ProjectX) would call ingestTrade() instead.
const db = require('./db');
const R = require('./rules');
const core = require('./core');
const { tradeDate, etParts, round2 } = require('./util');

const INSTR = [['MNQ', 2], ['MES', 5], ['NQ', 20], ['ES', 50], ['CL', 1000], ['GC', 100]];
const TAGS = ['Opening Drive', 'VWAP Reclaim', 'Breakout', 'Fade', 'Trend Pullback', 'Range Break', 'News Fade'];
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

// Open Sunday 6:00 PM to Friday 5:00 PM ET with a daily halt from 5:00 to 6:00 PM, minus the holiday calendar (server/calendar.js)
function marketOpen(d = new Date()) {
  const { wd, h, m } = etParts(d);
  if (require('./calendar').holidayShut(d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }), h, m)) return false;
  if (wd === 'Sat') return false;
  if (wd === 'Sun') return h >= 18;
  if (wd === 'Fri') return h < 17;
  return h !== 17;
}

function makeTrade(cat, a, when) {
  const r = R.rulesFor(cat, a); const s = a.sim || {};
  const unit = r.maxLoss * 0.11 * (s.vol || 1);
  let pnl = round2((gauss() + (s.skill || 0) * 1.6) * unit);
  // keep within the daily loss limit mostly, like a disciplined-ish trader
  const ins = INSTR[Math.floor(Math.random() * (Math.random() > 0.35 ? 2 : 6))];
  const qty = Math.max(1, Math.min(r.contracts, 1 + Math.floor(Math.random() * r.contracts)));
  if (Math.abs(pnl) < 5) pnl = pnl < 0 ? -12.5 : 12.5;
  return { ts: when, instrument: ins[0], side: Math.random() > 0.5 ? 'Long' : 'Short', qty, pnl, hold_min: 1 + Math.floor(Math.random() * 45), tag: TAGS[Math.floor(Math.random() * TAGS.length)] };
}

// Apply one trade to an account inside a transaction (the entry point a real connector would use)
async function ingestTrade(c, a, t, day) {
  const cat = await core.catalog();
  // Money held for a payout that is not paid yet still counts as in the account for the max loss floor
  const held = (await c.one('SELECT COALESCE(sum(gross),0)::float n FROM payouts WHERE account_id=$1 AND status = ANY($2)', [a.id, core.OPEN_PAY])).n;
  const { a: na, events } = R.applyTrade(cat, { ...a, held }, t);
  const over = events.find((e) => e.type === 'position');
  const swf = ((await c.one("SELECT v FROM kv WHERE k='store.risk.switches'")) || {}).v || {}; if (swf.freeze && na.phase === 'breached' && a.phase !== 'breached') { na.phase = a.phase; na.breached_at = null; na.breach_reason = null; na.halted_today = true; for (let i = events.length - 1; i >= 0; i--) if (events[i].type === 'breach') events.splice(i, 1); }
  await c.q('INSERT INTO trades(account_id,ts,day,instrument,side,qty,pnl,hold_min,tag,over_limit) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [a.id, t.ts, day, t.instrument, t.side, t.qty, t.pnl, t.hold_min, t.tag, over ? over.limit : null]);
  await c.q('UPDATE accounts SET balance=$2, today_pnl=$3, halted_today=$4, phase=$5, breached_at=$6, breach_reason=$7, floor=$8, peak_eod=$9, scalp_profit=$10, cycle_scalp=$11, last_trade_at=$12 WHERE id=$1', [a.id, na.balance, na.today_pnl, na.halted_today, na.phase, na.breached_at || null, na.breach_reason || null, na.floor, na.peak_eod, na.scalp_profit || 0, na.cycle_scalp || 0, na.last_trade_at || new Date()]);
  for (const e of events) {
    if (e.type === 'breach') { { const wu = await c.one('SELECT tid, email FROM users WHERE id=$1', [a.user_id]); require('./integrations').outHooks('breach', `${a.id} broke a rule`, { account: a.id, kind: a.kind, plan: a.plan, size: a.size, rule: String(e.msg || '').split(/[:.(]/)[0].trim() || 'Account rule', reason: String(e.msg || ''), balance: Number(na.balance), floor: Number(na.floor || a.floor), breachedAt: na.breached_at || new Date().toISOString(), user: wu ? { id: wu.tid, email: wu.email } : null }); }
      require('./mail').t(a.kind === 'funded' ? 'fbreach' : 'breach', a.user_id, { account: a.id, size: core.kLabel(a.size), platform: a.platform, rule: (({ 'Max loss': 'Max Loss', 'Daily loss limit': 'Daily Loss Limit' })[String(e.msg || '').split(/[:.(]/)[0].trim()] || String(e.msg || '').split(/[:.(]/)[0].trim()) || 'Account rule', floor: '$' + Math.round(na.floor || a.floor).toLocaleString('en-US'), balance: '$' + Math.round(na.balance).toLocaleString('en-US'), time: new Date().toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET', url: require('./auth').BASE() + '/app#account?acct=' + a.id }); await core.notify(c, a.user_id, `${a.id} breached`, e.msg + (a.kind === 'funded' ? '. Funded accounts cannot be reset. The account is closed.' : a.comp ? '. The account is closed.' : '. You can reset it from the account page.'), 'account?acct=' + a.id); if (a.kind === 'funded') require('./integrations').alert('breach', `:red_circle: Funded account ${a.id} breached`); }
    if (e.type === 'dll') await core.notify(c, a.user_id, `Daily loss limit reached on ${a.id}`, e.msg, 'account?acct=' + a.id);
    // A trade above the max position size: kept on the trade (trades.over_limit), in the audit log for Risk, and the trader is told once a day
    if (e.type === 'position') { await c.q('INSERT INTO audit(actor_id,action,target,meta) VALUES(NULL,$1,$2,$3)', ['rule.position', a.id, { qty: e.qty, limit: e.limit, day, instrument: t.instrument }]);
      // one notification per account per day: later trades that day update its count instead of adding new ones
      const lim = `${e.limit} ${e.limit === 1 ? 'contract' : 'contracts'}`;
      if (await c.one('INSERT INTO auto_sent(key) VALUES($1) ON CONFLICT DO NOTHING RETURNING key', ['posviol:' + a.id + ':' + day])) await core.notify(c, a.user_id, `Position size rule broken on ${a.id}`, `A trade of ${e.qty} contracts is above your limit of ${lim}. This is a rule violation and is on the account's record. Keep every position at or under the limit.`, 'account?acct=' + a.id);
      else { const n = Number(((await c.one("SELECT count(*)::int n FROM audit WHERE action='rule.position' AND target=$1 AND meta->>'day'=$2", [a.id, day])) || {}).n || 2);
        await c.q("UPDATE notifications SET title=$3, body=$4, read=(SELECT COALESCE(settings->>'nPush','true')='false' FROM users WHERE id=$1), created_at=now() WHERE id=(SELECT id FROM notifications WHERE user_id=$1 AND go=$2 AND title LIKE 'Position size rule broken%' ORDER BY id DESC LIMIT 1)", [a.user_id, 'account?acct=' + a.id, `Position size rule broken ${n} times today on ${a.id}`, `${n} trades today were above your limit of ${lim}. Each one is a rule violation and is on the account's record. Keep every position at or under the limit.`]); } }
  }
  // Early warnings, at most once per account per day: 80% of the daily loss limit, and within 20% of the drawdown floor
  if (!['breached', 'closed'].includes(na.phase)) {
    const r = R.rulesFor(cat, a); const M = require('./mail'); const m = (v) => '$' + Math.round(Math.abs(v)).toLocaleString('en-US'); const url = require('./auth').BASE() + '/app#account?acct=' + a.id;
    const once = async (k) => !!(await c.one('INSERT INTO auto_sent(key) VALUES($1) ON CONFLICT DO NOTHING RETURNING key', [k]));
    const lost = -Number(na.today_pnl); if (r.dll && !na.halted_today && lost >= 0.8 * r.dll && lost < r.dll && await once('dailywarn:' + a.id + ':' + day)) {
      M.t('dailywarn', a.user_id, { account: a.id, lost: m(lost), limit: m(r.dll), left: m(r.dll - lost), url });
      await core.notify(c, a.user_id, `${a.id} is at ${Math.round(lost / r.dll * 100)}% of today's loss limit`, `Another ${m(r.dll - lost)} loss ${r.dllMode === 'breach' ? 'fails the account.' : 'pauses trading until the day resets at 6:00 PM ET.'}`, 'account?acct=' + a.id); }
    const room = Number(na.balance) + held - Number(a.floor); if (r.maxLoss && room > 0 && room <= 0.2 * r.maxLoss && await once('ddwarn:' + a.id + ':' + day)) {
      M.t('ddwarn', a.user_id, { account: a.id, left: m(room), floor: m(a.floor), balance: m(na.balance), url }); }
  }
  return na;
}

async function closeAccountDay(c, a, dayIso) {
  const cat = await core.catalog();
  const n = (await c.one('SELECT count(*)::int n FROM trades WHERE account_id=$1 AND day=$2', [a.id, dayIso])).n;
  const held = (await c.one('SELECT COALESCE(sum(gross),0)::float n FROM payouts WHERE account_id=$1 AND status = ANY($2)', [a.id, core.OPEN_PAY])).n;
  const { a: na, day, events } = R.closeDay(cat, { ...a, held }, dayIso, n);
  if (n > 0) await c.q(`INSERT INTO days(account_id,day,pnl,n_trades,eod_balance,floor,closed) VALUES($1,$2,$3,$4,$5,$6,true)
    ON CONFLICT (account_id,day) DO UPDATE SET pnl=$3,n_trades=$4,eod_balance=$5,floor=$6,closed=true`, [a.id, dayIso, day.pnl, n, day.eod_balance, day.floor]);
  await c.q(`UPDATE accounts SET days_traded=$2,best_day=$3,peak_eod=$4,floor=$5,cycle_win_days=$6,cycle_best=$7,phase=$8,passed_at=$9,steps=$10,today_pnl=0,halted_today=false WHERE id=$1`,
    [a.id, na.days_traded, na.best_day, na.peak_eod, na.floor, na.cycle_win_days || 0, na.cycle_best || 0, na.phase, na.passed_at || null, JSON.stringify(na.steps || {})]);
  for (const e of events) if (e.type === 'pass') {
    const fee = core.feesOf(cat, a).activation;
    await core.notify(c, a.user_id, `You passed ${a.id}!`, fee ? `Sign the funded agreement and pay the $${fee} activation fee to get your funded account.` : 'Sign the funded agreement to get your funded account.', 'account?acct=' + a.id);
    await core.points(c, a.user_id, 500, 'Passed ' + a.id);
    require('./mail').t('passed', a.user_id, { account: a.id, size: core.kLabel(a.size), platform: a.platform, ...require('./fills').passVars(fee), url: require('./auth').BASE() + '/app#account?acct=' + a.id });
    await core.agreementReady(c, a); // the agreement can be signed right after passing; identity is checked before the first payout
    { const wu = await c.one('SELECT tid, email FROM users WHERE id=$1', [a.user_id]); require('./integrations').alert('pass', `:tada: ${a.id} passed the evaluation`, { account: a.id, plan: a.plan, size: a.size, platform: a.platform, balance: Number(na.balance != null ? na.balance : a.balance), daysTraded: na.days_traded, passedAt: na.passed_at || new Date().toISOString(), user: wu ? { id: wu.tid, email: wu.email } : null }); }
  }
  return { ...na, today_pnl: 0, halted_today: false };
}

// Close any account whose trading date has rolled over
async function rollover() {
  const today = tradeDate();
  const rows = await db.all("SELECT id FROM accounts WHERE today_date IS NOT NULL AND today_date < $1", [today]);
  for (const { id } of rows) {
    await db.tx(async (c) => {
      const a = await c.one('SELECT * FROM accounts WHERE id=$1 FOR UPDATE', [id]);
      if (!a || a.today_date >= today) return;
      if (a.phase === 'active' || a.today_pnl != 0) await closeAccountDay(c, a, a.today_date);
      await c.q('UPDATE accounts SET today_date=$2, today_pnl=0, halted_today=false WHERE id=$1', [id, today]);
    });
  }
}

// One live tick: each active account may take a trade
async function tick() {
  await rollover();
  if (!marketOpen()) return 0;
  const sw = ((await db.one("SELECT v FROM kv WHERE k='store.risk.switches'")) || {}).v || {}; if (sw.trading) return 0;
  const { h } = etParts();
  const busy = h >= 9 && h < 16 ? 1 : 0.25; // most trades in the US session
  const cat = await core.catalog();
  const rows = await db.all("SELECT id FROM accounts WHERE phase='active' AND halted_today=false AND (sim->>'paused') IS NULL");
  let n = 0; const day = tradeDate();
  for (const { id } of rows) {
    // ~4 trades per active day spread over ~7 busy hours, checked every minute
    if (Math.random() > 0.0095 * busy) continue;
    await db.tx(async (c) => {
      const a = await c.one("SELECT * FROM accounts WHERE id=$1 AND phase='active' AND halted_today=false FOR UPDATE", [id]);
      if (!a) return;
      if (Math.random() > (a.sim.activity || 0.8)) return;
      await ingestTrade(c, a, makeTrade(cat, a, new Date()), day); n++;
    });
  }
  return n;
}

// Testing tool: simulate N complete past trading days for an account, then re-date history so it ends yesterday.
async function fastForward(accountId, nDays) {
  nDays = Math.max(1, Math.min(30, nDays | 0));
  const cat = await core.catalog();
  return db.tx(async (c) => {
    let a = await c.one('SELECT * FROM accounts WHERE id=$1 FOR UPDATE', [accountId]);
    if (!a) throw new Error('not found');
    const today = tradeDate();
    // virtual dates far in the past, re-dated afterwards
    const last = await c.one('SELECT max(day) d FROM days WHERE account_id=$1', [a.id]);
    let d = new Date(((last && last.d && last.d > today) ? last.d : today) + 'T12:00:00Z');
    let done = 0;
    for (let i = 0; i < nDays && a.phase === 'active'; i++) {
      do d = new Date(d.getTime() + 86400000); while ([0, 6].includes(d.getUTCDay()));
      const iso = d.toISOString().slice(0, 10);
      a = { ...a, today_pnl: 0, halted_today: false };
      if (Math.random() < (a.sim.activity || 0.8)) {
        const nt = 2 + Math.floor(Math.random() * 4);
        for (let k = 0; k < nt && a.phase === 'active' && !a.halted_today; k++) {
          const ts = new Date(iso + 'T' + String(14 + k).padStart(2, '0') + ':' + String(Math.floor(Math.random() * 60)).padStart(2, '0') + ':00Z');
          a = await ingestTrade(c, a, makeTrade(cat, a, ts), iso);
        }
      }
      a = await closeAccountDay(c, a, iso); done++;
      a = await c.one('SELECT * FROM accounts WHERE id=$1', [a.id]);
    }
    await redate(c, a.id, today);
    return { days: done, phase: a.phase };
  });
}

// Shift an account's closed days so the latest closed day is the trading day before `today`
async function redate(c, accountId, today) {
  const ds = (await c.all('SELECT day FROM days WHERE account_id=$1 ORDER BY day', [accountId])).map((r) => r.day);
  const all = ds.filter((x) => x !== today).sort();
  if (!all.length) return;
  const target = []; let d = new Date(today + 'T12:00:00Z');
  for (let i = 0; i < all.length; i++) { do d = new Date(d.getTime() - 86400000); while ([0, 6].includes(d.getUTCDay())); target.unshift(d.toISOString().slice(0, 10)); }
  // two passes through a temporary offset to avoid primary key collisions
  for (let i = 0; i < all.length; i++) {
    await c.q("UPDATE days SET day = $2::date + 400000 WHERE account_id=$1 AND day=$2", [accountId, all[i]]);
    await c.q("UPDATE trades SET day = $2::date + 400000 WHERE account_id=$1 AND day=$2", [accountId, all[i]]);
  }
  for (let i = 0; i < all.length; i++) {
    const tmp = (await c.one("SELECT ($1::date + 400000)::text d", [all[i]])).d;
    await c.q('UPDATE days SET day=$3 WHERE account_id=$1 AND day=$2', [accountId, tmp, target[i]]);
    await c.q("UPDATE trades SET day=$3, ts = ($3::date + (ts AT TIME ZONE 'UTC')::time) AT TIME ZONE 'UTC' WHERE account_id=$1 AND day=$2", [accountId, tmp, target[i]]);
  }
  const first = target[0];
  await c.q("UPDATE accounts SET created_at = LEAST(created_at, ($2::date - 1)::timestamptz), today_date=$3 WHERE id=$1", [accountId, first, today]);
}

let timer = null;
function start() {
  if (timer || process.env.SIM_FEED === 'off') return;
  const run = () => tick().then((n) => db.q('INSERT INTO jobs_log(job,ok,detail) VALUES($1,true,$2)', ['feed.tick', n + ' trades'])).catch((e) => { console.error('sim tick', e.message); db.q('INSERT INTO jobs_log(job,ok,detail) VALUES($1,false,$2)', ['feed.tick', e.message]).catch(() => {}); });
  timer = setInterval(run, 60000);
  // Daily service status for the System Health uptime bars (worst status seen each day)
  const healthDay = async () => { try { const I = require('./integrations'); const list = await I.list(); const d = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); const row = await db.one("SELECT v FROM kv WHERE k='store.health.days'"); const v = (row && row.v) || {};
    const lastTick = await db.one("SELECT created_at, ok FROM jobs_log WHERE job='feed.tick' ORDER BY id DESC LIMIT 1"); const day = v[d] = v[d] || {}; const worse = (k, st) => { const o = { ok: 0, w: 1, d: 2 }; if (day[k] === undefined || o[st] > o[day[k]]) day[k] = st; };
    ['Website and Checkout', 'Trader Dashboard', 'Back Office', 'Public API'].forEach((k) => worse(k, 'ok')); // the feed only ticks while the market is open, so a quiet feed when it is closed is normal
    worse('Simulated Trade Feed', !marketOpen() || (lastTick && lastTick.ok && Date.now() - new Date(lastTick.created_at) < 5 * 60000) ? 'ok' : 'w');
    list.filter((x) => x.enabled).forEach((x) => worse(x.name, x.status === 'live' ? 'ok' : x.lastError ? 'w' : 'ok'));
    Object.keys(v).sort().slice(0, -90).forEach((k) => delete v[k]); await db.q("INSERT INTO kv(k,v) VALUES('store.health.days',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(v)]); } catch (e) { console.error('health day', e.message); } };
  setInterval(healthDay, 5 * 60000); setTimeout(healthDay, 15000);
  // Payout liability snapshot once a day (what funded traders could ask for right now), for Analytics
  const liabDay = async () => { try { const d = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); const row = await db.one("SELECT v FROM kv WHERE k='store.analytics.liab'"); const L = (row && row.v) || []; if (L.length && L[L.length - 1].d === d) return;
    const cat = await core.catalog(); const R = require('./rules'); const acc = await db.all("SELECT * FROM accounts WHERE kind='funded' AND phase NOT IN ('breached','closed')"); let v = 0; for (const a of acc) { try { const q = R.payoutQuote ? R.payoutQuote(cat, a) : null; v += q ? q.max : Math.max(0, (Number(a.balance) - Number(a.start_bal)) * 0.9); } catch (e) { /* skip */ } }
    L.push({ d, v: Math.round(v), n: acc.length }); await db.q("INSERT INTO kv(k,v) VALUES('store.analytics.liab',$1) ON CONFLICT (k) DO UPDATE SET v=$1", [JSON.stringify(L.slice(-400))]); } catch (e) { console.error('liab', e.message); } };
  setInterval(liabDay, 60 * 60000); setTimeout(liabDay, 20000);
  setInterval(() => db.q("DELETE FROM jobs_log WHERE created_at < now() - interval '3 days'").catch(() => {}), 3600000);
  setTimeout(() => tick().catch((e) => console.error('sim tick', e.message)), 3000);
}
module.exports = { start, tick, rollover, fastForward, ingestTrade, closeAccountDay, marketOpen, makeTrade };
